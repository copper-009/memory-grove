/**
 * The only network call in Memory Grove. Fires when, and only when, the user has typed a
 * city into the Weather setting — see `README.md`'s privacy section, which this file is
 * what makes true.
 *
 * Geocodes the city with Open-Meteo's own geocoding API, fetches the current conditions,
 * and caches the result in local (unsynced) storage for `WEATHER_STALE_MS`, so typing a
 * city doesn't trigger a fetch on every widget mount.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';
import {
  GEOCODE_URL,
  FORECAST_URL,
  parseGeocodeResponse,
  parseForecastResponse,
  mapWeatherCode,
  isFresh,
} from '../data/weather';
import type { CachedWeather, GeocodeResult } from '../data/weather';

const CACHE_KEY = 'real-weather-cache-v1';
const PLACE_KEY = 'real-weather-place-v1';

/**
 * Resolve the real weather for `city`, using the cache when fresh. Returns `null` on any
 * failure (offline, city not found, API error) — the caller falls back to the scenery's own
 * preset weather, exactly as the brief asks, never blocking the render on a network call.
 */
export async function resolveRealWeather(plugin: RNPlugin, city: string): Promise<CachedWeather | null> {
  const trimmed = city.trim();
  if (!trimmed) return null;

  const now = Date.now();
  const cached = await plugin.storage.getLocal<CachedWeather>(CACHE_KEY);
  if (isFresh(cached, trimmed, now)) return cached!;

  try {
    let place: GeocodeResult | null = (await plugin.storage.getLocal<GeocodeResult>(PLACE_KEY)) ?? null;
    if (!place || place.name.toLowerCase() !== trimmed.toLowerCase()) {
      const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(trimmed)}&count=1`);
      if (!geoRes.ok) return null;
      place = parseGeocodeResponse(await geoRes.json());
      if (!place) return null;
      await plugin.storage.setLocal(PLACE_KEY, place);
    }

    const fRes = await fetch(
      `${FORECAST_URL}?latitude=${place.lat}&longitude=${place.lon}&current=weather_code,is_day,temperature_2m`,
    );
    if (!fRes.ok) return null;
    const current = parseForecastResponse(await fRes.json());
    if (!current) return null;

    const result: CachedWeather = {
      city: trimmed,
      fetchedAt: now,
      weather: mapWeatherCode(current.weatherCode),
      isDay: current.isDay,
      place,
    };
    await plugin.storage.setLocal(CACHE_KEY, result);
    return result;
  } catch {
    // Offline, a network error, a malformed response: fall back quietly.
    return cached ?? null;
  }
}
