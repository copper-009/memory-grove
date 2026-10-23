/**
 * Plant sprites: a tone map first, a palette second.
 *
 * Ported from Memory Forest's `web/engines/pixel/trees.js`, which draws every tree the
 * same way: fill a 2D grid with tone indices 0 (outline) .. 4 (highlight), then resolve
 * tones to colour in a second pass. That second pass is where yellowing, snow caps, haze
 * and tint all happen — decoupling shape from colour is what lets one routine serve
 * `PlantForm` variety here, just as it let the original's one routine serve eight
 * environments.
 *
 * `buildToneMap` is pure — no canvas — so every shape rule is unit-testable. `paintPlant`
 * (in `paint.ts`) is the thin, untested layer that turns a tone map into pixels.
 */

import type { PlantForm } from '../regions/types';
import type { Plant } from '../data/types';
import { Stage, STAGE_HEIGHT } from '../data/types';
import { rng, hashStr } from './rng';

/** -1 = transparent, 0..4 = tone index (outline .. highlight). */
export type ToneMap = { w: number; h: number; tone: Int8Array };

const DYING_HOLES = 0.18;
const SICK_SHARE: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 0.38, 2: 0.62, 3: 0.85 };
const HEALTH_MIN_STAGE = Stage.Mature;

const SEEDLING_SIZE = 7;
const PINE_W = [0.46, 0.54, 0.62];
const BROAD_W = [0.66, 0.8, 0.94];
const ANCIENT_W = [0.9, 0.98, 1.04];

/**
 * Trunk pixels use a *separate* tone range (8..10) from crown pixels (0..4), so `paint.ts`
 * can tell them apart and resolve them against `species.bark` instead of `species.crown`.
 * Without this split, every trunk pixel resolved through the crown palette and a tree had
 * no visible trunk at all — just a solid green blob from root to crown.
 */
export const TRUNK_LIGHT = 8;
export const TRUNK_MID = 9;
export const TRUNK_DARK = 10;

function makeTone(w: number, h: number): ToneMap {
  return { w, h, tone: new Int8Array(w * h).fill(-1) };
}
function set(tm: ToneMap, x: number, y: number, v: number): void {
  if (x < 0 || y < 0 || x >= tm.w || y >= tm.h) return;
  tm.tone[y * tm.w + x] = v;
}
function get(tm: ToneMap, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= tm.w || y >= tm.h) return -1;
  return tm.tone[y * tm.w + x];
}

/** A rounded crown as a cluster of overlapping ellipses, tone shaded by light direction. */
function roundCrown(tm: ToneMap, w: number, top: number, ch: number, cx: number, blobsN: number, r: () => number, hole: number): void {
  const rx = w / 2;
  const ry = ch / 2;
  const ccx = cx + 0.5;
  const ccy = top + ry - 0.5;
  const blobs = [{ x: ccx, y: ccy, sx: rx * 0.86, sy: ry * 0.86 }];
  for (let k = 0; k < blobsN; k++) {
    const a = -Math.PI / 2 + (k / blobsN) * Math.PI * 2 + r() * 0.6;
    blobs.push({ x: ccx + Math.cos(a) * rx * 0.5, y: ccy + Math.sin(a) * ry * 0.5, sx: rx * 0.52, sy: ry * 0.52 });
  }
  for (let y = 0; y < tm.h; y++) {
    for (let x = 0; x < tm.w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let best = -9;
      for (const b of blobs) {
        const nx = (px - b.x) / b.sx;
        const ny = (py - b.y) / b.sy;
        if (nx * nx + ny * ny <= 1) best = Math.max(best, -(nx * 0.6 + ny * 0.8));
      }
      if (best === -9) continue;
      if (hole && r() < hole) continue;
      const l = 0.55 * best + 0.45 * -((px - ccx) / rx * 0.5 + (py - ccy) / ry * 0.7) + (r() - 0.5) * 0.3;
      set(tm, x, y, l > 0.5 ? 4 : l > 0.15 ? 3 : l > -0.3 ? 2 : 1);
    }
  }
}

/** A conifer's tapering, tiered crown. */
function pineCrown(tm: ToneMap, w: number, top: number, ch: number, cx: number, tiers: number, r: () => number, hole: number): void {
  for (let y = top; y < top + ch; y++) {
    const p = (y - top + 0.5) / ch;
    const tp = (p * tiers) % 1;
    const hw = (w / 2) * (0.18 + 0.82 * p) * (0.5 + 0.5 * tp);
    const under = tp > 1 - 1.6 / (ch / tiers) && y < top + ch - 1;
    for (let x = 0; x < tm.w; x++) {
      const dx = x + 0.5 - (cx + 0.5);
      if (Math.abs(dx) > hw) continue;
      if (hole && r() < hole) continue;
      const v = -(dx / Math.max(hw, 1)) * 0.7 + (tp - 0.5) * 0.35 + (r() - 0.5) * 0.3;
      const tone = v > 0.5 ? 4 : v > 0.15 ? 3 : v > -0.3 ? 2 : 1;
      set(tm, x, y, under ? Math.max(1, tone - 2) : tone);
    }
  }
}

