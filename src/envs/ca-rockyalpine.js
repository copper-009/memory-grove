/* Memory Grove — Canada, Rocky Mountain alpine (this region's second biome).
 *
 * Subalpine fir (a conifer, default-shaped) and alpine fleabane, the biome's only two
 * species (`src/regions/canada/index.ts`). Fleabane is `shrub`-formed and sits on the
 * round-kind slot this time (the default-shaped species is the pine-kind one here, unlike
 * most other envs) — drawn with `MGForms.roundCrownForm` at a smaller blob count. Its
 * purple-flower highlight tone (`#b090c8`) is its own.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// subalpine-fir
const FIR_CROWN = H6(['#121f1a', '#1c3024', '#28432e', '#39583e', '#507050']);
const FIR_BARK = H6(['#6a5a48', '#473c30', '#2c251c']);
// alpine-fleabane
const FLEABANE_CROWN = H6(['#3a4030', '#4c5640', '#606e50', '#788a62', '#b090c8']);
const FLEABANE_BARK = H6(['#5a5444', '#403c30', '#28251c']);

AF.env('ca-rockyalpine', {
  pals: { pine: FIR_CROWN, round: FLEABANE_CROWN },
  tree: {
    width: widthForm(0.65, 0.55),
    trunk: trunkForm(FIR_BARK, FLEABANE_BARK),
    crown: (c) => {
      if (c.pine) return false; // subalpine fir: the engine's own conifer crown is already right
      roundCrownForm(c, 3, 0.08, 0.7);
      return true;
    },
  },
});
})();
