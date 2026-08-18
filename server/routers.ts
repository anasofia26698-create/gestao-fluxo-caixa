import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAuditEvent, createSharedPurchaseConfirmations, createUploadedFile, listRecentAuditEvents, listSharedCashFlowEntries, listUploadedFiles, replaceSharedImportedEntries } from "./db";
import { storagePut } from "./storage";

const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/octet-stream",
]);

function requestAuditMetadata(
  ctx: { req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string | undefined } }; user: { id: number; name: string | null; email: string | null } | null },
  eventType: "access" | "import" | "confirmation",
  route: string,
  entryCount = 0,
  declaredName?: string,
) {
  const forwarded = ctx.req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ipAddress = forwardedValue?.split(",")[0]?.trim() || ctx.req.socket?.remoteAddress || null;
  const agent = ctx.req.headers["user-agent"];
  return {
    eventType,
    route,
    entryCount,
    userId: ctx.user?.id ?? null,
    userName: ctx.user?.name || declaredName?.trim() || null,
    userEmail: ctx.user?.email ?? null,
    ipAddress: ipAddress?.slice(0, 64) || null,
    userAgent: (Array.isArray(agent) ? agent[0] : agent)?.slice(0, 1024) || null,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  files: router({
    list: protectedProcedure.query(({ ctx }) => listUploadedFiles(ctx.user.id)),
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(255),
        byteSize: z.number().int().positive().max(10_000_000),
        base64: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!allowedMimeTypes.has(input.mimeType)) {
          throw new Error("Tipo de arquivo não permitido. Use XLSX ou CSV.");
        }
        const bytes = Buffer.from(input.base64, "base64");
        if (bytes.length !== input.byteSize) {
          throw new Error("O tamanho do arquivo não confere.");
        }
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const stored = await storagePut(`cash-flow/${ctx.user.id}/${safeName}`, bytes, input.mimeType);
        return createUploadedFile({
          ownerId: ctx.user.id,
          fileKey: stored.key,
          fileUrl: stored.url,
          originalName: input.fileName,
          mimeType: input.mimeType,
          byteSize: bytes.length,
        });
      }),
  }),
  cashFlow: router({
    list: publicProcedure.query(() => listSharedCashFlowEntries()),
    recordAccess: publicProcedure.mutation(({ ctx }) => createAuditEvent(requestAuditMetadata(ctx, "access", "/"))),
    replaceImport: publicProcedure
      .input(z.object({
        entries: z.array(z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          debitCents: z.number().int().positive().max(1_000_000_000),
        })).min(1).max(50_000),
        actorName: z.string().trim().min(2).max(120).optional(),
      }))
      .mutation(({ ctx, input }) => replaceSharedImportedEntries(input.entries, requestAuditMetadata(ctx, "import", "/importar-planilha", input.entries.length, input.actorName))),
    confirmPurchases: publicProcedure
      .input(z.object({
        entries: z.array(z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          debitCents: z.number().int().positive().max(1_000_000_000),
        })).min(1).max(12),
        actorName: z.string().trim().min(2).max(120).optional(),
      }))
      .mutation(({ ctx, input }) => createSharedPurchaseConfirmations(input.entries, requestAuditMetadata(ctx, "confirmation", "/fluxo-de-caixa", input.entries.length, input.actorName))),
  }),
  audit: router({
    recent: publicProcedure.input(z.object({ password: z.literal("2606"), limit: z.number().int().min(1).max(200).default(100) })).query(({ input }) => listRecentAuditEvents(input.limit)),
  }),
});

export type AppRouter = typeof appRouter;
