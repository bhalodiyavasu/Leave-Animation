import { describe, it, expect } from "vitest";
import { formatCurrency } from "../formatCurrency";

describe("formatCurrency", () => {
  describe("amounts less than 1 lakh", () => {
    it("should format small amounts correctly", () => {
      expect(formatCurrency(1000)).toBe("₹1,000.00");
    });

    it("should format medium amounts correctly", () => {
      expect(formatCurrency(50000)).toBe("₹50,000.00");
    });

    it("should format amounts just below 1 lakh", () => {
      expect(formatCurrency(99999)).toBe("₹99,999.00");
    });

    it("should handle decimal values", () => {
      expect(formatCurrency(1234.56)).toBe("₹1,234.56");
    });

    it("should round to 2 decimal places", () => {
      expect(formatCurrency(1234.567)).toBe("₹1,234.57");
    });
  });

  describe("amounts >= 1 lakh", () => {
    it("should format exactly 1 lakh in lakhs", () => {
      expect(formatCurrency(100000)).toBe("₹1.00 L");
    });

    it("should format 5 lakhs correctly", () => {
      expect(formatCurrency(500000)).toBe("₹5.00 L");
    });

    it("should format 10 lakhs correctly", () => {
      expect(formatCurrency(1000000)).toBe("₹10.00 L");
    });

    it("should format 1.5 lakhs with decimals", () => {
      expect(formatCurrency(150000)).toBe("₹1.50 L");
    });

    it("should format large amounts in lakhs", () => {
      expect(formatCurrency(12345678)).toBe("₹123.46 L");
    });
  });

  describe("string inputs", () => {
    it("should handle string numbers less than 1 lakh", () => {
      expect(formatCurrency("75000")).toBe("₹75,000.00");
    });

    it("should handle string numbers >= 1 lakh", () => {
      expect(formatCurrency("250000")).toBe("₹2.50 L");
    });

    it("should handle string decimals", () => {
      expect(formatCurrency("1234.56")).toBe("₹1,234.56");
    });
  });

  describe("edge cases", () => {
    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("₹0.00");
    });

    it("should handle negative amounts", () => {
      expect(formatCurrency(-5000)).toBe("-₹5,000.00");
    });

    it("should handle negative lakhs", () => {
      expect(formatCurrency(-150000)).toBe("-₹1.50 L");
    });

    it("should handle invalid string inputs", () => {
      expect(formatCurrency("invalid")).toBe("₹0.00");
    });

    it("should handle empty string", () => {
      expect(formatCurrency("")).toBe("₹0.00");
    });

    it("should handle NaN", () => {
      expect(formatCurrency(NaN)).toBe("₹0.00");
    });

    it("should handle undefined coerced to number", () => {
      expect(formatCurrency(undefined as any)).toBe("₹0.00");
    });

    it("should handle null coerced to number", () => {
      expect(formatCurrency(null as any)).toBe("₹0.00");
    });
  });

  describe("boundary values", () => {
    it("should format 99,999 (just below threshold)", () => {
      expect(formatCurrency(99999)).toBe("₹99,999.00");
    });

    it("should format 100,000 (at threshold)", () => {
      expect(formatCurrency(100000)).toBe("₹1.00 L");
    });

    it("should format 100,001 (just above threshold)", () => {
      expect(formatCurrency(100001)).toBe("₹1.00 L");
    });
  });
});
