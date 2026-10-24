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

export function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255];
}

/**
 * Raise a colour's saturation (and, lightly, scoot its lightness toward mid-tone) by
 * `amount` (0 = unchanged, 1 = fully saturated). Plain RGB lerps — `mix`/`mixHex` above,
 * used throughout this renderer for lighting, tint and haze — desaturate toward grey/brown
 * every time two different hues blend, which is the actual mechanism behind colours
 * reading as "not vibrant enough" and "doesn't look real": real daylight doesn't wash a
 * green field toward khaki the way a 30%-weighted RGB blend does. Call this after a blend
 * to put the saturation a flat lerp always strips back.
 */
export function vivify(c: RGB, amount: number): RGB {
  const [h, s, l] = rgbToHsl(c);
  const s2 = clamp(s + (1 - s) * amount, 0, 1);
  return hslToRgb(h, s2, l);
}

export function vivifyHex(hexColor: string, amount: number): string {
  return toHex(vivify(hex(hexColor), amount));
}

/**
 * Two tones that are genuinely shades of each other — same hue, same saturation, only
 * lightness differs — rather than two independently-computed colours that merely end up
 * close. "I want just the simple 2 tone, with the two tones being shades of one another, or
 * closely related": mixing a biome colour and a theme colour separately for each of a
 * ground's two dither tones (the previous approach) can drift them toward subtly different
 * hues even when each individual blend looks reasonable, which reads as "still multiple
 * colours" rather than one colour in two lightnesses. This derives both tones from a single
 * base colour, so that can't happen. `spread` is the lightness delta (0..1) between the two;
 * the lighter tone comes first.
 */
export function shadePair(base: RGB, spread: number): [RGB, RGB] {
  const [h, s, l] = rgbToHsl(base);
  const light = hslToRgb(h, s, clamp(l + spread / 2, 0, 1));
  const dark = hslToRgb(h, s, clamp(l - spread / 2, 0, 1));
  return [light, dark];
}
