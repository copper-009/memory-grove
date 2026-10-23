/**
 * Builds (or reuses the cache for) a `Grove`, from the live RemNote knowledge base.
 *
 * This is the one place `src/data/`'s pure functions, `src/widgets/settings.ts` and
 * `src/data/source.ts`'s SDK calls meet. Kept out of the React components so it can run
 * from a command (e.g. a background refresh) as easily as from a widget's `useEffect`.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';
import { loadAllCards, expandExcludedRemIds } from '../data/source';
import { scanCards } from '../data/cards';
import { buildGrove, mergeOld } from '../data/forest';
import { cacheKey, excusedSignature, loadCachedGrove, saveCachedGrove } from '../data/cache';
import { readSettings } from './settings';
import type { Grove } from '../data/types';
import type { StudyCalendar } from '../data/calendar';
import { emptyCalendar, excusedDaysIn } from '../data/calendar';

const CALENDAR_KEY = 'study-calendar-v1';
const ROSTER_KEY_PREFIX = 'creature-roster-v1-';

export async function loadStudyCalendar(plugin: RNPlugin): Promise<StudyCalendar> {
  const cal = await plugin.storage.getSynced<StudyCalendar>(CALENDAR_KEY);
  return cal ?? emptyCalendar();
}

export async function saveStudyCalendar(plugin: RNPlugin, cal: StudyCalendar): Promise<void> {
  await plugin.storage.setSynced(CALENDAR_KEY, cal);
}

export function rosterKey(region: string): string {
  return `${ROSTER_KEY_PREFIX}${region}`;
}

export interface BuiltGrove {
  grove: Grove;
  overdue: number;
  cardCount: number;
  /** day number -> cards due that day; the heatmap's "due" shading. Always freshly scanned
   * (never part of the cached grove), since it's cheap and changes every day regardless. */
  dueByDay: Map<number, number>;
}

/** Build the grove, using the local cache when the knowledge base hasn't changed. */
export async function buildOrLoadGrove(plugin: RNPlugin): Promise<BuiltGrove> {
  const settings = await readSettings(plugin);
  const calendar = await loadStudyCalendar(plugin);
  const cards = await loadAllCards(plugin);
  const excludedRemIds = settings.excludedRemIds.length
    ? await expandExcludedRemIds(plugin, settings.excludedRemIds)
    : undefined;

  const now = Date.now();
  // A first pass just to get the newest repetition timestamp and card count cheaply for
  // the cache key, without yet knowing the excused-day set (which needs `today`).
  const probe = scanCards(cards, { now, rolloverHour: settings.rolloverHour, excludedRemIds });
  const excused = excusedDaysIn(calendar, probe.today - 400, probe.today + 1);

  const key = cacheKey({
    cardCount: cards.length,
    newestRep: probe.newestRep,
    rolloverHour: settings.rolloverHour,
    breakDays: settings.breakDays,
    filter: settings.excludedRemIds,
    today: probe.today,
    excusedSignature: excusedSignature(excused),
  });

  const cached = await loadCachedGrove(plugin.storage, key);
  if (cached) {
    return { grove: mergeOld(cached), overdue: probe.overdue, cardCount: probe.cardCount, dueByDay: probe.dueByDay };
  }

  const grove = mergeOld(buildGrove(probe, { breakDays: settings.breakDays, excusedDays: excused }));
  await saveCachedGrove(plugin.storage, grove, key);
  return { grove, overdue: probe.overdue, cardCount: probe.cardCount, dueByDay: probe.dueByDay };
}
