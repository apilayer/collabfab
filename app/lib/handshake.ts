import type { PublicVisitor } from "@/interfaces/visitor.interface";
import { fmtHour, formatKm, formatOffset, haversineKm, overlapUtc } from "./geo";

export type ScoreLine = {
  label: string;
  points: number;
  max: number;
  detail: string;
};

export type Handshake = {
  score: number; // 0-100
  band: "cold" | "cool" | "warm" | "hot";
  headline: string;
  lines: ScoreLine[];
  overlapWindow: string | null;
  distanceKm: number | null;
  cautions: string[];
};

const WEIGHTS = { overlap: 35, language: 20, interests: 20, proximity: 15, network: 10 };

const band = (n: number): Handshake["band"] =>
  n >= 75 ? "hot" : n >= 50 ? "warm" : n >= 28 ? "cool" : "cold";

const langCodes = (v: PublicVisitor) =>
  new Set((v.languages ?? []).map((l) => l.code).filter(Boolean) as string[]);

const tagSet = (v: PublicVisitor) =>
  new Set((v.tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean));

/**
 * Handshake Score — how worthwhile it is for two people on the globe to
 * actually talk, derived entirely from live ipstack geolocation plus whatever
 * the two of them chose to share.
 *
 * Deliberately *explainable*: every point is attributed to a named line with
 * the underlying evidence, so the number is auditable rather than a black box.
 */
export function handshake(me: PublicVisitor, them: PublicVisitor): Handshake {
  const lines: ScoreLine[] = [];
  const cautions: string[] = [];

  // 1 — Overlapping working hours. The single most actionable signal: two
  // people can only talk when they're both awake.
  let overlapWindow: string | null = null;
  if (me.gmtOffset != null && them.gmtOffset != null) {
    const { hours, window } = overlapUtc(me.gmtOffset, them.gmtOffset);
    const pts = Math.round((Math.min(hours, 9) / 9) * WEIGHTS.overlap);
    if (window) overlapWindow = `${fmtHour(window[0])}–${fmtHour(window[1])} UTC`;
    const estimated = me.tzSource === "estimated" || them.tzSource === "estimated";
    const zones = `${me.timezoneId ?? formatOffset(me.gmtOffset)} ↔ ${
      them.timezoneId ?? formatOffset(them.gmtOffset)
    }`;
    lines.push({
      label: "Working-hour overlap",
      points: pts,
      max: WEIGHTS.overlap,
      detail:
        (hours ? `${hours}h shared (${overlapWindow}) · ${zones}` : `No shared daytime · ${zones}`) +
        (estimated ? " · offset estimated from longitude" : ""),
    });
  } else {
    lines.push({
      label: "Working-hour overlap",
      points: 0,
      max: WEIGHTS.overlap,
      detail: "Timezone unavailable for one side",
    });
  }

  // 2 — A shared spoken language, straight from ipstack's country language list.
  const mine = langCodes(me);
  const theirs = langCodes(them);
  const sharedLangs = [...mine].filter((c) => theirs.has(c));
  const langNames = (them.languages ?? [])
    .filter((l) => l.code && sharedLangs.includes(l.code))
    .map((l) => l.name)
    .filter(Boolean);
  let langPts = 0;
  if (sharedLangs.length > 0) langPts = WEIGHTS.language;
  else if (me.continentCode && me.continentCode === them.continentCode)
    langPts = Math.round(WEIGHTS.language * 0.3);
  lines.push({
    label: "Common language",
    points: langPts,
    max: WEIGHTS.language,
    detail: sharedLangs.length
      ? `Both speak ${langNames.join(", ") || sharedLangs.join(", ")}`
      : mine.size && theirs.size
        ? `No overlap — you: ${[...mine].join("/")} · them: ${[...theirs].join("/")}`
        : "Language data unavailable",
  });

  // 3 — Declared interests. Only scores once both people have filled in a profile.
  const myTags = tagSet(me);
  const theirTags = tagSet(them);
  const sharedTags = [...myTags].filter((t) => theirTags.has(t));
  const tagPts = Math.round(Math.min(1, sharedTags.length / 3) * WEIGHTS.interests);
  lines.push({
    label: "Shared interests",
    points: tagPts,
    max: WEIGHTS.interests,
    detail: sharedTags.length
      ? sharedTags.map((t) => `#${t}`).join(" ")
      : myTags.size === 0
        ? "Add tags to your profile to score this"
        : theirTags.size === 0
          ? "They haven't added tags yet"
          : "No tags in common",
  });

  // 4 — Physical proximity, decaying smoothly rather than by hard buckets.
  let distanceKm: number | null = null;
  let proxPts = 0;
  if (me.lat != null && me.lon != null && them.lat != null && them.lon != null) {
    distanceKm = haversineKm(
      { lat: me.lat, lon: me.lon },
      { lat: them.lat, lon: them.lon }
    );
    proxPts = Math.round(WEIGHTS.proximity * Math.exp(-distanceKm / 4000));
  }
  lines.push({
    label: "Proximity",
    points: proxPts,
    max: WEIGHTS.proximity,
    detail:
      distanceKm == null
        ? "Coordinates unavailable"
        : `${formatKm(distanceKm)} apart · ${them.city ?? "unknown city"}, ${them.countryName ?? "?"}`,
  });

  // 5 — Network kinship. Same ASN usually means the same campus, office or ISP.
  let netPts = 0;
  let netDetail = "Connection data unavailable";
  if (me.asn && them.asn && me.asn === them.asn) {
    netPts = WEIGHTS.network;
    netDetail = `Same network — AS${them.asn} ${them.isp ?? ""}`.trim();
  } else if (me.isp && them.isp && me.isp === them.isp) {
    netPts = 8;
    netDetail = `Same ISP — ${them.isp}`;
  } else if (
    me.connectionType &&
    them.connectionType &&
    me.connectionType === them.connectionType
  ) {
    netPts = 6;
    netDetail = `Both on ${them.connectionType} connections`;
  } else if (me.isHosting === false && them.isHosting === false) {
    netPts = 5;
    netDetail = "Both on residential connections";
  } else if (me.isp || them.isp) {
    netPts = 2;
    netDetail = `Different networks — ${them.isp ?? "unknown ISP"}`;
  }
  lines.push({
    label: "Network kinship",
    points: netPts,
    max: WEIGHTS.network,
    detail: netDetail,
  });

  if (them.isProxy) cautions.push("Traffic routed through a proxy or VPN");
  if (them.isTor) cautions.push("Exiting from the Tor network");
  if (them.isCrawler) cautions.push("Fingerprint matches a known crawler");
  if (them.isHosting) cautions.push("Datacenter IP — location may not be where they are");
  if (them.threatLevel && them.threatLevel !== "low")
    cautions.push(`ipstack threat level: ${them.threatLevel}`);

  const score = Math.max(
    0,
    Math.min(100, lines.reduce((sum, l) => sum + l.points, 0))
  );
  const top = [...lines].sort((a, b) => b.points / b.max - a.points / a.max)[0];

  const headline =
    score >= 75
      ? `Strong match — best reached ${overlapWindow ?? "any time"}`
      : score >= 50
        ? `Worth a message — ${top.label.toLowerCase()} lines up`
        : score >= 28
          ? overlapWindow
            ? `Narrow window — try ${overlapWindow}`
            : "Some common ground"
          : "Little overlap right now";

  return { score, band: band(score), headline, lines, overlapWindow, distanceKm, cautions };
}

