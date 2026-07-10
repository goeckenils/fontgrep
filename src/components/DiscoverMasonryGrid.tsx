import { forwardRef, type ReactNode } from "react";
import { MASONRY_GRID_CLASS } from "@/lib/cardGrid";
import { cn } from "@/lib/utils";

export const DiscoverMasonryGrid = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(function DiscoverMasonryGrid({ children, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(MASONRY_GRID_CLASS, className)}
    >
      {children}
    </div>
  );
});