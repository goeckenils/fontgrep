import { Scale } from "lucide-react";
import { metaPill } from "@/lib/viewerTheme";
import { cn } from "@/lib/utils";

export function licenseStatus(license: string | null | undefined): "known" | "unknown" {
  const trimmed = license?.trim();
  return trimmed ? "known" : "unknown";
}

export function LicenseBadge({
  license,
  className,
}: {
  license: string | null | undefined;
  className?: string;
}) {
  if (licenseStatus(license) === "known") {
    return (
      <span className={cn(metaPill(), className)}>
        <Scale className="size-3 shrink-0 opacity-70" aria-hidden />
        {license}
      </span>
    );
  }

  return (
    <span
      className={cn(
        metaPill(),
        "border-border/40 bg-transparent font-medium lowercase normal-case tracking-normal text-muted-foreground/55",
        className,
      )}
    >
      No license
    </span>
  );
}