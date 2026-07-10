"use client";

import { useRef, type ReactNode } from "react";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export function GsapTabPanel({
  panelKey,
  children,
  className,
}: {
  panelKey: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !motionOK()) return;

      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: dur.sm, ease: ease.out },
      );
    },
    { scope: ref, dependencies: [panelKey], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}