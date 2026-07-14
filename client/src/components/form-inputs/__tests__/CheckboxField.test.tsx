import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CheckboxField from "../CheckboxField";
import { useForm, FormProvider } from "react-hook-form";
import userEvent from "@testing-library/user-event";

// Mock the UI components to have stable IDs and data-testids if needed
// However, the original code uses "@/components/ui/form" and "@/components/ui/checkbox"
// The user's test already works with the real components (or their existing mocks)
// Let's stick to the user's style but add more cases.

const TestWrapper = ({ children, defaultValues = { checkField: false } }: any) => {
  const methods = useForm({ defaultValues });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(vi.fn())}>
        {children(methods.control)}
      </form>
    </FormProvider>
  );
};

describe("CheckboxField", () => {
  describe("Controlled Mode (react-hook-form)", () => {
    it("should render label and checkbox", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <CheckboxField
              control={control}
              name="checkField"
              label="Check Label"
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByLabelText(/Check Label/i)).toBeInTheDocument();
    });

    it("should toggle checkbox", async () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <CheckboxField
              control={control}
              name="checkField"
              label="Check Label"
            />
          )}
        </TestWrapper>
      );

      const checkbox = screen.getByLabelText(/Check Label/i);
      await userEvent.click(checkbox);
      expect(checkbox).toBeChecked();

      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <CheckboxField
              control={control}
              name="checkField"
              label="Disabled Check"
              disabled={true}
            />
          )}
        </TestWrapper>
      );

      const checkbox = screen.getByLabelText(/Disabled Check/i);
      expect(checkbox).toBeDisabled();
    });

    it("should apply custom className", () => {
        const { container } = render(
          <TestWrapper>
            {(control: any) => (
              <CheckboxField
                control={control}
                name="checkField"
                label="Class Check"
                className="custom-class"
              />
            )}
          </TestWrapper>
        );
        
        // The FormItem has the className
        const formItem = container.querySelector('.custom-class');
        expect(formItem).toBeInTheDocument();
    });
  });

  describe("Standalone Mode", () => {
    it("should render label and checkbox correctly", () => {
      render(
        <CheckboxField 
          label="Standalone Label" 
          checked={true} 
        />
      );

      const checkbox = screen.getByLabelText(/Standalone Label/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it("should call onCheckedChange when toggled", async () => {
      const onCheckedChange = vi.fn();
      render(
        <CheckboxField 
          label="Toggle Label" 
          onCheckedChange={onCheckedChange} 
        />
      );

      const checkbox = screen.getByLabelText(/Toggle Label/i);
      await userEvent.click(checkbox);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <CheckboxField 
          label="Disabled Standalone" 
          disabled={true} 
        />
      );

      const checkbox = screen.getByLabelText(/Disabled Standalone/i);
      expect(checkbox).toBeDisabled();
    });

    it("should use name as ID if provided", () => {
        render(<CheckboxField label="Explicit ID" name="explicit-id" />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox.id).toBe('explicit-id');
    });

    it("should generate ID from label if name is missing", () => {
        render(<CheckboxField label="My Label with Spaces" />);
        const checkbox = screen.getByRole('checkbox');
        // label.toLowerCase().replace(/\s+/g, "N/A")
        expect(checkbox.id).toBe('myN/AlabelN/AwithN/Aspaces');
    });

    it("should apply custom className", () => {
        const { container } = render(
            <CheckboxField label="Class Check" className="standalone-class" />
        );
        const div = container.querySelector('.standalone-class');
        expect(div).toBeInTheDocument();
    });
  });
});
