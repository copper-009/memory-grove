/* Memory Grove — shared tree-shape functions, reused by every region's own env file
 * (src/envs/*.js, not just au-eucalypt.js). Loaded once, always, before any env script
 * (mfLoader.ts's loadMfCore) since every env references window.MGForms at registration time.
 *
 * These are ports of the forms the now-deleted procedural renderer drew for each
 * `PlantForm` (src/forest/plantSprite.ts, removed when the vendored engine replaced it —
 * see DECISIONS.md's "Old renderer removed" entry) — same shape math, rewritten against
 * trees.js's own hook contract (c.tone/c.pick/c.R, the engine's seeded per-sprite RNG)
 * instead of that file's own ToneMap/rng helpers. `roundCrownForm`/`crownShadeForm` are
 * also reimplementations of trees.js's own *default* `roundCrown`/`crownShade` — private
 * closures inside that file's IIFE, not reachable from here — needed whenever a region env
 * wants that same look with different parameters (fewer blobs for a shrub, a half-height
 * crown for a columnar plant) rather than the environment's own invention.
 *
 * `palm` (`palmBody`, below) needed a trunk taller than the engine's own fixed
 * PINE_TRUNK/BROAD_TRUNK share of height allows for — a palm's trunk is most of its height
 * — which only `tree.body()` (a full custom-painter override of both trunk and crown
 * together, since `trunkH` is fixed by `pine` alone everywhere else in `trees.js` and isn't
 * overridable from inside a normal `trunk()`/`crown()` hook) can give it. `bulbous` (a
 * baobab's swollen trunk, which needs to eat into where the crown would otherwise start)
 * still isn't here — a `body()` hook of its own, not yet attempted, since a varying
 * trunk *width* per row is a different problem from `palmBody`'s fixed-width, just-taller
 * trunk.
 */
