# Memory Forest — how the original works

Notes taken from a read of `reference/memory-forest` (Barak Levy, MIT, v1.3.0, `min_point_version` 45).
Written to guide the RemNote port (**Memory Garden**). File references are to the upstream repo.

Upstream is a **Qt/Anki add-on in Python** that renders its scene by generating a web page and
handing it to Anki's embedded web view. All of the art is **JavaScript drawing procedurally onto a
canvas** — there are no tree or animal image assets. The only bitmaps in the repo are documentation
GIFs and settings-dialog previews.

---

## 1. Data model: from review log to trees

`forest_data.py` is the heart. One **tree per day on which at least one new card was first studied**.

### Grouping
- Cards are bucketed by `days_ago(first_review_ms)`, where the first review comes from
  `min(revlog.id)` for that card (`study_log.ReviewLog`). A card's tree is the day it was *first
  learned*, never the day it was created and never a later review.
- Days are **Anki days**, not calendar days: `day_cutoff` is the scheduler's rollover timestamp
  (default 4am). Studying at 00:30 joins the previous day's tree.
- The tree is keyed by an **absolute day number** (`today - d`) so its seed and position never
  change as time passes.

### Per-day cohort fields (`build_forest`)
| Field | How |
|---|---|
| `n` | cards in the cohort |
| `learning` | cards with `ctype == 1` (still in initial learning steps) |
| `strengths` | per card: FSRS stability `s` if present, else `max(ivl, 0)` |
| `struggling` | cards in relearning (`ctype == 3`) **or** lapsed within the last 7 days |
| `suspended` | `queue == -1`; holds its place in size/stage but counts for neither health nor recall |
| `r` | per-card retrievability on its own forgetting curve |
| `leeches` | cards tagged leech, active in the last 60 days, `ivl < 21` |

### Growth stage (`_stage`)
Six stages: `SEEDLING, SAPLING, YOUNG, MATURE, OLD, ANCIENT` = 0..5.

```
today's tree                      -> SEEDLING
no strengths, or learning/n > 0.5 -> SAPLING      (SAPLING_LEARNING_SHARE = 0.5)
median(strengths) >= 365          -> ANCIENT      (ANCIENT_DAYS)
median(strengths) >= 180          -> OLD          (OLD_DAYS)
median(strengths) >= 21           -> MATURE       (MATURE_DAYS)
otherwise                         -> YOUNG
```

The driver is the **median** of the cohort's stabilities — robust against one runaway card.

Drawn heights, in engine units: `AF.STAGE_H = [4, 8, 13, 19, 27, 38]`.

### Crown size (`make_tree`)
`size` 0/1/2 from card count against `CROWN_SIZE_CARDS = (15, 40)`. So <15 cards small,
15–39 medium, 40+ large.

### Tree kind
`kind = 1` (conifer) if `seed % 100 < PINE_PERCENT (34)`, else broadleaf. About a third conifers,
decided purely by the day's seed.

### Health / yellowing (`_health`)
```
share = struggling / active
HEALTH_THRESHOLDS = (0.12, 0.25, 0.45)   -> health 0..3, one level per threshold passed
```
Crucially: `HEALTH_MIN_STAGE = MATURE`. A tree **below MATURE never yellows** — "forgetting is part
of learning new cards". Yellowing is applied as a palette swap in 2×2 clusters so it reads as yellow
branches rather than speckle; `SICK_SHARE = [0, 0.38, 0.62, 0.85]` is the share of crown affected,
and at health 3 the crown also gets `DYING_HOLES = 0.18` holes punched in it.

**Trees never die.** Health is fully reversible: relearn the cards and it goes green again.

### Seeding
`_seed(day) = sha1("anki-forest-" + day)[:4] & 0x7FFFFFFF`. Everything random about a tree (kind,
variant, jitter, which animal perches on it) derives from this, so **the forest is stable between
sessions** and only changes when the data does.

---

## 2. Ponds, streaks and the deep forest

### Ponds (`_breaks` / `_ponds`)
- A **break** is a run of `>= BREAK_DAYS (7)` consecutive days with no reviews at all. A break still
  in progress (running up to today) is ignored.
- Each break is marked on the **first tree planted after it**, carrying `gap` (days away),
  `gap_from`, `gap_to`.
- Breaks separated by only one tree are merged into one pond, so a fortnight away with a single
  day's study in the middle is one pond rather than two side by side.
