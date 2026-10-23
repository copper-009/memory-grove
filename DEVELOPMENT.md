# Developing Memory Grove

## Setup

```sh
npm install
```

## Running it live in RemNote

```sh
npm run dev
```

This starts `webpack-dev-server` on `http://localhost:8080`. In RemNote:

1. Open **Settings → Plugins → Build**.
2. Click **"Develop from localhost"** (or similar — the exact wording has moved between
   RemNote versions; it's on the Build tab).
3. RemNote loads each widget from `http://localhost:8080/index.html?widgetName=<name>` —
   you don't need to do anything per-widget; this is handled by `webpack.config.js`'s
   `HtmlWebpackPlugin` template.
4. Edits to `src/` hot-reload.

If RemNote can't reach `localhost:8080`, check nothing else is bound to that port and that
your browser/RemNote desktop app isn't blocking local connections.

## Quality gates

```sh
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test             # vitest run — 163 tests as of this writing
npm run bench        # vitest bench, if any benchmark files are added later
npm run build        # typecheck -> production webpack build -> MemoryGrove.zip
npm run shots        # screenshot harness (needs `npx playwright install chromium` once)
npm run species-doc  # regenerate reference/SPECIES.md from the region packs
```

`npm run build` is the one CI (or you, before a release) should run end to end — it fails
loudly on a type error, a lint-adjacent build warning, or a broken import, and produces the
exact zip you'd upload to RemNote.

### Performance

`src/data/perf.test.ts` benchmarks the data layer against a synthetic ~55,000-card fixture
and asserts it completes well inside a 250ms budget (observed: under 100ms on a normal
laptop). The brief's 300ms first-render budget is for data *and* the first paint together;
the data half is the part that scales with history length, which is what's pinned here.

### Screenshot review

`npm run shots` bundles `tools/harness/render.ts` with esbuild and drives headless Chromium
(via Playwright) to call `drawScene()` directly — no RemNote SDK involved, so it's fast and
needs no running plugin. It renders:

- every scenery (`natural`, `misty`, `aurora`, `rain`, `snow`, `dusk`) against every fixture
  (`newbie`, `veteran`, `gappy`, `forgetful`)
- three sampled regions (`australia`, `japan`, `borneo`) at low/medium/high ecosystem health

to `screenshots/*.png`. Look at them after any change to `src/forest/`.

## Project layout

```
src/
  data/          pure data layer — no RemNote SDK import except source.ts.
                 cards.ts (the hot scan), forest.ts (stages/health/ponds/streaks),
                 health.ts (ecosystem health), calendar.ts (pause/excuse rules),
                 schedulePresets.ts, heatmap.ts, milestones.ts (creature unlocks),
                 cache.ts, fixtures.ts (synthetic test knowledge bases).
  regions/       region packs. See "Adding a region" below.
  forest/        the renderer — pure except paint.ts and scene.ts, which touch canvas.
                 layout.ts, theme.ts, plantSprite.ts, creatureSprite.ts,
                 creatureMotion.ts, hitTest.ts, tooltip.ts, ecosystemVisual.ts.
  widgets/       the RemNote plugin itself: index.tsx (activation), settings.ts,
                 groveBuilder.ts, useGrove.ts, GroveCanvas.tsx, and one thin entry
                 file per WidgetLocation.
tools/
  species-doc.mjs    regenerates reference/SPECIES.md from src/regions/
  screenshots.mjs    the screenshot harness
  harness/           its standalone render entry (no SDK)
reference/
  NOTES.md           how the original Memory Forest works, read before writing this
  REMNOTE_API.md     the Anki -> RemNote SDK mapping, with a workaround for every gap
  SPECIES.md         generated — do not hand-edit
```

## Adding a region

A region is a folder under `src/regions/<key>/` exporting a `Region` (see
`src/regions/types.ts`), plus one import + one line in `src/regions/index.ts`'s `REGIONS`
array. Nothing in the rendering or data layers needs to change — `src/regions/validate.ts`
schema-checks every region in CI (`src/regions/validate.test.ts`), so a malformed pack fails
loudly rather than rendering wrong.

A region needs:

- `seasons`: a `SeasonSpec` — which of the five season models it follows
  (`southern`/`northern`/`wetDry`/`monsoon`/`tropicalEquatorial`) and what each of the
  twelve months means.
- `backdrops`: at least 2, including one `night: true` variant.
- `biomes`: each with 5+ `PlantSpecies` and **exactly 5** `Creature`s, one per unlock slot
  0–4, ordered common-and-easy-to-spot first, rarest/most-iconic last.
- Every species (plant or creature) needs `common`, `scientific`, `traits` (1–2 identifying
  visual details the sprite should show), `iucn` status, a `fact` (gentle, not preachy), and
  a `source` URL. Check names, ranges and status against a real source — the Atlas of Living
  Australia, IUCN Red List or GBIF are what the shipped regions use (`src/regions/sources.ts`
  has URL builders for each) — and log anything you had to correct in `DECISIONS.md`, the way
  the Bennett's-vs-Lumholtz's tree-kangaroo correction and the Norway muskox exclusion are
  logged there.
- Run `npm run species-doc` afterwards to regenerate `reference/SPECIES.md`.

Creatures and plants are drawn procedurally from a `BodyPlan`/`PlantForm` plus a `Palette` —
see `src/forest/creatureSprite.ts` and `src/forest/plantSprite.ts` — not hand-drawn, so a new
region's art is "free" once its data is right. See `DECISIONS.md` § "Art and assets" for why.

## Known limitations / stubbed for v1

Kept honest here rather than glossed over:

- **Scenery is a smaller set than the original's eight environments / four landscapes / four
  landmarks.** The rendering *engine* supports arbitrary scenery data (`theme.ts`'s `Theme`
  is deliberately data-only), but only a representative set of time-of-day/weather
  combinations is wired into `settings.ts`'s dropdowns for v1. Adding the rest is data work,
  not engine work.
- **Settings read as one flat list**, not literal tabs (Scenery/Forest/Nature/Weather) —
  the SDK has no tabbed-settings API. Approximated with an id-prefix convention
  (`scenery.*`, `forest.*`, ...); see `DECISIONS.md`.
- **The study-calendar settings UI** (the colour-coded mini calendar, the semester-preset
  picker) is not yet a dedicated popup widget — the underlying logic (`src/data/calendar.ts`,
  `schedulePresets.ts`) is complete and tested, but today the only way to set a pause is the
  "Holiday mode" command. A calendar popup widget is the natural next addition.
- **The cabin** is a simple two-colour shape in `scene.ts`, not yet a full creature-style
  sprite with smoke and lit windows at night, as the original has.
- **A "Cannot parse window string" toast can appear while developing from localhost.**
  Seen once, immediately after using the "Open Memory Grove" command, which calls
  `plugin.window.openWidgetInPane`. RemNote persists its pane layout, and a dev-server
  rebuild changes the bundle's content hash between loads, so a layout string saved before
  a rebuild can fail to parse against the widget RemNote now sees. This looks like a
  dev-mode-only artifact of frequent hot rebuilds rather than something the plugin itself
  does wrong — a production build's widget files don't change hash between loads, so the
  saved layout should stay valid. Flagged here rather than silently ignored; if it turns up
  in a production build too, it needs a real fix (most likely: don't let the pane's layout
  persist at all, or give the pane a stable identity independent of the build).
- **RemNote commands only ever surface through the omnibar (Cmd/Ctrl+K)** — there is no
  plugin API for a persistent left-nav icon the way "Tutorials" or "Settings" have one.
  `sidebar_widget.tsx` now has an "Open full view →" button that calls
  `openWidgetInPane` directly, so the everyday route into the full pane doesn't need the
  omnibar at all; the commands remain as the omnibar/keyboard path for anyone who prefers
  it.

None of these affect data correctness, the plugin's build, or its tests — they're rendering
and settings-surface polish, left for a follow-up pass.
