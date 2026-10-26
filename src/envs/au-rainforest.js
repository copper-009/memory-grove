/* Memory Grove — Australia, subtropical rainforest.
 *
 * Antarctic beech (a broadleaf, default-shaped) and tree fern, two of the biome's five
 * species (`src/regions/australia/rainforest.ts`). Bangalow palm is this biome's most
 * recognisable plant but needs the `tree.body()` hook `_forms.js`'s header explains is
 * deferred — tree fern stands in, the same frond-vs-broadleaf pairing used across several
 * other regions tonight.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, frondCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// tree-fern
const FERN_CROWN = H6(['#1a3020', '#26472c', '#356138', '#4a7c48', '#6b9a5e']);
const FERN_BARK = H6(['#6b5c48', '#4a3f31', '#2e261d']);
// antarctic-beech
const BEECH_CROWN = H6(['#16281a', '#214028', '#2f5834', '#437044', '#608c57']);
const BEECH_BARK = H6(['#6a6a52', '#484a38', '#2c2e22']);

AF.env('au-rainforest', {
  theme: window.MGForms.groundTheme(["#3c4a33","#2d3b28","#49603a"], ["#8fa2c0","#6e8a92"]),
  pals: { pine: FERN_CROWN, round: BEECH_CROWN },
  tree: {
    width: widthForm(1.15, 1.05),
    trunk: trunkForm(FERN_BARK, BEECH_BARK),
    crown: (c) => {
      if (!c.pine) return false; // antarctic beech: the engine's own broadleaf crown is already right
      frondCrownForm(c, 9, Math.PI * 0.9);
      return true;
    },
  },
});
})();
