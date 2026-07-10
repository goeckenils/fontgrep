import { cn } from "@/lib/utils";

export type SpecimenAccent = "surface" | "inverse" | "accent" | "void";

/** AAA-safe shell pairs — no opacity-based text. */
export function specimenShell(accent: SpecimenAccent): string {
  switch (accent) {
    case "inverse":
      return cn(
        "bg-sidebar-primary text-sidebar-primary-foreground",
        "[--specimen-muted:var(--specimen-muted-on-dark)]",
        "[--specimen-border:var(--specimen-border-on-dark)]",
      );
    case "accent":
      return cn(
        "bg-sidebar-accent text-sidebar-accent-foreground",
        "[--specimen-muted:var(--specimen-muted-on-light)]",
        "[--specimen-border:var(--specimen-border-on-light)]",
      );
    case "void":
      return cn(
        "bg-foreground text-background",
        "[--specimen-muted:var(--specimen-muted-on-dark)]",
        "[--specimen-border:var(--specimen-border-on-dark)]",
      );
    default:
      return cn(
        "bg-sidebar text-sidebar-foreground",
        "[--specimen-muted:var(--specimen-muted-on-light)]",
        "[--specimen-border:var(--specimen-border-on-light)]",
      );
  }
}

export type SpecimenCut = "poster" | "bleed" | null;

export function toSpecimenAccent(
  accent: "primary" | "inverse" | "accent" | "void",
): SpecimenAccent {
  if (accent === "inverse") return "inverse";
  if (accent === "accent") return "accent";
  if (accent === "void") return "void";
  return "surface";
}

export function layoutCut(
  layout: string,
): SpecimenCut {
  if (layout === "poster") return "poster";
  if (layout === "bleed") return "bleed";
  return null;
}