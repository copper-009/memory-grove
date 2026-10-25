/**
 * The region registry.
 *
 * Adding a new region means adding a folder under `src/regions/<key>/` that exports a
 * `Region` (see `types.ts`) and one line here. Nothing else in the engine changes — see
 * `DEVELOPMENT.md` for the pack format in full.
 */

import type { Region } from './types';
import { australia as australiaBase } from './australia';
import { aotearoa as aotearoaBase } from './aotearoa';
import { japan as japanBase } from './japan';
import { madagascar as madagascarBase } from './madagascar';
import { costaRica as costaRicaBase } from './costarica';
import { eastAfrica as eastAfricaBase } from './eastafrica';
import { canada as canadaBase } from './canada';
import { norway as norwayBase } from './norway';
import { nepal as nepalBase } from './nepal';
import { patagonia as patagoniaBase } from './patagonia';
import { borneo as borneoBase } from './borneo';
import { HAND_SPRITES } from './sprites/handAuthored';
import { BAKED_SPRITES } from './sprites/baked.generated';

/**
 * Attach each creature's `CreatureSprite` (a hand-authored one when there is one, the baked
 * procedural-fallback first draft otherwise), keyed `${region.key}:${creature.key}`. Done
 * once here rather than in each region's own file, so none of the 11 region packs need
 * touching as sprites move from baked to hand-authored over time — see `DECISIONS.md`
 * § "Region packs" and `review/gallery.html`.
 */
function withSprites(region: Region): Region {
  return {
    ...region,
    biomes: region.biomes.map((biome) => ({
      ...biome,
      creatures: biome.creatures.map((creature) => {
        const key = `${region.key}:${creature.key}`;
        const sprite = HAND_SPRITES[key] ?? BAKED_SPRITES[key] ?? creature.sprite;
        return sprite ? { ...creature, sprite } : creature;
      }),
    })),
  };
}

const australia = withSprites(australiaBase);
const aotearoa = withSprites(aotearoaBase);
const japan = withSprites(japanBase);
const madagascar = withSprites(madagascarBase);
const costaRica = withSprites(costaRicaBase);
const eastAfrica = withSprites(eastAfricaBase);
const canada = withSprites(canadaBase);
const norway = withSprites(norwayBase);
const nepal = withSprites(nepalBase);
const patagonia = withSprites(patagoniaBase);
const borneo = withSprites(borneoBase);

export const REGIONS: readonly Region[] = [
  australia,
  aotearoa,
  japan,
  madagascar,
  costaRica,
  eastAfrica,
  canada,
  norway,
  nepal,
  patagonia,
  borneo,
];

export const DEFAULT_REGION_KEY = australia.key;

export function regionByKey(key: string): Region | undefined {
  return REGIONS.find((r) => r.key === key);
}

export function regionOptions(): Array<{ key: string; label: string }> {
  return REGIONS.map((r) => ({ key: r.key, label: r.label }));
}

export {
  australia,
  aotearoa,
  japan,
  madagascar,
  costaRica,
  eastAfrica,
  canada,
  norway,
  nepal,
  patagonia,
  borneo,
};
export * from './types';
export { currentSeasonFor } from './season';
