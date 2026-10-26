/**
 * What the way you study does to the grove, besides the plants themselves.
 *
 * Ported from Memory Forest's `events.py`. The Nature setting decides what missing days
 * costs: Peaceful, nothing (a week away leaves a pond). Wild: a day without reviews and
 * smoke rises, a warning; from the second day in a row a fire takes hold, a little more of
 * the grove each day, and it burns until seven days of study put it out. Merciless: a
 * single day without reviews and an asteroid wipes out the grove. Peaceful only ever brings
 * good things (a big day of learning leaves flowers); Wild and Merciless add the rest.
 *
 * Memory Forest counts days as `ago` (0 today, increasing into the past); Memory Garden uses
 * absolute day numbers (`src/data/day.ts`, increasing into the future) everywhere else, so
 * every loop direction here is inverted from the original accordingly — the same conversion
 * `forest.ts`'s own `streaks`/`findBreaks` already made porting `forest_data.py`.
 *
 * Not ported: `timeline_steps`/`timeline_days` (`TIMELINE_*`) — Memory Forest's Debug tab
 * timeline scrubber, a dev-only tool for building synthetic test forests, not part of the
 * data pipeline a real render needs.
 */

import type { Plant } from './types';
import { median } from './forest';

export type Nature = 'peaceful' | 'wild' | 'merciless';

export const NATURE_LABELS: Record<Nature, string> = { peaceful: 'Peaceful', wild: 'Wild', merciless: 'Merciless' };
export const DEFAULT_NATURE: Nature = 'peaceful';

export const NATURE_NOTES: Record<Nature, string> = {
  peaceful: 'Missing days costs nothing, and the garden never scolds you.',
  wild: 'Miss two days of reviews in a row and smoke rises; miss a third and a fire spreads until seven days of study put it out. Bad habits leave marks too.',
  merciless: 'Miss a single day of reviews and an asteroid wipes out the garden. Bad habits leave marks too.',
};
export const NATURE_SWITCH_NOTE = 'Switch back any time and the garden is as it was.';

export function natureLevel(value: unknown): Nature {
  return typeof value === 'string' && value in NATURE_LABELS ? (value as Nature) : DEFAULT_NATURE;
}

/** Whether this nature keeps the grove to the good things only (Peaceful). */
export function calm(level: Nature): boolean {
  return level === 'peaceful';
}

/** How many days after a strike it is still news. */
export const STRIKE_NEWS_DAYS = 7;
/** A crater has healed away this many days after its strike. */
export const CRATER_GONE_DAYS = 400;

/** Wild's fire: breaks out on the FIRE_FROM-th day in a row without reviews, each day away
 * from then on sets FIRE_PER_DAY of the grove burning, up to FIRE_MAX. Out once you have
 * studied on FIRE_HEAL_DAYS days since. */
export const FIRE_FROM = 3;
export const FIRE_PER_DAY = 0.05;
export const FIRE_MAX = 0.5;
export const FIRE_HEAL_DAYS = 7;

/** A big learning day: at least BIG_DAY_JUMP times, and BIG_DAY_MORE cards more than, the
 * most learned on any day of the BIG_DAY_WINDOW days before it, once there are
 * BIG_DAY_HISTORY days of learning to measure against. */
export const BIG_DAY_WINDOW = 14;
export const BIG_DAY_JUMP = 1.25;
export const BIG_DAY_MORE = 2;
export const BIG_DAY_HISTORY = 7;

/** The grass grows tall after STAGNANT_AFTER days without new cards, while still reviewing
 * (some review within the last STAGNANT_REVIEWING days); tallest at STAGNANT_FULL. */
export const STAGNANT_AFTER = 7;
export const STAGNANT_FULL = 30;
export const STAGNANT_REVIEWING = 3;

/** Review hell: more overdue reviews than REVIEW_HELL_TIMES the usual day's reviews, and
 * more than REVIEW_HELL_MIN. Tumbleweeds are at their most at twice that. */
export const REVIEW_HELL_TIMES = 2;
export const REVIEW_HELL_MIN = 30;
export const REVIEW_HELL_USUAL_DAYS = 30;
/** The backlog counts as cleared within this many days of review hell being on. */
export const BACKLOG_CLEARED_WITHIN = 7;

