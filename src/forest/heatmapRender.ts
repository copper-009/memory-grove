/**
 * Pure layout/colour logic for the study heatmap, in the scenery's own palette — matching
 * Memory Forest's "Your look: customize its colours and style" idea at a much smaller
 * scope: shaded by the current scenery's grass/water tones rather than a fixed palette, so
 * the heatmap reads as part of the same scene rather than a bolted-on widget.
 *
 * No canvas here — `HeatmapView.tsx` is the thin, visually-verified drawing layer.
 */

import type { HeatCell, HeatmapData } from '../data/heatmap';
import { asWeekGrid } from '../data/heatmap';
import { mixHex } from './color';
import type { Theme } from './theme';

export interface CellColor {
  fill: string;
  /** A diagonal-stripe pattern (not a plain fill) marks an excused day — "a distinct
   * subtle pattern, not a gap," per the brief, so a break never reads as a missed day. */
  pattern: 'none' | 'stripe';
}

/**
 * Every tone below is mixed from the *current theme* — the same sky/ground/water colours
 * `scene.ts` paints the grove with — rather than fixed constants. This is what Memory
 * Forest's own "Your look: customize its colours" means in practice: the heatmap in the
 * golden-hour lake scenery reads warm and green; in Norway's fjord dusk it reads cool and
 * blue; nothing here is ever a flat, scenery-independent grey.
 */
/** The GitHub-contribution-grid look this is deliberately matching needs real rungs
 * between levels, not a continuous lerp — four quantized steps read as a ladder at a
 * glance; a smooth gradient over a handful of pixels just reads as noise. */
function studiedLevel(level: number): number {
  if (level <= 0) return 0;
  if (level < 0.25) return 1;
  if (level < 0.6) return 2;
  return 3;
}

export function cellColor(cell: HeatCell, theme: Theme): CellColor {
  switch (cell.kind) {
    case 'studied': {
      // A four-rung ladder from bare soil up through the grass colour to a bright
      // near-white highlight on the heaviest study days — the same light-to-dark-green
      // ladder a GitHub contribution graph uses, just built from this scenery's own ground
      // and grass tones instead of a fixed green.
      const rung = studiedLevel(cell.level);
      const stops = [
        mixHex(theme.ground1, '#000000', 0.3),
        mixHex(theme.ground1, theme.grass, 0.55),
        theme.grass,
        mixHex(theme.grass, '#f4f8e8', 0.45),
      ];
      return { fill: stops[rung], pattern: 'none' };
    }
    case 'excused':
      // A dim, desaturated version of the sky's own haze — "paused," not "wrong."
      return { fill: mixHex(theme.haze, theme.near, 0.5), pattern: 'stripe' };
    case 'due':
      // Warms from bark towards the sun/moon's own glow colour as more falls due — ties
      // the "upcoming" colour to the same light source the sky itself uses.
      return { fill: mixHex(theme.near, theme.orb?.glow ?? theme.tint ?? '#c08838', Math.max(0.35, cell.level)), pattern: 'none' };
    case 'future':
      return { fill: mixHex(theme.near, theme.haze, 0.6), pattern: 'none' };
    case 'missed':
    default:
      // Unlit soil, pushed close to black — the "no activity" rung has to sit clearly
      // below every studied rung for the ladder to read, not just a slightly darker green.
      return { fill: mixHex(theme.ground1, '#000000', 0.55), pattern: 'none' };
  }
}

/** The panel colour the whole heatmap sits on — a muted mix of the sky's lowest band and
 * the ground, so the grid reads as part of the scene rather than a plain white/dark widget
 * background unrelated to whatever scenery is chosen. */
export function panelColor(theme: Theme): string {
  const skyNearGround = theme.sky[theme.sky.length - 1];
  return mixHex(skyNearGround, theme.ground1, 0.55);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface MonthLabel {
  /** Column index (week) this label should sit above. */
  week: number;
  label: string;
}

/** Which week-columns should carry a month label — the first week a new month appears in. */
export function monthLabels(cells: ReadonlyArray<HeatCell | null>, weeks: number): MonthLabel[] {
  const out: MonthLabel[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const cell = cells[w * 7 + d];
      if (!cell) continue;
      const month = new Date(cell.date + 'T12:00:00Z').getUTCMonth();
      if (month !== lastMonth) {
        out.push({ week: w, label: MONTH_NAMES[month] });
        lastMonth = month;
      }
      break;
    }
  }
  return out;
}

export interface HeatmapLayout {
  grid: Array<HeatCell | null>;
  weeks: number;
  months: MonthLabel[];
}

export function layoutHeatmap(data: HeatmapData, weekStart = 1): HeatmapLayout {
  const { cells, weeks } = asWeekGrid(data, weekStart);
  return { grid: cells, weeks, months: monthLabels(cells, weeks) };
}
