import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useEffect } from "react";
import SelectInput from "../SelectInput";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

// Mock implementation for DropdownMenu to easily test interactions
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="mock-dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children, disabled, className, "aria-invalid": ariaInvalid }: any) => (
    <button
      data-testid="mock-select"
      data-disabled={disabled}
      data-invalid={ariaInvalid}
      className={className}
    >
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children }: any) => <div data-testid="mock-content">{children}</div>,
  DropdownMenuItem: ({ children, onSelect, value }: any) => (
    <div
      data-testid="select-item"
      data-value={value}
      onClick={() => onSelect?.(value)}
    >
      {children}
      <button
        data-testid="manual-select"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.("non-existent-val");
        }}
        style={{ display: "none" }}
      >
        Manual
      </button>
    </div>
  ),
  DropdownMenuLabel: ({ children }: any) => (
    <div data-testid="select-label">{children}</div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="select-separator" />,
}));

// Mock useCurrentValue for testing (if needed, but it's not used in SelectInput)
// Actually SelectInput uses renderOptions which calls onSelect that calls field.onChange

// We juga need to mock CheckIcon and ChevronDownIcon if we want to be precise, 
// but lucide-react is usually okay or mocked globally.

const TestWrapper = ({
  children,
  defaultValues = { selectField: "" },
}: any) => {
  const form = useForm({ defaultValues });
  return (
    <Form {...form}>
      <form>{children(form.control)}</form>
    </Form>
  );
};

const options = [
  { name: "Option 1", value: "opt1" },
  { name: "Option 2", value: "opt2" },
];

const groupedOptions = [
  {
    name: "Group 1",
    data: [
      { name: "G1 Opt 1", value: "g1-opt1" },
      { name: "G1 Opt 2", value: "g1-opt2" },
    ],
  },
  { name: "Normal Opt", value: "normal-opt" },
];

