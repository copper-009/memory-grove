/**
 * The canvas widget: one component, used at every placement (sidebar, queue, pane). Sizes
 * itself to its container, scales for device pixel ratio, draws via `drawScene`, and
 * handles hover/tap for the inspector tooltip.
 *
 * Animation discipline, per the brief:
 * - honours `prefers-reduced-motion` when the setting is "system"
 * - pauses the rAF loop entirely when the tab/pane is hidden (IntersectionObserver +
 *   document.visibilityState), so a background widget costs nothing
 * - frozen (animate=false) still shows every sprite, just on its idle frame
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { drawScene } from '../forest/scene';
import type { MoodInput } from '../forest/theme';
import { hitTest } from '../forest/hitTest';
import type { HitBox } from '../forest/hitTest';
import { plantTooltip, creatureTooltip, ecosystemTooltip } from '../forest/tooltip';
import type { Tooltip } from '../forest/tooltip';
import { pauseLabel } from '../data/calendar';
import type { GroveBundle } from './useGrove';
import { resolveMood } from './mood';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/**
 * The canvas's CSS height, given the "Grove shape" setting.
 *
 * `layout.ts`/`scene.ts` work in normalised 0..1 coordinates throughout, so the renderer
 * already draws correctly at any aspect ratio — "landscape" and "vertical" just pick a
 * height from the container's actual width rather than always using the placement's own
 * fixed `height` prop (`defaultHeight`, used for "auto"). Clamped so a very wide pane
 * doesn't produce an absurdly tall vertical strip, or a very narrow sidebar an
 * unreadably short landscape banner.
 */
function heightFor(layout: 'auto' | 'landscape' | 'vertical', cssW: number, defaultHeight: number): number {
  if (layout === 'landscape') return Math.max(140, Math.min(480, Math.round(cssW / 2.6)));
  if (layout === 'vertical') return Math.max(320, Math.min(700, Math.round(cssW * 1.4)));
  return defaultHeight;
}

export interface GroveCanvasProps {
  bundle: GroveBundle;
  height?: number;
  onTreeClick?: (day: number) => void;
}

export function GroveCanvas({ bundle, height = 220 }: GroveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boxesRef = useRef<HitBox[]>([]);
  const t0Ref = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);
  const [tooltip, setTooltip] = useState<{ content: Tooltip; x: number; y: number } | null>(null);

  const biome = bundle.region?.biomes?.[0];

  const animate = (() => {
    const mode = bundle.settings?.animate ?? 'system';
    if (mode === 'off') return false;
    if (mode === 'on') return true;
    return !prefersReducedMotion();
  })();

  const draw = useCallback(
    (tSeconds: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || !bundle.grove || !biome) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = container.clientWidth || 400;
      const cssH = heightFor(bundle.settings.layout, cssW, height);
      const W = Math.round(cssW * dpr);
      const H = Math.round(cssH * dpr);
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const g = canvas.getContext('2d');
      if (!g) return;

      // "Follow the real sky" (weather set to "auto") uses the fetched city weather when
      // it has landed; otherwise, and for every other weather setting, the preset wins.
      const mood: MoodInput = resolveMood(bundle);
      const paused = pauseLabel(bundle.calendar, bundle.grove.today) != null;

      const result = drawScene(g, W, H, {
        grove: bundle.grove,
        biome,
        roster: bundle.roster,
        activeStudyDays: bundle.activeStudyDays,
        mood,
        visualHealth: bundle.health.visual,
        t: tSeconds,
        animate,
        paused,
        dpr,
        regionKey: bundle.region.key,
      });
      boxesRef.current = result.boxes;
    },
    [bundle, biome, height, animate],
  );

  // Animation loop: paused when hidden, frozen at frame 0 when `animate` is false.
  useEffect(() => {
    const loop = () => {
      if (visibleRef.current) {
        const t = animate ? (performance.now() - t0Ref.current) / 1000 : 0;
        draw(t);
      }
      rafRef.current = animate ? requestAnimationFrame(loop) : null;
    };
    if (animate) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      draw(0);
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, animate]);

  // Pause the loop entirely off-screen or when the tab is hidden, per the brief.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting && document.visibilityState === 'visible';
    });
    io.observe(el);
    const onVis = () => {
      visibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const pointAt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return [(e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr];
  };

  const showTooltipFor = (box: HitBox, clientX: number, clientY: number) => {
    if (!bundle.grove || !biome) return;
    let content: Tooltip | null = null;
    if (box.kind === 'plant' && box.ref >= 0) {
      const plant = bundle.grove.plants[box.ref];
      const species = biome.plants[plant.species % biome.plants.length];
      content = plantTooltip(plant, species);
    } else if (box.kind === 'creature') {
      const save = bundle.roster.creatures.find((c) => c.slot === box.ref);
      const creature = biome.creatures.find((c) => c.slot === box.ref);
      if (save && creature) {
        content = creatureTooltip(creature, save, bundle.region.key, bundle.activeStudyDays, 'active');
      }
    }
    if (content) setTooltip({ content, x: clientX, y: clientY });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch') return; // touch uses tap, not hover
    const [x, y] = pointAt(e);
    const box = hitTest(boxesRef.current, x, y);
    if (box) showTooltipFor(box, e.clientX, e.clientY);
    else setTooltip(null);
  };

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'touch') return;
    const [x, y] = pointAt(e);
    const box = hitTest(boxesRef.current, x, y);
    if (box) showTooltipFor(box, e.clientX, e.clientY);
    else setTooltip(null);
  };

  const onEcosystemHover = () => {
    if (!bundle.grove || !bundle.health) return;
    const label = pauseLabel(bundle.calendar, bundle.grove.today);
    const content = ecosystemTooltip(bundle.health.visual, bundle.health.trend, bundle.health.advice, label);
    setTooltip({ content, x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className="rn-clr-background-light-gray" style={{ position: 'relative', width: '100%', height }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height, imageRendering: 'pixelated' }}
        onPointerMove={onMove}
        onPointerDown={onTap}
        onPointerLeave={() => setTooltip(null)}
        onDoubleClick={onEcosystemHover}
      />
      {tooltip && (
        <div
          className="rn-clr-background-primary rn-clr-content-primary"
          style={{
            position: 'fixed',
            left: tooltip.x + 12,
            top: tooltip.y + 12,
            maxWidth: 260,
            padding: '8px 10px',
            borderRadius: 6,
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            fontSize: 12,
            lineHeight: 1.4,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{tooltip.content.title}</div>
          {tooltip.content.lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
          {'conservationNote' in tooltip.content && tooltip.content.conservationNote && (
            <div style={{ marginTop: 4, opacity: 0.8, fontStyle: 'italic' }}>{tooltip.content.conservationNote}</div>
          )}
        </div>
      )}
    </div>
  );
}
