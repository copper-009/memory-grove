/* Memory Garden — species names in tree tooltips.
 *
 * tooltips.js has no species/name field and no AF.ENVS hook to plug into (checked directly:
 * no `species` or `AF.ENVS` reference anywhere in that 61-line file) — unlike trees.js's own
 * tree.* hooks, there is nothing here to register against. Rather than edit the vendored
 * file, this wraps the plain `AF.tips.tree` function tooltips.js itself assigns last
 * (`AF.tips = {...}`), the same "reach into AF's own mutable state" spirit as `AF.env()`,
 * just without a registry already built for it.
 *
 * Loaded once, always, regardless of biome (mfLoader.ts's `loadMfCore`) — species names come
 * from Memory Garden's own data (`mfAdapter.ts`'s `toMfTree`, resolved from the current
 * biome's `plants` list), not from an environment's tree-shape hooks.
 */
(function () {
  'use strict';
  const AF = window.AnkiForest;
  const { esc } = AF.u;
  const original = AF.tips.tree;
  AF.tips.tree = function (t, words, click) {
    const html = original(t, words, click);
    if (!t.speciesName) return html;
    return `<b>${esc(t.speciesName)}</b><br>${html}`;
  };
})();
