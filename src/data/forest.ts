/**
 * Turning a scan into a grove: stages, health, ponds, streaks and the deep-grove fold.
 *
 * The thresholds here are Memory Forest's, kept deliberately: they are what make the grove
 * grow at a pace that feels right, and changing them would change the feel more than any
 * amount of new art. The two deviations are noted inline and in `DECISIONS.md`.
 */

import type { Cohort, Grove, GroveStats, MergedPlants, Plant } from './types';
import { Stage } from './types';
import { dayToISO } from './day';
import { daySeed } from './rng';
import { MATURE_DAYS } from './cards';
import type { ScanResult } from './cards';

export const OLD_DAYS = 180;
export const ANCIENT_DAYS = 365;

/** A day whose cards are mostly still in their first learning steps stays a sapling. */
export const SAPLING_LEARNING_SHARE = 0.5;

/** Cards a day needs for a medium, then a large crown. */
export const CROWN_SIZE_CARDS = [15, 40] as const;

/** Share of struggling cards for health 1, 2, 3. */
export const HEALTH_THRESHOLDS = [0.12, 0.25, 0.45] as const;

/**
 * Forgetting is part of learning new cards, so a plant only starts to look unwell once it
 * has matured. Without this, every new day's plant would show as struggling on day two.
 */
export const HEALTH_MIN_STAGE = Stage.Mature;

/**
 * Days away before a pond forms.
 *
 * The original uses 7. The brief asks for "gaps of 2+ weeks", so the default here is 14 and
 * it is a setting. See `DECISIONS.md`.
 */
export const DEFAULT_BREAK_DAYS = 14;

/** Plants drawn one by one; older ones fold into the deep grove at the back. */
export const MAX_INDIVIDUAL_PLANTS = 730;

/** Variants per species, for a little shape variety within one kind of plant. */
export const PLANT_VARIANTS = 4;

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const v = Array.from(values).sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function stageFor(strengths: readonly number[], learningShare: number, isToday: boolean): Stage {
  if (isToday) return Stage.Seedling;
  if (strengths.length === 0 || learningShare > SAPLING_LEARNING_SHARE) return Stage.Sapling;
  const m = median(strengths);
  if (m >= ANCIENT_DAYS) return Stage.Ancient;
  if (m >= OLD_DAYS) return Stage.Old;
  if (m >= MATURE_DAYS) return Stage.Mature;
  return Stage.Young;
}

export function healthFor(strugglingShare: number): 0 | 1 | 2 | 3 {
  let level = 0;
  for (const t of HEALTH_THRESHOLDS) if (strugglingShare >= t) level++;
  return level as 0 | 1 | 2 | 3;
}

export function sizeFor(n: number): 0 | 1 | 2 {
  return n < CROWN_SIZE_CARDS[0] ? 0 : n < CROWN_SIZE_CARDS[1] ? 1 : 2;
}

/** Build one plant from a day's cohort. */
export function makePlant(cohort: Cohort, today: number): Plant {
  const ago = today - cohort.day;
  const seed = daySeed(cohort.day);
  const active = cohort.n - cohort.inactive;
  const stage = stageFor(cohort.strengths, cohort.learning / cohort.n, ago === 0);
  const health =
    active > 0 && stage >= HEALTH_MIN_STAGE ? healthFor(cohort.struggling / active) : 0;

  // "% remembered" is a real forgetting-curve figure only when most of the day's cards
  // have one. Otherwise it falls back to a flat estimate and says so.
  const measured = active > 0 && cohort.recall.length >= active / 2;
  const remembered =
    cohort.recall.length > 0
      ? cohort.recall.reduce((a, b) => a + b, 0) / cohort.recall.length
      : active > 0
        ? 1 - cohort.struggling / active
        : 1;

  return {
    day: cohort.day,
    ago,
    date: dayToISO(cohort.day),
    n: cohort.n,
    stage,
    size: sizeFor(cohort.n),
    health,
    // A roll, not an index into anything read today — species names now come from `kind`
    // instead (`mfSpecies.ts`), which matches the shape actually drawn; this field used to
    // be taken modulo the biome's species count for the tooltip name, independently of
    // `kind`, which routinely named a different species than the one on screen (fixed).
    // Kept, deterministic and tested, for whatever wants per-slot variety later.
    species: seed % 1024,
    seed,
    remembered: Math.round(remembered * 1000) / 1000,
    strength: Math.round(median(cohort.strengths) * 10) / 10,
    struggling: cohort.struggling,
    measured,
    mature: cohort.mature,
    variant: seed % PLANT_VARIANTS,
  };
}

/**
 * (current, longest) streak in study days.
 *
 * A streak survives today not being studied yet — the day isn't over. It passes over
 * `excused` days without growing: a semester break neither breaks a streak nor inflates it.
 */
export function streaks(
  reviewDays: ReadonlySet<number>,
  today: number,
  excused: ReadonlySet<number> = new Set(),
): { current: number; longest: number } {
  if (reviewDays.size === 0) return { current: 0, longest: 0 };

  let current = 0;
  for (let d = today; ; d--) {
    if (reviewDays.has(d)) {
      current++;
      continue;
    }
    // Today may simply not be done yet; an excused day is passed over without counting.
    if (d === today || excused.has(d)) continue;
    break;
  }

  let oldest = today;
  for (const d of reviewDays) if (d < oldest) oldest = d;

  let longest = 0;
  let run = 0;
  for (let d = oldest; d <= today; d++) {
    if (reviewDays.has(d)) run++;
    else if (!excused.has(d)) run = 0;
    if (run > longest) longest = run;
  }

  return { current, longest };
}

