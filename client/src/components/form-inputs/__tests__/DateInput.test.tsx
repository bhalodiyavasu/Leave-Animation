import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DateInput from "../DateInput";
import { useForm, FormProvider } from "react-hook-form";
import React from "react";
import userEvent from "@testing-library/user-event";

// Use a shared state for the popover mock to handle open/close correctly
let popoverOpen = false;

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children, open }: any) => {
    popoverOpen = open;
    return <div data-testid="popover">{children}</div>;
  },
  PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: any) => (
    popoverOpen ? <div data-testid="popover-content">{children}</div> : null
  ),
}));

// Mock Calendar with full logic support for coverage
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect, selected, disabled }: any) => (
    <div data-testid="mock-calendar">
      <button
        type="button"
        onClick={() => onSelect(new Date("2023-01-15"))}
        disabled={disabled ? disabled(new Date("2023-01-15")) : false}
        data-testid="calendar-date-select"
      >
        Select 15-01-2023
      </button>
      <button
        type="button"
        onClick={() => onSelect(new Date("2020-01-01"))}
        disabled={disabled ? disabled(new Date("2020-01-01")) : false}
        data-testid="calendar-date-past"
      >
        Select Past
      </button>
      <button
        type="button"
        onClick={() => onSelect(new Date("2025-01-01"))}
        disabled={disabled ? disabled(new Date("2025-01-01")) : false}
        data-testid="calendar-date-future"
      >
        Select Future
      </button>
      <button
        type="button"
        onClick={() => onSelect(null)}
        data-testid="calendar-date-clear"
      >
        Clear Date
      </button>
      <div data-testid="selected-date">
        {selected ? selected.toISOString() : "No Selection"}
      </div>
    </div>
  ),
}));

const TestWrapper = ({ children, defaultValues = { dateField: "" } }: any) => {
  const methods = useForm({ defaultValues });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(vi.fn())}>
        {children(methods.control)}
      </form>
    </FormProvider>
  );
};