/** A fan of fronds radiating from a point: used for palm and fern alike. */
function frondCrown(tm: ToneMap, top: number, ch: number, cx: number, fronds: number, arcSpan: number, r: () => number): void {
  const originX = cx + 0.5;
  const originY = top + 1;
  for (let f = 0; f < fronds; f++) {
    const a = -Math.PI / 2 + (f / (fronds - 1) - 0.5) * arcSpan + (r() - 0.5) * 0.1;
    const len = ch * (0.75 + r() * 0.3);
    const steps = Math.ceil(len);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const curve = Math.sin(t * Math.PI * 0.5) * 0.15 * (f < fronds / 2 ? -1 : 1);
      const x = Math.round(originX + Math.cos(a) * len * t + curve * ch);
      const y = Math.round(originY + Math.sin(a) * len * t);
      const tone = t < 0.3 ? 2 : t < 0.7 ? 3 : 4;
      set(tm, x, y, tone);
      if (Math.abs(Math.cos(a)) > 0.3) set(tm, x + (f % 2 ? 1 : -1), y, Math.max(1, tone - 1));
    }
  }
}

/** A low spiky dome: spinifex, tussock. */
function hummockCrown(tm: ToneMap, w: number, top: number, ch: number, cx: number, r: () => number): void {
  const blades = Math.max(5, Math.round(w * 0.9));
  for (let i = 0; i < blades; i++) {
    const bx = cx - w / 2 + (i / blades) * w + r() * 1.2;
    const lean = (bx - cx) / (w / 2) * 0.3;
    const len = ch * (0.6 + r() * 0.4);
    for (let s = 0; s < len; s++) {
      const t = s / len;
      const x = Math.round(bx + lean * s);
      const y = Math.round(top + ch - s);
      set(tm, x, y, t > 0.7 ? 4 : t > 0.3 ? 3 : 2);
    }
  }
}

/** A low dense mound: banksia, heather. */
function shrubCrown(tm: ToneMap, w: number, top: number, ch: number, cx: number, r: () => number): void {
  roundCrown(tm, w, top, ch, cx, 4, r, 0.05);
}

/** A swollen, bottle-shaped trunk with a small crown: baobab. */
function bulbousTrunk(tm: ToneMap, trunkW: number, bulbW: number, top: number, trunkH: number, cx: number): { tx0: number } {
  const bulgeH = Math.round(trunkH * 0.55);
  for (let y = top; y < top + trunkH; y++) {
    const intoBulge = y < top + bulgeH ? 1 - (y - top) / bulgeH : 0;
    const halfW = Math.round((trunkW / 2) + (bulbW / 2 - trunkW / 2) * intoBulge);
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      set(tm, x, y, x < cx ? TRUNK_MID : x === cx ? TRUNK_LIGHT : TRUNK_MID);
    }
  }
  return { tx0: cx - Math.round(trunkW / 2) };
}

/** A black fire-charred trunk and a spiky skirt with a spear: a grass tree. */
function grassTreeCrown(tm: ToneMap, w: number, top: number, ch: number, cx: number, r: () => number): void {
  hummockCrown(tm, w, top, ch * 0.8, cx, r);
  // the flower spear
  for (let y = top - ch * 0.5; y < top; y++) set(tm, cx, Math.round(y), 3);
}

export interface SpriteSpec {
  w: number;
  h: number;
  top: number;
  ch: number;
  cx: number;
  trunkTop: number;
  trunkH: number;
  trunkW: number;
}

const SHARE_OF_HEIGHT: Record<PlantForm, number> = {
  broadleaf: 0.32, conifer: 0.2, palm: 0.75, fern: 0.4, grasstree: 0.5,
  hummock: 0.1, shrub: 0.15, columnar: 0.55, bulbous: 0.6,
};

/**
 * Build a plant's tone map for its stage, health and form. `seed` fixes every random
 * choice, so the same plant on the same day always looks the same.
 */
/**
 * `scale` sizes the whole sprite directly — a plant standing nearer the camera (or a small
 * grove's zoom-in) gets a tone map built bigger in the first place, not a small one
 * stretched afterward.
 *
 * This matters because the old call site (`scene.ts`) built one small, fixed-resolution
 * tone map per stage and then tried to reach the target size by scaling it up by an
 * *integer* factor (`round(targetHeight / tonemap.height)`). For a Sapling or Young plant,
 * the fixed tone map was already close to the target height, so that ratio rounded to 1
 * however much `zoomedScale` asked for — the depth/zoom scaling was silently a no-op for
 * most of a grove's life. Building the tone map at the real target size from the start
 * fixes that at the root, and also makes near/far depth differences in a dense grove
 * actually visible per-plant rather than masked by the same rounding.
 */
