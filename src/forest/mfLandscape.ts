/**
 * Which of the vendored engine's own landscapes (`src/vendor/memory-forest/web/landscapes/`
 * — `lake`, `river`, `meadow`, `mountains`) fits a biome. Water (`lake`/`river`) is derived
 * straight from `Biome.hasWater` (`src/regions/types.ts`'s own doc comment: "a wetland,
 * river or lake biome, not an arid or alpine one" — written for the old renderer, unused
 * since the engine switch until now) and its key, rather than a second table that could
 * drift out of sync with that data.
 *
 * `mountains` (a taller, sharper horizon, with snow drawn unconditionally above a fixed
 * height — `landscapes/mountains.js`'s `SNOW_LINE`) is a real environmental judgment call,
 * not a data lookup: `landform: 'peaks'` alone isn't a reliable signal, since several
 * tropical/subtropical rainforest biomes use it too for their own ridgelines, where real
 * snow at any elevation they actually reach would be wrong. Decided per biome by what the
 * place is actually like, checked one at a time below — the five that get it are all
 * biomes genuinely, characteristically associated with high, often snow-capped peaks, not
 * just hilly terrain:
 *  - `alpine` (Australia) — the Snowy Mountains/Australian Alps, snow most winters.
 *  - `southern-alps` (Aotearoa) — literally the Southern Alps; Aoraki/Mount Cook region.
 *  - `rocky-alpine` (Canada) — literally Rocky Mountain alpine.
 *  - `himalaya` (Nepal) — literally the High Himalaya, Earth's highest range.
 *  - `southern-beech` (Patagonia) — Nothofagus forest growing right up against the Andes
 *    (Torres del Paine, Fitz Roy); the backdrop is part of what makes it recognisably
 *    Patagonian, even though the forest itself sits lower.
 * Left on `meadow` despite `landform: 'peaks'`, deliberately, because snow would be wrong
 * for what the place actually is: `rainforest`/`eastern-rainforest`/`cloud-forest`
 * (subtropical/tropical montane rainforest — genuinely hilly, never near a snow line at any
 * elevation they reach) and `dipterocarp` (explicitly *lowland* rainforest). `fjord-plateau`
 * (Norway) is a genuine case for mountains too — fjord country is classically snow-capped —
 * but `hasWater` already claims it for `lake` (the water is the more defining feature of a
 * fjord than the walls around it) and a biome can only have one landscape; noted here since
 * it's a real tradeoff, not an oversight. `satoyama` (Japan) sits at village/foothill
 * elevation by definition, below whatever peak its `volcano` landform describes seeing.
 */

import type { Biome } from '../regions/types';

export type LandscapeKey = 'lake' | 'river' | 'meadow' | 'mountains';

export interface LandscapeChoice {
  landscape: LandscapeKey;
  /** Appended to "Golden hour" for the scene caption (`caption.js` reads `sceneName`). */
  sceneSuffix: string;
}

const MOUNTAIN_BIOMES = new Set(['alpine', 'southern-alps', 'rocky-alpine', 'himalaya', 'southern-beech']);

export function landscapeForBiome(biome: Biome | undefined): LandscapeChoice {
  if (biome?.hasWater) {
    if (biome.key.includes('river')) return { landscape: 'river', sceneSuffix: 'by the river' };
    return { landscape: 'lake', sceneSuffix: 'by the lake' };
  }
  if (biome && MOUNTAIN_BIOMES.has(biome.key)) return { landscape: 'mountains', sceneSuffix: 'in the mountains' };
  return { landscape: 'meadow', sceneSuffix: 'in the grove' };
}
