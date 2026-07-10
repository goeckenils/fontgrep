"use client";

import { Children, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ExternalLink,
  Loader2,
  Sparkles,
  Eye,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopBar } from "@/components/AppTopBar";
import { FontBentoGrid } from "@/components/FontBentoGrid";
import { FontPreviewText } from "@/components/FontPreviewText";
import {
  SpecimenResultCard,
  SpecimenViewAction,
} from "@/components/SpecimenResultCard";
import { WanderFeedEnd } from "@/components/WanderFeedEnd";
import { DiscoverLoadingPins } from "@/components/DiscoverLoadingPins";
import { BentoFontCard } from "@/components/BentoFontCard";
import { GsapTabPanel } from "@/components/GsapTabPanel";
import { useGsapScrollReveal } from "@/hooks/useGsapScrollReveal";
import { motionOK } from "@/lib/gsap";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useMinLg } from "@/hooks/useMinLg";
import { useScrollSmoother } from "@/hooks/useScrollSmoother";
import { LicenseBadge } from "@/components/LicenseBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { FontViewer, type ViewerFont } from "@/components/FontViewer";
import { cn } from "@/lib/utils";
import { FEED_SURFACE } from "@/lib/viewerTheme";
import { FontCompare, type CompareFontOption } from "@/components/FontCompare";
import { ModeToggle } from "@/components/mode-toggle";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { toast } from "sonner";
import {
  applyDiscoverFilters,
  DEFAULT_DISCOVER_FILTERS,
  DEFAULT_DISCOVER_SORT,
  hasCustomDiscoverSettings,
  MAX_AUTO_LOAD_PAGES,
  MIN_VISIBLE_BEFORE_AUTO_LOAD,
  POPULAR_DISCOVER_FILTERS,
  TREASURE_DISCOVER_FILTERS,
  type DiscoverFilters,
  type DiscoverSort,
} from "@/lib/fontFilters";
import type {
  FontDiscoveryResult,
  FontFormat,
  FontSearchMode,
} from "@/types/fontDiscovery";
import {
  DISCOVER_FILE_QUERY_VARIANT_COUNT,
  type DiscoverLane,
} from "@/lib/githubFontSearch";
import type { DiscoveredFontFamily } from "@/lib/fontFamily";
import { CARD_GRID_CLASS } from "@/lib/cardGrid";


type TabId = "discover" | "search" | "library";

interface SearchResponse {
  query: string;
  totalCount: number;
  results: FontDiscoveryResult[];
}

interface LibraryFont {
  id: number;
  family: string;
  realFamily: string | null;
  weight: number | null;
  style: string | null;
  isVariable: boolean;
  designer: string | null;
  format: string;
  license: string | null;
  publicPath: string | null;
  downloadedAt: string;
}

const FORMAT_VARIANT: Record<FontFormat, "default" | "secondary" | "outline" | "destructive"> = {
  ttf: "default",
  otf: "secondary",
  woff: "outline",
  woff2: "outline",
  eot: "destructive",
  svg: "secondary",
  variable: "default",
  unknown: "outline",
};

const DEFAULT_PREVIEW_TEXT = "Sphinx of black quartz, judge my vow";

