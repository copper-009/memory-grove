import { useEffect, useRef, useState } from 'react';
import { renderWidget } from '@remnote/plugin-sdk';
import { useGrove } from './useGrove';
import { buildMfPayload } from '../forest/mfAdapter';
import { loadMfScenery } from '../forest/mfLoader';
import type { AnkiForestApi } from '../forest/mfLoader';
import '../style.css';
import '../vendor/memory-forest/web/forest.css';

/**
 * Phase 2 proof: the vendored Memory Forest engine, mounted directly (not through our own
 * `scene.ts`), drawing the user's real grove. A separate pane from `pane_widget` on
 * purpose — reversible, doesn't touch the widget the user already relies on, opened only by
 * its own command (never from inside an already-mounted widget — see `DECISIONS.md` on why
 * `openWidgetInPane` called from inside a mounted widget is unsafe).
 *
 * Golden Lake only, same as `tools/harness/mf.html`: the full scenery-preset picker is
 * follow-up work, not this proof.
 */
function MfPreviewWidget() {
  const bundle = useGrove();
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (bundle.loading || bundle.error || !rootRef.current) return;
    let cancelled = false;
    const payload = buildMfPayload(bundle.grove, bundle.roster, { maxWidth: 900 });
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
  }, [bundle.loading, bundle.error, bundle.grove, bundle.roster]);

  if (bundle.loading) return <div style={{ padding: 24 }}>Growing your grove…</div>;
  if (bundle.error) return <div style={{ padding: 24, color: '#c0392b' }}>Memory Grove: {bundle.error}</div>;

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>Memory Forest engine preview</h1>
      <p className="rn-clr-content-secondary" style={{ fontSize: 12.5, marginBottom: 12, opacity: 0.75 }}>
        Golden Lake, drawn by the vendored Memory Forest engine itself from your real grove —{' '}
        {bundle.grove.stats.plants} plants, {bundle.grove.stats.streak}-day streak. Experimental: a
        separate page from your usual Memory Grove pane, not a replacement for it yet.
      </p>
      {status === 'error' && (
        <div style={{ color: '#c0392b', marginBottom: 12 }}>Could not load the Memory Forest engine: {errorMsg}</div>
      )}
      <div ref={rootRef} style={{ minHeight: 480 }} />
    </div>
  );
}

renderWidget(MfPreviewWidget);
