/**
 * The region pack format.
 *
 * A region is a **self-contained folder of data**. Adding a new one means adding a folder
 * and one line in `src/regions/index.ts` — never a change to the engine. The engine knows
 * about body plans, growth stages and health; it knows nothing about kangaroos or kiwi.
 *
 * Documented for contributors in `DEVELOPMENT.md`.
 */

/** IUCN Red List categories, plus "not assessed". */
export type IUCNStatus = 'NE' | 'DD' | 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EW' | 'EX';

export const IUCN_LABELS: Record<IUCNStatus, string> = {
  NE: 'Not evaluated',
  DD: 'Data deficient',
  LC: 'Least concern',
  NT: 'Near threatened',
  VU: 'Vulnerable',
  EN: 'Endangered',
  CR: 'Critically endangered',
  EW: 'Extinct in the wild',
  EX: 'Extinct',
};

/** When a creature is out and about. */
export type Activity = 'diurnal' | 'nocturnal' | 'crepuscular' | 'cathemeral';

export const ACTIVITY_LABELS: Record<Activity, string> = {
  diurnal: 'Active by day',
  nocturnal: 'Nocturnal',
  crepuscular: 'Most active at dawn and dusk',
  cathemeral: 'Active day or night',
};

/** Where in the scene a creature may plausibly be. */
export type Zone =
  | 'ground' // walks the open ground at the front
  | 'canopy' // sits in a plant's crown
  | 'trunk' // clings to a trunk
  | 'water' // in the water
  | 'waterEdge' // at the margin, never far from it
  | 'sky' // flies
  | 'slope' // rocks and high ground
  | 'burrow'; // emerges from the ground, stays near its hole

/** How a plant is drawn. The engine has a routine for each. */
export type PlantForm =
  | 'broadleaf' // a rounded crown: gums, figs, beeches
  | 'conifer' // stacked tiers: spruce, pine, kauri
  | 'palm' // a bare stem with a fan of fronds
  | 'fern' // a tree fern: short trunk, arching fronds
  | 'grasstree' // a black trunk with a spiky skirt and a spear
  | 'hummock' // a low spiky dome: spinifex, tussock
  | 'shrub' // a low dense mound: banksia, heather
  | 'columnar' // tall and narrow: bamboo, desert oak, pandanus
  | 'bulbous'; // a swollen trunk: baobab

/** Shared by every documented living thing, and the basis of `reference/SPECIES.md`. */
export interface SpeciesFact {
  common: string;
  scientific: string;
  /** Local-language name, shown alongside English. Macrons and diacritics intact. */
  localName?: string;
  /** What the local name is in. */
  localLanguage?: string;
  /** One or two identifying traits the sprite must show. */
  traits: string[];
  iucn: IUCNStatus;
  /**
   * A national listing, where it differs meaningfully from the global one. The southern
   * cassowary is the standing example: Least Concern globally, Endangered under Australia's
   * EPBC Act.
   */
  national?: string;
  /** One short fact for the field journal. Gentle in tone, never a lecture. */
  fact: string;
  /** Where the name, range and status were checked. */
  source: string;
}

/** A palette for a sprite: single characters mapped to hex colours. */
export type Palette = Record<string, string>;

/**
 * How a creature's body is put together.
 *
 * The engine builds the sprite from this rather than from hand-drawn frames. One hundred
 * and thirty species could not be hand-drawn to a consistent standard, and consistency is
 * the whole point — see `DECISIONS.md` § "Art and assets".
 */
export interface BodyPlan {
  /** Which routine draws it. */
  kind: 'quadruped' | 'hopper' | 'bird' | 'wader' | 'flyer' | 'frog' | 'reptile' | 'swimmer' | 'bulky';
  /** Body length and height in pixels, at adult size. */
  size: [number, number];
  /** Leg length in pixels. 0 for something with no visible legs. */
  legs?: number;
  /** Neck length in pixels. */
  neck?: number;
  /** Tail: length and how it is carried. */
  tail?: { len: number; style?: 'down' | 'up' | 'curl' | 'fan' | 'bush' | 'none' };
  /** A crest, comb or casque on the head. */
  crest?: number;
  /** Beak or snout length. */
  beak?: number;
  /** Ear height. */
  ears?: number;
  /** Spines, as on an echidna. */
  spines?: boolean;
  /** Pouch, as on a macropod. */
  pouch?: boolean;
  /** Overrides, per life stage, scaling the adult size. */
  stageScale?: [number, number, number, number];
}

