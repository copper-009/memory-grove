/**
 * The single pass over every card and repetition.
 *
 * This is the hot loop: a 50k-card knowledge base carries on the order of a million
 * repetitions, and everything downstream is cheap by comparison. So it runs **once**,
 * allocates nothing per repetition, and produces every aggregate the rest of the layer
 * needs — cohorts, per-day review counts, per-day study seconds, totals and the
 * high-water mark used for cache invalidation.
 */

import type { CardLike, Cohort, CardState, RepLike } from './types';
import { dayIndex, MS_PER_DAY } from './day';
import { cardStrength, elapsedDays, retrievability, realReps } from './memory';

/** Scores at or above this are not grades: the leech dialog, a reset, a manual reschedule. */
const NOT_A_GRADE = 2;
/** `QueueInteractionScore.AGAIN`. */
const AGAIN = 0;
/** `QueueInteractionScore.VIEWED_AS_LEECH`. */
const VIEWED_AS_LEECH = 2;

/** A repetition that counts as study. */
export function isGrade(rep: RepLike): boolean {
  return !rep.isCram && rep.score >= 0 && rep.score < NOT_A_GRADE;
}

/** Cards lapsed within this many days count as struggling. From the original's `LAPSE_WINDOW_DAYS`. */
export const LAPSE_WINDOW_DAYS = 7;

/** A strength at or past this is "known well" — Anki's mature interval. */
export const MATURE_DAYS = 21;

/**
 * A card with a next-review date further past than this, or none at all despite having
 * been studied, is treated as effectively inactive. RemNote exposes no suspension flag;
 * see `reference/REMNOTE_API.md` §2.3.
 */
export const INACTIVE_OVERDUE_DAYS = 365;

export interface ScanOptions {
  /** Now, in unix ms. */
  now: number;
  rolloverHour: number;
  /** Ignore everything before this day number. `undefined` means no start date. */
  startDay?: number;
  /** Rem ids whose cards are excluded, already expanded to include descendants. */
  excludedRemIds?: ReadonlySet<string>;
  /** When set, only cards whose Rem is in here count. */
  includedRemIds?: ReadonlySet<string>;
}

export interface ScanResult {
  /** day number -> cohort, for days that planted something. */
  cohorts: Map<number, Cohort>;
  /** day number -> reviews on that day. */
  dayReviews: Map<number, number>;
  /** day number -> seconds spent. */
  dayTime: Map<number, number>;
  /** day number -> cards falling due that day, from today forward. */
  dueByDay: Map<number, number>;
  totalReviews: number;
  todayReviews: number;
  /** Cards overdue as of today. */
  overdue: number;
  today: number;
  /** Newest repetition timestamp seen, for cache invalidation. */
  newestRep: number;
  cardCount: number;
}

/** Derive a card's state. RemNote exposes none of this; see `reference/REMNOTE_API.md` §2.2. */
export function cardState(card: CardLike, reps: RepLike[], strength: number): CardState {
  if (reps.length === 0) return 'new';
  if ((card.timesWrongInRow ?? 0) > 0) return 'relearning';
  const last = reps[reps.length - 1];
  if (last.score === AGAIN) return 'relearning';
  if (strength < 1 || reps.length < 2) return 'learning';
  return 'review';
}

function emptyCohort(day: number): Cohort {
  return {
    day,
    n: 0,
    learning: 0,
    strengths: [],
    struggling: 0,
    inactive: 0,
    recall: [],
    leeches: 0,
    mature: 0,
  };
}

/**
 * One pass over everything.
 *
 * `getRemId` lets the caller map a card to the Rem used for include/exclude filtering
 * without this module knowing anything about the SDK. It is only consulted when a filter
 * is actually configured, which is the uncommon case.
 */
export function scanCards(cards: readonly CardLike[], opts: ScanOptions): ScanResult {
  const { now, rolloverHour, startDay, excludedRemIds, includedRemIds } = opts;
  const today = dayIndex(now, rolloverHour);
  const filtering = (excludedRemIds && excludedRemIds.size > 0) || !!includedRemIds;

  const cohorts = new Map<number, Cohort>();
  const dayReviews = new Map<number, number>();
  const dayTime = new Map<number, number>();
  const dueByDay = new Map<number, number>();

  let totalReviews = 0;
  let overdue = 0;
  let newestRep = 0;
  let counted = 0;

  const lapseCutoff = now - LAPSE_WINDOW_DAYS * MS_PER_DAY;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    if (filtering) {
      const rid = card.remId;
      if (excludedRemIds && excludedRemIds.has(rid)) continue;
      if (includedRemIds && !includedRemIds.has(rid)) continue;
    }

    const reps = realReps(card);

    // --- per-day review tallies, and the card's first graded repetition -------------
    let firstGraded = -1;
    for (let k = 0; k < reps.length; k++) {
      const rep = reps[k];
      if (!isGrade(rep)) continue;
      if (rep.date > newestRep) newestRep = rep.date;
      const d = dayIndex(rep.date, rolloverHour);
      if (startDay != null && d < startDay) continue;
      if (firstGraded < 0) firstGraded = d;
      // Today is not over, so it is counted, but a repetition dated in the future is not.
      if (d > today) continue;
      dayReviews.set(d, (dayReviews.get(d) ?? 0) + 1);
      totalReviews++;
      if (rep.responseTime) {
        dayTime.set(d, (dayTime.get(d) ?? 0) + rep.responseTime / 1000);
      }
    }

    // --- due counts ---------------------------------------------------------------
    const next = card.nextRepetitionTime;
    if (next != null && reps.length > 0) {
      const dueDay = dayIndex(next, rolloverHour);
      if (dueDay <= today) overdue++;
      else dueByDay.set(dueDay, (dueByDay.get(dueDay) ?? 0) + 1);
    }

    counted++;

    // A card never graded has no day to belong to: it plants nothing.
    if (firstGraded < 0) continue;

    const cohort = cohorts.get(firstGraded) ?? emptyCohort(firstGraded);
    if (cohort.n === 0) cohorts.set(firstGraded, cohort);
    cohort.n++;

    const strength = cardStrength(card, reps);
    const state = cardState(card, reps, strength);

    if (state === 'learning' || state === 'new') {
      cohort.learning++;
    } else {
      cohort.strengths.push(strength);
      if (strength >= MATURE_DAYS) cohort.mature++;
    }

    // Effectively inactive: holds its place in the plant's size and stage, but can neither
    // struggle nor slip, so it counts towards neither health nor recall.
    const inactive =
      reps.length > 0 && (next == null || now - next > INACTIVE_OVERDUE_DAYS * MS_PER_DAY);
    if (inactive) {
      cohort.inactive++;
      continue;
    }

    let lapsedRecently = false;
    let leechMarked = false;
    for (let k = reps.length - 1; k >= 0; k--) {
      const rep = reps[k];
      if (rep.score === VIEWED_AS_LEECH) leechMarked = true;
      if (rep.date < lapseCutoff) break;
      if (rep.score === AGAIN) lapsedRecently = true;
    }
    if (state === 'relearning' || lapsedRecently) cohort.struggling++;
    if (leechMarked && strength < MATURE_DAYS) cohort.leeches++;

    if (strength > 0) {
      cohort.recall.push(retrievability(strength, elapsedDays(card, now, reps)));
    }
  }

  return {
    cohorts,
    dayReviews,
    dayTime,
    dueByDay,
    totalReviews,
    todayReviews: dayReviews.get(today) ?? 0,
    overdue,
    today,
    newestRep,
    cardCount: counted,
  };
}
