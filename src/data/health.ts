/**
 * Ecosystem health: a 0–100 score for how consistently you have been studying.
 *
 * This is not in Memory Forest. The original's Nature setting is binary and punitive — miss
 * a day in Merciless and an asteroid flattens everything. The brief asks for something
 * kinder and more honest: a **relative** measure where one missed day barely registers but a
 * pattern of misses does, and where recovery is always possible.
 *
 * ## How the score is reached
 *
 * Health is **simulated forward** over the window rather than averaged. Each countable day
 * nudges it: a day studied pulls it towards 100 by `recovery`, a day missed pushes it down
 * by `decay`.
 *
 * Grace is a **budget, not a per-run allowance**. You start with `graceDays` credits, a
 * missed day spends one, and every `graceRefillDays` of study earns one back (up to the
 * cap). That distinction is what makes the brief's two requirements hold at once:
 *
 * - A single missed day after a good run spends a credit you had in hand: **no dent at all**.
 * - A *pattern* of misses spends credits faster than study replaces them, so once the budget
 *   runs dry every further miss bites. Missing one day in three is not free.
 *
 * An earlier version gave grace per consecutive run, which meant a user who skipped every
 * third day forever was never charged anything. That was wrong, and the tests now pin it.
 *
 * A long unbroken absence compounds on top: from the second consecutive missed day the decay
 * scales with the length of the run, so three weeks away costs far more than seven scattered
 * days.
 *
 * The reported score is the **mean of the last `SMOOTH_DAYS` days of the simulation**, not
 * its final value. Reading the final point alone made the number lurch with the day of the
 * week — a weekday-only studier scored 98 when checked on a Thursday and far less on a
 * Monday, for identical habits. Averaging the tail answers the question actually being
 * asked, which is "how have things been lately", not "what happened yesterday".
 *
 * Because it is a simulation over a bounded window and not an accumulator, it is **pure**:
 * the same history always gives the same score, with no stored state to drift or corrupt.
 *
 * ## Excused days
 *
 * An excused day is **skipped outright** — it is not a study day and not a missed day, and
 * it does not consume a slot in the window, so the window reaches that much further back.
 * A three-month summer break therefore leaves the score exactly where it was.
 *
 * Studying *during* an excused day still counts as a study day. Studying never hurts.
 */

import type { Severity, StudyCalendar } from './calendar';
import { isBoosted, isExcused, pauseActive, pauseCovers } from './calendar';
import { isoToDay } from './day';

export interface SeverityProfile {
  /** Countable days looked at. Excused days don't consume a slot. */
  window: number;
  /** Share of the way health falls on a missed day, past grace. */
  decay: number;
  /** Share of the way health climbs back on a studied day. */
  recovery: number;
  /** Missed days you may have in hand without being charged. */
  graceDays: number;
  /** Study days needed to earn one grace credit back. 0 means grace never replenishes. */
  graceRefillDays: number;
  /** How much of the drop below 100 is actually shown in the scene. */
  visualGain: number;
}

export const SEVERITY_PROFILES: Record<Exclude<Severity, 'custom'>, SeverityProfile> = {
  // Nothing visibly declines; the score still exists and still slows growth.
  peaceful: { window: 28, decay: 0.03, recovery: 0.35, graceDays: 3, graceRefillDays: 4, visualGain: 0 },
  // The default: a mild decline that recovers quickly.
  gentle: { window: 28, decay: 0.07, recovery: 0.3, graceDays: 2, graceRefillDays: 7, visualGain: 0.55 },
  // Noticeable: creatures start hiding.
  wild: { window: 28, decay: 0.12, recovery: 0.22, graceDays: 1, graceRefillDays: 10, visualGain: 1 },
  // Strong decline, slow recovery — but recovery is always possible.
  merciless: { window: 42, decay: 0.2, recovery: 0.1, graceDays: 0, graceRefillDays: 0, visualGain: 1.35 },
};

/** A day inside an exam-period boost week counts for this much extra recovery. */
const BOOST_GAIN = 1.3;

