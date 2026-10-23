/**
 * The region registry.
 *
 * Adding a new region means adding a folder under `src/regions/<key>/` that exports a
 * `Region` (see `types.ts`) and one line here. Nothing else in the engine changes — see
 * `DEVELOPMENT.md` for the pack format in full.
 */

import type { Region } from './types';
import { australia } from './australia';
import { aotearoa } from './aotearoa';
import { japan } from './japan';
import { madagascar } from './madagascar';
import { costaRica } from './costarica';
import { eastAfrica } from './eastafrica';
import { canada } from './canada';
import { norway } from './norway';
import { nepal } from './nepal';
import { patagonia } from './patagonia';
import { borneo } from './borneo';

export const REGIONS: readonly Region[] = [
  australia,
  aotearoa,
  japan,
  madagascar,
  costaRica,
  eastAfrica,
  canada,
  norway,
  nepal,
  patagonia,
  borneo,
];

export const DEFAULT_REGION_KEY = australia.key;

export function regionByKey(key: string): Region | undefined {
  return REGIONS.find((r) => r.key === key);
}

export function regionOptions(): Array<{ key: string; label: string }> {
  return REGIONS.map((r) => ({ key: r.key, label: r.label }));
}

export {
  australia,
  aotearoa,
  japan,
  madagascar,
  costaRica,
  eastAfrica,
  canada,
  norway,
  nepal,
  patagonia,
  borneo,
};
export * from './types';
