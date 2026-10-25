/**
 * Real hand-authored `CreatureSprite`s, Memory Forest's own VISITORS technique — drawn with
 * actual attention to each species' signature marks, not baked from the procedural
 * `BodyPlan` generator (see `baked.generated.ts` for the bulk first-pass covering every
 * other creature). Keyed `${regionKey}:${creatureKey}`; `src/regions/index.ts` prefers an
 * entry here over the baked one with the same key.
 *
 * Only Australia's eucalypt woodland so far — the biome this whole rendering rewrite has
 * been tested against all session — plus the cassowary and platypus, the two species the
 * user named directly as signature-mark examples. The rest of the roster still renders from
 * `baked.generated.ts` until it gets the same review-gallery treatment.
 */
import type { CreatureSprite } from '../types';

export const HAND_SPRITES: Record<string, CreatureSprite> = {
  // Heavy dagger bill, dark eye-stripe through a pale head, barred rufous tail. Perched
  // still, head cocked — the kookaburra's whole character is stillness, not motion, so the
  // second frame is only the tail flicking.
  'australia:kookaburra': {
    pal: { b: '#e8e0cf', d: '#6b5a44', e: '#20180f', r: '#9a6a3a', w: '#4a7fa8', k: '#2e2416' },
    frames: [
      ['...bbb..', '..beebd.', '.bbbbbd.', '.wwbbdd.', '..bbbrr.', '..bbrrr.', '...kk...'],
      ['...bbb..', '..beebd.', '.bbbbbd.', '.wwbbdd.', '..bbrrr.', '..brrr..', '...kk...'],
    ] as const,
    young: [
      ['..bbb..', '.beebd.', 'bbbbdd.', '.bbbrr.', '..kk...'],
      ['..bbb..', '.beebd.', 'bbbbdd.', '.bbrrr.', '..kk...'],
    ] as const,
  },
  // White body, a forward-curving sulphur crest it raises when startled (the second frame),
  // heavy dark bill.
  'australia:cockatoo': {
    pal: { b: '#f6f4ee', d: '#c9c3b4', e: '#1a1510', y: '#f0d060', k: '#5a5248' },
    frames: [
      ['...y....', '..bbbk..', '.bbbbbk.', '.bbebbd.', '.bbbbbd.', '..dkdk..'],
      ['..yyy...', '..bbbk..', '.bbbbbk.', '.bbebbd.', '.bbbbbd.', '..dkdk..'],
    ] as const,
    young: [
      ['..y....', '.bbbk..', 'bbebbd.', 'bbbbbd.', '.dkdk..'],
      ['.yyy...', '.bbbk..', 'bbebbd.', 'bbbbbd.', '.dkdk..'],
    ] as const,
  },
  // Redone after the first pass read as a generic grey blob rather than a kangaroo — the
  // one unmistakable kangaroo cue is the silhouette: upright head and shoulders, a distinct
  // thick tail propped down and back (not just another leg), one heavy foot forward. Each
  // of those is now its own deliberate stroke rather than folded into one amorphous body.
  'australia:eastern-grey-kangaroo': {
    pal: { b: '#9a9383', d: '#6c6557', l: '#c4bdab', e: '#17130d', n: '#2a241c' },
    frames: [
      ['...nn........', '..nbbn.......', '..ebbld......', '...bbd.......', '..lbbbbd.....', '.lbbbbbbbd...', '.lbbbbbbbbbd.', '..bb.....bbd.', '..b.......bdd', '..d........dd'],
      ['...nn........', '..nbbn.......', '..ebbld......', '...bbd.......', '..lbbbbd.....', '.lbbbbbbbd...', '.lbbbbbbbbbd.', '..bb....bbdd.', '..b......bdd.', '...d......ddd'],
    ] as const,
    young: [
      ['..nn.....', '.nbbn....', '.ebbld...', '..lbbbd..', '.lbbbbbd.', '..bb...bd', '..b.....d'],
      ['..nn.....', '.nbbn....', '.ebbld...', '..lbbbd..', '.lbbbbbd.', '..bb..bd.', '..b....d.'],
    ] as const,
  },
  // Dark body banded pale cream, long tapering tail — clinging head-up to a trunk. Banding
  // is the single identifying mark, so it carries most of the pixel budget.
  'australia:lace-monitor': {
    pal: { b: '#4a4238', d: '#2a251e', l: '#c8bb9a', e: '#0d0a06', y: '#d8c88a' },
    frames: [
      ['..e..............', '.dy..............', 'dbly.bly.bly.bly.', '.dbly.bly.bly.bl.', '....dd...........'],
      ['..e..............', '.dy..............', 'dbly.bly.bly.bly.', '.dbly.bly.bly.bl.', '.....dd..........'],
    ] as const,
    young: [
      ['.e.........', 'dy.........', 'bly.bly.bly', '.dd........'],
      ['.e.........', 'dy.........', 'bly.bly.bly', '..dd.......'],
    ] as const,
  },
  // Large fluffy ears, a big dark nose, wedged asleep in a fork — the nose is the signature
  // mark the user named directly, so it's the single largest dark feature on the face.
  'australia:koala': {
    pal: { b: '#9aa0a4', d: '#6a7175', l: '#d6dade', e: '#120f0c', n: '#1d1813' },
    frames: [
      ['.d....d.', 'ddllllld', '.lllllld', 'l.le.el.', '.l.nn.l.', '.lllllb.', '.bbbbbb.', '..bbbb..'],
      ['.d....d.', 'ddllllld', '.lllllld', 'l.l..el.', '.l.nn.l.', '.lllllb.', '.bbbbbb.', '..bbbb..'],
    ] as const,
    young: [
      ['d....d', 'dlllld', 'l.ee.l', '.lnnl.', 'lllllb', '.bbbb.'],
      ['d....d', 'dlllld', 'l....l', '.lnnl.', 'lllllb', '.bbbb.'],
    ] as const,
  },
  // Tall horny casque, blue neck shading to red lower down over a glossy black body — the
  // cassowary's whole identity is that neck colour, so it gets the tallest, most deliberate
  // share of the grid; everything else (body, legs) stays a plain dark silhouette under it.
  'australia:southern-cassowary': {
    pal: { b: '#161418', d: '#0a090c', l: '#2e2a30', e: '#d8c060', y: '#8a6a30', w: '#3a7fc8', r: '#c0392b' },
    frames: [
      ['....y...', '...ylyl.', '...wey..', '....w...', '....w...', '....r...', '....r...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '...d.d..', '...d.d..'],
      ['....y...', '...ylyl.', '....wey.', '....w...', '....w...', '....r...', '....r...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '..d.d...', '..d.d...'],
    ] as const,
    young: [
      ['...y..', '..wey.', '...w..', '...r..', '.bbbb.', 'bbbbbb', 'bbbbbb', '.bbbb.', '..d.d.'],
      ['...y..', '..wye.', '...w..', '...r..', '.bbbb.', 'bbbbbb', 'bbbbbb', '.bbbb.', '.d.d..'],
    ] as const,
  },
  // Soft duck-like bill and a flat paddle tail, low in the water — a swimmer's whole
  // silhouette is horizontal, no legs visible, the bill doing all the identifying work.
  'australia:platypus': {
    pal: { b: '#4a3a2a', d: '#2a2018', l: '#6e5a42', e: '#0c0806', w: '#8a7258' },
    frames: [
      ['..e.........', '.wwbbbbbbbdd', '..bbbbbbbbdd', '...d.....dd.'],
      ['..e.........', '.wwbbbbbbbdd', '..bbbbbbbbd.', '....d.....dd'],
    ] as const,
    young: [
      ['.e........', 'wwbbbbbbdd', '.bbbbbbbd.'],
      ['.e........', 'wwbbbbbbd.', '.bbbbbbbdd'],
    ] as const,
  },
};
