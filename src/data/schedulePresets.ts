/**
 * Ready-made study calendars.
 *
 * **Every date here is approximate.** Australian universities set their own dates and change
 * them year to year; these presets are a starting point shaped like a typical calendar, not
 * a statement about any particular institution. The settings UI says so, and every date is
 * editable. No university is named anywhere, deliberately.
 *
 * Dates that *can* be computed exactly — Easter, and the public holidays anchored to it or
 * to an nth weekday — are computed rather than hard-coded, so they are right for any year.
 */

import { dayToISO, isoToDay, MS_PER_DAY } from './day';
import type { DateRange, StudyCalendar, StudyPeriod } from './calendar';
import { emptyCalendar } from './calendar';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dayOf(year: number, month: number, date: number): number {
  return Math.floor(Date.UTC(year, month - 1, date) / MS_PER_DAY);
}

/** The `n`th `weekday` (0 = Sunday) of a month. `n` is 1-based. */
export function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const first = dayOf(year, month, 1);
  const firstDow = new Date(first * MS_PER_DAY).getUTCDay();
  return first + ((weekday - firstDow + 7) % 7) + (n - 1) * 7;
}

/** The last `weekday` of a month. */
export function lastWeekday(year: number, month: number, weekday: number): number {
  const nextMonth = month === 12 ? dayOf(year + 1, 1, 1) : dayOf(year, month + 1, 1);
  const last = nextMonth - 1;
  const dow = new Date(last * MS_PER_DAY).getUTCDay();
  return last - ((dow - weekday + 7) % 7);
}

/** Easter Sunday, by the anonymous Gregorian algorithm. Exact for any Gregorian year. */
export function easterSunday(year: number): number {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayOf(year, month, day);
}

function range(from: number, to: number, name?: string): DateRange {
  return { from: dayToISO(from), to: dayToISO(to), ...(name ? { name } : {}) };
}

/** The Monday-to-Sunday week containing `day`. */
function weekAround(day: number): [number, number] {
  const dow = new Date(day * MS_PER_DAY).getUTCDay();
  const monday = day - ((dow + 6) % 7);
  return [monday, monday + 6];
}

// ---------------------------------------------------------------------------
// Semester presets
// ---------------------------------------------------------------------------

export interface SchedulePreset {
  key: string;
  label: string;
  note: string;
  build: (year: number) => StudyPeriod[];
}

/**
 * The common Australian shape: two semesters, each with a one-week mid-semester break,
 * and a long summer break between them that falls outside both periods.
 *
 * Semester 1's break is anchored to the week containing Good Friday, which is where most
 * Australian universities put it. Semester 2's is the last full week of September.
 */
function twoSemesters(year: number): StudyPeriod[] {
  const s1From = nthWeekday(year, 2, 1, 4); // ~4th Monday of February
  const s1To = dayOf(year, 6, 21);
  const [e1, e2] = weekAround(easterSunday(year));

  const s2From = nthWeekday(year, 7, 1, 3); // ~3rd Monday of July
  const s2To = dayOf(year, 11, 22);
  const b2 = lastWeekday(year, 9, 1); // last Monday of September

  return [
    {
      id: 's1',
      name: 'Semester 1',
      from: dayToISO(s1From),
      to: dayToISO(s1To),
      breaks: [range(e1, e2, 'Mid-semester break')],
    },
    {
      id: 's2',
      name: 'Semester 2',
      from: dayToISO(s2From),
      to: dayToISO(s2To),
      breaks: [range(b2, b2 + 6, 'Mid-semester break')],
    },
  ];
}

/** Three roughly 15-week teaching periods, each with a one-week break in the middle. */
function trimesters(year: number): StudyPeriod[] {
  const specs: Array<[string, number, number, number]> = [
    ['Trimester 1', nthWeekday(year, 3, 1, 1), dayOf(year, 6, 14), nthWeekday(year, 4, 1, 3)],
    ['Trimester 2', nthWeekday(year, 7, 1, 1), dayOf(year, 10, 11), nthWeekday(year, 8, 1, 3)],
    ['Trimester 3', nthWeekday(year, 11, 1, 1), dayOf(year + 1, 2, 14), nthWeekday(year, 12, 1, 3)],
  ];
  return specs.map(([name, from, to, breakStart], i) => ({
    id: `t${i + 1}`,
    name,
    from: dayToISO(from),
    to: dayToISO(to),
    breaks: [range(breakStart, breakStart + 6, 'Mid-trimester break')],
  }));
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    key: 'two-semesters',
    label: 'Two semesters with a summer break',
    note: 'The common Australian shape: two semesters, a mid-semester break in each, and a long summer break. Approximate — check your own dates and edit them.',
    build: twoSemesters,
  },
  {
    key: 'trimesters',
    label: 'Three trimesters',
    note: 'Three teaching periods a year with a short break in each. Approximate — check your own dates and edit them.',
    build: trimesters,
  },
];