export function buildToneMap(
  plant: Pick<Plant, 'stage' | 'size' | 'health' | 'seed'>,
  form: PlantForm,
  scale = 1,
): ToneMap {
  const r = rng(hashStr(`sprite|${plant.seed}|${form}`));
  if (plant.stage === Stage.Seedling) {
    const size = Math.max(SEEDLING_SIZE, Math.round(SEEDLING_SIZE * scale));
    const tm = makeTone(size, size);
    const cx = Math.floor(size / 2);
    const base = size - 1;
    const s = size / SEEDLING_SIZE;
    set(tm, cx, Math.round(base - 1 * s), 2);
    set(tm, cx, Math.round(base - 2 * s), 3);
    set(tm, cx - Math.round(s), Math.round(base - 3 * s), 3);
    set(tm, cx + Math.round(s), Math.round(base - 3 * s), 3);
    set(tm, cx, Math.round(base - 4 * s), 4);
    return tm;
  }

  const h = Math.max(3, Math.round(STAGE_HEIGHT[plant.stage] * scale));
  const trunkShare = SHARE_OF_HEIGHT[form];
  const trunkH = Math.max(2, Math.round(h * trunkShare));
  const ancient = plant.stage === Stage.Ancient;

  let widthFrac: number;
  if (form === 'conifer') widthFrac = PINE_W[plant.size];
  else if (ancient) widthFrac = ANCIENT_W[plant.size];
  else widthFrac = BROAD_W[plant.size];
  let w = Math.max(3, Math.round(h * widthFrac));
  if (w % 2 === 0) w++;

  const W = w + 4;
  const H = h + 2;
  const tm = makeTone(W, H);
  const cx = Math.floor(W / 2);
  const base = H - 1;
  const top = 1;
  const ch = h - trunkH + 2;
  const trunkTop = base - trunkH;
  const trunkW = plant.stage >= Stage.Old ? 2 : 1;

  const tx0 = cx - Math.floor(trunkW / 2);
  for (let y = trunkTop; y <= base; y++) {
    for (let x = tx0; x < tx0 + trunkW; x++) {
      // dark where it's shaded under the crown, lit on the left edge for a two-tone trunk
      let tone = y <= trunkTop + 3 ? TRUNK_DARK : TRUNK_MID;
      if (trunkW > 1 && x === tx0) tone = TRUNK_LIGHT;
      set(tm, x, y, tone);
    }
  }

  const hole = plant.health === 3 ? DYING_HOLES : 0;
  switch (form) {
    case 'conifer':
      pineCrown(tm, w, top, ch, cx, plant.stage >= Stage.Old ? 4 : plant.stage >= Stage.Mature ? 3 : 2, r, hole);
      break;
    case 'palm':
      frondCrown(tm, top, ch, cx, 7, Math.PI * 1.3, r);
      break;
    case 'fern':
      frondCrown(tm, top, ch, cx, 9, Math.PI * 0.9, r);
      break;
    case 'columnar':
      roundCrown(tm, w, top, ch * 0.5, cx, 3, r, hole);
      break;
    case 'bulbous':
      bulbousTrunk(tm, trunkW + 1, w, trunkTop - Math.round(ch * 0.5), trunkH + Math.round(ch * 0.5), cx);
      roundCrown(tm, Math.round(w * 0.5), top, ch * 0.4, cx, 2, r, hole);
      break;
    case 'grasstree':
      grassTreeCrown(tm, w, top, ch, cx, r);
      break;
    case 'hummock':
      hummockCrown(tm, w, top, ch, cx, r);
      break;
    case 'shrub':
      shrubCrown(tm, w, top, ch, cx, r);
      break;
    case 'broadleaf':
    default:
      roundCrown(tm, w, top, ch, cx, ancient ? 7 : plant.stage >= Stage.Mature ? 5 : 3, r, hole);
      break;
  }

  // Edge cleanup: a crown-tone pixel with no filled neighbour below/right reads as a stray
  // speck. Restricted to the crown's tone range (0..4) — a trunk pixel (8..10) reset to 0
  // would resolve back through the crown palette and the trunk would lose its colour again.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tn = get(tm, x, y);
      if (tn < 0 || tn > 4) continue;
      if (get(tm, x + 1, y) < 0 && get(tm, x, y + 1) < 0) set(tm, x, y, 0);
    }
  }

  return tm;
}

/** Share of filled pixels, 0..1 — used by tests and by the painter to size yellowing clusters. */
export function fillShare(tm: ToneMap): number {
  let n = 0;
  for (let i = 0; i < tm.tone.length; i++) if (tm.tone[i] >= 0) n++;
  return n / tm.tone.length;
}

export { SICK_SHARE, HEALTH_MIN_STAGE };
