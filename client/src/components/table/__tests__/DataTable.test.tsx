import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DataTable, DataTableColumn } from "../DataTable";
import userEvent from "@testing-library/user-event";

interface TestData {
  id: string;
  name: string;
}

const columns: DataTableColumn<TestData>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
];

const data: TestData[] = [
  { id: "1", name: "Item 1" },
  { id: "2", name: "Item 2" },
];

describe("DataTable", () => {
  it("should render table with data", () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("should render empty message when no data", () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="No items found" />,
    );

    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("should handle row selection", async () => {
    const onRowSelect = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        selectable
        onRowSelect={onRowSelect}
        selectedRows={[]}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click first row checkbox (index 1) to select
    await userEvent.click(checkboxes[1]);

    expect(onRowSelect).toHaveBeenCalledWith([data[0]]);
  });

  it("should handle row deselection", async () => {
    const onRowSelect = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        selectable
        onRowSelect={onRowSelect}
        selectedRows={[data[0]]}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click first row checkbox (index 1) to deselect
    await userEvent.click(checkboxes[1]);

    expect(onRowSelect).toHaveBeenCalledWith([]);
  });

  it("should select all rows when header checkbox is clicked", async () => {
    const onRowSelect = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        selectable
        onRowSelect={onRowSelect}
        selectedRows={[]}
      />,
    );

    const headerCheckbox = screen.getAllByRole("checkbox")[0];
    await userEvent.click(headerCheckbox);

    expect(onRowSelect).toHaveBeenCalledWith(data);
  });

  it("should deselect all rows when header checkbox is clicked and all are selected", async () => {
    const onRowSelect = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        selectable
        onRowSelect={onRowSelect}
        selectedRows={data}
      />,
    );

    const headerCheckbox = screen.getAllByRole("checkbox")[0];
    await userEvent.click(headerCheckbox);

    expect(onRowSelect).toHaveBeenCalledWith([]);
  });

  it("should render title and actions if provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        title="Custom Title"
        actions={<button>Action Btn</button>}
      />,
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Action Btn")).toBeInTheDocument();
  });

  it("should not render title/actions section if neither provided", () => {
    const { container } = render(<DataTable columns={columns} data={data} />);
    // The container for title/actions is a div with flex justify-between
    const headerSection = container.querySelector(
      ".flex.justify-between.px-2.py-4",
    );
    expect(headerSection).toBeNull();
  });

  it("should use custom render function for columns", () => {
    const customColumns: DataTableColumn<TestData>[] = [
      {
        key: "name",
        header: "Name",
        render: (row) => (
          <span data-testid="custom-render">{row.name.toUpperCase()}</span>
        ),
      },
    ];

    render(<DataTable columns={customColumns} data={data} />);

    expect(screen.getByText("ITEM 1")).toBeInTheDocument();
    expect(screen.getAllByTestId("custom-render")).toHaveLength(2);
  });

  it("should apply custom classNames", () => {
    const customColumns: DataTableColumn<TestData>[] = [
      { key: "id", header: "ID", className: "custom-col-class" },
    ];

    const { container } = render(
      <DataTable
        columns={customColumns}
        data={data}
        className="custom-table-class"
      />,
    );

    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass("custom-table-class");

    const headerCells = screen.getAllByRole("columnheader");
    expect(headerCells[0]).toHaveClass("custom-col-class");
  });

  it("should render row actions", () => {
    const rowActions = (row: TestData) => (
      <button onClick={() => {}}>Action for {row.id}</button>
    );

    render(<DataTable columns={columns} data={data} rowActions={rowActions} />);

    expect(screen.getByText("Actions")).toBeInTheDocument(); // Header
    expect(screen.getByText("Action for 1")).toBeInTheDocument();
    expect(screen.getByText("Action for 2")).toBeInTheDocument();
  });

  it("should render default empty message and correct colSpan when none provided", () => {
    const { rerender } = render(<DataTable columns={columns} data={[]} />);
    const cell = screen.getByRole("cell");
    expect(screen.getByText("No records found")).toBeInTheDocument();
    expect(cell).toHaveAttribute("colSpan", "2"); // columns.length (2) + 0 + 0

    // With selectable
    rerender(<DataTable columns={columns} data={[]} selectable />);
    expect(screen.getByRole("cell")).toHaveAttribute("colSpan", "3"); // 2 + 1 + 0

    // With rowActions
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        rowActions={(row) => <button>{row.id}</button>}
      />,
    );
    expect(screen.getByRole("cell")).toHaveAttribute("colSpan", "3"); // 2 + 0 + 1

    // With both
    rerender(
      <DataTable
        columns={columns}
        data={[]}
        selectable
        rowActions={(row) => <button>{row.id}</button>}
      />,
    );
    expect(screen.getByRole("cell")).toHaveAttribute("colSpan", "4"); // 2 + 1 + 1
  });

  it("should do nothing when clicking row if onRowSelect is missing", async () => {
    render(<DataTable columns={columns} data={data} selectable />);
    const checkboxes = screen.getAllByRole("checkbox");

    // This should not throw
    await userEvent.click(checkboxes[1]);
    await userEvent.click(checkboxes[0]);
  });
});
