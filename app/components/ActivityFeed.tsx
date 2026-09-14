"use client";

import type { ActivityItem } from "@/interfaces/visitor.interface";
import { relativeTime } from "@/app/lib/geo";
import { Avatar } from "./Avatar";

const VERB: Record<string, string> = {
  joined: "appeared on the globe",
  profile: "filled in their profile",
  profile_update: "updated their profile",
  wave: "waved at",
  left: "dropped off the globe",
};

export function ActivityFeed({
  items,
  now,
  onSelect,
}: {
  items: ActivityItem[];
  now: number;
  onSelect: (alias: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="panel pointer-events-auto w-[min(92vw,420px)] p-3.5">
        <p className="mono text-[11px] tracking-wider text-fg-dim uppercase">Activity</p>
        <p className="mt-2 text-[13px] text-fg-muted">
          Nothing yet. Open this page in another browser — or send someone the link — and
          watch them land here.
        </p>
      </div>
    );
  }

  return (
    <div className="panel feed-mask pointer-events-auto w-[min(92vw,420px)]">
      <div className="scroll-thin max-h-[38vh] overflow-y-auto p-3.5">
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.id} className="slide-in flex items-start gap-2.5">
              <Avatar seed={it.visitorId} size={22} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug">
                  <button
                    type="button"
                    onClick={() => onSelect(it.alias)}
                    className="font-semibold transition hover:text-accent"
                  >
                    {it.alias}
                  </button>
                  {it.countryName && (
                    <span className="text-fg-muted">
                      {" "}
                      from {it.countryCode ? flagOf(it.countryCode) : ""} {it.countryName}
                    </span>
                  )}{" "}
                  <span className="text-fg-muted">{VERB[it.kind] ?? it.kind}</span>
                  {it.detail && (
                    <span className="mono ml-1 rounded bg-panel-2 px-1.5 py-0.5 text-[11px]">
                      {it.detail}
                    </span>
                  )}
                </p>
                <p className="mono text-[10px] text-fg-dim">
                  {relativeTime(it.createdAt, now)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** ISO-3166 alpha-2 → regional-indicator flag emoji. */
function flagOf(cc: string) {
  if (cc.length !== 2) return "";
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
