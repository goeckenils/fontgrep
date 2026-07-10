import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { findScrollParent, isVisibleInScrollParent } from "@/lib/scrollParent";

describe("findScrollParent", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("returns the nearest overflow-y auto ancestor", () => {
    const scroll = document.createElement("div");
    scroll.style.overflowY = "auto";
    const child = document.createElement("div");
    const target = document.createElement("span");

    scroll.appendChild(child);
    child.appendChild(target);
    container.appendChild(scroll);

    expect(findScrollParent(target)).toBe(scroll);
  });
});

describe("isVisibleInScrollParent", () => {
  it("detects elements inside the viewport", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({
        top: 100,
        bottom: 200,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      }),
    });

    expect(isVisibleInScrollParent(el, null)).toBe(true);
    el.remove();
  });
});