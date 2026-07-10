"use client";

import { useState, type ReactNode } from "react";

import { FontViewer, type ViewerFont } from "@/components/FontViewer";
import {
  BENTO_CARD,
  CONTROL_INPUT,
  CONTROL_PANEL,
  SECTION_LABEL,
} from "@/lib/viewerTheme";
import { cn } from "@/lib/utils";

export interface CompareFontOption {
  label: string;
  font: ViewerFont;
}

export function FontCompare({
  left,
  onSelectRight,
  options,
  onClose,
}: {
  left: ViewerFont;
  onSelectRight: (f: ViewerFont) => void;
  options: CompareFontOption[];
  onClose: () => void;
}) {
  const [right, setRight] = useState<ViewerFont | null>(null);
  const [syncText, setSyncText] = useState(true);
  const [syncedText, setSyncedText] = useState(
    "The quick brown fox jumps over the lazy dog",
  );
  const [syncSize, setSyncSize] = useState(true);
  const [syncedSize, setSyncedSize] = useState(64);

  function pickRight(f: ViewerFont) {
    setRight(f);
    onSelectRight(f);
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <div
        className={cn(
          CONTROL_PANEL,
          "flex flex-wrap items-center gap-4 px-4 py-2",
        )}
      >
        <label className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#888]">
          <input
            type="checkbox"
            checked={syncText}
            onChange={(e) => setSyncText(e.target.checked)}
          />
          Sync text
        </label>
        <label className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#888]">
          <input
            type="checkbox"
            checked={syncSize}
            onChange={(e) => setSyncSize(e.target.checked)}
          />
          Sync size
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ComparePane title={left.family} side="Left">
          <FontViewer
            font={left}
            onClose={() => {}}
            embedded
            syncedText={syncText ? syncedText : undefined}
            onTextChange={setSyncedText}
            syncedSize={syncSize ? syncedSize : undefined}
            onSizeChange={setSyncedSize}
            hideCompare
          />
        </ComparePane>

        <ComparePane
          title={right?.realFamily ?? right?.family ?? "Pick a font"}
          side="Right"
          action={
            <select
              className={cn(CONTROL_INPUT, "max-w-full py-1 text-xs")}
              value={right ? right.fileName : ""}
              onChange={(e) => {
                const opt = options.find((o) => o.font.fileName === e.target.value);
                if (opt) pickRight(opt.font);
              }}
            >
              <option value="" disabled>
                Select a font…
              </option>
              {options.map((o, i) => (
                <option key={`${o.font.fileName}-${i}`} value={o.font.fileName}>
                  {o.label}
                </option>
              ))}
            </select>
          }
        >
          {right ? (
            <FontViewer
              font={right}
              onClose={() => {}}
              embedded
              syncedText={syncText ? syncedText : undefined}
              onTextChange={setSyncedText}
              syncedSize={syncSize ? syncedSize : undefined}
              onSizeChange={setSyncedSize}
              hideCompare
            />
          ) : (
            <div
              className={cn(
                BENTO_CARD,
                "flex h-40 items-center justify-center text-sm text-muted-foreground",
              )}
            >
              Pick a font to compare
            </div>
          )}
        </ComparePane>
      </div>
    </div>
  );
}

function ComparePane({
  title,
  side,
  action,
  children,
}: {
  title: string;
  side: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <p className={SECTION_LABEL}>{side}</p>
          <p className="truncate text-sm font-semibold tracking-tight">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}