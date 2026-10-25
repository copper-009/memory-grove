/**
 * The scene composer: one function that draws a whole grove to a canvas.
 *
 * **Everything is drawn onto a genuinely low-resolution offscreen buffer, then blitted up
 * to the real canvas with `imageSmoothingEnabled = false`.** This is the actual technique
 * `reference/NOTES.md` describes ("one low-resolution canvas, scaled up") and it is what a
 * first version of this file got wrong: it drew gradients and shapes straight onto the
 * full device-resolution canvas, so only individual sprite pixels ended up blocky — the
 * sky, sun and ground rendered as smooth CSS-style gradients instead of pixel art, because
 * `CanvasGradient` and `ellipse()` anti-alias regardless of how carefully a *sprite* is
 * scaled. Rendering the whole scene at ~180 engine pixels wide and scaling that buffer up
 * forces every element — sky, ground, water, sun, trees, creatures alike — through the
 * same blocky upscale, which is what actually produces the pixel-art look.
 *
 * Every pure module upstream (`layout`, `theme`, `plantSprite`, `creatureSprite`,
 * `creatureMotion`, `ecosystemVisual`, `paint`) is still what's called here; this file
 * stays thin and procedural. Verified visually via the screenshot harness
 * (`tools/screenshots.mjs`), not by pixel-diffing in Vitest.
 */

import type { Grove } from '../data/types';
import { layoutGrove, placeItem, isPond, GROUND_BOTTOM, FAR_SCALE, NEAR_GAIN, ROWS_TOP } from './layout';
import type { Layout, LayoutItem } from './layout';
import { buildTheme, pickBackdrop } from './theme';
import type { Theme, MoodInput, BackdropInput } from './theme';
import { buildToneMap } from './plantSprite';
import { buildCreatureFrames } from './creatureSprite';
import { groundMotion, hopHeight, flightPosition, flapFrame } from './creatureMotion';
import { visualParamsFor, applyGroundHealth } from './ecosystemVisual';
import { paintPlant, paintCreature } from './paint';
import { boxAt } from './hitTest';
import type { HitBox } from './hitTest';
import type { Biome, Creature } from '../regions/types';
import type { CreatureRoster, CreatureMood } from '../data/milestones';
import { creatureMood, creatureAge, lifeStageFor, hasCabin } from '../data/milestones';
import { hashStr, rng } from './rng';
import { hex, mix, mixHex, luminance, rgba, clamp, vivifyHex, shadePair, toHex, BAYER4 } from './color';
import type { RGB } from './color';

export interface SceneInput {
  grove: Grove;
  biome: Biome;
  roster: CreatureRoster;
  activeStudyDays: number;
  mood: MoodInput;
  /** visual (post-severity) ecosystem health, 0..100. */
  visualHealth: number;
  /** Seconds since the scene opened — drives all animation. */
  t: number;
  /** false freezes every sprite on its idle frame (reduced motion / off). */
  animate: boolean;
  paused: boolean;
  /** Device pixel ratio, for crisp integer scaling. */
  dpr: number;
  regionKey: string;
  /** The region's backdrops, for `theme.ts`'s `pickBackdrop` — this is what makes one
   * region's sky, hills and distant colour actually differ from another's. */
  backdrops?: readonly BackdropInput[];
  /** This region's current real season (`'spring'`, `'wet'`, ...) — one of the names in
   * its own `seasons.months`, from `currentSeasonFor`. Picks a season-tagged backdrop
   * when one exists, replacing the old standalone "environment" preset picker with
   * scenery that actually follows the calendar and the place. */
  season?: string;
}

export interface DrawResult {
  boxes: HitBox[];
}

/**
 * Width of the internal drawing buffer, in engine pixels. Everything — sky, ground, every
 * sprite — is drawn at this resolution, then the whole buffer is scaled up to the real
 * canvas in one `drawImage` call with smoothing off. This is the number that controls how
 * "chunky" the pixel art reads: lower is blockier, higher is finer-grained but still
 * crisp (never smooth/anti-aliased, since the blit always uses nearest-neighbour).
 *
 * Raised from an initial 220 after it read as too coarse at typical widget widths —
 * 300 keeps the same pixel-art character at a noticeably finer grain. A plant's own size
 * in engine pixels (`STAGE_HEIGHT` et al.) didn't need to change alongside this: distance
 * from camera is what should decide how big something looks, not the buffer resolution.
 *
 * Raised again, 300 -> 420, after direct comparison against the reference screenshots:
 * individual crown blobs, bark pixels and ground dither were all visibly coarser here at
 * the same on-screen size. The dither patterns (sky, ground, hills) and sprite shape logic
 * are all written in relative/fractional terms already, so this is a straight quality gain
 * with no other code changes needed.
 */
const ENGINE_WIDTH = 420;
/**
 * `STAGE_HEIGHT`, creature `BodyPlan.size`, the cabin's wall/roof dimensions and the deep
 * forest's crown/lobe sizes are all tuned as *absolute engine-pixel counts*. An earlier
 * attempt at this scaled that against `ENGINE_WIDTH` alone and still looked too small live
 * — because the live widget's *height* is fixed (`pane_widget` asks for 480) while its
 * *width* tracks whatever the container happens to be, so the real aspect ratio (often
 * under 2:1) is nothing like the 3:1 this file's own screenshot harness tests at. Engine
 * height ends up taller than the harness ever exercised, which silently shrank every
 * sprite as a share of frame — the harness itself was the wrong ruler the whole time this
 * was being "verified."
 *
 * Scaling against `engineH` (vertical frame space, where a tree's height actually has to
 * read) rather than `engineW` fixes that at the root: it no longer matters whether the
 * frame is wide and short or narrow and tall. The reference height (120) and the extra
 * 1.35x deliberately bias toward sprites reading as too large rather than too small again,
 * given this is the third round of "still too small" feedback — easier to dial back a
 * confirmed-too-big result than to keep guessing at a too-small one.
 */
function pixelScaleFor(engineH: number): number {
  return (engineH / 120) * 1.7;
}

const RABBIT_LIKE_HOP = 0.08;

/**
 * Share of engine height where solid ground ends and the water-reflection band begins.
 * `layout.GROUND_BOTTOM` (0.965) still marks the very bottom of the whole frame — this is
 * a nearer line, leaving the gap between the two for the reflection.
 */
const LAND_BOTTOM = 0.78;


/** Sky: six-stop gradient approximated as dithered horizontal bands, plus a hard-edged
 * sun/moon disc with a soft halo glow around it (the original always draws a crisp disc
 * first, then a separate glow — a glow alone, with no disc, is what reads as "just blurry"). */
/**
 * The sky: a true per-pixel ordered (Bayer) dither between adjacent gradient stops, the
 * same technique Memory Forest's own `web/engines/pixel/sky.js` uses — a continuous
 * gradient position computed per row, and every *pixel* in that row independently decides
 * which of the two nearest stops to show, by comparing against `BAYER4[(y%4)*4+x%4]`.
 *
 * An earlier version of this file got this wrong in a way worth recording: it divided the
 * sky into a handful of discrete row-bands and dithered each one only by `y % 4` — the
 * same decision for every pixel across a whole row — which produced flat horizontal
 * stripes instead of the stippled gradient texture a 2D dither actually gives. Dithering
 * by `x % 4` *and* `y % 4` per pixel is what turns a sharp two-colour edge into something
 * that reads as a smooth gradient once the whole scene is blitted up.
 */
