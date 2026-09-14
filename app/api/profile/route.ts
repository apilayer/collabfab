import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { visitors } from "@/app/lib/db/schema";
import { getSessionId } from "@/app/lib/identity";
import { ensureSchema, getVisitor, logEvent, toPublic } from "@/app/lib/presence";
import type { ProfileInput } from "@/interfaces/visitor.interface";

export const dynamic = "force-dynamic";

const LIMITS = {
  displayName: 40,
  headline: 80,
  bio: 600,
  lookingFor: 300,
  email: 120,
  website: 160,
  social: 120,
  tags: 160,
} as const;

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim().slice(0, max);
  return s.length ? s : null;
};

/** Normalise a URL so a bare "example.com" still renders as a safe link. */
const cleanUrl = (v: unknown): string | null => {
  const s = clean(v, LIMITS.website);
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const cleanTags = (v: unknown): string | null => {
  const s = clean(v, LIMITS.tags);
  if (!s) return null;
  const list = s
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").toLowerCase().replace(/[^a-z0-9+.-]/g, ""))
    .filter(Boolean)
    .slice(0, 8);
  return list.length ? [...new Set(list)].join(",") : null;
};

export async function PUT(request: NextRequest) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return Response.json({ error: "No session cookie — reload the page." }, { status: 428 });
  }

  await ensureSchema();
  const existing = await getVisitor(sessionId);
  if (!existing) {
    return Response.json(
      { error: "You're not on the globe yet — wait for the first ping." },
      { status: 409 }
    );
  }

  let body: ProfileInput;
  try {
    body = (await request.json()) as ProfileInput;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = clean(body.email, LIMITS.email);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: `"${email}" is not a valid email address.` }, { status: 400 });
  }

  const patch = {
    displayName: clean(body.displayName, LIMITS.displayName),
    headline: clean(body.headline, LIMITS.headline),
    bio: clean(body.bio, LIMITS.bio),
    lookingFor: clean(body.lookingFor, LIMITS.lookingFor),
    email,
    website: cleanUrl(body.website),
    social: clean(body.social, LIMITS.social),
    tags: cleanTags(body.tags),
    lastSeenAt: Date.now(),
  };

  await db.update(visitors).set(patch).where(eq(visitors.id, sessionId));

  const wasBlank = !(
    existing.displayName ||
    existing.headline ||
    existing.bio ||
    existing.lookingFor ||
    existing.tags
  );
  const nowFilled = Boolean(
    patch.displayName || patch.headline || patch.bio || patch.lookingFor || patch.tags
  );
  if (nowFilled) {
    const updated = toPublic({ ...existing, ...patch }, sessionId);
    await logEvent({
      visitorId: sessionId,
      alias: existing.alias,
      kind: wasBlank ? "profile" : "profile_update",
      detail: patch.headline ?? patch.displayName ?? null,
      countryCode: updated.countryCode,
      countryName: updated.countryName,
    });
  }

  return Response.json({ you: toPublic({ ...existing, ...patch }, sessionId) });
}
