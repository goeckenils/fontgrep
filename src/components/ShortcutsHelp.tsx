"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "⌘/Ctrl + K", action: "Focus search / topic input" },
  { keys: "1 / 2 / 3", action: "Switch to Discover / Search / Library" },
  { keys: "R", action: "Surprise me (random font)" },
  { keys: "↑ / ↓", action: "Navigate list items" },
  { keys: "Enter", action: "Open focused font" },
  { keys: "S", action: "Save font (when viewer open)" },
  { keys: "C", action: "Copy CSS (when viewer open)" },
  { keys: "Esc", action: "Close viewer / this help" },
  { keys: "?", action: "Show this help" },
];

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-md rounded-xl border bg-card p-5 text-card-foreground shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Keyboard shortcuts</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <ul className="flex flex-col divide-y text-sm">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{s.action}</span>
              <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
