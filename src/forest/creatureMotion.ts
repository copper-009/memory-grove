/**
 * Creature movement: calm, deliberate, and locked to ground covered rather than to the
 * clock, so feet never slide. Pure functions of time — `positionAt(t)` — so the behaviour
 * is fully unit-testable without a render loop or `requestAnimationFrame`.
 *
 * Ported from Memory Forest's `web/visitors.js`: each animal gets its own stretch of
 * ground, wanders to a new spot every few minutes, and animates its stride by distance
 * covered, not elapsed time.
 */

import { rng, hashInt } from './rng';

export const ROAM_EVERY_S = 150;
export const ROAM_STAGGER_S = 41;
export const ROAM_OFFSET_S = 37;
export const WALK_SPEED_UNITS_PER_S = 7;
export const STRIDE_SHARE = 0.25;
export const ROAM_REACH_SHARE = 0.045;
/** A resting creature shows its idle/glance frame while this slow sine is above the line. */
export const IDLE_GLANCE_THRESHOLD = 0.93;
export const FRAME_FPS = 6; // within the brief's 4-8 fps range for sprite cycles

export interface MotionState {
  /** 0..1 position along the creature's home stretch. */
  x: number;
  /** Ground covered since the last stop, for stride-locked leg frames. */
  groundCovered: number;
  moving: boolean;
  facing: 1 | -1;
  /** Which animation frame to show, 0 = idle/default, 1 = alternate (walk/glance). */
  frame: number;
}

/** A deterministic "spot" the creature wanders to on its `n`th outing. */
function spotFor(daySeed: number, slotIndex: number, home: number, reach: number, n: number): number {
  const r = rng(hashInt(hashInt(daySeed, slotIndex * 104729), n * 7919));
  return home + (r() - 0.5) * 2 * reach;
}

/**
 * Where a ground-dwelling creature stands at time `t` (seconds since the scene opened),
 * wandering within `reach` of its `home` position (both 0..1 shares of the available width).
 * `slotIndex` offsets its roam cycle so creatures never all set off together.
 */
export function groundMotion(
  t: number,
  daySeed: number,
  slotIndex: number,
  home: number,
  reach: number = ROAM_REACH_SHARE,
  animate = true,
): MotionState {
  if (!animate) {
    return { x: home, groundCovered: 0, moving: false, facing: 1, frame: 0 };
  }
  const period = ROAM_EVERY_S + slotIndex * ROAM_STAGGER_S;
  const shifted = t + slotIndex * ROAM_OFFSET_S;
  const n = Math.floor(shifted / period);
  const phase = shifted - n * period;

  const from = spotFor(daySeed, slotIndex, home, reach, n - 1);
  const to = spotFor(daySeed, slotIndex, home, reach, n);
  const dist = Math.abs(to - from);
  // dist is a share of width; WALK_SPEED is in engine units, so the caller scales this,
  // but for a share-of-width model we treat width as the unit distance already.
  const walkDuration = dist > 0 ? dist / (WALK_SPEED_UNITS_PER_S * 0.01) : 0;
  const moving = phase < walkDuration && dist > 0.001;
  const q = moving ? phase / walkDuration : 1;
  const x = from + (to - from) * q;
  const groundCovered = dist * q;
  const facing: 1 | -1 = to >= from ? 1 : -1;

  let frame = 0;
  if (moving) {
    const strideLen = Math.max(0.01, reach * STRIDE_SHARE);
    frame = Math.floor(groundCovered / strideLen) % 2;
  } else {
    const glance = Math.sin(t * 0.7 + slotIndex * 2.1);
    frame = glance > IDLE_GLANCE_THRESHOLD ? 1 : 0;
  }

  return { x, groundCovered, moving, facing, frame };
}

/** A hopper (rabbit-style) bounces in fixed-length hops rather than striding continuously. */
export function hopHeight(groundCovered: number, hopLenShare: number, hopHeightPx: number): number {
  if (hopLenShare <= 0) return 0;
  const phase = (groundCovered / hopLenShare) % 1;
  return Math.abs(Math.sin(phase * Math.PI)) * hopHeightPx;
}

/** A flyer circling a fixed point in the sky — eagles, condors, flying foxes at dusk. */
export function flightPosition(t: number, cx: number, cy: number, rx: number, ry: number, turnRadPerS: number): { x: number; y: number } {
  const a = t * turnRadPerS;
  return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
}

/** Which of two sprite frames a flyer shows, flapping at a slow, deliberate rate. */
export function flapFrame(t: number, flapFps: number, flapEverySteps: number): number {
  return Math.floor(t * flapFps) % flapEverySteps === 0 ? 1 : 0;
}

// Whether a creature should be visible given the time of day and its activity pattern is
// decided by `creatureMood` in `src/data/milestones.ts` — that is the single source of
// truth for day/night visibility, so it isn't duplicated here.
