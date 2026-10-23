import { describe, expect, it } from 'vitest';
import { buildTheme } from './theme';

describe('buildTheme', () => {
  it('shows fireflies on a calm, streaked night, capped at the max', () => {
    const th = buildTheme({ time: 'night', weather: 'clear' }, { streak: 200, todayReviews: 0 });
    expect(th.flies).toBe(60);
  });

  it('shows no fireflies in rain', () => {
    const th = buildTheme({ time: 'night', weather: 'rain' }, { streak: 50, todayReviews: 0 });
    expect(th.flies).toBe(0);
  });

  it('removes the sun and adds rain in a storm', () => {
    const th = buildTheme({ time: 'day', weather: 'storm' }, { streak: 0, todayReviews: 0 });
    expect(th.orb).toBeNull();
    expect(th.rain).toBeGreaterThan(0);
    expect(th.lightning).toBe(true);
  });

  it('shows snow only in the snow weather', () => {
    expect(buildTheme({ time: 'day', weather: 'snow' }, { streak: 0, todayReviews: 0 }).snow).toBe(true);
    expect(buildTheme({ time: 'day', weather: 'clear' }, { streak: 0, todayReviews: 0 }).snow).toBe(false);
  });

  it('shows a rainbow only after rain, by day', () => {
    expect(buildTheme({ time: 'day', weather: 'afterRain' }, { streak: 0, todayReviews: 0 }).rainbow).toBe(true);
    expect(buildTheme({ time: 'night', weather: 'afterRain' }, { streak: 0, todayReviews: 0 }).rainbow).toBe(false);
  });

  it('caps birds by today\'s reviews', () => {
    const th = buildTheme({ time: 'day', weather: 'clear' }, { streak: 0, todayReviews: 1000 });
    expect(th.birds).toBe(6);
  });

  it('never mutates the TIMES table between calls', () => {
    buildTheme({ time: 'day', weather: 'storm' }, { streak: 0, todayReviews: 0 });
    const clean = buildTheme({ time: 'day', weather: 'clear' }, { streak: 0, todayReviews: 0 });
    expect(clean.sky[0]).toBe('#6aa6d8');
  });
});
