"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { specimenShell, type SpecimenAccent, type SpecimenCut } from "@/lib/specimenTheme";
import { cn } from "@/lib/utils";

export function SpecimenGrain() {
  return (
    <div
      aria-hidden
      className="specimen-grain pointer-events-none absolute inset-0"
    />
  );
}

export function SpecimenPanel({
  accent = "surface",
  fontLoaded,
  className,
  children,
}: {
  accent?: SpecimenAccent;
  fontLoaded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-font-loaded={fontLoaded ? "true" : undefined}
      className={cn(
        "specimen-panel relative overflow-hidden",
        specimenShell(accent),
        fontLoaded && "shadow-[0_16px_48px_-24px] shadow-sidebar-primary/30 font-loaded",
        className,
      )}
    >
      <SpecimenGrain />
      {children}
    </div>
  );
}

export function SpecimenHeader({
  left,
  center,
  right,
  className,
}: {
  left: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "specimen-header relative z-20 flex items-center justify-between gap-3",
        className,
      )}
    >
      <span
        data-card-line
        className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.26em]"
      >
        {left}
      </span>
      {center ? (
        <span
          data-card-line
          className="min-w-0 truncate font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--specimen-muted)]"
        >
          {center}
        </span>
      ) : (
        <span className="flex-1" />
      )}
      {right ? (
        <span
          data-card-line
          className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--specimen-muted)]"
        >
          {right}
        </span>
      ) : null}
    </header>
  );
}

export function SpecimenBody({
  cut,
  specimenIndex,
  className,
  children,
}: {
  cut?: SpecimenCut;
  specimenIndex?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("specimen-body relative z-10", className)}>
      {specimenIndex ? (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 right-3 select-none font-mono text-[clamp(3.5rem,16vw,6rem)] font-black leading-none text-[var(--specimen-muted)] opacity-[0.14]"
        >
          {specimenIndex}
        </span>
      ) : null}
      {cut === "poster" ? <SpecimenCornerCut position="top-right" /> : null}
      {cut === "bleed" ? <SpecimenCornerCut position="bottom-right" /> : null}
      {children}
    </div>
  );
}

function SpecimenCornerCut({
  position,
}: {
  position: "top-right" | "bottom-right";
}) {
  const pos =
    position === "top-right"
      ? "right-0 top-0 border-b border-l"
      : "bottom-0 right-0 border-l border-t";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute z-0 size-6 bg-[var(--specimen-muted)]",
        pos,
        "border-[var(--specimen-border)]",
      )}
      style={{
        clipPath:
          position === "top-right"
            ? "polygon(100% 0, 0 0, 100% 100%)"
            : "polygon(100% 0, 100% 100%, 0 100%)",
      }}
    />
  );
}

export function SpecimenFooter({
  title,
  subtitle,
  badge,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "specimen-footer relative z-20 flex items-end justify-between gap-2",
        className,
      )}
    >
      <div className="min-w-0">
        <p data-card-footer className="truncate text-sm font-semibold tracking-tight">
          {title}
        </p>
        {subtitle ? (
          <p
            data-card-footer
            className="truncate font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--specimen-muted)]"
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {badge}
    </footer>
  );
}

export function SpecimenHover({ label = "Inspect specimen" }: { label?: string }) {
  return (
    <div className="specimen-hover pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <span className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-primary-foreground">
        {label}
        <ArrowUpRight className="size-3.5" aria-hidden />
      </span>
    </div>
  );
}

/** Sidebar / empty-state panel with specimen chrome. */
export function SpecimenBlock({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("specimen-block", className)}>
      {label ? (
        <p className="specimen-label mb-2.5 px-0.5">{label}</p>
      ) : null}
      {children}
    </div>
  );
}

export function SpecimenLabel({ children }: { children: ReactNode }) {
  return <p className="specimen-label px-0.5">{children}</p>;
}

export function SpecimenBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "warn" | "inverse";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "specimen-badge shrink-0",
        tone === "warn" && "specimen-badge-warn",
        tone === "inverse" && "specimen-badge-inverse",
        className,
      )}
    >
      {children}
    </span>
  );
}