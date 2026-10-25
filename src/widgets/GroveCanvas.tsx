/**
 * The grove view: one component, used at every placement (sidebar, queue, pane, learning
 * progress). Mounts the vendored Memory Forest engine (`src/vendor/memory-forest/web/`) via
 * `mfAdapter`/`mfLoader` — not our own renderer, which this replaced (see `DECISIONS.md`
 * § "Region packs" / "Phase 2" for the full account of the switch).
 *
 * Known gap, honestly: the vendored engine still always draws Golden Lake's own landscape/
 * weather/time — only the *trees* change per biome so far (`mfEnvs.ts`'s registry, Phase 3,
 * one region at a time), and only for biomes with an entry there; everything else still
 * gets the vendored engine's own default pine/round trees, same as before that registry
 * existed. Per-tree/per-creature tooltips and hover are the vendored engine's own
 * (`tooltips.js`, `hover.js`) — nothing to wire up here for those, unlike the old renderer's
 * `hitTest.ts`.
 */

import { useEffect, useRef, useState } from 'react';
import { buildMfPayload } from '../forest/mfAdapter';
import { loadMfScenery } from '../forest/mfLoader';
import type { AnkiForestApi } from '../forest/mfLoader';
import '../vendor/memory-forest/web/forest.css';
import type { GroveBundle } from './useGrove';

export interface GroveCanvasProps {
  bundle: GroveBundle;
  height?: number;
}

export function GroveCanvas({ bundle, height = 220 }: GroveCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rootRef.current || !bundle.grove) return;
    let cancelled = false;
    setError(null);
    // The vendored engine draws at a fixed 2:1 width:height (core.js's own ASPECT) and
    // shrinks to whatever's narrower between this and the container's own width
    // (core.js's `build()`) — so this is a ceiling, not a fixed size; the result is still
    // responsive in a narrow sidebar or a squeezed pane.
    const payload = buildMfPayload(bundle.grove, bundle.roster, {
      maxWidth: height * 2,
      animate: bundle.settings?.animate,
      biomeKey: bundle.biome?.key,
    });
    loadMfScenery(payload.mood)
      .then(() => {
        if (cancelled || !rootRef.current) return;
        const AF = window.AnkiForest as AnkiForestApi;
        AF.mount(rootRef.current, payload, { now: true });
      })
      .catch((e: Error) => {
        // A failed script load (landscapes/landmarks are the one piece `mfLoader.ts` still
        // lets throw — a missing *required* file is a genuine error, not the "no special
        // env" case it already tolerates) used to leave this whole area silently blank,
        // with nothing in the UI saying why. Caught live against a real biome; worth a
        // visible message over a mysterious empty box, even though it shouldn't happen in
        // a correctly-served build.
        if (cancelled) return;
        console.error('Memory Grove: the grove scene failed to load.', e);
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle.grove, bundle.roster, bundle.settings?.animate, bundle.biome?.key, height]);

  return (
    <div className="rn-clr-background-light-gray" style={{ width: '100%', minHeight: height }}>
      {error && (
        <div style={{ padding: 12, fontSize: 12.5, color: '#c0392b' }}>
          The grove scene couldn't load: {error}
        </div>
      )}
      <div ref={rootRef} style={{ width: '100%' }} />
    </div>
  );
}
