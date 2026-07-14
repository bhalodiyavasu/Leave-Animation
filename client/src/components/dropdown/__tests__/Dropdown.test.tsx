import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dropdown } from "../Dropdown";

// Mock Radix UI
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick, className, variant }: any) => (
    <div
      data-testid="dropdown-item"
      data-variant={variant}
      onClick={onClick}
      className={className}
    >
      {children}
    </div>
  ),
}));

describe("Dropdown", () => {
  const mockOptions = [
    { label: "Option 1", value: "opt1", icon: <span data-testid="opt1-icon">Icon 1</span> },
    { label: "Option 2", value: "opt2", destructive: true },
  ];
  const mockOnSelect = vi.fn();

  it("renders trigger and options with icons and correct variants", () => {
    render(
      <Dropdown
        trigger={<button>Open</button>}
        options={mockOptions}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByTestId("dropdown-content")).toBeInTheDocument();

    const items = screen.getAllByTestId("dropdown-item");
    expect(items).toHaveLength(2);
    
    // Check first option (with icon, default variant)
    expect(items[0]).toHaveTextContent("Option 1");
    expect(screen.getByTestId("opt1-icon")).toBeInTheDocument();
    expect(items[0]).toHaveAttribute("data-variant", "default");

    // Check second option (no icon, destructive variant)
    expect(items[1]).toHaveTextContent("Option 2");
    expect(items[1]).toHaveAttribute("data-variant", "destructive");
  });

  it("calls onSelect and stops propagation when an item is clicked", async () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <Dropdown
          trigger={<button>Open</button>}
          options={mockOptions}
          onSelect={mockOnSelect}
        />
      </div>,
    );

    const items = screen.getAllByTestId("dropdown-item");
    fireEvent.click(items[0]);

    expect(mockOnSelect).toHaveBeenCalledWith("opt1");
    expect(parentClick).not.toHaveBeenCalled();
  });
});
