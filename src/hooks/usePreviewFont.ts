"use client";

import { useEffect, useState } from "react";
import { isFontBytes, isFontErrorBody } from "@/lib/fontBytes";
import { releaseFontFace, retainFontFace } from "@/lib/fontFaceCache";

export type PreviewFontState = "idle" | "loading" | "loaded" | "error";

function proxyFallbackUrl(previewUrl: string): string | null {
  try {
    const u = new URL(previewUrl, "http://local");
    if (!u.pathname.endsWith("/api/fonts/preview")) return null;
    const repo = u.searchParams.get("repository");
    const path = u.searchParams.get("path");
    if (!repo || !path) return null;
    const params = new URLSearchParams({ repo, path });
    const branch = u.searchParams.get("branch");
    if (branch) params.set("branch", branch);
    const format = u.searchParams.get("format");
    if (format) params.set("format", format);
    return `/api/fonts/proxy?${params.toString()}`;
  } catch {
    return null;
  }
}

async function loadFontBuffer(previewUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(previewUrl);
  if (!res.ok) throw new Error(`preview ${res.status}`);

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json") || ct.includes("text/html")) {
    throw new Error("preview not a font");
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength < 80 || isFontErrorBody(buffer) || !isFontBytes(buffer)) {
    throw new Error("invalid font bytes");
  }
  return buffer;
}

async function fetchFontBytes(previewUrl: string): Promise<ArrayBuffer> {
  try {
    return await loadFontBuffer(previewUrl);
  } catch (primaryError) {
    const fallback = proxyFallbackUrl(previewUrl);
    if (!fallback) throw primaryError;
    return loadFontBuffer(fallback);
  }
}

/** Fetch font binary and register via FontFace (shared cache, ArrayBuffer source). */
export function usePreviewFont(
  previewUrl: string | null,
  fontFamily: string,
  _weight: number | string = 400,
  _style: string = "normal",
  enabled = true,
): PreviewFontState {
  const initial = !enabled ? "idle" : previewUrl ? "loading" : "error";
  const [state, setState] = useState<PreviewFontState>(initial);

  useEffect(() => {
    if (!enabled || !previewUrl) {
      setState(!enabled ? "idle" : "error");
      return;
    }

    setState("loading");
    let alive = true;
    const cacheKey = `${previewUrl}::${fontFamily}`;

    void (async () => {
      try {
        await retainFontFace(cacheKey, async () => {
          const bytes = await fetchFontBytes(previewUrl);
          return new FontFace(fontFamily, bytes);
        });
        try {
          await document.fonts.load(`${_style} ${_weight} 16px '${fontFamily}'`);
        } catch {
          /* paint may still land next frame */
        }
        if (alive) setState("loaded");
      } catch {
        if (alive) setState("error");
      }
    })();

    return () => {
      alive = false;
      releaseFontFace(cacheKey);
    };
  }, [previewUrl, fontFamily, enabled]);

  return state;
}