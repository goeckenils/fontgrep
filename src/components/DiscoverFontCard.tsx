"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { contextHandler, dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";
import { FontPreviewText } from "@/components/FontPreviewText";
import { LicenseBadge, licenseStatus } from "@/components/LicenseBadge";
import {
  SpecimenBadge,
  SpecimenBody,
  SpecimenFooter,
  SpecimenHeader,
  SpecimenHover,
  SpecimenPanel,
} from "@/components/specimen/SpecimenChrome";
import { discoverPinVariant } from "@/lib/discoverPin";
import type { DiscoveredFontFamily } from "@/lib/fontFamily";
import { layoutCut, toSpecimenAccent } from "@/lib/specimenTheme";
import { cn } from "@/lib/utils";

type PreviewProps = {
  family: string;
  repository: string;
  branch: string;
  path: string;
  format: string;
  weight: number;
  fontStyle: string;
  sample: string;
  className?: string;
  style?: CSSProperties;
  onLoadStateChange?: (state: "loading" | "loaded" | "error") => void;
};

export function DiscoverFontCard({
  family,
  previewText,
  onOpenViewer,
}: {
  family: DiscoveredFontFamily;
  previewText: string;
  onOpenViewer: (f: DiscoveredFontFamily) => void;
}) {
  const primary = family.styles[0];
  const pinKey = `${family.repository}::${family.family}`;
  const variant = useMemo(
    () => discoverPinVariant(pinKey, previewText, family.styles.length),
    [pinKey, previewText, family.styles.length],
  );
  const unlicensed = licenseStatus(family.license) === "unknown";
  const [fontLoaded, setFontLoaded] = useState(false);

  const previewProps: PreviewProps | null = primary
    ? {
        family: family.family,
        repository: family.repository,
        branch: family.branch,
        path: primary.path,
        format: primary.format,
        weight: primary.weight,
        fontStyle: primary.style,
        sample: variant.sample,
        onLoadStateChange: (s) => setFontLoaded(s === "loaded"),
      }
    : null;

  const cut = layoutCut(variant.layout);

  // Extra creative metadata line
  const cutLabel = `${primary?.weight ?? 400} ${primary?.style === "italic" ? "Italic" : ""}`.trim();
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

  return (
    <article
      ref={articleRef}
      data-reveal
      data-gsap-hover
      className="group relative cursor-pointer will-change-transform"
      onClick={() => onOpenViewer(family)}
    >
      <SpecimenPanel
        accent={toSpecimenAccent(variant.accent)}
        fontLoaded={fontLoaded}
      >
        <SpecimenHeader
          left={`Spec.${variant.specimenIndex}`}
          center={family.repository.split("/")[0]}
          right={`${family.styles.length} cut${family.styles.length === 1 ? "" : "s"}`}
        />

        {previewProps ? (
          <SpecimenBody
            cut={cut}
            specimenIndex={variant.specimenIndex}
          >
            <PinBody
              variant={variant}
              previewText={previewText}
              cutLabel={cutLabel}
              {...previewProps}
              fontLoaded={fontLoaded}
            />
          </SpecimenBody>
        ) : null}

        <SpecimenFooter
          title={family.family}
          subtitle={family.repository}
          badge={
            unlicensed ? (
              <LicenseBadge license={family.license} />
            ) : (
              <SpecimenBadge tone="neutral" className="hidden group-hover:block">
                {cutLabel || "TYPE"}
              </SpecimenBadge>
            )
          }
        />

        <SpecimenHover label="Open specimen" />
      </SpecimenPanel>
    </article>
  );
}

