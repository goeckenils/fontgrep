"use client";

import { type ReactNode } from "react";
import { useGsapHoverLift } from "@/hooks/useGsapHoverLift";
import { cn } from "@/lib/utils";

export function BentoFontCard({
  fontLabel,
  styleLabel,
  preview,
  footer,
  onClick,
  className,
  reveal = true,
}: {
  fontLabel: string;
  styleLabel: string;
  preview: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
  reveal?: boolean;
}) {
  const cardRef = useGsapHoverLift<HTMLDivElement>();

  return (
    <div
      ref={cardRef}
      data-reveal={reveal ? "" : undefined}
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl",
        "bg-[#eaeaea] text-foreground dark:bg-[#1c1c1c] dark:text-[#f0f0f0]",
        "p-4 will-change-transform md:p-5",
        className,
      )}
    >
      <div className="flex gap-7 pb-1.5 text-[10px] font-medium uppercase tracking-[1.5px] text-foreground">
        <div>
          <span
            data-card-line
            className="block lowercase tracking-normal text-muted-foreground"
          >
            Font
          </span>
          <span data-card-line className="block max-w-[10rem] truncate" title={fontLabel}>
            {fontLabel}
          </span>
        </div>
        <div>
          <span
            data-card-line
            className="block lowercase tracking-normal text-muted-foreground"
          >
            Style
          </span>
          <span data-card-line className="block max-w-[7rem] truncate" title={styleLabel}>
            {styleLabel}
          </span>
        </div>
      </div>

      <div
        className="relative mt-auto min-w-0 overflow-hidden pt-6"
        data-bento-preview
      >
        <div className="bento-preview-fade min-w-0 max-w-full">{preview}</div>
      </div>

      {footer ? <div className="mt-0">{footer}</div> : null}
    </div>
  );
}