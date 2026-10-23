/**
 * Creature unlocks, life stages and persistent creature state.
 *
 * ## Why slots, not species
 *
 * Unlock progress is stored as **abstract milestone slots** (0–4), never as a species. The
 * region pack decides which animal fills slot 2; the save file only knows that slot 2 is
 * unlocked and how old it is. Switch from Australia to Japan and the first four Japanese
 * creatures are simply there, at the matching life stages — nothing is re-earned and nothing
 * is lost. Switch back and the Australian names return, because names are kept per region.
 *
 * ## Why active study days
 *
 * Progress is counted in **days you actually studied**, not calendar days. A six-week summer
 * break neither delays nor resets anything. This is also what makes the pause system honest:
 * an excused day contributes nothing, but it costs nothing either.
 */

import type { GroveStats } from './types';

/** Creatures per biome. */
export const CREATURE_SLOTS = 5;

/**
 * Active study days needed for each slot.
 *
 * Paced so a new creature arrives every few weeks early on and every few months later —
 * roughly a week, a month, two and a half months, five months, then ten months of real
 * studying. At five days a week that is about 9 days, 6 weeks, 15 weeks, 7 months and
 * 14 months of wall-clock time.
 */
export const SLOT_REQUIREMENTS = [7, 30, 75, 150, 300] as const;

/** The grove's age in days before the cabin appears, as in the original. */
export const CABIN_AGE_DAYS = 365;

/** Life stages a creature passes through, in active study days since it arrived. */
export const LIFE_STAGE_DAYS = [0, 21, 60, 150] as const;

export type LifeStageIndex = 0 | 1 | 2 | 3;

/** How many creature slots are unlocked at this much studying. */
export function unlockedSlots(activeStudyDays: number): number {
  let n = 0;
  for (const need of SLOT_REQUIREMENTS) if (activeStudyDays >= need) n++;
  return n;
}

/** Active study days still to go before the next creature arrives, or `null` at the cap. */
export function daysToNextSlot(activeStudyDays: number): number | null {
  for (const need of SLOT_REQUIREMENTS) {
    if (activeStudyDays < need) return need - activeStudyDays;
  }
  return null;
}

/** 0–1 progress towards the next creature. 1 when all are unlocked. */
export function slotProgress(activeStudyDays: number): number {
  const n = unlockedSlots(activeStudyDays);
  if (n >= CREATURE_SLOTS) return 1;
  const from = n === 0 ? 0 : SLOT_REQUIREMENTS[n - 1];
  const to = SLOT_REQUIREMENTS[n];
  return Math.max(0, Math.min(1, (activeStudyDays - from) / (to - from)));
}

export function lifeStageFor(ageInStudyDays: number): LifeStageIndex {
  let stage: LifeStageIndex = 0;
  for (let i = 0; i < LIFE_STAGE_DAYS.length; i++) {
    if (ageInStudyDays >= LIFE_STAGE_DAYS[i]) stage = i as LifeStageIndex;
  }
  return stage;
}

/** Whether the cabin has appeared. */
export function hasCabin(stats: GroveStats): boolean {
  return stats.groveAge >= CABIN_AGE_DAYS;
}

// ---------------------------------------------------------------------------
// Persistent state
// ---------------------------------------------------------------------------

/**
 * What is saved, per creature slot.
 *
 * `activeDaysAtArrival` rather than an age: age is then always derivable and can never
 * drift out of step with the study history, however long the plugin goes unopened.
 */
export interface CreatureSave {
  slot: number;
  /** Day number the creature arrived. */
  arrivedDay: number;
  /** Active study days at the moment it arrived. */
  activeDaysAtArrival: number;
  /** Custom names, keyed by region, so switching regions never loses one. */
  names: Record<string, string>;
}

export interface CreatureRoster {
  version: 1;
  creatures: CreatureSave[];
  /** Day the cabin arrived, if it has. */
  cabinDay?: number;
}

export function emptyRoster(): CreatureRoster {
  return { version: 1, creatures: [] };
}

/**
 * Bring the roster up to date with the current numbers.
 *
 * Creatures are only ever added. Once a creature has arrived it stays — the brief is
 * explicit that nothing dies, and falling health makes a creature hide, never vanish.
 */
export function updateRoster(
  roster: CreatureRoster,
  activeStudyDays: number,
  stats: GroveStats,
  today: number,
): CreatureRoster {
  const want = unlockedSlots(activeStudyDays);
  const have = new Set(roster.creatures.map((c) => c.slot));
  let creatures = roster.creatures;

  for (let slot = 0; slot < want; slot++) {
    if (have.has(slot)) continue;
    if (creatures === roster.creatures) creatures = [...creatures];
    creatures.push({
      slot,
      arrivedDay: today,
      // Back-date to the milestone itself, so a creature earned long before the plugin
      // was first opened is not born today with an age of zero.
      activeDaysAtArrival: SLOT_REQUIREMENTS[slot],
      names: {},
    });
  }

  const cabinDay = roster.cabinDay ?? (hasCabin(stats) ? today : undefined);
  if (creatures === roster.creatures && cabinDay === roster.cabinDay) return roster;
  return { ...roster, creatures: creatures.sort((a, b) => a.slot - b.slot), cabinDay };
}

/** Rename a creature, for one region only. */
export function renameCreature(
  roster: CreatureRoster,
  slot: number,
  region: string,
  name: string,
): CreatureRoster {
  return {
    ...roster,
    creatures: roster.creatures.map((c) =>
      c.slot === slot ? { ...c, names: { ...c.names, [region]: name } } : c,
    ),
  };
}

/** A creature's age in active study days. */
export function creatureAge(save: CreatureSave, activeStudyDays: number): number {
  return Math.max(0, activeStudyDays - save.activeDaysAtArrival);
}

// ---------------------------------------------------------------------------
// Behaviour under low health
// ---------------------------------------------------------------------------

export type CreatureMood = 'active' | 'resting' | 'tired' | 'hidden' | 'asleep';

/**
 * What a creature is doing right now.
 *
 * Health drives this, but so does the clock and the species' own habits: a nocturnal animal
 * is asleep by day whatever the health, and a koala sleeps most of the time regardless. The
 * one hard rule is that a creature never leaves for good — `hidden` is temporary and reverses
 * the moment health recovers.
 */
export function creatureMood(
  health: number,
  opts: { nocturnal?: boolean; night?: boolean; sleepy?: boolean; paused?: boolean },
): CreatureMood {
  // On a declared break, everything is simply asleep in its den. Nothing is wrong.
  if (opts.paused) return 'asleep';
  // Nocturnal animals are out at night and asleep by day, health notwithstanding.
  if (opts.nocturnal && !opts.night) return 'asleep';
  if (health < 30) return 'hidden';
  if (health < 50) return 'tired';
  if (opts.sleepy) return 'resting';
  if (health < 70) return 'resting';
  return 'active';
}

export const MOOD_LABELS: Record<CreatureMood, string> = {
  active: 'Out and about',
  resting: 'Resting',
  tired: 'Looking tired',
  hidden: 'Hiding — it will be back',
  asleep: 'Asleep',
};