/** `[dayThatEndedIt, length]` for each break of at least `minDays`, oldest first. */
export function findBreaks(
  reviewDays: ReadonlySet<number>,
  oldest: number,
  today: number,
  minDays: number,
  excused: ReadonlySet<number> = new Set(),
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let gap = 0;
  for (let d = oldest; d <= today; d++) {
    if (reviewDays.has(d)) {
      // A break still in progress, running up to today, is not yet a pond.
      if (gap >= minDays) out.push([d, gap]);
      gap = 0;
    } else if (!excused.has(d)) {
      gap++;
    }
    // An excused day is simply skipped: it neither extends a break nor ends one.
  }
  return out;
}

/**
 * Mark each break on the first plant standing after it.
 *
 * Breaks with no plant between them, or only one, were really one spell away with a day or
 * two of study in the middle: they merge into a single pond rather than several side by side.
 */
export function markPonds(plants: Plant[], breaks: Array<[number, number]>): void {
  // [index of the plant after it, days away, day it began, day it ended]
  const ponds: Array<[number, number, number, number]> = [];
  for (const [resumed, length] of breaks) {
    let i = plants.findIndex((p) => p.day >= resumed);
    if (i < 0) i = plants.length;
    const prev = ponds[ponds.length - 1];
    if (prev && i <= prev[0] + 1) {
      prev[1] += length;
      prev[3] = resumed - 1;
    } else {
      ponds.push([i, length, resumed - length, resumed - 1]);
    }
  }
  for (const [i, days, began, ended] of ponds) {
    const plant = plants[Math.min(i, plants.length - 1)];
    if (!plant) continue;
    plant.gap = days;
    plant.gapFrom = dayToISO(began);
    plant.gapTo = dayToISO(ended);
  }
}

export interface GroveOptions {
  breakDays?: number;
  /** Days excluded from break detection and streaks. */
  excusedDays?: ReadonlySet<number>;
}

export function buildGrove(scan: ScanResult, opts: GroveOptions = {}): Grove {
  const breakDays = opts.breakDays ?? DEFAULT_BREAK_DAYS;
  const excused = opts.excusedDays ?? new Set<number>();
  const today = scan.today;

  const plants: Plant[] = [];
  const days = Array.from(scan.cohorts.keys()).sort((a, b) => a - b); // oldest first
  for (const d of days) {
    const cohort = scan.cohorts.get(d);
    if (cohort) plants.push(makePlant(cohort, today));
  }

  const reviewDays = new Set(scan.dayReviews.keys());
  if (plants.length > 0) {
    markPonds(plants, findBreaks(reviewDays, plants[0].day, today, breakDays, excused));
  }

  const { current, longest } = streaks(reviewDays, today, excused);
  const stats = statsFor(plants, {
    streak: current,
    longestStreak: longest,
    reviews: scan.totalReviews,
    todayReviews: scan.todayReviews,
    activeStudyDays: reviewDays.size,
  });

  return {
    plants,
    stats,
    seed: plants.length ? plants[0].seed : 0,
    reviewDays,
    dayReviews: scan.dayReviews,
    dayTime: scan.dayTime,
    today,
  };
}

function statsFor(
  plants: readonly Plant[],
  extra: Pick<GroveStats, 'streak' | 'longestStreak' | 'reviews' | 'todayReviews' | 'activeStudyDays'>,
): GroveStats {
  let cards = 0;
  let ancient = 0;
  let old = 0;
  let young = 0;
  let ailing = 0;
  let ponds = 0;
  let matureCards = 0;
  for (const p of plants) {
    cards += p.n;
    if (p.stage === Stage.Ancient) ancient++;
    else if (p.stage === Stage.Old) old++;
    else if (p.stage === Stage.Young) young++;
    if (p.health > 0) ailing++;
    if (p.gap) ponds++;
    matureCards += p.mature;
  }
  const last = plants[plants.length - 1];
  return {
    plants: plants.length,
    cards,
    ancient,
    old,
    young,
    ailing,
    ponds,
    matureCards,
    groveAge: plants.length ? plants[0].ago : 0,
    oldestDate: plants.length ? plants[0].date : null,
    plantedToday: !!last && last.ago === 0,
    todayCards: last && last.ago === 0 ? last.n : 0,
    ...extra,
  };
}

/**
 * Fold everything older than the newest `limit` plants into one summary.
 *
 * The renderer draws that as receding bands of canopy, so a ten-year grove costs the same
 * to draw as a one-year one. The stats line still counts every plant; only the drawing is
 * grouped.
 */
export function mergeOld(grove: Grove, limit = MAX_INDIVIDUAL_PLANTS): Grove {
  const plants = grove.plants;
  if (plants.length <= limit) return grove;
  const cut = plants.length - limit;
  const old = plants.slice(0, cut);
  const kept = plants.slice(cut);
  const merged: MergedPlants = {
    count: old.length,
    cards: old.reduce((a, p) => a + p.n, 0),
    ancient: old.filter((p) => p.stage === Stage.Ancient).length,
    ponds: old.filter((p) => p.gap).length,
    fromDate: old[0].date,
    toDate: old[old.length - 1].date,
    fromAgo: old[0].ago,
    toAgo: old[old.length - 1].ago,
  };
  return { ...grove, plants: kept, merged };
}
