/**
 * Tooltip content: what the hover/tap inspector shows for a plant, a creature, undergrowth
 * or the ecosystem overview. Pure string-building from data — the actual popup element is
 * a small React component in `src/widgets/` that just renders these fields.
 */

import type { Plant, Stage } from '../data/types';
import { STAGE_HEIGHT } from '../data/types';
import type { Creature, PlantSpecies } from '../regions/types';
import { ACTIVITY_LABELS, IUCN_LABELS } from '../regions/types';
import type { CreatureSave, CreatureMood } from '../data/milestones';
import { MOOD_LABELS, creatureAge, lifeStageFor } from '../data/milestones';
import { formatDay } from '../data/day';

const STAGE_NAMES = ['seedling', 'sapling', 'young', 'mature', 'old', 'ancient'] as const;

export interface PlantTooltip {
  kind: 'plant';
  title: string;
  lines: string[];
}

export function plantTooltip(plant: Plant, species: PlantSpecies): PlantTooltip {
  const lines = [
    `${species.common} (${species.scientific})`,
    `Planted ${formatDay(plant.day)} — ${plant.ago === 0 ? 'today' : `${plant.ago} day${plant.ago === 1 ? '' : 's'} ago`}`,
    `Growth stage: ${STAGE_NAMES[plant.stage]}`,
    `${plant.n} card${plant.n === 1 ? '' : 's'}`,
    `${Math.round(plant.remembered * 100)}% remembered${plant.measured ? '' : ' (estimated)'}`,
  ];
  if (plant.struggling > 0) {
    lines.push(`${plant.struggling} relearning`);
  }
  if (plant.gap) {
    lines.push(`A ${plant.gap}-day break ended here${plant.gapFrom && plant.gapTo ? ` (${plant.gapFrom} – ${plant.gapTo})` : ''}.`);
  }
  return { kind: 'plant', title: species.common, lines };
}

export interface CreatureTooltip {
  kind: 'creature';
  title: string;
  lines: string[];
  conservationNote?: string;
}

export function creatureTooltip(
  creature: Creature,
  save: CreatureSave,
  region: string,
  activeStudyDays: number,
  mood: CreatureMood,
): CreatureTooltip {
  const age = creatureAge(save, activeStudyDays);
  const stageIdx = lifeStageFor(age);
  const name = save.names[region];
  const title = name ? `${name} the ${creature.common}` : creature.common;
  const lines = [
    `${creature.common} (${creature.scientific})`,
    `Life stage: ${creature.stages[stageIdx]}`,
    `${age} active study day${age === 1 ? '' : 's'} old`,
    `Arrived ${formatDay(save.arrivedDay)}`,
    ACTIVITY_LABELS[creature.activity],
    MOOD_LABELS[mood],
  ];
  return {
    kind: 'creature',
    title,
    lines,
    conservationNote: creature.national ? `${IUCN_LABELS[creature.iucn]} globally. ${creature.national}.` : `${IUCN_LABELS[creature.iucn]}.`,
  };
}

export interface UnderstoryTooltip {
  kind: 'understory';
  title: string;
  lines: string[];
}

export function understoryTooltip(label: string, what: string): UnderstoryTooltip {
  return { kind: 'understory', title: label, lines: [what] };
}

export interface EcosystemTooltip {
  kind: 'ecosystem';
  title: string;
  lines: string[];
}

export function ecosystemTooltip(score: number, trend: number, advice: string, pauseLabel: string | null): EcosystemTooltip {
  const lines = [`Ecosystem health: ${Math.round(score)}/100`];
  if (pauseLabel) {
    lines.push(pauseLabel);
  } else if (trend !== 0) {
    lines.push(`${trend > 0 ? '▲' : '▼'} ${Math.abs(Math.round(trend))} over the last week`);
  }
  lines.push(advice);
  return { kind: 'ecosystem', title: 'The grove', lines };
}

export type Tooltip = PlantTooltip | CreatureTooltip | UnderstoryTooltip | EcosystemTooltip;

/** Stage height in engine units, exposed here for anything placing a tooltip above a sprite. */
export function heightOf(stage: Stage): number {
  return STAGE_HEIGHT[stage];
}
