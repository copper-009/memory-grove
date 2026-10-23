import { describe, expect, it } from 'vitest';
import { cardStrength, elapsedDays, retrievability, realReps, STABILITY_RECALL } from './memory';
import { MS_PER_DAY } from './day';
import type { CardLike } from './types';

const DAY = MS_PER_DAY;

describe('retrievability', () => {
  it('is 1 when nothing has elapsed', () => {
    expect(retrievability(10, 0)).toBe(1);
  });

  it('is 0.9 after exactly one stability, by definition', () => {
    expect(retrievability(10, 10)).toBeCloseTo(STABILITY_RECALL, 6);
    expect(retrievability(200, 200)).toBeCloseTo(STABILITY_RECALL, 6);
  });

  it('falls as time passes and never leaves [0, 1]', () => {
    const a = retrievability(20, 5);
    const b = retrievability(20, 40);
    const c = retrievability(20, 4000);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it('is 0 for a card with no strength', () => {
    expect(retrievability(0, 5)).toBe(0);
  });
});

describe('cardStrength', () => {
  const base = { _id: 'a', remId: 'r', createdAt: 0 };

  it('uses the scheduled gap when both ends are known', () => {
    const card: CardLike = { ...base, lastRepetitionTime: 1000 * DAY, nextRepetitionTime: 1021 * DAY };
    expect(cardStrength(card)).toBeCloseTo(21, 6);
  });

  it('falls back to the gap between the last two repetitions', () => {
    const card: CardLike = {
      ...base,
      repetitionHistory: [
        { date: 100 * DAY, score: 1 },
        { date: 107 * DAY, score: 1 },
      ],
    };
    expect(cardStrength(card)).toBeCloseTo(7, 6);
  });

  it('is 0 for a card with a single repetition and no next time', () => {
    const card: CardLike = { ...base, repetitionHistory: [{ date: 100 * DAY, score: 1 }] };
    expect(cardStrength(card)).toBe(0);
  });

  it('ignores a next time that is not after the last review', () => {
    const card: CardLike = { ...base, lastRepetitionTime: 1000 * DAY, nextRepetitionTime: 999 * DAY };
    expect(cardStrength(card)).toBe(0);
  });
});

describe('realReps', () => {
  it('drops cram repetitions', () => {
    const card: CardLike = {
      _id: 'a',
      remId: 'r',
      createdAt: 0,
      repetitionHistory: [
        { date: 1, score: 1 },
        { date: 2, score: 1, isCram: true },
        { date: 3, score: 1 },
      ],
    };
    expect(realReps(card).map((r) => r.date)).toEqual([1, 3]);
  });

  it('returns the original array untouched when there is no cram', () => {
    const history = [{ date: 1, score: 1 }];
    const card: CardLike = { _id: 'a', remId: 'r', createdAt: 0, repetitionHistory: history };
    expect(realReps(card)).toBe(history);
  });
});

describe('elapsedDays', () => {
  it('measures from the last repetition', () => {
    const card: CardLike = { _id: 'a', remId: 'r', createdAt: 0, lastRepetitionTime: 100 * DAY };
    expect(elapsedDays(card, 105 * DAY)).toBeCloseTo(5, 6);
  });

  it('never goes negative', () => {
    const card: CardLike = { _id: 'a', remId: 'r', createdAt: 0, lastRepetitionTime: 100 * DAY };
    expect(elapsedDays(card, 90 * DAY)).toBe(0);
  });
});
