/* Memory Grove — Borneo, mangrove river (this region's second biome).
 *
 * Only bakau mangrove is drawn here, round-kind — `shrub`-formed via a small
 * `MGForms.roundCrownForm`. The biome's other species (`src/regions/borneo/index.ts`), nipa
 * palm, needs the still-deferred `tree.body()` hook (see `_forms.js`'s header); pine-kind
 * trees are left on the engine's own generic default rather than forced into a palm's shape
 * without a way to check it live — a real, stated gap for this biome, same as
 * `mg-spiny.js`'s missing baobabs.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { roundCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// bakau-mangrove (src/regions/borneo/index.ts)
const BAKAU_CROWN = H6(['#1c3220', '#28492c', '#386138', '#4c7a48', '#6a9660']);
const BAKAU_BARK = H6(['#7a6450', '#55463a', '#332b24']);

AF.env('bo-mangroveriver', {
  theme: window.MGForms.groundTheme(["#3a4a30","#2a3822","#4c603e"]),
  pals: { round: BAKAU_CROWN },
  tree: {
    trunk: (c) => {
      if (c.pine) return false; // no nipa palm here yet; the engine's own default pine trunk stands in
      const { base, tx0, tw, trunkH, put, ancient } = c;
      const bark = BAKAU_BARK;
      for (let y = base - trunkH; y <= base; y++) {
        for (let x = tx0; x < tx0 + tw; x++) {
          let col = tw > 1 && x === tx0 ? bark[0] : tw > 1 && x === tx0 + tw - 1 ? bark[2] : bark[1];
          if (y <= base - trunkH + 3) col = bark[2];
          else if (tw === 1 && y & 1) col = bark[0];
          put(x, y, col);
        }
      }
      if (c.t.stage >= AF.STAGE.MATURE && !ancient) { put(tx0 - 1, base, bark[2]); put(tx0 + tw, base, bark[2]); }
      return true;
    },
    crown: (c) => {
      if (c.pine) return false; // no nipa palm here yet; the engine's own default pine crown stands in
      roundCrownForm(c, 2, 0.08, 0.6);
      return true;
    },
  },
});
})();