(function () {
'use strict';
const AF = window.AnkiForest;
const { MATURE, OLD } = AF.STAGE;

const PINE_W = [0.46, 0.54, 0.62], BROAD_W = [0.66, 0.8, 0.94], ANCIENT_W = [0.9, 0.98, 1.04];
const ANCIENT_PINE_W = 1.1;
// trees.js's own private constant (not reachable from here, so duplicated — `sprite()`
// gives any tree this tall a two-pixel trunk even before it's old).
const THICK_TRUNK_H = 16;

/** `tree.width()` hook: the engine's own default width formula (verbatim, from trees.js's
 * `sprite()`), scaled by a species' own `spread` (`PlantSpecies.spread` — the old renderer's
 * `buildToneMap` was the only other reader of it, and it's gone; the vendored engine's own
 * default width formula never read it at all). One multiplier per kind-slot, since the two
 * species sharing a tree env are rarely the same spread. */
function widthForm(pineSpread, roundSpread) {
  return ({ t, h, pine, ancient }) => {
    const base = pine ? PINE_W[t.size] * (ancient ? ANCIENT_PINE_W : 1) : (ancient ? ANCIENT_W : BROAD_W)[t.size];
    const spread = (pine ? pineSpread : roundSpread) ?? 1;
    let w = Math.max(3, Math.round(h * base * spread));
    if (w % 2 === 0) w++;
    return w;
  };
}

/** The engine's own default trunk paint (verbatim, from `trees.js`'s `sprite()`), as a
 * standalone function rather than only reachable through a `trunk()` hook — `palmBody`
 * needs the exact same painting with a self-computed `trunkH`/`tw`/`tx0` instead of the
 * engine's own, since a fixed-share trunk height is precisely what a palm can't use. */
function paintTrunk(c, bark, trunkH, tw, tx0) {
  const { base, put, ancient } = c;
  for (let y = base - trunkH; y <= base; y++) {
    for (let x = tx0; x < tx0 + tw; x++) {
      let col = tw > 1 && x === tx0 ? bark[0] : tw > 1 && x === tx0 + tw - 1 ? bark[2] : bark[1];
      if (y <= base - trunkH + 3) col = bark[2];
      else if (tw === 1 && y & 1) col = bark[0];
      put(x, y, col);
    }
  }
  if (c.t.stage >= MATURE && !ancient) { put(tx0 - 1, base, bark[2]); put(tx0 + tw, base, bark[2]); }
  if (ancient) { put(tx0 - 1, base, bark[2]); put(tx0 + tw, base, bark[2]); put(tx0 - 2, base, bark[2]); put(tx0 + tw + 1, base, bark[2]); }
}

/** `tree.trunk()` hook: `paintTrunk` with the engine's own precomputed geometry, just
 * reading one of two bark triples by kind instead of the one shared `pals.bark` the
 * default renderer is limited to — the reason every region env needs this instead of
 * leaving `trunk` unset. */
function trunkForm(pineBark, roundBark) {
  return (c) => {
    paintTrunk(c, c.pine ? pineBark : roundBark, c.trunkH, c.tw, c.tx0);
    return true;
  };
}

/** A rounded crown as a cluster of overlapping ellipses — trees.js's own default
 * `roundCrown`, parameterised: `blobsN` (fewer for a tight shrub), `holeExtra` (more open
 * than the dying-tree hole the engine already applies), `chFrac` (less than the full crown
 * region's height, for a squat or columnar shape). */
function roundCrownForm(c, blobsN, holeExtra, chFrac) {
  const { tone, W, H, w, top, ch: fullCh, cx, R, hole, pick } = c;
  const ch = chFrac ? fullCh * chFrac : fullCh;
  // A shorter-than-full crown (chFrac < 1) bottom-aligns to the trunk connection
  // (top+fullCh), not top-aligns to `top` — top-aligning left a gap the full height of the
  // unused fraction between the crown's own bottom and the trunk, caught live (a columnar
  // plant's crown floated well above its trunk with nothing connecting them), the same class
  // of bug as `au-eucalypt.js`'s own first gum-crown gap.
  const regionTop = top + fullCh - ch;
  const rx = w / 2, ry = ch / 2, ccx = cx + 0.5, ccy = regionTop + ry - 0.5;
  const blobs = [{ x: ccx, y: ccy, sx: rx * 0.86, sy: ry * 0.86 }];
  for (let k = 0; k < blobsN; k++) {
    const a = -Math.PI / 2 + (k / blobsN) * Math.PI * 2 + R() * 0.6;
    blobs.push({ x: ccx + Math.cos(a) * rx * 0.5, y: ccy + Math.sin(a) * ry * 0.5, sx: rx * 0.52, sy: ry * 0.52 });
  }
  const h2 = Math.max(hole, holeExtra || 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5;
      let best = -9;
      for (const b of blobs) {
        const nx = (px - b.x) / b.sx, ny = (py - b.y) / b.sy;
        if (nx * nx + ny * ny <= 1) best = Math.max(best, -(nx * 0.6 + ny * 0.8));
      }
      if (best === -9) continue;
      if (h2 && R() < h2) continue;
      tone[y * W + x] = pick(0.55 * best + 0.45 * -((px - ccx) / rx * 0.5 + (py - ccy) / ry * 0.7) + (R() - 0.5) * 0.3);
    }
  }
}

/** A broadleaf crown's self-shadow where it hangs over the trunk — trees.js's own default
 * `crownShade`, reimplemented for the same "it's a private closure" reason as above. */
function crownShadeForm(c) {
  const { tone, W, H, w, cx } = c;
  for (let x = 0; x < W; x++) {
    if (Math.abs(x - cx) >= w * 0.34) continue;
    let low = -1;
    for (let y = 0; y < H; y++) if (tone[y * W + x] >= 0) low = y;
    if (low < 2) continue;
    if (tone[(low - 1) * W + x] >= 0) tone[(low - 1) * W + x] = 1;
    if (tone[(low - 2) * W + x] >= 0) tone[(low - 2) * W + x] = Math.min(tone[(low - 2) * W + x], 2);
  }
}

/** A fan of fronds radiating from a point: a tree fern (and, once `tree.body()` lets a palm
 * have a trunk tall enough to look right, a palm too). `fronds`/`arcSpan` match the old
 * renderer's own fern params unless a region env asks for something else. */
function frondCrownForm(c, fronds, arcSpan) {
  const { tone, W, H, top, cx, ch, R } = c;
  // Anchored at the trunk connection (top+ch), fanning *up* toward `top` — not at `top`
  // itself fanning further up and off-canvas, which is what the old renderer's own
  // plantSprite.ts literally did too (its `paint.ts` must have compensated for this
  // somehow; both files are gone, so there's nothing to port that assumption from). Caught
  // live: a fern/tree-fern env rendered as a bare stick, every frond pixel landing above
  // row 0 and silently clipped by this function's own bounds check.
  const originX = cx + 0.5, originY = top + ch;
  for (let f = 0; f < fronds; f++) {
    const a = -Math.PI / 2 + (f / (fronds - 1) - 0.5) * arcSpan + (R() - 0.5) * 0.1;
    const len = ch * (0.75 + R() * 0.3);
    const steps = Math.ceil(len);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const curve = Math.sin(t * Math.PI * 0.5) * 0.15 * (f < fronds / 2 ? -1 : 1);
      const x = Math.round(originX + Math.cos(a) * len * t + curve * ch);
      const y = Math.round(originY + Math.sin(a) * len * t);
      const tn = t < 0.3 ? 2 : t < 0.7 ? 3 : 4;
      if (x >= 0 && y >= 0 && x < W && y < H) tone[y * W + x] = tn;
      if (Math.abs(Math.cos(a)) > 0.3) {
        const x2 = x + (f % 2 ? 1 : -1);
        if (x2 >= 0 && y >= 0 && x2 < W && y < H) tone[y * W + x2] = Math.max(1, tn - 1);
      }
    }
  }
}

