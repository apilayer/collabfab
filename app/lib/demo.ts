import type { PublicVisitor } from "@/interfaces/visitor.interface";
import { aliasFor } from "./alias";

type Seed = {
  id: string;
  city: string;
  region: string;
  cc: string;
  country: string;
  flag: string;
  continent: [string, string];
  lat: number;
  lon: number;
  tz: string;
  offset: number;
  langs: { code: string; name: string }[];
  currency: [string, string, string];
  asn: number;
  isp: string;
  os: string;
  browser: string;
  device: string;
  hosting?: boolean;
  proxy?: boolean;
  profile?: Partial<PublicVisitor>;
};

const SEEDS: Seed[] = [
  {
    id: "demo-lagos", city: "Lagos", region: "Lagos", cc: "NG", country: "Nigeria",
    flag: "🇳🇬", continent: ["AF", "Africa"], lat: 6.4541, lon: 3.3947,
    tz: "Africa/Lagos", offset: 3600,
    langs: [{ code: "en", name: "English" }], currency: ["NGN", "Nigerian Naira", "₦"],
    asn: 36873, isp: "MTN Nigeria", os: "Android", browser: "Chrome", device: "Mobile",
    profile: {
      displayName: "Ada", headline: "Backend engineer, fintech APIs",
      bio: "Building payment rails for West African merchants. Ten years of Go and Postgres, currently deep in idempotency and reconciliation problems.",
      lookingFor: "Anyone who has run card settlement at scale — I want to compare notes on retry semantics.",
      tags: ["golang", "fintech", "postgres", "apis"], social: "@ada.dev",
    },
  },
  {
    id: "demo-berlin", city: "Berlin", region: "Berlin", cc: "DE", country: "Germany",
    flag: "🇩🇪", continent: ["EU", "Europe"], lat: 52.52, lon: 13.405,
    tz: "Europe/Berlin", offset: 7200,
    langs: [{ code: "de", name: "German" }, { code: "en", name: "English" }],
    currency: ["EUR", "Euro", "€"],
    asn: 3320, isp: "Deutsche Telekom AG", os: "Mac OS", browser: "Firefox", device: "Desktop",
    profile: {
      displayName: "Jonas", headline: "Design engineer · WebGL",
      bio: "I make browsers draw things they were not designed to draw. Three.js, shaders, and far too much time spent on easing curves.",
      lookingFor: "A frontend collaborator for an open-source globe component.",
      tags: ["webgl", "threejs", "design", "apis"], website: "https://example.dev",
    },
  },
  {
    id: "demo-belgrade", city: "Belgrade", region: "Central Serbia", cc: "RS", country: "Serbia",
    flag: "🇷🇸", continent: ["EU", "Europe"], lat: 44.8048, lon: 20.4781,
    tz: "Europe/Belgrade", offset: 7200,
    langs: [{ code: "sr", name: "Serbian" }], currency: ["RSD", "Serbian Dinar", "дин."],
    asn: 8400, isp: "Telekom Srbija", os: "Mac OS", browser: "Chrome", device: "Desktop",
  },
  {
    id: "demo-nyc", city: "New York", region: "New York", cc: "US", country: "United States",
    flag: "🇺🇸", continent: ["NA", "North America"], lat: 40.7128, lon: -74.006,
    tz: "America/New_York", offset: -14400,
    langs: [{ code: "en", name: "English" }], currency: ["USD", "US Dollar", "$"],
    asn: 701, isp: "Verizon Business", os: "Windows", browser: "Edge", device: "Desktop",
    profile: {
      displayName: "Priya", headline: "Data infra → founder",
      bio: "Left a streaming-data team to build tooling for solo founders. Mostly TypeScript now, and mostly regretting nothing.",
      lookingFor: "Design partners in Europe — happy to trade early access for honest feedback.",
      tags: ["typescript", "apis", "startups"], email: "hello@example.com",
    },
  },
  {
    id: "demo-sf", city: "San Francisco", region: "California", cc: "US", country: "United States",
    flag: "🇺🇸", continent: ["NA", "North America"], lat: 37.7749, lon: -122.4194,
    tz: "America/Los_Angeles", offset: -25200,
    langs: [{ code: "en", name: "English" }], currency: ["USD", "US Dollar", "$"],
    asn: 14618, isp: "Amazon Technologies", os: "Linux", browser: "Chrome", device: "Desktop",
    hosting: true, proxy: true,
  },
  {
    id: "demo-tokyo", city: "Tokyo", region: "Tokyo", cc: "JP", country: "Japan",
    flag: "🇯🇵", continent: ["AS", "Asia"], lat: 35.6762, lon: 139.6503,
    tz: "Asia/Tokyo", offset: 32400,
    langs: [{ code: "ja", name: "Japanese" }], currency: ["JPY", "Japanese Yen", "¥"],
    asn: 2497, isp: "IIJ", os: "iOS", browser: "Safari", device: "Mobile",
    profile: {
      displayName: "Rin", headline: "Mobile engineer",
      bio: "Swift and Kotlin. I care a lot about how an app feels in the first 400ms.",
      lookingFor: "People who obsess over launch performance.",
      tags: ["mobile", "swift", "design"],
    },
  },
  {
    id: "demo-saopaulo", city: "São Paulo", region: "São Paulo", cc: "BR", country: "Brazil",
    flag: "🇧🇷", continent: ["SA", "South America"], lat: -23.5505, lon: -46.6333,
    tz: "America/Sao_Paulo", offset: -10800,
    langs: [{ code: "pt", name: "Portuguese" }], currency: ["BRL", "Brazilian Real", "R$"],
    asn: 28573, isp: "Claro NXT Telecomunicacoes", os: "Windows", browser: "Chrome", device: "Desktop",
  },
  {
    id: "demo-bangalore", city: "Bengaluru", region: "Karnataka", cc: "IN", country: "India",
    flag: "🇮🇳", continent: ["AS", "Asia"], lat: 12.9716, lon: 77.5946,
    tz: "Asia/Kolkata", offset: 19800,
    langs: [{ code: "hi", name: "Hindi" }, { code: "en", name: "English" }],
    currency: ["INR", "Indian Rupee", "₹"],
    asn: 55836, isp: "Reliance Jio Infocomm", os: "Android", browser: "Chrome", device: "Mobile",
    profile: {
      displayName: "Kabir", headline: "Platform engineer",
      bio: "Kubernetes, Postgres, and the unglamorous work of keeping other people's services up.",
      lookingFor: "War stories about multi-region Postgres failover.",
      tags: ["postgres", "kubernetes", "golang"],
    },
  },
];

