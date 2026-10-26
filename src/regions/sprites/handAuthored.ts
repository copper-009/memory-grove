/**
 * Real hand-authored `CreatureSprite`s, Memory Forest's own VISITORS technique — drawn with
 * actual attention to each species' signature marks, not baked from the procedural
 * `BodyPlan` generator (see `baked.generated.ts` for the bulk first-pass covering every
 * other creature). Keyed `${regionKey}:${creatureKey}`; `src/regions/index.ts` prefers an
 * entry here over the baked one with the same key.
 *
 * The first seven (Australia's eucalypt woodland, plus the cassowary and platypus) were
 * drawn from nothing. Everything from the gallery-review redo pass on — the user's own
 * instruction — starts instead from whichever of this project's own already-proven shapes
 * fits best, recoloured and lightly modified, rather than redesigned from scratch: the
 * vendored engine's own milestone-visitor sprites (`src/vendor/memory-forest/web/
 * visitors.js`'s `VISITORS` table — fox, owl, heron, eagle, bear, deer, stag, squirrel,
 * rabbit, MIT licensed, credited here as the source of the *shape*, not reused as code) for
 * a close structural match, or another `HAND_SPRITES` entry in this same file for a species
 * the gallery review already confirmed reads well. A reused shape's `frames` grid is
 * transcribed unchanged except where a real signature mark calls for a small addition (a
 * tuft, longer legs); only the palette and the species notes below are new. The rest of the
 * roster still renders from `baked.generated.ts` until it gets the same treatment.
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

  // -- Shared from the vendored engine's own `eagle` sprite (visitors.js), recoloured per
  // species — a gliding silhouette, wings raised on the second frame. The shape itself was
  // already proven; eight species across every continent share this one build, varying only
  // which part of the wing/head pattern carries the identifying colour.
  'aotearoa:karearea': {
    // Dark brown-grey overall, barred below — New Zealand's own falcon, not an eagle, but
    // the same gliding-raptor silhouette reads correctly at this size.
    pal: { d: '#4a3a2c', b: '#6a5438', h: '#c9b89a', y: '#e0a030' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'australia:wedge-tailed-eagle': {
    // Uniform dark brown all over, no pale head or tail — Australia's largest raptor.
    pal: { d: '#241c14', b: '#4a3a28', h: '#6a5438', y: '#2a2420' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'canada:golden-eagle': {
    // Golden-brown nape, dark wings — patrols the Rocky Mountain alpine zone.
    pal: { d: '#2e2318', b: '#5a4428', h: '#9a7a3e', y: '#3a2e20' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'eastafrica:african-fish-eagle': {
    // White head and chest over a dark body — the signature mark that separates it from the
    // plainer raptors sharing this shape.
    pal: { d: '#1a1a1c', b: '#6a4428', h: '#f4f0e6', y: '#e8a030' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'norway:havorn': {
    // White-tailed eagle: pale head and tail, brown body.
    pal: { d: '#2a241c', b: '#5a4e3a', h: '#d8d2c4', y: '#d8a030' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'norway:kongeorn': {
    // Golden eagle: the same species as canada:golden-eagle, a shade cooler. (Was keyed
    // `elg-fjell` — a copy-paste slip from the elk entry nearby; its own `common` field
    // always said "Golden eagle". Renamed to match.)
    pal: { d: '#2a2018', b: '#44352a', h: '#8a6a3a', y: '#3a2e20' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'japan:stellers-sea-eagle': {
    // Dramatic white shoulder and tail patches on an otherwise near-black body, with a huge
    // orange bill — the heaviest eagle alive, and the most visually distinct of this group.
    pal: { d: '#161412', b: '#1a1614', h: '#f4f0e6', y: '#e8862a' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'patagonia:condor': {
    // Andean condor: the `h` patch becomes the bare pinkish-red head skin (not feathers),
    // the real identifying mark at a glance, over a black body.
    pal: { d: '#161412', b: '#201c18', h: '#c97858', y: '#3a3028' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },
  'patagonia:andean-condor-steppe': {
    // The same species as patagonia:condor — this biome's own entry for it, not a second
    // bird, so it shares that design exactly rather than inventing a steppe-specific one.
    pal: { d: '#161412', b: '#201c18', h: '#c97858', y: '#3a3028' },
    flies: true,
    frames: [
      ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
      ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....'],
    ] as const,
    young: [
      ['.....hh....', 'dd..bbhy...', '.ddbbbbdd..', '.....hh....'],
      ['d........d.', '.dd.hh..dd.', '..dbbhy.d..', '.....hh....'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `heron` sprite — a long-necked wading-bird
  // silhouette, perched still.
  'japan:red-crowned-crane': {
    // White body, black wingtips — the crane's own red crown patch is too small to read at
    // this resolution and is left out rather than guessed at as a stray pixel.
    pal: { g: '#eef0ea', e: '#1a1a1a', d: '#e8c060', w: '#2a2420', k: '#4a4f55' },
    frames: [
      ['..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '...k....', '..kk....'],
      ['..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '..kk....', '...k....'],
    ] as const,
    young: [
      ['.gg.....', 'gegdd...', '.ggg....', 'ggww....', '.gggw...', '..ggg...', '...k....', '..kk....'],
      ['.gg.....', 'gegdd...', '.ggg....', 'ggww....', '.gggw...', '..ggg...', '..kk....', '...k....'],
    ] as const,
  },
  'eastafrica:secretary-bird': {
    // The user's own example: the heron shape, grey-bodied with black "shorts" on the
    // thighs and a bare orange-red face patch, plus the one real addition this whole batch
    // makes to a reused shape — two long black crest quills projecting back from the head,
    // the secretary bird's own signature mark, that nothing else sharing this base has.
    pal: { g: '#9a9c94', e: '#d8603a', d: '#e8c060', w: '#1a1a1a', k: '#2a2a28', t: '#161614' },
    frames: [
      ['.t.t....', '..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '...k....', '..kk....'],
      ['..t.t...', '..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '..kk....', '...k....'],
    ] as const,
    young: [
      ['.gg.....', 'gegdd...', '.ggg....', 'ggww....', '.gggw...', '..ggg...', '...k....', '..kk....'],
      ['.gg.....', 'gegdd...', '.ggg....', 'ggww....', '.gggw...', '..ggg...', '..kk....', '...k....'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `owl` sprite — a compact perched bird, the ear
  // tufts already built into the top row.
  'japan:blakistons-fish-owl': {
    // The world's largest living owl species — mottled brown, the same compact silhouette
    // reads fine at any absolute size (size comes from this creature's own stage/band, not
    // the sprite grid).
    pal: { b: '#5a4530', d: '#2e2318', y: '#e8862a', l: '#9a8060' },
    frames: [
      ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.'],
      ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.'],
    ] as const,
    young: [
      ['bybyb', 'bbdbb', 'blllb', '.b.b.'],
      ['bybyb', 'bbdbb', 'blllb', '.b.b.'],
    ] as const,
  },
  'patagonia:burrowing-owl': {
    // Sandy brown and spotted, with famously long bare legs for an owl — the one real
    // addition this entry makes to the shared shape, two extra thin-leg rows under the body
    // rather than the usual single stubby pair.
    pal: { b: '#8a7050', d: '#5a4830', y: '#e8c030', l: '#d4c4a0' },
    frames: [
      ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.', '.d.d.', '.d.d.'],
      ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.', '.d.d.', '.d.d.'],
    ] as const,
    young: [
      ['bybyb', 'bbdbb', 'blllb', '.b.b.', '.d.d.'],
      ['bybyb', 'bbdbb', 'blllb', '.b.b.', '.d.d.'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `fox` sprite, recoloured.
  'norway:fjellrev': {
    // Arctic fox: pale blue-white fur year-round in this palette (rather than the seasonal
    // brown-to-white change a real one makes), the same low slinking shape as the native
    // red fox it's built from — padded a trailing `.` onto every other row to match row 2's
    // own width (12, one wider than the rest); the native sprite itself is ragged there and
    // the vendored engine's own renderer doesn't care, but Memory Grove's stricter
    // `validate.ts` requires every row in a frame to be the same width.
    pal: { o: '#e8eef2', w: '#ffffff', d: '#8a96a0', e: '#1a1c20' },
    frames: [
      ['........o.o.', '........ooo.', '........oeow', 'ww.oooooooo.', '.wooooooo...', '..d.d..d.d..'],
      ['........o.o.', '........ooo.', '........oeow', '.w.oooooooo.', 'w.ooooooo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['......o.o', '......ooo', 'w..ooeow.', '.wooooo..', '..d..d...'],
      ['......o.o', '......ooo', 'w..ooeow.', '.wooooo..', '..d..d...'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `bear` sprite, recoloured — walking, nose down.
  'canada:grizzly-bear': {
    // Warmer golden-brown than the native sprite's own palette, with lighter, silver-tipped
    // fur on the shoulder hump — the grizzly's own signature mark.
    pal: { b: '#6a4e34', h: '#9a8264', d: '#4a3420', e: '#0c0806', l: '#c4a47c', n: '#140c06' },
    frames: [
      ['....hhhhhhh......', '..hhbbbbbbbbh....', '.hbbbbbbbbbbbbd.d', '.bbbbbbbbbbbbbddd', '.bbbbbbbbbbbbbbeb', '.bbbbbbbbbbb.bbll', '..bbb..bbb....bln', '..ddd..ddd.......'],
      ['....hhhhhhh......', '..hhbbbbbbbbh....', '.hbbbbbbbbbbbbd.d', '.bbbbbbbbbbbbbddd', '.bbbbbbbbbbbbbbeb', '.bbbbbbbbbbb.bbll', '...bbb..bbb...bln', '...ddd..ddd......'],
    ] as const,
    young: [
      ['..hhhhh....', '.hbbbbbbh.d', 'bbbbbbbbddd', 'bbbbbbbbbeb', '.bbb.bbll..', '.ddd.ddd...'],
      ['..hhhhh....', '.hbbbbbbh.d', 'bbbbbbbbddd', 'bbbbbbbbbeb', '..bbb.bbll.', '..ddd.ddd..'],
    ] as const,
  },
  'norway:jerv': {
    // Wolverine: dark brown-black body, the native sprite's own pale shoulder/flank tone
    // reused as-is — it already sits exactly where a wolverine's pale lateral stripe runs,
    // without needing to move a single pixel.
    pal: { b: '#2e2620', h: '#4a3e30', d: '#1a1510', e: '#0a0806', l: '#8a7458', n: '#0a0806' },
    frames: [
      ['....hhhhhhh......', '..hhbbbbbbbbh....', '.hbbbbbbbbbbbbd.d', '.bbbbbbbbbbbbbddd', '.bbbbbbbbbbbbbbeb', '.bbbbbbbbbbb.bbll', '..bbb..bbb....bln', '..ddd..ddd.......'],
      ['....hhhhhhh......', '..hhbbbbbbbbh....', '.hbbbbbbbbbbbbd.d', '.bbbbbbbbbbbbbddd', '.bbbbbbbbbbbbbbeb', '.bbbbbbbbbbb.bbll', '...bbb..bbb...bln', '...ddd..ddd......'],
    ] as const,
    young: [
      ['..hhhhh....', '.hbbbbbbh.d', 'bbbbbbbbddd', 'bbbbbbbbbeb', '.bbb.bbll..', '.ddd.ddd...'],
      ['..hhhhh....', '.hbbbbbbh.d', 'bbbbbbbbddd', 'bbbbbbbbbeb', '..bbb.bbll.', '..ddd.ddd..'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `squirrel` sprite, recoloured — sitting up with
  // something in its paws.
  'canada:hoary-marmot': {
    // A big ground squirrel at heart — muted grey-brown instead of the native sprite's
    // red-brown, same sitting-up posture.
    pal: { r: '#8a7a60', R: '#6a5c46', t: '#9a8c70', T: '#7a6c54', l: '#c4b89a', e: '#140e06', d: '#3a3020', a: '#8a7a60', c: '#4a3e2e' },
    frames: [
      ['.tt..d.d', 'tTTt.rrr', 'tTt.Rrer', '.tTRrrlc', '..tRrrla', '...d.dd.'],
      ['.tt..d.d', 'tTTt.rrr', 'tTt.Rrer', '.tTRrrlc', '..tRrrla', '...d.dd.'],
    ] as const,
    young: [
      ['tTTt.rrr', 'tTt.Rrer', '.tTRrrlc', '...d.dd.'],
      ['tTTt.rrr', 'tTt.Rrer', '.tTRrrlc', '...d.dd.'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `deer` sprite, recoloured — grazing, head up
  // then down. Young (a fawn) drops the antlers entirely rather than drawing small ones —
  // real fawns don't have them yet.
  'japan:sika': {
    pal: { b: '#6a4e30', d: '#3a2a1a', l: '#9a7a50', w: '#e8e0d0' },
    frames: [
      ['.......d.d.', '........d..', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'nepal:spotted-deer': {
    // Chital — a warmer rufous tone than sika; the real white spotting doesn't survive at
    // this pixel budget, so the colour alone carries the species apart.
    pal: { b: '#8a6a40', d: '#4a3420', l: '#c4a060', w: '#f0ece0' },
    frames: [
      ['.......d.d.', '........d..', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'norway:reinsdyr': {
    // Reindeer — greyer and paler than either deer above, the coat tone doing the work of
    // telling a tundra animal from a woodland one.
    pal: { b: '#7a6c58', d: '#4a4030', l: '#a89878', w: '#d8d0c0' },
    frames: [
      ['.......d.d.', '........d..', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'patagonia:huemul': {
    // A true South Andean deer, not the steppe's camelids or the goat-family cluster it got
    // baked alongside — the native deer shape, a greyer brown.
    pal: { b: '#6a5844', d: '#3a3024', l: '#9a8868', w: '#c4b8a0' },
    frames: [
      ['.......d.d.', '........d..', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },

  // -- Shared from the vendored engine's own `stag` sprite (the larger antlered build),
  // recoloured — both the same species, Eurasia and North America's own common names for it.
  'norway:elg': {
    pal: { b: '#2e2620', d: '#1a1510', l: '#4a3e30', w: '#5a4e3a' },
    frames: [
      ['......d...d', '......dd.dd', '.......ddd.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '...........', '......d.d.d', 'wbbbbbbbdd.', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'canada:moose': {
    pal: { b: '#2e2620', d: '#1a1510', l: '#4a3e30', w: '#5a4e3a' },
    frames: [
      ['......d...d', '......dd.dd', '.......ddd.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '...........', '......d.d.d', 'wbbbbbbbdd.', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
};
