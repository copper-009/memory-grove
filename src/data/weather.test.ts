import { describe, expect, it } from 'vitest';
import { mapWeatherCode, parseGeocodeResponse, parseForecastResponse, isFresh, WEATHER_STALE_MS } from './weather';

describe('mapWeatherCode', () => {
  it('maps clear and mostly-clear codes to clear', () => {
    expect(mapWeatherCode(0)).toBe('clear');
    expect(mapWeatherCode(1)).toBe('clear');
  });

  it('maps overcast to cloudy', () => {
    expect(mapWeatherCode(3)).toBe('cloudy');
  });

  it('maps fog codes to fog', () => {
    expect(mapWeatherCode(45)).toBe('fog');
    expect(mapWeatherCode(48)).toBe('fog');
  });

  it('maps drizzle/rain/showers to rain', () => {
    for (const c of [51, 61, 63, 65, 80, 82]) expect(mapWeatherCode(c)).toBe('rain');
  });

  it('maps snow codes to snow', () => {
    for (const c of [71, 73, 75, 85, 86]) expect(mapWeatherCode(c)).toBe('snow');
  });

  it('maps thunderstorm codes to storm', () => {
    expect(mapWeatherCode(95)).toBe('storm');
    expect(mapWeatherCode(99)).toBe('storm');
  });
});

describe('parseGeocodeResponse', () => {
  it('reads the first result', () => {
    const r = parseGeocodeResponse({ results: [{ name: 'Brisbane', latitude: -27.47, longitude: 153.02, country: 'Australia' }] });
    expect(r).toEqual({ name: 'Brisbane', lat: -27.47, lon: 153.02, country: 'Australia' });
  });

  it('returns null for an empty or missing result set', () => {
    expect(parseGeocodeResponse({ results: [] })).toBeNull();
    expect(parseGeocodeResponse({})).toBeNull();
  });
});

describe('parseForecastResponse', () => {
  it('reads the current conditions', () => {
    const r = parseForecastResponse({ current: { weather_code: 3, is_day: 1, temperature_2m: 18.2 } });
    expect(r).toEqual({ weatherCode: 3, isDay: true, temperatureC: 18.2 });
  });

  it('returns null without a weather code', () => {
    expect(parseForecastResponse({ current: {} })).toBeNull();
    expect(parseForecastResponse({})).toBeNull();
  });
});

describe('isFresh', () => {
  const cache = { city: 'Brisbane', fetchedAt: 1000, weather: 'clear' as const, isDay: true, place: { name: 'Brisbane', lat: 0, lon: 0 } };

  it('is fresh within the stale window, for the same city (case-insensitive)', () => {
    expect(isFresh(cache, 'brisbane', 1000 + WEATHER_STALE_MS - 1)).toBe(true);
  });

  it('is stale past the window', () => {
    expect(isFresh(cache, 'Brisbane', 1000 + WEATHER_STALE_MS + 1)).toBe(false);
  });

  it('is stale for a different city', () => {
    expect(isFresh(cache, 'Sydney', 1000)).toBe(false);
  });

  it('is stale with no cache', () => {
    expect(isFresh(undefined, 'Brisbane', 1000)).toBe(false);
  });
});
