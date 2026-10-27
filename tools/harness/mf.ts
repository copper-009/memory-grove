/**
 * Render harness for the vendored Memory Forest engine (`src/vendor/memory-forest/web/`),
 * mounted through `mfAdapter.ts` instead of our own `drawScene` — Phase 2's milestone:
 * confirm the vendored engine actually renders Golden Lake from Memory Garden data. Loaded
 * by `tools/harness/mf.html`, which brings in the vendored core scripts (`catalog.py`'s own
 * `SCRIPTS` order) via plain `<script>` tags first; scenery (landscape, and a region's own
 * tree environment when `biomeKey` has one in `mfEnvs.ts`) loads dynamically through
 * `mfLoader.ts`'s `loadMfScenery`, the same path `GroveCanvas.tsx` actually uses.
 */
import { fixture, FIXED_NOW } from '../../src/data/fixtures';
import { scanCards } from '../../src/data/cards';
import { buildGrove, mergeOld } from '../../src/data/forest';
import { emptyRoster, updateRoster } from '../../src/data/milestones';
import { buildMfPayload } from '../../src/forest/mfAdapter';
import { loadMfScenery, registerCreatureSprites } from '../../src/forest/mfLoader';
import type { AnkiForestApi } from '../../src/forest/mfLoader';
import type { FixtureName } from '../../src/data/fixtures';
import { REGIONS } from '../../src/regions';
import type { Biome } from '../../src/regions/types';

declare global {
  interface Window {
    __renderMf: (opts: { fixtureName: FixtureName; width: number; biomeKey?: string; health?: number }) => void;
  }
}

function findBiome(biomeKey: string | undefined): Biome | undefined {
  if (!biomeKey) return undefined;
  for (const region of REGIONS) for (const biome of region.biomes) if (biome.key === biomeKey) return biome;
  return undefined;
}

window.__renderMf = (opts) => {
  const cards = fixture(opts.fixtureName, FIXED_NOW);
  const scan = scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 });
  const grove = mergeOld(buildGrove(scan));
  // A real roster (not emptyRoster()) — the fixture's own active-study-day count unlocks
  // whichever creature slots it would for a real user, so the harness actually exercises
  // creature placement instead of always showing none.
  const roster = updateRoster(emptyRoster(), grove.stats.activeStudyDays, grove.stats, grove.today);
  const payload = buildMfPayload(grove, roster, {
    maxWidth: opts.width, biomeKey: opts.biomeKey, biome: findBiome(opts.biomeKey), health: opts.health,
  });
  const root = document.getElementById('stage')!;
  loadMfScenery(payload.mood).then(() => {
    registerCreatureSprites(payload.creatureSprites);
    (window.AnkiForest as AnkiForestApi).mount(root, payload, { now: true });
    requestAnimationFrame(() => requestAnimationFrame(() => { document.title = 'ready'; }));
  });
};
