/**
 * Builds `review/gallery.html`: every creature's sprite (hand-authored or baked) at 1x and
 * 4x, idle/busy frames animated, next to Memory Forest's own fox/deer/owl (transcribed
 * directly from `reference/memory-forest/web/visitors.js`, MIT licensed, credited on the
 * page) for scale, on the golden-lake ground as a backdrop. Each sprite gets a Keep/Redo/
 * Drop toggle, saved live to this artifact's own `db` capability (one document per
 * creature under `decisions/`) — not `localStorage` plus a download button, which this
 * page used at first: published as a Claude Artifact, the artifact viewer never grants a
 * page download permission, so that button did nothing there, and `localStorage` isn't
 * readable from outside the page at all. `db` fixes both: Claude reads the decisions back
 * directly (`ArtifactData`, collection `decisions`), and they survive reloads and
 * revisits the same way `localStorage` did, just actually reachable.
 *
 * Run: npx esbuild scripts/buildGallery.ts --bundle --platform=node --format=esm
 *        --outfile=/tmp/gallery.mjs && node /tmp/gallery.mjs
 */
import { REGIONS } from '../src/regions';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const groundB64 = readFileSync(join(ROOT, 'art/golden-lake/memory-grove-layers/background/07_ground.png')).toString('base64');
const previewB64 = readFileSync(join(ROOT, 'art/golden-lake/memory-grove-layers/preview_reassembled_3x.png')).toString('base64');

// Memory Forest's own VISITORS entries, transcribed verbatim from
// reference/memory-forest/web/visitors.js (MIT licensed) — for scale comparison only, not
// part of Memory Grove's roster.
const REFERENCE = {
  fox: {
    pal: { o: '#d9772e', w: '#f3ece2', d: '#3a2418', e: '#1a1008' },
    frames: [
      ['........o.o', '........ooo', '........oeow', 'ww.oooooooo', '.wooooooo..', '..d.d..d.d.'],
      ['........o.o', '........ooo', '........oeow', '.w.oooooooo', 'w.ooooooo..', '..d.d..d.d.'],
    ],
  },
  deer: {
    pal: { b: '#9a653f', d: '#5a3a26', l: '#c9a07a', w: '#f4ede4' },
    frames: [
      ['.......d.d.', '........d..', '.......bbb.', '.......bbbl', 'lbbbbbbbb..', '.bbbbbbbb..', '.d.d..d.d..', '.d.d..d.d..'],
      ['...........', '...........', '...........', '.......d.d.', 'wbbbbbbbd..', '.bbbbbbbbb.', '.d.d..d.bbl', '.d.d..d.d..'],
    ],
  },
  owl: {
    pal: { b: '#8a7458', d: '#3e3226', y: '#e8703a', l: '#d8c8a8' },
    frames: [
      ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.'],
      ['d...d', 'bbbbb', 'bybyb', 'bbdbb', 'blllb', 'blllb', '.b.b.'],
    ],
  },
};

interface Entry {
  id: string;
  region: string;
  biome: string;
  common: string;
  key: string;
  source: 'hand' | 'baked';
  pal: Record<string, string>;
  frames: readonly [readonly string[], readonly string[]];
  young?: readonly [readonly string[], readonly string[]];
}

const HAND_KEYS = new Set([
  'australia:kookaburra', 'australia:cockatoo', 'australia:eastern-grey-kangaroo',
  'australia:lace-monitor', 'australia:koala', 'australia:southern-cassowary', 'australia:platypus',
]);

