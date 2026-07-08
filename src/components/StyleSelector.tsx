"use client";

import { Badge } from "@/components/ui/badge";
import type { FontStyle } from "@/lib/fontFamily";
import { styleLabel } from "@/lib/fontFamily";

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
          <button
            key={s.path}
            type="button"
            onClick={() => onSelect(s)}
            className={
              "rounded-md border px-2 py-1 text-xs font-medium transition-colors " +
              (active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted")
            }
            aria-pressed={active}
          >
            {styleLabel(s)}
          </button>
        );
      })}
      {styles.some((s) => s.variable) && (
        <Badge variant="outline" className="ml-1 self-center">
          Variable
        </Badge>
      )}
    </div>
  );
}
