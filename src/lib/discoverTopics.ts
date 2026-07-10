export const DISCOVER_TOPIC_CHIPS = [
  "font",
  "monospace",
  "display",
  "handwriting",
  "serif",
  "pixel-font",
] as const;

export type DiscoverTopic = (typeof DISCOVER_TOPIC_CHIPS)[number];

export function otherDiscoverTopics(current: string): string[] {
  const normalized = current.trim().toLowerCase();
  return DISCOVER_TOPIC_CHIPS.filter((t) => t !== normalized);
}