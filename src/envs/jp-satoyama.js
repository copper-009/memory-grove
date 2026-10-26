/* Memory Grove — Japan, satoyama woodland.
 *
 * Sugi (Japanese cedar, a conifer) and yamazakura (wild cherry, a broadleaf) — both forms
 * the vendored engine's own default crowns already draw correctly, so there is no custom
 * crown hook here at all, just this biome's own colours, bark and width. Yamazakura's
 * highlight tone is the pale cherry-blossom pink already in its crown palette
 * (`src/regions/japan/index.ts`), not anything added here — it reads through the engine's
 * own default shading exactly as it would on any other broadleaf tree. Akamatsu (red pine)
 * and momiji (maple) are documented there too but not drawn separately yet.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { widthForm, trunkForm } = window.MGForms;
const H6 = a => a.map(hex);

// sugi (src/regions/japan/index.ts)
const SUGI_CROWN = H6(['#16281e', '#1f3c28', '#2b5232', '#3c6a40', '#578556']);
const SUGI_BARK = H6(['#8a5a44', '#633e2e', '#3e271d']);
// yamazakura
const SAKURA_CROWN = H6(['#2e3a28', '#405034', '#556842', '#708654', '#f0c8d4']);
const SAKURA_BARK = H6(['#8a7a6a', '#60544a', '#3a322c']);

AF.env('jp-satoyama', {
  theme: window.MGForms.groundTheme(["#6a7a4e","#4e6038","#7d9056"], ["#9aa8c0","#6e7e86"]),
  pals: { pine: SUGI_CROWN, round: SAKURA_CROWN },
  tree: {
    width: widthForm(0.75, 1.05),
    trunk: trunkForm(SUGI_BARK, SAKURA_BARK),
  },
});
})();
