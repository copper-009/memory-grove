/**
 * Which of the vendored engine's own landscapes (`src/vendor/memory-forest/web/landscapes/`
 * — `lake`, `river`, `meadow`, `mountains`) fits a biome, derived straight from `Biome.hasWater`
 * (`src/regions/types.ts`'s own doc comment: "a wetland, river or lake biome, not an arid or
 * alpine one" — written for the old renderer, unused since the engine switch until now) and
 * its key, rather than a second table that could drift out of sync with that data.
 *
 * `mountains` (a taller, sharper horizon with snow above the treeline) isn't picked here yet
 * even for the clearly high-alpine biomes (`landform: 'peaks'` isn't itself a reliable
 * signal — several canopy rainforests use it too, for their own ridgelines, not snow) —
 * every biome still gets `meadow`'s plain rolling hills unless it has water. A smaller,
 * more deliberate follow-up, not guessed at here alongside the lower-risk, data-driven
 * water choice.
 */

import type { Biome } from '../regions/types';

export type LandscapeKey = 'lake' | 'river' | 'meadow';

export interface LandscapeChoice {
  landscape: LandscapeKey;
  /** Appended to "Golden hour" for the scene caption (`caption.js` reads `sceneName`). */
  sceneSuffix: string;
}

export function landscapeForBiome(biome: Biome | undefined): LandscapeChoice {
  if (!biome || !biome.hasWater) return { landscape: 'meadow', sceneSuffix: 'in the grove' };
  if (biome.key.includes('river')) return { landscape: 'river', sceneSuffix: 'by the river' };
  return { landscape: 'lake', sceneSuffix: 'by the lake' };
}
