import { describe, it, expect } from "vitest";
import { formatDate } from "../formateDate";

describe("formatDate", () => {
  describe("valid date inputs", () => {
    it("should format Date object with default format", () => {
      const date = new Date("2026-02-16T10:30:00");
      expect(formatDate(date)).toBe("2026-02-16");
    });

    it("should format Date object with custom format", () => {
      const date = new Date("2026-02-16T10:30:00");
      expect(formatDate(date, "dd/MM/yyyy")).toBe("16/02/2026");
    });

    it("should format Date object with time format", () => {
      const date = new Date("2026-02-16T10:30:00");
      expect(formatDate(date, "yyyy-MM-dd HH:mm:ss")).toMatch(
        /2026-02-16 \d{2}:\d{2}:\d{2}/,
      );
    });

    it("should format Date object with month name", () => {
      const date = new Date("2026-02-16T10:30:00");
      expect(formatDate(date, "MMMM dd, yyyy")).toBe("February 16, 2026");
    });

    it("should format Date object with short month", () => {
      const date = new Date("2026-02-16T10:30:00");
      expect(formatDate(date, "MMM dd, yyyy")).toBe("Feb 16, 2026");
    });
  });

  describe("ISO string inputs", () => {
    it("should format ISO string with default format", () => {
      expect(formatDate("2026-02-16T10:30:00Z")).toBe("2026-02-16");
    });

    it("should format ISO string with custom format", () => {
      expect(formatDate("2026-02-16T10:30:00Z", "dd/MM/yyyy")).toBe(
        "16/02/2026",
      );
    });

    it("should format date-only ISO string", () => {
      expect(formatDate("2026-02-16")).toBe("2026-02-16");
    });

    it("should format ISO string with timezone", () => {
      expect(formatDate("2026-02-16T10:30:00+05:30", "yyyy-MM-dd")).toBe(
        "2026-02-16",
      );
    });
  });

  describe("null and undefined inputs", () => {
    it("should return empty string for null", () => {
      expect(formatDate(null)).toBe("");
    });

    it("should return empty string for undefined", () => {
      expect(formatDate(undefined)).toBe("");
    });

    it("should return empty string for null with custom format", () => {
      expect(formatDate(null, "dd/MM/yyyy")).toBe("");
    });
  });

  describe("invalid date inputs", () => {
    it("should return empty string for invalid Date object", () => {
      const invalidDate = new Date("invalid");
      expect(formatDate(invalidDate)).toBe("");
    });

    it("should return empty string for invalid ISO string", () => {
      expect(formatDate("not-a-date")).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(formatDate("")).toBe("");
    });

    it("should return empty string for malformed date string", () => {
      expect(formatDate("2026-13-45")).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should handle leap year dates", () => {
      expect(formatDate("2024-02-29")).toBe("2024-02-29");
    });

    it("should handle year boundaries", () => {
      // UTC time may convert to next day in local timezone (IST is UTC+5:30)
      // 2025-12-31T23:59:59Z becomes 2026-01-01 in IST
      expect(formatDate("2025-12-31T23:59:59Z")).toBe("2026-01-01");
    });

    it("should handle first day of year", () => {
      expect(formatDate("2026-01-01T00:00:00Z")).toBe("2026-01-01");
    });

    it("should handle different date separators in format", () => {
      expect(formatDate("2026-02-16", "yyyy.MM.dd")).toBe("2026.02.16");
    });

    it("should handle day of week in format", () => {
      const date = new Date("2026-02-16T10:30:00");
      expect(formatDate(date, "EEEE, MMMM dd, yyyy")).toBe(
        "Monday, February 16, 2026",
      );
    });
  });

  describe("various format patterns", () => {
    const testDate = "2026-02-16T10:30:45Z";

    it("should format with dd-MM-yyyy pattern", () => {
      expect(formatDate(testDate, "dd-MM-yyyy")).toBe("16-02-2026");
    });

    it("should format with MM/dd/yyyy pattern", () => {
      expect(formatDate(testDate, "MM/dd/yyyy")).toBe("02/16/2026");
    });

    it("should format with yyyy/MM/dd pattern", () => {
      expect(formatDate(testDate, "yyyy/MM/dd")).toBe("2026/02/16");
    });

    it("should format with time components", () => {
      const result = formatDate(testDate, "HH:mm:ss");
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("error handling", () => {
    it("should catch and handle parsing errors gracefully", () => {
      // This should not throw, but return empty string
      expect(() => formatDate("completely-invalid-date")).not.toThrow();
      expect(formatDate("completely-invalid-date")).toBe("");
    });

    it("should handle dates with invalid format strings gracefully", () => {
      // Invalid format should still be handled by date-fns
      const date = new Date("2026-02-16");
      expect(() => formatDate(date, "invalid-format")).not.toThrow();
    });
  });
});
