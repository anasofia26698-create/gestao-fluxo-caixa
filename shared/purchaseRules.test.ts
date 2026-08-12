import { describe, expect, it } from "vitest";
import { calculateConsumption, calculatePurchaseBudget, consumptionStatus, isPurchaseAccessGranted } from "./purchaseRules";

describe("purchase goals rules", () => {
  it("allows only the configured access password", () => {
    expect(isPurchaseAccessGranted("2606")).toBe(true);
    expect(isPurchaseAccessGranted("0000")).toBe(false);
  });

  it("calculates consolidated purchase budget and consumption", () => {
    expect(calculatePurchaseBudget(100000, 60, 10000, 15000)).toBe(65000);
    expect(calculateConsumption(65000, 52000)).toBe(80);
    expect(consumptionStatus(80)).toBe("ok");
    expect(consumptionStatus(80.1)).toBe("warning");
    expect(consumptionStatus(100.1)).toBe("danger");
  });
});
