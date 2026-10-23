/**
 * Day arithmetic.
 *
 * A "day number" here is the count of **local calendar days** since 1970-01-01, shifted by
 * the rollover hour. Studying at 00:30 with a 4am rollover joins the previous day, which is
 * how Anki's `day_cutoff` behaves and what Memory Forest assumes throughout.
 *
 * Day numbers are read from the calendar fields of a `Date`, never by dividing a timestamp,
 * so a DST shift changes the length of a day without ever creating or swallowing one. That
 * matters: a phantom missing day would show up as a gap in the planting.
 */

export const MS_PER_DAY = 86_400_000;

/** Anki's default, and ours. */
export const DEFAULT_ROLLOVER_HOUR = 4;

/** The local calendar day a timestamp falls on, given the rollover hour. */
export function dayIndex(ts: number, rolloverHour: number = DEFAULT_ROLLOVER_HOUR): number {
  const d = new Date(ts - rolloverHour * 3_600_000);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}

/** `YYYY-MM-DD` for a day number. Inverse of `dayIndex` at day granularity. */
export function dayToISO(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The day number an ISO `YYYY-MM-DD` names. */
export function isoToDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** Day of week for a day number: 0 = Sunday, 6 = Saturday. */
export function weekday(day: number): number {
  return new Date(day * MS_PER_DAY).getUTCDay();
}

/** Month (1-12) of a day number. */
export function monthOf(day: number): number {
  return new Date(day * MS_PER_DAY).getUTCMonth() + 1;
}

/** Calendar year of a day number. */
export function yearOf(day: number): number {
  return new Date(day * MS_PER_DAY).getUTCFullYear();
}

/** Every day number from `from` to `to`, inclusive. */
export function daysBetween(from: number, to: number): number[] {
  const out: number[] = [];
  for (let d = from; d <= to; d++) out.push(d);
  return out;
}

/** Format a day number the way the tooltip shows it: "14 Mar 2026". */
export function formatDay(day: number): string {
  const d = new Date(day * MS_PER_DAY);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
