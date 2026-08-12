import { describe, expect, it } from "vitest";
import { buildManualPaymentScenarios, calculateDaysFromReference, parsePaymentDates, splitPurchase } from "./simulationRules";

describe("simulation rules", () => {
  it("parses multiple Brazilian payment dates and ignores invalid calendar dates", () => {
    expect(parsePaymentDates("11/09/2026, 11/10/2026, 31/02/2026")).toEqual([
      { date: "2026-09-11", raw: "11/09/2026" },
      { date: "2026-10-11", raw: "11/10/2026" },
    ]);
  });

  it("calculates the term from the reference date", () => {
    expect(calculateDaysFromReference("2026-08-12", "2026-09-11")).toBe(30);
  });

  it("divides the purchase equally across manually entered dates", () => {
    expect(splitPurchase(48000, 3)).toBe(16000);
    expect(buildManualPaymentScenarios("2026-08-12", ["2026-09-11", "2026-10-11", "2026-11-11"], 48000)).toEqual([
      { date: "2026-09-11", term: 30, installment: 16000 },
      { date: "2026-10-11", term: 60, installment: 16000 },
      { date: "2026-11-11", term: 91, installment: 16000 },
    ]);
  });
});
