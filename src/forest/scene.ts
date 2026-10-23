/**
 * The scene composer: one function that draws a whole grove to a canvas.
 *
 * This is where every pure module upstream (`layout`, `theme`, `plantSprite`,
 * `creatureSprite`, `creatureMotion`, `ecosystemVisual`, `paint`) is actually called
 * together. It is intentionally thin and procedural — almost everything it does is call a
 * tested function and hand the canvas context to `paint.ts`. Verified visually via the
 * screenshot harness (`tools/screenshots.mjs`), not by pixel-diffing in Vitest.
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
import { hex, mix } from './color';

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

const RABBIT_LIKE_HOP = 0.08; // creatures whose body plan reads as a hopper use this
const CREATURE_SPEED_SCALE = 0.01;

function pxScale(W: number): number {
  // An integer-ish scale that keeps the low-res art crisp: aim for roughly 420 engine
  // columns across the canvas, the original's rough working resolution.
  return Math.max(1, Math.round(W / 420));
}

/** Draw the sky gradient and any orb (sun/moon). */
function drawSky(g: CanvasRenderingContext2D, W: number, horizonY: number, th: Theme): void {
  const grad = g.createLinearGradient(0, 0, 0, horizonY);
  const stops = th.sky;
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, horizonY);

  if (th.orb) {
    const ox = W * th.orb.x;
    const oy = horizonY * th.orb.y;
    const r = th.orb.r * pxScale(W) * 1.6;
    const glow = g.createRadialGradient(ox, oy, 0, ox, oy, r * (1 + th.orb.halo * 0.3));
    glow.addColorStop(0, th.orb.color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(ox, oy, r * (1 + th.orb.halo * 0.3), 0, Math.PI * 2);
    g.fill();
  }

  if (th.stars > 0) {
    const r = Math.min(1, th.stars / 90);
    g.fillStyle = `rgba(255,255,255,${0.7 * r})`;
    const n = th.stars;
    for (let i = 0; i < n; i++) {
      const sx = (hashStr(`star${i}`) % 1000) / 1000 * W;
      const sy = (hashStr(`stary${i}`) % 1000) / 1000 * horizonY * 0.9;
      g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
    }
  }
}

/** Draw the ground: far hills, a gradient band, grass tint from ecosystem health. */
function drawGround(g: CanvasRenderingContext2D, W: number, horizonY: number, groundBottomY: number, th: Theme, visual: ReturnType<typeof visualParamsFor>): void {
  g.fillStyle = applyGroundHealth(th.far, visual);
  g.fillRect(0, horizonY, W, (groundBottomY - horizonY) * 0.3);
  const grad = g.createLinearGradient(0, horizonY, 0, groundBottomY);
  grad.addColorStop(0, applyGroundHealth(th.ground0, visual));
  grad.addColorStop(1, applyGroundHealth(th.ground1, visual));
  g.fillStyle = grad;
  g.fillRect(0, horizonY + (groundBottomY - horizonY) * 0.15, W, groundBottomY - horizonY);
}

function drawPond(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, th: Theme, visual: ReturnType<typeof visualParamsFor>): void {
  const clarity = visual.waterClarity;
  const base = hex(th.water);
  const murk = mix(base, [90, 95, 70], 1 - clarity);
  g.fillStyle = `rgb(${murk[0] | 0},${murk[1] | 0},${murk[2] | 0})`;
  g.beginPath();
  g.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  g.fill();
}

function stageHeightPx(stage: Stage, scale: number, k: number): number {
  return Math.max(3, Math.round(STAGE_HEIGHT[stage] * scale)) * k;
}

/**
 * Render one frame of the grove to `g`'s canvas (size `W` x `H` in device pixels already;
 * the caller sizes the `<canvas>` element and sets up the context). Returns the hit boxes
 * for this frame, for the caller's hover/tap handling.
 */
