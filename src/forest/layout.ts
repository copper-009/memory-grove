/**
 * Layout: where every plant and pond stands, and how far back the scene reaches.
 *
 * Ported from Memory Forest's `web/layout.js`. Pure geometry — no canvas calls — so it is
 * fully unit-testable and the renderer (`scene.ts`) just reads positions off it.
 */

import type { Plant } from '../data/types';
import { rng } from './rng';
import { clamp } from './color';

export const HORIZON = 0.42;
export const GROUND_BOTTOM = 0.965;
export const ROWS_TOP = 0.045;
export const SLOT_MARGIN = 0.02;
export const SLOT_SPAN = 0.96;
// Widened from the original's 0.82/0.18 (a 22% front-to-back size spread) after it read as
// too flat once the sprite-scale fix (see plantSprite.ts) made zoom and depth scaling
// actually take effect per-plant — with sprites finally responding to their own `scale`,
// a bigger spread between the nearest and farthest row reads as real depth instead of a
// uniform wall of same-sized trees.
export const FAR_SCALE = 0.68;
export const NEAR_GAIN = 0.32;
export const DIM_HAZE = 1.5;

const POND_DAYS_PER_SLOT = 10;
const POND_SLOTS: [number, number] = [2, 4];
const POND_APART = 3;
const X_JITTER = 0.7;
const Y_JITTER = 0.6;
const SINGLE_ROW_NEAREST = 0.3;
const ZOOM_FULL_LOG = 7;
const ZOOM_PER_LOG = 0.15;
const ZOOM_MAX = 1.8;
const ROW_SPREAD = 1.6;
const ROW_MIN = 10;
const ROW_MAX = 34;
const ROW_MAX_BIG = 52;
const BIG_FOREST_ITEMS = 500;

/** Fields every placed item carries, pond or plant alike, once layout has run. */
interface Placement {
  seed: number;
  cell: number;
  row: number;
  fromFront: number;
  depth: number;
  x: number;
  jy: number;
  rowGap: number;
}

export interface PondItem extends Placement {
  pond: true;
  group: number;
  days: number;
  from?: string;
  to?: string;
  slots: number;
  first: boolean;
}

export interface PlantItem extends Plant, Placement {
  pond: false;
  index: number;
}

export type LayoutItem = PondItem | PlantItem;

export interface Layout {
  items: LayoutItem[];
  perRow: number;
  rows: number;
  zoom: number;
}

export function isPond(item: LayoutItem): item is PondItem {
  return 'pond' in item && item.pond === true;
}

/**
 * Lay out a grove: a grid of slots, oldest plant at the back, ponds reserved as blocks
 * that stay clear of their neighbours on both sides.
 */
