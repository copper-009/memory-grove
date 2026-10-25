import { useEffect, useRef, useState } from 'react';
import type { Grove } from '../data/types';
import type { CreatureRoster } from '../data/milestones';
import { buildMfPayload } from '../forest/mfAdapter';
import { loadMfScenery } from '../forest/mfLoader';
import type { AnkiForestApi } from '../forest/mfLoader';
import '../vendor/memory-forest/web/forest.css';

/**
 * Phase 2 proof: the vendored Memory Forest engine, mounted directly (not through our own
 * `scene.ts`), drawing the user's real grove. Golden Lake only, same as
 * `tools/harness/mf.html`: the full scenery-preset picker is follow-up work, not this proof.
 *
 * A plain component, not its own widget/pane — `pane_widget.tsx` renders it behind a toggle
 * inside the pane the user already has open and knows works, rather than opening a second
 * pane via `openWidgetInPane`. RemNote was found to intermittently fail to restore a saved
 * pane layout after a dev-server rebuild changes the bundle's content hash ("Cannot parse
 * window string" — `DEVELOPMENT.md` already documented this for the *first* pane open; it
 * turned out to recur for a second, different pane too), so avoiding a second
 * `openWidgetInPane` call altogether sidesteps it rather than working around it.
 */
export function MfEnginePreview({ grove, roster }: { grove: Grove; roster: CreatureRoster }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!rootRef.current) return;
    let cancelled = false;
    setStatus('loading');
    const payload = buildMfPayload(grove, roster, { maxWidth: 900 });
    loadMfScenery(payload.mood)
      .then(() => {
        if (cancelled || !rootRef.current) return;
        const AF = window.AnkiForest as AnkiForestApi;
        AF.mount(rootRef.current, payload, { now: true });
        setStatus('ready');
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setErrorMsg(e.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [grove, roster]);

  return (
    <div>
      <p className="rn-clr-content-secondary" style={{ fontSize: 12.5, marginBottom: 12, opacity: 0.75 }}>
        Golden Lake, drawn by the vendored Memory Forest engine itself from your real grove —{' '}
        {grove.stats.plants} plants, {grove.stats.streak}-day streak. Experimental Phase 2 proof,
        not a replacement for the view above yet.
      </p>
      {status === 'error' && (
        <div style={{ color: '#c0392b', marginBottom: 12 }}>Could not load the Memory Forest engine: {errorMsg}</div>
      )}
      <div ref={rootRef} style={{ minHeight: 480 }} />
    </div>
  );
}
