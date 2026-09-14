import { and, desc, gt, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { client, db } from "./db";
import { events, visitors, type Visitor } from "./db/schema";
import { aliasFor } from "./alias";
import { parseUa } from "./ua";
import { ispFromHostname, resolveOffset } from "./timezone";
import type { IPstackResponse } from "./ipstack";
import type { ActivityItem, PublicVisitor } from "@/interfaces/visitor.interface";

/** A visitor drops off the globe this long after their last heartbeat. */
export const LIVE_WINDOW_MS = 45_000;
export const ACTIVITY_WINDOW_MS = 30 * 60_000;

let schemaReady: Promise<void> | null = null;

/**
 * Idempotent bootstrap so a fresh clone (or a fresh Turso db) works with no
 * migration step — the whole schema is two tables.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await client.execute(`CREATE TABLE IF NOT EXISTS visitors (
        id TEXT PRIMARY KEY,
        alias TEXT NOT NULL,
        ip TEXT NOT NULL,
        lat INTEGER NOT NULL,
        lon INTEGER NOT NULL,
        ipstack_json TEXT,
        display_name TEXT,
        headline TEXT,
        bio TEXT,
        looking_for TEXT,
        email TEXT,
        website TEXT,
        social TEXT,
        tags TEXT,
        user_agent TEXT,
        joined_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL
      )`);
      await client.execute(
        `CREATE INDEX IF NOT EXISTS visitors_last_seen_idx ON visitors (last_seen_at)`
      );
      await client.execute(`CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        visitor_id TEXT NOT NULL,
        alias TEXT NOT NULL,
        country_code TEXT,
        country_name TEXT,
        kind TEXT NOT NULL,
        detail TEXT,
        created_at INTEGER NOT NULL
      )`);
      await client.execute(
        `CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at)`
      );
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

export async function getVisitor(id: string): Promise<Visitor | null> {
  await ensureSchema();
  const rows = await db.select().from(visitors).where(eq(visitors.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function upsertVisitor(opts: {
  id: string;
  ip: string;
  geo: IPstackResponse | null;
  userAgent: string | null;
}): Promise<{ row: Visitor; created: boolean }> {
  await ensureSchema();
  const now = Date.now();
  const existing = await getVisitor(opts.id);
  const lat = Math.round((opts.geo?.latitude ?? 0) * 1e6);
  const lon = Math.round((opts.geo?.longitude ?? 0) * 1e6);

  if (existing) {
    // Refresh the geo snapshot only when we actually got one back, so a rate
    // limited lookup never wipes a good record.
    const patch: Partial<Visitor> = { lastSeenAt: now };
    if (opts.geo) {
      patch.ipstackJson = JSON.stringify(opts.geo);
      patch.ip = opts.ip;
      if (opts.geo.latitude != null) patch.lat = lat;
      if (opts.geo.longitude != null) patch.lon = lon;
    }
    await db.update(visitors).set(patch).where(eq(visitors.id, opts.id));
    return { row: { ...existing, ...patch } as Visitor, created: false };
  }

  const row: Visitor = {
    id: opts.id,
    alias: aliasFor(opts.id),
    ip: opts.ip,
    lat,
    lon,
    ipstackJson: opts.geo ? JSON.stringify(opts.geo) : null,
    displayName: null,
    headline: null,
    bio: null,
    lookingFor: null,
    email: null,
    website: null,
    social: null,
    tags: null,
    userAgent: opts.userAgent,
    joinedAt: now,
    lastSeenAt: now,
  };
  await db.insert(visitors).values(row).onConflictDoNothing();
  return { row, created: true };
}

export async function listLive(): Promise<Visitor[]> {
  await ensureSchema();
  return db
    .select()
    .from(visitors)
    .where(gt(visitors.lastSeenAt, Date.now() - LIVE_WINDOW_MS))
    .orderBy(desc(visitors.joinedAt))
    .limit(200);
}

export async function logEvent(opts: {
  visitorId: string;
  alias: string;
  kind: string;
  detail?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
}) {
  await ensureSchema();
  await db.insert(events).values({
    id: nanoid(12),
    visitorId: opts.visitorId,
    alias: opts.alias,
    kind: opts.kind,
    detail: opts.detail ?? null,
    countryCode: opts.countryCode ?? null,
    countryName: opts.countryName ?? null,
    createdAt: Date.now(),
  });
}

export async function listActivity(): Promise<ActivityItem[]> {
  await ensureSchema();
  const rows = await db
    .select()
    .from(events)
    .where(gt(events.createdAt, Date.now() - ACTIVITY_WINDOW_MS))
    .orderBy(desc(events.createdAt))
    .limit(40);
  return rows.map((r) => ({
    id: r.id,
    visitorId: r.visitorId,
    alias: r.alias,
    kind: r.kind,
    detail: r.detail,
    countryCode: r.countryCode,
    countryName: r.countryName,
    createdAt: r.createdAt,
  }));
}

/** Best-effort housekeeping so the tables don't grow without bound. */
export async function sweep() {
  await ensureSchema();
  const cutoff = Date.now() - 6 * 60 * 60_000;
  await client.execute({
    sql: "DELETE FROM visitors WHERE last_seen_at < ?",
    args: [cutoff],
  });
  await client.execute({
    sql: "DELETE FROM events WHERE created_at < ?",
    args: [Date.now() - ACTIVITY_WINDOW_MS],
  });
}

const maskIp = (ip: string) => {
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + ":••••";
  }
  const p = ip.split(".");
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.•••` : "•••";
};

const HOSTING_HINT =
  /(amazon|aws|google|cloud|microsoft|azure|digitalocean|linode|ovh|hetzner|vultr|contabo|oracle|alibaba|tencent|cloudflare|fastly|akamai|datacamp|m247|leaseweb|choopa|quadranet|gcore|cogent)/i;

/** Project a stored row into the shape every browser is allowed to render. */
export function toPublic(row: Visitor, youId: string | null): PublicVisitor {
  const geo: IPstackResponse = row.ipstackJson
    ? (JSON.parse(row.ipstackJson) as IPstackResponse)
    : {};
  const ua = parseUa(row.userAgent);
  const lon = row.lon ? row.lon / 1e6 : (geo.longitude ?? null);

  // The `time_zone` and `connection` modules aren't on every ipstack plan, so
  // fall back to solar time and reverse DNS and flag the provenance.
  const tz = resolveOffset(geo.time_zone?.gmt_offset, lon);
  const dnsIsp = ispFromHostname(geo.hostname);
  const isp = geo.connection?.isp ?? dnsIsp;
  const hosting =
    geo.security?.hosting_facility ??
    (isp ? HOSTING_HINT.test(isp) : null) ??
    (geo.connection?.home === false ? true : null);

  const tags = (row.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    id: row.id,
    alias: row.alias,
    isYou: row.id === youId,
    joinedAt: row.joinedAt,
    lastSeenAt: row.lastSeenAt,

    lat: row.lat ? row.lat / 1e6 : (geo.latitude ?? null),
    lon,
    city: geo.city ?? null,
    regionName: geo.region_name ?? null,
    countryCode: geo.country_code ?? null,
    countryName: geo.country_name ?? null,
    countryFlag: geo.location?.country_flag_emoji ?? null,
    continentCode: geo.continent_code ?? null,
    continentName: geo.continent_name ?? null,
    zip: geo.zip ?? null,
    isEu: geo.location?.is_eu ?? null,
    capital: geo.location?.capital ?? null,
    callingCode: geo.location?.calling_code ?? null,

    timezoneId: geo.time_zone?.id ?? null,
    gmtOffset: tz.offset,
    tzSource: tz.source,
    isDst: geo.time_zone?.is_daylight_saving ?? null,
    languages: geo.location?.languages ?? [],
    currencyCode: geo.currency?.code ?? null,
    currencyName: geo.currency?.name ?? null,
    currencySymbol: geo.currency?.symbol ?? null,

    ipMasked: row.ip ? maskIp(row.ip) : null,
    ipType: geo.type ?? null,
    hostname: geo.hostname ?? null,
    asn: geo.connection?.asn ?? null,
    isp,
    ispFromDns: !geo.connection?.isp && Boolean(dnsIsp),
    connectionType: geo.connection_type ?? null,
    routingType: geo.ip_routing_type ?? null,
    organizationType: geo.connection?.organization_type ?? null,
    isHosting: hosting,
    isProxy: geo.security?.is_proxy ?? null,
    proxyType: geo.security?.proxy_type ?? null,
    isTor: geo.security?.is_tor ?? null,
    isCrawler: geo.security?.is_crawler ?? null,
    threatLevel: geo.security?.threat_level ?? null,
    vpnService: geo.security?.vpn_service ?? null,

    os: ua.os,
    browser: ua.browser,
    device: ua.device,

    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    lookingFor: row.lookingFor,
    email: row.email,
    website: row.website,
    social: row.social,
    tags,
    hasProfile: Boolean(
      row.displayName || row.headline || row.bio || row.lookingFor || tags.length
    ),
  };
}

export { and };
