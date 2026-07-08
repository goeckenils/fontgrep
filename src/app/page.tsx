"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  FileType2,
  Tags,
  Paintbrush,
  Scale,
  ExternalLink,
  Loader2,
  Sparkles,
  Eye,
  Trash2,
  HelpCircle,
  Keyboard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FontViewer, type ViewerFont } from "@/components/FontViewer";
import { FontCompare, type CompareFontOption } from "@/components/FontCompare";
import { ModeToggle } from "@/components/mode-toggle";
import { ShortcutsHelp } from "@/components/ShortcutsHelp";
import { toast } from "sonner";
import type { FontFormat, FontSearchMode } from "@/types/fontDiscovery";
import type { DiscoveredFontFamily } from "@/lib/fontFamily";
import { styleLabel } from "@/lib/fontFamily";

type TabId = "discover" | "search" | "library";

interface SearchResponse {
  query: string;
  totalCount: number;
  results: FontDiscoveryResult[];
}

interface FontDiscoveryResult {
  repository: string;
  path: string;
  fileName: string;
  url: string;
  format: FontFormat;
  licenseName?: string;
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

const SEARCH_MODES: { value: FontSearchMode; label: string; icon: React.ReactNode }[] = [
  { value: "filename", label: "Filename", icon: <FileType2 className="size-4" /> },
  { value: "extension", label: "Extension", icon: <Tags className="size-4" /> },
  { value: "css", label: "CSS @font-face", icon: <Paintbrush className="size-4" /> },
  { value: "license", label: "License", icon: <Scale className="size-4" /> },
];

const TOPIC_CHIPS = [
  "font",
  "monospace",
  "display",
  "handwriting",
  "variable-font",
  "icon-font",
  "nerd-font",
  "serif",
  "sans-serif",
  "pixel-font",
];

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

