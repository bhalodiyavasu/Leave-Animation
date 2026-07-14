"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  variant?: "solid" | "dashed"
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant = "solid",
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        variant === "solid" && "bg-border",
        variant === "dashed" &&
          "bg-transparent text-border data-[orientation=horizontal]:bg-[repeating-linear-gradient(to_right,currentColor_0,currentColor_8px,transparent_8px,transparent_14px)] data-[orientation=vertical]:bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_8px,transparent_8px,transparent_14px)]",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
