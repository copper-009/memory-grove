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
 */

import type { Biome, Creature } from '../regions/types';
import type { CreatureRoster } from '../data/milestones';
import { creatureAge, creatureMood, lifeStageFor } from '../data/milestones';
import type { SpriteFrame, Palette } from '../regions/types';

export interface MfCreatureVisitor {
  key: string;
  label: string;
  why: string;
  new: boolean;
  /** Read by `visitors.js`'s generalised `chooseHosts`/front-roam logic. */
  zone: Creature['zone'];
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
 * `useGrove.ts` (`grove.stats.activeStudyDays`, `health.visual`) — not recomputed here.
 */
export function buildCreatureVisitors(
  biome: Biome,
  roster: CreatureRoster,
  activeStudyDays: number,
  healthVisual: number,
): MfCreatureResult {
  const visitors: MfCreatureVisitor[] = [];
  const sprites: Record<string, MfCreatureSprite> = {};

  for (const save of roster.creatures) {
    const creature = biome.creatures.find((c) => c.slot === save.slot);
    if (!creature || !creature.sprite) continue;

    const age = creatureAge(save, activeStudyDays);
    const stage = lifeStageFor(age);
    const mood = creatureMood(healthVisual, {
      nocturnal: creature.activity === 'nocturnal',
      night: true,
      sleepy: creature.sleepy,
    });
    if (mood === 'hidden' || mood === 'asleep') continue;

    // Stage 0 is the youngest named stage (joey/puggle/fledgling/...); the sprite's own
    // `young` pair is drawn for it when the species has one, the adult pair otherwise —
    // most do, a few (flat/low creatures where a smaller grid reads as noise rather than a
    // baby version) don't, and the adult art standing in for a young one is the accepted
    // fallback the gallery review already settled on for those.
    const useYoung = stage === 0 && !!creature.sprite.young;
    const frames = useYoung ? creature.sprite.young! : creature.sprite.frames;

    const key = `${biome.key}:${creature.key}`;
    visitors.push({
      key,
      label: creature.common,
      why: `your grove reached ${save.activeDaysAtArrival} active study days`,
      new: false,
      zone: creature.zone,
      still: creature.still,
      sleepy: creature.sleepy,
    });
    sprites[key] = {
      pal: creature.sprite.pal,
      frames,
      flies: creature.zone === 'sky',
      facesLeft: creature.sprite.facesLeft,
      hop: creature.sprite.hop,
    };
  }

  return { visitors, sprites };
}
