/**
 * Times of day, weather, and the theme a scene is drawn in.
 *
 * Ported from Memory Forest's `web/theme.js`: a time-of-day palette, mutated in place for
 * the weather, then handed to every drawing routine. Kept deliberately data-only — nothing
 * here touches a canvas — so the full palette set can be unit-tested and so a region's
 * backdrop can override any of it without the engine caring.
 */

import type { RGB } from './color';
import { hex, mixHex, clamp } from './color';

export type TimeOfDay = 'dawn' | 'day' | 'goldenHour' | 'dusk' | 'night';
export type Weather = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog' | 'snow' | 'afterRain';

export interface Orb {
  kind: 'sun' | 'moon';
  x: number;
  y: number;
  r: number;
  color: string;
  glow: string;
  halo: number;
  /** Moon phase 0..1, 0 and 1 both new. */
  phase?: number;
}

export interface Clouds {
  n: number;
  top: string;
  bot: string;
  alpha: number;
}

/** Everything a drawing routine needs about the sky, ground tones and sprite tinting. */
export interface Theme {
  /** Six-stop sky gradient, horizon-adjacent last. */
  sky: [string, string, string, string, string, string];
  orb: Orb | null;
  far: string;
  near: string;
  ground0: string;
  ground1: string;
  grass: string;
  haze: string;
  hazeStep: number;
  water: string;
  tint: string | null;
  tintAmount: number;
  rim: string | null;
  clouds: Clouds | null;
  stars: number;
  flies: number;
  birds: number;
  snow: boolean;
  deepSnow: boolean;
  rain: number;
  snowfall: number;
  fog: string | null;
  rainbow: boolean;
  lightning: boolean;
  flat: boolean;
  shadow: number;
  /** The backdrop's landform ('peaks', 'volcano', 'fjord', ...), for the hill-silhouette
   * shape in `scene.ts`. `'rolling'` (gentle bumps) when no backdrop is in play. */
  hillForm: string;
}

interface TimeSpec {
  sky: [string, string, string, string, string, string];
  orb: Orb | null;
  far: string;
  near: string;
  ground0: string;
  ground1: string;
  grass: string;
  haze: string;
  hazeStep: number;
  water: string;
  clouds: Clouds;
  rim?: string;
  tint?: string;
  tintAmount?: number;
  shadow?: number;
  stars?: number;
}

