/**
 * Where species names, ranges and statuses were checked.
 *
 * Every species in every region pack carries one of these. `tools/species-doc.mjs` turns
 * them into the source column of `reference/SPECIES.md`, so the documentation can never
 * drift from the data — there is only one copy of each fact.
 */

/** Atlas of Living Australia — the authority used for Australian species. */
export const ala = (name: string): string =>
  `https://bie.ala.org.au/search?q=${encodeURIComponent(name)}`;

/** IUCN Red List — the authority used for conservation status everywhere. */
export const iucn = (name: string): string =>
  `https://www.iucnredlist.org/search?query=${encodeURIComponent(name)}`;

/** GBIF — used for names and ranges outside Australia. */
export const gbif = (name: string): string =>
  `https://www.gbif.org/species/search?q=${encodeURIComponent(name)}`;

/** New Zealand Birds Online, for te reo Māori bird names. */
export const nzbirds = (slug: string): string => `https://nzbirdsonline.org.nz/species/${slug}`;
