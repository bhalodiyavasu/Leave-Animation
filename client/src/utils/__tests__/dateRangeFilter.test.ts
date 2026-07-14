import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DATE_RANGE_OPTIONS,
  getDateRangeOptions,
  getDateRangeFromValue,
} from "../dateRangeFilter";

describe("dateRangeFilter", () => {
  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-16T10:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("DATE_RANGE_OPTIONS", () => {
    it("should have all required options", () => {
      expect(DATE_RANGE_OPTIONS.ALL_TIME).toBe("all_time");
      expect(DATE_RANGE_OPTIONS.TODAY).toBe("today");
      expect(DATE_RANGE_OPTIONS.THIS_WEEK).toBe("this_week");
      expect(DATE_RANGE_OPTIONS.THIS_MONTH).toBe("this_month");
      expect(DATE_RANGE_OPTIONS.THIS_QUARTER).toBe("this_quarter");
      expect(DATE_RANGE_OPTIONS.THIS_YEAR).toBe("this_year");
    });
  });

  describe("getDateRangeOptions", () => {
    it("should return array of date range options", () => {
      const options = getDateRangeOptions();
      expect(options).toBeInstanceOf(Array);
      expect(options).toHaveLength(6);
    });

    it("should have correct structure for each option", () => {
      const options = getDateRangeOptions();
      options.forEach((option) => {
        expect(option).toHaveProperty("name");
        expect(option).toHaveProperty("value");
        expect(typeof option.name).toBe("string");
        expect(typeof option.value).toBe("string");
      });
    });

    it("should include All Time option", () => {
      const options = getDateRangeOptions();
      const allTime = options.find(
        (opt) => opt.value === DATE_RANGE_OPTIONS.ALL_TIME,
      );
      expect(allTime).toBeDefined();
      expect(allTime?.name).toBe("All Time");
    });

    it("should include Today option", () => {
      const options = getDateRangeOptions();
      const today = options.find(
        (opt) => opt.value === DATE_RANGE_OPTIONS.TODAY,
      );
      expect(today).toBeDefined();
      expect(today?.name).toBe("Today");
    });

    it("should include This Week option", () => {
      const options = getDateRangeOptions();
      const thisWeek = options.find(
        (opt) => opt.value === DATE_RANGE_OPTIONS.THIS_WEEK,
      );
      expect(thisWeek).toBeDefined();
      expect(thisWeek?.name).toBe("This Week");
    });

    it("should include This Month option", () => {
      const options = getDateRangeOptions();
      const thisMonth = options.find(
        (opt) => opt.value === DATE_RANGE_OPTIONS.THIS_MONTH,
      );
      expect(thisMonth).toBeDefined();
      expect(thisMonth?.name).toBe("This Month");
    });

    it("should include This Quarter option", () => {
      const options = getDateRangeOptions();
      const thisQuarter = options.find(
        (opt) => opt.value === DATE_RANGE_OPTIONS.THIS_QUARTER,
      );
      expect(thisQuarter).toBeDefined();
      expect(thisQuarter?.name).toBe("This Quarter");
    });

    it("should include This Year option", () => {
      const options = getDateRangeOptions();
      const thisYear = options.find(
        (opt) => opt.value === DATE_RANGE_OPTIONS.THIS_YEAR,
      );
      expect(thisYear).toBeDefined();
      expect(thisYear?.name).toBe("This Year");
    });
  });

  describe("getDateRangeFromValue", () => {
    describe("TODAY option", () => {
      it("should return today's date range", () => {
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.TODAY);
        expect(result.startDate).toBe("2026-02-16");
        expect(result.endDate).toBe("2026-02-16");
      });
    });

    describe("THIS_WEEK option", () => {
      it("should return current week date range (Monday to Sunday)", () => {
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_WEEK);
        // Feb 16, 2026 is a Monday
        expect(result.startDate).toBe("2026-02-16");
        expect(result.endDate).toBe("2026-02-22");
      });

      it("should handle week starting on Monday for different days", () => {
        // Test for a Wednesday
        vi.setSystemTime(new Date("2026-02-18T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_WEEK);
        expect(result.startDate).toBe("2026-02-16"); // Monday
        expect(result.endDate).toBe("2026-02-22"); // Sunday
      });
    });

    describe("THIS_MONTH option", () => {
      it("should return current month date range", () => {
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_MONTH);
        expect(result.startDate).toBe("2026-02-01");
        expect(result.endDate).toBe("2026-02-28");
      });

      it("should handle different months correctly", () => {
        vi.setSystemTime(new Date("2026-03-15T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_MONTH);
        expect(result.startDate).toBe("2026-03-01");
        expect(result.endDate).toBe("2026-03-31");
      });

      it("should handle leap year February", () => {
        vi.setSystemTime(new Date("2024-02-15T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_MONTH);
        expect(result.startDate).toBe("2024-02-01");
        expect(result.endDate).toBe("2024-02-29");
      });
    });

    describe("THIS_QUARTER option", () => {
      it("should return Q1 date range (Jan-Mar)", () => {
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_QUARTER);
        expect(result.startDate).toBe("2026-01-01");
        expect(result.endDate).toBe("2026-03-31");
      });

      it("should return Q2 date range (Apr-Jun)", () => {
        vi.setSystemTime(new Date("2026-05-15T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_QUARTER);
        expect(result.startDate).toBe("2026-04-01");
        expect(result.endDate).toBe("2026-06-30");
      });

      it("should return Q3 date range (Jul-Sep)", () => {
        vi.setSystemTime(new Date("2026-08-15T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_QUARTER);
        expect(result.startDate).toBe("2026-07-01");
        expect(result.endDate).toBe("2026-09-30");
      });

      it("should return Q4 date range (Oct-Dec)", () => {
        vi.setSystemTime(new Date("2026-11-15T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_QUARTER);
        expect(result.startDate).toBe("2026-10-01");
        expect(result.endDate).toBe("2026-12-31");
      });
    });

    describe("THIS_YEAR option", () => {
      it("should return current year date range", () => {
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_YEAR);
        expect(result.startDate).toBe("2026-01-01");
        expect(result.endDate).toBe("2026-12-31");
      });

      it("should handle different years correctly", () => {
        vi.setSystemTime(new Date("2025-06-15T10:30:00Z"));
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_YEAR);
        expect(result.startDate).toBe("2025-01-01");
        expect(result.endDate).toBe("2025-12-31");
      });
    });

    describe("ALL_TIME and invalid options", () => {
      it("should return empty dates for ALL_TIME", () => {
        const result = getDateRangeFromValue(DATE_RANGE_OPTIONS.ALL_TIME);
        expect(result.startDate).toBe("");
        expect(result.endDate).toBe("");
      });

      it("should return empty dates for invalid option", () => {
        const result = getDateRangeFromValue("invalid_option");
        expect(result.startDate).toBe("");
        expect(result.endDate).toBe("");
      });

      it("should return empty dates for empty string", () => {
        const result = getDateRangeFromValue("");
        expect(result.startDate).toBe("");
        expect(result.endDate).toBe("");
      });
    });

    describe("date format consistency", () => {
      it("should always return dates in yyyy-MM-dd format", () => {
        const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

        const todayResult = getDateRangeFromValue(DATE_RANGE_OPTIONS.TODAY);
        expect(todayResult.startDate).toMatch(dateFormatRegex);
        expect(todayResult.endDate).toMatch(dateFormatRegex);

        const weekResult = getDateRangeFromValue(DATE_RANGE_OPTIONS.THIS_WEEK);
        expect(weekResult.startDate).toMatch(dateFormatRegex);
        expect(weekResult.endDate).toMatch(dateFormatRegex);

        const monthResult = getDateRangeFromValue(
          DATE_RANGE_OPTIONS.THIS_MONTH,
        );
        expect(monthResult.startDate).toMatch(dateFormatRegex);
        expect(monthResult.endDate).toMatch(dateFormatRegex);
      });
    });
  });
});
