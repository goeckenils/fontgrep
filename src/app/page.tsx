"use client";

import { useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@//components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FontViewer, type ViewerFont } from "@/components/FontViewer";
import { toast } from "sonner";
import type { FontDiscoveryResult, FontFormat, FontSearchMode } from "@/types/fontDiscovery";

interface SearchResponse {
  query: string;
  totalCount: number;
  results: FontDiscoveryResult[];
}

interface DiscoveredFont {
  repository: string;
  branch: string;
  path: string;
  format: string;
  license: string | null;
  family: string;
}

interface DiscoverResponse {
  query: string;
  page: number;
  fonts: DiscoveredFont[];
  hasMore: boolean;
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

export default function Home() {
  const [tab, setTab] = useState<"discover" | "search">("discover");

  // --- Discover state ---
  const [discovered, setDiscovered] = useState<DiscoveredFont[]>([]);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- Search state ---
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FontSearchMode>("filename");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeViewer, setActiveViewer] = useState<ViewerFont | null>(null);

  const loadDiscover = useCallback(
    async (pageToLoad: number, query: string, append: boolean) => {
      if (append) setLoadingMore(true);
      else setBrowseLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("query", query);
        params.set("page", String(pageToLoad));
        const res = await fetch(`/api/fonts/discover?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to discover fonts");
        const json = (await res.json()) as DiscoverResponse;
        setDiscovered((prev) => (append ? [...prev, ...json.fonts] : json.fonts));
        setHasMore(json.hasMore);
        setDiscoverPage(pageToLoad);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to discover fonts");
      } finally {
        setBrowseLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  function handleTabChange(v: string) {
    setTab(v as "discover" | "search");
    if (v === "discover" && discovered.length === 0) void loadDiscover(1, "font", false);
  }

  // Initial load of the discover list on mount.
  useEffect(() => {
    void loadDiscover(1, "font", false);
  }, [loadDiscover]);

  function loadMore() {
    if (loadingMore || !hasMore) return;
    void loadDiscover(discoverPage + 1, "font", true);
  }

  function surpriseMe() {
    if (discovered.length === 0) return;
    const pick = discovered[Math.floor(Math.random() * discovered.length)];
    toast.success(`Surprise: ${pick.family}`, { description: `${pick.repository} · ${pick.license ?? "no license"}` });
  }

  async function runSearch() {
    const term = query.trim();
    if (!term) {
      toast.error("Enter a search term first.");
      return;
    }
    setLoading(true);
    setError(null);
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

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            GitHub Font Indexer
          </h1>
          <p className="text-sm text-muted-foreground">
            Discover curated open-source fonts, or dig into the GitHub code index.
          </p>
        </header>

        {activeViewer ? (
          <FontViewer font={activeViewer} onClose={() => setActiveViewer(null)} />
        ) : (
          <>
            <Tabs value={tab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="discover" data-icon="inline-start">
                  <Sparkles className="size-4" />
                  Discover
                </TabsTrigger>
                <TabsTrigger value="search" data-icon="inline-start">
                  <Search className="size-4" />
                  Search
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tab === "discover" ? (
              <DiscoverView
                fonts={discovered}
                loading={browseLoading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onSurprise={surpriseMe}
                onOpenViewer={(f: DiscoveredFont) =>
                  setActiveViewer({
                    family: f.family,
                    fileName: f.family,
                    format: f.format,
                    repository: f.repository,
                    path: f.path,
                    license: f.license ?? undefined,
                  })
                }
              />
            ) : (
              <SearchView
                query={query}
                setQuery={setQuery}
                mode={mode}
                setMode={setMode}
                loading={loading}
                data={data}
                error={error}
                onSearch={runSearch}
                onOpenViewer={setActiveViewer}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function DiscoverView({
  fonts,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onSurprise,
  onOpenViewer,
}: {
  fonts: DiscoveredFont[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSurprise: () => void;
  onOpenViewer: (f: DiscoveredFont) => void;
}) {
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      onLoadMore();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSurprise} data-icon="inline-start">
            <Sparkles className="size-4" />
            Surprise me
          </Button>
        </div>
      </div>

      <Separator />

      {loading && fonts.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading fonts…
          </CardContent>
        </Card>
      ) : fonts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {fonts.length} fonts discovered
            {hasMore && " · scroll for more"}
          </p>
          <ScrollArea className="h-[60vh] rounded-lg border" onScrollCapture={handleScroll}>
            <ul className="flex flex-col divide-y">
              {fonts.map((f, i) => (
                <li
                  key={`${f.repository}-${f.path}-${i}`}
                  className="cursor-pointer p-3 transition-colors hover:bg-muted/50"
                  onClick={() => onOpenViewer(f)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{f.family}</span>
                      <span className="text-xs text-muted-foreground">{f.repository}</span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="capitalize">
                          {f.format}
                        </Badge>
                        {f.license && (
                          <Badge variant="secondary">
                            <Scale className="size-3" />
                            {f.license}
                          </Badge>
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
}) {
  return (
    <div className="flex flex-col gap-3">
      <Tabs value={mode} onValueChange={(v) => setMode(v as FontSearchMode)}>
        <TabsList>
          {SEARCH_MODES.map((m) => (
            <TabsTrigger key={m.value} value={m.value} data-icon="inline-start">
              {m.icon}
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onSearch();
        }}
      >
        <Input
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
