#!/usr/bin/env node
/**
 * Screenshot harness: renders every scenery against every fixture (brand-new user,
 * two-year veteran, big-gaps user, heavy-lapser) at low/medium/high ecosystem health, and
 * saves PNGs to `screenshots/` for visual review — Step 5 of the build plan.
 *
 * Bundles `tools/harness/render.ts` with esbuild (no RemNote SDK involved — it calls
 * `drawScene` directly against synthetic fixtures), serves the harness page with a tiny
 * static server, and drives it with Playwright's headless Chromium.
 *
 * Run with: npm run shots
 */
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HARNESS = join(ROOT, 'tools/harness');
const OUT = join(ROOT, 'screenshots');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

async function bundle() {
  await build({
    entryPoints: [join(HARNESS, 'render.ts')],
    outfile: join(HARNESS, 'render.js'),
    bundle: true,
    format: 'esm',
    target: 'es2022',
    sourcemap: false,
    logLevel: 'warning',
  });
}

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const path = join(HARNESS, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const FIXTURES = ['newbie', 'veteran', 'gappy', 'forgetful'];
const SCENERIES = [
  { key: 'natural', time: 'goldenHour', weather: 'clear' },
  { key: 'misty', time: 'dawn', weather: 'fog' },
  { key: 'aurora', time: 'night', weather: 'clear' },
  { key: 'rain', time: 'day', weather: 'rain' },
  { key: 'snow', time: 'day', weather: 'snow' },
  { key: 'dusk', time: 'dusk', weather: 'clear' },
];
const HEALTH_BANDS = [15, 55, 92]; // low, medium, high
const REGIONS_SAMPLE = ['australia', 'japan', 'borneo'];

const W = 960;
const H = 320;

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Bundling harness...');
  await bundle();
  const server = await serve();
  const { port } = server.address();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => typeof window.__renderFixture === 'function');

  let count = 0;

  // 1. Every scenery x every fixture (Australia), per Step 5's harness requirement.
  for (const scenery of SCENERIES) {
    for (const f of FIXTURES) {
      await page.evaluate(
        (opts) => window.__renderFixture(opts),
        { fixtureName: f, regionKey: 'australia', biomeIndex: 0, mood: { time: scenery.time, weather: scenery.weather }, severity: 'gentle', width: W, height: H },
      );
      await page.waitForFunction(() => document.title === 'ready');
      await page.locator('#stage').screenshot({ path: join(OUT, `scenery-${scenery.key}_fixture-${f}.png`) });
      count++;
    }
  }

  // 2. Every sampled region's first biome, at low/medium/high health, per the ecosystem
  //    layer's own test requirement ("screenshot every biome at low/medium/high health").
  for (const regionKey of REGIONS_SAMPLE) {
    for (const health of HEALTH_BANDS) {
      await page.evaluate(
        (opts) => window.__renderFixture(opts),
        { fixtureName: 'veteran', regionKey, biomeIndex: 0, mood: { time: 'day', weather: 'clear' }, severity: 'gentle', width: W, height: H, forceVisualHealth: health },
      );
      await page.waitForFunction(() => document.title === 'ready');
      await page.locator('#stage').screenshot({ path: join(OUT, `region-${regionKey}_health-${health}.png`) });
      count++;
    }
  }

  await browser.close();
  server.close();
  console.log(`Wrote ${count} screenshots to screenshots/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
