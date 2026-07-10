"use client";

import { useRef, type RefObject } from "react";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";

const PART_FROM = { autoAlpha: 0, y: 14 };
const PART_TO = { autoAlpha: 1, y: 0, duration: dur.sm, ease: ease.out };

function collectParts(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>("[data-viewer-part]"),
  );
}

/** Staggered viewer intro — toolbar → hero → control panels → extra. */
export function useViewerIntro(
  fontKey: string,
  enabled = true,
): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !enabled || !motionOK()) return;

      const parts = collectParts(root);
      if (!parts.length) return;

      gsap.set(parts, PART_FROM);

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      parts.forEach((part, index) => {
        const isHero = part.dataset.viewerPart === "hero";
        tl.to(
          part,
          { ...PART_TO, duration: isHero ? dur.md : dur.sm },
          index === 0 ? 0 : "-=0.2",
        );

        if (isHero) {
          const lines = part.querySelectorAll<HTMLElement>("[data-card-line]");
          if (lines.length) {
            gsap.set(lines, { autoAlpha: 0, y: 8 });
            tl.to(
              lines,
              {
                autoAlpha: 1,
                y: 0,
                stagger: 0.055,
                duration: dur.sm,
                ease: ease.out,
              },
              "-=0.18",
            );
          }
        }
      });

      return () => {
        tl.kill();
      };
    },
    { scope: ref, dependencies: [fontKey, enabled], revertOnUpdate: true },
  );

  return ref;
}