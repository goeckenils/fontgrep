import crypto from "node:crypto";
import { getDb } from "@/lib/db";

const CACHE_TTL_MS = (Number(process.env.CACHE_TTL_HOURS) || 1) * 60 * 60 * 1000;

export function cacheKey(parts: (string | number)[]): string {
  return crypto
    .createHash("sha256")
    .update(parts.join("|"))
    .digest("hex");
}

export function getCached(key: string): unknown | null {
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT response_json, expires_at FROM api_cache WHERE cache_key = ?")
      .get(key) as { response_json: string; expires_at: string } | undefined;
    if (!row) return null;
    const expires = new Date(row.expires_at).getTime();
    if (Date.now() > expires) {
      db.prepare("DELETE FROM api_cache WHERE cache_key = ?").run(key);
      return null;
    }
    return JSON.parse(row.response_json);
  } catch {
    return null;
  }
}

export function setCached(key: string, value: unknown): void {
  try {
    const db = getDb();
    const expires = new Date(Date.now() + CACHE_TTL_MS).toISOString();
    db.prepare(
      `INSERT INTO api_cache (cache_key, response_json, expires_at) VALUES (?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET response_json = excluded.response_json, expires_at = excluded.expires_at`
    ).run(key, JSON.stringify(value), expires);
  } catch {
    /* caching is best-effort */
  }
}

export interface RateLimitInfo {
  remaining: number | null;
  reset: number | null; // unix seconds
  limit: number | null;
}

export function parseRateLimit(headers: Headers): RateLimitInfo {
  const num = (h: string | null) => (h == null ? null : Number(h));
  return {
    remaining: num(headers.get("x-ratelimit-remaining")),
    reset: num(headers.get("x-ratelimit-reset")),
    limit: num(headers.get("x-ratelimit-limit")),
  };
}

/** Returns true when the rate limit is nearly exhausted and we should back off. */
export function isRateLimitCritical(info: RateLimitInfo): boolean {
  return info.remaining != null && info.remaining < 5;
}
