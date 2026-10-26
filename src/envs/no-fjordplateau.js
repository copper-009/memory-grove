/* Memory Grove — Norway, fjord coast and plateau (this region's second biome).
 *
 * Both of the biome's two species (`src/regions/norway/index.ts`) are `shrub` — heather
 * (purple-flower highlight, `#9a6a94`, its own) and dwarf birch (red-autumn highlight,
 * `#c0302a`, its own) — so neither kind-slot gets the engine's own default crown; both use
 * `MGForms.roundCrownForm` at a small blob count, tuned slightly differently (dwarf birch a
 * touch larger/less open than heather) so the two still read as different plants rather
 * than the same shape in two colours.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// heather
const HEATHER_CROWN = H6(['#2e2a34', '#3e3844', '#524854', '#6a5c68', '#9a6a94']);
const HEATHER_BARK = H6(['#4a4038', '#342c26', '#201c18']);
// dwarf-birch
const DWARF_BIRCH_CROWN = H6(['#2a3a24', '#3a4e30', '#4d663e', '#648050', '#c0302a']);
const DWARF_BIRCH_BARK = H6(['#5a5244', '#403a30', '#28241c']);

AF.env('no-fjordplateau', {
  theme: window.MGForms.groundTheme(["#8a9078","#6a7258","#9ca488"], ["#5a7088","#3a5060"], ["#5f87b8","#82a0c6","#a6bcd6","#c7d6e2","#dde6e4","#eef2ec"]),
  pals: { pine: HEATHER_CROWN, round: DWARF_BIRCH_CROWN },
  tree: {
    width: widthForm(0.55, 0.5),
    trunk: trunkForm(HEATHER_BARK, DWARF_BIRCH_BARK),
    crown: (c) => {
      if (c.pine) { roundCrownForm(c, 2, 0.1, 0.6); return true; }
      roundCrownForm(c, 3, 0.05, 0.7);
      return true;
    },
  },
});
})();
