"use client";

import { Children, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type FilterBarVariant = "inline" | "section";

interface FilterBarProps {
  children: ReactNode;
  actions?: ReactNode;
  onReset?: () => void;
  onApply?: () => void;
  variant?: FilterBarVariant;
  className?: string;
  disabled?: boolean;
}

export const FilterBar = ({
  children,
  actions,
  onReset,
  onApply,
  variant = "section",
  className,
  disabled = false,
}: FilterBarProps) => {
  const stretch =
    (Children.count(children) + (onReset ? 1 : 0) + (onApply ? 1 : 0)) % 2 !==
    0;
  return (
    <div
      className={cn(
        "w-full",
        variant === "section" && "rounded-lg border bg-background p-4",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-end gap-3 w-full max-[900px]:grid max-[900px]:grid-cols-2 max-sm:grid-cols-1",
          className,
        )}
      >
        {children}

        {(actions || onReset || onApply) && (
          <div
            className={cn(
              "max-[900px]:w-full max-sm:w-auto flex items-end justify-end gap-2 ml-auto max-[900px]:col-start-2 max-sm:col-auto",
            )}
          >
            {actions}

            {onReset && (
              <Button
                variant="outline"
                onClick={onReset}
                className={stretch ? "flex-1" : ""}
                disabled={disabled}
              >
                Reset
              </Button>
            )}
            {onApply && (
              <Button onClick={onApply} className={stretch ? "flex-1" : ""} disabled={disabled}>
                Apply
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
