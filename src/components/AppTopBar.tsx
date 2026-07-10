"use client";

import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEED_SURFACE } from "@/lib/viewerTheme";
import { cn } from "@/lib/utils";

export function AppTopBar({
  title,
  subtitle,
  onBack,
  actions,
  tools,
  className,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Page-specific actions (compare, save, etc.) — left of global tools. */
  actions?: ReactNode;
  /** Global tools: shortcuts help, theme toggle, … */
  tools?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-3 border-b border-border px-3 py-3 md:px-4",
        FEED_SURFACE,
        className,
      )}
    >
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Go back"
          className="shrink-0"
        >
          <ArrowLeft />
        </Button>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {actions}
        {tools}
      </div>
    </header>
  );
}