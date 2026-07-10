import { ScrollSmoother } from "@/lib/gsap";

/** Nearest ancestor that scrolls (matches our feed `overflow-y-auto` panels). */
export function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Whether `el` is visible inside `scrollParent` (or the viewport when null). */
export function isVisibleInScrollParent(
  el: HTMLElement,
  scrollParent: HTMLElement | null,
  marginPx = 0,
): boolean {
  const elRect = el.getBoundingClientRect();
  if (elRect.width === 0 && elRect.height === 0) return false;

  const rootRect = scrollParent
    ? scrollParent.getBoundingClientRect()
    : { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };

  return (
    elRect.bottom >= rootRect.top - marginPx &&
    elRect.top <= rootRect.bottom + marginPx
  );
}

/** ScrollTrigger scroller — ScrollSmoother wrapper when active, else feed parent. */
export function resolveScrollScroller(el: HTMLElement | null): HTMLElement | Window {
  const smoother =
    typeof window !== "undefined" ? ScrollSmoother.get() : undefined;
  if (smoother) return smoother.wrapper() as HTMLElement;
  return findScrollParent(el) ?? window;
}