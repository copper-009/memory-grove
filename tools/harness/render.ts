/**
 * Standalone render entry for the screenshot harness: builds a grove from a named fixture
 * and a scenery combination, directly on a `<canvas id="stage">`, with no RemNote SDK
 * involved at all. `tools/screenshots.mjs` loads this page in headless Chromium via
 * Playwright and drives it through `window.__renderFixture`.
 */
import { fixture, FIXED_NOW } from '../../src/data/fixtures';
import { scanCards } from '../../src/data/cards';
import { buildGrove, mergeOld } from '../../src/data/forest';
import { ecosystemHealth } from '../../src/data/health';
import { emptyCalendar } from '../../src/data/calendar';
import { updateRoster, emptyRoster } from '../../src/data/milestones';
import { drawScene } from '../../src/forest/scene';
import type { MoodInput } from '../../src/forest/theme';
import { regionByKey } from '../../src/regions';
import type { FixtureName } from '../../src/data/fixtures';
import type { Severity } from '../../src/data/calendar';

declare global {
  interface Window {
    __renderFixture: (opts: {
      fixtureName: FixtureName;
      regionKey: string;
      biomeIndex: number;
      mood: MoodInput;
      severity: Severity;
      width: number;
      height: number;
      forceVisualHealth?: number;
    }) => void;
  }
}

window.__renderFixture = (opts) => {
  const cards = fixture(opts.fixtureName, FIXED_NOW);
  const scan = scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 });
  const grove = mergeOld(buildGrove(scan));
  const region = regionByKey(opts.regionKey)!;
  const biome = region.biomes[opts.biomeIndex % region.biomes.length];

  const health =
    opts.forceVisualHealth != null
      ? opts.forceVisualHealth
      : ecosystemHealth({
          today: grove.today,
          reviewDays: grove.reviewDays,
          calendar: emptyCalendar(),
          severity: opts.severity,
          overdue: scan.overdue,
          totalCards: scan.cardCount,
        }).visual;

  const roster = updateRoster(emptyRoster(), grove.stats.activeStudyDays, grove.stats, grove.today);

  const canvas = document.getElementById('stage') as HTMLCanvasElement;
  canvas.width = opts.width;
  canvas.height = opts.height;
  const g = canvas.getContext('2d')!;
  drawScene(g, opts.width, opts.height, {
    grove,
    biome,
    roster,
    activeStudyDays: grove.stats.activeStudyDays,
    mood: opts.mood,
    visualHealth: health,
    t: 0,
    animate: false,
    paused: false,
    dpr: 1,
    regionKey: region.key,
  });
  document.title = 'ready';
};
