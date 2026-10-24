/**
 * React hook: builds (or loads from cache) the grove, the creature roster for the current
 * region/biome, and the ecosystem health — everything a widget needs to draw one frame.
 *
 * Kept separate from the canvas component so the data-fetch half can change (e.g. to react
 * to `StorageEvents.StorageSyncedChange`) without touching rendering.
 */

import { useEffect, useState, useCallback } from 'react';
import { usePlugin } from '@remnote/plugin-sdk';
import { buildOrLoadGrove, loadStudyCalendar, rosterKey } from './groveBuilder';
import { readSettings } from './settings';
import type { GroveSettings } from './settings';
import type { Grove } from '../data/types';
import type { StudyCalendar, Severity } from '../data/calendar';
import { ecosystemHealth } from '../data/health';
import type { HealthResult } from '../data/health';
import { updateRoster, emptyRoster } from '../data/milestones';
import type { CreatureRoster } from '../data/milestones';
import { regionByKey, DEFAULT_REGION_KEY } from '../regions';
import type { Region, Biome } from '../regions/types';
import { resolveRealWeather } from './weatherFetch';

/** Storage key for a region's chosen biome override — namespaced per region, so picking
 * "Outback" for Australia doesn't also apply if the user switches to Japan and back. */
function biomeKey(regionKey: string): string {
  return `forest.biome.${regionKey}`;
}

/**
 * Which biome to show when the user hasn't picked one: rotate through the region's own
 * biomes by the real calendar month. This is what used to be entirely hardcoded to
 * `biomes[0]` — a region's other ecosystems were never reachable at all, by any means, which
 * is the real cause behind "it's hard to cycle through ecosystems." A plain month-based
 * rotation doesn't claim ecological authenticity (a biome doesn't actually change with the
 * seasons the way weather does), but it does mean every ecosystem in a region gets an equal
 * turn over the year instead of one being permanently invisible.
 */
export function defaultBiomeIndex(region: Region, date: Date = new Date()): number {
  return date.getMonth() % region.biomes.length;
}

export interface GroveBundle {
  grove: Grove;
  settings: GroveSettings;
  calendar: StudyCalendar;
  region: Region;
  biome: Biome;
  biomeIndex: number;
  /** null = following the automatic month rotation. */
  biomeOverride: number | null;
  setBiome: (index: number | null) => void;
  roster: CreatureRoster;
  health: HealthResult;
  activeStudyDays: number;
  /** day number -> cards due that day — the heatmap's "due" shading ahead of today. */
  dueByDay: Map<number, number>;
  /** Set only when "follow the real sky" would apply — i.e. a city is configured and the
   * fetch succeeded. `undefined` means: use the scenery's own preset weather. */
  realWeather?: { weather: string; isDay: boolean };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useGrove(): GroveBundle {
  const plugin = usePlugin();
  const [bundle, setBundle] = useState<Omit<GroveBundle, 'loading' | 'error' | 'refresh' | 'setBiome'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gen, setGen] = useState(0);

  const refresh = useCallback(() => setGen((g) => g + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const settings = await readSettings(plugin);
        const calendar = await loadStudyCalendar(plugin);
        const { grove, overdue, cardCount, dueByDay } = await buildOrLoadGrove(plugin);
        const region = regionByKey(settings.region) ?? regionByKey(DEFAULT_REGION_KEY)!;
        const storedBiomeOverride = await plugin.storage.getSynced<number>(biomeKey(region.key));
        const biomeOverride = storedBiomeOverride != null && storedBiomeOverride < region.biomes.length ? storedBiomeOverride : null;
        const biomeIndex = biomeOverride ?? defaultBiomeIndex(region);
        const biome = region.biomes[biomeIndex];

        const storedRoster = await plugin.storage.getSynced<CreatureRoster>(rosterKey(region.key));
        const roster = updateRoster(storedRoster ?? emptyRoster(), grove.stats.activeStudyDays, grove.stats, grove.today);
        if (JSON.stringify(roster) !== JSON.stringify(storedRoster)) {
          await plugin.storage.setSynced(rosterKey(region.key), roster);
        }

        const health = ecosystemHealth({
          today: grove.today,
          reviewDays: grove.reviewDays,
          calendar,
          severity: settings.severity as Severity,
          overdue,
          totalCards: cardCount,
        });

        // The one network call in the whole plugin, and only when a city is set. Never
        // blocks the first render: it resolves in the background and the bundle updates
        // once it lands, falling back silently to the scenery's own weather until then.
        if (settings.weatherCity) {
          resolveRealWeather(plugin, settings.weatherCity).then((real) => {
            if (!cancelled && real) {
              setBundle((prev) => (prev ? { ...prev, realWeather: { weather: real.weather, isDay: real.isDay } } : prev));
            }
          });
        }

        if (!cancelled) {
          setBundle({
            grove, settings, calendar, region, biome, biomeIndex, biomeOverride, roster, health,
            activeStudyDays: grove.stats.activeStudyDays,
            dueByDay,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin, gen]);

  const setBiome = useCallback(
    (index: number | null) => {
      if (!bundle) return;
      plugin.storage.setSynced(biomeKey(bundle.region.key), index ?? undefined).then(refresh);
    },
    [plugin, bundle, refresh],
  );

  return {
    ...(bundle ?? {
      grove: null as unknown as Grove,
      settings: null as unknown as GroveSettings,
      calendar: null as unknown as StudyCalendar,
      region: null as unknown as Region,
      biome: null as unknown as Biome,
      biomeIndex: 0,
      biomeOverride: null,
      roster: null as unknown as CreatureRoster,
      health: null as unknown as HealthResult,
      activeStudyDays: 0,
      dueByDay: new Map<number, number>(),
    }),
    setBiome,
    loading,
    error,
    refresh,
  };
}
