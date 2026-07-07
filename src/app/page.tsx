"use client";

import { useState } from "react";
import { Search, FileType2, Tags, Paintbrush, Scale, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const MODES: { value: FontSearchMode; label: string; icon: React.ReactNode }[] = [
  { value: "filename", label: "Filename", icon: <FileType2 className="size-4" /> },
  { value: "extension", label: "Extension", icon: <Tags className="size-4" /> },
  { value: "css", label: "CSS @font-face", icon: <Paintbrush className="size-4" /> },
  { value: "license", label: "License", icon: <Scale className="size-4" /> },
];

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
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FontSearchMode>("filename");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        throw new Error(body.error ?? body.detail ?? `Request failed (${res.status})`);
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
            Search the GitHub code index for fonts, typefaces and their licenses.
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Tabs value={mode} onValueChange={(v) => setMode(v as FontSearchMode)}>
            <TabsList>
              {MODES.map((m) => (
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
              void runSearch();
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
        </div>

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
            <ScrollArea className="h-[60vh] rounded-lg border">
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
              Pick a search mode, type a font name, and hit Search.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
