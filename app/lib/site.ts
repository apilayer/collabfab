/**
 * Canonical facts about this page, deliberately decoupled from routing.
 * NEXT_PUBLIC_BASE_PATH says where Next serves the app from; these say what a
 * crawler should be told about it.
 */
const DEFAULT_ORIGIN = "https://apilayer.com";
const DEFAULT_PATH = "/devtools/real-time-tracker";

export const SITE = {
  name: "CollabFab",
  origin: (process.env.NEXT_PUBLIC_SITE_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, ""),
  publicPath: (process.env.NEXT_PUBLIC_SITE_PATH ?? DEFAULT_PATH).replace(/\/$/, ""),
  tagline: "Find people to build with, on a live 3D globe",
  description:
    "See everyone who has the page open right now on a 3D globe, placed by real-time IP geolocation. Say what you are building, and an explainable Handshake Score ranks who is worth reaching out to by shared working hours, language, interests and distance.",
  locale: "en_US",
} as const;

export const SITE_URL = `${SITE.origin}${SITE.publicPath}`;
