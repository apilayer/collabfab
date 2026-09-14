export type IPstackLanguage = { code?: string; name?: string; native?: string };

export type IPstackResponse = {
  ip?: string;
  hostname?: string;
  type?: "ipv4" | "ipv6" | string;
  continent_code?: string;
  continent_name?: string;
  country_code?: string;
  country_name?: string;
  region_code?: string;
  region_name?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  msa?: string | null;
  dma?: string | null;
  radius?: string | null;
  /** Present on plans without the `connection` module, e.g. "mobile gateway". */
  ip_routing_type?: string | null;
  /** Present on plans without the `connection` module, e.g. "mobile wireless". */
  connection_type?: string | null;
  location?: {
    geoname_id?: number;
    capital?: string;
    calling_code?: string;
    is_eu?: boolean;
    country_flag?: string;
    country_flag_emoji?: string;
    languages?: IPstackLanguage[];
  };
  time_zone?: {
    id?: string;
    current_time?: string;
    gmt_offset?: number;
    code?: string;
    is_daylight_saving?: boolean;
  };
  currency?: {
    code?: string;
    name?: string;
    plural?: string;
    symbol?: string;
    symbol_native?: string;
  };
  connection?: {
    asn?: number;
    isp?: string;
    sld?: string;
    tld?: string;
    carrier?: string;
    home?: boolean;
    organization_type?: string;
    isic_code?: string;
    naics_code?: string;
  };
  security?: {
    is_proxy?: boolean;
    proxy_type?: string;
    is_crawler?: boolean;
    crawler_name?: string;
    crawler_type?: string;
    is_tor?: boolean;
    threat_level?: string;
    threat_types?: string[];
    anonymizer_status?: string;
    proxy_last_detected?: string;
    proxy_level?: string;
    vpn_service?: string;
    hosting_facility?: boolean;
  };
  success?: boolean;
  error?: { code: number; type: string; info: string };
};

export type LookupResult = {
  request: { url: string; method: "GET" };
  response: { status: number; elapsedMs: number; body: IPstackResponse };
  target: string;
};

const HOSTING_KEYWORDS = [
  "amazon",
  "aws",
  "google",
  "cloud",
  "microsoft",
  "azure",
  "digitalocean",
  "linode",
  "ovh",
  "hetzner",
  "vultr",
  "contabo",
  "oracle",
  "alibaba",
  "tencent",
  "cloudflare",
  "fastly",
  "akamai",
  "datacamp",
  "m247",
  "leaseweb",
  "choopa",
  "quadranet",
  "nforce",
  "gcore",
  "gtt",
  "cogent",
];

// Fallback VPN/proxy heuristic for when the `security` module isn't included
// (free tier) — flags obvious hosting/datacenter ASNs by ISP name.
export function heuristicVpnVerdict(data: IPstackResponse): {
  likelyVpn: boolean;
  reason: string;
} {
  const isp = (data.connection?.isp ?? "").toLowerCase();
  const carrier = (data.connection?.carrier ?? "").toLowerCase();
  const orgType = (data.connection?.organization_type ?? "").toLowerCase();
  const blob = `${isp} ${carrier} ${orgType}`;

  if (!blob.trim()) {
    return { likelyVpn: false, reason: "No connection data to analyze." };
  }

  const match = HOSTING_KEYWORDS.find((k) => blob.includes(k));
  if (match) {
    return {
      likelyVpn: true,
      reason: `ISP/carrier matches known hosting provider: "${match}". Datacenter IPs are commonly used by VPNs and proxies.`,
    };
  }
  if (data.connection?.home === false) {
    return {
      likelyVpn: true,
      reason: "Connection is flagged as non-residential.",
    };
  }
  return {
    likelyVpn: false,
    reason: "ISP appears to be a consumer/residential network.",
  };
}
