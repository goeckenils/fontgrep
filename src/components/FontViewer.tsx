"use client";

import { useState, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ArrowLeft } from "lucide-react";

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
}

export function FontViewer({ font, onClose }: { font: ViewerFont; onClose: () => void }) {
  const [previewText, setPreviewText] = useState(
    "The quick brown fox jumps over the lazy dog"
  );
  const [size, setSize] = useState(64);
  const [weight, setWeight] = useState(400);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(font.id != null);
  const [fontUrl, setFontUrl] = useState<string | null>(font.publicPath ?? null);
  const familyName = `fg-viewer-${useId().replace(/[^a-z0-9]/gi, "")}`;

  // Register a @font-face rule pointing at the served binary.
  useEffect(() => {
    if (!fontUrl) return;
    const sheet = document.styleSheets[0];
    const rule = `@font-face { font-family: '${familyName}'; src: url('${fontUrl}') format('${
      font.format === "woff2" ? "woff2" : font.format === "woff" ? "woff" : "truetype"
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
  }, [fontUrl, familyName, font.format]);

  async function handleDownload() {
    if (!font.repository || !font.path) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/fonts/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository: font.repository,
          path: font.path,
          fileName: font.fileName,
          format: font.format,
          license: font.license,
        }),
      });
      if (!res.ok) throw new Error("download failed");
      const json = await res.json();
      setFontUrl(json.publicPath ?? fontUrl);
      setDownloaded(true);
    } catch {
      // ignore — preview still shows from remote
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onClose} data-icon="inline-start">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <span className="font-medium">{font.family}</span>
          <Badge variant="outline" className="uppercase">
            {font.format}
          </Badge>
          {font.license && <Badge variant="secondary">{font.license}</Badge>}
        </div>
        <Button
          size="sm"
          variant={downloaded ? "secondary" : "default"}
          onClick={handleDownload}
          disabled={downloading || downloaded}
          data-icon="inline-start"
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {downloaded ? "Saved" : "Save font"}
        </Button>
      </div>

      <Input
        value={previewText}
        onChange={(e) => setPreviewText(e.target.value)}
        placeholder="Type something to preview…"
        aria-label="Preview text"
      />

      <div
        className="min-h-24 w-full break-words leading-tight"
        style={{
          fontFamily: `'${familyName}', sans-serif`,
          fontSize: `${size}px`,
          fontWeight: weight,
        }}
      >
        {previewText || " "}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Size</span>
          <span>{size}px</span>
        </div>
        <Slider
          min={16}
          max={160}
          step={1}
          value={[size]}
          onValueChange={(v) => setSize((v as number[])[0])}
        />
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
      </div>
    </div>
  );
}
