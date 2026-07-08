import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="font-heading text-2xl font-semibold">Font not found</h2>
      <p className="text-sm text-muted-foreground">
        The page or font you’re looking for doesn’t exist.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to fontgrep
      </Link>
    </div>
  );
}
