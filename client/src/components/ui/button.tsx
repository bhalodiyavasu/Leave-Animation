import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils"
import { Loader } from "@/common/loadable-content/Loader";

const buttonVariants = cva(
  "h-9 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-35 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:bg-destructive/20 border border-r dark:hover:border-red-500/30 hover:border-red-500/30",
        destructiveFilled:
          "bg-destructive text-white hover:bg-destructive/20 dark:hover:bg-destructive/70",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-popover-foreground dark:hover:bg-popover",
        link: "text-primary underline-offset-4 hover:underline",
        tableBtn: "hover:bg-stone-200 dark:hover:bg-muted dark:text-muted-foreground border border-border",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        buttonVariants({ variant, size }),
        loading && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      {loading
        ? (() => {
            const childrenArray = React.Children.toArray(children);
            let iconReplaced = false;

            const newChildren = childrenArray.map((child) => {
              if (!iconReplaced && React.isValidElement(child)) {
                iconReplaced = true;
                return (
                  <Loader
                    key={child.key || "loader"}
                    className={cn((child as React.ReactElement<{ className?: string }>).props.className)}
                    width={Number((child as React.ReactElement<{ size?: number | string }>).props.size) || 16}
                    height={Number((child as React.ReactElement<{ size?: number | string }>).props.size) || 16}
                    color="currentColor"
                  />
                );
              }
              return child;
            });

            if (!iconReplaced) {
              newChildren.unshift(
                <Loader
                  key="loader"
                  width={16}
                  height={16}
                  color="currentColor"
                />,
              );
            }

            return newChildren;
          })()
        : children}
    </Comp>
  );
}

export { Button, buttonVariants };
