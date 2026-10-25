/**
 * The grove view: one component, used at every placement (sidebar, queue, pane, learning
 * progress). Mounts the vendored Memory Forest engine (`src/vendor/memory-forest/web/`) via
 * `mfAdapter`/`mfLoader` — not our own renderer, which this replaced (see `DECISIONS.md`
 * § "Region packs" / "Phase 2" for the full account of the switch).
 *
 * Known gap, honestly: the vendored engine always draws its own Golden Lake default scene
 * right now (`mfAdapter.ts`'s `goldenLakeMood`) — the region/biome picker in `pane_widget`
 * doesn't change what's drawn yet. That's Phase 3's main piece of remaining work (new
 * "envs" using `trees.js`'s own hook functions, per region), not done in this pass, which
 * was specifically about removing the old renderer so there's one grove view, not two.
 * Per-tree/per-creature tooltips and hover are the vendored engine's own (`tooltips.js`,
 * `hover.js`) — nothing to wire up here for those, unlike the old renderer's `hitTest.ts`.
 */

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!rootRef.current || !bundle.grove) return;
    let cancelled = false;
    // The vendored engine draws at a fixed 2:1 width:height (core.js's own ASPECT) and
    // shrinks to whatever's narrower between this and the container's own width
    // (core.js's `build()`) — so this is a ceiling, not a fixed size; the result is still
    // responsive in a narrow sidebar or a squeezed pane.
    const payload = buildMfPayload(bundle.grove, bundle.roster, {
      maxWidth: height * 2,
      animate: bundle.settings?.animate,
    });
    loadMfScenery(payload.mood).then(() => {
      if (cancelled || !rootRef.current) return;
      const AF = window.AnkiForest as AnkiForestApi;
      AF.mount(rootRef.current, payload, { now: true });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle.grove, bundle.roster, bundle.settings?.animate, height]);

  return <div ref={rootRef} className="rn-clr-background-light-gray" style={{ width: '100%', minHeight: height }} />;
}
