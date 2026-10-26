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
  // Round 2: "too much of a blob" — the crest was almost an afterthought. A sulphur-crested
  // cockatoo's whole identity is that erectile yellow crest, so it now gets real room: two
  // full rows instead of a corner pixel.
  'australia:cockatoo': {
    pal: { b: '#f6f4ee', d: '#c9c3b4', e: '#1a1510', y: '#f0d060', k: '#5a5248' },
    frames: [
      ['.yy......', '.yy......', '..bbbk...', '.bbbbbk..', '.bbebbd..', '.bbbbbd..', '..dkdk...'],
      ['yyy......', '.yy......', '..bbbk...', '.bbbbbk..', '.bbebbd..', '.bbbbbd..', '..dkdk...'],
    ] as const,
    young: [
      ['.y.....', '.bbbk..', 'bbebbd.', 'bbbbbd.', '.dkdk..'],
      ['yy.....', '.bbbk..', 'bbebbd.', 'bbbbbd.', '.dkdk..'],
    ] as const,
  },
  // Round 3: a second redesign (see the red kangaroo for the same fix) still read as "still
  // not kangaroo shaped" — the swooping bird-like body curve wasn't upright enough and had no
  // tail. Rebuilt genuinely vertical: small head on a tall torso, tucked forearms, a bent hind
  // leg, and a thick tail that actually reaches the ground as its own balancing "third leg,"
  // connected to the body rather than floating beside it.
  'australia:eastern-grey-kangaroo': {
    pal: { b: '#9a9383', d: '#6c6557', l: '#c4bdab', e: '#17130d', w: '#c4bdab', t: '#6c6557' },
    frames: [
      ['..l.l...', '..lelw..', '..l.....', '..lll...', '.lllll..', '.llllld.', '.dllldt.', 'd.lldtt.', '..ddtt..', '..dd.tt.'],
      ['..l.l...', '..lelw..', '..l.....', '..lll...', '.lllll..', '.llllld.', '.dllldt.', 'd.lldtt.', '..dd.tt.', '..ddtt..'],
    ] as const,
    young: [
      ['.l.l...', '.lelw..', '.l.....', '.lll...', 'llllld.', '.dlldt.', '.dd.tt.'],
      ['.l.l...', '.lelw..', '.l.....', '.lll...', 'llllld.', '.dlldt.', '.dd.tt.'],
    ] as const,
  },
  // Round 3: "it was better looking side on, the previous design was better" — the round-2
  // horizontal redesign (meant to fix the centipede complaint) was a worse trade than the
  // repetition it fixed. Back to the original vertical clinging-to-a-trunk pose, with the one
  // thing actually missing from it: small foot nubs under each banded segment.
  'australia:lace-monitor': {
    pal: { b: '#4a4238', d: '#2a251e', l: '#c8bb9a', e: '#0d0a06', y: '#d8c88a' },
    frames: [
      ['..e..............', '.dy..............', 'dbly.bly.bly.bly.', '.dbly.bly.bly.bl.', 'd...d...d...d....', '....dd...........'],
      ['..e..............', '.dy..............', 'dbly.bly.bly.bly.', '.dbly.bly.bly.bl.', '.d...d...d...d...', '.....dd..........'],
    ] as const,
    young: [
      ['.e.........', 'dy.........', 'bly.bly.bly', 'd...d...d..', '.dd........'],
      ['.e.........', 'dy.........', 'bly.bly.bly', '.d...d...d.', '..dd.......'],
    ] as const,
  },
  // Round 3: "better before, just add hands and feet to the side, looks like a mini panda now"
  // — the round-2 redesign (meant to pull the eyes/nose apart) read worse. Back to the
  // original face, with hand and foot nubs added along the body's sides and bottom corners,
  // the one thing actually missing from it.
  'australia:koala': {
    pal: { b: '#9aa0a4', d: '#6a7175', l: '#d6dade', e: '#120f0c', n: '#1d1813' },
    frames: [
      ['.d....d.', 'ddllllld', '.lllllld', 'l.le.el.', '.l.nn.l.', '.lllllb.', 'dbbbbbbd', '.d.bb.d.'],
      ['.d....d.', 'ddllllld', '.lllllld', 'l.l..el.', '.l.nn.l.', '.lllllb.', 'dbbbbbbd', 'd.bb.d..'],
    ] as const,
    young: [
      ['d....d', 'dlllld', 'l.ee.l', '.lnnl.', 'lllllb', 'dbbbbd', '.d.d..'],
      ['d....d', 'dlllld', 'l....l', '.lnnl.', 'lllllb', 'dbbbbd', '.d.d..'],
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
  // Round 2: still flagged wrong-scale, uniquely among the nine sharing the small eagle
  // template — fair, a wedge-tailed eagle is genuinely Australia's largest raptor. Its own
  // wider-wingspan variant of the same flying-eagle shape, not a recolour of the small one.
  // Round 3: shape approved, just wants a recolour — warmer chocolate-brown with a lighter
  // golden-brown nape patch, a real wedge-tailed eagle's actual colouring, instead of the
  // near-uniform near-black it had.
  'australia:wedge-tailed-eagle': {
    pal: { d: '#3a2a1a', b: '#5a4030', h: '#2a1c10', y: '#9a7840' },
    flies: true,
    frames: [
      ['........hh.........', '.dd.....bbhy.....dd', '..ddd.bbbbbbbbdd.d.', '..dddbbbbbbbbbbdd..', '....dddbbbbbddd....', '........hh.........'],
      ['........hh.........', '..dd....bbhy....dd.', '...ddd.bbbbbbbbdd.d', '...dddbbbbbbbbbbdd.', '....dddbbbbbddd....', '........hh.........'],
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
  // Round 2: "same scale as a bear" — a wolverine is bear-proportioned but dog/badger-SIZED,
  // not bear-sized. Swapped off the grizzly-bear topology entirely for a genuinely smaller
  // shape, roughly the squirrel/marmot template's footprint, bulked up slightly.
  'norway:jerv': {
    pal: { b: '#3e3024', d: '#201810', l: '#5c4a38', e: '#0a0806', n: '#8a6a48' },
    frames: [
      ['....l...', '.bbnlll.', 'bbbbdle.', 'bbbbb...', '.ddd.dd.', '.ddd.dd.'],
      ['....l...', '.bbnlll.', 'bbbbdle.', 'bbbbb...', '..dd.dd.', '.ddd.dd.'],
    ] as const,
    young: [
      ['..l..', 'bnlll', 'bbdle', 'bbb..', '.d.d.'],
      ['..l..', 'bnlll', 'bbdle', 'bbb..', 'd.d..'],
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

  // -- Batch 2: not a redesign but a re-pairing. `baked.generated.ts` drew japan:macaque and
  // madagascar:indri from a different, smaller procedural template than the one it gave
  // vervet-monkey, spider-monkey, ring-tailed-lemur and silvered-langur — and the gallery
  // review kept every one of THOSE, so that's the template that actually reads well at this
  // scale. Both entries below swap onto it, keeping each species' own already-chosen palette
  // intent (macaque's pink face tone, indri's amber eyes) rather than inventing new ones.
  'japan:macaque': {
    // Same seated-primate shape as the kept vervet-monkey/spider-monkey/ring-tailed-lemur —
    // the compact template baked.generated.ts gave macaque instead didn't read well. Keeps the
    // old bake's own three tones, just repointed: its spare pink-red `n` becomes the macaque's
    // signature bare face, sitting right where the shape already carries a single accent pixel.
    pal: { b: '#9a8a70', d: '#6a5c48', l: '#c2b299', e: '#d4766a' },
    frames: [
      ['d.....l.', '.d.bblll', '..bbbdle', '...dd...', '...ddd..', '...ddd..'],
      ['d.....l.', '.d.bblll', '..bbbdle', '...dd...', '....dd..', '...ddd..'],
    ] as const,
    young: [
      ['....l.', '...lll', '.bbdle', 'bbbb..', '.dd...', '.dd...'],
      ['....l.', '...lll', '.bbdle', 'bbbb..', '.dd...', '.dd...'],
    ] as const,
  },
  'madagascar:indri': {
    // Same tailless, upright shape as the kept sifaka — a close cousin, both Indriidae, and a
    // much better fit than the oversized bespoke template baked.generated.ts drew indri with.
    // Palette is the old bake's own: black body, white rump patch, and the amber-gold eyes a
    // real indri actually has.
    pal: { b: '#1a1814', d: '#0a0908', l: '#f0ece2', e: '#d8c060' },
    frames: [
      ['.....l.', '..bblll', '.bbbdle', 'dddd...', '..ddd..', '..ddd..'],
      ['.....l.', '..bblll', '.bbbdle', 'dddd...', '...dd..', '..ddd..'],
    ] as const,
    young: [
      ['....l.', '...lll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
      ['....l.', '...lll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },

  // -- Batch 3: fresh shapes for species groups with no kept sibling to borrow and nothing in
  // the vendored visitor set that fits — a big cat, a crocodilian, an elephant, a horned
  // ungulate and a ratite don't resemble a fox, heron, owl, bear, squirrel or deer closely
  // enough to just recolour one. Each shape below was sketched, rendered to a PNG with a small
  // throwaway Node script and eyeballed before being written here, specifically because this
  // round has no proven shape to lean on and the first-pass bake's own "blob" failures came
  // from skipping that step. One shape per real-world body plan, reused across every region
  // that has a member of it, recoloured (and for the few with a genuine physical difference —
  // the gharial's elongated snout, the lynx's tufted ears, elephant ear size by species — a
  // small shape change, same as Batch 1's reused-shape technique).
  // Round 3: round 2 fixed "looks too much like a fox" but overcorrected into "too blobby in
  // the body" on nearly every one of these. Kept the round head, ears, and connected tail from
  // round 2, cut the torso down from four solid rows to two — a leaner build, same proportions
  // as a real cat, not a fox's low slink or a bear's bulk.
  'eastafrica:lion': {
    // The mane — a shaggy ring that widens the head/neck silhouette, the one unmistakable
    // lion cue nothing else sharing this base has. Approved in round 3; only the body slimmed.
    pal: { o: '#c89a52', e: '#120e08', w: '#f0dca0', d: '#5a3e1c', m: '#8a5a24', t: '#5a3e1c' },
    frames: [
      ['.........mmm..', '........mooom.', '.......moeowm.', '.ttt..mooom...', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['.........mmm..', '........mooom.', '.......moeowm.', '..ttt.mooom...', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },
  'nepal:bengal-tiger': {
    pal: { o: '#d8762c', e: '#120e08', w: '#f4e4c8', d: '#2a1a0c', t: '#2a1a0c' },
    frames: [
      ['..........o.o.', '.........oooo.', '........oeow..', '.tttooooooooo.', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['..........o.o.', '.........oooo.', '........oeow..', '..tttoooooooo.', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },
  'nepal:snow-leopard': {
    pal: { o: '#d8d4c8', e: '#1a1612', w: '#ffffff', d: '#8a8478', t: '#8a8478' },
    frames: [
      ['..........o.o.', '.........oooo.', '........oeow..', '.tttooooooooo.', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['..........o.o.', '.........oooo.', '........oeow..', '..tttoooooooo.', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },
  'borneo:sunda-clouded-leopard': {
    pal: { o: '#9a8258', e: '#140f0a', w: '#d8c8a0', d: '#3a2e1c', t: '#3a2e1c' },
    frames: [
      ['..........o.o.', '.........oooo.', '........oeow..', '.tttooooooooo.', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['..........o.o.', '.........oooo.', '........oeow..', '..tttoooooooo.', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },
  'patagonia:puma-patagonia': {
    pal: { o: '#b89868', e: '#140f0a', w: '#e8dcc0', d: '#5a4a30', t: '#5a4a30' },
    frames: [
      ['..........o.o.', '.........oooo.', '........oeow..', '.tttooooooooo.', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['..........o.o.', '.........oooo.', '........oeow..', '..tttoooooooo.', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },

  // Same cat shape, tufted (dark-tipped) ears instead of plain ones — a lynx's one real
  // signature mark at this scale. Canada lynx and the Eurasian lynx (gaupe) look close enough
  // in silhouette to share it.
  'canada:canada-lynx': {
    pal: { o: '#8a7a5c', e: '#140f0a', w: '#e0d4b8', d: '#4a3e2a', k: '#1a1410', t: '#4a3e2a' },
    frames: [
      ['..........k.k.', '.........oooo.', '........oeow..', '.tttooooooooo.', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['..........k.k.', '.........oooo.', '........oeow..', '..tttoooooooo.', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },
  'norway:gaupe': {
    pal: { o: '#9a8868', e: '#140f0a', w: '#e8dcc0', d: '#5a4a30', k: '#1a1410', t: '#5a4a30' },
    frames: [
      ['..........k.k.', '.........oooo.', '........oeow..', '.tttooooooooo.', '..t..ooooooooo', '.....ooooooooo', '..d..d..d..d..'],
      ['..........k.k.', '.........oooo.', '........oeow..', '..tttoooooooo.', '...t.ooooooooo', '....ooooooooo.', '..d..d..d..d..'],
    ] as const,
    young: [
      ['......o.o', '.....oooo', '....oeow.', '.ttoooooo', '..oooooo.', '.d.d.d.d.'],
      ['......o.o', '.....oooo', '....oeow.', '..ttooooo', '.oooooo..', '.d.d.d.d.'],
    ] as const,
  },

  // Crocodile: low flat body, pale tail tip, legs rendered as belly-ridge texture rather than
  // individual limbs (reads better for a reptile lying flush with the ground than discrete
  // legs would). Saltwater and estuarine crocodile are the same real species — Crocodylus
  // porosus — under this project's two different regional common names, so they share the
  // identical shape AND palette, not just the shape.
  // Round 3: "still too thin with no texture or idea where the mouth is" — a visible row of
  // pale teeth along the snout now marks the jaw line, the one thing a crocodilian silhouette
  // needs to actually read as having a mouth.
  'australia:saltwater-crocodile': {
    pal: { b: '#4a5a34', d: '#2a3420', e: '#0c0c08', t: '#5e6e44', w: '#e8e4d0' },
    frames: [
      ['......e............', 'bbbbbbbb...........', 'wbwbwbwbbbbbbbbbtt.', 'bbbbbbbbbbbbbbbbtt.', '.ddbddbddbddbdd.tt.'],
      ['......e............', 'bbbbbbbb...........', 'wbwbwbwbbbbbbbbbbtt', 'bbbbbbbbbbbbbbbbbtt', '.ddbddbddbddbdd..t.'],
    ] as const,
    young: [
      ['....e.......', 'bbbb........', 'wbwbbbbbbbtt', 'bbbbbbbbbbtt', '.dbdbdbdbd.t'],
      ['....e.......', 'bbbb........', 'wbwbbbbbbbtt', 'bbbbbbbbbbtt', '.dbdbdbdbd.t'],
    ] as const,
  },
  'borneo:estuarine-crocodile': {
    pal: { b: '#4a5a34', d: '#2a3420', e: '#0c0c08', t: '#5e6e44', w: '#e8e4d0' },
    frames: [
      ['......e............', 'bbbbbbbb...........', 'wbwbwbwbbbbbbbbbtt.', 'bbbbbbbbbbbbbbbbtt.', '.ddbddbddbddbdd.tt.'],
      ['......e............', 'bbbbbbbb...........', 'wbwbwbwbbbbbbbbbbtt', 'bbbbbbbbbbbbbbbbbtt', '.ddbddbddbddbdd..t.'],
    ] as const,
    young: [
      ['....e.......', 'bbbb........', 'wbwbbbbbbbtt', 'bbbbbbbbbbtt', '.dbdbdbdbd.t'],
      ['....e.......', 'bbbb........', 'wbwbbbbbbbtt', 'bbbbbbbbbbtt', '.dbdbdbdbd.t'],
    ] as const,
  },
  'eastafrica:nile-crocodile': {
    // Same shape, a more yellow-olive tan than the saltwater crocodile's dark green-grey.
    // Round 3 also asked for more tail — the pale tip stretched out an extra column.
    pal: { b: '#7a7a42', d: '#4a4a26', e: '#0c0c08', t: '#8e8e56', w: '#e8e4d0' },
    frames: [
      ['......e.............', 'bbbbbbbb............', 'wbwbwbwbbbbbbbbbttt.', 'bbbbbbbbbbbbbbbbttt.', '.ddbddbddbddbdd.ttt.'],
      ['......e.............', 'bbbbbbbb............', 'wbwbwbwbbbbbbbbbbttt', 'bbbbbbbbbbbbbbbbbttt', '.ddbddbddbddbdd..ttt'],
    ] as const,
    young: [
      ['....e.........', 'bbbb..........', 'wbwbbbbbbbttt.', 'bbbbbbbbbbttt.', '.dbdbdbdbd.ttt'],
      ['....e.........', 'bbbb..........', 'wbwbbbbbbbttt.', 'bbbbbbbbbbttt.', '.dbdbdbdbd.ttt'],
    ] as const,
  },
  'nepal:gharial': {
    // The crocodile body, with its snout stretched into its own thin connected line ending in
    // the gharial's real signature mark — the bulbous "ghara" tip male gharials grow. Teeth
    // added along the thin snout too, same fix as the other three.
    pal: { b: '#4a6a4a', d: '#2a3e2a', e: '#0c0c08', t: '#5e7e5e', w: '#e8e4d0' },
    frames: [
      ['be...................', '.wbwbwbwbbbbbbbbbbtt.', '.bbbbbbbbbbbbbbbbbtt.', '....ddbddbddbddbdd.tt'],
      ['be...................', '.wbwbwbwbbbbbbbbbbbtt', '.bbbbbbbbbbbbbbbbbbtt', '....ddbddbddbddbdd..t'],
    ] as const,
    young: [
      ['be............', '.wbwbbbbbbbtt.', '.bbbbbbbbbbtt.', '...dbdbdbdbd.t'],
      ['be............', '.wbwbbbbbbbtt.', '.bbbbbbbbbbtt.', '...dbdbdbdbd.t'],
    ] as const,
  },

  // Elephant: ear flap, trunk hanging and curling forward from the head, four distinct legs.
  // African elephants have noticeably larger ears than Asian (and Bornean, a Asian-elephant
  // subspecies) — the one real difference between these three, so the ear flap is trimmed for
  // the smaller-eared two rather than drawing a second body shape. Round 2: "legs also not long
  // enough" — a proper second leg row instead of a scalloped single row.
  'eastafrica:african-elephant': {
    pal: { b: '#8a8a88', d: '#5a5a58', e: '#0c0c0a', l: '#b4b4b0' },
    frames: [
      ['...lllll...........', '..lllllllbb........', '.lllllbbbbbb.......', 'bbbbbbbbbbbbe......', 'bbbbbbbbbbbbd......', 'bb.b..bb.b..d......', '.d.d..d.d...d......', '.d.d..d.d...dd.....'],
      ['...lllll...........', '..lllllllbb........', '.lllllbbbbbb.......', 'bbbbbbbbbbbbe......', 'bbbbbbbbbbbbb......', '.bb.b..bb.b.d......', 'd.d..d.d....d......', 'd.d..d.d...dd......'],
    ] as const,
    young: [
      ['.lll......', 'lllbbb....', 'bbbbbbe...', 'bb.b..b...', '.......b..', '.......b..'],
      ['.lll......', 'lllbbb....', 'bbbbbbe...', '.bb.b..b..', '........b.', '.......b..'],
    ] as const,
  },
  'borneo:bornean-elephant': {
    pal: { b: '#9a8a78', d: '#6a5a4a', e: '#0c0c0a', l: '#c4b4a0' },
    frames: [
      ['....lll............', '...lllllbb.........', '..lllbbbbbb........', 'bbbbbbbbbbbbe......', 'bbbbbbbbbbbbd......', 'bb.b..bb.b..d......', '.d.d..d.d...d......', '.d.d..d.d...dd.....'],
      ['....lll............', '...lllllbb.........', '..lllbbbbbb........', 'bbbbbbbbbbbbe......', 'bbbbbbbbbbbbb......', '.bb.b..bb.b.d......', 'd.d..d.d....d......', 'd.d..d.d...dd......'],
    ] as const,
    young: [
      ['.lll......', 'lllbbb....', 'bbbbbbe...', 'bb.b..b...', '.......b..', '.......b..'],
      ['.lll......', 'lllbbb....', 'bbbbbbe...', '.bb.b..b..', '........b.', '.......b..'],
    ] as const,
  },
  'nepal:asian-elephant': {
    pal: { b: '#8a7a68', d: '#5a4a3a', e: '#0c0c0a', l: '#b4a490' },
    frames: [
      ['....lll............', '...lllllbb.........', '..lllbbbbbb........', 'bbbbbbbbbbbbe......', 'bbbbbbbbbbbbd......', 'bb.b..bb.b..d......', '.d.d..d.d...d......', '.d.d..d.d...dd.....'],
      ['....lll............', '...lllllbb.........', '..lllbbbbbb........', 'bbbbbbbbbbbbe......', 'bbbbbbbbbbbbb......', '.bb.b..bb.b.d......', 'd.d..d.d....d......', 'd.d..d.d...dd......'],
    ] as const,
    young: [
      ['.lll......', 'lllbbb....', 'bbbbbbe...', 'bb.b..b...', '.......b..', '.......b..'],
      ['.lll......', 'lllbbb....', 'bbbbbbe...', '.bb.b..b..', '........b.', '.......b..'],
    ] as const,
  },

  // Horned ungulates: the native deer/stag body and legs (already proven), with the branching
  // antler rows swapped for a single horn shape — short straight spikes for the goat-family
  // members whose real horns are short and fairly straight, a backward curl for the two whose
  // horns actually curve (bighorn ram, and bharal — the "blue sheep," closer kin to sheep than
  // to true goats despite the name).
  'canada:mountain-goat': {
    pal: { b: '#e8e4d8', l: '#ffffff', w: '#ffffff', d: '#b8b4a4', h: '#3a342a' },
    frames: [
      ['.......h.h.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......h.h.', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'nepal:himalayan-tahr': {
    pal: { b: '#8a6a44', l: '#b89468', w: '#d8bc94', d: '#5a4228', h: '#2a2018' },
    frames: [
      ['.......h.h.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......h.h.', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'japan:serow': {
    pal: { b: '#4a4038', l: '#6a5e52', w: '#8a7e70', d: '#2a2420', h: '#141210' },
    frames: [
      ['.......h.h.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......h.h.', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'canada:bighorn-sheep': {
    pal: { b: '#a4886a', l: '#d8c4a0', w: '#e8dcc0', d: '#6a5640', h: '#4a3e2c' },
    frames: [
      ['......hh...', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['......h....', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'nepal:bharal': {
    pal: { b: '#7a8290', l: '#a8aebc', w: '#c8ccd4', d: '#4a4e58', h: '#2a2c30' },
    frames: [
      ['......hh...', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['......h....', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbb...', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },

  // Ratite: long neck, small head, round flightless body, two strong legs. Emu and lesser
  // rhea differ mainly in colour (sooty black-brown vs a paler grey-brown).
  // Round 2: the first redesign still read as a thin stick-neck blob. The cassowary (kept,
  // called out by name as the reference) has the right scale for a big flightless bird — a
  // real neck segment distinct from a round, substantial body block, not a thin uniform line.
  // Both built on that same proportion, recoloured.
  'australia:emu': {
    // Bare bluish-grey neck skin, shaggy dark brown-grey body.
    pal: { b: '#4a3e2e', d: '#241c14', l: '#8a8e94', e: '#0a0806', w: '#5a6670' },
    frames: [
      ['....l...', '...lel..', '....w...', '....w...', '....w...', '....d...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '...d.d..', '...d.d..'],
      ['....l...', '...lel..', '....w...', '....w...', '....w...', '....d...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '..d.d...', '..d.d...'],
    ] as const,
    young: [
      ['...l..', '..lel.', '...w..', '...w..', '.bbbb.', 'bbbbbb', 'bbbbbb', '.bbbb.', '..d.d.'],
      ['...l..', '..lel.', '...w..', '...w..', '.bbbb.', 'bbbbbb', 'bbbbbb', '.bbbb.', '..d.d.'],
    ] as const,
  },
  'patagonia:lesser-rhea': {
    // Same scale, fully feathered grey-brown neck (no bare patch), plainer overall.
    pal: { b: '#8a7a62', d: '#5a4e3c', l: '#b0a088', e: '#0c0a08' },
    frames: [
      ['....l...', '...lel..', '....l...', '....l...', '....l...', '....d...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '...d.d..', '...d.d..'],
      ['....l...', '...lel..', '....l...', '....l...', '....l...', '....d...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '..d.d...', '..d.d...'],
    ] as const,
    young: [
      ['...l..', '..lel.', '...l..', '...l..', '.bbbb.', 'bbbbbb', 'bbbbbb', '.bbbb.', '..d.d.'],
      ['...l..', '..lel.', '...l..', '...l..', '.bbbb.', 'bbbbbb', 'bbbbbb', '.bbbb.', '..d.d.'],
    ] as const,
  },

  // Guanaco: long leaning camelid neck, slender body, long legs, no hump. The steppe biome
  // entry is the literal same species in a second Patagonia biome, so it's the same shape and
  // palette, not a variant. Round 3: the top-most neck pixel sat alone above the head and read
  // as a horn — camelids don't have one — so the neck line now starts flush with the head.
  'patagonia:guanaco': {
    pal: { b: '#c4a878', d: '#8a7050', e: '#140f0a', l: '#e8dcc0' },
    frames: [
      ['.....l..', '....le..', '...l....', 'bb.l....', 'bbbbbbb.', '.bbbbbb.', '.d.d.d.d', '.d.d.d.d'],
      ['.....l..', '....le..', '...l....', '.bb.l...', 'bbbbbbb.', '.bbbbbb.', 'd.d.d.d.', '.d.d.d.d'],
    ] as const,
    young: [
      ['...l', '..le', '.l..', 'bbb.', 'bbb.', 'd.d.'],
      ['...l', '..le', '.l..', '.bbb', 'bbb.', '.d.d'],
    ] as const,
  },
  'patagonia:guanaco-steppe': {
    pal: { b: '#c4a878', d: '#8a7050', e: '#140f0a', l: '#e8dcc0' },
    frames: [
      ['.....l..', '....le..', '...l....', 'bb.l....', 'bbbbbbb.', '.bbbbbb.', '.d.d.d.d', '.d.d.d.d'],
      ['.....l..', '....le..', '...l....', '.bb.l...', 'bbbbbbb.', '.bbbbbb.', 'd.d.d.d.', '.d.d.d.d'],
    ] as const,
    young: [
      ['...l', '..le', '.l..', 'bbb.', 'bbb.', 'd.d.'],
      ['...l', '..le', '.l..', '.bbb', 'bbb.', '.d.d'],
    ] as const,
  },

  // -- Batch 4: the rest of the redo list, each judged on its own merits against a render
  // rather than assumed. Several of these already had a reasonable shape in the first-pass
  // bake — the takahe's blue body and red bill, the orangutan's big-ape posture, the
  // woodpecker's black body — and just needed their actual signature mark fixed (the
  // woodpecker's red-crest palette colour was defined but never painted onto a pixel) or an
  // exaggerated proportion toned down (the takahe's four spindly single-pixel legs, four rows
  // tall, read as spider legs on a chunky flightless rail — shortened and thickened to two).
  // The rest — kiwi, the radiated tortoise, the sloth, the monal, the giant salamander — really
  // were shapeless, and got a real redesign built around each one's one unmistakable feature:
  // the kiwi's long beak on a near-spherical body, the tortoise's starburst shell pattern, the
  // salamander's flat mottled toed body.
  // Round 3: "a little too round with no colour variation" — a lighter highlight tone across
  // the top of the body breaks up the solid brown mass.
  'aotearoa:kiwi': {
    pal: { b: '#6a5a46', d: '#3a2e20', e: '#120e08', w: '#2a2218', l: '#8a7a5e' },
    frames: [
      ['.llbb.......', 'lbbbbb......', 'bbbbbbe.....', 'bbbbbbwww...', '.dbbb...ww..', '..d..d......'],
      ['.llbb.......', 'lbbbbb......', 'bbbbbbe.....', 'bbbbbbwww...', '.dbbb...ww..', '.d..d.......'],
    ] as const,
    young: [
      ['.bbb....', 'bbbbe...', 'bbbww...', '.bb.ww..', '.d.d....'],
      ['.bbb....', 'bbbbe...', 'bbbww...', '.bb.ww..', 'd.d.....'],
    ] as const,
  },
  'madagascar:radiated-tortoise': {
    // The starburst shell pattern this tortoise is named for.
    pal: { b: '#2a2218', y: '#e0b840', l: '#f0d470', e: '#0a0806', d: '#140f0a' },
    frames: [
      ['..bbbb.....', '.byybyybb..', 'byybyybyybe', 'bbbbbbbbbb.', 'dd.dd.dd...'],
      ['..bbbb.....', '.byybyybb..', 'byybyybyybe', 'bbbbbbbbbb.', '.dd.dd.dd..'],
    ] as const,
    young: [
      ['.bbbb..', 'byybybe', 'bbbbbb.', 'd.d.d..'],
      ['.bbbb..', 'byybybe', 'bbbbbb.', '.d.d.d.'],
    ] as const,
  },
  // Round 3: still "Redraw (blob)" — a real sloth's signature is the dark mask around its
  // eyes against a pale face, which the first version didn't make clear. Round head separated
  // from the body, limbs reaching out to the sides.
  'costarica:three-toed-sloth': {
    pal: { b: '#8a8a6e', d: '#5e5e46', l: '#b4b494', e: '#1a1810', m: '#3a3828' },
    frames: [
      ['...mmmm.....', '..lmeleml...', '..lllll.....', '.bbbbbbb....', 'dbbbbbbbd...', '.d.....d....'],
      ['...mmmm.....', '..lmeleml...', '..lllll.....', '.bbbbbbb....', '.dbbbbbbbd..', '..d.....d...'],
    ] as const,
    young: [
      ['.mmm.', 'lmelm', '.lll.', 'bbbb.', 'd...d'],
      ['.mmm..', 'lmelm.', '.lll..', 'bbbb..', '.d...d'],
    ] as const,
  },
  'nepal:himalayan-monal': {
    // A small perching-bird body plus the one thing a monal actually reads as at this scale —
    // a crest and genuinely iridescent, not just colourful, plumage.
    pal: { b: '#1a3a6a', d: '#0c1a30', l: '#2a6a5a', e: '#140f0a', c: '#8a3ab0', y: '#c0392b', w: '#f0ece0' },
    frames: [
      ['..c..c..', '...ddd..', '...lll..', '...dlye.', '.ww.....', 'dww.....', '.dd.....'],
      ['..c..c..', '...ddd..', '...lll..', '...dlye.', '.ww.....', 'dww.....', '.dd.....'],
    ] as const,
    young: [
      ['..ddd.', '..lll.', '..dle.', '.ww...', 'dww...', '.dd...'],
      ['..ddd.', '..lll.', '..dle.', '.ww...', 'dww...', '.dd...'],
    ] as const,
  },
  // Round 2: the repeating toe-texture down the whole body length read as a centipede's many
  // legs, the same failure as lace-monitor's banding. Cut down to the two leg pairs a
  // salamander actually has, with mottled (not repeating) skin texture in between. Round 3:
  // "still looks a bit like a centipede, add one more layer on top for more girth" — a second
  // body row doubles the thickness.
  'japan:giant-salamander': {
    pal: { b: '#5a5444', d: '#36322a', e: '#0a0a06', w: '#7e7660' },
    frames: [
      ['........e...........', 'wbwbbbbwbbbbwbwbbb..', 'wbwbbbbwbbbbwbwbbb..', 'dd..d.........dd.dd.'],
      ['........e...........', '.wbwbbbbwbbbbwbwbbb.', '..wbwbbbbwbbbbwbwbbb', '.dd..d.........dd.dd'],
    ] as const,
    young: [
      ['....e......', 'wbwbbbwbwbb', 'wbwbbbwbwbb', 'dd.....dd.d'],
      ['....e.......', '.wbwbbbwbwb.', '..wbwbbbwbw.', '.dd.....dd.d'],
    ] as const,
  },
  // Round 2: still "wrong scale, redraw shape" — wider and bulkier, a real horn instead of a
  // single pixel, and legs under both ends of the body instead of one bunched-up cluster.
  // Round 3: "the horn is on its back" — it sat over the centre of the body instead of above
  // the snout at the far right. Moved to line up with the face.
  'nepal:greater-rhino': {
    pal: { b: '#6a685c', d: '#403e34', l: '#8e8c7c', e: '#0c0a06', h: '#3a362a' },
    frames: [
      ['.........hhh.', '.........h...', '...bbbb.l....', '..bbbbbblll..', '.bbbbbbbbldll', '.bbbbbbbbb...', 'd.dbbbbd.....', '..ddddddd....', '..dd.dd.dd...', '..dd.dd.dd...'],
      ['.........hhh.', '.........h...', '...bbbb.l....', '..bbbbbblll..', '.bbbbbbbbldll', '.bbbbbbbbb...', 'd.dbbbbd.....', '...dd.dd.....', '..dd.dd.dd...', '..dd.dd.dd...'],
    ] as const,
    young: [
      ['.....h.', '....l..', '.bblll.', 'bbbdle.', '.dd....', '.ddd...', '.ddd...'],
      ['.....h.', '....l..', '.bblll.', 'bbbdle.', '.dd....', '..dd...', '.ddd...'],
    ] as const,
  },
  // Round 3: "got a gap in its body now" — the nose row had nothing else in it, breaking the
  // silhouette between the face above and the legs below. The body fill now continues through
  // that row, with the nose hanging off it.
  'borneo:proboscis-monkey': {
    pal: { b: '#8a5438', d: '#5c3722', l: '#b07a54', e: '#100a06', n: '#e8a890' },
    frames: [
      ['......l...', '...bblll..', '..bbbdlll.', '..bbb.nn..', 'ddddd.....', '...ddd....', '...ddd....'],
      ['......l...', '...bblll..', '..bbbdlll.', '..bbb.nn..', 'ddddd.....', '....dd....', '...ddd....'],
    ] as const,
    young: [
      ['....l.', '...lll', '.bbdle', '...n..', 'bbbb..', 'ddd...', '.dd...'],
      ['....l.', '...lll', '.bbdle', '...n..', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },
  // Round 3: "not horse shaped" — turned out the issue was the all-over alternating stripe
  // pattern eating the body mass down to a thin zigzag. Rebuilt on the deer/stag quadruped
  // body (proven for every other ungulate here), ears instead of antlers, a couple of clear
  // dark stripe bands crossing a solid body instead of checkering every pixel.
  'eastafrica:plains-zebra': {
    pal: { b: '#f0ece0', d: '#1a1814', e: '#0a0806' },
    frames: [
      ['.......e.e.', '.......bbb.', '.......bdbe', 'dbbdbbdbbb.', '.bbdbbdbbd.', '.d.d..d.d..'],
      ['.......e.e.', '.......bbb.', '.......bdbe', '.dbbdbbdbbd', 'bbdbbdbbd..', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.....e.', '.....bb', '....bdb', 'dbbdbb.', '.bbdbb.'],
      ['.....e.', '.....bb', '....bdb', '.dbbdbb', 'bbdbb..'],
    ] as const,
  },
  // Round 2: still read as a blob at the first fixed-up size — rounder, taller body mass this
  // time, a chunky rail should read as plump, not boxy. Round 3: still "Redraw (blob)" after
  // two attempts — dropped the 12-row, five-colour design for the proven big-bird template
  // that already worked for emu and lesser rhea (short neck instead of their long one), red
  // beak, plain round body.
  'aotearoa:takahe': {
    pal: { b: '#20467a', l: '#3a6a9a', e: '#c0302a', d: '#142c52' },
    frames: [
      ['....l...', '...lee..', '....b...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '...d.d..', '...d.d..'],
      ['....l...', '...lee..', '....b...', '..bbbbb.', '.bbbbbbb', '.bbbbbbb', '..bbbbb.', '..d.d...', '..d.d...'],
    ] as const,
    young: [
      ['..l...', '.lee..', '..b...', 'bbbbb.', '.bbb..', '..d.d.'],
      ['..l...', '.lee..', '..b...', 'bbbbb.', '.bbb..', '.d.d..'],
    ] as const,
  },
  // Round 3: "now too much like a bear, needs to be more upright" — the trailing arm broke the
  // read. Dropped it; the plain upright ape body (unmodified from its first version) is the
  // one that actually reads as a primate.
  'borneo:bornean-orangutan': {
    pal: { b: '#9a5a2e', d: '#6a3a18', l: '#c0824a', e: '#120e08' },
    frames: [
      ['.........l.', '.......lll.', '.bbbbbbllle', '.bbbbbbdll.', 'bbbbbbbb...', '.bbbbbb....', '.ddbbdd....', '..dd.dd....', '..dd.dd....'],
      ['.........l.', '.......lll.', '.bbbbbbllle', '.bbbbbbdll.', 'bbbbbbbb...', '.bbbbbb....', '.ddbbdd....', '...d..d....', '..dd.dd....'],
    ] as const,
    young: [
      ['....l.', '....l.', '.bblll', 'bbbdle', '.dd...', '.ddd..', '.ddd..'],
      ['....l.', '....l.', '.bblll', 'bbbdle', '.dd...', '..dd..', '.ddd..'],
    ] as const,
  },
  // Round 3: "the beak is on the top of head for some reason" — the red crest dots floated
  // above the head with nothing else to read as a beak. Crest moved onto the head itself, and
  // a pale beak now extends from the front of the face.
  'patagonia:magellanic-woodpecker': {
    pal: { b: '#1a1a1c', d: '#0a0a0c', l: '#3a3a3e', e: '#120e08', r: '#c0392b', w: '#e8e4d0' },
    frames: [
      ['...rr..', '..rlll.', 'bbdlllw', 'dbb....', '.d.d...', '.d.d...'],
      ['...rr..', '..rlll.', 'bbdlllw', 'dbb....', '...d...', '.d.d...'],
    ] as const,
    young: [
      ['..rr.', 'rlll.', 'dlew.', 'bb...', 'dd...'],
      ['..rr.', 'rlll.', 'dlew.', 'bb...', 'dd...'],
    ] as const,
  },
  'eastafrica:masai-giraffe': {
    // Same patched hide and head, neck and legs each stretched by one row — the baked version
    // read as a giraffe already, just a noticeably short-necked one. Round 3: still flagged
    // (never revisited after the neck/leg stretch) — fewer colours in the body patches so they
    // don't blend into noise at this scale.
    pal: { b: '#c89850', d: '#6a4a26', l: '#e0c080', e: '#120e08' },
    frames: [
      [
        '......bd..', '......bd..', '.....bb...', '....bbbb..', '...bbbbbb.', '...bbddbb.',
        '...bbbbbb.', '..bbbbebb.', '...bddddb.', '.dddbbbbd.', 'd..dbbbbd.', '....dddd..', '.....dd...',
        '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.',
      ],
      [
        '......bd..', '......bd..', '.....bb...', '....bbbb..', '...bbbbbb.', '...bbddbb.',
        '...bbbbbb.', '..bbbbebb.', '...bddddb.', '.dddbbbbd.', 'd..dbbbbd.', '....dddd..', '.....d..d.',
        '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.', '....dd.dd.',
      ],
    ] as const,
    young: [
      ['..bd', '.bb.', '.dd.', 'blle', 'ddd.', '.dd.', '.ddd', '.ddd', '.ddd', '.ddd', '.ddd'],
      ['..bd', '.bb.', '.dd.', 'blle', 'ddd.', '.dd.', '..dd', '.ddd', '.ddd', '.ddd', '.ddd'],
    ] as const,
  },
  'aotearoa:kea': {
    // Same mountain-parrot body, beak lengthened by one pixel for more of its real hooked
    // profile.
    pal: { b: '#5a6a34', d: '#3a4620', l: '#7f8e4e', e: '#120e08', y: '#e07a28', w: '#4a4438' },
    frames: [
      ['........l...', '.......lll..', '...bbbbdlyyy', '...bwwb.....', '.dddwwd.....', 'd...d..d....', '....d..d....'],
      ['........l...', '.......lll..', '...bbbbdlyyy', '...bwwb.....', '.dddwwd.....', 'd......d....', '....d..d....'],
    ] as const,
    young: [
      ['....l..', '...lll.', '...dlyy', '.ww....', 'dww....', '.dd....'],
      ['....l..', '...lll.', '...dlyy', '.ww....', 'dww....', '.dd....'],
    ] as const,
  },

  // -- The last of the redo list: eleven more creatures the earlier batch plan missed on a
  // first pass (mostly Australia). Same per-creature judgment as Batch 4 — three butterflies
  // and a flying fox were genuinely shapeless and got a real wing redesign; a kangaroo and a
  // turtle needed their real signature posture (the kangaroo's prop tail, the turtle's long
  // neck) built in rather than implied; a thorny devil and an echidna needed the spine texture
  // that makes them read as spiny at all; a crane's legs got the same spindly-to-sturdy fix as
  // the takahe. The common loon turned out to be sharing the black swan's exact body — a real
  // loon has a shorter neck and a checkered back, not a swan's long curve — so it was
  // redesigned to actually look like a different bird, and the swan (which already reads well)
  // was left alone.
  // Round 2: the profile wing-wedge still read as "not butterfly shaped" on all three — twice.
  // Rebuilt as symmetric spread wings viewed from above (the same visual language as the
  // flying-eagle template, which already reads well), a body down the centre, antennae at top.
  'australia:richmond-birdwing': {
    pal: { d: '#15170f', y: '#d8c24a', b: '#0a0906' },
    frames: [
      ['...d.d...', '.ddyyydd.', 'dyyyyyyyd', 'dyybbbyyd', '.dyy.yyd.', '..d...d..'],
      ['..d.d....', '.ddyyydd.', '.dyyyyyd.', '.dybbbyd.', '..dy.yd..', '...d.d...'],
    ] as const,
    young: [
      ['.dyydyyd.', '.dyybyyd.', '..dy.yd..'],
      ['.dyydyyd.', '.dyybyyd.', '..dy.yd..'],
    ] as const,
    flies: true,
  },
  'australia:ulysses-butterfly': {
    pal: { d: '#0d0f1a', y: '#2f7fe0', b: '#080a14' },
    frames: [
      ['...d.d...', '.ddyyydd.', 'dyyyyyyyd', 'dyybbbyyd', '.dyy.yyd.', '..d...d..'],
      ['..d.d....', '.ddyyydd.', '.dyyyyyd.', '.dybbbyd.', '..dy.yd..', '...d.d...'],
    ] as const,
    young: [
      ['.dyydyyd.', '.dyybyyd.', '..dy.yd..'],
      ['.dyydyyd.', '.dyybyyd.', '..dy.yd..'],
    ] as const,
    flies: true,
  },
  'costarica:blue-morpho': {
    pal: { d: '#120f1a', y: '#2050d0', b: '#0a0812' },
    frames: [
      ['...d.d...', '.ddyyydd.', 'dyyyyyyyd', 'dyybbbyyd', '.dyy.yyd.', '..d...d..'],
      ['..d.d....', '.ddyyydd.', '.dyyyyyd.', '.dybbbyd.', '..dy.yd..', '...d.d...'],
    ] as const,
    young: [
      ['.dyydyyd.', '.dyybyyd.', '..dy.yd..'],
      ['.dyydyyd.', '.dyybyyd.', '..dy.yd..'],
    ] as const,
    flies: true,
  },
  // Round 3: still "Redraw (blob) with no variation in colour" — the wedge was a single solid
  // tone throughout. A lighter wing-membrane patch now breaks it up.
  'australia:spectacled-flying-fox': {
    pal: { d: '#2a2018', b: '#5a4530', y: '#d8c89a', s: '#e8ddc0' },
    frames: [
      ['........dsd', '.......bddd', '.dbbbbddddd', 'dbbbbbbd...', 'ddbbbbbd...', 'dddbbbbd...', '.dddbbd....', '.dddbbd....'],
      ['........dsd', '.......bddd', '.dbbbbddddd', 'dbbbbbbd...', 'ddbbbbbd...', 'dddbbbbd...', '.dddbbd....', '.dddbbd....'],
    ] as const,
    young: [
      ['....dsd..', '...bddd..', 'dbbddd...', 'dbbbd....', '.dbd.....'],
      ['....dsd..', '...bddd..', 'dbbddd...', 'dbbbd....', '.dbd.....'],
    ] as const,
  },
  'australia:long-necked-turtle': {
    // Same shell and legs, neck stretched into an actual curve instead of a stub.
    pal: { b: '#4a4232', d: '#2a251c', l: '#6e6448', e: '#0c0a06', y: '#c8c0a0' },
    frames: [
      ['.......bd', '......lld', '.....lle.', '....ddd..', '.bbbbbb..', '.bbbbbb..', 'dddbbdd..', '..dd.dd..', '..dd.dd..'],
      ['.......bd', '......lld', '.....lle.', '....ddd..', '.bbbbbb..', '.bbbbbb..', 'dddbbdd..', '...d..d..', '..dd.dd..'],
    ] as const,
    young: [
      ['.....lld', '....lle.', '....dd..', 'bbbbb...', 'ddd.....', '.dd.....'],
      ['.....lld', '....lle.', '....dd..', 'bbbbb...', 'ddd.....', '.dd.....'],
    ] as const,
  },
  // Round 2: the first real redesign still read as "still not kangaroo shaped" — the posture
  // direction the user gave this time: taller standing, with the hop mechanic styled after
  // the native rabbit visitor's hop (its `hop: true` already does that), not the rabbit's own
  // low crouching body shape. Built genuinely vertical: small head, tall torso, tucked
  // forearms, a bent hind leg, and a thick tail reaching the ground as its own connected
  // balancing stroke — same shape as the eastern grey, recoloured.
  'australia:red-kangaroo': {
    pal: { l: '#cf8f60', e: '#160f09', w: '#e8c49a', d: '#74402a', t: '#74402a' },
    frames: [
      ['..l.l...', '..lelw..', '..l.....', '..lll...', '.lllll..', '.llllld.', '.dllldt.', 'd.lldtt.', '..ddtt..', '..dd.tt.'],
      ['..l.l...', '..lelw..', '..l.....', '..lll...', '.lllll..', '.llllld.', '.dllldt.', 'd.lldtt.', '..dd.tt.', '..ddtt..'],
    ] as const,
    young: [
      ['.l.l...', '.lelw..', '.l.....', '.lll...', 'llllld.', '.dlldt.', '.dd.tt.'],
      ['.l.l...', '.lelw..', '.l.....', '.lll...', 'llllld.', '.dlldt.', '.dd.tt.'],
    ] as const,
    hop: true,
  },
  'australia:thorny-devil': {
    // Spines scattered across the whole back instead of a couple of dots at the crown — this
    // lizard's entire body is covered in them.
    pal: { b: '#b08048', d: '#7a5430', l: '#d8b478', e: '#120c06', y: '#e8d0a0' },
    frames: [
      ['.d.d.d.l.', '.bdbdblll', '.bbbdbdle', 'ddbdbd...', '..ddd....', '..ddd....'],
      ['.d.d.d.l.', '.bdbdblll', '.bbbdbdle', 'ddbdbd...', '...dd....', '..ddd....'],
    ] as const,
    young: [
      ['....l.', '.ddlll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
      ['....l.', '.ddlll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },
  // Round 3: "too much leg" — the dense bdbdbd checker running through the body read as many
  // small legs, the same failure as the centipede complaints elsewhere. Solid body, two real
  // legs, spines kept only at the crown.
  'australia:echidna': {
    pal: { b: '#4a3a28', d: '#2a2018', l: '#c8a860', e: '#0e0a06' },
    frames: [
      ['.d.d.d.l.', '.bbbblll.', '.bbbbdle.', 'bbbbb....', '.dd..dd..', '.dd..dd..'],
      ['.d.d.d.l.', '.bbbblll.', '.bbbbdle.', 'bbbbb....', '.dd..dd..', '.dd..dd..'],
    ] as const,
    young: [
      ['....l.', '.ddlll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
      ['....l.', '.ddlll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },
  // Round 2: still a "blob" even after differentiating from the swan — bigger, bulkier,
  // same checkered-back idea. Round 3: "I don't even know what this is" — dropped the
  // checkered pattern entirely for the proven big-bird template (emu, rhea, takahe): short
  // neck, round body, a plain white neck ring and belly patch instead of scattered marks.
  'canada:common-loon': {
    pal: { b: '#1a1a1c', l: '#3a3a3e', e: '#140e08', w: '#f0ece0', d: '#0a0a0c' },
    frames: [
      ['....l...', '...lel..', '....w...', '....b...', '..bbbbb.', '.bbwwwbb', '.bbwwwbb', '..bbbbb.', '...d.d..'],
      ['....l...', '...lel..', '....w...', '....b...', '..bbbbb.', '.bbwwwbb', '.bbwwwbb', '..bbbbb.', '..d.d...'],
    ] as const,
    young: [
      ['..l...', '.lel..', '..w...', 'bbbbb.', '.bwwb.', '..d.d.'],
      ['..l...', '.lel..', '..w...', 'bbbbb.', '.bwwb.', '.d.d..'],
    ] as const,
  },
  // Round 2: the user's own direction — the same heron/secretary-bird shape, not a reworked
  // generic body. Grey, with the bare red face patch a real brolga has; no crest quills or
  // black "shorts," those are the secretary bird's own marks.
  'australia:brolga': {
    pal: { g: '#9aa0a6', e: '#c0392b', d: '#e8e4dc', w: '#6a7076', k: '#4a5056' },
    frames: [
      ['..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '...k....', '..kk....'],
      ['..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '..kk....', '...k....'],
    ] as const,
    young: [
      ['.gg.....', 'gegdd...', '.ggg....', 'ggww....', '.gggw...', '..ggg...', '...k....', '..kk....'],
      ['.gg.....', 'gegdd...', '.ggg....', 'ggww....', '.gggw...', '..ggg...', '..kk....', '...k....'],
    ] as const,
  },
  // Round 3: "maybe try for the secretary bird method just make it a bit more squat with a
  // curl neck and no long legs" — round 2's elegant long straight neck and visible leg rows
  // were the opposite of what a floating swan needs. Squat body, neck curled back over it
  // instead of stretched up, legs dropped entirely (a swimming bird's legs are underwater).
  'australia:black-swan': {
    pal: { b: '#1c1a20', d: '#0e0d12', l: '#3a3742', e: '#c0392b', w: '#e8e4dc' },
    frames: [
      ['....bd.....', '....bb.....', '...llll....', '...llle....', '....dllll..', '.bbbbbbbb..', '.bbbbbbbb..', 'bbbbbbbbbb.', '.wwwwwwww..'],
      ['....bd.....', '....bb.....', '...llll....', '...llle....', '....dllll..', '.bbbbbbbb..', '.bbbbbbbb..', 'bbbbbbbbbb.', '.wwwwwwww..'],
    ] as const,
    young: [
      ['.bd...', '.bb...', 'llll..', 'llle..', 'dllll.', 'bbbbb.', 'wwwww.'],
      ['.bd...', '.bb...', 'llll..', 'llle..', 'dllll.', 'bbbbb.', 'wwwww.'],
    ] as const,
  },

  // New finds from the round-2 review — both were "keep" in pass 1 and never touched, flagged
  // fresh this round.
  'aotearoa:tuatara': {
    // The proven small-reptile shape (kept for the chameleons, gecko and frogs), with a row of
    // spine spikes added down the back — a real tuatara's actual signature, which a generic
    // lizard silhouette doesn't carry on its own.
    pal: { b: '#6a6a50', d: '#3e4030', l: '#92906e', e: '#0c0c06', y: '#d8d4b8', s: '#3e4030' },
    frames: [
      ['s.s.s..', 'd....l.', '..bblll', '.bbbdle', '.ddd...', '..ddd..', '..ddd..'],
      ['s.s.s..', 'd....l.', '..bblll', '.bbbdle', '.ddd...', '...dd..', '..ddd..'],
    ] as const,
    young: [
      ['s.s...', '....l.', '...lll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
      ['s.s...', '....l.', '...lll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },
  'madagascar:oustalets-chameleon': {
    // "Looks like a monkey" — its own shape read too much like the seated-primate template.
    // Swapped onto the shape panther-chameleon already uses (kept), recoloured to a duller
    // olive-brown: the shape itself was never the problem for that template, only this one's.
    pal: { b: '#6a7048', d: '#424a2a', l: '#9a9868', e: '#0a0a06' },
    frames: [
      ['d....l.', '..bblll', '.bbbdle', '.ddd...', '..ddd..', '..ddd..'],
      ['d....l.', '..bblll', '.bbbdle', '.ddd...', '...dd..', '..ddd..'],
    ] as const,
    young: [
      ['....l.', '...lll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
      ['....l.', '...lll', '.bbdle', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },
};
