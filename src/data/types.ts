/**
 * Shared types for the data layer.
 *
 * Nothing in `src/data/` imports `@remnote/plugin-sdk` except `source.ts`. Everything else
 * works on these structural types, so the whole layer is pure and testable with plain
 * fixtures. `CardLike` is deliberately a structural subset of the SDK's `Card`, so a real
 * `Card` satisfies it without conversion.
 */

/** Structural subset of the SDK's `RepetitionStatusInterface`. */
export interface RepLike {
  /** Unix ms: when the repetition actually happened. */
  date: number;
  /** `QueueInteractionScore`. AGAIN = 0, HARD = 0.5, GOOD = 1, EASY = 1.5, VIEWED_AS_LEECH = 2. */
  score: number;
  /** Milliseconds the answer took, when RemNote recorded it. */
  responseTime?: number;
  /** Cram reviews don't schedule anything, so they never plant or date a plant. */
  isCram?: boolean;
  /** Unix ms the repetition was originally due for; differs when done early or late. */
  scheduled?: number;
}

/** Structural subset of the SDK's `Card`. */
export interface CardLike {
  _id: string;
  remId: string;
  createdAt: number;
  repetitionHistory?: RepLike[];
  nextRepetitionTime?: number;
  lastRepetitionTime?: number;
  timesWrongInRow?: number;
}

/** Derived card state. RemNote exposes none of this directly — see `reference/REMNOTE_API.md` §2.2. */
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

/** Growth stages, matching Memory Forest's six. The numbers are indices into `STAGE_HEIGHT`. */
export enum Stage {
  Seedling = 0,
  Sapling = 1,
  Young = 2,
  Mature = 3,
  Old = 4,
  Ancient = 5,
}

/** Drawn height of each stage, in engine units. From the original's `AF.STAGE_H`. */
export const STAGE_HEIGHT = [4, 8, 13, 19, 27, 38] as const;

export const STAGE_COUNT = 6;

/** One day's worth of cards, before it becomes a plant. */
export interface Cohort {
  /** Absolute day number (local calendar days since epoch, rollover-shifted). */
  day: number;
  /** Cards first learned on this day. */
  n: number;
  /** Still in their first learning steps. */
  learning: number;
  /** Derived strengths (days) of the cards past learning. */
  strengths: number[];
  /** Relearning, or lapsed within the lapse window. */
  struggling: number;
  /** Effectively inactive: keeps its place in size and stage, counts for neither health nor recall. */
  inactive: number;
  /** Per-card retrievability, for cards where it could be measured. */
  recall: number[];
  /** Cards whose history shows RemNote raised the leech dialog, still short-interval. */
  leeches: number;
  /** Cards whose strength has reached `MATURE_DAYS`. */
  mature: number;
}

/** One plant in the grove: a day's cards, rendered. */
export interface Plant {
  /** Absolute day number — stable forever, so the seed and position never shift. */
  day: number;
  /** Days before today. 0 is today. */
  ago: number;
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Cards in this day's cohort. */
  n: number;
  stage: Stage;
  /** Crown size 0/1/2 from card count. */
  size: 0 | 1 | 2;
  /** 0 healthy .. 3 struggling badly. */
  health: 0 | 1 | 2 | 3;
  /** Index into the region's plant species list for this biome. */
  species: number;
  /** Stable per-day seed; everything random about this plant derives from it. */
  seed: number;
  /** 0..1 share of the day's cards still remembered. */
  remembered: number;
  /** Median derived strength, in days. */
  strength: number;
  /** How many cards are relearning or recently lapsed. */
  struggling: number;
  /** False when `remembered` is an estimate rather than a forgetting-curve figure. */
  measured: boolean;
  /** Cards whose strength has reached `MATURE_DAYS`. */
  mature: number;
  /** Set when this plant stands just after a break: the pond's size and dates. */
  gap?: number;
  gapFrom?: string;
  gapTo?: string;
  /** Visual variant 0..3. */
  variant: number;
}

/** Everything the renderer needs about the grove as a whole. */
export interface GroveStats {
  plants: number;
  cards: number;
  ancient: number;
  old: number;
  young: number;
  ailing: number;
  /** Consecutive study days, counting back from today. */
  streak: number;
  longestStreak: number;
  reviews: number;
  todayReviews: number;
  /** Age of the grove in days. */
  groveAge: number;
  oldestDate: string | null;
  plantedToday: boolean;
  todayCards: number;
  ponds: number;
  matureCards: number;
  /** Study days on which anything was reviewed — drives creature unlock pacing. */
  activeStudyDays: number;
}

/** The oldest plants, folded into one band summary once there are too many to draw. */
export interface MergedPlants {
  count: number;
  cards: number;
  ancient: number;
  ponds: number;
  fromDate: string;
  toDate: string;
  fromAgo: number;
  toAgo: number;
}

export interface Grove {
  plants: Plant[];
  stats: GroveStats;
  merged?: MergedPlants;
  seed: number;
  /** Day numbers on which at least one review happened. */
  reviewDays: Set<number>;
  /** day number -> reviews that day. */
  dayReviews: Map<number, number>;
  /** day number -> seconds those reviews took. */
  dayTime: Map<number, number>;
  /** Today's absolute day number. */
  today: number;
}
