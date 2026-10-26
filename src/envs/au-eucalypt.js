/* Memory Garden — Australia, eucalypt woodland. A new environment plugging into the
 * vendored Memory Forest engine's own registry (AF.env, scenery.js), not an edit to
 * anything under src/vendor/ — see DECISIONS.md's Phase 3 entry.
 *
 * The "kind" bit every tree already carries (seed % 100 < 34, trees.js's own pine/round
 * split) is repurposed here rather than replaced: `pine` trees draw as a grass tree (black
 * fire-charred trunk, spiky skirt, flower spear — Xanthorrhoea, one of the five eucalypt-
 * woodland species in src/regions/australia/eucalypt.ts) and `round` trees draw as a gum
 * (river red gum / spotted gum: open, clumped crown — real eucalypt crowns are
 * characteristically gappy, not a dense ball — on a pale trunk). Two real species standing
 * in for the woodland's actual five until a creature/understory pass follows the same
 * pattern; the crown and trunk shapes are what carries almost all of a tree's silhouette at
 * this resolution; see DECISIONS.md for why these two.
 *
 * Colours are the same ones already in src/regions/australia/eucalypt.ts's own river-red-gum
 * and grass-tree species data, not re-invented here — one definition of "what a gum tree
 * looks like" for the project, not two that could drift apart.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { hex } = AF.u;
const { MATURE } = AF.STAGE;
const H6 = a => a.map(hex);

// river-red-gum's crown (src/regions/australia/eucalypt.ts), outline..highlight
const GUM = H6(['#2c3a26', '#415432', '#587040', '#75904f', '#9cb46a']);
// grass-tree's crown (its spiky skirt reads as foliage tone, not bark)
const SKIRT = H6(['#1e2a1a', '#2f4225', '#425a30', '#59753e', '#7a9550']);
// pale, cream-to-salmon bark a river red gum sheds in ribbons — light/mid/dark
const GUM_BARK = H6(['#d8cfc0', '#b3a797', '#8a7c6c']);
// a grass tree's trunk: black, fire-charred — barely needs the three tones, but keeping
// them lets it catch rim light and haze the same way every other trunk does
const CHAR_BARK = H6(['#4a4038', '#312a24', '#1c1814']);

/* Second attempt — the first (several independent blobs, each anchored to its own patch of
 * the trunk line) fixed the crown-trunk gap but read as separate upright columns instead of
 * one tree, reported live. Rebuilt on trees.js's own roundCrown approach instead: one big
 * central blob plus smaller satellite blobs around it, blended into a single silhouette by
 * taking the *max* of every blob's distance field (a true union, not independent shapes) —
 * which is also exactly why the default never had a connection problem: the central blob
 * alone is nearly as large as the whole region, so it reaches the trunk regardless of the
 * satellites. A eucalypt crown's actual character — open, you can see branch structure
 * through it, not a dense ball — comes from `GAP_PUNCH` instead: the same per-pixel random
 * skip (`hole` in the original) every crown already supports for a dying tree, just applied
 * as a constant baseline regardless of health, which is what trees.js itself never has a
 * reason to do. */
const GAP_PUNCH = 0.16;
function gumCrown(c) {
  const { tone, W, H, w, top, ch, cx, R, hole, pick } = c;
  const rx = w / 2, ry = ch / 2, ccx = cx + 0.5, ccy = top + ry - 0.5;
  const n = 3 + Math.floor(R() * 2);
  const blobs = [{ x: ccx, y: ccy, sx: rx * 0.8, sy: ry * 0.8 }];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2 + (R() - 0.5) * 0.7;
    blobs.push({ x: ccx + Math.cos(a) * rx * 0.46, y: ccy + Math.sin(a) * ry * 0.46, sx: rx * 0.48, sy: ry * 0.48 });
  }
  const punch = Math.max(GAP_PUNCH, hole);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5;
      let best = -9;
      for (const b of blobs) {
        const nx = (px - b.x) / b.sx, ny = (py - b.y) / b.sy;
        if (nx * nx + ny * ny <= 1) best = Math.max(best, -(nx * 0.6 + ny * 0.8));
      }
      if (best === -9) continue;
      if (R() < punch) continue;
      tone[y * W + x] = pick(0.55 * best + 0.45 * -((px - ccx) / rx * 0.5 + (py - ccy) / ry * 0.7) + (R() - 0.5) * 0.1);
    }
  }
  return true;
}

/* A black trunk and a spiky skirt radiating from its top, with a flower spear above —
 * Xanthorrhoea's whole silhouette, nothing like a round or pine crown. */
function grassTreeCrown(c) {
  const { tone, W, H, w, top, ch, cx, R, pick } = c;
  const blades = Math.max(6, Math.round(w * 1.1));
  for (let i = 0; i < blades; i++) {
    const bx = cx - w / 2 + (i / blades) * w + (R() - 0.5) * 1.2;
    const lean = (bx - cx) / Math.max(1, w / 2) * 0.35;
    const len = ch * (0.55 + R() * 0.4);
    for (let s = 0; s < len; s++) {
      const t = s / len;
      const x = Math.round(bx + lean * s * 0.3);
      const y = Math.round(top + ch - s);
      if (x < 0 || x >= W || y < 0 || y >= H) continue;
      tone[y * W + x] = pick(t > 0.7 ? 0.6 : t > 0.3 ? 0.1 : -0.35);
    }
  }
  const spearH = Math.round(ch * 0.5);
  for (let y = Math.max(0, top - spearH); y < top; y++) tone[y * W + cx] = pick(0.2);
  return true;
}

/* Colour only — the trunk's own geometry (trunkH/tw/tx0) is already worked out by trees.js
 * itself before this runs; a grass tree's trunk stays genuinely black rather than the
 * shared bark tone every other tree in the scene would otherwise get. */
function trunk(c) {
  const { base, cx, trunkH, tw, tx0, put } = c;
  const cols = c.pine ? CHAR_BARK : GUM_BARK;
  for (let y = base - trunkH; y <= base; y++) {
    for (let x = tx0; x < tx0 + tw; x++) {
      let col = tw > 1 && x === tx0 ? cols[0] : tw > 1 && x === tx0 + tw - 1 ? cols[2] : cols[1];
      if (y <= base - trunkH + 3) col = cols[2];
      put(x, y, col);
    }
  }
  if (c.t.stage >= MATURE) { put(tx0 - 1, base, cols[2]); put(tx0 + tw, base, cols[2]); }
  if (c.ancient) { put(tx0 - 2, base, cols[2]); put(tx0 + tw + 1, base, cols[2]); }
  return true;
}

AF.env('au-eucalypt', {
  pals: { round: GUM, pine: SKIRT, bark: GUM_BARK },
  // ground colours from src/regions/australia/eucalypt.ts's own Biome.ground
  theme: window.MGForms.groundTheme(['#9a8f63', '#7d8a52', '#9bab63'], ["#8fa2c0","#6e8a92"], ["#6b9fd4","#86b4de","#a2c8e6","#bdd7ea","#d4e3ea","#e6efe8"]),
  tree: {
    trunk,
    crown: c => (c.pine ? grassTreeCrown(c) : gumCrown(c)),
  },
});
})();
