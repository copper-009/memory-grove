/* Memory Grove — East Africa, riverine woodland (this region's second biome).
 *
 * Both of the biome's species (`src/regions/eastafrica/index.ts`) are `broadleaf` — no
 * second form for the pine-kind slot, so this uses the engine's own per-seed palette
 * rotation (`pals.rounds`, `trees.js`'s `EP.rounds[t.seed % EP.rounds.length]`) to cycle
 * the fever tree and sycamore fig across round-kind trees, each with its own matching trunk
 * colour via a seed-matched `trunk` hook — the same pattern `pt-beech.js` uses for its three
 * all-broadleaf species. Pine-kind trees are left on the engine's own generic default, a
 * real, stated gap for this biome, same as `pt-beech.js`'s. The fever tree's yellow-green
 * bark (`#c8c468`) is its own, not added here — it's the whole reason this species is
 * called a fever tree.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { MATURE } = AF.STAGE;
const H6 = a => a.map(hex);

// fever-tree, sycamore-fig (src/regions/eastafrica/index.ts)
const FEVER = H6(['#253420', '#34482c', '#46603a', '#5c7a4c', '#7c9866']);
const FEVER_BARK = H6(['#c8c468', '#9a9648', '#6a6830']);
const SYCAMORE = H6(['#1a3020', '#254a2c', '#33633a', '#467e4c', '#669c60']);
const SYCAMORE_BARK = H6(['#b0a888', '#857a60', '#564e3c']);

const ROUNDS = [FEVER, SYCAMORE];
const BARKS = [FEVER_BARK, SYCAMORE_BARK];

AF.env('ea-riverine', {
  pals: { rounds: ROUNDS },
  tree: {
    trunk: (c) => {
      if (c.pine) return false; // no second form in this biome's two species; the engine's own default pine stands in
      const { base, tx0, tw, trunkH, put, ancient } = c;
      const bark = BARKS[c.t.seed % BARKS.length];
      for (let y = base - trunkH; y <= base; y++) {
        for (let x = tx0; x < tx0 + tw; x++) {
          let col = tw > 1 && x === tx0 ? bark[0] : tw > 1 && x === tx0 + tw - 1 ? bark[2] : bark[1];
          if (y <= base - trunkH + 3) col = bark[2];
          else if (tw === 1 && y & 1) col = bark[0];
          put(x, y, col);
        }
      }
      if (c.t.stage >= MATURE && !ancient) { put(tx0 - 1, base, bark[2]); put(tx0 + tw, base, bark[2]); }
      return true;
    },
  },
});
})();
