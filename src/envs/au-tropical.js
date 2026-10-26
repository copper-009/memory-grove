/* Memory Grove — Australia, tropical north.
 *
 * Curtain fig (a broadleaf, default-shaped) and fan palm, two of the biome's three species
 * (`src/regions/australia/tropical.ts`). Fan palm is `palm`-formed — a trunk that's most of
 * its height, via `MGForms.palmBody` — more iconic for this biome than red mangrove (this
 * env's earlier pine-slot pick, before `tree.body()` was exercised; see `bo-mangroveriver.js`
 * for the first case it was tried against).
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, palmBody } = window.MGForms;
const H6 = a => a.map(hex);

// fan-palm
const PALM_CROWN = H6(['#17331d', '#214a28', '#306434', '#438044', '#5fa05c']);
const PALM_BARK = H6(['#8a8068', '#625a48', '#3c382c']);
// curtain-fig
const FIG_CROWN = H6(['#122a18', '#1d4324', '#2b5c30', '#3f7842', '#5d9656']);
const FIG_BARK = H6(['#8a8470', '#615c4c', '#3a372c']);

const palmShape = palmBody(PALM_BARK, 7, Math.PI * 1.3);

AF.env('au-tropical', {
  theme: window.MGForms.groundTheme(["#35492e","#273a24","#426038"], ["#8fa2c0","#6e8a92"], ["#6b9fd4","#86b4de","#a2c8e6","#bdd7ea","#d4e3ea","#e6efe8"]),
  pals: { pine: PALM_CROWN, round: FIG_CROWN },
  tree: {
    width: widthForm(1.1, 1.3),
    // body() fully handles pine-kind (fan palm) and returns falsy for round-kind, letting
    // the engine fall through to trunk()/crown() below for the fig — same "body() runs for
    // every tree; branch inside it" pattern as bo-mangroveriver.js.
    body: (c) => (c.pine ? palmShape(c) : false),
    trunk: trunkForm(PALM_BARK, FIG_BARK), // only ever reached for round-kind; pine's own trunk is painted inside palmShape
    // no crown hook: curtain fig (round-kind, the only kind that reaches here) uses the engine's own default broadleaf crown
  },
});
})();