/** Apply a preset for a run of years, turning on "outside semester is excused". */
export function applySchedulePreset(
  cal: StudyCalendar,
  key: string,
  years: number[],
): StudyCalendar {
  const preset = SCHEDULE_PRESETS.find((p) => p.key === key);
  if (!preset) return cal;
  const periods: StudyPeriod[] = [];
  for (const year of years) {
    for (const p of preset.build(year)) {
      periods.push({ ...p, id: `${key}-${year}-${p.id}`, name: `${p.name} ${year}` });
    }
  }
  return { ...cal, periods, outsidePeriodsExcused: true };
}

// ---------------------------------------------------------------------------
// Queensland public holidays
// ---------------------------------------------------------------------------

/**
 * Queensland public holidays for a year, as ISO dates.
 *
 * Anchored holidays (Easter, Labour Day, the Sovereign's Birthday) are computed and will be
 * right. Two caveats, surfaced in the settings UI:
 *
 * - The **Royal Queensland Show (Ekka)** holiday applies to the Brisbane area only and is
 *   gazetted each year. The second Wednesday of August is used as an approximation.
 * - Queensland's **Christmas Eve** part-day holiday (6pm–midnight) is not a full day and is
 *   not included.
 *
 * Treat the list as a starting point and check it against the Queensland Government's
 * published dates. Every entry is editable.
 */
export function queenslandHolidays(year: number, includeEkka = true): string[] {
  const days = new Set<number>();
  const add = (d: number) => days.add(d);

  /** A holiday that moves to the following Monday when it lands on a weekend. */
  const withMondaySub = (d: number) => {
    add(d);
    const dow = new Date(d * MS_PER_DAY).getUTCDay();
    if (dow === 6) add(d + 2);
    else if (dow === 0) add(d + 1);
  };

  withMondaySub(dayOf(year, 1, 1)); // New Year's Day
  withMondaySub(dayOf(year, 1, 26)); // Australia Day

  const easter = easterSunday(year);
  add(easter - 2); // Good Friday
  add(easter - 1); // Easter Saturday
  add(easter); // Easter Sunday
  add(easter + 1); // Easter Monday

  // Anzac Day: in Queensland the following Monday is a holiday when it falls on a Sunday.
  const anzac = dayOf(year, 4, 25);
  add(anzac);
  if (new Date(anzac * MS_PER_DAY).getUTCDay() === 0) add(anzac + 1);

  add(nthWeekday(year, 5, 1, 1)); // Labour Day — first Monday in May
  if (includeEkka) add(nthWeekday(year, 8, 3, 2)); // Royal Queensland Show — approximate
  add(nthWeekday(year, 10, 1, 1)); // Sovereign's Birthday — first Monday in October

  // Christmas and Boxing Day, with Queensland's weekend substitutes.
  const christmas = dayOf(year, 12, 25);
  const boxing = dayOf(year, 12, 26);
  add(christmas);
  add(boxing);
  const cDow = new Date(christmas * MS_PER_DAY).getUTCDay();
  if (cDow === 6 || cDow === 0) add(dayOf(year, 12, 27));
  const bDow = new Date(boxing * MS_PER_DAY).getUTCDay();
  if (bDow === 6 || bDow === 0) add(dayOf(year, 12, 28));

  return Array.from(days)
    .sort((a, b) => a - b)
    .map(dayToISO);
}

/** Fill a calendar's holiday list for a run of years. */
export function withQueenslandHolidays(cal: StudyCalendar, years: number[]): StudyCalendar {
  const holidays = years.flatMap((y) => queenslandHolidays(y));
  return { ...cal, holidays, holidaysEnabled: true };
}

/** A calendar with nothing configured — what a new user starts with. */
export function defaultCalendar(): StudyCalendar {
  return emptyCalendar();
}

/** Add a one-off excused day, keeping the list sorted and free of duplicates. */
export function addOneOff(cal: StudyCalendar, day: number): StudyCalendar {
  const iso = dayToISO(day);
  if (cal.oneOff.includes(iso)) return cal;
  return {
    ...cal,
    oneOff: [...cal.oneOff, iso].sort(),
    unexcused: cal.unexcused.filter((d) => d !== iso),
  };
}

/** Force a day back to counting, whatever else would excuse it. */
export function addUnexcused(cal: StudyCalendar, day: number): StudyCalendar {
  const iso = dayToISO(day);
  if (cal.unexcused.includes(iso)) return cal;
  return {
    ...cal,
    unexcused: [...cal.unexcused, iso].sort(),
    oneOff: cal.oneOff.filter((d) => d !== iso),
  };
}

/** Mark an exam period, which weights its days up in the health score. */
export function addBoostWeek(cal: StudyCalendar, from: number, to: number, name = 'Exams'): StudyCalendar {
  return { ...cal, boostWeeks: [...cal.boostWeeks, range(from, to, name)] };
}

/** The periods a day falls inside, for the settings calendar's colour coding. */
export function periodAt(cal: StudyCalendar, day: number): StudyPeriod | undefined {
  return cal.periods.find((p) => day >= isoToDay(p.from) && day <= isoToDay(p.to));
}
