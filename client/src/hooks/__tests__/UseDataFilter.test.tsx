import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useDataFilter } from "../useDataFilter";

describe("useDataFilter", () => {
  const initialFilters = { search: "", status: "all" };

  it("should initialize with provided initial filters and empty applied filters", () => {
    const { result } = renderHook(() => useDataFilter(initialFilters));

    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.appliedFilters).toEqual({});
  });

  it("should update local filters using setFilters", () => {
    const { result } = renderHook(() => useDataFilter(initialFilters));

    act(() => {
      result.current.setFilters({ search: "test", status: "active" });
    });

    expect(result.current.filters).toEqual({ search: "test", status: "active" });
    expect(result.current.appliedFilters).toEqual({});
  });

  describe("onReset", () => {
    it("should reset local filters but not trigger applied filter reset if none are applied", () => {
      const onPageReset = vi.fn();
      const { result } = renderHook(() => useDataFilter(initialFilters));

      act(() => {
        result.current.setFilters({ search: "dirty", status: "all" });
      });

      act(() => {
        result.current.onReset(onPageReset);
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.appliedFilters).toEqual({});
      expect(onPageReset).not.toHaveBeenCalled();
    });

    it("should reset applied filters and trigger onPageReset if filters are applied", () => {
      const onPageReset = vi.fn();
      const { result } = renderHook(() => useDataFilter(initialFilters));

      // Apply some filters first
      act(() => {
        result.current.onApply({ search: "test" }, onPageReset);
      });
      expect(result.current.appliedFilters).toEqual({ search: "test" });
      expect(onPageReset).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.setFilters({ search: "changed", status: "all" });
      });

      act(() => {
        result.current.onReset(onPageReset);
      });

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.appliedFilters).toEqual({});
      expect(onPageReset).toHaveBeenCalledTimes(2); // Once for apply, once for reset
    });

    it("should work without onPageReset callback", () => {
      const { result } = renderHook(() => useDataFilter(initialFilters));

      act(() => {
        result.current.onApply({ search: "test" });
      });

      act(() => {
        result.current.onReset();
      });

      expect(result.current.appliedFilters).toEqual({});
    });
  });

  describe("onApply", () => {
    it("should apply new filters and trigger onPageReset", () => {
      const onPageReset = vi.fn();
      const { result } = renderHook(() => useDataFilter(initialFilters));

      act(() => {
        result.current.onApply({ search: "test" }, onPageReset);
      });

      expect(result.current.appliedFilters).toEqual({ search: "test" });
      expect(onPageReset).toHaveBeenCalled();
    });

    it("should not trigger update if applied filters are identical (de-duplication)", () => {
      const onPageReset = vi.fn();
      const { result } = renderHook(() => useDataFilter(initialFilters));

      // First apply
      act(() => {
        result.current.onApply({ search: "test" }, onPageReset);
      });
      expect(onPageReset).toHaveBeenCalledTimes(1);

      // Second apply with identical values
      act(() => {
        result.current.onApply({ search: "test" }, onPageReset);
      });

      expect(onPageReset).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should work without onPageReset callback", () => {
      const { result } = renderHook(() => useDataFilter(initialFilters));

      act(() => {
        result.current.onApply({ search: "test" });
      });

      expect(result.current.appliedFilters).toEqual({ search: "test" });
    });
  });

  it("should allow direct setAppliedFilters update", () => {
    const { result } = renderHook(() => useDataFilter(initialFilters));

    act(() => {
      result.current.setAppliedFilters({ status: "inactive" });
    });

    expect(result.current.appliedFilters).toEqual({ status: "inactive" });
  });

  it("should clean applied filters and fallback to initial values via Proxy", () => {
    const { result } = renderHook(() =>
      useDataFilter({ search: "", status: "all", limit: 10 }),
    );

    act(() => {
      result.current.onApply({
        search: "test",
        status: "all",
        limit: undefined as any,
      });
    });

    // Spreading should only show cleaned, non-default keys (behaves like before for spreads)
    expect({ ...result.current.appliedFilters }).toEqual({ search: "test" });

    // Property access should fall back to initial values for cleaned keys, except for placeholders '0'/'all'
    expect(result.current.appliedFilters.status).toBeUndefined();
    expect(result.current.appliedFilters.limit).toBe(10);
    expect(result.current.appliedFilters.search).toBe("test");
  });

  describe("clean function edge cases", () => {
    it("should strip null values from applied filters", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", category: "" }),
      );

      act(() => {
        result.current.onApply({ search: "test", category: null as any });
      });

      expect({ ...result.current.appliedFilters }).toEqual({ search: "test" });
    });

    it("should strip NaN values from applied filters", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", count: 0 }),
      );

      act(() => {
        result.current.onApply({ search: "test", count: NaN as any });
      });

      expect({ ...result.current.appliedFilters }).toEqual({ search: "test" });
    });

    it("should strip '0' string values from applied filters", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", typeId: "0" }),
      );

      act(() => {
        result.current.onApply({ search: "test", typeId: "0" });
      });

      expect({ ...result.current.appliedFilters }).toEqual({ search: "test" });
    });

    it("should strip empty string values from applied filters", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", name: "" }),
      );

      act(() => {
        result.current.onApply({ search: "test", name: "" });
      });

      expect({ ...result.current.appliedFilters }).toEqual({ search: "test" });
    });

    it("should strip 'all' string values from applied filters", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", status: "all" }),
      );

      act(() => {
        result.current.onApply({ search: "test", status: "all" });
      });

      expect({ ...result.current.appliedFilters }).toEqual({ search: "test" });
    });

    it("should keep valid numeric values (including 0) in applied filters", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", count: 0 }),
      );

      act(() => {
        result.current.onApply({ search: "test", count: 0 as any });
      });

      // 0 is valid (not null, not NaN, not "", not "0", not "all")
      expect({ ...result.current.appliedFilters }).toEqual({ search: "test", count: 0 });
    });
  });

  describe("setAppliedFilters with function updater", () => {
    it("should support function updater pattern and clean the result", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", status: "all" }),
      );

      act(() => {
        result.current.setAppliedFilters({ search: "initial" });
      });

      act(() => {
        result.current.setAppliedFilters((prev) => ({
          ...prev,
          status: "active",
        }));
      });

      expect({ ...result.current.appliedFilters }).toEqual({
        search: "initial",
        status: "active",
      });
    });

    it("should clean values when using function updater", () => {
      const { result } = renderHook(() =>
        useDataFilter({ search: "", status: "all" }),
      );

      act(() => {
        result.current.setAppliedFilters({ search: "test" });
      });

      act(() => {
        result.current.setAppliedFilters((prev) => ({
          ...prev,
          search: "", // should be cleaned out
        }));
      });

      expect({ ...result.current.appliedFilters }).toEqual({});
    });
  });

  describe("hasChanges", () => {
    it("should return false when filters match initial values", () => {
      const { result } = renderHook(() => useDataFilter(initialFilters));
      expect(result.current.hasChanges).toBe(false);
    });

    it("should return true when filters differ from initial values", () => {
      const { result } = renderHook(() => useDataFilter(initialFilters));

      act(() => {
        result.current.setFilters({ search: "modified", status: "all" });
      });

      expect(result.current.hasChanges).toBe(true);
    });

    it("should return false after resetting filters", () => {
      const { result } = renderHook(() => useDataFilter(initialFilters));

      act(() => {
        result.current.setFilters({ search: "modified", status: "all" });
      });
      expect(result.current.hasChanges).toBe(true);

      act(() => {
        result.current.onReset();
      });
      expect(result.current.hasChanges).toBe(false);
    });
  });
});