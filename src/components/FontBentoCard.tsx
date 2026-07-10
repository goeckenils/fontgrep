"use client";

import { FontPreviewText } from "@/components/FontPreviewText";
import { BentoFontCard } from "@/components/BentoFontCard";
import { cn } from "@/lib/utils";

interface FontBentoCardProps {
  fontName: string;
  styleName: string;
  displayText: string;
  className?: string;
  repository?: string;
  branch?: string;
  path?: string;
  format?: string;
  weight?: number;
  fontStyle?: string;
  onClick?: () => void;
}

export function FontBentoCard({
  fontName,
  styleName,
  displayText,
  className,
  repository,
  branch,
  path,
  format = "ttf",
  weight = 400,
  fontStyle = "normal",
  onClick,
}: FontBentoCardProps) {
  return (
    <BentoFontCard
      fontLabel={fontName}
      styleLabel={styleName}
      onClick={onClick}
      className="min-h-[175px] md:min-h-[190px]"
      preview={
        <FontPreviewText
          family={fontName}
          repository={repository}
          branch={branch}
          path={path}
          format={format}
          sample={displayText}
          weight={weight}
          fontStyle={fontStyle}
          className={cn(
            "break-words !text-[#0f0f0f]",
            className,
          )}
          lazy
        />
      }
    />
  );
}