/**
 * A clearly-labelled simulated crowd. Every entry carries `isDemo: true` and is
 * rendered with a dashed ring plus a SIMULATED badge, so it is never mistaken
 * for a real person — it exists purely so the globe can be evaluated solo.
 */
export function demoVisitors(now = Date.now()): PublicVisitor[] {
  return SEEDS.map((s, i) => ({
    id: s.id,
    alias: aliasFor(s.id),
    isYou: false,
    isDemo: true,
    joinedAt: now - (i + 2) * 97_000,
    lastSeenAt: now,

    lat: s.lat,
    lon: s.lon,
    city: s.city,
    regionName: s.region,
    countryCode: s.cc,
    countryName: s.country,
    countryFlag: s.flag,
    continentCode: s.continent[0],
    continentName: s.continent[1],
    zip: null,
    isEu: ["DE"].includes(s.cc),
    capital: null,
    callingCode: null,

    timezoneId: s.tz,
    gmtOffset: s.offset,
    tzSource: "ipstack" as const,
    isDst: null,
    languages: s.langs,
    currencyCode: s.currency[0],
    currencyName: s.currency[1],
    currencySymbol: s.currency[2],

    ipMasked: "simulated",
    ipType: "ipv4",
    hostname: null,
    asn: s.asn,
    isp: s.isp,
    ispFromDns: false,
    connectionType: s.device === "Mobile" ? "mobile wireless" : "broadband",
    routingType: s.device === "Mobile" ? "mobile gateway" : "fixed",
    organizationType: null,
    isHosting: s.hosting ?? false,
    isProxy: s.proxy ?? false,
    proxyType: s.proxy ? "vpn" : null,
    isTor: false,
    isCrawler: false,
    threatLevel: s.proxy ? "medium" : "low",
    vpnService: null,

    os: s.os,
    browser: s.browser,
    device: s.device,

    displayName: null,
    headline: null,
    bio: null,
    lookingFor: null,
    email: null,
    website: null,
    social: null,
    ...s.profile,
    tags: s.profile?.tags ?? [],
    hasProfile: Boolean(s.profile),
  }));
}