const entries: Entry[] = [];
for (const region of REGIONS) {
  for (const biome of region.biomes) {
    for (const creature of biome.creatures) {
      if (!creature.sprite) continue;
      const id = `${region.key}:${creature.key}`;
      entries.push({
        id,
        region: region.label,
        biome: biome.label,
        common: creature.common,
        key: creature.key,
        source: HAND_KEYS.has(id) ? 'hand' : 'baked',
        pal: creature.sprite.pal,
        frames: creature.sprite.frames,
        young: creature.sprite.young,
      });
    }
  }
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Memory Grove — creature sprite gallery</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #1b1f16; color: #eee; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .credit { color: #9a9; font-size: 13px; margin-bottom: 18px; }
  .credit a { color: #adc; }
  .preview { max-width: 100%; image-rendering: pixelated; border: 1px solid #444; margin-bottom: 18px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
  button { background: #3a4a2e; color: #eee; border: 1px solid #5a6a4a; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
  button:hover { background: #4a5c3a; }
  .count { font-size: 13px; color: #aaa; }
  .dbStatus { font-size: 12px; color: #9a9; }
  .dbStatus.err { color: #e99; }
  .section-title { font-size: 15px; margin: 28px 0 10px; color: #dde; border-bottom: 1px solid #333; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
  .card { background: #20251a; border: 1px solid #343a28; border-radius: 6px; padding: 10px; }
  .card.ref { background: #1a2024; border-color: #38434a; }
  .swatch { background-image: url(data:image/png;base64,${groundB64}); background-size: 128px 63px; background-repeat: repeat; border-radius: 4px; display: flex; align-items: flex-end; justify-content: space-around; padding: 6px 4px; min-height: 70px; }
  canvas { image-rendering: pixelated; display: block; }
  .meta { margin-top: 8px; font-size: 12px; line-height: 1.5; }
  .meta .name { font-weight: 600; font-size: 13px; }
  .meta .sub { color: #999; }
  .badge { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; vertical-align: middle; }
  .badge.hand { background: #2d5a2d; color: #bfe; }
  .badge.baked { background: #5a4a2d; color: #fec; }
  .toggle { margin-top: 8px; display: flex; gap: 4px; }
  .toggle label { flex: 1; text-align: center; font-size: 11px; padding: 4px 0; border-radius: 4px; cursor: pointer; border: 1px solid #444; }
  .toggle input { display: none; }
  .toggle label.keep { color: #9e9; }
  .toggle label.redo { color: #ec9; }
  .toggle label.drop { color: #e99; }
  .toggle input:checked + label.keep { background: #2d5a2d; }
  .toggle input:checked + label.redo { background: #5a4a2d; }
  .toggle input:checked + label.drop { background: #5a2d2d; }
</style>
</head>
<body>
<h1>Memory Grove — creature sprite gallery</h1>
<div class="credit">Fox, deer and owl reference sprites are Memory Forest's own (© Barak Levy, MIT licence) — shown for scale only, not part of Memory Grove's roster. Background: the golden-lake reference scenery. <a href="../DECISIONS.md">DECISIONS.md</a> has the full account of this rewrite.</div>
<img class="preview" src="data:image/png;base64,${previewB64}" alt="Golden Lake reference scene">
<div class="toolbar">
  <button id="animBtn">Pause animation</button>
  <span class="count" id="count"></span>
  <span class="dbStatus" id="dbStatus">Connecting…</span>
</div>

<div class="section-title">Memory Forest reference (for scale — not reviewed)</div>
<div class="grid" id="refGrid"></div>

<div class="section-title">Memory Grove roster (${entries.length} creatures)</div>
<div class="grid" id="mainGrid"></div>

<script>
const ENTRIES = ${JSON.stringify(entries)};
const REFERENCE = ${JSON.stringify(REFERENCE)};

// entry.id -> current value ('keep'/'redo'/'drop'), filled in once the db loads.
const decisions = {};
// entry.id -> { keep: <input>, redo: <input>, drop: <input> }, so a db load after cards
// are already on the page can still check the right radio.
const radioInputs = {};

let db = null;
const dbStatus = document.getElementById('dbStatus');
(async () => {
  try {
    db = await claude.use('db');
  } catch {
    db = null;
  }
  if (!db) {
    dbStatus.textContent = "Decisions aren't saving — open this page on claude.ai, signed in.";
    dbStatus.classList.add('err');
    return;
  }
  try {
    const snap = await db.collection('decisions').get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (!data || !data.value) continue;
      decisions[doc.id] = data.value;
      const inputs = radioInputs[doc.id];
      if (inputs && inputs[data.value]) inputs[data.value].checked = true;
    }
    dbStatus.textContent = 'Decisions saved live';
    updateCount();
  } catch {
    dbStatus.textContent = 'Could not load saved decisions.';
    dbStatus.classList.add('err');
  }
})();

function setDecision(entry, val) {
  decisions[entry.id] = val;
  updateCount();
  if (!db) return;
  db.collection('decisions').doc(entry.id).set({
    value: val, common: entry.common, region: entry.region, biome: entry.biome, source: entry.source,
  }).catch(() => {
    dbStatus.textContent = 'A decision failed to save — reload and check your connection.';
    dbStatus.classList.add('err');
  });
}

function paintFrame(ctx, rows, pal, scale, flip) {
  const w = Math.max(...rows.map(r => r.length));
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      const px = flip ? w - 1 - x : x;
      ctx.fillRect(px * scale, y * scale, scale, scale);
    }
  }
}

function makeCanvas(frames, pal, scale) {
  const w = Math.max(...frames[0].map(r => r.length), ...frames[1].map(r => r.length));
  const h = Math.max(frames[0].length, frames[1].length);
  const cv = document.createElement('canvas');
  cv.width = w * scale; cv.height = h * scale;
  cv.style.width = (w * scale) + 'px';
  cv.style.height = (h * scale) + 'px';
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let frame = 0;
  function draw() { ctx.clearRect(0, 0, cv.width, cv.height); paintFrame(ctx, frames[frame], pal, scale, false); }
  draw();
  cv._tick = () => { frame = 1 - frame; draw(); };
  return cv;
}

let animating = true;
const tickers = [];
function animLoop() {
  if (animating) for (const t of tickers) t();
  setTimeout(animLoop, 500);
}
animLoop();

function card(entry, isRef) {
  const div = document.createElement('div');
  div.className = 'card' + (isRef ? ' ref' : '');
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  const c1 = makeCanvas(entry.frames, entry.pal, 1);
  const c4 = makeCanvas(entry.frames, entry.pal, 4);
  tickers.push(c1._tick, c4._tick);
  swatch.appendChild(c1);
  swatch.appendChild(c4);
  div.appendChild(swatch);
  const meta = document.createElement('div');
  meta.className = 'meta';
  const badge = isRef ? '' : '<span class="badge ' + entry.source + '">' + entry.source + '</span>';
  meta.innerHTML = '<div class="name">' + entry.common + badge + '</div>' +
    '<div class="sub">' + (isRef ? 'Memory Forest reference' : entry.region + ' — ' + entry.biome) + '</div>' +
    '<div class="sub">' + (Math.max(...entry.frames[0].map(r=>r.length))) + '×' + entry.frames[0].length + ' px, ' + Object.keys(entry.pal).length + ' colours</div>';
  div.appendChild(meta);
  if (!isRef) {
    const toggle = document.createElement('div');
    toggle.className = 'toggle';
    const current = decisions[entry.id] || '';
    const inputs = radioInputs[entry.id] = {};
    for (const [val, label, cls] of [['keep', 'Keep', 'keep'], ['redo', 'Redo', 'redo'], ['drop', 'Drop', 'drop']]) {
      const id = 'd_' + entry.id.replace(/[^a-z0-9]/gi, '_') + '_' + val;
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'd_' + entry.id; input.id = id; input.value = val;
      if (current === val) input.checked = true;
      input.addEventListener('change', () => setDecision(entry, val));
      inputs[val] = input;
      const lab = document.createElement('label');
      lab.className = cls; lab.htmlFor = id; lab.textContent = label;
      toggle.appendChild(input); toggle.appendChild(lab);
    }
    div.appendChild(toggle);
  }
  return div;
}

const refGrid = document.getElementById('refGrid');
for (const [key, data] of Object.entries(REFERENCE)) refGrid.appendChild(card({ id: key, common: key, frames: data.frames, pal: data.pal }, true));

const mainGrid = document.getElementById('mainGrid');
for (const entry of ENTRIES) mainGrid.appendChild(card(entry, false));

function updateCount() {
  const vals = Object.values(decisions);
  const n = (v) => vals.filter(x => x === v).length;
  document.getElementById('count').textContent = ENTRIES.length + ' total — ' + n('keep') + ' kept, ' + n('redo') + ' redo, ' + n('drop') + ' drop, ' + (ENTRIES.length - vals.length) + ' undecided';
}
updateCount();

document.getElementById('animBtn').addEventListener('click', (e) => {
  animating = !animating;
  e.target.textContent = animating ? 'Pause animation' : 'Resume animation';
});
</script>
</body>
</html>
`;

writeFileSync(join(ROOT, 'review/gallery.html'), html);
console.log(`Wrote review/gallery.html with ${entries.length} creatures.`);
