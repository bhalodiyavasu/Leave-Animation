import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import UploadInput from "../UploadInput";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import userEvent from "@testing-library/user-event";

const TestWrapper = ({ children, onSubmit = vi.fn() }: any) => {
  const form = useForm({
    defaultValues: {
      fileField: null,
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

describe("UploadInput", () => {
  it("should render label and upload area", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <UploadInput
            control={control}
            name="fileField"
            label="Upload Label"
            placeholder="Click to upload"
          />
        )}
      </TestWrapper>,
    );

    expect(screen.getByText(/Upload Label/i)).toBeInTheDocument();
    expect(screen.getByText("Click to upload")).toBeInTheDocument();
  });

  it("should handle file selection", async () => {
    const { container } = render(
      <TestWrapper>
        {(control: any) => (
          <UploadInput
            control={control}
            name="fileField"
            label="Upload Label"
            placeholder="Click to upload"
          />
        )}
      </TestWrapper>,
    );

    const file = new File(["hello"], "hello.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText("hello.png")).toBeInTheDocument();
    });
  });

  it("should handle multiple file selection", async () => {
    const { container } = render(
      <TestWrapper>
        {(control: any) => (
          <UploadInput
            control={control}
            name="fileField"
            label="Upload Label"
            multiple
          />
        )}
      </TestWrapper>
    );

    const files = [
      new File(["file1"], "file1.png", { type: "image/png" }),
      new File(["file2"], "file2.jpg", { type: "image/jpeg" }),
    ];
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, files);

    await waitFor(() => {
      expect(screen.getByText("2 files selected")).toBeInTheDocument();
    });
  });

  it("should render only button when onlyButton is true", () => {
    render(
      <UploadInput
        label="Simple Upload"
        onlyButton
      />
    );

    expect(screen.getByRole("button", { name: /Select File/i })).toBeInTheDocument();
    expect(screen.queryByText("Click here to select the files you wish to upload.")).not.toBeInTheDocument();
  });

  it("should work in standalone mode (non-RHF)", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <UploadInput
        label="Standalone"
        name="standaloneField"
        placeholder="Custom Placeholder"
        onChange={onChange}
      />
    );

    expect(screen.getByText("Standalone")).toBeInTheDocument();
    expect(screen.getByText("Custom Placeholder")).toBeInTheDocument();

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(onChange).toHaveBeenCalledWith(file);
    await waitFor(() => {
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });

  it("should display bottom text if provided", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <UploadInput
            control={control}
            name="fileField"
            bottomText="Max size 5MB"
          />
        )}
      </TestWrapper>
    );
    expect(screen.getByText("Max size 5MB")).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    const { container } = render(
      <UploadInput
        label="Disabled Upload"
        disabled
      />
    );

    const trigger = container.querySelector(".pointer-events-none.opacity-50");
    expect(trigger).toBeInTheDocument();
    
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it("should apply error styling when field state has error", () => {
    const ErrorWrapper = () => {
      const form = useForm();
      const { setError } = form;

      return (
        <Form {...form}>
          <UploadInput 
            control={form.control} 
            name="fileField" 
            label="Error Test" 
          />
          <button type="button" onClick={() => setError("fileField", { type: 'manual', message: "File required" })}>
            Trigger Error
          </button>
        </Form>
      );
    };

    const { container } = render(<ErrorWrapper />);
    fireEvent.click(screen.getByText("Trigger Error"));
    
    expect(screen.getByText("File required")).toBeInTheDocument();
    const trigger = container.querySelector(".border-destructive");
    expect(trigger).toBeInTheDocument();
  });

  it("should handle string value as display text", () => {
    render(
      <UploadInput
        value="already-uploaded.png"
      />
    );
    expect(screen.getByText("already-uploaded.png")).toBeInTheDocument();
  });

  it("should handle click on Select File button and stop propagation", async () => {
    const { container } = render(
        <UploadInput
          label="Button Click"
          isSelect={true}
        />
      );

      const selectButton = screen.getByRole("button", { name: /select file/i });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');
      
      fireEvent.click(selectButton);
      expect(clickSpy).toHaveBeenCalled();
  });

  it("should handle click on button in onlyButton mode", async () => {
    const { container } = render(
      <UploadInput
        label="Only Button"
        onlyButton
      />
    );

    const button = screen.getByRole("button", { name: /Select File/i });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    
    await userEvent.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should handle multiple files displayText and Select Files button text", () => {
    const files = [
        new File(["1"], "1.png", { type: "image/png" }),
        new File(["2"], "2.png", { type: "image/png" }),
    ];
    render(<UploadInput multiple value={files} />);
    expect(screen.getByText("2 files selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Files/i })).toBeInTheDocument();
  });

  it("should handle empty array displayText", () => {
    render(<UploadInput multiple value={[]} />);
    expect(screen.getByText("Click here to select the files you wish to upload.")).toBeInTheDocument();
  });

  it("should handle click on main trigger area", async () => {
    const { container } = render(
      <UploadInput
        label="Trigger Click"
      />
    );

    // The trigger is the div with border-dashed
    const trigger = container.querySelector(".border-dashed") as HTMLElement;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    
    await userEvent.click(trigger);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should display asterisk when isRequired is true", () => {
    render(<UploadInput label="Required Field" isRequired={true} />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should display asterisk in RHF mode when isRequired is true", () => {
    render(
      <TestWrapper>
        {(control: any) => (
          <UploadInput
            control={control}
            name="fileField"
            label="Required RHF"
            isRequired={true}
          />
        )}
      </TestWrapper>
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should handle pluralization for single file in array", () => {
    const files = [new File(["1"], "1.png", { type: "image/png" })];
    render(<UploadInput multiple value={files} />);
    expect(screen.getByText("1 file selected")).toBeInTheDocument();
  });

  it("should handle file object value with name property", () => {
    const file = { name: "custom-file.txt" } as any;
    render(<UploadInput value={file} />);
    expect(screen.getByText("custom-file.txt")).toBeInTheDocument();
  });

  it("should handle empty string as null value", () => {
    render(<UploadInput value={"" as any} placeholder="Empty handled" />);
    expect(screen.getByText("Empty handled")).toBeInTheDocument();
  });

  it("should handle file change with empty files array", async () => {
    const onChange = vi.fn();
    const { container } = render(<UploadInput onChange={onChange} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(input, { target: { files: [] } });
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("should apply custom className", () => {
    const { container } = render(<UploadInput className="custom-test-class" />);
    expect(container.querySelector(".custom-test-class")).toBeInTheDocument();
  });

  it("should use accept and type props", () => {
    const { container } = render(<UploadInput accept=".pdf" type="file" />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute("accept", ".pdf");
    expect(input).toHaveAttribute("type", "file");
  });
});
