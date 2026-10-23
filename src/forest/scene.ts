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
import { hex, mix, mixHex, luminance, rgba, BAYER4 } from './color';
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
 */
const ENGINE_WIDTH = 300;

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
      const cw = W * (0.08 + ((hashStr(`cloudw${i}`) % 1000) / 1000) * 0.08);
      g.fillStyle = th.clouds.top;
      g.globalAlpha = th.clouds.alpha / 255;
      g.fillRect(Math.round(cx - cw / 2), Math.round(cy), Math.round(cw), Math.max(1, Math.round(cw * 0.22)));
      g.globalAlpha = 1;
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
function drawHills(g: CanvasRenderingContext2D, W: number, horizonY: number, farColor: string, groundColor: string, form: string): void {
  const hillColor = mix(hex(farColor), hex(groundColor), 0.3);
  g.fillStyle = `rgb(${hillColor[0] | 0},${hillColor[1] | 0},${hillColor[2] | 0})`;
  const base = horizonY + horizonY * 0.1;
  const amp = horizonY * 0.14;

  const heightAt = (p: number): number => {
    switch (form) {
      case 'volcano': {
        // one dominant symmetric cone, slightly off-centre
        const d = Math.abs(p - 0.42) * 2.6;
        return Math.max(0, 1 - d) ** 1.6;
      }
      case 'peaks':
      case 'towers':
      case 'tsingy': {
        // sharp, higher-frequency jagged silhouette — ridgeline, not rolling hills
        const n = form === 'tsingy' ? 9 : 6;
        const saw = Math.abs(((p * n) % 1) - 0.5) * 2;
        return 0.5 + 0.5 * saw * (0.6 + 0.4 * Math.sin(p * Math.PI * 2.7 + 0.7));
      }
      case 'fjord': {
        // steep near-vertical walls either side, a gap in the middle for the water
        const walls = Math.max(0, 1 - Math.abs(p - 0.5) * 2.4);
        return walls > 0.15 ? walls : 0.05;
      }
      case 'plateau': {
        // a flat-topped mesa
        const inPlateau = p > 0.25 && p < 0.75;
        return inPlateau ? 0.85 : 0.25 * Math.max(0, 1 - Math.abs(p - 0.5) * 2.2);
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

  for (let x = 0; x < W; x++) {
    const p = x / W;
    const bump = heightAt(p) * 2 - 1; // back to the -1..1 range the rest of the maths expects
    const topY = Math.round(base - amp - amp * bump);
    g.fillRect(x, topY, 1, Math.max(1, Math.round(base - topY)));
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
): void {
  const LIGHTING_WEIGHT = 0.3;
  const [bFar, bNear, bGrass] = biomeGround;
  // Snow weather overrides every biome's own palette outright — every biome goes white
  // under real snow, rather than blending snow-white with (say) red outback sand.
  const far = th.snow ? th.far : mixHex(bFar, th.far, LIGHTING_WEIGHT);
  const ground0 = th.snow ? th.ground0 : mixHex(bGrass, th.ground0, LIGHTING_WEIGHT);
  const ground1 = th.snow ? th.ground1 : mixHex(bNear, th.ground1, LIGHTING_WEIGHT);

  const farCol = applyGroundHealth(far, visual);
  g.fillStyle = farCol;
  g.fillRect(0, Math.round(horizonY), W, Math.round((landBottomY - horizonY) * 0.22));

  const g0 = applyGroundHealth(ground0, visual);
  const g1 = applyGroundHealth(ground1, visual);
  drawHills(g, W, horizonY, farCol, g0, th.hillForm);

  // Same per-pixel Bayer dither as the sky, not a per-row one — see the long comment on
  // drawSky for why that distinction actually matters visually.
  const top = Math.round(horizonY + (landBottomY - horizonY) * 0.18);
  const bottom = Math.round(landBottomY);
  const rows = Math.max(1, bottom - top);
  const g0rgb = hex(g0);
  const g1rgb = hex(g1);
  const img = g.createImageData(W, rows);
  const d = img.data;
  for (let y = 0; y < rows; y++) {
    const p = Math.min(1, (y / Math.max(1, rows)) * 1.15);
    for (let x = 0; x < W; x++) {
      const threshold = (BAYER4[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      const c = p > threshold ? g1rgb : g0rgb;
      const idx = (y * W + x) * 4;
      d[idx] = c[0];
      d[idx + 1] = c[1];
      d[idx + 2] = c[2];
      d[idx + 3] = 255;
    }
  }
  g.putImageData(img, 0, top);
}

const DEEP_TREES_PER_BAND = 60;
const DEEP_MAX_BANDS = 4;
const DEEP_RISE = 3; // engine px a band stands higher than the one in front of it
const DEEP_CROWN = 8; // engine px, nearest band's canopy height
const DEEP_STEP = 6; // engine px taller per band further back
const LOBE_GAP = 4;
const LOBE_R = 4;
const LOBE_R_SPREAD = 3.5;
const LOBE_H = 0.55;
const LOBE_H_SPREAD = 0.65;

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
function drawDeepForest(g: CanvasRenderingContext2D, W: number, horizonY: number, th: Theme, bands: number, seed: number): void {
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
    const base = Math.round(far - k * DEEP_RISE);
    const crown = DEEP_CROWN + k * DEEP_STEP;

    const top = new Float32Array(W).fill(base);
    for (let cx = -2; cx <= W + 2; cx += Math.max(1, LOBE_GAP + R() * LOBE_GAP)) {
      const r = LOBE_R + R() * LOBE_R_SPREAD;
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
    const roofDark = tintC(style === 'stone' ? '#4a4a52' : '#6a241a');
    const roofLight = tintC(style === 'stone' ? '#6a6a72' : '#8a3a2e');
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
  drawGround(eg, engineW, horizonY, groundBottomY, input.biome.ground, th, visual);
  drawDeepForest(eg, engineW, horizonY, th, deepForestBands(input.grove.stats.plants), input.grove.seed);

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
    const zoomedScale = placed.scale * layout.zoom;
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
    }, x0, y0, 1);
    pushBox('plant', plant.index, placed.x, y0, tone.w, tone.h, item.depth);
  }

  const baseY = groundBottomY - 2;
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

    const [idle, busy] = buildCreatureFrames(creature, stageIdx);
    const home = 0.15 + (save.slot / 5) * 0.7;
    const creatureScale = Math.max(1, Math.round(layout.zoom * 1.4));
    // Creatures previously never received the scene's ambient tint at all — painted in raw
    // palette colour regardless of dawn pink, dusk plum or night blue, which is exactly why
    // they stood out as "the wrong look" next to tinted plants and sky. A lighter tint
    // amount than plants get (0.6x) keeps fur/feather colour still readable as the
    // species' own colour, rather than washing it out entirely.
    const creatureTint = th.tint ? { color: th.tint, amount: th.tintAmount * 0.6 } : undefined;

    if (creature.zone === 'sky') {
      const pos = flightPosition(input.t, engineW * 0.6, horizonY * 0.5, engineW * 0.1, horizonY * 0.08, 0.3);
      const frame = input.animate && flapFrame(input.t, 2.5, 5) ? busy : idle;
      const fw = frame[0]?.length ?? 1;
      paintCreature(eg, frame, creature.palette, Math.round(pos.x - (fw * creatureScale) / 2), Math.round(pos.y - frame.length * creatureScale), creatureScale, false, creatureTint);
      pushBox('creature', save.slot, pos.x, pos.y - frame.length * creatureScale, fw * creatureScale, frame.length * creatureScale, 0);
      return;
    }

    const motion = groundMotion(input.t, input.grove.seed, save.slot, home, 0.08, input.animate);
    const frame = motion.moving ? busy : idle;
    const fw = frame[0]?.length ?? 1;
    let dy = -motion.idleBob * 0.6 * creatureScale;
    if (creature.body.kind === 'hopper' && motion.moving) {
      dy = -hopHeight(motion.groundCovered, RABBIT_LIKE_HOP, 3 * creatureScale);
    }
    const x = motion.x * engineW;
    const y0 = baseY - frame.length * creatureScale + dy;
    paintCreature(eg, frame, creature.palette, Math.round(x - (fw * creatureScale) / 2), Math.round(y0), creatureScale, motion.facing < 0, creatureTint);
    pushBox('creature', save.slot, x, y0, fw * creatureScale, frame.length * creatureScale, -1);
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
    const cabinScale = (FAR_SCALE + NEAR_GAIN * cabinDepth) * layout.zoom;
    const cabinHaze = Math.min(1, (1 - cabinDepth) * th.hazeStep * 6.5);
    const cx = onRight ? engineW * 0.92 : engineW * 0.08;
    const s = Math.max(0.6, cabinScale);
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
