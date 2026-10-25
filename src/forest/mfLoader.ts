/**
 * Loads the vendored Memory Forest engine (`src/vendor/memory-forest/web/`, served as
 * static files under `vendor/` by webpack's `CopyPlugin` — see `webpack.config.js`) via
 * plain `<script>` tags, in `catalog.py`'s own `SCRIPTS` order, plus whichever scenery
 * files a mood needs. These are classic IIFE scripts that build up `window.AnkiForest`
 * piece by piece — not ES modules — so this is script-tag injection, not an `import`,
 * deliberately mirroring how the original's own deck-list page loads them and how
 * `tools/harness/mf.html` already proved the exact same list works.
 *
 * Also loads Memory Grove's own environments (`src/envs/*.js`, `mfEnvs.ts`'s registry) the
 * same way, from a separate `envs/` URL namespace — `AF.env()` doesn't care which file
 * registered a key, so this is the one place that needs to.
 */
import { BIOME_ENVS } from './mfEnvs';

const MG_ENV_KEYS = new Set(Object.values(BIOME_ENVS));

/** `catalog.py`'s `SCRIPTS` constant, verbatim order. */
const CORE_SCRIPTS = [
  'util.js', 'layout.js', 'scenery.js', 'theme.js', 'visitors.js', 'ponds.js', 'tooltips.js',
  'caption.js', 'news.js', 'hover.js', 'visit.js', 'core.js', 'effects.js', 'effects/weather.js', 'effects/ambience.js',
  'engines/pixel/trees.js', 'engines/pixel/sky.js', 'engines/pixel/ground.js',
  'engines/pixel/water.js', 'engines/pixel/engine.js', 'calendar.js',
  'heatmap/flat.js', 'heatmap/round.js', 'heatmap/contours.js',
  'events.js', 'events/crows.js', 'events/robins.js', 'events/grass.js', 'events/tumbleweeds.js',
  'events/flowers.js', 'events/asteroid.js', 'events/fire.js',
];

/** `AF.mount`'s own signature — the one piece of the vendored engine's API every caller
 * (this file, `mf_preview_widget.tsx`, `tools/harness/mf.ts`) actually invokes directly. */
export interface AnkiForestApi {
  mount: (root: HTMLElement, data: unknown, opts: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    AnkiForest?: AnkiForestApi;
  }
}

let loaded: Promise<void> | null = null;
const sceneryLoaded = new Set<string>();

function loadScript(src: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.onload = () => resolvePromise();
    el.onerror = () => reject(new Error(`Memory Forest engine script failed to load: ${src}`));
    document.head.appendChild(el);
  });
}

/** The base path scripts are served from — wherever this bundle's own assets sit, since
 * `CopyPlugin` places `vendor/` alongside the widget JS. `document.currentScript` is always
 * `null` for an ES module (webpack's sandbox output, which is how every widget here loads —
 * see `webpack.config.js`'s `HtmlWebpackPlugin` template), so the real path is the second
 * branch: RemNote serves the widget's own `index.html` from the same directory `vendor/`
 * sits in, so the page's own URL is the right base to resolve `vendor/...` against. */
function vendorBase(): string {
  const current = document.currentScript as HTMLScriptElement | null;
  if (current?.src) return new URL('.', current.src).toString();
  return new URL('.', window.location.href).toString();
}

/** Load `util.js` through the pixel engine and events scripts once per page — every widget
 * instance sharing one `window.AnkiForest`, matching the original (one copy of the engine
 * per page, not per forest). Safe to call from multiple components; later callers just await
 * the same promise. */
export function loadMfCore(): Promise<void> {
  if (!loaded) {
    const base = vendorBase();
    loaded = CORE_SCRIPTS.reduce(
      (p, rel) => p.then(() => loadScript(`${base}vendor/${rel}`)),
      Promise.resolve(),
    );
  }
  return loaded;
}

/** Load the `envs/X.js` / `landscapes/X.js` / `landmarks/X.js` a mood needs, once each —
 * `catalog.py`'s `scenery_files`, which checks each file actually exists before listing it
 * (several environments, "natural" among them, have no `.js` of their own — just a JSON
 * preset — and draw with no extra script at all). A `envs/*.js` 404 is that normal case, so
 * it's swallowed rather than failing the whole mount; `landscapes`/`landmarks` are always
 * drawn by a real file when referenced, so a 404 there is a genuine error.
 *
 * A Memory Grove env (`mfEnvs.ts`'s registry) failing to load is handled the same
 * fail-soft way, even though `mfEnvs.ts` only ever maps to a file that's genuinely there —
 * a real build can still be missing it for reasons outside this code's control (a stale
 * dev-server bundle predating the file, a deploy that didn't finish copying `src/envs/`),
 * and `AF.ENVS[key] || {}` in `trees.js` already treats an unregistered key as "no special
 * environment" harmlessly. The whole grove silently failing to render at all — the actual
 * failure mode this used to have, caught live — is a far worse outcome than one biome's
 * trees quietly falling back to the vendored engine's own default for a session. */
export async function loadMfScenery(mood: { special?: string; landscape?: string; landmark?: string }): Promise<void> {
  await loadMfCore();
  const base = vendorBase();
  if (mood.special) {
    const own = MG_ENV_KEYS.has(mood.special);
    const rel = `envs/${mood.special}.js`;
    const key = (own ? 'mg:' : 'vendor:') + rel;
    if (!sceneryLoaded.has(key)) {
      try {
        await loadScript(own ? `${base}${rel}` : `${base}vendor/${rel}`);
      } catch (e) {
        if (own) console.error(`Memory Grove env "${mood.special}" failed to load; falling back to the default trees.`, e);
        /* vendored: no special script for this environment — e.g. "natural" — nothing to draw */
      }
      sceneryLoaded.add(key);
    }
  }
  const required: string[] = [];
  if (mood.landscape) required.push(`landscapes/${mood.landscape}.js`);
  if (mood.landmark && mood.landmark !== 'none') required.push(`landmarks/${mood.landmark}.js`);
  for (const rel of required) {
    if (sceneryLoaded.has(rel)) continue;
    await loadScript(`${base}vendor/${rel}`);
    sceneryLoaded.add(rel);
  }
}
