/* Memory Grove — Aotearoa New Zealand, the Southern Alps (this region's second biome).
 *
 * Mountain beech (a broadleaf, default-shaped) and snow tussock, two of the biome's three
 * species (`src/regions/aotearoa/index.ts`). Snow tussock is `hummock`-formed — drawn by
 * repurposing the pine-kind slot with `MGForms.hummockCrownForm`, the same move
 * `au-eucalypt.js` makes for its grass tree. Mount Cook lily (`shrub`) is documented there
 * too but not drawn separately yet.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, hummockCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// snow-tussock
const TUSSOCK_CROWN = H6(['#6a5c30', '#86723c', '#a28a48', '#bfa458', '#dcc272']);
const TUSSOCK_BARK = H6(['#7a6a40', '#584c2e', '#3a321f']);
// mountain-beech
const BEECH_CROWN = H6(['#1c2a1e', '#283c28', '#365032', '#486a40', '#648856']);
const BEECH_BARK = H6(['#60584a', '#443e34', '#2a2620']);

AF.env('nz-alps', {
  pals: { pine: TUSSOCK_CROWN, round: BEECH_CROWN },
  tree: {
    width: widthForm(0.7, 0.9),
    trunk: trunkForm(TUSSOCK_BARK, BEECH_BARK),
    crown: (c) => {
      if (!c.pine) return false; // mountain beech: the engine's own broadleaf crown is already right
      hummockCrownForm(c, 0.9);
      return true;
    },
  },
});
})();
