/**
 * Caching the built grove.
 *
 * `plugin.card.getAll()` carries every card and every repetition across the plugin bridge.
 * On a large knowledge base that is the single most expensive thing this plugin does, so it
 * happens once and the result is kept.
 *
 * The cache lives in **local** storage, not synced: it is derived data, reproducible from
 * the cards themselves, and syncing a multi-megabyte blob between devices to save a few
 * hundred milliseconds would be a poor trade. Settings and the study calendar — which are
 * user intent and cannot be re-derived — do go to synced storage.
 */

import type { Grove, Plant } from './types';

export const CACHE_VERSION = 3;

/** Everything that, if changed, invalidates a built grove. */
export interface CacheKeyInput {
  cardCount: number;
  /** Newest repetition timestamp anywhere in the collection. */
  newestRep: number;
  rolloverHour: number;
  startDay?: number;
  breakDays: number;
  /** Sorted, so an unordered filter set still hashes stably. */
  filter?: readonly string[];
  /** Today's day number: a new day changes "ago" on every plant. */
  today: number;
  /** Excused days affect ponds and streaks, so they are part of the key. */
  excusedSignature: string;
}

/** A short stable string for a cache key. FNV-1a, hex. */
export function cacheKey(input: CacheKeyInput): string {
  const parts = [
    CACHE_VERSION,
    input.cardCount,
    input.newestRep,
    input.rolloverHour,
    input.startDay ?? '',
    input.breakDays,
    input.today,
    input.excusedSignature,
    (input.filter ?? []).slice().sort().join(','),
  ].join('|');
  let h = 2166136261;
  for (let i = 0; i < parts.length; i++) {
    h ^= parts.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + '-' + parts.length.toString(36);
}

/** A grove flattened for storage. `Set` and `Map` do not survive a JSON round trip. */
export interface StoredGrove {
  v: number;
  key: string;
  builtAt: number;
  plants: Plant[];
  stats: Grove['stats'];
  merged?: Grove['merged'];
  seed: number;
  today: number;
  reviewDays: number[];
  dayReviews: Array<[number, number]>;
  dayTime: Array<[number, number]>;
}

export function serialiseGrove(grove: Grove, key: string, builtAt: number): StoredGrove {
  return {
    v: CACHE_VERSION,
    key,
    builtAt,
    plants: grove.plants,
    stats: grove.stats,
    merged: grove.merged,
    seed: grove.seed,
    today: grove.today,
    reviewDays: Array.from(grove.reviewDays),
    dayReviews: Array.from(grove.dayReviews),
    dayTime: Array.from(grove.dayTime),
  };
}

export function deserialiseGrove(stored: StoredGrove): Grove | null {
  if (!stored || stored.v !== CACHE_VERSION) return null;
  return {
    plants: stored.plants,
    stats: stored.stats,
    merged: stored.merged,
    seed: stored.seed,
    today: stored.today,
    reviewDays: new Set(stored.reviewDays),
    dayReviews: new Map(stored.dayReviews),
    dayTime: new Map(stored.dayTime),
  };
}

/** A compact signature for a set of excused days, for the cache key. */
export function excusedSignature(days: ReadonlySet<number>): string {
  if (days.size === 0) return '0';
  let lo = Infinity;
  let hi = -Infinity;
  let sum = 0;
  for (const d of days) {
    if (d < lo) lo = d;
    if (d > hi) hi = d;
    sum += d;
  }
  return `${days.size}:${lo}:${hi}:${sum}`;
}

/** The minimal storage surface the cache needs, so tests can supply a plain object. */
export interface KeyValueStore {
  getLocal<T>(key: string): Promise<T | undefined>;
  setLocal(key: string, value: unknown): Promise<void>;
}

export const GROVE_CACHE_KEY = 'grove-cache-v3';

export async function loadCachedGrove(
  store: KeyValueStore,
  key: string,
): Promise<Grove | null> {
  try {
    const stored = await store.getLocal<StoredGrove>(GROVE_CACHE_KEY);
    if (!stored || stored.key !== key) return null;
    return deserialiseGrove(stored);
  } catch {
    // A corrupt or unreadable cache is never fatal: rebuild instead.
    return null;
  }
}

export async function saveCachedGrove(
  store: KeyValueStore,
  grove: Grove,
  key: string,
): Promise<void> {
  try {
    await store.setLocal(GROVE_CACHE_KEY, serialiseGrove(grove, key, Date.now()));
  } catch {
    // Storage full or unavailable: the grove still renders, it just rebuilds next time.
  }
}
