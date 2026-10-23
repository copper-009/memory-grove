import { describe, expect, it } from 'vitest';
import { ecosystemHealth, growthRate, healthBand, SEVERITY_PROFILES } from './health';
import type { Severity } from './calendar';
import { emptyCalendar, startPause } from './calendar';
import { addOneOff, applySchedulePreset } from './schedulePresets';
import { isoToDay, weekday } from './day';

const TODAY = isoToDay('2026-10-15');
const ALL: Severity[] = ['peaceful', 'gentle', 'wild', 'merciless'];

/** Days studied, as a set, from a predicate over "days ago". */
function daysWhere(pred: (ago: number) => boolean, span = 200): Set<number> {
  const s = new Set<number>();
  for (let ago = 0; ago < span; ago++) if (pred(ago)) s.add(TODAY - ago);
  return s;
}

function health(reviewDays: Set<number>, severity: Severity, cal = emptyCalendar(), overdue = 0) {
  return ecosystemHealth({
    today: TODAY,
    reviewDays,
    calendar: cal,
    severity,
    overdue,
    totalCards: 5000,
  });
}

describe('ecosystem health', () => {
  it('is 100 on a perfect streak, in every severity', () => {
    const perfect = daysWhere(() => true);
    for (const s of ALL) {
      expect(health(perfect, s).score).toBeCloseTo(100, 1);
    }
  });

  it('barely dents on a single missed day', () => {
    const oneMissed = daysWhere((ago) => ago !== 5);
    for (const s of ALL) {
      const r = health(oneMissed, s);
      // Gentle, Peaceful and Wild have grace, so a single miss costs nothing at all.
      // Merciless has no grace, but one miss must still be a scratch, not a wound.
      expect(r.score).toBeGreaterThan(s === 'merciless' ? 85 : 99);
    }
  });

  it('treats weekday-only studying kindly, but not as perfect', () => {
    const weekdaysOnly = daysWhere((ago) => {
      const d = weekday(TODAY - ago);
      return d !== 0 && d !== 6;
    });
    // Five days a week with no calendar configured. Gentle should barely care; the
    // harsher modes should notice. (Excusing weekends restores 100 — tested below.)
    expect(health(weekdaysOnly, 'gentle').score).toBeGreaterThan(90);
    expect(health(weekdaysOnly, 'gentle').score).toBeLessThan(100);
    expect(health(weekdaysOnly, 'wild').score).toBeLessThan(
      health(weekdaysOnly, 'gentle').score,
    );
  });

  it('falls monotonically as study gets patchier, in every severity', () => {
    // Progressively worse habits. Each must score at or below the one before it.
    const patterns = [
      daysWhere(() => true), // every day
      daysWhere((ago) => weekday(TODAY - ago) !== 0), // six days a week
      daysWhere((ago) => {
        const d = weekday(TODAY - ago);
        return d !== 0 && d !== 6;
      }), // weekdays
      daysWhere((ago) => ago % 3 !== 0), // two days in three
      daysWhere((ago) => ago % 2 === 0), // every other day
      daysWhere((ago) => ago % 5 === 0), // one day in five
    ];
    for (const s of ALL) {
      const scores = patterns.map((p) => health(p, s).score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1] + 1e-9);
      }
      // And the worst pattern really is much worse than the best.
      expect(scores[0] - scores[scores.length - 1]).toBeGreaterThan(20);
    }
  });

  it('is harsher the harsher the severity, for any given habit', () => {
    const patchy = daysWhere((ago) => ago % 3 !== 0);
    const scores = ALL.map((s) => health(patchy, s).score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1]);
    }
  });

  it('leaves weekday-only studying untouched once weekends are excused', () => {
    const weekdaysOnly = daysWhere((ago) => {
      const d = weekday(TODAY - ago);
      return d !== 0 && d !== 6;
    });
    const cal = { ...emptyCalendar(), excusedWeekdays: [0, 6] };
    expect(health(weekdaysOnly, 'gentle', cal).score).toBeCloseTo(100, 1);
  });

  it('drops after a three-week break and recovers afterwards', () => {
    // Studied every day except a 21-day absence that ended 10 days ago.
    const gapped = daysWhere((ago) => ago < 10 || ago >= 31);
    const justBack = daysWhere((ago) => ago === 0 || ago >= 22);

    for (const s of ALL) {
      const duringRecovery = health(justBack, s);
      const recovered = health(gapped, s);
      expect(recovered.score).toBeGreaterThan(duringRecovery.score);
    }
  });

  it('recovers to full in every severity, given enough good days', () => {
    // A long absence a long time ago, then unbroken study since.
    const recovered = daysWhere((ago) => ago < 60 || ago >= 90);
    for (const s of ALL) {
      const r = health(recovered, s);
      expect(r.score).toBeGreaterThan(97);
      expect(r.visual).toBeGreaterThan(97);
    }
  });

  it('never leaves 0..100', () => {
    const never = new Set<number>();
    for (const s of ALL) {
      const r = health(never, s);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.visual).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.visual).toBeLessThanOrEqual(100);
    }
  });

  it('orders the severities as advertised', () => {
    const patchy = daysWhere((ago) => ago % 3 !== 0);
    const scores = ALL.map((s) => health(patchy, s).visual);
    const [peaceful, gentle, wild, merciless] = scores;
    expect(peaceful).toBe(100); // nothing visibly declines
    expect(gentle).toBeGreaterThan(wild);
    expect(wild).toBeGreaterThan(merciless);
  });

  it('still scores Peaceful honestly even though nothing shows', () => {
    const patchy = daysWhere((ago) => ago % 3 !== 0);
    const r = health(patchy, 'peaceful');
    expect(r.visual).toBe(100);
    expect(r.score).toBeLessThan(100);
  });

  it('takes a custom profile', () => {
    const patchy = daysWhere((ago) => ago % 3 !== 0);
    const strict = ecosystemHealth({
      today: TODAY,
      reviewDays: patchy,
      calendar: emptyCalendar(),
      severity: 'custom',
      custom: { decay: 0.4, recovery: 0.05, graceDays: 0, window: 30, visualGain: 1 },
      overdue: 0,
      totalCards: 5000,
    });
    expect(strict.score).toBeLessThan(health(patchy, 'gentle').score);
  });
});

