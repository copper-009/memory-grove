/**
 * Region creatures as the vendored engine's own visitors — the piece `mfAdapter.ts` has
 * never done: `buildMfPayload`'s `roster` parameter arrived unused, and the live grove has
 * always shown Memory Forest's generic stock roster (rabbit/deer/fox/owl/heron/stag/bear/
 * squirrel/eagle, unlocked by raw review counts) instead of the current biome's own five
 * species, unlocked by `CreatureRoster`'s actual slot progress.
 *
 * Two things this is deliberately NOT: a change to the stock milestone set (`cabin` and the
 * raw-count-based test table in `mfAdapter.ts` stay exactly as they are — they're Memory
 * Forest's own structural milestones, not region creatures), and a reimplementation of the
 * vendored engine's placement system. Placement — canopy/trunk species hosted in a tree,
 * water/waterEdge species at a pond when one exists, everything else roaming the front, sky
 * species circling overhead — is `visitors.js`'s own job, generalised there (see that file's
 * "Memory Garden change" comment) to read a visitor's `zone`/`still`/`sleepy` the same way
 * it already special-cases owl/heron/squirrel/deer/stag for the stock roster. This file only
 * decides *which* creatures are visiting and *what they carry*: life stage (young vs adult
 * art, by `milestones.ts`'s own `lifeStageFor`), and visibility (`creatureMood`'s existing
 * active/resting/tired/hidden/asleep, from ecosystem health and the species' own activity
 * pattern) — hidden and asleep creatures are simply left out of the list for this frame,
 * the same "never gone, just not out right now" rule `creatureMood`'s own doc comment states.
 *
 * `night` is passed as `true` unconditionally: the live grove always renders golden hour
 * (`mfAdapter.ts`'s own stated gap — time of day doesn't follow the real clock yet), which
 * is close enough to dusk that treating it as "night has effectively fallen" lets nocturnal
 * species actually appear instead of being permanently asleep under a clock that never
 * advances. Diurnal/crepuscular/cathemeral species are never gated by time at all in
 * `creatureMood`, so this costs them nothing.
 *
 * A handful of species carry a second `alt` state (`Creature.alt` in `types.ts`) — an otter
 * that swims one day and hauls out to walk the next, a bird that perches in a tree one day and
 * is drawn mid-flight the next, a wombat that digs at its burrow one day and forages in the
 * open the next. `pickState` below chooses between the primary and `alt` state once per
 * creature per day, from a simple string hash of the creature's key plus `daySeed` (the
 * grove's own `today` day number) — stable across re-renders of the same day, varies across
 * days, no extra state to persist.
 */

import type { Biome, Creature } from '../regions/types';
import type { CreatureRoster } from '../data/milestones';
import { creatureAge, creatureMood, lifeStageFor } from '../data/milestones';
import type { SpriteFrame, Palette } from '../regions/types';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  // Finalizer (Murmur3's fmix32): a plain multiply-add hash barely changes between inputs
  // that differ only in their last character's code point — exactly the shape `${key}:
  // ${daySeed}` takes from one day to the next, so consecutive days produced nearly
  // identical hashes. That happened to still split close to 50/50 (parity alone decided the
  // low bit), which is how it shipped looking fine, but any weighted `altChance` threshold
  // exposed it: checked directly, alpine:wombat spent 0 of 400 simulated days below 0.25
  // instead of the ~100 a real 25% chance implies, because consecutive days' hashes clustered
  // in one narrow band instead of spreading across the full range. This avalanches small
  // input changes into large output ones, so consecutive days actually scatter.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export interface MfCreatureVisitor {
  key: string;
  label: string;
  why: string;
  new: boolean;
  /** Read by `visitors.js`'s generalised `chooseHosts`/front-roam logic. */
  zone: Creature['zone'];
  /** The unlock slot (0-4) — `chooseHosts` spreads ground/slope/burrow species across
   * different depth bands by it, the same way it already spreads deer/stag, so a biome's
   * five creatures scatter through the grove instead of all crowding the front. */
  slot: number;
  still?: boolean;
  sleepy?: boolean;
}

export interface MfCreatureSprite {
  pal: Palette;
  frames: readonly [SpriteFrame, SpriteFrame];
  flies?: boolean;
  facesLeft?: boolean;
  hop?: boolean;
}

export interface MfCreatureResult {
  visitors: MfCreatureVisitor[];
  /** To merge into `AF.VISITOR_SPRITES` before `AF.mount` — see `mfLoader.ts`'s
   * `registerCreatureSprites`. */
  sprites: Record<string, MfCreatureSprite>;
}

/**
 * The current biome's unlocked creatures, as visitors + the sprite data they need
 * registered. `activeStudyDays` and `healthVisual` are the same numbers already computed by
 * `useGrove.ts` (`grove.stats.activeStudyDays`, `health.visual`). `daySeed` is `grove.today` —
 * used only to pick a stable-for-the-day `alt` state for the few species that have one.
 */
export function buildCreatureVisitors(
  biome: Biome,
  roster: CreatureRoster,
  activeStudyDays: number,
  healthVisual: number,
  daySeed: number = 0,
): MfCreatureResult {
  const visitors: MfCreatureVisitor[] = [];
  const sprites: Record<string, MfCreatureSprite> = {};

  for (const save of roster.creatures) {
    const creature = biome.creatures.find((c) => c.slot === save.slot);
    if (!creature || !creature.sprite) continue;

    const age = creatureAge(save, activeStudyDays);
    const stage = lifeStageFor(age);
    const key = `${biome.key}:${creature.key}`;

    // Two-state species: pick today's state before checking mood/sleep, since the alt state
    // can carry its own `sleepy` (an otter hauled out to walk isn't "asleep" just because its
    // swimming state is marked sleepy, and vice versa). Weighted by the alt's own
    // `altChance` (0.5 — an even split — when unset): `hashStr` already returns a uint32, so
    // dividing by 2^32 gives a stable, uniformly distributed fraction per creature per day to
    // compare against it.
    const useAlt = !!creature.alt && (hashStr(`${key}:${daySeed}`) / 0x100000000) < (creature.alt.altChance ?? 0.5);
    const state = useAlt ? creature.alt! : creature;
    const stateSprite = useAlt ? creature.alt!.sprite : creature.sprite;

    const mood = creatureMood(healthVisual, {
      nocturnal: creature.activity === 'nocturnal',
      night: true,
      sleepy: state.sleepy,
    });
    if (mood === 'hidden' || mood === 'asleep') continue;

    // Stage 0 is the youngest named stage (joey/puggle/fledgling/...); the sprite's own
    // `young` pair is drawn for it when the species has one, the adult pair otherwise —
    // most do, a few (flat/low creatures where a smaller grid reads as noise rather than a
    // baby version) don't, and the adult art standing in for a young one is the accepted
    // fallback the gallery review already settled on for those.
    const useYoung = stage === 0 && !!stateSprite.young;
    const frames = useYoung ? stateSprite.young! : stateSprite.frames;

    visitors.push({
      key,
      label: creature.common,
      why: `your grove reached ${save.activeDaysAtArrival} active study days`,
      new: false,
      zone: state.zone,
      slot: creature.slot,
      still: state.still,
      sleepy: state.sleepy,
    });
    sprites[key] = {
      pal: stateSprite.pal,
      frames,
      flies: state.zone === 'sky',
      facesLeft: stateSprite.facesLeft,
      hop: stateSprite.hop,
    };
  }

  return { visitors, sprites };
}
