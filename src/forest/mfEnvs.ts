/**
 * Which `src/envs/*.js` file (if any) draws a given biome through the vendored engine's own
 * `AF.env` registry — Phase 3 (`DECISIONS.md`). Every biome in every region has an entry
 * now, though `mg-spiny` and `bo-mangroveriver` only cover their round-kind slot (their
 * other species are `palm`/`bulbous`, needing the still-unexercised `tree.body()` hook —
 * see `_forms.js`'s own header), and `pt-beech`/`ea-riverine` cover round-kind with a
 * palette rotation instead of a shape change, since every species in those two biomes
 * shares one `PlantForm`. A biome with no entry here still renders: the vendored engine's
 * own default (no special environment, `trees.js`'s generic pine/round trees) is what every
 * biome got before this registry existed at all, same as it still gets for an untouched
 * kind-slot in the biomes above.
 */
export const BIOME_ENVS: Record<string, string> = {
  eucalypt: 'au-eucalypt',
  rainforest: 'au-rainforest',
  tropical: 'au-tropical',
  coastal: 'au-coastal',
  outback: 'au-outback',
  alpine: 'au-alpine',
  'kauri-forest': 'nz-kauri',
  satoyama: 'jp-satoyama',
  'eastern-rainforest': 'mg-rainforest',
  'cloud-forest': 'cr-cloudforest',
  'acacia-savanna': 'ea-savanna',
  boreal: 'ca-boreal',
  taiga: 'no-taiga',
  terai: 'np-terai',
  'southern-beech': 'pt-beech',
  dipterocarp: 'bo-dipterocarp',
  'southern-alps': 'nz-alps',
  hokkaido: 'jp-hokkaido',
  'spiny-forest': 'mg-spiny',
  'lowland-rainforest': 'cr-lowland',
  'riverine-woodland': 'ea-riverine',
  'rocky-alpine': 'ca-rockyalpine',
  'fjord-plateau': 'no-fjordplateau',
  himalaya: 'np-himalaya',
  steppe: 'pt-steppe',
  'mangrove-river': 'bo-mangroveriver',
};

export function envForBiome(biomeKey: string | undefined): string | undefined {
  return biomeKey ? BIOME_ENVS[biomeKey] : undefined;
}
