/**
 * Which biomes stand a `peak` landmark (`src/vendor/memory-forest/web/landmarks/peak.js`) —
 * a single snow-capped summit drawn behind everything else. `mfAdapter.ts` hardcoded
 * `landmark: 'none'` always until now; `mfLoader.ts`'s `loadMfScenery` already fully
 * supports loading `landmarks/${mood.landmark}.js` on demand, so this is only the judgment
 * call of which biomes actually get one, same shape as `mfLandscape.ts`'s own
 * `MOUNTAIN_BIOMES` call.
 *
 * `peak.js` draws its cap unconditionally pale/white — a real snow line, not a stylised
 * highlight — so this is scoped to biomes whose one defining peak is genuinely, famously
 * snow-capped, not just "has mountains" (that's `MOUNTAIN_BIOMES`, a wider set already
 * driving the `mountains` landscape):
 *  - `satoyama` (Japan) — Mt Fuji; the region's own `volcanic-cone` backdrop already
 *    describes "a single symmetrical volcano... snow on its upper third", and
 *    `mfLandscape.ts`'s own comment already treats this biome as sitting below "whatever
 *    peak its `volcano` landform describes seeing" — this is that peak, finally drawn.
 *  - `himalaya` (Nepal) — Everest, rising above the general range `MOUNTAIN_BIOMES`
 *    already draws as a `mountains` landscape; always under snow.
 *  - `alpine` (Australia) — Kosciuszko; the biome's own note is explicit ("under snow in
 *    winter").
 * Deliberately left out despite a real single famous peak: `cloud-forest` (Costa Rica) —
 * the region's matching backdrop is a *smoking* volcano, which the plain `peak` landmark
 * has no plume for and would draw with a snow cap a tropical volcano doesn't have;
 * `dipterocarp` (Borneo) — Kinabalu's bare granite summit is never snow-capped either,
 * for the same reason; `acacia-savanna`/`riverine-woodland` (East Africa) — Kilimanjaro is
 * real and genuinely ice-capped, but the region's own backdrop calls it "far off... on the
 * heat-shimmered plain", and `peak.js` draws close and large (`py = hor - 44 * u`, well
 * above the treeline) — too close for a savanna biome whose ground is nowhere near it.
 */

const PEAK_BIOMES = new Set(['satoyama', 'himalaya', 'alpine']);

export function landmarkForBiome(biomeKey: string | undefined): string {
  return biomeKey && PEAK_BIOMES.has(biomeKey) ? 'peak' : 'none';
}