/**
 * A cast shadow at a sprite's feet — a flat dark ellipse, squashed and nudged toward the
 * side away from the sun/moon, fading out with distance haze. `theme.ts` has computed
 * `Theme.shadow` (a strength/length factor that goes to 0 for an overcast or night sky)
 * since the very first pass at this renderer, but nothing ever read it: trees, the cabin
 * and every creature were painted with nothing anchoring them to the ground at all, which
 * is a large part of why they read as pasted onto the background rather than standing in
 * it. One function, called at the foot of every sprite, fixes all three at once.
 */
function drawShadow(g: CanvasRenderingContext2D, cx: number, groundY: number, w: number, th: Theme, haze: number): void {
  if (!th.shadow) return;
  const alpha = 0.32 * (1 - haze * 0.6);
  if (alpha <= 0.02) return;
  const sunSide = th.orb ? th.orb.x - 0.5 : 0;
  const lenW = Math.max(2, w * (0.55 + th.shadow * 0.35));
  const offset = -sunSide * w * 0.5;
  g.fillStyle = `rgba(14,18,14,${alpha.toFixed(3)})`;
  g.beginPath();
  g.ellipse(cx + offset, groundY, lenW / 2, Math.max(1, lenW * 0.14), 0, 0, Math.PI * 2);
  g.fill();
}

/**
 * A small pixel-art cloud: a cluster of 3-4 overlapping round puffs rather than a single
 * flat rectangle. Drawn with circles so the silhouette comes out rounded and bumpy even
 * at this engine's small resolution — a plain `fillRect` always reads as a block no matter
 * how it's scaled, which was exactly the complaint.
 */
function drawCloud(g: CanvasRenderingContext2D, cx: number, cy: number, w: number, color: string, alpha: number, seed: number): void {
  const r = rng(seed);
  const baseR = w * 0.2;
  g.globalAlpha = alpha;
  g.fillStyle = color;
  const puffs = 4 + Math.floor(r() * 2);
  for (let i = 0; i < puffs; i++) {
    const t = puffs === 1 ? 0.5 : i / (puffs - 1);
    const px = cx + (t - 0.5) * w * 0.8;
    // Puffs are taller in the middle, lower toward the ends, with a little jitter — the
    // "several bumps on a flat base" silhouette every pixel-art cloud uses.
    const edge = Math.sin(t * Math.PI);
    const py = cy + baseR * 0.4 * (1 - edge) + (r() - 0.5) * baseR * 0.3;
    const pr = baseR * (0.55 + edge * 0.55) * (0.85 + r() * 0.3);
    g.beginPath();
    g.ellipse(px, py, pr, pr * 0.78, 0, 0, Math.PI * 2);
    g.fill();
  }
  // A flat base strip ties the puffs together into one cloud rather than a row of separate
  // blobs.
  g.fillRect(Math.round(cx - w * 0.42), Math.round(cy + baseR * 0.25), Math.round(w * 0.84), Math.max(1, Math.round(baseR * 0.5)));
  g.globalAlpha = 1;
}

