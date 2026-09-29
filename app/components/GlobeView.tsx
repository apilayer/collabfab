"use client";

import { useEffect, useRef, useState } from "react";
import type { GlobeInstance } from "globe.gl";
import * as THREE from "three";
import type { Material, MeshPhongMaterial, Texture } from "three";
import {
  TILE_ALTITUDE_THRESHOLD,
  TILE_NEEDS_INVERT,
  fitTiles,
  tileUrl,
  type Tile,
  type ViewSpan,
} from "@/app/lib/tiles";
import { loadTileBitmap } from "@/app/lib/tileCache";
import type { PublicVisitor } from "@/interfaces/visitor.interface";
import { accentFor, avatarSvg } from "@/app/lib/avatar";
import { assetPath } from "@/app/lib/assets";

type Props = {
  visitors: PublicVisitor[];
  selectedId: string | null;
  matchTargetIds: string[];
  youLat: number | null;
  youLon: number | null;
  autoRotate: boolean;
  theme: "dark" | "light";
  onSelect: (id: string) => void;
  onReady: () => void;
  /** Fired the first time the viewer grabs the camera, so idle spin gives way. */
  onUserInteract: () => void;
  focusToken: { id: string; lat: number; lon: number } | null;
};

/** A tile on the globe; `carry` marks the previous set held underneath. */
type PlacedTile = Tile & { carry?: boolean };

type LabelKind = "country" | "capital" | "city" | "ocean";

type PlaceLabel = { t: string; lat: number; lng: number; k: LabelKind; r: number };

type StateFeature = {
  geometry: { type: "LineString" | "MultiLineString"; coordinates: unknown };
};

// Relative type sizes on the globe surface, in globe radii.
const LABEL_SIZE: Record<LabelKind, number> = {
  country: 0.52,
  capital: 0.34,
  city: 0.3,
  ocean: 0.62,
};

const LABEL_VAR: Record<LabelKind, string> = {
  country: "--label-country",
  capital: "--label-city",
  city: "--label-city",
  ocean: "--label-ocean",
};

/** Cached tile textures held at once; ~260 KB each, so this bounds GPU memory. */
const TEXTURE_CACHE_LIMIT = 220;

/** Camera altitude bounds, in globe radii (radius 100 ⇒ 0.0001 ≈ 640 m up). */
const MIN_ALTITUDE = 0.00005;
/** Above this altitude the globe is too curved for cursor anchoring to help. */
const CURSOR_ANCHOR_ALTITUDE = 0.9;
const MAX_ALTITUDE = 4;

/**
 * Measure what the camera can actually see by unprojecting a grid of screen
 * points back onto the globe. A flat-plane estimate from the camera altitude
 * badly understates this — toward the edges of the frame the surface curves
 * away and each pixel covers far more ground — which left the tile grid smaller
 * than the viewport and the screen only part-covered.
 *
 * Samples that miss the globe entirely (sky beyond the horizon) are ignored;
 * the widest hit in each direction sets the span.
 */
function measureSpan(
  globe: GlobeInstance,
  el: HTMLElement,
  pov: { lat: number; lng: number; altitude: number }
): ViewSpan {
  const w = el.clientWidth;
  const h = el.clientHeight;
  const STEPS = 6;
  let halfLat = 0;
  let halfLng = 0;
  let hits = 0;

  for (let i = 0; i <= STEPS; i++) {
    for (let j = 0; j <= STEPS; j++) {
      const p = globe.toGlobeCoords((i / STEPS) * w, (j / STEPS) * h);
      if (!p) continue;
      hits++;
      halfLat = Math.max(halfLat, Math.abs(p.lat - pov.lat));
      halfLng = Math.max(halfLng, Math.abs(shortestLngDelta(pov.lng, p.lng)));
    }
  }

  // Every sample missed the globe (or it fills less than one grid cell): fall
  // back to the nadir approximation rather than returning a zero-sized span.
  if (hits === 0) {
    const groundKm = 0.93 * pov.altitude * 6371;
    const cos = Math.max(0.08, Math.cos((pov.lat * Math.PI) / 180));
    return {
      halfLat: groundKm / 2 / 110.57,
      halfLng: groundKm / 2 / (111.32 * cos),
    };
  }

  // A little slack so a tile edge never shows through while the camera drifts.
  return { halfLat: halfLat * 1.08, halfLng: halfLng * 1.08 };
}

