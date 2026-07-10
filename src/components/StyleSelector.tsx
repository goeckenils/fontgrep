"use client";

import { Button } from "@/components/ui/button";
import type { FontStyle } from "@/lib/fontFamily";
import { styleLabel } from "@/lib/fontFamily";
import { metaPill } from "@/lib/viewerTheme";
import { cn } from "@/lib/utils";

export function StyleSelector({
  styles,
  activePath,
  onSelect,
}: {
  styles: FontStyle[];
  activePath: string;
  onSelect: (s: FontStyle) => void;
}) {
  if (styles.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {styles.map((s) => {
        const active = s.path === activePath;
        return (
          <Button
            key={s.path}
            type="button"
            variant={active ? "secondary" : "outline"}
            size="xs"
            onClick={() => onSelect(s)}
            aria-pressed={active}
          >
            {styleLabel(s)}
          </Button>
        );
      })}
      {styles.some((s) => s.variable) && (
        <span className={cn(metaPill(), "self-center")}>Variable</span>
      )}
    </div>
  );
}