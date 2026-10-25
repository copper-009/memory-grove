/**
 * Creature sprites.
 *
 * Primary path: a hand-authored character grid, Memory Forest's own technique
 * (`reference/memory-forest/web/visitors.js`'s `VISITORS`) — one character per pixel, `.`
 * for transparent, every other character indexing the sprite's own small fixed `pal`. Every
 * migrated species (`Creature.sprite`) is drawn this way: two frames (idle/resting and a
 * step or busy pose), plus an optional smaller `young` pair hand-drawn separately for the
 * early life stages rather than the adult frames scaled down.
 *
 * Fallback path, `buildProceduralFrames`: the previous approach this replaces — a body
 * described by lengths and angles (`BodyPlan`), filled as overlapping ellipses. Kept only
 * for the ~135 species across the other ten regions not yet given a hand-authored sprite
 * (`DECISIONS.md` § "Region packs" has the full account of the switch and what's migrated so
 * far) — every one of those still needs to render as *something*, not disappear, until it
 * gets the same gallery-reviewed hand-authoring pass Australia's eucalypt woodland got.
 * `scene.ts` prefers `creature.sprite` and only calls the fallback when it's absent.
 */

import type { BodyPlan, Creature, SpriteFrame } from '../regions/types';
import type { LifeStageIndex } from '../data/milestones';

export type Frame = string[];

/** Life stage 0–1 (joey/chick-equivalent) use a sprite's `young` grid when it has one. */
export function framesFor(sprite: NonNullable<Creature['sprite']>, stage: LifeStageIndex): [Frame, Frame] {
  const pair = stage <= 1 && sprite.young ? sprite.young : sprite.frames;
  return [[...pair[0]], [...pair[1]]];
}

const STAGE_SCALE: Record<number, number> = { 0: 0.45, 1: 0.68, 2: 1, 3: 1 };

function grid(w: number, h: number): string[][] {
  return Array.from({ length: h }, () => Array(w).fill('.'));
}
function rowsOf(g: string[][]): Frame {
  return g.map((r) => r.join(''));
}
function put(g: string[][], x: number, y: number, ch: string): void {
  const row = g[Math.round(y)];
  if (!row) return;
  const xi = Math.round(x);
  if (xi < 0 || xi >= row.length) return;
  row[xi] = ch;
}
function hline(g: string[][], x0: number, x1: number, y: number, ch: string): void {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, x, y, ch);
}

/**
 * Fill an ellipse centred at `(cx, cy)`, `w` x `h`. Flat `main` colour through almost the
 * whole body, `dark` only along the lower-back rim — a ground-up redesign away from the
 * previous 3-tone lit-from-above gradient (dark rim all round, light top, main through the
 * middle). Against a simple hand-drawn reference, a creature is close to one flat colour
 * with a single small shadow accent, not a shaded sphere; the gradient version was reading
 * as muddy rather than "put together" at the handful of pixels a creature actually has.
 */
function ellipse(g: string[][], cx: number, cy: number, w: number, h: number, main: string, dark: string): void {
  const rx = Math.max(0.6, w / 2);
  const ry = Math.max(0.6, h / 2);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const q = nx * nx + ny * ny;
      if (q > 1) continue;
      // Only the lower-back quarter (below and slightly behind centre) gets the shadow
      // tone; everywhere else is flat main colour.
      const shadow = ny > 0.35 && q > 0.5;
      put(g, x, y, shadow ? dark : main);
    }
  }
}

/** First colour key in the palette other than the eye key — used as the main body tone. */
function mainKey(palette: Record<string, string>): string {
  return Object.keys(palette).find((k) => k !== 'e') ?? Object.keys(palette)[0] ?? 'b';
}

// Head sizes raised noticeably across the board — a bigger head relative to the body is
// the single clearest "cute" cue the reference's fox and rabbit use, and the previous
// proportions (closer to realistic anatomy) read as plain rather than endearing at the
// tiny sizes a creature is actually drawn at.
const KIND_PROPORTIONS: Record<BodyPlan['kind'], { bodyTilt: number; headScale: number; bodyRound: number }> = {
  quadruped: { bodyTilt: 0, headScale: 0.85, bodyRound: 0.8 },
  hopper: { bodyTilt: -0.15, headScale: 0.8, bodyRound: 0.85 },
  bird: { bodyTilt: 0.1, headScale: 0.7, bodyRound: 0.75 },
  wader: { bodyTilt: 0.05, headScale: 0.55, bodyRound: 0.7 },
  flyer: { bodyTilt: 0, headScale: 0.65, bodyRound: 0.75 },
  frog: { bodyTilt: 0, headScale: 0.95, bodyRound: 0.9 },
  reptile: { bodyTilt: 0, headScale: 0.55, bodyRound: 0.65 },
  swimmer: { bodyTilt: 0, headScale: 0.7, bodyRound: 0.75 },
  bulky: { bodyTilt: 0, headScale: 0.75, bodyRound: 0.85 },
};

