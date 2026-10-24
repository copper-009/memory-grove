/**
 * The thin canvas layer: resolves a tone map (or a creature's ASCII frame) to pixels.
 *
 * Deliberately the *only* file in `src/forest/` that touches `CanvasRenderingContext2D`.
 * Everything upstream (`plantSprite.ts`, `creatureSprite.ts`, `layout.ts`, `theme.ts`) is
 * pure and unit-tested; this file is the short, simple, visually-verified-by-screenshot
 * remainder — see `tools/screenshots.mjs` and `screenshots/`.
 */

import type { ToneMap } from './plantSprite';
import { SICK_SHARE, HEALTH_MIN_STAGE, TRUNK_LIGHT, TRUNK_MID } from './plantSprite';
import type { PlantSpecies } from '../regions/types';
import { Stage } from '../data/types';
import { hex, mix, type RGB } from './color';
import { hashStr } from './rng';

export interface PaintOptions {
  /** Health 0..3; only applied once the plant has reached `HEALTH_MIN_STAGE`. */
  stage: Stage;
  health: 0 | 1 | 2 | 3;
  seed: number;
  variant: number;
  /** 0..1: how deep in the haze this plant stands, mixed in at the end. */
  haze?: number;
  hazeColor?: string;
  /** An ambient tint applied to every sprite in the current theme (dawn pink, dusk plum...). */
  tint?: string;
  tintAmount?: number;
  snow?: boolean;
  /** A warm sunrise/golden-hour/dusk edge colour (`Theme.rim`) — when set, the crown's own
   * silhouette edge (whichever side of each row isn't filled by a neighbour) picks up a
   * glow from it, in the upper part of the plant only. This was computed per-frame already
   * (the cabin uses it) but never reached plants, which is exactly the backlit golden-hour
   * tree-edge look the reference screenshots show and this renderer was missing. */
  rim?: string;
}

const TONE_COUNT = 5;

/**
 * Resolve one tone index to a colour. A trunk-range tone (`TRUNK_LIGHT`..`TRUNK_DARK`, see
 * `plantSprite.ts`) resolves against `bark`, never `crown` — that split is what makes a
 * trunk read as brown wood rather than green foliage. Crown tones get the usual
 * yellowing/browning, snow-cap, haze and tint treatment; bark gets haze and tint only
 * (a trunk doesn't yellow, and snow caps only the canopy).
 */
function resolveTone(
  tm: ToneMap,
  x: number,
  y: number,
  crown: PlantSpecies['crown'],
  bark: PlantSpecies['bark'],
  ailing: PlantSpecies['ailing'],
  opts: PaintOptions,
): RGB {
  const tone = tm.tone[y * tm.w + x];
  // A neighbour pixel counts as "filled" only within the same range (crown vs. trunk) as
  // the pixel being resolved — otherwise a crown pixel sitting right above the trunk would
  // see the trunk below it as "filled" and never read as a silhouette edge, and vice versa.
  const filled = (nx: number, ny: number): boolean => {
    if (nx < 0 || ny < 0 || nx >= tm.w || ny >= tm.h) return false;
    const n = tm.tone[ny * tm.w + nx];
    return tone >= TRUNK_LIGHT ? n >= TRUNK_LIGHT : n >= 0 && n <= 4;
  };

  if (tone >= TRUNK_LIGHT) {
    const barkIndex = tone === TRUNK_LIGHT ? 0 : tone === TRUNK_MID ? 1 : 2;
    let col = hex(bark[Math.min(2, barkIndex)]);
    if (opts.tint && opts.tintAmount) col = mix(col, hex(opts.tint), opts.tintAmount);
    if (opts.haze && opts.hazeColor) col = mix(col, hex(opts.hazeColor), opts.haze);
    return col;
  }

  const sickShare = opts.stage >= HEALTH_MIN_STAGE ? SICK_SHARE[opts.health] : 0;
  const clusterKey = `${opts.seed}|${opts.variant}|${(x >> 1)}|${(y >> 1)}`;
  const sick = sickShare > 0 && (hashStr(clusterKey) % 1000) / 1000 < sickShare;

  let col = hex(crown[Math.max(0, Math.min(TONE_COUNT - 1, tone))]);
  if (sick) {
    // dry/bare/autumn each read differently, matching the region's `ailing` style
    if (ailing === 'autumn') col = mix(col, hex('#c87a2a'), 0.55 + tone * 0.05);
    else if (ailing === 'bare') col = mix(col, hex('#8a7a60'), 0.35);
    else col = mix(col, hex('#9a8a40'), 0.5); // dry: dulled, dusty yellow-green
  }

  // Snow caps the pixels that actually face up (nothing filled directly above), not just
  // whichever pixels happen to already carry the highlight tone — a flat "lighten anything
  // bright" treatment doesn't read as snow sitting on top of the canopy, it just looks
  // washed out.
  if (opts.snow) {
    if (!filled(x, y - 1)) col = [245, 248, 252];
    else if (!filled(x, y - 2) && (x + y) % 2 === 0) col = mix(col, [245, 248, 252], 0.7);
  }
  // A golden-hour/dawn/dusk rim light catches the crown's own outer silhouette — whichever
  // side of a row has no filled neighbour — in its upper reaches, the same backlit tree-edge
  // glow the reference scenery shows. `theme.ts` already computes this per frame for the
  // cabin; it never reached plants until now.
  if (opts.rim && tone >= 1 && y < tm.h * 0.75 && (!filled(x - 1, y) || !filled(x + 1, y))) {
    col = mix(col, hex(opts.rim), 0.55);
  }
  if (opts.tint && opts.tintAmount) col = mix(col, hex(opts.tint), opts.tintAmount);
  if (opts.haze && opts.hazeColor) col = mix(col, hex(opts.hazeColor), opts.haze);
  return col;
}

/**
 * Paint a plant's tone map onto a canvas context at integer pixel scale `k`, top-left at
 * (`x0`, `y0`) in device pixels. `g.imageSmoothingEnabled` must already be `false` for a
 * crisp result — the caller (`scene.ts`) sets this once per frame, not per sprite.
 */
export function paintPlant(
  g: CanvasRenderingContext2D,
  tm: ToneMap,
  species: PlantSpecies,
  opts: PaintOptions,
  x0: number,
  y0: number,
  k: number,
): void {
  for (let y = 0; y < tm.h; y++) {
    for (let x = 0; x < tm.w; x++) {
      if (tm.tone[y * tm.w + x] < 0) continue;
      const [r, gg, b] = resolveTone(tm, x, y, species.crown, species.bark, species.ailing, opts);
      g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
      g.fillRect(Math.round(x0 + x * k), Math.round(y0 + y * k), k, k);
    }
  }
}

/** Paint an ASCII-rows creature frame (see `creatureSprite.ts`) at pixel scale `k`. */
export function paintCreature(
  g: CanvasRenderingContext2D,
  rows: readonly string[],
  palette: Record<string, string>,
  x0: number,
  y0: number,
  k: number,
  flip = false,
  tint?: { color: string; amount: number },
): void {
  const w = Math.max(...rows.map((r) => r.length));
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const base = palette[ch];
      if (!base) continue;
      let col: RGB = hex(base);
      if (tint) col = mix(col, hex(tint.color), tint.amount);
      g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
      const px = flip ? w - 1 - x : x;
      g.fillRect(Math.round(x0 + px * k), Math.round(y0 + y * k), k, k);
    }
  }
}
