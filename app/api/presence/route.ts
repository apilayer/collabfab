import { NextRequest } from "next/server";
import { getClientIp, getSessionId, getUserAgent } from "@/app/lib/identity";
import { lookupIp, moduleStatus } from "@/app/lib/ipstackLookup";
import {
  getVisitor,
  listActivity,
  listLive,
  logEvent,
  sweep,
  toPublic,
  upsertVisitor,
} from "@/app/lib/presence";
import type { PresencePayload } from "@/interfaces/visitor.interface";

export const dynamic = "force-dynamic";

/** Re-geolocate at most this often per session — heartbeats are far cheaper. */
const GEO_REFRESH_MS = 10 * 60_000;

/**
 * The single endpoint the globe polls: it heartbeats the caller, then returns
 * everyone currently live plus the recent activity feed.
 */
export async function GET(request: NextRequest) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return Response.json(
      { error: "No session cookie yet — reload the page." },
      { status: 428 }
    );
  }

  const ip = (await getClientIp()) ?? "";
  const userAgent = await getUserAgent();

  let existing;
  try {
    existing = await getVisitor(sessionId);
  } catch (e) {
    return Response.json(
      { error: `Database unavailable: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 }
    );
  }

  // Only hit ipstack on first sight, when the snapshot has gone stale, or when
  // a previous attempt left us without coordinates to plot.
  const needsGeo =
    !existing?.ipstackJson ||
    existing.lat === 0 ||
    Date.now() - existing.joinedAt > GEO_REFRESH_MS ||
    request.nextUrl.searchParams.get("refresh") === "1";

  let apiMeta: PresencePayload["apiMeta"] = {
    maskedUrl: null,
    elapsedMs: null,
    status: null,
    cached: false,
    modules: moduleStatus(),
    notice: null,
  };
  let geo = null;

  if (needsGeo) {
    const outcome = await lookupIp(ip || null);
    apiMeta = {
      maskedUrl: outcome.maskedUrl || null,
      elapsedMs: outcome.elapsedMs || null,
      status: outcome.status || null,
      cached: outcome.cached,
      modules: moduleStatus(),
      notice: outcome.notice,
    };
    // A failed lookup is a notice, never a hard error: everyone else on the
    // globe should keep rendering regardless of one caller's bad luck.
    if (!outcome.notice) geo = outcome.body;
  }

  const { row, created } = await upsertVisitor({
    id: sessionId,
    ip: ip || "0.0.0.0",
    geo,
    userAgent,
  });

  if (created) {
    await logEvent({
      visitorId: row.id,
      alias: row.alias,
      kind: "joined",
      detail: geo?.city ?? null,
      countryCode: geo?.country_code ?? null,
      countryName: geo?.country_name ?? null,
    });
    // Opportunistic housekeeping, only on the rare "someone new" path.
    sweep().catch(() => {});
  }

  const [live, activity] = await Promise.all([listLive(), listActivity()]);
  const visitorsPublic = live.map((v) => toPublic(v, sessionId));

  const payload: PresencePayload = {
    you: visitorsPublic.find((v) => v.isYou) ?? toPublic(row, sessionId),
    visitors: visitorsPublic,
    activity,
    serverTime: Date.now(),
    apiMeta,
  };

  return Response.json(payload, { headers: { "cache-control": "no-store" } });
}
