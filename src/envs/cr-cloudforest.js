/* Memory Grove — Costa Rica, cloud forest.
 *
 * Tree fern and Costa Rican oak, two of the biome's three species, the same
 * frond-vs-default-broadleaf pairing as `mg-rainforest.js` (and for the same reason: it's
 * the one pair in this biome's three species whose silhouettes actually differ once drawn).
 * Bromeliad-tree (`src/regions/costarica/index.ts`) is documented there but not drawn
 * separately yet — it's `broadleaf` too, so would need its own crown hook to look like
 * anything but a second oak.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, frondCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// tree-fern-cr (src/regions/costarica/index.ts)
const FERN_CROWN = H6(['#1a3020', '#264830', '#356140', '#4a7c52', '#699a68']);
const FERN_BARK = H6(['#6a5c48', '#473c30', '#2c251c']);
// oak-costa-rica
const OAK_CROWN = H6(['#152a1a', '#204028', '#2d5836', '#3f7246', '#5a9058']);
const OAK_BARK = H6(['#7a7258', '#564f3c', '#332f24']);

AF.env('cr-cloudforest', {
  theme: window.MGForms.groundTheme(["#2e4232","#223428","#3c5a3e"], ["#7a8a9a","#4e6052"], ["#5f8cc0","#82a6d0","#a6bfdc","#c7d6e6","#dde6ea","#eef2ea"]),
  pals: { pine: FERN_CROWN, round: OAK_CROWN },
  tree: {
    width: widthForm(1.1, 1.1),
    trunk: trunkForm(FERN_BARK, OAK_BARK),
    crown: (c) => {
      if (!c.pine) return false; // oak: the engine's own broadleaf crown is already right
      frondCrownForm(c, 9, Math.PI * 0.9);
      return true;
    },
  },
});
})();
