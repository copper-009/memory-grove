/**
 * The only file in `src/data/` that imports `@remnote/plugin-sdk`. Everything else works
 * on the structural `CardLike`/`RepLike` types in `types.ts`, so the whole data layer is
 * usable, and tested, without RemNote running at all.
 */

import type { RNPlugin } from '@remnote/plugin-sdk';
import type { CardLike } from './types';

/**
 * Fetch every card and adapt it to `CardLike`.
 *
 * `plugin.card.getAll()` is the single most expensive call this plugin makes — see
 * `reference/REMNOTE_API.md` §3 for the caching strategy built around that cost.
 */
export async function loadAllCards(plugin: RNPlugin): Promise<CardLike[]> {
  const cards = await plugin.card.getAll();
  return cards.map((c) => ({
    _id: c._id,
    remId: c.remId,
    createdAt: c.createdAt,
    repetitionHistory: c.repetitionHistory,
    nextRepetitionTime: c.nextRepetitionTime,
    lastRepetitionTime: c.lastRepetitionTime,
    timesWrongInRow: c.timesWrongInRow,
  }));
}

/**
 * Expand a set of Rem ids the user chose to exclude into that set plus every descendant,
 * so excluding a folder excludes everything inside it. Resolved once per *Rem*, not per
 * card — see `reference/REMNOTE_API.md` §2.5.
 */
export async function expandExcludedRemIds(plugin: RNPlugin, rootIds: readonly string[]): Promise<Set<string>> {
  const out = new Set<string>(rootIds);
  const queue = [...rootIds];
  while (queue.length) {
    const id = queue.shift();
    if (!id) continue;
    const rem = await plugin.rem.findOne(id);
    if (!rem) continue;
    const children = await rem.getChildrenRem();
    for (const child of children) {
      if (!out.has(child._id)) {
        out.add(child._id);
        queue.push(child._id);
      }
    }
  }
  return out;
}
