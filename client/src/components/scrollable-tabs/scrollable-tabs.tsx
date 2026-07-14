"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ScrollableTabsListProps extends React.ComponentProps<
  typeof TabsList
> {
  children: React.ReactNode;
  width?: string | number;
}

export function ScrollableTabsList({
  className,
  children,
  width = "w-full",
  ...props
}: ScrollableTabsListProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      checkScroll();

      const handleResize = () => checkScroll();
      const handleScroll = () => checkScroll();

      window.addEventListener("resize", handleResize);
      scrollContainer.addEventListener("scroll", handleScroll);

      const timer = setTimeout(checkScroll, 0);

      return () => {
        window.removeEventListener("resize", handleResize);
        scrollContainer.removeEventListener("scroll", handleScroll);
        clearTimeout(timer);
      };
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
  }, [children]);

  return (
    <div className="relative flex items-center w-full group/scrollable-tabs">
      <div
        className={cn(
          "absolute left-0 z-10 flex h-full w-10 items-center justify-start bg-linear-to-r from-background to-transparent transition-opacity duration-200 pointer-events-none",
          showLeftArrow ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronLeft className="h-4 w-4 text-foreground/50" />
      </div>

      <div
        ref={scrollContainerRef}
        className={cn(
          "overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]",
          width ? `${width}` : "",
        )}
        style={{ scrollbarWidth: "none" }}
      >
        <TabsList className={cn("flex w-max min-w-full", className)} {...props}>
          {children}
        </TabsList>
      </div>

      <div
        className={cn(
          "absolute right-0 z-10 flex h-full w-10 items-center justify-end bg-linear-to-l from-background to-transparent transition-opacity duration-200 pointer-events-none",
          showRightArrow ? "opacity-100" : "opacity-0",
        )}
      >
        <ChevronRight className="h-4 w-4 text-foreground/50" />
      </div>
    </div>
  );
}
