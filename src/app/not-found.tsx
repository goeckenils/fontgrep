import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Spec.404
      </p>
      <h2 className="font-heading text-2xl font-semibold">Font not found</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page or font you’re looking for doesn’t exist.
      </p>
      <Link href="/" className={buttonVariants({ size: "sm" })}>
        Back to fontgrep
      </Link>
    </div>
  );
}
