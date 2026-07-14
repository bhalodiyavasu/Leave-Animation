import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PaginationBar } from "../PaginationBar";
import userEvent from "@testing-library/user-event";

// Mock SelectInput
vi.mock("@/components/form-inputs/SelectInput", () => ({
  default: ({ value, onChange, disabled, options, placeholder }: any) => (
    <div data-testid="select-wrapper">
      <select
        data-testid="mock-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe("PaginationBar", () => {
  it("should render pagination info", () => {
    render(
      <PaginationBar
        page={1}
        pageSize={10}
        total={25}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Showing 1–10 of/)).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("should handle page navigation", async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationBar
        page={1}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
      />,
    );

    const buttons = screen.getAllByRole("button");
    // buttons[0] is Prev, buttons[1] is Next
    const prevButton = buttons[0];
    const nextButton = buttons[1];

    expect(prevButton).toBeDisabled();

    // Click Next
    await userEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("should handle previous page navigation", async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationBar
        page={2}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const prevButton = buttons[0];

    await userEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("should handle page size change", async () => {
    const onPageSizeChange = vi.fn();
    render(
      <PaginationBar
        page={1}
        pageSize={10}
        total={25}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    const select = screen.getByTestId("mock-select");
    fireEvent.change(select, { target: { value: "20" } });

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it("should disable controls when isLoading is true", () => {
    render(
      <PaginationBar
        page={1}
        pageSize={10}
        total={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        isLoading={true}
      />,
    );

    expect(screen.getByTestId("mock-select")).toBeDisabled();
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("should disable next button on last page", () => {
    render(
      <PaginationBar
        page={3}
        pageSize={10}
        total={25}
        onPageChange={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button");
    const nextButton = buttons[1];
    expect(nextButton).toBeDisabled();
  });

  it("should handle total=0 case", () => {
    render(
      <PaginationBar page={1} pageSize={10} total={0} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText(/Showing 0–0 of/)).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toBeDisabled(); // Next button
  });

  it("should handle case without onPageSizeChange", () => {
    render(
      <PaginationBar
        page={1}
        pageSize={10}
        total={25}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("mock-select")).not.toBeInTheDocument();
  });

  it("should respect the end calculation for the last page", () => {
    render(
      <PaginationBar
        page={3}
        pageSize={10}
        total={25}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Showing 21–25 of/)).toBeInTheDocument();
  });
});
