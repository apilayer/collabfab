import Image from "next/image";
import { ApiLayerLogo } from "./ApiLayerLogo";
import { assetPath } from "@/app/lib/assets";

/**
 * APILayer signup link, UTM-tagged the same way the other devtools tag theirs
 * so traffic from this app is attributable.
 */
export const IPSTACK_SIGNUP_URL =
  "https://app.apilayer.com/signup/ipstack/?utm_source=collabfab_devtools&utm_medium=internal&utm_campaign=featured_section";

/** ipstack's brand orange. */
const BRAND = "#ED661D";

/**
 * Full promo banner for the ipstack API. Sits inside the detail surfaces — the
 * visitor card and the FAQ — since the globe itself owns the whole viewport and
 * has nowhere to put a page-width section.
 */
export function ApiBanner() {
  return (
    <a
      href={IPSTACK_SIGNUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block w-full select-none overflow-hidden rounded-xl border transition"
      style={{ borderColor: `${BRAND}4d`, background: "#0A0D1A" }}
    >
      {/* Gradient backdrop and glow, in place of a stock photo — no extra request. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a0d04]/90 via-[#070B1A]/85 to-[#ED661D]/20" />
      <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-[#ED661D]/20 blur-3xl transition-opacity group-hover:bg-[#ED661D]/30" />

      <div className="relative z-10 flex flex-col gap-3 p-4">
        <span className="flex items-center gap-2">
          <Image
            src={assetPath("/brand/ipstack-white.png")}
            alt="ipstack"
            width={68}
            height={18}
            className="h-[15px] w-auto"
          />
          <span className="h-3.5 w-px bg-white/25" />
          <ApiLayerLogo size={12} invert />
        </span>

        <div>
          <p
            className="mono mb-1 text-[9px] font-bold tracking-widest uppercase"
            style={{ color: "#FD9950" }}
          >
            Real-time IP geolocation API
          </p>
          <h3 className="text-[17px] leading-tight font-extrabold tracking-tight text-white">
            Put anyone on the map,
            <br />
            straight from their IP.
          </h3>
          <p className="mt-1.5 text-[11px] leading-snug text-white/60">
            City, coordinates, timezone, ISP and threat data — the same API that
            placed every pin on this globe.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[12px] font-bold text-white shadow-lg transition"
            style={{ background: BRAND }}
          >
            Get Your API Key
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
          <span className="text-[10px] text-white/50">ipstack, powered by APILayer</span>
        </div>
      </div>
    </a>
  );
}

/**
 * Slim sponsored banner pinned bottom-centre, the same shape aerostack uses —
 * 420×42, clear of the activity feed on the left and the globe controls on the
 * right. Backdrop is a gradient rather than a stock photo so the page makes no
 * extra network request.
 */
export function AttributionBanner() {
  return (
    <a
      href={IPSTACK_SIGNUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group pointer-events-auto absolute bottom-4 left-1/2 z-40 block h-[42px] w-[calc(100vw-1.5rem)] max-w-[420px] -translate-x-1/2 overflow-hidden rounded-lg border shadow-2xl transition select-none"
      style={{ borderColor: `${BRAND}4d` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a0d04]/95 via-[#070B1A]/90 to-[#ED661D]/30" />
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#ED661D]/25 blur-2xl transition-opacity group-hover:bg-[#ED661D]/40" />

      <div className="relative z-10 flex h-full items-center justify-between gap-2 px-3">
        <span className="flex shrink-0 items-center gap-2">
          <Image
            src={assetPath("/brand/ipstack-white.png")}
            alt="ipstack"
            width={53}
            height={14}
            className="h-3 w-auto"
          />
          <span className="h-3 w-px bg-white/25" />
          <ApiLayerLogo size={10} invert />
        </span>

        <span className="hidden truncate text-[10px] text-white/65 sm:inline">
          Real-time IP geolocation API
        </span>

        <span
          className="inline-flex shrink-0 items-center gap-1 rounded px-2.5 py-1 text-[10px] font-bold text-white shadow transition"
          style={{ background: BRAND }}
        >
          Get API Key
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </a>
  );
}
