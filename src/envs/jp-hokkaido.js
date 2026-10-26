/* Memory Garden — Japan, Hokkaido/northern snow country (this region's second biome).
 *
 * Ezo spruce (a conifer) and two birches — shirakaba (Japanese white birch) and Erman's
 * birch, both broadleaf, default-shaped, rotated across the round-kind slot by seed
 * (`MGForms.trunkRotateForm`, the same move `pt-beech.js`/`ea-riverine.js` make) —
 * `src/regions/japan/index.ts`. No custom crown hook at all, just this biome's colours,
 * bark and width — the same zero-custom-shape pairing as `jp-satoyama.js`'s own
 * sugi/yamazakura.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkRotateForm } = window.MGForms;
const H6 = a => a.map(hex);

// ezo-spruce
const SPRUCE_CROWN = H6(['#121f1a', '#1a3024', '#24432e', '#33583a', '#4a7250']);
const SPRUCE_BARK = H6(['#6a5a4a', '#473c31', '#2a241e']);
// shirakaba
const BIRCH_CROWN = H6(['#36442a', '#485a34', '#5e7242', '#7a8e54', '#9eac70']);
const BIRCH_BARK = H6(['#f0ece2', '#c8c2b4', '#8a8478']);
// erman-birch
const ERMAN_CROWN = H6(['#32402a', '#425232', '#56683e', '#6e8450', '#8fa268']);
const ERMAN_BARK = H6(['#e8ddd0', '#bfb2a2', '#847a6e']);

const ROUNDS = [BIRCH_CROWN, ERMAN_CROWN];

AF.env('jp-hokkaido', {
  theme: window.MGForms.groundTheme(["#c6d0da","#a6b4c2","#dce4ec"], ["#9aa8c0","#6e7e86"], ["#6f9ccb","#8db0d8","#abc5e2","#c6d8e8","#dce6ea","#eef2ec"]),
  pals: { pine: SPRUCE_CROWN, rounds: ROUNDS },
  tree: {
    width: widthForm(0.7, 0.85),
    trunk: trunkRotateForm(SPRUCE_BARK, [BIRCH_BARK, ERMAN_BARK]),
  },
});
})();
