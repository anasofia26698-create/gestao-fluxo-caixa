import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createSharedPurchaseConfirmations, listSharedCashFlowEntries, replaceSharedImportedEntries } from "./db";

vi.mock("./db", () => ({
  createSharedPurchaseConfirmations: vi.fn(),
  createUploadedFile: vi.fn(),
  listSharedCashFlowEntries: vi.fn(),
  listUploadedFiles: vi.fn(),
  replaceSharedImportedEntries: vi.fn(),
}));

describe("cashFlow shared synchronization", () => {
  const ctx = {} as TrpcContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the same centralized entries for any session", async () => {
    const rows = [{ id: 1, date: "2026-08-13", debitCents: 5000000, source: "imported", createdAt: new Date() }];
    vi.mocked(listSharedCashFlowEntries).mockResolvedValue(rows);

    const caller = appRouter.createCaller(ctx);
    await expect(caller.cashFlow.list()).resolves.toEqual(rows);
    expect(listSharedCashFlowEntries).toHaveBeenCalledOnce();
  });

  it("replaces imported entries in the shared flow", async () => {
    vi.mocked(replaceSharedImportedEntries).mockResolvedValue([]);
    const caller = appRouter.createCaller(ctx);

    await caller.cashFlow.replaceImport({ entries: [{ date: "2026-08-14", debitCents: 7620000 }] });

    expect(replaceSharedImportedEntries).toHaveBeenCalledWith([{ date: "2026-08-14", debitCents: 7620000 }]);
  });

  it("records purchase confirmations centrally for other machines to read", async () => {
    vi.mocked(createSharedPurchaseConfirmations).mockResolvedValue([]);
    const caller = appRouter.createCaller(ctx);

    await caller.cashFlow.confirmPurchases({ entries: [{ date: "2026-08-15", debitCents: 1600000 }] });

    expect(createSharedPurchaseConfirmations).toHaveBeenCalledWith([{ date: "2026-08-15", debitCents: 1600000 }]);
  });
});
