import { describe, expect, it } from 'vitest';
import {
  buildGrove,
  findBreaks,
  healthFor,
  markPonds,
  median,
  mergeOld,
  sizeFor,
  stageFor,
  streaks,
  MAX_INDIVIDUAL_PLANTS,
} from './forest';
import { Stage } from './types';
import type { Plant } from './types';
import { scanCards } from './cards';
import { fixture, FIXED_NOW } from './fixtures';
import { dayIndex, isoToDay } from './day';

describe('median', () => {
  it('handles odd, even and empty', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe('stageFor', () => {
  it("makes today's plant a seedling whatever its cards look like", () => {
    expect(stageFor([400, 400, 400], 0, true)).toBe(Stage.Seedling);
  });

  it('keeps a day still mostly in learning as a sapling', () => {
    expect(stageFor([30], 0.8, false)).toBe(Stage.Sapling);
  });

  it('is a sapling with no measurable strengths at all', () => {
    expect(stageFor([], 0, false)).toBe(Stage.Sapling);
  });

  it('walks the thresholds on the median', () => {
    expect(stageFor([5, 6, 7], 0, false)).toBe(Stage.Young);
    expect(stageFor([21, 25, 30], 0, false)).toBe(Stage.Mature);
    expect(stageFor([180, 200, 220], 0, false)).toBe(Stage.Old);
    expect(stageFor([365, 400, 500], 0, false)).toBe(Stage.Ancient);
  });

  it('uses the median, so one runaway card cannot age a day', () => {
    expect(stageFor([2, 3, 4, 5, 9000], 0, false)).toBe(Stage.Young);
  });
});

describe('healthFor and sizeFor', () => {
  it('steps health through its thresholds', () => {
    expect(healthFor(0)).toBe(0);
    expect(healthFor(0.11)).toBe(0);
    expect(healthFor(0.12)).toBe(1);
    expect(healthFor(0.25)).toBe(2);
    expect(healthFor(0.45)).toBe(3);
    expect(healthFor(1)).toBe(3);
  });

  it('sizes crowns by card count', () => {
    expect(sizeFor(1)).toBe(0);
    expect(sizeFor(14)).toBe(0);
    expect(sizeFor(15)).toBe(1);
    expect(sizeFor(39)).toBe(1);
    expect(sizeFor(40)).toBe(2);
  });
});

describe('streaks', () => {
  const set = (...days: number[]) => new Set(days);

  it('counts back from today', () => {
    expect(streaks(set(100, 99, 98, 96), 100).current).toBe(3);
  });

  it('survives today not being studied yet', () => {
    expect(streaks(set(99, 98, 97), 100).current).toBe(3);
  });

  it('passes over an excused day without counting it', () => {
    const r = streaks(set(100, 99, 97, 96), 100, set(98));
    expect(r.current).toBe(4);
  });

  it('breaks on a day that was neither studied nor excused', () => {
    expect(streaks(set(100, 99, 97), 100).current).toBe(2);
  });

  it('finds the longest run anywhere in history', () => {
    expect(streaks(set(50, 51, 52, 53, 54, 90, 91), 100).longest).toBe(5);
  });

  it('is zero for a user who has never studied', () => {
    expect(streaks(set(), 100)).toEqual({ current: 0, longest: 0 });
  });
});

describe('findBreaks', () => {
  const studied = (days: number[]) => new Set(days);

  it('finds a gap of at least the threshold', () => {
    // studied on day 0 and day 20; 19 days away in between
    const breaks = findBreaks(studied([0, 20]), 0, 20, 14);
    expect(breaks).toEqual([[20, 19]]);
  });

  it('ignores a gap shorter than the threshold', () => {
    expect(findBreaks(studied([0, 10]), 0, 10, 14)).toEqual([]);
  });

  it('ignores a break still running up to today', () => {
    expect(findBreaks(studied([0]), 0, 40, 14)).toEqual([]);
  });

  it('skips excused days, so a semester break never forms a pond', () => {
    const excused = new Set<number>();
    for (let d = 1; d < 20; d++) excused.add(d);
    expect(findBreaks(studied([0, 20]), 0, 20, 14, excused)).toEqual([]);
  });
});

function plantAt(day: number, ago: number): Plant {
  return {
    day,
    ago,
    date: '2026-01-01',
    n: 10,
    stage: Stage.Young,
    size: 0,
    health: 0,
    species: 0,
    seed: day,
    remembered: 1,
    strength: 5,
    struggling: 0,
    measured: true,
    mature: 0,
    variant: 0,
  };
}

describe('markPonds', () => {
  it('marks the break on the first plant standing after it', () => {
    const plants = [plantAt(10, 90), plantAt(40, 60), plantAt(41, 59)];
    markPonds(plants, [[40, 29]]);
    expect(plants[1].gap).toBe(29);
    expect(plants[0].gap).toBeUndefined();
  });

  it('merges two breaks with only one plant between them into a single pond', () => {
    const plants = [plantAt(10, 90), plantAt(40, 60), plantAt(80, 20)];
    markPonds(plants, [
      [40, 29],
      [80, 39],
    ]);
    expect(plants[1].gap).toBe(68);
    expect(plants[2].gap).toBeUndefined();
  });
});

describe('buildGrove on fixtures', () => {
  it('gives a brand-new user a couple of seedlings and nothing else', () => {
    const grove = buildGrove(
      scanCards(fixture('newbie', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
    );
    expect(grove.plants.length).toBeGreaterThan(0);
    expect(grove.plants.length).toBeLessThanOrEqual(4);
    expect(grove.stats.ancient).toBe(0);
    expect(grove.stats.ponds).toBe(0);
    // Nothing has had time to mature, so nothing may look unwell.
    expect(grove.plants.every((p) => p.health === 0)).toBe(true);
  });

  it('gives a two-year veteran ancient plants and a real streak', () => {
    const grove = buildGrove(
      scanCards(fixture('veteran', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
    );
    expect(grove.plants.length).toBeGreaterThan(300);
    expect(grove.stats.ancient).toBeGreaterThan(0);
    expect(grove.stats.cards).toBeGreaterThan(3000);
    expect(grove.stats.longestStreak).toBeGreaterThan(5);
    expect(grove.stats.groveAge).toBeGreaterThan(700);
  });

  it('gives a user with long absences ponds', () => {
    const grove = buildGrove(
      scanCards(fixture('gappy', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
      { breakDays: 14 },
    );
    expect(grove.stats.ponds).toBeGreaterThanOrEqual(3);
    const pond = grove.plants.find((p) => p.gap);
    expect(pond?.gapFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(pond?.gapTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('gives a user who lapses a lot plants that look unwell', () => {
    const grove = buildGrove(
      scanCards(fixture('forgetful', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
    );
    expect(grove.stats.ailing).toBeGreaterThan(0);
    // ...but only ones that have had a chance to mature.
    expect(grove.plants.every((p) => p.health === 0 || p.stage >= Stage.Mature)).toBe(true);
  });

  it('is stable: the same history builds the same grove twice', () => {
    const cards = fixture('veteran', FIXED_NOW);
    const a = buildGrove(scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 }));
    const b = buildGrove(scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 }));
    expect(a.plants.map((p) => [p.seed, p.species, p.variant])).toEqual(
      b.plants.map((p) => [p.seed, p.species, p.variant]),
    );
  });

  it('dates plants to the day the cards were first learned', () => {
    const grove = buildGrove(
      scanCards(fixture('veteran', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
    );
    const today = dayIndex(FIXED_NOW, 4);
    for (const p of grove.plants) {
      expect(p.day).toBe(isoToDay(p.date));
      expect(p.ago).toBe(today - p.day);
    }
  });
});

describe('mergeOld', () => {
  it('leaves a small grove alone', () => {
    const grove = buildGrove(
      scanCards(fixture('newbie', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
    );
    expect(mergeOld(grove).merged).toBeUndefined();
  });

  it('folds the oldest plants into a summary past the limit', () => {
    const grove = buildGrove(
      scanCards(fixture('huge', FIXED_NOW), { now: FIXED_NOW, rolloverHour: 4 }),
    );
    const merged = mergeOld(grove);
    expect(grove.plants.length).toBeGreaterThan(MAX_INDIVIDUAL_PLANTS);
    expect(merged.plants.length).toBe(MAX_INDIVIDUAL_PLANTS);
    expect(merged.merged?.count).toBe(grove.plants.length - MAX_INDIVIDUAL_PLANTS);
    // The stats line still counts every plant.
    expect(merged.stats.plants).toBe(grove.stats.plants);
  });
});
