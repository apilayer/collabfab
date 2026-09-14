"use client";

import { useMemo, useState } from "react";
import type { PublicVisitor } from "@/interfaces/visitor.interface";
import { handshake } from "@/app/lib/handshake";
import { formatDuration, formatLocalTime, formatOffset, relativeTime } from "@/app/lib/geo";
import { Avatar, accentFor } from "./Avatar";
import { ApiBanner } from "./ApiBanner";
import {
  ClockIcon,
  CloseIcon,
  EyeIcon,
  LinkIcon,
  MailIcon,
  ShieldIcon,
  SparkIcon,
  WaveIcon,
} from "./Icons";

function Row({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-[12px] text-fg-muted">{label}</span>
      <span className={`${mono ? "mono" : ""} min-w-0 truncate text-right text-[12px] text-fg`}>
        {value ?? <span className="text-fg-dim">—</span>}
      </span>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border px-4 py-3">
      <h3 className="mono mb-1.5 flex items-center gap-1.5 text-[10px] tracking-wider text-fg-dim uppercase">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

const yesNo = (v: boolean | null | undefined) =>
  v == null ? null : v ? <span className="text-warn">yes</span> : <span className="text-fg-muted">no</span>;

export function VisitorCard({
  visitor,
  you,
  now,
  onClose,
  onWave,
  waved,
  securityModule,
}: {
  visitor: PublicVisitor;
  you: PublicVisitor | null;
  now: number;
  onClose: () => void;
  onWave: (id: string) => void;
  waved: boolean;
  /** Whether this ipstack plan is entitled to the security module. */
  securityModule: boolean;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const score = useMemo(
    () => (you && !visitor.isYou ? handshake(you, visitor) : null),
    [you, visitor]
  );
  const accent = accentFor(visitor.id);

  const place = [visitor.city, visitor.regionName, visitor.countryName]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="panel panel-raised pop-in pointer-events-auto flex max-h-[min(78vh,700px)] w-[min(94vw,400px)] flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="relative">
          <Avatar seed={visitor.id} size={56} ring={visitor.isYou ? "var(--live)" : accent} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[17px] font-semibold">
              {visitor.displayName || visitor.alias}
            </h2>
            {visitor.isYou && (
              <span className="mono rounded border border-[var(--live)]/50 px-1.5 py-0.5 text-[9px] tracking-wider text-[var(--live)] uppercase">
                you
              </span>
            )}
            {visitor.isDemo && (
              <span className="mono rounded border border-warn/50 px-1.5 py-0.5 text-[9px] tracking-wider text-warn uppercase">
                simulated
              </span>
            )}
          </div>
          {visitor.displayName && (
            <p className="mono text-[11px] text-fg-dim">{visitor.alias}</p>
          )}
          {visitor.headline && (
            <p className="mt-0.5 text-[13px] text-fg-muted">{visitor.headline}</p>
          )}
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-fg-muted">
            <span>
              {visitor.countryFlag ?? "🌍"} {place || "Locating…"}
            </span>
            {visitor.os && <span className="text-fg-dim">· {visitor.os}</span>}
            {visitor.browser && <span className="text-fg-dim">· {visitor.browser}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-fg-dim transition hover:bg-panel-2 hover:text-fg"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable body — every section below scrolls inside the card */}
      <div className="scroll-thin flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pt-1 pb-3">
          <ApiBanner />
        </div>

        {/* Handshake score */}
        {score && (
          <Section title="Handshake score" icon={<SparkIcon className="h-3 w-3" />}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] text-fg-muted">{score.headline}</span>
              <span className="mono text-[17px] font-semibold">{score.score}</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full">
              <div className="score-track absolute inset-0 opacity-30" />
              <div
                className="score-track absolute inset-y-0 left-0"
                style={{ width: `${score.score}%` }}
              />
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {score.lines.map((l) => (
                <li key={l.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-fg">{l.label}</span>
                    <span className="mono shrink-0 text-[11px] text-fg-muted">
                      {l.points}/{l.max}
                    </span>
                  </div>
                  <div className="mt-1 h-[3px] w-full rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(l.points / l.max) * 100}%`,
                        background: l.points > 0 ? "var(--accent)" : "transparent",
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-fg-dim">{l.detail}</p>
                </li>
              ))}
            </ul>
            {score.cautions.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {score.cautions.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-[11px] text-warn">
                    <ShieldIcon className="mt-px h-3 w-3 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] leading-snug text-fg-dim">
              Computed in your browser from live ipstack fields — timezone offset, country
              languages, coordinates and ASN — plus the tags you both entered. Every point is
              attributed above.
            </p>
          </Section>
        )}

        {/* Profile */}
        {(visitor.bio || visitor.lookingFor || visitor.tags.length > 0) && (
          <Section title="Profile" icon={<EyeIcon className="h-3 w-3" />}>
            {visitor.bio && (
              <p className="text-[13px] leading-relaxed whitespace-pre-line text-fg">
                {visitor.bio}
              </p>
            )}
            {visitor.lookingFor && (
              <div className="mt-2.5 rounded-lg border border-border bg-panel-2 p-2.5">
                <p className="mono mb-1 text-[10px] tracking-wider text-fg-dim uppercase">
                  Why reach out
                </p>
                <p className="text-[12px] leading-relaxed whitespace-pre-line text-fg">
                  {visitor.lookingFor}
                </p>
              </div>
            )}
            {visitor.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {visitor.tags.map((t) => (
                  <span key={t} className="chip mono text-[11px]">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Contact */}
        {(visitor.email || visitor.website || visitor.social) && (
          <Section title="Contact" icon={<MailIcon className="h-3 w-3" />}>
            <div className="flex flex-col gap-1.5">
              {visitor.email && (
                <a
                  href={`mailto:${visitor.email}`}
                  className="mono flex items-center gap-2 text-[12px] text-accent transition hover:underline"
                >
                  <MailIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{visitor.email}</span>
                </a>
              )}
              {visitor.website && (
                <a
                  href={visitor.website}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className="mono flex items-center gap-2 text-[12px] text-accent transition hover:underline"
                >
                  <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{visitor.website}</span>
                </a>
              )}
              {visitor.social && (
                <span className="mono flex items-center gap-2 text-[12px] text-fg">
                  <span className="w-3.5 shrink-0 text-center text-fg-dim">@</span>
                  <span className="truncate">{visitor.social.replace(/^@/, "")}</span>
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] text-fg-dim">
              Self-declared and unverified. These details live in their browser session only.
            </p>
          </Section>
        )}

        {/* Session */}
        <Section title="Session" icon={<ClockIcon className="h-3 w-3" />}>
          <Row label="On the globe" value={formatDuration(now - visitor.joinedAt)} />
          <Row label="Last ping" value={relativeTime(visitor.lastSeenAt, now)} />
          <Row
            label="Their local time"
            value={
              visitor.gmtOffset != null
                ? `${formatLocalTime(visitor.gmtOffset)} (${formatOffset(visitor.gmtOffset)})`
                : null
            }
          />
          <Row
            label="Timezone"
            value={
              visitor.timezoneId ??
              (visitor.tzSource === "estimated" ? (
                <span className="text-warn">estimated from longitude</span>
              ) : null)
            }
          />
          <Row label="Daylight saving" value={yesNo(visitor.isDst)} />
          <Row label="Device" value={[visitor.device, visitor.os, visitor.browser].filter(Boolean).join(" · ") || null} />
        </Section>

        {/* Location intel */}
        <Section title="ipstack · location">
          <Row label="Coordinates" value={visitor.lat != null ? `${visitor.lat.toFixed(4)}, ${visitor.lon!.toFixed(4)}` : null} />
          <Row label="City" value={visitor.city} />
          <Row label="Region" value={visitor.regionName} />
          <Row label="Postal" value={visitor.zip} />
          <Row label="Country" value={visitor.countryName ? `${visitor.countryName} (${visitor.countryCode})` : null} />
          <Row label="Capital" value={visitor.capital} />
          <Row label="Continent" value={visitor.continentName} />
          <Row label="In the EU" value={yesNo(visitor.isEu)} />
          <Row label="Calling code" value={visitor.callingCode ? `+${visitor.callingCode}` : null} />
          <Row
            label="Languages"
            value={
              visitor.languages.length
                ? visitor.languages.map((l) => l.name ?? l.code).join(", ")
                : null
            }
          />
          <Row
            label="Currency"
            value={
              visitor.currencyCode
                ? `${visitor.currencyCode} ${visitor.currencySymbol ?? ""} — ${visitor.currencyName ?? ""}`.trim()
                : null
            }
          />
        </Section>

        {/* Network intel */}
        <Section title="ipstack · network" icon={<ShieldIcon className="h-3 w-3" />}>
          <Row label="IP" value={visitor.ipMasked} />
          <Row label="Type" value={visitor.ipType} />
          <Row label="Hostname" value={visitor.hostname} />
          <Row label="ASN" value={visitor.asn ? `AS${visitor.asn}` : null} />
          <Row
            label="ISP"
            value={
              visitor.isp ? (
                <>
                  {visitor.isp}
                  {visitor.ispFromDns && <span className="text-fg-dim"> (via rDNS)</span>}
                </>
              ) : null
            }
          />
          <Row label="Connection" value={visitor.connectionType} />
          <Row label="Routing" value={visitor.routingType} />
          <Row label="Org type" value={visitor.organizationType} />
          <Row label="Datacenter / hosting" value={yesNo(visitor.isHosting)} />
          <Row label="Proxy or VPN" value={visitor.isProxy ? (visitor.proxyType ?? "yes") : yesNo(visitor.isProxy)} />
          <Row label="VPN service" value={visitor.vpnService} />
          <Row label="Tor exit" value={yesNo(visitor.isTor)} />
          <Row label="Crawler" value={yesNo(visitor.isCrawler)} />
          <Row
            label="Threat level"
            value={
              visitor.threatLevel ? (
                <span className={visitor.threatLevel === "low" ? "text-[var(--live)]" : "text-warn"}>
                  {visitor.threatLevel}
                </span>
              ) : null
            }
          />
          <p className="mt-1.5 text-[10px] leading-snug text-fg-dim">
            IPs are shown masked.{" "}
            {securityModule
              ? "Proxy, Tor and threat fields come from ipstack's security module."
              : "This ipstack plan has no security module, so the proxy, Tor and threat fields stay empty and the datacenter flag falls back to an ASN-name heuristic."}
          </p>
        </Section>

        <Section title="Raw">
          <button
            type="button"
            onClick={() => setShowRaw((s) => !s)}
            className="mono text-[11px] text-accent transition hover:underline"
          >
            {showRaw ? "hide" : "show"} the object this card was built from
          </button>
          {showRaw && (
            <pre className="scroll-thin mono mt-2 max-h-56 overflow-auto rounded-lg border border-border bg-panel-2 p-2.5 text-[10px] leading-relaxed text-fg-muted">
              {JSON.stringify(visitor, null, 2)}
            </pre>
          )}
        </Section>
      </div>

      {/* Footer action */}
      {!visitor.isYou && (
        <div className="border-t border-border p-3">
          <button
            type="button"
            disabled={waved || visitor.isDemo}
            onClick={() => onWave(visitor.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-panel-2 py-2.5 text-[13px] font-medium transition enabled:hover:border-accent/60 enabled:hover:text-accent disabled:opacity-45"
          >
            <WaveIcon className="h-4 w-4" />
            {visitor.isDemo
              ? "Simulated visitor — nobody to wave at"
              : waved
                ? `You waved at ${visitor.alias}`
                : `Wave at ${visitor.alias}`}
          </button>
          {!visitor.isDemo && (
            <p className="mt-1.5 text-center text-[10px] text-fg-dim">
              A wave posts a line to the shared activity feed everyone can see.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
