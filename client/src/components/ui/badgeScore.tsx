import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const scoreBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 scale-100 border",
  {
    variants: {
      variant: {
        blue:
          "bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-400/60 dark:shadow-[0_0_8px_rgba(59,130,246,0.2)]",
        purple:
          "bg-purple-100 text-purple-700 border-purple-400 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-400/60 dark:shadow-[0_0_8px_rgba(168,85,247,0.2)]",
        green:
          "bg-green-100 text-green-700 border-green-400 dark:bg-green-900/30 dark:text-green-300 dark:border-green-400/60 dark:shadow-[0_0_8px_rgba(34,197,94,0.2)]",
        red:
          "bg-red-100 text-red-700 border-red-400 dark:bg-red-900/30 dark:text-red-300 dark:border-red-400/60 dark:shadow-[0_0_8px_rgba(239,68,68,0.2)]",
        orange:
          "bg-orange-100 text-orange-700 border-orange-400 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-400/60 dark:shadow-[0_0_8px_rgba(249,115,22,0.2)]",
        yellow:
          "bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-400/60 dark:shadow-[0_0_8px_rgba(234,179,8,0.2)]",
        pink:
          "bg-pink-100 text-pink-700 border-pink-400 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-400/60 dark:shadow-[0_0_8px_rgba(236,72,153,0.2)]",
        gray:
          "bg-gray-100 text-gray-500 border-gray-300 opacity-60 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-500/50 shadow-none",
        cyan:
          "bg-cyan-100 text-cyan-700 border-cyan-400 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-400/60 dark:shadow-[0_0_8px_rgba(6,182,212,0.2)]",
        indigo:
          "bg-indigo-100 text-indigo-700 border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-400/60 dark:shadow-[0_0_8px_rgba(99,102,241,0.2)]",
      },
      size: {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "gray",
      size: "md",
    },
  }
);

export type ScoreBadgeVariant = NonNullable<
  VariantProps<typeof scoreBadgeVariants>["variant"]
>;
export type ScoreBadgeSize = NonNullable<
  VariantProps<typeof scoreBadgeVariants>["size"]
>;

export interface ScoreBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scoreBadgeVariants> {
  score?: string | number | null;
}

const ScoreBadge = React.forwardRef<HTMLDivElement, ScoreBadgeProps>(
  ({ score, variant, size, className, ...props }, ref) => {
    const isValue =
      score !== null && score !== undefined && score !== "-" && score !== "";

    const displayScore = isValue
      ? parseFloat(String(score)).toFixed(1)
      : "-";

    return (
      <div
        ref={ref}
        className={cn(scoreBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {displayScore}
      </div>
    );
  }
);

ScoreBadge.displayName = "ScoreBadge";

export { ScoreBadge, scoreBadgeVariants };