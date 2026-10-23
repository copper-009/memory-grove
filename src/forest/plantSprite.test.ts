import { describe, expect, it } from 'vitest';
import { buildToneMap, fillShare } from './plantSprite';
import { Stage } from '../data/types';
import type { PlantForm } from '../regions/types';

const FORMS: PlantForm[] = ['broadleaf', 'conifer', 'palm', 'fern', 'grasstree', 'hummock', 'shrub', 'columnar', 'bulbous'];

function plant(overrides: { stage?: Stage; size?: 0 | 1 | 2; health?: 0 | 1 | 2 | 3; seed?: number } = {}) {
  return { stage: Stage.Mature, size: 1 as 0 | 1 | 2, health: 0 as 0 | 1 | 2 | 3, seed: 12345, ...overrides };
}

describe('buildToneMap', () => {
  it('draws every form without throwing, and fills some pixels', () => {
    for (const form of FORMS) {
      const tm = buildToneMap(plant(), form);
      expect(tm.w).toBeGreaterThan(0);
      expect(tm.h).toBeGreaterThan(0);
      expect(fillShare(tm)).toBeGreaterThan(0);
    }
  });

  it('is deterministic for the same seed', () => {
    for (const form of FORMS) {
      const a = buildToneMap(plant({ seed: 777 }), form);
      const b = buildToneMap(plant({ seed: 777 }), form);
      expect(Array.from(a.tone)).toEqual(Array.from(b.tone));
    }
  });

  it('differs for a different seed', () => {
    const a = buildToneMap(plant({ seed: 1 }), 'broadleaf');
    const b = buildToneMap(plant({ seed: 2 }), 'broadleaf');
    expect(Array.from(a.tone)).not.toEqual(Array.from(b.tone));
  });

  it('a seedling is small and the same size at every crown size', () => {
    const s0 = buildToneMap(plant({ stage: Stage.Seedling, size: 0 }), 'broadleaf');
    const s2 = buildToneMap(plant({ stage: Stage.Seedling, size: 2 }), 'broadleaf');
    expect(s0.w).toBe(s2.w);
    expect(s0.h).toBe(s2.h);
    expect(s0.w).toBeLessThan(10);
  });

  it('grows taller with later stages, for every form', () => {
    for (const form of FORMS) {
      const young = buildToneMap(plant({ stage: Stage.Young }), form);
      const ancient = buildToneMap(plant({ stage: Stage.Ancient }), form);
      expect(ancient.h).toBeGreaterThan(young.h);
    }
  });

  it('grows wider with a larger crown size, for a broadleaf', () => {
    const small = buildToneMap(plant({ size: 0 }), 'broadleaf');
    const large = buildToneMap(plant({ size: 2 }), 'broadleaf');
    expect(large.w).toBeGreaterThanOrEqual(small.w);
  });

  it('a struggling, mature plant has visible holes: fewer filled pixels than a healthy one', () => {
    const healthy = buildToneMap(plant({ health: 0 }), 'broadleaf');
    const sick = buildToneMap(plant({ health: 3 }), 'broadleaf');
    // same seed, same shape budget: the sick one should have fewer solid pixels (holes)
    expect(fillShare(sick)).toBeLessThan(fillShare(healthy));
  });
});
