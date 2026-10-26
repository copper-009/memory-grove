/* Memory Grove — Madagascar, eastern rainforest.
 *
 * Tree fern and Madagascar rosewood, two of the biome's three species — the fan of fronds
 * (`MGForms.frondCrownForm`, repurposing the pine-kind slot the way `au-eucalypt.js`
 * repurposes it for a grass tree) reads nothing like the rosewood's own default broadleaf
 * crown, which is the point of picking these two. The traveller's palm
 * (`src/regions/madagascar/index.ts`) is the biome's most recognisable species but needs a
 * trunk far taller than the engine's fixed pine/broadleaf trunk-height share allows for — see
 * `_forms.js`'s own header on why that's deferred rather than guessed at tonight.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, frondCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// tree-fern-madagascar (src/regions/madagascar/index.ts)
const FERN_CROWN = H6(['#193020', '#25462c', '#345e3a', '#497a4a', '#6a9860']);
const FERN_BARK = H6(['#6a5c48', '#473c30', '#2c251c']);
// madagascar-rosewood
const ROSEWOOD_CROWN = H6(['#162616', '#1f3a1f', '#2c502c', '#3e6a3c', '#588652']);
const ROSEWOOD_BARK = H6(['#4a3a2c', '#332820', '#201812']);

AF.env('mg-rainforest', {
  theme: window.MGForms.groundTheme(["#2e4228","#22331e","#3c5636"], ["#7a5a52","#5a4038"]),
  pals: { pine: FERN_CROWN, round: ROSEWOOD_CROWN },
  tree: {
    width: widthForm(1.05, 1),
    trunk: trunkForm(FERN_BARK, ROSEWOOD_BARK),
    crown: (c) => {
      if (!c.pine) return false; // rosewood: the engine's own broadleaf crown is already right
      frondCrownForm(c, 9, Math.PI * 0.9);
      return true;
    },
  },
});
})();
