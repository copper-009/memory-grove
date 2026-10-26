# Anki → RemNote: what maps, what doesn't

Written against **`@remnote/plugin-sdk@0.0.46`** by reading the shipped `.d.ts` files in
`node_modules/@remnote/plugin-sdk/dist`, which are the authority here — not the website docs, which
lag the package.

## The one type everything hangs off

```ts
class Card {
  readonly _id: RemId;
  readonly remId: string;
  readonly type: PluginCardType;              // 'forward' | 'backward' | { clozeId: string }
  readonly createdAt: number;                 // unix ms
  readonly repetitionHistory?: RepetitionStatusInterface[];
  readonly nextRepetitionTime?: number;       // unix ms
  readonly timesWrongInRow?: number;
  readonly lastRepetitionTime?: number;       // unix ms
  getRem(): Promise<RemObject | undefined>;
}

interface RepetitionStatusInterface {
  date: number;                 // unix ms — when the rep actually happened
  score: QueueInteractionScore;
  responseTime?: number;        // ms
  isCram?: boolean;
  scheduled?: number;           // unix ms — when it was *due*; differs if done early/late
  pluginData?: Record<string, any>;
}

enum QueueInteractionScore {
  TOO_EARLY = 0.01, AGAIN = 0, HARD = 0.5, GOOD = 1, EASY = 1.5,
  VIEWED_AS_LEECH = 2, RESET = 3, MANUAL_DATE = 4, MANUAL_EASE = 5,
}
```

Fetched with `plugin.card.getAll()` — the docstring itself warns *"may be slow for large
knowledgebases"*, which drives the caching design in §3.

---

## 1. The mapping table

| Memory Forest needs | Anki source | RemNote equivalent | Clean? |
|---|---|---|---|
| Review log | `revlog` rows | `card.repetitionHistory[]` | ✅ Better, actually — it's already per-card and typed, no SQL |
| Card's first review | `min(revlog.id)` | `repetitionHistory[0].date` | ✅ |
| Card's last review | `max(revlog.id)` | `card.lastRepetitionTime` | ✅ |
| Review timestamp | `revlog.id` (ms) | `rep.date` (ms) | ✅ |
| Time spent per review | `revlog.time` | `rep.responseTime` (ms, optional) | ⚠️ Optional — may be absent on older/imported reps |
| Reviews per day | `group by revlog` day | Flatten all histories, bucket by day | ✅ |
| Next due date | `cards.due` | `card.nextRepetitionTime` (ms) | ✅ |
| **Current interval** | `cards.ivl` (days) | **Not exposed** | ❌ **Derived** — see §2.1 |
| **FSRS stability** | `cards.data` → `"s"` | **Not exposed** | ❌ **Derived** — see §2.1 |
| **FSRS decay** | `cards.data` → `"decay"` | Not exposed | ❌ Use FSRS-4.5/5 default `0.5` |
| Lapses | `revlog.type=1 and ease=1` | `rep.score === AGAIN (0)` | ✅ |
| Recent lapses (7d) | same, windowed | Same, windowed on `rep.date` | ✅ |
| Times wrong in a row | — | `card.timesWrongInRow` | ✅ Bonus — Anki has no direct equivalent |
| **Card state (new / learning / review / relearning)** | `cards.type` 0–3 | **Not exposed** | ❌ **Derived** — see §2.2 |
| **Suspended** | `cards.queue == -1` | **Not exposed on `Card`** | ❌ **Workaround** — see §2.3 |
| Leech | `leech` tag on note | `rep.score === VIEWED_AS_LEECH (2)` in history | ⚠️ Partial — see §2.4 |
| Deck | `cards.did` / `odid` | Rem ancestry + `BuiltInPowerupCodes.Deck ('de')` | ⚠️ Different shape — see §2.5 |
| Day rollover hour | `col.sched.day_cutoff` | **Not exposed** | ❌ Own setting, default 4am — §2.6 |
| Scheduler "today" | `col.sched.today` | **Not exposed** | ❌ Computed from rollover — §2.6 |
| Cards due in next N days | `select ... from cards where due` | Bucket `card.nextRepetitionTime` | ✅ |
| "Nothing was due" days | `load_free_days` (heavy SQL) | Reconstructable from history | ⚠️ Approximate — §2.7 |
| Deleted cards' reviews | kept in `revlog` | **Gone with the card** | ❌ Accepted loss — §2.8 |
| Total review count | `count(revlog)` | Sum of history lengths | ✅ |

