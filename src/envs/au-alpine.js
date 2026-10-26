/* Memory Grove — Australia, alpine high country.
 *
 * Snow gum (a broadleaf, default-shaped — its pale bark is its own colour) and alpine
 * everlasting, two of the biome's four species (`src/regions/australia/alpine.ts`). Alpine
 * everlasting is `shrub`-formed — a low, dense mound with a golden-flower highlight tone
 * that's its own (`#e0c048`) — drawn by repurposing the pine-kind slot with
 * `MGForms.roundCrownForm` at a small blob count, the same move `ea-savanna.js` makes for
 * whistling thorn.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// alpine-everlasting
const EVERLASTING_CROWN = H6(['#46502e', '#5a6438', '#707844', '#8a8c50', '#e0c048']);
const EVERLASTING_BARK = H6(['#5e5a44', '#444030', '#2c2a20']);
// snow-gum
const SNOWGUM_CROWN = H6(['#2e3a2e', '#3e4e38', '#526444', '#6c8054', '#8fa470']);
const SNOWGUM_BARK = H6(['#e0d8c6', '#a89a84', '#7a6a58']);

AF.env('au-alpine', {
  theme: window.MGForms.groundTheme(["#7f8a6e","#5e6b52","#8c9a72"], ["#8fa2c0","#6e8a92"], ["#6b9fd4","#86b4de","#a2c8e6","#bdd7ea","#d4e3ea","#e6efe8"]),
  pals: { pine: EVERLASTING_CROWN, round: SNOWGUM_CROWN },
  tree: {
    width: widthForm(0.6, 1.1),
    trunk: trunkForm(EVERLASTING_BARK, SNOWGUM_BARK),
    crown: (c) => {
      if (!c.pine) return false; // snow gum: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0.1, 0.75);
      return true;
    },
  },
});
})();
