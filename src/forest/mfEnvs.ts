/**
 * Which `src/envs/*.js` file (if any) draws a given biome through the vendored engine's own
 * `AF.env` registry — Phase 3, one region/biome at a time (`DECISIONS.md`). A biome with no
 * entry here still renders: the vendored engine's own default (no special environment,
 * `trees.js`'s generic pine/round trees) is what every biome got before this registry
 * existed at all, same as it still gets today for everything not listed.
 */
export const BIOME_ENVS: Record<string, string> = {
  eucalypt: 'au-eucalypt',
};

export function envForBiome(biomeKey: string | undefined): string | undefined {
  return biomeKey ? BIOME_ENVS[biomeKey] : undefined;
}