describe("SelectInput", () => {
  it("should render label and placeholder", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            label="Select Label"
            placeholder="Select an option"
            options={options}
          />
        )}
      </TestWrapper>,
    );

    expect(screen.getByText(/Select Label/i)).toBeInTheDocument();
    expect(screen.getByTestId("mock-select")).toHaveTextContent(
      "Select an option",
    );
  });

  it("should render grouped options correctly", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={groupedOptions}
          />
        )}
      </TestWrapper>,
    );

    expect(screen.getByTestId("select-label")).toHaveTextContent("Group 1");
    expect(screen.getByTestId("select-label")).toHaveTextContent("Group 1");
    expect(screen.getByText("G1 Opt 1")).toBeInTheDocument();
    expect(screen.getByTestId("select-separator")).toBeInTheDocument();
  });

  it("should select a grouped option", () => {
    const handleChange = vi.fn();
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={groupedOptions}
            onChange={handleChange}
          />
        )}
      </TestWrapper>,
    );

    const groupItem = screen.getByText("G1 Opt 1");
    fireEvent.click(groupItem);

    expect(handleChange).toHaveBeenCalledWith("g1-opt1");
  });

  it("should show check icon for selected option", () => {
    render(
      <TestWrapper defaultValues={{ selectField: "opt1" }}>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={options}
          />
        )}
      </TestWrapper>,
    );

    // SelectInput renders {option.name} and the check icon.
    // There are two "Option 1" texts: one in the trigger and one in the item.
    const trigger = screen.getByTestId("mock-select");
    expect(trigger).toHaveTextContent("Option 1");

    const content = screen.getByTestId("mock-content");
    const item = within(content).getByText("Option 1");
    expect(item).toBeInTheDocument();
    
    // Check for the span that contains the CheckIcon
    const checkIconContainer = item.querySelector("span");
    expect(checkIconContainer).toBeInTheDocument();
  });

  it("should call onChange when value changes and normalize values", () => {
    const handleChange = vi.fn();
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={[{ name: "Test", value: "val-1" }]}
            onChange={handleChange}
          />
        )}
      </TestWrapper>,
    );

    const selectTrigger = screen.getByTestId("mock-select");
    fireEvent.click(selectTrigger);

    // After clicking trigger, the content should be "rendered" (in our mock it always is)
    const item = screen.getByText("Test");
    fireEvent.click(item);

    expect(handleChange).toHaveBeenCalledWith("val-1");
  });

  it("should handle object values with code property", () => {
    render(
      <TestWrapper defaultValues={{ selectField: { code: "val-1" } }}>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={[{ name: "Test", value: "val-1" }]}
          />
        )}
      </TestWrapper>,
    );

    const select = screen.getByTestId("mock-select");
    expect(select).toHaveTextContent("Test");
  });

  it("should handle error state correctly without React warning", () => {
    const ErrorWrapper = () => {
      const form = useForm();
      const { setError } = form;

      useEffect(() => {
        setError("selectField", {
          type: "manual",
          message: "Error Message",
        });
      }, [setError]);

      return (
        <Form {...form}>
          <SelectInput
            control={form.control}
            name="selectField"
            placeholder="Select"
            options={options}
          />
        </Form>
      );
    };

    render(<ErrorWrapper />);
    expect(screen.getByText("Error Message")).toBeInTheDocument();
  });

  it("should respect hideLabel and isRequired props in standalone mode", () => {
    const { rerender } = render(
      <SelectInput
        name="standalone"
        value=""
        onChange={vi.fn()}
        options={options}
        placeholder="Select"
        label="Label"
        hideLabel={true}
      />,
    );

    expect(screen.queryByText("Label")).not.toBeInTheDocument();

    rerender(
      <SelectInput
        name="standalone"
        value=""
        onChange={vi.fn()}
        options={options}
        placeholder="Select"
        label="Label"
        hideLabel={false}
        isRequired={true}
      />,
    );

    expect(screen.getByText(/Label/)).toHaveTextContent("*");

    rerender(
      <SelectInput
        name="standalone"
        value=""
        onChange={vi.fn()}
        options={options}
        placeholder="Select"
        label="Label"
        isRequired={false}
      />,
    );
    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByText("Label")).not.toHaveTextContent("*");
  });

  it("should use external value in form mode if provided", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={options}
            value="opt1"
          />
        )}
      </TestWrapper>,
    );

    const select = screen.getByTestId("mock-select");
    expect(select).toHaveTextContent("Option 1");
  });

  it("should fallback to val if original option not found in onValueChange", () => {
    const handleChange = vi.fn();
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={[{ name: "Other", value: "other" }]}
            onChange={handleChange}
          />
        )}
      </TestWrapper>,
    );

    const manualTrigger = screen.getAllByTestId("manual-select")[0];
    fireEvent.click(manualTrigger);

    expect(handleChange).toHaveBeenCalledWith("other");
  });

  it("should pass disabled prop to Select", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            placeholder="Select"
            options={options}
            disabled
          />
        )}
      </TestWrapper>,
    );

    const select = screen.getByTestId("mock-select");
    expect(select).toHaveAttribute("data-disabled", "true");
  });

  it("should work in standalone mode (no control)", () => {
    const handleChange = vi.fn();
    render(
      <SelectInput
        name="standalone"
        placeholder="Select"
        options={options}
        value="opt2"
        onChange={handleChange}
      />,
    );

    expect(screen.getByTestId("mock-select")).toHaveTextContent("Option 2");
    
    const item = screen.getByText("Option 1");
    fireEvent.click(item);
    expect(handleChange).toHaveBeenCalledWith("opt1");
  });

  it("should respect isRequired in form mode", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <SelectInput
            control={control}
            name="selectField"
            label="Required Form Label"
            placeholder="Select"
            options={options}
            isRequired={true}
          />
        )}
      </TestWrapper>,
    );
    expect(screen.getByText(/Required Form Label/)).toHaveTextContent("*");
  });
});
