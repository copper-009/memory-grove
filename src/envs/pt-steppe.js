/* Memory Grove — Patagonia, Patagonian steppe (this region's second biome).
 *
 * Coirón (`hummock`-formed, via `MGForms.hummockCrownForm`) and mata negra (`shrub`-formed,
 * via a small `roundCrownForm`), the biome's only two species
 * (`src/regions/patagonia/index.ts`) — both repurpose their kind-slot's shape, since
 * neither is `conifer` or `broadleaf`.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, hummockCrownForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// coiron
const COIRON_CROWN = H6(['#5a5436', '#726c44', '#8e8652', '#aaa060', '#c6ba76']);
const COIRON_BARK = H6(['#6a6244', '#4c4630', '#302c1e']);
// mata-negra
const MATA_NEGRA_CROWN = H6(['#2a2a20', '#3a3a2c', '#4c4c3a', '#60604a', '#78785e']);
const MATA_NEGRA_BARK = H6(['#4a4636', '#343026', '#201e18']);

AF.env('pt-steppe', {
  theme: window.MGForms.groundTheme(["#8a8260","#6e6848","#9c9470"], ["#8a8a92","#5a5a62"]),
  pals: { pine: COIRON_CROWN, round: MATA_NEGRA_CROWN },
  tree: {
    width: widthForm(0.7, 0.5),
    trunk: trunkForm(COIRON_BARK, MATA_NEGRA_BARK),
    crown: (c) => {
      if (c.pine) { hummockCrownForm(c, 0.9); return true; }
      roundCrownForm(c, 2, 0.1, 0.6);
      return true;
    },
  },
});
})();