/** A leech is cured once its interval grows mature: its crow is gone, and a songbird sits
 * on its tree for CURED_DAYS days. */
export const CURED_DAYS = 7;

/** How far back a run of missed days is looked for. */
export const LOOKBACK_DAYS = 3660;

/** Days in a row without reviews up to now, counting today while it has none yet. */
export function missedNow(reviewDays: ReadonlySet<number>, today: number): number {
  let run = 0;
  while (run < LOOKBACK_DAYS && !reviewDays.has(today - run)) run++;
  return run;
}

/** `[oldestMissedDay, newestMissedDay]` (absolute days) for each run of days without
 * reviews, oldest first. Today is left out: it is not over yet. */
function runs(reviewDays: ReadonlySet<number>, oldest: number, today: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let start: number | null = null;
  for (let d = oldest; d < today; d++) {
    if (reviewDays.has(d)) {
      if (start !== null) out.push([start, d - 1]);
      start = null;
    } else if (start === null) {
      start = d;
    }
  }
  if (start !== null) out.push([start, today - 1]);
  return out;
}

/** The days Merciless's asteroid struck, oldest first (as `ago`): the first day of each run
 * of days without reviews since you first studied — one strike a run, however long. */
export function strikes(reviewDays: ReadonlySet<number>, today: number): number[] {
  if (reviewDays.size === 0) return [];
  let oldest = today;
  for (const d of reviewDays) if (d < oldest) oldest = d;
  oldest = Math.max(oldest, today - LOOKBACK_DAYS);
  return runs(reviewDays, oldest, today).map(([start]) => today - start);
}

/** The run of review days that ended just before the break containing `ago`. */
function streakBefore(reviewDays: ReadonlySet<number>, ago: number, today: number): number {
  let d = ago;
  while (!reviewDays.has(today - d) && d < LOOKBACK_DAYS) d++;
  let run = 0;
  // `d + run` in the original (ago-space, increasing = further into the past) is
  // `today - (d + run)` in absolute terms, not `today - (d - run)` — the same sign slip as
  // `fireState`'s `began`.
  while (reviewDays.has(today - (d + run))) run++;
  return run;
}

export interface Crater {
  ago: number;
  lost: number;
  streak: number;
}
interface CraterDetail extends Crater {
  before: Plant[];
}

/** What strikes on `hits` (oldest first, as `ago`) leave: each takes every plant from the
 * one before it up to its own day. */
function wipe(
  plants: readonly Plant[],
  hits: readonly number[],
  reviewDays: ReadonlySet<number>,
  today: number,
): { craters: Crater[]; latest: CraterDetail | null; kept: Plant[] } {
  const craters: Crater[] = [];
  let latest: CraterDetail | null = null;
  let prev: number | null = null;
  for (const ago of hits) {
    const lost = plants.filter((t) => t.ago >= ago && (prev === null || t.ago < prev));
    prev = ago;
    if (lost.length) {
      latest = { ago, lost: lost.length, streak: streakBefore(reviewDays, ago, today), before: lost };
      if (ago <= CRATER_GONE_DAYS) craters.push({ ago, lost: lost.length, streak: latest.streak });
    }
  }
  const lastHit = hits.length ? hits[hits.length - 1] : undefined;
  let kept = plants.filter((t) => !hits.length || t.ago < (lastHit as number));
  if (hits.length && kept.length && kept[0].gap) {
    // the break that struck is marked by its crater: no pond for it in the new grove
    kept = [{ ...kept[0], gap: undefined }, ...kept.slice(1)];
  }
  return { craters, latest, kept };
}

export interface MercilessResult {
  hits: number[];
  plants: Plant[];
  craters: Crater[];
  latest: CraterDetail | null;
  doom: { missed: 1; grace: 1; left: 0 } | null;
}

/** What Merciless does to this grove: a strike for every run of missed days, and the grove
 * starts again after the latest. Strikes on days in `hold` don't come yet (another device's
 * reviews still on their way). */
