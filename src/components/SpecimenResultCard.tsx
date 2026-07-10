"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { contextHandler, dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";
import { ArrowUpRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FontPreviewText } from "@/components/FontPreviewText";
import { LicenseBadge } from "@/components/LicenseBadge";
import {
  SpecimenBody,
  SpecimenFooter,
  SpecimenHeader,
  SpecimenHover,
  SpecimenPanel,
} from "@/components/specimen/SpecimenChrome";
import { hashString } from "@/lib/discoverPin";
import { toSpecimenAccent } from "@/lib/specimenTheme";
import { cn } from "@/lib/utils";

const ACCENTS = ["primary", "inverse", "accent", "void"] as const;

export function SpecimenResultCard({
  cardKey,
  specimenIndex,
  headerLeft,
  headerCenter,
  headerRight,
  title,
  subtitle,
  preview,
  footer,
  actions,
  onOpen,
  hoverLabel = "Open specimen",
}: {
  cardKey: string;
  specimenIndex?: string;
  headerLeft: string;
  headerCenter?: string;
  headerRight?: string;
  title: string;
  subtitle?: string;
  preview: {
    family: string;
    repository?: string;
    branch?: string;
    path?: string;
    format: string;
    publicPath?: string;
    sample: string;
    className?: string;
  };
  footer?: ReactNode;
  actions?: ReactNode;
  onOpen: () => void;
  hoverLabel?: string;
}) {
  const h = hashString(cardKey);
  const accent = toSpecimenAccent(ACCENTS[h % ACCENTS.length]);
  const index =
    specimenIndex ?? String((h % 899) + 100);
  const [fontLoaded, setFontLoaded] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = articleRef.current;
      if (!el || !motionOK()) return;

      const panel = el.querySelector<HTMLElement>(".specimen-panel");
      const hover = el.querySelector<HTMLElement>(".specimen-hover");
      if (hover) gsap.set(hover, { opacity: 0 });

      const onEnter = contextHandler(contextSafe, () => {
        if (panel) {
          gsap.to(panel, { y: -4, scale: 1.012, duration: dur.sm, ease: ease.out });
        }
        if (hover) {
          gsap.to(hover, { opacity: 1, duration: dur.sm, ease: ease.out });
        }
      });

      const onLeave = contextHandler(contextSafe, () => {
        if (panel) {
          gsap.to(panel, { y: 0, scale: 1, duration: dur.sm, ease: ease.inOut });
        }
        if (hover) {
          gsap.to(hover, { opacity: 0, duration: dur.sm, ease: ease.inOut });
        }
      });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: articleRef },
  );

  const layoutClass = useMemo(() => {
    const mode = h % 3;
    if (mode === 0) return "text-[clamp(2.15rem,8.2vw,3.75rem)] leading-[1.0]";
    if (mode === 1) return "text-[clamp(2.65rem,9.4vw,4.35rem)] leading-[0.94]";
    return "text-[clamp(1.9rem,7.4vw,3.25rem)] leading-[1.02]";
  }, [h]);

  return (
    <article
      ref={articleRef}
      data-reveal
      data-gsap-hover
      className="group relative cursor-pointer will-change-transform"
      onClick={onOpen}
    >
      <SpecimenPanel accent={accent} fontLoaded={fontLoaded}>
        <SpecimenHeader
          left={headerLeft || `Spec.${index}`}
          center={headerCenter}
          right={headerRight}
        />
        <SpecimenBody specimenIndex={index}>
          <div className="flex min-h-[10.5rem] items-center px-4 py-5 sm:min-h-[11.5rem]">
            <FontPreviewText
              {...preview}
              cardLine
              lazy
              className={cn("block w-full", layoutClass)}
              onLoadStateChange={(s) => setFontLoaded(s === "loaded")}
            />
          </div>
        </SpecimenBody>
        <SpecimenFooter
          title={title}
          subtitle={subtitle}
          badge={footer}
        />
        {actions ? (
          <div
            className="relative z-20 flex flex-wrap items-center gap-2 px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
        <SpecimenHover label={hoverLabel} />
      </SpecimenPanel>
    </article>
  );
}

export function SpecimenViewAction({
  onClick,
  label = "View",
}: {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className="ml-auto"
      data-icon="inline-end"
      onClick={onClick}
    >
      <Eye aria-hidden />
      {label}
      <ArrowUpRight aria-hidden />
    </Button>
  );
}