/**
 * How far an unbroken run of misses can multiply the decay.
 *
 * The multiplier is `max(1, run - 1)`, so the first two consecutive misses are ordinary
 * misses — a weekend should not compound — and only a real absence starts to accelerate.
 */
const RUN_MAX = 4;

/** Days of the simulation's tail averaged into the reported score. */
const SMOOTH_DAYS = 7;

/** Backlog can cost at most this share of the score. */
const BACKLOG_WEIGHT = 0.25;

/** Fewer overdue cards than this never counts against you. */
const BACKLOG_FLOOR = 20;

export interface HealthInput {
  today: number;
  /** Day numbers with at least one review. */
  reviewDays: ReadonlySet<number>;
  calendar: StudyCalendar;
  severity: Severity;
  /** Used when `severity` is `'custom'`. */
  custom?: Partial<SeverityProfile>;
  /** Cards currently overdue. */
  overdue: number;
  /** Total cards, for sizing what counts as a big backlog. */
  totalCards: number;
}

export interface HealthResult {
  /** 0–100. The honest number: what the tooltip shows and what gates growth. */
  score: number;
  /** 0–100. What the scene actually draws, after the severity's visual gain. */
  visual: number;
  /** The consistency part alone, before the backlog adjustment. */
  consistency: number;
  /** 0–1. How well the backlog is held. */
  backlog: number;
  /** Change over the last seven countable days. */
  trend: number;
  /** Countable days that were studied, and the window actually used. */
  studied: number;
  counted: number;
  /** Excused days skipped inside the window's reach. */
  excused: number;
  paused: boolean;
  /** One short line: what would move the number most. */
  advice: string;
}

function profileFor(severity: Severity, custom?: Partial<SeverityProfile>): SeverityProfile {
  if (severity === 'custom') {
    return { ...SEVERITY_PROFILES.gentle, ...custom };
  }
  return SEVERITY_PROFILES[severity];
}

/**
 * Walk the window oldest-first, returning health after each countable day.
 *
 * Returned as a series so the trend can be read off the tail without a second simulation.
 */
function simulate(
  input: HealthInput,
  profile: SeverityProfile,
): { series: number[]; studied: number; excused: number } {
  const { today, reviewDays, calendar } = input;
  const cal = calendar;

  // Walk back collecting countable days. An excused day is skipped unless it was studied
  // anyway, in which case it counts as a study day — studying never hurts.
  const days: Array<{ day: number; studied: boolean }> = [];
  let excused = 0;
  // Bounded so a brand-new user with an empty calendar can't spin: at most a year back.
  const limit = today - 366;
  for (let d = today; d > limit && days.length < profile.window; d--) {
    const didStudy = reviewDays.has(d);
    if (!didStudy && isExcused(cal, d)) {
      excused++;
      continue;
    }
    // Today is not over yet, so an unstudied today is not a miss.
    if (d === today && !didStudy) continue;
    days.push({ day: d, studied: didStudy });
  }
  days.reverse();

  let h = 100;
  let run = 0;
  let studied = 0;
  // Grace credits in hand. Spent by a missed day, earned back by studying.
  let credit = profile.graceDays;
  const refill = profile.graceRefillDays > 0 ? 1 / profile.graceRefillDays : 0;
  const series: number[] = [];

  for (const { day, studied: didStudy } of days) {
    if (didStudy) {
      studied++;
      run = 0;
      credit = Math.min(profile.graceDays, credit + refill);
      const gain = profile.recovery * (isBoosted(cal, day) ? BOOST_GAIN : 1);
      h += (100 - h) * Math.min(1, gain);
    } else {
      run++;
      if (credit >= 1) {
        credit -= 1;
      } else {
        h -= h * profile.decay * Math.min(Math.max(1, run - 1), RUN_MAX);
      }
    }
    h = h < 0 ? 0 : h > 100 ? 100 : h;
    series.push(h);
  }
  return { series, studied, excused };
}

