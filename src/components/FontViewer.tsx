"use client";

import {
  useState,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { dur, ease, gsap, motionOK, useGSAP } from "@/lib/gsap";
import { FontPreviewText } from "@/components/FontPreviewText";
import { useViewerIntro } from "@/hooks/useViewerTimeline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider, resolveSliderValue } from "@/components/ui/slider";
import { FontAxisSlider } from "@/components/FontAxisSlider";
import { StyleSelector } from "@/components/StyleSelector";
import type { FontStyle } from "@/lib/fontFamily";
import type { FontMetadata, VariableAxis } from "@/lib/fontMeta";
import { buildFontFaceCss } from "@/lib/cssExport";
import { resolveViewerFontUrl } from "@/lib/fontPreview";
import {
  BENTO_CARD,
  CONTROL_INPUT,
  CONTROL_PANEL,
  FIELD_LABEL,
  FIELD_VALUE,
  SECTION_LABEL,
  metaPill,
} from "@/lib/viewerTheme";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Download,
  Copy,
  GitCompare,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { LicenseBadge } from "@/components/LicenseBadge";

export interface ViewerFont {
  id?: number;
  family: string;
  format: string;
  fileName: string;
  repository?: string;
  branch?: string;
  path?: string;
  license?: string;
  publicPath?: string;
  rawUrl?: string;
  styles?: FontStyle[];
  realFamily?: string | null;
  weight?: number | null;
  style?: string | null;
  isVariable?: boolean;
  designer?: string | null;
}

function styleLabelFrom(
  weight: number | null | undefined,
  style: string | null | undefined,
): string {
  const w = weight ?? 400;
  const s =
    style === "italic" ? "Italic" : style === "oblique" ? "Oblique" : "";
  return `${w} ${s}`.trim() || "Regular";
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
    syncedText ?? "The quick brown fox jumps over the lazy dog",
  );
  const [size, setSize] = useState(syncedSize ?? 64);
  const [weight, setWeight] = useState(font.weight ?? 400);
  const [activeStyle, setActiveStyle] = useState<FontStyle | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(font.id != null);
  const [fontUrl, setFontUrl] = useState<string | null>(
    resolveViewerFontUrl(font),
  );
  const [metadata, setMetadata] = useState<FontMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [axes, setAxes] = useState<Record<string, number>>({});
  const [showMeta, setShowMeta] = useState(false);
  const [fontLoadState, setFontLoadState] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const [previewBranch, setPreviewBranch] = useState(font.branch);
  const [previewPublicPath, setPreviewPublicPath] = useState(font.publicPath);
  const failedStylePaths = useRef(new Set<string>());

  const activePath = activeStyle?.path ?? font.path;

  const fontKey = `${font.id ?? font.repository ?? "raw"}::${activePath ?? font.fileName}`;
  const viewerRef = useViewerIntro(fontKey, !embedded);

  useEffect(() => {
    setWeight(font.weight ?? 400);
    setActiveStyle(null);
    setFontUrl(resolveViewerFontUrl(font));
    setMetadata(null);
    setAxes({});
    setShowMeta(false);
    setFontLoadState("loading");
    setPreviewBranch(font.branch);
    setPreviewPublicPath(font.publicPath);
    failedStylePaths.current = new Set();
  }, [
    font.id,
    font.family,
    font.repository,
    font.branch,
    font.path,
    font.format,
    font.publicPath,
    font.rawUrl,
    font.weight,
  ]);

  useEffect(() => {
    if (metadata) return;
    let cancelled = false;
    setMetaLoading(true);
    (async () => {
      try {
        const body: Record<string, unknown> = {};
        if (font.id != null) body.id = font.id;
        else if (font.repository && font.path) {
          body.repo = font.repository;
          body.path = font.path;
          if (font.branch) body.branch = font.branch;
        } else if (font.rawUrl) body.rawUrl = font.rawUrl;
        const res = await fetch("/api/fonts/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const json = (await res.json()) as FontMetadata & {
          resolvedBranch?: string | null;
          publicPath?: string | null;
        };
        if (cancelled) return;
        setMetadata(json);
        if (json.resolvedBranch) setPreviewBranch(json.resolvedBranch);
        if (json.publicPath) {
          setPreviewPublicPath(json.publicPath);
          setFontUrl(json.publicPath);
        } else if (font.repository && font.path) {
          const resolved = resolveViewerFontUrl({
            repository: font.repository,
            branch: json.resolvedBranch ?? font.branch,
            path: activeStyle?.path ?? font.path,
            format: (activeStyle ?? font).format ?? font.format,
          });
          if (resolved) setFontUrl(resolved);
        }
        if (json.weight != null) setWeight(json.weight);
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
  }, [font.id, font.rawUrl, font.repository, font.path, font.branch, metadata]);

  useEffect(() => {
    if (syncedText !== undefined) setPreviewText(syncedText);
  }, [syncedText]);
  useEffect(() => {
    if (syncedSize !== undefined) setSize(syncedSize);
  }, [syncedSize]);

  useEffect(() => {
    if (embedded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedded, onClose]);

  function handleStyleSelect(style: FontStyle) {
    setFontLoadState("loading");
    setActiveStyle(style);
    setWeight(style.weight);
    setFontUrl(
      resolveViewerFontUrl({
        publicPath: font.publicPath && !style.variable ? font.publicPath : undefined,
        repository: font.repository,
        branch: style.branch ?? font.branch,
        path: style.path,
        format: style.format,
      }),
    );
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
      if (json.publicPath) {
        setPreviewPublicPath(json.publicPath);
        setFontUrl(json.publicPath);
      }
      setDownloaded(true);
      if (json.metadata) setMetadata((m) => ({ ...m, ...json.metadata }));
    } catch {
      /* preview still shows from remote */
    } finally {
      setDownloading(false);
    }
  }

  function copyCss() {
    const isVar = metadata?.isVariable || font.isVariable;
    const src = fontUrl ?? font.publicPath ?? font.rawUrl ?? "";
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
      () => toast.error("Could not copy CSS"),
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
  const resolvedStyle =
    metadata?.style ?? activeStyle?.style ?? font.style ?? null;
  const resolvedWeight =
    metadata?.weight ?? activeStyle?.weight ?? font.weight ?? weight;
  const styleLabel = styleLabelFrom(resolvedWeight, resolvedStyle);
  const faceStyle =
    resolvedStyle === "italic"
      ? "italic"
      : resolvedStyle === "oblique"
        ? "oblique"
        : "normal";

  const previewWeight = isVariable ? (axes.wght ?? weight) : weight;
  const fontReady = fontLoadState === "loaded";
  const previewFormat = (activeStyle ?? font).format ?? font.format;

  useEffect(() => {
    if (fontLoadState !== "error" || !font.styles?.length || !activePath) return;
    if (failedStylePaths.current.has(activePath)) return;
    failedStylePaths.current.add(activePath);
    const idx = font.styles.findIndex((s) => s.path === activePath);
    const next = font.styles[idx + 1];
    if (!next) return;
    setFontLoadState("loading");
    setActiveStyle(next);
    setWeight(next.weight);
    setFontUrl(
      resolveViewerFontUrl({
        publicPath: font.publicPath && !next.variable ? font.publicPath : undefined,
        repository: font.repository,
        branch: next.branch ?? font.branch,
        path: next.path,
        format: next.format,
      }),
    );
  }, [fontLoadState, activePath, font.styles, font.branch, font.publicPath, font.repository]);

  const previewVariationStyle = isVariable
    ? Object.entries(variationSettings)
        .map(([t, v]) => `'${t}' ${v}`)
        .join(", ")
    : undefined;

  const content = (
    <div className={cn("flex flex-col gap-4", embedded && "gap-3")}>
      {!embedded ? (
        <div
          data-viewer-part="toolbar"
          className="flex flex-wrap items-center gap-2"
        >
          {!hideCompare ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("fontgrep:compare", { detail: font }),
                );
              }}
              data-icon="inline-start"
            >
              <GitCompare /> Compare
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={copyCss}
            data-icon="inline-start"
          >
            <Copy /> Copy CSS
          </Button>
          <Button
            size="sm"
            variant={downloaded ? "secondary" : "default"}
            onClick={handleDownload}
            disabled={downloading || downloaded}
            data-icon="inline-start"
          >
            {downloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            {downloaded ? "Saved" : "Save font"}
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4",
          embedded
            ? "grid-cols-1"
            : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(220px,300px)] lg:items-stretch",
        )}
      >
        <div
          data-viewer-part="hero"
          className={cn(
            BENTO_CARD,
            "flex min-h-0 flex-col p-4 md:p-6",
            embedded && "p-3 md:p-4",
          )}
        >
          <div className="flex flex-wrap items-end gap-7 pb-1.5">
            <MetaField label="Font" value={displayFamily} />
            <MetaField label="Style" value={styleLabel} />
            <MetaField label="Format" value={font.format} />
            {metadata?.subfamily ? (
              <MetaField label="Subfamily" value={metadata.subfamily} />
            ) : null}
            <MetaFieldSlot label="License">
              <LicenseBadge license={font.license} />
            </MetaFieldSlot>
            {isVariable ? (
              <MetaFieldSlot label="Type">
                <span className={metaPill()}>Variable</span>
              </MetaFieldSlot>
            ) : null}
            {font.repository ? (
              <MetaFieldSlot label="Repo">
                <span className={cn(metaPill(), "max-w-[12rem] truncate")}>
                  {font.repository}
                </span>
              </MetaFieldSlot>
            ) : null}
          </div>

          {font.styles && font.styles.length > 1 ? (
            <div className="mt-4">
              <StyleSelector
                styles={font.styles}
                activePath={activeStyle?.path ?? font.path ?? ""}
                onSelect={handleStyleSelect}
              />
            </div>
          ) : null}

          <div
            data-bento-preview
            data-viewer-part="preview"
            className={cn(
              "mt-auto flex min-h-[10rem] flex-1 flex-col justify-center break-words pt-6 leading-[0.92]",
              embedded ? "min-h-[7rem] pt-4" : "min-h-[12rem] lg:min-h-[16rem]",
            )}
            aria-busy={!fontReady}
          >
            <FontPreviewText
              family={displayFamily}
              repository={font.repository}
              branch={previewBranch ?? activeStyle?.branch ?? font.branch}
              path={activePath}
              format={previewFormat}
              publicPath={previewPublicPath}
              sample={previewText}
              lazy={false}
              weight={previewWeight}
              fontStyle={faceStyle}
              onLoadStateChange={setFontLoadState}
              className="block w-full break-words text-foreground"
              style={{
                fontSize: `${size}px`,
                lineHeight: 0.92,
                fontVariationSettings: previewVariationStyle,
              }}
            />
            {fontLoadState === "error" && fontUrl && !metaLoading ? (
              <span className="mt-3 block font-sans text-xs not-italic text-muted-foreground/80">
                Font file not found on GitHub — pick another style or family
              </span>
            ) : null}
          </div>
        </div>

        <div
          data-viewer-part="controls"
          className="flex flex-col gap-3 lg:min-h-full"
        >
          <ControlPanel data-viewer-part="input" label="Preview text">
            <Input
              className={CONTROL_INPUT}
              value={previewText}
              onChange={(e) => {
                setPreviewText(e.target.value);
                onTextChange?.(e.target.value);
              }}
              placeholder="Type something to preview…"
              aria-label="Preview text"
            />
          </ControlPanel>

          <ControlPanel data-viewer-part="controls-size" label="Scale">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
              <span>Size</span>
              <span>{size}px</span>
            </div>
            <Slider
              min={16}
              max={160}
              step={1}
              value={[size]}
              onValueChange={(v) => {
                const next = resolveSliderValue(v);
                setSize(next);
                onSizeChange?.(next);
              }}
            />
          </ControlPanel>

          {isVariable && axisList.length > 0 ? (
            <ControlPanel data-viewer-part="controls-weight" label="Axes">
              <div className="flex flex-col gap-3">
                {axisList.map((axis) => (
                  <FontAxisSlider
                    key={axis.tag}
                    axis={axis}
                    value={axes[axis.tag] ?? axis.default}
                    onChange={(val) =>
                      setAxes((prev) => ({ ...prev, [axis.tag]: val }))
                    }
                  />
                ))}
              </div>
            </ControlPanel>
          ) : (
            <ControlPanel data-viewer-part="controls-weight" label="Weight">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
                <span>Weight class</span>
                <span>{weight}</span>
              </div>
              <Slider
                min={100}
                max={900}
                step={100}
                value={[weight]}
                onValueChange={(v) => setWeight(resolveSliderValue(v))}
              />
            </ControlPanel>
          )}

          <div data-viewer-part="extra" className="mt-auto flex flex-col gap-2">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowMeta((s) => !s)}
              data-icon="inline-start"
              className="w-fit"
            >
              <Info /> {showMeta ? "Hide" : "Show"} details
            </Button>
            {metaLoading ? (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            ) : null}

            <ViewerDetailsReveal open={showMeta}>
              <ControlPanel label="Details">
                <div className="flex flex-col gap-2 text-sm text-[#aaa]">
                  <MetaRow label="Designer" value={metadata?.designer ?? "—"} />
                  <MetaRow label="Copyright" value={metadata?.copyright ?? "—"} />
                  <MetaRow
                    label="PostScript"
                    value={metadata?.postscriptName ?? "—"}
                  />
                  <MetaRow label="Variable" value={isVariable ? "yes" : "no"} />
                  {isVariable && axisList.length > 0 ? (
                    <MetaRow
                      label="Axes"
                      value={axisList
                        .map((a) => `${a.tag} (${a.min}–${a.max})`)
                        .join(", ")}
                    />
                  ) : null}
                </div>
              </ControlPanel>
            </ViewerDetailsReveal>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div ref={viewerRef as RefObject<HTMLDivElement>}>{content}</div>
    );
  }

  return (
    <article ref={viewerRef} className="w-full max-w-6xl">
      {content}
    </article>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span data-card-line className={FIELD_LABEL}>
        {label}
      </span>
      <span
        data-card-line
        className={cn(FIELD_VALUE, "flex min-h-[1.125rem] items-center truncate")}
      >
        {value}
      </span>
    </div>
  );
}

