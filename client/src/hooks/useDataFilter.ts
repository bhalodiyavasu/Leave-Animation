import { useState, useCallback, SetStateAction } from "react";

const clean = <T>(obj: Partial<T>): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(
      ([_, v]) =>
        v != null && v !== "" && v !== "0" && v !== "all" && !Number.isNaN(v),
    ),
  ) as Partial<T>;

export const useDataFilter = <T extends Record<string, any>>(
  initialFilters: T,
) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Partial<T>>({});

  const onReset = useCallback(
    (onPageReset?: () => void) => {
      setFilters(initialFilters);
      if (Object.keys(appliedFilters).length === 0) return;
      setAppliedFilters({});
      if (onPageReset) onPageReset();
    },
    [appliedFilters, initialFilters],
  );

  const onApply = useCallback(
    (newFilteredValues: Partial<T>, onPageReset?: () => void) => {
      const cleaned = clean(newFilteredValues);
      if (JSON.stringify(appliedFilters) === JSON.stringify(cleaned)) return;
      setAppliedFilters(cleaned);
      if (onPageReset) onPageReset();
    },
    [appliedFilters],
  );

  return {
    filters,
    setFilters,
    appliedFilters: new Proxy(appliedFilters, {
      get: (target: any, prop: string) => target[prop] ?? initialFilters[prop],
    }) as Partial<T>,
    setAppliedFilters: useCallback((val: SetStateAction<Partial<T>>) => {
      setAppliedFilters((prev) =>
        clean(val instanceof Function ? val(prev) : val),
      );
    }, []),
    onReset,
    onApply,
  };
};
