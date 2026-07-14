import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ArrayInputField from "../ArrayInputField";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import React from "react";

// Mock UI components
vi.mock("@/components/ui/form", () => ({
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render }: any) => render({ field: {}, fieldState: {} }),
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
  FormMessage: () => <div data-testid="form-message" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, type, className }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="add-button"
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="plus-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

// Mock react-hook-form and preserve actual where needed
vi.mock("react-hook-form", async () => {
  const actual: any = await vi.importActual("react-hook-form");
  return {
    ...actual,
    useFormContext: vi.fn(),
  };
});

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues });
  // By default, make useFormContext return the methods from useForm
  (useFormContext as any).mockReturnValue(methods);
  return <FormProvider {...methods}>{children(methods.control)}</FormProvider>;
};

describe("ArrayInputField", () => {
  const defaultProps = {
    name: "testField",
    label: "Test Label",
    placeholder: "Test Placeholder",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with label and placeholder", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Test Placeholder")).toBeInTheDocument();
  });

  it("shows asterisk when isRequired is true", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} isRequired={true} />}
      </TestWrapper>
    );

    const label = screen.getByTestId("form-label");
    expect(label).toHaveTextContent("*");
  });

  it("renders existing items correctly", () => {
    render(
      <TestWrapper defaultValues={{ testField: ["Item 1", "Item 2"] }}>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("adds a new item on button click", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText("Test Placeholder");
    const addButton = screen.getByTestId("add-button");

    fireEvent.change(input, { target: { value: "New Item" } });
    fireEvent.click(addButton);

    expect(screen.getByText("New Item")).toBeInTheDocument();
  });

  it("adds a new item on Enter key down", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText("Test Placeholder");

    fireEvent.change(input, { target: { value: "Enter Item" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getByText("Enter Item")).toBeInTheDocument();
  });

  it("does not add item on non-Enter key down", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText("Test Placeholder");

    fireEvent.change(input, { target: { value: "Non-Enter Item" } });
    fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

    expect(screen.queryByText("Non-Enter Item")).not.toBeInTheDocument();
  });

  it("does not add empty or whitespace-only items", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText("Test Placeholder");
    const addButton = screen.getByTestId("add-button");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(addButton);

    expect(screen.queryByTestId("x-icon")).not.toBeInTheDocument();
  });

  it("removes an item when the X button is clicked", () => {
    render(
      <TestWrapper defaultValues={{ testField: ["Remove Me"] }}>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    const removeButton = screen.getByTestId("x-icon").parentElement!;
    fireEvent.click(removeButton);

    expect(screen.queryByText("Remove Me")).not.toBeInTheDocument();
  });

  it("behaves correctly in disabled state", () => {
    render(
      <TestWrapper defaultValues={{ testField: ["Item 1"] }}>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} disabled={true} />}
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText("Test Placeholder")).toBeDisabled();
    expect(screen.getByTestId("add-button")).toBeDisabled();
    expect(screen.queryByTestId("x-icon")).not.toBeInTheDocument();
  });

  it("handles null values from getValues and watch for 100% branch coverage", () => {
      const mockSetValue = vi.fn();
      const mockGetValues = vi.fn().mockReturnValue(null);
      const mockWatch = vi.fn().mockReturnValue(null);

      (useFormContext as any).mockReturnValue({
          setValue: mockSetValue,
          getValues: mockGetValues,
          watch: mockWatch,
      });

      render(<ArrayInputField {...defaultProps} control={{} as any} />);

      expect(screen.getByText("No items added yet.")).toBeInTheDocument();

      const input = screen.getByPlaceholderText("Test Placeholder");
      fireEvent.change(input, { target: { value: "Item" } });
      fireEvent.click(screen.getByTestId("add-button"));

      expect(mockSetValue).toHaveBeenCalledWith(defaultProps.name, ["Item"], { shouldValidate: true });
  });

  it("handles null currentValues during removal for 100% branch coverage", () => {
    const mockSetValue = vi.fn();
    const mockGetValues = vi.fn().mockReturnValue(null);
    const mockWatch = vi.fn().mockReturnValue(["Item 1"]); // Start with an item

    (useFormContext as any).mockReturnValue({
        setValue: mockSetValue,
        getValues: mockGetValues,
        watch: mockWatch,
    });

    render(<ArrayInputField {...defaultProps} control={{} as any} />);

    const removeButton = screen.getByTestId("x-icon").parentElement!;
    fireEvent.click(removeButton);

    // Should hit `const currentValues = getValues(name) || [];` and filter []
    expect(mockSetValue).toHaveBeenCalledWith(defaultProps.name, [], { shouldValidate: true });
  });

  it("disables add button unless input has value", () => {
    render(
      <TestWrapper>
        {(control: any) => <ArrayInputField {...defaultProps} control={control} />}
      </TestWrapper>
    );

    const input = screen.getByPlaceholderText("Test Placeholder");
    const addButton = screen.getByTestId("add-button");

    // Initially disabled because it's empty
    expect(addButton).toBeDisabled();

    // Enabled after typing
    fireEvent.change(input, { target: { value: "New Item" } });
    expect(addButton).not.toBeDisabled();

    // Disabled again after clearing text
    fireEvent.change(input, { target: { value: "   " } });
    expect(addButton).toBeDisabled();
  });
});