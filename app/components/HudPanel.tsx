"use client";

import { useMemo } from "react";
import type { PublicVisitor } from "@/interfaces/visitor.interface";
import { peakOverlapHour, roomReach } from "@/app/lib/handshake";
import { fmtHour } from "@/app/lib/geo";
import { Avatar } from "./Avatar";
import { ApiLayerLogo } from "./ApiLayerLogo";
import { Logo } from "./Logo";
import {
  ExpandIcon,
  HelpIcon,
  MoonIcon,
  RefreshIcon,
  ShareIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "./Icons";

type Props = {
  visitors: PublicVisitor[];
  you: PublicVisitor | null;
  theme: "dark" | "light";
  demoOn: boolean;
  autoRotate: boolean;
  shareLabel: string;
  onToggleTheme: () => void;
  onToggleDemo: () => void;
  onToggleRotate: () => void;
  onRefresh: () => void;
  onShare: () => void;
  onOpenProfile: () => void;
  onSelect: (id: string) => void;
  onFullscreen: () => void;
  onOpenFaq: () => void;
};

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`group relative flex h-7 w-7 items-center justify-center rounded-lg border transition ${
        active
          ? "border-accent/60 bg-[var(--accent-soft)] text-accent"
          : "border-transparent text-fg-dim hover:border-border hover:bg-panel-2 hover:text-fg"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 hidden -translate-x-1/2 rounded-md border border-border bg-panel-solid px-2 py-1 text-[11px] whitespace-nowrap text-fg shadow-lg group-hover:block">
        {label}
      </span>
    </button>
  );
}

function CountRow({
  label,
  items,
}: {
  label: string;
  items: { key: string; icon: string; name: string; count: number }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mono w-[68px] shrink-0 pt-1 text-[10px] tracking-wider text-fg-dim uppercase">
        {label}
      </span>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
        {items.map((i) => (
          <span key={i.key} className="chip">
            <span aria-hidden>{i.icon}</span>
            <span className="max-w-[110px] truncate">{i.name}</span>
            <span className="text-fg-dim">({i.count})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function HudPanel(props: Props) {
  const { visitors, you, theme, demoOn, autoRotate } = props;

  const stats = useMemo(() => {
    const tally = (fn: (v: PublicVisitor) => [string, string, string] | null) => {
      const m = new Map<string, { key: string; icon: string; name: string; count: number }>();
      for (const v of visitors) {
        const t = fn(v);
        if (!t) continue;
        const [key, icon, name] = t;
        const cur = m.get(key);
        if (cur) cur.count++;
        else m.set(key, { key, icon, name, count: 1 });
      }
      return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 6);
    };

    return {
      countries: tally((v) =>
        v.countryName ? [v.countryName, v.countryFlag ?? "🌍", v.countryName] : null
      ),
      timezones: tally((v) =>
        v.timezoneId ? [v.timezoneId, "🕑", v.timezoneId.split("/").pop() ?? v.timezoneId] : null
      ),
      devices: tally((v) =>
        v.device
          ? [v.device, v.device === "Mobile" ? "📱" : v.device === "Tablet" ? "📲" : "🖥️", v.device]
          : null
      ),
      reach: roomReach(visitors),
      peak: peakOverlapHour(visitors),
    };
  }, [visitors]);

  const cluster = visitors.slice(0, 3);

  return (
    <div className="panel pointer-events-auto w-[min(92vw,470px)] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Logo size={26} className="shrink-0 rounded-[6px]" />
          <span className="text-[15px] font-semibold tracking-tight">CollabFab</span>
          <a
            href="https://apilayer.com/"
            target="_blank"
            rel="noreferrer noopener"
            title="Built with ipstack by APILayer"
            className="hidden items-center gap-1.5 border-l border-border pl-2 transition hover:opacity-80 sm:flex"
          >
            <span className="mono text-[9px] tracking-wider text-fg-dim uppercase">by</span>
            <ApiLayerLogo size={11} />
          </a>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div className="mr-1 hidden -space-x-2 sm:flex">
            {cluster.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => props.onSelect(v.id)}
                title={v.alias}
                className="transition hover:z-10 hover:-translate-y-0.5"
              >
                <Avatar seed={v.id} size={22} ring={v.isYou ? "var(--live)" : "var(--panel-solid)"} />
              </button>
            ))}
          </div>
          <ToolButton label="Your profile" onClick={props.onOpenProfile}>
            <UserIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            label={theme === "dark" ? "Switch to light" : "Switch to dark"}
            onClick={props.onToggleTheme}
          >
            {theme === "dark" ? <MoonIcon className="h-3.5 w-3.5" /> : <SunIcon className="h-3.5 w-3.5" />}
          </ToolButton>
          <ToolButton label={props.shareLabel} onClick={props.onShare}>
            <ShareIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            label={demoOn ? "Hide simulated crowd" : "Show simulated crowd"}
            active={demoOn}
            onClick={props.onToggleDemo}
          >
            <UsersIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            label={autoRotate ? "Stop rotation" : "Auto-rotate"}
            active={autoRotate}
            onClick={props.onToggleRotate}
          >
            <RefreshIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label="How this works" onClick={props.onOpenFaq}>
            <HelpIcon className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label="Fullscreen" onClick={props.onFullscreen}>
            <ExpandIcon className="h-3.5 w-3.5" />
          </ToolButton>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: "var(--live)" }} />
        <span className="font-semibold">{visitors.length}</span>
        <span className="text-fg-muted">
          {visitors.length === 1 ? "explorer" : "explorers"} on
        </span>
        <span className="mono rounded-md border border-border bg-panel-2 px-1.5 py-0.5 text-[12px]">
          collabfab
        </span>
        {stats.peak && (
          <span className="text-fg-dim">
            (peak overlap: {fmtHour(stats.peak.hour)} UTC · {stats.peak.awake}/{stats.peak.total}
            {" "}awake)
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2 border-t border-border pt-3">
        <CountRow label="Countries" items={stats.countries} />
        <CountRow label="Timezones" items={stats.timezones} />
        <CountRow label="Devices" items={stats.devices} />
      </div>

      {you && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-[11px] text-fg-dim">
          <span className="mono">you are</span>
          <button
            type="button"
            onClick={() => props.onSelect(you.id)}
            className="mono text-fg underline decoration-dotted underline-offset-2 transition hover:text-accent"
          >
            {you.alias}
          </button>
          <span className="mono">
            · {[you.city, you.countryName].filter(Boolean).join(", ") || "locating…"}
          </span>
          <button
            type="button"
            onClick={props.onRefresh}
            title="Re-run the ipstack lookup — use this after switching VPN or network"
            className="mono text-fg-dim underline decoration-dotted underline-offset-2 transition hover:text-accent"
          >
            re-check
          </button>
          {!you.hasProfile && (
            <button
              type="button"
              onClick={props.onOpenProfile}
              className="mono ml-auto shrink-0 rounded-md border border-accent/50 bg-[var(--accent-soft)] px-2 py-0.5 text-accent transition hover:brightness-110"
            >
              add your details →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
