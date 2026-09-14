import { cookies, headers } from "next/headers";

export const SESSION_COOKIE = "collabfab_sid";

export async function getSessionId(): Promise<string | null> {
  const c = await cookies();
  return c.get(SESSION_COOKIE)?.value ?? null;
}

export async function requireSessionId(): Promise<string> {
  const v = await getSessionId();
  if (!v) {
    throw new Error(
      `${SESSION_COOKIE} cookie missing — proxy.ts should have set it. Hard-refresh the page.`
    );
  }
  return v;
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

export async function getUserAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}
