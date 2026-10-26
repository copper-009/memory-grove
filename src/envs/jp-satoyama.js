/* Memory Garden — Japan, satoyama woodland.
 *
 * Sugi (Japanese cedar, a conifer) and yamazakura (wild cherry, a broadleaf) — both forms
 * the vendored engine's own default crowns already draw correctly, so there is no custom
 * crown hook here at all, just this biome's own colours, bark and width. Akamatsu (red pine)
 * and momiji (maple) are documented there too but not drawn separately yet.
 *
 * Yamazakura is in blossom only in real-world spring (the same months Japan's own
 * `seasons.months`, `src/regions/japan/index.ts`, calls 'spring': March-May) — the rest of
 * the year it's a plain green broadleaf like any other tree here, not permanently pink.
 * `pals` is a getter rather than a plain object so it's re-evaluated on every tree drawn
 * (`trees.js`'s `sprite()` reads `spec.pals` fresh per call, never caches it), which is what
 * lets this swap live without any vendor file needing to know about seasons at all.
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
// yamazakura: a plain green highlight most of the year, the pale cherry-blossom pink
// (`src/regions/japan/index.ts`'s own crown — that record is the species' identifying
// illustration, always in bloom, which is right for a reference image but not for a scene
// meant to run through the whole year) only while it's actually spring.
const SAKURA_CROWN_NORMAL = H6(['#2e3a28', '#405034', '#556842', '#708654', '#8ea868']);
const SAKURA_CROWN_BLOOM = H6(['#2e3a28', '#405034', '#556842', '#708654', '#f0c8d4']);
const SAKURA_BARK = H6(['#8a7a6a', '#60544a', '#3a322c']);

function isSpringInJapan() {
  const m = new Date().getMonth(); // 0-11
  return m >= 2 && m <= 4; // Mar, Apr, May — matches japan.seasons.months
}

AF.env('jp-satoyama', {
  theme: window.MGForms.groundTheme(["#6a7a4e","#4e6038","#7d9056"], ["#9aa8c0","#6e7e86"], ["#6f9ccb","#8db0d8","#abc5e2","#c6d8e8","#dce6ea","#eef2ec"]),
  get pals() { return { pine: SUGI_CROWN, round: isSpringInJapan() ? SAKURA_CROWN_BLOOM : SAKURA_CROWN_NORMAL }; },
  tree: {
    width: widthForm(0.75, 1.05),
    trunk: trunkForm(SUGI_BARK, SAKURA_BARK),
  },
});
})();
