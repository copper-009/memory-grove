/**
 * Colour helpers for the renderer. Ported from Memory Forest's `web/util.js`, which this
 * is functionally identical to: everything downstream (tone maps, haze, tinting, snow)
 * works in plain `[r,g,b]` triples so it can be mixed and faded with simple lerps.
 */

export type RGB = [number, number, number];

export function hex(h: string): RGB {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function toHex(c: RGB): string {
  return (
    '#' +
    c
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function mixHex(a: string, b: string, t: number): string {
  return toHex(mix(hex(a), hex(b), t));
}

export function rgba(c: RGB, a = 1): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

/** Perceptual-ish luminance, for deciding a readable text colour against a fill. */
export function luminance(c: RGB): number {
  return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
}

/** A 4x4 Bayer dither matrix, for soft gradients drawn in flat pixel blocks. */
export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
