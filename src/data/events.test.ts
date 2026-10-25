/**
 * Differentially verified against `reference/memory-forest/events.py` directly (its own
 * Python interpreter, same synthetic inputs, outputs compared) — not just checked against
 * this port's own idea of what's correct. Found and fixed two real bugs doing this:
 * `fireState`'s simulation loop ran in the wrong direction (it's sequential — `run`/`share`/
 * `healed` carry across days — so direction matters here even though it doesn't for most of
 * this file's other loops), and a sign error in `began`/`streakBefore`'s ago-to-absolute
 * conversion. The specific scenarios below are the ones that caught them.
 */
import { describe, expect, it } from 'vitest';
import {
  missedNow, strikes, fireState, smokeState, merciless, setFire, reviewHell, backlogCleared, stagnation,
} from './events';
import type { Plant } from './types';

const TODAY = 1000;
const agoSet = (agos: number[]): Set<number> => new Set(agos.map((a) => TODAY - a));
const range = (a: number, b: number): number[] => Array.from({ length: b - a }, (_, i) => a + i);
const union = (...sets: Array<Set<number>>): Set<number> => new Set(sets.flatMap((s) => [...s]));

function plant(ago: number, extra: Partial<Plant> = {}): Plant {
  return {
    day: TODAY - ago, ago, date: '', n: 1, stage: 0, size: 0, health: 0, species: 0,
    seed: ago, remembered: 1, strength: 0, struggling: 0, measured: true, mature: 0, variant: 0,
    ...extra,
  } as Plant;
}

describe('missedNow / strikes (verified against events.py)', () => {
  it('no reviews ever: missed forever, no strikes', () => {
    expect(missedNow(new Set(), TODAY)).toBe(3660);
    expect(strikes(new Set(), TODAY)).toEqual([]);
  });
  it('a 5-day gap inside an otherwise-studied history', () => {
    const rd = union(agoSet(range(0, 3)), agoSet(range(8, 20)));
    expect(missedNow(rd, TODAY)).toBe(0);
    expect(strikes(rd, TODAY)).toEqual([7]);
  });
  it('missing only today does not strike', () => {
    expect(strikes(agoSet(range(1, 15)), TODAY)).toEqual([]);
    expect(missedNow(agoSet(range(1, 15)), TODAY)).toBe(1);
  });
});

describe('fireState (direction-sensitive simulation — the bug this test exists to catch)', () => {
  it('building fire: 5 days missed including today, studied before that', () => {
    const rd = agoSet(range(5, 30));
    expect(fireState(rd, TODAY)).toEqual({
      share: 0.1, healed: 0, missed: 4, began: 4, epoch: 25, out: false, news: true,
    });
  });
  it('a fire that has been healing for 3 days', () => {
    const rd = union(agoSet(range(0, 3)), agoSet(range(6, 30)));
    expect(fireState(rd, TODAY)).toEqual({
      share: 0.05, healed: 3, missed: 3, began: 5, epoch: 24, out: false, news: false,
    });
  });
  it('fully studied history: no fire', () => {
    expect(fireState(agoSet(range(0, 20)), TODAY)).toBeNull();
  });
  it('smoke warns the day before a fire would catch (2 missed, today not studied yet), never once it has', () => {
    expect(smokeState(agoSet(range(3, 20)), TODAY)).toEqual({ began: 2, epoch: 17 });
    expect(smokeState(agoSet(range(1, 15)), TODAY)).toBeNull(); // only today missing: not yet a 2-day run
    expect(smokeState(agoSet(range(5, 30)), TODAY)).toBeNull(); // already alight
  });
});

describe('merciless (streakBefore sign bug this test exists to catch)', () => {
  it('a 20-day streak just before the break that struck', () => {
    const trees = [plant(50), plant(40), plant(30), plant(20), plant(10), plant(5), plant(0)];
    const rd = union(agoSet(range(0, 2)), agoSet(range(40, 60)));
    const result = merciless(trees, rd, TODAY);
    expect(result.hits).toEqual([39]);
    expect(result.plants.map((t) => t.ago)).toEqual([30, 20, 10, 5, 0]);
    expect(result.craters).toEqual([{ ago: 39, lost: 2, streak: 20 }]);
  });
});

describe('setFire', () => {
  it('marks the right share of eligible plants burning, with a 3-decimal burn value', () => {
    const trees = [plant(50), plant(40), plant(30), plant(20), plant(10), plant(5), plant(0)];
    const [out, info] = setFire(trees, agoSet(range(5, 30)), TODAY);
    expect(info).toEqual({ left: 7, trees: 1, missed: 4, began: 4, out: false, news: true, smoke: 0 });
    expect(out.filter((t) => t.burn !== undefined)).toHaveLength(1);
  });
});

describe('reviewHell / backlogCleared / stagnation', () => {
  it('review hell scales from the floor to 1 at double the limit', () => {
    expect(reviewHell(0, 10)).toBe(0);
    expect(reviewHell(25, 10)).toBe(0); // under REVIEW_HELL_MIN's floor of 30
    expect(reviewHell(100, 10)).toBe(1);
    expect(reviewHell(50, 1)).toBeCloseTo(0.6666666666666667);
  });
  it('backlog clears within the window, once, not if already marked', () => {
    expect(backlogCleared(0, 100, 95, null)).toBe(true);
    expect(backlogCleared(0, 100, 95, 96)).toBe(false);
    expect(backlogCleared(5, 100, 95, null)).toBe(false);
    expect(backlogCleared(5, 100, null, 100)).toBe(true);
  });
  it('grass grows only while idle and still reviewing', () => {
    const trees = [plant(50), plant(10)];
    expect(stagnation(trees, agoSet([0, 1, 2]), TODAY)).toBeCloseTo(1 / 6);
    expect(stagnation(trees, agoSet([50]), TODAY)).toBe(0); // not reviewing recently: a break, not coasting
    expect(stagnation([plant(2)], agoSet([0, 1, 2]), TODAY)).toBe(0); // not idle long enough yet
  });
});
