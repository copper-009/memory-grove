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
import { Stage, STAGE_HEIGHT } from '../data/types';
import { layoutGrove, placeItem, isPond, GROUND_BOTTOM } from './layout';
import type { Layout, LayoutItem } from './layout';
import { buildTheme } from './theme';
import type { Theme, MoodInput } from './theme';
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
import { hashStr } from './rng';
import { hex, mix, mixHex, BAYER4 } from './color';

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
}

export interface DrawResult {
  boxes: HitBox[];
}

/**
 * Width of the internal drawing buffer, in engine pixels. Everything — sky, ground, every
 * sprite — is drawn at this resolution, then the whole buffer is scaled up to the real
 * canvas in one `drawImage` call with smoothing off. This is the number that controls how
 * "chunky" the pixel art reads; Memory Forest's own web build works at a comparable scale.
 */
const ENGINE_WIDTH = 220;

const RABBIT_LIKE_HOP = 0.08;

/**
 * Share of engine height where solid ground ends and the water-reflection band begins.
 * `layout.GROUND_BOTTOM` (0.965) still marks the very bottom of the whole frame — this is
 * a nearer line, leaving the gap between the two for the reflection.
 */
const LAND_BOTTOM = 0.78;

/** A dithered two-tone fill between `a` and `b`, textured with a 4x4 Bayer pattern rather
 * than a smooth gradient — this is what makes a flat area (sky, ground) read as pixel art
 * instead of a CSS gradient once it's scaled up blocky. */
function ditherFill(g: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, a: string, b: string, t: number): void {
  const rgbA = hex(a);
  const rgbB = hex(b);
  const col = mix(rgbA, rgbB, t);
  g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
  g.fillRect(x0, y0, w, h);
}

/** Sky: six-stop gradient approximated as dithered horizontal bands, plus a hard-edged
 * sun/moon disc with a soft halo glow around it (the original always draws a crisp disc
 * first, then a separate glow — a glow alone, with no disc, is what reads as "just blurry"). */
