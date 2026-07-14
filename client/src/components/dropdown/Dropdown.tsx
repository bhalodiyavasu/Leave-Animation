"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Re-export sub-primitives — import everything from one place
export {
  DropdownMenuItem as DropdownItem,
  DropdownMenuSeparator as DropdownSeparator,
  DropdownMenuSub as DropdownSub,
  DropdownMenuSubTrigger as DropdownSubTrigger,
  DropdownMenuSubContent as DropdownSubContent,
} from "@/components/ui/dropdown-menu";

type DropdownOption = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
};

type DropdownBaseProps = {
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
};

type DropdownProps =
  | (DropdownBaseProps & { options: DropdownOption[]; onSelect: (value: string) => void; children?: never })
  | (DropdownBaseProps & { children: React.ReactNode; options?: never; onSelect?: never });

export function Dropdown({
  trigger,
  open,
  onOpenChange,
  side = "bottom",
  align = "end",
  sideOffset = 4,
  alignOffset,
  contentClassName,
  contentStyle,
  ...rest
}: DropdownProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={contentClassName ?? "min-w-40"}
        style={contentStyle}
      >
        {"children" in rest
          ? rest.children
          : rest.options.map((item) => (
              <DropdownMenuItem
                key={item.value}
                variant={item.destructive ? "destructive" : "default"}
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  rest.onSelect(item.value);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </DropdownMenuItem>
            ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
