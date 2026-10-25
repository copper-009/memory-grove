/* Memory Grove — Aotearoa New Zealand, kauri and podocarp forest.
 *
 * Two of the biome's four species, chosen for the most distinct silhouettes (the same
 * judgment call `au-eucalypt.js` makes, for the same reason): kauri, a true conifer whose
 * tiered crown is already exactly what the vendored engine's own default pine-kind drawing
 * gives it — no custom crown hook needed, just this species' own colours; and the silver
 * fern (ponga), whose arching fronds are nothing like either default crown, drawn with
 * `MGForms.frondCrownForm`. Rimu and harakeke (NZ flax) are documented in
 * `src/regions/aotearoa/index.ts` but not drawn separately yet.
 *
 * Colours are the exact ones already in that file's own species data.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm, frondCrownForm } = window.MGForms;
const H6 = a => a.map(hex);

// kauri (src/regions/aotearoa/index.ts)
const KAURI_CROWN = H6(['#1c3024', '#28452e', '#375c3a', '#4b7648', '#6a9460']);
const KAURI_BARK = H6(['#9a948a', '#716c62', '#4a463e']);
// ponga / silver fern
const PONGA_CROWN = H6(['#1e3422', '#2a4a2c', '#3a6238', '#4e7c48', '#8aa882']);
const PONGA_BARK = H6(['#6e6252', '#4e453a', '#302a24']);

AF.env('nz-kauri', {
  pals: { pine: KAURI_CROWN, round: PONGA_CROWN },
  tree: {
    width: widthForm(1.2, 1.15),
    trunk: trunkForm(KAURI_BARK, PONGA_BARK),
    crown: (c) => {
      if (c.pine) return false; // kauri: the engine's own tiered conifer crown is already right
      frondCrownForm(c, 9, Math.PI * 0.9);
      return true;
    },
  },
});
})();
