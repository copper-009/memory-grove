/**
 * Synthetic knowledge bases for tests, benchmarks and screenshots.
 *
 * Generated from a fixed seed so every run — unit tests, the 50k benchmark, the screenshot
 * harness — sees byte-identical input. Histories are coherent: intervals grow, lapses reset
 * them, and `nextRepetitionTime`/`lastRepetitionTime` agree with the final repetition, so the
 * derived-strength path in `memory.ts` is exercised the way real data exercises it.
 *
 * The important subtlety: **the set of days the user studied is decided first**, and every
 * repetition is then scheduled onto one of those days. A review that would fall during a gap
 * is pushed to the day the user came back. Without that, a "gap" fixture would still have
 * reviews landing throughout the gap and would never produce a pond.
 */

import type { CardLike, RepLike } from './types';
import { MS_PER_DAY, dayIndex, DEFAULT_ROLLOVER_HOUR } from './day';
import { rng } from './rng';

const AGAIN = 0;
const HARD = 0.5;
const GOOD = 1;
const EASY = 1.5;

export interface FixtureSpec {
  /** Days of history, ending today. */
  days: number;
  /** New cards introduced on a day that introduces any. */
  newPerDay: [number, number];
  /** Chance a given eligible day is studied at all. */
  studyChance: number;
  /** Chance a study day introduces new cards, rather than only reviewing. */
  newChance: number;
  /** Chance any given repetition is a lapse. */
  lapseRate: number;
  /** `[daysAgoItStarted, lengthInDays]` stretches with no study whatsoever. */
  gaps?: Array<[number, number]>;
  /** Weekdays never studied. 0 = Sunday. */
  skipWeekdays?: number[];
  seed?: number;
}

export const FIXTURES = {
  /** Signed up three days ago. Everything is a seedling; nothing can be measured yet. */
  newbie: { days: 3, newPerDay: [4, 12], studyChance: 1, newChance: 1, lapseRate: 0.1 },

  /** Two years of near-daily study. Ancient plants, every milestone, a deep grove. */
  veteran: { days: 730, newPerDay: [8, 30], studyChance: 0.93, newChance: 0.75, lapseRate: 0.11 },

  /** Studies hard in bursts, then disappears for weeks. Several ponds. */
  gappy: {
    days: 540,
    newPerDay: [5, 25],
    studyChance: 0.85,
    newChance: 0.7,
    lapseRate: 0.13,
    gaps: [
      [500, 30],
      [380, 21],
      [210, 45],
      [90, 16],
    ],
  },

  /** Studies most days but forgets a great deal. Yellowing everywhere. */
  forgetful: { days: 400, newPerDay: [10, 28], studyChance: 0.95, newChance: 0.8, lapseRate: 0.45 },

  /** Weekdays only — the case a relative streak has to treat kindly. */
  weekdays: {
    days: 300,
    newPerDay: [6, 18],
    studyChance: 1,
    newChance: 0.6,
    lapseRate: 0.12,
    skipWeekdays: [0, 6],
  },

  /** Big enough to benchmark against: ~50k cards. */
  huge: { days: 1200, newPerDay: [40, 60], studyChance: 0.96, newChance: 0.97, lapseRate: 0.12 },
} satisfies Record<string, FixtureSpec>;

export type FixtureName = keyof typeof FIXTURES;

/**
 * Intervals a healthy card walks through, in days.
 *
 * Tuned so a card learned two years ago and answered well throughout reaches an interval
 * past a year — which is what makes a two-year grove grow ancient plants, as it should.
 */
const LADDER = [1, 3, 7, 16, 35, 70, 140, 260, 420, 650, 900, 1200];

function intervalAt(step: number): number {
  return LADDER[Math.min(step, LADDER.length - 1)];
}

