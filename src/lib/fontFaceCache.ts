type CacheEntry = { face: FontFace; refs: number };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<FontFace>>();

export async function retainFontFace(
  key: string,
  loader: () => Promise<FontFace>,
): Promise<FontFace> {
  const hit = cache.get(key);
  if (hit) {
    hit.refs += 1;
    return hit.face;
  }

  const pending = inflight.get(key);
  if (pending) {
    const face = await pending;
    const entry = cache.get(key);
    if (entry) entry.refs += 1;
    return face;
  }

  const promise = (async () => {
    try {
      const face = await loader();
      const loaded = face.status === "loaded" ? face : await face.load();
      let registered = false;
      document.fonts.forEach((f) => {
        if (f === loaded) registered = true;
      });
      if (!registered) document.fonts.add(loaded);
      cache.set(key, { face: loaded, refs: 1 });
      return loaded;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function releaseFontFace(key: string): void {
  const entry = cache.get(key);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    document.fonts.delete(entry.face);
    cache.delete(key);
  }
}