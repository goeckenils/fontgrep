"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FontViewer, type ViewerFont } from "@/components/FontViewer";

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
  const [syncedText, setSyncedText] = useState("The quick brown fox jumps over the lazy dog");
  const [syncSize, setSyncSize] = useState(true);
  const [syncedSize, setSyncedSize] = useState(64);

  function pickRight(f: ViewerFont) {
    setRight(f);
    onSelectRight(f);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="ghost" onClick={onClose} data-icon="inline-start">
          <ArrowLeft className="size-4" /> Back
        </Button>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={syncText}
              onChange={(e) => setSyncText(e.target.checked)}
            />
            Sync text
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={syncSize}
              onChange={(e) => setSyncSize(e.target.checked)}
            />
            Sync size
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-3">
          <div className="mb-2 truncate text-sm font-medium">
            {left.family} <span className="text-muted-foreground">· left</span>
          </div>
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
        </div>

        <div className="rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium">Right</span>
            <select
              className="max-w-[60%] rounded-md border bg-background px-2 py-1 text-xs"
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
          </div>
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
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Pick a font to compare
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
