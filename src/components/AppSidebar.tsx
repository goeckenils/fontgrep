"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject, type ReactNode } from "react";
import { contextHandler, dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";
import {
  useSidebarFiltersStagger,
  useSidebarIntro,
  useSidebarPanelStagger,
} from "@/hooks/useSidebarTimeline";
import {
  Search,
  Loader2,
  Sparkles,
  HelpCircle,
  Library,
  ChevronDown,
  Gem,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import {
  hasCustomDiscoverSettings,
  INDIE_MAX_STARS,
  isTreasureMode,
  type DiscoverFilters,
  type DiscoverSort,
} from "@/lib/fontFilters";
import { DISCOVER_TOPIC_CHIPS } from "@/lib/discoverTopics";
import type { FontSearchMode } from "@/types/fontDiscovery";

type TabId = "discover" | "search" | "library";

const SEARCH_MODE_LABELS: Record<FontSearchMode, string> = {
  filename: "Filename",
  extension: "Extension",
  css: "CSS @font-face",
  license: "License",
};

const NAV_ITEMS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: "discover", label: "Discover", icon: <Sparkles className="size-4" /> },
  { id: "search", label: "Search", icon: <Search className="size-4" /> },
  { id: "library", label: "Library", icon: <Library className="size-4" /> },
];

