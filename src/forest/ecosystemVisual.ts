/**
 * Ecosystem health, translated into scene-wide visual parameters.
 *
 * This is the layer the brief asks for that the original doesn't have: health drives the
 * *whole scene* (grass saturation, water clarity, undergrowth density, how many creatures
 * are out, ambient particles), not just individual plant colour. Kept pure so every band
 * can be screenshotted and compared without a render pass — see `screenshots/`.
 */

import { healthBand } from '../data/health';
import type { HealthBand } from '../data/health';
import { mixHex } from './color';

export interface VisualParams {
  band: HealthBand;
  /** 0..1 multiplier on ground/grass colour saturation. */
  grassSaturation: number;
  /** 0..1: how clear the water looks (reflections vs. a duller, stiller surface). */
  waterClarity: number;
  /** 0..1 share of the understory's decorative items actually drawn. */
  understoryDensity: number;
  /** 0..1 share of creatures currently "out" rather than hiding/resting. */
  creatureActivity: number;
  /** Ambient particle count (fireflies, butterflies...) multiplier, 0..1. */
  ambienceGain: number;
  /** Ground tint applied when health is low — a dry, dulled cast, never literal decay. */
  groundTint: { color: string; amount: number } | null;
}

/** Desaturate a hex colour towards grey by `amount` (0..1). */
function desaturate(colorHex: string, amount: number): string {
  // Mixing towards a mid-grey derived from the colour's own luminance keeps hue roughly
  // put while killing vibrancy — cheaper than a full HSL round-trip and good enough at
  // this pixel scale.
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  const l = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
  const grey = `#${[l, l, l].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return mixHex(colorHex, grey, amount);
}

export function visualParamsFor(visualHealth: number): VisualParams {
  const h = Math.max(0, Math.min(100, visualHealth)) / 100;
  const band = healthBand(visualHealth);
  return {
    band,
    grassSaturation: 0.4 + 0.6 * h,
    waterClarity: 0.3 + 0.7 * h,
    understoryDensity: Math.pow(h, 0.7),
    creatureActivity: 0.3 + 0.7 * h,
    ambienceGain: h,
    groundTint: h < 0.85 ? { color: '#9a8a60', amount: (1 - h) * 0.4 } : null,
  };
}

/** Apply a `VisualParams`'s grass/ground tinting to a base colour. */
export function applyGroundHealth(baseColorHex: string, params: VisualParams): string {
  let c = desaturate(baseColorHex, 1 - params.grassSaturation);
  if (params.groundTint) c = mixHex(c, params.groundTint.color, params.groundTint.amount);
  return c;
}
