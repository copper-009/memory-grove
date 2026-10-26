/* Memory Grove — Madagascar, spiny forest (this region's second biome).
 *
 * Octopus tree (round-kind, `columnar`-formed via a half-height `MGForms.roundCrownForm` +
 * `crownShadeForm`, the same pairing `au-coastal.js`'s pandanus uses) and Grandidier's
 * baobab (pine-kind, via `MGForms.bulbousBody` — a trunk that swells near the ground and
 * tapers as it rises, carrying a small crown; see `_forms.js`'s own header for how this
 * differs from `palmBody`). Arguably this biome's single most recognisable species — the
 * Avenue of the Baobabs — finally drawn, not left on the engine's generic default. Fony
 * baobab (also `bulbous`) is documented in `src/regions/madagascar/index.ts` too but not
 * drawn separately yet, the usual "two species standing in" scoping every env here uses.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, roundCrownForm, crownShadeForm, bulbousBody } = window.MGForms;
const H6 = a => a.map(hex);

// octopus-tree (src/regions/madagascar/index.ts)
const OCTOPUS_CROWN = H6(['#2c3a26', '#3c4e32', '#4e6640', '#668052', '#849c6a']);
const OCTOPUS_BARK = H6(['#8a8068', '#625a48', '#3c382c']);
// grandidiers-baobab
const BAOBAB_CROWN = H6(['#2a3420', '#3a4a2c', '#4d643a', '#647e4e', '#869c6a']);
const BAOBAB_BARK = H6(['#9a8a74', '#6e6050', '#473c30']);

const baobabShape = bulbousBody(BAOBAB_BARK, 2, 0.1);

AF.env('mg-spiny', {
  theme: window.MGForms.groundTheme(["#b3794a","#8a5a36","#c79660"], ["#7a5a52","#5a4038"]),
  pals: { round: OCTOPUS_CROWN, pine: BAOBAB_CROWN },
  tree: {
    width: widthForm(1.3, 1),
    body: (c) => (c.pine ? baobabShape(c) : false),
    trunk: (c) => {
      if (c.pine) return false; // handled by body() above
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
      if (c.pine) return false; // handled by body() above
      roundCrownForm(c, 3, 0, 0.5);
      crownShadeForm(c);
      return true;
    },
  },
});
})();
