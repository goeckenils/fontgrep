import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText);
}

export { gsap, useGSAP, ScrollTrigger, ScrollSmoother, SplitText };

export const ease = {
  out: "power2.out",
  inOut: "power2.inOut",
  expo: "expo.out",
  snap: "power3.out",
} as const;

export const dur = {
  xs: 0.16,
  sm: 0.28,
  md: 0.42,
  lg: 0.58,
} as const;

export function motionOK(): boolean {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type ContextSafe = (func: () => void) => () => void;

export function contextHandler(
  contextSafe: ContextSafe | undefined,
  handler: () => void,
): () => void {
  return contextSafe ? contextSafe(handler) : handler;
}