import { cn } from "@/lib/utils";

/** Main feed + topbar surface (matches bento grid backdrop). */
export const FEED_SURFACE = "bg-muted/50 dark:bg-[#111111]";

/** Shared surfaces — bento grid + sidebar control panels. */
export const BENTO_CARD =
  "rounded-2xl bg-[#eaeaea] text-foreground dark:bg-[#1c1c1c] dark:text-[#f0f0f0]";

export const CONTROL_PANEL =
  "rounded-xl bg-[#e8e8e8] dark:bg-[#181818]";

export const FIELD_LABEL =
  "block text-[10px] font-medium lowercase tracking-normal text-muted-foreground";

export const FIELD_VALUE =
  "block text-[10px] font-medium uppercase tracking-[1.5px]";

export const SECTION_LABEL =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777] dark:text-[#777]";

export const CONTROL_INPUT =
  "w-full rounded-xl border-[#333] bg-[#1a1a1a] text-[#eee] placeholder:text-[#666] font-mono text-sm px-2 py-1.5";

export function metaPill(className?: string) {
  return cn(
    "inline-flex items-center gap-1 rounded-xl border border-[#333] bg-[#181818] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#aaa]",
    className,
  );
}