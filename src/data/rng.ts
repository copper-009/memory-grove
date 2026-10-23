/**
 * Seeded randomness. The grove must look identical between sessions, so nothing visual may
 * ever call `Math.random()` — every placement, variant and wander target comes from here.
 *
 * Ported from Memory Forest's `web/util.js` (mulberry32 + FNV-1a), which the original uses
 * for exactly the same reason.
 */

/** mulberry32. Returns a function producing floats in [0, 1). */
export function rng(seed: number): () => number {
  let a = seed | 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over a string, as an unsigned 32-bit integer. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mix an integer into a hash, for cheap compound seeds without building strings. */
export function hashInt(h: number, n: number): number {
  return (Math.imul(h ^ n, 2654435761) ^ (h >>> 13)) >>> 0;
}

/**
 * The seed for one day's plant. Keyed on the absolute day number, so a plant keeps its
 * species, variant and jitter for as long as the grove exists.
 */
export function daySeed(day: number): number {
  return hashStr(`memory-grove-${day}`) & 0x7fffffff;
}

/** Pick an element of `list` with a generator, or `undefined` for an empty list. */
export function pick<T>(list: readonly T[], r: () => number): T | undefined {
  return list.length ? list[Math.floor(r() * list.length)] : undefined;
}

/** Fisher-Yates, in place, with a seeded generator. */
export function shuffle<T>(list: T[], r: () => number): T[] {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
