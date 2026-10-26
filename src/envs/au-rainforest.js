/* Memory Grove — Australia, subtropical rainforest.
 *
 * Antarctic beech (a broadleaf, default-shaped) and bangalow palm, two of the biome's five
 * species (`src/regions/australia/rainforest.ts`). Bangalow palm is `palm`-formed, via
 * `MGForms.palmBody` — this biome's most recognisable plant, and this env's earlier
 * pine-slot pick (tree fern, before `tree.body()` was exercised) has given way to it; see
 * `bo-mangroveriver.js` for the first biome it was tried against.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, palmBody } = window.MGForms;
const H6 = a => a.map(hex);

// bangalow-palm
const PALM_CROWN = H6(['#1c3522', '#284c2e', '#39663b', '#4f8049', '#6f9e5e']);
const PALM_BARK = H6(['#9a9684', '#736f5e', '#4c4a3c']);
// antarctic-beech
const BEECH_CROWN = H6(['#16281a', '#214028', '#2f5834', '#437044', '#608c57']);
const BEECH_BARK = H6(['#6a6a52', '#484a38', '#2c2e22']);

const palmShape = palmBody(PALM_BARK, 7, Math.PI * 1.3);

AF.env('au-rainforest', {
  theme: window.MGForms.groundTheme(["#3c4a33","#2d3b28","#49603a"], ["#8fa2c0","#6e8a92"], ["#6b9fd4","#86b4de","#a2c8e6","#bdd7ea","#d4e3ea","#e6efe8"]),
  pals: { pine: PALM_CROWN, round: BEECH_CROWN },
  tree: {
    width: widthForm(0.95, 1.05),
    body: (c) => (c.pine ? palmShape(c) : false),
    trunk: trunkForm(PALM_BARK, BEECH_BARK), // only ever reached for round-kind; pine's own trunk is painted inside palmShape
    // no crown hook: antarctic beech (round-kind, the only kind that reaches here) uses the engine's own default broadleaf crown
  },
});
})();
