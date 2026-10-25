/**
 * Render harness for the vendored Memory Forest engine (`src/vendor/memory-forest/web/`),
 * mounted through `mfAdapter.ts` instead of our own `drawScene` — Phase 2's milestone:
 * confirm the vendored engine actually renders Golden Lake from Memory Grove data. Loaded
 * by `tools/harness/mf.html`, which brings in the vendored scripts (in `catalog.py`'s own
 * `SCRIPTS` order) and `landscapes/lake.js` via plain `<script>` tags first.
 */
import { fixture, FIXED_NOW } from '../../src/data/fixtures';
import { scanCards } from '../../src/data/cards';
import { buildGrove, mergeOld } from '../../src/data/forest';
import { emptyRoster } from '../../src/data/milestones';
import { buildMfPayload } from '../../src/forest/mfAdapter';
import type { FixtureName } from '../../src/data/fixtures';

declare global {
  interface Window {
    AnkiForest: { mount: (root: HTMLElement, data: unknown, opts: Record<string, unknown>) => void };
    __renderMf: (opts: { fixtureName: FixtureName; width: number }) => void;
  }
}

window.__renderMf = (opts) => {
  const cards = fixture(opts.fixtureName, FIXED_NOW);
  const scan = scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 });
  const grove = mergeOld(buildGrove(scan));
  const payload = buildMfPayload(grove, emptyRoster(), { maxWidth: opts.width });
  const root = document.getElementById('stage')!;
  window.AnkiForest.mount(root, payload, { now: true });
  requestAnimationFrame(() => requestAnimationFrame(() => { document.title = 'ready'; }));
};
