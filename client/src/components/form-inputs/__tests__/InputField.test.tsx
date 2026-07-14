import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InputField from "../InputField";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import userEvent from "@testing-library/user-event";

const TestWrapper = ({ children, onSubmit = vi.fn() }: any) => {
  const form = useForm({
    defaultValues: {
      testField: "",
      numberField: "",
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children(form.control)}
      </form>
    </Form>
  );
};

describe("InputField", () => {
  it("should render label and input", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <InputField
            control={control}
            name="testField"
            label="Test Label"
            placeholder="Enter text"
          />
        )}
      </TestWrapper>,
    );

    expect(screen.getByLabelText(/Test Label/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("should handle text input", async () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <InputField control={control} name="testField" label="Test Label" />
        )}
      </TestWrapper>,
    );

    const input = screen.getByLabelText(/Test Label/i);
    await userEvent.type(input, "Hello World");
    expect(input).toHaveValue("Hello World");
  });

  it("should handle number input", async () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <InputField
            control={control}
            name="numberField"
            label="Number Label"
            type="number"
          />
        )}
      </TestWrapper>,
    );

    const input = screen.getByLabelText(/Number Label/i);
    await userEvent.type(input, "123");
    expect(input).toHaveValue(123);
  });

  it("should show required asterisk", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <InputField
            control={control}
            name="testField"
            label="Required Field"
            isRequired
          />
        )}
      </TestWrapper>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility", async () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <InputField
              control={control}
              name="testField"
              label="Password"
              type="password"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Password/i);
      const toggleButton = screen.getByRole("button");

      expect(input).toHaveAttribute("type", "password");

      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute("type", "text");

      await userEvent.click(toggleButton);
      expect(input).toHaveAttribute("type", "password");
    });
  });

  describe("Constraints and Validation", () => {
    it("should prevent decimal input when integerOnly is true", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <InputField
              control={control}
              name="numberField"
              label="Integer Only"
              type="number"
              integerOnly
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Integer Only/i);
      const event = new KeyboardEvent("keydown", { key: ".", bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      
      fireEvent(input, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should truncate decimals when step is 1", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <InputField
              control={control}
              name="numberField"
              label="Step 1"
              type="number"
              step="1"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText(/Step 1/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "123.45" } });
      expect(input.value).toBe("123");
    });

    it("should remove leading zeros for number type", () => {
        render(
          <TestWrapper>
            {(control: any) => (
              <InputField
                control={control}
                name="numberField"
                label="Number"
                type="number"
              />
            )}
          </TestWrapper>
        );
  
        const input = screen.getByLabelText(/Number/i) as HTMLInputElement;
        fireEvent.change(input, { target: { value: "00123" } });
        expect(input.value).toBe("123");
      });

    it("should clamp value to min", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <InputField
              control={control}
              name="numberField"
              label="Min 10"
              type="number"
              min={10}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByRole("spinbutton") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "5" } });
      expect(input.value).toBe("10");
    });

    it("should select text on focus for number inputs", () => {
        render(
          <TestWrapper>
            {(control: any) => (
              <InputField
                control={control}
                name="numberField"
                label="Number"
                type="number"
              />
            )}
          </TestWrapper>
        );
  
        const input = screen.getByRole("spinbutton") as HTMLInputElement;
        const selectSpy = vi.spyOn(input, "select");
        fireEvent.focus(input);
        expect(selectSpy).toHaveBeenCalled();
      });
  });

  describe("Standalone Mode", () => {
    it("should work without react-hook-form control", () => {
      const onChange = vi.fn();
      render(
        <InputField
          label="Standalone"
          name="standalone"
          value="Initial"
          onChange={onChange}
        />
      );

      const input = screen.getByLabelText(/Standalone/i);
      expect(input).toHaveValue("Initial");

      fireEvent.change(input, { target: { value: "New Value" } });
      expect(onChange).toHaveBeenCalled();
    });

    it("should show help text when isNewPassword is true", () => {
        render(
          <InputField
            name="newPassword"
            label="New Password"
          />
        );
        expect(screen.getByText(/Password must contain 1 number/i)).toBeInTheDocument();
      });
  });

  describe("Layout and Visibility", () => {
    it("should handle isLabelWithText and textAfterLabel", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <InputField
              control={control}
              name="testField"
              label="WithText"
              isLabelWithText
              textAfterLabel={<span>Extra</span>}
            />
          )}
        </TestWrapper>
      );
      expect(screen.getByText("Extra")).toBeInTheDocument();
      expect(screen.getByText(/WithText/i)).toBeInTheDocument();
    });

    it("should hide input when hideInput is true", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <InputField
              control={control}
              name="testField"
              label="HiddenLabel"
              hideInput
            />
          )}
        </TestWrapper>
      );
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByText(/HiddenLabel/i)).toBeInTheDocument();
    });

    it("should apply disabled styling and attributes", () => {
        render(
          <TestWrapper>
            {(control: any) => (
              <InputField
                control={control}
                name="testField"
                label="Disabled"
                disabled
              />
            )}
          </TestWrapper>
        );
        const input = screen.getByLabelText(/Disabled/i);
        expect(input).toBeDisabled();
        expect(input).toHaveClass("disabled:bg-muted");
      });
  });

  describe("Event Callbacks", () => {
      it("should trigger onKeyDown and onPaste callbacks", () => {
          const onKeyDown = vi.fn();
          const onPaste = vi.fn();

          render(
              <InputField
                  label="Events"
                  name="events"
                  onKeyDown={onKeyDown}
                  onPaste={onPaste}
              />
          );

          const input = screen.getByLabelText(/Events/i);
          
          fireEvent.keyDown(input, { key: "Enter" });
          expect(onKeyDown).toHaveBeenCalled();

          fireEvent.paste(input);
          expect(onPaste).toHaveBeenCalled();
      });
  });
});
