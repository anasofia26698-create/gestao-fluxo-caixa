import { describe, expect, it } from "vitest";
import { isTemporaryEntryActive, replaceImportedEntries, TEMPORARY_ENTRY_TTL_MS } from "./flowRules";

describe("flow rules", () => {
  it("keeps imported entries and active manual confirmations", () => {
    const now = 1_000_000;
    const result = replaceImportedEntries(
      [
        { source: "imported" as const, createdAt: now - 20 * TEMPORARY_ENTRY_TTL_MS },
        { source: "manual" as const, createdAt: now - 2 * 24 * 60 * 60 * 1000 },
      ],
      [{ source: "imported" as const }],
      now,
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.source).toBe("manual");
    expect(result[1]?.source).toBe("imported");
  });

  it("expires a manual confirmation at seven days", () => {
    const now = 5_000_000;
    expect(isTemporaryEntryActive({ source: "manual", createdAt: now - TEMPORARY_ENTRY_TTL_MS + 1 }, now)).toBe(true);
    expect(isTemporaryEntryActive({ source: "manual", createdAt: now - TEMPORARY_ENTRY_TTL_MS }, now)).toBe(false);
  });
});
