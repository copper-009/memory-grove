/* Memory Garden — Norway, taiga forest.
 *
 * Norway spruce (a conifer, default-shaped) and two broadleaves — rowan and downy birch,
 * both default-shaped, rotated across the round-kind slot by seed
 * (`MGForms.trunkRotateForm`, the same move `pt-beech.js`/`ea-riverine.js` make). Rowan's
 * highlight tone is its own red-berry colour (`src/regions/norway/index.ts`), not anything
 * added here. Scots pine (also a conifer) is documented there too but not drawn
 * separately yet — `trees.js` has no rotation array for the pine-kind slot the way
 * `EP.rounds` gives the round-kind one, only a single `EP.pine`, so a second conifer can't
 * join Norway spruce the same cheap way these two broadleaves joined rowan.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkRotateForm } = window.MGForms;
const H6 = a => a.map(hex);

// norway-spruce (src/regions/norway/index.ts)
const SPRUCE_CROWN = H6(['#101f17', '#1a3024', '#24432e', '#33583c', '#48724e']);
const SPRUCE_BARK = H6(['#6a5a48', '#473c30', '#2c251c']);
// rowan
const ROWAN_CROWN = H6(['#243222', '#33462c', '#455c3a', '#5b764c', '#c0302a']);
const ROWAN_BARK = H6(['#7a7058', '#564e3c', '#342f24']);
// downy-birch
const BIRCH_CROWN = H6(['#2c3a24', '#3c5030', '#4f683e', '#678250', '#86a068']);
const BIRCH_BARK = H6(['#d8d0c0', '#ada290', '#7a7062']);

const ROUNDS = [ROWAN_CROWN, BIRCH_CROWN];

AF.env('no-taiga', {
  theme: window.MGForms.groundTheme(["#2e3e28","#20301e","#3c523a"], ["#5a7088","#3a5060"], ["#5f87b8","#82a0c6","#a6bcd6","#c7d6e2","#dde6e4","#eef2ec"]),
  pals: { pine: SPRUCE_CROWN, rounds: ROUNDS },
  tree: {
    width: widthForm(0.7, 0.85),
    trunk: trunkRotateForm(SPRUCE_BARK, [ROWAN_BARK, BIRCH_BARK]),
  },
});
})();