function PinBody({
  variant,
  previewText,
  fontLoaded,
  cutLabel,
  ...preview
}: PreviewProps & {
  variant: ReturnType<typeof discoverPinVariant>;
  previewText: string;
  fontLoaded: boolean;
  cutLabel?: string;
}) {
  const strokeClass = variant.stroke
    ? "[-webkit-text-stroke:1.6px_currentColor] text-transparent"
    : "";

  const textStyle: CSSProperties = {
    letterSpacing: variant.tracking,
    transform: `rotate(${variant.rotate}deg) scale(${variant.scale})`,
  };

  // Extremely creative treatments — still 100% readable + functional.
  switch (variant.layout) {
    case "poster":
      // Monumental impact poster. Huge hero + micro printed label.
      return (
        <div className="relative flex min-h-[13rem] items-center justify-center overflow-hidden px-5 py-9 sm:min-h-[15rem]">
          <FontPreviewText
            {...preview}
            sample={preview.sample}
            className={cn(
              "pointer-events-none absolute select-none text-[clamp(5.5rem,22vw,10rem)] leading-[0.78] opacity-[0.08]",
              strokeClass,
            )}
            style={{ ...textStyle, transform: `rotate(${variant.rotate * 0.6}deg) scale(${variant.scale * 0.995})` }}
          />
          <FontPreviewText
            {...preview}
            cardLine
            className={cn(
              "relative z-10 text-[clamp(5.2rem,21vw,9.6rem)] leading-[0.78] font-semibold tracking-[-0.02em]",
              "transition-transform duration-700 group-hover:scale-[1.035]",
              strokeClass,
            )}
            style={textStyle}
          />
          {cutLabel && (
            <div className="absolute bottom-3 right-4 font-mono text-[9px] tracking-[3px] text-[var(--specimen-muted)]/70">
              {cutLabel}
            </div>
          )}
        </div>
      );

    case "monolith":
      // Brutalist single massive word. Architectural.
      return (
        <div className="relative flex min-h-[12rem] items-center justify-center overflow-hidden px-5 py-8">
          <FontPreviewText
            {...preview}
            cardLine
            className={cn(
              "text-[clamp(4.25rem,17.5vw,7.75rem)] leading-[0.82] font-medium",
              strokeClass,
              "transition-all duration-500 group-hover:tracking-[-0.01em]",
            )}
            style={textStyle}
          />
        </div>
      );

    case "cascade":
      // Layered press sheets. Overlapping impressions.
      return (
        <div className="relative min-h-[13rem] overflow-hidden px-5 py-7 sm:min-h-[14rem]">
          {[0, 1, 2].map((i) => {
            const isHero = i === 2;
            return (
              <FontPreviewText
                key={i}
                {...preview}
                cardLine
                sample={isHero ? preview.sample : (variant.secondary ?? preview.sample)}
                className={cn(
                  "block leading-[0.84] transition-all",
                  i === 0 && "text-[22px] sm:text-2xl text-[var(--specimen-muted)]/70 -rotate-[1.2deg]",
                  i === 1 && "text-4xl sm:text-[42px] -mt-1.5 text-[var(--specimen-muted)]/80",
                  i === 2 && "text-[52px] sm:text-[66px] -mt-2.5 font-semibold",
                  isHero && strokeClass,
                )}
                style={isHero ? textStyle : undefined}
              />
            );
          })}
          <div className="absolute bottom-2.5 left-5 text-[9px] font-mono tracking-[2px] text-[var(--specimen-muted)]">
            {cutLabel}
          </div>
        </div>
      );

    case "bleed":
      // Full-bleed dramatic. Text runs off edge conceptually.
      return (
        <div className="relative min-h-[12rem] overflow-hidden px-4 py-6 pr-8 sm:min-h-[13rem]">
          <FontPreviewText
            {...preview}
            cardLine
            className={cn(
              "block text-[clamp(2.75rem,11.5vw,5rem)] leading-[0.86] font-medium",
              "transition-all group-hover:-translate-x-0.5",
            )}
            style={{ ...textStyle, letterSpacing: "0.015em" }}
          />
          <div className="absolute -bottom-px right-4 h-px w-12 bg-[var(--specimen-border)]" />
        </div>
      );

    case "marginalia":
      // Classic type manual marginal note style.
      return (
        <div className="grid min-h-[12rem] grid-cols-[minmax(0,1fr)_4.25rem] sm:min-h-[13rem]">
          <div className="flex items-center px-4 py-5">
            <FontPreviewText
              {...preview}
              cardLine
              className={cn(
                "text-[clamp(2.1rem,8.5vw,3.6rem)] leading-[1.02] font-medium",
                strokeClass,
              )}
              style={textStyle}
            />
          </div>
          <div className="flex flex-col justify-between border-l border-[var(--specimen-border)] py-4 pl-2.5 pr-3 text-[var(--specimen-muted)]">
            <FontPreviewText
              {...preview}
              cardLine
              sample={
                variant.secondary?.split("·")[1]?.trim() ??
                preview.sample.slice(0, 7).toUpperCase()
              }
              className="text-[10px] leading-[1.05] [writing-mode:vertical-rl] tracking-[1.5px]"
            />
            <div className="font-mono text-[8px] font-semibold uppercase tracking-[3px]">{cutLabel}</div>
          </div>
        </div>
      );

    case "grid":
      // Modular grid study. Excellent for showing rhythm.
      return (
        <div className="grid min-h-[12rem] grid-cols-2 gap-x-5 gap-y-2 px-5 py-6 sm:min-h-[13rem]">
          {preview.sample.split(/\s+/).slice(0, 4).map((word, i) => (
            <FontPreviewText
              key={i}
              {...preview}
              cardLine
              sample={word}
              className={cn(
                "text-[27px] leading-none sm:text-[33px] font-medium transition-transform",
                i % 2 === 1 && "text-right -translate-y-px",
                i === 0 && "scale-[1.01]",
              )}
              style={i === 0 ? textStyle : undefined}
            />
          ))}
        </div>
      );

    case "stamp":
      // Ink stamp / woodblock. Heavy border, rotated energy.
      return (
        <div className="relative m-3 min-h-[11rem] border-[2.5px] border-[var(--specimen-border)] px-5 py-5 sm:min-h-[12rem]">
          <div className="absolute right-3 top-3 font-mono text-[8px] font-semibold uppercase tracking-[3.5px] text-[var(--specimen-muted)]">
            PROOF
          </div>
          <FontPreviewText
            {...preview}
            cardLine
            className={cn(
              "block pt-3 text-[clamp(1.65rem,6.8vw,2.85rem)] leading-[0.98]",
              strokeClass,
            )}
            style={textStyle}
          />
          {cutLabel && <div className="mt-1 text-[9px] font-mono tracking-[2.5px] text-[var(--specimen-muted)]">{cutLabel}</div>}
        </div>
      );

    case "vertical":
      // Japanese wood type + caption. Dramatic vertical + body.
      return (
        <div className="flex min-h-[12.5rem] items-stretch gap-3 px-4 py-4">
          <div className="flex items-center border-r border-[var(--specimen-border)] pr-2.5">
            <FontPreviewText
              {...preview}
              cardLine
              sample={preview.sample.slice(0, 2)}
              className="text-[clamp(3.4rem,13vw,5.6rem)] leading-none font-semibold"
              style={{ writingMode: "vertical-rl", letterSpacing: variant.tracking }}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center text-[15px] leading-snug sm:text-[17px]">
            <FontPreviewText
              {...preview}
              cardLine
              sample={previewText.slice(0, 78)}
              className="transition-opacity"
            />
            <div className="mt-2 font-mono text-[9px] tracking-[1.5px] text-[var(--specimen-muted)]">{cutLabel}</div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4">
          <FontPreviewText {...preview} cardLine className="text-4xl font-medium" />
        </div>
      );
  }
}