export function merciless(
  plants: readonly Plant[],
  reviewDays: ReadonlySet<number>,
  today: number,
  hold: ReadonlySet<number> = new Set(),
): MercilessResult {
  const hits = strikes(reviewDays, today).filter((d) => !hold.has(d));
  const { craters, latest, kept } = wipe(plants, hits, reviewDays, today);
  const doom = !reviewDays.has(today) && reviewDays.has(today - 1) ? { missed: 1 as const, grace: 1 as const, left: 0 as const } : null;
  return { hits, plants: kept, craters, latest, doom };
}

export interface FireState {
  share: number;
  healed: number;
  missed: number;
  began: number;
  epoch: number;
  out: boolean;
  news: boolean;
}

/** Wild's fire as the days studied leave it. None when nothing is burning. */
export function fireState(reviewDays: ReadonlySet<number>, today: number): FireState | null {
  if (reviewDays.size === 0) return null;
  let oldest = today;
  for (const d of reviewDays) if (d < oldest) oldest = d;
  oldest = Math.max(oldest, today - LOOKBACK_DAYS);
  let share = 0, healed = 0, run = 0, missed = 0, began = 0, epoch = 0, out = false;
  // Oldest day first, today last: this is a sequential day-by-day simulation (`run`,
  // `share` and `healed` all carry state from one day to the next), so — unlike most of
  // this file's loops, which don't care about order — the direction has to match the
  // original's exactly. Memory Forest's own loop runs `d` (ago) from the oldest day *down*
  // to 0 (today), which in absolute-day terms is ascending, not descending.
  for (let d = oldest; d <= today; d++) {
    const ago = today - d;
    if (reviewDays.has(d)) {
      run = 0;
      if (share) {
        healed++;
        if (healed >= FIRE_HEAL_DAYS) { share = 0; out = ago === 0; }
      }
    } else if (d !== today) {
      run++;
      out = false;
      if (run >= FIRE_FROM) {
        if (!share) {
          began = ago + run - 1;
          epoch = Array.from(reviewDays).filter((x) => x < today - began).length;
          missed = 0;
        }
        share = Math.min(FIRE_MAX, Math.max(share, FIRE_PER_DAY * (run - FIRE_FROM + 1)));
        healed = 0;
        missed = Math.max(missed, run);
      }
    }
  }
  if (!share && !out) return null;
  const news = !!share && (healed === 0 || (healed === 1 && reviewDays.has(today)));
  return { share, healed, missed, began, epoch, out, news };
}

export interface SmokeState {
  began: number;
  epoch: number;
}

/** Wild's warning: after FIRE_FROM - 1 days missed in a row, while today has no reviews
 * yet, smoke rises from the plants that would catch fire if today goes by too. */
export function smokeState(reviewDays: ReadonlySet<number>, today: number): SmokeState | null {
  const run = missedNow(reviewDays, today) - 1;
  if (reviewDays.size === 0 || run !== FIRE_FROM - 1 || fireState(reviewDays, today)) return null;
  const began = run;
  const epoch = Array.from(reviewDays).filter((x) => x < today - began).length;
  return { began, epoch };
}

/** FNV-1a-ish 32-bit hash, standing in for Python's zlib.crc32 — both are just stable,
 * well-distributed hashes over the same string; the lot only needs a stable sort order, not
 * the same numeric value as the original. */
function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The plants a fire of `share` takes: among those that stood when the break began, picked
 * by lot, the same ones every day of it. */
function fireLot(plants: readonly Plant[], share: number, began: number, epoch: number, limit: number | null): Set<Plant> {
  const scoped = limit ? plants.slice(Math.max(0, plants.length - limit)) : plants;
  const pool = scoped.filter((t) => t.ago > began);
  const n = pool.length ? Math.min(pool.length, Math.max(1, Math.round(share * pool.length))) : 0;
  const sorted = [...pool].sort((a, b) => stableHash(`fire|${a.seed ?? a.ago}|${epoch}`) - stableHash(`fire|${b.seed ?? b.ago}|${epoch}`));
  return new Set(sorted.slice(0, n));
}

export interface FireInfo {
  left: number;
  trees: number;
  missed: number;
  began: number;
  out: boolean;
  news: boolean;
  smoke: number;
}

/** The plants with Wild's fire on them (copied with `burn`, 1 while it blazes down to 0 as
 * it heals, or `smoke` the day before one breaks out), and what the page says of it. */