/**
 * How well the backlog is held, 0–1.
 *
 * Measured **relative to where it stood when a pause started**, and ignored entirely during
 * the grace period after resuming. A fortnight away naturally builds a queue; being handed a
 * dying ecosystem for it would be the opposite of the point.
 */
export function backlogScore(input: HealthInput): number {
  const { overdue, totalCards, calendar, today } = input;
  let baseline = 0;

  const pause = calendar.pause;
  if (pause) {
    const endsIso = pause.until;
    const paused = pauseCovers(pause, today);
    const end = endsIso != null ? isoToDay(endsIso) : null;
    const inGrace = !paused && end != null && today <= end + calendar.recoveryGraceDays;
    if (paused || inGrace) baseline = pause.backlogAtStart ?? overdue;
  }

  const excess = Math.max(0, overdue - baseline - BACKLOG_FLOOR);
  if (excess <= 0) return 1;
  // A backlog of 20% of the collection is as bad as it gets for scoring purposes.
  const tolerance = Math.max(BACKLOG_FLOOR * 4, totalCards * 0.2);
  return Math.max(0, 1 - excess / tolerance);
}

export function ecosystemHealth(input: HealthInput): HealthResult {
  const profile = profileFor(input.severity, input.custom);
  const { series, studied, excused } = simulate(input, profile);

  const consistency = meanOfLast(series, SMOOTH_DAYS);
  const backlog = backlogScore(input);
  const score = consistency * (1 - BACKLOG_WEIGHT + BACKLOG_WEIGHT * backlog);

  // Trend: this week against the one before it, on the same smoothing.
  const previous = meanOfLast(series.slice(0, Math.max(0, series.length - SMOOTH_DAYS)), SMOOTH_DAYS);
  const trend = series.length > SMOOTH_DAYS ? consistency - previous : 0;

  const visual = Math.max(0, Math.min(100, 100 - (100 - score) * profile.visualGain));
  const paused = pauseActive(input.calendar, input.today);

  return {
    score: Math.round(score * 10) / 10,
    visual: Math.round(visual * 10) / 10,
    consistency: Math.round(consistency * 10) / 10,
    backlog: Math.round(backlog * 100) / 100,
    trend: Math.round(trend * 10) / 10,
    studied,
    counted: series.length,
    excused,
    paused,
    advice: adviceFor({ score, backlog, trend, studied, counted: series.length, paused }),
  };
}

/** Mean of the last `n` entries, or 100 for an empty series — nothing known is not a fault. */
function meanOfLast(series: readonly number[], n: number): number {
  if (series.length === 0) return 100;
  const from = Math.max(0, series.length - n);
  let sum = 0;
  for (let i = from; i < series.length; i++) sum += series[i];
  return sum / (series.length - from);
}

function adviceFor(r: {
  score: number;
  backlog: number;
  trend: number;
  studied: number;
  counted: number;
  paused: boolean;
}): string {
  if (r.paused) return 'On a break. Nothing is counting against you.';
  if (r.counted === 0) return 'Study once to get started.';
  if (r.score >= 95) return 'Thriving. Keep going.';
  if (r.backlog < 0.7) return 'Working through the overdue cards would help most.';
  if (r.trend < -3) return 'A few days missed lately. One session turns it around.';
  if (r.score < 50) return 'Studying on most days is what brings this back.';
  return 'Steady. A few more days in a row would lift it.';
}

/**
 * Health gates how fast new growth arrives, in every severity including Peaceful.
 *
 * This is the one place health bites in Peaceful mode — "health only ever slows growth,
 * nothing visibly declines". Never below half speed: progress is always possible.
 */
export function growthRate(score: number): number {
  return 0.5 + 0.5 * Math.min(1, Math.max(0, score / 100));
}

/** Bands the renderer keys off, so it doesn't sprinkle magic numbers through the art. */
export type HealthBand = 'thriving' | 'healthy' | 'tired' | 'struggling';

export function healthBand(visual: number): HealthBand {
  if (visual >= 85) return 'thriving';
  if (visual >= 65) return 'healthy';
  if (visual >= 40) return 'tired';
  return 'struggling';
}
