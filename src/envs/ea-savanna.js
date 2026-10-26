/* Memory Grove — East African acacia savanna.
 *
 * Umbrella thorn (round-kind, default broadleaf crown) and the baobab — this biome's most
 * recognisable tree, `bulbous`-formed via `MGForms.bulbousBody`, replacing this env's
 * earlier pine-slot pick (whistling thorn, before `tree.body()` was exercised; see
 * `mg-spiny.js` for the first `bulbous` species it was tried against). Whistling thorn is
 * documented in `src/regions/eastafrica/index.ts` too but not drawn separately yet.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, bulbousBody } = window.MGForms;
const H6 = a => a.map(hex);

// baobab-ea
const BAOBAB_CROWN = H6(['#2c3820', '#3c502c', '#4f683a', '#67824c', '#889c66']);
const BAOBAB_BARK = H6(['#b0a080', '#857650', '#574c34']);
// umbrella-thorn
const UMBRELLA_CROWN = H6(['#2a3420', '#3a4a2c', '#4d643a', '#647e4e', '#869c6a']);
const UMBRELLA_BARK = H6(['#7a6a52', '#564a38', '#342c20']);

const baobabShape = bulbousBody(BAOBAB_BARK, 2, 0.1);

AF.env('ea-savanna', {
  theme: window.MGForms.groundTheme(["#b3a060","#9a8a4e","#c6b878"], ["#c0ac72","#9a8a4e"], ["#6a9ac8","#8dafd2","#b6c6d8","#e0d4a8","#f0dc9a","#f8e8b8"]),
  pals: { pine: BAOBAB_CROWN, round: UMBRELLA_CROWN },
  tree: {
    width: widthForm(1.3, 1.2),
    body: (c) => (c.pine ? baobabShape(c) : false),
    trunk: trunkForm(BAOBAB_BARK, UMBRELLA_BARK), // only ever reached for round-kind; pine's own trunk is painted inside baobabShape
    // no crown hook: umbrella thorn (round-kind, the only kind that reaches here) uses the engine's own default broadleaf crown
  },
});
})();
