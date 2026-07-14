import React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  progressPercent?: number; // optional, defaults to 100%
  borderColor?: string;     // custom border color Tailwind class or default border-glass-border/70
  hoverBorderColor?: string; // custom hover border color class
  valueColor?: string;      // custom value text color class, defaults to text-white
  progressBarColor?: string; // custom progress bar color class, e.g. bg-ocean
}

export function StatCard({
  title,
  value,
  unit,
  progressPercent,
  borderColor = "border-glass-border/70",
  hoverBorderColor = "hover:border-cyan/40",
  valueColor = "text-white",
  progressBarColor = "bg-ocean",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 border flex flex-col justify-between transition-colors duration-300",
        borderColor,
        hoverBorderColor
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-sky-200/50">
        {title}
      </span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={cn("text-3xl font-extrabold", valueColor)}>
          {value}
        </span>
        {unit && <span className="text-xs text-sky-200/40">{unit}</span>}
      </div>
    </div>
  );
}
