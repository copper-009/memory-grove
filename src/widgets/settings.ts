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

export const ENVIRONMENTS = ['natural', 'misty_valley', 'aurora', 'lanterns', 'bamboo', 'synthwave', 'daily'] as const;
export const TIME_OPTIONS = ['dawn', 'day', 'goldenHour', 'dusk', 'night', 'auto'] as const;
export const WEATHER_OPTIONS = ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'afterRain', 'auto'] as const;
export const SEVERITY_OPTIONS = ['peaceful', 'gentle', 'wild', 'merciless', 'custom'] as const;
export const ANIMATE_OPTIONS = ['on', 'off', 'system'] as const;

export async function registerSettings(plugin: RNPlugin): Promise<void> {
  // -- Scenery --------------------------------------------------------------
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.environment',
    title: 'Scenery — environment',
    description: 'A preset scene, or "Surprise me daily" for a different one each day.',
    options: ENVIRONMENTS.map((v) => ({ key: v, label: v, value: v })),
    defaultValue: 'natural',
  });
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.time',
    title: 'Scenery — time of day',
    description: '"Follow the real sky" keeps this in step with your clock.',
    options: TIME_OPTIONS.map((v) => ({ key: v, label: v, value: v })),
    defaultValue: 'goldenHour',
  });
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.weather',
    title: 'Scenery — weather',
    description: '"Follow the real sky" uses live weather for your city below.',
    options: WEATHER_OPTIONS.map((v) => ({ key: v, label: v, value: v })),
    defaultValue: 'clear',
  });
  await plugin.settings.registerDropdownSetting({
    id: 'scenery.animate',
    title: 'Animate the grove',
    options: ANIMATE_OPTIONS.map((v) => ({ key: v, label: v, value: v })),
    defaultValue: 'system',
  });

  // -- Forest -----------------------------------------------------------
  await plugin.settings.registerDropdownSetting({
    id: 'forest.region',
    title: 'Region',
    description: 'Which native ecosystem your grove draws from. Switching keeps your progress.',
    options: [
      'australia', 'aotearoa', 'japan', 'madagascar', 'costarica', 'eastafrica',
      'canada', 'norway', 'nepal', 'patagonia', 'borneo',
    ].map((v) => ({ key: v, label: v, value: v })),
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
    description: 'How much a missed pattern of study shows in the ecosystem. Peaceful never declines; Merciless declines hardest and recovers slowest.',
    options: SEVERITY_OPTIONS.map((v) => ({ key: v, label: v, value: v })),
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
  environment: string;
  time: string;
  weather: string;
  animate: 'on' | 'off' | 'system';
  region: string;
  rolloverHour: number;
  breakDays: number;
  showOnFinishedQueue: boolean;
  showSidebar: boolean;
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
    environment, time, weather, animate, region, rolloverHour, breakDays,
    showOnFinishedQueue, showSidebar, excludedRemIds, severity, weatherCity,
  ] = await Promise.all([
    withOverride(plugin, 'scenery.environment', 'scenery.environment.override', 'natural'),
    plugin.settings.getSetting<string>('scenery.time'),
    plugin.settings.getSetting<string>('scenery.weather'),
    withOverride<'on' | 'off' | 'system'>(plugin, 'scenery.animate', 'scenery.animate.override', 'system'),
    plugin.settings.getSetting<string>('forest.region'),
    plugin.settings.getSetting<number>('forest.rolloverHour'),
    plugin.settings.getSetting<number>('forest.breakDays'),
    plugin.settings.getSetting<boolean>('forest.showOnFinishedQueue'),
    plugin.settings.getSetting<boolean>('forest.showSidebar'),
    plugin.settings.getSetting<string>('forest.excludedRemIds'),
    plugin.settings.getSetting<string>('nature.severity'),
    plugin.settings.getSetting<string>('weather.city'),
  ]);
  return {
    environment: environment ?? 'natural',
    time: time ?? 'goldenHour',
    weather: weather ?? 'clear',
    animate: animate ?? 'system',
    region: region ?? 'australia',
    rolloverHour: rolloverHour ?? 4,
    breakDays: breakDays ?? 14,
    showOnFinishedQueue: showOnFinishedQueue ?? true,
    showSidebar: showSidebar ?? true,
    excludedRemIds: (excludedRemIds ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    severity: severity ?? 'gentle',
    weatherCity: weatherCity ?? '',
  };
}
