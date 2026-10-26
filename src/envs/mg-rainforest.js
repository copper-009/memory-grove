/* Memory Garden — Madagascar, eastern rainforest.
 *
 * Traveller's palm and Madagascar rosewood, two of the biome's three species
 * (`src/regions/madagascar/index.ts`). Traveller's palm — this biome's most recognisable
 * species, with its iconic fan of fronds — is `palm`-formed via `MGForms.palmBody`,
 * replacing this env's earlier pine-slot pick (tree fern, before `tree.body()` was
 * exercised; see `bo-mangroveriver.js` for the first biome it was tried against).
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, palmBody } = window.MGForms;
const H6 = a => a.map(hex);

// traveller-palm
const PALM_CROWN = H6(['#1a3420', '#25492c', '#34623a', '#487e4c', '#669c62']);
const PALM_BARK = H6(['#8a8470', '#615c4c', '#3a372c']);
// madagascar-rosewood
const ROSEWOOD_CROWN = H6(['#162616', '#1f3a1f', '#2c502c', '#3e6a3c', '#588652']);
const ROSEWOOD_BARK = H6(['#4a3a2c', '#332820', '#201812']);

const palmShape = palmBody(PALM_BARK, 9, Math.PI * 1.5);

AF.env('mg-rainforest', {
  theme: window.MGForms.groundTheme(["#2e4228","#22331e","#3c5636"], ["#7a5a52","#5a4038"], ["#5a4a7a","#8a5a7a","#c76a6a","#e89a5e","#f3c07a","#f8dca0"]),
  pals: { pine: PALM_CROWN, round: ROSEWOOD_CROWN },
  tree: {
    width: widthForm(1.1, 1),
    body: (c) => (c.pine ? palmShape(c) : false),
    trunk: trunkForm(PALM_BARK, ROSEWOOD_BARK), // only ever reached for round-kind; pine's own trunk is painted inside palmShape
    // no crown hook: rosewood (round-kind, the only kind that reaches here) uses the engine's own default broadleaf crown
  },
});
})();
