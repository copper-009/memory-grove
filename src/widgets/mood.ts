/**
 * Resolve a `GroveBundle`'s settings into the `MoodInput` the renderer actually draws —
 * shared by `GroveCanvas` and `HeatmapView` so a "follow the real sky" city's live weather
 * is reflected consistently in both the scene and the heatmap's colouring, rather than
 * each component re-deriving (and potentially disagreeing on) the same thing.
 */
import type { MoodInput } from '../forest/theme';
import type { GroveBundle } from './useGrove';

export function resolveMood(bundle: Pick<GroveBundle, 'settings' | 'realWeather'>): MoodInput {
  const liveWeather = bundle.settings.weather === 'auto' && bundle.realWeather ? bundle.realWeather.weather : null;
  return {
    time: (bundle.settings.time === 'auto' ? 'day' : bundle.settings.time) as MoodInput['time'],
    weather: (liveWeather ?? (bundle.settings.weather === 'auto' ? 'clear' : bundle.settings.weather)) as MoodInput['weather'],
  };
}
