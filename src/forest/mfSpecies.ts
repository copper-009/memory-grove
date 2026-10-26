/**
 * Which of a biome's own species a tooltip should actually name — the single source of
 * truth for the pairing each `src/envs/*.js` file draws, kept in TypeScript (not read back
 * from the env scripts themselves, which haven't loaded yet when `toMfTree` runs — see
 * `mfAdapter.ts`).
 *
 * The bug this file fixes: a tree's *shape* comes from `kind` (`toMfTree`'s
 * `seed % 100 < 34` roll), but the species *name* used to come from a completely different
 * roll on the same seed (`species: seed % 1024` in `forest.ts`, then `% biome.plants.length`
 * in `toMfTree`) — two independent numbers from the same seed, with no reason to agree.
 * For a four-species biome that's roughly a 75% chance the tooltip names a species that
 * isn't the one actually drawn. Reported live ("some of the names definitely dont line up
 * to the look of the plant") after every biome got real per-species trees. Fixed by naming
 * each tree from the *same* `kind` bit (and, for a rotating biome, the same seed-modulo)
 * that decided its shape — the name now always matches what's on screen.
 */

export interface BiomeSpeciesSlots {
  /** Plant key(s) for pine-kind trees: one key, several to rotate across by `seed % n`
   * (matching the matching env's own rotation, e.g. `pt-beech.js`'s `pals.rounds`), or
   * omitted when that kind-slot is left on the vendored engine's own generic default —
   * there's no real species to name there, so the tooltip simply won't show one. */
  pine?: string | readonly string[];
  round?: string | readonly string[];
}

/** One entry per `mfEnvs.ts` biome, naming exactly what that biome's env file draws. */
export const BIOME_SPECIES: Record<string, BiomeSpeciesSlots> = {
  eucalypt: { pine: 'grass-tree', round: 'river-red-gum' },
  rainforest: { pine: 'bangalow-palm', round: 'antarctic-beech' },
  tropical: { pine: 'fan-palm', round: 'curtain-fig' },
  coastal: { pine: 'pandanus', round: 'paperbark' },
  outback: { pine: 'desert-oak', round: 'ghost-gum' },
  alpine: { pine: 'alpine-everlasting', round: 'snow-gum' },
  'kauri-forest': { pine: 'kauri', round: 'ponga' },
  'southern-alps': { pine: 'snow-tussock', round: 'mountain-beech' },
  satoyama: { pine: 'sugi', round: 'yamazakura' },
  hokkaido: { pine: 'ezo-spruce', round: 'shirakaba' },
  'eastern-rainforest': { pine: 'traveller-palm', round: 'madagascar-rosewood' },
  'spiny-forest': { round: 'octopus-tree' },
  'cloud-forest': { pine: 'tree-fern-cr', round: 'oak-costa-rica' },
  'lowland-rainforest': { pine: 'heliconia', round: 'ceiba' },
  'acacia-savanna': { pine: 'whistling-thorn', round: 'umbrella-thorn' },
  'riverine-woodland': { round: ['fever-tree', 'sycamore-fig'] },
  boreal: { pine: 'black-spruce', round: 'paper-birch' },
  'rocky-alpine': { pine: 'subalpine-fir', round: 'alpine-fleabane' },
  taiga: { pine: 'norway-spruce', round: 'rowan' },
  'fjord-plateau': { pine: 'heather', round: 'dwarf-birch' },
  terai: { pine: 'elephant-grass', round: 'sal' },
  himalaya: { pine: 'juniper-np', round: 'rhododendron' },
  'southern-beech': { round: ['lenga', 'nire', 'coihue'] },
  steppe: { pine: 'coiron', round: 'mata-negra' },
  dipterocarp: { pine: 'rafflesia', round: 'giant-dipterocarp' },
  'mangrove-river': { pine: 'nipa-palm', round: 'bakau-mangrove' },
};
