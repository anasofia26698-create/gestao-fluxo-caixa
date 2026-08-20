import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createAuditEvent, createSharedPurchaseConfirmations, getRecentImportComparison, listRecentAuditEvents, listSharedCashFlowEntries, replaceSharedImportedEntries } from "./db";

vi.mock("./db", () => ({
  createAuditEvent: vi.fn(),
  createSharedPurchaseConfirmations: vi.fn(),
  createUploadedFile: vi.fn(),
  getRecentImportComparison: vi.fn(),
  listSharedCashFlowEntries: vi.fn(),
  listRecentAuditEvents: vi.fn(),
  listUploadedFiles: vi.fn(),
  replaceSharedImportedEntries: vi.fn(),
}));

describe("cashFlow shared synchronization", () => {
  const ctx = { user: null, req: { headers: {}, socket: {} } } as TrpcContext;

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

    expect(replaceSharedImportedEntries).toHaveBeenCalledWith([{ date: "2026-08-14", debitCents: 7620000 }], expect.objectContaining({
      eventType: "import",
      entryCount: 1,
      route: "/importar-planilha",
    }), undefined);
  });

  it("keeps a historical snapshot and mapped columns for each new import", async () => {
    vi.mocked(replaceSharedImportedEntries).mockResolvedValue([]);
    const caller = appRouter.createCaller(ctx);
    const importMeta = { fileName: "fluxo.xlsx", mappedColumns: { operationDate: "Data de Operação", credit: "Crédito", debit: "Débito", balance: "Saldo" }, periodStart: "2026-08-01", periodEnd: "2026-08-31", totalDebitCents: 7620000 };

    await caller.cashFlow.replaceImport({ entries: [{ date: "2026-08-14", debitCents: 7620000 }], importMeta });

    expect(replaceSharedImportedEntries).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ details: expect.stringContaining("fluxo.xlsx") }), expect.objectContaining({ fileName: "fluxo.xlsx", totalDebitCents: 7620000 }));
  });

  it("records purchase confirmations centrally for other machines to read", async () => {
    vi.mocked(createSharedPurchaseConfirmations).mockResolvedValue([]);
    const caller = appRouter.createCaller(ctx);

    await caller.cashFlow.confirmPurchases({ entries: [{ date: "2026-08-15", debitCents: 1600000, termDays: 30 }], actorName: "Comprador teste" });

    expect(createSharedPurchaseConfirmations).toHaveBeenCalledWith([{ date: "2026-08-15", debitCents: 1600000, termDays: 30 }], expect.objectContaining({
      eventType: "confirmation",
      userName: "Comprador teste",
      entryCount: 1,
      details: expect.stringContaining('"totalCents":1600000'),
    }));
  });

  it("records a public access event with request metadata", async () => {
    vi.mocked(createAuditEvent).mockResolvedValue({ id: 1 } as never);
    const caller = appRouter.createCaller(ctx);

    await caller.cashFlow.recordAccess();

    expect(createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "access", route: "/" }));
  });

  it("records each simulation with results, dates, terms and limits", async () => {
    vi.mocked(createAuditEvent).mockResolvedValue({ id: 2 } as never);
    const caller = appRouter.createCaller(ctx);

    await caller.cashFlow.recordSimulation({ referenceDate: "2026-08-18", purchaseCents: 4800000, scenarios: [{ termDays: 30, paymentDate: "2026-09-17", existingDebitCents: 1000000, installmentCents: 1600000, limitCents: 7440000, canBuy: true }] });

    expect(createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "simulation", details: expect.stringContaining('"canBuy":true') }));
  });

  it("requires the configured password before returning the audit trail", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.audit.recent({ password: "0000" as "2606" })).rejects.toThrow();

    vi.mocked(listRecentAuditEvents).mockResolvedValue([]);
    await expect(caller.audit.recent({ password: "2606" })).resolves.toEqual([]);

    vi.mocked(getRecentImportComparison).mockResolvedValue({ runs: [], changes: [] });
    await expect(caller.audit.importComparison({ password: "2606" })).resolves.toEqual({ runs: [], changes: [] });
  });
});
