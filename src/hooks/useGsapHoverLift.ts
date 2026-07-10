"use client";

import { useRef, type RefObject } from "react";
import { contextHandler, dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";

type HoverLiftOptions = {
  y?: number;
  scale?: number;
  previewScale?: number;
};

export function useGsapHoverLift<T extends HTMLElement>(
  options: HoverLiftOptions = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const { y = -5, scale = 1.014, previewScale = 1.025 } = options;

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el || !motionOK()) return;

      const preview = el.querySelector<HTMLElement>("[data-bento-preview]");

      const onEnter = contextHandler(contextSafe, () => {
        gsap.to(el, {
          y,
          scale,
          boxShadow: "0 14px 44px -18px rgba(0,0,0,0.38)",
          duration: dur.sm,
          ease: ease.out,
          overwrite: "auto",
        });
        if (preview) {
          gsap.to(preview, {
            scale: previewScale,
            duration: dur.md,
            ease: ease.out,
            overwrite: "auto",
          });
        }
      });

      const onLeave = contextHandler(contextSafe, () => {
        gsap.to(el, {
          y: 0,
          scale: 1,
          boxShadow: "0 0 0 rgba(0,0,0,0)",
          duration: dur.sm,
          ease: ease.inOut,
          overwrite: "auto",
        });
        if (preview) {
          gsap.to(preview, {
            scale: 1,
            duration: dur.md,
            ease: ease.inOut,
            overwrite: "auto",
          });
        }
      });

      const onDown = contextHandler(contextSafe, () => {
        gsap.to(el, {
          scale: 0.988,
          duration: dur.xs,
          ease: ease.out,
          overwrite: "auto",
        });
      });

      const onUp = contextHandler(contextSafe, () => {
        gsap.to(el, {
          scale,
          duration: dur.xs,
          ease: ease.out,
          overwrite: "auto",
        });
      });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("mousedown", onDown);
      el.addEventListener("mouseup", onUp);

      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("mousedown", onDown);
        el.removeEventListener("mouseup", onUp);
      };
    },
    { scope: ref },
  );

  return ref;
}