import { describe, expect, it } from 'vitest';
import { buildCreatureFrames, frameSize } from './creatureSprite';
import { REGIONS } from '../regions';

describe('buildCreatureFrames', () => {
  it('builds two non-empty frames for every creature in every region, at every life stage', () => {
    for (const region of REGIONS) {
      for (const biome of region.biomes) {
        for (const creature of biome.creatures) {
          for (const stage of [0, 1, 2, 3] as const) {
            const [idle, busy] = buildCreatureFrames(creature, stage);
            expect(idle.length, `${region.key}/${creature.key} stage ${stage}`).toBeGreaterThan(0);
            expect(busy.length).toBeGreaterThan(0);
            const [w, h] = frameSize(idle);
            expect(w).toBeGreaterThan(0);
            expect(h).toBeGreaterThan(0);
            // every character used must either be '.' or a key in whichever palette this
            // creature actually renders from (a hand/baked sprite's own `pal`, or the old
            // `palette` for a creature still on the procedural fallback)
            const pal = creature.sprite?.pal ?? creature.palette ?? {};
            const used = new Set(idle.join('').split(''));
            used.delete('.');
            for (const ch of used) {
              expect(pal[ch], `${creature.key} uses undeclared colour "${ch}"`).toBeDefined();
            }
          }
        }
      }
    }
  });

  it('grows across life stages', () => {
    const creature = REGIONS[0].biomes[0].creatures[0];
    const [infant] = buildCreatureFrames(creature, 0);
    const [adult] = buildCreatureFrames(creature, 2);
    const [, hInfant] = frameSize(infant);
    const [, hAdult] = frameSize(adult);
    expect(hAdult).toBeGreaterThanOrEqual(hInfant);
  });

  it('is deterministic', () => {
    const creature = REGIONS[0].biomes[0].creatures[1];
    const a = buildCreatureFrames(creature, 2);
    const b = buildCreatureFrames(creature, 2);
    expect(a).toEqual(b);
  });
});
