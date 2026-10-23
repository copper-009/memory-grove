# Changelog

All notable changes are recorded here. Dates are when the work happened, not a release
schedule — this is a from-scratch build, not yet published.

## 0.1.0 — Unreleased

Initial build.

### Added

- The core grove: one plant per day of first-learned cards, growing through six stages
  (seedling → sapling → young → mature → old → ancient) from the median scheduled interval
  of that day's cards, with the same thresholds Memory Forest uses (21/180/365 days).
- Health (0–3, yellowing/drying once a plant has matured), ponds for breaks away, the
  deep-grove fold past 730 individually-drawn plants, milestone creature unlocks, and a
  study heatmap — all ported from Memory Forest's model.
- **Ecosystem health layer** (not in the original): a 0–100 relative-consistency score, a
  grace budget that studying replenishes, a 7-day trailing smoothing, four severities
  (Peaceful/Gentle/Wild/Merciless) plus Custom, driving grass saturation, water clarity,
  undergrowth density and how many creatures are out.
- **Study calendar and pause system**: excused days, "Holiday mode," semester/trimester
  presets (approximate, fully editable), an optional Queensland public-holiday list,
  recurring weekday exclusions, exam-period boost weeks, retroactive excusing (7 days, or
  none in Merciless), a yearly excuse cap in Merciless, and backlog forgiveness relative to
  what was overdue when a pause started.
- **Eleven regions**, each a self-contained, schema-validated data pack: Australia (six
  biomes), Aotearoa New Zealand, Japan, Madagascar, Costa Rica, East African savanna, Canada,
  Norway, Nepal, Patagonia, Borneo. 143 species total, every one with an IUCN status and a
  checked source. Creature unlock progress, ages and custom names are stored as abstract
  slots, so switching regions preserves everything.
- A procedural rendering engine: tone-map plant sprites (9 plant forms), ellipse-based
  creature sprites (8 body-plan kinds) built from data rather than hand-drawn, calm
  stride-locked creature movement, a five-time-of-day / seven-weather theme system, and a
  hover/tap inspector.
- Real weather via Open-Meteo, opt-in, disclosed in `README.md`.
- RemNote integration: widgets at `RightSidebar`, `QueueBelowTopBar` (finished queue only),
  a dedicated `Pane`, and `LearningProgressPage`; commands for opening the grove, toggling
  animation, changing scenery, and pausing.
- A screenshot harness (`npm run shots`) and 177 unit/integration tests.

### Known limitations (v1)

See `DEVELOPMENT.md` § "Known limitations" for the current list — primarily a smaller
scenery set than the original's full eight-environment catalogue, settings shown as a flat
list rather than tabs (no SDK support for custom settings tabs), and the study calendar's
visual settings UI (colour-coded mini calendar) not yet built as its own popup widget.
