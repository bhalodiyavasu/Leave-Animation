import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar } from "../FilterBar";
import userEvent from "@testing-library/user-event";

describe("FilterBar", () => {
  it("should render children", () => {
    render(
      <FilterBar>
        <div>Filter Input</div>
      </FilterBar>,
    );

    expect(screen.getByText("Filter Input")).toBeInTheDocument();
  });

  it("should handle apply and reset", async () => {
    const onApply = vi.fn();
    const onReset = vi.fn();

    render(
      <FilterBar onApply={onApply} onReset={onReset}>
        <div>Filter</div>
      </FilterBar>,
    );

    await userEvent.click(screen.getByText("Apply"));
    expect(onApply).toHaveBeenCalled();

    await userEvent.click(screen.getByText("Reset"));
    expect(onReset).toHaveBeenCalled();
  });
});
