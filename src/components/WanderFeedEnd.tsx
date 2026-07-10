"use client";

import { useRef } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpecimenBlock, SpecimenLabel } from "@/components/specimen/SpecimenChrome";
import { otherDiscoverTopics } from "@/lib/discoverTopics";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";


export function WanderFeedEnd({
  topic,
  treasureMode,
  reposScanned,
  fontsShown,
  githubTotal,
  onTopicChange,
  onToggleMode,
}: {
  topic: string;
  treasureMode: boolean;
  reposScanned: number;
  fontsShown: number;
  githubTotal: number | null;
  onTopicChange: (topic: string) => void;
  onToggleMode: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const alternatives = otherDiscoverTopics(topic);
  const totalLabel =
    githubTotal != null && githubTotal > 0
      ? githubTotal.toLocaleString()
      : reposScanned > 0
        ? reposScanned.toLocaleString()
        : null;

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !motionOK()) return;

      gsap.from(root.querySelectorAll("[data-feed-end]"), {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: dur.md,
        ease: ease.out,
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mx-auto flex max-w-lg flex-col items-center gap-5 py-14 text-center"
    >
      <div
        data-feed-end
        className="specimen-panel flex size-12 items-center justify-center bg-sidebar"
      >
        <Sparkles className="size-4 text-sidebar-foreground" aria-hidden />
      </div>

      <div data-feed-end className="space-y-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          End of feed
        </p>
        <h3 className="text-base font-semibold tracking-tight">
          That&apos;s everything for &ldquo;{topic}&rdquo;
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {totalLabel != null ? (
            <>
              GitHub has {totalLabel} repos matching this topic
              {reposScanned > 0 && reposScanned < (githubTotal ?? reposScanned)
                ? ` · scanned ${reposScanned.toLocaleString()}`
                : null}
              .
            </>
          ) : (
            <>No more repos to load for this topic.</>
          )}{" "}
          {fontsShown > 0 ? (
            <span className="block pt-1 font-medium text-foreground">
              {fontsShown.toLocaleString()} {fontsShown === 1 ? "font" : "fonts"} on your board.
            </span>
          ) : null}
        </p>
      </div>

      <div data-feed-end className="w-full">
      <SpecimenBlock className="w-full text-left">
        <SpecimenLabel>Keep wandering</SpecimenLabel>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {alternatives.map((chip) => (
            <Button
              key={chip}
              type="button"
              variant="outline"
              size="sm"
              className="capitalize"
              onClick={() => onTopicChange(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          onClick={onToggleMode}
        >
          {treasureMode ? "Try popular repos" : "Try treasure hunt"}
        </Button>
      </SpecimenBlock>
      </div>
    </div>
  );
}