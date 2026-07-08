/**
 * Hand-picked open-source fonts worth discovering — curated instead of scraping
 * the noisy GitHub code index. Each entry points to its canonical source repo.
 * Licenses are the commonly shipped license for that project.
 */
export interface CuratedFont {
  name: string;
  category: "sans" | "serif" | "mono" | "display" | "handwriting";
  license: "OFL" | "MIT" | "Apache-2.0" | "Public Domain" | "CC0";
  /** Canonical GitHub repo, e.g. "ryanoasis/nerd-fonts" */
  repo: string;
  description: string;
}

export const CURATED_FONTS: CuratedFont[] = [
  // Sans
  { name: "Space Grotesk", category: "sans", license: "OFL", repo: "floriankarsten/space-grotesk", description: "Proportional sans with a quirky, technical feel." },
  { name: "Work Sans", category: "sans", license: "OFL", repo: "wearehero/worksans", description: "Low-contrast grotesque tuned for screens and UI." },
  { name: "IBM Plex Sans", category: "sans", license: "OFL", repo: "IBM/plex/tree/master/IBM-Plex-Sans", description: "Corporate sans with a warm, humanist character." },
  { name: "Sora", category: "sans", license: "OFL", repo: "Sora-font/sora", description: "Geometric sans designed for digital products." },
  { name: "Manrope", category: "sans", license: "OFL", repo: "sharanda/manrope", description: "Modern semi-condensed sans with tight spacing." },
  { name: "Hanken Grotesk", category: "sans", license: "OFL", repo: "HankenDesignCo/Hanken-Grotesk", description: "Friendly grotesk with balanced proportions." },
  { name: "Onest", category: "sans", license: "OFL", repo: "typothon/onest", description: "Variable sans built for long-form reading." },
  // Serif
  { name: "Playfair Display", category: "serif", license: "OFL", repo: "clauseggers/playfair-display", description: "High-contrast display serif with elegant italics." },
  { name: "Libre Baskerville", category: "serif", license: "OFL", repo: "impallari/Libre-Baskerville", description: "Web-optimised Baskerville revival." },
  { name: "Lora", category: "serif", license: "OFL", repo: "cyrealtype/Lora", description: "Well-balanced contemporary serif for text." },
  { name: "Fraunces", category: "serif", license: "OFL", repo: "italianotype/fraunces", description: "Soft-serif display with optical sizing & wobble." },
  { name: "Source Serif 4", category: "serif", license: "OFL", repo: "adobe-fonts/source-serif", description: "Adobe's transitional text serif." },
  { name: "Newsreader", category: "serif", license: "OFL", repo: "productiontype/Newsreader", description: "Family designed for on-screen reading." },
  // Mono
  { name: "Fira Code", category: "mono", license: "OFL", repo: "tonsky/FiraCode", description: "Monospaced with programming ligatures." },
  { name: "JetBrains Mono", category: "mono", license: "OFL", repo: "JetBrains/JetBrainsMono", description: "Monospace for developers, with ligatures." },
  { name: "Space Mono", category: "mono", license: "OFL", repo: "floriankarsten/space-mono", description: "Original mono companion to Space Grotesk." },
  { name: "IBM Plex Mono", category: "mono", license: "OFL", repo: "IBM/plex/tree/master/IBM-Plex-Mono", description: "Corporate monospace, humanist." },
  { name: "Commit Mono", category: "mono", license: "OFL", repo: "eigilsc/commit-mono", description: "Neutral monospace with a mechanical rhythm." },
  { name: "Geist Mono", category: "mono", license: "OFL", repo: "vercel/geist", description: "Vercel's monospace, used across their products." },
  // Display
  { name: "Bricolage Grotesque", category: "display", license: "OFL", repo: "atlassian/brand-alchemy", description: "Expressive display grotesque with contrast axes." },
  { name: "Clash Display", category: "display", license: "OFL", repo: "fontsource/fontsource", description: "Bold contemporary display sans." },
  { name: "Unbounded", category: "display", license: "OFL", repo: "cyrealtype/Unbounded", description: "Rounded display sans with a futuristic vibe." },
  { name: "Syne", category: "display", license: "OFL", repo: "displaay/syne", description: "Experimental display family for art contexts." },
  { name: "Bricolage", category: "display", license: "OFL", repo: "atlassian/brand-alchemy/tree/main/fonts/bricolage", description: "Variable display grotesque." },
  // Handwriting / script
  { name: "Caveat", category: "handwriting", license: "OFL", repo: "googlefonts/caveat", description: "Casual handwriting script." },
  { name: "Comfortaa", category: "handwriting", license: "OFL", repo: "googlefonts/Comfortaa", description: "Rounded geometric casual script." },
  { name: "Gloria Hallelujah", category: "handwriting", license: "OFL", repo: "googlefonts/Gloria-Hallelujah", description: "Marker-style handwriting font." },
  // Icon / symbol
  { name: "Nerd Fonts", category: "display", license: "MIT", repo: "ryanoasis/nerd-fonts", description: "Iconic font aggregator for dev tooling." },
  { name: "Geist", category: "sans", license: "OFL", repo: "vercel/geist/tree/main/packages/geist-sans", description: "Vercel's variable sans, default on this site." },
];

export const FONT_CATEGORIES = [
  "sans",
  "serif",
  "mono",
  "display",
  "handwriting",
] as const;

export type FontCategory = (typeof FONT_CATEGORIES)[number];
