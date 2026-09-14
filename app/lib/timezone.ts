/**
 * ipstack's `time_zone` module isn't included on every plan, but the Handshake
 * score leans hardest on when two people are both awake. When the field is
 * missing we fall back to solar time: every 15° of longitude is one hour off
 * UTC. That lands within an hour of the real offset for most of the populated
 * world, and every surface that uses it labels the value as estimated.
 */
export type TzSource = "ipstack" | "estimated" | "unknown";

export function resolveOffset(
  ipstackOffset: number | null | undefined,
  longitude: number | null | undefined
): { offset: number | null; source: TzSource } {
  if (ipstackOffset != null) return { offset: ipstackOffset, source: "ipstack" };
  if (longitude == null) return { offset: null, source: "unknown" };

  const hours = Math.max(-12, Math.min(14, Math.round(longitude / 15)));
  return { offset: hours * 3600, source: "estimated" };
}

/**
 * A readable ISP name when the `connection` module is absent. Reverse-DNS
 * hostnames almost always carry the operator's registrable domain — e.g.
 * `dyn-at-mobile-154-160-19-7.mtn.com.gh` → `mtn.com.gh`.
 */
export function ispFromHostname(hostname: string | null | undefined): string | null {
  if (!hostname || !hostname.includes(".")) return null;
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  if (parts.length < 2) return null;

  // Keep three labels for public suffixes like co.uk / com.gh, two otherwise.
  const secondLevel = new Set([
    "co", "com", "net", "org", "ac", "gov", "edu", "or", "ne", "go",
  ]);
  const take = parts.length >= 3 && secondLevel.has(parts[parts.length - 2]) ? 3 : 2;
  return parts.slice(-take).join(".");
}