function MetaFieldSlot({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span data-card-line className={FIELD_LABEL}>
        {label}
      </span>
      <div data-card-line className="flex min-h-[1.125rem] items-center">
        {children}
      </div>
    </div>
  );
}

function ControlPanel({
  label,
  children,
  className,
  ...rest
}: {
  label: string;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(CONTROL_PANEL, "p-4", className)} {...rest}>
      <p className={cn(SECTION_LABEL, "mb-2.5")}>{label}</p>
      {children}
    </div>
  );
}

function ViewerDetailsReveal({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const skip = useRef(true);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const applyInstant = (expanded: boolean) => {
        gsap.set(wrap, {
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
          marginTop: expanded ? 8 : 0,
          overflow: expanded ? "visible" : "hidden",
        });
      };

      gsap.killTweensOf(wrap);
      const rows = innerRef.current?.querySelectorAll<HTMLElement>(
        "[data-detail-row]",
      );
      if (rows?.length) gsap.killTweensOf(rows);

      if (!motionOK()) {
        applyInstant(open);
        return;
      }

      if (skip.current) {
        skip.current = false;
        applyInstant(open);
        return;
      }

      if (open) {
        wrap.style.overflow = "hidden";
        gsap.set(wrap, { height: "auto", opacity: 1, marginTop: 8 });
        const targetHeight = wrap.offsetHeight;
        gsap.set(wrap, { height: 0, opacity: 0, marginTop: 0 });

        gsap.to(wrap, {
          height: targetHeight,
          opacity: 1,
          marginTop: 8,
          duration: dur.sm,
          ease: ease.out,
          onComplete: () => {
            gsap.set(wrap, { height: "auto", overflow: "visible" });
          },
        });

        if (rows?.length) {
          gsap.fromTo(
            rows,
            { opacity: 0, y: 6 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.04,
              duration: dur.xs,
              ease: ease.out,
              delay: 0.06,
            },
          );
        }
      } else {
        wrap.style.overflow = "hidden";
        const currentHeight = wrap.offsetHeight;
        gsap.fromTo(
          wrap,
          { height: currentHeight, opacity: 1, marginTop: 8 },
          {
            height: 0,
            opacity: 0,
            marginTop: 0,
            duration: dur.sm,
            ease: ease.inOut,
          },
        );
      }
    },
    { scope: wrapRef, dependencies: [open] },
  );

  return (
    <div
      ref={wrapRef}
      className={cn(!open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div data-detail-row className="flex items-start justify-between gap-4">
      <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
        {label}
      </span>
      <span className="text-right text-[#ccc]">{value}</span>
    </div>
  );
}