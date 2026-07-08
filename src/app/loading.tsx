import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-9 w-56" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  );
}
