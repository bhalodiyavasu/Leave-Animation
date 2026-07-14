import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { icons, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "w-fit min-h-5 inline-flex items-center justify-center rounded-[7px] border border-transparent px-2 py-0.5 text-xs font-medium max-w-full break-words shrink-0 min-w-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-muted/80 text-foreground border border-border",
        primary: "bg-primary/10 text-primary border border-primary",
        secondary: "text-gray-600 bg-gray-100 border-gray-300",
        outline: "bg-transparent text-foreground border border-border",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",

        green:
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        purple:
          "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        orange:
          "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
        yellow:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        pink: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
        gray: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  icon,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    icon?: keyof typeof icons;
  }) {
  const Comp = asChild ? Slot : "span";
  const IconComponent = icon ? (icons[icon] as LucideIcon) : null;

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      style={{ wordBreak: 'break-word', ...(props.style || {}) }}
      {...props}
    >
      {IconComponent && <IconComponent />}
      {children}
    </Comp>
  );
}

export { Badge, badgeVariants };