export function AppSidebar({
  tab,
  onTabChange,
  query,
  setQuery,
  mode,
  setMode,
  loading,
  onSearch,
  previewText,
  setPreviewText,
  discoverTopic,
  onTopicChange,
  onSurprise,
  fmtFilters,
  setFmtFilters,
  discoverFilters,
  setDiscoverFilters,
  onResetDiscover,
  onRareMode,
  onPopularMode,
  sortBy,
  setSortBy,
  discoveredCount,
  loadedFamiliesCount,
  resultCount,
  totalMatches,
  libraryCount,
  topicInputRef,
  searchInputRef,
  onShowHelp,
  className,
}: {
  tab: TabId;
  onTabChange: (tab: string) => void;
  query: string;
  setQuery: (q: string) => void;
  mode: FontSearchMode;
  setMode: (m: FontSearchMode) => void;
  loading: boolean;
  onSearch: () => void;
  previewText: string;
  setPreviewText: (value: string) => void;
  discoverTopic: string;
  onTopicChange: (t: string) => void;
  onSurprise: () => void;
  fmtFilters: Set<string>;
  setFmtFilters: (s: Set<string>) => void;
  discoverFilters: DiscoverFilters;
  setDiscoverFilters: (f: DiscoverFilters) => void;
  onResetDiscover: () => void;
  onRareMode: () => void;
  onPopularMode: () => void;
  sortBy: DiscoverSort;
  setSortBy: (s: DiscoverSort) => void;
  discoveredCount: number;
  loadedFamiliesCount: number;
  resultCount: number;
  totalMatches?: number;
  libraryCount: number;
  topicInputRef: RefObject<HTMLInputElement | null>;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onShowHelp: () => void;
  className?: string;
}) {
  const rareHunt = isTreasureMode(discoverFilters, sortBy);
  const asideRef = useSidebarIntro();
  const panelRef = useSidebarPanelStagger(tab);

  return (
    <aside
      ref={asideRef}
      className={cn(
        "relative flex shrink-0 flex-col border-b border-[#222] bg-[#0f0f0f] text-[#e8e8e8] lg:h-full lg:w-[17.5rem] lg:border-r lg:border-b-0",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#1a1a1a]/60 to-transparent"
      />

      <header data-sidebar-part="header" className="relative px-4 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/fontgrep_logo.svg"
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-xl"
            priority
          />
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold tracking-tight">fontgrep</h1>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#777]">
              GitHub fonts
            </p>
          </div>
        </div>
      </header>

      <div className="px-3 pb-2">
        <div
          data-sidebar-part="workspace"
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666] px-0.5 mb-1"
        >
          Workspace
        </div>
        <nav className="mt-1 flex flex-col gap-0.5" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              active={tab === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>
      </div>

      <div data-sidebar-part="divider" className="mx-4 my-1 h-px origin-left bg-[#222]" />

      <ScrollArea className="min-h-0 flex-1">
        <div ref={panelRef} className="flex flex-col gap-3 px-3 py-3">
          {tab === "search" ? (
            <SearchControls
              query={query}
              setQuery={setQuery}
              mode={mode}
              setMode={setMode}
              loading={loading}
              onSearch={onSearch}
              searchInputRef={searchInputRef}
            />
          ) : tab === "discover" ? (
            <DiscoverControls
              topic={discoverTopic}
              onTopicChange={onTopicChange}
              previewText={previewText}
              setPreviewText={setPreviewText}
              onSurprise={onSurprise}
              fmtFilters={fmtFilters}
              setFmtFilters={setFmtFilters}
              discoverFilters={discoverFilters}
              setDiscoverFilters={setDiscoverFilters}
              onResetDiscover={onResetDiscover}
              onRareMode={onRareMode}
              onPopularMode={onPopularMode}
              rareHunt={rareHunt}
              sortBy={sortBy}
              setSortBy={setSortBy}
              topicInputRef={topicInputRef}
            />
          ) : (
            <div
              data-sidebar-part="panel-item"
              className="text-sm leading-relaxed text-[#888] px-1 py-1 bg-[#181818] rounded-xl"
            >
              Saved fonts appear in the grid with your preview text. Open a card to inspect
              weights, license, and CSS.
            </div>
          )}
        </div>
      </ScrollArea>

      <footer data-sidebar-part="footer" className="border-t border-[#222] bg-[#0f0f0f] px-3 py-3">
        <div className="mb-2 flex gap-1.5">
          {tab === "discover" && (
            <>
              <StatPill label="Shown" value={discoveredCount} />
              {loadedFamiliesCount > discoveredCount && (
                <StatPill label="Loaded" value={loadedFamiliesCount} />
              )}
            </>
          )}
          {tab === "search" && (
            <>
              <StatPill label="Results" value={resultCount} />
              {totalMatches != null && <StatPill label="GitHub" value={totalMatches} />}
            </>
          )}
          {tab === "library" && <StatPill label="Saved" value={libraryCount} />}
        </div>
        <Button
          data-sidebar-part="footer-btn"
          variant="outline"
          size="sm"
          className="w-full rounded-xl border-[#333] bg-[#181818] hover:bg-[#222] text-[#ccc] font-mono text-[10px] uppercase tracking-[0.12em]"
          data-icon="inline-start"
          onClick={onShowHelp}
        >
          <HelpCircle className="size-4" />
          Shortcuts
        </Button>
      </footer>
    </aside>
  );
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = btnRef.current;
      if (!el || !motionOK()) return;

      const iconWrap = el.querySelector<HTMLElement>("[data-nav-icon]");

      const onEnter = contextHandler(contextSafe, () => {
        gsap.to(el, { x: 3, duration: dur.xs, ease: ease.out });
        if (iconWrap) gsap.to(iconWrap, { scale: 1.08, duration: dur.xs, ease: ease.out });
      });
      const onLeave = contextHandler(contextSafe, () => {
        gsap.to(el, { x: 0, duration: dur.xs, ease: ease.inOut });
        if (iconWrap) gsap.to(iconWrap, { scale: 1, duration: dur.xs, ease: ease.inOut });
      });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: btnRef },
  );

  return (
    <Button
      ref={btnRef}
      data-sidebar-part="nav-item"
      role="tab"
      aria-selected={active}
      variant="ghost"
      className={cn(
        "relative h-9 justify-start gap-2.5 rounded-xl px-3 font-medium text-[#ccc] hover:bg-[#1a1a1a] hover:text-white",
        active && "bg-[#1f1f1f] text-white shadow-sm",
      )}
      onClick={onClick}
    >
      <span
        data-nav-icon
        className={cn(
          "flex size-6 items-center justify-center rounded-lg",
          active ? "bg-[#2a2a2a] text-white" : "text-[#777]",
        )}
      >
        {icon}
      </span>
      {label}
    </Button>
  );
}

