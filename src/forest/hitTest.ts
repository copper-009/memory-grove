/**
 * Hit-testing: which sprite a hover or tap point lands on, frontmost first.
 *
 * Pure geometry over axis-aligned boxes collected during a draw (`scene.ts` populates
 * `HitBox[]` as it places each sprite) — no canvas pixel reads, so it works identically on
 * a touch tap and a mouse hover and is fully unit-testable.
 */

export type HitKind = 'plant' | 'pond' | 'creature' | 'sky' | 'ground';

export interface HitBox {
  kind: HitKind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Index into whatever list the caller used to build this box (a plant, a creature...). */
  ref: number;
  /** Lower depth (closer to camera) wins when boxes overlap. */
  depth: number;
}

function contains(b: HitBox, x: number, y: number): boolean {
  return x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1;
}

/**
 * The frontmost box containing `(x, y)`, or `undefined`. Boxes are tried in the order
 * given, but among boxes that both contain the point, the one with the lower `depth` (i.e.
 * nearer the camera) wins — this is what makes overlapping sprites pick sensibly rather
 * than by draw order alone.
 */
export function hitTest(boxes: readonly HitBox[], x: number, y: number): HitBox | undefined {
  let best: HitBox | undefined;
  for (const b of boxes) {
    if (!contains(b, x, y)) continue;
    if (!best || b.depth < best.depth) best = b;
  }
  return best;
}

/** Build a box for an item centred at `(cx, cy)` with pixel size `w` x `h`. */
export function boxAt(kind: HitKind, ref: number, cx: number, topY: number, w: number, h: number, depth: number): HitBox {
  return { kind, ref, depth, x0: cx - w / 2, x1: cx + w / 2, y0: topY, y1: topY + h };
}
