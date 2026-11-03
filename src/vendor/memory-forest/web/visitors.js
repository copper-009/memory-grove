/* Memory Forest — the milestone animals and the cabin: where they stand and how they move. */
(function () {
'use strict';
const AF = window.AnkiForest;
const { rng, hex, mix, rgb, hashStr } = AF.u;
const { YOUNG, MATURE, OLD, ANCIENT } = AF.STAGE;
const { GROUND_BOTTOM } = AF.GEOM;

const VISITORS = {
  rabbit: { pal: { b: '#b9a38a', d: '#7a6450', e: '#2a2018', l: '#f1ebe2' }, frames: [
    ['..d.d...', '..d.d...', '..b.b...', '.bbbb...', 'bebbbbb.', '.blllbbl', '..d..d..'],
    ['...d.d..', '..d.d...', '..b.b...', '.bbbb...', 'bebbbbb.', '.blllbbl', '..d..d..']] },
  deer: { pal: { b: '#9a653f', d: '#5a3a26', l: '#c9a07a', w: '#f4ede4' }, frames: [
    ['.......d.d.', '........d..', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
    ['...........', '...........', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..']] },
  stag: { pal: { b: '#8a5a38', d: '#4e3220', l: '#c9a07a', w: '#f4ede4' }, frames: [
    ['......d...d', '......dd.dd', '.......ddd.', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
    ['...........', '...........', '...........', '...........', '......d.d.d', 'wbbbbbbbdd.', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..']] },
  fox: { pal: { o: '#d9772e', w: '#f3ece2', d: '#3a2418', e: '#1a1008' }, frames: [
    ['........o.o', '........ooo', '........oeow', 'ww.oooooooo', '.wooooooo..', '..d.d..d.d.'],
    ['........o.o', '........ooo', '........oeow', '.w.oooooooo', 'w.ooooooo..', '..d.d..d.d.']] },
  // (the animals perched or sitting in the forest are painted once, into the land: one frame)
  // its eyes are orange, not yellow: yellow on a tree means forgetting
  owl: { pal: { b: '#8a7458', d: '#3e3226', y: '#e8703a', l: '#d8c8a8' }, frames: [
    ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.']] },
  heron: { pal: { g: '#9aa4ae', e: '#1a1a1a', d: '#e0a33a', w: '#e6eaee', k: '#4a4f55' }, frames: [
    ['..gg....', '.gegddd.', '..g.....', '..g.....', '.ggg....', 'gggww...', '.gggw...', '..ggg...', '...k....', '...k....', '..kk....']] },
  // sitting up at the foot of its tree with an acorn in its paws, 6 px like the fox; red-brown,
  // its tail curled behind it below the ears, so nothing reads as a yellowing crown
  squirrel: { pal: { r: '#8a3e1c', R: '#6a2c12', t: '#a04a22', T: '#70301a', l: '#e2bf94', e: '#140a04', d: '#3e1a0a', a: '#9a6a36', c: '#4e3016' }, frames: [
    ['.tt..d.d', 'tTTt.rrr', 'tTt.Rrer', '.tTRrrlc', '..tRrrla', '...d.dd.']] },
  // walking with its nose to the ground
  bear: { pal: { b: '#5a3e2c', h: '#7a5a40', d: '#3a271a', e: '#0c0604', l: '#c4a47c', n: '#120a06' }, frames: [
    ['....hhhhhhh......', '..hhbbbbbbbbh....', '.hbbbbbbbbbbbbd.d', '.bbbbbbbbbbbbbddd', '.bbbbbbbbbbbbbbeb', '.bbbbbbbbbbb.bbll', '..bbb..bbb....bln', '..ddd..ddd.......'],
    ['....hhhhhhh......', '..hhbbbbbbbbh....', '.hbbbbbbbbbbbbd.d', '.bbbbbbbbbbbbbddd', '.bbbbbbbbbbbbbbeb', '.bbbbbbbbbbb.bbll', '...bbb..bbb...bln', '...ddd..ddd......']] },
  // gliding, and with its wings raised: d dark wings, b body, h its white head and tail, y beak
  eagle: { flies: true, pal: { d: '#2a2018', b: '#4e3c2c', h: '#f4ede4', y: '#e8b030' }, frames: [
    ['......hh.....', 'dd...bbhy....', '.dddbbbbbbdd.', '...ddbbbbdd..', '......hh.....'],
    ['d..........d.', '.dd..hh...dd.', '...dbbhy.d...', '....bbbbbb...', '......hh.....']] },
  cabin: { pal: { c: '#6e6a70', r: '#7a3a2e', R: '#5a2a22', w: '#9a7250', W: '#7a5a3e', o: '#3e2a1c', n: '#2e3a4a' }, frames: [
    ['......cc....', '......cc....', '...rrrrrrr..', '..rrrrrrrrR.', '.rrrrrrrrrRR', 'RRRRRRRRRRRR', '.wWwWwWwWwW.', '.woowWwnnwW.', '.woowWwnnwW.', '.woowWwWwWw.']] }
};
AF.VISITOR_SPRITES = VISITORS;  // (the study calendar draws each on the day it came: web/calendar.js)
// Memory Garden change: three more slots than the stock roster ever needed (it never put
// more than five animals at the front at once) — a region biome can field up to five
// creatures itself, and on a young grove with nowhere yet to host any of them (no mature
// tree, no pond), all five plus the cabin could legitimately need a front spot the same
// frame. Without the extra slots here, `AF.drawVisitors`'s own `i >= slots.length` check
// would simply not draw the animals past the fifth at all — not a fallback anywhere else,
// just silently missing.
const FRONT_SLOTS = [0.9, 0.22, 0.75, 0.38, 0.6, 0.12, 0.52, 0.82];
// seconds: each animal at the front moves on every ROAM_EVERY (plus a little more per
// animal, and offset by ROAM_OFFSET each, so they never set off together), walking there at
// WALK_SPEED pixels a second (of env.u, so the same pace at any size), its legs changing with
// the ground covered: a step every STRIDE of its own length, never with a clock, so its feet
// never slide (a short way is a short walk, not a long one on the spot)
// Memory Garden change (Round 26, fix 6): "animals should be moving around more in general
// and switching between their animations more often" — at the original 150s, a front
// visitor only set off on a new walk about once every two and a half minutes, which reads
// as motionless on anything but a long, patient watch. Cut to a third, with STAGGER/OFFSET
// scaled down to match (they're already only a fraction of ROAM_EVERY, used to spread
// several animals' schedules apart, not a separate pace of their own).
const ROAM_EVERY = 50, ROAM_STAGGER = 14, ROAM_OFFSET = 12, WALK_SPEED = 7, STRIDE = 0.25;
// how far either side of its spot an animal wanders, as a share of the width
const ROAM_REACH = 0.045;
// a resting animal shows its second frame (a glance, a nibble) while a slow wave is above this
// Memory Garden change (Round 26, fix 6): was 0.93 (sin > 0.93 is a sliver of the cycle,
// easy to miss between glances); 0.8 roughly doubles how much of each cycle reads as "just
// glanced", and the cycle itself below runs faster too, so idle animals visibly shift
// state far more often without constantly twitching.
const IDLE_GLANCE = 0.8;
const IDLE_GLANCE_CYCLE = 1.1;  // was a bare 0.7 inline at each call site; now shared and faster
// Memory Garden change: how far a hosted creature sways from its exact host spot, in pixels
// — a grazing one (deer/stag, and any region creature on a ground/slope/burrow depth band)
// wanders further than one perched still in a tree or at a pond's edge, and a sleepy one
// barely at all. A still species (crocodiles) gets none, same as it skips the idle glance.
const HOST_SWAY = { graze: 5, perched: 2, sleepy: 1 };
// Round 26, fix 6: was 0.12 (a ~52s sway cycle, barely perceptible); nearly doubled.
const HOST_SWAY_CYCLE = 0.22;
// a rabbit hops rather than walks: a hop every RABBIT_HOP_LEN pixels (of env.u), RABBIT_HOP_PX high
const RABBIT_HOP_LEN = 6, RABBIT_HOP_PX = 3;
// the animals stand this far below the front row (of the height), never off the canvas
const VISITOR_DROP = 0.025, VISITOR_LOWEST = 0.995;
const CABIN_X = 0.05, CABIN_SMOKE_PUFFS = 4;
// the owl's eyes catching the light at night (warm, never yellow)
const OWL_NIGHT_EYES = '#ffa070';
// a pond this near the front (within FRONT_TALLEST pixels above the animals' feet) is in
// their way; they and the cabin keep FRONT_CLEAR pixels off its water
const FRONT_TALLEST = 11, FRONT_CLEAR = 1;
// a flying animal circles SKY_X, SKY_Y (of the width and height), SKY_RX and SKY_RY across,
// SKY_TURN radians a second, raising its wings one beat in SKY_FLAP_EVERY (SKY_FLAP_FPS a second)
const SKY_X = 0.66, SKY_Y = 0.16, SKY_RX = 0.09, SKY_RY = 0.04, SKY_TURN = 0.35, SKY_FLAP_FPS = 2.5, SKY_FLAP_EVERY = 5;
const FACES_LEFT = { rabbit: true };  // which way each sprite is drawn looking

/* Memory Garden change: `AF.scaledAt` (web/visit.js) already does exactly this transform —
 * scale about a fixed anchor point, so a sprite standing at (ax, ay) still stands there
 * afterward — but bails out below k=1 (it only ever scales a visit's sprites UP as the
 * camera nears them). A hosted creature's partial depth-scale needs k BELOW 1 too (further
 * back reads smaller, not just nearer reads bigger), so this is the same transform with
 * that guard dropped rather than a change to the shared one other systems also call. */
function scaleAnchored(g, k, ax, ay, draw) {
  if (k === 1) return draw();
  ax = Math.round(ax); ay = Math.round(ay);
  g.save(); g.translate(ax - ax * k, ay - ay * k); g.scale(k, k);
  try { return draw(); } finally { g.restore(); }
}
/* A sprite is painted pixel by pixel once, onto a canvas of its own, and copied from there:
 * painted straight onto the forest every frame, the animals were most of a frame's canvas
 * calls. Kept for each frame of a sprite (its rows), by which way it faces and the colours
 * its letters came out in (a tint, the haze, a lit window). */
const SPRITES = new WeakMap();  // rows -> { chars, w, made: Map(key -> canvas) }
const SPRITE_KEEP = 32;  // ways one frame is kept painted at once; more (a scene swapped many times) starts over
function paintSprite(g, rows, x0, y0, pal, colorOf, flip = false) {
  let s = SPRITES.get(rows);
  if (!s) SPRITES.set(rows, s = { chars: [...new Set(rows.join('').replace(/\./g, ''))], w: Math.max(...rows.map(r => r.length)), made: new Map() });
  const cols = s.chars.map(ch => colorOf(pal[ch] || '#000000', ch)), key = (flip ? 'f' : '') + cols.join('|');
  let c = s.made.get(key);
  if (!c) {
    if (s.made.size >= SPRITE_KEEP) s.made.clear();
    c = document.createElement('canvas'); c.width = s.w; c.height = rows.length;
    const sg = c.getContext('2d'), colOf = new Map(s.chars.map((ch, i) => [ch, cols[i]]));
    let style = null;
    rows.forEach((row, yy) => {
      for (let xx = 0; xx < row.length; xx++) {
        const ch = row[xx]; if (ch === '.') continue;
        const col = colOf.get(ch);
        if (col !== style) sg.fillStyle = style = col;
        sg.fillRect(flip ? row.length - 1 - xx : xx, yy, 1, 1);
      }
    });
    s.made.set(key, c);
  }
  g.drawImage(c, x0, y0);
}
/* the line the animals at the front and the cabin stand on */
const frontY = env => Math.round(env.visitorY || env.H * Math.min(VISITOR_LOWEST, (env.bot || GROUND_BOTTOM) + VISITOR_DROP));
/* A new arrangement every day, the same all day: the date mixed into the forest's seed. */
const daySeed = env => ((env.data.forestSeed || 3) ^ Math.imul((env.data.dayNumber || 0) + 1, 2654435761)) >>> 0;
function visitorColor(env, hz) {
  const th = env.theme, tint = th.tint ? hex(th.tint) : null, haze = hex(th.haze);
  // worked out once a scene for each colour and haze: the animals are drawn every frame
  const seen = env.visitorColors || (env.visitorColors = new Map());
  return col => {
    if (env.visitorTint) return env.visitorTint;
    const key = hz + '|' + col;
    let out = seen.get(key);
    if (out === undefined) {
      let c = hex(col); if (tint) c = mix(c, tint, th.tintAmt); if (hz) c = mix(c, haze, hz * th.hzStep * 4);
      seen.set(key, out = rgb(c));
    }
    return out;
  };
}

/* An environment may keep stretches of the scene clear of animals and the cabin
 * (`keepClear`: [from, to] pairs, as shares of the width), e.g. where something of its own
 * stands in front of everything. In pixels here. */
const clearSpans = env => (AF.envOf(env).keepClear || []).map(([a, b]) => [a * env.W, b * env.W]);
const inClear = (env, x0, x1) => clearSpans(env).some(([a, b]) => x1 > a && x0 < b);

// which tree (or pond) each animal living in the forest took in the whole forest's view, by
// forest: zoomed in (web/visit.js) it stays there, rather than choosing again among the trees
// in sight
const hostsOf = new WeakMap();
const hostId = it => it.pond ? 'pond' + it.group : 'tree' + it.index;

/* Which tree (or pond) each animal living in the forest takes, of `trees` in sight: the
 * same all day. */
function chooseHosts(env, list, trees, open) {
  const inForest = {};
  const keys = list.map(v => v.key);
  const R = rng(daySeed(env)), any = pool => pool[Math.floor(R() * pool.length)];
  // Memory Garden change (Round 26, fix 6): "i also cant see alot of them so their
  // distribution should be higher at the front and decrease the further they go back into
  // the scene." `any` above picks uniformly across a whole pool — in a mature forest the
  // owl, squirrel and any canopy/trunk/water region creature were about as likely to land
  // ten rows back (tiny, hazy, often behind nearer canopy) as right at the front. `near`
  // sorts by depth and skews the pick toward the front with NEAR_BIAS — still occasionally
  // further back, so the grove doesn't feel scripted, just more often somewhere you'll
  // actually see it.
  const NEAR_BIAS = 2.4;
  const near = pool => {
    if (!pool.length) return undefined;
    const sorted = pool.slice().sort((a, b) => a.it.fromFront - b.it.fromFront);
    return sorted[Math.min(sorted.length - 1, Math.floor(Math.pow(R(), NEAR_BIAS) * sorted.length))];
  };
  // the owl perches on one of the oldest trees, the heron wades at one of the ponds
  const old = trees.filter(p => p.it.stage === ANCIENT), older = old.length ? old : trees.filter(p => p.it.stage === OLD);
  if (keys.includes('owl') && older.length) inForest.owl = { host: near(older) };
  const ponds = env.placed.filter(p => p.it.pond && p.it.first && open(p));
  if (keys.includes('heron') && ponds.length) inForest.heron = { host: near(ponds) };
  // the squirrels sit at the foot of a grown tree the owl hasn't taken
  const grown = trees.filter(p => p.it.stage >= MATURE && (!inForest.owl || p !== inForest.owl.host));
  if (keys.includes('squirrel') && grown.length) inForest.squirrel = { host: near(grown) };
  const band = (lo, hi) => trees.filter(p => p.it.fromFront >= lo && p.it.fromFront <= hi);
  for (const [key, lo, hi] of [['deer', 2, 4], ['stag', 4, 6]]) {
    if (!keys.includes(key)) continue;
    // never on a tree another animal already took
    const taken = new Set(Object.values(inForest).map(s => s.host));
    const free = pool => pool.filter(p => !taken.has(p));
    const pool = free(band(lo, hi)).length ? free(band(lo, hi)) : free(band(0, 2));
    if (pool.length) inForest[key] = { host: any(pool), graze: true };
  }
  // Memory Garden change: generic hosting for region creatures beyond the stock roster
  // above, read from each visitor's own `zone` (src/regions/types.ts) instead of another
  // hardcoded key list — purely additive, never claims a tree or pond the stock logic
  // already took. `canopy`/`trunk` species perch in a tree the same way the owl and
  // squirrel do; `water`/`waterEdge` species wade at a pond the same way the heron does;
  // `ground`/`slope`/`burrow` species graze at their own depth band through the grove the
  // same way deer/stag do, spread by `v.slot` (0-4) rather than two fixed bands, so a
  // biome's five creatures scatter through the whole scene instead of every one of them
  // sharing the single front-roaming lane. Each only falls back to `AF.placeVisitors`'s own
  // front-of-scene default (true walking roam, not a fixed grazing spot) when it genuinely
  // has nowhere to be hosted this frame — a young grove with no pond yet, say.
  // How far back the grove actually goes this scene — `[2,4]`/`[4,6]`, the two fixed bands
  // the stock deer/stag above use, were sized for a forest a few rows deep; a real grove
  // commonly runs ten or more rows back (`p.it.fromFront`, not capped at a small number),
  // so five fixed bands in that same narrow 0-8 range left most of the depth of the scene
  // empty and several slots landing in the same place. Spread proportionally across
  // whatever depth this grove actually has instead.
  const maxFront = trees.reduce((m, p) => Math.max(m, p.it.fromFront || 0), 2);
  // Memory Garden change (Round 26, fix 6): spreading those five bands across the grove's
  // *entire* depth put the later slots (unlocked well into a biome's progress, not lesser
  // creatures) ten-plus rows back in a mature forest — small, hazy, often the one thing on
  // screen nobody noticed. FRONT_BAND_CAP keeps every ground/slope/burrow band within a
  // comfortably visible stretch of the front regardless of how deep the whole grove runs.
  const FRONT_BAND_CAP = 9;
  const bandMax = Math.min(maxFront, FRONT_BAND_CAP);
  for (const v of list) {
    if (v.key in inForest) continue;
    const taken = new Set(Object.values(inForest).map(s => s.host));
    if (v.zone === 'canopy' || v.zone === 'trunk') {
      // YOUNG, not MATURE like the owl/squirrel above: those two are long-time milestone
      // rewards, earned well after a grove has mature trees to offer; a region creature can
      // arrive after as little as a week (`SLOT_REQUIREMENTS[0]`, src/data/milestones.ts),
      // when a grove may have no MATURE tree at all yet. Demanding one would leave a tree-
      // dwelling species grounded — visibly wrong for a species that doesn't walk — for as
      // long as it took the grove to grow one, not because it had nowhere to perch.
      const pool = trees.filter(p => p.it.stage >= YOUNG && !taken.has(p));
      if (pool.length) inForest[v.key] = { host: near(pool) };
    } else if (v.zone === 'water' || v.zone === 'waterEdge') {
      const wet = ponds.filter(p => !taken.has(p));
      if (wet.length) inForest[v.key] = { host: near(wet) };
    } else if (v.zone === 'ground' || v.zone === 'slope' || v.zone === 'burrow') {
      const slot = v.slot || 0, bandW = Math.max(1.5, bandMax / 5), lo = slot * bandW, hi = lo + bandW * 1.4;
      const free = pool => pool.filter(p => !taken.has(p));
      const pool = free(band(lo, hi)).length ? free(band(lo, hi)) : free(band(0, bandMax));
      if (pool.length) inForest[v.key] = { host: any(pool), graze: true };
    }
  }
  return inForest;
}

/* animals that live inside the forest are drawn into the land at the right depth */
AF.placeVisitors = function (env) {
  const list = env.data.visitors || [];
  // no animal's tree (nor pond) stands in a stretch the environment keeps clear
  const open = p => !inClear(env, p.x - 6, p.x + 10);
  const trees = env.placed.filter(p => !p.it.pond && open(p));
  let inForest = {};
  const front = [], chosen = hostsOf.get(env.data);
  if (env.layout.cam && chosen) {
    // zoomed in: each on the tree it took, if that is in sight (and gone with it otherwise)
    for (const [key, spot] of Object.entries(chosen)) {
      const host = env.placed.find(p => (p.it.pond ? p.it.first : true) && hostId(p.it) === spot.id);
      inForest[key] = host ? { host, graze: spot.graze } : null;
    }
  }
  else inForest = chooseHosts(env, list, trees, open);
  if (!env.layout.cam) hostsOf.set(env.data, Object.fromEntries(Object.entries(inForest).map(([k, s]) => [k, { id: hostId(s.host.it), graze: s.graze }])));
  // the rest stand at the front, but the cabin (which has its own corner) and those that fly
  for (const v of list) if (!(v.key in inForest) && v.key !== 'cabin' && !(VISITORS[v.key] || {}).flies) front.push(v);
  for (const k of Object.keys(inForest)) if (!inForest[k]) delete inForest[k];
  env.inForest = inForest; env.frontVisitors = front; env.flyers = list.filter(v => (VISITORS[v.key] || {}).flies);
  // Memory Garden change: this used to be `env.afterItem`, a callback the engine's own
  // per-tree build step ran once while painting the land layer (`engines/pixel/engine.js`,
  // `steps()`) — so a hosted creature's pixels were baked into that static, cached image
  // alongside its tree. `build()` runs once per scene (on mount, resize, or a refine pass),
  // not every frame, while the idle-glance and (new) sway below both read `env.t`, which is
  // only ever live inside `frame()`'s own per-frame loop — at build time `env.t` is still
  // whatever it last was (effectively frozen), so neither ever actually played out live;
  // they'd only differ between one scene build and the next. `env.hostedByHost` is now read
  // by `AF.drawHosted` below instead, called every frame from `core.js` the same way
  // `AF.drawFlyers`/`AF.drawVisitors` already are, so both genuinely animate. A hosted
  // creature now draws on top of the fully composited land each frame rather than baked
  // tree-by-tree into it — depth-correct against its OWN tree, but, on its own, no longer
  // occluded by a nearer tree's canopy happening to overlap its spot (a cassowary reading as
  // standing in front of a tree it should have been partly behind, caught live). `AF.drawHosted`
  // below restores that: after painting a creature, it restamps `env.land`'s own already-
  // correct pixels wherever a genuinely nearer tree's bounds overlap it.
  const byHost = new Map();
  for (const [key, spot] of Object.entries(inForest)) byHost.set(spot.host, (byHost.get(spot.host) || []).concat([key]));
  env.hostedByHost = byHost; env.hostedList = list;
};

/* hosted creatures (perched in a tree, at a pond's edge, grazing a depth band) — called every
 * frame like the flyers and front-roamers, so their idle glance and sway genuinely play out
 * live instead of being fixed at whatever `env.t` was when the scene was last built. */
AF.drawHosted = function (g, env, t) {
  const byHost = env.hostedByHost, inForest = env.inForest; if (!byHost || !inForest) return;
  env.staticBoxes = [];
  for (const [p, keysHere] of byHost) {
    for (const key of keysHere) {
      const spr = VISITORS[key], v = (env.hostedList || []).find(x => x.key === key), base = inForest[key].graze ? 1 : 0;
      // Memory Garden change: a hosted creature (owl/heron/squirrel/deer/stag, and now any
      // region creature host above) used to show one fixed frame all day — entirely frozen,
      // not even the idle "glance" front-roaming visitors already get. Still species
      // (crocodiles) stay motionless on purpose; everything else now flicks briefly to its
      // other frame now and then, the same sine-wave idle check front visitors use, offset
      // per creature (`hashStr(key)`) so a scene with several hosted animals doesn't have
      // them all glance in lockstep.
      const glancing = !env.still && !(v && v.still) && spr.frames.length > 1
        && Math.sin(t * AF.u.cyc(IDLE_GLANCE_CYCLE) + (hashStr(key) % 1000) / 1000 * AF.u.TAU) > IDLE_GLANCE;
      const frame = spr.frames[glancing ? (spr.frames.length - 1 - base) : base];
      let x0, y0;
      if (key === 'owl') { const h = AF.STAGE_H[p.it.stage] * env.u * p.s; x0 = Math.round(p.x - 2); y0 = Math.round(p.y - h - frame.length + 3); }
      else if (key === 'squirrel') { x0 = Math.round(p.x) + (AF.trunkRight ? AF.trunkRight(p, env) : 1); y0 = Math.round(p.y - frame.length + 1); }  // on the roots, just right of the trunk
      else if (key === 'heron') { const b = AF.pondBox(env, p); x0 = Math.round(b.cx + b.w * 0.2); y0 = Math.round(b.cy - frame.length + 1); }
      else { x0 = Math.round(p.x + 4); y0 = Math.round(p.y - frame.length + 1); }
      // Memory Garden change: a hosted creature used to stand at the exact same pixel all
      // day once placed — animated in place (the glance above) but never actually moving,
      // unlike a front-roaming visitor which genuinely walks its stretch. A slow sideways
      // sway off its host spot — never so far it leaves the tree/pond it's anchored to —
      // gives it the same "still alive, not a statue" reading at rest, sized by how it
      // actually behaves: grazing wider than perched, a sleepy species barely at all, a
      // still one not at all.
      const stillHere = env.still || (v && v.still);
      const swayAmp = stillHere ? 0 : (v && v.sleepy) ? HOST_SWAY.sleepy : inForest[key].graze ? HOST_SWAY.graze : HOST_SWAY.perched;
      if (swayAmp) x0 += Math.round(Math.sin(t * AF.u.cyc(HOST_SWAY_CYCLE) + (hashStr(key) % 1000) / 1000 * AF.u.TAU) * swayAmp);
      // up close (a visit) it is as much bigger as its tree, standing where its feet are.
      // Memory Garden change: outside a visit, a hosted creature used to render at the same
      // native pixel size no matter how far back its tree stood, while the tree itself
      // genuinely shrinks with depth (`p.s`) — a frog hosted ten rows back read the same
      // size as one at the very front, or as the tree right next to it. Partial, not full:
      // only 60% of the tree's own scale reduction carries over, so a distant creature
      // stays readable rather than shrinking to match exactly.
      const visitK = AF.visitK(p), depthK = visitK > 1 ? visitK : 1 - (1 - p.s) * 0.6, fy = y0 + frame.length;
      scaleAnchored(g, depthK, x0, fy, () => {
        paintSprite(g, frame, x0, y0, spr.pal, visitorColor(env, p.hz));
        if (key === 'owl' && env.mood.time === 'night') { g.fillStyle = OWL_NIGHT_EYES; g.fillRect(x0 + 1, y0 + 2, 1, 1); g.fillRect(x0 + 3, y0 + 2, 1, 1); }
      });
      const cx0 = x0, cy0 = fy - frame.length * depthK, cx1 = x0 + frame[0].length * depthK, cy1 = fy;
      // Memory Garden change: the comment above (where `env.hostedByHost` is set) used to end
      // here — a hosted creature drawn live on top of the fully composited land, "no longer
      // occluded by a nearer tree's canopy happening to overlap its spot... rare enough [to
      // accept]". Caught live (a cassowary reading as standing in front of a tree it should
      // have been partly behind): redraw any OTHER tree genuinely nearer the camera than this
      // creature's host (`fromFront`, smaller is nearer) whose own bounds overlap it, clipped
      // to just that overlap. Each tree's actual rendered sprite (`p.sprite`, kept by
      // `engines/pixel/engine.js`), not its bounding box — a crown's box is mostly empty
      // space around the round/pine silhouette, and redrawing the box instead first blanked
      // the creature out with flat ground colour everywhere, not just under real canopy
      // (caught the same way: checked directly, zero of its own palette's pixels survived).
      // Its own host tree is deliberately excluded: standing at the foot of its own tree is
      // correct as is, not something to cover back up. OCCLUDE_ROWS caps how many rows
      // nearer count at all — without it, EVERY row between a creature hosted deep in a
      // mature forest and the camera piles on (checked directly: 22 trees across 6 rows all
      // nominally overlapping one small sprite, between them covering every last pixel of
      // it — not a visible creature anymore, just gone). A tree a row or two in front
      // genuinely reads as standing in front of it; a tree ten rows closer to camera
      // overlapping its tiny box is really just that tree's own much bigger bounding box
      // sweeping across a big share of the scene, not a meaningful "in front of" relationship.
      const OCCLUDE_ROWS = 2;
      // However it happens, a creature the grove unlocked has to stay a creature you can
      // actually find, not vanish behind whatever happens to stand nearer it. A single
      // nearby tree's bounding box can already fully contain this creature's whole (much
      // smaller) one, so capping how many trees contribute doesn't help by itself — caught
      // live, one qualifying tree alone blanked it out completely. KEEP_CLEAR_FRAC instead
      // puts a hard floor under the clip rect itself: the creature's own bottom share, where
      // its feet (and so its own ground anchor) are, never gets redrawn over, no matter how
      // many trees qualify or how big their boxes are.
      const KEEP_CLEAR_FRAC = 0.35;
      const clearFromY = cy1 - (cy1 - cy0) * KEEP_CLEAR_FRAC;
      for (const q of env.placed) {
        if (q === p || q.it.pond || !q.box || !q.sprite) continue;
        if (q.it.fromFront >= p.it.fromFront || q.it.fromFront < p.it.fromFront - OCCLUDE_ROWS) continue;
        const ix0 = Math.max(q.box.x0, cx0), iy0 = Math.max(q.box.y0, cy0);
        const ix1 = Math.min(q.box.x1, cx1), iy1 = Math.min(q.box.y1, cy1, clearFromY);
        if (ix1 <= ix0 || iy1 <= iy0) continue;
        const sw = q.box.x1 - q.box.x0, sh = q.box.y1 - q.box.y0;
        g.save();
        g.beginPath(); g.rect(ix0, iy0, ix1 - ix0, iy1 - iy0); g.clip();
        if (q.spriteFlip) { g.translate(q.box.x0 + sw, q.box.y0); g.scale(-1, 1); g.drawImage(q.sprite, 0, 0, sw, sh); }
        else g.drawImage(q.sprite, q.box.x0, q.box.y0, sw, sh);
        g.restore();
      }
      env.staticBoxes.push({ v, x0: cx0, y0: cy0, x1: cx1, y1: cy1 });
    }
  }
};

// Memory Garden change: every other drawing path in this file scales its sprite to the
// scene somehow — a hosted creature by `depthK` (partial tree-depth scale, the comment at
// `scaleAnchored`'s own definition), a front visitor/the cabin by `AF.visitK`, a tree by its
// own row's computed cell width. A flyer had none of that: `paintSprite` below painted it at
// literal 1 sprite-pixel = 1 screen-pixel, a fixed size in actual screen pixels no matter how
// many trees/creatures the rest of the scene had compressed to fit. In a young, sparse forest
// that native size looks fine; in a mature one (hundreds of trees, everything else drawn
// small to fit) an unscaled flyer reads as comically oversized next to it — exactly the
// "butterfly clearly way too big" bug. FLYER_SCALE shrinks it to a fixed, forest-size-
// independent fraction of native size instead, via the same `scaleAnchored` helper the
// hosted-creature fix above already uses, anchored at the flyer's own circling position.
const FLYER_SCALE = 0.7;

/* the eagle circles high over the forest, behind the trees */
AF.drawFlyers = function (g, env, t) {
  const { W, H } = env, color = visitorColor(env, 0);
  env.skyBoxes = [];
  (env.flyers || []).forEach(v => {
    const spr = VISITORS[v.key], a = env.still ? 1 : t * AF.u.cyc(SKY_TURN);
    const cx = Math.round(W * SKY_X + Math.cos(a) * W * SKY_RX), cy = Math.round(H * SKY_Y + Math.sin(a) * H * SKY_RY);
    const frame = spr.frames[!env.still && Math.floor(t * SKY_FLAP_FPS) % SKY_FLAP_EVERY === 0 ? 1 : 0];
    const x0 = cx - Math.floor(frame[0].length / 2), y0 = cy - Math.floor(frame.length / 2);
    scaleAnchored(g, FLYER_SCALE, cx, cy, () => {
      paintSprite(g, frame, x0, y0, spr.pal, color, Math.sin(a) > 0);  // it faces the way it circles
    });
    const hw = frame[0].length * FLYER_SCALE / 2, hh = frame.length * FLYER_SCALE / 2;
    env.skyBoxes.push({ v, x0: Math.round(cx - hw) - 1, y0: Math.round(cy - hh) - 1, x1: Math.round(cx + hw) + 1, y1: Math.round(cy + hh) + 1 });
  });
};

/* The ponds that reach the front, and where the cabin stands: in its corner, or the other
 * one if a pond is there. Worked out on the first frame, once the land (an island's edge)
 * has said where the front is. */
function frontWay(env, baseY) {
  if (env.frontWay) return env.frontWay;
  const cw = VISITORS.cabin.frames[0][0].length, ch = VISITORS.cabin.frames[0].length;
  const ponds = env.placed.filter(p => p.it.pond && p.it.first).map(p => AF.pondBox(env, p)).filter(b => b.y1 > baseY - FRONT_TALLEST);
  const pondAt = x0 => ponds.some(b => x0 + cw + FRONT_CLEAR > b.x0 && x0 - FRONT_CLEAR < b.x1 && baseY > b.y0 && baseY - ch < b.y1);
  const takenAt = x0 => pondAt(x0) || inClear(env, x0, x0 + cw);
  const left = Math.round(env.W * CABIN_X), right = env.W - left - cw;
  return (env.frontWay = { ponds, cabinX: takenAt(left) && !takenAt(right) ? right : left });
}

/* the rest stand at the edge of the forest; the cabin sits front-left after a year (or front-right) */
AF.drawVisitors = function (g, env, t) {
  const list = env.frontVisitors || [], color = visitorColor(env, 0);
  env.visitorBoxes = (env.staticBoxes || []).concat(env.skyBoxes || []);
  const baseY = frontY(env), way = frontWay(env, baseY);
  const cabin = (env.data.visitors || []).find(v => v.key === 'cabin');
  if (cabin) {
    const spr = VISITORS.cabin, frame = spr.frames[0], fw = frame[0].length, lit = env.mood.time === 'night' || env.mood.time === 'dusk';
    // up close (a visit) it stands where the camera sees its spot, as much bigger as things there
    const at = AF.visitProject(env, way.cabinX + fw / 2, baseY);
    if (at) {
      const k = AF.visitK(null, at.k), x0 = Math.round(at.x - fw / 2), fy = Math.round(at.y), y0 = fy - frame.length;
      AF.scaledAt(g, k, at.x, fy, () => {
        paintSprite(g, frame, x0, y0, spr.pal, (col, ch) => ch === 'n' && lit ? '#ffd27a' : color(col));
        if (lit) { g.fillStyle = 'rgba(255,210,122,.18)'; g.fillRect(x0 + 6, y0 + 6, 4, 4); }
        else if (!env.theme.rain) for (let s = 0; s < CABIN_SMOKE_PUFFS; s++) { const q = ((AF.LOOP ? t / AF.u.per(4) : t * 0.25) + s / CABIN_SMOKE_PUFFS) % 1, sx = x0 + 6 + Math.round(Math.sin(q * 6 + s) * 1.5 + q * 4), sy = y0 - Math.round(q * 12); g.fillStyle = `rgba(220,220,225,${0.55 * (1 - q)})`; g.fillRect(sx, sy, q > 0.5 ? 2 : 1, 1); }
      });
      env.visitorBoxes.push({ v: cabin, x0: Math.round(at.x - fw * k / 2), y0: fy - frame.length * k, x1: Math.round(at.x + fw * k / 2), y1: fy });
    }
  }
  // Each animal has its own stretch of the front, shuffled daily. Every few minutes it
  // wanders to a new spot in that stretch, then stays there a while.
  const slots = FRONT_SLOTS.slice(), SR = rng(daySeed(env) ^ 0x51ed);
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(SR() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  list.forEach((v, i) => {
    const spr = VISITORS[v.key]; if (!spr || i >= slots.length) return;
    // Memory Garden change: a still species (crocodiles — barely moves at all) or a sleepy
    // one (koalas, sloths — moves, just not far or often) roams a smaller stretch than a
    // fully active animal, instead of every front visitor wandering the same distance.
    const roamScale = v.still ? 0.08 : v.sleepy ? 0.35 : 1;
    const W = env.W, roam = W * ROAM_REACH * roamScale, period = ROAM_EVERY + i * ROAM_STAGGER, k = Math.floor((t + i * ROAM_OFFSET) / period), ph = (t + i * ROAM_OFFSET) - k * period;
    // a landscape with water across the front keeps each animal to its own bank
    const home = W * slots[i], land = AF.landOf(env);
    // ...and off any pond at the front, and the cabin: stepped aside to its nearer edge
    const half = spr.frames[0][0].length / 2 + FRONT_CLEAR, lo = half, hi = W - half, cabinW = VISITORS.cabin.frames[0][0].length;
    const blocks = way.ponds.map(b => [b.x0 - half, b.x1 + half]);
    if (cabin) blocks.push([way.cabinX - half, way.cabinX + cabinW + half]);
    for (const [a, b] of clearSpans(env)) blocks.push([a - half, b + half]);
    const blocked = x => blocks.some(([a, b]) => x > a && x < b) || (land.wet && land.wet(env, x - half, x + half, baseY));
    const aside = x => {
      const hit = blocks.find(([a, b]) => x > a && x < b); if (!hit) return x;
      const ok = [hit[0], hit[1]].filter(c => c >= lo && c <= hi && !blocked(c)).sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
      return ok.length ? ok[0] : x;
    };
    const spot = n => { const s = home + (rng((daySeed(env) + n * 7919 + i * 104729) >>> 0)() - 0.5) * 2 * roam; return aside(land.dryX ? land.dryX(env, s, baseY, home, roam) : s); };
    // (two spots the same, or all but, and it stays put rather than walking on the spot)
    const from = spot(k - 1), to = spot(k), dist = Math.abs(to - from), walk = dist / (WALK_SPEED * env.u);
    const moving = !env.still && !AF.LOOP && ph < walk && dist >= 1, q = moving ? ph / walk : 1;
    const x = from + (to - from) * q, gone = dist * q, dir = to >= from ? 1 : -1;
    const stride = Math.max(1, spr.frames[0][0].length * STRIDE);
    let frame = spr.frames[moving ? Math.floor(gone / stride) % spr.frames.length : (Math.sin(t * AF.u.cyc(IDLE_GLANCE_CYCLE) + i * 2.1) > IDLE_GLANCE ? spr.frames.length - 1 : 0)], dy = 0;
    // a rabbit hops rather than walks: each hop a fixed length of ground, the last one shorter
    if (v.key === 'rabbit') { frame = spr.frames[0]; if (moving) dy = -Math.round(Math.abs(Math.sin(gone / (RABBIT_HOP_LEN * env.u) * Math.PI)) * RABBIT_HOP_PX); }
    const flip = FACES_LEFT[v.key] ? dir > 0 : dir < 0;  // face the way it last went
    // up close (a visit) it stands where the camera sees its spot, as much bigger as things there
    const at = AF.visitProject(env, x, baseY);
    if (!at) return;  // walked past
    const big = AF.visitK(null, at.k), fy = Math.round(at.y), x0 = Math.round(at.x - frame[0].length / 2), y0 = fy - frame.length + dy;
    AF.scaledAt(g, big, at.x, fy, () => {
      paintSprite(g, frame, x0, y0, spr.pal, color, flip);
      // an environment may dress the animal up (it gets the frame as drawn, and which way it faces)
      const dress = AF.envOf(env).dressVisitor;
      if (dress) dress(g, env, { key: v.key, rows: frame, x0, y0, flip, facesLeft: !!FACES_LEFT[v.key] !== flip, color });
    });
    const drawnHalf = Math.round(frame[0].length * big / 2);
    env.visitorBoxes.push({ v, x0: Math.round(at.x) - drawnHalf, y0: fy - frame.length * big, x1: Math.round(at.x) + drawnHalf, y1: fy });
  });
};

// Memory Garden change: `effects/ambience.js`'s background flock wants to paint a real
// species' sprite (Round 26 — see `mfAdapter.ts`'s `birdSpriteForBiome`) instead of its own
// abstract mark, but `paintSprite`/`scaleAnchored` above are private to this file's own
// closure, the same way every vendored file is its own IIFE. Exposed rather than
// reimplemented a second time in ambience.js.
AF.paintSprite = paintSprite;
AF.scaleAnchored = scaleAnchored;
})();