function drawSky(g: CanvasRenderingContext2D, W: number, horizonY: number, th: Theme, t: number): void {
  const stops = th.sky;
  const bands = Math.max(8, Math.round(horizonY));
  for (let y = 0; y < bands; y++) {
    const p = (y / Math.max(1, bands - 1)) * (stops.length - 1);
    const i0 = Math.min(stops.length - 2, Math.floor(p));
    const f = p - i0;
    // dither the transition between adjacent stops by row, using a Bayer threshold so the
    // band edges break up rather than banding cleanly (which itself looks more "gradient")
    const dith = BAYER4[(y % 4) * 4] / 16;
    const tt = f > dith ? 1 : 0;
    ditherFill(g, 0, Math.floor((y / bands) * horizonY), W, Math.ceil(horizonY / bands) + 1, stops[i0], stops[i0 + 1], tt);
  }

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
function drawHills(g: CanvasRenderingContext2D, W: number, horizonY: number, farColor: string, groundColor: string): void {
  const hillColor = mix(hex(farColor), hex(groundColor), 0.3);
  g.fillStyle = `rgb(${hillColor[0] | 0},${hillColor[1] | 0},${hillColor[2] | 0})`;
  const base = horizonY + horizonY * 0.1;
  const amp = horizonY * 0.14;
  for (let x = 0; x < W; x++) {
    const p = x / W;
    const bump = 0.6 * Math.sin(p * Math.PI * 2.3 + 1.3) + 0.4 * Math.sin(p * Math.PI * 5.1 + 0.4);
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
  drawHills(g, W, horizonY, farCol, g0);

  const top = horizonY + (landBottomY - horizonY) * 0.18;
  const rows = Math.max(6, Math.round(landBottomY - top));
  for (let y = 0; y < rows; y++) {
    const p = y / rows;
    const dith = BAYER4[(y % 4) * 4 + 1] / 16;
    ditherFill(g, 0, Math.round(top + y), W, 2, g0, g1, p > dith ? Math.min(1, p + 0.15) : p);
  }
}

/**
 * Mirror the land band (sky's lower edge through ground, trees and creatures — everything
 * already drawn onto `canvas`) into the band below `landBottomY`, tinted with the theme's
 * water colour. This is Memory Forest's signature "lake" look: the whole treeline
 * reflected, not just scattered ponds. Drawing the canvas onto itself, flipped and
 * clipped, is cheap at engine resolution and needs no second render pass.
 */
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

function stageHeightPx(stage: Stage, scale: number): number {
  return Math.max(3, Math.round(STAGE_HEIGHT[stage] * scale));
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

  const th = buildTheme(input.mood, { streak: input.grove.stats.streak, todayReviews: input.grove.stats.todayReviews });
  const visual = visualParamsFor(input.visualHealth);
  const horizonY = engineH * 0.42;
  // Land ends at LAND_BOTTOM; the frame's true bottom (GROUND_BOTTOM) is reserved for the
  // water-reflection band when this biome has one — see Biome.hasWater.
  const landBottomY = engineH * LAND_BOTTOM;
  const frameBottomY = engineH * GROUND_BOTTOM;
  const groundBottomY = input.biome.hasWater ? landBottomY : frameBottomY;

  drawSky(eg, engineW, horizonY, th, input.t);
  drawGround(eg, engineW, horizonY, groundBottomY, input.biome.ground, th, visual);

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
    const tone = buildToneMap(plant, species.form);
    const hPx = stageHeightPx(plant.stage, zoomedScale);
    const spriteK = Math.max(1, Math.round(hPx / Math.max(1, tone.h)));
    const x0 = Math.round(placed.x - (tone.w * spriteK) / 2);
    const y0 = Math.round(placed.y - tone.h * spriteK);
    paintPlant(eg, tone, species, {
      stage: plant.stage,
      health: plant.health,
      seed: plant.seed,
      variant: plant.variant,
      haze: Math.min(1, placed.haze * th.hazeStep * 4),
      hazeColor: th.haze,
      tint: th.tint ?? undefined,
      tintAmount: th.tintAmount,
      snow: th.snow,
    }, x0, y0, spriteK);
    pushBox('plant', plant.index, placed.x, y0, tone.w * spriteK, tone.h * spriteK, item.depth);
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

    if (creature.zone === 'sky') {
      const pos = flightPosition(input.t, engineW * 0.6, horizonY * 0.5, engineW * 0.1, horizonY * 0.08, 0.3);
      const frame = input.animate && flapFrame(input.t, 2.5, 5) ? busy : idle;
      const fw = frame[0]?.length ?? 1;
      paintCreature(eg, frame, creature.palette, Math.round(pos.x - (fw * creatureScale) / 2), Math.round(pos.y - frame.length * creatureScale), creatureScale);
      pushBox('creature', save.slot, pos.x, pos.y - frame.length * creatureScale, fw * creatureScale, frame.length * creatureScale, 0);
      return;
    }

    const motion = groundMotion(input.t, input.grove.seed, save.slot, home, 0.06, input.animate);
    const frame = motion.moving ? busy : idle;
    const fw = frame[0]?.length ?? 1;
    let dy = 0;
    if (creature.body.kind === 'hopper' && motion.moving) {
      dy = -hopHeight(motion.groundCovered, RABBIT_LIKE_HOP, 3 * creatureScale);
    }
    const x = motion.x * engineW;
    const y0 = baseY - frame.length * creatureScale + dy;
    paintCreature(eg, frame, creature.palette, Math.round(x - (fw * creatureScale) / 2), Math.round(y0), creatureScale, motion.facing < 0);
    pushBox('creature', save.slot, x, y0, fw * creatureScale, frame.length * creatureScale, -1);
  });

  if (hasCabin(input.grove.stats)) {
    const cx = engineW * 0.08;
    const cy = groundBottomY - 2;
    const s = Math.max(1, Math.round(layout.zoom));
    eg.fillStyle = '#6a4a32';
    eg.fillRect(Math.round(cx - 7 * s), Math.round(cy - 8 * s), 14 * s, 8 * s);
    eg.fillStyle = '#8a3a2e';
    eg.beginPath();
    eg.moveTo(cx - 9 * s, cy - 8 * s);
    eg.lineTo(cx, cy - 14 * s);
    eg.lineTo(cx + 9 * s, cy - 8 * s);
    eg.fill();
    pushBox('plant', -1, cx, cy - 14 * s, 18 * s, 14 * s, -2);
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