function drawSky(g: CanvasRenderingContext2D, W: number, horizonY: number, th: Theme, t: number): void {
  const stops = th.sky;
  const H = Math.ceil(horizonY);
  const img = g.createImageData(W, H);
  const d = img.data;
  const stopRGB = stops.map(hex);
  for (let y = 0; y < H; y++) {
    const p = Math.min(1, y / Math.max(1, H - 1)) * (stopRGB.length - 1);
    const i0 = Math.min(stopRGB.length - 2, Math.floor(p));
    const f = p - i0;
    const a = stopRGB[i0];
    const b = stopRGB[i0 + 1];
    for (let x = 0; x < W; x++) {
      const threshold = (BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      const c = f > threshold ? b : a;
      const idx = (y * W + x) * 4;
      d[idx] = c[0];
      d[idx + 1] = c[1];
      d[idx + 2] = c[2];
      d[idx + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  if (th.clouds) {
    const seedBase = Math.floor(t / 40);
    for (let i = 0; i < th.clouds.n; i++) {
      const cx = ((hashStr(`cloud${i}${seedBase}`) % 1000) / 1000) * W;
      const cy = horizonY * (0.1 + ((hashStr(`cloudy${i}`) % 1000) / 1000) * 0.3);
      // Bigger and fluffier against the reference: these read as small flat smudges before,
      // nothing like the big voluminous puffs there.
      const cw = W * (0.13 + ((hashStr(`cloudw${i}`) % 1000) / 1000) * 0.1);
      drawCloud(g, cx, cy, cw, th.clouds.top, th.clouds.alpha / 255, hashStr(`cloudshape${i}`));
    }
  }

  if (th.stars > 0) {
    const n = Math.min(th.stars, 70);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < n; i++) {
      const sx = Math.floor(((hashStr(`star${i}`) % 1000) / 1000) * W);
      const sy = Math.floor(((hashStr(`stary${i}`) % 1000) / 1000) * horizonY * 0.9);
      g.fillRect(sx, sy, 1, 1);
    }
  }

  if (th.orb) {
    const ox = Math.round(W * th.orb.x);
    const oy = Math.round(horizonY * th.orb.y);
    const r = Math.max(3, Math.round(th.orb.r * (W / 420) * 2.2));
    // A low, strong-haloed sun (dawn/dusk, th.orb.halo is high in those presets) casts a
    // few soft rays — straight, uneven-length wedges radiating outward, each a sliver of
    // the orb's own colour fading to nothing. Purely additive atmosphere, not a feature
    // this file is porting from anywhere; skipped for a dim/low-halo orb so a plain midday
    // sun or a quiet moon stays plain.
    if (th.orb.halo > 0.5) {
      const rayCount = 8;
      const rayLen = r * (2.2 + th.orb.halo * 1.6);
      const rSeed = rng(Math.floor(ox * 7 + oy * 13));
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2 + rSeed() * 0.3;
        const len = rayLen * (0.55 + rSeed() * 0.45);
        const width = r * 0.22;
        const tx = ox + Math.cos(a) * len;
        const ty = oy + Math.sin(a) * len;
        const px = Math.cos(a + Math.PI / 2) * width;
        const py = Math.sin(a + Math.PI / 2) * width;
        const ray = g.createLinearGradient(ox, oy, tx, ty);
        ray.addColorStop(0, rgba(hex(th.orb.color), 0.22));
        ray.addColorStop(1, rgba(hex(th.orb.color), 0));
        g.fillStyle = ray;
        g.beginPath();
        g.moveTo(ox + px, oy + py);
        g.lineTo(ox - px, oy - py);
        g.lineTo(tx, ty);
        g.closePath();
        g.fill();
      }
      g.restore();
    }
    // halo first (behind), soft
    const glow = g.createRadialGradient(ox, oy, 0, ox, oy, r * (1 + th.orb.halo * 0.35));
    glow.addColorStop(0, th.orb.color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(ox, oy, r * (1 + th.orb.halo * 0.35), 0, Math.PI * 2);
    g.fill();
    // the disc itself: hard-edged, pixel-circle, so there is an actual bright core
    g.fillStyle = th.orb.color;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) g.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
}

/**
 * A soft, bumpy ridge silhouette along the horizon — the pale blue/purple hills Memory
 * Forest always has behind the treeline. A simple two-frequency sine heightmap, drawn
 * column by column, reads as a believable ridge once blitted through the blocky upscale;
 * no noise library or asset needed. Stable per call (no seed input) since it's a static
 * backdrop, not something that should shift between frames.
 */
/**
 * A horizon silhouette for the given `hillForm` (a region's `Backdrop.form`). Every form is
 * a column-by-column heightmap — the same technique, different curve — so it stays cheap
 * and reads as pixel art once blitted, but the shapes are different enough that Australia's
 * rolling hills, Japan's volcanic cone, Norway's fjord wall and Nepal's jagged peaks don't
 * all collapse into the same generic bump.
 */
function drawHills(g: CanvasRenderingContext2D, W: number, horizonY: number, farColor: string, form: string): void {
  // Nearly flat, matching the exact reference the user sent: that hill band is nowhere
  // near as textured as the ground below it, essentially one solid silhouette colour. A
  // narrow two-tone spread (not a single flat fill) still gives the escarpment's cliff
  // face *some* shading — a plain fill there read as "a weird box" with no light/shadow
  // distinction at all — but it's subtle enough now not to compete with the ground.
  //
  // This used to shade by blending `farColor` toward the ground's own light tone — harmless
  // back when the hill colour was itself ground-derived, but `farColor` is now deliberately
  // a *different*, cooler atmospheric hue from the ground (real distant hills read that way,
  // which is exactly what the reference shows: dusty mauve hills over green grass). Blending
  // toward a green ground tone pulled that purple straight back toward green, quietly
  // erasing the whole point of giving hills their own colour. Shading from `farColor` itself
  // instead — same hue, only lighter/darker — keeps the two-tone cliff texture without
  // contaminating the hue a ground blend would.
  const [light, dark] = shadePair(hex(farColor), 0.16);
  const base = horizonY + horizonY * 0.1;
  // Raised substantially from 0.14: a landform's whole point is to show through above the
  // deep forest's own canopy line (drawn on top of this, right after) so a region's
  // mountain, fjord wall or monolith actually reads as rising over the treeline rather
  // than matching its height almost exactly and disappearing underneath it — which was
  // happening for every landform before this change, "peaks" included.
  const amp = horizonY * 0.34;

  const heightAt = (p: number): number => {
    switch (form) {
      case 'volcano': {
        // one dominant symmetric cone, slightly off-centre
        const d = Math.abs(p - 0.42) * 2.6;
        return Math.max(0, 1 - d) ** 1.6;
      }
      case 'monolith': {
        // A single large, smoothly rounded dome standing clear of an otherwise flat
        // plain — an Uluru-type weathered inselberg, not a sharp volcanic cone (concave
        // curve, >1 power) and not a flat-topped mesa: a wide, low, convex bulge (power
        // < 1) is what actually reads as "one huge rounded rock," with the plain on
        // either side almost perfectly flat so the monolith has nothing to compete with.
        const d = Math.abs(p - 0.38) * 1.9;
        return d < 1 ? Math.max(0, 1 - d) ** 0.55 * 0.8 : 0.03;
      }
      case 'towers':
      case 'tsingy': {
        // A whole field of repeating spires/pinnacles — right for what these specifically
        // model (a tsingy limestone forest genuinely is a repeating field of pinnacles),
        // but not what 'peaks' needed to be.
        const n = form === 'tsingy' ? 9 : 6;
        const saw = Math.abs(((p * n) % 1) - 0.5) * 2;
        return 0.5 + 0.5 * saw * (0.6 + 0.4 * Math.sin(p * Math.PI * 2.7 + 0.7));
      }
      case 'peaks': {
        // A repeating jagged ridge after all — most of what this form models (the
        // Himalaya, the Andes, the Southern Alps, the Rocky Mountains, the Kinabalu
        // massif) are genuinely long ranges, not one isolated summit the way Fuji is
        // (Fuji already gets its own correct single-cone treatment via 'volcano'). The
        // reference's own single-peak scenes were an example of *rendering quality* —
        // real ridge/rock shading, not a flat silhouette — not a request that every
        // mountain biome render as one isolated peak regardless of what it's modelling.
        const n = 6;
        const saw = Math.abs(((p * n) % 1) - 0.5) * 2;
        return 0.5 + 0.5 * saw * (0.6 + 0.4 * Math.sin(p * Math.PI * 2.7 + 0.7));
      }
      case 'fjord': {
        // Steep walls either side, a gap in the middle for the water — this was inverted
        // (peaking at the centre, falling to the edges) until caught against a render:
        // it drew a plain symmetric triangle, nothing like a fjord. Edge distance now
        // genuinely drives wall height, floored so the central gap reads as a valley, not
        // a void.
        const edgeDist = Math.abs(p - 0.5);
        return Math.max(0.12, Math.min(1, edgeDist * 2.6));
      }
      case 'plateau': {
        // A flat-topped mesa/escarpment — smoothed into the plain at each end rather than
        // a hard binary step, which read as a plain rectangular box sitting in the hills
        // instead of a cliff line. A little high-frequency noise on the flat top keeps it
        // from being a perfectly straight ruled edge too.
        const rise = 0.08;
        const left = clamp((p - (0.25 - rise)) / rise, 0, 1);
        const right = clamp(((0.75 + rise) - p) / rise, 0, 1);
        const top = 0.85 + 0.03 * Math.sin(p * Math.PI * 11 + 2.1);
        const plain = 0.22 * Math.max(0, 1 - Math.abs(p - 0.5) * 2.2);
        return Math.max(plain, top * Math.min(left, right));
      }
      case 'flat':
      case 'canopy':
        // open horizon or canopy-covered — the treeline itself carries the silhouette, so
        // the hill band stays almost flat rather than competing with it
        return 0.08;
      case 'rolling':
      default:
        return 0.5 + 0.5 * (0.6 * Math.sin(p * Math.PI * 2.3 + 1.3) + 0.4 * Math.sin(p * Math.PI * 5.1 + 0.4));
    }
  };

  // A cliff face (plateau/escarpment) gets vertical streaks below — the rock striations
  // that actually read as "cliff" rather than "flat painted block." Every other form keeps
  // the plain two-tone dither.
  for (let x = 0; x < W; x++) {
    const p = x / W;
    const h = heightAt(p);
    const bump = h * 2 - 1; // back to the -1..1 range the rest of the maths expects
    const topY = Math.round(base - amp - amp * bump);
    const colH = Math.max(1, Math.round(base - topY));
    const streakBias = form === 'plateau' ? Math.sin(x * 1.3 + hashStr(`streak${x % 7}`) * 0.001) * 0.12 : 0;
    for (let i = 0; i < colH; i++) {
      const y = topY + i;
      // Higher ground (bigger `h`) leans toward the lit tone; every pixel still dithers
      // against its neighbours by the Bayer matrix so the shading has texture rather than
      // a single flat band per tone.
      const threshold = (BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      const c = h + streakBias > threshold ? light : dark;
      g.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      g.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Ground: a dithered two-tone fill, textured rather than a smooth linear gradient, with
 * ecosystem health mixed into both tones. Only covers the *land* — `landBottomY` is above
 * the full frame bottom, leaving room for the water reflection band `drawScene` adds below
 * it (when the biome has one).
 *
 * The colour comes from the **biome's own `ground` palette**, not the time-of-day theme —
 * red outback sand, grey-green alpine rock and deep rainforest green all need to stay
 * distinct from each other, which a theme-only colour (identical in every biome) can't do.
 * The theme still has the final word on *lighting*: its ground tones are blended in at a
 * low weight so the same biome still warms at golden hour and cools at dusk, and snow
 * weather overrides the blend entirely (every biome goes white under real snow).
 */
function drawGround(
  g: CanvasRenderingContext2D,
  W: number,
  horizonY: number,
  landBottomY: number,
  biomeGround: readonly [string, string, string],
  th: Theme,
  visual: ReturnType<typeof visualParamsFor>,
  biomeLandform: string,
): void {
  const LIGHTING_WEIGHT = 0.3;
  const [, bNear] = biomeGround;
  // "I want just the simple 2 tone, with the two tones being shades of one another, or
  // closely related" — ground0 and ground1 used to be two *separately* blended colours
  // (one from the biome's grass tone, one from its near tone, each mixed with a different
  // theme colour), which can drift apart in hue even when each individual blend looks fine
  // on its own, reading as "still multiple colours" instead of one colour in two
  // lightnesses. Derived from a single base colour via shadePair() instead, which can't
  // drift: same hue, same saturation, only the lightness differs between them. The near
  // tone is the anchor (it's what actually dominates the screen); the far tone is its
  // lighter shade, which also happens to be the "lighter at the back" depth cue already in
  // place.
  const groundBase = th.snow ? hex(th.ground1) : hex(vivifyHex(mixHex(bNear, th.ground1, LIGHTING_WEIGHT), 0.35));
  const [groundLight, groundDark] = shadePair(groundBase, 0.24);
  const ground0 = toHex(groundLight);
  const ground1 = toHex(groundDark);
  const g0 = applyGroundHealth(ground0, visual);
  const g1 = applyGroundHealth(ground1, visual);

  // The hills and the background gap-filler strip used to share one colour, drawn from the
  // biome's own *separately authored* "far" ground tone — a colour with no guaranteed hue
  // relationship to `groundBase` above (eucalypt's is a tan/khaki `#9a8f63` against an
  // olive-green `#7d8a52` near tone, for instance). Wherever the treeline had a gap, that put
  // a visibly different-coloured, noticeably paler band sitting inside what should read as
  // one ground — exactly "the ground being different colours." These two actually need
  // different treatment, not one shared value, and hills specifically need to come from
  // `th.far` (the *theme's* own atmospheric distance colour — already a close match to the
  // reference's dusty mauve hills at golden hour, `#a898a6`), not from the ground at all:
  // real distant hills read cooler/greyer than the ground beneath them precisely *because*
  // they're seen through more atmosphere, the opposite of matching the ground's own hue.
  // Deriving them from `groundBase` (an earlier version of this fix) overcorrected into
  // hills that were just a paler copy of the grass, losing that atmospheric-perspective look
  // entirely. A light blend toward the sky's own horizon stop keeps them tied to the same
  // light without erasing `th.far`'s own distinct, intentional colour.
  const hillCol = applyGroundHealth(toHex(mix(hex(th.far), hex(th.sky[5]), 0.22)), visual);
  // The biome's own landform drives the hill silhouette, not the region backdrop's form — a
  // backdrop is picked for sky/season variety and is shared across every biome in the
  // region, so using it for terrain shape meant switching ecosystems never changed the land
  // itself, only its colour. The biome's landform is geographically fixed; it doesn't change
  // with the weather or time of day, so it stays constant while everything else (sky,
  // lighting) keeps varying around it.
  drawHills(g, W, horizonY, hillCol, biomeLandform);

  // There used to be a *separate* "gap-filler" rectangle here, sized to a generous 22% of
  // the ground's height on the theory that it was needed wherever the deep forest's canopy
  // (drawn after this, on top) left a gap. It wasn't: the canopy's lobes only ever rise
  // *upward* from a base fixed 2px below the horizon — they never reach anywhere near 22%
  // of the way down — so that whole rectangle sat fully exposed as its own flat, separately
  // toned band, which is exactly what read as "the ground being different colours": a pale
  // strip with a hard line where it met the ground fill's own colour below. The ground fill
  // below already has its own near-horizon-lighter, further-down-darker gradient (`g0` to
  // `g1`, two true shades of one hue) — starting it right at the horizon instead of 18% into
  // the frame covers the same area with that one continuous gradient instead of two
  // separately-coloured zones stacked on top of each other.
  //
  // Genuinely minimal now, not just "a different pattern from the sky": the reference's own
  // ground is close to two flat colour bands, full stop — texture only earns its place as a
  // narrow transition near the treeline, reading as distance, not as a dense pattern the
  // user has to look past to see the grass itself. Most of the ground band is flat solid
  // colour; only a band near the top actually dithers between the two tones, and even there
  // the grain is sparse (most pixels keep whichever flat tone is nearer, only a minority
  // flip), not an even 50/50 mix across every row.
  const top = Math.round(horizonY);
  const bottom = Math.round(landBottomY);
  const rows = Math.max(1, bottom - top);
  const transitionRows = Math.max(1, Math.round(rows * 0.22));
  const g0rgb = hex(g0);
  const g1rgb = hex(g1);
  const img = g.createImageData(W, rows);
  const d = img.data;
  for (let y = 0; y < rows; y++) {
    const inTransition = y < transitionRows;
    const p = inTransition ? y / transitionRows : 1;
    for (let x = 0; x < W; x++) {
      let c: RGB;
      if (!inTransition) {
        c = g1rgb;
      } else {
        const grain = (hashStr(`turf|${x}|${y}`) % 1000) / 1000;
        // Sparse flips rather than an even dither: only pixels whose grain value falls in
        // a narrow band around the transition point switch tone at all.
        c = Math.abs(grain - p) < 0.12 ? g0rgb : p > 0.5 ? g1rgb : g0rgb;
      }
      const idx = (y * W + x) * 4;
      d[idx] = c[0];
      d[idx + 1] = c[1];
      d[idx + 2] = c[2];
      d[idx + 3] = 255;
    }
  }
  g.putImageData(img, 0, top);

  // No scattered ground texture here, on purpose. The user sent the exact reference they
  // meant, "literally verbatim": the ground there is just two flat-ish colour bands with
  // the same fine, uniform dither the sky itself uses — no individual tufts, cracks,
  // reeds or stones scattered on top at all. An earlier pass added exactly that kind of
  // scattered-mark texture (`terrainStyleFor`, now removed) and then tried to tune it by
  // density and contrast; the real problem was that this category of texture shouldn't
  // exist here at all. The dithered two-tone fill above (shared with every other flat
  // area in this scene) is the entire ground treatment now.
}

const DEEP_TREES_PER_BAND = 60;
const DEEP_MAX_BANDS = 4;
const DEEP_RISE = 3; // engine px a band stands higher than the one in front of it
const DEEP_CROWN = 8; // engine px, nearest band's canopy height
const DEEP_STEP = 6; // engine px taller per band further back
// Dense enough, and with a high enough floor on both radius and height, that a run of
// several consecutive short lobes can never leave a wide, flat, under-covered gap in the
// canopy — the shape of such a gap (a sharp rectangular notch bounded by the flat `base`
// line) is exactly what read as "a weird box in the background": not a colour problem, a
// coverage one. Tightened from a wider original spread after finding this by sampling the
// actual rendered pixels of a reported gap and tracing it back to this RNG.
const LOBE_GAP = 3;
const LOBE_R = 4.5;
const LOBE_R_SPREAD = 2.5;
const LOBE_H = 0.75;
const LOBE_H_SPREAD = 0.35;

/** How many hazy canopy bands a grove of this size gets — ported from the original's
 * `clamp(round(log2(max(2, n/60))), 1, 4)`: even a brand-new grove gets one band, so the
 * forest never reads as floating in empty space with nothing behind it; a large grove
 * gets up to four, each one further back. */
function deepForestBands(totalPlants: number): number {
  const n = Math.max(2, totalPlants / DEEP_TREES_PER_BAND);
  return Math.max(1, Math.min(DEEP_MAX_BANDS, Math.round(Math.log2(n))));
}

/**
 * The deep forest: a hazy, scalloped canopy skyline standing behind the individually
 * drawn trees, rising band by band into the mist — Memory Forest's own `deepForest()`
 * (`web/engines/pixel/ground.js`). This is the single biggest depth cue the original has
 * that an earlier version of this file never ported: individual sprite scaling alone
 * can't suggest a forest that keeps going past what's actually drawn, but a receding,
 * fading treeline silhouette behind the back row does exactly that — the same reason a
 * real landscape painting puts hazy blue hills behind its foreground trees.
 *
 * Each band is drawn as a row of overlapping lobes (half-ellipses) along a base line,
 * furthest band first so nearer ones paint over it, every pixel dithered between two
 * tones in a checkerboard (matching the original) and faded toward the theme's haze
 * colour more heavily the further back the band stands.
 */
function drawDeepForest(g: CanvasRenderingContext2D, W: number, horizonY: number, th: Theme, bands: number, seed: number, pixelScale: number): void {
  const R = rng(seed ^ 0x5eed);
  const haze = hex(th.haze);
  const tintC = th.tint ? hex(th.tint) : null;
  const lightBase = hex(th.grass);
  const darkBase = hex(mixHex(th.grass, '#000000', 0.38));
  const rimBase = hex(th.rim ?? mixHex(th.grass, '#ffffff', 0.3));
  const far = horizonY + 2;

  for (let k = bands - 1; k >= 0; k--) {
    const hz = Math.min(0.92, th.hazeStep * (2.6 + k * 1.7));
    const tone = (c: RGB): string => {
      const q = tintC ? mix(c, tintC, th.tintAmount) : c;
      const m = mix(q, haze, hz);
      return `rgb(${m[0] | 0},${m[1] | 0},${m[2] | 0})`;
    };
    const c1 = tone(lightBase);
    const c2 = tone(darkBase);
    const rim = tone(th.snow ? [240, 248, 255] : rimBase);
    const base = Math.round(far - k * DEEP_RISE * pixelScale);
    const crown = (DEEP_CROWN + k * DEEP_STEP) * pixelScale;

    const top = new Float32Array(W).fill(base);
    for (let cx = -2; cx <= W + 2; cx += Math.max(1, (LOBE_GAP + R() * LOBE_GAP) * pixelScale)) {
      const r = (LOBE_R + R() * LOBE_R_SPREAD) * pixelScale;
      const h = crown * (LOBE_H + R() * LOBE_H_SPREAD);
      for (let x = Math.ceil(cx - r); x <= cx + r; x++) {
        if (x < 0 || x >= W) continue;
        const reach = Math.sqrt(Math.max(0, 1 - ((x - cx) / r) ** 2));
        top[x] = Math.min(top[x], base - h * reach);
      }
    }
    for (let x = 0; x < W; x++) {
      const y0 = Math.round(top[x]);
      g.fillStyle = rim;
      g.fillRect(x, y0, 1, 1);
      for (let y = y0 + 1; y <= base; y++) {
        g.fillStyle = (x + y) & 1 ? c2 : c1;
        g.fillRect(x, y, 1, 1);
      }
    }
  }
}

/**
 * Mirror the land band (sky's lower edge through ground, trees and creatures — everything
 * already drawn onto `canvas`) into the band below `landBottomY`, tinted with the theme's
 * water colour. This is Memory Forest's signature "lake" look: the whole treeline
 * reflected, not just scattered ponds. Drawing the canvas onto itself, flipped and
 * clipped, is cheap at engine resolution and needs no second render pass.
 */
type CabinStyle = 'log' | 'stilt' | 'stone' | 'earthen';

/** Which dwelling style fits a biome, by keyword — tropical/wetland biomes get a raised
 * stilt hut (flooding, humidity), alpine/mountain biomes get stone with a steep roof
 * (snow load), arid/savanna biomes get flat-roofed earthen construction, and everything
 * else (temperate forest, the common case) gets the original log cabin. This is a
 * heuristic over ~22 biomes across 11 regions, not a hand-placed choice per biome, but it's
 * what actually varies the cabin by *ecosystem* rather than by region label alone — the
 * same style reappears wherever the environment calls for it, which is the honest version
 * of "fits the ecosystem" rather than 11 arbitrary reskins. */
function cabinStyleFor(biomeKey: string): CabinStyle {
  if (/tropical|rainforest|coastal|wetland|mangrove|terai|riverine|dipterocarp/.test(biomeKey)) return 'stilt';
  if (/alpine|himalaya|plateau|rocky/.test(biomeKey)) return 'stone';
  if (/outback|savanna|steppe|spiny/.test(biomeKey)) return 'earthen';
  return 'log';
}

/**
 * The cabin that appears after a grove's first year. Built the same way every other sprite
 * in this file is — tone-shaded pixel blocks, tinted by the current theme — and now in one
 * of four styles chosen by the biome's own ecosystem, standing on whichever side of the
 * scene a stable per-biome hash picks (not always the same front-left corner).
 */
function drawCabin(g: CanvasRenderingContext2D, cx: number, baseY: number, s: number, th: Theme, biomeKey: string, haze = 0): void {
  const tintC = (col: string): string => {
    let c = hex(col);
    // Every wall/roof tone below was a fully independent hardcoded hex, tied to nothing
    // else onscreen — which is exactly what made the cabin read as a different picture
    // pasted into the scene rather than a structure standing in it. Pull it toward the
    // ground's own hue first, the same unifying step hills now get, before the existing
    // time-of-day tint and haze.
    c = mix(c, hex(th.ground1), 0.25);
    if (th.tint && th.tintAmount) c = mix(c, hex(th.tint), th.tintAmount);
    if (haze > 0) c = mix(c, hex(th.haze), haze);
    return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  };
  const style = cabinStyleFor(biomeKey);
  const lit = luminance(hex(th.sky[0])) < 90;
  const wallW = 14 * s;
  const stilt = style === 'stilt' ? Math.round(2.5 * s) : 0;
  const wallH = (style === 'stone' ? 7 : 8) * s;
  const x0 = Math.round(cx - wallW / 2);
  const y0 = Math.round(baseY - wallH - stilt);

  // Stilts, for a raised tropical hut.
  if (stilt > 0) {
    g.fillStyle = tintC('#4a3a28');
    for (const lx of [x0 + s, x0 + wallW - 2 * s]) g.fillRect(lx, y0 + wallH, s, stilt);
  }

  // Walls.
  const [wallLight, wallMid, wallDark] =
    style === 'stone'
      ? ['#9a9488', '#7a7468', '#58544a'].map(tintC)
      : style === 'earthen'
        ? ['#c8a870', '#a8864c', '#7a6038'].map(tintC)
        : ['#8a6245', '#6a4a32', '#4e361f'].map(tintC);
  for (let y = 0; y < wallH; y++) {
    const band = style === 'stone' ? y % (3 * s) < s : y % (2 * s) < s;
    const row = y > wallH - s ? wallDark : band ? wallMid : wallLight;
    g.fillStyle = row;
    g.fillRect(x0, y0 + y, wallW, 1);
  }
  g.fillStyle = wallDark;
  g.fillRect(x0, y0, s, wallH);
  g.fillRect(x0 + wallW - s, y0, s, wallH);

  // Door.
  const doorW = Math.max(2, Math.round(2.6 * s));
  const doorH = Math.round(wallH * 0.75);
  g.fillStyle = tintC('#2e2016');
  g.fillRect(Math.round(cx - doorW / 2), y0 + wallH - doorH, doorW, doorH);

  // Window: lit warm when the sky itself is dark, a cool glass tone otherwise.
  const winSize = Math.max(1, Math.round(1.6 * s));
  const winX = x0 + wallW - winSize - s;
  const winY = y0 + Math.round(s * 1.2);
  g.fillStyle = lit ? '#f0d080' : tintC('#5a7a8a');
  g.fillRect(winX, winY, winSize, winSize);
  if (lit) {
    g.fillStyle = 'rgba(240,208,128,0.25)';
    g.fillRect(winX - 1, winY - 1, winSize + 2, winSize + 2);
  }

  // Roof: gabled (log/stone) or flat with a parapet (earthen) or a steep conical thatch
  // (stilt) — the clearest style signal of the four, since it's the largest silhouette.
  const roofW = wallW + 4 * s;
  const peakX = cx;
  if (style === 'earthen') {
    const roofH = 2 * s;
    g.fillStyle = tintC('#8a7450');
    g.fillRect(x0 - s, y0 - roofH, wallW + 2 * s, roofH);
    g.fillStyle = tintC('#6a5a3c');
    g.fillRect(x0 - s, y0 - roofH, wallW + 2 * s, 1);
  } else if (style === 'stilt') {
    const roofH = 8 * s;
    const peakY = y0 - roofH;
    const thatchLight = tintC('#c8a850');
    const thatchDark = tintC('#9a7e34');
    for (let y = 0; y < roofH; y++) {
      const t = y / roofH;
      const halfW = (roofW / 2) * (0.15 + 0.85 * t);
      const rowY = Math.round(peakY + y);
      g.fillStyle = y % (2 * s) < s ? thatchLight : thatchDark;
      g.fillRect(Math.round(peakX - halfW), rowY, Math.max(1, Math.round(halfW * 2)), 1);
    }
  } else {
    const roofH = (style === 'stone' ? 7 : 6) * s;
    const peakY = y0 - roofH;
    // Muted toward brown/terracotta rather than a saturated brick red, which read as a
    // different hue family entirely next to a green-and-blue scene no matter how it was
    // tinted afterward.
    const roofDark = tintC(style === 'stone' ? '#4a4a52' : '#5e3824');
    const roofLight = tintC(style === 'stone' ? '#6a6a72' : '#7a4c34');
    for (let y = 0; y < roofH; y++) {
      const t = y / roofH;
      const halfW = (roofW / 2) * t;
      const rowY = Math.round(peakY + y);
      g.fillStyle = y < 2 ? roofLight : roofDark;
      g.fillRect(Math.round(peakX - halfW), rowY, Math.max(1, Math.round(halfW)), 1);
      g.fillStyle = roofDark;
      g.fillRect(Math.round(peakX), rowY, Math.max(1, Math.round(halfW)), 1);
    }
    // Chimney smoke — gabled styles only, since the flat/thatch roofs don't read a chimney.
    if (lit || th.snow) {
      const smokeX = Math.round(cx + wallW * 0.28);
      for (let i = 0; i < 3; i++) {
        const py = Math.round(peakY - 2 - i * 2 * s);
        g.fillStyle = `rgba(220,220,225,${0.4 - i * 0.1})`;
        g.fillRect(smokeX + (i % 2 === 0 ? 0 : s), py, s, s);
      }
    }
  }
}

function drawReflection(
  g: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  W: number,
  landBottomY: number,
  waterBottomY: number,
  th: Theme,
  visual: ReturnType<typeof visualParamsFor>,
): void {
  const bandH = waterBottomY - landBottomY;
  if (bandH <= 1) return;

  g.save();
  g.beginPath();
  g.rect(0, Math.round(landBottomY), W, Math.ceil(bandH));
  g.clip();
  g.translate(0, landBottomY * 2);
  g.scale(1, -1);
  g.globalAlpha = 0.55;
  g.drawImage(canvas, 0, 0);
  g.restore();

  // Water tint over the reflection, clearer (less tint) the healthier the ecosystem.
  const waterCol = hex(th.water);
  g.fillStyle = `rgba(${waterCol[0] | 0},${waterCol[1] | 0},${waterCol[2] | 0},${0.3 * (1 - visual.waterClarity * 0.35)})`;
  g.fillRect(0, Math.round(landBottomY), W, Math.ceil(bandH));

  // A crisp waterline and a couple of ripple rows, so it doesn't read as a plain mirror.
  g.fillStyle = th.near;
  g.fillRect(0, Math.round(landBottomY) - 1, W, 1);
  g.fillStyle = `rgba(255,255,255,${0.1 + 0.08 * visual.waterClarity})`;
  for (let y = 2; y < bandH; y += 3) {
    const shift = (y % 6 < 3 ? 1 : -1) * 2;
    g.fillRect(shift, Math.round(landBottomY + y), W, 1);
  }
}

/** Tiny flying "v" birds, drifting slowly across the upper sky. `th.birds` (0..6) comes
 * from the brief's "your numbers as ambience" idea — more today's reviews, more birds. */
function drawBirds(g: CanvasRenderingContext2D, W: number, horizonY: number, th: Theme, t: number): void {
  if (!th.birds) return;
  g.fillStyle = 'rgba(58,58,58,0.8)';
  for (let i = 0; i < th.birds; i++) {
    const speed = 5 + (i % 3) * 1.6;
    const x = Math.round((((t * speed + i * 137) % (W + 30)) + W + 30) % (W + 30)) - 15;
    const y = Math.round(horizonY * (0.12 + ((i * 53) % 100) / 100 * 0.3));
    g.fillRect(x - 2, y + 1, 1, 1);
    g.fillRect(x - 1, y, 1, 1);
    g.fillRect(x, y, 1, 1);
    g.fillRect(x + 1, y, 1, 1);
    g.fillRect(x + 2, y + 1, 1, 1);
  }
}

function drawPond(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, th: Theme, visual: ReturnType<typeof visualParamsFor>): void {
  const clarity = visual.waterClarity;
  const base = hex(th.water);
  const murk = mix(base, [90, 95, 70], 1 - clarity);
  g.fillStyle = `rgb(${murk[0] | 0},${murk[1] | 0},${murk[2] | 0})`;
  g.beginPath();
  g.ellipse(Math.round(x), Math.round(y), Math.round(w / 2), Math.round(h / 2), 0, 0, Math.PI * 2);
  g.fill();
  // a single highlight band, hard-edged, rather than a soft gradient shimmer
  g.fillStyle = `rgba(255,255,255,${0.12 + 0.1 * clarity})`;
  g.fillRect(Math.round(x - w * 0.2), Math.round(y - 1), Math.round(w * 0.3), 1);
}


/** An offscreen canvas at engine resolution, reused across frames (resized only when the
 * aspect ratio actually changes) so a redraw doesn't allocate a new canvas every frame. */
let engineCanvas: HTMLCanvasElement | null = null;
let engineCtx: CanvasRenderingContext2D | null = null;

function getEngineCanvas(engineW: number, engineH: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (!engineCanvas) {
    engineCanvas = document.createElement('canvas');
  }
  if (engineCanvas.width !== engineW || engineCanvas.height !== engineH) {
    engineCanvas.width = engineW;
    engineCanvas.height = engineH;
    engineCtx = null;
  }
  if (!engineCtx) {
    engineCtx = engineCanvas.getContext('2d', { willReadFrequently: false });
    if (engineCtx) engineCtx.imageSmoothingEnabled = false;
  }
  return [engineCanvas, engineCtx!];
}

/**
 * Render one frame of the grove onto `g`'s real canvas (device-pixel size `W` x `H`; the
 * caller sizes the `<canvas>` element). Draws at `ENGINE_WIDTH` internal resolution and
 * blits that up, so the whole scene — not just individual sprites — reads as pixel art.
 * Hit boxes are returned in the *real* canvas's coordinate space, since that's what the
 * caller's pointer events are measured in.
 */
export function drawScene(g: CanvasRenderingContext2D, W: number, H: number, input: SceneInput): DrawResult {
  const aspect = W / H;
  const engineW = ENGINE_WIDTH;
  const engineH = Math.round(engineW / aspect);
  const blit = W / engineW;
  const pixelScale = pixelScaleFor(engineH);

  const [ecv, eg] = getEngineCanvas(engineW, engineH);
  eg.clearRect(0, 0, engineW, engineH);

  const backdrop = input.backdrops?.length
    ? pickBackdrop(input.backdrops, input.mood.time === 'night', input.grove.seed, input.season)
    : undefined;
  const th = buildTheme(
    input.mood,
    { streak: input.grove.stats.streak, todayReviews: input.grove.stats.todayReviews },
    backdrop,
  );
  const visual = visualParamsFor(input.visualHealth);
  const horizonY = engineH * 0.42;
  // Land ends at LAND_BOTTOM; the frame's true bottom (GROUND_BOTTOM) is reserved for the
  // water-reflection band when this biome has one — see Biome.hasWater.
  const landBottomY = engineH * LAND_BOTTOM;
  const frameBottomY = engineH * GROUND_BOTTOM;
  const groundBottomY = input.biome.hasWater ? landBottomY : frameBottomY;

  drawSky(eg, engineW, horizonY, th, input.t);
  drawGround(eg, engineW, horizonY, groundBottomY, input.biome.ground, th, visual, input.biome.landform);
  drawDeepForest(eg, engineW, horizonY, th, deepForestBands(input.grove.stats.plants), input.grove.seed, pixelScale);

  const layout: Layout = layoutGrove(input.grove.plants);
  // The hit boxes we report are in *real* canvas space, so every engine-space box drawn
  // below gets scaled by `blit` before it's pushed.
  const boxes: HitBox[] = [];
  const pushBox = (kind: HitBox['kind'], ref: number, cx: number, topY: number, w: number, h: number, depth: number) => {
    boxes.push(boxAt(kind, ref, cx * blit, topY * blit, w * blit, h * blit, depth));
  };

  const groundBottomFrac = input.biome.hasWater ? LAND_BOTTOM : GROUND_BOTTOM;
  for (const item of layout.items) {
    const placed = placeItem(item, engineW, engineH, horizonY, groundBottomFrac);
    const zoomedScale = placed.scale * layout.zoom * pixelScale;
    if (isPond(item)) {
      const pw = 10 * item.slots * zoomedScale;
      const ph = 3.4 * zoomedScale;
      drawPond(eg, placed.x, placed.y - ph / 2, pw, ph, th, visual);
      pushBox('pond', item.group, placed.x, placed.y - ph, pw, ph, item.depth);
      continue;
    }
    const plant = item as Extract<LayoutItem, { pond: false }>;
    const species = input.biome.plants[plant.species % input.biome.plants.length];
    // The tone map is now built at the plant's real target size directly (depth and the
    // grove's zoom both folded into `zoomedScale`), not drawn small and integer-stretched
    // afterward — see the long comment on `buildToneMap` for why that mattered.
    const tone = buildToneMap(plant, species.form, zoomedScale);
    const x0 = Math.round(placed.x - tone.w / 2);
    const y0 = Math.round(placed.y - tone.h);
    drawShadow(eg, placed.x, placed.y, tone.w, th, placed.haze);
    paintPlant(eg, tone, species, {
      stage: plant.stage,
      health: plant.health,
      seed: plant.seed,
      variant: plant.variant,
      // Raised from *4: with the widened FAR_SCALE/NEAR_GAIN spread, the back row needed a
      // stronger haze pull too, or size alone would carry all of the depth cue and distant
      // trees would still read as "small but equally crisp" rather than genuinely far away.
      haze: Math.min(1, placed.haze * th.hazeStep * 6.5),
      hazeColor: th.haze,
      tint: th.tint ?? undefined,
      tintAmount: th.tintAmount,
      snow: th.snow,
      rim: th.rim ?? undefined,
      sunFromRight: !!th.orb && th.orb.x > 0.5,
    }, x0, y0, 1);
    pushBox('plant', plant.index, placed.x, y0, tone.w, tone.h, item.depth);
  }

  input.roster.creatures.forEach((save) => {
    const creature: Creature | undefined = input.biome.creatures.find((c) => c.slot === save.slot);
    if (!creature) return;
    const age = creatureAge(save, input.activeStudyDays);
    const stageIdx = lifeStageFor(age);
    const isNight = input.mood.time === 'night';
    const mood: CreatureMood = creatureMood(visual.creatureActivity * 100, {
      nocturnal: creature.activity === 'nocturnal',
      night: isNight,
      sleepy: creature.sleepy,
      paused: input.paused,
    });
    if (mood === 'hidden' || mood === 'asleep') return;

    // A stable per-creature depth (not just a fixed front-row position): every ground
    // creature used to stand at the exact same `baseY`, always frontmost, regardless of
    // species or slot — the user's own words were "they should be... present at different
    // depth of the image instead of only in the foreground." Hashed from the slot and the
    // grove's own seed, so it's fixed for a given creature rather than jittering frame to
    // frame, the same way a cabin's depth is chosen.
    const creatureDepth = 0.1 + 0.85 * ((hashStr(`creature-depth|${save.slot}|${input.grove.seed}`) % 1000) / 1000);
    const depthTop = horizonY + engineH * ROWS_TOP;
    const creatureBaseY = depthTop + (groundBottomY - depthTop) * Math.pow(creatureDepth, 1.1);
    const depthScale = FAR_SCALE + NEAR_GAIN * creatureDepth;
    const creatureHaze = Math.min(1, (1 - creatureDepth) * th.hazeStep * 5);
    // The ASCII grid is now built at the real target size directly (zoomScale folds in
    // the grove's own zoom, this resolution's pixelScale, and this creature's own depth),
    // the same fix plantSprite.ts's tone maps got earlier — see buildCreatureFrames' own
    // comment for why a flat per-character paint multiplier alone made every creature a
    // handful of giant, detail-less squares. The paint multiplier below is now small and
    // fixed: individual pixels stay crisp instead of ballooning into blocks.
    const zoomScale = layout.zoom * pixelScale * depthScale * 0.45;
    const [idle, busy] = buildCreatureFrames(creature, stageIdx, zoomScale);
    const home = 0.15 + (save.slot / 5) * 0.7;
    // A hand-authored sprite (`creature.sprite`) is a small *fixed* grid — Memory Forest's
    // own creatures run 5-17 engine pixels wide — so unlike the procedural fallback (which
    // already bakes zoom into the grid's own resolution, and only needs a small fixed paint
    // multiplier on top) it needs the zoom carried entirely by the paint multiplier, the
    // same way the original's `paintSprite`/`scaledAt` scales its own fixed-size frames up.
    const creatureScale = creature.sprite
      ? Math.max(1, Math.round(zoomScale * 2.6))
      : Math.max(1, Math.round(pixelScale * 0.5));
    const pal = creature.sprite?.pal ?? creature.palette ?? {};
    const isHopper = creature.sprite ? !!creature.sprite.hop : creature.body?.kind === 'hopper';
    // Against the user's own reference: a fox or rabbit there is clean, simple, almost
    // flat colour — one body tone, one accent (a white tail tip, a dark eye), nothing more.
    // Stacking this scene's full tint + rim-light + haze treatment on a sprite that small
    // was muddying exactly the simplicity that reads as "cute" — three separate colour
    // blends fighting for the same handful of pixels just looks murky, not atmospheric.
    // Tint stays (it's what makes a creature belong to the same moment as the trees around
    // it) but much lighter than before, and rim-light is dropped entirely: a plant crown
    // has dozens of pixels for a highlighted edge to read as an edge; a creature has a
    // handful, and on that scale it just reads as a stray bright blotch.
    const creatureTint = th.tint ? { color: th.tint, amount: th.tintAmount * 0.35 } : undefined;

    if (creature.zone === 'sky') {
      const pos = flightPosition(input.t, engineW * 0.6, horizonY * 0.5, engineW * 0.1, horizonY * 0.08, 0.3);
      const frame = input.animate && flapFrame(input.t, 2.5, 5) ? busy : idle;
      const fw = frame[0]?.length ?? 1;
      paintCreature(eg, frame, pal, Math.round(pos.x - (fw * creatureScale) / 2), Math.round(pos.y - frame.length * creatureScale), creatureScale, false, creatureTint);
      pushBox('creature', save.slot, pos.x, pos.y - frame.length * creatureScale, fw * creatureScale, frame.length * creatureScale, 0);
      return;
    }

    const motion = groundMotion(input.t, input.grove.seed, save.slot, home, 0.08, input.animate);
    const frame = motion.moving ? busy : idle;
    const fw = frame[0]?.length ?? 1;
    let dy = -motion.idleBob * 0.6 * creatureScale;
    if (isHopper && motion.moving) {
      dy = -hopHeight(motion.groundCovered, RABBIT_LIKE_HOP, 3 * creatureScale);
    }
    const x = motion.x * engineW;
    const y0 = creatureBaseY - frame.length * creatureScale + dy;
    // The shadow stays planted on the ground at this creature's own depth even while it
    // bobs or hops above it (`dy`) — that's what actually sells a hop or a bounce as
    // leaving the ground, rather than the sprite just sliding up and down in place.
    drawShadow(eg, x, creatureBaseY, fw * creatureScale, th, creatureHaze);
    // Haze only once a creature is genuinely standing well back (depth fade still matters
    // for the ones placed far from the camera), not as a blanket effect on every creature
    // regardless of position.
    const creatureHazeOpt = creatureHaze > 0.25 ? { color: th.haze, amount: creatureHaze * 0.6 } : undefined;
    // A sprite can declare itself drawn facing left by default (`facesLeft`, most face
    // right) — flips the sense of `motion.facing` the same way Memory Forest's own
    // `FACES_LEFT` map does, so a left-drawn sprite still turns to face the way it's moving.
    const baseFlip = motion.facing < 0;
    const flip = creature.sprite?.facesLeft ? !baseFlip : baseFlip;
    paintCreature(eg, frame, pal, Math.round(x - (fw * creatureScale) / 2), Math.round(y0), creatureScale, flip, creatureTint, undefined, creatureHazeOpt);
    pushBox('creature', save.slot, x, y0, fw * creatureScale, frame.length * creatureScale, creatureDepth);
  });

  if (hasCabin(input.grove.stats)) {
    // Both which side of the scene it stands on and how far back it sits are a stable hash
    // of the biome's own key — a different ecosystem can put it anywhere in the scene, but
    // it never jitters day to day for the same biome. Placed with the exact same
    // depth -> y/scale/haze mapping `placeItem` uses for every plant, so a cabin standing
    // in the back row genuinely recedes (smaller, hazier, higher up) instead of always
    // being pasted at full size in the front corner regardless of where it's "standing."
    const onRight = hashStr(`cabin-side|${input.biome.key}`) % 2 === 0;
    const cabinDepth = 0.15 + 0.8 * ((hashStr(`cabin-depth|${input.biome.key}`) % 1000) / 1000);
    const top = horizonY + engineH * ROWS_TOP;
    const cy = top + (groundBottomY - top) * Math.pow(cabinDepth, 1.1);
    // 0.55x on top of the plant-matching formula: against the reference, the cabin is a
    // small background detail easily smaller than the trees around it, not a landmark
    // competing with them for attention — "remember the trees are the most important part,
    // not the animals and hut." The previous scale matched a plant's own size at the same
    // depth exactly, including the full zoom boost a small grove gets (up to 2.4x), which
    // is what actually made the hut read as oversized.
    const cabinScale = (FAR_SCALE + NEAR_GAIN * cabinDepth) * layout.zoom * 0.55;
    const cabinHaze = Math.min(1, (1 - cabinDepth) * th.hazeStep * 6.5);
    const cx = onRight ? engineW * 0.92 : engineW * 0.08;
    const s = Math.max(0.4, cabinScale) * pixelScale;
    drawShadow(eg, cx, cy, 16 * s, th, cabinHaze);
    drawCabin(eg, cx, cy, s, th, input.biome.key, cabinHaze);
    pushBox('plant', -1, cx, cy - 14 * s, 18 * s, 14 * s, cabinDepth);
  }

  // Water reflection, only for a biome that actually has standing water — an outback or
  // alpine scene has no lake, so none is drawn and the land simply runs to the frame's
  // true bottom instead (set above via `groundBottomY`/`groundBottomFrac`).
  if (input.biome.hasWater) {
    drawReflection(eg, ecv, engineW, landBottomY, frameBottomY, th, visual);
  }

  // Birds last, so they're never caught in the water reflection below them.
  drawBirds(eg, engineW, horizonY, th, input.t);

  // The one blit: the whole low-resolution scene, scaled up with smoothing off. This is
  // what makes every pixel of sky, ground and sprite alike come out as a crisp block.
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, W, H);
  g.drawImage(engineCanvas!, 0, 0, engineW, engineH, 0, 0, W, H);

  return { boxes };
}