function SearchControls({
  query,
  setQuery,
  mode,
  setMode,
  loading,
  onSearch,
  searchInputRef,
}: {
  query: string;
  setQuery: (q: string) => void;
  mode: FontSearchMode;
  setMode: (m: FontSearchMode) => void;
  loading: boolean;
  onSearch: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <form
      data-sidebar-part="panel-item"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSearch();
      }}
    >
      <div>
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777] px-0.5 mb-1.5">Search</div>
        <div className="mt-1.5 flex flex-col gap-2.5">
          <select
            className="w-full rounded-xl border-[#333] bg-[#1a1a1a] text-[#eee] font-mono text-sm px-2 py-1.5"
            value={mode}
            onChange={(e) => setMode(e.target.value as FontSearchMode)}
            aria-label="Search mode"
          >
            {(Object.keys(SEARCH_MODE_LABELS) as FontSearchMode[]).map((m) => (
              <option key={m} value={m}>
                {SEARCH_MODE_LABELS[m]}
              </option>
            ))}
          </select>
          <Input
            ref={searchInputRef}
            className="w-full rounded-xl border-[#333] bg-[#1a1a1a] text-[#eee] font-mono text-sm px-2 py-1.5"
            placeholder={
              mode === "css"
                ? "font-family name (e.g. Inter)"
                : mode === "license"
                  ? "license term (e.g. OFL)"
                  : "font name or keyword"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search query"
          />
          <Button
            type="submit"
            disabled={loading}
            data-icon="inline-start"
            className="relative z-10 w-full rounded-xl font-mono text-[10px] uppercase tracking-[0.12em]"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Run search
          </Button>
        </div>
      </div>
    </form>
  );
}

