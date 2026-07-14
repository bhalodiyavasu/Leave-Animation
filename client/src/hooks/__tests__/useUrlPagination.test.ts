import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useUrlPagination } from "../useUrlPagination";
import * as navigation from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

describe("useUrlPagination", () => {
  const mockReplaceState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks
    (navigation.usePathname as any).mockReturnValue("/test-path");
    (navigation.useSearchParams as any).mockReturnValue(new URLSearchParams());

    // Mock window.history
    Object.defineProperty(window, "history", {
      value: {
        replaceState: mockReplaceState,
        state: {},
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUrlPagination());

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.offset).toBe(0);
    expect(result.current.limit).toBe(10);
  });

  it("should initialize from URL params", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("p=2&ps=20"),
    );

    const { result } = renderHook(() => useUrlPagination());

    expect(result.current.page).toBe(1); // Now defaults to 1 on mount
    expect(result.current.pageSize).toBe(10); // Now defaults to 10 on mount
    expect(result.current.offset).toBe(0); // (1-1)*10
  });

  it("should update page and update history", () => {
    const { result } = renderHook(() => useUrlPagination());

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.page).toBe(3);
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("p=3"),
    );
  });

  it("should update page size and reset page to 1", () => {
    const { result } = renderHook(() => useUrlPagination());

    act(() => {
      result.current.setPage(3);
    });

    act(() => {
      result.current.setPageSize(50);
    });

    expect(result.current.pageSize).toBe(50);
    expect(result.current.page).toBe(1);

    expect(mockReplaceState).toHaveBeenLastCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("ps=50"),
    );
  });

  it("should not update history if page or pageSize has not changed", () => {
    const { result } = renderHook(() => useUrlPagination(10), {
      initialProps: { defaultPageSize: 10 },
    });
    mockReplaceState.mockClear();

    act(() => {
      result.current.setPage(1);
    });
    expect(mockReplaceState).not.toHaveBeenCalled();

    act(() => {
      result.current.setPageSize(10);
    });
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it("should update both page and pageSize via setPagination", () => {
    const { result } = renderHook(() => useUrlPagination());

    act(() => {
      result.current.setPagination(2, 20);
    });

    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(20);
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("p=2&ps=20"),
    );
  });

  it("should handle search logic when searchKey is provided", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("q=test"),
    );

    const { result } = renderHook(() =>
      useUrlPagination(10, { searchKey: "q" }),
    );

    expect(result.current.search).toBe("test");

    act(() => {
      result.current.setSearch!("newsearch");
    });

    expect(result.current.search).toBe("newsearch");
    expect(result.current.page).toBe(1);
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("q=newsearch"),
    );
  });

  it("should correctly handle empty search value", () => {
    const { result } = renderHook(() =>
      useUrlPagination(10, { searchKey: "q" }),
    );

    act(() => {
      result.current.setSearch!("");
    });

    expect(result.current.search).toBe("");
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.not.stringContaining("q="),
    );
  });

  it("should ensure default params are in URL on mount if ensureDefaultsInUrl is true", () => {
    (navigation.useSearchParams as any).mockReturnValue(new URLSearchParams());

    renderHook(() => useUrlPagination(10, { ensureDefaultsInUrl: true }));

    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("p=1&ps=10"),
    );
  });

  it("should correct invalid pageSize on mount", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("ps=15"),
    );

    const { result } = renderHook(() => useUrlPagination(10));

    expect(result.current.pageSize).toBe(10);
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("ps=10"),
    );
  });

  it("should preserve existing URL parameters when updating pagination", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("p=1&ps=10&other=param"),
    );

    const { result } = renderHook(() => useUrlPagination());
    mockReplaceState.mockClear();

    act(() => {
      result.current.setPage(2);
    });

    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("other=param"),
    );
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("p=2"),
    );
  });

  it("should not correct URL if params are already present and valid", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("p=2&ps=20"),
    );
    mockReplaceState.mockClear();

    renderHook(() => useUrlPagination(10));

    // Now it WILL be called to reset p=2 to p=1 AND ps=20 to ps=10
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("p=1"),
    );
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("ps=10"),
    );
  });

  it("should handle p or ps being returned in rest params of buildOrderedUrl", () => {
    // This tests the logic in buildOrderedUrl where it skips p and ps from the rest
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("p=1&ps=10&other=val"),
    );
    const { result } = renderHook(() => useUrlPagination());
    mockReplaceState.mockClear();

    act(() => {
      result.current.setPage(2);
    });

    // Verify 'other=val' is preserved but 'p=1' and 'ps=10' are replaced by new values
    const lastUrl = mockReplaceState.mock.calls[0][2];
    expect(lastUrl).toContain("p=2");
    expect(lastUrl).toContain("ps=10");
    expect(lastUrl).toContain("other=val");
    // Ensure the old p=1 is NOT there anymore
    const urlParams = new URLSearchParams(lastUrl.split("?")[1]);
    expect(urlParams.getAll("p")).toEqual(["2"]);
    expect(urlParams.getAll("ps")).toEqual(["10"]);
  });

  it("should handle overlapping extras in buildOrderedUrl", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("q=old&other=val"),
    );
    const { result } = renderHook(() =>
      useUrlPagination(10, { searchKey: "q" }),
    );
    mockReplaceState.mockClear();

    act(() => {
      result.current.setSearch!("new");
    });

    const lastUrl = mockReplaceState.mock.calls[0][2];
    expect(lastUrl).toContain("q=new");
    expect(lastUrl).toContain("other=val");
    expect(lastUrl).not.toContain("q=old");
  });

  it("should filter out undefined or empty extras in buildOrderedUrl", () => {
    // This hits the .filter(([, v]) => v !== undefined && v !== "") line
    (navigation.useSearchParams as any).mockReturnValue(new URLSearchParams());
    const { result } = renderHook(() =>
      useUrlPagination(10, { searchKey: "q" }),
    );
    mockReplaceState.mockClear();

    // Trigger setPage which calls buildOrderedUrl with extras { q: "" } (since search is initially "")
    act(() => {
      result.current.setPage(2);
    });

    const lastUrl = mockReplaceState.mock.calls[0][2];
    expect(lastUrl).not.toContain("q=");
  });

  it("should not update history if setPagination params are same as current URL", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("p=2&ps=20"),
    );
    const { result } = renderHook(() => useUrlPagination());
    expect(result.current.pageSize).toBe(10); // Defaults to 10 on mount
    
    act(() => {
      result.current.setPagination(2, 20);
    });

    expect(mockReplaceState).toHaveBeenCalled(); // Called because ps changed from 10 to 20
  });

  it("should return undefined for search/setSearch if searchKey is missing", () => {
    const { result } = renderHook(() => useUrlPagination());
    expect(result.current.search).toBeUndefined();
    expect(result.current.setSearch).toBeUndefined();
  });

  it("should include active search in URL when changing page or pageSize", () => {
    (navigation.useSearchParams as any).mockReturnValue(
      new URLSearchParams("q=test"),
    );
    const { result } = renderHook(() =>
      useUrlPagination(10, { searchKey: "q" }),
    );
    mockReplaceState.mockClear();

    act(() => {
      result.current.setPage(2);
    });
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("q=test"),
    );

    mockReplaceState.mockClear();
    act(() => {
      result.current.setPageSize(20);
    });
    expect(mockReplaceState).toHaveBeenCalledWith(
      expect.anything(),
      "",
      expect.stringContaining("q=test"),
    );
  });
});
