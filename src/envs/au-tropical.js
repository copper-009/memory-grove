/* Memory Grove — Australia, tropical north.
 *
 * Curtain fig (a broadleaf, default-shaped) and red mangrove, two of the biome's three
 * species (`src/regions/australia/tropical.ts`). Red mangrove is `shrub`-formed — drawn by
 * repurposing the pine-kind slot with `MGForms.roundCrownForm` at a smaller blob count, the
 * same move `ea-savanna.js` makes for whistling thorn. Fan palm is this biome's third
 * species but needs the deferred `tree.body()` hook (see `_forms.js`'s header).
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// red-mangrove
const MANGROVE_CROWN = H6(['#1c3220', '#28492c', '#386138', '#4c7a48', '#6a9660']);
const MANGROVE_BARK = H6(['#7a6450', '#55463a', '#332b24']);
// curtain-fig
const FIG_CROWN = H6(['#122a18', '#1d4324', '#2b5c30', '#3f7842', '#5d9656']);
const FIG_BARK = H6(['#8a8470', '#615c4c', '#3a372c']);

AF.env('au-tropical', {
  pals: { pine: MANGROVE_CROWN, round: FIG_CROWN },
  tree: {
    width: widthForm(1, 1.3),
    trunk: trunkForm(MANGROVE_BARK, FIG_BARK),
    crown: (c) => {
      if (!c.pine) return false; // curtain fig: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0.08, 0.8);
      return true;
    },
  },
});
})();
