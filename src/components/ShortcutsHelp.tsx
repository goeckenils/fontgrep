"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpecimenLabel } from "@/components/specimen/SpecimenChrome";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";

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
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionOK()) return;

      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: dur.sm, ease: ease.out },
        );
      }
      if (dialogRef.current) {
        gsap.fromTo(
          dialogRef.current,
          { opacity: 0, scale: 0.96, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: dur.md, ease: ease.out, delay: 0.04 },
        );
      }
      if (dialogRef.current) {
        gsap.from(dialogRef.current.querySelectorAll("li"), {
          opacity: 0,
          x: 8,
          stagger: 0.03,
          duration: dur.sm,
          ease: ease.out,
          delay: 0.12,
        });
      }
    },
    { scope: overlayRef },
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        ref={dialogRef}
        className="specimen-dialog w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-[var(--specimen-border-on-light)] pb-3">
          <div>
            <SpecimenLabel>Reference</SpecimenLabel>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Keyboard shortcuts
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        </div>
        <ul className="flex flex-col divide-y divide-[var(--specimen-border-on-light)] text-sm">
          {SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between py-2.5">
              <span className="text-muted-foreground">{s.action}</span>
              <kbd className="border border-[var(--specimen-border-on-light)] bg-muted px-2 py-0.5 font-mono text-xs">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}