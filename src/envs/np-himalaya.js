/* Memory Grove — Nepal, high Himalaya (this region's second biome).
 *
 * Juniper (a conifer, default-shaped) and rhododendron, two of the biome's three species
 * (`src/regions/nepal/index.ts`) — both default-shaped, no custom crown hook, same as
 * `jp-hokkaido.js` and for the same reason. Rhododendron's red-flower highlight tone is its
 * own. Himalayan birch (also broadleaf) is documented there too but not drawn separately
 * yet.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm } = window.MGForms;
const H6 = a => a.map(hex);

// juniper-np
const JUNIPER_CROWN = H6(['#1a2a1e', '#263c2a', '#324e36', '#436848', '#5c8460']);
const JUNIPER_BARK = H6(['#6a5c48', '#473c30', '#2c251c']);
// rhododendron
const RHODO_CROWN = H6(['#1e301e', '#2c462a', '#3c5e38', '#527a4a', '#c0302a']);
const RHODO_BARK = H6(['#7a6a58', '#564a3c', '#342c24']);

AF.env('np-himalaya', {
  pals: { pine: JUNIPER_CROWN, round: RHODO_CROWN },
  tree: {
    width: widthForm(0.6, 0.95),
    trunk: trunkForm(JUNIPER_BARK, RHODO_BARK),
  },
});
})();
