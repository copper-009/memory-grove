/**
 * The adapter between Memory Grove's own data layer and the vendored Memory Forest engine
 * (`src/vendor/memory-forest/web/`).
 *
 * `payload.py` builds this shape from a live Anki collection (`mw.col`); nothing here ports
 * that file line-for-line (it's 512 lines of Anki-specific collection queries, deck
 * scoping and settings-dialog caching — see `DECISIONS.md`). Instead this replicates the
 * *shape* `AF.mount(root, data, opts)` actually reads, built from Memory Grove's existing
 * `Grove`/`CreatureRoster` (`src/data/*.ts`) instead of an Anki collection.
 *
 * Golden Lake's own landscape/weather/time always (`presets.py`'s first preset —
 * `landscape: 'lake'`, `landmark: 'none'`, `weather: 'clear'`, `time: 'golden_hour'`); only
 * the trees change per biome, and only for biomes with an entry in `mfEnvs.ts`'s registry
 * (Phase 3, one region at a time — Australia's eucalypt woodland so far, `src/envs/
 * au-eucalypt.js`). Milestone animals are Memory Forest's own stock roster (rabbit/deer/
 * fox/owl/heron/stag/cabin/bear/squirrel/eagle — ported from `milestones.py`'s `VISITORS`/
 * `visitors()` directly, not Memory Grove's own per-region creature roster, since the
 * vendored `visitors.js` only knows its own built-in `VISITORS` table) — creatures aren't
 * region-specific yet, even for eucalypt woodland.
 *
 * Not yet wired: `calendar` (the study heatmap — a separate panel below the forest, not
 * needed for the forest scene itself), `journal` (a stub empty string — `journal.py` isn't
 * ported), `merged` (the deep-forest band for groves over `MAX_INDIVIDUAL_PLANTS` — needs
 * `AF.deepForest`'s input shape worked out, deferred since a render for review doesn't need
 * a 2000-plant grove), `events` (night-sky meteor showers etc. — cosmetic, low priority).
 */

import type { Grove, Plant } from '../data/types';
import type { CreatureRoster } from '../data/milestones';
import { envForBiome } from './mfEnvs';

/** `forest_data.py`'s `make_tree`'s shape: what `layout.js`/`engines/pixel/trees.js` read
 * from each tree. `kind` (0 round, 1 pine) is derived the same way the original does — a
 * flat per-seed roll, since the vendored engine has no concept of Memory Grove's own
 * per-region species yet (Phase 3). */
export interface MfTree {
  day: number;
  ago: number;
  date: string;
  n: number;
  stage: number;
  size: 0 | 1 | 2;
  health: number;
  kind: 0 | 1;
  seed: number;
  remembered: number;
  strength: number;
  struggling: number;
  measured: boolean;
  gap?: number;
  gap_from?: string;
  gap_to?: string;
  burn?: number;
  smoke?: 1;
  big?: number;
}

const PINE_PERCENT = 34;

export function toMfTree(p: Plant): MfTree {
  const out: MfTree = {
    day: p.day, ago: p.ago, date: p.date, n: p.n, stage: p.stage, size: p.size, health: p.health,
    kind: p.seed % 100 < PINE_PERCENT ? 1 : 0, seed: p.seed,
    remembered: Math.round(p.remembered * 1000) / 1000, strength: Math.round(p.strength * 10) / 10,
    struggling: p.struggling, measured: p.measured,
  };
  if (p.gap) { out.gap = p.gap; out.gap_from = p.gapFrom; out.gap_to = p.gapTo; }
  if (p.burn !== undefined) out.burn = p.burn;
  if (p.smoke !== undefined) out.smoke = p.smoke;
  if (p.big !== undefined) out.big = p.big;
  return out;
}

/** `forest_data.make_forest`'s stats shape, from Memory Grove's own `GroveStats`. */
export function toMfStats(g: Grove): Record<string, unknown> {
  const s = g.stats;
  return {
    trees: s.plants, cards: s.cards, ancient: s.ancient, old: s.old, young: s.young,
    yellowing: s.ailing, streak: s.streak, longest_streak: s.longestStreak, reviews: s.reviews,
    today_reviews: s.todayReviews, forest_age: s.groveAge, oldest_date: s.oldestDate,
    planted_today: s.plantedToday, today_cards: s.todayCards, ponds: s.ponds,
    mature_cards: s.matureCards,
  };
}

/** `milestones.py`'s stock `VISITORS` table — Memory Forest's own fixed roster, which
 * `visitors.js`'s built-in `VISITORS` sprite data matches by key. Ported directly rather
 * than routed through Memory Grove's own per-region `Creature`/`CreatureRoster` system,
 * which the vendored engine doesn't know about (Phase 3). */
