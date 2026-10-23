import { describe, expect, it } from 'vitest';
import {
  canExcuse,
  countExcusedInYear,
  emptyCalendar,
  endPause,
  excusedDaysIn,
  isExcused,
  pauseActive,
  pauseLabel,
  startPause,
  MAX_EXCUSED_PER_YEAR,
  RETRO_EXCUSE_DAYS,
} from './calendar';
import {
  addOneOff,
  applySchedulePreset,
  easterSunday,
  lastWeekday,
  nthWeekday,
  queenslandHolidays,
  SCHEDULE_PRESETS,
  withQueenslandHolidays,
} from './schedulePresets';
import { dayToISO, isoToDay } from './day';

const TODAY = isoToDay('2026-10-15');

describe('date helpers', () => {
  it('computes Easter Sunday correctly for known years', () => {
    // Checked against the Gregorian computus.
    expect(dayToISO(easterSunday(2024))).toBe('2024-03-31');
    expect(dayToISO(easterSunday(2025))).toBe('2025-04-20');
    expect(dayToISO(easterSunday(2026))).toBe('2026-04-05');
    expect(dayToISO(easterSunday(2027))).toBe('2027-03-28');
    expect(dayToISO(easterSunday(2030))).toBe('2030-04-21');
  });

  it('finds the nth and last weekday of a month', () => {
    // 2026-05-04 is the first Monday of May 2026.
    expect(dayToISO(nthWeekday(2026, 5, 1, 1))).toBe('2026-05-04');
    expect(dayToISO(lastWeekday(2026, 9, 1))).toBe('2026-09-28');
  });
});

describe('Queensland holidays', () => {
  const days = queenslandHolidays(2026);

  it('includes the fixed and the Easter-anchored days', () => {
    expect(days).toContain('2026-01-01'); // New Year's Day
    expect(days).toContain('2026-01-26'); // Australia Day (a Monday in 2026)
    expect(days).toContain('2026-04-03'); // Good Friday
    expect(days).toContain('2026-04-06'); // Easter Monday
    expect(days).toContain('2026-04-25'); // Anzac Day
    expect(days).toContain('2026-05-04'); // Labour Day
    expect(days).toContain('2026-10-05'); // Sovereign's Birthday
    expect(days).toContain('2026-12-25');
    expect(days).toContain('2026-12-26');
  });

  it('adds a weekend substitute', () => {
    // Boxing Day 2026 falls on a Saturday, so 28 December is a holiday too.
    expect(days).toContain('2026-12-28');
  });

  it('is sorted and free of duplicates', () => {
    expect(days).toEqual([...new Set(days)].sort());
  });
});

describe('excused days', () => {
  it('excuses nothing by default', () => {
    const cal = emptyCalendar();
    expect(isExcused(cal, TODAY)).toBe(false);
    expect(excusedDaysIn(cal, TODAY - 30, TODAY).size).toBe(0);
  });

  it('excuses a chosen weekday', () => {
    const cal = { ...emptyCalendar(), excusedWeekdays: [0] };
    expect(isExcused(cal, isoToDay('2026-10-18'))).toBe(true); // a Sunday
    expect(isExcused(cal, isoToDay('2026-10-19'))).toBe(false); // the Monday
  });

  it('excuses a one-off day', () => {
    const cal = addOneOff(emptyCalendar(), TODAY - 2);
    expect(isExcused(cal, TODAY - 2)).toBe(true);
  });

  it('lets an explicit unexcused day override everything', () => {
    const cal = {
      ...addOneOff(emptyCalendar(), TODAY - 2),
      unexcused: [dayToISO(TODAY - 2)],
      oneOff: [dayToISO(TODAY - 2)],
    };
    expect(isExcused(cal, TODAY - 2)).toBe(false);
  });

  it('excuses public holidays only when switched on', () => {
    const off = { ...emptyCalendar(), holidays: ['2026-04-25'] };
    expect(isExcused(off, isoToDay('2026-04-25'))).toBe(false);
    const on = withQueenslandHolidays(emptyCalendar(), [2026]);
    expect(isExcused(on, isoToDay('2026-04-25'))).toBe(true);
  });
});

