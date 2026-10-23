/**
 * Pack-schema validation. Every region, whoever writes it, must satisfy this — it is the
 * thing that keeps `src/regions/*` honest as more are added.
 */

import type { Region, Biome, Creature, PlantSpecies } from './types';

export interface ValidationIssue {
  region: string;
  path: string;
  message: string;
}

const VALID_IUCN = new Set(['NE', 'DD', 'LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX']);
const VALID_ACTIVITY = new Set(['diurnal', 'nocturnal', 'crepuscular', 'cathemeral']);
const VALID_ZONE = new Set(['ground', 'canopy', 'trunk', 'water', 'waterEdge', 'sky', 'slope', 'burrow']);
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function checkSpecies(region: string, path: string, s: { common: string; scientific: string; iucn: string; fact: string; source: string; traits: string[] }, issues: ValidationIssue[]): void {
  if (!s.common.trim()) issues.push({ region, path, message: 'missing common name' });
  if (!/^[A-Z][a-z]+ [a-z-]+/.test(s.scientific) && s.scientific !== 'Rafflesia sp.') {
    // Binomial, allowing "sp." for an unresolved species and open compounds like "Nothofagus pumilio".
    if (!/^[A-Z][a-zA-Z]+ /.test(s.scientific)) issues.push({ region, path, message: `scientific name looks malformed: "${s.scientific}"` });
  }
  if (!VALID_IUCN.has(s.iucn)) issues.push({ region, path, message: `invalid IUCN status "${s.iucn}"` });
  if (!s.fact.trim()) issues.push({ region, path, message: 'missing fact' });
  if (!s.source.trim()) issues.push({ region, path, message: 'missing source' });
  if (!s.traits || s.traits.length === 0) issues.push({ region, path, message: 'missing identifying traits' });
}

function checkCreature(region: string, path: string, c: Creature, issues: ValidationIssue[]): void {
  checkSpecies(region, path, c, issues);
  if (!VALID_ACTIVITY.has(c.activity)) issues.push({ region, path, message: `invalid activity "${c.activity}"` });
  if (!VALID_ZONE.has(c.zone)) issues.push({ region, path, message: `invalid zone "${c.zone}"` });
  if (c.stages.length !== 4) issues.push({ region, path, message: `expected 4 life stages, got ${c.stages.length}` });
  if (c.slot < 0 || c.slot > 4) issues.push({ region, path, message: `slot ${c.slot} out of range 0-4` });
  if (!c.behaviour.trim()) issues.push({ region, path, message: 'missing behaviour description' });
  for (const [key, hex] of Object.entries(c.palette)) {
    if (!HEX_RE.test(hex)) issues.push({ region, path: `${path}.palette.${key}`, message: `invalid colour "${hex}"` });
  }
}

function checkPlant(region: string, path: string, p: PlantSpecies, issues: ValidationIssue[]): void {
  checkSpecies(region, path, p, issues);
  if (p.crown.length !== 5) issues.push({ region, path, message: `expected 5 crown tones, got ${p.crown.length}` });
  if (p.bark.length !== 3) issues.push({ region, path, message: `expected 3 bark tones, got ${p.bark.length}` });
  for (const hex of [...p.crown, ...p.bark]) {
    if (!HEX_RE.test(hex)) issues.push({ region, path, message: `invalid colour "${hex}"` });
  }
}

function checkBiome(region: string, biome: Biome, issues: ValidationIssue[]): void {
  const path = `biomes.${biome.key}`;
  if (biome.plants.length === 0) issues.push({ region, path, message: 'no plants' });
  if (biome.creatures.length !== 5) {
    issues.push({ region, path, message: `expected 5 creatures, got ${biome.creatures.length}` });
  }
  const slots = new Set<number>();
  for (const c of biome.creatures) {
    checkCreature(region, `${path}.creatures.${c.key}`, c, issues);
    if (slots.has(c.slot)) issues.push({ region, path, message: `duplicate slot ${c.slot} in ${biome.key}` });
    slots.add(c.slot);
  }
  for (const p of biome.plants) checkPlant(region, `${path}.plants.${p.key}`, p, issues);

  // No duplicate creature or plant keys within a biome.
  const cKeys = biome.creatures.map((c) => c.key);
  if (new Set(cKeys).size !== cKeys.length) issues.push({ region, path, message: 'duplicate creature keys' });
  const pKeys = biome.plants.map((p) => p.key);
  if (new Set(pKeys).size !== pKeys.length) issues.push({ region, path, message: 'duplicate plant keys' });
}

export function validateRegion(region: Region): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!region.key.trim()) issues.push({ region: region.key, path: 'key', message: 'missing key' });
  if (!region.label.trim()) issues.push({ region: region.key, path: 'label', message: 'missing label' });
  if (region.biomes.length === 0) issues.push({ region: region.key, path: 'biomes', message: 'no biomes' });
  if (region.defaultStages.length !== 4) {
    issues.push({ region: region.key, path: 'defaultStages', message: 'expected 4 default stage names' });
  }
  if (region.backdrops.length < 2) issues.push({ region: region.key, path: 'backdrops', message: 'expected at least 2 backdrops' });
  if (!region.backdrops.some((b) => b.night)) {
    issues.push({ region: region.key, path: 'backdrops', message: 'no night/dusk backdrop variant' });
  }
  for (const b of region.biomes) checkBiome(region.key, b, issues);

  const biomeKeys = region.biomes.map((b) => b.key);
  if (new Set(biomeKeys).size !== biomeKeys.length) {
    issues.push({ region: region.key, path: 'biomes', message: 'duplicate biome keys' });
  }
  return issues;
}
