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
import type { Region } from '../regions/types';
import { resolveRealWeather } from './weatherFetch';

export interface GroveBundle {
  grove: Grove;
  settings: GroveSettings;
  calendar: StudyCalendar;
  region: Region;
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
  const [bundle, setBundle] = useState<Omit<GroveBundle, 'loading' | 'error' | 'refresh'> | null>(null);
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
            grove, settings, calendar, region, roster, health,
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

  return {
    ...(bundle ?? {
      grove: null as unknown as Grove,
      settings: null as unknown as GroveSettings,
      calendar: null as unknown as StudyCalendar,
      region: null as unknown as Region,
      roster: null as unknown as CreatureRoster,
      health: null as unknown as HealthResult,
      activeStudyDays: 0,
      dueByDay: new Map<number, number>(),
    }),
    loading,
    error,
    refresh,
  };
}