const TIMES: Record<TimeOfDay, TimeSpec> = {
  dawn: {
    sky: ['#b3bcd8', '#cbc3dc', '#e3c8d4', '#f1cfc2', '#f7dcc0', '#fae8cf'],
    orb: { kind: 'sun', x: 0.3, y: 0.3, r: 8, color: '#fff6dc', glow: '#fbe6c6', halo: 7 },
    far: '#b7b2cb', near: '#9ea8b8', ground0: '#9ab28e', ground1: '#628463', grass: '#86a47e',
    haze: '#eadfd3', hazeStep: 0.13, water: '#c3c6dc',
    tint: '#c8a8b8', tintAmount: 0.12, rim: '#f6c9b8', shadow: 0.6,
    clouds: { n: 4, top: '#fff6ee', bot: '#e7d5da', alpha: 230 },
  },
  day: {
    sky: ['#6aa6d8', '#82b6df', '#9cc6e6', '#b5d4ea', '#cde0ea', '#e0ebe8'],
    orb: { kind: 'sun', x: 0.8, y: 0.13, r: 7, color: '#fffbe6', glow: '#fff3c4', halo: 5 },
    far: '#9ab0c4', near: '#7c9c96', ground0: '#6f9a58', ground1: '#446c3c', grass: '#86b068',
    haze: '#c6d8dc', hazeStep: 0.12, water: '#8fbcd8',
    clouds: { n: 5, top: '#ffffff', bot: '#dfe8ef', alpha: 240 },
  },
  goldenHour: {
    sky: ['#6f93c0', '#9aaec4', '#d4bca0', '#efc48c', '#f7d49a', '#fbe2b0'],
    orb: { kind: 'sun', x: 0.78, y: 0.15, r: 7, color: '#fff0c8', glow: '#ffd99a', halo: 5 },
    far: '#a898a6', near: '#8a8c84', ground0: '#7f9c50', ground1: '#4d6a36', grass: '#a0b460',
    haze: '#ead2ac', hazeStep: 0.12, water: '#b0a890',
    tint: '#e0a060', tintAmount: 0.06, rim: '#ffac8a', shadow: 0.9,
    clouds: { n: 4, top: '#fff0d8', bot: '#e8c0a0', alpha: 235 },
  },
  dusk: {
    sky: ['#1f2b47', '#34436a', '#5e5f86', '#9a7a93', '#d49a8a', '#eebf98'],
    orb: { kind: 'sun', x: 0.72, y: 0.35, r: 7, color: '#f8dca8', glow: '#f6d3a0', halo: 4 },
    far: '#6c6a8e', near: '#4b5670', ground0: '#4a6448', ground1: '#2a4230', grass: '#3f6446',
    haze: '#9a93ad', hazeStep: 0.12, water: '#7d78a0',
    tint: '#5a3f5e', tintAmount: 0.22, rim: '#f2b57a', shadow: 1.0,
    clouds: { n: 5, top: '#f3cbb7', bot: '#c79fae', alpha: 235 },
  },
  night: {
    sky: ['#060a18', '#0b1430', '#131f45', '#1c2a58', '#263666', '#324476'],
    orb: { kind: 'moon', x: 0.22, y: 0.17, r: 7, color: '#eef1f8', glow: '#5b6d9c', halo: 5 },
    far: '#1d2848', near: '#162140', ground0: '#1a2b2d', ground1: '#101b1d', grass: '#22383a',
    haze: '#2a3560', hazeStep: 0.1, water: '#1d2a4a',
    tint: '#141d3c', tintAmount: 0.45,
    clouds: { n: 3, top: '#2c3766', bot: '#222b54', alpha: 200 },
    stars: 90,
  },
};

const MAX_FLIES = 60;
const REVIEWS_PER_BIRD = 40;
const MAX_BIRDS = 6;
const CLOUDY_STARS_SHARE = 0.3;

export interface MoodInput {
  time: TimeOfDay;
  weather: Weather;
  /** 0..1, 0 = new moon. */
  moonPhase?: number;
}

/** The pieces of a region's `Backdrop` the theme actually uses — kept structural so
 * `theme.ts` stays decoupled from `src/regions/types.ts`. */
export interface BackdropInput {
  sky: readonly [string, string, string, string, string, string];
  far: string;
  near: string;
  form: string;
  night?: boolean;
}

/**
 * Pick the day or night backdrop from a region's list, by `mood.time`. Regions ship 2–3 day
 * backdrops plus one night/dusk variant (`Backdrop.night`); picking deterministically by
 * `seed` rather than always the first keeps some variety between grove reloads while still
 * being stable within one render.
 */
export function pickBackdrop<B extends { night?: boolean }>(
  backdrops: readonly B[],
  isNight: boolean,
  seed = 0,
): B | undefined {
  const pool = backdrops.filter((b) => !!b.night === isNight);
  const list = pool.length ? pool : backdrops;
  if (list.length === 0) return undefined;
  return list[Math.abs(seed) % list.length];
}

export interface AmbienceInput {
  streak: number;
  todayReviews: number;
}

