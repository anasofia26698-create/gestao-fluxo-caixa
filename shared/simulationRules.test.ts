import { describe, expect, it } from "vitest";
import { buildManualPaymentScenarios, calculateDaysFromReference, canPurchaseOnDate, getPurchaseLimitForDate, parsePaymentDates, splitPurchase } from "./simulationRules";

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

  it("uses 60% of weekday average sales as the standard purchase limit", () => {
    expect(getPurchaseLimitForDate("2026-08-09")).toMatchObject({ weekday: "Domingo", averageSales: 87000, weekdayLimit: 52200, limit: 52200, isCritical: false });
    expect(getPurchaseLimitForDate("2026-08-14")).toMatchObject({ weekday: "Sexta-feira", averageSales: 127000, weekdayLimit: 76200, limit: 76200, isCritical: false });
    expect(getPurchaseLimitForDate("2026-08-15")).toMatchObject({ weekday: "Sábado", averageSales: 133000, weekdayLimit: 79800, limit: 50000, isCritical: true });
  });

  it("caps every critical payment day at R$ 50,000", () => {
    ["2026-01-05", "2026-01-10", "2026-01-15", "2026-01-20", "2026-01-25"].forEach(date => {
      expect(getPurchaseLimitForDate(date).limit).toBe(50000);
      expect(getPurchaseLimitForDate(date).isCritical).toBe(true);
    });
  });

  it("allows or blocks purchases using the weekday target and critical cap", () => {
    expect(canPurchaseOnDate("2026-08-14", 60000, 16000)).toBe(true);
    expect(canPurchaseOnDate("2026-08-14", 61000, 16000)).toBe(false);
    expect(canPurchaseOnDate("2026-08-15", 35000, 15000)).toBe(true);
    expect(canPurchaseOnDate("2026-08-15", 35000, 15001)).toBe(false);
  });
});
