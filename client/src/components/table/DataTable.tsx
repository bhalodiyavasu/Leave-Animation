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

import { PaginationBar } from "../pagination/PaginationBar";

// ─── Column definition ─────────────────────────────────────────────────────────
export interface DataTableColumn<T> {
  /** Column header label */
  name: string;
  /** Optional key for keying / field access */
  key?: string;
  /** Optional fixed/min/max width */
  width?: string;
  minWidth?: string;
  /** Header cell extra className */
  headerClassName?: string;
  /** Body cell extra className */
  className?: string;
  /** Custom cell renderer. Falls back to row[key] display if omitted. */
  render?: (row: T, column: DataTableColumn<T>) => ReactNode;
  /** Custom header renderer */
  headerRenderer?: (column: DataTableColumn<T>) => ReactNode;
}

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface DataTableProps<T> {
  /** Optional card title shown in the header bar */
  title?: string;
  /** Subtitle / description below the title */
  subtitle?: string;
  /** Slot for header-right action buttons (e.g. "New Request") */
  headerActions?: ReactNode;

  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data */
  data: T[];

  /** When true, show a spinner instead of the table */
  isLoading?: boolean;
  /** Custom loading node */
  loadingRenderer?: () => ReactNode;
  /** Text or node when data is empty */
  emptyMessage?: string;
  /** Custom empty state renderer */
  emptyRenderer?: () => ReactNode;

  /** Optional per-row action renderer — renders a sticky "Actions" column on the right */
  rowActions?: (row: T, index: number) => ReactNode;
  /** Column label for the actions column (defaults to "Actions") */
  rowActionsLabel?: string;

  /** Row selection */
  selectable?: boolean;
  selectedRows?: T[];
  setSelectedRows?: (rows: T[]) => void;
  isRowSelectable?: (row: T) => boolean;

  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Extra className per row */
  getRowClassName?: (row: T, index: number) => string;

  /** Extra className on the outer wrapper */
  className?: string;
  /** Extra className on the table scroll container */
  tableClassName?: string;

  /** Show a border around the whole table */
  showTableBorder?: boolean;

  /** Pagination props */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DataTable<T>({
  title,
  subtitle,
  headerActions,
  columns,
  data,
  isLoading = false,
  loadingRenderer,
  emptyMessage = "No records found.",
  emptyRenderer,
  rowActions,
  rowActionsLabel = "Actions",
  selectable = false,
  selectedRows = [],
  setSelectedRows,
  isRowSelectable,
  onRowClick,
  getRowClassName,
  className,
  tableClassName,
  showTableBorder = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
}: DataTableProps<T>) {
  // ── Selection helpers ──────────────────────────────────────────────────────
  const isSelected = (row: T) => selectedRows.includes(row);

  const toggleAll = () => {
    if (!setSelectedRows) return;
    const selectable_ = isRowSelectable ? data.filter(isRowSelectable) : data;
    if (selectedRows.length === selectable_.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(selectable_);
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

  const colCount =
    columns.length +
    (selectable ? 1 : 0) +
    (rowActions ? 1 : 0);

  // ── Shared spinner ────────────────────────────────────────────────────────
  const defaultSpinner = (
    <div className="py-12 flex flex-col items-center justify-center space-y-3 text-sky-200/50">
      <svg
        className="animate-spin h-8 w-8 text-foam"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p className="text-xs">Loading data…</p>
    </div>
  );

  // ── Shared empty ──────────────────────────────────────────────────────────
  const defaultEmpty = (
    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-sky-200/40">
      <svg
        className="w-10 h-10 text-sky-200/20"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2M9 11h6m-6 4h3"
        />
      </svg>
      <p className="text-sm font-semibold">{emptyMessage}</p>
    </div>
  );

  return (
    <div
      className={cn(
        "glass-card rounded-2xl border border-glass-border/60 overflow-hidden shadow-xl backdrop-blur-xl",
        className
      )}
    >
      {/* ── Header bar ─────────────────────────────────────────────────── */}
      {(title || subtitle || headerActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-glass-border/30">
          <div>
            {title && (
              <h3 className="text-base font-bold text-white tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-sky-200/50 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
          )}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        loadingRenderer ? loadingRenderer() : defaultSpinner
      ) : data.length === 0 ? (
        emptyRenderer ? emptyRenderer() : defaultEmpty
      ) : (
        <div
          className={cn(
            "w-full overflow-x-auto bg-transparent",
            showTableBorder && "border",
            tableClassName
          )}
        >
          <Table>
            {/* ── Column headers ──────────────────────────────────── */}
            <TableHeader>
              <TableRow className="border-b border-glass-border/30 hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-10 bg-deep/60">
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
                        isRowSelectable &&
                        data.filter(isRowSelectable).length === 0
                      }
                    />
                  </TableHead>
                )}

                {columns.map((col, i) => (
                  <TableHead
                    key={col.key ?? col.name ?? i}
                    className={cn(
                      "bg-deep/60 text-sky-200/70 font-semibold text-xs uppercase tracking-wider whitespace-nowrap",
                      col.headerClassName
                    )}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth ?? "100px",
                    }}
                  >
                    {col.headerRenderer ? col.headerRenderer(col) : col.name}
                  </TableHead>
                ))}

                {rowActions && (
                  <TableHead className="bg-deep/60 text-sky-200/70 font-semibold text-xs uppercase tracking-wider text-right">
                    {rowActionsLabel}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            {/* ── Rows ────────────────────────────────────────────── */}
            <TableBody>
              {data.map((row, i) => (
                <TableRow
                  key={i}
                  data-state={isSelected(row) ? "selected" : undefined}
                  onClick={() => onRowClick?.(row, i)}
                  className={cn(
                    "border-b border-glass-border/20 transition-colors duration-200",
                    onRowClick ? "cursor-pointer" : "",
                    "hover:bg-cyan/5",
                    getRowClassName?.(row, i)
                  )}
                >
                  {selectable && (
                    <TableCell className="w-10">
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
                      key={`${i}-${col.key ?? col.name ?? j}`}
                      className={cn("align-middle py-3 px-3", col.className)}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth ?? "100px",
                      }}
                    >
                      {col.render
                        ? col.render(row, col)
                        : col.key
                        ? ((row as Record<string, unknown>)[col.key] as ReactNode)
                        : null}
                    </TableCell>
                  ))}

                  {rowActions && (
                    <TableCell className="text-right align-middle py-3 px-3">
                      {rowActions(row, i)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {page !== undefined && pageSize !== undefined && total !== undefined && onPageChange && (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          isLoading={isLoading}
          className="border-t border-glass-border/30 bg-none text-white"
        />
      )}
    </div>
  );
}
