/* Memory Garden — Nepal, high Himalaya (this region's second biome).
 *
 * Juniper (a conifer, default-shaped) and two broadleaf shrubs/trees — rhododendron and
 * Himalayan birch, both default-shaped, rotated across the round-kind slot by seed
 * (`MGForms.trunkRotateForm`, the same move `pt-beech.js`/`ea-riverine.js` make) — all
 * three of the biome's species (`src/regions/nepal/index.ts`). Rhododendron's red-flower
 * highlight tone and Himalayan birch's coppery-pink bark are each its own.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkRotateForm } = window.MGForms;
const H6 = a => a.map(hex);

// juniper-np
const JUNIPER_CROWN = H6(['#1a2a1e', '#263c2a', '#324e36', '#436848', '#5c8460']);
const JUNIPER_BARK = H6(['#6a5c48', '#473c30', '#2c251c']);
// rhododendron
const RHODO_CROWN = H6(['#1e301e', '#2c462a', '#3c5e38', '#527a4a', '#c0302a']);
const RHODO_BARK = H6(['#7a6a58', '#564a3c', '#342c24']);
// himalayan-birch
const BIRCH_CROWN = H6(['#2c3a24', '#3c5030', '#4f683e', '#678250', '#86a068']);
const BIRCH_BARK = H6(['#c88a6a', '#9a5e42', '#6a3e2a']);

const ROUNDS = [RHODO_CROWN, BIRCH_CROWN];

AF.env('np-himalaya', {
  theme: window.MGForms.groundTheme(["#8a8878","#6a6858","#9ca08a"], ["#d8d4dc","#6a6a7a"], ["#3a4a7a","#6a6a9a","#c08aa0","#eaa37a","#f6c08a","#fbdca0"]),
  pals: { pine: JUNIPER_CROWN, rounds: ROUNDS },
  tree: {
    width: widthForm(0.6, 0.95),
    trunk: trunkRotateForm(JUNIPER_BARK, [RHODO_BARK, BIRCH_BARK]),
  },
});
})();
