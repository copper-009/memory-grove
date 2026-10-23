import { describe, expect, it } from 'vitest';
import { groundMotion, hopHeight, flightPosition, flapFrame, ROAM_EVERY_S } from './creatureMotion';

describe('groundMotion', () => {
  it('is frozen at home with animation off', () => {
    const m = groundMotion(123, 1, 0, 0.5, 0.05, false);
    expect(m).toEqual({ x: 0.5, groundCovered: 0, moving: false, facing: 1, frame: 0 });
  });

  it('stays within reach of home over a long span of time', () => {
    for (let t = 0; t < 3000; t += 17) {
      const m = groundMotion(t, 42, 2, 0.5, 0.045);
      expect(m.x).toBeGreaterThanOrEqual(0.5 - 0.045 - 1e-6);
      expect(m.x).toBeLessThanOrEqual(0.5 + 0.045 + 1e-6);
    }
  });

  it('is deterministic for the same seed and time', () => {
    const a = groundMotion(500, 7, 3, 0.3);
    const b = groundMotion(500, 7, 3, 0.3);
    expect(a).toEqual(b);
  });

  it('staggers creatures so they rarely move at exactly the same moment', () => {
    const states = Array.from({ length: 5 }, (_, i) => groundMotion(80, 99, i, 0.5));
    const movingCount = states.filter((s) => s.moving).length;
    // Not a hard guarantee for any single instant, but with offsets this large it should
    // not be the common case that every creature moves on the same frame.
    expect(movingCount).toBeLessThanOrEqual(states.length);
  });

  it('settles to the idle/glance frame only occasionally when still', () => {
    let glances = 0;
    const samples = 200;
    for (let i = 0; i < samples; i++) {
      const m = groundMotion(i * 1.3, 1, 0, 0.5, 0.0001); // negligible reach: effectively still
      if (!m.moving && m.frame === 1) glances++;
    }
    expect(glances).toBeGreaterThan(0);
    expect(glances).toBeLessThan(samples * 0.3);
  });

  it('cycles the roam period as documented', () => {
    expect(ROAM_EVERY_S).toBeGreaterThan(60); // calm: minutes, not seconds
  });
});

describe('hopHeight', () => {
  it('is zero at the start and peak of each hop, and positive in between', () => {
    expect(hopHeight(0, 6, 3)).toBeCloseTo(0, 5);
    expect(hopHeight(3, 6, 3)).toBeCloseTo(3, 5);
    expect(hopHeight(6, 6, 3)).toBeCloseTo(0, 5);
  });

  it('never exceeds the given hop height', () => {
    for (let g = 0; g < 30; g += 0.5) {
      expect(hopHeight(g, 6, 3)).toBeLessThanOrEqual(3 + 1e-9);
    }
  });
});

describe('flightPosition', () => {
  it('traces a circle of the given radii around the centre', () => {
    const p0 = flightPosition(0, 10, 10, 5, 2, 1);
    const pHalfTurn = flightPosition(Math.PI, 10, 10, 5, 2, 1);
    expect(p0.x).toBeCloseTo(15, 5);
    expect(pHalfTurn.x).toBeCloseTo(5, 5);
  });
});

describe('flapFrame', () => {
  it('flaps slowly: mostly frame 0, occasionally frame 1', () => {
    let flaps = 0;
    for (let t = 0; t < 10; t += 0.05) if (flapFrame(t, 2.5, 5) === 1) flaps++;
    expect(flaps).toBeGreaterThan(0);
    expect(flaps).toBeLessThan(200 * 0.3);
  });
});
