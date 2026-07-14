import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InputTextArea from "../InputTextArea";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import userEvent from "@testing-library/user-event";

const TestWrapper = ({ children, onSubmit = vi.fn() }: any) => {
  const form = useForm({
    defaultValues: {
      textField: "",
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

describe("InputTextArea", () => {
  it("should render label and textarea", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <InputTextArea
            control={control}
            name="textField"
            label="Text Label"
            placeholder="Enter text"
          />
        )}
      </TestWrapper>,
    );

    expect(screen.getByText(/Text Label/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("should handle text input", async () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <InputTextArea
            control={control}
            name="textField"
            label="Text Label"
            placeholder="Enter text"
          />
        )}
      </TestWrapper>,
    );

    const input = screen.getByPlaceholderText("Enter text");
    await userEvent.type(input, "Hello World");
    expect(input).toHaveValue("Hello World");
  });
});
