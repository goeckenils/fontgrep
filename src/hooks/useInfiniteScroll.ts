"use client";

import { useEffect, type RefObject } from "react";

export function useInfiniteScroll({
  rootRef,
  sentinelRef,
  enabled,
  hasMore,
  loading,
  onLoadMore,
  rootMargin = "320px 0px",
}: {
  rootRef: RefObject<HTMLElement | null>;
  sentinelRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}) {
  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (!enabled || !root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && hasMore && !loading) {
          onLoadMore();
        }
      },
      { root, rootMargin, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [rootRef, sentinelRef, enabled, hasMore, loading, onLoadMore, rootMargin]);
}