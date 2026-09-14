export const R_KM = 6371;

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function formatKm(km: number): string {
  if (km < 1) return "<1 km";
  if (km < 1000) return `${Math.round(km)} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

/** Local wall-clock hour for a UTC offset given in seconds (ipstack's format). */
export function localHour(gmtOffsetSec: number, now = new Date()): number {
  return (
    (((now.getUTCHours() + now.getUTCMinutes() / 60 + gmtOffsetSec / 3600) % 24) +
      24) %
    24
  );
}

export function formatLocalTime(gmtOffsetSec: number, now = new Date()): string {
  const h = localHour(gmtOffsetSec, now);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function formatOffset(gmtOffsetSec: number): string {
  const sign = gmtOffsetSec < 0 ? "-" : "+";
  const abs = Math.abs(gmtOffsetSec) / 3600;
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Awake/working window used across the app: 09:00–18:00 local. */
export const DAY_START = 9;
export const DAY_END = 18;

/** The 09–18 local window expressed as UTC hours, wrapped into [0,24). */
export function workWindowUtc(gmtOffsetSec: number): [number, number] {
  const off = gmtOffsetSec / 3600;
  const wrap = (h: number) => ((h % 24) + 24) % 24;
  return [wrap(DAY_START - off), wrap(DAY_END - off)];
}

/** Hours in [0,24) covered by a possibly-wrapping window. */
function hoursCovered([s, e]: [number, number]): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < 24; i++) {
    const h = (Math.floor(s) + i) % 24;
    const span = e >= s ? e - s : 24 - s + e;
    if (i < span) out.add(h);
  }
  return out;
}

/**
 * Overlapping UTC hours between two people's working days. Returns the count
 * plus a contiguous window to display, e.g. "14:00–17:00 UTC".
 */
export function overlapUtc(
  aOffsetSec: number,
  bOffsetSec: number
): { hours: number; window: [number, number] | null } {
  const a = hoursCovered(workWindowUtc(aOffsetSec));
  const b = hoursCovered(workWindowUtc(bOffsetSec));
  const shared = [...a].filter((h) => b.has(h)).sort((x, y) => x - y);
  if (shared.length === 0) return { hours: 0, window: null };

  // Find the longest run of consecutive hours (allowing midnight wrap).
  let bestStart = shared[0];
  let bestLen = 1;
  let runStart = shared[0];
  let runLen = 1;
  for (let i = 1; i < shared.length; i++) {
    if (shared[i] === shared[i - 1] + 1) runLen++;
    else {
      runStart = shared[i];
      runLen = 1;
    }
    if (runLen > bestLen) {
      bestLen = runLen;
      bestStart = runStart;
    }
  }
  return { hours: shared.length, window: [bestStart, (bestStart + bestLen) % 24] };
}

export const fmtHour = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:00`;

export function relativeTime(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m} min ${rem} sec`;
  return `${Math.floor(m / 60)} hr ${m % 60} min`;
}
