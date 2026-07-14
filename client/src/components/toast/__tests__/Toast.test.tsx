import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { showToast } from "../showToast";
import toast from "react-hot-toast";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: {
    custom: vi.fn((callback) => {
      const component = callback({ id: "test-id", visible: true });
      return component;
    }),
    dismiss: vi.fn(),
  },
}));

describe("showToast", () => {
  it("renders success toast correctly", () => {
    let renderedComponent: React.ReactNode = null;
    vi.mocked(toast.custom).mockImplementation((callback: any) => {
      renderedComponent = callback({ id: "t1", visible: true }) as React.ReactNode;
      return "t1";
    });

    showToast("success", "Success Message");
    expect(toast.custom).toHaveBeenCalled();

    if (renderedComponent) {
      const { getByText, getByRole } = render(<>{renderedComponent}</>);
      expect(getByText("Success Message")).toBeInTheDocument();
      expect(getByText("success")).toBeInTheDocument();

      fireEvent.click(
        getByText("Success Message").closest("div")!.parentElement!,
      );
      expect(toast.dismiss).toHaveBeenCalledWith("t1");

      vi.mocked(toast.dismiss).mockClear();

      const closeButton = getByRole("button");
      fireEvent.click(closeButton);
      expect(toast.dismiss).toHaveBeenCalledWith("t1");
    }
  });

  it("should return early if message is empty", () => {
    vi.mocked(toast.custom).mockClear();
    showToast("success", "");
    expect(toast.custom).not.toHaveBeenCalled();
  });

  it("renders error toast correctly", () => {
    let renderedComponent: React.ReactNode = null;
    vi.mocked(toast.custom).mockImplementation((callback: any) => {
      renderedComponent = callback({ id: "t2", visible: true }) as React.ReactNode;
      return "t2";
    });

    showToast("error", "Error Message");
    expect(toast.custom).toHaveBeenCalled();

    if (renderedComponent) {
      const { getByText, getByRole } = render(<>{renderedComponent}</>);
      expect(getByText("Error Message")).toBeInTheDocument();
      expect(getByText("error")).toBeInTheDocument();

      fireEvent.click(
        getByText("Error Message").closest("div")!.parentElement!,
      );
      expect(toast.dismiss).toHaveBeenCalledWith("t2");

      vi.mocked(toast.dismiss).mockClear();

      const closeButton = getByRole("button");
      fireEvent.click(closeButton);
      expect(toast.dismiss).toHaveBeenCalledWith("t2");
    }
  });

  it("renders info toast correctly", () => {
    let renderedComponent: React.ReactNode = null;
    vi.mocked(toast.custom).mockImplementation((callback: any) => {
      renderedComponent = callback({ id: "t3", visible: true }) as React.ReactNode;
      return "t3";
    });

    showToast("info", "Info Message");
    expect(toast.custom).toHaveBeenCalled();

    if (renderedComponent) {
      const { getByText, getByRole } = render(<>{renderedComponent}</>);
      expect(getByText("Info Message")).toBeInTheDocument();
      expect(getByText("info")).toBeInTheDocument();

      fireEvent.click(getByText("Info Message").closest("div")!.parentElement!);
      expect(toast.dismiss).toHaveBeenCalledWith("t3");

      vi.mocked(toast.dismiss).mockClear();

      const closeButton = getByRole("button");
      fireEvent.click(closeButton);
      expect(toast.dismiss).toHaveBeenCalledWith("t3");
    }
  });

  it("renders warning toast correctly", () => {
    let renderedComponent: React.ReactNode = null;
    vi.mocked(toast.custom).mockImplementation((callback: any) => {
      renderedComponent = callback({ id: "t4", visible: true }) as React.ReactNode;
      return "t4";
    });

    showToast("warning", "Warning Message");
    expect(toast.custom).toHaveBeenCalled();

    if (renderedComponent) {
      const { getByText, getByRole } = render(<>{renderedComponent}</>);
      expect(getByText("Warning Message")).toBeInTheDocument();
      expect(getByText("warning")).toBeInTheDocument();

      fireEvent.click(
        getByText("Warning Message").closest("div")!.parentElement!,
      );
      expect(toast.dismiss).toHaveBeenCalledWith("t4");

      vi.mocked(toast.dismiss).mockClear();

      const closeButton = getByRole("button");
      fireEvent.click(closeButton);
      expect(toast.dismiss).toHaveBeenCalledWith("t4");
    }
  });

  it("should return early for error if message is empty", () => {
    vi.mocked(toast.custom).mockClear();
    showToast("error", "");
    expect(toast.custom).not.toHaveBeenCalled();
  });

  it("should return early for info if message is empty", () => {
    vi.mocked(toast.custom).mockClear();
    showToast("info", "");
    expect(toast.custom).not.toHaveBeenCalled();
  });

  it("should return early for warning if message is empty", () => {
    vi.mocked(toast.custom).mockClear();
    showToast("warning", "");
    expect(toast.custom).not.toHaveBeenCalled();
  });
});
