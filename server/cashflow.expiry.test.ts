import { describe, expect, it } from "vitest";
import { getSharedPurchaseExpiration, isSharedPurchaseConfirmationActive } from "./db";

describe("shared cash-flow confirmation expiration", () => {
  it("keeps confirmations for seven days and excludes older records", () => {
    const now = new Date("2026-08-13T12:00:00.000Z");
    expect(getSharedPurchaseExpiration(now).toISOString()).toBe("2026-08-06T12:00:00.000Z");
    expect(isSharedPurchaseConfirmationActive(new Date("2026-08-06T12:00:00.000Z"), now)).toBe(true);
    expect(isSharedPurchaseConfirmationActive(new Date("2026-08-06T11:59:59.999Z"), now)).toBe(false);
  });
});
