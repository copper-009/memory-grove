/**
 * Render harness for the vendored Memory Forest engine (`src/vendor/memory-forest/web/`),
 * mounted through `mfAdapter.ts` instead of our own `drawScene` — Phase 2's milestone:
 * confirm the vendored engine actually renders Golden Lake from Memory Grove data. Loaded
 * by `tools/harness/mf.html`, which brings in the vendored core scripts (`catalog.py`'s own
 * `SCRIPTS` order) via plain `<script>` tags first; scenery (landscape, and a region's own
 * tree environment when `biomeKey` has one in `mfEnvs.ts`) loads dynamically through
 * `mfLoader.ts`'s `loadMfScenery`, the same path `GroveCanvas.tsx` actually uses.
 */
import { fixture, FIXED_NOW } from '../../src/data/fixtures';
import { scanCards } from '../../src/data/cards';
import { buildGrove, mergeOld } from '../../src/data/forest';
import { emptyRoster } from '../../src/data/milestones';
import { buildMfPayload } from '../../src/forest/mfAdapter';
import { loadMfScenery } from '../../src/forest/mfLoader';
import type { AnkiForestApi } from '../../src/forest/mfLoader';
import type { FixtureName } from '../../src/data/fixtures';

declare global {
  interface Window {
    __renderMf: (opts: { fixtureName: FixtureName; width: number; biomeKey?: string }) => void;
  }
}

window.__renderMf = (opts) => {
  const cards = fixture(opts.fixtureName, FIXED_NOW);
  const scan = scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 });
  const grove = mergeOld(buildGrove(scan));
  const payload = buildMfPayload(grove, emptyRoster(), { maxWidth: opts.width, biomeKey: opts.biomeKey });
  const root = document.getElementById('stage')!;
  loadMfScenery(payload.mood).then(() => {
    (window.AnkiForest as AnkiForestApi).mount(root, payload, { now: true });
    requestAnimationFrame(() => requestAnimationFrame(() => { document.title = 'ready'; }));
  });
};
