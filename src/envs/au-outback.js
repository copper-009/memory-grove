/* Memory Grove — Australia, outback.
 *
 * Ghost gum (a broadleaf, default-shaped — its pale, almost-white bark is its own colour)
 * and desert oak, two of the biome's four species (`src/regions/australia/outback.ts`).
 * Desert oak is `columnar`-formed, the same half-height `MGForms.roundCrownForm` +
 * `crownShadeForm` pairing as `au-coastal.js`'s pandanus and `np-terai.js`'s elephant grass.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm, crownShadeForm } = window.MGForms;
const H6 = a => a.map(hex);

// desert-oak
const OAK_CROWN = H6(['#20291f', '#2e3b28', '#3e5033', '#536742', '#6e8356']);
const OAK_BARK = H6(['#6a5442', '#4a3a2c', '#2e241c']);
// ghost-gum
const GHOST_CROWN = H6(['#36442a', '#475a33', '#5c723f', '#78904f', '#9cb268']);
const GHOST_BARK = H6(['#f2efe6', '#d4cfc0', '#ada798']);

AF.env('au-outback', {
  pals: { pine: OAK_CROWN, round: GHOST_CROWN },
  tree: {
    width: widthForm(0.8, 1),
    trunk: trunkForm(OAK_BARK, GHOST_BARK),
    crown: (c) => {
      if (!c.pine) return false; // ghost gum: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0, 0.5);
      crownShadeForm(c);
      return true;
    },
  },
});
})();
