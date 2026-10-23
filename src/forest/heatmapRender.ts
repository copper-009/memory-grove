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

const MISSED = '#3a3a2c';
const FUTURE = '#2a2e26';
const EXCUSED_BASE = '#4a4a3c';
const DUE_LOW = '#6a4a28';
const DUE_HIGH = '#c08838';

export function cellColor(cell: HeatCell, theme: Theme): CellColor {
  switch (cell.kind) {
    case 'studied': {
      const fill = mixHex(mixHex(theme.ground1, theme.grass, 0.3), theme.grass, Math.max(0.15, cell.level));
      return { fill, pattern: 'none' };
    }
    case 'excused':
      return { fill: EXCUSED_BASE, pattern: 'stripe' };
    case 'due':
      return { fill: mixHex(DUE_LOW, DUE_HIGH, cell.level), pattern: 'none' };
    case 'future':
      return { fill: FUTURE, pattern: 'none' };
    case 'missed':
    default:
      return { fill: MISSED, pattern: 'none' };
  }
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
