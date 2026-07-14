import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLocation } from "../../hooks/useLocation";

// Mock RTK Query hooks
const mockGetStateMutation = vi.fn();
const mockGetCityMutation = vi.fn();

vi.mock("@/store/action/location/location", () => ({
  useGetStateMutation: () => [mockGetStateMutation],
  useGetCityMutation: () => [mockGetCityMutation],
}));

describe("useLocation", () => {
  let mockMethods: any;
  let mockStates: any[];
  let mockCities: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console.error to keep test output clean
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockStates = [
      { id: 1, name: "State 1" },
      { id: 2, name: "State 2" },
    ];
    mockCities = [
      { id: 10, name: "City 10" },
      { id: 20, name: "City 20" },
    ];

    mockMethods = {
      watch: vi.fn(),
      setValue: vi.fn(),
      getValues: vi.fn().mockReturnValue({}),
    };

    const unwrapState = vi.fn().mockResolvedValue(mockStates);
    mockGetStateMutation.mockReturnValue({ unwrap: unwrapState });

    const unwrapCity = vi.fn().mockResolvedValue(mockCities);
    mockGetCityMutation.mockReturnValue({ unwrap: unwrapCity });
  });

  it("should return empty lists when no country is watched", () => {
    mockMethods.watch.mockReturnValue(undefined);
    const { result } = renderHook(() => useLocation({ methods: mockMethods }));
    expect(result.current.stateList).toEqual([]);
    expect(result.current.cityList).toEqual([]);
  });

  it("should fetch states when country is selected", async () => {
    mockMethods.watch.mockImplementation((name: string) =>
      name === "countryCode" ? "IN" : undefined,
    );
    const { result } = renderHook(() => useLocation({ methods: mockMethods }));

    expect(mockGetStateMutation).toHaveBeenCalledWith("IN");
    await waitFor(() => {
      expect(result.current.stateList).toEqual(mockStates);
    });
  });

  it("should handle error when fetching states", async () => {
    mockMethods.watch.mockImplementation((name: string) =>
      name === "countryCode" ? "IN" : undefined,
    );
    mockGetStateMutation.mockReturnValue({
      unwrap: () => Promise.reject("State Error"),
    });

    const { result } = renderHook(() => useLocation({ methods: mockMethods }));

    await waitFor(() => {
      expect(result.current.stateList).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("should reset state and city when country changes (not on first render)", async () => {
    // Initial render with country "IN"
    mockMethods.watch.mockImplementation((name: string) =>
      name === "countryCode" ? "IN" : undefined,
    );
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods }),
    );

    // Trigger update with country "US"
    mockMethods.watch.mockImplementation((name: string) =>
      name === "countryCode" ? "US" : undefined,
    );
    rerender();

    expect(mockMethods.setValue).toHaveBeenCalledWith("stateId", "");
    expect(mockMethods.setValue).toHaveBeenCalledWith("cityId", "");
  });

  it("should fetch cities when state is selected", async () => {
    mockMethods.watch.mockImplementation((name: string) => {
      if (name === "countryCode") return "IN";
      if (name === "stateId") return 1;
      return undefined;
    });

    const { result } = renderHook(() => useLocation({ methods: mockMethods }));

    expect(mockGetCityMutation).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(result.current.cityList).toEqual(mockCities);
    });
  });

  it("should handle error when fetching cities", async () => {
    mockMethods.watch.mockImplementation((name: string) =>
      name === "stateId" ? 1 : undefined,
    );
    mockGetCityMutation.mockReturnValue({
      unwrap: () => Promise.reject("City Error"),
    });

    const { result } = renderHook(() => useLocation({ methods: mockMethods }));

    await waitFor(() => {
      expect(result.current.cityList).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("should reset city when state changes", async () => {
    mockMethods.watch.mockImplementation((name: string) =>
      name === "stateId" ? 1 : undefined,
    );
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods }),
    );

    mockMethods.watch.mockImplementation((name: string) =>
      name === "stateId" ? 2 : undefined,
    );
    rerender();

    expect(mockMethods.setValue).toHaveBeenCalledWith("cityId", "");
  });

  describe("Edit Mode and Pre-filling", () => {
    it("should pre-fill countryCode in edit mode", () => {
      const data = { countryCode: "FR" };
      renderHook(() =>
        useLocation({ methods: mockMethods, isEditMode: true, data }),
      );
      expect(mockMethods.setValue).toHaveBeenCalledWith("countryCode", "FR");
    });

    it("should pre-fill stateId when stateList loads", async () => {
      const data = { countryCode: "IN", stateId: 2 };
      mockMethods.watch.mockImplementation((name: string) => {
        if (name === "countryCode") return "IN";
        return undefined;
      });

      renderHook(() =>
        useLocation({ methods: mockMethods, isEditMode: true, data }),
      );

      await waitFor(() => {
        expect(mockMethods.setValue).toHaveBeenCalledWith("stateId", "2");
      });
    });

    it("should not pre-fill stateId if it does not exist in the list", async () => {
      const data = { countryCode: "IN", stateId: 999 }; // 999 not in mockStates
      mockMethods.watch.mockImplementation((name: string) =>
        name === "countryCode" ? "IN" : undefined,
      );

      renderHook(() =>
        useLocation({ methods: mockMethods, isEditMode: true, data }),
      );

      await waitFor(() => {
        expect(mockMethods.setValue).not.toHaveBeenCalledWith("stateId", "999");
      });
    });

    it("should pre-fill cityId when cityList loads", async () => {
      const data = { countryCode: "IN", stateId: 1, cityId: 20 };
      mockMethods.watch.mockImplementation((name: string) => {
        if (name === "countryCode") return "IN";
        if (name === "stateId") return 1;
        return undefined;
      });

      const { result } = renderHook(() =>
        useLocation({ methods: mockMethods, isEditMode: true, data }),
      );

      await waitFor(() => {
        expect(result.current.cityList).toEqual(mockCities);
        expect(mockMethods.setValue).toHaveBeenCalledWith("cityId", "20");
      });
    });

    it("should reset cityId if pre-filled city does not exist in the list", async () => {
      const data = { stateId: 1, cityId: 999 }; // 999 not in mockCities
      mockMethods.watch.mockImplementation((name: string) =>
        name === "stateId" ? 1 : undefined,
      );

      renderHook(() =>
        useLocation({ methods: mockMethods, isEditMode: true, data }),
      );

      await waitFor(() => {
        expect(mockMethods.setValue).toHaveBeenCalledWith("cityId", "");
      });
    });

    it("should reset cityId with parent prefix if pre-filled city does not exist", async () => {
      const parent = "shipping";
      const data = { stateId: 1, cityId: 999 };
      mockMethods.watch.mockImplementation((name: string) =>
        name === "shipping.stateId" ? 1 : undefined,
      );

      renderHook(() =>
        useLocation({ methods: mockMethods, isEditMode: true, data, parent }),
      );

      await waitFor(() => {
        expect(mockMethods.setValue).toHaveBeenCalledWith(
          "shipping.cityId",
          "",
        );
      });
    });
  });

  describe("Parent Prefix", () => {
    it("should use parent prefix for watch and setValue", async () => {
      const parent = "billing";
      mockMethods.watch.mockImplementation((name: string) =>
        name === "billing.countryCode" ? "US" : undefined,
      );

      const { result } = renderHook(() =>
        useLocation({ methods: mockMethods, parent }),
      );

      expect(mockMethods.watch).toHaveBeenCalledWith("billing.countryCode");
      await waitFor(() => {
        expect(result.current.stateList).toHaveLength(2);
      });
    });

    it("should handle nested pre-filling for state and city", async () => {
      const parent = "shipping";
      const data = { countryCode: "FR", stateId: 1, cityId: 10 };
      mockMethods.watch.mockImplementation((name: string) => {
        if (name === "shipping.countryCode") return "FR";
        if (name === "shipping.stateId") return 1;
        return undefined;
      });

      renderHook(() =>
        useLocation({ methods: mockMethods, parent, isEditMode: true, data }),
      );

      await waitFor(() => {
        expect(mockMethods.setValue).toHaveBeenCalledWith(
          "shipping.countryCode",
          "FR",
        );
        expect(mockMethods.setValue).toHaveBeenCalledWith(
          "shipping.stateId",
          "1",
        );
        expect(mockMethods.setValue).toHaveBeenCalledWith(
          "shipping.cityId",
          "10",
        );
      });
    });
  });

  it("should not reset fields if in edit mode and code matches data", async () => {
    const data = { countryCode: "IN", stateId: 1 };
    mockMethods.watch.mockReturnValue("IN");
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods, isEditMode: true, data }),
    );
    mockMethods.watch.mockReturnValue("IN");
    rerender();
    expect(mockMethods.setValue).not.toHaveBeenCalledWith("stateId", "");
  });

  it("should not reset if stateId remains same in edit mode", async () => {
    const data = { stateId: 1 };
    mockMethods.watch.mockReturnValue(1);
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods, isEditMode: true, data }),
    );
    mockMethods.watch.mockReturnValue(1);
    rerender();
    expect(mockMethods.setValue).not.toHaveBeenCalledWith("cityId", "");
  });

  it("should handle case where data is missing in edit mode", () => {
    mockMethods.watch.mockReturnValue("IN");
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods, isEditMode: true, data: undefined }),
    );
    mockMethods.watch.mockReturnValue("US");
    rerender();
    expect(mockMethods.setValue).toHaveBeenCalledWith("stateId", "");
  });

  it("should handle empty response from getState and getCity", async () => {
    mockMethods.watch.mockReturnValue("IN");
    mockGetStateMutation.mockReturnValue({
      unwrap: () => Promise.resolve(null),
    });
    mockGetCityMutation.mockReturnValue({
      unwrap: () => Promise.resolve(null),
    });

    const { result } = renderHook(() => useLocation({ methods: mockMethods }));

    await waitFor(() => {
      expect(result.current.stateList).toEqual([]);
    });

    mockMethods.watch.mockReturnValue(1); // stateId
    await waitFor(() => {
      expect(result.current.cityList).toEqual([]);
    });
  });

  it("should use default stateId/cityId empty string if parent is provided", () => {
    const parent = "office";
    mockMethods.watch.mockReturnValue("IN");
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods, parent }),
    );

    mockMethods.watch.mockReturnValue("US");
    rerender();

    expect(mockMethods.setValue).toHaveBeenCalledWith("office.stateId", "");
    expect(mockMethods.setValue).toHaveBeenCalledWith("office.cityId", "");
  });

  it("should reset cityId if state change happens with parent", () => {
    const parent = "office";
    mockMethods.watch.mockReturnValue(1); // stateId
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods, parent }),
    );

    mockMethods.watch.mockReturnValue(2);
    rerender();

    expect(mockMethods.setValue).toHaveBeenCalledWith("office.cityId", "");
  });

  it("should handle stateId correctly even if it's 0", async () => {
    mockMethods.watch.mockReturnValue(0);
    renderHook(() => useLocation({ methods: mockMethods }));
    expect(mockGetCityMutation).not.toHaveBeenCalled();
  });

  it("should not reset fields if _prefilling is true", () => {
    mockMethods.getValues.mockReturnValue({ _prefilling: true });
    mockMethods.watch.mockReturnValue("IN");
    const { rerender } = renderHook(() =>
      useLocation({ methods: mockMethods }),
    );
    mockMethods.watch.mockReturnValue("US");
    rerender();
    expect(mockMethods.setValue).not.toHaveBeenCalledWith("stateId", "");
  });

  it("should handle missing getValues method", () => {
    const methodsWithoutGetValues = {
      watch: vi.fn().mockReturnValue("IN"),
      setValue: vi.fn(),
    };
    const { rerender } = renderHook(() =>
      useLocation({ methods: methodsWithoutGetValues }),
    );
    methodsWithoutGetValues.watch.mockReturnValue("US");
    rerender();
    expect(methodsWithoutGetValues.setValue).toHaveBeenCalledWith(
      "stateId",
      "",
    );
  });

  it("should clear lists when country is removed", async () => {
    mockMethods.watch.mockReturnValue("IN");
    const { result, rerender } = renderHook(() =>
      useLocation({ methods: mockMethods }),
    );

    await waitFor(() => {
      expect(result.current.stateList).toHaveLength(2);
    });

    mockMethods.watch.mockReturnValue(undefined);
    rerender();

    expect(result.current.stateList).toEqual([]);
    expect(result.current.cityList).toEqual([]);
  });
});
