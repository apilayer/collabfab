/**
 * Slippy-map tile maths for the globe's zoom-in layer.
 *
 * The cartoon vector globe is 110m-resolution Natural Earth — beautiful at
 * planet scale, but it physically contains no streets. Once the camera drops
 * close enough, we swap in real raster tiles (the same CARTO basemap the 2-D
 * view uses) so the same scene keeps resolving all the way down to street
 * names, then hand back to vectors on the way out.
 */

export type Tile = {
  key: string;
  x: number;
  y: number;
  z: number;
  /** Tile centre, in degrees. */
  lat: number;
  lng: number;
  /** Tile extent, in degrees. */
  width: number;
  height: number;
};

/** Above this altitude (in globe radii) the vector globe stays on show. */
/** Above this altitude (in globe radii) the vector globe stays on show. */
export const TILE_ALTITUDE_THRESHOLD = 0.55;
export const MIN_TILE_ZOOM = 2;
export const MAX_TILE_ZOOM = 19;
/**
 * Ceiling on simultaneous tiles. When a view needs more than this we step the
 * zoom *down* rather than trimming the grid — a truncated grid is what leaves
 * the screen half-covered and reads as "the map is slow".
 */
export const MAX_TILES = 130;

const lng2tile = (lng: number, z: number) =>
  Math.floor(((lng + 180) / 360) * 2 ** z);

const lat2tile = (lat: number, z: number) => {
  const r = (clampLat(lat) * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z
  );
};

const tile2lng = (x: number, z: number) => (x / 2 ** z) * 360 - 180;

const tile2lat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

const clampLat = (lat: number) => Math.max(-85.0511, Math.min(85.0511, lat));

/** Ground resolution at zoom 0 on the equator, in km per pixel. */
const KM_PER_PX_Z0 = 156.543;

/** Build one tile's geographic extent from its slippy x/y/z address. */
export function tileAt(x: number, y: number, z: number): Tile {
  const n = 2 ** z;
  const wrapped = ((x % n) + n) % n;
  const north = tile2lat(y, z);
  const south = tile2lat(y + 1, z);
  const width = 360 / n;
  return {
    key: `${z}/${wrapped}/${y}`,
    x: wrapped,
    y,
    z,
    lat: (north + south) / 2,
    lng: tile2lng(wrapped, z) + width / 2,
    width,
    height: north - south,
  };
}

/** The half-extents of what the camera can actually see, in degrees. */
export type ViewSpan = { halfLat: number; halfLng: number };

/**
 * Pick the zoom whose native resolution matches the viewport, from the real
 * visible span rather than a flat-plane guess at the camera altitude — near the
 * horizon the projection covers far more ground than a nadir approximation
 * predicts, which is what left the old grid too small for the screen.
 */
export function zoomForSpan(
  span: ViewSpan,
  centerLat: number,
  viewportWidth: number
): number {
  const widthKm =
    2 * span.halfLng * 111.32 * Math.max(0.08, Math.cos((clampLat(centerLat) * Math.PI) / 180));
  if (widthKm <= 0) return MAX_TILE_ZOOM;
  const z = Math.log2((viewportWidth * KM_PER_PX_Z0) / widthKm);
  return Math.max(MIN_TILE_ZOOM, Math.min(MAX_TILE_ZOOM, Math.round(z)));
}

/** Every tile overlapping the given span at one zoom level. */
export function tilesForBounds(
  centerLat: number,
  centerLng: number,
  span: ViewSpan,
  z: number
): Tile[] {
  const n = 2 ** z;
  const x0 = lng2tile(centerLng - span.halfLng, z);
  const x1 = lng2tile(centerLng + span.halfLng, z);
  // Tile Y grows southward, so the northern edge yields the smaller index.
  const y0 = Math.max(0, lat2tile(centerLat + span.halfLat, z));
  const y1 = Math.min(n - 1, lat2tile(centerLat - span.halfLat, z));

  // A span wider than the world would otherwise loop forever around the wrap.
  const xCount = Math.min(n, x1 - x0 + 1);

  const out: Tile[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let i = 0; i < xCount; i++) out.push(tileAt(x0 + i, y, z));
  }
  return out;
}

/**
 * Choose the deepest zoom that still covers the whole view within the tile
 * budget. Coarser-but-complete always beats sharper-but-full-of-holes.
 */
export function fitTiles(
  centerLat: number,
  centerLng: number,
  span: ViewSpan,
  viewportWidth: number
): { tiles: Tile[]; z: number } {
  let z = zoomForSpan(span, centerLat, viewportWidth);
  let tiles = tilesForBounds(centerLat, centerLng, span, z);
  while (tiles.length > MAX_TILES && z > MIN_TILE_ZOOM) {
    z -= 1;
    tiles = tilesForBounds(centerLat, centerLng, span, z);
  }
  return { tiles, z };
}

/**
 * Raster basemap source. OpenStreetMap's standard tiles are genuinely free to
 * use with attribution — no key, no account. They come in one (light) style;
 * the globe inverts and re-tints them on the GPU for dark mode.
 *
 * OSM asks heavy consumers to move to their own provider. Point
 * NEXT_PUBLIC_TILE_URL at any {z}/{x}/{y} endpoint to do that — the rest of the
 * tile engine is provider-agnostic.
 *
 * @see https://operations.osmfoundation.org/policies/tiles/
 */
export const TILE_TEMPLATE =
  process.env.NEXT_PUBLIC_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION = "© OpenStreetMap contributors";

/** The basemap is a light style, so dark mode inverts it. */
export const TILE_NEEDS_INVERT = !process.env.NEXT_PUBLIC_TILE_URL;

export const tileUrl = (t: Tile) =>
  TILE_TEMPLATE.replace("{z}", String(t.z))
    .replace("{x}", String(t.x))
    .replace("{y}", String(t.y));
