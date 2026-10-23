# Submission checklist

Steps to take Memory Grove from this repo to a public RemNote plugin listing.

## 1. Create the public repository ✅

Done — the repo is live at **https://github.com/copper-009/memory-grove**, with every commit
pushed to `main`.

## 2. Set `repoUrl` ✅

`public/manifest.json`'s `repoUrl` points at the real repo above.

## 3. Decide the version

`public/manifest.json`'s `version` is `{ major: 0, minor: 1, patch: 0 }` — fine for a first
upload. Bump it on every subsequent release; RemNote uses this to detect updates.

## 4. Build

```sh
npm install
npm run build
```

This runs `tsc --noEmit`, the production webpack build, and zips `dist/` into
`MemoryGrove.zip`. The build must succeed with no errors — it's the same command reviewers
effectively run against your source.

## 5. Upload

In RemNote: **Settings → Plugins → Build → Upload Plugin ZIP**, and pick `MemoryGrove.zip`.
Test it there before publishing — widgets should appear in the right sidebar, the finished
queue screen, and via the "Open Memory Grove" command (try it from the omnibar).

## 6. What reviewers check

Based on RemNote's plugin guidelines, before submitting double-check:

- [ ] `requiredScopes` in `manifest.json` is the minimum the plugin needs. Memory Grove
      currently requests `{ type: "All", level: "Read" }` — read-only, no write access,
      matching "minimal required scopes (read-only access to cards/rem is enough for v1)"
      from the project brief. If a future version needs to write (e.g. jumping to a card),
      narrow the scope further rather than widening it.
- [ ] The only network call is the opt-in Open-Meteo weather fetch (`src/widgets/
      weatherFetch.ts`), and it's disclosed in `README.md`'s privacy section — RemNote
      requires disclosure of any third-party data sharing.
- [ ] `description` in `manifest.json` is accurate and not misleading.
- [ ] The MIT licence and Memory Forest attribution are present and visible — `LICENSE`,
      `THIRD_PARTY_NOTICES.md`, and the README credits section.
- [ ] No console errors on a cold load, a card review, opening the pane, and switching
      regions in settings. (`npm run dev` + the RemNote desktop app's dev tools console.)
- [ ] The plugin works with an empty knowledge base (a brand-new user) without throwing —
      covered by the `newbie` fixture in tests, but worth a manual check too.
- [ ] `enableOnMobile: true` is set, and the widgets have been checked at a narrow width
      (the brief asks for this; `src/style.css`'s media query and `GroveCanvas`'s
      container-relative sizing are what that depends on).

## 7. Publish

Submit via RemNote's plugin submission process (currently through the RemNote team / the
plugin dashboard — check `https://plugins.remnote.com` for the current process, as this has
moved before). Link back to the GitHub repo from the listing.

## 8. After publishing

- Update `CHANGELOG.md` for every release.
- Keep `reference/SPECIES.md` regenerated (`npm run species-doc`) whenever a region pack
  changes — it's generated, not hand-maintained, specifically so it can't drift from the
  data it documents.
- Watch for `@remnote/plugin-sdk` updates that expose fields `reference/REMNOTE_API.md`
  currently logs as unavailable (card state, suspension, FSRS stability) — each has a single
  workaround function to update if the real field ever lands.
