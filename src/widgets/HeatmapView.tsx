/**
 * The study heatmap: a GitHub-contribution-style grid under the grove, matching Memory
 * Forest's own "study days in green, upcoming reviews in brown" look. Reads the grove's
 * review history directly (not the SDK), so it is cheap to redraw and never triggers a
 * fresh grove build on its own.
 */

import { useEffect, useRef, useState } from 'react';
import { buildHeatmap } from '../data/heatmap';
import { layoutHeatmap, cellColor } from '../forest/heatmapRender';
import { buildTheme } from '../forest/theme';
import type { MoodInput } from '../forest/theme';
import type { Grove } from '../data/types';
import type { StudyCalendar } from '../data/calendar';

export interface HeatmapViewProps {
  grove: Grove;
  calendar: StudyCalendar;
  dueByDay?: ReadonlyMap<number, number>;
  mood: MoodInput;
  /** Pixel size of one day cell, before device-pixel-ratio scaling. */
  cellSize?: number;
  /** How many days back to show. Defaults to a season's worth, which fits a sidebar; the
   * pane view asks for a full year. */
  daysBack?: number;
  compact?: boolean;
}

const WEEK_START = 1; // Monday, matching the brief's default option

export function HeatmapView({ grove, calendar, dueByDay, mood, cellSize = 8, daysBack, compact = false }: HeatmapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const data = buildHeatmap(grove, { daysBack: daysBack ?? (compact ? 120 : 300), calendar, dueByDay });
  const layout = layoutHeatmap(data, WEEK_START);
  const theme = buildTheme(mood, { streak: grove.stats.streak, todayReviews: grove.stats.todayReviews });

  const gap = 1;
  const cs = cellSize;
  const labelH = compact ? 0 : 12;
  const W = layout.weeks * (cs + gap);
  const H = 7 * (cs + gap) + labelH;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.scale(dpr, dpr);
    g.clearRect(0, 0, W, H);

    if (!compact) {
      g.fillStyle = 'rgba(128,128,128,0.7)';
      g.font = '9px monospace';
      g.textBaseline = 'top';
      for (const m of layout.months) {
        g.fillText(m.label, m.week * (cs + gap), 0);
      }
    }

    layout.grid.forEach((cell, i) => {
      if (!cell) return;
      const week = Math.floor(i / 7);
      const dow = i % 7;
      const x = week * (cs + gap);
      const y = labelH + dow * (cs + gap);
      const { fill, pattern } = cellColor(cell, theme);
      g.fillStyle = fill;
      g.fillRect(x, y, cs, cs);
      if (pattern === 'stripe') {
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x, y + cs);
        g.lineTo(x + cs, y);
        g.stroke();
      }
      if (cell.day === data.today) {
        g.strokeStyle = 'rgba(255,255,255,0.8)';
        g.lineWidth = 1;
        g.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grove, calendar, dueByDay, mood.time, mood.weather, cellSize, compact, daysBack]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const week = Math.floor(x / (cs + gap));
    const dow = Math.floor((y - labelH) / (cs + gap));
    const cell = layout.grid[week * 7 + dow];
    if (!cell) {
      setHover(null);
      return;
    }
    const text =
      cell.kind === 'due'
        ? `${cell.date}: ${cell.due} card${cell.due === 1 ? '' : 's'} due`
        : cell.kind === 'excused'
          ? `${cell.date}: excused`
          : cell.kind === 'future'
            ? cell.date
            : `${cell.date}: ${cell.reviews} review${cell.reviews === 1 ? '' : 's'}`;
    setHover({ x: e.clientX, y: e.clientY, text });
  };

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
      {!compact && (
        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, display: 'flex', gap: 12 }}>
          <span>Streak: {data.streak}d (longest {data.longestStreak})</span>
          <span>{data.totalReviews} reviews</span>
          <span>{data.dueNext7} due this week</span>
        </div>
      )}
      {hover && (
        <div
          style={{
            position: 'fixed',
            left: hover.x + 10,
            top: hover.y + 10,
            background: 'rgba(20,20,20,0.9)',
            color: '#fff',
            padding: '3px 6px',
            borderRadius: 4,
            fontSize: 11,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
}