/** Signed shortest way around the antimeridian, in degrees. */
function shortestLngDelta(from: number, to: number) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

const cssVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/** Build the DOM for one visitor marker — reused verbatim by the 2-D map. */
export function markerHtml(v: PublicVisitor, size = 44): string {
  const accent = accentFor(v.id);
  const classes = [
    "marker",
    v.isYou ? "marker-you" : "",
    v.isDemo ? "marker-demo" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const label = v.displayName ? `${v.displayName} · ${v.alias}` : v.alias;
  return `<div class="${classes}" style="width:${size}px;height:${size}px">
    ${v.isYou ? '<span class="ping"></span>' : ""}
    <span class="marker-face" style="display:block;width:${size}px;height:${size}px">${avatarSvg(v.id, size)}</span>
    <span class="marker-dot" style="background:${accent}"></span>
    <span class="marker-label mono">${escapeHtml(label)}</span>
  </div>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  );
}

export function GlobeView({
  visitors,
  selectedId,
  matchTargetIds,
  youLat,
  youLon,
  autoRotate,
  theme,
  onSelect,
  onReady,
  onUserInteract,
  focusToken,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const onSelectRef = useRef(onSelect);
  const onInteractRef = useRef(onUserInteract);
  const didInitialPov = useRef(false);
  const themeRef = useRef(theme);
  const labelsRef = useRef<object[]>([]);
  const countriesRef = useRef<object[]>([]);
  const pathsRef = useRef<[number, number][][]>([]);
  const materialCache = useRef(
    new Map<string, { material: Material & { map?: Texture | null }; ready: Promise<void> }>()
  );
  const tileRequestRef = useRef(0);
  const carryOverRef = useRef<Tile[]>([]);
  const appliedTilesRef = useRef("");
  const pendingPovRef = useRef<{ lat: number; lng: number; altitude: number } | null>(null);
  const pendingSinceRef = useRef<number | null>(null);
  const zoomTargetRef = useRef<number | null>(null);
  const zoomEaseRef = useRef<number | null>(null);
  const [zoomedIn, setZoomedIn] = useState(false);
  const zoomRafRef = useRef<number | null>(null);
  const tileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Declared first so these are up to date before the effects below re-run.
  useEffect(() => {
    onSelectRef.current = onSelect;
    onInteractRef.current = onUserInteract;
    themeRef.current = theme;
  });

  // Boot the WebGL globe once. globe.gl pulls in three.js, so it is imported
  // lazily inside the effect to keep it off the server and out of first paint.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const host = hostRef.current;
      if (!host || globeRef.current) return;

      const [{ default: Globe }, countries, states, labels] = await Promise.all([
        import("globe.gl"),
        fetch(assetPath("/countries.geojson")).then(
          (r) => r.json() as Promise<{ features: object[] }>
        ),
        fetch(assetPath("/states.geojson")).then(
          (r) => r.json() as Promise<{ features: StateFeature[] }>
        ),
        fetch(assetPath("/labels.json")).then((r) => r.json() as Promise<PlaceLabel[]>),
      ]);
      if (cancelled || !hostRef.current) return;

      // Admin-1 borders arrive as line features; flatten MultiLineStrings so
      // every path is a single run of [lng, lat] pairs.
      const paths: [number, number][][] = states.features.flatMap((f) =>
        f.geometry.type === "MultiLineString"
          ? (f.geometry.coordinates as [number, number][][])
          : [f.geometry.coordinates as [number, number][]]
      );

      // Held so the vector globe can be restored when zooming back out.
      labelsRef.current = labels;
      countriesRef.current = countries.features;
      pathsRef.current = paths;

      const g: GlobeInstance = new Globe(host, {
        // Near-uniform depth precision from orbit down to street height; without
        // it the near plane can't come in far enough without the globe and the
        // tile shell z-fighting into each other.
        rendererConfig: { logarithmicDepthBuffer: true },
      })
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor(cssVar("--accent", "#5b8cff"))
        .atmosphereAltitude(0.19)
        .polygonsData(countries.features)
        .polygonCapColor(() => cssVar("--globe-land", "#23252f"))
        .polygonSideColor(() => "rgba(0,0,0,0.16)")
        .polygonStrokeColor(() => cssVar("--globe-stroke", "rgba(255,255,255,0.14)"))
        .polygonAltitude(() => 0.008)
        .polygonLabel(() => "")
        .pathsData(paths)
        .pathPoints((d) => d as [number, number][])
        .pathPointLat((p) => (p as [number, number])[1])
        .pathPointLng((p) => (p as [number, number])[0])
        .pathPointAlt(0.009)
        .pathColor(() => cssVar("--globe-border", "rgba(255,255,255,0.09)"))
        .pathStroke(0.4)
        .pathResolution(4)
        .labelsData(labels)
        .labelLat((d) => (d as PlaceLabel).lat)
        .labelLng((d) => (d as PlaceLabel).lng)
        .labelText((d) => (d as PlaceLabel).t)
        .labelSize((d) => LABEL_SIZE[(d as PlaceLabel).k])
        .labelColor((d) => cssVar(LABEL_VAR[(d as PlaceLabel).k], "#8a90ab"))
        .labelIncludeDot((d) => (d as PlaceLabel).k !== "ocean" && (d as PlaceLabel).k !== "country")
        .labelDotRadius(0.13)
        .labelAltitude(0.012)
        .labelResolution(1)
        .htmlAltitude(0.035)
        .htmlTransitionDuration(300)
        .arcStroke(0.6)
        .arcAltitudeAutoScale(0.42)
        .arcDashLength(0.42)
        .arcDashGap(0.22)
        .arcDashAnimateTime(2200);

      (g.globeMaterial() as MeshPhongMaterial).color.set(
        cssVar("--globe-ocean", "#0a0c1a")
      );

      // globe.gl picks 0.05 to stay clear of z-fighting; the logarithmic depth
      // buffer above removes that constraint, and a nearer plane is what makes
      // the last few zoom levels reachable.
      const camera = g.camera() as unknown as {
        near: number;
        updateProjectionMatrix: () => void;
      };
      camera.near = 0.002;
      camera.updateProjectionMatrix();

      const controls = g.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.minDistance = 100 + MIN_ALTITUDE * 100;
      controls.maxDistance = 620;

      // OrbitControls dollies linearly in *distance* from the globe's centre,
      // which on a globe means the last three wheel notches cover everything
      // from continent to doorstep — the zoom feels stuck, then teleports.
      // Zooming the *altitude* geometrically instead gives an even descent all
      // the way to street level, and anchoring on the cursor lets you actually
      // steer to a place rather than only to the middle of the screen.
      controls.enableZoom = false;
      host.addEventListener("wheel", onWheel, { passive: false });
      host.addEventListener("pointerdown", stopIdleSpin);

      g.onZoom((pov) => {
        // Spinning the planet while someone is reading street names is the
        // wrong default, so rotation parks itself once the tiles take over.
        setZoomedIn(pov.altitude <= TILE_ALTITUDE_THRESHOLD);
        // Fires every frame of a gesture; coalesce to one recalculation per
        // animation frame, then debounce the network work inside updateTiles.
        if (zoomRafRef.current != null) return;
        zoomRafRef.current = requestAnimationFrame(() => {
          zoomRafRef.current = null;
          scheduleTiles(pov.lat, pov.lng, pov.altitude);
        });
      });

      g.pointOfView({ lat: 20, lng: 0, altitude: 2.4 }, 0);

      globeRef.current = g;
      resize();
      onReady();

      // Dev-only handle so the globe can be inspected and driven from the
      // console (and from the browser-based smoke tests). Never shipped.
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __globe?: GlobeInstance }).__globe = g;
      }

      // ── Tile engine ───────────────────────────────────────────────────
      // Above the threshold the cartoon vector globe is what you see. Below
      // it, real CARTO raster tiles are laid over the surface at whatever
      // zoom matches the camera, so the same scene keeps resolving down to
      // street names. Vector country labels step aside while tiles are on,
      // since the raster carries its own.
      /**
       * Remember the camera's latest resting place; the actual tile work is
       * debounced so a wheel gesture that sweeps through six zoom levels only
       * fetches the one it stops at.
       */
      function scheduleTiles(lat: number, lng: number, altitude: number) {
        pendingPovRef.current = { lat, lng, altitude };
        const now = Date.now();
        if (pendingSinceRef.current == null) pendingSinceRef.current = now;

        // A rotating globe fires `change` every frame, so a plain trailing
        // debounce would never settle. Cap the wait so tiles still arrive.
        if (now - pendingSinceRef.current > 400) {
          if (tileTimerRef.current != null) clearTimeout(tileTimerRef.current);
          tileTimerRef.current = null;
          pendingSinceRef.current = null;
          applyTiles();
          return;
        }

        if (tileTimerRef.current != null) clearTimeout(tileTimerRef.current);
        tileTimerRef.current = setTimeout(() => {
          tileTimerRef.current = null;
          pendingSinceRef.current = null;
          applyTiles();
        }, 140);
      }

      function applyTiles() {
        const globe = globeRef.current;
        const el = hostRef.current;
        const pov = pendingPovRef.current;
        if (!globe || globe !== globeRef.current || !el || !pov) return;

        if (pov.altitude > TILE_ALTITUDE_THRESHOLD) {
          if (appliedTilesRef.current !== "") {
            appliedTilesRef.current = "";
            carryOverRef.current = [];
            globe
              .tilesData([])
              .polygonsData(countriesRef.current)
              .pathsData(pathsRef.current)
              .labelsData(labelsRef.current);
          }
          return;
        }

        const span = measureSpan(globe, el, pov);
        const { tiles } = fitTiles(pov.lat, pov.lng, span, el.clientWidth);

        // Only the *applied* set is recorded, and only once it is actually on
        // the globe — a superseded computation must never claim a signature,
        // or the camera settling back onto it would be silently ignored.
        const signature = tiles.map((t) => t.key).join("|");
        if (signature === appliedTilesRef.current) return;

        const currentTheme = themeRef.current;
        const visible = new Set(tiles.map((t) => `${currentTheme}:${t.key}`));

        /**
         * Materials are created up front so their textures start loading, but
         * the globe isn't switched over to them until they've arrived — see the
         * preload below. Returns the material plus a promise for its texture.
         */
        const materialFor = (t: Tile): { material: Material; ready: Promise<void> } => {
          const cacheKey = `${currentTheme}:${t.key}`;
          const cached = materialCache.current.get(cacheKey);
          if (cached) {
            // Re-insert so Map iteration order doubles as LRU recency.
            materialCache.current.delete(cacheKey);
            materialCache.current.set(cacheKey, cached);
            return { material: cached.material, ready: cached.ready };
          }

          const invert = TILE_NEEDS_INVERT && currentTheme === "dark";
          // Basic, not Lambert: a basemap should read the same on the night
          // side of the globe as on the day side.
          const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
          });
          if (invert) {
            // Invert OSM's light style, drop most of the remaining colour,
            // then push it toward the app's blue-slate palette so the basemap
            // reads as part of the same scene as the vector globe it replaces.
            material.onBeforeCompile = (shader) => {
              shader.fragmentShader = shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `#include <dithering_fragment>
                 vec3 inv = vec3(1.0) - gl_FragColor.rgb;
                 float l = dot(inv, vec3(0.299, 0.587, 0.114));
                 vec3 tint = mix(vec3(0.055, 0.065, 0.115), vec3(0.62, 0.66, 0.78), l);
                 gl_FragColor.rgb = mix(vec3(l), tint, 0.85);`
              );
            };
            // Without this, three reuses the un-inverted compiled program.
            material.customProgramCacheKey = () => "osm-invert";
          }

          const ready = loadTileBitmap(tileUrl(t)).then((bitmap) => {
            if (!bitmap) return; // Missing tile: stays transparent, globe shows through.
            const texture = new THREE.Texture(bitmap);
            texture.colorSpace = THREE.SRGBColorSpace;
            // The bitmap was already flipped during decode.
            texture.flipY = false;
            // Tiles are drawn at roughly 1:1, so mipmaps buy nothing and cost
            // both a third more GPU memory and a main-thread build per tile.
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.needsUpdate = true;
            material.map = texture;
            material.opacity = 1;
            material.needsUpdate = true;
          });

          materialCache.current.set(cacheKey, { material, ready });

          // Bound the cache so a long session can't grow GPU memory without
          // limit — roughly three screens of tiles — evicting least-recently
          // -used first and never anything currently on screen.
          while (materialCache.current.size > TEXTURE_CACHE_LIMIT) {
            const victim = [...materialCache.current.keys()].find((k) => !visible.has(k));
            if (!victim) break;
            const stale = materialCache.current.get(victim);
            stale?.material.map?.dispose();
            stale?.material.dispose();
            materialCache.current.delete(victim);
          }
          return { material, ready };
        };

        const entries = new Map(tiles.map((t) => [t.key, materialFor(t)]));

        // Carry the previous set underneath the new one. A coarser zoom level
        // covers the same ground with fewer, already-decoded tiles, so there is
        // something to look at the instant the camera settles instead of a
        // blank globe while forty fresh tiles come down the wire.
        const carried: PlacedTile[] = carryOverRef.current
          .filter((t) => {
            const entry = materialCache.current.get(`${currentTheme}:${t.key}`);
            return entry?.material.map != null;
          })
          .map((t) => ({ ...t, carry: true }));

        const placed: PlacedTile[] = [...carried, ...tiles];
        const base = Math.min(0.02, Math.max(0.00001, pov.altitude * 0.2));
        const myRequest = ++tileRequestRef.current;

        globe
          .tilesData(placed)
          .tileLat((d) => (d as PlacedTile).lat)
          .tileLng((d) => (d as PlacedTile).lng)
          .tileWidth((d) => (d as PlacedTile).width)
          .tileHeight((d) => (d as PlacedTile).height)
          // The camera comes to within 0.06 globe units of the surface, so a
          // fixed shell height would end up *above* it and render nothing.
          // Track the camera instead, staying high enough to clear the depth
          // buffer's precision at this distance and low enough to stay under it.
          // Carried tiles sit just below so the incoming set draws over them.
          .tileAltitude((d) => ((d as PlacedTile).carry ? base * 0.55 : base))
          .tileUseGlobeProjection(true)
          .tileCurvatureResolution(3)
          .tileMaterial((d) => {
            const t = d as PlacedTile;
            const entry =
              entries.get(t.key) ??
              materialCache.current.get(`${currentTheme}:${t.key}`);
            return entry!.material;
          })
          .tilesTransitionDuration(0);

        appliedTilesRef.current = signature;
        carryOverRef.current = tiles;

        // Once the incoming set has fully decoded, drop the carried layer so we
        // aren't paying for two shells, and let the raster own the surface.
        void Promise.all([...entries.values()].map((e) => e.ready)).then(() => {
          if (tileRequestRef.current !== myRequest || globeRef.current !== globe) return;
          globe
            .tilesData(tiles)
            // Below the threshold the raster basemap is the map: the 110m
            // vector shells would otherwise tower over a street-height camera.
            .polygonsData([])
            .pathsData([])
            .labelsData([]);
        });
      }
    })();

    function stopIdleSpin() {
      const g = globeRef.current;
      if (g?.controls().autoRotate) {
        g.controls().autoRotate = false;
        onInteractRef.current();
      }
    }

    function onWheel(event: WheelEvent) {
      const g = globeRef.current;
      const el = hostRef.current;
      if (!g || !el) return;
      event.preventDefault();
      stopIdleSpin();

      const pov = g.pointOfView();
      const step = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

      // Accumulate onto the pending target, not the camera's current position,
      // so a fast flick of the wheel doesn't get swallowed by the easing that
      // is still catching up from the previous notch.
      const from = zoomTargetRef.current ?? pov.altitude;
      const altitude = Math.max(
        MIN_ALTITUDE,
        Math.min(MAX_ALTITUDE, from * Math.exp(step * 0.0025))
      );
      zoomTargetRef.current = altitude;

      // Zoom to cursor: when the view shrinks by a factor k, the centre has to
      // travel (1 − k) of the way to the point under the pointer for that point
      // to stay put. Applied immediately — only the altitude is eased, so this
      // never fights a drag in progress.
      const rect = el.getBoundingClientRect();
      const under = g.toGlobeCoords(
        event.clientX - rect.left,
        event.clientY - rect.top
      );
      if (under && pov.altitude < CURSOR_ANCHOR_ALTITUDE) {
        const k = altitude / from;
        // Ease the anchoring in near the threshold so it never snaps on.
        const ramp = Math.min(1, (CURSOR_ANCHOR_ALTITUDE - pov.altitude) / 0.4);
        const pull = Math.max(-1, Math.min(1, 1 - k)) * ramp;
        g.pointOfView(
          {
            lat: pov.lat + (under.lat - pov.lat) * pull,
            lng: pov.lng + shortestLngDelta(pov.lng, under.lng) * pull,
          },
          0
        );
      }

      startZoomEase();
    }

    /**
     * Ease the camera toward the pending altitude instead of snapping to it on
     * every wheel event. Snapping put a discontinuity in the camera path each
     * notch, which OrbitControls' damping then chased — the two together are
     * what made zooming feel jerky. Interpolating in log space keeps the
     * apparent speed constant at every scale.
     */
    function startZoomEase() {
      if (zoomEaseRef.current != null) return;

      const tick = () => {
        const g = globeRef.current;
        const target = zoomTargetRef.current;
        if (!g || target == null) {
          zoomEaseRef.current = null;
          return;
        }

        const current = g.pointOfView().altitude;
        const remaining = Math.log(target / current);
        if (Math.abs(remaining) < 0.004) {
          g.pointOfView({ altitude: target }, 0);
          zoomTargetRef.current = null;
          zoomEaseRef.current = null;
          return;
        }

        g.pointOfView({ altitude: current * Math.exp(remaining * 0.26) }, 0);
        zoomEaseRef.current = requestAnimationFrame(tick);
      };

      zoomEaseRef.current = requestAnimationFrame(tick);
    }

    function resize() {
      const host = hostRef.current;
      const g = globeRef.current;
      if (!host || !g) return;
      g.width(host.clientWidth).height(host.clientHeight);
    }

    const host = hostRef.current;
    const materials = materialCache.current;
    window.addEventListener("resize", resize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      host?.removeEventListener("wheel", onWheel);
      host?.removeEventListener("pointerdown", stopIdleSpin);
      if (tileTimerRef.current != null) clearTimeout(tileTimerRef.current);
      if (zoomRafRef.current != null) cancelAnimationFrame(zoomRafRef.current);
      if (zoomEaseRef.current != null) cancelAnimationFrame(zoomEaseRef.current);
      materials.forEach((entry) => {
        entry.material.map?.dispose();
        entry.material.dispose();
      });
      materials.clear();
      globeRef.current?._destructor();
      globeRef.current = null;
      if (host) host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-tint land/ocean/atmosphere when the theme toggle flips.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    (g.globeMaterial() as MeshPhongMaterial).color.set(
      cssVar("--globe-ocean", "#0a0c1a")
    );
    g.atmosphereColor(cssVar("--accent", "#5b8cff"))
      .polygonCapColor(() => cssVar("--globe-land", "#23252f"))
      .polygonStrokeColor(() => cssVar("--globe-stroke", "rgba(255,255,255,0.14)"))
      .pathColor(() => cssVar("--globe-border", "rgba(255,255,255,0.09)"))
      .labelColor((d) => cssVar(LABEL_VAR[(d as PlaceLabel).k], "#8a90ab"));

    // Force the tile engine to rebuild against the other basemap palette.
    appliedTilesRef.current = "";
    const pov = g.pointOfView();
    g.pointOfView({ ...pov });
  }, [theme]);

  useEffect(() => {
    const g = globeRef.current;
    if (g) g.controls().autoRotate = autoRotate && !zoomedIn;
  }, [autoRotate, zoomedIn]);

  // Markers. Keyed on the fields that actually change what is drawn, so a
  // poll that returns identical people doesn't tear down and rebuild every
  // avatar (each of which re-renders a procedural SVG).
  const markerKey = visitors
    .map((v) => `${v.id}:${v.lat}:${v.lon}:${v.displayName ?? ""}:${v.isYou}`)
    .join("|");

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const plottable = visitors.filter((v) => v.lat != null && v.lon != null);

    g.htmlElementsData(plottable)
      .htmlLat((d) => (d as PublicVisitor).lat!)
      .htmlLng((d) => (d as PublicVisitor).lon!)
      .htmlElement((d) => {
        const v = d as PublicVisitor;
        const wrap = document.createElement("div");
        wrap.innerHTML = markerHtml(v, v.isYou ? 48 : 42);
        const el = wrap.firstElementChild as HTMLElement;
        if (selectedId === v.id) el.style.transform = "scale(1.18)";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectRef.current(v.id);
        });
        return el;
      });

    // Frame the room the first time coordinates land, then leave the camera
    // alone so we never yank it out from under the person dragging it.
    if (!didInitialPov.current && youLat != null && youLon != null) {
      didInitialPov.current = true;
      g.pointOfView({ lat: youLat, lng: youLon, altitude: 2.1 }, 1400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, selectedId, youLat, youLon]);

  // Arcs from you to your strongest matches. They read as a planet-scale
  // overview, so they come down once the raster basemap takes over — an
  // animated streak across a street map is noise, not information.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (zoomedIn || youLat == null || youLon == null || matchTargetIds.length === 0) {
      g.arcsData([]);
      return;
    }
    const byId = new Map(visitors.map((v) => [v.id, v]));
    const arcs = matchTargetIds
      .map((id) => byId.get(id))
      .filter((v): v is PublicVisitor => !!v && v.lat != null && v.lon != null)
      .map((v) => ({
        startLat: youLat,
        startLng: youLon,
        endLat: v.lat!,
        endLng: v.lon!,
        color: [cssVar("--live", "#34d399"), accentFor(v.id)],
      }));

    // Field names match globe.gl's default arc accessors (startLat/startLng/
    // endLat/endLng/color), so no explicit accessors are needed.
    g.arcsData(arcs);
  }, [matchTargetIds, visitors, youLat, youLon, theme, zoomedIn]);

  // Fly to a visitor when something outside asks for it.
  useEffect(() => {
    const g = globeRef.current;
    if (!g || !focusToken) return;
    g.pointOfView({ lat: focusToken.lat, lng: focusToken.lon, altitude: 1.5 }, 900);
  }, [focusToken]);

  return <div ref={hostRef} className="h-full w-full" />;
}