describe('semester presets', () => {
  const cal = applySchedulePreset(emptyCalendar(), 'two-semesters', [2026]);

  it('creates two semesters with a break in each', () => {
    expect(cal.periods).toHaveLength(2);
    expect(cal.periods.every((p) => p.breaks.length === 1)).toBe(true);
    expect(cal.outsidePeriodsExcused).toBe(true);
  });

  it('excuses its break days but not its teaching days', () => {
    const s1 = cal.periods[0];
    const breakStart = isoToDay(s1.breaks[0].from);
    const breakEnd = isoToDay(s1.breaks[0].to);
    for (let d = breakStart; d <= breakEnd; d++) {
      expect(isExcused(cal, d)).toBe(true);
    }
    // The day before the break is a teaching day, so it counts.
    expect(isExcused(cal, breakStart - 1)).toBe(false);
    expect(isExcused(cal, breakEnd + 1)).toBe(false);
  });

  it('excuses the summer break between the two semesters', () => {
    const s2End = isoToDay(cal.periods[1].to);
    expect(isExcused(cal, s2End + 7)).toBe(true);
    expect(isExcused(cal, s2End)).toBe(false);
  });

  it('puts semester 1 mid-semester break on the week containing Good Friday', () => {
    const b = cal.periods[0].breaks[0];
    const easter = easterSunday(2026);
    expect(isoToDay(b.from)).toBeLessThanOrEqual(easter - 2);
    expect(isoToDay(b.to)).toBeGreaterThanOrEqual(easter - 2);
  });

  it('offers a trimester option too', () => {
    expect(SCHEDULE_PRESETS.map((p) => p.key)).toContain('trimesters');
    const tri = applySchedulePreset(emptyCalendar(), 'trimesters', [2026]);
    expect(tri.periods).toHaveLength(3);
  });
});

describe('pausing', () => {
  it('excuses every day it covers, and ends cleanly', () => {
    let cal = startPause(emptyCalendar(), TODAY - 10, TODAY + 5);
    expect(pauseActive(cal, TODAY)).toBe(true);
    expect(isExcused(cal, TODAY - 3)).toBe(true);
    expect(isExcused(cal, TODAY - 11)).toBe(false);

    cal = endPause(cal, TODAY);
    expect(pauseActive(cal, TODAY)).toBe(false);
    // The days it already covered stay excused forever.
    expect(isExcused(cal, TODAY - 3)).toBe(true);
    expect(isExcused(cal, TODAY)).toBe(false);
  });

  it('runs indefinitely with no end date', () => {
    const cal = startPause(emptyCalendar(), TODAY - 2);
    expect(isExcused(cal, TODAY + 400)).toBe(true);
  });

  it('discards a pause resumed the same day it started', () => {
    const cal = endPause(startPause(emptyCalendar(), TODAY), TODAY);
    expect(cal.pause).toBeUndefined();
  });

  it('labels what is protecting the grove', () => {
    expect(pauseLabel(startPause(emptyCalendar(), TODAY, TODAY + 30), TODAY)).toMatch(
      /^Paused until \d+ \w+$/,
    );
    expect(pauseLabel(startPause(emptyCalendar(), TODAY), TODAY)).toBe(
      'On break — progress protected',
    );
    const sem = applySchedulePreset(emptyCalendar(), 'two-semesters', [2026]);
    const breakDay = isoToDay(sem.periods[0].breaks[0].from);
    expect(pauseLabel(sem, breakDay)).toMatch(/progress protected/);
    expect(pauseLabel(emptyCalendar(), TODAY)).toBeNull();
  });
});

describe('guardrails on excusing', () => {
  it('allows retroactive excusing within the limit', () => {
    const cal = emptyCalendar();
    expect(canExcuse(cal, TODAY - RETRO_EXCUSE_DAYS, TODAY, 'gentle').ok).toBe(true);
    expect(canExcuse(cal, TODAY - 1, TODAY, 'gentle').ok).toBe(true);
    expect(canExcuse(cal, TODAY, TODAY, 'gentle').ok).toBe(true);
    expect(canExcuse(cal, TODAY + 30, TODAY, 'gentle').ok).toBe(true);
  });

  it('refuses retroactive excusing beyond the limit', () => {
    const r = canExcuse(emptyCalendar(), TODAY - RETRO_EXCUSE_DAYS - 1, TODAY, 'gentle');
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/7 days back/);
  });

  it('refuses any retroactive excusing in Merciless', () => {
    expect(canExcuse(emptyCalendar(), TODAY - 1, TODAY, 'merciless').ok).toBe(false);
    expect(canExcuse(emptyCalendar(), TODAY, TODAY, 'merciless').ok).toBe(true);
    expect(canExcuse(emptyCalendar(), TODAY + 10, TODAY, 'merciless').ok).toBe(true);
  });

  it('caps excused days per year in Merciless only', () => {
    // A whole year paused: far past the cap.
    const cal = startPause(emptyCalendar(), isoToDay('2026-01-01'), isoToDay('2026-12-31'));
    expect(countExcusedInYear(cal, 2026)).toBe(365);
    expect(canExcuse(cal, TODAY + 1, TODAY, 'merciless').ok).toBe(false);
    expect(canExcuse(cal, TODAY + 1, TODAY, 'gentle').ok).toBe(true);
    expect(MAX_EXCUSED_PER_YEAR).toBeLessThan(365);
  });
});
