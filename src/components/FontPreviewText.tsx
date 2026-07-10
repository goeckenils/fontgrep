"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  fontPreviewUrl,
  previewFontFamilyId,
  resolvePreviewFormat,
} from "@/lib/fontPreview";
import { usePreviewFont } from "@/hooks/usePreviewFont";
import { LAZY_FONT_ROOT_MARGIN } from "@/hooks/useGsapScrollReveal";
import { showCardFontPreviewInstant } from "@/lib/gsapFontReveal";
import { motionOK } from "@/lib/gsap";
import { isVisibleInScrollParent, resolveScrollScroller } from "@/lib/scrollParent";
import { cn } from "@/lib/utils";

function scrollRoot(el: HTMLElement): HTMLElement | null {
  const scroller = resolveScrollScroller(el);
  return scroller instanceof Window ? null : scroller;
}

interface FontPreviewTextProps {
  family: string;
  repository?: string;
  branch?: string;
  path?: string;
  format: string;
  publicPath?: string;
  /** When set, skips internal URL resolution (e.g. viewer after inspect). */
  previewUrl?: string | null;
  sample?: string;
  weight?: number;
  fontStyle?: string;
  className?: string;
  style?: CSSProperties;
  onLoadStateChange?: (state: "loading" | "loaded" | "error") => void;
  /** If true, defer font fetch+registration until the element is near viewport. */
  lazy?: boolean;
  /** SplitText word-mask reveal in GSAP card timeline. */
  cardLine?: boolean;
}

