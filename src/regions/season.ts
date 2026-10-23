/**
 * Which of a region's own seasons it is right now — replaces the old standalone scenery
 * "environment" presets (synthwave, lanterns, bamboo grove, ...), which were generic skins
 * unrelated to the grove's actual place or the calendar. A region's `seasons.months` is
 * already a month -> season name lookup, written per region (`'northern'`, `'southern'`,
 * `'wetDry'`, ...), so this is a direct read rather than its own calendar logic.
 */

import type { Region } from './types';

export function currentSeasonFor(region: Region, date: Date = new Date()): string {
  const month = date.getMonth(); // 0-11
  return region.seasons.months[month] ?? region.seasons.months[0];
}
