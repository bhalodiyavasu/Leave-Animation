"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type SwitcherItem = {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  imageSize?: number;
  title?: string;
};

export type SwitcherProps = {
  items: SwitcherItem[];
  value: string;
  onChange: (key: string) => void;
  /** Overall container height in px. Default: 40 */
  height?: number;
  /** Each item width in px. Default: auto (fits content) */
  itemWidth?: number;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  /** "horizontal" (default) | "vertical" */
  orientation?: "horizontal" | "vertical";
  /** Container border-radius. Default: "15px" */
  containerRadius?: string;
  /** Sliding bg border-radius. Default: "12px" */
  activeRadius?: string;
};

export const Switcher = ({
  items,
  value,
  onChange,
  height = 40,
  itemWidth,
  className,
  activeClassName,
  inactiveClassName,
  orientation = "horizontal",
  containerRadius = "15px",
  activeRadius = "12px",
}: SwitcherProps) => {
  const padding = 4;
  const innerHeight = height - padding * 2;
  const isAutoWidth = itemWidth === undefined;
  const innerWidth = itemWidth ?? innerHeight;
  const activeIndex = items.findIndex((item) => item.key === value);

  // Fixed-width mode: pure CSS transform
  const fixedTransform =
    activeIndex < 0
      ? "translate(0,0)"
      : orientation === "vertical"
        ? `translateY(${activeIndex * innerHeight}px)`
        : `translateX(${activeIndex * innerWidth}px)`;

  return (
    <div
      className={cn(
        "relative bg-muted/50 border border-border/50",
        isAutoWidth
          ? orientation === "vertical" ? "flex flex-col" : "grid"
          : orientation === "vertical" ? "flex flex-col items-center" : "flex items-center",
        className
      )}
      style={{
        padding,
        borderRadius: containerRadius,
        height: orientation === "horizontal" ? height : undefined,
        gridTemplateColumns: isAutoWidth && orientation === "horizontal"
          ? `repeat(${items.length}, 1fr)`
          : undefined,
        width: !isAutoWidth && orientation === "vertical"
          ? innerWidth + padding * 2
          : undefined,
      }}
    >
      {/* Sliding background */}
      {activeIndex >= 0 && (
        <div
          className="absolute bg-background transition-all duration-300 ease-in-out"
          style={{
            height: innerHeight,
            borderRadius: activeRadius,
            top: padding,
            left: padding,
            ...(isAutoWidth
              ? {
                  width: `calc((100% - ${padding * 2}px) / ${items.length})`,
                  transform: `translateX(${activeIndex * 100}%)`,
                }
              : {
                  width: innerWidth,
                  transform: fixedTransform,
                }
            ),
          }}
        />
      )}

      {items.map((item) => {
        const isActive = item.key === value;
        const hasContent = item.image || item.icon || item.label;

        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            title={item.title}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 flex-shrink-0 transition-colors",
              isActive
                ? cn("text-primary", activeClassName)
                : cn("text-muted-foreground hover:text-foreground", inactiveClassName)
            )}
            style={
              isAutoWidth
                ? { height: innerHeight, paddingLeft: 10, paddingRight: 10, paddingTop: 0, paddingBottom: 0 }
                : { width: innerWidth, height: innerHeight, padding: 0 }
            }
          >
            {hasContent && (
              <>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? ""}
                    width={item.imageSize ?? 20}
                    height={item.imageSize ?? 20}
                    className="object-contain flex-shrink-0"
                  />
                ) : (
                  item.icon && (
                    <span className="flex-shrink-0 flex items-center justify-center">
                      {item.icon}
                    </span>
                  )
                )}
                {item.label && (
                  <span className="text-sm font-medium leading-none whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── USAGE EXAMPLE ─────────────────────────────────────────────────────────────
//
// import { Switcher } from "@/components/ui/Switcher";
// const [view, setView] = useState("calendar");
//
// <Switcher
//   value={view}
//   onChange={(key) => setView(key as "calendar" | "table")}
//   height={40}                    // container height (px) — default: 40
//   // itemWidth={80}              // fixed per-item width — omit for auto (fits content)
//   // orientation="horizontal"   // "horizontal" | "vertical" — default: "horizontal"
//   // containerRadius="15px"     // outer border-radius — default: "15px"
//   // activeRadius="12px"        // sliding bg border-radius — default: "12px"
//   // className=""               // extra classes on container
//   // activeClassName=""         // extra classes on active button
//   // inactiveClassName=""       // extra classes on inactive buttons
//   items={[
//     {
//       key: "calendar",
//       icon: <CalendarDays size={15} />,  // icon (any React node)
//       label: "Calendar",                 // text — alone or with icon
//       // image: logo.src,               // image src — replaces icon when given
//       // imageAlt: "Logo",
//       // imageSize: 20,                 // image size in px — default: 20
//       title: "Calendar view",           // hover tooltip
//     },
//     { key: "table", icon: <Table size={15} />, label: "Table", title: "Table view" },
//   ]}
// />
//
// ─────────────────────────────────────────────────────────────────────────────
