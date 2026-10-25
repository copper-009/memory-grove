import { describe, expect, it } from 'vitest';
import { toMfTree } from './mfAdapter';
import { BIOME_SPECIES } from './mfSpecies';
import { REGIONS } from '../regions';
import type { Biome } from '../regions/types';
import type { Plant } from '../data/types';
import { Stage } from '../data/types';

/** Every biome in `src/regions/*`, by key — real data, not a fixture, so a typo'd plant
 * key in `mfSpecies.ts` fails loudly instead of silently resolving to `undefined`. */
const ALL_BIOMES = new Map<string, Biome>();
for (const region of REGIONS) for (const biome of region.biomes) ALL_BIOMES.set(biome.key, biome);

function makePlant(seed: number): Plant {
  return {
    day: 100, ago: 5, date: '2026-10-20', n: 10, mature: 10, stage: Stage.Mature, size: 2, health: 0,
    species: 0, variant: 0, seed, remembered: 0.8, strength: 40, struggling: 0, measured: true,
  };
}

// toMfTree's own kind roll: seed % 100 < 34 is pine, else round.
const PINE_SEED = 0; // 0 % 100 = 0 < 34
const ROUND_SEED = 50; // 50 % 100 = 50, not < 34

describe('toMfTree species name', () => {
  it('names the real plant the shape was actually drawn for, for every registered biome', () => {
    expect(ALL_BIOMES.size).toBeGreaterThan(0);
    for (const [biomeKey, slots] of Object.entries(BIOME_SPECIES)) {
      const biome = ALL_BIOMES.get(biomeKey);
      expect(biome, `mfSpecies.ts names a biome that doesn't exist: "${biomeKey}"`).toBeDefined();
      if (!biome) continue;

      if (slots.pine) {
        const tree = toMfTree(makePlant(PINE_SEED), biome);
        expect(tree.kind).toBe(1);
        const key = Array.isArray(slots.pine) ? slots.pine[PINE_SEED % slots.pine.length] : slots.pine;
        const expected = biome.plants.find((p) => p.key === key);
        expect(expected, `mfSpecies.ts's "${biomeKey}".pine names a plant key not in that biome: "${key}"`).toBeDefined();
        expect(tree.speciesName).toBe(expected?.common);
      }
      if (slots.round) {
        const tree = toMfTree(makePlant(ROUND_SEED), biome);
        expect(tree.kind).toBe(0);
        const key = Array.isArray(slots.round) ? slots.round[ROUND_SEED % slots.round.length] : slots.round;
        const expected = biome.plants.find((p) => p.key === key);
        expect(expected, `mfSpecies.ts's "${biomeKey}".round names a plant key not in that biome: "${key}"`).toBeDefined();
        expect(tree.speciesName).toBe(expected?.common);
      }
    }
  });

  it('rotates a multi-species slot by seed, matching the drawing env\'s own rotation', () => {
    const beech = ALL_BIOMES.get('southern-beech')!;
    const names = [60, 61, 62].map((seed) => toMfTree(makePlant(seed), beech).speciesName);
    expect(names).toEqual(['Lenga', 'Ñire', 'Coihue']); // seed % 3 === 0, 1, 2
  });

  it('leaves a kind-slot unnamed when the env draws the engine\'s own generic default', () => {
    const spiny = ALL_BIOMES.get('spiny-forest')!; // mg-spiny.js: round only, pine left generic
    expect(toMfTree(makePlant(PINE_SEED), spiny).speciesName).toBeUndefined();
    expect(toMfTree(makePlant(ROUND_SEED), spiny).speciesName).toBe('Octopus tree');
  });

  it('leaves speciesName unset with no biome at all (the synthetic-fixture harness path)', () => {
    expect(toMfTree(makePlant(PINE_SEED)).speciesName).toBeUndefined();
  });
});
