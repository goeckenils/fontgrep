"use client";

import { useEffect, useState } from "react";

const LG_QUERY = "(min-width: 1024px)";

export function useMinLg(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(LG_QUERY);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return matches;
}