import { describe, expect, it } from 'vitest';
import { cellColor, monthLabels, layoutHeatmap } from './heatmapRender';
import { buildTheme } from './theme';
import type { HeatCell, HeatmapData } from '../data/heatmap';

const theme = buildTheme({ time: 'day', weather: 'clear' }, { streak: 0, todayReviews: 0 });

function cell(overrides: Partial<HeatCell>): HeatCell {
  return { day: 0, date: '2026-03-01', reviews: 0, seconds: 0, due: 0, kind: 'missed', level: 0, planted: false, ...overrides };
}

describe('cellColor', () => {
  it('gives every kind a distinct fill', () => {
    const kinds = ['studied', 'excused', 'missed', 'future', 'due'] as const;
    const fills = kinds.map((k) => cellColor(cell({ kind: k, level: 0.6 }), theme).fill);
    expect(new Set(fills).size).toBe(kinds.length);
  });

  it('marks excused with a pattern, not a plain fill — a break is not a gap', () => {
    expect(cellColor(cell({ kind: 'excused' }), theme).pattern).toBe('stripe');
    expect(cellColor(cell({ kind: 'studied' }), theme).pattern).toBe('none');
  });

  it('shades studied days by level', () => {
    const low = cellColor(cell({ kind: 'studied', level: 0.1 }), theme).fill;
    const high = cellColor(cell({ kind: 'studied', level: 1 }), theme).fill;
    expect(low).not.toBe(high);
  });
});

describe('monthLabels', () => {
  it('labels only the first week a new month appears in', () => {
    const cells: Array<HeatCell | null> = [
      null, cell({ date: '2026-02-28' }), cell({ date: '2026-03-01' }), cell({ date: '2026-03-02' }), null, null, null,
      cell({ date: '2026-03-03' }), cell({ date: '2026-03-04' }), cell({ date: '2026-03-05' }), null, null, null, null,
    ];
    const labels = monthLabels(cells, 2);
    expect(labels.map((l) => l.label)).toEqual(['Feb', 'Mar']);
    // Each week-column's label comes from its own first filled cell — March appears mid-way
    // through week 0 (index 2) but isn't that week's *first* cell, so it labels week 1, the
    // next column whose first cell is already March. Standard GitHub-style behaviour.
    expect(labels[1].week).toBe(1);
  });
});

describe('layoutHeatmap', () => {
  it('produces a full-week grid with month labels', () => {
    const data: HeatmapData = {
      cells: Array.from({ length: 40 }, (_, i) => cell({ day: i, date: `2026-03-${String((i % 28) + 1).padStart(2, '0')}` })),
      from: 0, to: 39, today: 20, maxReviews: 10, streak: 3, longestStreak: 10,
      totalReviews: 100, dueNext7: 5, dueNext30: 20, activeDays: 15,
    };
    const layout = layoutHeatmap(data);
    expect(layout.grid.length % 7).toBe(0);
    expect(layout.weeks).toBeGreaterThan(0);
    expect(layout.months.length).toBeGreaterThan(0);
  });
});
