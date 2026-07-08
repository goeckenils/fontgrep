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
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@//components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { FontDiscoveryResult, FontFormat, FontSearchMode } from "@/types/fontDiscovery";

interface SearchResponse {
  query: string;
  totalCount: number;
  results: FontDiscoveryResult[];
}

interface CuratedFont {
  name: string;
  category: string;
  license: string;
  repo: string;
  description: string;
}

interface BrowseResponse {
  fonts: CuratedFont[];
  total: number;
  excludedFromCurated: number;
}

const SEARCH_MODES: { value: FontSearchMode; label: string; icon: React.ReactNode }[] = [
  { value: "filename", label: "Filename", icon: <FileType2 className="size-4" /> },
  { value: "extension", label: "Extension", icon: <Tags className="size-4" /> },
  { value: "css", label: "CSS @font-face", icon: <Paintbrush className="size-4" /> },
  { value: "license", label: "License", icon: <Scale className="size-4" /> },
];

const CATEGORIES = ["all", "sans", "serif", "mono", "display", "handwriting"] as const;

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

export default function Home() {
  const [tab, setTab] = useState<"discover" | "search">("discover");

  // --- Discover state ---
  const [curated, setCurated] = useState<BrowseResponse | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [hidePreinstalled, setHidePreinstalled] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);

  // --- Search state ---
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FontSearchMode>("filename");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBrowse = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("category", category);
      params.set("exclude", hidePreinstalled ? "1" : "0");
      const res = await fetch(`/api/fonts/browse?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load fonts");
      const json = (await res.json()) as BrowseResponse;
      setCurated(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load fonts");
    } finally {
      setBrowseLoading(false);
    }
  }, [category, hidePreinstalled]);

  function handleTabChange(v: string) {
    setTab(v as "discover" | "search");
    if (v === "discover") void loadBrowse();
  }

  // Initial load of the discover list on mount.
  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  function surpriseMe() {
    if (!curated || curated.fonts.length === 0) return;
    const pick = curated.fonts[Math.floor(Math.random() * curated.fonts.length)];
    toast.success(`Surprise: ${pick.name}`, { description: pick.description });
    window.open(`https://github.com/${pick.repo}`, "_blank", "noopener,noreferrer");
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

        <Tabs
          value={tab}
          onValueChange={handleTabChange}
        >
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
            curated={curated}
            loading={browseLoading}
            category={category}
            setCategory={setCategory}
            hidePreinstalled={hidePreinstalled}
            setHidePreinstalled={setHidePreinstalled}
            onSurprise={surpriseMe}
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
          />
        )}
      </main>
    </div>
  );
}

function DiscoverView({
  curated,
  loading,
  category,
  setCategory,
  hidePreinstalled,
  setHidePreinstalled,
  onSurprise,
}: {
  curated: BrowseResponse | null;
  loading: boolean;
  category: string;
  setCategory: (c: string) => void;
  hidePreinstalled: boolean;
  setHidePreinstalled: (v: boolean) => void;
  onSurprise: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              variant={category === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c)}
              className="capitalize"
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={hidePreinstalled ? "secondary" : "outline"}
            size="sm"
            onClick={() => setHidePreinstalled(!hidePreinstalled)}
            data-icon="inline-start"
          >
            <EyeOff className="size-4" />
            Hide pre-installed
          </Button>
          <Button variant="outline" size="sm" onClick={onSurprise} data-icon="inline-start">
            <Sparkles className="size-4" />
            Surprise me
          </Button>
        </div>
      </div>

      <Separator />

      {loading && !curated ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading fonts…
          </CardContent>
        </Card>
      ) : curated && curated.fonts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {curated.total} fonts
            {curated.excludedFromCurated > 0 &&
              ` · ${curated.excludedFromCurated} pre-installed hidden`}
          </p>
          <ScrollArea className="h-[60vh] rounded-lg border">
            <ul className="flex flex-col divide-y">
              {curated.fonts.map((f) => (
                <li key={f.repo} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{f.description}</span>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="outline" className="capitalize">
                          {f.category}
                        </Badge>
                        <Badge variant="secondary">
                          <Scale className="size-3" />
                          {f.license}
                        </Badge>
                      </div>
                    </div>
                    <a
                      href={`https://github.com/${f.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Open ${f.name} on GitHub`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No fonts in this view. Try a different category or show pre-installed fonts.
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
}: {
  query: string;
  setQuery: (q: string) => void;
  mode: FontSearchMode;
  setMode: (m: FontSearchMode) => void;
  loading: boolean;
  data: SearchResponse | null;
  error: string | null;
  onSearch: () => void;
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
                <li key={`${r.repository}-${r.path}-${i}`} className="p-3">
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
