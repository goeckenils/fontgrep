"use client";

import { type RefObject } from "react";
import {
  motionOK,
  ScrollSmoother,
  ScrollTrigger,
  useGSAP,
} from "@/lib/gsap";

export const SCROLL_SMOOTHER_CONFIG = {
  smooth: 1,
  effects: true,
  smoothTouch: 0.1,
} as const;

/** GSAP ScrollSmoother — create before ScrollTriggers (see gsap.com/docs). */
export function useScrollSmoother(
  wrapperRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      if (!wrapper || !content || !enabled || !motionOK()) return;

      const smoother = ScrollSmoother.create({
        wrapper,
        content,
        ...SCROLL_SMOOTHER_CONFIG,
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        smoother.kill();
        ScrollTrigger.defaults({ scroller: window });
        ScrollTrigger.refresh();
      };
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );
}