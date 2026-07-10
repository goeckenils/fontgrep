"use client";

import { useEffect } from "react";
import { FontPreviewText } from "@/components/FontPreviewText";
import { BentoFontCard } from "@/components/BentoFontCard";
import {
  refreshScrollReveals,
  useGsapScrollReveal,
} from "@/hooks/useGsapScrollReveal";
import {
  gridCardPreviewText,
  gridPreviewTypeClass,
  pickGridPreviewStyle,
  styleLabel,
  type DiscoveredFontFamily,
} from "@/lib/fontFamily";
import { BENTO_CARD_GRID_CLASS } from "@/lib/cardGrid";
import { cn } from "@/lib/utils";

function discoverFamilyKey(family: DiscoveredFontFamily): string {
  return `${family.repository}::${family.family}`;
}

interface BentoItem {
  fontName: string;
  previewText: string;
  styleName: string;
  weight: number;
  previewPath?: string;
  previewFormat: string;
  repository: string;
  className: string;
}

interface FontBentoGridProps {
  families: DiscoveredFontFamily[];
  onOpenViewer?: (family: DiscoveredFontFamily) => void;
  className?: string;
}

const STYLE_RECIPES = [
  "font-medium tracking-[-0.02em] text-[clamp(2.6rem,5.5vw,4.25rem)] leading-[0.88]",
  "font-semibold tracking-tight text-[clamp(2.8rem,6vw,4.5rem)] leading-[0.84]",
  "font-black tracking-[-0.03em] text-[clamp(3rem,6.5vw,4.75rem)] leading-[0.8]",
  "font-bold tracking-tight text-[clamp(2.5rem,5vw,4rem)] leading-[0.9]",
  "font-normal tracking-[0.01em] text-[clamp(2.7rem,5.8vw,4.3rem)] leading-none",
  "font-semibold tracking-[-0.015em] text-[clamp(2.65rem,5.6vw,4.35rem)] leading-[0.86]",
  "font-medium tracking-tight text-[clamp(2.4rem,5vw,3.9rem)] leading-[0.92]",
  "font-light tracking-[0.06em] text-[clamp(2.55rem,5.4vw,4.1rem)] leading-none uppercase",
];

function getStyleRecipe(index: number, weight: number): string {
  const base = STYLE_RECIPES[index % STYLE_RECIPES.length];

  if (weight >= 700 && !base.includes("font-black")) {
    return base.replace(/font-(medium|semibold|bold|normal|light)/, "font-black");
  }
  if (weight <= 300 && !base.includes("font-light")) {
    return base.replace(/font-(medium|semibold|bold|normal)/, "font-light");
  }
  return base;
}

function mapFamilyToBento(
  family: DiscoveredFontFamily,
  index: number,
): BentoItem {
  const primary = pickGridPreviewStyle(family.styles);
  const fontName = family.family;
  const styleName = primary ? styleLabel(primary) : "Regular";

  const previewText = gridCardPreviewText(fontName);
  const recipe = getStyleRecipe(index, primary?.weight ?? 400);

  return {
    fontName,
    previewText,
    styleName,
    weight: primary?.weight ?? 400,
    previewPath: primary?.path,
    previewFormat: primary?.format ?? "ttf",
    repository: family.repository,
    className: cn("break-words", gridPreviewTypeClass(previewText, recipe)),
  };
}

export function FontBentoGrid({
  families,
  onOpenViewer,
  className,
}: FontBentoGridProps) {
  const gridRef = useGsapScrollReveal<HTMLDivElement>([families.length]);

  useEffect(() => {
    refreshScrollReveals(gridRef.current);
  }, [families.length]);

  if (!families.length) return null;

  const items = families.map((f, i) => mapFamilyToBento(f, i));

  return (
    <div ref={gridRef} className={className}>
      <div className={BENTO_CARD_GRID_CLASS}>
        {items.map((item, index) => {
          const originalFamily = families[index];

          return (
            <BentoFontCard
              key={discoverFamilyKey(originalFamily)}
              fontLabel={item.fontName}
              styleLabel={item.styleName}
              onClick={() => onOpenViewer?.(originalFamily)}
              className={cn(
                index % 7 === 0 && "min-h-[175px] p-5 sm:min-h-[190px] xl:min-h-[205px] md:p-6",
                index % 5 === 2 && "min-h-[175px] sm:min-h-[190px] xl:min-h-[158px]",
                !(index % 7 === 0) &&
                  !(index % 5 === 2) &&
                  "min-h-[175px] sm:min-h-[190px]",
              )}
              preview={
                <FontPreviewText
                  family={item.fontName}
                  repository={originalFamily.repository}
                  branch={originalFamily.branch}
                  path={item.previewPath}
                  format={item.previewFormat}
                  sample={item.previewText}
                  weight={item.weight}
                  fontStyle="normal"
                  cardLine
                  className={cn("not-italic text-foreground", item.className)}
                  lazy
                />
              }
            />
          );
        })}
      </div>

      <div className="mt-8 w-full pl-1 text-xs font-medium uppercase tracking-[2px] text-muted-foreground md:mt-10">
        fontgrep · real fonts from the wild
      </div>
    </div>
  );
}