  // --- Discover state ---
  const [families, setFamilies] = useState<DiscoveredFontFamily[]>([]);
  const [discoverTopic, setDiscoverTopic] = useState(topicParam);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // --- Filter & sort (issue 13) ---
  const [fmtFilters, setFmtFilters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"relevance" | "name" | "stars">("relevance");

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

  const mergeFont = (f: DiscoveredFontFamily): ViewerFont => ({
    family: f.family,
    format: f.styles[0]?.format ?? "unknown",
    fileName: f.styles[0]?.fileName ?? f.family,
    repository: f.repository,
    path: f.styles[0]?.path,
    license: f.license ?? undefined,
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
              format: found.format,
              fileName: found.family,
              license: found.license ?? undefined,
              publicPath: found.publicPath ?? undefined,
              isVariable: found.isVariable,
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
    async (pageToLoad: number, topic: string, append: boolean) => {
      if (append) setLoadingMore(true);
      else setBrowseLoading(true);
      setDiscoverError(null);
      const sessionKey = `discover:${topic}:${pageToLoad}`;
      try {
        if (!append) {
          const cached = sessionStorage.getItem(sessionKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setFamilies(parsed.families);
            setHasMore(parsed.hasMore);
            setDiscoverPage(pageToLoad);
            return;
          }
        }
        const params = new URLSearchParams();
        params.set("query", topic);
        params.set("page", String(pageToLoad));
        const res = await fetch(`/api/fonts/discover?${params.toString()}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
          if (res.status === 429) {
            setDiscoverError(body.message ?? "GitHub rate limit reached. Try again later.");
          } else {
            throw new Error(body.message ?? "Failed to discover fonts");
          }
          return;
        }
        const json = (await res.json()) as {
          families: DiscoveredFontFamily[];
          hasMore: boolean;
        };
        setFamilies((prev) => (append ? [...prev, ...json.families] : json.families));
        setHasMore(json.hasMore);
        setDiscoverPage(pageToLoad);
        if (!append) sessionStorage.setItem(sessionKey, JSON.stringify(json));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to discover fonts");
      } finally {
        setBrowseLoading(false);
        setLoadingMore(false);
      }
    },
    []
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
    syncUrl({ tab: next });
    if (next === "discover" && families.length === 0) void loadDiscover(1, discoverTopic, false);
    if (next === "library") void loadLibrary();
  }

  // Initial load.
  useEffect(() => {
    if (tab === "discover") void loadDiscover(1, discoverTopic, false);
    if (tab === "library") void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    void loadDiscover(discoverPage + 1, discoverTopic, true);
  }

  function changeTopic(t: string) {
    setDiscoverTopic(t);
    setFamilies([]);
    setDiscoverPage(1);
    syncUrl({ topic: t === "font" ? null : t });
    void loadDiscover(1, t, false);
  }

  function surpriseMe() {
    if (families.length === 0) return;
    const pick = families[Math.floor(Math.random() * families.length)];
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
        const listCount = tab === "discover" ? families.length : data?.results.length ?? 0;
        if (listCount === 0) return;
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = e.key === "ArrowDown" ? i + 1 : i - 1;
          return Math.max(0, Math.min(listCount - 1, next < 0 ? 0 : next));
        });
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        if (tab === "discover") openViewer(mergeFont(families[focusedIndex]));
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
        path: r.path,
        license: r.licenseName,
        rawUrl: rawUrlOf(r.repository, "main", r.path),
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

  // --- Derived filtered/sorted families (issue 13) ---
  const visibleFamilies = applyFilterSort(families, fmtFilters, sortBy);

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8 sm:py-10">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">fontgrep</h1>
            <p className="text-sm text-muted-foreground">
              Discover, search and curate open-source fonts via the GitHub code index.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Keyboard shortcuts"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="size-4" />
            </Button>
            <ModeToggle />
          </div>
        </header>

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
        ) : (
          <>
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList className="overflow-x-auto">
                <TabsTrigger value="discover" data-icon="inline-start">
                  <Sparkles className="size-4" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="search" data-icon="inline-start">
                  <Search className="size-4" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="library" data-icon="inline-start">
                  <Keyboard className="size-4" />
                  Library
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tab === "discover" ? (
              <DiscoverView
                families={visibleFamilies}
                loading={browseLoading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                error={discoverError}
                topic={discoverTopic}
                fmtFilters={fmtFilters}
                setFmtFilters={setFmtFilters}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onLoadMore={loadMore}
                onSurprise={surpriseMe}
                onTopicChange={changeTopic}
                onOpenViewer={(f) => openViewer(mergeFont(f))}
                onRetry={() => void loadDiscover(1, discoverTopic, false)}
                topicInputRef={topicInputRef}
              />
            ) : tab === "search" ? (
              <SearchView
                query={query}
                setQuery={setQuery}
                mode={mode}
                setMode={setMode}
                loading={loading}
                data={data}
                error={error}
                onSearch={runSearch}
                onOpenViewer={(font) => openViewer(font)}
                searchInputRef={searchInputRef}
              />
            ) : (
              <LibraryView
                fonts={library}
                loading={libraryLoading}
                onOpenViewer={(l) =>
                  openViewer(
                    {
                      id: l.id,
                      family: l.realFamily ?? l.family,
                      fileName: l.family,
                      format: l.format,
                      license: l.license ?? undefined,
                      publicPath: l.publicPath ?? undefined,
                      isVariable: l.isVariable,
                    },
                    true
                  )
                }
                onDelete={deleteFromLibrary}
              />
            )}
          </>
        )}
      </main>

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function applyFilterSort(
  families: DiscoveredFontFamily[],
  fmtFilters: Set<string>,
  sortBy: "relevance" | "name" | "stars"
) {
  let out = families;
  if (fmtFilters.size > 0) {
    out = out.filter((f) => f.styles.some((s) => fmtFilters.has(s.format)));
  }
  if (sortBy === "name") out = [...out].sort((a, b) => a.family.localeCompare(b.family));
  else if (sortBy === "stars") out = [...out].sort((a, b) => b.stars - a.stars);
  return out;
}

function DiscoverView({
  families,
  loading,
  loadingMore,
  hasMore,
  error,
  topic,
  fmtFilters,
  setFmtFilters,
  sortBy,
  setSortBy,
  onLoadMore,
  onSurprise,
  onTopicChange,
  onOpenViewer,
  onRetry,
  topicInputRef,
}: {
  families: DiscoveredFontFamily[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  topic: string;
  fmtFilters: Set<string>;
  setFmtFilters: (s: Set<string>) => void;
  sortBy: "relevance" | "name" | "stars";
  setSortBy: (s: "relevance" | "name" | "stars") => void;
  onLoadMore: () => void;
  onSurprise: () => void;
  onTopicChange: (t: string) => void;
  onOpenViewer: (f: DiscoveredFontFamily) => void;
  onRetry: () => void;
  topicInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) onLoadMore();
  }

  function toggleFmt(fmt: string) {
    const next = new Set(fmtFilters);
    if (next.has(fmt)) next.delete(fmt);
    else next.add(fmt);
    setFmtFilters(next);
  }

  const formats = ["ttf", "otf", "woff2", "variable", "svg"];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onTopicChange(topic);
          }}
        >
          <Input
            ref={topicInputRef}
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Topic (e.g. monospace, display)"
            aria-label="Discover topic"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
        <Button variant="outline" size="sm" onClick={onSurprise} data-icon="inline-start">
          <Sparkles className="size-4" />
          Surprise me
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TOPIC_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onTopicChange(c)}
            className={
              "rounded-full border px-2.5 py-1 text-xs transition-colors " +
              (topic === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted")
            }
          >
            {c}
          </button>
        ))}
      </div>

      <Separator />

      {/* Filter & sort (issue 13) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {formats.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFmt(f)}
              className={
                "rounded-md border px-2 py-0.5 text-xs capitalize transition-colors " +
                (fmtFilters.has(f)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted")
              }
            >
              {f}
            </button>
          ))}
        </div>
        <select
          className="ml-auto rounded-md border bg-background px-2 py-1 text-xs"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "relevance" | "name" | "stars")}
          aria-label="Sort by"
        >
          <option value="relevance">Relevance</option>
          <option value="name">Name A–Z</option>
          <option value="stars">Stars</option>
        </select>
        {fmtFilters.size > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setFmtFilters(new Set())}
          >
            Clear filters
          </Button>
        )}
      </div>

      {error ? (
        <Card className="ring-destructive/30">
          <CardContent className="flex flex-col gap-2 py-4 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : loading && families.length === 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : families.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {families.length} font {families.length === 1 ? "family" : "families"} discovered
            {hasMore && " · scroll for more"}
          </p>
          <ScrollArea className="h-[55vh] rounded-lg border" onScrollCapture={handleScroll}>
            <ul className="flex flex-col divide-y">
              {families.map((f, i) => (
                <li
                  key={`${f.repository}-${f.family}-${i}`}
                  className="cursor-pointer p-3 transition-colors hover:bg-muted/50"
                  onClick={() => onOpenViewer(f)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{f.family}</span>
                      <span className="text-xs text-muted-foreground">{f.repository}</span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="capitalize">
                          {f.styles.length} {f.styles.length === 1 ? "style" : "styles"}
                        </Badge>
                        {f.styles.slice(0, 4).map((s, idx) => (
                          <Badge key={idx} variant={FORMAT_VARIANT[s.format]}>
                            {styleLabel(s)}
                          </Badge>
                        ))}
                        {f.license && (
                          <Badge variant="secondary">
                            <Scale className="size-3" />
                            {f.license}
                          </Badge>
                        )}
                        {f.stars > 0 && (
                          <span className="text-xs text-muted-foreground">★ {f.stars}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-icon="inline-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenViewer(f);
                      }}
                    >
                      <Eye className="size-4" />
                      View
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading more…
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No fonts discovered. Set GITHUB_TOKEN in .env to fetch from GitHub.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SearchView({
  query,
  setQuery,
  mode,
  setMode,
  loading,
  data,
  error,
  onSearch,
  onOpenViewer,
  searchInputRef,
}: {
  query: string;
  setQuery: (q: string) => void;
  mode: FontSearchMode;
  setMode: (m: FontSearchMode) => void;
  loading: boolean;
  data: SearchResponse | null;
  error: string | null;
  onSearch: () => void;
  onOpenViewer: (font: ViewerFont) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={mode} onValueChange={(v) => setMode(v as FontSearchMode)}>
        <TabsList className="overflow-x-auto">
          {SEARCH_MODES.map((m) => (
            <TabsTrigger key={m.value} value={m.value} data-icon="inline-start">
              {m.icon}
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void onSearch();
        }}
      >
        <Input
          ref={searchInputRef}
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
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Search
        </Button>
      </form>

      <Separator />

      {error && (
        <Card className="ring-destructive/30">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {data && data.results.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {data.totalCount.toLocaleString()} total matches · showing {data.results.length}
          </p>
          <ScrollArea className="h-[55vh] rounded-lg border">
            <ul className="flex flex-col divide-y">
              {data.results.map((r, i) => (
                <li
                  key={`${r.repository}-${r.path}-${i}`}
                  className="cursor-pointer p-3 transition-colors hover:bg-muted/50"
                  onClick={() =>
                    onOpenViewer({
                      family: r.fileName,
                      fileName: r.fileName,
                      format: r.format,
                      repository: r.repository,
                      path: r.path,
                      license: r.licenseName,
                    })
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{r.fileName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {r.repository} · {r.path}
                      </span>
                      {r.licenseName && (
                        <Badge variant="secondary" className="w-fit">
                          <Scale className="size-3" />
                          {r.licenseName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={FORMAT_VARIANT[r.format]}>{r.format}</Badge>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={`Open ${r.fileName} on GitHub`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {data && data.results.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No results</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nothing matched your search. Try a different term or switch the search mode.
          </CardContent>
        </Card>
      )}

      {!data && !loading && !error && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Dig into the raw GitHub code index. Needs a GITHUB_TOKEN for results.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LibraryView({
  fonts,
  loading,
  onOpenViewer,
  onDelete,
}: {
  fonts: LibraryFont[];
  loading: boolean;
  onOpenViewer: (f: LibraryFont) => void;
  onDelete: (id: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (fonts.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No saved fonts yet. Browse Discover to find some.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {fonts.length} saved {fonts.length === 1 ? "font" : "fonts"}
      </p>
      <ScrollArea className="h-[60vh] rounded-lg border">
        <ul className="flex flex-col divide-y">
          {fonts.map((f) => (
            <li
              key={f.id}
              className="flex cursor-pointer items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/50"
              onClick={() => onOpenViewer(f)}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-medium">{f.realFamily ?? f.family}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="uppercase">
                    {f.format}
                  </Badge>
                  {f.isVariable && <Badge variant="outline">Variable</Badge>}
                  {f.license && (
                    <Badge variant="secondary">
                      <Scale className="size-3" />
                      {f.license}
                    </Badge>
                  )}
                  {f.designer && (
                    <span className="text-xs text-muted-foreground">{f.designer}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  data-icon="inline-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenViewer(f);
                  }}
                >
                  <Eye className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete font"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${f.realFamily ?? f.family}"?`)) onDelete(f.id);
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}
