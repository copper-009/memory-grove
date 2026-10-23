import { describe, expect, it } from 'vitest';
import { plantTooltip, creatureTooltip, ecosystemTooltip } from './tooltip';
import { Stage } from '../data/types';
import type { Plant } from '../data/types';
import { REGIONS } from '../regions';
import type { CreatureSave } from '../data/milestones';

const plant: Plant = {
  day: 100, ago: 5, date: '2026-01-01', n: 12, stage: Stage.Mature, size: 1, health: 1,
  species: 0, seed: 1, remembered: 0.82, strength: 40, struggling: 2, measured: true,
  mature: 5, variant: 0,
};

describe('plantTooltip', () => {
  it('includes date, cards, % remembered and relearning count', () => {
    const species = REGIONS[0].biomes[0].plants[0];
    const t = plantTooltip(plant, species);
    expect(t.lines.join(' ')).toMatch(/12 card/);
    expect(t.lines.join(' ')).toMatch(/82% remembered/);
    expect(t.lines.join(' ')).toMatch(/2 relearning/);
  });

  it('flags an estimate when not measured', () => {
    const species = REGIONS[0].biomes[0].plants[0];
    const t = plantTooltip({ ...plant, measured: false }, species);
    expect(t.lines.join(' ')).toMatch(/estimated/);
  });

  it('mentions a pond when the plant marks a gap', () => {
    const species = REGIONS[0].biomes[0].plants[0];
    const t = plantTooltip({ ...plant, gap: 20, gapFrom: '2025-01-01', gapTo: '2025-01-20' }, species);
    expect(t.lines.join(' ')).toMatch(/20-day break/);
  });
});

describe('creatureTooltip', () => {
  const creature = REGIONS[0].biomes[0].creatures[0];
  const save: CreatureSave = { slot: 0, arrivedDay: 100, activeDaysAtArrival: 7, names: {} };

  it('shows name, species, life stage, age and mood', () => {
    const t = creatureTooltip(creature, save, 'australia', 50, 'active');
    expect(t.title).toBe(creature.common);
    expect(t.lines.join(' ')).toMatch(/43 active study day/);
    expect(t.lines.join(' ')).toMatch(/Out and about/);
  });

  it('uses a custom name once one is set', () => {
    const named = { ...save, names: { australia: 'Kev' } };
    const t = creatureTooltip(creature, named, 'australia', 50, 'active');
    expect(t.title).toBe(`Kev the ${creature.common}`);
  });

  it('includes a conservation status note, gently, with a national divergence when present', () => {
    const cassowary = REGIONS[0].biomes[2].creatures.find((c) => c.key === 'southern-cassowary')!;
    const t = creatureTooltip(cassowary, save, 'australia', 300, 'active');
    expect(t.conservationNote).toMatch(/Least concern/);
    expect(t.conservationNote).toMatch(/Endangered/);
  });
});

describe('ecosystemTooltip', () => {
  it('shows score and a pause label when paused', () => {
    const t = ecosystemTooltip(82, 3, 'Thriving.', 'Paused until 24 Feb');
    expect(t.lines[0]).toMatch(/82\/100/);
    expect(t.lines).toContain('Paused until 24 Feb');
  });

  it('shows a trend arrow when not paused', () => {
    const up = ecosystemTooltip(82, 5, 'x', null);
    const down = ecosystemTooltip(82, -5, 'x', null);
    expect(up.lines.some((l) => l.includes('▲'))).toBe(true);
    expect(down.lines.some((l) => l.includes('▼'))).toBe(true);
  });
});
