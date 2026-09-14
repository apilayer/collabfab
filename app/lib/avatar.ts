import { pick, seeded } from "./hash";

const SKIN = ["#f2c9a0", "#e5a978", "#c97f4e", "#8d5524", "#5b3620", "#f7d9bd"];
const HAIR = ["#2b2118", "#4a2c17", "#8c4a1e", "#c9782f", "#d8d3c8", "#1b1b1f", "#6b3fa0", "#c2413f"];
const SHIRT = ["#e8734a", "#4a7fe8", "#3fa06b", "#c2413f", "#8c5ad8", "#e0a63c", "#3aa8b8", "#d84a86"];
const BACK = ["#f6d5c6", "#d9e4f5", "#dff0e4", "#f7e6c4", "#e6dcf7", "#fbd9e6", "#d4eef2"];

/**
 * Procedural cartoon face — no avatar service, no network call. The same seed
 * always yields the same face, so a visitor looks identical on every screen
 * watching the globe. Returned as a raw SVG string because both the WebGL
 * globe (HTML markers) and the Leaflet 2-D map (divIcon) need markup, not JSX.
 */
export function avatarSvg(seed: string, size = 64): string {
  const rnd = seeded(seed);
  const skin = pick(SKIN, rnd);
  const hair = pick(HAIR, rnd);
  const shirt = pick(SHIRT, rnd);
  const back = pick(BACK, rnd);
  const style = Math.floor(rnd() * 6);
  const brow = rnd() > 0.55;
  const glasses = rnd() > 0.72;
  const smile = rnd() > 0.4;
  const freckles = rnd() > 0.75;

  const hairShape = [
    // 0 — short crop
    `<path d="M14 30c0-11 8-18 18-18s18 7 18 18c0 3-1 5-2 5-1-8-7-11-16-11s-15 3-16 11c-1 0-2-2-2-5z" fill="${hair}"/>`,
    // 1 — bun
    `<circle cx="32" cy="9" r="6" fill="${hair}"/><path d="M14 31c0-11 8-18 18-18s18 7 18 18c0 3-1 4-2 4-2-8-7-11-16-11s-14 3-16 11c-1 0-2-1-2-4z" fill="${hair}"/>`,
    // 2 — long
    `<path d="M13 32c0-12 8-20 19-20s19 8 19 20v16c0 2-2 3-4 2-1-6-2-12-2-18-3 4-8 6-13 6s-10-2-13-6c0 6-1 12-2 18-2 1-4 0-4-2z" fill="${hair}"/>`,
    // 3 — curly puff
    `<g fill="${hair}"><circle cx="20" cy="20" r="8"/><circle cx="32" cy="14" r="9"/><circle cx="44" cy="20" r="8"/><circle cx="24" cy="28" r="7"/><circle cx="40" cy="28" r="7"/></g>`,
    // 4 — side part
    `<path d="M14 31c0-11 8-19 18-19 8 0 14 4 17 11-6-2-13-1-20 3-5 3-9 6-12 10-2-1-3-3-3-5z" fill="${hair}"/>`,
    // 5 — twin buns
    `<circle cx="18" cy="14" r="6" fill="${hair}"/><circle cx="46" cy="14" r="6" fill="${hair}"/><path d="M15 31c0-11 8-18 17-18s17 7 17 18c0 3-1 4-2 4-2-8-6-11-15-11s-13 3-15 11c-1 0-2-1-2-4z" fill="${hair}"/>`,
  ][style];

  const mouth = smile
    ? `<path d="M27 45c1.6 2.6 3.4 3.9 5 3.9s3.4-1.3 5-3.9" stroke="#7a4a34" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    : `<path d="M28 46.4h8" stroke="#7a4a34" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="avatar">
<circle cx="32" cy="32" r="32" fill="${back}"/>
<path d="M18 64c1.5-8 7-12 14-12s12.5 4 14 12z" fill="${shirt}"/>
<ellipse cx="32" cy="34" rx="15" ry="17" fill="${skin}"/>
<ellipse cx="17.5" cy="35" rx="2.6" ry="3.4" fill="${skin}"/>
<ellipse cx="46.5" cy="35" rx="2.6" ry="3.4" fill="${skin}"/>
${hairShape}
${brow ? `<path d="M23 30h6M35 30h6" stroke="${hair}" stroke-width="1.8" stroke-linecap="round"/>` : ""}
<circle cx="26" cy="36" r="2.1" fill="#2b2118"/>
<circle cx="38" cy="36" r="2.1" fill="#2b2118"/>
<circle cx="26.7" cy="35.3" r="0.7" fill="#fff"/>
<circle cx="38.7" cy="35.3" r="0.7" fill="#fff"/>
${glasses ? `<g stroke="#2b2118" stroke-width="1.4" fill="none"><circle cx="26" cy="36" r="5"/><circle cx="38" cy="36" r="5"/><path d="M31 36h2"/></g>` : ""}
${freckles ? `<g fill="#c98b64"><circle cx="22" cy="41" r="0.9"/><circle cx="25" cy="43" r="0.9"/><circle cx="42" cy="41" r="0.9"/><circle cx="39" cy="43" r="0.9"/></g>` : ""}
<path d="M31 38v4h2" stroke="#c98b64" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${mouth}
</svg>`;
}

// Accent colour for a visitor's ring/dot, also derived from the seed.
export function accentFor(seed: string): string {
  const rnd = seeded(seed + ":accent");
  return pick(
    ["#ff5c5c", "#ffb020", "#34d399", "#38bdf8", "#a78bfa", "#f472b6", "#f97316"],
    rnd
  );
}
