"use client";

import { useState, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { FontAxisSlider } from "@/components/FontAxisSlider";
import { StyleSelector } from "@/components/StyleSelector";
import type { FontStyle } from "@/lib/fontFamily";
import type { FontMetadata, VariableAxis } from "@/lib/fontMeta";
import { buildFontFaceCss } from "@/lib/cssExport";
import {
  Loader2,
  Download,
  ArrowLeft,
  Copy,
  GitCompare,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface ViewerFont {
  id?: number;
  family: string;
  format: string;
  fileName: string;
  repository?: string;
  path?: string;
  license?: string;
  /** Public URL that serves the font binary (e.g. /fonts/<hash>.woff2) */
  publicPath?: string;
  /** Raw GitHub URL to load the font directly without saving (issue 01) */
  rawUrl?: string;
  /** Multiple weights/styles for a family (issue 03) */
  styles?: FontStyle[];
  realFamily?: string | null;
  weight?: number | null;
  style?: string | null;
  isVariable?: boolean;
  designer?: string | null;
}

function formatKeyword(format: string, isVariable?: boolean): string {
  if (isVariable) return "woff2-variations";
  switch (format.toLowerCase()) {
    case "woff2":
      return "woff2";
    case "woff":
      return "woff";
    case "otf":
      return "opentype";
    case "ttf":
      return "truetype";
    case "svg":
      return "svg";
    default:
      return "truetype";
  }
}

export function FontViewer({
  font,
  onClose,
  embedded = false,
  syncedText,
  onTextChange,
  syncedSize,
  onSizeChange,
  hideCompare = false,
}: {
  font: ViewerFont;
  onClose: () => void;
  embedded?: boolean;
  syncedText?: string;
  onTextChange?: (t: string) => void;
  syncedSize?: number;
  onSizeChange?: (n: number) => void;
  hideCompare?: boolean;
}) {
  const [previewText, setPreviewText] = useState(
    syncedText ?? "The quick brown fox jumps over the lazy dog"
  );
  const [size, setSize] = useState(syncedSize ?? 64);
  const [weight, setWeight] = useState(font.weight ?? 400);
  const [activeStyle, setActiveStyle] = useState<FontStyle | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(font.id != null);
  const [fontUrl, setFontUrl] = useState<string | null>(font.publicPath ?? font.rawUrl ?? null);
  const [metadata, setMetadata] = useState<FontMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [axes, setAxes] = useState<Record<string, number>>({});
  const [showMeta, setShowMeta] = useState(false);
  const familyName = `fg-viewer-${useId().replace(/[^a-z0-9]/gi, "")}`;

  // Register a @font-face rule pointing at the served/raw binary.
  useEffect(() => {
    if (!fontUrl) return;
    const sheet = document.styleSheets[0];
    const isVar = metadata?.isVariable || font.isVariable;
    const rule = `@font-face { font-family: '${familyName}'; src: url('${fontUrl}') format('${
      formatKeyword(font.format, isVar)
    }'); font-display: swap; }`;
    let ruleIndex = -1;
    try {
      sheet.insertRule(rule, sheet.cssRules.length);
      ruleIndex = sheet.cssRules.length - 1;
    } catch {
      return;
    }
    return () => {
      try {
        if (ruleIndex >= 0) sheet.deleteRule(ruleIndex);
      } catch {
        /* noop */
      }
    };
  }, [fontUrl, familyName, font.format, metadata?.isVariable, font.isVariable]);

  // Inspect metadata (issue 10) when opened.
  useEffect(() => {
    if (metadata) return;
    let cancelled = false;
    setMetaLoading(true);
    (async () => {
      try {
        const body: Record<string, unknown> = {};
        if (font.id != null) body.id = font.id;
        else if (font.rawUrl) body.rawUrl = font.rawUrl;
        else if (font.repository && font.path) {
          body.repo = font.repository;
          body.path = font.path;
        }
        const res = await fetch("/api/fonts/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const json = (await res.json()) as FontMetadata;
        if (cancelled) return;
        setMetadata(json);
        if (json.isVariable && json.axes?.length) {
          const init: Record<string, number> = {};
          for (const a of json.axes) init[a.tag] = a.default;
          setAxes(init);
        }
      } catch {
        /* graceful fallback */
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [font.id, font.rawUrl, font.repository, font.path, metadata]);

  useEffect(() => {
    if (syncedText !== undefined) setPreviewText(syncedText);
  }, [syncedText]);
  useEffect(() => {
    if (syncedSize !== undefined) setSize(syncedSize);
  }, [syncedSize]);

  // Esc closes the viewer (issue 20) — only when not embedded.
  useEffect(() => {
    if (embedded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedded, onClose]);

  function handleStyleSelect(style: FontStyle) {
    setActiveStyle(style);
    setWeight(style.weight);
    // For saved family fonts, publicPath already points to the right file.
    const url =
      font.publicPath && !style.variable
        ? font.publicPath
        : (font.rawUrl ?? "");
    setFontUrl(url || (font.rawUrl as string));
  }

  async function handleDownload() {
    if (!font.repository || !font.path) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/fonts/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: font.repository,
          path: (activeStyle ?? font).path ?? font.path,
          fileName: (activeStyle ?? font).fileName ?? font.fileName,
          format: (activeStyle ?? font).format ?? font.format,
          license: font.license,
        }),
      });
      if (!res.ok) throw new Error("download failed");
      const json = await res.json();
      setFontUrl(json.publicPath ?? fontUrl);
      setDownloaded(true);
      if (json.metadata) setMetadata((m) => ({ ...m, ...json.metadata }));
    } catch {
      // ignore — preview still shows from remote
    } finally {
      setDownloading(false);
    }
  }

  function copyCss() {
    const isVar = metadata?.isVariable || font.isVariable;
    const src = font.publicPath ?? font.rawUrl ?? "";
    const css = buildFontFaceCss({
      family: metadata?.family ?? font.realFamily ?? font.family,
      format: font.format,
      weight,
      style: (metadata?.style as "normal" | "italic" | "oblique") ?? "normal",
      srcUrl: src,
      isVariable: isVar,
      variationSettings: isVar ? axes : undefined,
    });
    navigator.clipboard.writeText(css).then(
      () => toast.success("CSS copied to clipboard"),
      () => toast.error("Could not copy CSS")
    );
  }

  const isVariable = Boolean(metadata?.isVariable || font.isVariable);
  const axisList: VariableAxis[] = metadata?.axes ?? [];
  const variationSettings = axisList
    .map((a) => ({ tag: a.tag, value: axes[a.tag] ?? a.default }))
    .reduce<Record<string, number>>((acc, a) => {
      acc[a.tag] = a.value;
      return acc;
    }, {});

  const displayFamily = metadata?.family ?? font.realFamily ?? font.family;

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!embedded && (
            <Button size="sm" variant="ghost" onClick={onClose} data-icon="inline-start">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          <span className="font-medium">{displayFamily}</span>
          <Badge variant="outline" className="uppercase">
            {font.format}
          </Badge>
          {font.license && <Badge variant="secondary">{font.license}</Badge>}
          {isVariable && <Badge variant="outline">Variable</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {!hideCompare && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("fontgrep:compare", { detail: font }));
              }}
              data-icon="inline-start"
              title="Compare (C)"
            >
              <GitCompare className="size-4" /> Compare
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={copyCss}
            data-icon="inline-start"
            title="Copy CSS (C)"
          >
            <Copy className="size-4" /> Copy CSS
          </Button>
          <Button
            size="sm"
            variant={downloaded ? "secondary" : "default"}
            onClick={handleDownload}
            disabled={downloading || downloaded}
            data-icon="inline-start"
            title="Save font (S)"
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {downloaded ? "Saved" : "Save font"}
          </Button>
        </div>
      </div>

      {font.styles && font.styles.length > 1 && (
        <StyleSelector styles={font.styles} activePath={activeStyle?.path ?? font.path ?? ""} onSelect={handleStyleSelect} />
      )}

      <Input
        value={previewText}
        onChange={(e) => {
          setPreviewText(e.target.value);
          onTextChange?.(e.target.value);
        }}
        placeholder="Type something to preview…"
        aria-label="Preview text"
      />

      <div
        className="min-h-24 w-full break-words leading-tight"
        style={{
          fontFamily: `'${familyName}', sans-serif`,
          fontSize: `${size}px`,
          fontWeight: isVariable ? 400 : weight,
          fontStyle: metadata?.style === "italic" ? "italic" : "normal",
          fontVariationSettings: isVariable
            ? Object.entries(variationSettings)
                .map(([t, v]) => `'${t}' ${v}`)
                .join(", ")
            : undefined,
        }}
      >
        {previewText || " "}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Size</span>
          <span>{size}px</span>
        </div>
        <Slider
          min={16}
          max={160}
          step={1}
          value={[size]}
          onValueChange={(v) => {
            const next = (v as number[])[0];
            setSize(next);
            onSizeChange?.(next);
          }}
        />

        {isVariable && axisList.length > 0 ? (
          <div className="flex flex-col gap-3">
            {axisList.map((axis) => (
              <FontAxisSlider
                key={axis.tag}
                axis={axis}
                value={axes[axis.tag] ?? axis.default}
                onChange={(val) => setAxes((prev) => ({ ...prev, [axis.tag]: val }))}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Weight</span>
              <span>{weight}</span>
            </div>
            <Slider
              min={100}
              max={900}
              step={100}
              value={[weight]}
              onValueChange={(v) => setWeight((v as number[])[0])}
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setShowMeta((s) => !s)}
          data-icon="inline-start"
        >
          <Info className="size-3" /> {showMeta ? "Hide" : "Show"} details
        </Button>
        {metaLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
      </div>

      {showMeta && (
        <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <Row label="Family" value={metadata?.family ?? font.realFamily ?? "—"} />
          <Row label="Subfamily" value={metadata?.subfamily ?? "—"} />
          <Row label="Designer" value={metadata?.designer ?? "—"} />
          <Row label="Copyright" value={metadata?.copyright ?? "—"} />
          <Row label="Weight class" value={metadata?.weight != null ? String(metadata.weight) : "—"} />
          <Row label="Style" value={metadata?.style ?? "—"} />
          <Row label="Variable" value={isVariable ? "yes" : "no"} />
          {isVariable && axisList.length > 0 && (
            <Row
              label="Axes"
              value={axisList.map((a) => `${a.tag} (${a.min}–${a.max})`).join(", ")}
            />
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 font-medium text-foreground/70">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
