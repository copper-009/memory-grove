/* Memory Grove — Norway, taiga forest.
 *
 * Norway spruce (a conifer) and rowan (a broadleaf) — both default-shaped, no custom crown
 * hook, same as `ca-boreal.js` and for the same reason. Rowan's highlight tone is its own
 * red-berry colour (`src/regions/norway/index.ts`), not anything added here. Scots pine and
 * downy birch are documented there too but not drawn separately yet.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm } = window.MGForms;
const H6 = a => a.map(hex);

// norway-spruce (src/regions/norway/index.ts)
const SPRUCE_CROWN = H6(['#101f17', '#1a3024', '#24432e', '#33583c', '#48724e']);
const SPRUCE_BARK = H6(['#6a5a48', '#473c30', '#2c251c']);
// rowan
const ROWAN_CROWN = H6(['#243222', '#33462c', '#455c3a', '#5b764c', '#c0302a']);
const ROWAN_BARK = H6(['#7a7058', '#564e3c', '#342f24']);

AF.env('no-taiga', {
  theme: window.MGForms.groundTheme(["#2e3e28","#20301e","#3c523a"], ["#5a7088","#3a5060"]),
  pals: { pine: SPRUCE_CROWN, round: ROWAN_CROWN },
  tree: {
    width: widthForm(0.7, 0.85),
    trunk: trunkForm(SPRUCE_BARK, ROWAN_BARK),
  },
});
})();