export interface Creature extends SpeciesFact {
  key: string;
  /** Unlock slot 0–4. 0 arrives first and should be the common, easily spotted one. */
  slot: number;
  activity: Activity;
  zone: Zone;
  /** Life-stage names, youngest first. Correct local terms: joey, puggle, fledgling... */
  stages: [string, string, string, string];
  body: BodyPlan;
  palette: Palette;
  /** Mostly sleeps wherever it is — koalas, sloths. */
  sleepy?: boolean;
  /** Barely moves — crocodiles. */
  still?: boolean;
  /** How it behaves, for the tooltip and the movement system. */
  behaviour: string;
  /** A rare flourish the renderer may show: a lyrebird's display, a bower gaining an item. */
  flourish?: 'display' | 'bower' | 'dig' | 'dive' | 'soar' | 'pair' | 'dam' | 'bathe' | 'bloom';
}

export interface PlantSpecies extends SpeciesFact {
  key: string;
  form: PlantForm;
  /** Crown palette, darkest to lightest: five steps, as the tone map expects. */
  crown: [string, string, string, string, string];
  /** Trunk colours: light, mid, dark. */
  bark: [string, string, string];
  /**
   * What ill health looks like for this plant. Most Australian natives do not turn autumn
   * colours, so the default is to go dry and sparse rather than gold.
   */
  ailing: 'dry' | 'bare' | 'autumn';
  /** Width of the crown relative to height, as a multiplier on the engine default. */
  spread?: number;
}

export interface Biome {
  key: string;
  label: string;
  /** One line for the picker. */
  note: string;
  /** Ground colours: far, near, grass. Blended with the time-of-day theme's lighting, so
   * the same eucalypt woodland still looks warmer at golden hour than at dawn, but reads
   * as its own place rather than every biome sharing one generic green. */
  ground: [string, string, string];
  /**
   * Whether this biome has standing water substantial enough to reflect the treeline —
   * a wetland, river or lake biome, not an arid or alpine one. Gates the water-reflection
   * band in `src/forest/scene.ts`: an outback or alpine scene has no lake, so it draws
   * none, rather than every biome getting the same generic lake backdrop.
   */
  hasWater?: boolean;
  plants: PlantSpecies[];
  /** Exactly five, one per unlock slot. */
  creatures: Creature[];
  /** Undergrowth and flowers, drawn small and scattered; health drives how much. */
  understory: Array<{ key: string; label: string; what: string; colour: string }>;
  /** Ambient flourishes this biome may show. */
  ambience?: Array<'mist' | 'heatShimmer' | 'glowworms' | 'fireflies' | 'butterflies' | 'passingFlock' | 'snow' | 'rain'>;
}

/** How a region's seasons work. */
export type SeasonModel = 'southern' | 'northern' | 'wetDry' | 'monsoon' | 'tropicalEquatorial';

export interface SeasonSpec {
  model: SeasonModel;
  /** month (1-12) -> season key, for the twelve months. */
  months: string[];
  /** Per-season decorations the renderer may apply. */
  notes: Record<string, string>;
}

export interface Backdrop {
  key: string;
  label: string;
  /** What it evokes. Natural landscapes only — never people, never cultural imagery. */
  note: string;
  /** Sky gradient, six stops, light at the bottom. */
  sky: [string, string, string, string, string, string];
  /** Distant and nearer landform colours. */
  far: string;
  near: string;
  /** Whether this is the dusk/night variant. */
  night?: boolean;
  /** Landform silhouette style. */
  form: 'peaks' | 'fjord' | 'plateau' | 'rolling' | 'volcano' | 'flat' | 'canopy' | 'tsingy' | 'towers';
}

export interface Region {
  key: string;
  label: string;
  /** Where this is, in one line. */
  note: string;
  /**
   * Species deliberately left out despite being commonly associated with this region, and
   * why — e.g. an introduced species often mistaken for native. Surfaced in
   * `reference/SPECIES.md` so the omission reads as a decision, not an oversight.
   */
  excludedSpecies?: Array<{ common: string; scientific: string; reason: string }>;
  /** Southern hemisphere, northern, tropical... */
  seasons: SeasonSpec;
  /** 2–3 backdrops plus a dusk or night variant. */
  backdrops: Backdrop[];
  biomes: Biome[];
  /**
   * Default life-stage names, where a species does not override them. Regions have their
   * own correct terms — "joey" is not a word for a European animal's young.
   */
  defaultStages: [string, string, string, string];
  /** Hemisphere, for the season calendar. */
  hemisphere: 'south' | 'north' | 'tropics';
}
