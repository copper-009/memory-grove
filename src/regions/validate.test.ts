import { describe, expect, it } from 'vitest';
import { REGIONS, DEFAULT_REGION_KEY, regionByKey, regionOptions } from './index';
import { validateRegion } from './validate';

describe('every region pack validates against the schema', () => {
  for (const region of REGIONS) {
    it(`${region.key} has no validation issues`, () => {
      const issues = validateRegion(region);
      if (issues.length) {
        // eslint-disable-next-line no-console
        console.error(issues.map((i) => `  ${i.region} ${i.path}: ${i.message}`).join('\n'));
      }
      expect(issues).toEqual([]);
    });
  }
});

describe('registry', () => {
  it('has at least 10 regions, each with a biome and creatures', () => {
    expect(REGIONS.length).toBeGreaterThanOrEqual(10);
    for (const r of REGIONS) {
      expect(r.biomes.length).toBeGreaterThan(0);
    }
  });

  it('resolves the default region', () => {
    expect(regionByKey(DEFAULT_REGION_KEY)?.key).toBe('australia');
  });

  it('returns options for every region', () => {
    expect(regionOptions().length).toBe(REGIONS.length);
  });

  it('every species has a source link', () => {
    for (const region of REGIONS) {
      for (const biome of region.biomes) {
        for (const c of [...biome.creatures, ...biome.plants]) {
          expect(c.source, `${region.key}/${biome.key}/${c.key}`).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it('has no duplicate region keys', () => {
    expect(new Set(REGIONS.map((r) => r.key)).size).toBe(REGIONS.length);
  });
});
