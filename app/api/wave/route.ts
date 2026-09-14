import { NextRequest } from "next/server";
import { getSessionId } from "@/app/lib/identity";
import { getVisitor, logEvent, toPublic } from "@/app/lib/presence";

export const dynamic = "force-dynamic";

/**
 * A wave is the one social primitive here: it writes a line into the shared
 * activity feed so the other person sees it on their own globe.
 */
export async function POST(request: NextRequest) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return Response.json({ error: "No session cookie — reload the page." }, { status: 428 });
  }

  let targetId: string;
  try {
    ({ targetId } = (await request.json()) as { targetId: string });
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const [me, them] = await Promise.all([getVisitor(sessionId), getVisitor(targetId)]);
  if (!me) return Response.json({ error: "You're not on the globe yet." }, { status: 409 });
  if (!them) return Response.json({ error: "That visitor has left." }, { status: 404 });
  if (me.id === them.id) {
    return Response.json({ error: "You can't wave at yourself." }, { status: 400 });
  }

  const mePublic = toPublic(me, sessionId);
  await logEvent({
    visitorId: me.id,
    alias: me.alias,
    kind: "wave",
    detail: them.alias,
    countryCode: mePublic.countryCode,
    countryName: mePublic.countryName,
  });

  return Response.json({ ok: true });
}
