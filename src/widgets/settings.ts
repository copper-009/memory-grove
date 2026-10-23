/**
 * Settings: registration and typed reads.
 *
 * RemNote auto-renders registered settings in its own Settings → Plugins page, grouped
 * under the plugin's name — there is no API for custom tabs, so "Scenery / Forest / Nature
 * / Weather" from the brief are approximated as an id prefix (`scenery.*`, `forest.*`,
 * `nature.*`, `weather.*`) rather than literal tabs. Logged in `DECISIONS.md`. The one
 * place that genuinely needs custom interactive UI — the study calendar and pause button —
 * is its own popup widget (`calendar_widget.tsx`), opened from a command.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';

export const TIME_OPTIONS = ['dawn', 'day', 'goldenHour', 'dusk', 'night', 'auto'] as const;
export const WEATHER_OPTIONS = ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'afterRain', 'auto'] as const;
export const SEVERITY_OPTIONS = ['peaceful', 'gentle', 'wild', 'merciless', 'custom'] as const;
export const ANIMATE_OPTIONS = ['on', 'off', 'system'] as const;
export const LAYOUT_OPTIONS = ['auto', 'landscape', 'vertical'] as const;
export const REGION_KEYS = [
  'australia', 'aotearoa', 'japan', 'madagascar', 'costarica', 'eastafrica',
  'canada', 'norway', 'nepal', 'patagonia', 'borneo',
] as const;

/**
 * Every dropdown's raw value, labelled for a human. Settings registered with a bare value
 * as its own label (`{ label: v }`) is what made "Follow the real sky" invisible as an
 * option — it showed up as the literal string "auto", with nothing to say what that meant.
 */
const TIME_LABELS: Record<(typeof TIME_OPTIONS)[number], string> = {
  dawn: 'Dawn',
  day: 'Day',
  goldenHour: 'Golden hour',
  dusk: 'Dusk',
  night: 'Night',
  auto: 'Follow the real sky',
};
const WEATHER_LABELS: Record<(typeof WEATHER_OPTIONS)[number], string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  storm: 'Storm',
  fog: 'Fog',
  snow: 'Snow',
  afterRain: 'After rain',
  auto: 'Follow the real sky',
};
const SEVERITY_LABELS: Record<(typeof SEVERITY_OPTIONS)[number], string> = {
  peaceful: 'Peaceful — only growth, nothing ever declines',
  gentle: 'Gentle — mild decline, recovers quickly (default)',
  wild: 'Wild — noticeable decline, creatures hide',
  merciless: 'Merciless — strong decline, slow recovery',
  custom: 'Custom — set your own window/decay/recovery',
};
const ANIMATE_LABELS: Record<(typeof ANIMATE_OPTIONS)[number], string> = {
  on: 'Always animate',
  off: 'Never animate (still image)',
  system: 'Follow system setting (respects reduced motion)',
};
const LAYOUT_LABELS: Record<(typeof LAYOUT_OPTIONS)[number], string> = {
  auto: 'Auto — fit each placement’s own space',
  landscape: 'Landscape — always a wide banner',
  vertical: 'Vertical — a tall strip for a narrow sidebar',
};
const REGION_LABELS: Record<(typeof REGION_KEYS)[number], string> = {
  australia: 'Australia',
  aotearoa: 'Aotearoa New Zealand',
  japan: 'Japan',
  madagascar: 'Madagascar',
  costarica: 'Costa Rica',
  eastafrica: 'East African savanna',
  canada: 'Canada',
  norway: 'Norway',
  nepal: 'Nepal',
  patagonia: 'Patagonia',
  borneo: 'Borneo',
};

function options<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((v) => ({ key: v, label: labels[v], value: v }));
}

