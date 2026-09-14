/**
 * Tile fetching with three layers of caching in front of the network:
 *
 *  1. An in-flight map, so a tile requested twice in the same frame — which
 *     happens constantly as the view and its parent zoom overlap — is fetched
 *     once.
 *  2. The Cache Storage API, so tiles survive a reload and a cold start costs
 *     nothing on a route somebody has already flown.
 *  3. The caller's own texture cache, keyed by URL.
 *
 * Decoding goes through `createImageBitmap`, which happens off the main thread;
 * `TextureLoader`'s `<img>` path decodes on it and shows up as jank at exactly
 * the moment forty tiles land at once.
 */

const CACHE_NAME = "collabfab-tiles-v1";

const inFlight = new Map<string, Promise<ImageBitmap | null>>();

/** Cache Storage needs a secure context; plain http:// silently has no `caches`. */
const cacheStorageAvailable = () =>
  typeof caches !== "undefined" && typeof window !== "undefined" && window.isSecureContext;

async function fetchBitmap(url: string): Promise<ImageBitmap | null> {
  let response: Response | undefined;

  if (cacheStorageAvailable()) {
    try {
      const cache = await caches.open(CACHE_NAME);
      response = await cache.match(url);
      if (!response) {
        response = await fetch(url, { mode: "cors" });
        // Store a clone; the original is consumed below.
        if (response.ok) void cache.put(url, response.clone()).catch(() => {});
      }
    } catch {
      response = undefined;
    }
  }

  if (!response) {
    try {
      response = await fetch(url, { mode: "cors" });
    } catch {
      return null;
    }
  }

  if (!response.ok) return null;
  try {
    // Flip at decode time rather than at upload time: WebGL's UNPACK_FLIP_Y
    // is unreliable for ImageBitmap sources, and doing it here keeps the work
    // off the main thread. Textures built from these must set flipY = false.
    return await createImageBitmap(await response.blob(), {
      imageOrientation: "flipY",
    });
  } catch {
    return null;
  }
}

/** Resolves to null for a tile that genuinely isn't there — oceans at deep zoom. */
export function loadTileBitmap(url: string): Promise<ImageBitmap | null> {
  const existing = inFlight.get(url);
  if (existing) return existing;

  const pending = fetchBitmap(url)
    .catch(() => null)
    .finally(() => inFlight.delete(url));

  inFlight.set(url, pending);
  return pending;
}

/** Drop the persistent tile cache — used when the basemap source changes. */
export async function clearTileCache() {
  if (!cacheStorageAvailable()) return;
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    /* nothing to clean up */
  }
}
