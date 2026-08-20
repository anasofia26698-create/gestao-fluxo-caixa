import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditEvents, cashFlowEntries, cashFlowImportEntries, cashFlowImportRuns, InsertCashFlowEntry, InsertUploadedFile, InsertUser, uploadedFiles, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUploadedFile(file: InsertUploadedFile) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(uploadedFiles).values(file);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id)).limit(1);
  return rows[0];
}

export async function listUploadedFiles(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uploadedFiles).where(eq(uploadedFiles.ownerId, ownerId)).orderBy(asc(uploadedFiles.createdAt));
}

export const TEMPORARY_PURCHASE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getSharedPurchaseExpiration(now = new Date()) {
  return new Date(now.getTime() - TEMPORARY_PURCHASE_TTL_MS);
}

export function isSharedPurchaseConfirmationActive(createdAt: Date, now = new Date()) {
  return createdAt.getTime() >= getSharedPurchaseExpiration(now).getTime();
}

export type SharedCashFlowInput = {
  date: string;
  debitCents: number;
  termDays?: number;
};

export type AuditEventInput = {
  eventType: "access" | "import" | "confirmation" | "simulation";
  userId?: number | null;
  userName?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  route: string;
  entryCount?: number;
  details?: string | null;
};

export type ImportSnapshotInput = {
  fileName?: string | null;
  mappedColumns: string;
  periodStart: string;
  periodEnd: string;
  totalDebitCents: number;
};

export async function createAuditEvent(event: AuditEventInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(auditEvents).values({
    ...event,
    entryCount: event.entryCount ?? 0,
  });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(auditEvents).where(eq(auditEvents.id, id)).limit(1);
  return rows[0];
}

export async function listRecentAuditEvents(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt), desc(auditEvents.id)).limit(limit);
}

export async function listSharedCashFlowEntries(now = new Date()) {
  const db = await getDb();
  if (!db) return [];
  const expiration = getSharedPurchaseExpiration(now);
  await db.delete(cashFlowEntries).where(and(eq(cashFlowEntries.source, "manual"), lt(cashFlowEntries.createdAt, expiration)));
  return db.select().from(cashFlowEntries).orderBy(asc(cashFlowEntries.date), asc(cashFlowEntries.id));
}

export async function replaceSharedImportedEntries(entries: SharedCashFlowInput[], audit?: AuditEventInput, snapshot?: ImportSnapshotInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.transaction(async tx => {
    let auditEventId: number | undefined;
    if (audit) {
      const result = await tx.insert(auditEvents).values({ ...audit, entryCount: audit.entryCount ?? entries.length });
      auditEventId = Number(result[0].insertId);
    }
    if (snapshot) {
      const run = await tx.insert(cashFlowImportRuns).values({
        auditEventId,
        fileName: snapshot.fileName ?? null,
        mappedColumns: snapshot.mappedColumns,
        entryCount: entries.length,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        totalDebitCents: snapshot.totalDebitCents,
      });
      const importRunId = Number(run[0].insertId);
      await tx.insert(cashFlowImportEntries).values(entries.map(entry => ({ importRunId, date: entry.date, debitCents: entry.debitCents })));
    }
    await tx.delete(cashFlowEntries).where(eq(cashFlowEntries.source, "imported"));
    if (entries.length) {
      await tx.insert(cashFlowEntries).values(entries.map(entry => ({
        date: entry.date,
        debitCents: entry.debitCents,
        source: "imported" as const,
        auditEventId,
      } satisfies InsertCashFlowEntry)));
    }
  });
  return listSharedCashFlowEntries();
}

export async function getRecentImportComparison() {
  const db = await getDb();
  const emptyChanges: { date: string; currentDebitCents: number; previousDebitCents: number; increaseCents: number }[] = [];
  if (!db) return { runs: [], changes: emptyChanges };
  const runs = await db.select().from(cashFlowImportRuns).orderBy(desc(cashFlowImportRuns.createdAt), desc(cashFlowImportRuns.id)).limit(6);
  if (runs.length < 2) return { runs, changes: emptyChanges };
  const [latest, ...previousRuns] = runs;
  const snapshots = await db.select().from(cashFlowImportEntries).where(inArray(cashFlowImportEntries.importRunId, runs.map(run => run.id)));
  const byRun = new Map<number, Map<string, number>>();
  snapshots.forEach(item => {
    const byDate = byRun.get(item.importRunId) ?? new Map<string, number>();
    byDate.set(item.date, (byDate.get(item.date) ?? 0) + item.debitCents);
    byRun.set(item.importRunId, byDate);
  });
  const currentDates = byRun.get(latest.id) ?? new Map<string, number>();
  const changes = Array.from(currentDates.entries()).map(([date, currentDebitCents]) => {
    const historicalValues = previousRuns.map(run => byRun.get(run.id)?.get(date) ?? 0);
    const previousDebitCents = Math.round(historicalValues.reduce((sum, value) => sum + value, 0) / historicalValues.length);
    return { date, currentDebitCents, previousDebitCents, increaseCents: currentDebitCents - previousDebitCents };
  }).filter(change => change.increaseCents > 0).sort((a, b) => b.increaseCents - a.increaseCents).slice(0, 10);
  return { runs, changes };
}

export async function createSharedPurchaseConfirmations(entries: SharedCashFlowInput[], audit?: AuditEventInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (entries.length) {
    await db.transaction(async tx => {
      let auditEventId: number | undefined;
      if (audit) {
        const result = await tx.insert(auditEvents).values({ ...audit, entryCount: audit.entryCount ?? entries.length });
        auditEventId = Number(result[0].insertId);
      }
      await tx.insert(cashFlowEntries).values(entries.map(entry => ({
        date: entry.date,
        debitCents: entry.debitCents,
        source: "manual" as const,
        auditEventId,
      } satisfies InsertCashFlowEntry)));
    });
  }
  return listSharedCashFlowEntries();
}