describe("DateInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    popoverOpen = false;
  });

  const getTrigger = () => screen.getByRole("button");

  describe("Controlled Mode", () => {
    it("should render label and button with correct placeholder", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <DateInput control={control} name="dateField" label="Date Label" />
          )}
        </TestWrapper>
      );

      expect(screen.getByText(/Date Label/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("DD-MM-YYYY")).toBeInTheDocument();
    });

    it("should show asterisk when isRequired is true", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <DateInput control={control} name="dateField" label="Required Date" isRequired={true} />
          )}
        </TestWrapper>
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should display formatted date when value exists in form", () => {
      const defaultValue = "2023-01-01T00:00:00.000Z";
      render(
        <TestWrapper defaultValues={{ dateField: defaultValue }}>
          {(control: any) => (
            <DateInput control={control} name="dateField" />
          )}
        </TestWrapper>
      );

      expect(screen.getByDisplayValue("01-01-2023")).toBeInTheDocument();
    });
  });

  describe("Uncontrolled / Standalone Mode", () => {
    it("should render correctly in standalone mode", () => {
      const { rerender } = render(
        <DateInput 
          label="Standalone Date" 
          value="2023-01-01T00:00:00.000Z" 
          onChange={vi.fn()} 
        />
      );

      expect(screen.getByText(/Standalone Date/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("01-01-2023")).toBeInTheDocument();

      // Test null value branch
      rerender(
        <DateInput 
          label="Standalone Date" 
          value={null} 
          onChange={vi.fn()} 
        />
      );
      expect(screen.getByPlaceholderText("DD-MM-YYYY")).toBeInTheDocument();
    });

    it("should support Date object as value", () => {
      const date = new Date("2023-05-20");
      render(<DateInput value={date} onChange={vi.fn()} />);
      expect(screen.getByDisplayValue("20-05-2023")).toBeInTheDocument();
    });

    it("should show required asterisk in standalone mode", () => {
      render(<DateInput label="Required" isRequired={true} value={null} onChange={vi.fn()} />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should apply error styling when error prop is provided", () => {
      render(<DateInput value={null} onChange={vi.fn()} error="Required field" />);
      const input = screen.getByPlaceholderText("DD-MM-YYYY");
      expect(input).toHaveClass("!border-destructive");
    });

    it("should throw error if onChange is missing in uncontrolled mode", () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => {
            // @ts-expect-error - intentionally missing onChange to test runtime error
            render(<DateInput value={null} label="Oops" />);
        }).toThrow("DateInput: onChange is required for uncontrolled usage");
        consoleSpy.mockRestore();
    });
  });

  describe("Functionality", () => {
    it("should toggle popover on button click", async () => {
      const user = userEvent.setup();
      render(<DateInput value={null} onChange={vi.fn()} />);
      
      const button = getTrigger();
      await user.click(button);
      
      expect(screen.getByTestId("popover-content")).toBeInTheDocument();
    });

    it("should call onChange when selecting a date in the calendar", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<DateInput value={null} onChange={onChange} />);

      await user.click(getTrigger());
      await user.click(screen.getByTestId("calendar-date-select"));

      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("2023-01-15"));
    });

    it("should call onChange with null when clearing the date in calendar", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<DateInput value="2023-01-01" onChange={onChange} />);

      await user.click(getTrigger());
      await user.click(screen.getByTestId("calendar-date-clear"));

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("should handle minDate and maxDate validation", async () => {
      const user = userEvent.setup();
      const minDate = new Date(2023, 0, 10); // Jan 10
      const maxDate = new Date(2023, 0, 20); // Jan 20
      
      const { rerender } = render(
        <DateInput 
          value={null} 
          onChange={vi.fn()} 
          minDate={minDate} 
          maxDate={maxDate} 
        />
      );

      await user.click(getTrigger());

      expect(screen.getByTestId("calendar-date-select")).not.toBeDisabled();
      expect(screen.getByTestId("calendar-date-past")).toBeDisabled();
      expect(screen.getByTestId("calendar-date-future")).toBeDisabled();

      // Test with only minDate
      rerender(
        <DateInput 
          value={null} 
          onChange={vi.fn()} 
          minDate={minDate} 
        />
      );
      expect(screen.getByTestId("calendar-date-past")).toBeDisabled();
      expect(screen.getByTestId("calendar-date-future")).not.toBeDisabled();

      // Test with only maxDate
      rerender(
        <DateInput 
          value={null} 
          onChange={vi.fn()} 
          maxDate={maxDate} 
        />
      );
      expect(screen.getByTestId("calendar-date-past")).not.toBeDisabled();
      expect(screen.getByTestId("calendar-date-future")).toBeDisabled();
    });

    it("should handle hidden input change (autofill setting)", () => {
      const onChange = vi.fn();
      const { container } = render(<DateInput value={null} onChange={onChange} />);
      
      const hiddenInput = container.querySelector('input[type="date"]')!;
      fireEvent.change(hiddenInput, { target: { value: "2023-12-25" } });
      
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("2023-12-25"));
    });

    it("should handle hidden input clear (autofill clearing)", () => {
        const onChange = vi.fn();
        const { container } = render(<DateInput value="2023-12-25" onChange={onChange} />);
        
        const hiddenInput = container.querySelector('input[type="date"]')!;
        fireEvent.change(hiddenInput, { target: { value: "" } });
        
        expect(onChange).toHaveBeenCalledWith(null);
      });

    it("should be disabled when disabled prop is true", () => {
      render(<DateInput value={null} onChange={vi.fn()} disabled />);
      const button = getTrigger();
      expect(button).toBeDisabled();
    });

    it("should allow manual text entry and trigger onChange on valid date", async () => {
      const onChange = vi.fn();
      render(<DateInput value={null} onChange={onChange} />);
      const input = screen.getByPlaceholderText("DD-MM-YYYY");
      
      await userEvent.type(input, "15012023");
      expect(input).toHaveValue("15-01-2023");
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining("2023-01-15"));
    });

    it("should reset to last valid date on blur when invalid date is typed", async () => {
      const onChange = vi.fn();
      render(<DateInput value="2023-01-15T00:00:00.000Z" onChange={onChange} />);
      const input = screen.getByDisplayValue("15-01-2023");
      
      await userEvent.clear(input);
      await userEvent.type(input, "99999999");
      expect(input).toHaveValue("99-99-9999");
      
      fireEvent.blur(input);
      expect(input).toHaveValue("15-01-2023");
    });
  });
});
