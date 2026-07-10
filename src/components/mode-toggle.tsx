"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { dur, ease, gsap, motionOK } from "@/lib/gsap";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const iconRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => setMounted(true), []);

  function handleToggle() {
    if (iconRef.current && motionOK()) {
      gsap.fromTo(
        iconRef.current,
        { rotate: -90, scale: 0.7, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: dur.sm, ease: ease.out },
      );
    }
    const current = resolvedTheme ?? theme ?? "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleToggle}
    >
      <span ref={iconRef} className="inline-flex">
        {!mounted ? <Sun /> : resolvedTheme === "dark" ? <Sun /> : <Moon />}
      </span>
    </Button>
  );
}