export function setFire(
  plants: readonly Plant[],
  reviewDays: ReadonlySet<number>,
  today: number,
  limit: number | null = null,
): [Plant[], FireInfo | null] {
  const st = fireState(reviewDays, today);
  if (st === null) {
    const warn = smokeState(reviewDays, today);
    if (warn === null) return [plants as Plant[], null];
    const smoking = fireLot(plants, FIRE_PER_DAY, warn.began, warn.epoch, limit);
    const info: FireInfo = { left: 0, trees: 0, missed: FIRE_FROM - 1, began: warn.began, out: false, news: false, smoke: smoking.size };
    return [plants.map((t) => (smoking.has(t) ? { ...t, smoke: 1 } : t)), info];
  }
  const info: FireInfo = { left: 0, trees: 0, missed: st.missed, began: st.began, out: st.out, news: st.news, smoke: 0 };
  if (!st.share) return [plants as Plant[], info];
  const burning = fireLot(plants, st.share, st.began, st.epoch, limit);
  const burn = Math.round((1 - st.healed / FIRE_HEAL_DAYS) * 1000) / 1000;
  info.left = FIRE_HEAL_DAYS - st.healed;
  info.trees = burning.size;
  return [plants.map((t) => (burning.has(t) ? { ...t, burn } : t)), info];
}

/** The plants, each whose day was a big jump in new cards, copied with `big`: what it beat,
 * the most in the two weeks before. Plants are assumed oldest-first (`forest.ts`'s own
 * order), matching the fast path of the original rather than its general one. */
export function markBigDays(plants: readonly Plant[]): Plant[] {
  const out: Plant[] = [];
  for (let i = 0; i < plants.length; i++) {
    const t = { ...plants[i] };
    delete (t as { big?: number }).big;
    if (i >= BIG_DAY_HISTORY) {
      const window: number[] = [];
      for (let j = i - 1; j >= 0 && plants[j].ago <= t.ago + BIG_DAY_WINDOW; j--) window.push(plants[j].n);
      const best = window.length ? Math.max(...window) : 0;
      if (best && t.n >= best * BIG_DAY_JUMP && t.n >= best + BIG_DAY_MORE) (t as { big?: number }).big = best;
    }
    out.push(t);
  }
  return out;
}

/** 0, or how tall the grass has grown (up to 1) after weeks without new cards. */
export function stagnation(plants: readonly Plant[], reviewDays: ReadonlySet<number>, today: number): number {
  let reviewing = false;
  for (let d = 0; d < STAGNANT_REVIEWING; d++) if (reviewDays.has(today - d)) { reviewing = true; break; }
  if (plants.length === 0 || !reviewing) return 0;
  const idle = plants[plants.length - 1].ago;
  if (idle < STAGNANT_AFTER) return 0;
  return Math.min(1, (idle - STAGNANT_AFTER + 1) / (STAGNANT_FULL - STAGNANT_AFTER + 1));
}

/** Your usual day's reviews: the median of the counts of the days you studied. */
export function usualReviews(dayCounts: readonly number[]): number {
  const counts = dayCounts.filter((n) => n > 0);
  return counts.length ? median(counts) : 0;
}

/** 0, or how deep in review hell (up to 1) this many overdue reviews put you. */
export function reviewHell(overdue: number, usual: number): number {
  const limit = Math.max(REVIEW_HELL_MIN, REVIEW_HELL_TIMES * usual);
  if (overdue <= limit) return 0;
  return Math.min(1, overdue / limit - 1);
}

/** Whether today is the day a backlog was cleared. */
export function backlogCleared(overdue: number, today: number, hellDay: number | null, clearedDay: number | null): boolean {
  if (clearedDay === today) return true;
  return overdue === 0 && hellDay !== null && today - hellDay >= 0 && today - hellDay <= BACKLOG_CLEARED_WITHIN
    && (clearedDay === null || clearedDay < hellDay);
}

/** The plants without their crows, for Peaceful. */
export function calmPlants(plants: readonly Plant[]): Plant[] {
  return plants.map((t) => {
    if (!(t as { leeches?: unknown }).leeches) return t;
    const copy = { ...t };
    delete (copy as { leeches?: unknown }).leeches;
    return copy;
  });
}
