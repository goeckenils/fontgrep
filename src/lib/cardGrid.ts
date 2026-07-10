/**
 * Card grid breakpoints tuned for the lg sidebar (~17.5rem).
 * Third column only from xl when the main pane is wide enough for specimens.
 */
export const CARD_GRID_COLUMNS =
  "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

export const CARD_GRID_GAP = "gap-2 sm:gap-3 xl:gap-4";

export const CARD_GRID_CLASS = [
  "grid w-full",
  CARD_GRID_COLUMNS,
  CARD_GRID_GAP,
].join(" ");

export const BENTO_CARD_GRID_CLASS = [
  "grid w-full auto-rows-[minmax(175px,auto)]",
  CARD_GRID_COLUMNS,
  CARD_GRID_GAP,
].join(" ");

export const MASONRY_GRID_CLASS = [
  "columns-1 sm:columns-2 xl:columns-3",
  "gap-4 sm:gap-5 xl:gap-6",
  "[&>*]:mb-4 [&>*]:break-inside-avoid sm:[&>*]:mb-5 xl:[&>*]:mb-6",
].join(" ");