/** Build the theme for one frame's mood and ambience: the time-of-day base, weather-mutated. */
export function buildTheme(mood: MoodInput, ambience: AmbienceInput, backdrop?: BackdropInput): Theme {
  const base = TIMES[mood.time];
  const night = mood.time === 'night';
  // A region's own backdrop sky/far/near take over from the generic time-of-day palette —
  // this is what makes Australia actually look different from Japan — while everything
  // weather mutation does below still runs on top of it, so rain/fog/snow etc. still work
  // regardless of region. The orb, cloud shapes, star count and so on stay time-of-day
  // driven, since a Backdrop doesn't define those.
  const sky = backdrop ? [...backdrop.sky] : [...base.sky];
  const far = backdrop?.far ?? base.far;
  const near = backdrop?.near ?? base.near;
  const th: Theme = {
    sky: sky as Theme['sky'],
    orb: base.orb ? { ...base.orb, phase: mood.moonPhase } : null,
    far,
    near,
    ground0: base.ground0,
    ground1: base.ground1,
    grass: base.grass,
    haze: base.haze,
    hazeStep: base.hazeStep,
    water: base.water,
    tint: base.tint ?? null,
    tintAmount: base.tintAmount ?? 0,
    rim: base.rim ?? null,
    clouds: { ...base.clouds },
    stars: base.stars ?? 0,
    flies: 0,
    birds: 0,
    snow: false,
    deepSnow: false,
    rain: 0,
    snowfall: 0,
    fog: null,
    rainbow: false,
    lightning: false,
    flat: false,
    shadow: base.shadow ?? 0,
    hillForm: backdrop?.form ?? 'rolling',
  };

  const w = mood.weather;
  const calm = w === 'clear' || w === 'cloudy' || w === 'afterRain';
  const clearSky = w === 'clear' || w === 'afterRain';
  if (calm && (night || mood.time === 'dusk')) th.flies = clamp(ambience.streak, 0, MAX_FLIES);
  if (calm && !night) th.birds = clamp(Math.ceil(ambience.todayReviews / REVIEWS_PER_BIRD), 0, MAX_BIRDS);
  if (!clearSky) th.stars = w === 'cloudy' ? Math.round(th.stars * CLOUDY_STARS_SHARE) : 0;

  if (w === 'cloudy') {
    th.sky = th.sky.map((c) => mixHex(c, night ? '#1a2030' : '#9aa3ad', 0.6)) as Theme['sky'];
    if (th.orb) th.orb = { ...th.orb, halo: 0, color: mixHex(th.orb.color, th.sky[2], 0.6) };
    th.flat = true;
    th.rim = null;
    th.shadow = 0;
  } else if (w === 'rain' || w === 'storm') {
    const grey = night ? '#10151c' : w === 'storm' ? '#3c464e' : '#56626b';
    th.sky = th.sky.map((c) => mixHex(c, grey, w === 'storm' ? 0.65 : 0.5)) as Theme['sky'];
    th.far = mixHex(th.far, grey, 0.4);
    th.near = mixHex(th.near, grey, 0.4);
    th.ground0 = mixHex(th.ground0, '#33443a', 0.25);
    th.ground1 = mixHex(th.ground1, '#33443a', 0.25);
    th.grass = mixHex(th.grass, '#33443a', 0.25);
    th.haze = mixHex(th.haze, grey, 0.5);
    th.rain = w === 'storm' ? 320 : 260;
    th.lightning = w === 'storm';
    th.orb = null;
    th.rim = null;
    th.shadow = 0;
  } else if (w === 'fog') {
    const fogC = night ? '#3a4458' : '#dcdcd8';
    th.sky = th.sky.map((c) => mixHex(c, fogC, 0.55)) as Theme['sky'];
    th.far = mixHex(th.far, fogC, 0.5);
    th.near = mixHex(th.near, fogC, 0.5);
    th.haze = fogC;
    th.hazeStep *= 1.25;
    th.fog = mixHex(fogC, '#ffffff', night ? 0.1 : 0.3);
    th.clouds = null;
    th.rim = null;
    th.shadow = 0;
  } else if (w === 'snow') {
    th.sky = th.sky.map((c) => mixHex(c, night ? '#26314a' : '#c9d2df', 0.45)) as Theme['sky'];
    th.ground0 = night ? '#61789a' : '#e8eef6';
    th.ground1 = night ? '#34465e' : '#cbd6e4';
    th.grass = night ? '#7890ac' : '#dfe7f1';
    th.snow = true;
    th.snowfall = 190;
    th.water = night ? '#40506c' : '#c9d6e6';
    th.shadow = 0;
    if (th.orb && th.orb.kind === 'sun') th.orb = { ...th.orb, halo: 0, color: mixHex(th.orb.color, th.sky[2], 0.6) };
  } else if (w === 'afterRain') {
    th.sky = th.sky.map((c) => mixHex(c, '#b8bcc8', 0.18)) as Theme['sky'];
    th.rainbow = !night;
    th.rain = 36;
  }

  return th;
}

export function skyGradientStops(th: Theme): RGB[] {
  return th.sky.map(hex);
}
