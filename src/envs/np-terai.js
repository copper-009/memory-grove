/* Memory Garden — Nepal, Terai lowland.
 *
 * Sal (a broadleaf) and elephant grass, the biome's only two species
 * (`src/regions/nepal/index.ts`). Elephant grass is `columnar`-formed — tall and narrow, not
 * a full round crown — drawn by repurposing the pine-kind slot with `MGForms.roundCrownForm`
 * at half the usual crown height plus `crownShadeForm`'s self-shadow, the same pairing the
 * old (now-deleted) procedural renderer used for `columnar` species. Its pale, almost-white
 * highlight tone is its own (`#d8d4b8`), not added here.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm, crownShadeForm } = window.MGForms;
const H6 = a => a.map(hex);

// sal (src/regions/nepal/index.ts)
const SAL_CROWN = H6(['#162a1a', '#204028', '#2c5633', '#3e7044', '#588c58']);
const SAL_BARK = H6(['#8a7a60', '#5e5342', '#3a3326']);
// elephant-grass
const GRASS_CROWN = H6(['#4a5430', '#5e6c3c', '#76864c', '#92a260', '#d8d4b8']);
const GRASS_BARK = H6(['#6a6244', '#4c4630', '#302c1e']);

AF.env('np-terai', {
  theme: window.MGForms.groundTheme(["#6a7a3e","#4e5e2c","#8a9850"], ["#d8d4dc","#6a6a7a"], ["#3a4a7a","#6a6a9a","#c08aa0","#eaa37a","#f6c08a","#fbdca0"]),
  pals: { pine: GRASS_CROWN, round: SAL_CROWN },
  tree: {
    width: widthForm(0.8, 1.1),
    trunk: trunkForm(GRASS_BARK, SAL_BARK),
    crown: (c) => {
      if (!c.pine) return false; // sal: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0, 0.5);
      crownShadeForm(c);
      return true;
    },
  },
});
})();