/** `tree.body()` hook: a palm — a trunk that's most of the tree's height (the deleted old
 * renderer's own `SHARE_OF_HEIGHT.palm = 0.75`, `plantSprite.ts`, used here purely as a
 * design reference the same way every other form in this file is, not reused as code) with
 * a small fan of fronds at the very top, not the trunk-then-crown split the normal
 * pine/broadleaf geometry would give it. `body()` is the only hook that can give a tree a
 * non-default trunk-to-crown height ratio: `trunkH` is a fixed share of `h` by `pine` alone
 * everywhere else in `trees.js`, computed before `trunk()`/`crown()` run and not
 * overridable from within them — `trees.js`'s own `sprite()` reads `if (shape) {...} else
 * {...default trunk+crown, where trunk()/crown() hooks get consulted...}`, so `body()`
 * fully replaces that path rather than adding to it, and has to paint both itself. The
 * crown portion still only sets `c.tone` (via `frondCrownForm`, not `c.put`) so the shared
 * palette-resolution pass after every hook runs still applies to it correctly — exactly
 * like a normal `crown()` hook, the only genuinely new part here is computing this tree's
 * own `trunkH`/`tw`/`tx0`/`top`/`ch` by hand instead of reading the engine's. */
function palmBody(bark, fronds, arcSpan) {
  return (c) => {
    const { t, h, ancient, cx } = c;
    const trunkH = Math.max(3, Math.round(h * 0.75));
    const tw = ancient ? 3 : t.stage >= OLD || h >= THICK_TRUNK_H ? 2 : 1;
    const tx0 = cx - Math.floor(tw / 2);
    paintTrunk(c, bark, trunkH, tw, tx0);
    const top = 1, ch = Math.max(2, h - trunkH + 2);
    Object.assign(c, { trunkH, tw, tx0, top, ch });
    frondCrownForm(c, fronds, arcSpan);
    return { top, ch };
  };
}

/** `tree.body()` hook: a baobab — a trunk that swells near the ground and tapers as it
 * rises, carrying a small, sparse crown at the top, rather than any width `trees.js`'s own
 * trunk-painting (a flat `tw` the whole way up) can give it. A genuinely different problem
 * from `palmBody`'s: that one changes *how much* of the height is trunk; this one changes
 * the trunk's own *width* row by row. The old renderer's own `bulbousTrunk`
 * (`plantSprite.ts`, retrieved from git history as a reference only, same as every other
 * form here) was consulted for the general idea — swell near one end, taper toward the
 * other — but not copied formula-for-formula, since re-deriving it directly against this
 * engine's own ground-relative coordinates (`base` down to `base - trunkH`, not that
 * file's own `top`-relative ones) was more reliable than translating between the two by
 * hand without a way to check the translation. Verified against a real render, same as
 * `palmBody` was, not just read as code. */