function rawUrlOf(repo: string, branch: string, path: string) {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabId | null;
  const topicParam = searchParams.get("topic") ?? "font";
  const fontParam = searchParams.get("font");

  const [tab, setTab] = useState<TabId>(tabParam ?? "discover");
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW_TEXT);

  // --- Discover state ---
  const [families, setFamilies] = useState<DiscoveredFontFamily[]>([]);
  const [discoverTopic, setDiscoverTopic] = useState(topicParam);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverTreasure, setDiscoverTreasure] = useState(true);
  const [reposFetchedTotal, setReposFetchedTotal] = useState(0);
  const [githubTotalCount, setGithubTotalCount] = useState<number | null>(null);
  const [discoverLane, setDiscoverLane] = useState<DiscoverLane>("files");
  const [discoverVariant, setDiscoverVariant] = useState(0);
  const autoLoadAttempts = useRef(0);

  function resetDiscoverCursor() {
    setDiscoverPage(1);
    setDiscoverLane("files");
    setDiscoverVariant(0);
    setReposFetchedTotal(0);
    setGithubTotalCount(null);
    autoLoadAttempts.current = 0;
  }

  // --- Filter & sort (issue 13) ---
  const [fmtFilters, setFmtFilters] = useState<Set<string>>(new Set());
  const [discoverFilters, setDiscoverFilters] = useState<DiscoverFilters>(
    DEFAULT_DISCOVER_FILTERS,
  );
  const [sortBy, setSortBy] = useState<DiscoverSort>(DEFAULT_DISCOVER_SORT);

  const visibleFamilies = useMemo(
    () => applyDiscoverFilters(families, fmtFilters, discoverFilters, sortBy),
    [families, fmtFilters, discoverFilters, sortBy],
  );

  function resetDiscoverSettings() {
    setFmtFilters(new Set());
    setDiscoverFilters(TREASURE_DISCOVER_FILTERS);
    setSortBy(DEFAULT_DISCOVER_SORT);
    if (!discoverTreasure) {
      setDiscoverTreasure(true);
      setFamilies([]);
      resetDiscoverCursor();
      void loadDiscover(1, discoverTopic, false, true, "files", 0);
    }
  }

  function enableRareHunt() {
    setDiscoverFilters(TREASURE_DISCOVER_FILTERS);
    setSortBy(DEFAULT_DISCOVER_SORT);
    setDiscoverTreasure(true);
    setFamilies([]);
    resetDiscoverCursor();
    void loadDiscover(1, discoverTopic, false, true, "files", 0);
  }

  function enablePopularMode() {
    setDiscoverFilters(POPULAR_DISCOVER_FILTERS);
    setSortBy("stars");
    setDiscoverTreasure(false);
    setFamilies([]);
    resetDiscoverCursor();
    void loadDiscover(1, discoverTopic, false, false, "files", 0);
  }

  // --- Search state ---
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FontSearchMode>("filename");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Library state ---
  const [library, setLibrary] = useState<LibraryFont[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // --- Viewer / compare ---
  const [activeViewer, setActiveViewer] = useState<ViewerFont | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  // --- Shortcuts help ---
  const [showHelp, setShowHelp] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const topicInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const feedScrollRef = useRef<HTMLElement>(null);
  const smoothWrapperRef = useRef<HTMLDivElement>(null);
  const smoothContentRef = useRef<HTMLDivElement>(null);
  const loadSentinelRef = useRef<HTMLDivElement>(null);
  const isMinLg = useMinLg();
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    setMotionOk(motionOK());
  }, []);

  const searchPreviewText = query.trim() || previewText;

  const mergeFont = (f: DiscoveredFontFamily): ViewerFont => ({
    family: f.family,
    realFamily: f.family,
    format: f.styles[0]?.format ?? "unknown",
    fileName: f.styles[0]?.fileName ?? f.family,
    repository: f.repository,
    branch: f.branch,
    path: f.styles[0]?.path,
    license: f.license ?? undefined,
    weight: f.styles[0]?.weight ?? null,
    style: f.styles[0]?.style ?? null,
    isVariable: f.styles.some((s) => s.variable) || f.styles[0]?.format === "variable",
    rawUrl: f.styles[0]
      ? rawUrlOf(f.repository, f.branch, f.styles[0].path)
      : undefined,
    styles: f.styles.map((s) => ({ ...s, branch: f.branch })),
  });

  // --- URL state sync (issue 08) ---
  const syncUrl = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  // Restore viewer from URL (deep linking).
  useEffect(() => {
    if (!fontParam) {
      setActiveViewer(null);
      setCompareMode(false);
      return;
    }
    if (fontParam.startsWith("saved:")) {
      const id = Number(fontParam.slice(6));
      void (async () => {
        try {
          const res = await fetch("/api/fonts/library");
          const json = await res.json();
          const found = (json.fonts as LibraryFont[]).find((l: LibraryFont) => l.id === id);
          if (found) {
            setActiveViewer({
              id: found.id,
              family: found.realFamily ?? found.family,
              realFamily: found.realFamily,
              format: found.format,
              fileName: found.family,
              license: found.license ?? undefined,
              publicPath: found.publicPath ?? undefined,
              weight: found.weight,
              style: found.style,
              isVariable: found.isVariable,
              designer: found.designer,
            });
          }
        } catch {
          /* ignore */
        }
      })();
    }
  }, [fontParam]);

  const openViewer = useCallback(
    (font: ViewerFont, saved = false) => {
      setActiveViewer(font);
      syncUrl({ font: saved ? `saved:${font.id}` : `raw:${font.repository}/${font.path}` });
    },
    [syncUrl]
  );

  const closeViewer = useCallback(() => {
    setActiveViewer(null);
    setCompareMode(false);
    syncUrl({ font: null });
  }, [syncUrl]);

  // --- Discover loading (issue 06, 09 client cache) ---
  const loadDiscover = useCallback(
    async (
      pageToLoad: number,
      topic: string,
      append: boolean,
      treasure = discoverTreasure,
      lane: DiscoverLane = "files",
      variant = 0,
    ) => {
      if (append) setLoadingMore(true);
      else setBrowseLoading(true);
      setDiscoverError(null);
      const sessionKey = `discover:${topic}:${lane}:${variant}:${pageToLoad}:${treasure ? "treasure" : "default"}`;
      let continueLoad:
        | { page: number; lane: DiscoverLane; variant: number }
        | null = null;

      try {
        if (!append) {
          const cached = sessionStorage.getItem(sessionKey);
          if (cached) {
            const parsed = JSON.parse(cached) as {
              families?: DiscoveredFontFamily[];
              hasMore?: boolean;
              totalCount?: number | null;
              lane?: DiscoverLane;
              variant?: number;
            };
            if ((parsed.families?.length ?? 0) > 0) {
              setFamilies(parsed.families!);
              setHasMore(parsed.hasMore ?? false);
              setGithubTotalCount(parsed.totalCount ?? null);
              setDiscoverPage(pageToLoad);
              setDiscoverLane(parsed.lane ?? lane);
              setDiscoverVariant(parsed.variant ?? variant);
              return;
            }
            sessionStorage.removeItem(sessionKey);
          }
        }
        const params = new URLSearchParams();
        params.set("query", topic);
        params.set("page", String(pageToLoad));
        params.set("lane", lane);
        if (lane === "files") params.set("variant", String(variant));
        if (!treasure) params.set("treasure", "0");
        const res = await fetch(`/api/fonts/discover?${params.toString()}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
            error?: string;
            status?: number;
          };
          const msg =
            body.message ??
            (body.error === "github_auth_required"
              ? "Set GITHUB_TOKEN in your .env to discover fonts from GitHub."
              : body.error === "github_repo_search_failed"
                ? `GitHub repo search failed (${body.status ?? res.status}). Check your token and try again.`
                : body.error === "github_code_search_failed"
                  ? `GitHub file search failed (${body.status ?? res.status}). Try again shortly.`
                  : `Discover failed (${res.status})`);
          setDiscoverError(msg);
          if (!append) sessionStorage.removeItem(sessionKey);
          return;
        }
        const json = (await res.json()) as {
          families: DiscoveredFontFamily[];
          hasMore: boolean;
          reposFetched?: number;
          totalCount?: number | null;
          lane?: DiscoverLane;
          variant?: number;
        };

        setFamilies((prev) => (append ? [...prev, ...json.families] : json.families));
        setDiscoverPage(pageToLoad);
        setDiscoverLane(json.lane ?? lane);
        setDiscoverVariant(json.variant ?? variant);
        if (json.totalCount != null) setGithubTotalCount(json.totalCount);
        setReposFetchedTotal((prev) =>
          append ? prev + (json.reposFetched ?? 0) : (json.reposFetched ?? 0),
        );
        if (!append && json.families.length > 0) {
          sessionStorage.setItem(sessionKey, JSON.stringify(json));
        }

        if (!json.hasMore) {
          if (lane === "files" && variant + 1 < DISCOVER_FILE_QUERY_VARIANT_COUNT) {
            const nextVariant = variant + 1;
            setDiscoverVariant(nextVariant);
            setHasMore(true);
            continueLoad = { page: 1, lane: "files", variant: nextVariant };
          } else if (lane === "files") {
            setDiscoverLane("repos");
            setHasMore(true);
            continueLoad = { page: 1, lane: "repos", variant: 0 };
          } else {
            setHasMore(false);
          }
        } else {
          setHasMore(true);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to discover fonts");
      } finally {
        setBrowseLoading(false);
        setLoadingMore(false);
      }

      if (continueLoad) {
        void loadDiscover(
          continueLoad.page,
          topic,
          true,
          treasure,
          continueLoad.lane,
          continueLoad.variant,
        );
      }
    },
    [discoverTreasure],
  );

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/fonts/library");
      if (!res.ok) throw new Error("Failed to load library");
      const json = (await res.json()) as { fonts: LibraryFont[] };
      setLibrary(json.fonts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  function handleTabChange(v: string) {
    const next = v as TabId;
    setTab(next);
    setActiveViewer(null);
    setCompareMode(false);
    syncUrl({ tab: next, font: null });
    if (next === "discover" && families.length === 0) void loadDiscover(1, discoverTopic, false);
    if (next === "library") void loadLibrary();
  }

  // Initial load.
  useEffect(() => {
    if (tab === "discover") void loadDiscover(1, discoverTopic, false);
    if (tab === "library") void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    void loadDiscover(
      discoverPage + 1,
      discoverTopic,
      true,
      discoverTreasure,
      discoverLane,
      discoverVariant,
    );
  }, [
    loadingMore,
    hasMore,
    discoverPage,
    discoverTopic,
    discoverTreasure,
    discoverLane,
    discoverVariant,
    loadDiscover,
  ]);

  const feedSurface =
    tab === "discover" || tab === "search" || tab === "library";

  const scrollSmootherEnabled =
    feedSurface &&
    !activeViewer &&
    !compareMode &&
    isMinLg &&
    motionOk;

  useInfiniteScroll({
    rootRef: scrollSmootherEnabled ? { current: null } : feedScrollRef,
    sentinelRef: loadSentinelRef,
    enabled: tab === "discover" && !activeViewer && !compareMode,
    hasMore,
    loading: loadingMore || browseLoading,
    onLoadMore: loadMore,
  });

  useScrollSmoother(smoothWrapperRef, smoothContentRef, scrollSmootherEnabled);

  // Keep fetching when filters hide everything but GitHub has more repos.
  useEffect(() => {
    if (tab !== "discover" || browseLoading || loadingMore || !hasMore) return;

    const allFilteredOut = visibleFamilies.length === 0 && families.length > 0;
    const sparseResults = visibleFamilies.length < MIN_VISIBLE_BEFORE_AUTO_LOAD;

    if ((allFilteredOut || sparseResults) && autoLoadAttempts.current < MAX_AUTO_LOAD_PAGES) {
      autoLoadAttempts.current += 1;
      void loadDiscover(
        discoverPage + 1,
        discoverTopic,
        true,
        discoverTreasure,
        discoverLane,
        discoverVariant,
      );
    }
  }, [
    tab,
    browseLoading,
    loadingMore,
    hasMore,
    visibleFamilies.length,
    families.length,
    fmtFilters,
    discoverFilters,
    sortBy,
    discoverPage,
    discoverTopic,
    discoverTreasure,
    discoverLane,
    discoverVariant,
    loadDiscover,
  ]);

  function changeTopic(t: string) {
    setDiscoverTopic(t);
    setFamilies([]);
    resetDiscoverCursor();
    syncUrl({ topic: t === "font" ? null : t });
    void loadDiscover(1, t, false, discoverTreasure, "files", 0);
  }

  function surpriseMe() {
    if (visibleFamilies.length === 0) return;
    const pick = visibleFamilies[Math.floor(Math.random() * visibleFamilies.length)];
    openViewer(mergeFont(pick));
    toast.success(`Surprise: ${pick.family}`);
  }

  const deleteFromLibrary = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/fonts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLibrary((prev) => prev.filter((f) => f.id !== id));
      toast.success("Font deleted");
    } catch {
      toast.error("Could not delete font");
    }
  }, []);

  async function runSearch() {
    const term = query.trim();
    if (!term) {
      toast.error("Enter a search term first.");
      return;
    }
    setLoading(true);
    setError(null);
    syncUrl({ q: term, mode, tab: "search" });
    try {
      const res = await fetch("/api/font-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term, mode, limit: 30 }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          detail?: string;
        };
        throw new Error(body.message ?? body.error ?? body.detail ?? `Request failed (${res.status})`);
      }
      const json = (await res.json()) as SearchResponse;
      setData(json);
      if (json.results.length === 0) {
        toast.info("No fonts matched — try a different term or mode.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setData(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  // --- Keyboard shortcuts (issue 20) ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "?" && !typing) {
        setShowHelp((s) => !s);
        return;
      }
      if (showHelp && e.key === "Escape") {
        setShowHelp(false);
        return;
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          (tab === "discover" ? topicInputRef : searchInputRef).current?.focus();
        }
        return;
      }
      if (typing) return;
      if (activeViewer) {
        if (e.key === "Escape") closeViewer();
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          document.querySelector<HTMLButtonElement>('[title="Save font (S)"]')?.click();
        }
        if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          document.querySelector<HTMLButtonElement>('[title="Copy CSS (C)"]')?.click();
        }
        return;
      }
      if (e.key === "1") handleTabChange("discover");
      else if (e.key === "2") handleTabChange("search");
      else if (e.key === "3") handleTabChange("library");
      else if (e.key.toLowerCase() === "r" && tab === "discover") surpriseMe();
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // list navigation
        const listCount =
          tab === "discover" ? visibleFamilies.length : data?.results.length ?? 0;
        if (listCount === 0) return;
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = e.key === "ArrowDown" ? i + 1 : i - 1;
          return Math.max(0, Math.min(listCount - 1, next < 0 ? 0 : next));
        });
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        if (tab === "discover") openViewer(mergeFont(visibleFamilies[focusedIndex]));
        else if (data?.results[focusedIndex])
          openViewer({
            family: data.results[focusedIndex].fileName,
            fileName: data.results[focusedIndex].fileName,
            format: data.results[focusedIndex].format,
            repository: data.results[focusedIndex].repository,
            path: data.results[focusedIndex].path,
            license: data.results[focusedIndex].licenseName,
          });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeViewer, showHelp, tab, families, data, focusedIndex, query, mode]);

  // --- Compare wiring ---
  useEffect(() => {
    function onCompare(e: Event) {
      const font = (e as CustomEvent<ViewerFont>).detail;
      if (font) {
        setActiveViewer(font);
        setCompareMode(true);
      }
    }
    window.addEventListener("fontgrep:compare", onCompare as EventListener);
    return () => window.removeEventListener("fontgrep:compare", onCompare as EventListener);
  }, []);

  function handleCompareSelect(font: ViewerFont) {
    setActiveViewer(font);
  }

  const compareOptions: CompareFontOption[] = [
    ...families.map((f) => ({ label: f.family, font: mergeFont(f) })),
    ...(data?.results ?? []).map((r) => ({
      label: r.fileName,
      font: {
        family: r.fileName,
        fileName: r.fileName,
        format: r.format,
        repository: r.repository,
        branch: r.branch,
        path: r.path,
        license: r.licenseName,
        rawUrl: rawUrlOf(r.repository, r.branch ?? "main", r.path),
      } as ViewerFont,
    })),
    ...library.map((l) => ({
      label: l.realFamily ?? l.family,
      font: {
        id: l.id,
        family: l.realFamily ?? l.family,
        fileName: l.family,
        format: l.format,
        license: l.license ?? undefined,
        publicPath: l.publicPath ?? undefined,
        isVariable: l.isVariable,
      } as ViewerFont,
    })),
  ];

  const sidebar = (
    <AppSidebar
      tab={tab}
      onTabChange={handleTabChange}
      query={query}
      setQuery={setQuery}
      mode={mode}
      setMode={setMode}
      loading={loading}
      onSearch={runSearch}
      previewText={previewText}
      setPreviewText={setPreviewText}
      discoverTopic={discoverTopic}
      onTopicChange={changeTopic}
      onSurprise={surpriseMe}
      fmtFilters={fmtFilters}
      setFmtFilters={setFmtFilters}
      discoverFilters={discoverFilters}
      setDiscoverFilters={setDiscoverFilters}
      onResetDiscover={resetDiscoverSettings}
      onRareMode={enableRareHunt}
      onPopularMode={enablePopularMode}
      sortBy={sortBy}
      setSortBy={setSortBy}
      discoveredCount={visibleFamilies.length}
      loadedFamiliesCount={families.length}
      resultCount={data?.results.length ?? 0}
      totalMatches={data?.totalCount}
      libraryCount={library.length}
      topicInputRef={topicInputRef}
      searchInputRef={searchInputRef}
      onShowHelp={() => setShowHelp(true)}
      className={
        scrollSmootherEnabled
          ? "fixed inset-y-0 left-0 z-50 h-screen w-[17.5rem] border-b-0"
          : undefined
      }
    />
  );

  const topBar = (
    <AppTopBar
      title={headerTitle({
        tab,
        activeViewer,
        compareMode,
      })}
      subtitle={headerSubtitle({
        tab,
        activeViewer,
        compareMode,
        discoveredCount: visibleFamilies.length,
        resultCount: data?.results.length ?? 0,
        totalMatches: data?.totalCount,
        libraryCount: library.length,
        discoverTopic,
      })}
      onBack={
        activeViewer
          ? () => {
              if (compareMode) setCompareMode(false);
              else closeViewer();
            }
          : undefined
      }
      tools={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Keyboard shortcuts"
            className="rounded-xl border-border bg-background/80"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="size-4" />
          </Button>
          <ModeToggle />
        </>
      }
    />
  );

  const feedPanel = (
    <GsapTabPanel
      panelKey={
        activeViewer ? (compareMode ? "compare" : "viewer") : tab
      }
      className={scrollSmootherEnabled ? undefined : "h-full"}
    >
      {activeViewer && compareMode ? (
        <FontCompare
          left={activeViewer}
          onSelectRight={handleCompareSelect}
          options={compareOptions}
          onClose={() => setCompareMode(false)}
        />
      ) : activeViewer ? (
        <FontViewer
          font={activeViewer}
          onClose={closeViewer}
          hideCompare={false}
        />
      ) : tab === "discover" ? (
        <DiscoverView
          families={visibleFamilies}
          totalBeforeFilter={families.length}
          loading={browseLoading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={discoverError}
          previewText={previewText}
          topic={discoverTopic}
          treasureMode={discoverTreasure}
          discoverPage={discoverPage}
          reposFetchedTotal={reposFetchedTotal}
          githubTotalCount={githubTotalCount}
          onLoadMore={loadMore}
          loadSentinelRef={loadSentinelRef}
          onOpenViewer={(f) => openViewer(mergeFont(f))}
          onRetry={() => void loadDiscover(1, discoverTopic, false, discoverTreasure)}
          onResetTopic={() => changeTopic("font")}
          onTopicChange={changeTopic}
          onToggleMode={discoverTreasure ? enablePopularMode : enableRareHunt}
        />
      ) : tab === "search" ? (
        <SearchView
          data={data}
          error={error}
          loading={loading}
          previewText={searchPreviewText}
          onOpenViewer={(r) =>
            openViewer({
              family: r.fileName,
              fileName: r.fileName,
              format: r.format,
              repository: r.repository,
              branch: r.branch,
              path: r.path,
              license: r.licenseName,
              rawUrl: rawUrlOf(r.repository, r.branch ?? "main", r.path),
            })
          }
        />
      ) : (
        <LibraryView
          fonts={library}
          loading={libraryLoading}
          previewText={previewText}
          onOpenViewer={(l) =>
            openViewer(
              {
                id: l.id,
                family: l.realFamily ?? l.family,
                realFamily: l.realFamily,
                fileName: l.family,
                format: l.format,
                license: l.license ?? undefined,
                publicPath: l.publicPath ?? undefined,
                weight: l.weight,
                style: l.style,
                isVariable: l.isVariable,
                designer: l.designer,
              },
              true,
            )
          }
          onDelete={deleteFromLibrary}
        />
      )}
    </GsapTabPanel>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {scrollSmootherEnabled ? (
        <>
          {sidebar}
          <div id="smooth-wrapper" ref={smoothWrapperRef}>
            <div id="smooth-content" ref={smoothContentRef}>
              <main className="pl-[17.5rem]">
                {topBar}
                <section
                  className={cn(
                    "px-3 py-2 md:px-4 md:py-3",
                    FEED_SURFACE,
                  )}
                >
                  {feedPanel}
                </section>
              </main>
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
          {sidebar}
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {topBar}
            <section
              ref={feedScrollRef}
              className={cn(
                "min-h-0 flex-1",
                feedSurface
                  ? cn(
                      "overflow-y-auto overscroll-y-contain px-3 py-2 md:px-4 md:py-3",
                      FEED_SURFACE,
                    )
                  : "p-4 md:p-6",
              )}
            >
              {feedPanel}
            </section>
          </main>
        </div>
      )}

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function headerTitle({
  tab,
  activeViewer,
  compareMode,
}: {
  tab: TabId;
  activeViewer: ViewerFont | null;
  compareMode: boolean;
}): string {
  if (compareMode) return "Compare";
  if (activeViewer) return activeViewer.realFamily ?? activeViewer.family;
  if (tab === "discover") return "Discover";
  if (tab === "search") return "Search";
  return "Library";
}

function headerSubtitle({
  tab,
  activeViewer,
  compareMode,
  discoveredCount,
  resultCount,
  totalMatches,
  libraryCount,
  discoverTopic,
}: {
  tab: TabId;
  activeViewer: ViewerFont | null;
  compareMode: boolean;
  discoveredCount: number;
  resultCount: number;
  totalMatches?: number;
  libraryCount: number;
  discoverTopic: string;
}): string {
  if (compareMode && activeViewer) {
    return `${activeViewer.family} · pick a second font`;
  }
  if (activeViewer) {
    const repo = activeViewer.repository ?? "Saved font";
    const detail = activeViewer.path ?? activeViewer.format;
    return `${repo} · ${detail}`;
  }
  if (tab === "discover") {
    if (discoveredCount > 0) {
      return `${discoveredCount} ${discoveredCount === 1 ? "family" : "families"} · topic ${discoverTopic}`;
    }
    return `Topic ${discoverTopic} · scroll to wander`;
  }
  if (tab === "search") {
    if (totalMatches != null) {
      return `${totalMatches.toLocaleString()} matches · showing ${resultCount}`;
    }
    return "Run a search from the sidebar";
  }
  return `${libraryCount} saved ${libraryCount === 1 ? "font" : "fonts"}`;
}

function DiscoverView({
  families,
  totalBeforeFilter,
  loading,
  loadingMore,
  hasMore,
  error,
  previewText,
  topic,
  treasureMode,
  discoverPage,
  reposFetchedTotal,
  githubTotalCount,
  onLoadMore,
  loadSentinelRef,
  onOpenViewer,
  onRetry,
  onResetTopic,
  onTopicChange,
  onToggleMode,
}: {
  families: DiscoveredFontFamily[];
  totalBeforeFilter: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  previewText: string;
  topic: string;
  treasureMode: boolean;
  discoverPage: number;
  reposFetchedTotal: number;
  githubTotalCount: number | null;
  onLoadMore: () => void;
  loadSentinelRef: React.RefObject<HTMLDivElement | null>;
  onOpenViewer: (f: DiscoveredFontFamily) => void;
  onRetry: () => void;
  onResetTopic: () => void;
  onTopicChange: (topic: string) => void;
  onToggleMode: () => void;
}) {
  if (error) {
    return (
      <SpecimenEmptyCard title="Discover failed" description={error}>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </SpecimenEmptyCard>
    );
  }

  if (loading && families.length === 0) {
    return <DiscoverLoadingPins />;
  }

  if (families.length === 0) {
    if (loadingMore) {
      return <DiscoverLoadingPins />;
    }
    return (
      <SpecimenEmptyCard
        title={
          totalBeforeFilter > 0 ? "No fonts match filters" : `No fonts for “${topic}”`
        }
        description={
          totalBeforeFilter > 0
            ? hasMore
              ? "Still paging through GitHub repos for families that pass your filters."
              : "This GitHub search returned no more pages. Try another topic or switch to Popular mode."
            : topic === "font"
              ? "GitHub returned no font files. Restart the dev server if you recently added GITHUB_TOKEN, then retry."
              : `GitHub has no font repos tagged topic:${topic}, or none contain font files. Pick a topic chip below (e.g. display, monospace) or reset to the default.`
        }
      >
        <div className="flex flex-wrap gap-2">
          {topic !== "font" && (
            <Button variant="default" size="sm" onClick={onResetTopic}>
              Try topic “font”
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </SpecimenEmptyCard>
    );
  }

  return (
    <div className="pb-8">
      <FontBentoGrid
        families={families}
        onOpenViewer={onOpenViewer}
      />

      <div className="px-4 mt-3">
        <DiscoveryFooter
          hasMore={hasMore}
          loadingMore={loadingMore}
          topic={topic}
          treasureMode={treasureMode}
          reposFetchedTotal={reposFetchedTotal}
          githubTotalCount={githubTotalCount}
          visibleCount={families.length}
          onLoadMore={onLoadMore}
          loadSentinelRef={loadSentinelRef}
          onTopicChange={onTopicChange}
          onToggleMode={onToggleMode}
        />
      </div>
    </div>
  );
}

function SearchView({
  data,
  error,
  loading,
  previewText,
  onOpenViewer,
}: {
  data: SearchResponse | null;
  error: string | null;
  loading: boolean;
  previewText: string;
  onOpenViewer: (font: FontDiscoveryResult) => void;
}) {
  if (loading && !data) {
    return <LoadingGrid label="Searching fonts" />;
  }

  if (error) {
    return (
      <SpecimenEmptyCard title="Search failed" description={error} />
    );
  }

  if (!data) {
    return (
      <SpecimenEmptyCard
        title="Search the GitHub code index"
        description="Enter a term in the navigation panel. The same text becomes the live font preview in each result card."
      />
    );
  }

  if (data.results.length === 0) {
    return (
      <SpecimenEmptyCard
        title="No results"
        description="Nothing matched your search. Try a different term or switch the search mode."
      />
    );
  }

  return (
    <div className="w-full">
      <FontCardGrid>
        {data.results.map((font, index) => (
          <SearchFontCard
            key={`${font.repository}-${font.path}-${index}`}
            font={font}
            previewText={previewText}
            onOpenViewer={onOpenViewer}
          />
        ))}
      </FontCardGrid>
    </div>
  );
}

function LibraryView({
  fonts,
  loading,
  previewText,
  onOpenViewer,
  onDelete,
}: {
  fonts: LibraryFont[];
  loading: boolean;
  previewText: string;
  onOpenViewer: (f: LibraryFont) => void;
  onDelete: (id: number) => void;
}) {
  if (loading) {
    return <LoadingGrid label="Loading library" />;
  }

  if (fonts.length === 0) {
    return (
      <SpecimenEmptyCard
        title="No saved fonts yet"
        description="Browse Discover to find some."
      />
    );
  }

  return (
    <div className="w-full">
      <FontCardGrid>
        {fonts.map((font) => (
          <LibraryFontCard
            key={font.id}
            font={font}
            previewText={previewText}
            onOpenViewer={onOpenViewer}
            onDelete={onDelete}
          />
        ))}
      </FontCardGrid>
    </div>
  );
}

function FontCardGrid({ children }: { children: React.ReactNode }) {
  const count = Children.count(children);
  const gridRef = useGsapScrollReveal<HTMLDivElement>([count]);

  return (
    <div
      ref={gridRef}
      className={cn(CARD_GRID_CLASS, "pb-6")}
    >
      {children}
    </div>
  );
}

function SpecimenEmptyCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-lg rounded-2xl bg-[#eaeaea] p-5 dark:bg-[#1c1c1c]">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
        Status
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children ? <div className="mt-4 flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

function SearchFontCard({
  font,
  previewText,
  onOpenViewer,
}: {
  font: FontDiscoveryResult;
  previewText: string;
  onOpenViewer: (font: FontDiscoveryResult) => void;
}) {
  return (
    <BentoFontCard
      fontLabel={font.fileName}
      styleLabel={font.format.toUpperCase()}
      onClick={() => onOpenViewer(font)}
      className="min-h-[175px] md:min-h-[190px]"
      preview={
        <FontPreviewText
          family={font.fileName}
          repository={font.repository}
          branch={font.branch}
          path={font.path}
          format={font.format}
          sample={previewText}
          cardLine
          className="break-words text-foreground text-[clamp(2.6rem,5.5vw,4.25rem)] leading-[0.88] tracking-[-0.015em]"
          lazy
        />
      }
      footer={
        <div
          className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Badge data-card-footer variant={FORMAT_VARIANT[font.format]} className="text-[9px]">
            {font.format}
          </Badge>
          <a
            data-card-footer
            href={font.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono uppercase tracking-widest hover:text-foreground"
          >
            GitHub <ExternalLink className="size-3" />
          </a>
        </div>
      }
    />
  );
}

function LibraryFontCard({
  font,
  previewText,
  onOpenViewer,
  onDelete,
}: {
  font: LibraryFont;
  previewText: string;
  onOpenViewer: (f: LibraryFont) => void;
  onDelete: (id: number) => void;
}) {
  const title = font.realFamily ?? font.family;

  return (
    <BentoFontCard
      fontLabel={title}
      styleLabel={font.isVariable ? "Variable" : font.format.toUpperCase()}
      onClick={() => onOpenViewer(font)}
      className="min-h-[175px] md:min-h-[190px]"
      preview={
        <FontPreviewText
          family={title}
          format={font.format}
          publicPath={font.publicPath ?? undefined}
          sample={previewText}
          cardLine
          className="break-words text-foreground text-[clamp(2.6rem,5.5vw,4.25rem)] leading-[0.88] tracking-[-0.015em]"
          lazy
        />
      }
      footer={
        <div
          className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            data-card-footer
            type="button"
            variant="ghost"
            size="xs"
            className="text-destructive hover:text-destructive"
            data-icon="inline-start"
            onClick={() => {
              if (confirm(`Delete "${title}"?`)) onDelete(font.id);
            }}
          >
            <Trash2 /> Delete
          </Button>
          {font.isVariable && (
            <Badge data-card-footer variant="outline" className="text-[9px]">
              Var
            </Badge>
          )}
        </div>
      }
    />
  );
}

function LoadingGrid({ label }: { label: string }) {
  return (
    <FontCardGrid>
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[175px] flex-col justify-between overflow-hidden rounded-2xl bg-[#eaeaea] p-4 text-foreground animate-pulse dark:bg-[#1c1c1c] md:min-h-[190px] md:p-5"
        >
          <div className="flex gap-7 text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-10 rounded bg-muted" />
          </div>
          <div className="mt-auto pt-7 text-[clamp(2.5rem,5vw,4rem)] font-medium leading-none text-foreground opacity-30">
            {label}
          </div>
          <div className="mt-3 h-2 w-1/3 rounded bg-muted" />
        </div>
      ))}
    </FontCardGrid>
  );
}

function InlineLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function DiscoveryFooter({
  hasMore,
  loadingMore,
  topic,
  treasureMode,
  reposFetchedTotal,
  githubTotalCount,
  visibleCount,
  onLoadMore,
  loadSentinelRef,
  onTopicChange,
  onToggleMode,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  topic: string;
  treasureMode: boolean;
  reposFetchedTotal: number;
  githubTotalCount: number | null;
  visibleCount: number;
  onLoadMore: () => void;
  loadSentinelRef: React.RefObject<HTMLDivElement | null>;
  onTopicChange: (topic: string) => void;
  onToggleMode: () => void;
}) {
  if (loadingMore) {
    return (
      <div ref={loadSentinelRef} className="min-h-px">
        <InlineLoader label="Loading more pins" />
      </div>
    );
  }

  if (hasMore) {
    return (
      <div
        ref={loadSentinelRef}
        className="flex min-h-px flex-col items-center gap-2 py-6"
        aria-hidden
      >
        <Button variant="ghost" size="sm" onClick={onLoadMore}>
          Load more
        </Button>
      </div>
    );
  }

  return (
    <div ref={loadSentinelRef} className="min-h-px">
    <WanderFeedEnd
      topic={topic}
      treasureMode={treasureMode}
      reposScanned={reposFetchedTotal}
      fontsShown={visibleCount}
      githubTotal={githubTotalCount}
      onTopicChange={onTopicChange}
      onToggleMode={onToggleMode}
    />
    </div>
  );
}

