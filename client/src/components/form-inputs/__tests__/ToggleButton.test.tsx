import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useForm, FormProvider } from "react-hook-form";
import ToggleButton from "../ToggleButton";
import { Form } from "@/components/ui/form";

const TestWrapper = ({
  children,
  defaultValues = { toggle: false },
}: any) => {
  const methods = useForm({ defaultValues });
  return (
    <Form {...methods}>
      <form>{children(methods.control)}</form>
    </Form>
  );
};

describe("ToggleButton", () => {
  describe("Form Mode", () => {
    it("should render correctly with initial value", () => {
      render(
        <TestWrapper defaultValues={{ toggle: true }}>
          {(control: any) => (
            <ToggleButton
              control={control}
              name="toggle"
              className="custom-class"
            />
          )}
        </TestWrapper>
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute("data-state", "checked");
      expect(toggle).toHaveClass("custom-class");
    });

    it("should call onChange and update form when toggled", async () => {
      const handleChange = vi.fn();
      render(
        <TestWrapper>
          {(control: any) => (
            <ToggleButton
              control={control}
              name="toggle"
              onChange={handleChange}
            />
          )}
        </TestWrapper>
      );

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(handleChange).toHaveBeenCalledWith(true);
      expect(toggle).toHaveAttribute("data-state", "checked");
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <TestWrapper>
          {(control: any) => (
            <ToggleButton
              control={control}
              name="toggle"
              disabled
            />
          )}
        </TestWrapper>
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeDisabled();
    });
  });

  describe("Standalone Mode", () => {
    it("should render with provided checked value", () => {
      render(
        <ToggleButton
          name="standalone-toggle"
          checked={true}
          onChange={() => {}}
          className="standalone-class"
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute("data-state", "checked");
      expect(toggle).toHaveClass("standalone-class");
    });

    it("should call onChange when clicked", () => {
      const handleChange = vi.fn();
      render(
        <ToggleButton
          name="standalone-toggle"
          checked={false}
          onChange={handleChange}
        />
      );

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <ToggleButton
          name="standalone-toggle"
          checked={false}
          onChange={() => {}}
          disabled
        />
      );

      const toggle = screen.getByRole("switch");
      expect(toggle).toBeDisabled();
    });
  });
});