"use client";

import { useRef, type RefObject } from "react";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";

type MountVars = gsap.TweenVars;

export function useGsapMount<T extends HTMLElement>(
  from: MountVars,
  to: MountVars = {},
  dependencies: unknown[] = [],
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !motionOK()) return;

      gsap.fromTo(
        el,
        { opacity: 0, y: 16, ...from },
        {
          opacity: 1,
          y: 0,
          duration: dur.md,
          ease: ease.out,
          ...to,
        },
      );
    },
    { scope: ref, dependencies, revertOnUpdate: true },
  );

  return ref;
}