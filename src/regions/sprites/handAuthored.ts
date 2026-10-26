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
  // connected to the body rather than floating beside it. Round 4: "not enough of a tail" —
  // the tail was still only 1-2px wide; thickened to a real triangular prop reaching the ground.
  // Round 6: "gap at the neck" — the neck row was a single pixel wide between two much wider
  // rows (head above, shoulders below), reading as a pinch/hole rather than a neck. Widened to
  // match the shoulder row.
  // Round 7: "still doesn't have the tail" — it was there, but `t` (tail) and `d` (leg/
  // shadow) were the literal same hex, so the tail was camouflaged into the leg mass instead
  // of reading as its own shape, and sat tucked directly behind the legs rather than
  // extending out as a prop. Recoloured `t` to the body's own light tone and reshaped it to
  // connect at the hip and reach the ground clearly apart from the legs.
  'australia:eastern-grey-kangaroo': {
    pal: { b: '#9a9383', d: '#6c6557', l: '#c4bdab', e: '#17130d', w: '#c4bdab', t: '#9a9383' },
    frames: [
      ['..l.l.....', '..lelw....', '..lll.....', '..lll.....', '.lllll....', '.llllltt..', '.dlldttt..', 'd..ddtttt.', '...dd..tt.', '........tt'],
      ['..l.l.....', '..lelw....', '..lll.....', '..lll.....', '.lllll....', '.llllltt..', '.dlldttt..', '.d.ddtttt.', '...dd..tt.', '........tt'],
    ] as const,
    young: [
      ['.l.l.....', '.lelw....', '.lll.....', '.lll.....', 'llllltt..', '.dlldttt.', '.dd...tt.'],
      ['.l.l.....', '.lelw....', '.lll.....', '.lll.....', 'llllltt..', '.dlldttt.', '.dd...tt.'],
    ] as const,
  },
  // Round 3: "it was better looking side on, the previous design was better" — the round-2
  // horizontal redesign (meant to fix the centipede complaint) was a worse trade than the
  // repetition it fixed. Back to the original vertical clinging-to-a-trunk pose, with the one
  // thing actually missing from it: small foot nubs under each banded segment.
  // Round 7: "can you make it taper to the tail, also legs are different sizes" — the body
  // was four identical banded segments with no taper at all, and the feet were inconsistent
  // (three single-pixel dots plus one random 2-wide foot). Now three body segments, each
  // with a matching single-pixel foot, then a genuine two-step taper to a point for the
  // tail — no segment or foot left mismatched in size.
  'australia:lace-monitor': {
    pal: { b: '#4a4238', d: '#2a251e', l: '#c8bb9a', e: '#0d0a06', y: '#d8c88a' },
    frames: [
      ['..e..............', '.dy..............', 'dbly.bly.bly.bb..', '.dbly.bly.bly.b..', 'd...d...d........', '....d...d........'],
      ['..e..............', '.dy..............', 'dbly.bly.bly.bb..', '.dbly.bly.bly.b..', '.d...d...d.......', '....d...d........'],
    ] as const,
    young: [
      ['.e..........', 'dy..........', 'bly.bly.bb..', 'd...d.......', '....d.......'],
      ['.e..........', 'dy..........', 'bly.bly.bb..', '.d...d......', '....d.......'],
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
  // near-uniform near-black it had. Round 4: still wanted a recolour — lighter golden-brown
  // this time, a bigger jump from the original than the round-3 attempt was.
  // Round 6: "make the animation and basis the same as the other large flying birds" — the
  // custom wider-wingspan variant is gone. Back to the exact shared eagle shape the other
  // eight (golden-eagle, havorn, kongeorn, etc., all approved) already use, just recoloured.
  'australia:wedge-tailed-eagle': {
    pal: { d: '#2a2018', b: '#44352a', h: '#1a1410', y: '#8a6a30' },
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
    // the vendored engine's own renderer doesn't care, but Memory Garden's stricter
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
  // Round 4: three independent notes converged — "the fox body shape was fine, maybe add
  // another layer... not whatever that is" / "weirdly shaped" / "glitchy." The round-3 custom
  // redesign (reworked head, connected tail) was the problem, not the fix. Reverted to the
  // native fox topology exactly as the vendored engine drew it — the shape nobody called
  // glitchy — with one extra body row underneath for bulk, nothing else changed.
  // Round 5: "good other than that" gap in the mane — row 1 had three transparent columns
  // sandwiched between the mane row above and the face row below. Filled.
  'eastafrica:lion': {
    pal: { o: '#c89a52', e: '#120e08', w: '#f0dca0', d: '#5a3e1c', m: '#8a5a24' },
    frames: [
      ['......mmmm...', '.....mooooom.', '.....mmoooom.', '......moeowm.', 'ww.oooooooo..', '.wooooooooo..', '.wooooooo....', '..d.d..d.d...'],
      ['......mmmm...', '.....mooooom.', '.....mmoooom.', '......moeowm.', '.w.oooooooo..', 'w.ooooooooo..', 'w.ooooooo....', '..d.d..d.d...'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ooooooo.', '.ooooooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oooooooo', '.ooooooo.', '.d.d..d.d'],
    ] as const,
  },
  // Round 4: "still doesn't have stripes" — a couple of dark stripe marks added to the flank.
  // Round 5: "better, but a bit more stripes" — doubled the stripe count across the body.
  'nepal:bengal-tiger': {
    pal: { o: '#d8762c', e: '#120e08', w: '#f4e4c8', d: '#2a1a0c' },
    frames: [
      ['.......o...o', '.......oooo.', '........oeow', 'ww.odoododo.', '.woodoodood.', '.wodoodoo...', '..d.d..d.d..'],
      ['.......o...o', '.......oooo.', '........oeow', '.w.odoododo.', 'w.oodoodood.', 'w.odoodoo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ododooo.', '.ooodooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oodoodoo', '.ooodooo.', '.d.d..d.d'],
    ] as const,
  },
  'nepal:snow-leopard': {
    pal: { o: '#d8d4c8', e: '#1a1612', w: '#ffffff', d: '#8a8478' },
    frames: [
      ['.......o...o', '.......oooo.', '........oeow', 'ww.oooooooo.', '.wooooooooo.', '.wooooooo...', '..d.d..d.d..'],
      ['.......o...o', '.......oooo.', '........oeow', '.w.oooooooo.', 'w.ooooooooo.', 'w.ooooooo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ooooooo.', '.ooooooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oooooooo', '.ooooooo.', '.d.d..d.d'],
    ] as const,
  },
  'borneo:sunda-clouded-leopard': {
    pal: { o: '#9a8258', e: '#140f0a', w: '#d8c8a0', d: '#3a2e1c' },
    frames: [
      ['.......o...o', '.......oooo.', '........oeow', 'ww.oooooooo.', '.wooooooooo.', '.wooooooo...', '..d.d..d.d..'],
      ['.......o...o', '.......oooo.', '........oeow', '.w.oooooooo.', 'w.ooooooooo.', 'w.ooooooo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ooooooo.', '.ooooooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oooooooo', '.ooooooo.', '.d.d..d.d'],
    ] as const,
  },
  'patagonia:puma-patagonia': {
    pal: { o: '#b89868', e: '#140f0a', w: '#e8dcc0', d: '#5a4a30' },
    frames: [
      ['.......o...o', '.......oooo.', '........oeow', 'ww.oooooooo.', '.wooooooooo.', '.wooooooo...', '..d.d..d.d..'],
      ['.......o...o', '.......oooo.', '........oeow', '.w.oooooooo.', 'w.ooooooooo.', 'w.ooooooo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ooooooo.', '.ooooooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oooooooo', '.ooooooo.', '.d.d..d.d'],
    ] as const,
  },

  // Same cat shape, tufted (dark-tipped) ears instead of plain ones — a lynx's one real
  // signature mark at this scale. Canada lynx and the Eurasian lynx (gaupe) look close enough
  // in silhouette to share it.
  'canada:canada-lynx': {
    pal: { o: '#8a7a5c', e: '#140f0a', w: '#e0d4b8', d: '#4a3e2a', k: '#1a1410' },
    frames: [
      ['.......k...k', '.......oooo.', '........oeow', 'ww.oooooooo.', '.wooooooooo.', '.wooooooo...', '..d.d..d.d..'],
      ['.......k...k', '.......oooo.', '........oeow', '.w.oooooooo.', 'w.ooooooooo.', 'w.ooooooo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ooooooo.', '.ooooooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oooooooo', '.ooooooo.', '.d.d..d.d'],
    ] as const,
  },
  'norway:gaupe': {
    pal: { o: '#9a8868', e: '#140f0a', w: '#e8dcc0', d: '#5a4a30', k: '#1a1410' },
    frames: [
      ['.......k...k', '.......oooo.', '........oeow', 'ww.oooooooo.', '.wooooooooo.', '.wooooooo...', '..d.d..d.d..'],
      ['.......k...k', '.......oooo.', '........oeow', '.w.oooooooo.', 'w.ooooooooo.', 'w.ooooooo...', '..d.d..d.d..'],
    ] as const,
    young: [
      ['.....o..o', '.....oooo', '......oeo', '.ooooooo.', '.ooooooo.', '.d.d..d.d'],
      ['.....o..o', '.....oooo', '......oeo', '.oooooooo', '.ooooooo.', '.d.d..d.d'],
    ] as const,
  },

  // Crocodile: low flat body, pale tail tip, legs rendered as belly-ridge texture rather than
  // individual limbs (reads better for a reptile lying flush with the ground than discrete
  // legs would). Saltwater and estuarine crocodile are the same real species — Crocodylus
  // porosus — under this project's two different regional common names, so they share the
  // identical shape AND palette, not just the shape.
  // Round 4: "teeth are too big now" across all four — cut from four teeth to two, and sized
  // down.
  // Round 6: "make the snout a bit longer and also the tail a bit longer" across all three
  // crocodilians — snout-top row extended, tail runs extended, same wiggle offset preserved.
  // Round 7: "add some more teeth (one more)" — a third alternating tooth mark.
  'australia:saltwater-crocodile': {
    pal: { b: '#4a5a34', d: '#2a3420', e: '#0c0c08', t: '#5e6e44', w: '#e8e4d0' },
    frames: [
      ['......e.................', 'bbbbbbbbbbb.............', '.wbwbwbbbbbbbbbbbbtttt..', 'bbbbbbbbbbbbbbbbtttt....', '.ddbddbddbddbdd.tttt....'],
      ['......e.................', 'bbbbbbbbbbb.............', '.wbwbwbbbbbbbbbbbbbtttt.', 'bbbbbbbbbbbbbbbbbtttt...', '.ddbddbddbddbdd..tttt...'],
    ] as const,
    young: [
      ['....e...........', 'bbbb............', '.wbwbwbbbbbtttt.', 'bbbbbbbbbbtttt..', '.dbdbdbdbd.ttt..'],
      ['....e............', 'bbbb.............', '.wbwbwbbbbbbtttt.', 'bbbbbbbbbbbtttt..', '.dbdbdbdbd..ttt..'],
    ] as const,
  },
  // Round 4: "probably the best of them, make sure all the crocs are different in some way
  // though" — saltwater and estuarine are the literal same species (Crocodylus porosus) under
  // this project's two regional common names, so a slightly muddier, more olive-brown tone for
  // Borneo's peat-stained blackwater rivers is the honest difference to draw, not a invented one.
  // Round 6: same snout/tail lengthening as the other crocodilians.
  // Round 7: "add some more teeth (one more)" — a third alternating tooth mark.
  'borneo:estuarine-crocodile': {
    pal: { b: '#5a5a30', d: '#343420', e: '#0c0c08', t: '#6e6e3e', w: '#e8e4d0' },
    frames: [
      ['......e.................', 'bbbbbbbbbbb.............', '.wbwbwbbbbbbbbbbbbtttt..', 'bbbbbbbbbbbbbbbbtttt....', '.ddbddbddbddbdd.tttt....'],
      ['......e.................', 'bbbbbbbbbbb.............', '.wbwbwbbbbbbbbbbbbbtttt.', 'bbbbbbbbbbbbbbbbbtttt...', '.ddbddbddbddbdd..tttt...'],
    ] as const,
    young: [
      ['....e...........', 'bbbb............', '.wbwbwbbbbbtttt.', 'bbbbbbbbbbtttt..', '.dbdbdbdbd.ttt..'],
      ['....e............', 'bbbb.............', '.wbwbwbbbbbbtttt.', 'bbbbbbbbbbbtttt..', '.dbdbdbdbd..ttt..'],
    ] as const,
  },
  // Round 4: "teeth a bit big, maybe a bit more of a tail" — smaller teeth, tail stretched
  // further still.
  // Round 6: snout extended further too, tail stretched again.
  // Round 7: "add some more teeth (one more)" — a third alternating tooth mark.
  'eastafrica:nile-crocodile': {
    pal: { b: '#7a7a42', d: '#4a4a26', e: '#0c0c08', t: '#8e8e56', w: '#e8e4d0' },
    frames: [
      ['......e...................', 'bbbbbbbbbbb...............', '.wbwbwbbbbbbbbbbbbtttttt..', 'bbbbbbbbbbbbbbbbtttttt....', '.ddbddbddbddbdd.tttttt....'],
      ['......e...................', 'bbbbbbbbbbb...............', '.wbwbwbbbbbbbbbbbbbtttttt.', 'bbbbbbbbbbbbbbbbbtttttt...', '.ddbddbddbddbdd..tttttt...'],
    ] as const,
    young: [
      ['....e.............', 'bbbb..............', '.wbwbwbbbbbttttt..', 'bbbbbbbbbbttttt...', '.dbdbdbdbd.ttttt..'],
      ['....e..............', 'bbbb...............', '.wbwbwbbbbbbttttt..', 'bbbbbbbbbbbttttt...', '.dbdbdbdbd..ttttt..'],
    ] as const,
  },
  // Round 4: "teeth are too big and on the top of the head?, I like the snout though" — the
  // round-3 tooth row sat at the head/body junction instead of on the snout itself. Reverted
  // the body to its round-2 shape (the one the user still likes) and moved the teeth to the
  // snout tip, next to the eye, where a gharial's jaw actually is.
  // Round 5: "there aren't any teeth now for some reason" — a single tooth pixel was too
  // faint to register against the long snout line. A few more alternating marks instead.
  // Round 7: "add some more teeth (one more)" — a fourth alternating tooth mark.
  // Round 8: "the teeth are on their head?" — teeth sat in a row entirely of their own
  // above the body, with nothing connecting them to it, so they read as a decoration
  // sitting on top of the head rather than a jaw. Rebuilt on the same structure the three
  // regular crocodilians already use successfully: teeth embedded directly in the body/jaw
  // row itself. A gharial's famously long, thin snout (carrying many more visible
  // interlocking teeth than a regular croc) is kept as an extra-long front section.
  'nepal:gharial': {
    pal: { b: '#4a6a4a', d: '#2a3e2a', e: '#0c0c08', t: '#5e7e5e', w: '#e8e4d0' },
    frames: [
      ['..............e...........', 'bbbbbbbbbbbbbbbb..........', 'wbwbwbwbwbwbwbbbbbbbbbtt..', '............ddbddbddbdd.tt'],
      ['..............e............', 'bbbbbbbbbbbbbbbb...........', 'wbwbwbwbwbwbwbbbbbbbbbbtt..', '............ddbddbddbdd..tt'],
    ] as const,
    young: [
      ['..........e.........', 'bbbbbbbbbbbb........', 'wbwbwbwbbbbbbbbbtt..', '........ddbddbdd.t..'],
      ['..........e.........', 'bbbbbbbbbbbb........', 'wbwbwbwbbbbbbbbbbtt.', '........ddbddbdd..t.'],
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

  // Round 4: "what's the massive horn doing there still... this is just like a slimmer deer so
  // use that basis without the horns" — the custom neck-sweep shape is gone. Built on the
  // native deer body directly (ears instead of antlers), unmodified otherwise. The steppe
  // biome entry is the literal same species in a second Patagonia biome, so it's the same
  // shape and palette, not a variant.
  'patagonia:guanaco': {
    pal: { b: '#c4a878', d: '#8a7050', l: '#e8dcc0', e: '#140f0a', w: '#f0e8d4' },
    frames: [
      ['.......e.e.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['.......e.e.', '.......bbb.', '.......bbbl', '.bbbbbbbbd.', 'wbbbbbbbb..', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbbbd.', '.bbbbbbbb..', '.d.d..d.d..'],
    ] as const,
  },
  'patagonia:guanaco-steppe': {
    pal: { b: '#c4a878', d: '#8a7050', l: '#e8dcc0', e: '#140f0a', w: '#f0e8d4' },
    frames: [
      ['.......e.e.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['.......e.e.', '.......bbb.', '.......bbbl', '.bbbbbbbbd.', 'wbbbbbbbb..', '.d.d..d.bbl', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..'],
      ['.......bbb.', 'wbbbbbbbbd.', '.bbbbbbbb..', '.d.d..d.d..'],
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
  // Round 4: "Recolor only" — warmer reddish-brown, closer to a real North Island brown
  // kiwi's actual shaggy coat.
  // Round 5: "a little too round and wrong scale" — a real kiwi is roughly chicken-sized,
  // noticeably bigger than this was. Scaled up (8 rows instead of 6) and widened.
  // Round 6: still "too round" — a taller, more tapered body was still basically a circle at
  // this resolution. Rebuilt genuinely low and wide (a squat flattened teardrop, wider than
  // tall), a real kiwi's actual proportions, not an egg standing on end.
  // Round 7: "still a bit big" — scaled down again, 16x7 to 12x6 (~75% linear), same
  // silhouette and beak, just smaller overall.
  'aotearoa:kiwi': {
    pal: { b: '#7a4a32', d: '#4a2416', e: '#120e08', w: '#2a1810', l: '#a06a48' },
    frames: [
      ['.ll.........', 'lbbbbbb.....', 'bbbbbbbbe...', 'bbbbbbbbwww.', '.dbbbbb..ww.', '..d..d......'],
      ['.ll.........', 'lbbbbbb.....', 'bbbbbbbbe...', 'bbbbbbbbwww.', '.dbbbbb..ww.', '.d..d.......'],
    ] as const,
    young: [
      ['.bbb...', 'bbbe...', 'bbww...', '.b.ww..', '.d.d...'],
      ['.bbb...', 'bbbe...', 'bbww...', '.b.ww..', 'd.d....'],
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
  // Round 4: "can't actually tell where the arms and legs are, supposed to perch in the
  // trees/on trunks so needs that shape" — a standing silhouette was never going to say
  // "sloth." Rebuilt as a genuine tree-clinging pose — still read as "doesn't look like
  // anything but a blob."
  // Round 5: "maybe use the orangutan shape for it and reskin the colours" — the orangutan's
  // upright body with both arms reaching down is itself a reasonable sloth-hanging silhouette,
  // and it's already approved ("good"). Reused directly, recoloured grey-green and shaggy.
  'costarica:three-toed-sloth': {
    pal: { b: '#8a8a6e', d: '#5e5e46', l: '#b4b494', e: '#1a1810' },
    frames: [
      ['...ll...', '..llll..', '..dlle..', '.bbbbb..', 'dbbbbbd.', 'dbbbbbd.', 'd.bbb.d.', 'd..b..d.', '...d.d..'],
      ['...ll...', '..llll..', '..dlle..', '.bbbbb..', 'dbbbbbd.', 'dbbbbbd.', 'd.bbb.d.', '...d.d..', 'd..b..d.'],
    ] as const,
    young: [
      ['.ll..', 'dlle.', 'bbbb.', 'dbbd.', '.bb..', '.d.d.'],
      ['.ll..', 'dlle.', 'bbbb.', 'dbbd.', '.bb..', 'd.d..'],
    ] as const,
  },
  // Round 4: "give it a bit more of a tail" — a trailing tail added behind the body.
  // Round 5: "it doesn't even look like a bird" — a real monal is pheasant-sized, not a tiny
  // perching bird. Scaled up with a fuller body and a longer tail.
  'nepal:himalayan-monal': {
    // A crest and genuinely iridescent, not just colourful, plumage — a monal's real signature.
    pal: { b: '#1a3a6a', d: '#0c1a30', l: '#2a6a5a', e: '#140f0a', c: '#8a3ab0', y: '#c0392b', w: '#f0ece0' },
    frames: [
      ['..c..c.....', '...ddd.....', '..ddddd....', '..dllll....', '..dlyye....', '.wwwdddd...', 'dwwwddddd..', '.dd...ddddd', '......d..dd'],
      ['..c..c......', '...ddd......', '..ddddd.....', '..dllll.....', '..dlyye.....', '.wwwdddd....', 'dwwwddddd...', '.dd....ddddd', '......d...dd'],
    ] as const,
    young: [
      ['.c.c..', '.ddd..', '.lll..', '.dlye.', 'wwdd..', 'dwwdd.', '.dd.d.'],
      ['.c.c..', '.ddd..', '.lll..', '.dlye.', 'wwdd..', 'dwwdd.', '.dd.d.'],
    ] as const,
  },
  // Round 2: the repeating toe-texture down the whole body length read as a centipede's many
  // legs, the same failure as lace-monitor's banding. Cut down to the two leg pairs a
  // salamander actually has, with mottled (not repeating) skin texture in between. Round 3:
  // "still looks a bit like a centipede, add one more layer on top for more girth" — a second
  // body row doubles the thickness. Round 4: "still a bit like a centipede, maybe taper head
  // and tail so you can tell where they are" — both ends narrowed relative to the middle.
  // Round 7: "can you make it taper and head and tail" — the round-4 "taper" was only empty
  // margin around a uniform-width rectangle, the body itself never actually narrowed. Now
  // genuinely tapered: the upper body row only spans the middle third (full two-row girth
  // there), while the lower row runs the full length and itself narrows to a single mark at
  // each tip, so head and tail both read as visibly thinner than the body.
  'japan:giant-salamander': {
    pal: { b: '#5a5444', d: '#36322a', e: '#0a0a06', w: '#7e7660' },
    frames: [
      ['.......e...............', '......bbbbbbbbbbbbb....', '...wbwbbbwbbbwbwbbbw...', '....dd.........dd......'],
      ['.......e...............', '......bbbbbbbbbbbbb....', '...wbwbbbwbbbwbwbbbw...', '.....dd.........dd.....'],
    ] as const,
    young: [
      ['.....e......', '....bbbbbb..', '..wbwbwbwbw.', '...dd....dd.'],
      ['.....e......', '....bbbbbb..', '..wbwbwbwbw.', '....dd....dd'],
    ] as const,
  },
  // Round 4: still "horn is on the back of the head instead of the front, body too round" —
  // the horn was still several rows above the snout with head bulk in between, reading as
  // mounted on a hump rather than the nose. Rebuilt flatter and more elongated (less round),
  // with the horn as a short mark directly touching the snout tip, not floating above it.
  // Round 5: "good thanks, just a bit too bulbous on the back, head is perfect now" — rows 2-3
  // poked out one column past rows 1 and 4 at the rear, reading as a hump. Rear edge now flat.
  'nepal:greater-rhino': {
    pal: { b: '#6a685c', d: '#403e34', l: '#8e8c7c', e: '#0c0a06', h: '#3a362a' },
    frames: [
      ['....l.............', '.bbbbbb...........', '.bbbbbbbbl..h.....', '.bbbbbbbbbldh.....', '.bbbbbbbbbbb......', 'd.dbbbbbbd........', '..ddddddddd.......', '..dd.dd.dd........'],
      ['....l.............', '.bbbbbb...........', '.bbbbbbbbl..h.....', '.bbbbbbbbbldh.....', '.bbbbbbbbbbb......', 'd.dbbbbbbd........', '...dd.dd.d........', '..dd.dd.dd........'],
    ] as const,
    young: [
      ['.bbbb.l..', 'bbbbbdhe.', '.bbbbb...', '.dd......', '.ddd.....', '.ddd.....'],
      ['.bbbb.l..', 'bbbbbdhe.', '.bbbbb...', '.dd......', '..dd.....', '.ddd.....'],
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
  // pattern eating the body mass down to a thin zigzag. Round 4: "better, maybe use the deer
  // shape as a basis just without the horns and keep the colouring like that" — now built
  // directly on the exact native deer body rows (ears instead of antlers), with the stripe
  // colouring kept.
  // Round 5: "glitches out the front" — a stripe mark sat right in the face, clashing with the
  // eye dots just above it. Head kept clean; stripes stay on the body only.
  // Round 7: "glitches out the front a lot, so make it move like the deer, and the lines on
  // the back always zig zag" — the round-4 copy of the deer's shape also copied its
  // antler-hiding "grazing dip" animation, which reshuffled the body rows and left a stray
  // mark with no counterpart in the other frame, even though a zebra has no antlers to hide
  // in the first place. Body and stripes now stay pixel-identical between frames (the zigzag
  // always reads the same), only the legs do a plain walk-cycle offset.
  'eastafrica:plains-zebra': {
    pal: { b: '#f0ece0', d: '#1a1814', l: '#ffffff', e: '#0a0806', w: '#ffffff' },
    frames: [
      ['.......e.e.', '.......bbb.', '.......bbbl', 'lbbdbbdbb..', '.bbdbbdbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['.......e.e.', '.......bbb.', '.......bbbl', 'lbbdbbdbb..', '.bbdbbdbb..', 'd.d..d.d...', '.d.d..d.d..'],
    ] as const,
    young: [
      ['.......bbb.', 'lbbdbbdbb..', '.bbdbbdbb..', '.d.d..d.d..'],
      ['.......bbb.', 'lbbdbbdbb..', '.bbdbbdbb..', 'd.d..d.d...'],
    ] as const,
  },
  // Round 2: still read as a blob at the first fixed-up size — rounder, taller body mass this
  // time, a chunky rail should read as plump, not boxy. Round 3: still "Redraw (blob)" after
  // two attempts — dropped the 12-row, five-colour design for the proven big-bird template
  // that already worked for emu and lesser rhea (short neck instead of their long one), red
  // beak, plain round body.
  // Round 4: "a little too big of a body" — one fewer row of body bulk.
  'aotearoa:takahe': {
    pal: { b: '#20467a', l: '#3a6a9a', e: '#c0302a', d: '#142c52' },
    frames: [
      ['...l...', '..lee..', '...b...', '.bbbbb.', '.bbbbb.', '..d.d..', '..d.d..'],
      ['...l...', '..lee..', '...b...', '.bbbbb.', '.bbbbb.', '.d.d...', '.d.d...'],
    ] as const,
    young: [
      ['..l...', '.lee..', '..b...', 'bbbbb.', '.bbb..', '..d.d.'],
      ['..l...', '.lee..', '..b...', 'bbbbb.', '.bbb..', '.d.d..'],
    ] as const,
  },
  // Round 4: still "too much like a bear, needs to be more upright" even after dropping the
  // arm — the base shape itself (a four-on-the-ground stance) was the problem, not just the
  // arm. Rebuilt genuinely upright: head held high, long arms reaching down both sides to the
  // ground (a real orangutan's actual signature), shorter legs under a narrower torso.
  'borneo:bornean-orangutan': {
    pal: { b: '#9a5a2e', d: '#6a3a18', l: '#c0824a', e: '#120e08' },
    frames: [
      ['...ll...', '..llll..', '..dlle..', '.bbbbb..', 'dbbbbbd.', 'dbbbbbd.', 'd.bbb.d.', 'd..b..d.', '...d.d..'],
      ['...ll...', '..llll..', '..dlle..', '.bbbbb..', 'dbbbbbd.', 'dbbbbbd.', 'd.bbb.d.', '...d.d..', 'd..b..d.'],
    ] as const,
    young: [
      ['.ll..', 'dlle.', 'bbbb.', 'dbbd.', '.bb..', '.d.d.'],
      ['.ll..', 'dlle.', 'bbbb.', 'dbbd.', '.bb..', 'd.d..'],
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
  // Round 4: still the exact pass-1 note after two lighter touches — the wide multi-row block
  // was the real problem, not the colour count. Rebuilt genuinely narrow and vertical: mostly
  // neck, small head, thin legs, the actual proportions a side-on giraffe needs.
  // Round 5: "better colour and height but it has no body" — the torso rows were the exact
  // same narrow width as the neck above them, so nothing read as a body. Widened into a real
  // bulge between the neck and the legs.
  // Round 6: "still doesn't look like a giraffe... I has no body" — a 2-3px bulge was
  // proportionally negligible against an 18-row-tall sprite. Widened much further (4-wide neck
  // to a 9-wide body, more than double) for a "lollipop" silhouette unmistakable at any size.
  // Round 7: "the head needs to be at the top of the neck, with little horns on top" — the
  // head was sitting at the BOTTOM of the neck column, right where it met the body, instead
  // of at the top. Reordered so the head (with small ossicone horn tips) sits at the very
  // top of the sprite, with the long neck running down from it to the body.
  // Round 8: "yes, good, now just make the lower body a bit better" — the shape/proportion
  // was right, but the body was a flat solid-colour oval. Real giraffes are famous for their
  // reticulated patch coat, so a few dark patches scattered across the body (irregular, not
  // a border or a repeating grid) are the missing piece.
  'eastafrica:masai-giraffe': {
    pal: { b: '#c89850', d: '#6a4a26', e: '#120e08' },
    frames: [
      [
        '..d.d....', '.bbb.....', 'bebd.....', '.bbd.....', '.bd......', '.bd......', '.bd......', '.bd......', '.bd......',
        '..bdbbd..', '.bbdbbdb.', '.bdbbdbb.', '..bdbdb..', '..d...d..', '..d...d..', '..d...d..', '.d.....d.', '.d.....d.',
      ],
      [
        '..d.d....', '.bbb.....', 'bebd.....', '.bbd.....', '.bd......', '.bd......', '.bd......', '.bd......', '.bd......',
        '..bdbbd..', '.bbdbbdb.', '.bdbbdbb.', '..bdbdb..', '..d...d..', '..d...d..', '.d.....d.', '..d...d..', '.d.....d.',
      ],
    ] as const,
    young: [
      ['.d.d...', 'bbb....', 'beb....', '.bbd...', '.bd....', '.bd....', '.bdbb..', 'bbdbbd.', '.d...d.', '.d...d.'],
      ['.d.d...', 'bbb....', 'beb....', '.bbd...', '.bd....', '.bd....', '.bdbb..', 'bbdbbd.', 'd...d..', '.d...d.'],
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
  // Round 5: "Wrong scale" — among the largest bat species in the world, it needs a noticeably
  // wider wingspan than it had.
  // Round 6: still "blob, wrong scale" after the size bump — a solid wedge reads as a blob no
  // matter how big it gets. Added visible wing-finger bones (near-black against a lighter
  // membrane) — a real bat's actual wing structure, and the thing a flat triangle never had.
  // Round 7: "still just a blob, try using a mix of the bird/butterfly design" — a single
  // asymmetric wedge with scattered bone-freckles never read as "two wings and a body" no
  // matter how much texture it got. Rebuilt on the eagle template's own structure (`golden-
  // eagle`/`havorn`/`kongeorn` share `EAGLE_FRAMES`) instead: a visible furry body with the
  // pale "spectacle" eye-rings this species is actually named for, and real zigzagging
  // wings — angular finger-bone segments with gaps between them, the way the eagle's own
  // wingtips sit clearly apart from its body — rather than one dark-speckled mass.
  'australia:spectacled-flying-fox': {
    pal: { d: '#1a1410', b: '#8a6c48', y: '#d8c89a', s: '#e8ddc0' },
    frames: [
      [
        '.......dd.......',
        '......dyysd.....',
        'dd....bybb....dd',
        '.ddb.bbbbb.bdd..',
        'd.bdb.bbb.bdb.d.',
        '.d..d.....d..d..',
      ],
      [
        'd...........d...',
        '.dd...bybb...dd.',
        '..ddb.bbb.bdd...',
        '...dbbbybbbd....',
        '....ddbbbdd.....',
        '......d.d.......',
      ],
    ] as const,
    young: [
      ['....dyysd....', 'd...bybb...d.', '.dd.bbbb.dd..', '.d........d..'],
      ['.dd.bybb.dd..', 'd.d.bbbb.d.d.', '..d......d...', '......d......'],
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
  // balancing stroke — same shape as the eastern grey, recoloured. Round 4: "not enough of a
  // tail" — thickened to a real triangular prop reaching the ground.
  // Round 6: "gap at the neck" — the neck row was a single pixel between two much wider rows,
  // reading as a pinch/hole. Widened to match the shoulder row.
  // Round 7: "still doesn't have the tail" — same bug as the eastern grey: `t` (tail) and
  // `d` (leg/shadow) were the same hex, camouflaging the tail into the leg mass. Recoloured
  // `t` to the body's own light tone and reshaped it to connect at the hip and reach the
  // ground clearly apart from the legs.
  'australia:red-kangaroo': {
    pal: { l: '#cf8f60', e: '#160f09', w: '#e8c49a', d: '#74402a', t: '#cf8f60' },
    frames: [
      ['..l.l.....', '..lelw....', '..lll.....', '..lll.....', '.lllll....', '.llllltt..', '.dlldttt..', 'd..ddtttt.', '...dd..tt.', '........tt'],
      ['..l.l.....', '..lelw....', '..lll.....', '..lll.....', '.lllll....', '.llllltt..', '.dlldttt..', '.d.ddtttt.', '...dd..tt.', '........tt'],
    ] as const,
    young: [
      ['.l.l.....', '.lelw....', '.lll.....', '.lll.....', 'llllltt..', '.dlldttt.', '.dd...tt.'],
      ['.l.l.....', '.lelw....', '.lll.....', '.lll.....', 'llllltt..', '.dlldttt.', '.dd...tt.'],
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
  // Round 4: "Recolor only" — darker charcoal body, brighter cream spines. Round 5: still
  // "Recolor only" — a different direction this time, sandy ochre body with dark brown spines
  // (inverting which part is the light tone).
  // Round 6: "the darker back colour is necessary" — the round-5 sandy recolor was the wrong
  // direction; reverted to a dark charcoal body, and spines now run as a dense alternating
  // light/dark checker across the whole crown instead of a few scattered dots.
  'australia:echidna': {
    pal: { b: '#3a3528', d: '#141210', l: '#e8dcb8', e: '#0a0806' },
    frames: [
      ['ldldldldl.', '.lbldlbll.', '.bdbldblde', 'bbbbbbbd..', '.dd..dd...', '.dd..dd...'],
      ['ldldldldl.', '.lbldlbll.', '.bdbldblde', 'bbbbbbbd..', '.dd..dd...', '.dd..dd...'],
    ] as const,
    young: [
      ['.ldll.', 'ldbldl', '.bdble', 'bbbb..', 'ddd...', '.dd...'],
      ['.ldll.', 'ldbldl', '.bdble', 'bbbb..', 'ddd...', '.dd...'],
    ] as const,
  },
  // Round 2: still a "blob" even after differentiating from the swan — bigger, bulkier,
  // same checkered-back idea. Round 3: "I don't even know what this is" — dropped the
  // checkered pattern entirely for the proven big-bird template (emu, rhea, takahe): short
  // neck, round body, a plain white neck ring and belly patch instead of scattered marks.
  // Round 5: "maybe give it the same treatment as the Takahē, just reskin the colour to
  // match" — the takahē's exact shape (now approved), recoloured black with a white belly
  // instead of the takahē's blue and red.
  'canada:common-loon': {
    pal: { b: '#1a1a1c', l: '#3a3a3e', e: '#0a0a0a', w: '#f0ece0', d: '#0a0a0c' },
    frames: [
      ['...l...', '..lee..', '...b...', '.bbbbb.', '.wwwww.', '..d.d..', '..d.d..'],
      ['...l...', '..lee..', '...b...', '.bbbbb.', '.wwwww.', '.d.d...', '.d.d...'],
    ] as const,
    young: [
      ['..l...', '.lee..', '..b...', 'bbbbb.', '.www..', '..d.d.'],
      ['..l...', '.lee..', '..b...', 'bbbbb.', '.www..', '.d.d..'],
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
  // Round 6: "Redraw (blob), Wrong scale" — scaled up overall, and the neck redrawn as a
  // proper S-curve (the swan's signature feature) instead of a short squiggle, with a dark
  // wing-crease line to break up the body silhouette.
  // Round 7: "close, but still too blobby, I can't tell legs or wings" — legs are
  // deliberately absent (a swimming bird's legs are underwater, round 3's own call), but the
  // dark wing-crease line was nearly invisible against the equally dark body. Replaced with a
  // real white wing-flash — black swans are known for white flight feathers visible even at
  // rest, a genuine identifying feature, not an invented one — bold enough to actually read
  // as a wing shape instead of a body-coloured notch.
  'australia:black-swan': {
    pal: { b: '#1c1a20', d: '#0e0d12', l: '#3a3742', e: '#c0392b', w: '#e8e4dc' },
    frames: [
      [
        '.......led.......',
        '......llld.......',
        '.....llld........',
        '....llld.........',
        '...dllld.........',
        '..bbbbbbbbb......',
        '.bbbbwwbbbbb.....',
        'bbbbbbwwbbbbbbb..',
        '.wwwwwwwwwwwww...',
      ],
      [
        '.......led.......',
        '......llld.......',
        '.....llld........',
        '....llld.........',
        '...dllld.........',
        '..bbbbbbbbb......',
        '.bbbbwwbbbbb.....',
        'bbbbbbwwbbbbbbb..',
        '.wwwwwwwwwwwww...',
      ],
    ] as const,
    young: [
      [
        '....led....',
        '...lld.....',
        '..lld......',
        '.dlld......',
        'bbbbbbb....',
        'bbbwwbbbb..',
        '.wwwwwww...',
      ],
      [
        '....led....',
        '...lld.....',
        '..lld......',
        '.dlld......',
        'bbbbbbb....',
        'bbbwwbbbb..',
        '.wwwwwww...',
      ],
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
  // Round 3: "looks like a monkey" — its own shape read too much like the seated-primate
  // template. Swapped onto the shape panther-chameleon already uses (kept), recoloured.
  // Round 5: still "doesn't look like a chameleon, make it lower down" even on that proven
  // shape. A real Oustalet's is among the largest chameleon species, so it's drawn bigger and
  // lower-slung here instead, with an actual curled tail of its own rather than one blended
  // into the leg dots.
  'madagascar:oustalets-chameleon': {
    pal: { b: '#6a7048', d: '#424a2a', l: '#9a9868', e: '#0a0a06', t: '#424a2a' },
    frames: [
      ['d......l....', '..bbbbllll..', '.bbbbbbbdle.', '.ddbbbbbb...', '..dd.dd..tt.', '...d..d...t.'],
      ['d......l....', '..bbbbllll..', '.bbbbbbbdle.', '.ddbbbbbb...', '..dd.dd...t.', '...d..d..tt.'],
    ] as const,
    young: [
      ['....l..', '.bblll.', 'bbbdle.', 'ddbbb.t', '.dd.d.t'],
      ['....l..', '.bblll.', 'bbbdle.', 'ddbbb..', '.dd.dtt'],
    ] as const,
  },
  // Round 8: "can you make it match the outstalet's chameleon look" — panther-chameleon had
  // no hand-authored sprite of its own (still on the generic procedural fallback), even
  // though the comment above references it as oustalet's own original starting shape.
  // Restored using oustalet's current frames verbatim, recoloured to this species' own
  // vivid green — "Brilliant variable colours, brightest in males" is its whole identity,
  // matched to its region palette (`src/regions/madagascar/index.ts`).
  'madagascar:panther-chameleon': {
    pal: { b: '#2e9050', d: '#1a5c30', l: '#6ad880', e: '#0a0a06', t: '#1a5c30' },
    frames: [
      ['d......l....', '..bbbbllll..', '.bbbbbbbdle.', '.ddbbbbbb...', '..dd.dd..tt.', '...d..d...t.'],
      ['d......l....', '..bbbbllll..', '.bbbbbbbdle.', '.ddbbbbbb...', '..dd.dd...t.', '...d..d..tt.'],
    ] as const,
    young: [
      ['....l..', '.bblll.', 'bbbdle.', 'ddbbb.t', '.dd.d.t'],
      ['....l..', '.bblll.', 'bbbdle.', 'ddbbb..', '.dd.dtt'],
    ] as const,
  },
};
