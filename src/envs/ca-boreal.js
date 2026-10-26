/* Memory Garden — Canada, boreal forest and lakes.
 *
 * Black spruce (a conifer) and paper birch (a broadleaf) — the vendored engine's own default
 * crowns already draw both forms correctly, so no custom crown hook, just this biome's own
 * colours, bark and width (`src/regions/canada/index.ts`). Paper birch's pale bark is the
 * whole reason the pairing reads clearly against the spruce's near-black one. Tamarack (a
 * conifer that golds and drops its needles in autumn) is documented there too but not drawn
 * separately yet — it would need its own `pals.pine`/`pals.pineRounds`-style swap this file
 * doesn't attempt.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm } = window.MGForms;
const H6 = a => a.map(hex);

// black-spruce (src/regions/canada/index.ts)
const SPRUCE_CROWN = H6(['#101e16', '#182e20', '#223e2a', '#305038', '#44684a']);
const SPRUCE_BARK = H6(['#5a4a3c', '#3e332a', '#26201a']);
// paper-birch
const BIRCH_CROWN = H6(['#2c3a24', '#3c5030', '#4f683e', '#678250', '#86a068']);
const BIRCH_BARK = H6(['#f0ece2', '#c8c2b4', '#8a8478']);

AF.env('ca-boreal', {
  theme: window.MGForms.groundTheme(["#2e3e2a","#20301e","#3c523a"], ["#7a8ca0","#4e6070"], ["#5f8cc0","#82a6d0","#a6bfdc","#c7d6e6","#dde6ea","#eef2ea"]),
  pals: { pine: SPRUCE_CROWN, round: BIRCH_CROWN },
  tree: {
    width: widthForm(0.7, 0.9),
    trunk: trunkForm(SPRUCE_BARK, BIRCH_BARK),
  },
});
})();
