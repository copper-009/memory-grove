/* Memory Grove — Borneo, lowland dipterocarp rainforest.
 *
 * Giant dipterocarp (the canopy giant this biome is named for) and rafflesia, two of the
 * biome's four species (`src/regions/borneo/index.ts`). Rafflesia is `shrub`-formed — low
 * and dense, not a full crown — drawn by repurposing the pine-kind slot with
 * `MGForms.roundCrownForm` at a small blob count and reduced crown height, the same move
 * `ea-savanna.js` makes for whistling thorn. Picked over the biome's other shrub (the
 * pitcher plant) for the same reason `au-eucalypt.js` picked its two species: rafflesia's
 * pale highlight tone (`#f0e0d0`) stands out against green canopy far more than a second
 * muted shrub would, at this resolution.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// giant-dipterocarp (src/regions/borneo/index.ts)
const DIPTEROCARP_CROWN = H6(['#122a18', '#1d4324', '#2b5c30', '#3f7842', '#5d9656']);
const DIPTEROCARP_BARK = H6(['#8a8470', '#615c4c', '#3a372c']);
// rafflesia
const RAFFLESIA_CROWN = H6(['#2a1a18', '#4a2420', '#7a3a2e', '#a85a40', '#f0e0d0']);
const RAFFLESIA_BARK = H6(['#3a2a24', '#281c18', '#181210']);

AF.env('bo-dipterocarp', {
  theme: window.MGForms.groundTheme(["#2e4228","#22331e","#3c5636"], ["#b4c0c8","#7a8a84"]),
  pals: { pine: RAFFLESIA_CROWN, round: DIPTEROCARP_CROWN },
  tree: {
    width: widthForm(0.5, 1.25),
    trunk: trunkForm(RAFFLESIA_BARK, DIPTEROCARP_BARK),
    crown: (c) => {
      if (!c.pine) return false; // giant dipterocarp: the engine's own broadleaf crown is already right
      roundCrownForm(c, 2, 0, 0.6);
      return true;
    },
  },
});
})();
