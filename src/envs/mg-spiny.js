/* Memory Grove — Madagascar, spiny forest (this region's second biome).
 *
 * Only the octopus tree is drawn here, round-kind — `columnar`-formed via a half-height
 * `MGForms.roundCrownForm` + `crownShadeForm`, the same pairing `au-coastal.js`'s pandanus
 * uses. The biome's other two species (`src/regions/madagascar/index.ts`) are both
 * `bulbous` baobabs — Grandidier's and fony — which need the still-deferred `tree.body()`
 * hook (see `_forms.js`'s header); pine-kind trees are left on the engine's own generic
 * default rather than forced into either baobab's actual shape without a way to check it.
 * A real, stated gap for this one biome: arguably its two most famous trees, both missing.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { roundCrownForm, crownShadeForm } = window.MGForms;
const H6 = a => a.map(hex);

// octopus-tree (src/regions/madagascar/index.ts)
const OCTOPUS_CROWN = H6(['#2c3a26', '#3c4e32', '#4e6640', '#668052', '#849c6a']);
const OCTOPUS_BARK = H6(['#8a8068', '#625a48', '#3c382c']);

AF.env('mg-spiny', {
  theme: window.MGForms.groundTheme(["#b3794a","#8a5a36","#c79660"]),
  pals: { round: OCTOPUS_CROWN },
  tree: {
    trunk: (c) => {
      if (c.pine) return false; // no baobab here yet; the engine's own default pine trunk stands in
      const { base, tx0, tw, trunkH, put, ancient } = c;
      const bark = OCTOPUS_BARK;
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
      if (c.pine) return false; // no baobab here yet; the engine's own default pine crown stands in
      roundCrownForm(c, 3, 0, 0.5);
      crownShadeForm(c);
      return true;
    },
  },
});
})();
