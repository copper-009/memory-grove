/* Memory Garden — Borneo, mangrove river (this region's second biome).
 *
 * Bakau mangrove (round-kind, `shrub`-formed via a small `MGForms.roundCrownForm`) and nipa
 * palm (pine-kind, via `MGForms.palmBody` — a trunk that's most of its height with a frond
 * fan at the top, the geometry only `tree.body()` can give a tree; see `_forms.js`'s own
 * header for why). `body()` runs for every tree regardless of kind, so it returns `false`
 * for round-kind here, letting the engine fall through to the normal path, where `trunk`/
 * `crown` below handle the mangrove exactly as before.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { roundCrownForm, palmBody, widthForm } = window.MGForms;
const H6 = a => a.map(hex);

// bakau-mangrove (src/regions/borneo/index.ts)
const BAKAU_CROWN = H6(['#1c3220', '#28492c', '#386138', '#4c7a48', '#6a9660']);
const BAKAU_BARK = H6(['#7a6450', '#55463a', '#332b24']);
// nipa-palm
const NIPA_CROWN = H6(['#1c3220', '#28492c', '#386138', '#4c7a48', '#6a9660']);
const NIPA_BARK = H6(['#6a6048', '#473e30', '#2c261c']);

const nipaBody = palmBody(NIPA_BARK, 7, Math.PI * 1.3);

AF.env('bo-mangroveriver', {
  theme: window.MGForms.groundTheme(["#3a4a30","#2a3822","#4c603e"], ["#b4c0c8","#7a8a84"], ["#6a9ac8","#8cb0d6","#b0c6e0","#cfdbe8","#e6ebe8","#f2f0e6"]),
  pals: { round: BAKAU_CROWN, pine: NIPA_CROWN },
  tree: {
    width: widthForm(0.9, 1),
    body: (c) => (c.pine ? nipaBody(c) : false),
    trunk: (c) => {
      if (c.pine) return false; // handled by body() above
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
      if (c.pine) return false; // handled by body() above
      roundCrownForm(c, 2, 0.08, 0.6);
      return true;
    },
  },
});
})();
