import type { IPstackResponse } from "./ipstack";

const IPSTACK_BASE = "http://api.ipstack.com";

export type LookupOutcome = {
  target: string;
  elapsedMs: number;
  status: number;
  body: IPstackResponse;
  maskedUrl: string;
  cached: boolean;
  /** Human-readable, non-fatal explanation when the lookup didn't work out. */
  notice: string | null;
};

/**
 * Which optional ipstack modules this access key is actually entitled to.
 * Starts optimistic and downgrades permanently for the process the first time
 * ipstack answers 105 (`function_access_restricted`), so a restricted plan
 * costs exactly one wasted call rather than one per lookup.
 */
const modules = { hostname: true, security: true };

export const moduleStatus = () => ({ ...modules });

/**
 * Geolocation is stable per IP and the free tier's burst limit is tight, so
 * results are memoised per target. Several browsers behind one NAT — the usual
 * case when someone opens this in two windows — then cost a single call.
 */
const CACHE_TTL_MS = 15 * 60_000;
const cache = new Map<string, { at: number; body: IPstackResponse }>();

export const maskKey = (url: string) =>
  url.replace(/access_key=[^&]+/i, "access_key=••••••••");

function buildUrl(target: string, key: string) {
  const params = new URLSearchParams({ access_key: key });
  if (modules.hostname) params.set("hostname", "1");
  if (modules.security) params.set("security", "1");
  const path = target === "check" ? "check" : encodeURIComponent(target);
  return `${IPSTACK_BASE}/${path}?${params.toString()}`;
}

async function call(target: string, key: string) {
  const url = buildUrl(target, key);
  const started = Date.now();
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json()) as IPstackResponse;
  return { url, status: res.status, elapsedMs: Date.now() - started, body };
}

/**
 * Server-side ipstack fetcher used by the presence route. Never throws — a
 * failure comes back as a `notice` so one bad lookup can't blank the globe for
 * everyone already standing on it.
 */
export async function lookupIp(ip: string | null): Promise<LookupOutcome> {
  const key = process.env.IPSTACK_ACCESS_KEY;
  const target = ip && isValidIp(ip) && !isPrivate(ip) ? ip : "check";

  const base = {
    target,
    elapsedMs: 0,
    status: 0,
    body: {} as IPstackResponse,
    maskedUrl: "",
    cached: false,
    notice: null as string | null,
  };

  if (!key) {
    return {
      ...base,
      notice: "IPSTACK_ACCESS_KEY is not set — add it to .env.local and restart.",
    };
  }

  const hit = cache.get(target);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return {
      ...base,
      body: hit.body,
      status: 200,
      cached: true,
      maskedUrl: maskKey(buildUrl(target, key)),
    };
  }

  try {
    let r = await call(target, key);

    // 105 = this plan can't use a module we asked for. Shed them one at a time.
    if (r.body.error?.code === 105 && modules.security) {
      modules.security = false;
      r = await call(target, key);
    }
    if (r.body.error?.code === 105 && modules.hostname) {
      modules.hostname = false;
      r = await call(target, key);
    }

    const outcome: LookupOutcome = {
      target,
      elapsedMs: r.elapsedMs,
      status: r.status,
      body: r.body,
      maskedUrl: maskKey(r.url),
      cached: false,
      notice: null,
    };

    if (r.body.error) {
      outcome.notice =
        r.body.error.code === 106
          ? "ipstack rate limit reached — this retries on the next ping."
          : `ipstack: ${r.body.error.info ?? r.body.error.type}`;
      return outcome;
    }
    if (r.body.latitude == null || r.body.longitude == null) {
      outcome.notice = "ipstack returned no coordinates for this address.";
      return outcome;
    }

    cache.set(target, { at: Date.now(), body: r.body });
    return outcome;
  } catch (e) {
    return {
      ...base,
      maskedUrl: maskKey(buildUrl(target, key)),
      notice: `Couldn't reach ipstack: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export function isPrivate(ip: string) {
  return (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

export function isValidIp(ip: string) {
  return (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) ||
    (ip.includes(":") && /^[0-9a-fA-F:]+$/.test(ip))
  );
}