export function makeCards(
  spec: FixtureSpec,
  now: number,
  rolloverHour = DEFAULT_ROLLOVER_HOUR,
): CardLike[] {
  const r = rng(spec.seed ?? 0x6d656d6f);
  const today = dayIndex(now, rolloverHour);
  const oldest = today - spec.days;

  // 1. Decide which days were studied, before anything is scheduled onto them.
  const inGap = (day: number) => {
    const ago = today - day;
    return (spec.gaps ?? []).some(([start, len]) => ago <= start && ago > start - len);
  };
  const studyDays: number[] = [];
  const isStudyDay = new Set<number>();
  for (let day = oldest; day <= today; day++) {
    if (inGap(day)) continue;
    if (spec.skipWeekdays?.includes(new Date(day * MS_PER_DAY).getUTCDay())) continue;
    if (r() > spec.studyChance) continue;
    studyDays.push(day);
    isStudyDay.add(day);
  }
  if (studyDays.length === 0) return [];

  /** The first study day on or after `day`, or `null` if the user never came back. */
  const nextStudyDay = (day: number): number | null => {
    if (isStudyDay.has(day)) return day;
    let lo = 0;
    let hi = studyDays.length - 1;
    let found: number | null = null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (studyDays[mid] >= day) {
        found = studyDays[mid];
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return found;
  };

  // Mid-morning, so nothing lands near the rollover boundary by accident.
  const tsOf = (day: number, nth: number) =>
    (day + 0.4) * MS_PER_DAY + rolloverHour * 3_600_000 + nth * 9_000;

  const cards: CardLike[] = [];
  let id = 0;

  // 2. Introduce cards on study days, and walk each one forward across study days only.
  for (const day of studyDays) {
    if (r() > spec.newChance) continue;
    const n = spec.newPerDay[0] + Math.floor(r() * (spec.newPerDay[1] - spec.newPerDay[0] + 1));
    for (let k = 0; k < n; k++) {
      const history: RepLike[] = [];
      let at = day;
      let step = 0;
      let lastScore = GOOD;

      for (let guard = 0; guard < 40; guard++) {
        const lapse = history.length > 0 && r() < spec.lapseRate;
        lastScore = lapse ? AGAIN : r() < 0.12 ? HARD : r() < 0.85 ? GOOD : EASY;
        const scheduledTs = tsOf(at, k);
        history.push({
          date: scheduledTs,
          score: lastScore,
          responseTime: 2_000 + Math.floor(r() * 9_000),
          scheduled: scheduledTs,
        });
        step = lapse ? Math.max(0, step - 2) : step + 1;

        const dueDay = at + intervalAt(step);
        if (dueDay > today) {
          // Still scheduled ahead: this is the card as it stands now.
          cards.push({
            _id: `c${id}`,
            remId: `r${id >> 2}`,
            createdAt: tsOf(day, k),
            repetitionHistory: history,
            lastRepetitionTime: scheduledTs,
            nextRepetitionTime: tsOf(dueDay, k),
            timesWrongInRow: lastScore === AGAIN ? 1 : 0,
          });
          id++;
          break;
        }
        // Answered on the day the user was actually there; a review falling inside a gap
        // waits until they come back.
        const done = nextStudyDay(dueDay);
        if (done == null) {
          // The user never returned: the card sits overdue from its due date.
          cards.push({
            _id: `c${id}`,
            remId: `r${id >> 2}`,
            createdAt: tsOf(day, k),
            repetitionHistory: history,
            lastRepetitionTime: scheduledTs,
            nextRepetitionTime: tsOf(dueDay, k),
            timesWrongInRow: lastScore === AGAIN ? 1 : 0,
          });
          id++;
          break;
        }
        at = done;
      }
    }
  }
  return cards;
}

/** A fixture by name. */
export function fixture(name: FixtureName, now: number): CardLike[] {
  return makeCards(FIXTURES[name], now);
}

/** A fixed "now" so fixtures and snapshots never drift with the wall clock. */
export const FIXED_NOW = Date.UTC(2026, 9, 15, 10, 30, 0); // 15 Oct 2026, 10:30 UTC