function bulbousBody(bark, crownBlobs, crownHoleExtra) {
  return (c) => {
    const { t, h, ancient, cx, base, put, pick, tone, W, H } = c;
    const trunkH = Math.max(5, Math.round(h * 0.6));
    const baseW = ancient ? 3 : t.stage >= OLD || h >= THICK_TRUNK_H ? 2 : 1;
    const bulgeW = baseW + Math.max(2, Math.round(baseW * 2.2));
    const bulgeH = Math.round(trunkH * 0.75); // how far up from the ground the swell reaches
    for (let y = base - trunkH; y <= base; y++) {
      const fromGround = base - y; // 0 at the ground, trunkH at the top of the trunk region
      const intoBulge = fromGround < bulgeH ? 1 - fromGround / bulgeH : 0;
      const halfW = (baseW / 2) + (bulgeW / 2 - baseW / 2) * intoBulge;
      const x0 = Math.round(cx - halfW), x1 = Math.round(cx + halfW);
      for (let x = x0; x <= x1; x++) {
        let col = x === x0 ? bark[0] : x === x1 ? bark[2] : bark[1];
        if (fromGround < 3) col = bark[2]; // a dark skirt where the roots flare into the ground
        put(x, y, col);
      }
    }
    const tw = baseW, tx0 = cx - Math.floor(tw / 2);
    const top = 1, ch = Math.max(2, h - trunkH + 2);
    Object.assign(c, { trunkH, tw, tx0, top, ch });
    roundCrownForm(c, crownBlobs, crownHoleExtra, 0.55);
    return { top, ch };
  };
}

/** A low spiky dome: a grass tree's skirt, a tussock, elephant grass. */
function hummockCrownForm(c, bladesScale) {
  const { tone, W, H, w, top, ch, cx, R } = c;
  const blades = Math.max(5, Math.round(w * (bladesScale || 0.9)));
  for (let i = 0; i < blades; i++) {
    const bx = cx - w / 2 + (i / blades) * w + R() * 1.2;
    const lean = (bx - cx) / (w / 2) * 0.3;
    const len = ch * (0.6 + R() * 0.4);
    for (let s = 0; s < len; s++) {
      const t = s / len;
      const x = Math.round(bx + lean * s);
      const y = Math.round(top + ch - s);
      if (x >= 0 && y >= 0 && x < W && y < H) tone[y * W + x] = t > 0.7 ? 4 : t > 0.3 ? 3 : 2;
    }
  }
}

/** `tree.theme(th, mood, night)` hook (`theme.js`'s `AF.theme`, called before weather):
 * the ground plane's own colours, from `Biome.ground` (`[far, near, grass]` —
 * `src/regions/types.ts`'s own doc comment, written for the old renderer and never read
 * since the engine switch until now) mapped onto `g0`/`g1`/`grass` in that same order.
 *
 * `hills`, optional, is `[far, near]` for the hill silhouette (`th.far`/`th.near`) — *not*
 * from `Biome` (it has no hill-colour data of its own) but from the region's own matching
 * `Backdrop.far`/`.near` (`mfLandscape.ts`'s pairing logic documents which backdrop was
 * picked for which biome, and why). Kept as a second, optional array rather than folded
 * into `ground` because the two come from genuinely different source data, picked by
 * different logic, even though they land on the same hook. The sky gradient itself
 * (`th.sky`) is deliberately left alone — a `Backdrop`'s six stops weren't authored
 * against this engine's specific "always golden hour" lighting, and swapping the whole sky
 * risks clashing with it in a way a quick render can't rule out as easily as a hill colour
 * can; a smaller, more deliberate piece than this round attempts. */
function groundTheme(ground, hills) {
  const [g0, g1, grass] = ground;
  return (th) => {
    th.g0 = g0; th.g1 = g1; th.grass = grass;
    if (hills) { th.far = hills[0]; th.near = hills[1]; }
  };
}

window.MGForms = { widthForm, trunkForm, roundCrownForm, crownShadeForm, frondCrownForm, hummockCrownForm, groundTheme, palmBody, bulbousBody };
})();
