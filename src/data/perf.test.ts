import { describe, expect, it } from 'vitest';
import { fixture, FIXED_NOW } from './fixtures';
import { scanCards } from './cards';
import { buildGrove, mergeOld } from './forest';
import { buildHeatmap } from './heatmap';
import { ecosystemHealth } from './health';
import { emptyCalendar } from './calendar';

/**
 * The brief asks for a first render under 300 ms on a 50k-card knowledge base. Rendering is
 * measured separately in the screenshot harness; this pins the data half, which is the part
 * that scales with history length. It runs in CI, so the budget is generous enough not to
 * flake on a loaded machine while still catching an order-of-magnitude regression.
 */
const BUDGET_MS = 250;

describe('performance on a large knowledge base', () => {
  it('builds a 50k-card grove well inside the frame budget', () => {
    const t0 = performance.now();
    const cards = fixture('huge', FIXED_NOW);
    const tGen = performance.now();

    const t1 = performance.now();
    const scan = scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 });
    const t2 = performance.now();
    const grove = mergeOld(buildGrove(scan));
    const t3 = performance.now();
    buildHeatmap(grove, { dueByDay: scan.dueByDay });
    ecosystemHealth({
      today: grove.today,
      reviewDays: grove.reviewDays,
      calendar: emptyCalendar(),
      severity: 'gentle',
      overdue: scan.overdue,
      totalCards: scan.cardCount,
    });
    const t4 = performance.now();

    const reps = cards.reduce((a, c) => a + (c.repetitionHistory?.length ?? 0), 0);
    const total = t4 - t1;

    // eslint-disable-next-line no-console
    console.log(
      `\n  cards ${cards.length}  reps ${reps}  plants ${grove.stats.plants}\n` +
        `  fixture ${(tGen - t0).toFixed(0)}ms (not counted)\n` +
        `  scan     ${(t2 - t1).toFixed(1)}ms\n` +
        `  build    ${(t3 - t2).toFixed(1)}ms\n` +
        `  heatmap+health ${(t4 - t3).toFixed(1)}ms\n` +
        `  TOTAL    ${total.toFixed(1)}ms  (budget ${BUDGET_MS}ms)\n`,
    );

    expect(cards.length).toBeGreaterThan(50_000);
    expect(total).toBeLessThan(BUDGET_MS);
  });
});
