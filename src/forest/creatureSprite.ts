/**
 * Creature sprites: ASCII rows generated from a `BodyPlan`, in the same format Memory
 * Forest's hand-drawn animals use (`web/visitors.js`) — one character per pixel, `.` for
 * transparent, every other character indexing the creature's own `Palette`.
 *
 * A `BodyPlan` (lengths and angles of named parts) generates the frame rather than an
 * artist drawing each of 143 species by hand — the only way that many creatures can be
 * both visually consistent and schema-checked (`src/regions/validate.ts`). See
 * `DECISIONS.md` § "Art and assets".
 *
 * Two frames per creature: 0 = idle/standing, 1 = the "busy" frame (walking leg position,
 * a graze, a wing-flap). `scene.ts` picks between them using `creatureMotion.ts`.
 */

import type { BodyPlan, Creature } from '../regions/types';
import type { LifeStageIndex } from '../data/milestones';

export type Frame = string[];

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
function body(g: string[][], cx: number, cy: number, w: number, h: number, ch: string, chD: string): void {
  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(cy - h / 2);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const edge = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1;
      put(g, x, y, edge ? chD : ch);
    }
  }
}

/** First colour key in the palette other than the eye/dark keys — used as the main body tone. */
function mainKey(palette: Record<string, string>): string {
  const skip = new Set(['e']);
  return Object.keys(palette).find((k) => !skip.has(k)) ?? 'b';
}

/**
 * Build both frames for a creature at a given life stage. The body plan drives size; the
 * `kind` picks which of eight layout routines assembles the parts.
 */
export function buildCreatureFrames(creature: Creature, stage: LifeStageIndex): [Frame, Frame] {
  const plan = creature.body;
  const scale = STAGE_SCALE[stage] ?? 1;
  const [bw, bh] = plan.size;
  const w = Math.max(3, Math.round(bw * scale));
  const h = Math.max(3, Math.round(bh * scale));
  const legs = Math.round((plan.legs ?? 0) * scale);
  const neck = Math.round((plan.neck ?? 0) * scale);
  const tailLen = Math.round((plan.tail?.len ?? 0) * scale);
  const beak = Math.round((plan.beak ?? 0) * scale);
  const ears = Math.round((plan.ears ?? 0) * scale);
  const crest = Math.round((plan.crest ?? 0) * scale);

  const pal = creature.palette;
  const main = mainKey(pal);
  const dark = pal.d ? 'd' : main;
  const light = pal.l ? 'l' : main;
  const eye = pal.e ? 'e' : dark;

  const totalW = w + Math.max(neck, beak, tailLen) * 2 + 4;
  const totalH = h + legs + Math.max(neck, crest, ears) + 4;
  const cx = Math.floor(totalW / 2);
  const baseY = totalH - 1 - legs;

  function drawCommon(legPhase: 0 | 1): Frame {
    const g = grid(totalW, totalH);
    // legs
    if (legs > 0) {
      const legN = plan.kind === 'bird' || plan.kind === 'wader' ? 2 : 4;
      for (let i = 0; i < legN; i++) {
        const lx = cx - w / 4 + (i % 2) * (w / 2);
        const offset = legPhase && i % 2 === 0 ? 1 : 0;
        for (let y = baseY - legs + offset; y <= baseY; y++) put(g, Math.round(lx), y, dark);
      }
    }
    // body
    body(g, cx, baseY - h / 2 - legs, w, h, main, dark);
    // neck + head
    if (neck > 0) {
      const headY = baseY - legs - h / 2 - neck;
      hline(g, cx, cx, headY, main);
      for (let y = headY; y < baseY - legs - h / 2; y++) put(g, cx, y, main);
      body(g, cx, headY, Math.max(2, Math.round(w * 0.3)), Math.max(2, Math.round(w * 0.3)), light, dark);
      if (eye) put(g, cx + 1, headY, eye);
      if (beak > 0) hline(g, cx + 1, cx + 1 + beak, headY, pal.y ? 'y' : light);
    } else {
      const headY = baseY - legs - h - Math.max(1, Math.round(h * 0.25));
      body(g, cx + w / 3, headY, Math.max(2, Math.round(w * 0.35)), Math.max(2, Math.round(h * 0.5)), light, dark);
      if (eye) put(g, Math.round(cx + w / 3 + 1), headY, eye);
      if (beak > 0) hline(g, Math.round(cx + w / 3 + 1), Math.round(cx + w / 3 + 1 + beak), headY, pal.y ? 'y' : light);
    }
    // ears / crest
    if (ears > 0) {
      const headY = neck > 0 ? baseY - legs - h / 2 - neck : baseY - legs - h - Math.round(h * 0.25);
      put(g, cx - 1, headY - ears, dark);
      put(g, cx + 1, headY - ears, dark);
    }
    if (crest > 0) {
      const headY = neck > 0 ? baseY - legs - h / 2 - neck : baseY - legs - h - Math.round(h * 0.25);
      for (let i = 0; i < crest; i++) put(g, cx, headY - 1 - i, pal.y ? 'y' : light);
    }
    // tail
    if (tailLen > 0) {
      const style = plan.tail?.style ?? 'down';
      const tx = cx - Math.round(w / 2) - 1;
      const ty = baseY - legs - (style === 'up' || style === 'fan' ? h : Math.round(h * 0.3));
      for (let i = 0; i < tailLen; i++) {
        const dy = style === 'up' ? -i : style === 'curl' ? -Math.round(Math.sin((i / tailLen) * Math.PI) * 3) : i * 0.15;
        put(g, tx - (style === 'fan' ? Math.round(i * 0.4) : i), Math.round(ty + dy), dark);
        if (style === 'fan' && i === tailLen - 1) {
          for (let f = -2; f <= 2; f++) put(g, tx - i + f, Math.round(ty + dy) + f, light);
        }
      }
    }
    // spines (echidna-style)
    if (plan.spines) {
      for (let x = cx - w / 2; x <= cx + w / 2; x += 2) put(g, Math.round(x), Math.round(baseY - legs - h - 1), dark);
    }
    return rowsOf(g);
  }

  return [drawCommon(0), drawCommon(1)];
}

/** Scale for how the given plan prefers to be laid out — exported for the painter's bounds. */
export function frameSize(frame: Frame): [number, number] {
  return [frame[0]?.length ?? 0, frame.length];
}

export type { BodyPlan };
