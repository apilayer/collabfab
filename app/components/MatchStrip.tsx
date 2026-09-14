"use client";

import { useState } from "react";
import type { PublicVisitor } from "@/interfaces/visitor.interface";
import type { Handshake } from "@/app/lib/handshake";
import { Avatar } from "./Avatar";
import { SparkIcon } from "./Icons";

const BAND_COLOR: Record<Handshake["band"], string> = {
  hot: "#ef4444",
  warm: "#f59e0b",
  cool: "#64748b",
  cold: "#3b82f6",
};

/**
 * The ranked right-hand rail: who on the globe is actually worth a message,
 * newest signal first. Mirrors the arcs drawn on the globe.
 */
export function MatchStrip({
  ranked,
  selectedId,
  onSelect,
}: {
  ranked: { visitor: PublicVisitor; score: Handshake }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const top = ranked.slice(0, 6);

  return (
    <div className="panel pointer-events-auto w-[min(88vw,278px)] p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 text-left"
      >
        <SparkIcon className="h-3 w-3 text-accent" />
        <span className="mono text-[10px] tracking-wider text-fg-dim uppercase">
          Handshake ranking
        </span>
        <span className="mono ml-auto text-[10px] text-fg-dim">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <>
          <ul className="mt-2.5 space-y-1">
            {top.map(({ visitor, score }) => (
              <li key={visitor.id}>
                <button
                  type="button"
                  onClick={() => onSelect(visitor.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border p-1.5 text-left transition ${
                    selectedId === visitor.id
                      ? "border-accent/60 bg-[var(--accent-soft)]"
                      : "border-transparent hover:border-border hover:bg-panel-2"
                  }`}
                >
                  <Avatar seed={visitor.id} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="truncate text-[12px] font-medium">
                        {visitor.displayName || visitor.alias}
                      </span>
                      {visitor.isDemo && (
                        <span className="mono shrink-0 text-[8px] tracking-wider text-warn uppercase">
                          sim
                        </span>
                      )}
                    </span>
                    <span className="mono block truncate text-[10px] text-fg-dim">
                      {score.overlapWindow ?? visitor.countryName ?? "—"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end">
                    <span
                      className="mono text-[13px] font-semibold"
                      style={{ color: BAND_COLOR[score.band] }}
                    >
                      {score.score}
                    </span>
                    <span className="mt-0.5 block h-[3px] w-9 rounded-full bg-panel-2">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${score.score}%`,
                          background: BAND_COLOR[score.band],
                        }}
                      />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-border pt-2 text-[10px] leading-snug text-fg-dim">
            Who&apos;s worth reaching out to, scored on shared working hours, language,
            interests, distance and network — open anyone for the full breakdown.
          </p>
        </>
      )}
    </div>
  );
}
