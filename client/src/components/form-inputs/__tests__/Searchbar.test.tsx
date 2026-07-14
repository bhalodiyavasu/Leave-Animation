import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Searchbar } from "../../form-inputs/Searchbar";
import userEvent from "@testing-library/user-event";

describe("Searchbar", () => {
  it("should render input with placeholder", () => {
    render(<Searchbar placeholder="Search items..." />);
    expect(screen.getByPlaceholderText("Search items...")).toBeInTheDocument();
  });

  it("should handle input change", async () => {
    const onChange = vi.fn();
    render(<Searchbar onChange={onChange} />);

    const input = screen.getByRole("searchbox"); // Input type="search" has role searchbox
    await userEvent.type(input, "query");

    // Expect cumulative calls
    expect(onChange).toHaveBeenCalledWith("q");
    expect(onChange).toHaveBeenCalledWith("qu");
    expect(onChange).toHaveBeenCalledWith("que");
    expect(onChange).toHaveBeenCalledWith("quer");
    expect(onChange).toHaveBeenCalledWith("query");
  });
});
