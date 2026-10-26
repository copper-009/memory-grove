/* Memory Grove — Australia, coastal heath and wetland.
 *
 * Paperbark (a broadleaf, default-shaped — its pale, papery bark is its own colour, not
 * added here) and pandanus, two of the biome's five species
 * (`src/regions/australia/coastal.ts`). Pandanus is `columnar`-formed — tall and narrow —
 * drawn by repurposing the pine-kind slot with a half-height `MGForms.roundCrownForm` plus
 * `crownShadeForm`'s self-shadow, the same pairing `np-terai.js` uses for elephant grass.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm, crownShadeForm } = window.MGForms;
const H6 = a => a.map(hex);

// pandanus
const PANDANUS_CROWN = H6(['#20381f', '#2d4c2a', '#3e6436', '#548046', '#749e5e']);
const PANDANUS_BARK = H6(['#9a8e74', '#6e6454', '#443e34']);
// paperbark
const PAPERBARK_CROWN = H6(['#2b3a2c', '#3c5036', '#516a42', '#6c8a52', '#92ae6c']);
const PAPERBARK_BARK = H6(['#e4ddcc', '#bdb5a2', '#8e8775']);

AF.env('au-coastal', {
  theme: window.MGForms.groundTheme(["#7d8a62","#5e7250","#8aa066"]),
  pals: { pine: PANDANUS_CROWN, round: PAPERBARK_CROWN },
  tree: {
    width: widthForm(1.05, 0.95),
    trunk: trunkForm(PANDANUS_BARK, PAPERBARK_BARK),
    crown: (c) => {
      if (!c.pine) return false; // paperbark: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0, 0.5);
      crownShadeForm(c);
      return true;
    },
  },
});
})();
