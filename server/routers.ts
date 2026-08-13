import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createSharedPurchaseConfirmations, createUploadedFile, listSharedCashFlowEntries, listUploadedFiles, replaceSharedImportedEntries } from "./db";
import { storagePut } from "./storage";

const allowedMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "application/octet-stream",
]);

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
    replaceImport: publicProcedure
      .input(z.object({
        entries: z.array(z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          debitCents: z.number().int().positive().max(1_000_000_000),
        })).min(1).max(50_000),
      }))
      .mutation(({ input }) => replaceSharedImportedEntries(input.entries)),
    confirmPurchases: publicProcedure
      .input(z.object({
        entries: z.array(z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          debitCents: z.number().int().positive().max(1_000_000_000),
        })).min(1).max(12),
      }))
      .mutation(({ input }) => createSharedPurchaseConfirmations(input.entries)),
  }),
});

export type AppRouter = typeof appRouter;
