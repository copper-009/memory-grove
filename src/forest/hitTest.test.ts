import { describe, expect, it } from 'vitest';
import { hitTest, boxAt } from './hitTest';

describe('hitTest', () => {
  it('finds a box containing the point', () => {
    const boxes = [boxAt('plant', 0, 50, 10, 20, 20, 1)];
    expect(hitTest(boxes, 50, 15)?.ref).toBe(0);
    expect(hitTest(boxes, 5, 5)).toBeUndefined();
  });

  it('picks the frontmost (lowest depth) of two overlapping boxes', () => {
    const back = boxAt('plant', 0, 50, 10, 30, 30, 5);
    const front = boxAt('plant', 1, 55, 15, 20, 20, 1);
    const boxes = [back, front];
    expect(hitTest(boxes, 55, 18)?.ref).toBe(1);
  });

  it('is exclusive on the right/bottom edge (half-open box)', () => {
    const b = boxAt('creature', 0, 10, 0, 10, 10, 1); // x0=5,x1=15,y0=0,y1=10
    expect(hitTest([b], 14.9, 9.9)).toBeDefined();
    expect(hitTest([b], 15, 10)).toBeUndefined();
  });

  it('returns undefined for an empty box list', () => {
    expect(hitTest([], 1, 1)).toBeUndefined();
  });
});