export async function registerSettings(plugin: RNPlugin): Promise<void> {
  // -- Scenery --------------------------------------------------------------
  // There is deliberately no standalone "environment" preset picker (no "synthwave",
  // "lanterns at night", "bamboo grove" generic skins unrelated to the grove's actual
  // place): the backdrop now comes from the chosen region itself and the real calendar
  // season (`currentSeasonFor`, `theme.ts`'s `pickBackdrop`) - a cherry-blossom hillside
  // in Japan only appears in spring, an aurora sky in Norway only in winter, and so on.
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.time',
    title: 'Scenery — time of day',
    description: 'Pick "Follow the real sky" to keep this in step with your clock.',
    options: options(TIME_OPTIONS, TIME_LABELS),
    defaultValue: 'goldenHour',
  });
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.weather',
    title: 'Scenery — weather',
    description: 'Pick "Follow the real sky" to use live weather for your city, set below.',
    options: options(WEATHER_OPTIONS, WEATHER_LABELS),
    defaultValue: 'clear',
  });
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.animate',
    title: 'Animate the grove',
    options: options(ANIMATE_OPTIONS, ANIMATE_LABELS),
    defaultValue: 'system',
  });

  // -- Forest -----------------------------------------------------------
  await plugin.settings.registerDropdownSetting({
    id: 'forest.region',
    title: 'Region',
    description: 'Which native ecosystem your grove draws from. Switching keeps your progress — your unlocked creatures, their ages and names all carry over.',
    options: options(REGION_KEYS, REGION_LABELS),
    defaultValue: 'australia',
  });
  await plugin.settings.registerNumberSetting({
    id: 'forest.rolloverHour',
    title: 'Day starts at (hour, 0-23)',
    description: 'A card studied just after midnight still joins the day before, if it is before this hour.',
    defaultValue: 4,
  });
  await plugin.settings.registerNumberSetting({
    id: 'forest.breakDays',
    title: 'Days away before a pond forms',
    defaultValue: 14,
  });
  await plugin.settings.registerBooleanSetting({
    id: 'forest.showOnFinishedQueue',
    title: 'Show on the finished queue screen',
    defaultValue: true,
  });
  await plugin.settings.registerBooleanSetting({
    id: 'forest.showSidebar',
    title: 'Show in the right sidebar',
    defaultValue: true,
  });
  await plugin.settings.registerBooleanSetting({
    id: 'forest.showOnLearningProgress',
    title: 'Show on the Learning Progress page',
    description: 'Adds the grove to RemNote\'s own stats page, styled to match its other cards.',
    defaultValue: true,
  });
  await plugin.settings.registerDropdownSetting({
    id: 'forest.layout',
    title: 'Grove shape',
    description: 'Which shape the grove draws in, wherever it appears.',
    options: options(LAYOUT_OPTIONS, LAYOUT_LABELS),
    defaultValue: 'auto',
  });
  await plugin.settings.registerStringSetting({
    id: 'forest.excludedRemIds',
    title: 'Exclude these Rem (comma-separated IDs)',
    description: 'Cards under these Rem, and their descendants, are left out of the grove.',
    defaultValue: '',
  });

  // -- Nature (ecosystem severity) ---------------------------------------
  await plugin.settings.registerDropdownSetting({
    id: 'nature.severity',
    title: 'Nature',
    description: 'How much a missed pattern of study shows in the ecosystem.',
    options: options(SEVERITY_OPTIONS, SEVERITY_LABELS),
    defaultValue: 'gentle',
  });

  // -- Weather (real, opt-in) ---------------------------------------------
  await plugin.settings.registerStringSetting({
    id: 'weather.city',
    title: 'Real weather — city (optional)',
    description: 'Type a city to use real weather from Open-Meteo. Leave blank to keep using the preset above. Only the city name is sent, and only if you fill this in.',
    defaultValue: '',
  });
}

export interface GroveSettings {
  time: string;
  weather: string;
  animate: 'on' | 'off' | 'system';
  region: string;
  rolloverHour: number;
  breakDays: number;
  showOnFinishedQueue: boolean;
  showSidebar: boolean;
  showOnLearningProgress: boolean;
  layout: 'auto' | 'landscape' | 'vertical';
  excludedRemIds: string[];
  severity: string;
  weatherCity: string;
}

/**
 * Two settings also have a command that cycles them ("Toggle animation", "Change
 * scenery"). Since the SDK has no `setSetting` — only `register*Setting` and read-only
 * `getSetting` — those commands write a same-shaped override to synced storage instead,
 * and this is where it is read back and preferred over the registered value.
 */
async function withOverride<T>(plugin: RNPlugin, settingId: string, overrideKey: string, fallback: T): Promise<T> {
  const override = await plugin.storage.getSynced<T>(overrideKey);
  if (override !== undefined) return override;
  const registered = await plugin.settings.getSetting<T>(settingId);
  return registered ?? fallback;
}

export async function readSettings(plugin: RNPlugin): Promise<GroveSettings> {
  const [
    time, weather, animate, region, rolloverHour, breakDays,
    showOnFinishedQueue, showSidebar, showOnLearningProgress, layout, excludedRemIds, severity, weatherCity,
  ] = await Promise.all([
    plugin.settings.getSetting<string>('scenery.time'),
    plugin.settings.getSetting<string>('scenery.weather'),
    withOverride<'on' | 'off' | 'system'>(plugin, 'scenery.animate', 'scenery.animate.override', 'system'),
    plugin.settings.getSetting<string>('forest.region'),
    plugin.settings.getSetting<number>('forest.rolloverHour'),
    plugin.settings.getSetting<number>('forest.breakDays'),
    plugin.settings.getSetting<boolean>('forest.showOnFinishedQueue'),
    plugin.settings.getSetting<boolean>('forest.showSidebar'),
    plugin.settings.getSetting<boolean>('forest.showOnLearningProgress'),
    plugin.settings.getSetting<'auto' | 'landscape' | 'vertical'>('forest.layout'),
    plugin.settings.getSetting<string>('forest.excludedRemIds'),
    plugin.settings.getSetting<string>('nature.severity'),
    plugin.settings.getSetting<string>('weather.city'),
  ]);
  return {
    time: time ?? 'goldenHour',
    weather: weather ?? 'clear',
    animate: animate ?? 'system',
    region: region ?? 'australia',
    rolloverHour: rolloverHour ?? 4,
    breakDays: breakDays ?? 14,
    showOnFinishedQueue: showOnFinishedQueue ?? true,
    showSidebar: showSidebar ?? true,
    showOnLearningProgress: showOnLearningProgress ?? true,
    layout: layout ?? 'auto',
    excludedRemIds: (excludedRemIds ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    severity: severity ?? 'gentle',
    weatherCity: weatherCity ?? '',
  };
}
