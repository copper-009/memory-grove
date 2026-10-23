import { describe, expect, it } from 'vitest';
import { visualParamsFor, applyGroundHealth } from './ecosystemVisual';

describe('visualParamsFor', () => {
  it('is fullest at perfect health', () => {
    const p = visualParamsFor(100);
    expect(p.band).toBe('thriving');
    expect(p.grassSaturation).toBeCloseTo(1, 5);
    expect(p.understoryDensity).toBeCloseTo(1, 5);
    expect(p.groundTint).toBeNull();
  });

  it('dulls progressively as health falls', () => {
    const high = visualParamsFor(90);
    const mid = visualParamsFor(50);
    const low = visualParamsFor(10);
    expect(high.grassSaturation).toBeGreaterThan(mid.grassSaturation);
    expect(mid.grassSaturation).toBeGreaterThan(low.grassSaturation);
    expect(high.creatureActivity).toBeGreaterThan(low.creatureActivity);
    expect(low.groundTint).not.toBeNull();
  });

  it('never produces a negative or over-1 fraction', () => {
    for (const h of [0, 25, 50, 75, 100]) {
      const p = visualParamsFor(h);
      for (const v of [p.grassSaturation, p.waterClarity, p.understoryDensity, p.creatureActivity, p.ambienceGain]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('applyGroundHealth', () => {
  it('returns a valid hex colour', () => {
    const c = applyGroundHealth('#6f9a58', visualParamsFor(40));
    expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('leaves the colour essentially unchanged at full health', () => {
    const c = applyGroundHealth('#6f9a58', visualParamsFor(100));
    expect(c.toLowerCase()).toBe('#6f9a58');
  });
});
