"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SelectInput from "@/components/form-inputs/SelectInput";

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  paginationWithTable?: boolean;
  isLoading?: boolean;
}

export const PaginationBar = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className,
  isLoading = false,
}: PaginationBarProps) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex border-t bg-none justify-between p-3", className)}>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <SelectInput
            value={pageSize}
            onChange={(v: string | number) => onPageSizeChange(Number(v))}
            name="pageSize"
            options={pageSizeOptions.map((size) => ({
              name: `${size} / page`,
              value: size,
            }))}
            placeholder={`${pageSize} / page`}
            hideLabel
            className="w-auto"
            disabled={isLoading}
          />
        )}
        <div className="text-sm text-muted-foreground flex items-center max-[430px]:hidden">
          Showing {start}–{end} of{" "}
          <span className="font-semibold ml-1">{total}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-2 text-sm">
            {page} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            disabled={page === totalPages || totalPages === 0 || isLoading}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