export function FontPreviewText({
  family,
  repository,
  branch,
  path,
  format,
  publicPath,
  previewUrl: previewUrlOverride,
  sample,
  weight = 400,
  fontStyle = "normal",
  className,
  style,
  onLoadStateChange,
  lazy = true,
  cardLine,
}: FontPreviewTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(!lazy);

  const activateLoad = useMemo(
    () => () => setInView((prev) => (prev ? prev : true)),
    [],
  );

  useLayoutEffect(() => {
    if (!lazy || inView) return;
    const card =
      containerRef.current?.closest<HTMLElement>("[data-reveal]") ?? null;
    const el = card ?? containerRef.current;
    if (!el) return;

    if (card?.hasAttribute("data-revealed")) {
      activateLoad();
      return;
    }

    const scrollParent = scrollRoot(el);
    const margin = parseInt(LAZY_FONT_ROOT_MARGIN, 10) || 240;
    if (isVisibleInScrollParent(el, scrollParent, margin)) {
      activateLoad();
    }
  }, [lazy, inView, activateLoad]);

  useEffect(() => {
    if (!lazy || inView) return;
    const card =
      containerRef.current?.closest<HTMLElement>("[data-reveal]") ?? null;
    const el = card ?? containerRef.current;
    if (!el) return;

    const onReveal = () => activateLoad();
    card?.addEventListener("fontgrep:reveal", onReveal);

    let revealObserver: MutationObserver | null = null;
    if (card) {
      revealObserver = new MutationObserver(() => {
        if (card.hasAttribute("data-revealed")) {
          activateLoad();
          revealObserver?.disconnect();
        }
      });
      revealObserver.observe(card, {
        attributes: true,
        attributeFilter: ["data-revealed"],
      });
    }

    const scrollParent = scrollRoot(el);
    const margin = parseInt(LAZY_FONT_ROOT_MARGIN, 10) || 240;
    if (isVisibleInScrollParent(el, scrollParent, margin)) {
      activateLoad();
      return () => {
        card?.removeEventListener("fontgrep:reveal", onReveal);
        revealObserver?.disconnect();
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) activateLoad();
      },
      {
        root: scrollParent,
        rootMargin: LAZY_FONT_ROOT_MARGIN,
        threshold: 0,
      },
    );
    observer.observe(el);
    return () => {
      card?.removeEventListener("fontgrep:reveal", onReveal);
      revealObserver?.disconnect();
      observer.disconnect();
    };
  }, [lazy, inView, activateLoad]);

  const fontFamily = useMemo(
    () => previewFontFamilyId(repository, path, publicPath),
    [repository, path, publicPath],
  );
  const resolvedFormat = resolvePreviewFormat(format, path ?? publicPath);
  const previewUrl = useMemo(() => {
    if (previewUrlOverride !== undefined) return previewUrlOverride;
    if (publicPath) return publicPath;
    if (!resolvedFormat) return null;
    return fontPreviewUrl({
      repository,
      branch,
      path,
      format: resolvedFormat,
    });
  }, [previewUrlOverride, publicPath, resolvedFormat, repository, branch, path]);

  const loadState = usePreviewFont(
    previewUrl,
    fontFamily,
    weight,
    fontStyle,
    inView,
  );
  const previewText = sample ?? "Hamburgefonts 123";

  const mapped: "loading" | "loaded" | "error" =
    loadState === "loaded"
      ? "loaded"
      : loadState === "error"
        ? "error"
        : loadState === "idle"
          ? "loading"
          : "loading";

  useEffect(() => {
    onLoadStateChange?.(mapped);
  }, [mapped, onLoadStateChange]);

  // Ref-managed copy — React must not reconcile children after SplitText splits.
  useEffect(() => {
    const copy = copyRef.current;
    if (!copy || copy.dataset.split === "true") return;
    copy.textContent = previewText;
  }, [previewText]);

  // GSAP reads face metadata imperatively — keeps React from swapping fontFamily mid-split.
  useEffect(() => {
    const shell = containerRef.current;
    if (!shell) return;
    shell.dataset.previewFamily = fontFamily;
    shell.dataset.previewWeight = String(weight);
    shell.dataset.previewStyle = fontStyle;
  }, [fontFamily, weight, fontStyle]);

  const isLoaded = mapped === "loaded";
  const isError = mapped === "error";
  const gsapReveal = Boolean(cardLine);

  useLayoutEffect(() => {
    const shell = containerRef.current;
    const copy = copyRef.current;
    if (!shell || copy?.dataset.split === "true") return;
    if (isLoaded) shell.setAttribute("data-font-loaded", "true");
    else shell.removeAttribute("data-font-loaded");
    if (isError) shell.setAttribute("data-font-error", "true");
    else shell.removeAttribute("data-font-error");
  }, [isLoaded, isError]);

  // Instant-reveal cards skip the GSAP font phase — show after the face paints.
  useEffect(() => {
    if (!gsapReveal || (!isLoaded && !isError)) return;
    const shell = containerRef.current;
    const copy = copyRef.current;
    if (!shell || !copy || copy.dataset.split === "true") return;

    const card = shell.closest<HTMLElement>("[data-reveal]");
    if (!card?.hasAttribute("data-revealed")) return;
    if (!card.hasAttribute("data-reveal-instant") && motionOK()) return;

    if (isError) {
      copy.dataset.split = "true";
      shell.style.visibility = "visible";
      shell.style.opacity = "1";
      return;
    }

    showCardFontPreviewInstant(copy);
  }, [gsapReveal, isLoaded, isError]);

  return (
    <span
      ref={containerRef}
      data-card-font-text={cardLine ? "" : undefined}
      className={cn(
        className,
        "inline-block not-italic",
        !gsapReveal && !isLoaded && !isError && "opacity-55 blur-[0.6px] transition-all duration-300",
        !gsapReveal && isLoaded && "opacity-100 transition-all duration-[650ms] ease-out",

        isError && "font-sans not-italic text-[var(--specimen-muted-on-light)]",
        isLoaded && !className?.includes("text-") && "text-foreground",
      )}
      style={{
        ...style,
        fontFamily:
          isLoaded && !gsapReveal
            ? `'${fontFamily}', system-ui, sans-serif`
            : undefined,
        fontWeight: isLoaded && !gsapReveal ? weight : undefined,
        fontStyle:
          isLoaded && !gsapReveal
            ? fontStyle !== "normal"
              ? fontStyle
              : "normal"
            : undefined,
        fontKerning: isLoaded && !gsapReveal ? "normal" : undefined,
        fontFeatureSettings:
          isLoaded && !gsapReveal ? '"liga" 1, "kern" 1' : undefined,
      }}
      title={family}
      aria-busy={!isLoaded}
    >
      <span ref={copyRef} data-font-preview-copy className="inline-block" />
    </span>
  );
}