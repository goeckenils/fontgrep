"use client";

import { useRef, type RefObject } from "react";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";

const FROM = { opacity: 0, x: -12, y: 6 };
const TO = { opacity: 1, x: 0, y: 0, duration: dur.sm, ease: ease.out };

function collect(
  root: ParentNode,
  part: string,
): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(`[data-sidebar-part="${part}"]`),
  );
}

function setHidden(targets: gsap.TweenTarget) {
  gsap.set(targets, FROM);
}

function staggerTo(
  targets: gsap.TweenTarget,
  position?: string | number,
  timeline?: gsap.core.Timeline,
) {
  const tween = {
    ...TO,
    stagger: 0.055,
  };
  if (timeline) {
    return timeline.to(targets, tween, position);
  }
  return gsap.to(targets, tween);
}

/** One-shot intro: header → workspace → nav → divider → panel → footer. */
export function useSidebarIntro(): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !motionOK()) return;

      const header = root.querySelector<HTMLElement>('[data-sidebar-part="header"]');
      const workspace = root.querySelector<HTMLElement>('[data-sidebar-part="workspace"]');
      const navItems = collect(root, "nav-item");
      const divider = root.querySelector<HTMLElement>('[data-sidebar-part="divider"]');
      const panelItems = collect(root, "panel-item");
      const footerItems = collect(root, "footer-item");
      const footerBtn = root.querySelector<HTMLElement>('[data-sidebar-part="footer-btn"]');

      const all = [
        header,
        workspace,
        ...navItems,
        divider,
        ...panelItems,
        ...footerItems,
        footerBtn,
      ].filter(Boolean);
      setHidden(all);

      const tl = gsap.timeline({ defaults: { ease: ease.out } });

      if (header) tl.to(header, { ...TO, duration: dur.md });
      if (workspace) tl.to(workspace, TO, "-=0.24");
      if (navItems.length) staggerTo(navItems, "-=0.2", tl);
      if (divider) {
        gsap.set(divider, {
          opacity: 1,
          x: 0,
          y: 0,
          scaleX: 0,
          transformOrigin: "left center",
        });
        tl.to(
          divider,
          { scaleX: 1, duration: dur.sm, ease: ease.inOut },
          "-=0.14",
        );
      }
      if (panelItems.length) staggerTo(panelItems, "-=0.1", tl);
      if (footerItems.length) staggerTo(footerItems, "-=0.12", tl);
      if (footerBtn) tl.to(footerBtn, TO, "-=0.1");

      return () => {
        tl.kill();
      };
    },
    { scope: ref },
  );

  return ref;
}

/** Re-stagger panel blocks when the active tab changes (skips first run — intro handles it). */
export function useSidebarPanelStagger(
  tab: string,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const skip = useRef(true);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !motionOK()) return;

      if (skip.current) {
        skip.current = false;
        return;
      }

      const items = collect(root, "panel-item");
      if (!items.length) return;

      const tl = gsap.timeline();
      setHidden(items);
      staggerTo(items, 0, tl);

      return () => {
        tl.kill();
      };
    },
    { scope: ref, dependencies: [tab], revertOnUpdate: true },
  );

  return ref;
}

/** Stagger filter drawer children when expanded. */
export function useSidebarFiltersStagger(
  open: boolean,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root || !open || !motionOK()) return;

      const items = collect(root, "filter-item");
      if (!items.length) return;

      const tl = gsap.timeline();
      gsap.set(root, { height: "auto", opacity: 1 });
      setHidden(items);
      staggerTo(items, 0, tl);

      return () => {
        tl.kill();
      };
    },
    { scope: ref, dependencies: [open], revertOnUpdate: true },
  );

  return ref;
}