/**
 * Room-wide companion to the pairwise score: the UTC hour at which the most
 * people on the globe are simultaneously inside their 09–18 local day.
 */
export function peakOverlapHour(visitors: PublicVisitor[]): {
  hour: number;
  awake: number;
  total: number;
} | null {
  const withTz = visitors.filter((v) => v.gmtOffset != null);
  if (withTz.length === 0) return null;

  let best = { hour: 0, awake: -1 };
  for (let h = 0; h < 24; h++) {
    const awake = withTz.filter((v) => {
      const local = (((h + v.gmtOffset! / 3600) % 24) + 24) % 24;
      return local >= 9 && local < 18;
    }).length;
    if (awake > best.awake) best = { hour: h, awake };
  }
  return { ...best, total: withTz.length };
}

/** Spread of the room — the numbers shown in the HUD. */
export function roomReach(visitors: PublicVisitor[]) {
  const countries = new Set(visitors.map((v) => v.countryCode).filter(Boolean));
  const continents = new Set(visitors.map((v) => v.continentCode).filter(Boolean));
  const timezones = new Set(visitors.map((v) => v.timezoneId).filter(Boolean));
  const languages = new Set(
    visitors.flatMap((v) => (v.languages ?? []).map((l) => l.code)).filter(Boolean)
  );
  return {
    countries: countries.size,
    continents: continents.size,
    timezones: timezones.size,
    languages: languages.size,
  };
}