---

## 2. The gaps, and what Memory Garden does about each

### 2.1 No interval, no FSRS stability — the big one

Anki hands you `cards.ivl` and, with FSRS on, a stability `s` in the card's data blob. RemNote
exposes neither. Since **stage is driven by median stability**, this had to be solved properly
rather than fudged.

**Workaround — derive an interval, then treat it as a stability proxy.**

```
interval_days = (nextRepetitionTime - lastRepetitionTime) / 86_400_000
```

Both are exposed and this is exactly the scheduled gap the scheduler chose, which *is* what an
interval is. Fallbacks, in order:

1. `nextRepetitionTime - lastRepetitionTime`, when both exist and the result is > 0.
2. Otherwise the gap between the last two reps in `repetitionHistory`.
3. Otherwise `0` — the card is treated as still learning.

RemNote's scheduler is FSRS-derived, so the scheduled interval is a monotone function of stability.
The original computes stage from `median(stabilities)` against day thresholds (21 / 180 / 365); the
derived interval lives on the same scale and in the same units, so **the thresholds carry over
unchanged** and the feel is preserved. `src/data/memory.ts` keeps this behind one function,
`cardStrength()`, so a future SDK that exposes real stability is a one-line change.

**Retrievability.** The original uses the FSRS forgetting curve with each card's own decay. With no
stability and no decay available, Memory Garden applies the same curve to the derived strength with
the FSRS-4.5/5 default decay of `0.5`:

```
R = (1 + F * elapsed / strength) ** -decay,  F = 0.9**(-1/decay) - 1
```

and **flags the result as estimated** (`measured: false`) exactly as the original does when fewer
than half a day's cards have a usable curve. The tooltip says "≈" in that case rather than quietly
presenting a guess as a measurement.

### 2.2 No card state

Derived in `src/data/cards.ts`:

| State | Rule |
|---|---|
| `new` | `repetitionHistory` empty or absent |
| `learning` | has reps but derived interval `< 1 day`, or fewer than 2 non-cram reps |
| `relearning` | `timesWrongInRow > 0`, **or** the most recent non-cram rep scored `AGAIN` |
| `review` | anything else |

`relearning` is what feeds `struggling`, so it matters most; `timesWrongInRow` makes it reliable.

### 2.3 No suspension flag

`BuiltInPowerupCodes.DisableCards = 'u'` exists, so a Rem's cards can be disabled, but `Card` carries
no flag and checking `rem.hasPowerup('u')` for every card would mean one round trip per card — far
too slow at 50k.

**Workaround:** treat a card as effectively inactive when it has reps but
`nextRepetitionTime` is absent or in the distant past beyond a threshold. These cards keep their
place in a day's size and stage (as suspended cards do upstream) but are excluded from health and
recall. Logged in `DECISIONS.md` as a known approximation.

### 2.4 Leeches

