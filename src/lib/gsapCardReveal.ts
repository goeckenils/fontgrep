import {
  addFontReveal,
  hideFontBlocks,
  hideFontText,
  revertFontSplits,
} from "@/lib/gsapFontReveal";
import { dur, ease, gsap } from "@/lib/gsap";

const LINE_FROM = { autoAlpha: 0, y: 10 };
const LINE_TO = { autoAlpha: 1, y: 0, duration: dur.sm, ease: ease.out };

const CARD_SHELL_PAUSE = 0.16;
const META_TO_FONT_PAUSE = 0.32;
const FONT_TO_FOOTER_PAUSE = 0.12;

function hideLines(targets: gsap.TweenTarget) {
  gsap.set(targets, LINE_FROM);
}

/** Card shell → meta lines → SplitText font preview → footer. */
export function revealCardWithTextStagger(
  cards: gsap.DOMTarget | gsap.DOMTarget[],
  options?: { cardStagger?: number },
) {
  const list = gsap.utils.toArray<HTMLElement>(cards);
  const cardStagger = options?.cardStagger ?? 0.07;

  list.forEach((card, index) => {
    const meta = card.querySelectorAll<HTMLElement>("[data-card-line]");
    const fontTexts = card.querySelectorAll<HTMLElement>("[data-font-preview-copy]");
    const fontBlocks = card.querySelectorAll<HTMLElement>(
      "[data-card-font]:not(:has([data-font-preview-copy]))",
    );
    const footers = card.querySelectorAll<HTMLElement>("[data-card-footer]");

    const tl = gsap.timeline({
      delay: index * cardStagger,
      defaults: { ease: ease.out, overwrite: "auto" },
      onStart: () => {
        // Unhide card children (CSS) and kick off font fetch before the font phase.
        card.setAttribute("data-revealed", "");
        card.dispatchEvent(new CustomEvent("fontgrep:reveal", { bubbles: true }));
      },
    });

    gsap.set(card, { autoAlpha: 1, y: 28 });
    if (meta.length) hideLines(meta);
    if (fontTexts.length) {
      hideFontText(card.querySelectorAll<HTMLElement>("[data-card-font-text]"));
    }
    if (fontBlocks.length) hideFontBlocks(fontBlocks);
    if (footers.length) hideLines(footers);

    // 1 — card shell (translate only)
    tl.to(card, { y: 0, duration: dur.md, ease: ease.out });

    // 2 — labels / metadata
    if (meta.length) {
      tl.to(meta, { ...LINE_TO, stagger: 0.07 }, `+=${CARD_SHELL_PAUSE}`);
    }

    // 3 — font preview (SplitText word mask, or block fallback)
    if (fontTexts.length || fontBlocks.length) {
      addFontReveal(
        tl,
        gsap.utils.toArray<HTMLElement>(fontTexts),
        gsap.utils.toArray<HTMLElement>(fontBlocks),
        `+=${META_TO_FONT_PAUSE}`,
      );
    }

    // 4 — footer actions
    if (footers.length) {
      tl.to(footers, { ...LINE_TO, stagger: 0.06 }, `+=${FONT_TO_FOOTER_PAUSE}`);
    }
  });
}

export function cleanupCardReveals(root: ParentNode) {
  revertFontSplits(root);
}