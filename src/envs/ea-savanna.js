/* Memory Grove — East African acacia savanna.
 *
 * Whistling thorn and umbrella thorn, two of the biome's three species. Whistling thorn is
 * `shrub`-formed (`src/regions/eastafrica/index.ts`) — a low, dense mound, not a full-height
 * crown — drawn here by repurposing the pine-kind slot (the same move `au-eucalypt.js` makes
 * for its grass tree) with `MGForms.roundCrownForm` at a smaller blob count and a shorter
 * crown fraction, rather than the tall tiered conifer shape that slot would otherwise draw.
 * Umbrella thorn's own default broadleaf crown needs nothing extra.
 *
 * The baobab (this biome's most recognisable tree) is `bulbous`-formed and needs the same
 * `tree.body()` hook `mg-rainforest.js`'s traveller's palm is waiting on — deferred for the
 * same reason, not dropped.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// whistling-thorn (src/regions/eastafrica/index.ts)
const THORN_CROWN = H6(['#243020', '#32442c', '#43583a', '#587048', '#74885e']);
const THORN_BARK = H6(['#4a4030', '#342c20', '#201a14']);
// umbrella-thorn
const UMBRELLA_CROWN = H6(['#2a3420', '#3a4a2c', '#4d643a', '#647e4e', '#869c6a']);
const UMBRELLA_BARK = H6(['#7a6a52', '#564a38', '#342c20']);

AF.env('ea-savanna', {
  theme: window.MGForms.groundTheme(["#b3a060","#9a8a4e","#c6b878"], ["#c0ac72","#9a8a4e"]),
  pals: { pine: THORN_CROWN, round: UMBRELLA_CROWN },
  tree: {
    width: widthForm(0.85, 1.2),
    trunk: trunkForm(THORN_BARK, UMBRELLA_BARK),
    crown: (c) => {
      if (!c.pine) return false; // umbrella thorn: the engine's own broadleaf crown is already right
      roundCrownForm(c, 3, 0.1, 0.75); // whistling thorn: a low, denser, slightly open mound
      return true;
    },
  },
});
})();