const MF_VISITORS: ReadonlyArray<{ key: string; label: string; why: string; test: (s: Record<string, unknown>) => boolean }> = [
  { key: 'rabbit', label: 'a rabbit', why: 'your forest reached 50 trees', test: (s) => (s.trees as number) >= 50 },
  { key: 'deer', label: 'a deer', why: 'you kept a 30-day streak', test: (s) => (s.longest_streak as number) >= 30 },
  { key: 'fox', label: 'a fox', why: 'you passed 10,000 reviews', test: (s) => (s.reviews as number) >= 10_000 },
  { key: 'owl', label: 'an owl', why: 'your first tree became ancient', test: (s) => (s.ancient as number) >= 1 },
  { key: 'heron', label: 'a heron', why: 'a pond formed where you took a break', test: (s) => ((s.ponds as number) ?? 0) >= 1 },
  { key: 'stag', label: 'a stag', why: 'you kept a 100-day streak', test: (s) => (s.longest_streak as number) >= 100 },
  { key: 'cabin', label: 'a cabin', why: 'your forest turned one year old', test: (s) => (s.forest_age as number) >= 365 },
  { key: 'bear', label: 'a bear', why: 'you kept a two-year streak', test: (s) => (s.longest_streak as number) >= 730 },
  { key: 'squirrel', label: 'a family of squirrels', why: 'you knew 10,000 cards well', test: (s) => ((s.mature_cards as number) ?? 0) >= 10_000 },
  { key: 'eagle', label: 'an eagle', why: 'you knew 25,000 cards well', test: (s) => ((s.mature_cards as number) ?? 0) >= 25_000 },
];

/** Whichever of the stock milestones the grove's stats have already earned — unconditioned
 * on arrival history (Memory Grove's own `CreatureRoster` tracks that per-species already;
 * this stock table is only a stand-in until Phase 3 wires real regions through, so "new" is
 * always false rather than guessing at a day it arrived). */
export function toMfVisitors(stats: Record<string, unknown>): Array<{ key: string; label: string; why: string; new: boolean }> {
  return MF_VISITORS.filter((v) => v.test(stats)).map((v) => ({ key: v.key, label: v.label, why: v.why, new: false }));
}

export interface MfMood {
  time: string;
  clock: boolean;
  weather: string;
  special: string;
  wind: boolean;
  environment: string;
  landscape: string;
  landmark: string;
  moon: number;
  source: string;
}

/** `presets.py`'s first preset, "Golden hour by the lake" (`envs/natural.json`'s own
 * `preset` block) — Memory Forest's default scene, hardcoded for this first milestone
 * rather than porting the full preset-picker/live-weather system. `special` swaps in a
 * region-specific environment (`mfEnvs.ts`) when the current biome has one; everything else
 * about the scene (landscape, weather, time) stays Golden Lake's regardless — swapping
 * those too, per biome, is further Phase 3 work, not this. */
export function goldenLakeMood(moonPhase = 0, special = 'natural'): MfMood {
  return {
    time: 'golden_hour', clock: false, weather: 'clear', special, wind: false,
    environment: special, landscape: 'lake', landmark: 'none',
    moon: Math.round(moonPhase * 1000) / 1000, source: 'preset',
  };
}

export interface MfPayload {
  trees: MfTree[];
  stats: Record<string, unknown>;
  visitors: Array<{ key: string; label: string; why: string; new: boolean }>;
  anniversaries: number[];
  mood: MfMood;
  journal: string;
  events: string[];
  merged: null;
  forestSeed: number;
  dayNumber: number;
  testForest: boolean;
  tooltips: boolean;
  zoom: boolean;
  maxWidth: number;
  credit: boolean;
  environmentName: string;
  sceneName?: string;
  sceneTip?: string;
  inAnki: boolean;
  showForest: boolean;
  calendar: null;
  /** `util.js`'s `animates()` reads this directly: `'system'` defers to
   * `prefers-reduced-motion` itself, `true`/`false` are explicit. Matches
   * `GroveSettings.animate`'s own `'on' | 'off' | 'system'` shape (`state.py`'s
   * `ANIMATION_VALUES` maps those same three strings to `true`/`false`/`'system'`). */
  animations: boolean | 'system';
}

export interface MfAdapterOptions {
  maxWidth?: number;
  moonPhase?: number;
  /** `'on' | 'off' | 'system'` — pass `GroveSettings.animate` straight through. */
  animate?: 'on' | 'off' | 'system';
  /** The current biome's key (`Biome.key`) — looked up in `mfEnvs.ts`'s registry for a
   * region-specific environment; a biome with no entry there still renders (the vendored
   * engine's own default), same as before this option existed. */
  biomeKey?: string;
}

/** Build the payload `AF.mount` needs, from a Memory Grove `Grove` — Golden Lake's own
 * landscape/weather/time always, a region-specific tree environment when `opts.biomeKey`
 * has one (see module comment for what else is deliberately not wired up yet). */
export function buildMfPayload(grove: Grove, _roster: CreatureRoster, opts: MfAdapterOptions = {}): MfPayload {
  const stats = toMfStats(grove);
  const animate = opts.animate ?? 'system';
  return {
    trees: grove.plants.map(toMfTree),
    stats,
    visitors: toMfVisitors(stats),
    anniversaries: [],
    mood: goldenLakeMood(opts.moonPhase, envForBiome(opts.biomeKey) ?? 'natural'),
    journal: '',
    events: [],
    merged: null,
    forestSeed: grove.seed,
    dayNumber: grove.today,
    testForest: false,
    animations: animate === 'system' ? 'system' : animate === 'on',
    tooltips: true,
    zoom: false,
    maxWidth: opts.maxWidth ?? 900,
    credit: false,
    environmentName: 'Natural',
    sceneName: 'Golden hour by the lake',
    inAnki: false,
    showForest: true,
    calendar: null,
  };
}