export function layoutGrove(plants: readonly Plant[]): Layout {
  type Unit = LayoutItem[];
  const items: LayoutItem[] = [];

  plants.forEach((p, i) => {
    if (p.gap) {
      const slots = clamp(Math.ceil(p.gap / POND_DAYS_PER_SLOT), POND_SLOTS[0], POND_SLOTS[1]);
      for (let k = 0; k < slots; k++) {
        items.push({
          pond: true,
          group: i,
          days: p.gap,
          from: p.gapFrom,
          to: p.gapTo,
          slots,
          first: k === 0,
          seed: (p.seed ^ (k * 7919 + 17)) >>> 0,
          cell: 0, row: 0, fromFront: 0, depth: 0, x: 0, jy: 0, rowGap: 0,
        });
      }
    }
    items.push({ ...p, pond: false, index: i, cell: 0, row: 0, fromFront: 0, depth: 0, x: 0, jy: 0, rowGap: 0 });
  });

  const n = items.length;
  const perRow = clamp(Math.round(Math.sqrt(n) * ROW_SPREAD), ROW_MIN, n > BIG_FOREST_ITEMS ? ROW_MAX_BIG : ROW_MAX);

  const reserved = new Set<number>();
  const water = new Set<number>();
  let cell = 0;

  const free = (c: number) => {
    while (reserved.has(c)) c++;
    return c;
  };
  const crowded = (c: number, slots: number) => {
    const r = Math.floor(c / perRow);
    const c0 = c % perRow;
    for (let dr = -POND_APART; dr <= POND_APART; dr++) {
      for (let dc = -1; dc <= slots; dc++) {
        const cc = c0 + dc;
        if (cc >= 0 && cc < perRow && water.has((r + dr) * perRow + cc)) return true;
      }
    }
    return false;
  };
  const fits = (c: number, slots: number) => {
    for (let k = 0; k < slots; k++) {
      if (reserved.has(c + k) || (c + k) % perRow < c % perRow) return false;
    }
    return !crowded(c, slots);
  };
  const put = (it: LayoutItem) => {
    it.cell = cell;
    if (isPond(it)) {
      water.add(cell);
      const r = Math.floor(cell / perRow);
      const c = cell % perRow;
      reserved.add((r + 1) * perRow + c);
      reserved.add((r + 2) * perRow + c);
      if (it.first && c > 0) reserved.add(cell - 1);
    }
    cell++;
  };

  const units: Unit[] = [];
  const waiting: Unit[] = [];
  for (const it of items) {
    if (isPond(it) && !it.first) units[units.length - 1].push(it);
    else units.push([it]);
  }
  const tryWaiting = () => {
    for (let k = 0; k < waiting.length; k++) {
      cell = free(cell);
      if (fits(cell, waiting[k].length)) {
        waiting.splice(k, 1)[0].forEach(put);
        k = -1;
      }
    }
  };
  for (const unit of units) {
    tryWaiting();
    cell = free(cell);
    const head = unit[0];
    if (!isPond(head)) put(head);
    else if (fits(cell, unit.length)) unit.forEach(put);
    else waiting.push(unit);
  }
  for (const unit of waiting) {
    cell = free(cell);
    while (!fits(cell, unit.length)) cell = free(cell + 1);
    unit.forEach(put);
  }

  const rows = Math.max(1, Math.ceil(cell / perRow));
  const single = rows === 1;

  items.forEach((it, i) => {
    const row = Math.floor(it.cell / perRow);
    const col = it.cell % perRow;
    const r = rng(it.seed || i + 1);
    it.row = row;
    it.fromFront = rows - 1 - row;
    it.depth = rows === 1 ? 1 : row / (rows - 1);
    const c = single ? col + (perRow - n) / 2 : col;
    it.x = (c + 0.5 + (r() - 0.5) * X_JITTER + (row % 2 ? 0.5 : 0)) / (perRow + 0.5);
    it.jy = (r() - 0.5) * Y_JITTER;
    it.rowGap = rows > 1 ? 1 / (rows - 1) : 0;
    if (single) it.depth = SINGLE_ROW_NEAREST + (1 - SINGLE_ROW_NEAREST) * r();
  });

  const zoom = clamp(1 + (ZOOM_FULL_LOG - Math.log2(Math.max(2, plants.length))) * ZOOM_PER_LOG, 1, ZOOM_MAX);

  return { items, perRow, rows, zoom };
}

/** Pixel position and scale of a placed item, for a canvas of size `W` x `H`. */
export interface Placed {
  x: number;
  y: number;
  scale: number;
  haze: number;
}

export function placeItem(it: LayoutItem, W: number, H: number, horizonY?: number, groundBottom = GROUND_BOTTOM): Placed {
  const hor = horizonY ?? H * HORIZON;
  const top = hor + H * ROWS_TOP;
  const bot = H * groundBottom;
  const x = (SLOT_MARGIN + SLOT_SPAN * it.x) * W;
  const y = top + (bot - top) * clamp(Math.pow(it.depth, 1.1) + it.jy * it.rowGap, 0, 1);
  const scale = FAR_SCALE + NEAR_GAIN * it.depth;
  const haze = 1 - it.depth;
  return { x, y, scale, haze };
}
