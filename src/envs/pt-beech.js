/* Memory Grove — Patagonia, southern beech forest.
 *
 * All three of this biome's species (`src/regions/patagonia/index.ts`) are `broadleaf` —
 * there's no second form here to give the pine-kind slot the way every other region env
 * does, so pine-kind trees (still ~34% of any grove, `mfAdapter.ts`'s flat per-seed roll)
 * are left drawing the vendored engine's own generic default pine, undocumented as anything
 * specific to this biome — a real, stated gap, not an oversight.
 *
 * What this *does* use is the engine's own per-seed palette rotation (`trees.js`'s
 * `EP.rounds[t.seed % EP.rounds.length]`, a built-in feature for exactly this case — several
 * species sharing one crown shape) to cycle lenga, ñire and coihue across round-kind trees,
 * each with its own matching trunk colour picked by the same rotation (a custom `trunk` hook
 * is still needed for that half — `pals.bark` is one shared value, not an array).
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { MATURE } = AF.STAGE;
const H6 = a => a.map(hex);

// lenga, ñire, coihue (src/regions/patagonia/index.ts)
const LENGA = H6(['#1c2e1a', '#2a4226', '#395a34', '#4e7446', '#c0392b']);
const LENGA_BARK = H6(['#6a6052', '#484034', '#2c2620']);
const NIRE = H6(['#202e1c', '#2e4228', '#3f5a36', '#557448', '#d8b84a']);
const NIRE_BARK = H6(['#726a58', '#4e483c', '#302c24']);
const COIHUE = H6(['#162616', '#20381f', '#2c4e2a', '#3e683c', '#578450']);
const COIHUE_BARK = H6(['#5e5648', '#403a30', '#28231c']);

const ROUNDS = [LENGA, NIRE, COIHUE];
const BARKS = [LENGA_BARK, NIRE_BARK, COIHUE_BARK];

AF.env('pt-beech', {
  theme: window.MGForms.groundTheme(["#3a4a2e","#2c3c22","#4e6040"], ["#8a8a92","#5a5a62"]),
  // pals.bark is a fallback for the engine's own default trunk-draw (the pine-kind trees
  // this env leaves untouched) — that default code reads bark.l/.m/.d, an object, not the
  // [light,mid,dark] array shape every other env's own custom `trunk` hook uses; caught
  // live by the harness render (it crashed inside `put`, `bark.d` undefined) rather than by
  // inspection.
  pals: { rounds: ROUNDS, bark: { l: NIRE_BARK[0], m: NIRE_BARK[1], d: NIRE_BARK[2] } },
  tree: {
    trunk: (c) => {
      if (c.pine) return false; // no conifer among this biome's species; the engine's own default pine stands in
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
      if (ancient) { put(tx0 - 1, base, bark[2]); put(tx0 + tw, base, bark[2]); put(tx0 - 2, base, bark[2]); put(tx0 + tw + 1, base, bark[2]); }
      return true;
    },
  },
});
})();