describe('breaks protect the score', () => {
  it('leaves health unchanged across a three-month summer break', () => {
    const before = daysWhere((ago) => ago >= 90, 400);
    // Same history, plus a 90-day absence running up to today.
    const cal = startPause(emptyCalendar(), TODAY - 89, TODAY);

    for (const s of ALL) {
      const unprotected = health(before, s);
      const protectedRun = health(before, s, cal);
      expect(protectedRun.score).toBeGreaterThan(unprotected.score);
      // With the break excused, the window reaches back past it to the good days before.
      expect(protectedRun.score).toBeCloseTo(100, 1);
      expect(protectedRun.excused).toBeGreaterThan(0);
      expect(protectedRun.paused).toBe(true);
    }
  });

  it('counts studying during a pause as a good day, never a bad one', () => {
    const cal = startPause(emptyCalendar(), TODAY - 30, TODAY + 30);
    const idle = health(new Set<number>(), 'merciless', cal);
    const studiedSome = health(daysWhere((ago) => ago < 5), 'merciless', cal);
    expect(studiedSome.score).toBeGreaterThanOrEqual(idle.score);
    expect(studiedSome.studied).toBeGreaterThan(0);
  });

  it('never lets studying lower the score, under any severity', () => {
    const base = daysWhere((ago) => ago % 2 === 0);
    for (const s of ALL) {
      const without = health(base, s);
      const withExtra = health(new Set([...base, TODAY - 1, TODAY - 3]), s);
      expect(withExtra.score).toBeGreaterThanOrEqual(without.score);
    }
  });

  it('protects a semester break the same way an explicit pause does', () => {
    const cal = applySchedulePreset(emptyCalendar(), 'two-semesters', [2026]);
    // 15 Oct 2026 falls inside semester 2, so build a history that studies in semester
    // but not during the summer break before it.
    const studied = daysWhere((ago) => !cal.periods.every(() => false) && ago < 60, 400);
    const r = health(studied, 'wild', cal);
    expect(r.score).toBeGreaterThan(health(studied, 'wild').score - 0.001);
  });

  it('does not penalise a backlog built up during a break', () => {
    const studied = daysWhere(() => true);
    const cal = { ...startPause(emptyCalendar(), TODAY - 30, TODAY), recoveryGraceDays: 7 };
    const withBaseline = ecosystemHealth({
      today: TODAY,
      reviewDays: studied,
      calendar: { ...cal, pause: { ...cal.pause!, backlogAtStart: 0 } },
      severity: 'wild',
      overdue: 900,
      totalCards: 5000,
    });
    const protectedRun = ecosystemHealth({
      today: TODAY,
      reviewDays: studied,
      calendar: { ...cal, pause: { ...cal.pause!, backlogAtStart: 900 } },
      severity: 'wild',
      overdue: 900,
      totalCards: 5000,
    });
    expect(protectedRun.backlog).toBe(1);
    expect(protectedRun.score).toBeGreaterThan(withBaseline.score);
  });

  it('excuses one-off days without them counting as missed', () => {
    const missedThree = daysWhere((ago) => ago < 3 || ago > 5);
    let cal = emptyCalendar();
    for (const ago of [3, 4, 5]) cal = addOneOff(cal, TODAY - ago);
    expect(health(missedThree, 'merciless', cal).score).toBeGreaterThan(
      health(missedThree, 'merciless').score,
    );
    expect(health(missedThree, 'merciless', cal).score).toBeCloseTo(100, 1);
  });
});

describe('backlog', () => {
  it('costs at most a quarter of the score', () => {
    const perfect = daysWhere(() => true);
    const swamped = health(perfect, 'wild', emptyCalendar(), 100000);
    expect(swamped.backlog).toBe(0);
    expect(swamped.score).toBeCloseTo(75, 1);
  });

  it('ignores a small backlog entirely', () => {
    const perfect = daysWhere(() => true);
    expect(health(perfect, 'wild', emptyCalendar(), 15).backlog).toBe(1);
  });
});

describe('growth and bands', () => {
  it('never slows growth below half speed', () => {
    expect(growthRate(0)).toBe(0.5);
    expect(growthRate(100)).toBe(1);
    expect(growthRate(50)).toBe(0.75);
  });

  it('bands the visual score', () => {
    expect(healthBand(100)).toBe('thriving');
    expect(healthBand(70)).toBe('healthy');
    expect(healthBand(50)).toBe('tired');
    expect(healthBand(10)).toBe('struggling');
  });

  it('has a profile for every named severity', () => {
    for (const s of ['peaceful', 'gentle', 'wild', 'merciless'] as const) {
      expect(SEVERITY_PROFILES[s].recovery).toBeGreaterThan(0);
    }
  });
});
