"use client";

import { useRef } from "react";
import { DiscoverMasonryGrid } from "@/components/DiscoverMasonryGrid";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

const PIN_HEIGHTS = [
  "min-h-[10rem]",
  "min-h-[13rem]",
  "min-h-[11rem]",
  "min-h-[14rem]",
  "min-h-[9rem]",
];

export function DiscoverLoadingPins() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = gridRef.current;
      if (!root || !motionOK()) return;

      const pins = root.querySelectorAll<HTMLElement>("[data-loading-pin]");
      gsap.fromTo(
        pins,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: dur.md,
          ease: ease.out,
        },
      );

      gsap.to(pins, {
        opacity: 0.55,
        duration: 1.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.08, from: "random" },
      });
    },
    { scope: gridRef },
  );

  return (
    <DiscoverMasonryGrid ref={gridRef}>
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          data-loading-pin
          className={cn(
            "specimen-panel bg-sidebar",
            PIN_HEIGHTS[index % PIN_HEIGHTS.length],
          )}
        >
          <div className="specimen-header py-2">
            <div className="h-2 w-16 bg-[var(--specimen-muted-on-light)]/30" />
          </div>
          <div className="mx-4 mt-5 h-20 bg-sidebar-primary/15" />
          <div className="specimen-footer mt-auto py-2.5">
            <div className="h-3 w-2/3 bg-[var(--specimen-muted-on-light)]/25" />
          </div>
        </div>
      ))}
    </DiscoverMasonryGrid>
  );
}