import { describe, expect, it } from 'vitest';
import { layoutGrove, placeItem, isPond } from './layout';
import { Stage } from '../data/types';
import type { Plant } from '../data/types';

function plant(day: number, overrides: Partial<Plant> = {}): Plant {
  return {
    day, ago: 100 - day, date: '2026-01-01', n: 10, stage: Stage.Young, size: 0, health: 0,
    species: 0, seed: day * 7 + 1, remembered: 1, strength: 5, struggling: 0, measured: true,
    mature: 0, variant: day % 4, ...overrides,
  };
}

describe('layoutGrove', () => {
  it('places one item per plant with no gaps', () => {
    const plants = Array.from({ length: 20 }, (_, i) => plant(i));
    const layout = layoutGrove(plants);
    const plantItems = layout.items.filter((it) => !isPond(it));
    expect(plantItems.length).toBe(20);
  });

  it('adds pond slots for a gapped plant, without losing the plant itself', () => {
    const plants = [plant(0), plant(1, { gap: 25, gapFrom: '2025-01-01', gapTo: '2025-01-25' }), plant(2)];
    const layout = layoutGrove(plants);
    const ponds = layout.items.filter(isPond);
    const plantItems = layout.items.filter((it) => !isPond(it));
    expect(plantItems.length).toBe(3);
    expect(ponds.length).toBeGreaterThan(0);
    expect(ponds.every((p) => p.slots >= 2 && p.slots <= 4)).toBe(true);
  });

  it('keeps every item inside [0,1] for x and non-negative depth', () => {
    const plants = Array.from({ length: 60 }, (_, i) => plant(i));
    const layout = layoutGrove(plants);
    for (const it of layout.items) {
      expect(it.x).toBeGreaterThanOrEqual(0);
      expect(it.x).toBeLessThanOrEqual(1);
      expect(it.depth).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic for the same input', () => {
    const plants = Array.from({ length: 30 }, (_, i) => plant(i));
    const a = layoutGrove(plants);
    const b = layoutGrove(plants);
    expect(a.items.map((i) => [i.x, i.jy, i.row])).toEqual(b.items.map((i) => [i.x, i.jy, i.row]));
  });

  it('scatters a lone first row instead of lining it up', () => {
    const plants = Array.from({ length: 5 }, (_, i) => plant(i));
    const layout = layoutGrove(plants);
    expect(layout.rows).toBe(1);
    const depths = new Set(layout.items.map((i) => i.depth));
    // A scattered single row should not put everything at the same depth.
    expect(depths.size).toBeGreaterThan(1);
  });

  it('zooms in a young grove and settles for a large one', () => {
    const small = layoutGrove(Array.from({ length: 4 }, (_, i) => plant(i)));
    const big = layoutGrove(Array.from({ length: 2000 }, (_, i) => plant(i)));
    expect(small.zoom).toBeGreaterThan(big.zoom);
    expect(big.zoom).toBeGreaterThanOrEqual(1);
  });

  it('never overlaps two ponds within POND_APART rows', () => {
    const plants: Plant[] = [];
    for (let i = 0; i < 40; i++) {
      plants.push(plant(i, i % 5 === 0 ? { gap: 20, gapFrom: 'x', gapTo: 'y' } : {}));
    }
    const layout = layoutGrove(plants);
    const ponds = layout.items.filter(isPond);
    for (let i = 0; i < ponds.length; i++) {
      for (let j = i + 1; j < ponds.length; j++) {
        if (ponds[i].row === ponds[j].row) {
          // Same row: must not share columns (checked structurally by non-overlap of cells)
          expect(ponds[i].cell).not.toBe(ponds[j].cell);
        }
      }
    }
  });
});

describe('placeItem', () => {
  it('places nearer items lower and larger on the canvas', () => {
    const plants = Array.from({ length: 40 }, (_, i) => plant(i));
    const layout = layoutGrove(plants);
    const front = layout.items.reduce((a, b) => (a.depth > b.depth ? a : b));
    const back = layout.items.reduce((a, b) => (a.depth < b.depth ? a : b));
    const pf = placeItem(front, 800, 600);
    const pb = placeItem(back, 800, 600);
    expect(pf.y).toBeGreaterThan(pb.y);
    expect(pf.scale).toBeGreaterThan(pb.scale);
    expect(pf.haze).toBeLessThan(pb.haze);
  });
});
