/**
 * The study heatmap under the grove.
 *
 * Excused days are drawn with their own subtle pattern rather than appearing as gaps —
 * the whole point of declaring a break is that it should not read as failure.
 */

import type { StudyCalendar } from './calendar';
import { isExcused } from './calendar';
import { dayToISO, weekday } from './day';
import type { Grove } from './types';

export type HeatCellKind = 'studied' | 'excused' | 'missed' | 'future' | 'due';

export interface HeatCell {
  day: number;
  date: string;
  reviews: number;
  /** Seconds spent, when RemNote recorded response times. */
  seconds: number;
  /** Cards falling due on this day, for days ahead of today. */
  due: number;
  kind: HeatCellKind;
  /** 0–1 within the scale, for shading. */
  level: number;
  /** A plant was planted on this day. */
  planted: boolean;
}

export interface HeatmapData {
  cells: HeatCell[];
  from: number;
  to: number;
  today: number;
  maxReviews: number;
  streak: number;
  longestStreak: number;
  totalReviews: number;
  dueNext7: number;
  dueNext30: number;
  /** Day numbers with at least one review. */
  activeDays: number;
}

export interface HeatmapOptions {
  /** Days of history to show. */
  daysBack?: number;
  /** Days ahead to show due counts for. */
  daysAhead?: number;
  shadeBy?: 'reviews' | 'time';
  calendar?: StudyCalendar;
  /** day number -> cards due. */
  dueByDay?: ReadonlyMap<number, number>;
  /** Week start: 0 = Sunday, 1 = Monday. Used to pad the grid. */
  weekStart?: number;
}

export const DEFAULT_DAYS_BACK = 300;
export const DEFAULT_DAYS_AHEAD = 30;

export function buildHeatmap(grove: Grove, opts: HeatmapOptions = {}): HeatmapData {
  const daysBack = opts.daysBack ?? DEFAULT_DAYS_BACK;
  const daysAhead = opts.daysAhead ?? DEFAULT_DAYS_AHEAD;
  const shadeBy = opts.shadeBy ?? 'reviews';
  const cal = opts.calendar;
  const due = opts.dueByDay;
  const today = grove.today;
  const from = today - daysBack + 1;
  const to = today + daysAhead;

  const planted = new Set(grove.plants.map((p) => p.day));

  // The scale is set by the busiest day on show, so a quiet month still reads clearly.
  let maxReviews = 0;
  let maxSeconds = 0;
  for (let d = from; d <= today; d++) {
    const n = grove.dayReviews.get(d) ?? 0;
    if (n > maxReviews) maxReviews = n;
    const s = grove.dayTime.get(d) ?? 0;
    if (s > maxSeconds) maxSeconds = s;
  }
  const scale = shadeBy === 'time' ? maxSeconds : maxReviews;

  const cells: HeatCell[] = [];
  let totalReviews = 0;
  let activeDays = 0;
  let dueNext7 = 0;
  let dueNext30 = 0;

  for (let d = from; d <= to; d++) {
    const reviews = grove.dayReviews.get(d) ?? 0;
    const seconds = Math.round(grove.dayTime.get(d) ?? 0);
    const dueHere = d > today ? (due?.get(d) ?? 0) : 0;

    if (d <= today) {
      totalReviews += reviews;
      if (reviews > 0) activeDays++;
    } else {
      if (d <= today + 7) dueNext7 += dueHere;
      if (d <= today + 30) dueNext30 += dueHere;
    }

    let kind: HeatCellKind;
    if (d > today) kind = dueHere > 0 ? 'due' : 'future';
    else if (reviews > 0) kind = 'studied';
    else if (cal && isExcused(cal, d)) kind = 'excused';
    else kind = 'missed';

    const raw = shadeBy === 'time' ? seconds : reviews;
    cells.push({
      day: d,
      date: dayToISO(d),
      reviews,
      seconds,
      due: dueHere,
      kind,
      // Square-rooted so one enormous catch-up session doesn't flatten every other day.
      level: scale > 0 && raw > 0 ? Math.min(1, Math.sqrt(raw / scale)) : 0,
      planted: planted.has(d),
    });
  }

  return {
    cells,
    from,
    to,
    today,
    maxReviews,
    streak: grove.stats.streak,
    longestStreak: grove.stats.longestStreak,
    totalReviews,
    dueNext7,
    dueNext30,
    activeDays,
  };
}

/**
 * Pad the cells so the grid starts on the chosen week start, and report the column count.
 * Returns leading blanks as `null`.
 */
export function asWeekGrid(
  data: HeatmapData,
  weekStart = 1,
): { cells: Array<HeatCell | null>; weeks: number } {
  const lead = (weekday(data.from) - weekStart + 7) % 7;
  const cells: Array<HeatCell | null> = new Array(lead).fill(null).concat(data.cells);
  while (cells.length % 7 !== 0) cells.push(null);
  return { cells, weeks: cells.length / 7 };
}
