import { SplitText } from "gsap/SplitText";
import { dur, ease, gsap } from "@/lib/gsap";

const splits = new WeakMap<HTMLElement, SplitText>();

const WORD_STAGGER = 0.08;
const WORD_DURATION = dur.lg;

const BLOCK_FROM = { autoAlpha: 0, y: 18, scale: 0.97, transformOrigin: "left center" };
const BLOCK_TO = {
  autoAlpha: 1,
  y: 0,
  scale: 1,
  duration: dur.md,
  ease: ease.expo,
};

export function hideFontBlocks(targets: gsap.TweenTarget) {
  gsap.set(targets, BLOCK_FROM);
}

export function hideFontText(targets: gsap.TweenTarget) {
  gsap.set(targets, { autoAlpha: 0 });
}

function showFontShell(el: HTMLElement) {
  const shell = el.closest<HTMLElement>("[data-card-font-text]");
  if (shell) {
    gsap.set(shell, { autoAlpha: 1, visibility: "visible", opacity: 1 });
    shell.classList.remove("opacity-0");
  }
}

/** Apply the loaded face once on the shell — avoids React style churn mid-SplitText. */
function applyFaceToShell(el: HTMLElement) {
  const shell = el.closest<HTMLElement>("[data-card-font-text]");
  if (!shell || shell.getAttribute("data-font-error") === "true") return;

  const family = shell.dataset.previewFamily;
  if (!family) return;

  const weight = shell.dataset.previewWeight ?? "400";
  const fontStyle = shell.dataset.previewStyle ?? "normal";

  shell.style.fontFamily = `'${family}', system-ui, sans-serif`;
  shell.style.fontWeight = weight;
  shell.style.fontStyle = fontStyle;
  shell.style.fontKerning = "normal";
  shell.style.fontFeatureSettings = '"liga" 1, "kern" 1';
}

function countWords(el: HTMLElement): number {
  const text = el.textContent?.trim();
  if (!text) return 1;
  return text.split(/\s+/).filter(Boolean).length;
}

function slotDuration(wordCount: number): number {
  return WORD_DURATION + Math.max(0, wordCount - 1) * WORD_STAGGER;
}

async function ensureFontPainted(shell: HTMLElement): Promise<void> {
  if (shell.getAttribute("data-font-error") === "true") return;
  const family = shell.dataset.previewFamily;
  if (!family) return;
  const weight = shell.dataset.previewWeight ?? "400";
  const fontStyle = shell.dataset.previewStyle ?? "normal";
  try {
    await document.fonts.load(`${fontStyle} ${weight} 16px '${family}'`);
  } catch {
    /* face may still paint on next frame */
  }
}

function runWordReveal(el: HTMLElement): gsap.core.Tween | gsap.core.Timeline {
  applyFaceToShell(el);
  el.dataset.split = "true";

  splits.get(el)?.revert();

  const split = SplitText.create(el, {
    type: "words",
    mask: "words",
    tag: "span",
    aria: "auto",
    wordsClass: "font-reveal-word",
  });

  splits.set(el, split);

  if (!split.words.length) {
    showFontShell(el);
    return gsap.fromTo(
      el,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: WORD_DURATION, ease: ease.expo },
    );
  }

  gsap.set(split.words, {
    display: "inline-block",
    y: 36,
    opacity: 0,
    force3D: true,
  });

  showFontShell(el);

  return gsap.to(split.words, {
    y: 0,
    opacity: 1,
    duration: WORD_DURATION,
    ease: ease.expo,
    stagger: WORD_STAGGER,
    force3D: true,
    overwrite: "auto",
  });
}

function whenFontReady(el: HTMLElement, run: () => void, maxWaitMs = 12000) {
  const shell = el.closest<HTMLElement>("[data-card-font-text]");
  if (!shell) {
    run();
    return;
  }

  const isReady = () =>
    shell.getAttribute("data-font-loaded") === "true" ||
    shell.getAttribute("data-font-error") === "true";

  if (isReady()) {
    run();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    observer.disconnect();
    clearTimeout(timer);
    const shell = el.closest<HTMLElement>("[data-card-font-text]");
    void (async () => {
      if (shell) await ensureFontPainted(shell);
      await run();
    })();
  };

  const observer = new MutationObserver(() => {
    if (isReady()) finish();
  });
  observer.observe(shell, {
    attributes: true,
    attributeFilter: ["data-font-loaded", "data-font-error"],
  });
  const timer = setTimeout(finish, maxWaitMs);
}

function addWordMaskReveal(
  fontTl: gsap.core.Timeline,
  el: HTMLElement,
  position: string | number,
) {
  const words = countWords(el);
  const slotDur = slotDuration(words);

  fontTl.to(
    {},
    {
      duration: slotDur,
      onStart: () => {
        whenFontReady(el, () => runWordReveal(el));
      },
    },
    position,
  );
}

/** SplitText word-mask reveal when the font phase starts. */
export function addFontReveal(
  parent: gsap.core.Timeline,
  textEls: HTMLElement[],
  blockEls: HTMLElement[],
  position: string | number,
) {
  if (!textEls.length && !blockEls.length) return;

  const fontTl = gsap.timeline();

  textEls.forEach((el, index) => {
    addWordMaskReveal(fontTl, el, index > 0 ? "+=0.1" : 0);
  });

  blockEls.forEach((el, index) => {
    const offset =
      textEls.length === 0 && index === 0 ? 0 : index === 0 ? "+=0.08" : "+=0.08";
    fontTl.to(el, BLOCK_TO, offset);
  });

  parent.add(fontTl, position);
}

/** Instant-reveal cards (no motion / back-nav) — show only after the face paints. */
export function showCardFontPreviewInstant(copyEl: HTMLElement) {
  if (copyEl.dataset.split === "true") return;
  whenFontReady(copyEl, () => {
    applyFaceToShell(copyEl);
    copyEl.dataset.split = "true";
    showFontShell(copyEl);
    gsap.set(copyEl, { autoAlpha: 1, y: 0, opacity: 1, clearProps: "transform" });
  });
}

export function revertFontSplits(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("[data-font-preview-copy]").forEach((el) => {
    const split = splits.get(el);
    split?.revert();
    delete el.dataset.split;
    splits.delete(el);
  });
}