/**
 * Build both frames for a not-yet-migrated creature from its `BodyPlan`, at a given life
 * stage — the fallback path, see the module comment. `zoomScale` sizes the whole sprite
 * directly: a creature standing nearer the camera (or a small grove's zoom-in) gets an
 * ASCII grid built bigger in the first place, genuinely more character cells, each one
 * still painted at a small, fixed pixel size, rather than the same small grid blown up by a
 * large per-character paint multiplier (which produced "pixels far too large to make out
 * anything" — a dozen characters blown up is still only a dozen giant flat squares).
 *
 * A hand-authored `CreatureSprite`'s frames are fixed-resolution data instead (there's no
 * "build it bigger" for hand-drawn pixels) — those scale entirely through the paint
 * multiplier at the call site, the same way Memory Forest's own `paintSprite`/`scaledAt`
 * scales its fixed-size `VISITORS` frames up.
 */
export function buildProceduralFrames(creature: Creature, stage: LifeStageIndex, zoomScale = 1): [Frame, Frame] {
  const plan = creature.body;
  const pal = creature.palette;
  if (!plan || !pal) {
    // No BodyPlan and no sprite: nothing to draw. Shouldn't happen (every creature in a
    // region pack has one or the other, checked by validate.ts), but fail quietly to a
    // single-pixel placeholder rather than throwing mid-frame.
    return [['.'], ['.']];
  }
  // TypeScript doesn't carry the `if (!plan || !pal) return` narrowing above into the
  // `drawCommon` closure declared further down (a closure over a `const` can, in principle,
  // run after reassignment elsewhere, so the checker doesn't trust it) — these two aliases
  // are non-optional by construction instead of fighting that with assertions at every use.
  const bodyPlan: BodyPlan = plan;
  const bodyPal: Record<string, string> = pal;
  const scale = (STAGE_SCALE[stage] ?? 1) * zoomScale;
  const [bw, bh] = plan.size;
  const w = Math.max(3, Math.round(bw * scale));
  const h = Math.max(3, Math.round(bh * scale));
  const legs = Math.round((plan.legs ?? 0) * scale);
  const neck = Math.round((plan.neck ?? 0) * scale);
  const tailLen = Math.round((plan.tail?.len ?? 0) * scale);
  const beak = Math.max(0, Math.round((plan.beak ?? 0) * scale * 0.6));
  const ears = Math.round((plan.ears ?? 0) * scale);
  const crest = Math.round((plan.crest ?? 0) * scale);
  const proportions = KIND_PROPORTIONS[plan.kind];

  const main = mainKey(pal);
  const dark = pal.d ? 'd' : main;
  const light = pal.l ? 'l' : undefined;
  const eye = pal.e ? 'e' : dark;
  const beakCol = pal.y ? 'y' : (light ?? main);

  const headR = Math.max(1.4, Math.round(w * proportions.headScale * 0.3));
  const totalW = w + Math.max(neck, beak, tailLen) * 2 + Math.round(headR * 2) + 2;
  const totalH = h + legs + Math.max(neck, crest, ears, Math.round(headR * 2)) + 3;
  const cx = Math.floor(totalW / 2);
  const baseY = totalH - 1 - legs - 1;

  function headCentre(): { x: number; y: number } {
    if (neck > 0) {
      return { x: cx, y: baseY - h / 2 - neck };
    }
    return { x: cx + w / 2 + headR * 0.6, y: baseY - h - headR * 0.2 };
  }

  function drawCommon(legPhase: 0 | 1): Frame {
    const g = grid(totalW, totalH);
    const bodyCy = baseY - h / 2 - legs + proportions.bodyTilt * h;

    // legs: thin, at the belly edge, offset in pairs for a walk cycle
    if (legs > 0) {
      const legN = bodyPlan.kind === 'bird' || bodyPlan.kind === 'wader' ? 2 : 4;
      for (let i = 0; i < legN; i++) {
        const lx = cx - w * 0.3 + (i * w * 0.6) / Math.max(1, legN - 1);
        const offset = legPhase && i % 2 === 0 ? 1 : 0;
        const topY = baseY - legs + offset;
        for (let y = topY; y <= baseY; y++) put(g, Math.round(lx), y, dark);
      }
    } else {
      // legless (swimmer, frog resting): a soft shadow line instead of a hard edge
      ellipse(g, cx, baseY + 0.5, w * 0.8, 1.4, dark, dark);
    }

    // tail, drawn before the body so the body's rump overlaps its base
    if (tailLen > 0) {
      const style = bodyPlan.tail?.style ?? 'down';
      const tx = cx - w / 2 - 1;
      const ty = bodyCy + (style === 'up' || style === 'fan' ? -h * 0.2 : h * 0.15);
      for (let i = 0; i < tailLen; i++) {
        const dy =
          style === 'up'
            ? -i * 0.8
            : style === 'curl'
              ? -Math.sin((i / tailLen) * Math.PI) * 3
              : style === 'bush'
                ? i * 0.1
                : i * 0.25;
        const tcol = style === 'bush' && i > tailLen * 0.4 ? (light ?? main) : dark;
        put(g, tx - i, Math.round(ty + dy), tcol);
        if (style === 'fan' && i === tailLen - 1) {
          for (let f = -2; f <= 2; f++) put(g, tx - i + f * 0.6, Math.round(ty + dy) + Math.abs(f) * 0.5, light ?? main);
        }
        if (style === 'bush') put(g, tx - i, Math.round(ty + dy) - 1, tcol);
      }
    }

    // body: a compact, rounded ellipse — `bodyRound` pulls height up toward width instead
    // of the more realistic (and less cute) elongated oval the old proportions gave every
    // kind. Flat colour, shaded only at the lower-back rim (see ellipse()'s own comment).
    const bodyW = w * (bodyPlan.kind === 'bird' || bodyPlan.kind === 'wader' ? 0.85 : 1);
    const bodyH = Math.max(bodyW * proportions.bodyRound, h * (bodyPlan.kind === 'bird' || bodyPlan.kind === 'wader' ? 0.8 : 1));
    ellipse(g, cx, bodyCy, bodyW, bodyH, main, dark);

    // A bold, clearly visible accent patch — a belly, chest or tail-tip marking — on every
    // kind that has one defined, not just birds. This is the single detail that turns a
    // flat colour blob into a specific, recognisable little animal (the reference fox's
    // white chest, the rabbit's white tail) rather than a uniform silhouette.
    if (bodyPal.w) {
      // Same colour for both ellipse() params: a patch this small (often just a handful of
      // pixels) picking up its own internal shadow sub-tone was exactly what produced a
      // blocky diamond artefact instead of a soft accent marking — there's no room for two
      // tones to read as shading at that size, only as noise.
      ellipse(g, cx, bodyCy + bodyH * 0.22, Math.max(2.4, bodyW * 0.5), Math.max(2, bodyH * 0.42), 'w', 'w');
    }

    // neck, as a short thick line connecting body to head
    const head = headCentre();
    if (neck > 0) {
      const steps = Math.max(1, Math.round(neck));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const y = bodyCy - bodyH / 2 - (neck - i);
        const nx = cx + (head.x - cx) * t * 0.3;
        put(g, Math.round(nx), Math.round(y), main);
        put(g, Math.round(nx) + 1, Math.round(y), dark);
      }
    }

    // head: a smaller ellipse, with eye and beak/snout
    ellipse(g, head.x, head.y, headR * 2, headR * 1.8, light ?? main, dark);
    put(g, Math.round(head.x + headR * 0.5), Math.round(head.y - headR * 0.1), eye);
    if (beak > 0) hline(g, Math.round(head.x + headR * 0.7), Math.round(head.x + headR * 0.7 + beak), Math.round(head.y), beakCol);

    // ears: two small ticks above the head
    if (ears > 0) {
      put(g, Math.round(head.x - headR * 0.5), Math.round(head.y - headR - ears * 0.6), dark);
      put(g, Math.round(head.x + headR * 0.2), Math.round(head.y - headR - ears * 0.6), dark);
    }
    // crest: a short tuft above the head
    if (crest > 0) {
      for (let i = 0; i < crest; i++) {
        put(g, Math.round(head.x), Math.round(head.y - headR - 1 - i), beakCol);
      }
    }
    // spines (echidna-style): along the back
    if (bodyPlan.spines) {
      for (let x = -bodyW / 2; x <= bodyW / 2; x += 1.6) {
        put(g, Math.round(cx + x), Math.round(bodyCy - bodyH / 2 - 1), dark);
      }
    }

    return rowsOf(g);
  }

  return [drawCommon(0), drawCommon(1)];
}

/**
 * Build both frames for a creature at a given life stage — `creature.sprite`'s hand-drawn
 * grid when present, the procedural `BodyPlan` fallback otherwise. `zoomScale` only affects
 * the fallback path (see `buildProceduralFrames`); a hand sprite's own fixed frames are
 * returned as-is and the caller scales them with an integer paint multiplier instead.
 */
export function buildCreatureFrames(creature: Creature, stage: LifeStageIndex, zoomScale = 1): [Frame, Frame] {
  if (creature.sprite) return framesFor(creature.sprite, stage);
  return buildProceduralFrames(creature, stage, zoomScale);
}

/** Scale for how the given plan prefers to be laid out — exported for the painter's bounds. */
export function frameSize(frame: Frame): [number, number] {
  return [frame[0]?.length ?? 0, frame.length];
}

export type { BodyPlan, SpriteFrame };
