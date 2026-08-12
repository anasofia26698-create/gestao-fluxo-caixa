import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { storagePut } from "./storage";
import { createUploadedFile, listUploadedFiles } from "./db";

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

vi.mock("./db", () => ({
  createUploadedFile: vi.fn(),
  listUploadedFiles: vi.fn(),
}));

function createAuthContext(userId = 42): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
}

describe("files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsupported file types before storage", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.files.upload({
        fileName: "malware.exe",
        mimeType: "application/x-msdownload",
        byteSize: 3,
        base64: "YWJj",
      }),
    ).rejects.toThrow("Tipo de arquivo não permitido");
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("uploads the bytes and persists file metadata for the authenticated user", async () => {
    vi.mocked(storagePut).mockResolvedValue({
      key: "cash-flow/42/fluxo.xlsx",
      url: "/manus-storage/cash-flow/42/fluxo.xlsx",
    });
    vi.mocked(createUploadedFile).mockResolvedValue({
      id: 7,
      ownerId: 42,
      fileKey: "cash-flow/42/fluxo.xlsx",
      fileUrl: "/manus-storage/cash-flow/42/fluxo.xlsx",
      originalName: "fluxo.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      byteSize: 3,
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createAuthContext(42));
    const result = await caller.files.upload({
      fileName: "fluxo.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      byteSize: 3,
      base64: "YWJj",
    });

    expect(storagePut).toHaveBeenCalledWith(
      "cash-flow/42/fluxo.xlsx",
      expect.any(Buffer),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(createUploadedFile).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 42,
      fileKey: "cash-flow/42/fluxo.xlsx",
      originalName: "fluxo.xlsx",
      byteSize: 3,
    }));
    expect(result?.id).toBe(7);
  });

  it("lists only the authenticated user's files", async () => {
    const rows = [{
      id: 9,
      ownerId: 42,
      fileKey: "cash-flow/42/a.csv",
      fileUrl: "/manus-storage/cash-flow/42/a.csv",
      originalName: "a.csv",
      mimeType: "text/csv",
      byteSize: 10,
      createdAt: new Date(),
    }];
    vi.mocked(listUploadedFiles).mockResolvedValue(rows);

    const caller = appRouter.createCaller(createAuthContext(42));
    const result = await caller.files.list();

    expect(listUploadedFiles).toHaveBeenCalledWith(42);
    expect(result).toEqual(rows);
  });
});
