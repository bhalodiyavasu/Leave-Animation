import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TableRenderer } from "../TableRenderer";


// Mock UI components if needed, but TableRenderer uses imported components.
// We can test the integration or mock them lightly.
// For now, let's test real rendering logic.

describe("TableRenderer", () => {
  const mockColumns = [
    {
      name: "Name",
      key: "name",
      bodyRenderer: (item: any) => <span>{item.name}</span>,
    },
    {
      name: "Age",
      key: "age",
      bodyRenderer: (item: any) => <span>{item.age}</span>,
    },
  ];

  const mockData = [
    { id: 1, name: "Alice", age: 30 },
    { id: 2, name: "Bob", age: 25 },
  ];

  it("should render table with data", () => {
    render(<TableRenderer columns={mockColumns} data={mockData} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("should render empty state message", () => {
    render(<TableRenderer columns={mockColumns} data={[]} />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("should render custom empty state", () => {
    render(
      <TableRenderer
        columns={mockColumns}
        data={[]}
        emptyMessage="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("should use noDataRenderer if provided", () => {
    render(
      <TableRenderer
        columns={mockColumns}
        data={[]}
        noDataRenderer={() => <div data-testid="no-data">Custom Empty</div>}
      />,
    );
    expect(screen.getByTestId("no-data")).toBeInTheDocument();
  });

  it("should render selection checkboxes when selectable is true", () => {
    const setSelectedRows = vi.fn();
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={[]}
        setSelectedRows={setSelectedRows}
      />,
    );

    // Header checkbox + 2 row checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("should handle row selection in selectable mode", () => {
    const setSelectedRows = vi.fn();
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={[]}
        setSelectedRows={setSelectedRows}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click first row checkbox (index 1, 0 is header)
    fireEvent.click(checkboxes[1]);
    expect(setSelectedRows).toHaveBeenCalledWith([mockData[0]]);
  });

  it("should handle deselect row", () => {
    const setSelectedRows = vi.fn();
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={[mockData[0]]}
        setSelectedRows={setSelectedRows}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click first row checkbox (which is selected)
    fireEvent.click(checkboxes[1]);
    expect(setSelectedRows).toHaveBeenCalledWith([]);
  });

  it("should handle select all", () => {
    const setSelectedRows = vi.fn();
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={[]}
        setSelectedRows={setSelectedRows}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click header checkbox
    fireEvent.click(checkboxes[0]);
    expect(setSelectedRows).toHaveBeenCalledWith(mockData);
  });

  it("should handle deselect all", () => {
    const setSelectedRows = vi.fn();
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={mockData}
        setSelectedRows={setSelectedRows}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click header checkbox (checked)
    fireEvent.click(checkboxes[0]);
    expect(setSelectedRows).toHaveBeenCalledWith([]);
  });

  it("should handle onRowClick", () => {
    const onRowClick = vi.fn();
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        onRowClick={onRowClick}
      />,
    );

    fireEvent.click(screen.getByText("Alice"));
    expect(onRowClick).toHaveBeenCalledWith(mockData[0], 0);
  });

  it("should support custom rowRenderer", () => {
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        rowRenderer={(item) => (
          <tr key={item.id} data-testid="custom-row">
            <td>{item.name} (Custom)</td>
          </tr>
        )}
      />,
    );
    expect(screen.getAllByTestId("custom-row")).toHaveLength(2);
    expect(screen.getByText("Alice (Custom)")).toBeInTheDocument();
  });

  it("should support custom headerRenderer", () => {
    const customColumns = [
      {
        ...mockColumns[0],
        headerRenderer: () => (
          <span data-testid="custom-header">Custom Name</span>
        ),
      },
    ];
    render(<TableRenderer columns={customColumns} data={mockData} />);
    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
  });

  it("should apply column styles", () => {
    const styledCol = [
      {
        ...mockColumns[0],
        widthRequest: { value: "100px", min: "50px", max: "200px" },
      },
    ];
    const { container } = render(
      <TableRenderer columns={styledCol} data={mockData} />,
    );
    // Check th usage of style
    const th = container.querySelector("th");
    expect(th).toHaveStyle({
      width: "100px",
      minWidth: "50px",
      maxWidth: "200px",
    });
  });

  it("should handle selectable without setSelectedRows gracefully", () => {
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    // Click header checkbox - should return early
    fireEvent.click(checkboxes[0]);
    // Click row checkbox - should return early
    fireEvent.click(checkboxes[1]);
    expect(checkboxes[0]).toBeInTheDocument(); // Just ensuring no crash
  });

  it("should handle isRowSelectable logic (partially selectable)", () => {
    const setSelectedRows = vi.fn();
    // Only Alice is selectable
    const isRowSelectable = (row: any) => row.id === 1;

    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={[]}
        setSelectedRows={setSelectedRows}
        isRowSelectable={isRowSelectable}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    
    // Checkbox 0: Header (check all selectables)
    fireEvent.click(checkboxes[0]);
    expect(setSelectedRows).toHaveBeenCalledWith([mockData[0]]);

    // Checkbox 1: Alice (selectable)
    fireEvent.click(checkboxes[1]);
    expect(setSelectedRows).toHaveBeenCalledWith([mockData[0]]);

    // Checkbox 2: Bob (unselectable -> should be returned early)
    fireEvent.click(checkboxes[2]);
    // Re-verify that it wasn't added to selection call
    expect(setSelectedRows).toHaveBeenLastCalledWith([mockData[0]]);
  });

  it("should handle isRowSelectable logic when all selectables are selected", () => {
    const setSelectedRows = vi.fn();
    const isRowSelectable = (row: any) => row.id === 1;

    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        selectedRows={[mockData[0]]}
        setSelectedRows={setSelectedRows}
        isRowSelectable={isRowSelectable}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Header should deselect all currently selectable rows if they are all selected
    fireEvent.click(checkboxes[0]);
    expect(setSelectedRows).toHaveBeenCalledWith([]);
  });

  it("should disable header checkbox if no rows are selectable", () => {
    const isRowSelectable = () => false;
    render(
      <TableRenderer
        columns={mockColumns}
        data={mockData}
        selectable
        isRowSelectable={isRowSelectable}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeDisabled();
  });

  it("should handle selectable empty state colSpan", () => {
    const { container } = render(
      <TableRenderer columns={mockColumns} data={[]} selectable />
    );
    // colSpan should be 2 columns + 1 selectable = 3
    const td = container.querySelector("td") as HTMLTableCellElement;
    expect(td.colSpan).toBe(3);
  });

  it("should fallback to index for column keys if key/name are missing", () => {
    const weirdColumns: any[] = [
      {
        bodyRenderer: (item: any) => <span>{item.name}</span>,
      },
      {
        name: "NoKey",
        bodyRenderer: (item: any) => <span>{item.age}</span>,
      }
    ];
    render(<TableRenderer columns={weirdColumns} data={mockData} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