function DiscoverControls({
  topic,
  onTopicChange,
  previewText,
  setPreviewText,
  onSurprise,
  fmtFilters,
  setFmtFilters,
  discoverFilters,
  setDiscoverFilters,
  onResetDiscover,
  onRareMode,
  onPopularMode,
  rareHunt,
  sortBy,
  setSortBy,
  topicInputRef,
}: {
  topic: string;
  onTopicChange: (t: string) => void;
  previewText: string;
  setPreviewText: (value: string) => void;
  onSurprise: () => void;
  fmtFilters: Set<string>;
  setFmtFilters: (s: Set<string>) => void;
  discoverFilters: DiscoverFilters;
  setDiscoverFilters: (f: DiscoverFilters) => void;
  onResetDiscover: () => void;
  onRareMode: () => void;
  onPopularMode: () => void;
  rareHunt: boolean;
  sortBy: DiscoverSort;
  setSortBy: (s: DiscoverSort) => void;
  topicInputRef: RefObject<HTMLInputElement | null>;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [topicDraft, setTopicDraft] = useState(topic);
  const formats = ["ttf", "otf", "woff2", "variable"];
  const customSettings = hasCustomDiscoverSettings(fmtFilters, discoverFilters, sortBy);

  const filtersRef = useSidebarFiltersStagger(filtersOpen);

  useEffect(() => {
    setTopicDraft(topic);
  }, [topic]);

  function toggleFmt(fmt: string) {
    const next = new Set(fmtFilters);
    if (next.has(fmt)) next.delete(fmt);
    else next.add(fmt);
    setFmtFilters(next);
  }

  function toggleFilter(key: keyof DiscoverFilters) {
    setDiscoverFilters({ ...discoverFilters, [key]: !discoverFilters[key] });
  }

  return (
    <div className="flex flex-col gap-3">
      <section
        data-sidebar-part="panel-item"
        className="flex flex-col gap-3 rounded-2xl border border-[#252525] bg-[#141414] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      >
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9a9a]">
            Wander
          </span>
          <span className="truncate font-mono text-[10px] text-[#555]">
            topic · preview
          </span>
        </div>

        <SidebarField label="Topic" hint="GitHub topic tag">
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onTopicChange(topicDraft.trim() || "font");
            }}
          >
            <div className="flex gap-2">
              <Input
                ref={topicInputRef}
                className="min-w-0 flex-1 rounded-xl border-[#333] bg-[#0f0f0f] px-2.5 py-2 font-mono text-sm text-[#eee] placeholder:text-[#555]"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                placeholder="monospace, display…"
                aria-label="Discover topic"
              />
              <Button type="submit" size="sm" className="shrink-0 rounded-xl px-3">
                Go
              </Button>
            </div>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {DISCOVER_TOPIC_CHIPS.map((c) => (
              <Chip key={c} active={topic === c} onClick={() => onTopicChange(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </SidebarField>

        <Separator className="bg-[#252525]" />

        <SidebarField label="Preview text" hint="Shown on cards">
          <Input
            className="w-full rounded-xl border-[#333] bg-[#0f0f0f] px-2.5 py-2 font-mono text-sm text-[#eee] placeholder:text-[#555]"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Sphinx of black quartz…"
            aria-label="Discover preview text"
          />
          <p className="line-clamp-2 px-0.5 font-mono text-[11px] leading-snug text-[#666]">
            {previewText.trim() || "Type sample copy for the grid"}
          </p>
        </SidebarField>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="flex-1 rounded-xl border-[#333] bg-[#0f0f0f] hover:bg-[#1a1a1a]"
            data-icon="inline-start"
            onClick={onSurprise}
          >
            <Sparkles />
            Surprise
          </Button>
          <Button
            variant={rareHunt ? "secondary" : "outline"}
            size="sm"
            type="button"
            className="flex-1 rounded-xl border-[#333] bg-[#0f0f0f] hover:bg-[#1a1a1a]"
            data-icon="inline-start"
            onClick={rareHunt ? onPopularMode : onRareMode}
          >
            <Gem />
            {rareHunt ? "Popular" : "Treasure"}
          </Button>
        </div>
      </section>

      <div data-sidebar-part="panel-item">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          <span>
            Filters
            {customSettings ? (
              <span className="ml-1.5 text-sidebar-primary">· customized</span>
            ) : null}
          </span>
          <ChevronDown
            className={cn("shrink-0 transition-transform", filtersOpen && "rotate-180")}
          />
        </Button>

        {filtersOpen && (
          <div ref={filtersRef} className="mt-2 flex flex-col gap-2.5 overflow-hidden">
            <div data-sidebar-part="filter-item" className="flex flex-wrap gap-1.5">
              {formats.map((f) => (
                <Chip key={f} active={fmtFilters.has(f)} onClick={() => toggleFmt(f)}>
                  {f}
                </Chip>
              ))}
            </div>
            <select
              data-sidebar-part="filter-item"
              className="w-full rounded-xl border-[#333] bg-[#1a1a1a] text-[#eee] font-mono text-xs px-2 py-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as DiscoverSort)}
              aria-label="Sort by"
            >
              <option value="hidden_gems">Hidden gems</option>
              <option value="relevance">Relevance</option>
              <option value="name">Name A–Z</option>
              <option value="stars">Most starred</option>
            </select>
            <div data-sidebar-part="filter-item" className="flex flex-col gap-1.5">
              <FilterToggle
                label="Hide mirror repos"
                checked={discoverFilters.hideMegaRepos}
                onChange={() => toggleFilter("hideMegaRepos")}
              />
              <FilterToggle
                label="Hide popular families"
                checked={discoverFilters.hideCommonFonts}
                onChange={() => toggleFilter("hideCommonFonts")}
              />
              <FilterToggle
                label="Hide icon packs"
                checked={discoverFilters.hideIconFonts}
                onChange={() => toggleFilter("hideIconFonts")}
              />
              <FilterToggle
                label="Hide generic names"
                checked={discoverFilters.hideJunkNames}
                onChange={() => toggleFilter("hideJunkNames")}
              />
              <FilterToggle
                label="One per family"
                checked={discoverFilters.dedupeByFamily}
                onChange={() => toggleFilter("dedupeByFamily")}
              />
              <FilterToggle
                label={`Under ${INDIE_MAX_STARS}★`}
                checked={discoverFilters.indieOnly}
                onChange={() => toggleFilter("indieOnly")}
              />
            </div>
            {customSettings && (
              <Button
                data-sidebar-part="filter-item"
                variant="ghost"
                size="xs"
                className="self-start"
                onClick={onResetDiscover}
              >
                Reset filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
          {label}
        </span>
        {hint ? (
          <span className="truncate font-mono text-[10px] text-[#555]">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      data-sidebar-part="footer-item"
      className="flex-1 bg-[#181818] px-2.5 py-1.5 rounded-xl border border-[#222]"
    >
      <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold tabular-nums text-[#ddd]">{value.toLocaleString()}</p>
    </div>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-[#aaa] hover:text-[#ccc]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-3.5 rounded border-[#333] bg-[#1a1a1a] accent-[#888]"
      />
      {label}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const chipRef = useRef<HTMLButtonElement | null>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = chipRef.current;
      if (!el || !motionOK()) return;

      const onEnter = contextHandler(contextSafe, () => {
        gsap.to(el, { scale: 1.05, y: -1, duration: dur.xs, ease: ease.out });
      });
      const onLeave = contextHandler(contextSafe, () => {
        gsap.to(el, { scale: 1, y: 0, duration: dur.xs, ease: ease.inOut });
      });
      const onDown = contextHandler(contextSafe, () => {
        gsap.to(el, { scale: 0.96, duration: 0.1, ease: ease.out });
      });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("mousedown", onDown);
      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("mousedown", onDown);
      };
    },
    { scope: chipRef },
  );

  return (
    <Button
      ref={chipRef}
      type="button"
      variant={active ? "secondary" : "outline"}
      size="xs"
      onClick={onClick}
      className="will-change-transform"
    >
      {children}
    </Button>
  );
}