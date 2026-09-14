import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed Middleware to Proxy. This runs before every request and
// mints a *session* cookie (no maxAge/expires) so a visitor's identity and
// profile live only as long as the browser stays open — close it or clear
// cookies and they return as a brand-new stranger on the globe.
export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get("collabfab_sid")) {
    res.cookies.set("collabfab_sid", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|countries.geojson).*)"],
};