- Layout: a pond takes `ceil(gap / 10)` slots, clamped to 2..4 (`POND_DAYS_PER_SLOT`, `POND_SLOTS`),
  must sit on consecutive free cells of a single row, keeps `POND_APART = 3` rows clear of other
  ponds, and reserves the two cells in front so it stays visible. A pond that doesn't fit *waits*
  and is placed a few trees later rather than leaving holes.

> Note: the task brief says "gaps of 2+ weeks become a pond". The original's threshold is actually
> **7 days**. Logged in `DECISIONS.md`; Memory Garden makes it configurable, defaulting to 14 to
> match the brief.

### Streaks (`_streaks`)
Counts days studied, walking back from today. A streak **survives today not being studied yet**, and
passes over `free` days — days with no review *and nothing due* (`study_log.load_free_days`). So a
day where you had nothing to do doesn't break your streak. There is also `days_off()` for an opt-in
5- or 6-day study week.

### Deep forest (`merge_old`)
Beyond `MAX_INDIVIDUAL_TREES = 730` (two years at a tree a day), the oldest trees are folded into
one `merged` summary. The renderer draws that as receding **bands of canopy** instead of sprites:
one band per doubling past `DEEP_TREES_PER_BAND = 60`, up to `DEEP_MAX_BANDS = 4`. This holds both
render cost and payload size flat however long you have studied.

---

## 3. Animals, cabin and landmarks (`milestones.py`)

Ten unlocks, each with a condition tested against the forest's stats:

| Key | Who | Condition |
|---|---|---|
| `rabbit` | a rabbit | `trees >= 50` |
| `deer` | a deer | `longest_streak >= 30` |
| `fox` | a fox | `reviews >= 10,000` |
| `owl` | an owl | `ancient >= 1` (first tree became ancient) |
| `heron` | a heron | `ponds >= 1` |
| `stag` | a stag | `longest_streak >= 100` |
| `cabin` | a cabin | `forest_age >= 365` days |
| `bear` | a bear | `longest_streak >= 730` |
| `squirrel` | squirrels | `mature_cards >= 10,000` |
| `eagle` | an eagle | `mature_cards >= 25,000` |

Once an animal arrives it **stays for good** — `arrivals()` records the day it came, and only the
Merciless asteroid event sends them away. `animal_days()` back-dates arrivals from history so
animals in a forest that predates the add-on still have a real date.

### Where they live (`web/visitors.js`)
- `owl` perches on one of the oldest trees; `squirrel` sits at the foot of a mature tree just right
  of the trunk; `heron` wades at a pond; `deer`/`stag` graze on a tree 2–4 / 4–6 rows from the front.
- The rest take one of `FRONT_SLOTS = [0.9, 0.22, 0.75, 0.38, 0.6]`, shuffled daily by a day seed.
- `eagle` flies: circles at `SKY_X 0.66, SKY_Y 0.16` with radii `0.09/0.04`, `SKY_TURN 0.35 rad/s`.
- `cabin` sits front-left at `x = 0.05` (or front-right if a pond is there), smokes when not raining,
  windows lit at night/dusk.

### Sprite format — the single most portable idea in the codebase
Every animal is **ASCII rows plus a palette**:

```js
rabbit: { pal: { b:'#b9a38a', d:'#7a6450', e:'#2a2018', l:'#f1ebe2' }, frames: [
  ['..d.d...','..d.d...','..b.b...','.bbbb...','bebbbbb.','.blllbbl','..d..d..'], ... ] }
```
`.` is transparent; every other character indexes the palette. `paintSprite()` renders a frame once
onto its own small canvas, keyed by `(frame, flip, resolved colours)`, and blits it thereafter.
Memory Garden adopts this format wholesale for its creatures.

