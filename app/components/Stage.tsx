"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PresencePayload, PublicVisitor } from "@/interfaces/visitor.interface";
import { handshake } from "@/app/lib/handshake";
import { demoVisitors } from "@/app/lib/demo";
import { setTheme, useTheme } from "@/app/lib/useTheme";
import { GlobeView } from "./GlobeView";
import { HudPanel } from "./HudPanel";
import { ActivityFeed } from "./ActivityFeed";
import { VisitorCard } from "./VisitorCard";
import { ProfileSheet } from "./ProfileSheet";
import { MatchStrip } from "./MatchStrip";
import { AttributionBanner } from "./ApiBanner";
import { FaqModal } from "./FaqModal";
import { BASE_PATH } from "@/app/lib/basePath";

const POLL_MS = 4000;

export function Stage() {
  const [payload, setPayload] = useState<PresencePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const [demoOn, setDemoOn] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [waved, setWaved] = useState<Set<string>>(new Set());
  const [shareLabel, setShareLabel] = useState("Copy share link");
  const [focusToken, setFocusToken] = useState<{ id: string; lat: number; lon: number } | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  // Ticking clock for "2 minutes ago" style labels, independent of polling.
  // Five seconds is plenty for relative timestamps and costs a fifth of the
  // renders a one-second tick did.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const poll = useCallback(async (refresh = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch(`${BASE_PATH}/api/presence${refresh ? "?refresh=1" : ""}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Presence failed (${res.status})`);
      setPayload(json as PresencePayload);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      inFlight.current = false;
    }
  }, []);

  // Heartbeat kick-off, deferred a tick so the first render commits before any
  // state lands (see the polling effect below for the recurring schedule).
  useEffect(() => {
    const id = setTimeout(() => poll(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat. Pauses while the tab is hidden so a background tab doesn't hold
  // a phantom visitor on everyone else's globe.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => poll(), POLL_MS);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void poll();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  const you = payload?.you ?? null;

  // Built once, not per clock tick: the simulated crowd is static data, and
  // re-deriving it every second churned every downstream memo and every DOM
  // marker on the globe.
  const demoCrowd = useMemo(() => demoVisitors(), []);

  const visitors = useMemo<PublicVisitor[]>(() => {
    const real = payload?.visitors ?? [];
    return demoOn ? [...real, ...demoCrowd] : real;
  }, [payload?.visitors, demoOn, demoCrowd]);

  // Everyone else, ranked by Handshake score — this drives both the arcs and
  // the "who's worth talking to" strip.
  const ranked = useMemo(() => {
    if (!you) return [];
    return visitors
      .filter((v) => !v.isYou)
      .map((v) => ({ visitor: v, score: handshake(you, v) }))
      .sort((a, b) => b.score.score - a.score.score);
  }, [visitors, you]);

  const matchTargetIds = useMemo(
    () => ranked.slice(0, 3).filter((r) => r.score.score >= 25).map((r) => r.visitor.id),
    [ranked]
  );

  const selected = useMemo(
    () => visitors.find((v) => v.id === selectedId) ?? null,
    [visitors, selectedId]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setProfileOpen(false);
        setFaqOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      setProfileOpen(false);
      const v = visitors.find((x) => x.id === id);
      if (v?.lat != null && v.lon != null) {
        setFocusToken({ id, lat: v.lat, lon: v.lon });
      }
    },
    [visitors]
  );

  const selectByAlias = useCallback(
    (alias: string) => {
      const v = visitors.find((x) => x.alias === alias);
      if (v) select(v.id);
    },
    [visitors, select]
  );

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Link copied");
    } catch {
      setShareLabel("Copy failed — copy the URL");
    }
    setTimeout(() => setShareLabel("Copy share link"), 2200);
  }

  async function wave(id: string) {
    setWaved((s) => new Set(s).add(id));
    try {
      await fetch(`${BASE_PATH}/api/wave`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetId: id }),
      });
      poll();
    } catch {
      /* the optimistic state is good enough for a wave */
    }
  }

  function fullscreen() {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  const alone = (payload?.visitors.length ?? 0) <= 1 && !demoOn;

  return (
    <div ref={stageRef} className="sky relative h-full w-full overflow-hidden">
      <div className="stars pointer-events-none absolute inset-0" />

      {/* The stage itself */}
      <div className="absolute inset-0" onClick={() => setSelectedId(null)}>
        <GlobeView
          visitors={visitors}
          selectedId={selectedId}
          matchTargetIds={matchTargetIds}
          youLat={you?.lat ?? null}
          youLon={you?.lon ?? null}
          autoRotate={autoRotate && !selectedId}
          theme={theme}
          onSelect={select}
          onReady={() => setReady(true)}
          onUserInteract={() => setAutoRotate(false)}
          focusToken={focusToken}
        />
      </div>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="mono text-xs text-fg-dim">spinning up the globe…</span>
        </div>
      )}

      {/* HUD */}
      <div className="pointer-events-none absolute top-4 left-4 z-20">
        <HudPanel
          visitors={visitors}
          you={you}
          theme={theme}
          demoOn={demoOn}
          autoRotate={autoRotate}
          shareLabel={shareLabel}
          onToggleTheme={toggleTheme}
          onToggleDemo={() => setDemoOn((d) => !d)}
          onToggleRotate={() => setAutoRotate((r) => !r)}
          onRefresh={() => poll(true)}
          onShare={share}
          onOpenProfile={() => {
            setProfileOpen(true);
            setSelectedId(null);
          }}
          onSelect={select}
          onFullscreen={fullscreen}
          onOpenFaq={() => setFaqOpen(true)}
        />
        {error && (
          <div className="panel mt-3 max-w-[470px] border-danger/40 p-3 text-[12px] text-danger">
            {error}
          </div>
        )}
        {!error && payload?.apiMeta.notice && (
          <div className="panel mt-3 max-w-[470px] p-3 text-[12px] text-warn">
            {payload.apiMeta.notice}
          </div>
        )}
        {alone && !error && (
          <div className="panel mt-3 w-[min(92vw,470px)] p-3.5">
            <p className="text-[13px] text-fg">No one else is here yet.</p>
            <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">
              CollabFab works when there are people in it. Send the link to someone
              you&apos;d want to build with and they&apos;ll appear within seconds — or switch
              on the simulated crowd to see how a busy room behaves.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={share}
                className="mono rounded-lg border border-border bg-panel-2 px-2.5 py-1.5 text-[11px] transition hover:border-accent/60 hover:text-accent"
              >
                {shareLabel}
              </button>
              <button
                type="button"
                onClick={() => setDemoOn(true)}
                className="mono rounded-lg border border-border bg-panel-2 px-2.5 py-1.5 text-[11px] transition hover:border-accent/60 hover:text-accent"
              >
                Show simulated crowd
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ranked matches — stands down while a card or the profile owns the rail */}
      {ranked.length > 0 && !selected && !profileOpen && (
        <div className="pointer-events-none absolute top-4 right-4 z-20">
          <MatchStrip ranked={ranked} onSelect={select} selectedId={selectedId} />
        </div>
      )}

      {/* Activity */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20">
        <ActivityFeed items={payload?.activity ?? []} now={now} onSelect={selectByAlias} />
      </div>

      {/* Popups */}
      {selected && (
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-4 sm:justify-end sm:p-6"
          onClick={() => setSelectedId(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
            <VisitorCard
              visitor={selected}
              you={you}
              now={now}
              securityModule={payload?.apiMeta.modules.security ?? false}
              onClose={() => setSelectedId(null)}
              onWave={wave}
              waved={waved.has(selected.id)}
            />
          </div>
        </div>
      )}

      {profileOpen && (
        <div
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-4 sm:justify-end sm:p-6"
          onClick={() => setProfileOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="pointer-events-auto">
            <ProfileSheet
              key={you?.id ?? "pending"}
              you={you}
              onClose={() => setProfileOpen(false)}
              onSaved={(v) => {
                setPayload((p) =>
                  p
                    ? {
                        ...p,
                        you: v,
                        visitors: p.visitors.map((x) => (x.id === v.id ? v : x)),
                      }
                    : p
                );
                poll();
              }}
            />
          </div>
        </div>
      )}

      {faqOpen && <FaqModal onClose={() => setFaqOpen(false)} />}

      <AttributionBanner />
    </div>
  );
}
