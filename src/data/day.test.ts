import { describe, expect, it } from 'vitest';
import { dayIndex, dayToISO, isoToDay, weekday, formatDay, MS_PER_DAY } from './day';

describe('day arithmetic', () => {
  it('round-trips a day number through ISO', () => {
    const d = isoToDay('2026-03-14');
    expect(dayToISO(d)).toBe('2026-03-14');
  });

  it('puts a review just after midnight on the previous day, with a 4am rollover', () => {
    const lateNight = new Date(2026, 2, 15, 0, 30).getTime();
    const theDayBefore = new Date(2026, 2, 14, 20, 0).getTime();
    expect(dayIndex(lateNight, 4)).toBe(dayIndex(theDayBefore, 4));
  });

  it('starts a new day at the rollover hour', () => {
    const before = new Date(2026, 2, 15, 3, 59).getTime();
    const after = new Date(2026, 2, 15, 4, 1).getTime();
    expect(dayIndex(after, 4) - dayIndex(before, 4)).toBe(1);
  });

  it('honours a rollover of 0', () => {
    const justAfterMidnight = new Date(2026, 2, 15, 0, 30).getTime();
    const theEveningBefore = new Date(2026, 2, 14, 23, 30).getTime();
    expect(dayIndex(justAfterMidnight, 0) - dayIndex(theEveningBefore, 0)).toBe(1);
  });

  it('never creates or swallows a day across a DST change', () => {
    // Australian DST ends in early April; northern DST starts in March. Walk a window
    // spanning both and check every local midday maps to exactly one consecutive day.
    const start = new Date(2026, 2, 1, 12, 0).getTime();
    let prev = dayIndex(start, 4);
    for (let i = 1; i < 70; i++) {
      const d = new Date(2026, 2, 1 + i, 12, 0).getTime();
      const idx = dayIndex(d, 4);
      expect(idx - prev).toBe(1);
      prev = idx;
    }
  });

  it('reads weekdays consistently', () => {
    // 2026-03-15 is a Sunday.
    expect(weekday(isoToDay('2026-03-15'))).toBe(0);
    expect(weekday(isoToDay('2026-03-16'))).toBe(1);
  });

  it('formats a day for the tooltip', () => {
    expect(formatDay(isoToDay('2026-03-14'))).toBe('14 Mar 2026');
  });

  it('uses whole days', () => {
    expect(isoToDay('2026-03-15') - isoToDay('2026-03-14')).toBe(1);
    expect(MS_PER_DAY).toBe(86_400_000);
  });
});
