# Memory Grove

**A living grove that grows from your RemNote flashcard history.** Every day you learn new
cards, a plant goes in. It grows as those cards settle into memory, goes a little dry if you
start forgetting them, and comes back green once you relearn them. A study heatmap sits
underneath, and over time a whole small ecosystem — ground cover, water, native animals —
responds to how consistently you've been studying.

Inspired by [**Memory Forest**](https://github.com/baraklevy20/memory-forest), Barak Levy's
much-loved Anki add-on (MIT licensed). Memory Grove ports its concept and rendering approach
to RemNote, keeps the same growth-stage thresholds and health model, and adds a few things
that aren't in the original: a kinder, tunable ecosystem health layer instead of a strict
streak, a full pause/study-calendar system that genuinely protects your progress across
breaks, and eleven regions of real, correctly-sourced native species in place of one generic
forest. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the full credit.

## What it does

- **One plant a day.** Cards first learned on a day become that day's plant: a seedling,
  growing through sapling → young → mature → old → ancient as the cards it holds settle
  into memory (median scheduled interval, the same thresholds Memory Forest uses: 21 days,
  180 days, 365 days).
- **Health, not just size.** Once a plant has matured, a share of its cards relearning or
  recently lapsed makes it look a little unwell — dry, not "autumn", since most of the
  species here don't turn colour in autumn. It's always reversible.
- **Ponds** mark the weeks you were away; **native creatures** move in as you build a longer
  study history; a small **cabin** appears after your grove's first year.
- **Ecosystem health**, a feature the original doesn't have: a 0–100 score from a *relative*,
  rolling measure of consistency — one missed day barely registers, a pattern of misses does
  — drives grass saturation, water clarity, undergrowth and how many creatures are out.
  Tunable via a **Nature** setting (Peaceful → Gentle → Wild → Merciless → Custom).
- **A study calendar with real pause protection.** Mark a semester break, a sick day, or just
  hit "Holiday mode," and every one of those days is excused outright — not counted as missed,
  not consuming a slot in the rolling window, never forming a pond, never costing unlock
  progress. Creatures freeze exactly where they were and pick back up on resume.
- **Eleven regions**, each with real native species: Australia (six biomes), Aotearoa New
  Zealand, Japan, Madagascar, Costa Rica, East African savanna, Canada, Norway, Nepal,
  Patagonia and Borneo. Every species carries an IUCN conservation status and a source link
  — see [`reference/SPECIES.md`](reference/SPECIES.md). Switching regions keeps your
  progress: unlocked creatures, their ages and their custom names all carry over.
- **A study heatmap** under the grove: streaks, upcoming due counts, excused days shown with
  their own pattern rather than as a gap.
- Hover (or tap, on touch) any plant or creature for its details — species, age, health, and
  for creatures, a gentle conservation note.

## Rendering

The grove is drawn by Memory Forest's own vendored engine (`src/vendor/memory-forest/web/`),
not a from-scratch renderer — see `DECISIONS.md` § "Phase 2" for why, and
`tools/harness/mf.html` for the render harness used to verify it against fixtures.

## Privacy

Everything is computed locally from your own RemNote review history. The **only** network
call this plugin ever makes is the optional real-weather feature, and only once you type a
city into the Weather setting: your city name is sent to
[Open-Meteo](https://open-meteo.com) (free, no account, no API key) to look up its location
and fetch a forecast. Nothing else — no card content, no study data, no identifying
information — ever leaves your device. Leave the city field blank and no network call is ever
made.

## Install (from source, for now)

```sh
npm install
npm run build
```

Upload the resulting `MemoryGrove.zip` from RemNote's Settings → Plugins → Build → Upload.
See [`DEVELOPMENT.md`](DEVELOPMENT.md) for running it live with `npm run dev`, and
[`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md) for publishing it.

## Credits

- **[Memory Forest](https://github.com/baraklevy20/memory-forest)** by Barak Levy — the
  original concept, growth model and rendering technique this ports. MIT licensed; full
  notice in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- Weather from [Open-Meteo](https://open-meteo.com), when you opt in.
- Species facts checked against the Atlas of Living Australia, the IUCN Red List and GBIF —
  see each source link in [`reference/SPECIES.md`](reference/SPECIES.md).

## License

[MIT](LICENSE). Building on it yourself? See [`DEVELOPMENT.md`](DEVELOPMENT.md) and
[`DECISIONS.md`](DECISIONS.md) for the judgment calls made along the way.
