/**
 * How well a card is remembered.
 *
 * Anki hands Memory Forest an FSRS stability straight out of the card's data blob. RemNote
 * exposes no such thing, so strength is **derived from the scheduled interval** — the gap the
 * scheduler itself chose between the last review and the next one. RemNote's scheduler is
 * FSRS-derived, so that gap is a monotone function of stability on the same scale and in the
 * same units, which is why the original's day thresholds (21 / 180 / 365) carry over unchanged.
 *
 * See `reference/REMNOTE_API.md` §2.1. Everything that needs a strength goes through
 * `cardStrength`, so a future SDK exposing real stability is a one-line change here.
 */

import type { CardLike, RepLike } from './types';
import { MS_PER_DAY } from './day';

/** FSRS-4.5/5 default. RemNote exposes no per-card decay. */
export const DEFAULT_DECAY = 0.5;

/** Stability is defined as the days until recall falls to this. */
export const STABILITY_RECALL = 0.9;

/**
 * The FSRS forgetting curve: `R = (1 + F * elapsed / S) ** -decay`.
 * Returns 1 for a non-positive elapsed time, and clamps into [0, 1].
 */
export function retrievability(strength: number, elapsedDays: number, decay = DEFAULT_DECAY): number {
  if (!(strength > 0)) return 0;
  if (elapsedDays <= 0) return 1;
  const d = decay > 0 && decay < 1 ? decay : DEFAULT_DECAY;
  const factor = Math.pow(STABILITY_RECALL, -1 / d) - 1;
  const r = Math.pow(1 + (factor * elapsedDays) / strength, -d);
  return r < 0 ? 0 : r > 1 ? 1 : r;
}

/** Repetitions that actually schedule something. Cram sessions plant and date nothing. */
export function realReps(card: CardLike): RepLike[] {
  const h = card.repetitionHistory;
  if (!h || h.length === 0) return [];
  // Fast path: almost no one crams, so avoid allocating a copy when there is nothing to drop.
  let hasCram = false;
  for (let i = 0; i < h.length; i++) {
    if (h[i].isCram) {
      hasCram = true;
      break;
    }
  }
  return hasCram ? h.filter((r) => !r.isCram) : h;
}

/**
 * The card's current strength in days.
 *
 * 1. the scheduled gap `nextRepetitionTime - lastRepetitionTime`, when both are present;
 * 2. otherwise the gap between its last two real repetitions;
 * 3. otherwise 0 — treated as still learning.
 */
export function cardStrength(card: CardLike, reps = realReps(card)): number {
  const next = card.nextRepetitionTime;
  const last = card.lastRepetitionTime ?? (reps.length ? reps[reps.length - 1].date : undefined);
  if (next != null && last != null) {
    const days = (next - last) / MS_PER_DAY;
    if (days > 0) return days;
  }
  if (reps.length >= 2) {
    const days = (reps[reps.length - 1].date - reps[reps.length - 2].date) / MS_PER_DAY;
    if (days > 0) return days;
  }
  return 0;
}

/** Days since the card was last seen, at `now`. */
export function elapsedDays(card: CardLike, now: number, reps = realReps(card)): number {
  const last = card.lastRepetitionTime ?? (reps.length ? reps[reps.length - 1].date : undefined);
  if (last == null) return 0;
  return Math.max(0, (now - last) / MS_PER_DAY);
}
