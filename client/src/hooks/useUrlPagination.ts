"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export interface UrlPagination {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
  setPage: (p: number) => void;
  setPageSize: (ps: number) => void;
  setPagination: (p: number, ps: number) => void;
  search?: string;
  setSearch?: (value: string) => void;
}

export interface UseUrlPaginationOptions {
  ensureDefaultsInUrl?: boolean;
  searchKey?: string;
  defaultSearch?: string;
}

export function useUrlPagination(
  defaultPageSize: number = 10,
  options: UseUrlPaginationOptions = { ensureDefaultsInUrl: true },
): UrlPagination {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPageState] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(defaultPageSize);
  const [search, setSearchState] = useState<string>(
    options.defaultSearch ?? "",
  );

  useEffect(() => {
    const s = options.searchKey
      ? (searchParams.get(options.searchKey) ?? "")
      : "";

    const nextPage = 1;
    const nextPageSize = defaultPageSize;

    setPageState(nextPage);
    setPageSizeState(nextPageSize);
    if (options.searchKey) setSearchState(s);

    if (options.ensureDefaultsInUrl) {
      const sp = new URLSearchParams(searchParams.toString());
      let changed = false;
      if (sp.get("p") !== "1") {
        changed = true;
      }
      if (sp.get("ps") !== String(nextPageSize)) {
        changed = true;
      }
      if (changed && typeof window !== "undefined") {
        const extras =
          options.searchKey && s ? { [options.searchKey]: s } : undefined;
        const url = buildOrderedUrl(
          pathname,
          sp,
          String(nextPage),
          String(nextPageSize),
          extras,
        );
        window.history.replaceState(window.history.state, "", url);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPage = (newPage: number) => {
    setPageState((prev) => {
      const next = newPage;
      if (prev === next) return prev;
      const sp = new URLSearchParams(searchParams.toString());
      if (typeof window !== "undefined") {
        const extras =
          options.searchKey && search
            ? { [options.searchKey]: search }
            : undefined;
        const url = buildOrderedUrl(
          pathname,
          sp,
          String(next),
          String(pageSize),
          extras,
        );
        window.history.replaceState(window.history.state, "", url);
      }
      return next;
    });
  };

  const setPageSize = (newSize: number) => {
    setPageSizeState((prevSize) => {
      const nextSize = newSize;
      if (prevSize === nextSize) return prevSize;
      const sp = new URLSearchParams(searchParams.toString());
      if (typeof window !== "undefined") {
        const extras =
          options.searchKey && search
            ? { [options.searchKey]: search }
            : undefined;
        const url = buildOrderedUrl(
          pathname,
          sp,
          "1",
          String(nextSize),
          extras,
        );
        window.history.replaceState(window.history.state, "", url);
      }
      setPageState(1);
      return nextSize;
    });
  };

  const setPagination = (newPage: number, newSize: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    const currP = searchParams.get("p");
    const currPs = searchParams.get("ps");
    const shouldReplace =
      currP !== String(newPage) || currPs !== String(newSize);
    if (shouldReplace && typeof window !== "undefined") {
      const extras =
        options.searchKey && search
          ? { [options.searchKey]: search }
          : undefined;
      const url = buildOrderedUrl(
        pathname,
        sp,
        String(newPage),
        String(newSize),
        extras,
      );
      window.history.replaceState(window.history.state, "", url);
    }
    setPageState(newPage);
    setPageSizeState(newSize);
  };

  const updateSearch = (value: string) => {
    if (!options.searchKey) return;
    setSearchState(value);
    const sp = new URLSearchParams(searchParams.toString());
    if (typeof window !== "undefined") {
      const extras = value ? { [options.searchKey]: value } : undefined;
      const url = buildOrderedUrl(pathname, sp, "1", String(pageSize), extras);
      window.history.replaceState(window.history.state, "", url);
    }
    setPageState(1);
  };

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
  const limit = pageSize;

  return {
    page,
    pageSize,
    offset,
    limit,
    setPage,
    setPageSize,
    setPagination,
    search: options.searchKey ? search : undefined,
    setSearch: options.searchKey ? updateSearch : undefined,
  };
}

function buildOrderedUrl(
  pathname: string,
  sp: URLSearchParams,
  p: string,
  ps: string,
  orderedExtras?: Record<string, string | undefined>,
) {
  const rest: string[] = [];
  sp.forEach((value, key) => {
    if (key === "p" || key === "ps") return;
    if (orderedExtras && key in orderedExtras) return;
    rest.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });
  const extras = orderedExtras
    ? Object.entries(orderedExtras)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`,
        )
    : [];
  const head = [`p=${p}`, `ps=${ps}`, ...extras];
  const query =
    rest.length > 0 ? `${head.join("&")}&${rest.join("&")}` : head.join("&");
  return `${pathname}?${query}`;
}