RemNote has no leech *tag*, but `QueueInteractionScore.VIEWED_AS_LEECH (2)` appears in the history
when the leech dialog was shown, and `QueueItemType.Leech = 18` exists. Memory Garden counts a card
as a leech if its history contains a `VIEWED_AS_LEECH` score and its current derived interval is
under 21 days (upstream's `CURED_IVL`). Close enough for the "crow" style events; not used for
anything load-bearing.

### 2.5 Decks are folders

Anki's flat deck list becomes RemNote's Rem tree. `rem.isFolder()`, `rem.isDocument()`,
`BuiltInPowerupCodes.Deck = 'de'` and `rem.allRemInFolderQueue()` are the available handles, and
`card.getRem()` gets from a card back to its Rem.

**Workaround:** include/exclude is expressed as a set of **ancestor Rem ids**. Ancestry is resolved
once per *Rem* (not per card) and memoised, so a 50k-card base with 20k Rem costs 20k lookups on a
cold build and nothing on a warm one. When no filter is configured — the default — this whole step
is skipped entirely, which is the fast path almost everyone is on.

### 2.6 No day rollover

Anki's `day_cutoff` has no equivalent. Memory Garden exposes its **own** `dayRolloverHour` setting
(default **4**, matching Anki's default), and all day bucketing goes through
`src/data/day.ts: dayIndex(ts, rolloverHour)`. A review at 00:30 joins the previous day, as upstream.
All day arithmetic is done on **local** calendar days, so DST shifts don't create phantom gaps.

### 2.7 "Nothing was due" days

Upstream reconstructs these with a large recursive SQL query over the whole review log, to keep a
streak alive across days when the user genuinely had nothing to do. Replicating that faithfully in
JS over `repetitionHistory` is possible — each rep's `scheduled` field gives the due date it was
answered against — but it is O(reps) with a sort and would need care to stay fast.

**Workaround:** Memory Garden approximates. A day counts as "free" when no card's `scheduled` date
falls on or before it while still unanswered at that point. This is implemented in
`src/data/freedays.ts` over the already-flattened rep list, so it adds one pass, not a second scan.
More importantly, the **ecosystem health layer makes this far less critical than it is upstream** —
health is a weighted rolling share, not a brittle consecutive-day streak, so one misjudged free day
barely moves it. Excused days (§ pause mode) are the user-facing answer to the same problem.

### 2.8 Deleted cards

Anki keeps a deleted card's reviews in `revlog` forever; RemNote's history lives on the card and
goes with it. A tree can therefore shrink retroactively if you delete cards. Accepted — there is no
API to recover it. Noted in the README so it isn't mistaken for a bug.

---

## 3. Performance: the real constraint

`plugin.card.getAll()` is one bridge call returning every card with its full history. For 50k cards
with ~20 reps each that is on the order of a million objects crossing the plugin boundary. The brief
asks for a first render under 300 ms, which rules out doing this on every widget mount.

**Design:**

1. **One full build, cached.** Results go to `plugin.storage.setLocal` (local, not synced — it is
   derived data and would otherwise sync a large blob between devices for no reason). Settings and
   the study calendar go to `setSynced`, because those are user intent.
2. **Cache key** = `hash(cardCount, maxLastRepetitionTime, rolloverHour, filterSet, startDate)`.
   Matches the brief and is cheap to compute: both inputs come from a single pass.
3. **Incremental recompute.** Only days touched by reps newer than the cached high-water mark are
   rebuilt; everything older is reused. A study session touches one or two days, so the warm path is
   O(reps since last build).
4. **Single pass, typed arrays.** The hot loop over cards and reps allocates no intermediates and
   writes into preallocated `Int32Array`/`Float64Array` buckets indexed by day.
5. **The deep-forest fold** (upstream's `MAX_INDIVIDUAL_TREES = 730`) caps *render* cost independently
   of history length, so a ten-year base draws as fast as a one-year one.

Benchmarked in `src/data/__tests__/bench` against a synthetic 50k-card fixture; timings are logged to
the console behind the debug setting.

---

## 4. Widget placement

From `WidgetLocation`, the three the brief asks for map as:

| Brief | Chosen `WidgetLocation` | Why |
|---|---|---|
| "when the queue is finished / queue screen" | `QueueBelowTopBar` | The only in-queue location that gets real estate and persists across cards. `FlashcardUnder` is per-card and too cramped. The widget self-hides unless the queue is finished, using `plugin.queue.getNumRemainingCards()` and the `QueueExit`/`QueueCompleteCard` events. |
| right-sidebar widget | `RightSidebar` | Exact match. |
| a dedicated Grove page | `Pane` | Opened by command via `plugin.window.openWidgetInPane`. `Pane` gets `{ paneId, contextData }`. |

Also registered: `LearningProgressPage` as a bonus placement — it is semantically the best home for a
study-history visualisation, and costs nothing to add.

Settings use `plugin.settings.register*Setting` for the flat options; the study calendar needs a real
UI, so it is a `Popup` widget opened from a command, with state in synced storage.

## 5. Theming

RemNote injects its own CSS variables into plugin iframes. The widget chrome (panels, tooltips,
borders, fonts) uses `rn-clr-*` utility classes and CSS variables so light/dark follows RemNote
automatically. The canvas itself cannot use CSS variables, so `src/forest/theme.ts` reads the
resolved background colour off the document at mount — the same trick upstream's `pageBg()` uses —
and picks a scenery palette variant to match.
