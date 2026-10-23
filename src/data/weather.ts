/**
 * Real weather, from Open-Meteo (free, no account, no API key).
 *
 * Pure parsing/mapping lives here, so it's unit-testable without a network call. The actual
 * `fetch()` calls are in `src/widgets/weatherFetch.ts`, which is the only file in the
 * project that makes a network request — and only when the user has typed a city into the
 * Weather setting. See the privacy section of `README.md`.
 */

import type { Weather } from '../forest/theme';

export const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/** How long a fetched forecast is trusted before it's fetched again. */
export const WEATHER_STALE_MS = 30 * 60 * 1000;

export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
  country?: string;
}

export interface CurrentWeather {
  weatherCode: number;
  isDay: boolean;
  temperatureC?: number;
}

/**
 * WMO weather code (what Open-Meteo returns) -> this project's `Weather` union.
 * https://open-meteo.com/en/docs — see "WMO Weather interpretation codes".
 */
export function mapWeatherCode(code: number): Weather {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export function parseGeocodeResponse(body: unknown): GeocodeResult | null {
  const results = (body as { results?: Array<{ name: string; latitude: number; longitude: number; country?: string }> })?.results;
  if (!results || results.length === 0) return null;
  const r = results[0];
  return { name: r.name, lat: r.latitude, lon: r.longitude, country: r.country };
}

export function parseForecastResponse(body: unknown): CurrentWeather | null {
  const current = (body as { current?: { weather_code?: number; is_day?: number; temperature_2m?: number } })?.current;
  if (!current || current.weather_code == null) return null;
  return {
    weatherCode: current.weather_code,
    isDay: current.is_day !== 0,
    temperatureC: current.temperature_2m,
  };
}

export interface CachedWeather {
  city: string;
  fetchedAt: number;
  weather: Weather;
  isDay: boolean;
  place: GeocodeResult;
}

/** Whether a cached entry is still fresh enough to use without refetching. */
export function isFresh(cache: CachedWeather | undefined, city: string, now: number): boolean {
  if (!cache || cache.city.toLowerCase() !== city.trim().toLowerCase()) return false;
  return now - cache.fetchedAt < WEATHER_STALE_MS;
}
