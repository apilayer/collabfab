export type VisitorLanguage = { code?: string; name?: string; native?: string };

/** What every client on the globe is allowed to see about a visitor. */
export type PublicVisitor = {
  id: string;
  alias: string;
  isYou: boolean;
  joinedAt: number;
  lastSeenAt: number;

  // Location (ipstack)
  lat: number | null;
  lon: number | null;
  city: string | null;
  regionName: string | null;
  countryCode: string | null;
  countryName: string | null;
  countryFlag: string | null;
  continentCode: string | null;
  continentName: string | null;
  zip: string | null;
  isEu: boolean | null;
  capital: string | null;
  callingCode: string | null;

  // Time & locale (ipstack)
  timezoneId: string | null;
  gmtOffset: number | null; // seconds
  /** Where gmtOffset came from — ipstack's module, or estimated from longitude. */
  tzSource: "ipstack" | "estimated" | "unknown";
  isDst: boolean | null;
  languages: VisitorLanguage[];
  currencyCode: string | null;
  currencyName: string | null;
  currencySymbol: string | null;

  // Network (ipstack connection + security)
  ipMasked: string | null;
  ipType: string | null;
  hostname: string | null;
  asn: number | null;
  isp: string | null;
  /** True when `isp` was derived from reverse DNS rather than ipstack's module. */
  ispFromDns: boolean;
  connectionType: string | null;
  routingType: string | null;
  organizationType: string | null;
  isHosting: boolean | null;
  isProxy: boolean | null;
  proxyType: string | null;
  isTor: boolean | null;
  isCrawler: boolean | null;
  threatLevel: string | null;
  vpnService: string | null;

  // Client
  os: string | null;
  browser: string | null;
  device: string | null;

  // Self-declared profile (session-scoped, vanishes with the cookie)
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  lookingFor: string | null;
  email: string | null;
  website: string | null;
  social: string | null;
  tags: string[];
  hasProfile: boolean;

  /** True only for the clearly-labelled simulated crowd, never for real people. */
  isDemo?: boolean;
};

export type ActivityItem = {
  id: string;
  visitorId: string;
  alias: string;
  kind: string;
  detail: string | null;
  countryCode: string | null;
  countryName: string | null;
  createdAt: number;
};

export type PresencePayload = {
  you: PublicVisitor | null;
  visitors: PublicVisitor[];
  activity: ActivityItem[];
  serverTime: number;
  apiMeta: {
    maskedUrl: string | null;
    elapsedMs: number | null;
    status: number | null;
    cached: boolean;
    /** Optional ipstack modules this access key turned out to be entitled to. */
    modules: { hostname: boolean; security: boolean };
    /** Non-fatal explanation when the caller's own lookup didn't work out. */
    notice: string | null;
  };
};

export type ProfileInput = {
  displayName?: string;
  headline?: string;
  bio?: string;
  lookingFor?: string;
  email?: string;
  website?: string;
  social?: string;
  tags?: string;
};
