/** Re-exported from the data layer: the forest must use the exact same seeded generator
 * as the data layer, or a plant's seed would mean one thing to the data and another to the
 * renderer. See `src/data/rng.ts` for the implementation and rationale. */
export { rng, hashStr, hashInt, pick, shuffle } from '../data/rng';
