"use client";

import { useRef, type RefObject } from "react";
import { revealCardWithTextStagger } from "@/lib/gsapCardReveal";
import { hideFontText } from "@/lib/gsapFontReveal";
import {
  findScrollParent,
  isVisibleInScrollParent,
  resolveScrollScroller,
} from "@/lib/scrollParent";
import { gsap, motionOK, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** ScrollTrigger `start: "top 93%"` — used for font lazy-load alignment. */
export const SCROLL_REVEAL_START = "top 93%";

const SCROLL_REVEAL_VIEWPORT_RATIO = 0.93;

/** Y coordinate (viewport) where ScrollTrigger `top 93%` fires for a scroller. */
export function scrollRevealTriggerY(scroller: HTMLElement | Window): number {
  if (scroller instanceof Window) {
    return window.innerHeight * SCROLL_REVEAL_VIEWPORT_RATIO;
  }
  const rect = scroller.getBoundingClientRect();
  return rect.top + scroller.clientHeight * SCROLL_REVEAL_VIEWPORT_RATIO;
}

function isPastScrollRevealTrigger(
  el: HTMLElement,
  scroller: HTMLElement | Window,
): boolean {
  return el.getBoundingClientRect().top <= scrollRevealTriggerY(scroller);
}

/** Prefetch fonts slightly before they enter the scrollport. */
export const LAZY_FONT_ROOT_MARGIN = "240px 0px";

function revealWithoutMotion(items: HTMLElement[]) {
  items.forEach((card) => {
    card.setAttribute("data-revealed", "");
    card.setAttribute("data-reveal-instant", "");
    card.dispatchEvent(new CustomEvent("fontgrep:reveal", { bubbles: true }));
    gsap.set(card, { autoAlpha: 1, y: 0, clearProps: "transform" });
    gsap.set(
      card.querySelectorAll("[data-card-line], [data-card-font], [data-card-footer]"),
      { autoAlpha: 1, y: 0 },
    );
    const fontShells = card.querySelectorAll<HTMLElement>("[data-card-font-text]");
    if (fontShells.length) hideFontText(fontShells);
  });
}

/**
 * After remount (e.g. back from viewer), ScrollTrigger won't re-fire for cards
 * already above the trigger line. Reveal visible cards with motion; scrolled-past
 * cards instantly so nothing stays hidden in CSS.
 */
export function revealCardsAlreadyInView(
  root: HTMLElement,
  scroller?: HTMLElement | Window,
) {
  const resolvedScroller = scroller ?? resolveScrollScroller(root);
  const scrollEl: HTMLElement | null =
    resolvedScroller instanceof Window ? null : resolvedScroller;
  const items = root.querySelectorAll<HTMLElement>(
    "[data-reveal]:not([data-revealed])",
  );
  const animate: HTMLElement[] = [];
  const instant: HTMLElement[] = [];

  (gsap.utils.toArray(items) as HTMLElement[]).forEach((el) => {
    if (!isPastScrollRevealTrigger(el, resolvedScroller)) return;
    if (isVisibleInScrollParent(el, scrollEl)) animate.push(el);
    else instant.push(el);
  });

  if (instant.length) revealWithoutMotion(instant);
  if (animate.length) revealCardWithTextStagger(animate);
}

/** After React paints new cards, refresh ScrollTrigger and reveal anything already on screen. */
export function refreshScrollReveals(root: HTMLElement | null) {
  if (!root || !motionOK()) return;
  const scroller = resolveScrollScroller(root);
  const run = () => {
    ScrollTrigger.refresh();
    revealCardsAlreadyInView(root, scroller);
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
  // Tab panel fade-in after back navigation can shift layout — refresh once more.
  window.setTimeout(run, 360);
}

export function useGsapScrollReveal<T extends HTMLElement>(
  dependencies: unknown[] = [],
  scrollerRef?: RefObject<HTMLElement | null>,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;

      const items = root.querySelectorAll<HTMLElement>(
        "[data-reveal]:not([data-revealed])",
      );
      if (!items.length) return;

      if (!motionOK()) {
        revealWithoutMotion(gsap.utils.toArray(items));
        return;
      }

      const scroller =
        scrollerRef?.current ?? resolveScrollScroller(root);

      ScrollTrigger.batch(items, {
        onEnter: (batch) => {
          revealCardWithTextStagger(batch);
        },
        start: SCROLL_REVEAL_START,
        once: true,
        scroller,
      });

      refreshScrollReveals(root);
    },
    { scope: ref, dependencies, revertOnUpdate: false },
  );

  return ref;
}