"use client";

import React, { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ValueRequest } from "./common";

export interface TableRendererColumn<T> {
  name: string;
  key?: string;
  widthRequest?: ValueRequest;
  className?: string[];
  bodyRenderer: (item: T, column: TableRendererColumn<T>) => ReactNode;
  headerRenderer?: (item: TableRendererColumn<T>) => ReactNode;
}

interface TableRendererProps<T> {
  columns: TableRendererColumn<T>[];
  data: T[];
  selectable?: boolean;
  selectedRows?: T[];
  setSelectedRows?: (rows: T[]) => void;
  isRowSelectable?: (row: T) => boolean;
  noDataRenderer?: () => ReactNode;
  rowRenderer?: (
    item: T,
    index: number,
    columns: TableRendererColumn<T>[],
  ) => ReactNode;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  showTableBorder?: boolean;
  getRowClassName?: (row: T, index: number) => string;
}

export const TableRenderer = <T,>({
  columns,
  data,
  selectable = false,
  selectedRows = [],
  setSelectedRows,
  isRowSelectable,
  emptyMessage = "No data found",
  noDataRenderer,
  rowRenderer,
  className,
  onRowClick,
  showTableBorder = false,
  getRowClassName,
}: TableRendererProps<T>) => {
  const isSelected = (row: T) => selectedRows.includes(row);

  const toggleAll = () => {
    if (!setSelectedRows) return;
    const selectableData = isRowSelectable
      ? data.filter(isRowSelectable)
      : data;
    if (selectedRows.length === selectableData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(selectableData);
    }
  };

  const toggleRow = (row: T) => {
    if (!setSelectedRows) return;
    if (isRowSelectable && !isRowSelectable(row)) return;
    if (isSelected(row)) {
      setSelectedRows(selectedRows.filter((r) => r !== row));
    } else {
      setSelectedRows([...selectedRows, row]);
    }
  };

  return (
    <div className={cn("w-full overflow-x-auto bg-background", className)}>
      <Table showTableBorder={showTableBorder}>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    data.length > 0 &&
                    (isRowSelectable
                      ? data.filter(isRowSelectable).length > 0 &&
                        selectedRows.length ===
                          data.filter(isRowSelectable).length
                      : selectedRows.length === data.length)
                  }
                  onCheckedChange={toggleAll}
                  disabled={
                    isRowSelectable && data.filter(isRowSelectable).length === 0
                  }
                />
              </TableHead>
            )}
            {columns.map((col, i) => (
              <TableHead
                key={col.key || col.name || i}
                className={cn(col.className)}
                style={{
                  width: col.widthRequest?.value,
                  minWidth: col.widthRequest?.min ?? "100px",
                  maxWidth: col.widthRequest?.max,
                }}
              >
                {col.headerRenderer ? col.headerRenderer(col) : col.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="w-auto">
          {data && data.length > 0 ? (
            data.map((row, i) => (
              <React.Fragment key={i}>
                {rowRenderer ? (
                  rowRenderer(row, i, columns)
                ) : (
                  <TableRow
                    data-state={isSelected(row) ? "selected" : undefined}
                    onClick={() => onRowClick?.(row, i)}
                    className={cn(
                      onRowClick ? "cursor-pointer hover:bg-muted" : "",
                      getRowClassName?.(row, i),
                    )}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected(row)}
                          onCheckedChange={() => toggleRow(row)}
                          disabled={
                            isRowSelectable ? !isRowSelectable(row) : false
                          }
                        />
                      </TableCell>
                    )}
                    {columns.map((col, j) => (
                      <TableCell
                        key={`${i}-${col.key || col.name || j}`}
                        className={cn(col.className)}
                        style={{
                          width: col.widthRequest?.value,
                          minWidth: col.widthRequest?.min ?? "100px",
                          maxWidth: col.widthRequest?.max,
                        }}
                      >
                        {col?.bodyRenderer(row, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="h-45 text-center text-muted-foreground"
              >
                {noDataRenderer ? noDataRenderer() : emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