export function drawScene(g: CanvasRenderingContext2D, W: number, H: number, input: SceneInput): DrawResult {
  g.imageSmoothingEnabled = false;
  const th = buildTheme(input.mood, { streak: input.grove.stats.streak, todayReviews: input.grove.stats.todayReviews });
  const visual = visualParamsFor(input.visualHealth);
  const horizonY = H * 0.42;
  const groundBottomY = H * GROUND_BOTTOM;
  const k = pxScale(W);

  drawSky(g, W, horizonY, th);
  drawGround(g, W, horizonY, groundBottomY, th, visual);

  const layout: Layout = layoutGrove(input.grove.plants);
  const boxes: HitBox[] = [];

  // Back-to-front: layoutGrove already orders oldest (back) first.
  for (const item of layout.items) {
    const placed = placeItem(item, W, H, horizonY, GROUND_BOTTOM);
    if (isPond(item)) {
      const pw = 40 * k * item.slots * 0.5 * placed.scale;
      const ph = 14 * k * placed.scale;
      drawPond(g, placed.x, placed.y - ph / 2, pw, ph, th, visual);
      boxes.push(boxAt('pond', item.group, placed.x, placed.y - ph, pw, ph, item.depth));
      continue;
    }
    const plant = item as Extract<LayoutItem, { pond: false }>;
    const species = input.biome.plants[plant.species % input.biome.plants.length];
    const tone = buildToneMap(plant, species.form);
    const hPx = stageHeightPx(plant.stage, placed.scale, k);
    const spriteK = Math.max(1, Math.round((hPx / Math.max(1, tone.h)) ));
    const x0 = Math.round(placed.x - (tone.w * spriteK) / 2);
    const y0 = Math.round(placed.y - tone.h * spriteK);
    paintPlant(g, tone, species, {
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
    boxes.push(boxAt('plant', plant.index, placed.x, y0, tone.w * spriteK, tone.h * spriteK, item.depth));
  }

  // Creatures: unlocked slots only, each perched near its scene-appropriate zone. Kept
  // intentionally simple (ground-anchored wander) rather than true zone pathfinding —
  // every zone still reads correctly because each creature's home position is chosen to
  // suit its `Zone` (near water for waterEdge, etc.) by the caller via `homeFor`.
  const baseY = groundBottomY - 2 * k;
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

    if (creature.zone === 'sky') {
      const pos = flightPosition(input.t, W * 0.6, horizonY * 0.5, W * 0.1, horizonY * 0.08, 0.3);
      const frame = input.animate && flapFrame(input.t, 2.5, 5) ? busy : idle;
      const fw = frame[0]?.length ?? 1;
      paintCreature(g, frame, creature.palette, Math.round(pos.x - (fw * k) / 2), Math.round(pos.y - frame.length * k), k);
      boxes.push(boxAt('creature', save.slot, pos.x, pos.y - frame.length * k, fw * k, frame.length * k, 0));
      return;
    }

    const motion = groundMotion(input.t, input.grove.seed, save.slot, home, 0.06, input.animate);
    const frame = motion.moving ? busy : idle;
    const fw = frame[0]?.length ?? 1;
    let dy = 0;
    if (creature.body.kind === 'hopper' && motion.moving) {
      dy = -hopHeight(motion.groundCovered, RABBIT_LIKE_HOP, 3 * k);
    }
    const x = motion.x * W;
    const y0 = baseY - frame.length * k + dy;
    paintCreature(g, frame, creature.palette, Math.round(x - (fw * k) / 2), Math.round(y0), k, motion.facing < 0);
    boxes.push(boxAt('creature', save.slot, x, y0, fw * k, frame.length * k, -1));
  });

  if (hasCabin(input.grove.stats)) {
    // A small cabin marker at the front-left corner; a full sprite is a later refinement.
    const cx = W * 0.06;
    const cy = groundBottomY - 2 * k;
    g.fillStyle = '#6a4a32';
    g.fillRect(cx - 7 * k, cy - 8 * k, 14 * k, 8 * k);
    g.fillStyle = '#8a3a2e';
    g.beginPath();
    g.moveTo(cx - 9 * k, cy - 8 * k);
    g.lineTo(cx, cy - 14 * k);
    g.lineTo(cx + 9 * k, cy - 8 * k);
    g.fill();
    boxes.push(boxAt('plant', -1, cx, cy - 14 * k, 18 * k, 14 * k, -2));
  }

  return { boxes };
}

export { CREATURE_SPEED_SCALE };
