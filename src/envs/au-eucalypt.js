/* Memory Grove — Australia, eucalypt woodland. A new environment plugging into the
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

/* A real eucalypt crown is open and clumped — branch structure shows through — not one
 * dense dome. 3-4 separate blob clusters, deliberately spaced so gaps show between them,
 * rather than trees.js's own roundCrown, which blends every blob into one smooth union. */
function gumCrown(c) {
  const { tone, W, H, w, top, ch, cx, R, hole, pick } = c;
  const rx = w / 2, ccx = cx + 0.5;
  // Every blob anchors to the same line — where the crown actually meets the trunk — rather
  // than floating at an independent height scattered around the region's geometric centre.
  // That symmetric scatter (each blob's own y picked within +/-dist of centre, in both
  // directions) was the real bug: at dist's own max (0.6) and the extra 0.75 vertical
  // compression, no blob's lower edge ever reached past about 45% of the way down to the
  // trunk, leaving a visible gap between crown and bark on every single tree. Blobs still
  // vary in size and how high they sit (`yLift`) for the sparse, clumped look; they just
  // never leave their own base unconnected to the trunk under them.
  const baseY = top + ch;
  const n = 3 + Math.floor(R() * 2);
  const blobs = [];
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? 0.5 : k / (n - 1);
    const sx = rx * (0.32 + R() * 0.16);
    const sy = ch * (0.55 + R() * 0.25);
    const xOff = (t - 0.5) * rx * 1.5 + (R() - 0.5) * rx * 0.3;
    const yLift = R() * ch * 0.25;
    blobs.push({ x: ccx + xOff, y: baseY - sy * 0.55 - yLift, sx, sy });
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5;
      let best = -9;
      for (const b of blobs) {
        const nx = (px - b.x) / b.sx, ny = (py - b.y) / b.sy;
        if (nx * nx + ny * ny <= 1) best = Math.max(best, -(nx * 0.6 + ny * 0.8));
      }
      if (best === -9) continue;
      if (hole && R() < hole) continue;
      tone[y * W + x] = pick(best + (R() - 0.5) * 0.12);
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
  tree: {
    trunk,
    crown: c => (c.pine ? grassTreeCrown(c) : gumCrown(c)),
  },
});
})();
