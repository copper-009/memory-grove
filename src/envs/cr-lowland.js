/* Memory Garden — Costa Rica, lowland rainforest (this region's second biome).
 *
 * Ceiba and strangler fig (both broadleaf, default-shaped, rotated across the round-kind
 * slot by seed — `MGForms.trunkRotateForm`, the same move `pt-beech.js`/`ea-riverine.js`
 * make) and heliconia, all three of the biome's species (`src/regions/costarica/index.ts`).
 * Heliconia is `shrub`-formed — drawn by repurposing the pine-kind slot with
 * `MGForms.roundCrownForm` at a smaller blob count, the same move `ea-savanna.js` makes for
 * whistling thorn — its red-flower highlight tone is its own (`#e03a2a`).
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkRotateForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// heliconia
const HELICONIA_CROWN = H6(['#1e3620', '#2a4c2c', '#3a663c', '#4f844e', '#e03a2a']);
const HELICONIA_BARK = H6(['#4a5a3a', '#344028', '#20281a']);
// ceiba
const CEIBA_CROWN = H6(['#122a18', '#1d4324', '#2b5c30', '#3f7842', '#5d9656']);
const CEIBA_BARK = H6(['#8a8470', '#615c4c', '#3a372c']);
// strangler fig
const FIG_CROWN = H6(['#13241a', '#1e3a26', '#2b5231', '#3f6c42', '#5c8a55']);
const FIG_BARK = H6(['#7a7258', '#564f3c', '#332f24']);

const ROUNDS = [CEIBA_CROWN, FIG_CROWN];

AF.env('cr-lowland', {
  theme: window.MGForms.groundTheme(["#2e4228","#22331e","#3c5636"], ["#7a8a9a","#4e6052"], ["#5f8cc0","#82a6d0","#a6bfdc","#c7d6e6","#dde6ea","#eef2ea"]),
  pals: { pine: HELICONIA_CROWN, rounds: ROUNDS },
  tree: {
    width: widthForm(0.75, 1.3),
    trunk: trunkRotateForm(HELICONIA_BARK, [CEIBA_BARK, FIG_BARK]),
    crown: (c) => {
      if (!c.pine) return false; // ceiba/fig: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0.08, 0.7);
      return true;
    },
  },
});
})();