### Movement
Deliberately calm. Each front animal gets its own stretch of ground and wanders to a new spot every
`ROAM_EVERY 150 s` (+ `41 s` per animal, offset `37 s` so they never set off together), walking at
`WALK_SPEED 7` engine-units/second. **Leg frames advance with ground covered, not with the clock**
(`STRIDE = 0.25` of the sprite's own length), so feet never slide. Rabbits hop instead:
`RABBIT_HOP_LEN 6`, `RABBIT_HOP_PX 3`. At rest an animal shows its second frame (a glance, a nibble)
whenever a slow sine passes `IDLE_GLANCE = 0.93`.

---

## 4. The "Nature" setting

Three levels, from the README and `events.py`:

- **Peaceful** (default) — only good things happen. Days away cost nothing. (Ponds still form; they
  are scenery, not punishment.)
- **Wild** — bad habits leave marks until fixed. Miss two days in a row → smoke rises as a warning.
  Miss a third → a fire breaks out and spreads while you stay away. A weekend off is fine. Seven days
  of study puts it out. Fire is rendered by scorching one side of a tree sprite
  (`scorch()` in `trees.js`: `REACH_LEAST 0.18` → `REACH_MOST 0.42` across, ragged in 2×2 clusters,
  with embers while the fire is high and a singed brown edge).
- **Merciless** — a single day without reviews brings an asteroid down on the whole forest; it
  regrows from scratch and the animals must be re-earned.

Switching back restores the forest exactly — severity is a *view*, not destructive to the data.

---

## 5. Scenery

A scene is **five independent settings**, not a single preset:
`environment`, `landscape`, `landmark`, `weather`, `time_of_day`. Presets are only shortcuts that
fill all five at once (`presets.py`), which is why "Customize" can always show exactly what is drawn.

### Environments (`web/envs/`)
| Key | Label | Preset |
|---|---|---|
| `natural` | Natural | **Golden hour by the lake** — lake, no landmark, clear, golden_hour |
| `misty_valley` | Misty valley | **Misty mountain valley** — mountains + peak, fog, dawn |
| `aurora` | Aurora | **Aurora night** — lake, clear, night |
| `lanterns` | Lanterns | **Lanterns at night** — lake + moon_bridge, clear, night |
| `bamboo` | Rainy bamboo grove | river + pagoda, rain, day |
| `synthwave` | Synthwave | meadow, clear, dusk |
| `pumpkin_patch` | Pumpkin patch | *seasonal*, 24–31 Oct, meadow, dusk |
| `frozen_market` | Christmas market | *seasonal*, 18–25 Dec, river, snow, dusk |

Plus "Surprise me daily", which picks a different one each day in rotation
(`of_the_day`: `turn[date.toordinal() % len(turn)]`). Seasonal presets stay out of the rotation and
take over everyone's forest for their week once a year.

- **Landscapes** (`web/landscapes/`): `lake`, `meadow`, `mountains`, `river`.
- **Landmarks** (`web/landmarks/`): `none`, `peak`, `pagoda`, `moon_bridge`.
- Discovery is purely **file-presence based** (`catalog.py`): each is a `.js` + a `.json` with its
  label. Delete the file and it disappears from the dialog, the presets and the tests alike. Memory
  Grove keeps this "a folder is a feature" property for its region packs.

### Times of day (`web/theme.js`)
`dawn, day, golden_hour, dusk, night, plum_night`. Each is a full palette: a 6-stop sky gradient,
an `orb` (sun or phased moon with position, radius, colour, glow, halo), far/near hill colours,
two grass colours, `haze` + `hzStep` (how fast distance washes colour out), `water`, an optional
`tint`/`tintAmt` applied to every sprite, a `rim` light colour, cloud colours and `birdC`.

### Weather
`clear, cloudy, rain, storm, fog, snow, deep_winter, after_rain`. `AF.theme()` takes the time-of-day
palette and *mutates* it for the weather: mixing grey into the sky, flattening highlights
(`th.flat`), killing the rim light and shadows, adding `th.rain`/`th.snowfall` particle counts,
`th.lightning`, `th.fog`, `th.rainbow`, `th.puddles`.

### Your numbers as ambience
A neat trick worth keeping:
- fireflies = `clamp(streak, 0, 60)` — only on calm night/dusk
- birds = `ceil(today_reviews / 40)`, max 6 — only on calm days
- lanterns = `ancient_trees / 12`, 1..3

---

## 6. Rendering

- **One low-resolution canvas, scaled up.** Everything is drawn at engine resolution and the whole
  canvas is then scaled, which is what gives the crisp pixel look.
- `env.u` is the engine unit; all sizes are expressed in it so the scene is resolution-independent.
- **Layer order:** sky → ground → (landscape bed, e.g. a river bed) → deep forest bands → per-item
  steps back-to-front (trees and ponds interleaved) → post (lake reflection, lightning-lit copy) →
  per-frame animation on top.
- **Trees are drawn into a tone map first**, not straight to colour. `roundCrown`/`pineCrown` fill an
  `Int8Array` with tone indices 0..4; a second pass maps tone → palette entry, and *that* is where
  yellowing, snow caps, rim light, haze, tint, environment overrides and fire scorching are applied.
  Decoupling shape from palette is why one tree routine serves eight environments.
- Crown shapes: broadleaf = a cluster of overlapping ellipse "blobs" (`blobsN` grows with stage:
  3 → 5 → 7); conifer = stacked tapering tiers (`tiers` 2 → 3 → 4).
- **Sprite caching** (`AF.spriteCache`): keyed by `tree index | height | haze quarter-step | shape`,
  LRU-evicted at `CACHE_PX = 3e6` pixels. Haze is quantised to quarter steps (`HAZE_STEPS = 4`) so
  nearby trees share sprites.
- **Layout** (`layout.js`): a grid of slots; `perRow = clamp(round(sqrt(n) * 1.6), 10, 34)` (52 for
  forests over 500 items). Row 0 is the back. Depth drives both scale
  (`FAR_SCALE 0.82 + NEAR_GAIN 0.18 * depth`) and haze (`hz = 1 - depth`). Odd rows are offset half a
  slot; each tree jitters within its slot (`X_JITTER 0.7`, `Y_JITTER 0.6`). A forest with a single
  row scatters over the meadow instead of standing in a line. Young forests are zoomed in up to 1.8×.
- **Animation is minimal** and all driven by one clock `t`: slow tree sway, water ripple
  (`sin(t*0.9 + j*0.7)`), drifting clouds, weather particles, animal roaming. There is an explicit
  `AF.LOOP` mode that rounds every frequency to a whole number of cycles so recordings loop seamlessly.
- `animates(data)` honours `prefers-reduced-motion` when the setting is `'system'`.

---

## 7. Tooltip

Hovering a tree gives: the **date**, the **number of cards**, **% remembered**, and **how many are
being relearned**. `measured` flags whether "% remembered" is a real forgetting-curve figure or a
fallback estimate (`1 - struggling/active`), so the UI can hedge honestly. Hovering an animal names
it and says why it came ("a fox — you passed 10,000 reviews"). Hit-testing is by sprite bounding
boxes collected during the draw (`env.visitorBoxes`, `env.staticBoxes`, `env.skyBoxes`), frontmost
first.

---

## 8. Heatmap

Below the forest (`web/calendar.js`, 130 KB — the single biggest file). Two views: a rolling
10-month timeline or a full year. Days shaded by review count, study time, or seconds per answer.
Per-deck heatmaps and streaks. "Fair streaks" (days with nothing due don't break it), optional 5/6-day
study weeks, trophies for the three longest streaks, a goal flag, user-markable important days
(exams, trips), configurable week start, and upcoming due counts rendered in brown ahead of today.
Tile styles are pluggable files (`flat`, `round`, `contours`) and colours follow the scenery.

---

## 9. Weather (`weather.py`)

Opt-in, off unless the user types a city. Two calls, both free and account-less:
**Photon** (`photon.komoot.io`, OpenStreetMap) to geocode the city name, then
**MET Norway** (`api.met.no`) for the forecast. Sunrise/sunset is computed locally from NOAA's
sunrise equation rather than fetched. Careful citizenship throughout: a declared `User-Agent`,
`If-Modified-Since`, honouring MET's `Expires`, backoff on failure, a 6-hour staleness cut-off after
which it falls back to the preset's own weather, and coordinates rounded to 4 dp so nearby users
share MET's cache.

> Memory Garden uses **Open-Meteo** instead (the brief asks for it); it provides both geocoding and
> forecast from one account-less API. Same discipline: opt-in, city name only, cached, documented.

---

## 10. What Memory Garden takes, and what it changes

**Takes:** the one-tree-per-learning-day model; median-stability staging with the same six stages and
thresholds; crown size from card count; health from a struggling share with the same thresholds and
the "no yellowing before mature" rule; day-seeded stability; ponds; the deep-forest fold; the
tone-map-then-palette tree renderer; the ASCII-rows sprite format; calm movement with stride-locked
legs; the five-axis scenery model with file-based discovery; numbers-as-ambience; the tooltip contents.

**Changes:** RemNote's data model in place of Anki's (see `REMNOTE_API.md`); Open-Meteo; a pond
threshold of 14 days by default; and three additions that are not in the original — the **ecosystem
health layer**, the **pause/study-calendar system**, and **region packs** with real species.
