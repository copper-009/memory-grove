// src/data/day.ts
var MS_PER_DAY = 864e5;
var DEFAULT_ROLLOVER_HOUR = 4;
function dayIndex(ts, rolloverHour = DEFAULT_ROLLOVER_HOUR) {
  const d = new Date(ts - rolloverHour * 36e5);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);
}
function dayToISO(day) {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}
function isoToDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}
function weekday(day) {
  return new Date(day * MS_PER_DAY).getUTCDay();
}

// src/data/rng.ts
function rng(seed) {
  let a = seed | 0;
  return function next() {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function hashInt(h, n) {
  return (Math.imul(h ^ n, 2654435761) ^ h >>> 13) >>> 0;
}
function daySeed(day) {
  return hashStr(`memory-grove-${day}`) & 2147483647;
}

// src/data/fixtures.ts
var AGAIN = 0;
var HARD = 0.5;
var GOOD = 1;
var EASY = 1.5;
var FIXTURES = {
  /** Signed up three days ago. Everything is a seedling; nothing can be measured yet. */
  newbie: { days: 3, newPerDay: [4, 12], studyChance: 1, newChance: 1, lapseRate: 0.1 },
  /** Two years of near-daily study. Ancient plants, every milestone, a deep grove. */
  veteran: { days: 730, newPerDay: [8, 30], studyChance: 0.93, newChance: 0.75, lapseRate: 0.11 },
  /** Studies hard in bursts, then disappears for weeks. Several ponds. */
  gappy: {
    days: 540,
    newPerDay: [5, 25],
    studyChance: 0.85,
    newChance: 0.7,
    lapseRate: 0.13,
    gaps: [
      [500, 30],
      [380, 21],
      [210, 45],
      [90, 16]
    ]
  },
  /** Studies most days but forgets a great deal. Yellowing everywhere. */
  forgetful: { days: 400, newPerDay: [10, 28], studyChance: 0.95, newChance: 0.8, lapseRate: 0.45 },
  /** Weekdays only — the case a relative streak has to treat kindly. */
  weekdays: {
    days: 300,
    newPerDay: [6, 18],
    studyChance: 1,
    newChance: 0.6,
    lapseRate: 0.12,
    skipWeekdays: [0, 6]
  },
  /** Big enough to benchmark against: ~50k cards. */
  huge: { days: 1200, newPerDay: [40, 60], studyChance: 0.96, newChance: 0.97, lapseRate: 0.12 }
};
var LADDER = [1, 3, 7, 16, 35, 70, 140, 260, 420, 650, 900, 1200];
function intervalAt(step) {
  return LADDER[Math.min(step, LADDER.length - 1)];
}
function makeCards(spec, now, rolloverHour = DEFAULT_ROLLOVER_HOUR) {
  const r = rng(spec.seed ?? 1835363695);
  const today = dayIndex(now, rolloverHour);
  const oldest = today - spec.days;
  const inGap = (day) => {
    const ago = today - day;
    return (spec.gaps ?? []).some(([start, len]) => ago <= start && ago > start - len);
  };
  const studyDays = [];
  const isStudyDay = /* @__PURE__ */ new Set();
  for (let day = oldest; day <= today; day++) {
    if (inGap(day))
      continue;
    if (spec.skipWeekdays?.includes(new Date(day * MS_PER_DAY).getUTCDay()))
      continue;
    if (r() > spec.studyChance)
      continue;
    studyDays.push(day);
    isStudyDay.add(day);
  }
  if (studyDays.length === 0)
    return [];
  const nextStudyDay = (day) => {
    if (isStudyDay.has(day))
      return day;
    let lo = 0;
    let hi = studyDays.length - 1;
    let found = null;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      if (studyDays[mid] >= day) {
        found = studyDays[mid];
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return found;
  };
  const tsOf = (day, nth) => (day + 0.4) * MS_PER_DAY + rolloverHour * 36e5 + nth * 9e3;
  const cards = [];
  let id = 0;
  for (const day of studyDays) {
    if (r() > spec.newChance)
      continue;
    const n = spec.newPerDay[0] + Math.floor(r() * (spec.newPerDay[1] - spec.newPerDay[0] + 1));
    for (let k = 0; k < n; k++) {
      const history = [];
      let at = day;
      let step = 0;
      let lastScore = GOOD;
      for (let guard = 0; guard < 40; guard++) {
        const lapse = history.length > 0 && r() < spec.lapseRate;
        lastScore = lapse ? AGAIN : r() < 0.12 ? HARD : r() < 0.85 ? GOOD : EASY;
        const scheduledTs = tsOf(at, k);
        history.push({
          date: scheduledTs,
          score: lastScore,
          responseTime: 2e3 + Math.floor(r() * 9e3),
          scheduled: scheduledTs
        });
        step = lapse ? Math.max(0, step - 2) : step + 1;
        const dueDay = at + intervalAt(step);
        if (dueDay > today) {
          cards.push({
            _id: `c${id}`,
            remId: `r${id >> 2}`,
            createdAt: tsOf(day, k),
            repetitionHistory: history,
            lastRepetitionTime: scheduledTs,
            nextRepetitionTime: tsOf(dueDay, k),
            timesWrongInRow: lastScore === AGAIN ? 1 : 0
          });
          id++;
          break;
        }
        const done = nextStudyDay(dueDay);
        if (done == null) {
          cards.push({
            _id: `c${id}`,
            remId: `r${id >> 2}`,
            createdAt: tsOf(day, k),
            repetitionHistory: history,
            lastRepetitionTime: scheduledTs,
            nextRepetitionTime: tsOf(dueDay, k),
            timesWrongInRow: lastScore === AGAIN ? 1 : 0
          });
          id++;
          break;
        }
        at = done;
      }
    }
  }
  return cards;
}
function fixture(name, now) {
  return makeCards(FIXTURES[name], now);
}
var FIXED_NOW = Date.UTC(2026, 9, 15, 10, 30, 0);

// src/data/memory.ts
var DEFAULT_DECAY = 0.5;
var STABILITY_RECALL = 0.9;
function retrievability(strength, elapsedDays2, decay = DEFAULT_DECAY) {
  if (!(strength > 0))
    return 0;
  if (elapsedDays2 <= 0)
    return 1;
  const d = decay > 0 && decay < 1 ? decay : DEFAULT_DECAY;
  const factor = Math.pow(STABILITY_RECALL, -1 / d) - 1;
  const r = Math.pow(1 + factor * elapsedDays2 / strength, -d);
  return r < 0 ? 0 : r > 1 ? 1 : r;
}
function realReps(card) {
  const h = card.repetitionHistory;
  if (!h || h.length === 0)
    return [];
  let hasCram = false;
  for (let i = 0; i < h.length; i++) {
    if (h[i].isCram) {
      hasCram = true;
      break;
    }
  }
  return hasCram ? h.filter((r) => !r.isCram) : h;
}
function cardStrength(card, reps = realReps(card)) {
  const next = card.nextRepetitionTime;
  const last = card.lastRepetitionTime ?? (reps.length ? reps[reps.length - 1].date : void 0);
  if (next != null && last != null) {
    const days = (next - last) / MS_PER_DAY;
    if (days > 0)
      return days;
  }
  if (reps.length >= 2) {
    const days = (reps[reps.length - 1].date - reps[reps.length - 2].date) / MS_PER_DAY;
    if (days > 0)
      return days;
  }
  return 0;
}
function elapsedDays(card, now, reps = realReps(card)) {
  const last = card.lastRepetitionTime ?? (reps.length ? reps[reps.length - 1].date : void 0);
  if (last == null)
    return 0;
  return Math.max(0, (now - last) / MS_PER_DAY);
}

// src/data/cards.ts
var NOT_A_GRADE = 2;
var AGAIN2 = 0;
var VIEWED_AS_LEECH = 2;
function isGrade(rep) {
  return !rep.isCram && rep.score >= 0 && rep.score < NOT_A_GRADE;
}
var LAPSE_WINDOW_DAYS = 7;
var MATURE_DAYS = 21;
var INACTIVE_OVERDUE_DAYS = 365;
function cardState(card, reps, strength) {
  if (reps.length === 0)
    return "new";
  if ((card.timesWrongInRow ?? 0) > 0)
    return "relearning";
  const last = reps[reps.length - 1];
  if (last.score === AGAIN2)
    return "relearning";
  if (strength < 1 || reps.length < 2)
    return "learning";
  return "review";
}
function emptyCohort(day) {
  return {
    day,
    n: 0,
    learning: 0,
    strengths: [],
    struggling: 0,
    inactive: 0,
    recall: [],
    leeches: 0,
    mature: 0
  };
}
function scanCards(cards, opts) {
  const { now, rolloverHour, startDay, excludedRemIds, includedRemIds } = opts;
  const today = dayIndex(now, rolloverHour);
  const filtering = excludedRemIds && excludedRemIds.size > 0 || !!includedRemIds;
  const cohorts = /* @__PURE__ */ new Map();
  const dayReviews = /* @__PURE__ */ new Map();
  const dayTime = /* @__PURE__ */ new Map();
  const dueByDay = /* @__PURE__ */ new Map();
  let totalReviews = 0;
  let overdue = 0;
  let newestRep = 0;
  let counted = 0;
  const lapseCutoff = now - LAPSE_WINDOW_DAYS * MS_PER_DAY;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (filtering) {
      const rid = card.remId;
      if (excludedRemIds && excludedRemIds.has(rid))
        continue;
      if (includedRemIds && !includedRemIds.has(rid))
        continue;
    }
    const reps = realReps(card);
    let firstGraded = -1;
    for (let k = 0; k < reps.length; k++) {
      const rep = reps[k];
      if (!isGrade(rep))
        continue;
      if (rep.date > newestRep)
        newestRep = rep.date;
      const d = dayIndex(rep.date, rolloverHour);
      if (startDay != null && d < startDay)
        continue;
      if (firstGraded < 0)
        firstGraded = d;
      if (d > today)
        continue;
      dayReviews.set(d, (dayReviews.get(d) ?? 0) + 1);
      totalReviews++;
      if (rep.responseTime) {
        dayTime.set(d, (dayTime.get(d) ?? 0) + rep.responseTime / 1e3);
      }
    }
    const next = card.nextRepetitionTime;
    if (next != null && reps.length > 0) {
      const dueDay = dayIndex(next, rolloverHour);
      if (dueDay <= today)
        overdue++;
      else
        dueByDay.set(dueDay, (dueByDay.get(dueDay) ?? 0) + 1);
    }
    counted++;
    if (firstGraded < 0)
      continue;
    const cohort = cohorts.get(firstGraded) ?? emptyCohort(firstGraded);
    if (cohort.n === 0)
      cohorts.set(firstGraded, cohort);
    cohort.n++;
    const strength = cardStrength(card, reps);
    const state = cardState(card, reps, strength);
    if (state === "learning" || state === "new") {
      cohort.learning++;
    } else {
      cohort.strengths.push(strength);
      if (strength >= MATURE_DAYS)
        cohort.mature++;
    }
    const inactive = reps.length > 0 && (next == null || now - next > INACTIVE_OVERDUE_DAYS * MS_PER_DAY);
    if (inactive) {
      cohort.inactive++;
      continue;
    }
    let lapsedRecently = false;
    let leechMarked = false;
    for (let k = reps.length - 1; k >= 0; k--) {
      const rep = reps[k];
      if (rep.score === VIEWED_AS_LEECH)
        leechMarked = true;
      if (rep.date < lapseCutoff)
        break;
      if (rep.score === AGAIN2)
        lapsedRecently = true;
    }
    if (state === "relearning" || lapsedRecently)
      cohort.struggling++;
    if (leechMarked && strength < MATURE_DAYS)
      cohort.leeches++;
    if (strength > 0) {
      cohort.recall.push(retrievability(strength, elapsedDays(card, now, reps)));
    }
  }
  return {
    cohorts,
    dayReviews,
    dayTime,
    dueByDay,
    totalReviews,
    todayReviews: dayReviews.get(today) ?? 0,
    overdue,
    today,
    newestRep,
    cardCount: counted
  };
}

// src/data/types.ts
var STAGE_HEIGHT = [4, 8, 13, 19, 27, 38];

// src/data/forest.ts
var OLD_DAYS = 180;
var ANCIENT_DAYS = 365;
var SAPLING_LEARNING_SHARE = 0.5;
var CROWN_SIZE_CARDS = [15, 40];
var HEALTH_THRESHOLDS = [0.12, 0.25, 0.45];
var HEALTH_MIN_STAGE = 3 /* Mature */;
var DEFAULT_BREAK_DAYS = 14;
var MAX_INDIVIDUAL_PLANTS = 730;
var PLANT_VARIANTS = 4;
function median(values) {
  if (values.length === 0)
    return 0;
  const v = Array.from(values).sort((a, b) => a - b);
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
function stageFor(strengths, learningShare, isToday) {
  if (isToday)
    return 0 /* Seedling */;
  if (strengths.length === 0 || learningShare > SAPLING_LEARNING_SHARE)
    return 1 /* Sapling */;
  const m = median(strengths);
  if (m >= ANCIENT_DAYS)
    return 5 /* Ancient */;
  if (m >= OLD_DAYS)
    return 4 /* Old */;
  if (m >= MATURE_DAYS)
    return 3 /* Mature */;
  return 2 /* Young */;
}
function healthFor(strugglingShare) {
  let level = 0;
  for (const t of HEALTH_THRESHOLDS)
    if (strugglingShare >= t)
      level++;
  return level;
}
function sizeFor(n) {
  return n < CROWN_SIZE_CARDS[0] ? 0 : n < CROWN_SIZE_CARDS[1] ? 1 : 2;
}
function makePlant(cohort, today) {
  const ago = today - cohort.day;
  const seed = daySeed(cohort.day);
  const active = cohort.n - cohort.inactive;
  const stage = stageFor(cohort.strengths, cohort.learning / cohort.n, ago === 0);
  const health = active > 0 && stage >= HEALTH_MIN_STAGE ? healthFor(cohort.struggling / active) : 0;
  const measured = active > 0 && cohort.recall.length >= active / 2;
  const remembered = cohort.recall.length > 0 ? cohort.recall.reduce((a, b) => a + b, 0) / cohort.recall.length : active > 0 ? 1 - cohort.struggling / active : 1;
  return {
    day: cohort.day,
    ago,
    date: dayToISO(cohort.day),
    n: cohort.n,
    stage,
    size: sizeFor(cohort.n),
    health,
    // A roll, not an index: the region pack mods it by its own species count, so switching
    // regions re-skins every plant without moving any of them.
    species: seed % 1024,
    seed,
    remembered: Math.round(remembered * 1e3) / 1e3,
    strength: Math.round(median(cohort.strengths) * 10) / 10,
    struggling: cohort.struggling,
    measured,
    mature: cohort.mature,
    variant: seed % PLANT_VARIANTS
  };
}
function streaks(reviewDays, today, excused = /* @__PURE__ */ new Set()) {
  if (reviewDays.size === 0)
    return { current: 0, longest: 0 };
  let current = 0;
  for (let d = today; ; d--) {
    if (reviewDays.has(d)) {
      current++;
      continue;
    }
    if (d === today || excused.has(d))
      continue;
    break;
  }
  let oldest = today;
  for (const d of reviewDays)
    if (d < oldest)
      oldest = d;
  let longest = 0;
  let run = 0;
  for (let d = oldest; d <= today; d++) {
    if (reviewDays.has(d))
      run++;
    else if (!excused.has(d))
      run = 0;
    if (run > longest)
      longest = run;
  }
  return { current, longest };
}
function findBreaks(reviewDays, oldest, today, minDays, excused = /* @__PURE__ */ new Set()) {
  const out = [];
  let gap = 0;
  for (let d = oldest; d <= today; d++) {
    if (reviewDays.has(d)) {
      if (gap >= minDays)
        out.push([d, gap]);
      gap = 0;
    } else if (!excused.has(d)) {
      gap++;
    }
  }
  return out;
}
function markPonds(plants, breaks) {
  const ponds = [];
  for (const [resumed, length] of breaks) {
    let i = plants.findIndex((p) => p.day >= resumed);
    if (i < 0)
      i = plants.length;
    const prev = ponds[ponds.length - 1];
    if (prev && i <= prev[0] + 1) {
      prev[1] += length;
      prev[3] = resumed - 1;
    } else {
      ponds.push([i, length, resumed - length, resumed - 1]);
    }
  }
  for (const [i, days, began, ended] of ponds) {
    const plant = plants[Math.min(i, plants.length - 1)];
    if (!plant)
      continue;
    plant.gap = days;
    plant.gapFrom = dayToISO(began);
    plant.gapTo = dayToISO(ended);
  }
}
function buildGrove(scan, opts = {}) {
  const breakDays = opts.breakDays ?? DEFAULT_BREAK_DAYS;
  const excused = opts.excusedDays ?? /* @__PURE__ */ new Set();
  const today = scan.today;
  const plants = [];
  const days = Array.from(scan.cohorts.keys()).sort((a, b) => a - b);
  for (const d of days) {
    const cohort = scan.cohorts.get(d);
    if (cohort)
      plants.push(makePlant(cohort, today));
  }
  const reviewDays = new Set(scan.dayReviews.keys());
  if (plants.length > 0) {
    markPonds(plants, findBreaks(reviewDays, plants[0].day, today, breakDays, excused));
  }
  const { current, longest } = streaks(reviewDays, today, excused);
  const stats = statsFor(plants, {
    streak: current,
    longestStreak: longest,
    reviews: scan.totalReviews,
    todayReviews: scan.todayReviews,
    activeStudyDays: reviewDays.size
  });
  return {
    plants,
    stats,
    seed: plants.length ? plants[0].seed : 0,
    reviewDays,
    dayReviews: scan.dayReviews,
    dayTime: scan.dayTime,
    today
  };
}
function statsFor(plants, extra) {
  let cards = 0;
  let ancient = 0;
  let old = 0;
  let young = 0;
  let ailing = 0;
  let ponds = 0;
  let matureCards = 0;
  for (const p of plants) {
    cards += p.n;
    if (p.stage === 5 /* Ancient */)
      ancient++;
    else if (p.stage === 4 /* Old */)
      old++;
    else if (p.stage === 2 /* Young */)
      young++;
    if (p.health > 0)
      ailing++;
    if (p.gap)
      ponds++;
    matureCards += p.mature;
  }
  const last = plants[plants.length - 1];
  return {
    plants: plants.length,
    cards,
    ancient,
    old,
    young,
    ailing,
    ponds,
    matureCards,
    groveAge: plants.length ? plants[0].ago : 0,
    oldestDate: plants.length ? plants[0].date : null,
    plantedToday: !!last && last.ago === 0,
    todayCards: last && last.ago === 0 ? last.n : 0,
    ...extra
  };
}
function mergeOld(grove, limit = MAX_INDIVIDUAL_PLANTS) {
  const plants = grove.plants;
  if (plants.length <= limit)
    return grove;
  const cut = plants.length - limit;
  const old = plants.slice(0, cut);
  const kept = plants.slice(cut);
  const merged = {
    count: old.length,
    cards: old.reduce((a, p) => a + p.n, 0),
    ancient: old.filter((p) => p.stage === 5 /* Ancient */).length,
    ponds: old.filter((p) => p.gap).length,
    fromDate: old[0].date,
    toDate: old[old.length - 1].date,
    fromAgo: old[0].ago,
    toAgo: old[old.length - 1].ago
  };
  return { ...grove, plants: kept, merged };
}

// src/data/calendar.ts
var DEFAULT_RECOVERY_GRACE_DAYS = 7;
function emptyCalendar() {
  return {
    version: 1,
    periods: [],
    outsidePeriodsExcused: false,
    excusedWeekdays: [],
    oneOff: [],
    unexcused: [],
    holidays: [],
    holidaysEnabled: false,
    boostWeeks: [],
    recoveryGraceDays: DEFAULT_RECOVERY_GRACE_DAYS
  };
}
function inRange(day, r) {
  return day >= isoToDay(r.from) && day <= isoToDay(r.to);
}
function pauseCovers(pause, day) {
  if (!pause)
    return false;
  if (day < isoToDay(pause.from))
    return false;
  return pause.until == null || day <= isoToDay(pause.until);
}
function pauseActive(cal, today) {
  return pauseCovers(cal.pause, today);
}
function isExcused(cal, day) {
  const iso = dayToISO(day);
  if (cal.unexcused.includes(iso))
    return false;
  if (pauseCovers(cal.pause, day))
    return true;
  if (cal.oneOff.includes(iso))
    return true;
  if (cal.holidaysEnabled && cal.holidays.includes(iso))
    return true;
  if (cal.excusedWeekdays.includes(weekday(day)))
    return true;
  if (cal.periods.length > 0) {
    for (const p of cal.periods) {
      if (day >= isoToDay(p.from) && day <= isoToDay(p.to)) {
        return p.breaks.some((b) => inRange(day, b));
      }
    }
    if (cal.outsidePeriodsExcused)
      return true;
  }
  return false;
}
function isBoosted(cal, day) {
  return cal.boostWeeks.some((r) => inRange(day, r));
}

// src/data/health.ts
var SEVERITY_PROFILES = {
  // Nothing visibly declines; the score still exists and still slows growth.
  peaceful: { window: 28, decay: 0.03, recovery: 0.35, graceDays: 3, graceRefillDays: 4, visualGain: 0 },
  // The default: a mild decline that recovers quickly.
  gentle: { window: 28, decay: 0.07, recovery: 0.3, graceDays: 2, graceRefillDays: 7, visualGain: 0.55 },
  // Noticeable: creatures start hiding.
  wild: { window: 28, decay: 0.12, recovery: 0.22, graceDays: 1, graceRefillDays: 10, visualGain: 1 },
  // Strong decline, slow recovery — but recovery is always possible.
  merciless: { window: 42, decay: 0.2, recovery: 0.1, graceDays: 0, graceRefillDays: 0, visualGain: 1.35 }
};
var BOOST_GAIN = 1.3;
var RUN_MAX = 4;
var SMOOTH_DAYS = 7;
var BACKLOG_WEIGHT = 0.25;
var BACKLOG_FLOOR = 20;
function profileFor(severity, custom) {
  if (severity === "custom") {
    return { ...SEVERITY_PROFILES.gentle, ...custom };
  }
  return SEVERITY_PROFILES[severity];
}
function simulate(input, profile) {
  const { today, reviewDays, calendar } = input;
  const cal = calendar;
  const days = [];
  let excused = 0;
  const limit = today - 366;
  for (let d = today; d > limit && days.length < profile.window; d--) {
    const didStudy = reviewDays.has(d);
    if (!didStudy && isExcused(cal, d)) {
      excused++;
      continue;
    }
    if (d === today && !didStudy)
      continue;
    days.push({ day: d, studied: didStudy });
  }
  days.reverse();
  let h = 100;
  let run = 0;
  let studied = 0;
  let credit = profile.graceDays;
  const refill = profile.graceRefillDays > 0 ? 1 / profile.graceRefillDays : 0;
  const series = [];
  for (const { day, studied: didStudy } of days) {
    if (didStudy) {
      studied++;
      run = 0;
      credit = Math.min(profile.graceDays, credit + refill);
      const gain = profile.recovery * (isBoosted(cal, day) ? BOOST_GAIN : 1);
      h += (100 - h) * Math.min(1, gain);
    } else {
      run++;
      if (credit >= 1) {
        credit -= 1;
      } else {
        h -= h * profile.decay * Math.min(Math.max(1, run - 1), RUN_MAX);
      }
    }
    h = h < 0 ? 0 : h > 100 ? 100 : h;
    series.push(h);
  }
  return { series, studied, excused };
}
function backlogScore(input) {
  const { overdue, totalCards, calendar, today } = input;
  let baseline = 0;
  const pause = calendar.pause;
  if (pause) {
    const endsIso = pause.until;
    const paused = pauseCovers(pause, today);
    const end = endsIso != null ? isoToDay(endsIso) : null;
    const inGrace = !paused && end != null && today <= end + calendar.recoveryGraceDays;
    if (paused || inGrace)
      baseline = pause.backlogAtStart ?? overdue;
  }
  const excess = Math.max(0, overdue - baseline - BACKLOG_FLOOR);
  if (excess <= 0)
    return 1;
  const tolerance = Math.max(BACKLOG_FLOOR * 4, totalCards * 0.2);
  return Math.max(0, 1 - excess / tolerance);
}
function ecosystemHealth(input) {
  const profile = profileFor(input.severity, input.custom);
  const { series, studied, excused } = simulate(input, profile);
  const consistency = meanOfLast(series, SMOOTH_DAYS);
  const backlog = backlogScore(input);
  const score = consistency * (1 - BACKLOG_WEIGHT + BACKLOG_WEIGHT * backlog);
  const previous = meanOfLast(series.slice(0, Math.max(0, series.length - SMOOTH_DAYS)), SMOOTH_DAYS);
  const trend = series.length > SMOOTH_DAYS ? consistency - previous : 0;
  const visual = Math.max(0, Math.min(100, 100 - (100 - score) * profile.visualGain));
  const paused = pauseActive(input.calendar, input.today);
  return {
    score: Math.round(score * 10) / 10,
    visual: Math.round(visual * 10) / 10,
    consistency: Math.round(consistency * 10) / 10,
    backlog: Math.round(backlog * 100) / 100,
    trend: Math.round(trend * 10) / 10,
    studied,
    counted: series.length,
    excused,
    paused,
    advice: adviceFor({ score, backlog, trend, studied, counted: series.length, paused })
  };
}
function meanOfLast(series, n) {
  if (series.length === 0)
    return 100;
  const from = Math.max(0, series.length - n);
  let sum = 0;
  for (let i = from; i < series.length; i++)
    sum += series[i];
  return sum / (series.length - from);
}
function adviceFor(r) {
  if (r.paused)
    return "On a break. Nothing is counting against you.";
  if (r.counted === 0)
    return "Study once to get started.";
  if (r.score >= 95)
    return "Thriving. Keep going.";
  if (r.backlog < 0.7)
    return "Working through the overdue cards would help most.";
  if (r.trend < -3)
    return "A few days missed lately. One session turns it around.";
  if (r.score < 50)
    return "Studying on most days is what brings this back.";
  return "Steady. A few more days in a row would lift it.";
}
function healthBand(visual) {
  if (visual >= 85)
    return "thriving";
  if (visual >= 65)
    return "healthy";
  if (visual >= 40)
    return "tired";
  return "struggling";
}

// src/data/milestones.ts
var SLOT_REQUIREMENTS = [7, 30, 75, 150, 300];
var CABIN_AGE_DAYS = 365;
var LIFE_STAGE_DAYS = [0, 21, 60, 150];
function unlockedSlots(activeStudyDays) {
  let n = 0;
  for (const need of SLOT_REQUIREMENTS)
    if (activeStudyDays >= need)
      n++;
  return n;
}
function lifeStageFor(ageInStudyDays) {
  let stage = 0;
  for (let i = 0; i < LIFE_STAGE_DAYS.length; i++) {
    if (ageInStudyDays >= LIFE_STAGE_DAYS[i])
      stage = i;
  }
  return stage;
}
function hasCabin(stats) {
  return stats.groveAge >= CABIN_AGE_DAYS;
}
function emptyRoster() {
  return { version: 1, creatures: [] };
}
function updateRoster(roster, activeStudyDays, stats, today) {
  const want = unlockedSlots(activeStudyDays);
  const have = new Set(roster.creatures.map((c) => c.slot));
  let creatures = roster.creatures;
  for (let slot = 0; slot < want; slot++) {
    if (have.has(slot))
      continue;
    if (creatures === roster.creatures)
      creatures = [...creatures];
    creatures.push({
      slot,
      arrivedDay: today,
      // Back-date to the milestone itself, so a creature earned long before the plugin
      // was first opened is not born today with an age of zero.
      activeDaysAtArrival: SLOT_REQUIREMENTS[slot],
      names: {}
    });
  }
  const cabinDay = roster.cabinDay ?? (hasCabin(stats) ? today : void 0);
  if (creatures === roster.creatures && cabinDay === roster.cabinDay)
    return roster;
  return { ...roster, creatures: creatures.sort((a, b) => a.slot - b.slot), cabinDay };
}
function creatureAge(save, activeStudyDays) {
  return Math.max(0, activeStudyDays - save.activeDaysAtArrival);
}
function creatureMood(health, opts) {
  if (opts.paused)
    return "asleep";
  if (opts.nocturnal && !opts.night)
    return "asleep";
  if (health < 30)
    return "hidden";
  if (health < 50)
    return "tired";
  if (opts.sleepy)
    return "resting";
  if (health < 70)
    return "resting";
  return "active";
}

// src/forest/color.ts
function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function toHex(c) {
  return "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function mixHex(a, b, t) {
  return toHex(mix(hex(a), hex(b), t));
}
function luminance(c) {
  return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
}
var BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// src/forest/layout.ts
var HORIZON = 0.42;
var GROUND_BOTTOM = 0.965;
var ROWS_TOP = 0.045;
var SLOT_MARGIN = 0.02;
var SLOT_SPAN = 0.96;
var FAR_SCALE = 0.68;
var NEAR_GAIN = 0.32;
var POND_DAYS_PER_SLOT = 10;
var POND_SLOTS = [2, 4];
var POND_APART = 3;
var X_JITTER = 0.7;
var Y_JITTER = 0.6;
var SINGLE_ROW_NEAREST = 0.3;
var ZOOM_FULL_LOG = 7;
var ZOOM_PER_LOG = 0.15;
var ZOOM_MAX = 1.8;
var ROW_SPREAD = 1.6;
var ROW_MIN = 10;
var ROW_MAX = 34;
var ROW_MAX_BIG = 52;
var BIG_FOREST_ITEMS = 500;
function isPond(item) {
  return "pond" in item && item.pond === true;
}
function layoutGrove(plants) {
  const items = [];
  plants.forEach((p, i) => {
    if (p.gap) {
      const slots = clamp(Math.ceil(p.gap / POND_DAYS_PER_SLOT), POND_SLOTS[0], POND_SLOTS[1]);
      for (let k = 0; k < slots; k++) {
        items.push({
          pond: true,
          group: i,
          days: p.gap,
          from: p.gapFrom,
          to: p.gapTo,
          slots,
          first: k === 0,
          seed: (p.seed ^ k * 7919 + 17) >>> 0,
          cell: 0,
          row: 0,
          fromFront: 0,
          depth: 0,
          x: 0,
          jy: 0,
          rowGap: 0
        });
      }
    }
    items.push({ ...p, pond: false, index: i, cell: 0, row: 0, fromFront: 0, depth: 0, x: 0, jy: 0, rowGap: 0 });
  });
  const n = items.length;
  const perRow = clamp(Math.round(Math.sqrt(n) * ROW_SPREAD), ROW_MIN, n > BIG_FOREST_ITEMS ? ROW_MAX_BIG : ROW_MAX);
  const reserved = /* @__PURE__ */ new Set();
  const water = /* @__PURE__ */ new Set();
  let cell = 0;
  const free = (c) => {
    while (reserved.has(c))
      c++;
    return c;
  };
  const crowded = (c, slots) => {
    const r = Math.floor(c / perRow);
    const c0 = c % perRow;
    for (let dr = -POND_APART; dr <= POND_APART; dr++) {
      for (let dc = -1; dc <= slots; dc++) {
        const cc = c0 + dc;
        if (cc >= 0 && cc < perRow && water.has((r + dr) * perRow + cc))
          return true;
      }
    }
    return false;
  };
  const fits = (c, slots) => {
    for (let k = 0; k < slots; k++) {
      if (reserved.has(c + k) || (c + k) % perRow < c % perRow)
        return false;
    }
    return !crowded(c, slots);
  };
  const put2 = (it) => {
    it.cell = cell;
    if (isPond(it)) {
      water.add(cell);
      const r = Math.floor(cell / perRow);
      const c = cell % perRow;
      reserved.add((r + 1) * perRow + c);
      reserved.add((r + 2) * perRow + c);
      if (it.first && c > 0)
        reserved.add(cell - 1);
    }
    cell++;
  };
  const units = [];
  const waiting = [];
  for (const it of items) {
    if (isPond(it) && !it.first)
      units[units.length - 1].push(it);
    else
      units.push([it]);
  }
  const tryWaiting = () => {
    for (let k = 0; k < waiting.length; k++) {
      cell = free(cell);
      if (fits(cell, waiting[k].length)) {
        waiting.splice(k, 1)[0].forEach(put2);
        k = -1;
      }
    }
  };
  for (const unit of units) {
    tryWaiting();
    cell = free(cell);
    const head = unit[0];
    if (!isPond(head))
      put2(head);
    else if (fits(cell, unit.length))
      unit.forEach(put2);
    else
      waiting.push(unit);
  }
  for (const unit of waiting) {
    cell = free(cell);
    while (!fits(cell, unit.length))
      cell = free(cell + 1);
    unit.forEach(put2);
  }
  const rows = Math.max(1, Math.ceil(cell / perRow));
  const single = rows === 1;
  items.forEach((it, i) => {
    const row = Math.floor(it.cell / perRow);
    const col = it.cell % perRow;
    const r = rng(it.seed || i + 1);
    it.row = row;
    it.fromFront = rows - 1 - row;
    it.depth = rows === 1 ? 1 : row / (rows - 1);
    const c = single ? col + (perRow - n) / 2 : col;
    it.x = (c + 0.5 + (r() - 0.5) * X_JITTER + (row % 2 ? 0.5 : 0)) / (perRow + 0.5);
    it.jy = (r() - 0.5) * Y_JITTER;
    it.rowGap = rows > 1 ? 1 / (rows - 1) : 0;
    if (single)
      it.depth = SINGLE_ROW_NEAREST + (1 - SINGLE_ROW_NEAREST) * r();
  });
  const zoom = clamp(1 + (ZOOM_FULL_LOG - Math.log2(Math.max(2, plants.length))) * ZOOM_PER_LOG, 1, ZOOM_MAX);
  return { items, perRow, rows, zoom };
}
function placeItem(it, W, H, horizonY, groundBottom = GROUND_BOTTOM) {
  const hor = horizonY ?? H * HORIZON;
  const top = hor + H * ROWS_TOP;
  const bot = H * groundBottom;
  const x = (SLOT_MARGIN + SLOT_SPAN * it.x) * W;
  const y = top + (bot - top) * clamp(Math.pow(it.depth, 1.1) + it.jy * it.rowGap, 0, 1);
  const scale = FAR_SCALE + NEAR_GAIN * it.depth;
  const haze = 1 - it.depth;
  return { x, y, scale, haze };
}

// src/forest/theme.ts
var TIMES = {
  dawn: {
    sky: ["#b3bcd8", "#cbc3dc", "#e3c8d4", "#f1cfc2", "#f7dcc0", "#fae8cf"],
    orb: { kind: "sun", x: 0.3, y: 0.3, r: 8, color: "#fff6dc", glow: "#fbe6c6", halo: 7 },
    far: "#b7b2cb",
    near: "#9ea8b8",
    ground0: "#9ab28e",
    ground1: "#628463",
    grass: "#86a47e",
    haze: "#eadfd3",
    hazeStep: 0.13,
    water: "#c3c6dc",
    tint: "#c8a8b8",
    tintAmount: 0.12,
    rim: "#f6c9b8",
    shadow: 0.6,
    clouds: { n: 4, top: "#fff6ee", bot: "#e7d5da", alpha: 230 }
  },
  day: {
    sky: ["#6aa6d8", "#82b6df", "#9cc6e6", "#b5d4ea", "#cde0ea", "#e0ebe8"],
    orb: { kind: "sun", x: 0.8, y: 0.13, r: 7, color: "#fffbe6", glow: "#fff3c4", halo: 5 },
    far: "#9ab0c4",
    near: "#7c9c96",
    ground0: "#6f9a58",
    ground1: "#446c3c",
    grass: "#86b068",
    haze: "#c6d8dc",
    hazeStep: 0.12,
    water: "#8fbcd8",
    clouds: { n: 5, top: "#ffffff", bot: "#dfe8ef", alpha: 240 }
  },
  goldenHour: {
    sky: ["#6f93c0", "#9aaec4", "#d4bca0", "#efc48c", "#f7d49a", "#fbe2b0"],
    orb: { kind: "sun", x: 0.78, y: 0.15, r: 7, color: "#fff0c8", glow: "#ffd99a", halo: 5 },
    far: "#a898a6",
    near: "#8a8c84",
    ground0: "#7f9c50",
    ground1: "#4d6a36",
    grass: "#a0b460",
    haze: "#ead2ac",
    hazeStep: 0.12,
    water: "#b0a890",
    tint: "#e0a060",
    tintAmount: 0.06,
    rim: "#ffac8a",
    shadow: 0.9,
    clouds: { n: 4, top: "#fff0d8", bot: "#e8c0a0", alpha: 235 }
  },
  dusk: {
    sky: ["#1f2b47", "#34436a", "#5e5f86", "#9a7a93", "#d49a8a", "#eebf98"],
    orb: { kind: "sun", x: 0.72, y: 0.35, r: 7, color: "#f8dca8", glow: "#f6d3a0", halo: 4 },
    far: "#6c6a8e",
    near: "#4b5670",
    ground0: "#4a6448",
    ground1: "#2a4230",
    grass: "#3f6446",
    haze: "#9a93ad",
    hazeStep: 0.12,
    water: "#7d78a0",
    tint: "#5a3f5e",
    tintAmount: 0.22,
    rim: "#f2b57a",
    shadow: 1,
    clouds: { n: 5, top: "#f3cbb7", bot: "#c79fae", alpha: 235 }
  },
  night: {
    sky: ["#060a18", "#0b1430", "#131f45", "#1c2a58", "#263666", "#324476"],
    orb: { kind: "moon", x: 0.22, y: 0.17, r: 7, color: "#eef1f8", glow: "#5b6d9c", halo: 5 },
    far: "#1d2848",
    near: "#162140",
    ground0: "#1a2b2d",
    ground1: "#101b1d",
    grass: "#22383a",
    haze: "#2a3560",
    hazeStep: 0.1,
    water: "#1d2a4a",
    tint: "#141d3c",
    tintAmount: 0.45,
    clouds: { n: 3, top: "#2c3766", bot: "#222b54", alpha: 200 },
    stars: 90
  }
};
var MAX_FLIES = 60;
var REVIEWS_PER_BIRD = 40;
var MAX_BIRDS = 6;
var CLOUDY_STARS_SHARE = 0.3;
function pickBackdrop(backdrops, isNight, seed = 0) {
  const pool = backdrops.filter((b) => !!b.night === isNight);
  const list = pool.length ? pool : backdrops;
  if (list.length === 0)
    return void 0;
  return list[Math.abs(seed) % list.length];
}
function buildTheme(mood, ambience, backdrop) {
  const base = TIMES[mood.time];
  const night = mood.time === "night";
  const sky = backdrop ? [...backdrop.sky] : [...base.sky];
  const far = backdrop?.far ?? base.far;
  const near = backdrop?.near ?? base.near;
  const th = {
    sky,
    orb: base.orb ? { ...base.orb, phase: mood.moonPhase } : null,
    far,
    near,
    ground0: base.ground0,
    ground1: base.ground1,
    grass: base.grass,
    haze: base.haze,
    hazeStep: base.hazeStep,
    water: base.water,
    tint: base.tint ?? null,
    tintAmount: base.tintAmount ?? 0,
    rim: base.rim ?? null,
    clouds: { ...base.clouds },
    stars: base.stars ?? 0,
    flies: 0,
    birds: 0,
    snow: false,
    deepSnow: false,
    rain: 0,
    snowfall: 0,
    fog: null,
    rainbow: false,
    lightning: false,
    flat: false,
    shadow: base.shadow ?? 0,
    hillForm: backdrop?.form ?? "rolling"
  };
  const w = mood.weather;
  const calm = w === "clear" || w === "cloudy" || w === "afterRain";
  const clearSky = w === "clear" || w === "afterRain";
  if (calm && (night || mood.time === "dusk"))
    th.flies = clamp(ambience.streak, 0, MAX_FLIES);
  if (calm && !night)
    th.birds = clamp(Math.ceil(ambience.todayReviews / REVIEWS_PER_BIRD), 0, MAX_BIRDS);
  if (!clearSky)
    th.stars = w === "cloudy" ? Math.round(th.stars * CLOUDY_STARS_SHARE) : 0;
  if (w === "cloudy") {
    th.sky = th.sky.map((c) => mixHex(c, night ? "#1a2030" : "#9aa3ad", 0.6));
    if (th.orb)
      th.orb = { ...th.orb, halo: 0, color: mixHex(th.orb.color, th.sky[2], 0.6) };
    th.flat = true;
    th.rim = null;
    th.shadow = 0;
  } else if (w === "rain" || w === "storm") {
    const grey = night ? "#10151c" : w === "storm" ? "#3c464e" : "#56626b";
    th.sky = th.sky.map((c) => mixHex(c, grey, w === "storm" ? 0.65 : 0.5));
    th.far = mixHex(th.far, grey, 0.4);
    th.near = mixHex(th.near, grey, 0.4);
    th.ground0 = mixHex(th.ground0, "#33443a", 0.25);
    th.ground1 = mixHex(th.ground1, "#33443a", 0.25);
    th.grass = mixHex(th.grass, "#33443a", 0.25);
    th.haze = mixHex(th.haze, grey, 0.5);
    th.rain = w === "storm" ? 320 : 260;
    th.lightning = w === "storm";
    th.orb = null;
    th.rim = null;
    th.shadow = 0;
  } else if (w === "fog") {
    const fogC = night ? "#3a4458" : "#dcdcd8";
    th.sky = th.sky.map((c) => mixHex(c, fogC, 0.55));
    th.far = mixHex(th.far, fogC, 0.5);
    th.near = mixHex(th.near, fogC, 0.5);
    th.haze = fogC;
    th.hazeStep *= 1.25;
    th.fog = mixHex(fogC, "#ffffff", night ? 0.1 : 0.3);
    th.clouds = null;
    th.rim = null;
    th.shadow = 0;
  } else if (w === "snow") {
    th.sky = th.sky.map((c) => mixHex(c, night ? "#26314a" : "#c9d2df", 0.45));
    th.ground0 = night ? "#61789a" : "#e8eef6";
    th.ground1 = night ? "#34465e" : "#cbd6e4";
    th.grass = night ? "#7890ac" : "#dfe7f1";
    th.snow = true;
    th.snowfall = 190;
    th.water = night ? "#40506c" : "#c9d6e6";
    th.shadow = 0;
    if (th.orb && th.orb.kind === "sun")
      th.orb = { ...th.orb, halo: 0, color: mixHex(th.orb.color, th.sky[2], 0.6) };
  } else if (w === "afterRain") {
    th.sky = th.sky.map((c) => mixHex(c, "#b8bcc8", 0.18));
    th.rainbow = !night;
    th.rain = 36;
  }
  return th;
}

// src/forest/plantSprite.ts
var DYING_HOLES = 0.18;
var SICK_SHARE = { 0: 0, 1: 0.38, 2: 0.62, 3: 0.85 };
var HEALTH_MIN_STAGE2 = 3 /* Mature */;
var SEEDLING_SIZE = 7;
var PINE_W = [0.46, 0.54, 0.62];
var BROAD_W = [0.66, 0.8, 0.94];
var ANCIENT_W = [0.9, 0.98, 1.04];
var TRUNK_LIGHT = 8;
var TRUNK_MID = 9;
var TRUNK_DARK = 10;
function makeTone(w, h) {
  return { w, h, tone: new Int8Array(w * h).fill(-1) };
}
function set(tm, x, y, v) {
  if (x < 0 || y < 0 || x >= tm.w || y >= tm.h)
    return;
  tm.tone[y * tm.w + x] = v;
}
function get(tm, x, y) {
  if (x < 0 || y < 0 || x >= tm.w || y >= tm.h)
    return -1;
  return tm.tone[y * tm.w + x];
}
function roundCrown(tm, w, top, ch, cx, blobsN, r, hole) {
  const rx = w / 2;
  const ry = ch / 2;
  const ccx = cx + 0.5;
  const ccy = top + ry - 0.5;
  const blobs = [{ x: ccx, y: ccy, sx: rx * 0.86, sy: ry * 0.86 }];
  for (let k = 0; k < blobsN; k++) {
    const a = -Math.PI / 2 + k / blobsN * Math.PI * 2 + r() * 0.6;
    blobs.push({ x: ccx + Math.cos(a) * rx * 0.5, y: ccy + Math.sin(a) * ry * 0.5, sx: rx * 0.52, sy: ry * 0.52 });
  }
  for (let y = 0; y < tm.h; y++) {
    for (let x = 0; x < tm.w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let best = -9;
      for (const b of blobs) {
        const nx = (px - b.x) / b.sx;
        const ny = (py - b.y) / b.sy;
        if (nx * nx + ny * ny <= 1)
          best = Math.max(best, -(nx * 0.6 + ny * 0.8));
      }
      if (best === -9)
        continue;
      if (hole && r() < hole)
        continue;
      const l = 0.55 * best + 0.45 * -((px - ccx) / rx * 0.5 + (py - ccy) / ry * 0.7) + (r() - 0.5) * 0.3;
      set(tm, x, y, l > 0.5 ? 4 : l > 0.15 ? 3 : l > -0.3 ? 2 : 1);
    }
  }
}
function pineCrown(tm, w, top, ch, cx, tiers, r, hole) {
  for (let y = top; y < top + ch; y++) {
    const p = (y - top + 0.5) / ch;
    const tp = p * tiers % 1;
    const hw = w / 2 * (0.18 + 0.82 * p) * (0.5 + 0.5 * tp);
    const under = tp > 1 - 1.6 / (ch / tiers) && y < top + ch - 1;
    for (let x = 0; x < tm.w; x++) {
      const dx = x + 0.5 - (cx + 0.5);
      if (Math.abs(dx) > hw)
        continue;
      if (hole && r() < hole)
        continue;
      const v = -(dx / Math.max(hw, 1)) * 0.7 + (tp - 0.5) * 0.35 + (r() - 0.5) * 0.3;
      const tone = v > 0.5 ? 4 : v > 0.15 ? 3 : v > -0.3 ? 2 : 1;
      set(tm, x, y, under ? Math.max(1, tone - 2) : tone);
    }
  }
}
function frondCrown(tm, top, ch, cx, fronds, arcSpan, r) {
  const originX = cx + 0.5;
  const originY = top + 1;
  for (let f = 0; f < fronds; f++) {
    const a = -Math.PI / 2 + (f / (fronds - 1) - 0.5) * arcSpan + (r() - 0.5) * 0.1;
    const len = ch * (0.75 + r() * 0.3);
    const steps = Math.ceil(len);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const curve = Math.sin(t * Math.PI * 0.5) * 0.15 * (f < fronds / 2 ? -1 : 1);
      const x = Math.round(originX + Math.cos(a) * len * t + curve * ch);
      const y = Math.round(originY + Math.sin(a) * len * t);
      const tone = t < 0.3 ? 2 : t < 0.7 ? 3 : 4;
      set(tm, x, y, tone);
      if (Math.abs(Math.cos(a)) > 0.3)
        set(tm, x + (f % 2 ? 1 : -1), y, Math.max(1, tone - 1));
    }
  }
}
function hummockCrown(tm, w, top, ch, cx, r) {
  const blades = Math.max(5, Math.round(w * 0.9));
  for (let i = 0; i < blades; i++) {
    const bx = cx - w / 2 + i / blades * w + r() * 1.2;
    const lean = (bx - cx) / (w / 2) * 0.3;
    const len = ch * (0.6 + r() * 0.4);
    for (let s = 0; s < len; s++) {
      const t = s / len;
      const x = Math.round(bx + lean * s);
      const y = Math.round(top + ch - s);
      set(tm, x, y, t > 0.7 ? 4 : t > 0.3 ? 3 : 2);
    }
  }
}
function shrubCrown(tm, w, top, ch, cx, r) {
  roundCrown(tm, w, top, ch, cx, 4, r, 0.05);
}
function bulbousTrunk(tm, trunkW, bulbW, top, trunkH, cx) {
  const bulgeH = Math.round(trunkH * 0.55);
  for (let y = top; y < top + trunkH; y++) {
    const intoBulge = y < top + bulgeH ? 1 - (y - top) / bulgeH : 0;
    const halfW = Math.round(trunkW / 2 + (bulbW / 2 - trunkW / 2) * intoBulge);
    for (let x = cx - halfW; x <= cx + halfW; x++) {
      set(tm, x, y, x < cx ? TRUNK_MID : x === cx ? TRUNK_LIGHT : TRUNK_MID);
    }
  }
  return { tx0: cx - Math.round(trunkW / 2) };
}
function grassTreeCrown(tm, w, top, ch, cx, r) {
  hummockCrown(tm, w, top, ch * 0.8, cx, r);
  for (let y = top - ch * 0.5; y < top; y++)
    set(tm, cx, Math.round(y), 3);
}
var SHARE_OF_HEIGHT = {
  broadleaf: 0.32,
  conifer: 0.2,
  palm: 0.75,
  fern: 0.4,
  grasstree: 0.5,
  hummock: 0.1,
  shrub: 0.15,
  columnar: 0.55,
  bulbous: 0.6
};
function buildToneMap(plant, form, scale = 1) {
  const r = rng(hashStr(`sprite|${plant.seed}|${form}`));
  if (plant.stage === 0 /* Seedling */) {
    const size = Math.max(SEEDLING_SIZE, Math.round(SEEDLING_SIZE * scale));
    const tm2 = makeTone(size, size);
    const cx2 = Math.floor(size / 2);
    const base2 = size - 1;
    const s = size / SEEDLING_SIZE;
    set(tm2, cx2, Math.round(base2 - 1 * s), 2);
    set(tm2, cx2, Math.round(base2 - 2 * s), 3);
    set(tm2, cx2 - Math.round(s), Math.round(base2 - 3 * s), 3);
    set(tm2, cx2 + Math.round(s), Math.round(base2 - 3 * s), 3);
    set(tm2, cx2, Math.round(base2 - 4 * s), 4);
    return tm2;
  }
  const h = Math.max(3, Math.round(STAGE_HEIGHT[plant.stage] * scale));
  const trunkShare = SHARE_OF_HEIGHT[form];
  const trunkH = Math.max(2, Math.round(h * trunkShare));
  const ancient = plant.stage === 5 /* Ancient */;
  let widthFrac;
  if (form === "conifer")
    widthFrac = PINE_W[plant.size];
  else if (ancient)
    widthFrac = ANCIENT_W[plant.size];
  else
    widthFrac = BROAD_W[plant.size];
  let w = Math.max(3, Math.round(h * widthFrac));
  if (w % 2 === 0)
    w++;
  const W = w + 4;
  const H = h + 2;
  const tm = makeTone(W, H);
  const cx = Math.floor(W / 2);
  const base = H - 1;
  const top = 1;
  const ch = h - trunkH + 2;
  const trunkTop = base - trunkH;
  const trunkW = plant.stage >= 4 /* Old */ ? 2 : 1;
  const tx0 = cx - Math.floor(trunkW / 2);
  for (let y = trunkTop; y <= base; y++) {
    for (let x = tx0; x < tx0 + trunkW; x++) {
      let tone = y <= trunkTop + 3 ? TRUNK_DARK : TRUNK_MID;
      if (trunkW > 1 && x === tx0)
        tone = TRUNK_LIGHT;
      set(tm, x, y, tone);
    }
  }
  const hole = plant.health === 3 ? DYING_HOLES : 0;
  switch (form) {
    case "conifer":
      pineCrown(tm, w, top, ch, cx, plant.stage >= 4 /* Old */ ? 4 : plant.stage >= 3 /* Mature */ ? 3 : 2, r, hole);
      break;
    case "palm":
      frondCrown(tm, top, ch, cx, 7, Math.PI * 1.3, r);
      break;
    case "fern":
      frondCrown(tm, top, ch, cx, 9, Math.PI * 0.9, r);
      break;
    case "columnar":
      roundCrown(tm, w, top, ch * 0.5, cx, 3, r, hole);
      break;
    case "bulbous":
      bulbousTrunk(tm, trunkW + 1, w, trunkTop - Math.round(ch * 0.5), trunkH + Math.round(ch * 0.5), cx);
      roundCrown(tm, Math.round(w * 0.5), top, ch * 0.4, cx, 2, r, hole);
      break;
    case "grasstree":
      grassTreeCrown(tm, w, top, ch, cx, r);
      break;
    case "hummock":
      hummockCrown(tm, w, top, ch, cx, r);
      break;
    case "shrub":
      shrubCrown(tm, w, top, ch, cx, r);
      break;
    case "broadleaf":
    default:
      roundCrown(tm, w, top, ch, cx, ancient ? 7 : plant.stage >= 3 /* Mature */ ? 5 : 3, r, hole);
      break;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tn = get(tm, x, y);
      if (tn < 0 || tn > 4)
        continue;
      if (get(tm, x + 1, y) < 0 && get(tm, x, y + 1) < 0)
        set(tm, x, y, 0);
    }
  }
  return tm;
}

// src/forest/creatureSprite.ts
var STAGE_SCALE = { 0: 0.45, 1: 0.68, 2: 1, 3: 1 };
function grid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill("."));
}
function rowsOf(g) {
  return g.map((r) => r.join(""));
}
function put(g, x, y, ch) {
  const row = g[Math.round(y)];
  if (!row)
    return;
  const xi = Math.round(x);
  if (xi < 0 || xi >= row.length)
    return;
  row[xi] = ch;
}
function hline(g, x0, x1, y, ch) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    put(g, x, y, ch);
}
function ellipse(g, cx, cy, w, h, main, dark, light) {
  const rx = Math.max(0.6, w / 2);
  const ry = Math.max(0.6, h / 2);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      const q = nx * nx + ny * ny;
      if (q > 1)
        continue;
      const edge = q > 0.72;
      const top = ny < -0.25;
      const ch = edge ? dark : top && light ? light : main;
      put(g, x, y, ch);
    }
  }
}
function mainKey(palette) {
  return Object.keys(palette).find((k) => k !== "e") ?? Object.keys(palette)[0] ?? "b";
}
var KIND_PROPORTIONS = {
  quadruped: { bodyTilt: 0, headScale: 0.6 },
  hopper: { bodyTilt: -0.15, headScale: 0.55 },
  bird: { bodyTilt: 0.1, headScale: 0.5 },
  wader: { bodyTilt: 0.05, headScale: 0.4 },
  flyer: { bodyTilt: 0, headScale: 0.45 },
  frog: { bodyTilt: 0, headScale: 0.75 },
  reptile: { bodyTilt: 0, headScale: 0.4 },
  swimmer: { bodyTilt: 0, headScale: 0.5 },
  bulky: { bodyTilt: 0, headScale: 0.55 }
};
function buildCreatureFrames(creature, stage) {
  const plan = creature.body;
  const scale = STAGE_SCALE[stage] ?? 1;
  const [bw, bh] = plan.size;
  const w = Math.max(3, Math.round(bw * scale));
  const h = Math.max(3, Math.round(bh * scale));
  const legs = Math.round((plan.legs ?? 0) * scale);
  const neck = Math.round((plan.neck ?? 0) * scale);
  const tailLen = Math.round((plan.tail?.len ?? 0) * scale);
  const beak = Math.max(0, Math.round((plan.beak ?? 0) * scale * 0.6));
  const ears = Math.round((plan.ears ?? 0) * scale);
  const crest = Math.round((plan.crest ?? 0) * scale);
  const proportions = KIND_PROPORTIONS[plan.kind];
  const pal = creature.palette;
  const main = mainKey(pal);
  const dark = pal.d ? "d" : main;
  const light = pal.l ? "l" : void 0;
  const eye = pal.e ? "e" : dark;
  const beakCol = pal.y ? "y" : light ?? main;
  const headR = Math.max(1.4, Math.round(w * proportions.headScale * 0.3));
  const totalW = w + Math.max(neck, beak, tailLen) * 2 + Math.round(headR * 2) + 2;
  const totalH = h + legs + Math.max(neck, crest, ears, Math.round(headR * 2)) + 3;
  const cx = Math.floor(totalW / 2);
  const baseY = totalH - 1 - legs - 1;
  function headCentre() {
    if (neck > 0) {
      return { x: cx, y: baseY - h / 2 - neck };
    }
    return { x: cx + w / 2 + headR * 0.6, y: baseY - h - headR * 0.2 };
  }
  function drawCommon(legPhase) {
    const g = grid(totalW, totalH);
    const bodyCy = baseY - h / 2 - legs + proportions.bodyTilt * h;
    if (legs > 0) {
      const legN = plan.kind === "bird" || plan.kind === "wader" ? 2 : 4;
      for (let i = 0; i < legN; i++) {
        const lx = cx - w * 0.3 + i * w * 0.6 / Math.max(1, legN - 1);
        const offset = legPhase && i % 2 === 0 ? 1 : 0;
        const topY = baseY - legs + offset;
        for (let y = topY; y <= baseY; y++)
          put(g, Math.round(lx), y, dark);
      }
    } else {
      ellipse(g, cx, baseY + 0.5, w * 0.8, 1.4, dark, dark);
    }
    if (tailLen > 0) {
      const style = plan.tail?.style ?? "down";
      const tx = cx - w / 2 - 1;
      const ty = bodyCy + (style === "up" || style === "fan" ? -h * 0.2 : h * 0.15);
      for (let i = 0; i < tailLen; i++) {
        const dy = style === "up" ? -i * 0.8 : style === "curl" ? -Math.sin(i / tailLen * Math.PI) * 3 : style === "bush" ? i * 0.1 : i * 0.25;
        const tcol = style === "bush" && i > tailLen * 0.4 ? light ?? main : dark;
        put(g, tx - i, Math.round(ty + dy), tcol);
        if (style === "fan" && i === tailLen - 1) {
          for (let f = -2; f <= 2; f++)
            put(g, tx - i + f * 0.6, Math.round(ty + dy) + Math.abs(f) * 0.5, light ?? main);
        }
        if (style === "bush")
          put(g, tx - i, Math.round(ty + dy) - 1, tcol);
      }
    }
    const bodyW = w * (plan.kind === "bird" || plan.kind === "wader" ? 0.85 : 1);
    const bodyH = h * (plan.kind === "bird" || plan.kind === "wader" ? 0.8 : 1);
    ellipse(g, cx, bodyCy, bodyW, bodyH, main, dark, light);
    if ((plan.kind === "bird" || plan.kind === "wader") && pal.w) {
      ellipse(g, cx, bodyCy + bodyH * 0.25, bodyW * 0.55, bodyH * 0.45, "w", dark);
    }
    const head = headCentre();
    if (neck > 0) {
      const steps = Math.max(1, Math.round(neck));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const y = bodyCy - bodyH / 2 - (neck - i);
        const nx = cx + (head.x - cx) * t * 0.3;
        put(g, Math.round(nx), Math.round(y), main);
        put(g, Math.round(nx) + 1, Math.round(y), dark);
      }
    }
    ellipse(g, head.x, head.y, headR * 2, headR * 1.8, light ?? main, dark);
    put(g, Math.round(head.x + headR * 0.5), Math.round(head.y - headR * 0.1), eye);
    if (beak > 0)
      hline(g, Math.round(head.x + headR * 0.7), Math.round(head.x + headR * 0.7 + beak), Math.round(head.y), beakCol);
    if (ears > 0) {
      put(g, Math.round(head.x - headR * 0.5), Math.round(head.y - headR - ears * 0.6), dark);
      put(g, Math.round(head.x + headR * 0.2), Math.round(head.y - headR - ears * 0.6), dark);
    }
    if (crest > 0) {
      for (let i = 0; i < crest; i++) {
        put(g, Math.round(head.x), Math.round(head.y - headR - 1 - i), beakCol);
      }
    }
    if (plan.spines) {
      for (let x = -bodyW / 2; x <= bodyW / 2; x += 1.6) {
        put(g, Math.round(cx + x), Math.round(bodyCy - bodyH / 2 - 1), dark);
      }
    }
    return rowsOf(g);
  }
  return [drawCommon(0), drawCommon(1)];
}

// src/forest/creatureMotion.ts
var ROAM_EVERY_S = 150;
var ROAM_STAGGER_S = 41;
var ROAM_OFFSET_S = 37;
var WALK_SPEED_UNITS_PER_S = 7;
var STRIDE_SHARE = 0.25;
var ROAM_REACH_SHARE = 0.045;
var IDLE_GLANCE_THRESHOLD = 0.93;
function spotFor(daySeed2, slotIndex, home, reach, n) {
  const r = rng(hashInt(hashInt(daySeed2, slotIndex * 104729), n * 7919));
  return home + (r() - 0.5) * 2 * reach;
}
function groundMotion(t, daySeed2, slotIndex, home, reach = ROAM_REACH_SHARE, animate = true) {
  if (!animate) {
    return { x: home, groundCovered: 0, moving: false, facing: 1, frame: 0 };
  }
  const period = ROAM_EVERY_S + slotIndex * ROAM_STAGGER_S;
  const shifted = t + slotIndex * ROAM_OFFSET_S;
  const n = Math.floor(shifted / period);
  const phase = shifted - n * period;
  const from = spotFor(daySeed2, slotIndex, home, reach, n - 1);
  const to = spotFor(daySeed2, slotIndex, home, reach, n);
  const dist = Math.abs(to - from);
  const walkDuration = dist > 0 ? dist / (WALK_SPEED_UNITS_PER_S * 0.01) : 0;
  const moving = phase < walkDuration && dist > 1e-3;
  const q = moving ? phase / walkDuration : 1;
  const x = from + (to - from) * q;
  const groundCovered = dist * q;
  const facing = to >= from ? 1 : -1;
  let frame = 0;
  if (moving) {
    const strideLen = Math.max(0.01, reach * STRIDE_SHARE);
    frame = Math.floor(groundCovered / strideLen) % 2;
  } else {
    const glance = Math.sin(t * 0.7 + slotIndex * 2.1);
    frame = glance > IDLE_GLANCE_THRESHOLD ? 1 : 0;
  }
  return { x, groundCovered, moving, facing, frame };
}
function hopHeight(groundCovered, hopLenShare, hopHeightPx) {
  if (hopLenShare <= 0)
    return 0;
  const phase = groundCovered / hopLenShare % 1;
  return Math.abs(Math.sin(phase * Math.PI)) * hopHeightPx;
}
function flightPosition(t, cx, cy, rx, ry, turnRadPerS) {
  const a = t * turnRadPerS;
  return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
}
function flapFrame(t, flapFps, flapEverySteps) {
  return Math.floor(t * flapFps) % flapEverySteps === 0 ? 1 : 0;
}

// src/forest/ecosystemVisual.ts
function desaturate(colorHex, amount) {
  const r = parseInt(colorHex.slice(1, 3), 16);
  const g = parseInt(colorHex.slice(3, 5), 16);
  const b = parseInt(colorHex.slice(5, 7), 16);
  const l = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
  const grey = `#${[l, l, l].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  return mixHex(colorHex, grey, amount);
}
function visualParamsFor(visualHealth) {
  const h = Math.max(0, Math.min(100, visualHealth)) / 100;
  const band = healthBand(visualHealth);
  return {
    band,
    grassSaturation: 0.4 + 0.6 * h,
    waterClarity: 0.3 + 0.7 * h,
    understoryDensity: Math.pow(h, 0.7),
    creatureActivity: 0.3 + 0.7 * h,
    ambienceGain: h,
    groundTint: h < 0.85 ? { color: "#9a8a60", amount: (1 - h) * 0.4 } : null
  };
}
function applyGroundHealth(baseColorHex, params) {
  let c = desaturate(baseColorHex, 1 - params.grassSaturation);
  if (params.groundTint)
    c = mixHex(c, params.groundTint.color, params.groundTint.amount);
  return c;
}

// src/forest/paint.ts
var TONE_COUNT = 5;
function resolveTone(tone, x, y, crown, bark, ailing, opts) {
  if (tone >= TRUNK_LIGHT) {
    const barkIndex = tone === TRUNK_LIGHT ? 0 : tone === TRUNK_MID ? 1 : 2;
    let col2 = hex(bark[Math.min(2, barkIndex)]);
    if (opts.tint && opts.tintAmount)
      col2 = mix(col2, hex(opts.tint), opts.tintAmount);
    if (opts.haze && opts.hazeColor)
      col2 = mix(col2, hex(opts.hazeColor), opts.haze);
    return col2;
  }
  const sickShare = opts.stage >= HEALTH_MIN_STAGE2 ? SICK_SHARE[opts.health] : 0;
  const clusterKey = `${opts.seed}|${opts.variant}|${x >> 1}|${y >> 1}`;
  const sick = sickShare > 0 && hashStr(clusterKey) % 1e3 / 1e3 < sickShare;
  let col = hex(crown[Math.max(0, Math.min(TONE_COUNT - 1, tone))]);
  if (sick) {
    if (ailing === "autumn")
      col = mix(col, hex("#c87a2a"), 0.55 + tone * 0.05);
    else if (ailing === "bare")
      col = mix(col, hex("#8a7a60"), 0.35);
    else
      col = mix(col, hex("#9a8a40"), 0.5);
  }
  if (opts.snow && tone >= 3)
    col = mix(col, [245, 248, 252], 0.5);
  if (opts.tint && opts.tintAmount)
    col = mix(col, hex(opts.tint), opts.tintAmount);
  if (opts.haze && opts.hazeColor)
    col = mix(col, hex(opts.hazeColor), opts.haze);
  return col;
}
function paintPlant(g, tm, species, opts, x0, y0, k) {
  for (let y = 0; y < tm.h; y++) {
    for (let x = 0; x < tm.w; x++) {
      const tone = tm.tone[y * tm.w + x];
      if (tone < 0)
        continue;
      const [r, gg, b] = resolveTone(tone, x, y, species.crown, species.bark, species.ailing, opts);
      g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
      g.fillRect(Math.round(x0 + x * k), Math.round(y0 + y * k), k, k);
    }
  }
}
function paintCreature(g, rows, palette, x0, y0, k, flip = false, tint) {
  const w = Math.max(...rows.map((r) => r.length));
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".")
        continue;
      const base = palette[ch];
      if (!base)
        continue;
      let col = hex(base);
      if (tint)
        col = mix(col, hex(tint.color), tint.amount);
      g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
      const px = flip ? w - 1 - x : x;
      g.fillRect(Math.round(x0 + px * k), Math.round(y0 + y * k), k, k);
    }
  }
}

// src/forest/hitTest.ts
function boxAt(kind, ref, cx, topY, w, h, depth) {
  return { kind, ref, depth, x0: cx - w / 2, x1: cx + w / 2, y0: topY, y1: topY + h };
}

// src/forest/scene.ts
var ENGINE_WIDTH = 300;
var RABBIT_LIKE_HOP = 0.08;
var LAND_BOTTOM = 0.78;
function ditherFill(g, x0, y0, w, h, a, b, t) {
  const rgbA = hex(a);
  const rgbB = hex(b);
  const col = mix(rgbA, rgbB, t);
  g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
  g.fillRect(x0, y0, w, h);
}
function drawSky(g, W, horizonY, th, t) {
  const stops = th.sky;
  const bands = Math.max(8, Math.round(horizonY));
  for (let y = 0; y < bands; y++) {
    const p = y / Math.max(1, bands - 1) * (stops.length - 1);
    const i0 = Math.min(stops.length - 2, Math.floor(p));
    const f = p - i0;
    const dith = BAYER4[y % 4 * 4] / 16;
    const tt = f > dith ? 1 : 0;
    ditherFill(g, 0, Math.floor(y / bands * horizonY), W, Math.ceil(horizonY / bands) + 1, stops[i0], stops[i0 + 1], tt);
  }
  if (th.clouds) {
    const seedBase = Math.floor(t / 40);
    for (let i = 0; i < th.clouds.n; i++) {
      const cx = hashStr(`cloud${i}${seedBase}`) % 1e3 / 1e3 * W;
      const cy = horizonY * (0.1 + hashStr(`cloudy${i}`) % 1e3 / 1e3 * 0.3);
      const cw = W * (0.08 + hashStr(`cloudw${i}`) % 1e3 / 1e3 * 0.08);
      g.fillStyle = th.clouds.top;
      g.globalAlpha = th.clouds.alpha / 255;
      g.fillRect(Math.round(cx - cw / 2), Math.round(cy), Math.round(cw), Math.max(1, Math.round(cw * 0.22)));
      g.globalAlpha = 1;
    }
  }
  if (th.stars > 0) {
    const n = Math.min(th.stars, 70);
    g.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < n; i++) {
      const sx = Math.floor(hashStr(`star${i}`) % 1e3 / 1e3 * W);
      const sy = Math.floor(hashStr(`stary${i}`) % 1e3 / 1e3 * horizonY * 0.9);
      g.fillRect(sx, sy, 1, 1);
    }
  }
  if (th.orb) {
    const ox = Math.round(W * th.orb.x);
    const oy = Math.round(horizonY * th.orb.y);
    const r = Math.max(3, Math.round(th.orb.r * (W / 420) * 2.2));
    const glow = g.createRadialGradient(ox, oy, 0, ox, oy, r * (1 + th.orb.halo * 0.35));
    glow.addColorStop(0, th.orb.color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = glow;
    g.beginPath();
    g.arc(ox, oy, r * (1 + th.orb.halo * 0.35), 0, Math.PI * 2);
    g.fill();
    g.fillStyle = th.orb.color;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r)
          g.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
}
function drawHills(g, W, horizonY, farColor, groundColor, form) {
  const hillColor = mix(hex(farColor), hex(groundColor), 0.3);
  g.fillStyle = `rgb(${hillColor[0] | 0},${hillColor[1] | 0},${hillColor[2] | 0})`;
  const base = horizonY + horizonY * 0.1;
  const amp = horizonY * 0.14;
  const heightAt = (p) => {
    switch (form) {
      case "volcano": {
        const d = Math.abs(p - 0.42) * 2.6;
        return Math.max(0, 1 - d) ** 1.6;
      }
      case "peaks":
      case "towers":
      case "tsingy": {
        const n = form === "tsingy" ? 9 : 6;
        const saw = Math.abs(p * n % 1 - 0.5) * 2;
        return 0.5 + 0.5 * saw * (0.6 + 0.4 * Math.sin(p * Math.PI * 2.7 + 0.7));
      }
      case "fjord": {
        const walls = Math.max(0, 1 - Math.abs(p - 0.5) * 2.4);
        return walls > 0.15 ? walls : 0.05;
      }
      case "plateau": {
        const inPlateau = p > 0.25 && p < 0.75;
        return inPlateau ? 0.85 : 0.25 * Math.max(0, 1 - Math.abs(p - 0.5) * 2.2);
      }
      case "flat":
      case "canopy":
        return 0.08;
      case "rolling":
      default:
        return 0.5 + 0.5 * (0.6 * Math.sin(p * Math.PI * 2.3 + 1.3) + 0.4 * Math.sin(p * Math.PI * 5.1 + 0.4));
    }
  };
  for (let x = 0; x < W; x++) {
    const p = x / W;
    const bump = heightAt(p) * 2 - 1;
    const topY = Math.round(base - amp - amp * bump);
    g.fillRect(x, topY, 1, Math.max(1, Math.round(base - topY)));
  }
}
function drawGround(g, W, horizonY, landBottomY, biomeGround, th, visual) {
  const LIGHTING_WEIGHT = 0.3;
  const [bFar, bNear, bGrass] = biomeGround;
  const far = th.snow ? th.far : mixHex(bFar, th.far, LIGHTING_WEIGHT);
  const ground0 = th.snow ? th.ground0 : mixHex(bGrass, th.ground0, LIGHTING_WEIGHT);
  const ground1 = th.snow ? th.ground1 : mixHex(bNear, th.ground1, LIGHTING_WEIGHT);
  const farCol = applyGroundHealth(far, visual);
  g.fillStyle = farCol;
  g.fillRect(0, Math.round(horizonY), W, Math.round((landBottomY - horizonY) * 0.22));
  const g0 = applyGroundHealth(ground0, visual);
  const g1 = applyGroundHealth(ground1, visual);
  drawHills(g, W, horizonY, farCol, g0, th.hillForm);
  const top = horizonY + (landBottomY - horizonY) * 0.18;
  const rows = Math.max(6, Math.round(landBottomY - top));
  for (let y = 0; y < rows; y++) {
    const p = y / rows;
    const dith = BAYER4[y % 4 * 4 + 1] / 16;
    ditherFill(g, 0, Math.round(top + y), W, 2, g0, g1, p > dith ? Math.min(1, p + 0.15) : p);
  }
}
function drawCabin(g, cx, baseY, s, th) {
  const tintC = (col) => {
    if (!th.tint || !th.tintAmount)
      return col;
    const c = mix(hex(col), hex(th.tint), th.tintAmount);
    return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  };
  const wallW = 14 * s;
  const wallH = 8 * s;
  const x0 = Math.round(cx - wallW / 2);
  const y0 = Math.round(baseY - wallH);
  const wallLight = tintC("#8a6245");
  const wallMid = tintC("#6a4a32");
  const wallDark = tintC("#4e361f");
  for (let y = 0; y < wallH; y++) {
    const plank = y % (2 * s) < s;
    const row = y > wallH - s ? wallDark : plank ? wallMid : wallLight;
    g.fillStyle = row;
    g.fillRect(x0, y0 + y, wallW, 1);
  }
  g.fillStyle = wallDark;
  g.fillRect(x0, y0, s, wallH);
  g.fillRect(x0 + wallW - s, y0, s, wallH);
  const doorW = Math.max(2, Math.round(2.6 * s));
  const doorH = Math.round(wallH * 0.75);
  g.fillStyle = tintC("#2e2016");
  g.fillRect(Math.round(cx - doorW / 2), y0 + wallH - doorH, doorW, doorH);
  const lit = luminance(hex(th.sky[0])) < 90;
  const winSize = Math.max(1, Math.round(1.6 * s));
  const winX = x0 + wallW - winSize - s;
  const winY = y0 + Math.round(s * 1.2);
  g.fillStyle = lit ? "#f0d080" : tintC("#5a7a8a");
  g.fillRect(winX, winY, winSize, winSize);
  if (lit) {
    g.fillStyle = "rgba(240,208,128,0.25)";
    g.fillRect(winX - 1, winY - 1, winSize + 2, winSize + 2);
  }
  const roofW = wallW + 4 * s;
  const roofH = 6 * s;
  const peakX = cx;
  const peakY = y0 - roofH;
  const roofDark = tintC("#6a241a");
  const roofLight = tintC("#8a3a2e");
  for (let y = 0; y < roofH; y++) {
    const t = y / roofH;
    const halfW = roofW / 2 * t;
    const rowY = Math.round(peakY + y);
    g.fillStyle = y < 2 ? roofLight : roofDark;
    g.fillRect(Math.round(peakX - halfW), rowY, Math.max(1, Math.round(halfW)), 1);
    g.fillStyle = roofDark;
    g.fillRect(Math.round(peakX), rowY, Math.max(1, Math.round(halfW)), 1);
  }
  if (lit || th.snow) {
    const smokeX = Math.round(cx + wallW * 0.28);
    for (let i = 0; i < 3; i++) {
      const py = Math.round(peakY - 2 - i * 2 * s);
      g.fillStyle = `rgba(220,220,225,${0.4 - i * 0.1})`;
      g.fillRect(smokeX + (i % 2 === 0 ? 0 : s), py, s, s);
    }
  }
}
function drawReflection(g, canvas, W, landBottomY, waterBottomY, th, visual) {
  const bandH = waterBottomY - landBottomY;
  if (bandH <= 1)
    return;
  g.save();
  g.beginPath();
  g.rect(0, Math.round(landBottomY), W, Math.ceil(bandH));
  g.clip();
  g.translate(0, landBottomY * 2);
  g.scale(1, -1);
  g.globalAlpha = 0.55;
  g.drawImage(canvas, 0, 0);
  g.restore();
  const waterCol = hex(th.water);
  g.fillStyle = `rgba(${waterCol[0] | 0},${waterCol[1] | 0},${waterCol[2] | 0},${0.3 * (1 - visual.waterClarity * 0.35)})`;
  g.fillRect(0, Math.round(landBottomY), W, Math.ceil(bandH));
  g.fillStyle = th.near;
  g.fillRect(0, Math.round(landBottomY) - 1, W, 1);
  g.fillStyle = `rgba(255,255,255,${0.1 + 0.08 * visual.waterClarity})`;
  for (let y = 2; y < bandH; y += 3) {
    const shift = (y % 6 < 3 ? 1 : -1) * 2;
    g.fillRect(shift, Math.round(landBottomY + y), W, 1);
  }
}
function drawBirds(g, W, horizonY, th, t) {
  if (!th.birds)
    return;
  g.fillStyle = "rgba(58,58,58,0.8)";
  for (let i = 0; i < th.birds; i++) {
    const speed = 5 + i % 3 * 1.6;
    const x = Math.round(((t * speed + i * 137) % (W + 30) + W + 30) % (W + 30)) - 15;
    const y = Math.round(horizonY * (0.12 + i * 53 % 100 / 100 * 0.3));
    g.fillRect(x - 2, y + 1, 1, 1);
    g.fillRect(x - 1, y, 1, 1);
    g.fillRect(x, y, 1, 1);
    g.fillRect(x + 1, y, 1, 1);
    g.fillRect(x + 2, y + 1, 1, 1);
  }
}
function drawPond(g, x, y, w, h, th, visual) {
  const clarity = visual.waterClarity;
  const base = hex(th.water);
  const murk = mix(base, [90, 95, 70], 1 - clarity);
  g.fillStyle = `rgb(${murk[0] | 0},${murk[1] | 0},${murk[2] | 0})`;
  g.beginPath();
  g.ellipse(Math.round(x), Math.round(y), Math.round(w / 2), Math.round(h / 2), 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = `rgba(255,255,255,${0.12 + 0.1 * clarity})`;
  g.fillRect(Math.round(x - w * 0.2), Math.round(y - 1), Math.round(w * 0.3), 1);
}
var engineCanvas = null;
var engineCtx = null;
function getEngineCanvas(engineW, engineH) {
  if (!engineCanvas) {
    engineCanvas = document.createElement("canvas");
  }
  if (engineCanvas.width !== engineW || engineCanvas.height !== engineH) {
    engineCanvas.width = engineW;
    engineCanvas.height = engineH;
    engineCtx = null;
  }
  if (!engineCtx) {
    engineCtx = engineCanvas.getContext("2d", { willReadFrequently: false });
    if (engineCtx)
      engineCtx.imageSmoothingEnabled = false;
  }
  return [engineCanvas, engineCtx];
}
function drawScene(g, W, H, input) {
  const aspect = W / H;
  const engineW = ENGINE_WIDTH;
  const engineH = Math.round(engineW / aspect);
  const blit = W / engineW;
  const [ecv, eg] = getEngineCanvas(engineW, engineH);
  eg.clearRect(0, 0, engineW, engineH);
  const backdrop = input.backdrops?.length ? pickBackdrop(input.backdrops, input.mood.time === "night", input.grove.seed) : void 0;
  const th = buildTheme(
    input.mood,
    { streak: input.grove.stats.streak, todayReviews: input.grove.stats.todayReviews },
    backdrop
  );
  const visual = visualParamsFor(input.visualHealth);
  const horizonY = engineH * 0.42;
  const landBottomY = engineH * LAND_BOTTOM;
  const frameBottomY = engineH * GROUND_BOTTOM;
  const groundBottomY = input.biome.hasWater ? landBottomY : frameBottomY;
  drawSky(eg, engineW, horizonY, th, input.t);
  drawGround(eg, engineW, horizonY, groundBottomY, input.biome.ground, th, visual);
  const layout = layoutGrove(input.grove.plants);
  const boxes = [];
  const pushBox = (kind, ref, cx, topY, w, h, depth) => {
    boxes.push(boxAt(kind, ref, cx * blit, topY * blit, w * blit, h * blit, depth));
  };
  const groundBottomFrac = input.biome.hasWater ? LAND_BOTTOM : GROUND_BOTTOM;
  for (const item of layout.items) {
    const placed = placeItem(item, engineW, engineH, horizonY, groundBottomFrac);
    const zoomedScale = placed.scale * layout.zoom;
    if (isPond(item)) {
      const pw = 10 * item.slots * zoomedScale;
      const ph = 3.4 * zoomedScale;
      drawPond(eg, placed.x, placed.y - ph / 2, pw, ph, th, visual);
      pushBox("pond", item.group, placed.x, placed.y - ph, pw, ph, item.depth);
      continue;
    }
    const plant = item;
    const species = input.biome.plants[plant.species % input.biome.plants.length];
    const tone = buildToneMap(plant, species.form, zoomedScale);
    const x0 = Math.round(placed.x - tone.w / 2);
    const y0 = Math.round(placed.y - tone.h);
    paintPlant(eg, tone, species, {
      stage: plant.stage,
      health: plant.health,
      seed: plant.seed,
      variant: plant.variant,
      // Raised from *4: with the widened FAR_SCALE/NEAR_GAIN spread, the back row needed a
      // stronger haze pull too, or size alone would carry all of the depth cue and distant
      // trees would still read as "small but equally crisp" rather than genuinely far away.
      haze: Math.min(1, placed.haze * th.hazeStep * 6.5),
      hazeColor: th.haze,
      tint: th.tint ?? void 0,
      tintAmount: th.tintAmount,
      snow: th.snow
    }, x0, y0, 1);
    pushBox("plant", plant.index, placed.x, y0, tone.w, tone.h, item.depth);
  }
  const baseY = groundBottomY - 2;
  input.roster.creatures.forEach((save) => {
    const creature = input.biome.creatures.find((c) => c.slot === save.slot);
    if (!creature)
      return;
    const age = creatureAge(save, input.activeStudyDays);
    const stageIdx = lifeStageFor(age);
    const isNight = input.mood.time === "night";
    const mood = creatureMood(visual.creatureActivity * 100, {
      nocturnal: creature.activity === "nocturnal",
      night: isNight,
      sleepy: creature.sleepy,
      paused: input.paused
    });
    if (mood === "hidden" || mood === "asleep")
      return;
    const [idle, busy] = buildCreatureFrames(creature, stageIdx);
    const home = 0.15 + save.slot / 5 * 0.7;
    const creatureScale = Math.max(1, Math.round(layout.zoom * 1.4));
    const creatureTint = th.tint ? { color: th.tint, amount: th.tintAmount * 0.6 } : void 0;
    if (creature.zone === "sky") {
      const pos = flightPosition(input.t, engineW * 0.6, horizonY * 0.5, engineW * 0.1, horizonY * 0.08, 0.3);
      const frame2 = input.animate && flapFrame(input.t, 2.5, 5) ? busy : idle;
      const fw2 = frame2[0]?.length ?? 1;
      paintCreature(eg, frame2, creature.palette, Math.round(pos.x - fw2 * creatureScale / 2), Math.round(pos.y - frame2.length * creatureScale), creatureScale, false, creatureTint);
      pushBox("creature", save.slot, pos.x, pos.y - frame2.length * creatureScale, fw2 * creatureScale, frame2.length * creatureScale, 0);
      return;
    }
    const motion = groundMotion(input.t, input.grove.seed, save.slot, home, 0.06, input.animate);
    const frame = motion.moving ? busy : idle;
    const fw = frame[0]?.length ?? 1;
    let dy = 0;
    if (creature.body.kind === "hopper" && motion.moving) {
      dy = -hopHeight(motion.groundCovered, RABBIT_LIKE_HOP, 3 * creatureScale);
    }
    const x = motion.x * engineW;
    const y0 = baseY - frame.length * creatureScale + dy;
    paintCreature(eg, frame, creature.palette, Math.round(x - fw * creatureScale / 2), Math.round(y0), creatureScale, motion.facing < 0, creatureTint);
    pushBox("creature", save.slot, x, y0, fw * creatureScale, frame.length * creatureScale, -1);
  });
  if (hasCabin(input.grove.stats)) {
    drawCabin(eg, engineW * 0.08, groundBottomY - 2, Math.max(1, Math.round(layout.zoom)), th);
    pushBox("plant", -1, engineW * 0.08, groundBottomY - 2 - 14 * Math.max(1, Math.round(layout.zoom)), 18 * Math.max(1, Math.round(layout.zoom)), 14 * Math.max(1, Math.round(layout.zoom)), -2);
  }
  if (input.biome.hasWater) {
    drawReflection(eg, ecv, engineW, landBottomY, frameBottomY, th, visual);
  }
  drawBirds(eg, engineW, horizonY, th, input.t);
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, W, H);
  g.drawImage(engineCanvas, 0, 0, engineW, engineH, 0, 0, W, H);
  return { boxes };
}

// src/regions/sources.ts
var ala = (name) => `https://bie.ala.org.au/search?q=${encodeURIComponent(name)}`;
var iucn = (name) => `https://www.iucnredlist.org/search?query=${encodeURIComponent(name)}`;
var gbif = (name) => `https://www.gbif.org/species/search?q=${encodeURIComponent(name)}`;
var nzbirds = (slug) => `https://nzbirdsonline.org.nz/species/${slug}`;

// src/regions/australia/eucalypt.ts
var eucalyptWoodland = {
  key: "eucalypt",
  label: "Eucalypt woodland",
  note: "Open forest of gums and wattle over kangaroo grass, with grass trees in the understory.",
  ground: ["#9a8f63", "#7d8a52", "#9bab63"],
  ambience: ["passingFlock", "butterflies"],
  plants: [
    {
      key: "river-red-gum",
      common: "River red gum",
      scientific: "Eucalyptus camaldulensis",
      form: "broadleaf",
      traits: ["Smooth white-to-salmon bark shedding in ribbons", "Broad, open, drooping crown"],
      iucn: "LC",
      fact: "The most widely distributed eucalypt in Australia, and almost always a sign of water nearby.",
      source: ala("Eucalyptus camaldulensis"),
      crown: ["#2c3a26", "#415432", "#587040", "#75904f", "#9cb46a"],
      bark: ["#d8cfc0", "#b3a797", "#8a7c6c"],
      ailing: "dry",
      spread: 1.1
    },
    {
      key: "spotted-gum",
      common: "Spotted gum",
      scientific: "Corymbia maculata",
      form: "broadleaf",
      traits: ["Dimpled bark in patches of grey, cream and pink", "Tall, straight, clean trunk"],
      iucn: "LC",
      fact: "Sheds its bark in rounded patches, which is where the spots come from.",
      source: ala("Corymbia maculata"),
      crown: ["#28362a", "#3c5034", "#527043", "#6e9053", "#93b46e"],
      bark: ["#cfc6b6", "#a89a88", "#7b6f60"],
      ailing: "dry"
    },
    {
      key: "grass-tree",
      common: "Grass tree",
      scientific: "Xanthorrhoea johnsonii",
      form: "grasstree",
      traits: ["Black fire-charred trunk", "Spiky skirt of leaves and a tall flower spear"],
      iucn: "LC",
      fact: "Grows only a centimetre or two a year, so a tall one has stood through a great many fires.",
      source: ala("Xanthorrhoea johnsonii"),
      crown: ["#1e2a1a", "#2f4225", "#425a30", "#59753e", "#7a9550"],
      bark: ["#4a4038", "#312a24", "#1c1814"],
      ailing: "dry",
      spread: 0.8
    },
    {
      key: "golden-wattle",
      common: "Golden wattle",
      scientific: "Acacia pycnantha",
      form: "shrub",
      traits: ["Dense balls of bright yellow bloom", "Sickle-shaped grey-green phyllodes"],
      iucn: "LC",
      fact: "Australia's floral emblem. It flowers in late winter and early spring, which is when the woodland turns gold.",
      source: ala("Acacia pycnantha"),
      crown: ["#2a3321", "#3d4a2a", "#556237", "#768145", "#a8a957"],
      bark: ["#6a5c48", "#4c4133", "#332b22"],
      ailing: "dry",
      spread: 0.9
    },
    {
      key: "kangaroo-grass",
      common: "Kangaroo grass",
      scientific: "Themeda triandra",
      form: "hummock",
      traits: ["Russet-bronze seed heads", "Loose, arching tussock"],
      iucn: "LC",
      fact: "Once covered much of the continent, and turns a deep red-bronze as it dries off.",
      source: ala("Themeda triandra"),
      crown: ["#54492a", "#6e5c31", "#8a7038", "#a98a45", "#c6a85c"],
      bark: ["#6a5c40", "#4e432e", "#362e1f"],
      ailing: "dry",
      spread: 0.7
    }
  ],
  creatures: [
    {
      key: "kookaburra",
      slot: 0,
      common: "Laughing kookaburra",
      scientific: "Dacelo novaeguineae",
      traits: ["Heavy dagger bill and a dark eye-stripe", "Barred rufous tail, pale head"],
      iucn: "LC",
      fact: "The largest kingfisher in the world, and it mostly hunts well away from water.",
      source: ala("Dacelo novaeguineae"),
      activity: "diurnal",
      zone: "canopy",
      stages: ["chick", "fledgling", "adult", "elder"],
      behaviour: "Sits very still on a branch, then drops onto something in the grass.",
      body: { kind: "bird", size: [9, 7], beak: 3, tail: { len: 3, style: "down" }, legs: 1 },
      palette: { b: "#e8e0cf", d: "#6b5a44", e: "#20180f", r: "#9a6a3a", w: "#4a7fa8", y: "#2e2416" }
    },
    {
      key: "cockatoo",
      slot: 1,
      common: "Sulphur-crested cockatoo",
      scientific: "Cacatua galerita",
      traits: ["White body with a forward-curving yellow crest", "Heavy dark grey bill"],
      iucn: "LC",
      fact: "Long-lived and famously loud; wild birds have been recorded past seventy.",
      source: ala("Cacatua galerita"),
      activity: "diurnal",
      zone: "canopy",
      stages: ["chick", "fledgling", "adult", "elder"],
      behaviour: "Clambers about the canopy and raises its crest when something startles it.",
      flourish: "display",
      body: { kind: "bird", size: [9, 8], beak: 2, crest: 3, tail: { len: 4, style: "down" }, legs: 1 },
      palette: { b: "#f6f4ee", d: "#c9c3b4", e: "#1a1510", y: "#f0d060", k: "#5a5248" }
    },
    {
      key: "eastern-grey-kangaroo",
      slot: 2,
      common: "Eastern grey kangaroo",
      scientific: "Macropus giganteus",
      traits: ["Soft grey-brown coat, paler below", "Long thick tail held out straight when moving"],
      iucn: "LC",
      fact: "Grazes mostly at dawn and dusk, and rests up in the shade through the heat of the day.",
      source: ala("Macropus giganteus"),
      activity: "crepuscular",
      zone: "ground",
      stages: ["joey", "young-at-foot", "adult", "old man"],
      behaviour: "Grazes head-down, sits up to look around, then moves on in long hops.",
      body: {
        kind: "hopper",
        size: [13, 12],
        legs: 4,
        tail: { len: 8, style: "down" },
        ears: 3,
        pouch: true
      },
      palette: { b: "#9a9383", d: "#6c6557", l: "#c4bdab", e: "#17130d", n: "#2a241c" }
    },
    {
      key: "lace-monitor",
      slot: 3,
      common: "Lace monitor",
      scientific: "Varanus varius",
      traits: ["Dark body banded with pale cream", "Long neck and a very long tapering tail"],
      iucn: "LC",
      fact: "Climbs well, and will circle round to the far side of a trunk to keep out of sight.",
      source: ala("Varanus varius"),
      activity: "diurnal",
      zone: "trunk",
      stages: ["hatchling", "juvenile", "adult", "old"],
      behaviour: "Clings head-up to a trunk, flicking its tongue, and slides round out of view.",
      body: { kind: "reptile", size: [16, 5], legs: 2, tail: { len: 10, style: "down" }, neck: 3 },
      palette: { b: "#4a4238", d: "#2a251e", l: "#c8bb9a", e: "#0d0a06", y: "#d8c88a" }
    },
    {
      key: "koala",
      slot: 4,
      common: "Koala",
      scientific: "Phascolarctos cinereus",
      traits: ["Large round fluffy ears and a big dark nose", "Stout grey body wedged in a fork"],
      iucn: "VU",
      national: "Endangered in Queensland, New South Wales and the ACT under Australia\u2019s EPBC Act",
      fact: "Sleeps most of the day. Eucalypt leaves are low in energy, so resting is simply what the diet allows.",
      source: iucn("Phascolarctos cinereus"),
      activity: "nocturnal",
      zone: "canopy",
      stages: ["joey", "young", "adult", "elder"],
      sleepy: true,
      behaviour: "Wedged in a fork, asleep. Occasionally shifts, scratches, and settles again.",
      body: { kind: "bulky", size: [8, 8], ears: 3, legs: 1, tail: { len: 0, style: "none" } },
      palette: { b: "#9aa0a4", d: "#6a7175", l: "#d6dade", e: "#120f0c", n: "#1d1813" }
    }
  ],
  understory: [
    { key: "tussock", label: "Kangaroo grass", what: "Grass tussocks \u2014 thicker when the grove is healthy", colour: "#8a9450" },
    { key: "wattle-bloom", label: "Wattle bloom", what: "Wattle in flower \u2014 late winter into spring", colour: "#e3c548" },
    { key: "everlasting", label: "Paper daisies", what: "Flowers come out as the ecosystem recovers", colour: "#f0e6c8" },
    { key: "fallen-bark", label: "Shed bark", what: "Ribbons of bark the gums have dropped", colour: "#a08a6e" }
  ]
};

// src/regions/australia/rainforest.ts
var subtropicalRainforest = {
  key: "rainforest",
  label: "Subtropical rainforest",
  note: "Closed green canopy, tree ferns in the gullies, mist that never quite lifts.",
  ground: ["#3c4a33", "#2d3b28", "#49603a"],
  ambience: ["mist", "glowworms", "butterflies"],
  plants: [
    {
      key: "antarctic-beech",
      common: "Antarctic beech",
      scientific: "Nothofagus moorei",
      form: "broadleaf",
      traits: ["Gnarled multi-stemmed trunks heavy with moss", "Dark, dense, low crown"],
      iucn: "NE",
      fact: "A relict of Gondwana. Some of the mossy stools on the plateau have been regrowing from the same root for thousands of years.",
      source: ala("Nothofagus moorei"),
      crown: ["#16281a", "#214028", "#2f5834", "#437044", "#608c57"],
      bark: ["#6a6a52", "#484a38", "#2c2e22"],
      ailing: "bare",
      spread: 1.05
    },
    {
      key: "strangler-fig",
      common: "Strangler fig",
      scientific: "Ficus watkinsiana",
      form: "broadleaf",
      traits: ["A lattice of fused aerial roots instead of a trunk", "Huge spreading dark crown"],
      iucn: "NE",
      fact: "Starts life in the canopy as a seedling in a fork, then sends roots down until they meet the ground.",
      source: ala("Ficus watkinsiana"),
      crown: ["#13241a", "#1e3a26", "#2b5231", "#3f6c42", "#5c8a55"],
      bark: ["#7a7258", "#564f3c", "#332f24"],
      ailing: "bare",
      spread: 1.25
    },
    {
      key: "tree-fern",
      common: "Rough tree fern",
      scientific: "Cyathea australis",
      form: "fern",
      traits: ["Slender fibrous trunk ringed with old frond scars", "Arching crown of fronds"],
      iucn: "NE",
      fact: "The trunk is not wood at all \u2014 it is a column of old leaf bases and roots.",
      source: ala("Cyathea australis"),
      crown: ["#1a3020", "#26472c", "#356138", "#4a7c48", "#6b9a5e"],
      bark: ["#6b5c48", "#4a3f31", "#2e261d"],
      ailing: "dry",
      spread: 1.15
    },
    {
      key: "bangalow-palm",
      common: "Bangalow palm",
      scientific: "Archontophoenix cunninghamiana",
      form: "palm",
      traits: ["Smooth ringed grey trunk with a green crownshaft", "Tall arching fronds"],
      iucn: "NE",
      fact: "Grows in dense stands along rainforest creeks, often hundreds of straight trunks together.",
      source: ala("Archontophoenix cunninghamiana"),
      crown: ["#1c3522", "#284c2e", "#39663b", "#4f8049", "#6f9e5e"],
      bark: ["#9a9684", "#736f5e", "#4c4a3c"],
      ailing: "dry",
      spread: 0.95
    },
    {
      key: "staghorn",
      common: "Staghorn fern",
      scientific: "Platycerium superbum",
      form: "shrub",
      traits: ["A shield of papery nest fronds clasping a trunk", "Forked antler-like fronds hanging down"],
      iucn: "NE",
      fact: "Grows on trees rather than in soil, catching its own compost in the shield at its back.",
      source: ala("Platycerium superbum"),
      crown: ["#24341e", "#33492a", "#466135", "#5c7c44", "#7d9c5c"],
      bark: ["#6a6450", "#4a4638", "#2d2b22"],
      ailing: "dry",
      spread: 0.85
    }
  ],
  creatures: [
    {
      key: "green-tree-frog",
      slot: 0,
      common: "Australian green tree frog",
      scientific: "Ranoidea caerulea",
      traits: ["Smooth bright green body with a fat fold over the eye", "Large round toe pads"],
      iucn: "LC",
      fact: "Will happily take up residence in a downpipe or a letterbox, and calls hardest before rain.",
      source: ala("Ranoidea caerulea"),
      activity: "nocturnal",
      zone: "waterEdge",
      stages: ["tadpole", "froglet", "adult", "old"],
      behaviour: "Sits very still near water, then shifts a little and settles again.",
      body: { kind: "frog", size: [6, 4], legs: 2 },
      palette: { b: "#6fae4e", d: "#43752f", l: "#a8d474", e: "#141a0c", w: "#e8f0d8" }
    },
    {
      key: "pademelon",
      slot: 1,
      common: "Red-necked pademelon",
      scientific: "Thylogale thetis",
      traits: ["Small and stocky with a rufous wash on the neck and shoulders", "Short thick tail"],
      iucn: "LC",
      fact: "Grazes at the rainforest edge at dusk and bolts straight back into cover at any sound.",
      source: ala("Thylogale thetis"),
      activity: "crepuscular",
      zone: "ground",
      stages: ["joey", "young-at-foot", "adult", "elder"],
      behaviour: "Edges out of the undergrowth, grazes, freezes, and slips back in.",
      body: { kind: "hopper", size: [9, 8], legs: 3, tail: { len: 5, style: "down" }, ears: 2, pouch: true },
      palette: { b: "#8a6a4e", d: "#5c4634", l: "#b89878", e: "#15100a", n: "#9a4e32" }
    },
    {
      key: "richmond-birdwing",
      slot: 2,
      common: "Richmond birdwing",
      scientific: "Ornithoptera richmondia",
      traits: ["Large black wings with brilliant green and gold panels", "Red spot at the base of the body"],
      iucn: "NE",
      national: "Listed as Vulnerable in New South Wales",
      fact: "One of the largest butterflies in subtropical Australia. Its caterpillars eat only a few native vines.",
      source: ala("Ornithoptera richmondia"),
      activity: "diurnal",
      zone: "sky",
      stages: ["caterpillar", "chrysalis", "adult", "old"],
      behaviour: "Drifts slowly across a clearing in long, unhurried glides.",
      body: { kind: "flyer", size: [9, 7] },
      palette: { d: "#15170f", b: "#1e2415", g: "#3fa05a", y: "#d8c24a", r: "#b83a2e" }
    },
    {
      key: "satin-bowerbird",
      slot: 3,
      common: "Satin bowerbird",
      scientific: "Ptilonorhynchus violaceus",
      traits: ["Adult male is glossy blue-black with violet eyes", "An avenue bower decorated with blue things"],
      iucn: "LC",
      fact: "Males collect blue objects and arrange them at the bower. Males take years to go from green to glossy blue-black.",
      source: ala("Ptilonorhynchus violaceus"),
      activity: "diurnal",
      zone: "ground",
      stages: ["chick", "fledgling", "green male", "glossy male"],
      behaviour: "Tends its bower, adding a blue item whenever the grove has been healthy a while.",
      flourish: "bower",
      body: { kind: "bird", size: [8, 6], beak: 2, tail: { len: 3, style: "down" }, legs: 1 },
      palette: { b: "#1b1a2e", d: "#0d0c18", l: "#3a3860", e: "#6a5ad8", y: "#c8c0a0", g: "#4a6a3a" }
    },
    {
      key: "alberts-lyrebird",
      slot: 4,
      common: "Albert's lyrebird",
      scientific: "Menura alberti",
      traits: ["Rich rufous-brown body with a pale throat", "Long filamentary tail, thrown forward when displaying"],
      iucn: "NT",
      fact: "Found only in a few mountain ranges on the Queensland\u2013New South Wales border; the largest population is on the Lamington plateau.",
      source: iucn("Menura alberti"),
      activity: "diurnal",
      zone: "ground",
      stages: ["chick", "fledgling", "adult", "elder"],
      behaviour: "Rakes through the leaf litter, and now and then throws its tail forward to display.",
      flourish: "display",
      body: { kind: "bird", size: [10, 7], beak: 2, tail: { len: 11, style: "fan" }, legs: 2 },
      palette: { b: "#7a4a2e", d: "#4a2c1a", l: "#b08a5e", e: "#120c06", w: "#d8c8a8", s: "#8a6a44" }
    }
  ],
  understory: [
    { key: "moss", label: "Moss and lichen", what: "Moss on the trunks \u2014 thickest when the grove is damp and healthy", colour: "#4e7040" },
    { key: "fern-frond", label: "Ground ferns", what: "Ferns fill the gaps as the ecosystem recovers", colour: "#3c6834" },
    { key: "fungi", label: "Bracket fungi", what: "Fungi on fallen wood", colour: "#c8a060" },
    { key: "blue-items", label: "Blue treasures", what: "What the bowerbird has collected so far", colour: "#3f6ad8" }
  ]
};

// src/regions/australia/tropical.ts
var tropicalNorth = {
  key: "tropical",
  hasWater: true,
  label: "Tropical north",
  note: "Fan palms and buttressed figs, a mangrove fringe, and a wet season that means it.",
  ground: ["#35492e", "#273a24", "#426038"],
  ambience: ["mist", "rain", "butterflies"],
  plants: [
    {
      key: "fan-palm",
      common: "Australian fan palm",
      scientific: "Licuala ramsayi",
      form: "palm",
      traits: ["Perfectly circular pleated fronds", "Slim straight trunk"],
      iucn: "NE",
      fact: "Grows in dense groves on wet lowland soil, and the fronds really are almost complete circles.",
      source: ala("Licuala ramsayi"),
      crown: ["#17331d", "#214a28", "#306434", "#438044", "#5fa05c"],
      bark: ["#8a8068", "#625a48", "#3c382c"],
      ailing: "dry",
      spread: 1.1
    },
    {
      key: "curtain-fig",
      common: "Curtain fig",
      scientific: "Ficus virens",
      form: "broadleaf",
      traits: ["Vast buttressed base and curtains of aerial roots", "Wide spreading crown"],
      iucn: "NE",
      fact: "The buttresses do the work that deep roots would elsewhere \u2014 rainforest soil is too thin for a taproot.",
      source: ala("Ficus virens"),
      crown: ["#122a18", "#1d4324", "#2b5c30", "#3f7842", "#5d9656"],
      bark: ["#8a8470", "#615c4c", "#3a372c"],
      ailing: "bare",
      spread: 1.3
    },
    {
      key: "red-mangrove",
      common: "Red mangrove",
      scientific: "Rhizophora stylosa",
      form: "shrub",
      traits: ["A tangle of arching stilt roots above the mud", "Glossy leathery leaves"],
      iucn: "LC",
      fact: "Its seedlings germinate while still attached to the parent and drop ready to root.",
      source: ala("Rhizophora stylosa"),
      crown: ["#1c3220", "#28492c", "#386138", "#4c7a48", "#6a9660"],
      bark: ["#7a6450", "#55463a", "#332b24"],
      ailing: "bare",
      spread: 1
    }
  ],
  creatures: [
    {
      key: "ulysses-butterfly",
      slot: 0,
      common: "Ulysses butterfly",
      scientific: "Papilio ulysses",
      traits: ["Electric iridescent blue upperwings", "Black margins and short tails on the hindwings"],
      iucn: "NE",
      fact: "The blue is structural, not pigment \u2014 it comes from the shape of the scales, so it flashes as it turns.",
      source: ala("Papilio ulysses"),
      activity: "diurnal",
      zone: "sky",
      stages: ["caterpillar", "chrysalis", "adult", "old"],
      behaviour: "Flickers through a clearing in bursts of blue, rarely settling for long.",
      body: { kind: "flyer", size: [8, 7] },
      palette: { d: "#0d0f1a", b: "#141828", g: "#2f7fe0", y: "#6ab4ff", r: "#1a3a7a" }
    },
    {
      key: "spectacled-flying-fox",
      slot: 1,
      common: "Spectacled flying-fox",
      scientific: "Pteropus conspicillatus",
      traits: ["Pale straw rings around the eyes", "Dark wings, held folded when hanging"],
      iucn: "EN",
      national: "Endangered under Australia\u2019s EPBC Act",
      fact: "An important disperser of rainforest seeds \u2014 a great deal of the forest is planted by bats.",
      source: iucn("Pteropus conspicillatus"),
      activity: "nocturnal",
      zone: "canopy",
      stages: ["pup", "juvenile", "adult", "elder"],
      behaviour: "Hangs folded in the canopy by day; sets off across the sky at dusk.",
      body: { kind: "flyer", size: [10, 6] },
      palette: { d: "#2a2018", b: "#3e3024", g: "#1a1410", y: "#d8c89a", r: "#6a5438" }
    },
    {
      key: "bennetts-tree-kangaroo",
      slot: 2,
      common: "Bennett's tree-kangaroo",
      scientific: "Dendrolagus bennettianus",
      traits: ["Dark brown body with a long pendulous tail", "Strong forelimbs and short broad hind feet"],
      iucn: "NT",
      fact: "The tree-kangaroo of the rainforest north of the Daintree River. It climbs by gripping with its forelimbs and hopping with its hind feet.",
      source: iucn("Dendrolagus bennettianus"),
      activity: "nocturnal",
      zone: "canopy",
      stages: ["joey", "young", "adult", "elder"],
      behaviour: "Sits hunched high in a fork, tail hanging straight down.",
      body: { kind: "bulky", size: [9, 8], tail: { len: 10, style: "down" }, ears: 2, legs: 2, pouch: true },
      palette: { b: "#5a4030", d: "#3a2a1e", l: "#8a6a4e", e: "#120c08", n: "#2a1e14" }
    },
    {
      key: "saltwater-crocodile",
      slot: 3,
      common: "Saltwater crocodile",
      scientific: "Crocodylus porosus",
      traits: ["Broad heavy snout and ridged armoured back", "Lies almost entirely submerged"],
      iucn: "LC",
      fact: "The largest living reptile. It can stay motionless for hours, which is most of what it does.",
      source: iucn("Crocodylus porosus"),
      activity: "cathemeral",
      zone: "waterEdge",
      stages: ["hatchling", "juvenile", "adult", "old"],
      still: true,
      behaviour: "Lies at the water\u2019s edge, barely moving. Only the eye-ridges really show.",
      body: { kind: "reptile", size: [20, 4], legs: 1, tail: { len: 12, style: "down" }, neck: 2 },
      palette: { b: "#4a4e38", d: "#2a2e20", l: "#6e7250", e: "#0a0c06", y: "#9a9460" }
    },
    {
      key: "southern-cassowary",
      slot: 4,
      common: "Southern cassowary",
      scientific: "Casuarius casuarius",
      traits: ["Tall horny casque on the head", "Blue and red bare neck over a glossy black body"],
      iucn: "LC",
      national: "Endangered under Australia\u2019s EPBC Act; the Wet Tropics population is Endangered under Queensland law",
      fact: "Globally the IUCN lists it as Least Concern, but the Australian population is Endangered. It disperses the seeds of dozens of rainforest trees that nothing else can swallow.",
      source: iucn("Casuarius casuarius"),
      activity: "diurnal",
      zone: "ground",
      stages: ["chick", "juvenile", "adult", "elder"],
      behaviour: "Steps out of the forest edge, pauses a long moment, and walks slowly on.",
      body: { kind: "bird", size: [11, 14], legs: 5, neck: 4, crest: 4, beak: 2, tail: { len: 0, style: "none" } },
      palette: { b: "#161418", d: "#0a090c", l: "#2e2a30", e: "#d8c060", y: "#8a6a30", w: "#3a7fc8", r: "#c0392b" }
    }
  ],
  understory: [
    { key: "vine", label: "Lianas", what: "Climbing vines through the canopy", colour: "#3a6030" },
    { key: "leaf-litter", label: "Leaf litter", what: "Deep litter on the forest floor", colour: "#6a5436" },
    { key: "epiphyte", label: "Epiphytes", what: "Plants growing on other plants \u2014 more of them when it is wet", colour: "#4e8044" },
    { key: "mangrove-mud", label: "Mangrove mud", what: "Tidal mud at the water\u2019s edge", colour: "#4a4236" }
  ]
};

// src/regions/australia/coastal.ts
var coastalHeath = {
  key: "coastal",
  hasWater: true,
  label: "Coastal heath and wetland",
  note: "Banksia and paperbark over still water, sedges, and waterlilies.",
  ground: ["#7d8a62", "#5e7250", "#8aa066"],
  ambience: ["fireflies", "butterflies", "passingFlock"],
  plants: [
    {
      key: "coast-banksia",
      common: "Coast banksia",
      scientific: "Banksia integrifolia",
      form: "broadleaf",
      traits: ["Upright cylindrical pale-yellow flower spikes", "Leaves dark above, silver-white beneath"],
      iucn: "LC",
      fact: "Flowers through autumn and winter, when very little else does, which makes it vital for honeyeaters.",
      source: ala("Banksia integrifolia"),
      crown: ["#28362c", "#374a34", "#4a6240", "#648050", "#88a468"],
      bark: ["#7a6e5c", "#564e40", "#342f26"],
      ailing: "dry"
    },
    {
      key: "paperbark",
      common: "Broad-leaved paperbark",
      scientific: "Melaleuca quinquenervia",
      form: "broadleaf",
      traits: ["Thick white papery bark peeling in sheets", "Creamy bottlebrush flower spikes"],
      iucn: "LC",
      fact: "The bark is layer on layer of dead tissue, which is why it survives fire and standing water alike.",
      source: ala("Melaleuca quinquenervia"),
      crown: ["#2b3a2c", "#3c5036", "#516a42", "#6c8a52", "#92ae6c"],
      bark: ["#e4ddcc", "#bdb5a2", "#8e8775"],
      ailing: "dry",
      spread: 0.95
    },
    {
      key: "pandanus",
      common: "Coastal pandanus",
      scientific: "Pandanus tectorius",
      form: "columnar",
      traits: ["Prop roots splaying out from the base", "Spiral rosettes of long strap leaves"],
      iucn: "LC",
      fact: 'The leaves spiral around the stem, which is where the old name "screw pine" comes from.',
      source: ala("Pandanus tectorius"),
      crown: ["#20381f", "#2d4c2a", "#3e6436", "#548046", "#749e5e"],
      bark: ["#9a8e74", "#6e6454", "#443e34"],
      ailing: "dry",
      spread: 1.05
    },
    {
      key: "spike-rush",
      common: "Tall spike-rush",
      scientific: "Eleocharis sphacelata",
      form: "hummock",
      traits: ["Dense stands of hollow upright green stems", "Stands in shallow water"],
      iucn: "LC",
      fact: "Grows straight out of standing water and gives waterbirds somewhere to nest.",
      source: ala("Eleocharis sphacelata"),
      crown: ["#2a4028", "#365434", "#466c3e", "#5c8a4c", "#7aa862"],
      bark: ["#5a6a44", "#424e32", "#2a3220"],
      ailing: "dry",
      spread: 0.75
    },
    {
      key: "waterlily",
      common: "Blue waterlily",
      scientific: "Nymphaea violacea",
      form: "shrub",
      traits: ["Flat round pads on the water surface", "Pale violet-blue flowers held just above"],
      iucn: "LC",
      fact: "Opens in the morning and closes again by afternoon, day after day.",
      source: ala("Nymphaea violacea"),
      crown: ["#24402a", "#2e5434", "#3c6a3e", "#4e8450", "#7f9ad8"],
      bark: ["#3a4a32", "#2a3826", "#1c261a"],
      ailing: "bare",
      spread: 0.7
    }
  ],
  creatures: [
    {
      key: "black-swan",
      slot: 0,
      common: "Black swan",
      scientific: "Cygnus atratus",
      traits: ["All-black plumage with a bright red bill", "White flight feathers that show only in flight"],
      iucn: "LC",
      fact: "Native to Australia and nowhere else originally. Pairs often stay together for years.",
      source: ala("Cygnus atratus"),
      activity: "diurnal",
      zone: "water",
      stages: ["cygnet", "juvenile", "adult", "elder"],
      behaviour: "Glides slowly across open water, dipping its long neck under.",
      body: { kind: "swimmer", size: [10, 6], neck: 5, beak: 2 },
      palette: { b: "#1c1a20", d: "#0e0d12", l: "#3a3742", e: "#c0392b", w: "#e8e4dc" }
    },
    {
      key: "rainbow-bee-eater",
      slot: 1,
      common: "Rainbow bee-eater",
      scientific: "Merops ornatus",
      traits: ["Green body with a copper crown and a black eye-stripe", "Two long thin tail streamers"],
      iucn: "LC",
      fact: "Catches bees in the air and rubs the sting out against a branch before swallowing them.",
      source: ala("Merops ornatus"),
      activity: "diurnal",
      zone: "sky",
      stages: ["chick", "fledgling", "adult", "elder"],
      behaviour: "Darts out from a perch, snatches something, and swings back to the same twig.",
      body: { kind: "bird", size: [7, 5], beak: 3, tail: { len: 5, style: "down" }, legs: 1 },
      palette: { b: "#4aa05a", d: "#2a6a3a", l: "#8ad078", e: "#15120a", y: "#d8a83a", k: "#1a1a1a", w: "#4a8ad8" }
    },
    {
      key: "long-necked-turtle",
      slot: 2,
      common: "Eastern long-necked turtle",
      scientific: "Chelodina longicollis",
      traits: ["A neck nearly as long as its shell", "Flat dark olive-brown carapace"],
      iucn: "LC",
      fact: "Tucks its neck sideways under the shell rim rather than pulling it straight back.",
      source: ala("Chelodina longicollis"),
      activity: "diurnal",
      zone: "water",
      stages: ["hatchling", "juvenile", "adult", "old"],
      behaviour: "Basks on a half-sunk log, then slides into the water without a sound.",
      body: { kind: "reptile", size: [8, 4], neck: 6, legs: 1, tail: { len: 2, style: "down" } },
      palette: { b: "#4a4232", d: "#2a251c", l: "#6e6448", e: "#0c0a06", y: "#c8c0a0" }
    },
    {
      key: "brolga",
      slot: 3,
      common: "Brolga",
      scientific: "Antigone rubicunda",
      traits: ["Tall silver-grey crane with a scarlet band across the head", "Long dark legs, trailing bustle of feathers"],
      iucn: "LC",
      fact: "Brolgas dance \u2014 leaping, bowing and tossing grass \u2014 and they do it outside the breeding season too.",
      source: ala("Antigone rubicunda"),
      activity: "diurnal",
      zone: "waterEdge",
      stages: ["chick", "fledgling", "adult", "elder"],
      behaviour: "Wades the shallows with slow deliberate steps, and now and then leaps into a dance.",
      flourish: "display",
      body: { kind: "wader", size: [9, 13], legs: 6, neck: 5, beak: 3, tail: { len: 3, style: "down" } },
      palette: { b: "#9aa0a6", d: "#6a7076", l: "#c8ccd2", e: "#141414", r: "#c0392b", k: "#3a3a3a" }
    },
    {
      key: "platypus",
      slot: 4,
      common: "Platypus",
      scientific: "Ornithorhynchus anatinus",
      traits: ["Soft duck-like bill and a flat paddle tail", "Dense dark brown waterproof fur"],
      iucn: "NT",
      fact: "Hunts with its eyes shut, finding prey by the faint electric fields of their muscles.",
      source: iucn("Ornithorhynchus anatinus"),
      activity: "crepuscular",
      zone: "water",
      stages: ["puggle", "juvenile", "adult", "elder"],
      behaviour: "Surfaces for a few seconds, rolls forward, and dives again.",
      flourish: "dive",
      body: { kind: "swimmer", size: [9, 4], beak: 3, tail: { len: 4, style: "down" } },
      palette: { b: "#4a3a2a", d: "#2a2018", l: "#6e5a42", e: "#0c0806", w: "#8a7258" }
    }
  ],
  understory: [
    { key: "sedge", label: "Sedges", what: "Sedge at the water\u2019s edge", colour: "#5e7a42" },
    { key: "lilypad", label: "Waterlily pads", what: "Lily pads \u2014 more of them as the water clears", colour: "#3e6a3c" },
    { key: "heath-flower", label: "Heath flowers", what: "Small heath blooms; they come back with the ecosystem", colour: "#d87aa8" },
    { key: "driftwood", label: "Driftwood", what: "Bleached wood on the bank", colour: "#b0a894" }
  ]
};

// src/regions/australia/outback.ts
var outback = {
  key: "outback",
  label: "Outback",
  note: "Red sand and spinifex under desert oaks and ghost gums, with rock outcrops behind.",
  ground: ["#b06a42", "#9a5433", "#c08a52"],
  ambience: ["heatShimmer", "passingFlock"],
  plants: [
    {
      key: "desert-oak",
      common: "Desert oak",
      scientific: "Allocasuarina decaisneana",
      form: "columnar",
      traits: ["Young trees are narrow dark spires", "Mature trees spread into a weeping grey-green crown"],
      iucn: "LC",
      fact: "Spends decades as a thin spire putting a taproot down to the water table before it spreads at all.",
      source: ala("Allocasuarina decaisneana"),
      crown: ["#20291f", "#2e3b28", "#3e5033", "#536742", "#6e8356"],
      bark: ["#6a5442", "#4a3a2c", "#2e241c"],
      ailing: "dry",
      spread: 0.8
    },
    {
      key: "ghost-gum",
      common: "Ghost gum",
      scientific: "Corymbia aparrerinja",
      form: "broadleaf",
      traits: ["Brilliant chalk-white smooth trunk", "Sparse bright green crown"],
      iucn: "LC",
      fact: "The white powder on the bark reflects heat, and comes off on your hand.",
      source: ala("Corymbia aparrerinja"),
      crown: ["#36442a", "#475a33", "#5c723f", "#78904f", "#9cb268"],
      bark: ["#f2efe6", "#d4cfc0", "#ada798"],
      ailing: "dry",
      spread: 1
    },
    {
      key: "spinifex",
      common: "Spinifex",
      scientific: "Triodia basedowii",
      form: "hummock",
      traits: ["Low spiky dome, often hollow in the middle", "Blue-green needle-sharp leaves"],
      iucn: "LC",
      fact: "Grows outwards in a ring as the centre dies, so the oldest hummocks are rings of grass.",
      source: ala("Triodia basedowii"),
      crown: ["#5a5e32", "#6e7340", "#86894c", "#a0a05c", "#bcb673"],
      bark: ["#7a6a44", "#5a4e32", "#3c3422"],
      ailing: "dry",
      spread: 0.65
    },
    {
      key: "sturts-desert-pea",
      common: "Sturt's desert pea",
      scientific: "Swainsona formosa",
      form: "shrub",
      traits: ["Blood-red flowers with a glossy black boss", "Low trailing grey-green stems"],
      iucn: "LC",
      fact: "South Australia's floral emblem. The seed can wait years in the sand for enough rain.",
      source: ala("Swainsona formosa"),
      crown: ["#4a4434", "#5e5840", "#746c4c", "#8e8458", "#c0392b"],
      bark: ["#6a6048", "#4c4434", "#302b20"],
      ailing: "dry",
      spread: 0.6
    }
  ],
  creatures: [
    {
      key: "emu",
      slot: 0,
      common: "Emu",
      scientific: "Dromaius novaehollandiae",
      traits: ["Shaggy drooping grey-brown plumage", "Long bare blue-grey neck and very long legs"],
      iucn: "LC",
      fact: "The male incubates the eggs and raises the chicks, barely eating for eight weeks.",
      source: ala("Dromaius novaehollandiae"),
      activity: "diurnal",
      zone: "ground",
      stages: ["chick", "juvenile", "adult", "elder"],
      behaviour: "Walks in pairs, heads up, stopping to pick at the ground.",
      flourish: "pair",
      body: { kind: "bird", size: [11, 13], legs: 6, neck: 5, beak: 2, tail: { len: 0, style: "none" } },
      palette: { b: "#6a6052", d: "#443d33", l: "#948878", e: "#120f0b", w: "#5a7a96", y: "#8a8070" }
    },
    {
      key: "red-kangaroo",
      slot: 1,
      common: "Red kangaroo",
      scientific: "Osphranter rufus",
      traits: ["Males rusty red, females blue-grey", "Very long powerful hind legs and a thick tail"],
      iucn: "LC",
      fact: "The largest living marsupial. It can cover eight metres in a single bound without hurrying.",
      source: ala("Osphranter rufus"),
      activity: "crepuscular",
      zone: "ground",
      stages: ["joey", "young-at-foot", "adult", "old man"],
      behaviour: "Rests in whatever shade it can find by day; grazes at dawn and dusk.",
      body: { kind: "hopper", size: [14, 13], legs: 5, tail: { len: 9, style: "down" }, ears: 3, pouch: true },
      palette: { b: "#a8613c", d: "#74402a", l: "#cf8f60", e: "#160f09", n: "#2c1c12" }
    },
    {
      key: "thorny-devil",
      slot: 2,
      common: "Thorny devil",
      scientific: "Moloch horridus",
      traits: ["Covered in conical spines, including two over the eyes", "Banded tan, rust and cream"],
      iucn: "LC",
      fact: "Channels dew along grooves between its scales to the corners of its mouth, so it drinks through its skin.",
      source: ala("Moloch horridus"),
      activity: "diurnal",
      zone: "ground",
      stages: ["hatchling", "juvenile", "adult", "old"],
      behaviour: "Moves in an odd rocking shuffle, freezing between steps.",
      body: { kind: "reptile", size: [7, 4], legs: 2, tail: { len: 4, style: "down" }, spines: true },
      palette: { b: "#b08048", d: "#7a5430", l: "#d8b478", e: "#120c06", y: "#e8d0a0" }
    },
    {
      key: "wedge-tailed-eagle",
      slot: 3,
      common: "Wedge-tailed eagle",
      scientific: "Aquila audax",
      traits: ["Long diamond-shaped wedge tail", "Wings held in a shallow V when soaring"],
      iucn: "LC",
      fact: "Australia's largest bird of prey, with a wingspan past two metres. It can soar for hours without a wingbeat.",
      source: ala("Aquila audax"),
      activity: "diurnal",
      zone: "sky",
      stages: ["chick", "fledgling", "adult", "elder"],
      behaviour: "Circles very high and very slowly, barely moving its wings.",
      flourish: "soar",
      body: { kind: "flyer", size: [15, 5], tail: { len: 4, style: "fan" }, beak: 2 },
      palette: { d: "#2a2018", b: "#44352a", g: "#1a1410", y: "#d8a83a", r: "#6a5238" }
    },
    {
      key: "bilby",
      slot: 4,
      common: "Greater bilby",
      scientific: "Macrotis lagotis",
      traits: ["Enormous rabbit-like ears", "Black tail with a white brush at the tip"],
      iucn: "VU",
      national: "Vulnerable under Australia\u2019s EPBC Act",
      fact: "Digs spiralling burrows up to three metres long, and a great many other desert animals shelter in them.",
      source: iucn("Macrotis lagotis"),
      activity: "nocturnal",
      zone: "burrow",
      stages: ["joey", "young", "adult", "elder"],
      behaviour: "Comes out well after dark, digs busily, and bolts back down at any noise.",
      flourish: "dig",
      body: { kind: "quadruped", size: [8, 5], legs: 2, ears: 5, tail: { len: 6, style: "down" } },
      palette: { b: "#b0a496", d: "#7a6f62", l: "#dcd4c6", e: "#14100c", n: "#1a1a1a", w: "#f0ece2" }
    }
  ],
  understory: [
    { key: "red-sand", label: "Red sand", what: "Iron-stained sand \u2014 the colour of most of the interior", colour: "#b3603a" },
    { key: "rock", label: "Rock outcrop", what: "Weathered sandstone breaking the surface", colour: "#8a4e32" },
    { key: "desert-pea", label: "Sturt's desert pea", what: "Flowers after rain, and after a good run of study", colour: "#c0392b" },
    { key: "dry-grass", label: "Dry grass", what: "Sparse dry grass between the hummocks", colour: "#b09a60" }
  ]
};

// src/regions/australia/alpine.ts
var alpine = {
  key: "alpine",
  label: "Alpine high country",
  note: "Twisted snow gums over everlasting daisies and sphagnum bog, under snow in winter.",
  ground: ["#7f8a6e", "#5e6b52", "#8c9a72"],
  ambience: ["snow", "mist"],
  plants: [
    {
      key: "snow-gum",
      common: "Snow gum",
      scientific: "Eucalyptus pauciflora",
      form: "broadleaf",
      traits: ["Twisted leaning trunk streaked grey, cream, olive and red", "Sparse, wind-shaped crown"],
      iucn: "LC",
      fact: "Grows higher than any other eucalypt, and the streaks on the bark come from where strips have peeled at different times.",
      source: ala("Eucalyptus pauciflora"),
      crown: ["#2e3a2e", "#3e4e38", "#526444", "#6c8054", "#8fa470"],
      bark: ["#e0d8c6", "#a89a84", "#7a6a58"],
      ailing: "dry",
      spread: 1.1
    },
    {
      key: "alpine-everlasting",
      common: "Alpine everlasting",
      scientific: "Xerochrysum subundulatum",
      form: "shrub",
      traits: ["Golden papery daisy flowers", "Low grey-green rosettes"],
      iucn: "LC",
      fact: "The petals are papery bracts, not true petals, which is why they keep their colour long after drying.",
      source: ala("Xerochrysum subundulatum"),
      crown: ["#46502e", "#5a6438", "#707844", "#8a8c50", "#e0c048"],
      bark: ["#5e5a44", "#444030", "#2c2a20"],
      ailing: "dry",
      spread: 0.6
    },
    {
      key: "sphagnum",
      common: "Sphagnum moss",
      scientific: "Sphagnum cristatum",
      form: "hummock",
      traits: ["Soft bright green saturated cushions", "Sits in wet hollows"],
      iucn: "NE",
      fact: "Holds many times its own weight in water and feeds the alpine streams slowly all summer.",
      source: ala("Sphagnum cristatum"),
      crown: ["#3a5a34", "#4a6e3e", "#5c8448", "#729a54", "#90b468"],
      bark: ["#4a5438", "#36402a", "#242c1c"],
      ailing: "dry",
      spread: 0.55
    },
    {
      key: "candle-heath",
      common: "Candle heath",
      scientific: "Richea continentis",
      form: "shrub",
      traits: ["Stiff upright spiky leaves", "Dense cream flower spikes like candles"],
      iucn: "LC",
      fact: "Forms thickets around the edge of alpine bogs and holds the peat together.",
      source: ala("Richea continentis"),
      crown: ["#2c3a28", "#3a4c32", "#4c623c", "#627a4a", "#d8d0b0"],
      bark: ["#5a5240", "#413a2c", "#2a251c"],
      ailing: "dry",
      spread: 0.7
    }
  ],
  creatures: [
    {
      key: "crimson-rosella",
      slot: 0,
      common: "Crimson rosella",
      scientific: "Platycercus elegans",
      traits: ["Deep crimson body with violet-blue cheeks", "Black-scalloped blue wings and blue tail"],
      iucn: "LC",
      fact: "Young birds are mostly green and take over a year to turn fully crimson.",
      source: ala("Platycercus elegans"),
      activity: "diurnal",
      zone: "canopy",
      stages: ["chick", "green juvenile", "adult", "elder"],
      behaviour: "Works along a branch, hanging sideways to reach seed.",
      body: { kind: "bird", size: [8, 6], beak: 2, tail: { len: 6, style: "down" }, legs: 1 },
      palette: { b: "#c0202c", d: "#7a1018", l: "#e85a52", e: "#120808", w: "#2a4a9a", k: "#1a1a2a" }
    },
    {
      key: "wombat",
      slot: 1,
      common: "Common wombat",
      scientific: "Vombatus ursinus",
      traits: ["Barrel-shaped body low to the ground", "Broad flat nose, tiny ears, no visible tail"],
      iucn: "LC",
      fact: "Has a backwards-facing pouch, so digging does not fill it with soil.",
      source: ala("Vombatus ursinus"),
      activity: "nocturnal",
      zone: "burrow",
      stages: ["joey", "young", "adult", "elder"],
      behaviour: "Trundles out of its burrow after dark and grazes steadily, nose down.",
      flourish: "dig",
      body: { kind: "bulky", size: [11, 6], legs: 2, ears: 1, tail: { len: 0, style: "none" } },
      palette: { b: "#7a6a52", d: "#50452f", l: "#a2927a", e: "#120e08", n: "#241c14" }
    },
    {
      key: "echidna",
      slot: 2,
      common: "Short-beaked echidna",
      scientific: "Tachyglossus aculeatus",
      traits: ["Covered in cream and black spines", "Long bare tubular snout"],
      iucn: "LC",
      fact: "One of only two egg-laying mammals, and the young is called a puggle.",
      source: ala("Tachyglossus aculeatus"),
      activity: "diurnal",
      zone: "ground",
      stages: ["puggle", "juvenile", "adult", "elder"],
      behaviour: "Waddles along nosing at the ground, then digs straight down and disappears.",
      flourish: "dig",
      body: { kind: "bulky", size: [8, 5], legs: 1, beak: 3, spines: true, tail: { len: 0, style: "none" } },
      palette: { b: "#4a3a28", d: "#2a2018", l: "#c8a860", e: "#0e0a06", n: "#1a1410" }
    },
    {
      key: "corroboree-frog",
      slot: 3,
      common: "Southern corroboree frog",
      scientific: "Pseudophryne corroboree",
      traits: ["Vivid yellow and black longitudinal stripes", "Very small \u2014 around three centimetres"],
      iucn: "CR",
      fact: "Found only in a small area of Kosciuszko. It makes its own poison rather than taking it from its food, which is unusual.",
      source: iucn("Pseudophryne corroboree"),
      activity: "diurnal",
      zone: "waterEdge",
      stages: ["tadpole", "froglet", "adult", "old"],
      behaviour: "Sits in sphagnum at the bog edge, bright against the moss, barely moving.",
      body: { kind: "frog", size: [5, 3], legs: 1 },
      palette: { b: "#e8c81e", d: "#141410", l: "#f4e468", e: "#0a0a06", w: "#2a2a1e" }
    },
    {
      key: "mountain-pygmy-possum",
      slot: 4,
      common: "Mountain pygmy-possum",
      scientific: "Burramys parvus",
      traits: ["Tiny, with a long thin prehensile tail", "Soft grey-brown above, cream below"],
      iucn: "CR",
      fact: "The only Australian mammal that lives nowhere but the alpine zone, and the only one that truly hibernates under snow.",
      source: iucn("Burramys parvus"),
      activity: "nocturnal",
      zone: "slope",
      stages: ["joey", "young", "adult", "elder"],
      behaviour: "Darts between boulders after dark, tail curled, and vanishes into a crevice.",
      body: { kind: "quadruped", size: [6, 3], legs: 1, ears: 2, tail: { len: 7, style: "curl" } },
      palette: { b: "#8a7a68", d: "#5a4e40", l: "#c4b8a4", e: "#120e0a", n: "#e0d8c8" }
    }
  ],
  understory: [
    { key: "snowgrass", label: "Snow grass", what: "Tussocks between the rocks", colour: "#8a9068" },
    { key: "everlasting", label: "Everlasting daisies", what: "Daisies carpet the slopes in a good summer", colour: "#e0c048" },
    { key: "bog", label: "Sphagnum bog", what: "Wet moss in the hollows \u2014 the source of the streams", colour: "#5c8448" },
    { key: "granite", label: "Granite boulders", what: "Weathered granite, where the pygmy-possum lives", colour: "#9a9a90" }
  ]
};

// src/regions/australia/index.ts
var australia = {
  key: "australia",
  label: "Australia",
  note: "Six biomes, from the red centre to the alpine high country.",
  hemisphere: "south",
  defaultStages: ["young", "juvenile", "adult", "elder"],
  seasons: {
    model: "southern",
    months: [
      "summer",
      // Jan
      "summer",
      // Feb
      "autumn",
      // Mar
      "autumn",
      // Apr
      "autumn",
      // May
      "winter",
      // Jun
      "winter",
      // Jul
      "winter",
      // Aug
      "spring",
      // Sep
      "spring",
      // Oct
      "spring",
      // Nov
      "summer"
      // Dec
    ],
    notes: {
      summer: "Hot and dry in the south, wet in the tropical north. Jacaranda and Christmas bush are out.",
      autumn: "Cooling off. The wet season tails away in the north.",
      winter: "Snow in the high country. Wattle starts to bloom.",
      spring: "Wattle at its peak, then jacaranda towards the end."
    }
  },
  backdrops: [
    {
      key: "ranges",
      label: "Blue ranges",
      note: "Receding ridgelines going hazy blue with distance \u2014 the eucalypt oil haze that gives them the name.",
      sky: ["#6b9fd4", "#86b4de", "#a2c8e6", "#bdd7ea", "#d4e3ea", "#e6efe8"],
      far: "#8fa2c0",
      near: "#6e8a92",
      form: "rolling"
    },
    {
      key: "escarpment",
      label: "Sandstone escarpment",
      note: "A long red cliff line above the treetops, the way the interior breaks out of the plain.",
      sky: ["#7898c4", "#9aabc2", "#cebfa2", "#ebc48e", "#f5d69c", "#fae4b4"],
      far: "#a8745a",
      near: "#8a5a42",
      form: "plateau"
    },
    {
      key: "southern-night",
      label: "Southern night",
      note: "The Milky Way standing almost overhead, as it does from the southern half of the world.",
      sky: ["#05081a", "#0a1230", "#121d44", "#1a2856", "#243464", "#304274"],
      far: "#1c2644",
      near: "#15203c",
      night: true,
      form: "rolling"
    }
  ],
  biomes: [eucalyptWoodland, subtropicalRainforest, tropicalNorth, coastalHeath, outback, alpine]
};

// src/regions/aotearoa/index.ts
var aotearoa = {
  key: "aotearoa",
  label: "Aotearoa New Zealand",
  note: "Kauri and podocarp forest, and the tussock country of the Southern Alps.",
  hemisphere: "south",
  defaultStages: ["chick", "juvenile", "adult", "elder"],
  seasons: {
    model: "southern",
    months: [
      "summer",
      "summer",
      "autumn",
      "autumn",
      "autumn",
      "winter",
      "winter",
      "winter",
      "spring",
      "spring",
      "spring",
      "summer"
    ],
    notes: {
      summer: "Long days. R\u0101t\u0101 flowers red in the forest canopy.",
      autumn: "Beech forest turns; the first snow dusts the tops.",
      winter: "Deep snow in the Alps. The bush stays green \u2014 almost nothing here is deciduous.",
      spring: "Mount Cook lilies out on the scree once the snow retreats."
    }
  },
  backdrops: [
    {
      key: "fiord",
      label: "Fiord",
      note: "Sheer walls dropping straight into dark water, with a waterfall thread down one face.",
      sky: ["#6e8296", "#8296a8", "#9aaab8", "#b2bfc8", "#c8d2d6", "#dce2e2"],
      far: "#4a5c66",
      near: "#2e3e46",
      form: "fjord"
    },
    {
      key: "snowy-peaks",
      label: "Southern Alps",
      note: "A hard white skyline of snow and rock above golden tussock.",
      sky: ["#5f8fc4", "#7fa5d0", "#9dbbdc", "#bcd0e4", "#d6e0e8", "#eaeee8"],
      far: "#c8d4e0",
      near: "#7e8c90",
      form: "peaks"
    },
    {
      key: "misty-bush-night",
      label: "Misty bush at night",
      note: "Low cloud caught in the canopy, and the Southern Cross above it.",
      sky: ["#060a16", "#0c142c", "#141f3e", "#1c2a4e", "#26365c", "#32446c"],
      far: "#1a2838",
      near: "#121e2a",
      night: true,
      form: "canopy"
    }
  ],
  biomes: [
    {
      key: "kauri-forest",
      label: "Kauri and podocarp forest",
      note: "Massive kauri trunks, tree ferns beneath, and birdsong all through it.",
      ground: ["#3a4a34", "#2b3a28", "#47603c"],
      ambience: ["mist", "glowworms"],
      plants: [
        {
          key: "kauri",
          common: "Kauri",
          scientific: "Agathis australis",
          localName: "kauri",
          localLanguage: "te reo M\u0101ori",
          form: "conifer",
          traits: ["Enormous smooth grey columnar trunk, free of branches for most of its height", "Crown of small leathery leaves high above"],
          iucn: "NE",
          national: "Threatened by kauri dieback (Phytophthora agathidicida); tracks through kauri forest are managed to limit its spread",
          fact: "Among the longest-lived trees anywhere \u2014 the largest, T\u0101ne Mahuta, is thought to be well over a thousand years old.",
          source: gbif("Agathis australis"),
          crown: ["#1c3024", "#28452e", "#375c3a", "#4b7648", "#6a9460"],
          bark: ["#9a948a", "#716c62", "#4a463e"],
          ailing: "bare",
          spread: 1.2
        },
        {
          key: "rimu",
          common: "Rimu",
          scientific: "Dacrydium cupressinum",
          localName: "rimu",
          localLanguage: "te reo M\u0101ori",
          form: "conifer",
          traits: ["Weeping curtain-like foliage", "Tall narrow crown emerging above the canopy"],
          iucn: "LC",
          fact: "A podocarp, not a pine. Young trees weep so heavily they look like green waterfalls.",
          source: gbif("Dacrydium cupressinum"),
          crown: ["#18291e", "#223c28", "#2f5232", "#406a40", "#5c8856"],
          bark: ["#6a5a4a", "#4a3e34", "#2c2520"],
          ailing: "bare",
          spread: 0.85
        },
        {
          key: "ponga",
          common: "Silver fern",
          scientific: "Alsophila dealbata",
          localName: "ponga",
          localLanguage: "te reo M\u0101ori",
          form: "fern",
          traits: ["Underside of the fronds is silver-white", "Unfurling koru at the crown"],
          iucn: "NE",
          fact: "The silver underside shows up in moonlight, and was used to mark tracks through the bush at night.",
          source: gbif("Alsophila dealbata"),
          crown: ["#1e3422", "#2a4a2c", "#3a6238", "#4e7c48", "#8aa882"],
          bark: ["#6e6252", "#4e453a", "#302a24"],
          ailing: "dry",
          spread: 1.15
        },
        {
          key: "harakeke",
          common: "New Zealand flax",
          scientific: "Phormium tenax",
          localName: "harakeke",
          localLanguage: "te reo M\u0101ori",
          form: "columnar",
          traits: ["Stiff upright fans of long strap leaves", "Tall dark flower stalks well above the leaves"],
          iucn: "LC",
          fact: "T\u016B\u012B and bellbirds feed on the nectar, and the flower stalks stand far above everything around them.",
          source: gbif("Phormium tenax"),
          crown: ["#243a24", "#2f4e2c", "#3e6436", "#527c44", "#6e9a5a"],
          bark: ["#5a5440", "#403c2e", "#2a2720"],
          ailing: "dry",
          spread: 0.75
        }
      ],
      creatures: [
        {
          key: "tui",
          slot: 0,
          common: "T\u016B\u012B",
          scientific: "Prosthemadera novaeseelandiae",
          localName: "t\u016B\u012B",
          localLanguage: "te reo M\u0101ori",
          traits: ["Two white throat tufts against glossy blue-black", "Iridescent green and bronze sheen in good light"],
          iucn: "LC",
          fact: "Has two voiceboxes and sings notes outside human hearing, so there are gaps in its song where something is happening you cannot hear.",
          source: nzbirds("tui"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Hangs upside down at flax flowers, then clatters off noisily between trees.",
          body: { kind: "bird", size: [8, 6], beak: 3, tail: { len: 4, style: "down" }, legs: 1 },
          palette: { b: "#16202a", d: "#0a1016", l: "#2c4a40", e: "#f4f2ec", w: "#1c5a4a", y: "#2a2a2a" }
        },
        {
          key: "kereru",
          slot: 1,
          common: "New Zealand pigeon",
          scientific: "Hemiphaga novaeseelandiae",
          localName: "kerer\u016B",
          localLanguage: "te reo M\u0101ori",
          traits: ["Big, heavy, iridescent green-bronze above", "Crisp white waistcoat below"],
          iucn: "LC",
          fact: "The only bird left big enough to swallow the largest native fruits whole, so several forest trees depend on it entirely.",
          source: nzbirds("new-zealand-pigeon"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Sits heavily on a branch eating leaves, and takes off with a loud whoomp of wings.",
          body: { kind: "bird", size: [9, 7], beak: 2, tail: { len: 4, style: "down" }, legs: 1 },
          palette: { b: "#2e4a44", d: "#1a2e2a", l: "#4a6e5e", e: "#f2f0ea", w: "#8a2a3a", y: "#c03030" }
        },
        {
          key: "wetapunga",
          slot: 2,
          common: "Giant w\u0113t\u0101",
          scientific: "Deinacrida heteracantha",
          localName: "w\u0113t\u0101punga",
          localLanguage: "te reo M\u0101ori",
          traits: ["Very heavy armoured brown body", "Long spined hind legs and long antennae"],
          iucn: "VU",
          fact: 'One of the heaviest insects in the world. Its name means roughly "god of ugly things", which is unkind of us.',
          source: iucn("Deinacrida heteracantha"),
          activity: "nocturnal",
          zone: "trunk",
          stages: ["nymph", "juvenile", "adult", "old"],
          behaviour: "Clings to bark after dark, antennae sweeping slowly.",
          body: { kind: "reptile", size: [8, 4], legs: 2, tail: { len: 3, style: "up" }, spines: true },
          palette: { b: "#6a5436", d: "#3e2f1c", l: "#9a8050", e: "#120c06", y: "#c0a060" }
        },
        {
          key: "tuatara",
          slot: 3,
          common: "Tuatara",
          scientific: "Sphenodon punctatus",
          localName: "tuatara",
          localLanguage: "te reo M\u0101ori",
          traits: ["A crest of soft white spines along the back", "Heavy head, loose olive-grey skin"],
          iucn: "LC",
          national: "Protected; restricted largely to predator-free offshore islands and fenced sanctuaries",
          fact: "Not a lizard at all \u2014 the last survivor of an order that otherwise died out with the dinosaurs. It can live past a hundred.",
          source: iucn("Sphenodon punctatus"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["hatchling", "juvenile", "adult", "old"],
          behaviour: "Sits at the mouth of a burrow almost perfectly still, for a very long time.",
          still: true,
          body: { kind: "reptile", size: [11, 4], legs: 2, tail: { len: 8, style: "down" }, crest: 2, neck: 2 },
          palette: { b: "#6a6a50", d: "#3e4030", l: "#92906e", e: "#0c0c06", y: "#d8d4b8" }
        },
        {
          key: "kiwi",
          slot: 4,
          common: "North Island brown kiwi",
          scientific: "Apteryx mantelli",
          localName: "kiwi",
          localLanguage: "te reo M\u0101ori",
          traits: ["Round shaggy body with no visible wings or tail", "Very long pale bill with nostrils at the tip"],
          iucn: "VU",
          fact: "The only bird with nostrils at the end of its bill. It finds worms by smell, snuffling as it goes.",
          source: iucn("Apteryx mantelli"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Works through the leaf litter after dark, probing deep with that long bill.",
          body: { kind: "bird", size: [9, 7], beak: 7, legs: 3, tail: { len: 0, style: "none" } },
          palette: { b: "#6a5a46", d: "#44382a", l: "#8e7c62", e: "#120e08", y: "#d8cdb4", w: "#2a2218" }
        }
      ],
      understory: [
        { key: "moss", label: "Moss", what: "Moss on everything \u2014 this forest is never dry", colour: "#4e7244" },
        { key: "koru", label: "Unfurling fronds", what: "New fern fronds; more of them as the grove recovers", colour: "#6a9a52" },
        { key: "kauri-gum", label: "Kauri gum", what: "Hardened resin on the trunks", colour: "#c89a4a" },
        { key: "glowworm", label: "Glow-worms", what: "Arachnocampa larvae in the damp banks, at night", colour: "#7ad8c0" }
      ]
    },
    {
      key: "southern-alps",
      label: "Southern Alps",
      note: "Golden snow tussock and scree under a hard line of snow and rock.",
      ground: ["#9a8e5e", "#7d7248", "#b0a068"],
      ambience: ["snow", "mist"],
      plants: [
        {
          key: "mountain-beech",
          common: "Mountain beech",
          scientific: "Fuscospora cliffortioides",
          localName: "tawhairauriki",
          localLanguage: "te reo M\u0101ori",
          form: "broadleaf",
          traits: ["Small dark leathery leaves in dense flat sprays", "Wind-flattened crown, abruptly ending at the treeline"],
          iucn: "NE",
          fact: "Forms a treeline so sharp it looks drawn with a ruler \u2014 above a certain altitude it simply stops.",
          source: gbif("Fuscospora cliffortioides"),
          crown: ["#1c2a1e", "#283c28", "#365032", "#486a40", "#648856"],
          bark: ["#60584a", "#443e34", "#2a2620"],
          ailing: "bare",
          spread: 0.9
        },
        {
          key: "snow-tussock",
          common: "Narrow-leaved snow tussock",
          scientific: "Chionochloa rigida",
          form: "hummock",
          traits: ["Big golden arching tussock", "Catches the light from behind"],
          iucn: "NE",
          fact: "Combs moisture out of the fog, which is part of why these catchments run so reliably.",
          source: gbif("Chionochloa rigida"),
          crown: ["#6a5c30", "#86723c", "#a28a48", "#bfa458", "#dcc272"],
          bark: ["#7a6a40", "#584c2e", "#3a321f"],
          ailing: "dry",
          spread: 0.7
        },
        {
          key: "mount-cook-lily",
          common: "Mount Cook lily",
          scientific: "Ranunculus lyallii",
          form: "shrub",
          traits: ["Big round glossy leaves that hold water like a dish", "Large white flowers with gold centres"],
          iucn: "NE",
          fact: "The largest buttercup in the world, and not a lily at all.",
          source: gbif("Ranunculus lyallii"),
          crown: ["#2e4430", "#3c583a", "#4e7046", "#648a56", "#f0f0e4"],
          bark: ["#4a5440", "#36402e", "#242a1e"],
          ailing: "dry",
          spread: 0.6
        }
      ],
      creatures: [
        {
          key: "kea",
          slot: 0,
          common: "Kea",
          scientific: "Nestor notabilis",
          localName: "kea",
          localLanguage: "te reo M\u0101ori",
          traits: ["Olive-green body with brilliant orange under the wings", "Long curved grey-brown upper bill"],
          iucn: "EN",
          fact: "The only true alpine parrot, and relentlessly inquisitive \u2014 it will dismantle a car aerial for the fun of it.",
          source: iucn("Nestor notabilis"),
          activity: "diurnal",
          zone: "slope",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Hops about the rocks pulling at things, and flashes orange whenever it opens its wings.",
          body: { kind: "bird", size: [10, 8], beak: 4, tail: { len: 5, style: "down" }, legs: 2 },
          palette: { b: "#5a6a34", d: "#3a4620", l: "#7f8e4e", e: "#120e08", y: "#e07a28", w: "#4a4438" }
        },
        {
          key: "pihoihoi",
          slot: 1,
          common: "New Zealand pipit",
          scientific: "Anthus novaeseelandiae",
          localName: "p\u012Bhoihoi",
          localLanguage: "te reo M\u0101ori",
          traits: ["Streaked brown, with a pale eyebrow", "Constantly bobs its tail"],
          iucn: "LC",
          fact: "Runs rather than hops, and flicks its tail almost without stopping.",
          source: nzbirds("new-zealand-pipit"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Runs a few steps across open ground, stops, bobs its tail, runs on.",
          body: { kind: "bird", size: [6, 4], beak: 2, tail: { len: 4, style: "down" }, legs: 2 },
          palette: { b: "#8a7656", d: "#5a4c34", l: "#bfae8c", e: "#120e08", y: "#d8cdb0", w: "#3a3024" }
        },
        {
          key: "piwauwau",
          slot: 2,
          common: "New Zealand rock wren",
          scientific: "Xenicus gilviventris",
          localName: "p\u012Bwauwau",
          localLanguage: "te reo M\u0101ori",
          traits: ["Tiny and almost tailless", "Olive-green above, yellow flanks, long toes"],
          iucn: "EN",
          fact: "New Zealand's only true alpine bird \u2014 it stays above the treeline all winter, under the snow.",
          source: iucn("Xenicus gilviventris"),
          activity: "diurnal",
          zone: "slope",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Bobs on a rock, flicks between boulders, and is gone into a crevice.",
          body: { kind: "bird", size: [4, 4], beak: 2, tail: { len: 1, style: "up" }, legs: 2 },
          palette: { b: "#6a7a44", d: "#44502a", l: "#9aa868", e: "#100c06", y: "#d8c060", w: "#3a4020" }
        },
        {
          key: "karearea",
          slot: 3,
          common: "New Zealand falcon",
          scientific: "Falco novaeseelandiae",
          localName: "k\u0101rearea",
          localLanguage: "te reo M\u0101ori",
          traits: ["Dark brown above, heavily streaked below", "Pointed wings and a long barred tail"],
          iucn: "LC",
          national: "At Risk \u2014 Recovering under the New Zealand Threat Classification System",
          fact: "Hunts in level flight at well over a hundred kilometres an hour, and will see off birds several times its size.",
          source: iucn("Falco novaeseelandiae"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Cuts fast and low across the tussock, then swings up onto a rock to watch.",
          body: { kind: "flyer", size: [11, 5], tail: { len: 5, style: "down" }, beak: 2 },
          palette: { d: "#3a2e22", b: "#55432f", g: "#241c14", y: "#d8c060", r: "#8a7250" }
        },
        {
          key: "takahe",
          slot: 4,
          common: "Takah\u0113",
          scientific: "Porphyrio hochstetteri",
          localName: "takah\u0113",
          localLanguage: "te reo M\u0101ori",
          traits: ["Heavy flightless body in deep blue and olive-green", "Massive scarlet bill and matching legs"],
          iucn: "EN",
          fact: "Declared extinct, then found again in 1948 in a valley in the Murchison Mountains. There are still only a few hundred.",
          source: iucn("Porphyrio hochstetteri"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Pulls a tussock stem out, holds it in one foot, and eats the soft base.",
          body: { kind: "bird", size: [11, 9], beak: 3, legs: 3, tail: { len: 2, style: "up" }, neck: 2 },
          palette: { b: "#20467a", d: "#142c52", l: "#3a6a9a", e: "#c0302a", y: "#e04a30", w: "#2a6a4a" }
        }
      ],
      understory: [
        { key: "tussock", label: "Snow tussock", what: "Golden tussock, thicker where it is sheltered", colour: "#bfa458" },
        { key: "scree", label: "Scree", what: "Loose shattered rock below the bluffs", colour: "#8e8c86" },
        { key: "cushion", label: "Cushion plants", what: "Tight cushions hugging the ground out of the wind", colour: "#6a8450" },
        { key: "snowpatch", label: "Snow patch", what: "Old snow lingering in the shade", colour: "#e8eef4" }
      ]
    }
  ]
};

// src/regions/japan/index.ts
var japan = {
  key: "japan",
  label: "Japan",
  note: "Satoyama woodland of cedar and maple, and the snow country of the north.",
  hemisphere: "north",
  defaultStages: ["young", "juvenile", "adult", "elder"],
  seasons: {
    model: "northern",
    months: [
      "winter",
      "winter",
      "spring",
      "spring",
      "spring",
      "summer",
      "summer",
      "summer",
      "autumn",
      "autumn",
      "autumn",
      "winter"
    ],
    notes: {
      spring: "Cherry blossom, then fresh green on the maples.",
      summer: "The rainy season, then heavy heat and loud cicadas.",
      autumn: "Maples turn through yellow to deep red.",
      winter: "Deep snow in the north and the mountains. Macaques sit in the hot springs."
    }
  },
  backdrops: [
    {
      key: "volcanic-cone",
      label: "Snow-capped cone",
      note: "A single symmetrical volcano standing clear above the haze, snow on its upper third.",
      sky: ["#6f9ccb", "#8db0d8", "#abc5e2", "#c6d8e8", "#dce6ea", "#eef2ec"],
      far: "#9aa8c0",
      near: "#6e7e86",
      form: "volcano"
    },
    {
      key: "terraced-hills",
      label: "Terraced hills",
      note: "Stepped paddy terraces catching the light, with wooded ridges behind.",
      sky: ["#79a0c0", "#9ab0c4", "#c4bca8", "#e6c694", "#f2d6a4", "#f8e4bc"],
      far: "#8a9676",
      near: "#6a7a54",
      form: "rolling"
    },
    {
      key: "misty-mountains-night",
      label: "Misty mountains at night",
      note: "Layered ridgelines fading into mist, under a clear cold sky.",
      sky: ["#070a18", "#0d142e", "#151f40", "#1e2b50", "#28375e", "#344570"],
      far: "#1c2640",
      near: "#141d33",
      night: true,
      form: "peaks"
    }
  ],
  biomes: [
    {
      key: "satoyama",
      label: "Satoyama woodland",
      note: "Cedar and maple over a worked woodland floor, with cherry in spring.",
      ground: ["#6a7a4e", "#4e6038", "#7d9056"],
      ambience: ["mist", "fireflies", "butterflies"],
      plants: [
        {
          key: "sugi",
          common: "Japanese cedar",
          scientific: "Cryptomeria japonica",
          localName: "sugi",
          localLanguage: "Japanese",
          form: "conifer",
          traits: ["Tall narrow conical crown", "Fibrous red-brown bark peeling in vertical strips"],
          iucn: "NT",
          fact: "Japan's national tree. Plantations of it cover a great deal of the country's hill country.",
          source: gbif("Cryptomeria japonica"),
          crown: ["#16281e", "#1f3c28", "#2b5232", "#3c6a40", "#578556"],
          bark: ["#8a5a44", "#633e2e", "#3e271d"],
          ailing: "bare",
          spread: 0.75
        },
        {
          key: "momiji",
          common: "Japanese maple",
          scientific: "Acer palmatum",
          localName: "momiji",
          localLanguage: "Japanese",
          form: "broadleaf",
          traits: ["Finely divided palmate leaves", "Low layered spreading crown"],
          iucn: "LC",
          fact: "Turns through gold to deep scarlet in autumn, and people travel a long way to look at it.",
          source: gbif("Acer palmatum"),
          crown: ["#2a3a22", "#3c5230", "#4f6a3c", "#6a884e", "#8da868"],
          bark: ["#7a6a56", "#564a3c", "#342d24"],
          ailing: "autumn",
          spread: 1.1
        },
        {
          key: "yamazakura",
          common: "Wild mountain cherry",
          scientific: "Prunus jamasakura",
          localName: "yamazakura",
          localLanguage: "Japanese",
          form: "broadleaf",
          traits: ["Horizontal grey bark with raised lenticel bands", "Pale pink blossom opening with the first bronze leaves"],
          iucn: "NE",
          fact: "The wild cherry of the hills, which flowers alongside its young coppery leaves rather than on bare wood.",
          source: gbif("Prunus jamasakura"),
          crown: ["#2e3a28", "#405034", "#556842", "#708654", "#f0c8d4"],
          bark: ["#8a7a6a", "#60544a", "#3a322c"],
          ailing: "autumn",
          spread: 1.05
        },
        {
          key: "akamatsu",
          common: "Japanese red pine",
          scientific: "Pinus densiflora",
          localName: "akamatsu",
          localLanguage: "Japanese",
          form: "conifer",
          traits: ["Orange-red flaking bark on the upper trunk", "Irregular open windswept crown"],
          iucn: "LC",
          fact: "A classic satoyama tree \u2014 it does best on the thin poor soil left by generations of leaf-raking.",
          source: gbif("Pinus densiflora"),
          crown: ["#1a2a20", "#243e2a", "#315232", "#44683e", "#5f8454"],
          bark: ["#b06a42", "#7e4a2e", "#4e2e1d"],
          ailing: "bare",
          spread: 0.9
        }
      ],
      creatures: [
        {
          key: "macaque",
          slot: 0,
          common: "Japanese macaque",
          scientific: "Macaca fuscata",
          localName: "nihonzaru",
          localLanguage: "Japanese",
          traits: ["Bright red bare face and rump", "Thick brown-grey winter coat and a very short tail"],
          iucn: "LC",
          fact: "The northernmost non-human primate in the world. Some troops spend winter days sitting in hot springs.",
          source: iucn("Macaca fuscata"),
          activity: "diurnal",
          zone: "ground",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Sits grooming another macaque; in winter it soaks in the spring with snow on its head.",
          flourish: "bathe",
          body: { kind: "quadruped", size: [8, 7], legs: 2, tail: { len: 2, style: "down" }, ears: 1 },
          palette: { b: "#9a8a70", d: "#6a5c48", l: "#c2b299", e: "#140f0a", n: "#d4766a" }
        },
        {
          key: "sika",
          slot: 1,
          common: "Sika deer",
          scientific: "Cervus nippon",
          localName: "nihonjika",
          localLanguage: "Japanese",
          traits: ["White spots on a chestnut summer coat", "White rump patch with a black border"],
          iucn: "LC",
          fact: "Keeps its spots into adulthood in summer, unlike most deer, and loses them in a darker winter coat.",
          source: iucn("Cervus nippon"),
          activity: "crepuscular",
          zone: "ground",
          stages: ["fawn", "yearling", "adult", "old stag"],
          behaviour: "Grazes at the woodland edge, head up at the slightest sound.",
          body: { kind: "quadruped", size: [12, 9], legs: 5, tail: { len: 2, style: "up" }, ears: 3, crest: 3 },
          palette: { b: "#a0744a", d: "#6e4c2e", l: "#c89a66", e: "#140e08", n: "#f0ece0" }
        },
        {
          key: "tanuki",
          slot: 2,
          common: "Japanese raccoon dog",
          scientific: "Nyctereutes viverrinus",
          localName: "tanuki",
          localLanguage: "Japanese",
          traits: ["Black mask across the eyes", "Short legs, rounded body, bushy tail"],
          iucn: "LC",
          fact: "A canid, despite the face \u2014 more closely related to foxes than to anything it resembles. It fattens up and dozes through the coldest weeks.",
          source: iucn("Nyctereutes viverrinus"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["pup", "juvenile", "adult", "elder"],
          behaviour: "Trots along the woodland edge after dark, nose down, in no particular hurry.",
          body: { kind: "quadruped", size: [10, 5], legs: 2, tail: { len: 5, style: "bush" }, ears: 2 },
          palette: { b: "#8a7458", d: "#4e4030", l: "#b8a284", e: "#0e0a06", n: "#241c14" }
        },
        {
          key: "serow",
          slot: 3,
          common: "Japanese serow",
          scientific: "Capricornis crispus",
          localName: "kamoshika",
          localLanguage: "Japanese",
          traits: ["Shaggy grey-white coat and a pale bib", "Short backward-curving horns on both sexes"],
          iucn: "LC",
          national: "A designated Special Natural Monument in Japan",
          fact: "A goat-antelope, not a deer. It stands still and stares at intruders rather than running, which is how most people see one.",
          source: iucn("Capricornis crispus"),
          activity: "diurnal",
          zone: "slope",
          stages: ["kid", "juvenile", "adult", "elder"],
          behaviour: "Stands on a steep rock, perfectly still, watching.",
          still: true,
          body: { kind: "quadruped", size: [10, 9], legs: 4, tail: { len: 2, style: "down" }, ears: 2, crest: 2 },
          palette: { b: "#9a9284", d: "#655e52", l: "#ccc6ba", e: "#120f0a", n: "#2a2419" }
        },
        {
          key: "giant-salamander",
          slot: 4,
          common: "Japanese giant salamander",
          scientific: "Andrias japonicus",
          localName: "\u014Dsansh\u014Duo",
          localLanguage: "Japanese",
          traits: ["Huge flattened mottled brown body", "Tiny eyes and a broad wrinkled head"],
          iucn: "VU",
          national: "A Special Natural Monument in Japan",
          fact: "Reaches a metre and a half and can live past fifty. It breathes mostly through its skin, which is why it needs cold clean water.",
          source: iucn("Andrias japonicus"),
          activity: "nocturnal",
          zone: "water",
          stages: ["larva", "juvenile", "adult", "old"],
          behaviour: "Lies on the stream bed almost motionless, shifting only now and then.",
          still: true,
          body: { kind: "swimmer", size: [14, 3], tail: { len: 7, style: "down" }, legs: 1 },
          palette: { b: "#5a5444", d: "#36322a", l: "#7e7660", e: "#0a0a06", w: "#9a9078" }
        }
      ],
      understory: [
        { key: "bamboo-grass", label: "Sasa bamboo grass", what: "Dwarf bamboo covering the woodland floor", colour: "#5e8044" },
        { key: "moss-garden", label: "Moss", what: "Moss on stone and root", colour: "#4a7040" },
        { key: "fallen-leaves", label: "Fallen maple leaves", what: "Autumn leaves on the ground", colour: "#c0502a" },
        { key: "fireflies", label: "Genji fireflies", what: "Fireflies over the water on early summer nights", colour: "#c8f090" }
      ]
    },
    {
      key: "hokkaido",
      hasWater: true,
      label: "Northern snow country",
      note: "Birch and spruce under deep snow, with cranes on the marsh.",
      ground: ["#c6d0da", "#a6b4c2", "#dce4ec"],
      ambience: ["snow", "mist"],
      plants: [
        {
          key: "ezo-spruce",
          common: "Yezo spruce",
          scientific: "Picea jezoensis",
          localName: "ezomatsu",
          localLanguage: "Japanese",
          form: "conifer",
          traits: ["Narrow dark spire holding snow on every tier", "Short stiff needles"],
          iucn: "LC",
          fact: "The backbone of the northern forest, and shaped by snow more than by wind.",
          source: gbif("Picea jezoensis"),
          crown: ["#121f1a", "#1a3024", "#24432e", "#33583a", "#4a7250"],
          bark: ["#6a5a4a", "#473c31", "#2a241e"],
          ailing: "bare",
          spread: 0.7
        },
        {
          key: "shirakaba",
          common: "Japanese white birch",
          scientific: "Betula platyphylla",
          localName: "shirakaba",
          localLanguage: "Japanese",
          form: "broadleaf",
          traits: ["Clean white papery bark with dark lenticels", "Light airy crown, bare all winter"],
          iucn: "LC",
          fact: "The first tree back after fire or clearing, which is why whole hillsides of it come up at once.",
          source: gbif("Betula platyphylla"),
          crown: ["#36442a", "#485a34", "#5e7242", "#7a8e54", "#9eac70"],
          bark: ["#f0ece2", "#c8c2b4", "#8a8478"],
          ailing: "bare",
          spread: 0.85
        },
        {
          key: "erman-birch",
          common: "Erman\u2019s birch",
          scientific: "Betula ermanii",
          localName: "dakekanba",
          localLanguage: "Japanese",
          form: "broadleaf",
          traits: ["Peeling cream-to-pink bark in large curls", "Leaning, often multi-stemmed from snow pressure"],
          iucn: "LC",
          fact: "Grows at the treeline and is bent permanently sideways by the weight of winter snow.",
          source: gbif("Betula ermanii"),
          crown: ["#32402a", "#425232", "#56683e", "#6e8450", "#8fa268"],
          bark: ["#e8ddd0", "#bfb2a2", "#847a6e"],
          ailing: "bare",
          spread: 0.95
        }
      ],
      creatures: [
        {
          key: "ezo-red-fox",
          slot: 0,
          common: "Ezo red fox",
          scientific: "Vulpes vulpes schrencki",
          localName: "kitakitsune",
          localLanguage: "Japanese",
          traits: ["Thick orange-red winter coat", "Black stockings and a white tail tip"],
          iucn: "LC",
          fact: "The Hokkaid\u014D red fox. In deep snow it listens, then dives head first straight down after whatever is underneath.",
          source: iucn("Vulpes vulpes"),
          activity: "crepuscular",
          zone: "ground",
          stages: ["kit", "juvenile", "adult", "elder"],
          behaviour: "Trots across the snow, stops with one paw raised, listens, and pounces.",
          body: { kind: "quadruped", size: [11, 5], legs: 3, tail: { len: 7, style: "bush" }, ears: 3 },
          palette: { b: "#c8702a", d: "#8a4718", l: "#e8a05a", e: "#120a04", n: "#f4f0e8", k: "#2a2018" }
        },
        {
          key: "ezo-momonga",
          slot: 1,
          common: "Siberian flying squirrel",
          scientific: "Pteromys volans",
          localName: "ezo-momonga",
          localLanguage: "Japanese",
          traits: ["Enormous dark eyes in a small grey face", "A membrane stretched between wrist and ankle"],
          iucn: "LC",
          fact: "Does not fly but glides, sometimes more than fifty metres between trunks, steering with its tail.",
          source: iucn("Pteromys volans"),
          activity: "nocturnal",
          zone: "trunk",
          stages: ["pup", "juvenile", "adult", "elder"],
          behaviour: "Peers out of a hole in a trunk, then launches and glides to the next tree.",
          body: { kind: "quadruped", size: [5, 4], legs: 1, tail: { len: 5, style: "bush" }, ears: 1 },
          palette: { b: "#a8a69c", d: "#6e6c64", l: "#d8d6cc", e: "#0c0a08", n: "#f2f0e8" }
        },
        {
          key: "red-crowned-crane",
          slot: 2,
          common: "Red-crowned crane",
          scientific: "Grus japonensis",
          localName: "tanch\u014D",
          localLanguage: "Japanese",
          traits: ["White body with a black neck and secondaries", "A patch of bare red skin on the crown"],
          iucn: "VU",
          national: "A Special Natural Monument in Japan",
          fact: "Pairs dance together \u2014 bowing, leaping and calling in unison \u2014 and keep doing it year after year.",
          source: iucn("Grus japonensis"),
          activity: "diurnal",
          zone: "waterEdge",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Steps slowly through the marsh, and sometimes leaps into a dance with its mate.",
          flourish: "display",
          body: { kind: "wader", size: [10, 14], legs: 6, neck: 6, beak: 4, tail: { len: 3, style: "down" } },
          palette: { b: "#f4f2ec", d: "#c8c4bc", l: "#ffffff", e: "#141414", r: "#c0302a", k: "#2a2a2a" }
        },
        {
          key: "stellers-sea-eagle",
          slot: 3,
          common: "Steller's sea eagle",
          scientific: "Haliaeetus pelagicus",
          localName: "\u014Dwashi",
          localLanguage: "Japanese",
          traits: ["Massive bright yellow-orange bill", "Black body with white shoulders and a white wedge tail"],
          iucn: "VU",
          fact: "The heaviest eagle in the world. It winters on the Hokkaid\u014D drift ice in numbers.",
          source: iucn("Haliaeetus pelagicus"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Sits hunched on the ice, then takes off slow and heavy across the water.",
          flourish: "soar",
          body: { kind: "flyer", size: [16, 6], tail: { len: 4, style: "fan" }, beak: 3 },
          palette: { d: "#1a1814", b: "#2c2820", g: "#f2efe8", y: "#f0a020", r: "#6a6258" }
        },
        {
          key: "blakistons-fish-owl",
          slot: 4,
          common: "Blakiston's fish owl",
          scientific: "Ketupa blakistoni",
          localName: "shimafukur\u014D",
          localLanguage: "Japanese",
          traits: ["Huge, with shaggy horizontal ear tufts", "Barred brown plumage and bright yellow eyes"],
          iucn: "EN",
          fact: "The largest owl alive. It needs old trees big enough to nest in and rivers that do not freeze over, which is why there are so few.",
          source: iucn("Ketupa blakistoni"),
          activity: "nocturnal",
          zone: "waterEdge",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Waits on a low branch over the river, then drops feet-first into the shallows.",
          body: { kind: "bird", size: [10, 10], beak: 2, crest: 2, legs: 2, tail: { len: 3, style: "down" } },
          palette: { b: "#8a7458", d: "#4e4030", l: "#bca888", e: "#f0c030", y: "#2a2018", w: "#d8cdb4" }
        }
      ],
      understory: [
        { key: "snowdrift", label: "Snowdrift", what: "Wind-packed snow between the trunks", colour: "#e8eef6" },
        { key: "bamboo-under-snow", label: "Sasa under snow", what: "Dwarf bamboo bent flat under the snow", colour: "#6a8450" },
        { key: "driftice", label: "Drift ice", what: "Sea ice pushed up at the shore in late winter", colour: "#cfe0ec" },
        { key: "hotspring", label: "Hot spring", what: "Steam rising where the ground is warm", colour: "#cdd8d4" }
      ]
    }
  ]
};

// src/regions/madagascar/index.ts
var madagascar = {
  key: "madagascar",
  label: "Madagascar",
  note: "Eastern rainforest full of lemur calls, and the spiny baobab forest of the south-west.",
  hemisphere: "south",
  defaultStages: ["infant", "juvenile", "adult", "elder"],
  seasons: {
    model: "tropicalEquatorial",
    months: [
      "wet",
      "wet",
      "wet",
      "dry",
      "dry",
      "dry",
      "dry",
      "dry",
      "dry",
      "dry",
      "wet",
      "wet"
    ],
    notes: {
      wet: "Cyclone season in the east; the rainforest is at its fullest and loudest.",
      dry: "The spiny forest's baobabs are bare and the understorey burns gold."
    }
  },
  backdrops: [
    {
      key: "baobab-avenue",
      label: "Avenue of baobabs",
      note: "A line of massive bottle-trunked baobabs against a low sunset sky.",
      sky: ["#5a4a7a", "#8a5a7a", "#c76a6a", "#e89a5e", "#f3c07a", "#f8dca0"],
      far: "#7a5a52",
      near: "#5a4038",
      form: "flat"
    },
    {
      key: "tsingy",
      label: "Tsingy limestone",
      note: "A forest of razor-sharp grey limestone pinnacles, dry forest clinging between them.",
      sky: ["#6e9ac8", "#8cb0d6", "#b0c6e0", "#cfdbe8", "#e6ebe8", "#f2f0e6"],
      far: "#9a9a8c",
      near: "#78786a",
      form: "tsingy"
    },
    {
      key: "canopy-night",
      label: "Rainforest canopy at night",
      note: "Dense dark canopy under a thick scatter of southern stars.",
      sky: ["#070a16", "#0e152c", "#17203e", "#202c4e", "#2b385c", "#38466c"],
      far: "#1a2838",
      near: "#13202c",
      night: true,
      form: "canopy"
    }
  ],
  biomes: [
    {
      key: "eastern-rainforest",
      label: "Eastern rainforest",
      note: "Dense humid forest full of lemur calls at dawn and dusk.",
      ground: ["#2e4228", "#22331e", "#3c5636"],
      ambience: ["mist", "glowworms", "butterflies"],
      plants: [
        {
          key: "traveller-palm",
          common: "Traveller's tree",
          scientific: "Ravenala madagascariensis",
          form: "palm",
          traits: ["Leaves arranged in a single flat fan", "Thick grey trunk marked with old leaf scars"],
          iucn: "LC",
          fact: "Not a true palm. The fan always leans roughly east-west, which gave it its name.",
          source: gbif("Ravenala madagascariensis"),
          crown: ["#1a3420", "#25492c", "#34623a", "#487e4c", "#669c62"],
          bark: ["#8a8470", "#615c4c", "#3a372c"],
          ailing: "dry",
          spread: 1.1
        },
        {
          key: "madagascar-rosewood",
          common: "Madagascar rosewood",
          scientific: "Dalbergia baronii",
          form: "broadleaf",
          traits: ["Dense dark green crown", "Deeply fissured dark bark"],
          iucn: "EN",
          fact: "Heavily logged for its dark red timber, which has made it one of the island\u2019s most trafficked trees.",
          source: iucn("Dalbergia baronii"),
          crown: ["#162616", "#1f3a1f", "#2c502c", "#3e6a3c", "#588652"],
          bark: ["#4a3a2c", "#332820", "#201812"],
          ailing: "bare",
          spread: 1
        },
        {
          key: "tree-fern-madagascar",
          common: "Madagascar tree fern",
          scientific: "Cyathea sp.",
          form: "fern",
          traits: ["Slender scaly trunk", "Arching crown of fronds over a mossy gully"],
          iucn: "NE",
          fact: "Grows thickly along the misty stream gullies that cut through the rainforest.",
          source: gbif("Cyathea"),
          crown: ["#193020", "#25462c", "#345e3a", "#497a4a", "#6a9860"],
          bark: ["#6a5c48", "#473c30", "#2c251c"],
          ailing: "dry",
          spread: 1.05
        }
      ],
      creatures: [
        {
          key: "red-fronted-lemur",
          slot: 0,
          common: "Red-fronted brown lemur",
          scientific: "Eulemur rufifrons",
          traits: ["Grey-brown body with a reddish cap and beard on males", "Long banded tail"],
          iucn: "NT",
          fact: "Lives in troops and travels in a loose line through the canopy.",
          source: iucn("Eulemur rufifrons"),
          activity: "cathemeral",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Moves along a branch in short bounds, pausing to look around.",
          body: { kind: "quadruped", size: [8, 5], legs: 2, tail: { len: 9, style: "up" }, ears: 1 },
          palette: { b: "#8a7a5a", d: "#5c5038", l: "#b4a480", e: "#140e08", n: "#9a5a30" }
        },
        {
          key: "panther-chameleon",
          slot: 1,
          common: "Panther chameleon",
          scientific: "Furcifer pardalis",
          traits: ["Brilliant variable colours, brightest in males", "Independently swivelling eyes"],
          iucn: "LC",
          fact: "Changes colour mostly to signal mood and to other chameleons, not chiefly to hide.",
          source: iucn("Furcifer pardalis"),
          activity: "diurnal",
          zone: "trunk",
          stages: ["hatchling", "juvenile", "adult", "old"],
          behaviour: "Clings to a branch, swaying very slowly like a leaf in the wind.",
          body: { kind: "reptile", size: [9, 5], legs: 2, tail: { len: 7, style: "curl" }, crest: 1 },
          palette: { b: "#2e9050", d: "#1a5c30", l: "#6ad880", e: "#0a0a06", y: "#e0d030", r: "#c03030" }
        },
        {
          key: "leaf-tailed-gecko",
          slot: 2,
          common: "Satanic leaf-tailed gecko",
          scientific: "Uroplatus phantasticus",
          traits: ["Flattened body mottled like a dead leaf", "A tail shaped like a curled, decaying leaf"],
          iucn: "LC",
          fact: "So well camouflaged against bark and leaf litter that it is usually found by its silhouette, not its colour.",
          source: iucn("Uroplatus phantasticus"),
          activity: "nocturnal",
          zone: "trunk",
          stages: ["hatchling", "juvenile", "adult", "old"],
          behaviour: "Presses flat against bark by day; barely visible unless it moves.",
          still: true,
          body: { kind: "reptile", size: [6, 3], legs: 2, tail: { len: 4, style: "curl" } },
          palette: { b: "#6a5436", d: "#3e2f1c", l: "#9a8050", e: "#0c0906" }
        },
        {
          key: "fossa",
          slot: 3,
          common: "Fossa",
          scientific: "Cryptoprocta ferox",
          traits: ["Long slim cat-like body with a very long tail", "Rich reddish-brown short fur"],
          iucn: "VU",
          fact: "Madagascar's largest native carnivore and the main predator of lemurs, though it is itself cat-sized, not cat-related.",
          source: iucn("Cryptoprocta ferox"),
          activity: "cathemeral",
          zone: "trunk",
          stages: ["kit", "juvenile", "adult", "elder"],
          behaviour: "Moves along a branch low and fast, tail streaming out behind for balance.",
          body: { kind: "quadruped", size: [11, 5], legs: 2, tail: { len: 10, style: "up" }, ears: 1 },
          palette: { b: "#8a5438", d: "#5c3722", l: "#b07a54", e: "#100a06", n: "#1a1410" }
        },
        {
          key: "indri",
          slot: 4,
          common: "Indri",
          scientific: "Indri indri",
          traits: ["Black and white body, no visible tail", "A loud wailing call carrying for kilometres"],
          iucn: "CR",
          fact: "The largest living lemur. Its dawn calls are one of the loudest sounds any land mammal makes.",
          source: iucn("Indri indri"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Sits upright in a high fork; every so often the whole family calls together.",
          flourish: "display",
          body: { kind: "bulky", size: [10, 10], legs: 2, ears: 2, tail: { len: 0, style: "none" } },
          palette: { b: "#1a1814", d: "#0a0908", l: "#f0ece2", e: "#d8c060", n: "#2a2622" }
        }
      ],
      understory: [
        { key: "orchid", label: "Rainforest orchids", what: "Orchids on the trunks, more of them as the grove recovers", colour: "#d87ac0" },
        { key: "leaf-litter-mg", label: "Leaf litter", what: "Deep damp litter on the forest floor", colour: "#5a4a32" },
        { key: "moss-mg", label: "Moss", what: "Moss on every trunk in the wet season", colour: "#4a7040" }
      ]
    },
    {
      key: "spiny-forest",
      label: "Spiny forest",
      note: "Baobabs and octopus trees over red sand in the dry south-west.",
      ground: ["#b3794a", "#8a5a36", "#c79660"],
      ambience: ["heatShimmer"],
      plants: [
        {
          key: "grandidiers-baobab",
          common: "Grandidier's baobab",
          scientific: "Adansonia grandidieri",
          form: "bulbous",
          traits: ["Enormous smooth grey bottle-shaped trunk", "A small flat crown far above"],
          iucn: "EN",
          fact: "The most famous of the island\u2019s six baobab species, and found nowhere else in the world.",
          source: iucn("Adansonia grandidieri"),
          crown: ["#2a3420", "#3a4a2c", "#4d643a", "#647e4e", "#869c6a"],
          bark: ["#9a8a74", "#6e6050", "#473c30"],
          ailing: "bare",
          spread: 1.3
        },
        {
          key: "octopus-tree",
          common: "Octopus tree",
          scientific: "Didierea madagascariensis",
          form: "columnar",
          traits: ["Thick spiny grey-green arms radiating like tentacles", "Small leaves pressed close to the spines"],
          iucn: "NE",
          fact: "Found only in the spiny forest, and looks like nothing else on earth.",
          source: gbif("Didierea madagascariensis"),
          crown: ["#2c3a26", "#3c4e32", "#4e6640", "#668052", "#849c6a"],
          bark: ["#8a8068", "#625a48", "#3c382c"],
          ailing: "dry",
          spread: 0.85
        },
        {
          key: "fony-baobab",
          common: "Fony baobab",
          scientific: "Adansonia rubrostipa",
          form: "bulbous",
          traits: ["Squat swollen trunk, smaller than its relatives", "Bright yellow flowers opening at dusk"],
          iucn: "LC",
          fact: "The baobab in a hurry \u2014 it flowers and fruits faster than its larger relations.",
          source: gbif("Adansonia rubrostipa"),
          crown: ["#2e3a20", "#3e502a", "#536836", "#6a8246", "#889c5c"],
          bark: ["#a0906e", "#766650", "#4a3f30"],
          ailing: "bare",
          spread: 1
        }
      ],
      creatures: [
        {
          key: "radiated-tortoise",
          slot: 0,
          common: "Radiated tortoise",
          scientific: "Astrochelys radiata",
          traits: ["Brilliant star-burst pattern radiating from each shell plate", "Domed yellow-and-black shell"],
          iucn: "CR",
          fact: "One of the most strikingly patterned tortoises alive, which has made it a heavy target for the illegal pet trade.",
          source: iucn("Astrochelys radiata"),
          activity: "diurnal",
          zone: "ground",
          stages: ["hatchling", "juvenile", "adult", "old"],
          behaviour: "Grazes slowly between the spiny shrubs, unbothered by the heat.",
          body: { kind: "reptile", size: [9, 5], legs: 4 },
          palette: { b: "#e0c04a", d: "#9a7a28", l: "#f0dc80", e: "#120e08" }
        },
        {
          key: "ring-tailed-lemur",
          slot: 1,
          common: "Ring-tailed lemur",
          scientific: "Lemur catta",
          traits: ["Long tail ringed black and white", "Pale grey body, dark eye patches"],
          iucn: "EN",
          fact: "The most familiar lemur, and the only one that spends a large share of its day on the ground.",
          source: iucn("Lemur catta"),
          activity: "diurnal",
          zone: "ground",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Suns itself sitting upright, belly to the sun, tail curled round.",
          body: { kind: "quadruped", size: [8, 5], legs: 2, tail: { len: 10, style: "up" }, ears: 1 },
          palette: { b: "#b0a890", d: "#7a7260", l: "#e0dcc8", e: "#1a1410", n: "#181818" }
        },
        {
          key: "sifaka",
          slot: 2,
          common: "Verreaux's sifaka",
          scientific: "Propithecus verreauxi",
          traits: ["Thick white coat with a dark cap", "Moves upright in long sideways leaps"],
          iucn: "EN",
          fact: "Crosses open ground on its hind legs in a bounding sideways hop, since its legs are built for leaping, not walking.",
          source: iucn("Propithecus verreauxi"),
          activity: "diurnal",
          zone: "trunk",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Clings upright to a trunk, then launches in a long leap to the next.",
          body: { kind: "quadruped", size: [9, 7], legs: 2, tail: { len: 8, style: "down" }, ears: 1 },
          palette: { b: "#f0ece0", d: "#c8c0a8", l: "#ffffff", e: "#140f0a", n: "#2a2018" }
        },
        {
          key: "oustalets-chameleon",
          slot: 3,
          common: "Oustalet's chameleon",
          scientific: "Furcifer oustaleti",
          traits: ["One of the largest chameleons alive", "Muted olive-brown and grey mottling"],
          iucn: "NE",
          fact: "Among the longest chameleon species in the world, yet far less colourful than its panther cousin.",
          source: gbif("Furcifer oustaleti"),
          activity: "diurnal",
          zone: "trunk",
          stages: ["hatchling", "juvenile", "adult", "old"],
          behaviour: "Sways slowly on a thin branch, barely distinguishable from the foliage.",
          body: { kind: "reptile", size: [12, 5], legs: 2, tail: { len: 9, style: "curl" }, crest: 1 },
          palette: { b: "#5a6a44", d: "#38402a", l: "#8a9868", e: "#0a0a06" }
        },
        {
          key: "aye-aye",
          slot: 4,
          common: "Aye-aye",
          scientific: "Daubentonia madagascariensis",
          traits: ["Huge round eyes and bat-like ears", "A greatly elongated thin middle finger"],
          iucn: "EN",
          fact: "Taps on wood to find grubs by echo, then winkles them out with that one impossibly thin finger.",
          source: iucn("Daubentonia madagascariensis"),
          activity: "nocturnal",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Taps steadily along a branch, head cocked, listening.",
          body: { kind: "quadruped", size: [8, 5], legs: 2, tail: { len: 9, style: "bush" }, ears: 3 },
          palette: { b: "#4a3e2c", d: "#2a221a", l: "#6e5c40", e: "#0a0806", n: "#8a7a56" }
        }
      ],
      understory: [
        { key: "red-sand-mg", label: "Red laterite sand", what: "Iron-rich sand of the dry south-west", colour: "#b3794a" },
        { key: "succulent", label: "Succulents", what: "Low spiny succulents between the baobabs", colour: "#7a9a5c" },
        { key: "dry-leaf", label: "Dry fallen leaves", what: "Leaves dropped for the dry season", colour: "#9a7a4a" }
      ]
    }
  ]
};

// src/regions/costarica/index.ts
var costaRica = {
  key: "costarica",
  label: "Costa Rica",
  note: "Mossy cloud forest on the ridges, and steamy lowland rainforest below.",
  hemisphere: "north",
  defaultStages: ["chick", "juvenile", "adult", "elder"],
  seasons: {
    model: "wetDry",
    months: [
      "dry",
      "dry",
      "dry",
      "dry",
      "wet",
      "wet",
      "wet",
      "wet",
      "wet",
      "wet",
      "wet",
      "dry"
    ],
    notes: {
      dry: "Clearer skies and easier quetzal-watching in the cloud forest, December to April.",
      wet: 'The "green season" \u2014 daily afternoon rain, and the forest at its fullest.'
    }
  },
  backdrops: [
    {
      key: "smoking-volcano",
      label: "Smoking volcano",
      note: "A steep cone trailing a thin plume, forest climbing most of the way up its flank.",
      sky: ["#5f8cc0", "#82a6d0", "#a6bfdc", "#c7d6e6", "#dde6ea", "#eef2ea"],
      far: "#7a8a9a",
      near: "#4e6052",
      form: "volcano"
    },
    {
      key: "cloud-ridges",
      label: "Cloud-draped ridges",
      note: "Layered ridgelines wrapped in drifting cloud, canopy barely visible beneath.",
      sky: ["#6a7e92", "#8294a6", "#a0b0ba", "#c0cbc8", "#dadcd2", "#e8e8dc"],
      far: "#8a9890",
      near: "#5e7060",
      form: "rolling"
    },
    {
      key: "lowland-night",
      label: "Lowland night",
      note: "Dense dark canopy and a wide tropical sky thick with stars.",
      sky: ["#060a18", "#0c152e", "#152140", "#1f2d50", "#2a3a60", "#364870"],
      far: "#1c2a3a",
      near: "#13202a",
      night: true,
      form: "canopy"
    }
  ],
  biomes: [
    {
      key: "cloud-forest",
      label: "Cloud forest",
      note: "Moss-draped highland forest, cool and almost always wrapped in mist.",
      ground: ["#2e4232", "#223428", "#3c5a3e"],
      ambience: ["mist", "glowworms"],
      plants: [
        {
          key: "oak-costa-rica",
          common: "Highland oak",
          scientific: "Quercus costaricensis",
          form: "broadleaf",
          traits: ["Heavily moss- and epiphyte-laden limbs", "Dense, dark, rounded crown"],
          iucn: "NE",
          fact: "Carries so much moss and so many epiphytes that the branches themselves can be hard to see.",
          source: gbif("Quercus costaricensis"),
          crown: ["#152a1a", "#204028", "#2d5836", "#3f7246", "#5a9058"],
          bark: ["#7a7258", "#564f3c", "#332f24"],
          ailing: "bare",
          spread: 1.1
        },
        {
          key: "tree-fern-cr",
          common: "Cloud forest tree fern",
          scientific: "Cyathea sp.",
          form: "fern",
          traits: ["Trunk wrapped thickly in moss", "Fronds dripping with condensation"],
          iucn: "NE",
          fact: "The constant cloud moisture here means almost nothing in this forest is ever truly dry.",
          source: gbif("Cyathea"),
          crown: ["#1a3020", "#264830", "#356140", "#4a7c52", "#699a68"],
          bark: ["#6a5c48", "#473c30", "#2c251c"],
          ailing: "dry",
          spread: 1.1
        },
        {
          key: "bromeliad-tree",
          common: "Bromeliad-laden fig",
          scientific: "Ficus sp.",
          form: "broadleaf",
          traits: ["Branches crowded with tank bromeliads", "Broad epiphyte-laden crown"],
          iucn: "NE",
          fact: "Each bromeliad on its branches holds its own tiny pool of water, and often its own tiny frogs.",
          source: gbif("Ficus"),
          crown: ["#17301d", "#234a2a", "#30633a", "#437e4c", "#639c60"],
          bark: ["#8a8470", "#615c4c", "#3a372c"],
          ailing: "bare",
          spread: 1.2
        }
      ],
      creatures: [
        {
          key: "glass-frog",
          slot: 0,
          common: "Reticulated glass frog",
          scientific: "Hyalinobatrachium valerioi",
          traits: ["Translucent lime-green skin showing the organs beneath", "Tiny \u2014 barely two centimetres"],
          iucn: "LC",
          fact: "The skin on its underside is see-through enough that its heartbeat is visible from below.",
          source: iucn("Hyalinobatrachium valerioi"),
          activity: "nocturnal",
          zone: "waterEdge",
          stages: ["tadpole", "froglet", "adult", "old"],
          behaviour: "Sits motionless on the underside of a leaf over a stream.",
          still: true,
          body: { kind: "frog", size: [4, 3], legs: 1 },
          palette: { b: "#9ad87a", d: "#5a9048", l: "#d0f0b0", e: "#141a0c" }
        },
        {
          key: "quetzal",
          slot: 1,
          common: "Resplendent quetzal",
          scientific: "Pharomachrus mocinno",
          traits: ["Iridescent emerald-green body and crest", "Male has two very long sweeping tail streamers"],
          iucn: "NT",
          fact: "Sacred to the Maya and the Aztec. The male\u2019s tail streamers can be longer than the rest of its body.",
          source: iucn("Pharomachrus mocinno"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Sits upright on a branch, then drops to snatch a fruit and returns to the same perch.",
          flourish: "display",
          body: { kind: "bird", size: [8, 7], beak: 2, crest: 2, tail: { len: 14, style: "down" }, legs: 1 },
          palette: { b: "#1a6a46", d: "#0e3e2a", l: "#3aa06a", e: "#120e08", r: "#c0302a", w: "#f0ece2" }
        },
        {
          key: "tapir",
          slot: 2,
          common: "Baird's tapir",
          scientific: "Tapirus bairdii",
          traits: ["Heavy dark body with a short mobile snout", "Pale face and a short upright mane"],
          iucn: "EN",
          fact: "The largest land mammal in Central America, and an important seed disperser through the forest it walks.",
          source: iucn("Tapirus bairdii"),
          activity: "crepuscular",
          zone: "ground",
          stages: ["calf", "juvenile", "adult", "elder"],
          behaviour: "Moves slowly and heavily through the undergrowth, snout swinging side to side.",
          body: { kind: "bulky", size: [13, 7], legs: 4, beak: 2, tail: { len: 2, style: "down" } },
          palette: { b: "#2a2622", d: "#161412", l: "#4a4640", e: "#0a0806", w: "#9a948a" }
        },
        {
          key: "three-toed-sloth",
          slot: 3,
          common: "Brown-throated three-toed sloth",
          scientific: "Bradypus variegatus",
          traits: ["Pale shaggy fur, often greenish with algae", "A dark mask around the eyes"],
          iucn: "LC",
          fact: "Moves so little that algae grows in its fur, which in turn feeds moths that live nowhere else.",
          source: iucn("Bradypus variegatus"),
          activity: "cathemeral",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          sleepy: true,
          behaviour: "Hangs curled in a fork, barely shifting for hours at a time.",
          body: { kind: "bulky", size: [8, 7], legs: 2, ears: 0, tail: { len: 1, style: "none" } },
          palette: { b: "#8a8a6e", d: "#5e5e46", l: "#b4b494", e: "#1a1810", n: "#4a5438" }
        },
        {
          key: "bare-necked-umbrellabird",
          slot: 4,
          common: "Bare-necked umbrellabird",
          scientific: "Cephalopterus glabricollis",
          traits: ["Shaggy black crest overhanging the bill", "A bright red inflatable throat wattle on the male"],
          iucn: "EN",
          fact: "The male inflates a long scarlet wattle and booms from a high branch to be heard across the canopy.",
          source: iucn("Cephalopterus glabricollis"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Sits hunched on a high branch; now and then its throat wattle swells as it calls.",
          flourish: "display",
          body: { kind: "bird", size: [9, 7], beak: 2, crest: 3, tail: { len: 4, style: "down" }, legs: 1 },
          palette: { b: "#1a1814", d: "#0a0908", l: "#34302a", e: "#120e08", r: "#c0302a" }
        }
      ],
      understory: [
        { key: "bromeliad-cr", label: "Bromeliads", what: "Tank bromeliads on every branch", colour: "#6a9a5c" },
        { key: "moss-cr", label: "Moss", what: "Moss coating trunk and branch alike", colour: "#4e7a46" },
        { key: "orchid-cr", label: "Highland orchids", what: "Orchids tucked into the moss, more as the grove thrives", colour: "#d87ac0" }
      ]
    },
    {
      key: "lowland-rainforest",
      label: "Lowland rainforest",
      note: "Hot, humid, and loud with insects and birdsong under a closed canopy.",
      ground: ["#2e4228", "#22331e", "#3c5636"],
      ambience: ["mist", "butterflies"],
      plants: [
        {
          key: "ceiba",
          common: "Ceiba",
          scientific: "Ceiba pentandra",
          form: "broadleaf",
          traits: ["Massive buttressed trunk, often the tallest tree around", "Flat spreading crown well above everything else"],
          iucn: "NE",
          fact: "Sacred to several Mesoamerican cultures, and left standing in cleared land more often than any other tree.",
          source: gbif("Ceiba pentandra"),
          crown: ["#122a18", "#1d4324", "#2b5c30", "#3f7842", "#5d9656"],
          bark: ["#8a8470", "#615c4c", "#3a372c"],
          ailing: "bare",
          spread: 1.3
        },
        {
          key: "strangler-fig-cr",
          common: "Strangler fig",
          scientific: "Ficus sp.",
          form: "broadleaf",
          traits: ["Lattice of aerial roots where the host trunk once stood", "Broad dense crown"],
          iucn: "NE",
          fact: "Starts as an epiphyte and eventually replaces the tree it grew around entirely.",
          source: gbif("Ficus"),
          crown: ["#13241a", "#1e3a26", "#2b5231", "#3f6c42", "#5c8a55"],
          bark: ["#7a7258", "#564f3c", "#332f24"],
          ailing: "bare",
          spread: 1.25
        },
        {
          key: "heliconia",
          common: "Heliconia",
          scientific: "Heliconia sp.",
          form: "shrub",
          traits: ["Bright red-and-yellow boat-shaped bracts", "Broad banana-like leaves"],
          iucn: "NE",
          fact: "Its bracts hold tiny pools of water and are a favourite nectar source for hummingbirds.",
          source: gbif("Heliconia"),
          crown: ["#1e3620", "#2a4c2c", "#3a663c", "#4f844e", "#e03a2a"],
          bark: ["#4a5a3a", "#344028", "#20281a"],
          ailing: "dry",
          spread: 0.75
        }
      ],
      creatures: [
        {
          key: "red-eyed-tree-frog",
          slot: 0,
          common: "Red-eyed tree frog",
          scientific: "Agalychnis callidryas",
          traits: ["Bright red eyes", "Vivid green body with blue-and-yellow striped flanks"],
          iucn: "LC",
          fact: "Flashes its red eyes open to startle a predator for the split second it needs to leap away.",
          source: iucn("Agalychnis callidryas"),
          activity: "nocturnal",
          zone: "waterEdge",
          stages: ["tadpole", "froglet", "adult", "old"],
          behaviour: "Sits with its eyes closed by day, tucked tight against a leaf.",
          body: { kind: "frog", size: [5, 3], legs: 1 },
          palette: { b: "#4ec850", d: "#2a8a30", l: "#80e880", e: "#c0302a", w: "#2a4ac0" }
        },
        {
          key: "blue-morpho",
          slot: 1,
          common: "Blue morpho",
          scientific: "Morpho peleides",
          traits: ["Enormous iridescent blue upperwings", "Dull brown underwings with eyespots"],
          iucn: "NE",
          fact: "The blue flashes only in flight \u2014 at rest, folded wings show only camouflaged brown.",
          source: gbif("Morpho peleides"),
          activity: "diurnal",
          zone: "sky",
          stages: ["caterpillar", "chrysalis", "adult", "old"],
          behaviour: "Flaps in slow bursts low along a trail, flashing blue with every wingbeat.",
          body: { kind: "flyer", size: [10, 8] },
          palette: { d: "#120f1a", b: "#1a1828", g: "#2050d0", y: "#6a90f0" }
        },
        {
          key: "scarlet-macaw",
          slot: 2,
          common: "Scarlet macaw",
          scientific: "Ara macao",
          traits: ["Brilliant scarlet body with blue-and-yellow wings", "Long pointed tail"],
          iucn: "LC",
          fact: "Pairs mate for life and are rarely seen apart, even in flight.",
          source: iucn("Ara macao"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          flourish: "pair",
          behaviour: "Two birds sit together in the canopy, calling loudly as they pass overhead.",
          body: { kind: "bird", size: [9, 7], beak: 3, tail: { len: 9, style: "down" }, legs: 1 },
          palette: { b: "#d8302a", d: "#9a201c", l: "#f05a4a", e: "#140e08", w: "#3a5ac0", y: "#e8c030" }
        },
        {
          key: "poison-dart-frog",
          slot: 3,
          common: "Strawberry poison frog",
          scientific: "Oophaga pumilio",
          traits: ["Bright red body with blue-black legs", "Barely two centimetres long"],
          iucn: "LC",
          fact: "Carries its tadpoles one at a time, piggyback, up into separate water-filled bromeliads.",
          source: iucn("Oophaga pumilio"),
          activity: "diurnal",
          zone: "ground",
          stages: ["tadpole", "froglet", "adult", "old"],
          behaviour: "Hops a short distance across the leaf litter, then sits boldly in the open.",
          body: { kind: "frog", size: [3, 2], legs: 1 },
          palette: { b: "#d8302a", d: "#2a2028", l: "#f0605a", e: "#0a0a06" }
        },
        {
          key: "spider-monkey",
          slot: 4,
          common: "Geoffroy's spider monkey",
          scientific: "Ateles geoffroyi",
          traits: ["Long thin limbs and an even longer tail", "Small head, no visible thumbs"],
          iucn: "EN",
          fact: "Its tail acts as a fifth limb, strong enough to hang its full weight from a branch.",
          source: iucn("Ateles geoffroyi"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Swings hand over hand through the high canopy, tail trailing or gripping a branch.",
          body: { kind: "quadruped", size: [9, 6], legs: 2, tail: { len: 12, style: "curl" }, ears: 1 },
          palette: { b: "#8a5a38", d: "#5c3a22", l: "#b0825a", e: "#120c06", n: "#2a1c12" }
        }
      ],
      understory: [
        { key: "heliconia-flower", label: "Heliconia blooms", what: "Flashes of red and yellow in the understorey", colour: "#e03a2a" },
        { key: "leaf-litter-cr", label: "Leaf litter", what: "Deep damp leaf litter underfoot", colour: "#5a4a32" },
        { key: "vine-cr", label: "Lianas", what: "Vines looping between the trunks", colour: "#3a6030" }
      ]
    }
  ]
};

// src/regions/eastafrica/index.ts
var eastAfrica = {
  key: "eastafrica",
  label: "East African savanna",
  note: "Acacia plains under a huge sky, and the riverine woodland along the water.",
  hemisphere: "tropics",
  defaultStages: ["calf", "juvenile", "adult", "elder"],
  seasons: {
    model: "wetDry",
    months: [
      "dry",
      "dry",
      "longRains",
      "longRains",
      "longRains",
      "dry",
      "dry",
      "dry",
      "dry",
      "shortRains",
      "shortRains",
      "dry"
    ],
    notes: {
      dry: "Grass thins and the great herds concentrate near permanent water.",
      longRains: "March to May: the plains turn green almost overnight.",
      shortRains: "October and November: a shorter green-up before the long dry season."
    }
  },
  backdrops: [
    {
      key: "snow-mountain-horizon",
      label: "Snow-capped peak on the horizon",
      note: "A single ice-capped volcano standing far off above the heat-shimmered plain.",
      sky: ["#5e8fc0", "#7fa2cc", "#a6bcd8", "#c9d6dc", "#e4ddc4", "#f3e4b0"],
      far: "#b0a888",
      near: "#8a9460",
      form: "volcano"
    },
    {
      key: "golden-grassland",
      label: "Golden grassland",
      note: "Rolling dry-season grass under flat-topped acacia, stretching to the horizon.",
      sky: ["#6a9ac8", "#8dafd2", "#b6c6d8", "#e0d4a8", "#f0dc9a", "#f8e8b8"],
      far: "#c0ac72",
      near: "#9a8a4e",
      form: "flat"
    },
    {
      key: "savanna-night",
      label: "Savanna night",
      note: "A flat dark horizon under an enormous equatorial sky full of stars.",
      sky: ["#07090f", "#0d1220", "#141c30", "#1e2740", "#293450", "#364260"],
      far: "#1c2230",
      near: "#141a24",
      night: true,
      form: "flat"
    }
  ],
  biomes: [
    {
      key: "acacia-savanna",
      label: "Acacia savanna",
      note: "Flat-topped acacia scattered across open grassland.",
      ground: ["#b3a060", "#9a8a4e", "#c6b878"],
      ambience: ["heatShimmer", "passingFlock"],
      plants: [
        {
          key: "umbrella-thorn",
          common: "Umbrella thorn acacia",
          scientific: "Vachellia tortilis",
          form: "broadleaf",
          traits: ["Flat spreading umbrella-shaped crown", "Long white thorns along the branches"],
          iucn: "LC",
          fact: "Its flat crown is browsed level by giraffes, which is partly what gives the savanna its distinctive look.",
          source: gbif("Vachellia tortilis"),
          crown: ["#2a3420", "#3a4a2c", "#4d643a", "#647e4e", "#869c6a"],
          bark: ["#7a6a52", "#564a38", "#342c20"],
          ailing: "bare",
          spread: 1.2
        },
        {
          key: "whistling-thorn",
          common: "Whistling thorn",
          scientific: "Vachellia drepanolobium",
          form: "shrub",
          traits: ["Swollen black thorn-bases hollowed out by ants", "Dense thorny low crown"],
          iucn: "LC",
          fact: "The hollow thorns whistle in the wind and house biting ants that defend the tree fiercely.",
          source: gbif("Vachellia drepanolobium"),
          crown: ["#243020", "#32442c", "#43583a", "#587048", "#74885e"],
          bark: ["#4a4030", "#342c20", "#201a14"],
          ailing: "bare",
          spread: 0.85
        },
        {
          key: "baobab-ea",
          common: "Baobab",
          scientific: "Adansonia digitata",
          form: "bulbous",
          traits: ["Massive swollen pale trunk", "A sparse crown far above, bare for much of the dry season"],
          iucn: "LC",
          fact: "Can live well over a thousand years, and the trunk stores water for the dry months ahead.",
          source: gbif("Adansonia digitata"),
          crown: ["#2c3820", "#3c502c", "#4f683a", "#67824c", "#889c66"],
          bark: ["#b0a080", "#857650", "#574c34"],
          ailing: "bare",
          spread: 1.3
        }
      ],
      creatures: [
        {
          key: "plains-zebra",
          slot: 0,
          common: "Plains zebra",
          scientific: "Equus quagga",
          traits: ["Bold black-and-white stripes, unique to each individual", "Upright mane"],
          iucn: "NT",
          fact: "No two zebras share the same stripe pattern, which may help them recognise each other in the herd.",
          source: iucn("Equus quagga"),
          activity: "diurnal",
          zone: "ground",
          stages: ["foal", "juvenile", "adult", "elder"],
          behaviour: "Grazes in a loose herd, tail swishing, head rising often to watch.",
          body: { kind: "quadruped", size: [13, 10], legs: 4, tail: { len: 4, style: "down" }, ears: 2, crest: 2 },
          palette: { b: "#f0ece0", d: "#1a1814", l: "#ffffff", e: "#0a0806" }
        },
        {
          key: "lilac-breasted-roller",
          slot: 1,
          common: "Lilac-breasted roller",
          scientific: "Coracias caudatus",
          traits: ["Lilac throat, turquoise belly, green back", "Long trailing central tail feathers"],
          iucn: "LC",
          fact: "One of the most colourful birds of the savanna, and often perches in the open on a low bush.",
          source: iucn("Coracias caudatus"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Perches conspicuously, drops to snatch an insect, and returns to the same twig.",
          body: { kind: "bird", size: [7, 5], beak: 2, tail: { len: 6, style: "down" }, legs: 1 },
          palette: { b: "#2a7ac0", d: "#154a7a", l: "#6ab0e8", e: "#120e08", p: "#c088d0", g: "#4a9a50" }
        },
        {
          key: "secretary-bird",
          slot: 2,
          common: "Secretarybird",
          scientific: "Sagittarius serpentarius",
          traits: ["Long crane-like legs and a long tail", "A spray of black quill-like crest feathers"],
          iucn: "EN",
          fact: "Hunts on foot across open grassland, stamping prey \u2014 including snakes \u2014 with its feet.",
          source: iucn("Sagittarius serpentarius"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Strides through the grass at a steady pace, head down, watching for movement.",
          body: { kind: "wader", size: [9, 14], legs: 7, neck: 3, beak: 2, crest: 3, tail: { len: 5, style: "down" } },
          palette: { b: "#d8d4c8", d: "#9a968a", l: "#f0ece0", e: "#120e08", k: "#2a2a2a", y: "#e8c868" }
        },
        {
          key: "masai-giraffe",
          slot: 3,
          common: "Masai giraffe",
          scientific: "Giraffa tippelskirchi",
          traits: ["Ragged star-shaped brown patches on a cream coat", "Extremely long neck and legs"],
          iucn: "EN",
          fact: "The tallest land animal, and its subspecies has lost nearly half its population in thirty years.",
          source: iucn("Giraffa tippelskirchi"),
          activity: "diurnal",
          zone: "ground",
          stages: ["calf", "juvenile", "adult", "elder"],
          behaviour: "Browses slowly from the top of an acacia, neck swinging gently.",
          body: { kind: "quadruped", size: [11, 18], legs: 10, neck: 10, tail: { len: 5, style: "down" }, ears: 2 },
          palette: { b: "#c89850", d: "#6a4a26", l: "#e0c080", e: "#120e08", n: "#f0e8d4" }
        },
        {
          key: "lion",
          slot: 4,
          common: "Lion",
          scientific: "Panthera leo",
          traits: ["Males carry a heavy dark mane", "Tawny coat, black tail tuft"],
          iucn: "VU",
          fact: "Spends most of the day resting in the shade; nearly all its hunting happens at night.",
          source: iucn("Panthera leo"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["cub", "juvenile", "adult", "elder"],
          sleepy: true,
          behaviour: "Lies sprawled in the shade of an acacia, barely moving all day.",
          body: { kind: "quadruped", size: [13, 7], legs: 2, tail: { len: 8, style: "down" }, crest: 3, ears: 2 },
          palette: { b: "#b0864a", d: "#6a4e26", l: "#d8b070", e: "#120e08", n: "#3a2a18" }
        }
      ],
      understory: [
        { key: "termite-mound", label: "Termite mound", what: "A tall red-earth mound", colour: "#9a6a3a" },
        { key: "tall-grass", label: "Golden grass", what: "Grass greens up fast after the rains", colour: "#c0b068" },
        { key: "dust", label: "Dust haze", what: "Dry-season dust hanging low over the plain", colour: "#c8ae82" }
      ]
    },
    {
      key: "riverine-woodland",
      hasWater: true,
      label: "Riverine woodland",
      note: "A green ribbon of fig and fever tree following the only permanent water for miles.",
      ground: ["#3c5636", "#2c3e28", "#4e6e46"],
      ambience: ["mist", "passingFlock"],
      plants: [
        {
          key: "fever-tree",
          common: "Fever tree",
          scientific: "Vachellia xanthophloea",
          form: "broadleaf",
          traits: ["Smooth lime-yellow powdery bark", "Flat feathery crown"],
          iucn: "LC",
          fact: "Named by early travellers who caught fever near it \u2014 the real cause was the mosquitoes in the swamp it favours, not the tree.",
          source: gbif("Vachellia xanthophloea"),
          crown: ["#253420", "#34482c", "#46603a", "#5c7a4c", "#7c9866"],
          bark: ["#c8c468", "#9a9648", "#6a6830"],
          ailing: "bare",
          spread: 1.1
        },
        {
          key: "sycamore-fig",
          common: "Sycamore fig",
          scientific: "Ficus sycomorus",
          form: "broadleaf",
          traits: ["Huge spreading crown over the riverbank", "Smooth pale bark, often buttressed"],
          iucn: "LC",
          fact: "Fruits almost year-round, which makes it a reliable food source whatever the season.",
          source: gbif("Ficus sycomorus"),
          crown: ["#1a3020", "#254a2c", "#33633a", "#467e4c", "#669c60"],
          bark: ["#b0a888", "#857a60", "#564e3c"],
          ailing: "bare",
          spread: 1.3
        }
      ],
      creatures: [
        {
          key: "hippo",
          slot: 0,
          common: "Hippopotamus",
          scientific: "Hippopotamus amphibius",
          traits: ["Enormous barrel body, mostly submerged", "Small ears and eyes high on the head"],
          iucn: "VU",
          fact: "Spends most of the day in the river to stay cool, and grazes on land almost entirely at night.",
          source: iucn("Hippopotamus amphibius"),
          activity: "nocturnal",
          zone: "water",
          stages: ["calf", "juvenile", "adult", "elder"],
          still: true,
          behaviour: "Lies almost entirely submerged, just the eyes and ears showing.",
          body: { kind: "swimmer", size: [15, 6], legs: 0, ears: 1 },
          palette: { b: "#6a5c50", d: "#3e342c", l: "#8a7c6e", e: "#0c0a06", n: "#d89080" }
        },
        {
          key: "african-elephant",
          slot: 1,
          common: "African bush elephant",
          scientific: "Loxodonta africana",
          traits: ["Huge fan-shaped ears", "Long curved tusks and a trunk used for almost everything"],
          iucn: "EN",
          fact: "The largest land animal alive. A family group is led by the oldest, most experienced female.",
          source: iucn("Loxodonta africana"),
          activity: "cathemeral",
          zone: "ground",
          stages: ["calf", "juvenile", "adult", "matriarch"],
          behaviour: "Walks slowly along the river, ears flapping gently, trunk swinging.",
          body: { kind: "bulky", size: [16, 12], legs: 4, ears: 6, tail: { len: 3, style: "down" }, beak: 6 },
          palette: { b: "#8a8680", d: "#5a5650", l: "#aca89e", e: "#120e08", n: "#f0ece0" }
        },
        {
          key: "nile-crocodile",
          slot: 2,
          common: "Nile crocodile",
          scientific: "Crocodylus niloticus",
          traits: ["Broad heavy olive-green body", "Lies almost motionless at the water\u2019s edge"],
          iucn: "LC",
          fact: "Can hold its breath for well over an hour and ambushes prey from almost total stillness.",
          source: iucn("Crocodylus niloticus"),
          activity: "cathemeral",
          zone: "waterEdge",
          stages: ["hatchling", "juvenile", "adult", "old"],
          still: true,
          behaviour: "Lies at the water\u2019s edge, barely a ripple showing.",
          body: { kind: "reptile", size: [18, 4], legs: 1, tail: { len: 10, style: "down" }, neck: 2 },
          palette: { b: "#4a4e38", d: "#2a2e20", l: "#6e7250", e: "#0a0c06", y: "#9a9460" }
        },
        {
          key: "vervet-monkey",
          slot: 3,
          common: "Vervet monkey",
          scientific: "Chlorocebus pygerythrus",
          traits: ["Grey-olive body with a black face", "Males show vivid blue-and-red colouring below"],
          iucn: "LC",
          fact: "Has distinct alarm calls for different predators \u2014 one for eagles, another for snakes, another for leopards.",
          source: iucn("Chlorocebus pygerythrus"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Moves through the branches in short hops, pausing often to watch the ground.",
          body: { kind: "quadruped", size: [8, 5], legs: 2, tail: { len: 10, style: "up" }, ears: 1 },
          palette: { b: "#8a8470", d: "#5e5a48", l: "#b0ac96", e: "#120e08", n: "#1a1814" }
        },
        {
          key: "african-fish-eagle",
          slot: 4,
          common: "African fish eagle",
          scientific: "Icthyophaga vocifer",
          traits: ["White head and chest, chestnut body", "Black wings with a loud ringing call"],
          iucn: "LC",
          fact: "Its far-carrying call is often described as the sound of the African riverside.",
          source: iucn("Icthyophaga vocifer"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "juvenile", "adult", "elder"],
          flourish: "soar",
          behaviour: "Perches high over the water, then drops in a shallow dive to snatch a fish.",
          body: { kind: "flyer", size: [12, 6], tail: { len: 4, style: "fan" }, beak: 2 },
          palette: { d: "#1a1814", b: "#2c2820", g: "#f2efe8", y: "#d89a3a", r: "#8a4a30" }
        }
      ],
      understory: [
        { key: "reed", label: "Riverine reeds", what: "Reeds along the bank", colour: "#5a7a44" },
        { key: "fig-drop", label: "Fallen figs", what: "Fruit dropped from the fig trees", colour: "#9a7a4a" },
        { key: "river-mist", label: "River mist", what: "Morning mist over the water", colour: "#c8d0c8" }
      ]
    }
  ]
};

// src/regions/canada/index.ts
var canada = {
  key: "canada",
  label: "Canada",
  note: "Boreal spruce and lakes, and the Rocky Mountain alpine above them.",
  hemisphere: "north",
  defaultStages: ["kit", "juvenile", "adult", "elder"],
  seasons: {
    model: "northern",
    months: [
      "winter",
      "winter",
      "spring",
      "spring",
      "spring",
      "summer",
      "summer",
      "summer",
      "autumn",
      "autumn",
      "autumn",
      "winter"
    ],
    notes: {
      spring: "Ice breaks up on the lakes; loons return.",
      summer: "Long bright days, and the black flies are at their worst.",
      autumn: "Tamarack turns gold before it drops its needles entirely.",
      winter: "Deep snow and aurora on clear nights. Snowshoe hares turn white."
    }
  },
  backdrops: [
    {
      key: "glacial-lake",
      label: "Glacial lake",
      note: "A turquoise lake below jagged grey peaks, boreal forest at the shoreline.",
      sky: ["#5f8cc0", "#82a6d0", "#a6bfdc", "#c7d6e6", "#dde6ea", "#eef2ea"],
      far: "#7a8ca0",
      near: "#4e6070",
      form: "peaks"
    },
    {
      key: "jagged-peaks",
      label: "Jagged peaks",
      note: "Sharp rock spires above a wide U-shaped glacial valley.",
      sky: ["#6a93c0", "#8ca8ce", "#aec0dc", "#cdd6e4", "#e2e6e4", "#f0f0e8"],
      far: "#9aa6b4",
      near: "#6a7684",
      form: "peaks"
    },
    {
      key: "aurora-night",
      label: "Aurora over the mountains",
      note: "Green and violet aurora moving slowly above a dark ridgeline.",
      sky: ["#040812", "#081428", "#101e38", "#182a48", "#223658", "#2e4468"],
      far: "#182230",
      near: "#101a24",
      night: true,
      form: "peaks"
    }
  ],
  biomes: [
    {
      key: "boreal",
      hasWater: true,
      label: "Boreal forest and lakes",
      note: "Black spruce and birch around cold, clear lakes.",
      ground: ["#2e3e2a", "#20301e", "#3c523a"],
      ambience: ["mist"],
      plants: [
        {
          key: "black-spruce",
          common: "Black spruce",
          scientific: "Picea mariana",
          form: "conifer",
          traits: ["Narrow scraggly crown, often with a dense knot of branches at the top", "Dark, almost black-green needles"],
          iucn: "LC",
          fact: "Tolerates waterlogged, nutrient-poor bog soil better than almost any other conifer.",
          source: gbif("Picea mariana"),
          crown: ["#101e16", "#182e20", "#223e2a", "#305038", "#44684a"],
          bark: ["#5a4a3c", "#3e332a", "#26201a"],
          ailing: "bare",
          spread: 0.7
        },
        {
          key: "paper-birch",
          common: "Paper birch",
          scientific: "Betula papyrifera",
          form: "broadleaf",
          traits: ["Brilliant white peeling papery bark", "Light, airy, pale-green crown"],
          iucn: "LC",
          fact: "The bark was used for canoes across much of the north \u2014 it is waterproof and peels in wide sheets.",
          source: gbif("Betula papyrifera"),
          crown: ["#2c3a24", "#3c5030", "#4f683e", "#678250", "#86a068"],
          bark: ["#f0ece2", "#c8c2b4", "#8a8478"],
          ailing: "bare",
          spread: 0.9
        },
        {
          key: "tamarack",
          common: "Tamarack",
          scientific: "Larix laricina",
          form: "conifer",
          traits: ["Soft needles in small tufts along the branch", "Turns gold then drops all its needles in autumn"],
          iucn: "LC",
          fact: "A conifer that is not evergreen \u2014 it loses every needle each autumn like a broadleaf tree.",
          source: gbif("Larix laricina"),
          crown: ["#1a2816", "#263a1e", "#344e28", "#486636", "#d8b84a"],
          bark: ["#6a5a48", "#473c30", "#2c251c"],
          ailing: "autumn",
          spread: 0.75
        }
      ],
      creatures: [
        {
          key: "common-loon",
          slot: 0,
          common: "Common loon",
          scientific: "Gavia immer",
          traits: ["Chequered black-and-white back", "A haunting, far-carrying wail"],
          iucn: "LC",
          fact: "Its call across a still lake at dusk is one of the signature sounds of the Canadian north.",
          source: iucn("Gavia immer"),
          activity: "diurnal",
          zone: "water",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Glides low on the water, then dives smoothly without a splash.",
          body: { kind: "swimmer", size: [10, 5], neck: 3, beak: 3 },
          palette: { b: "#1a1a1c", d: "#0a0a0c", l: "#3a3a3e", e: "#140e08", w: "#f0ece0" }
        },
        {
          key: "snowshoe-hare",
          slot: 1,
          common: "Snowshoe hare",
          scientific: "Lepus americanus",
          traits: ["Huge hind feet for the snow", "Brown in summer, pure white in winter"],
          iucn: "LC",
          fact: "Changes coat colour with the seasons, timed by day length rather than temperature.",
          source: iucn("Lepus americanus"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["kit", "juvenile", "adult", "elder"],
          behaviour: "Freezes at the first sign of movement, then bolts in a zigzag.",
          body: { kind: "quadruped", size: [7, 5], legs: 2, ears: 3, tail: { len: 1, style: "none" } },
          palette: { b: "#8a7458", d: "#5a4a36", l: "#bca888", e: "#120e08", w: "#f0ece4" }
        },
        {
          key: "canada-lynx",
          slot: 2,
          common: "Canada lynx",
          scientific: "Lynx canadensis",
          traits: ["Tufted black ear-tips", "Very large furred paws for walking on snow"],
          iucn: "LC",
          fact: "Its population rises and falls closely in step with the snowshoe hare, its main prey.",
          source: iucn("Lynx canadensis"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["kitten", "juvenile", "adult", "elder"],
          behaviour: "Moves in near silence through deep snow, barely sinking in.",
          body: { kind: "quadruped", size: [10, 7], legs: 3, tail: { len: 2, style: "down" }, ears: 3 },
          palette: { b: "#a89a7e", d: "#746650", l: "#cfc2a4", e: "#120e08", n: "#1a1814" }
        },
        {
          key: "beaver",
          slot: 3,
          common: "North American beaver",
          scientific: "Castor canadensis",
          traits: ["Broad flat scaly tail", "Large orange incisors, always visible"],
          iucn: "LC",
          fact: "Builds and maintains a dam that, as a long-studied colony keeps at it, grows more elaborate year on year.",
          source: iucn("Castor canadensis"),
          activity: "nocturnal",
          zone: "water",
          stages: ["kit", "juvenile", "adult", "elder"],
          flourish: "dam",
          behaviour: "Swims with just the head above water, hauling a branch toward the dam.",
          body: { kind: "swimmer", size: [9, 4], tail: { len: 3, style: "down" } },
          palette: { b: "#6a4e30", d: "#3e2c1a", l: "#8a6a44", e: "#0c0806", y: "#e8a030" }
        },
        {
          key: "moose",
          slot: 4,
          common: "Moose",
          scientific: "Alces alces",
          traits: ["Huge broad palmate antlers on males", "A heavy dewlap under the chin"],
          iucn: "LC",
          fact: "The largest living deer species, and a strong swimmer that will cross a lake without hesitation.",
          source: iucn("Alces alces"),
          activity: "crepuscular",
          zone: "waterEdge",
          stages: ["calf", "juvenile", "adult", "elder"],
          behaviour: "Wades into the shallows and dips its whole head under for pond weed.",
          body: { kind: "quadruped", size: [14, 11], legs: 5, neck: 3, crest: 5, tail: { len: 1, style: "none" } },
          palette: { b: "#3a2e22", d: "#201812", l: "#5c4a38", e: "#0a0806", n: "#8a7a60" }
        }
      ],
      understory: [
        { key: "lichen", label: "Lichen", what: "Pale lichen on the spruce", colour: "#9aa088" },
        { key: "blueberry", label: "Blueberry bushes", what: "Low berry bushes thicken as the grove recovers", colour: "#3a5c38" },
        { key: "loon-call", label: "Still water", what: "Glassy water at dawn", colour: "#a8c0c8" }
      ]
    },
    {
      key: "rocky-alpine",
      label: "Rocky Mountain alpine",
      note: "Rock, scree and wind above the treeline.",
      ground: ["#8a8a7e", "#6a6a5e", "#9c9c8e"],
      ambience: ["snow", "mist"],
      plants: [
        {
          key: "subalpine-fir",
          common: "Subalpine fir",
          scientific: "Abies lasiocarpa",
          form: "conifer",
          traits: ["Narrow spire-like crown that sheds snow easily", "Grows stunted and wind-flagged near the treeline"],
          iucn: "LC",
          fact: "Near the treeline it grows low and matted, pressed flat by wind and snow into what is called krummholz.",
          source: gbif("Abies lasiocarpa"),
          crown: ["#121f1a", "#1c3024", "#28432e", "#39583e", "#507050"],
          bark: ["#6a5a48", "#473c30", "#2c251c"],
          ailing: "bare",
          spread: 0.65
        },
        {
          key: "alpine-fleabane",
          common: "Alpine fleabane",
          scientific: "Erigeron sp.",
          form: "shrub",
          traits: ["Low cushion of narrow leaves", "Purple daisy-like flowers close to the ground"],
          iucn: "NE",
          fact: "Grows low and tight to avoid the wind that scours every exposed ridge.",
          source: gbif("Erigeron"),
          crown: ["#3a4030", "#4c5640", "#606e50", "#788a62", "#b090c8"],
          bark: ["#5a5444", "#403c30", "#28251c"],
          ailing: "dry",
          spread: 0.55
        }
      ],
      creatures: [
        {
          key: "bighorn-sheep",
          slot: 0,
          common: "Bighorn sheep",
          scientific: "Ovis canadensis",
          traits: ["Massive curled horns on rams", "Pale rump patch"],
          iucn: "LC",
          fact: "Rams clash horns head-on in contests that can be heard echoing across a valley.",
          source: iucn("Ovis canadensis"),
          activity: "diurnal",
          zone: "slope",
          stages: ["lamb", "juvenile", "adult", "elder"],
          behaviour: "Stands on a rock ledge, surveying the slope below.",
          body: { kind: "quadruped", size: [10, 8], legs: 4, crest: 4, tail: { len: 1, style: "none" } },
          palette: { b: "#a89880", d: "#746650", l: "#cfc2a4", e: "#120e08", n: "#e8e0d0" }
        },
        {
          key: "hoary-marmot",
          slot: 1,
          common: "Hoary marmot",
          scientific: "Marmota caligata",
          traits: ["Grizzled grey-and-black fur", "A sharp whistling alarm call"],
          iucn: "LC",
          fact: 'Its piercing whistle at the first sign of danger is why it is sometimes called the "whistler".',
          source: iucn("Marmota caligata"),
          activity: "diurnal",
          zone: "burrow",
          stages: ["pup", "juvenile", "adult", "elder"],
          behaviour: "Sits up on a boulder, surveying, then dives down its burrow at the least disturbance.",
          body: { kind: "bulky", size: [8, 4], legs: 2, ears: 1, tail: { len: 3, style: "down" } },
          palette: { b: "#8a8070", d: "#5a5244", l: "#b0a690", e: "#120e08", n: "#1e1a14" }
        },
        {
          key: "mountain-goat",
          slot: 2,
          common: "Mountain goat",
          scientific: "Oreamnos americanus",
          traits: ["Shaggy pure white coat", "Short black dagger-like horns"],
          iucn: "LC",
          fact: "Moves confidently across ledges most other animals could not cross, and generally wins any dispute with bighorn sheep over them.",
          source: iucn("Oreamnos americanus"),
          activity: "diurnal",
          zone: "slope",
          stages: ["kid", "juvenile", "adult", "elder"],
          behaviour: "Picks its way along a narrow ledge without hesitating.",
          body: { kind: "quadruped", size: [9, 8], legs: 4, crest: 2, tail: { len: 1, style: "none" } },
          palette: { b: "#f0ece0", d: "#c8c0a8", l: "#ffffff", e: "#140f0a" }
        },
        {
          key: "golden-eagle",
          slot: 3,
          common: "Golden eagle",
          scientific: "Aquila chrysaetos",
          traits: ["Golden-brown nape feathers", "Broad dark wings held in a slight dihedral"],
          iucn: "LC",
          fact: "Hunts over open alpine country and can dive at well over a hundred kilometres an hour.",
          source: iucn("Aquila chrysaetos"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "fledgling", "adult", "elder"],
          flourish: "soar",
          behaviour: "Circles high above the ridge, barely beating its wings.",
          body: { kind: "flyer", size: [15, 5], tail: { len: 4, style: "fan" }, beak: 2 },
          palette: { d: "#2a2018", b: "#44352a", g: "#1a1410", y: "#8a6a3a" }
        },
        {
          key: "grizzly-bear",
          slot: 4,
          common: "Grizzly bear",
          scientific: "Ursus arctos horribilis",
          traits: ["A pronounced shoulder hump", "Silver-tipped fur giving a grizzled look"],
          iucn: "LC",
          national: "Of Special Concern in parts of Canada, with regional declines",
          fact: "Digs for roots and ground squirrels across alpine meadows, turning over enormous amounts of soil each season.",
          source: iucn("Ursus arctos"),
          activity: "crepuscular",
          zone: "slope",
          stages: ["cub", "yearling", "adult", "elder"],
          flourish: "dig",
          behaviour: "Digs steadily at a meadow, shoulders rolling with each heave.",
          body: { kind: "bulky", size: [14, 9], legs: 4, crest: 2, tail: { len: 1, style: "none" } },
          palette: { b: "#6a5438", d: "#3e2f1e", l: "#8a7250", e: "#0c0906", n: "#b0a078" }
        }
      ],
      understory: [
        { key: "scree-ca", label: "Scree", what: "Loose broken rock", colour: "#8a8a7e" },
        { key: "alpine-flower", label: "Alpine flowers", what: "Tiny flowers tucked between the rocks", colour: "#b090c8" },
        { key: "snowpatch-ca", label: "Snow patch", what: "Late-lying snow in a shaded gully", colour: "#e8eef4" }
      ]
    }
  ]
};

// src/regions/norway/index.ts
var norway = {
  key: "norway",
  label: "Norway",
  note: "Pine and spruce taiga, and the fjord coast rising to a windswept plateau.",
  hemisphere: "north",
  defaultStages: ["kalv", "juvenile", "adult", "elder"],
  excludedSpecies: [
    {
      common: "Muskox",
      scientific: "Ovibos moschatus",
      reason: "Associated with the Dovrefjell plateau today, but the mainland European population died out at the end of the last Ice Age. Norway's only wild herd was introduced from Greenland in several attempts between 1932 and 1953. Not native, so left out."
    }
  ],
  seasons: {
    model: "northern",
    months: [
      "polarNight",
      "winter",
      "spring",
      "spring",
      "spring",
      "midnightSun",
      "midnightSun",
      "summer",
      "autumn",
      "autumn",
      "winter",
      "polarNight"
    ],
    notes: {
      spring: "Snowmelt floods the rivers; migratory birds return to the coast.",
      midnightSun: "The sun barely sets in the north; a long golden evening light all through the night.",
      autumn: "Rowan berries turn red and cloudberries ripen on the plateau.",
      polarNight: "The sun stays below the horizon in the far north; aurora on clear nights."
    }
  },
  backdrops: [
    {
      key: "fjord-waterfall",
      label: "Fjord with a waterfall",
      note: "Steep fjord walls, a thread of waterfall, pine clinging to the lower slopes.",
      sky: ["#5f87b8", "#82a0c6", "#a6bcd6", "#c7d6e2", "#dde6e4", "#eef2ec"],
      far: "#5a7088",
      near: "#3a5060",
      form: "fjord"
    },
    {
      key: "snowy-plateau",
      label: "Snowy plateau",
      note: "A wide white tableland under a pale winter sky, scattered rock showing through.",
      sky: ["#7aa0c8", "#9ab2d0", "#bcc8da", "#d8d8de", "#e8e4e2", "#f4f0ec"],
      far: "#c0c6d0",
      near: "#8a94a0",
      form: "plateau"
    },
    {
      key: "aurora-mountains",
      label: "Aurora over the mountains",
      note: "Pale green curtains of aurora moving above a dark jagged skyline.",
      sky: ["#040810", "#081426", "#101e36", "#182a46", "#223656", "#2e4466"],
      far: "#162030",
      near: "#0e1826",
      night: true,
      form: "peaks"
    }
  ],
  biomes: [
    {
      key: "taiga",
      label: "Taiga forest",
      note: "Pine, spruce and birch, with rowan berries turning red in autumn.",
      ground: ["#2e3e28", "#20301e", "#3c523a"],
      ambience: ["mist", "snow"],
      plants: [
        {
          key: "scots-pine",
          common: "Scots pine",
          scientific: "Pinus sylvestris",
          form: "conifer",
          traits: ["Reddish flaking bark on the upper trunk", "Flattened, irregular crown on older trees"],
          iucn: "LC",
          fact: "The bark turns a distinctive warm orange-red high on the trunk, where it is thinnest and most recently shed.",
          source: gbif("Pinus sylvestris"),
          crown: ["#14241c", "#1e3628", "#2a4a34", "#3b6044", "#537c58"],
          bark: ["#a86a44", "#7a4a2e", "#4e2e1c"],
          ailing: "bare",
          spread: 0.75
        },
        {
          key: "norway-spruce",
          common: "Norway spruce",
          scientific: "Picea abies",
          form: "conifer",
          traits: ["Drooping lower branches with hanging cones", "Tall straight symmetrical spire"],
          iucn: "LC",
          fact: "One of the oldest-known living trees on Earth is a Norway spruce clone in the Swedish mountains, estimated at over nine thousand years.",
          source: gbif("Picea abies"),
          crown: ["#101f17", "#1a3024", "#24432e", "#33583c", "#48724e"],
          bark: ["#6a5a48", "#473c30", "#2c251c"],
          ailing: "bare",
          spread: 0.7
        },
        {
          key: "downy-birch",
          common: "Downy birch",
          scientific: "Betula pubescens",
          form: "broadleaf",
          traits: ["Pale grey-brown bark, less papery than silver birch", "Soft downy young twigs"],
          iucn: "LC",
          fact: "Hardier than silver birch and the one that reaches furthest north and highest up the mountainside.",
          source: gbif("Betula pubescens"),
          crown: ["#2c3a24", "#3c5030", "#4f683e", "#678250", "#86a068"],
          bark: ["#d8d0c0", "#ada290", "#7a7062"],
          ailing: "bare",
          spread: 0.9
        },
        {
          key: "rowan",
          common: "Rowan",
          scientific: "Sorbus aucuparia",
          form: "broadleaf",
          traits: ["Clusters of bright red berries in autumn", "Delicate feathery leaves"],
          iucn: "LC",
          fact: "Its berries turn a vivid red in autumn and are stripped quickly by thrushes and waxwings.",
          source: gbif("Sorbus aucuparia"),
          crown: ["#243222", "#33462c", "#455c3a", "#5b764c", "#c0302a"],
          bark: ["#7a7058", "#564e3c", "#342f24"],
          ailing: "autumn",
          spread: 0.85
        }
      ],
      creatures: [
        {
          key: "elg",
          slot: 0,
          common: "Elk",
          scientific: "Alces alces",
          localName: "elg",
          localLanguage: "Norwegian",
          traits: ["Broad palmate antlers on males", "A heavy dewlap under the chin"],
          iucn: "LC",
          fact: "Norway's most hunted big game animal, and the taiga's largest herbivore by far.",
          source: iucn("Alces alces"),
          activity: "crepuscular",
          zone: "ground",
          stages: ["kalv", "juvenile", "adult", "elder"],
          behaviour: "Browses birch twigs at the forest edge, head lifting often to listen.",
          body: { kind: "quadruped", size: [14, 11], legs: 5, neck: 3, crest: 5, tail: { len: 1, style: "none" } },
          palette: { b: "#3a2e22", d: "#201812", l: "#5c4a38", e: "#0a0806", n: "#8a7a60" }
        },
        {
          key: "ekorn",
          slot: 1,
          common: "Red squirrel",
          scientific: "Sciurus vulgaris",
          localName: "ekorn",
          localLanguage: "Norwegian",
          traits: ["Rust-red coat, paler in winter", "Tufted ears in winter coat"],
          iucn: "LC",
          fact: "Buries cones and seeds across a wide area each autumn and relies on scent, not memory, to find them again.",
          source: iucn("Sciurus vulgaris"),
          activity: "diurnal",
          zone: "trunk",
          stages: ["kit", "juvenile", "adult", "elder"],
          behaviour: "Darts up a trunk in short bursts, pausing flat against the bark.",
          body: { kind: "quadruped", size: [6, 4], legs: 2, ears: 2, tail: { len: 6, style: "bush" } },
          palette: { b: "#a8502a", d: "#6a3018", l: "#d08050", e: "#120c06", n: "#f0e8dc" }
        },
        {
          key: "fjellrev-forest",
          slot: 2,
          common: "Eurasian lynx",
          scientific: "Lynx lynx",
          traits: ["Tufted black ear-tips", "Short bobbed tail and a ruffed face"],
          iucn: "LC",
          national: "Endangered on the Norwegian Red List",
          fact: "Globally secure, but closely managed in Norway, where it is hunted under an annual quota.",
          source: iucn("Lynx lynx"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["kitten", "juvenile", "adult", "elder"],
          behaviour: "Moves without a sound along the treeline, pausing to listen.",
          body: { kind: "quadruped", size: [11, 8], legs: 3, tail: { len: 2, style: "down" }, ears: 3 },
          palette: { b: "#b0a080", d: "#7a6c50", l: "#d4c6a4", e: "#120e08", n: "#1a1814" }
        },
        {
          key: "jerv",
          slot: 3,
          common: "Wolverine",
          scientific: "Gulo gulo",
          localName: "jerv",
          localLanguage: "Norwegian",
          traits: ["Dark shaggy body with pale flank stripes", "A powerful, stocky build for its size"],
          iucn: "LC",
          national: "Endangered on the Norwegian Red List",
          fact: "Ranges over enormous distances for its size and can bring down prey many times its own weight.",
          source: iucn("Gulo gulo"),
          activity: "nocturnal",
          zone: "ground",
          stages: ["kit", "juvenile", "adult", "elder"],
          behaviour: "Moves in a loping run across open ground, covering distance fast.",
          body: { kind: "quadruped", size: [9, 5], legs: 2, tail: { len: 4, style: "bush" }, ears: 1 },
          palette: { b: "#3e3024", d: "#201810", l: "#5c4a38", e: "#0a0806", n: "#8a6a48" }
        },
        {
          key: "storfugl",
          slot: 4,
          common: "Western capercaillie",
          scientific: "Tetrao urogallus",
          localName: "storfugl",
          localLanguage: "Norwegian",
          traits: ["Huge dark body, fanned black tail on the male", "A red wattle over the eye"],
          iucn: "LC",
          fact: "The male performs a loud, strange popping display at dawn gatherings each spring.",
          source: iucn("Tetrao urogallus"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chick", "juvenile", "adult", "elder"],
          flourish: "display",
          behaviour: "Struts with its tail fanned, wings dropped, at the forest edge.",
          body: { kind: "bird", size: [10, 9], beak: 2, tail: { len: 6, style: "fan" }, legs: 2 },
          palette: { b: "#1a1a1c", d: "#0a0a0c", l: "#3a3a3e", e: "#c0302a", w: "#8a8470" }
        }
      ],
      understory: [
        { key: "lingonberry", label: "Lingonberry", what: "Low berry shrubs across the forest floor", colour: "#4a6a3c" },
        { key: "cloudberry", label: "Cloudberry", what: "Amber berries on the bog edge in late summer", colour: "#e0a040" },
        { key: "reindeer-lichen", label: "Reindeer lichen", what: "Pale lichen carpeting the ground", colour: "#a8ac98" }
      ]
    },
    {
      key: "fjord-plateau",
      hasWater: true,
      label: "Fjord coast and plateau",
      note: "Steep fjord walls below, a wide windswept tundra plateau above.",
      ground: ["#8a9078", "#6a7258", "#9ca488"],
      ambience: ["snow", "mist"],
      plants: [
        {
          key: "heather",
          common: "Heather",
          scientific: "Calluna vulgaris",
          localName: "lyng",
          localLanguage: "Norwegian",
          form: "shrub",
          traits: ["Dense low wiry mat", "Small purple-pink flowers in late summer"],
          iucn: "LC",
          fact: "Covers vast stretches of the coastal moor and turns a deep purple in late summer.",
          source: gbif("Calluna vulgaris"),
          crown: ["#2e2a34", "#3e3844", "#524854", "#6a5c68", "#9a6a94"],
          bark: ["#4a4038", "#342c26", "#201c18"],
          ailing: "dry",
          spread: 0.55
        },
        {
          key: "dwarf-birch",
          common: "Dwarf birch",
          scientific: "Betula nana",
          form: "shrub",
          traits: ["Tiny rounded serrated leaves", "A low creeping tangle, barely knee-high"],
          iucn: "LC",
          fact: "Grows so low that in a hard winter the whole plant disappears entirely under the snow.",
          source: gbif("Betula nana"),
          crown: ["#2a3a24", "#3a4e30", "#4d663e", "#648050", "#c0302a"],
          bark: ["#5a5244", "#403a30", "#28241c"],
          ailing: "autumn",
          spread: 0.5
        }
      ],
      creatures: [
        {
          key: "fjellrev",
          slot: 0,
          common: "Arctic fox",
          scientific: "Vulpes lagopus",
          localName: "fjellrev",
          localLanguage: "Norwegian",
          traits: ["Pure white winter coat, brown-grey in summer", "Thick fur even on the soles of its feet"],
          iucn: "LC",
          national: "Critically Endangered on the Norwegian Red List, with active recovery programmes",
          fact: "One of Norway\u2019s rarest mammals despite being secure globally \u2014 the mainland population fell drastically through the twentieth century.",
          source: iucn("Vulpes lagopus"),
          activity: "cathemeral",
          zone: "slope",
          stages: ["kit", "juvenile", "adult", "elder"],
          behaviour: "Trots across the snow, pausing to listen for movement beneath it.",
          body: { kind: "quadruped", size: [8, 4], legs: 2, tail: { len: 5, style: "bush" }, ears: 2 },
          palette: { b: "#f0ece4", d: "#c8c0b0", l: "#ffffff", e: "#120e08", n: "#8a8270" }
        },
        {
          key: "reinsdyr",
          slot: 1,
          common: "Wild reindeer",
          scientific: "Rangifer tarandus",
          localName: "reinsdyr",
          localLanguage: "Norwegian",
          traits: ["Branching antlers on both sexes", "Thick pale-brown winter coat"],
          iucn: "VU",
          fact: "Norway holds some of the last truly wild mountain reindeer herds left in Europe.",
          source: iucn("Rangifer tarandus"),
          activity: "diurnal",
          zone: "slope",
          stages: ["kalv", "juvenile", "adult", "elder"],
          behaviour: "Moves in a loose herd across the plateau, pawing through snow for lichen.",
          body: { kind: "quadruped", size: [11, 9], legs: 4, crest: 5, tail: { len: 2, style: "down" } },
          palette: { b: "#9a8468", d: "#6a5844", l: "#c0a888", e: "#120e08", n: "#f0e8d8" }
        },
        {
          key: "havorn",
          slot: 2,
          common: "White-tailed eagle",
          scientific: "Haliaeetus albicilla",
          localName: "hav\xF8rn",
          localLanguage: "Norwegian",
          traits: ["Enormous broad wings and a short white wedge tail", "A heavy pale yellow bill"],
          iucn: "LC",
          fact: "The largest eagle in Europe, and Norway\u2019s coast and fjords hold one of the healthiest populations anywhere.",
          source: iucn("Haliaeetus albicilla"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "fledgling", "adult", "elder"],
          flourish: "soar",
          behaviour: "Glides low along the fjord wall, then rises on the updraught.",
          body: { kind: "flyer", size: [16, 6], tail: { len: 3, style: "fan" }, beak: 3 },
          palette: { d: "#4a4438", b: "#5e5648", g: "#2a2620", y: "#d8c060", w: "#f0ece0" }
        },
        {
          key: "lunde",
          slot: 3,
          common: "Atlantic puffin",
          scientific: "Fratercula arctica",
          localName: "lunde",
          localLanguage: "Norwegian",
          traits: ["Brightly striped orange-and-grey bill, in summer only", "Black back, white face and underside"],
          iucn: "VU",
          fact: "Nests in burrows on sea cliffs through summer, then spends the rest of the year far out at sea, bill faded to a duller colour.",
          source: iucn("Fratercula arctica"),
          activity: "diurnal",
          zone: "waterEdge",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Stands at a burrow mouth on the cliff, then launches out over the water.",
          body: { kind: "bird", size: [6, 5], beak: 3, legs: 1, tail: { len: 1, style: "none" } },
          palette: { b: "#1a1a1c", d: "#0a0a0c", l: "#f0ece0", e: "#120e08", y: "#e8a030", r: "#c0302a" }
        },
        {
          key: "elg-fjell",
          slot: 4,
          common: "Golden eagle",
          scientific: "Aquila chrysaetos",
          traits: ["Golden-brown nape", "Broad dark wings held in a slight dihedral"],
          iucn: "LC",
          fact: "Patrols the open plateau for ptarmigan and hare, soaring for long stretches without a wingbeat.",
          source: iucn("Aquila chrysaetos"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "fledgling", "adult", "elder"],
          flourish: "soar",
          behaviour: "Circles very high over the tundra, barely moving its wings.",
          body: { kind: "flyer", size: [15, 5], tail: { len: 4, style: "fan" }, beak: 2 },
          palette: { d: "#2a2018", b: "#44352a", g: "#1a1410", y: "#8a6a3a" }
        }
      ],
      understory: [
        { key: "bearberry", label: "Bearberry", what: "Trailing berries across the rock", colour: "#6a8450" },
        { key: "moss-no", label: "Mountain moss", what: "Moss filling every damp hollow", colour: "#5a7a44" },
        { key: "rock-no", label: "Weathered rock", what: "Bare rock scoured by wind and ice", colour: "#8a8a7e" }
      ]
    }
  ]
};

// src/regions/nepal/index.ts
var nepal = {
  key: "nepal",
  label: "Nepal",
  note: "Sal forest and tall grassland in the Terai, and the Himalaya rising above it.",
  hemisphere: "north",
  defaultStages: ["calf", "juvenile", "adult", "elder"],
  seasons: {
    model: "monsoon",
    months: [
      "winter",
      "winter",
      "spring",
      "spring",
      "preMonsoon",
      "monsoon",
      "monsoon",
      "monsoon",
      "monsoon",
      "autumn",
      "autumn",
      "winter"
    ],
    notes: {
      spring: "Rhododendron blooms red across the mid-hills and lower Himalaya.",
      monsoon: "June to September: heavy rain, mist and the lushest green of the year.",
      autumn: "Clear, dry air \u2014 the classic mountain-view season."
    }
  },
  backdrops: [
    {
      key: "peaks-sunrise",
      label: "Snowy peaks at sunrise",
      note: "A jagged line of high snow peaks catching the first light above a valley still in shadow.",
      sky: ["#3a4a7a", "#6a6a9a", "#c08aa0", "#eaa37a", "#f6c08a", "#fbdca0"],
      far: "#d8d4dc",
      near: "#6a6a7a",
      form: "peaks"
    },
    {
      key: "terraced-hillside",
      label: "Terraced hillside",
      note: "Stepped terraces climbing a steep green hillside toward forested ridges.",
      sky: ["#79a0c0", "#9ab0c4", "#c4bca8", "#e6c694", "#f2d6a4", "#f8e4bc"],
      far: "#8a9676",
      near: "#6a7a54",
      form: "rolling"
    },
    {
      key: "glacial-valley",
      label: "Glacial river valley",
      note: "A broad valley carved by ice, a braided river catching the light below high walls.",
      sky: ["#6a93c0", "#8ca8ce", "#aec0dc", "#cdd6e4", "#e2e6e4", "#f0f0e8"],
      far: "#9aa6b4",
      near: "#6a7684",
      form: "peaks"
    },
    {
      key: "himalaya-night",
      label: "Himalaya at night",
      note: "A hard line of snow peaks catching starlight under a deep, thin, high-altitude sky.",
      sky: ["#070a18", "#0d152e", "#172240", "#223050", "#2d3e60", "#3a4e72"],
      far: "#243244",
      near: "#161f2c",
      night: true,
      form: "peaks"
    }
  ],
  biomes: [
    {
      key: "terai",
      hasWater: true,
      label: "Terai lowland",
      note: "Tall elephant grass and sal forest along the floodplain.",
      ground: ["#6a7a3e", "#4e5e2c", "#8a9850"],
      ambience: ["mist", "heatShimmer"],
      plants: [
        {
          key: "sal",
          common: "Sal",
          scientific: "Shorea robusta",
          form: "broadleaf",
          traits: ["Tall straight trunk, buttressed at the base", "Dense dark-green crown"],
          iucn: "LC",
          fact: "The dominant tree of the Terai, and the timber most used in traditional local building.",
          source: gbif("Shorea robusta"),
          crown: ["#162a1a", "#204028", "#2c5633", "#3e7044", "#588c58"],
          bark: ["#8a7a60", "#5e5342", "#3a3326"],
          ailing: "bare",
          spread: 1.1
        },
        {
          key: "elephant-grass",
          common: "Elephant grass",
          scientific: "Saccharum spontaneum",
          form: "columnar",
          traits: ["Towers well over head height", "Feathery silver-white flower plumes"],
          iucn: "NE",
          fact: "Grows tall enough to hide a tiger completely, which is exactly what it is used for.",
          source: gbif("Saccharum spontaneum"),
          crown: ["#4a5430", "#5e6c3c", "#76864c", "#92a260", "#d8d4b8"],
          bark: ["#6a6244", "#4c4630", "#302c1e"],
          ailing: "dry",
          spread: 0.8
        }
      ],
      creatures: [
        {
          key: "spotted-deer",
          slot: 0,
          common: "Chital",
          scientific: "Axis axis",
          traits: ["White-spotted rufous coat kept into adulthood", "Lyre-shaped antlers on males"],
          iucn: "LC",
          fact: "Keeps its white spots for life, unlike most spotted deer, and often grazes near langurs, which watch for predators from the trees above.",
          source: iucn("Axis axis"),
          activity: "diurnal",
          zone: "ground",
          stages: ["fawn", "juvenile", "adult", "elder"],
          behaviour: "Grazes in a loose herd at the grassland edge, ears constantly turning.",
          body: { kind: "quadruped", size: [10, 8], legs: 4, crest: 3, tail: { len: 2, style: "down" } },
          palette: { b: "#a86a3c", d: "#6a3e22", l: "#d09a60", e: "#120e08", n: "#f0ece0" }
        },
        {
          key: "asian-elephant",
          slot: 1,
          common: "Asian elephant",
          scientific: "Elephas maximus",
          traits: ["Smaller, more rounded ears than its African relative", "High-domed forehead"],
          iucn: "EN",
          fact: "Moves along well-worn ancestral paths through the floodplain, generation after generation.",
          source: iucn("Elephas maximus"),
          activity: "cathemeral",
          zone: "ground",
          stages: ["calf", "juvenile", "adult", "matriarch"],
          behaviour: "Moves slowly through the grass, trunk curling up a mouthful as it goes.",
          body: { kind: "bulky", size: [15, 11], legs: 4, ears: 4, tail: { len: 3, style: "down" }, beak: 5 },
          palette: { b: "#7a766e", d: "#4e4a42", l: "#9a968a", e: "#120e08", n: "#e8e2d4" }
        },
        {
          key: "gharial",
          slot: 2,
          common: "Gharial",
          scientific: "Gavialis gangeticus",
          traits: ["Extremely long, narrow snout full of fine teeth", "Males have a bulbous growth on the nose tip"],
          iucn: "CR",
          fact: "Its narrow snout is built for fish, not for anything larger \u2014 the population has fallen by around 98% since the 1940s.",
          source: iucn("Gavialis gangeticus"),
          activity: "diurnal",
          zone: "waterEdge",
          stages: ["hatchling", "juvenile", "adult", "old"],
          still: true,
          behaviour: "Basks motionless on a sandbank, narrow jaws slightly agape.",
          body: { kind: "reptile", size: [18, 3], legs: 1, tail: { len: 10, style: "down" }, neck: 1, beak: 6 },
          palette: { b: "#5a6048", d: "#343a28", l: "#7e8468", e: "#0a0c06" }
        },
        {
          key: "bengal-tiger",
          slot: 3,
          common: "Bengal tiger",
          scientific: "Panthera tigris tigris",
          traits: ["Orange coat with bold black stripes, unique to each tiger", "White underside and cheeks"],
          iucn: "EN",
          fact: "Rare and mostly hidden in the tall grass \u2014 most sightings are brief, and that is by design, not bad luck.",
          source: iucn("Panthera tigris"),
          activity: "crepuscular",
          zone: "ground",
          stages: ["cub", "juvenile", "adult", "elder"],
          behaviour: "Moves low through the grass, barely visible, and is usually gone before it is noticed.",
          body: { kind: "quadruped", size: [14, 8], legs: 2, tail: { len: 7, style: "down" }, ears: 1 },
          palette: { b: "#d8832a", d: "#8a4e16", l: "#f0ac5a", e: "#120e08", k: "#1a1410", w: "#f0ece0" }
        },
        {
          key: "greater-rhino",
          slot: 4,
          common: "Greater one-horned rhinoceros",
          scientific: "Rhinoceros unicornis",
          traits: ["Thick folded grey hide like armour plates", "A single horn"],
          iucn: "VU",
          fact: "One of conservation's genuine successes \u2014 Nepal's Chitwan population has grown steadily from a very low base.",
          source: iucn("Rhinoceros unicornis"),
          activity: "cathemeral",
          zone: "waterEdge",
          stages: ["calf", "juvenile", "adult", "elder"],
          behaviour: "Wallows at the water\u2019s edge, then stands and grazes heavily, unhurried.",
          body: { kind: "bulky", size: [14, 9], legs: 4, beak: 3, tail: { len: 2, style: "down" } },
          palette: { b: "#6a685c", d: "#403e34", l: "#8e8c7c", e: "#0c0a06", n: "#1a1814" }
        }
      ],
      understory: [
        { key: "elephant-grass-tall", label: "Tall grass", what: "Grass tall enough to hide a tiger", colour: "#8a9850" },
        { key: "riverine-sand", label: "River sandbank", what: "Sand where the gharial basks", colour: "#c4b084" },
        { key: "monsoon-mud", label: "Monsoon mud", what: "Wet ground after the rains", colour: "#5a4e38" }
      ]
    },
    {
      key: "himalaya",
      label: "High Himalaya",
      note: "Rhododendron forest giving way to alpine meadow and bare rock.",
      ground: ["#8a8878", "#6a6858", "#9ca08a"],
      ambience: ["snow", "mist"],
      plants: [
        {
          key: "rhododendron",
          common: "Rhododendron",
          scientific: "Rhododendron arboreum",
          form: "broadleaf",
          traits: ["Bright red bell-shaped flowers in spring", "Leathery dark green leaves"],
          iucn: "LC",
          fact: "Nepal's national flower, and whole mid-hill slopes turn deep red when it blooms in spring.",
          source: gbif("Rhododendron arboreum"),
          crown: ["#1e301e", "#2c462a", "#3c5e38", "#527a4a", "#c0302a"],
          bark: ["#7a6a58", "#564a3c", "#342c24"],
          ailing: "autumn",
          spread: 0.95
        },
        {
          key: "himalayan-birch",
          common: "Himalayan birch",
          scientific: "Betula utilis",
          form: "broadleaf",
          traits: ["Peeling coppery-pink papery bark", "Reaches higher up the mountain than almost any other tree"],
          iucn: "LC",
          fact: "Its bark was traditionally used as paper for sacred texts, which is reflected in its old Sanskrit name.",
          source: gbif("Betula utilis"),
          crown: ["#2c3a24", "#3c5030", "#4f683e", "#678250", "#86a068"],
          bark: ["#c88a6a", "#9a5e42", "#6a3e2a"],
          ailing: "bare",
          spread: 0.85
        },
        {
          key: "juniper-np",
          common: "Himalayan juniper",
          scientific: "Juniperus indica",
          form: "conifer",
          traits: ["Low, dense, wind-sculpted crown", "Scale-like blue-green foliage"],
          iucn: "LC",
          fact: "Grows right up to the edge of the alpine zone, often as the last woody plant before bare rock.",
          source: gbif("Juniperus indica"),
          crown: ["#1a2a1e", "#263c2a", "#324e36", "#436848", "#5c8460"],
          bark: ["#6a5c48", "#473c30", "#2c251c"],
          ailing: "bare",
          spread: 0.6
        }
      ],
      creatures: [
        {
          key: "himalayan-monal",
          slot: 0,
          common: "Himalayan monal",
          scientific: "Lophophorus impejanus",
          traits: ["Male is a blaze of iridescent copper, green and violet", "A distinctive wire-like forward crest"],
          iucn: "LC",
          fact: "Nepal's national bird. The male's colours shift through a whole spectrum depending on the angle of the light.",
          source: iucn("Lophophorus impejanus"),
          activity: "diurnal",
          zone: "slope",
          stages: ["chick", "juvenile", "adult", "elder"],
          flourish: "display",
          behaviour: "Scratches through leaf litter on a steep slope, crest catching the light.",
          body: { kind: "bird", size: [8, 7], beak: 2, crest: 3, tail: { len: 4, style: "down" }, legs: 1 },
          palette: { d: "#1a1420", b: "#2a1a34", g: "#1a5a40", y: "#c0392b", w: "#f0ece0" }
        },
        {
          key: "himalayan-tahr",
          slot: 1,
          common: "Himalayan tahr",
          scientific: "Hemitragus jemlahicus",
          traits: ["Shaggy reddish-brown coat, thick ruff on the shoulders", "Short backward-curving horns"],
          iucn: "NT",
          fact: "Moves confidently across cliffs that look sheer from below, barely pausing for the terrain.",
          source: iucn("Hemitragus jemlahicus"),
          activity: "diurnal",
          zone: "slope",
          stages: ["kid", "juvenile", "adult", "elder"],
          behaviour: "Grazes a steep slope, unbothered by the drop below.",
          body: { kind: "quadruped", size: [10, 8], legs: 4, crest: 4, tail: { len: 2, style: "down" } },
          palette: { b: "#8a5e3a", d: "#5a3a22", l: "#b0845c", e: "#120e08", n: "#1a1410" }
        },
        {
          key: "bharal",
          slot: 2,
          common: "Bharal",
          scientific: "Pseudois nayaur",
          traits: ['Blue-grey coat, hence "blue sheep"', "Smoothly curving horns"],
          iucn: "LC",
          fact: "The main prey of the snow leopard, and its colouring blends almost perfectly with bare rock.",
          source: iucn("Pseudois nayaur"),
          activity: "diurnal",
          zone: "slope",
          stages: ["lamb", "juvenile", "adult", "elder"],
          behaviour: "Stands motionless on a rock outcrop, nearly invisible against the stone.",
          still: true,
          body: { kind: "quadruped", size: [9, 7], legs: 4, crest: 3, tail: { len: 1, style: "none" } },
          palette: { b: "#8a8e90", d: "#5e6264", l: "#b0b4b4", e: "#120e08" }
        },
        {
          key: "red-panda",
          slot: 3,
          common: "Red panda",
          scientific: "Ailurus fulgens",
          traits: ["Rich russet-red fur with a white-ringed tail", "White facial markings"],
          iucn: "EN",
          fact: "Spends most of its life in trees and almost nothing on open ground, which keeps sightings rare.",
          source: iucn("Ailurus fulgens"),
          activity: "crepuscular",
          zone: "trunk",
          stages: ["cub", "juvenile", "adult", "elder"],
          sleepy: true,
          behaviour: "Curls asleep along a branch, tail wrapped over its face.",
          body: { kind: "quadruped", size: [8, 5], legs: 2, tail: { len: 8, style: "bush" }, ears: 2 },
          palette: { b: "#b0502a", d: "#6a2e14", l: "#d88a54", e: "#120c06", w: "#f0ece0", n: "#2a2018" }
        },
        {
          key: "snow-leopard",
          slot: 4,
          common: "Snow leopard",
          scientific: "Panthera uncia",
          traits: ["Pale grey coat with large smoky rosettes", "A very thick tail, almost as long as the body"],
          iucn: "VU",
          fact: "The rarest unlock in this biome, glimpsed only occasionally on a far ridge. Downlisted from Endangered in 2017, though many biologists still consider it under real pressure.",
          source: iucn("Panthera uncia"),
          activity: "crepuscular",
          zone: "slope",
          stages: ["cub", "juvenile", "adult", "elder"],
          behaviour: "Appears for a moment on a distant ridge, then is simply gone.",
          body: { kind: "quadruped", size: [12, 7], legs: 2, tail: { len: 11, style: "down" }, ears: 1 },
          palette: { b: "#c8c8c0", d: "#9a9a90", l: "#e8e8e0", e: "#120e08", n: "#6a6a5e" }
        }
      ],
      understory: [
        { key: "alpine-primula", label: "Alpine primulas", what: "Small flowers in the scree, more as the grove recovers", colour: "#c060a0" },
        { key: "juniper-scrub", label: "Juniper scrub", what: "Low juniper at the treeline", colour: "#4a6848" },
        { key: "glacial-moraine", label: "Moraine", what: "Loose rock left by retreating ice", colour: "#8a8878" }
      ]
    }
  ]
};

// src/regions/patagonia/index.ts
var patagonia = {
  key: "patagonia",
  label: "Patagonia",
  note: "Lenga and \xF1ire beech forest, and the wind-scoured steppe beyond it.",
  hemisphere: "south",
  defaultStages: ["calf", "juvenile", "adult", "elder"],
  seasons: {
    model: "southern",
    months: [
      "summer",
      "summer",
      "autumn",
      "autumn",
      "autumn",
      "winter",
      "winter",
      "winter",
      "spring",
      "spring",
      "spring",
      "summer"
    ],
    notes: {
      autumn: "Lenga and \xF1ire turn through gold to deep red \u2014 one of the few true autumn displays in the southern hemisphere.",
      winter: "Heavy snow on the peaks; the wind off the ice fields is relentless."
    }
  },
  backdrops: [
    {
      key: "granite-towers",
      label: "Granite towers",
      note: "Sheer granite spires standing over a glacial valley, lenga forest at their feet.",
      sky: ["#5f87b8", "#82a0c6", "#a6bcd6", "#c7d6e2", "#dde6e4", "#eef2ec"],
      far: "#8a8a92",
      near: "#5a5a62",
      form: "towers"
    },
    {
      key: "calving-glacier",
      label: "Calving glacier",
      note: "A wall of blue-white ice meeting a turquoise lake, forest along the far shore.",
      sky: ["#6a93c0", "#8ca8ce", "#aec0dc", "#cdd6e4", "#e2e6e4", "#f0f0e8"],
      far: "#a6c0cc",
      near: "#5a7684",
      form: "fjord"
    },
    {
      key: "wind-bent-forest",
      label: "Wind-bent forest",
      note: "A line of trees leaning permanently away from the prevailing wind, under racing cloud.",
      sky: ["#6a8ab4", "#8aa0c0", "#aebcce", "#cdd2da", "#dcdcda", "#eae8e2"],
      far: "#7a848a",
      near: "#525c60",
      form: "rolling"
    },
    {
      key: "patagonia-night",
      label: "Patagonian night",
      note: "Granite towers black against a clear, cold, star-thick southern sky.",
      sky: ["#05080f", "#0a1020", "#121c30", "#1a2740", "#243350", "#304062"],
      far: "#1a1f28",
      near: "#121620",
      night: true,
      form: "towers"
    }
  ],
  biomes: [
    {
      key: "southern-beech",
      label: "Southern beech forest",
      note: "Lenga and \xF1ire forest, turning red and gold in autumn.",
      ground: ["#3a4a2e", "#2c3c22", "#4e6040"],
      ambience: ["mist"],
      plants: [
        {
          key: "lenga",
          common: "Lenga",
          scientific: "Nothofagus pumilio",
          form: "broadleaf",
          traits: ["Small rounded serrated leaves", "Turns gold then deep red before dropping in autumn"],
          iucn: "LC",
          fact: "One of the southernmost deciduous trees in the world, and its autumn colour is unusually vivid for the southern hemisphere.",
          source: gbif("Nothofagus pumilio"),
          crown: ["#1c2e1a", "#2a4226", "#395a34", "#4e7446", "#c0392b"],
          bark: ["#6a6052", "#484034", "#2c2620"],
          ailing: "autumn",
          spread: 0.9
        },
        {
          key: "nire",
          common: "\xD1ire",
          scientific: "Nothofagus antarctica",
          form: "broadleaf",
          traits: ["Small twisted, often multi-stemmed trunk", "Rounded crinkled leaves, gold in autumn"],
          iucn: "LC",
          fact: "The toughest of the southern beeches \u2014 it grows at the very edge of the forest, where the steppe begins.",
          source: gbif("Nothofagus antarctica"),
          crown: ["#202e1c", "#2e4228", "#3f5a36", "#557448", "#d8b84a"],
          bark: ["#726a58", "#4e483c", "#302c24"],
          ailing: "autumn",
          spread: 0.8
        },
        {
          key: "coihue",
          common: "Coihue",
          scientific: "Nothofagus dombeyi",
          form: "broadleaf",
          traits: ["Tall, evergreen, dense dark crown", "Small glossy toothed leaves"],
          iucn: "LC",
          fact: "Unlike lenga and \xF1ire, it keeps its leaves year-round and can grow to a very great size.",
          source: gbif("Nothofagus dombeyi"),
          crown: ["#162616", "#20381f", "#2c4e2a", "#3e683c", "#578450"],
          bark: ["#5e5648", "#403a30", "#28231c"],
          ailing: "bare",
          spread: 1.1
        }
      ],
      creatures: [
        {
          key: "magellanic-woodpecker",
          slot: 0,
          common: "Magellanic woodpecker",
          scientific: "Campephilus magellanicus",
          traits: ["Large, mostly black with a bright red head", "Shaggy pointed crest, bigger and redder on the male"],
          iucn: "NT",
          fact: "One of the largest woodpeckers alive, and its heavy drumming can be heard a long way through the beech forest.",
          source: iucn("Campephilus magellanicus"),
          activity: "diurnal",
          zone: "trunk",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Works steadily up a dead trunk, pausing to hammer at the bark.",
          body: { kind: "bird", size: [9, 7], beak: 3, crest: 3, legs: 2, tail: { len: 3, style: "down" } },
          palette: { b: "#1a1a1c", d: "#0a0a0c", l: "#3a3a3e", e: "#120e08", r: "#c0392b" }
        },
        {
          key: "guanaco",
          slot: 1,
          common: "Guanaco",
          scientific: "Lama guanicoe",
          traits: ["Light brown back, white underside and face", "Long legs and neck, alert upright ears"],
          iucn: "LC",
          fact: "A wild relative of the llama, and it can run at speed across rough ground almost indefinitely.",
          source: iucn("Lama guanicoe"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chulengo", "juvenile", "adult", "elder"],
          behaviour: "Grazes at the forest edge, head lifting often to scan the steppe.",
          body: { kind: "quadruped", size: [12, 10], legs: 5, neck: 5, ears: 2, tail: { len: 2, style: "up" } },
          palette: { b: "#b08858", d: "#7a5a38", l: "#d8b47e", e: "#120e08", n: "#f0ece0" }
        },
        {
          key: "huemul",
          slot: 2,
          common: "Huemul",
          scientific: "Hippocamelus bisulcus",
          traits: ["Stocky grey-brown body, short legs for a deer", "Small forked antlers on males"],
          iucn: "EN",
          fact: "The southernmost deer in the world, and one of the rarest \u2014 fewer than two thousand remain, in scattered small groups.",
          source: iucn("Hippocamelus bisulcus"),
          activity: "crepuscular",
          zone: "slope",
          stages: ["fawn", "juvenile", "adult", "elder"],
          behaviour: "Stands quietly at the forest edge, rarely venturing far from cover.",
          body: { kind: "quadruped", size: [9, 7], legs: 4, crest: 2, tail: { len: 1, style: "none" } },
          palette: { b: "#7a6a54", d: "#4e4232", l: "#a0906e", e: "#120e08", n: "#1a1410" }
        },
        {
          key: "puma-patagonia",
          slot: 3,
          common: "Puma",
          scientific: "Puma concolor",
          traits: ["Plain tawny coat, no spots as an adult", "Long heavy tail, pale underside"],
          iucn: "LC",
          fact: "Rare to see at all, and almost always at dusk \u2014 most encounters here are a shape slipping into the beech forest.",
          source: iucn("Puma concolor"),
          activity: "crepuscular",
          zone: "slope",
          stages: ["cub", "juvenile", "adult", "elder"],
          behaviour: "Moves low along a ridge at dusk, pausing once to look back before it is gone.",
          body: { kind: "quadruped", size: [12, 7], legs: 2, tail: { len: 8, style: "down" }, ears: 1 },
          palette: { b: "#b08a54", d: "#7a5a34", l: "#d8b47e", e: "#120e08", w: "#f0ece0" }
        },
        {
          key: "condor",
          slot: 4,
          common: "Andean condor",
          scientific: "Vultur gryphus",
          traits: ["Enormous black wings with a white band on top", "Bare pink-grey head, with a dark comb on the male"],
          iucn: "VU",
          fact: "Among the largest flying birds in the world, with a wingspan over three metres. It can soar for hours over the peaks without a single wingbeat.",
          source: iucn("Vultur gryphus"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "juvenile", "adult", "elder"],
          flourish: "soar",
          behaviour: "Circles the high ridgelines on fixed wings, rarely needing to flap at all.",
          body: { kind: "flyer", size: [18, 6], tail: { len: 3, style: "fan" }, beak: 2, crest: 1 },
          palette: { d: "#1a1a1c", b: "#2c2a28", g: "#f2efe8", y: "#8a8278", r: "#8a5a58" }
        }
      ],
      understory: [
        { key: "calafate", label: "Calafate berries", what: "Dark berries on a thorny shrub", colour: "#3a2a5a" },
        { key: "lenga-leaf", label: "Fallen beech leaves", what: "Autumn leaves underfoot", colour: "#c0392b" },
        { key: "moss-patagonia", label: "Moss", what: "Moss in the damp hollows", colour: "#4a7040" }
      ]
    },
    {
      key: "steppe",
      label: "Patagonian steppe",
      note: "Open windswept grassland under a huge, fast-moving sky.",
      ground: ["#8a8260", "#6e6848", "#9c9470"],
      ambience: ["heatShimmer"],
      plants: [
        {
          key: "coiron",
          common: "Coir\xF3n grass",
          scientific: "Festuca pallescens",
          form: "hummock",
          traits: ["Pale golden tussocks", "Leans hard in a constant wind"],
          iucn: "NE",
          fact: "Shows the wind as a constant lean rather than a flutter \u2014 it almost never stands upright here.",
          source: gbif("Festuca pallescens"),
          crown: ["#5a5436", "#726c44", "#8e8652", "#aaa060", "#c6ba76"],
          bark: ["#6a6244", "#4c4630", "#302c1e"],
          ailing: "dry",
          spread: 0.7
        },
        {
          key: "mata-negra",
          common: "Mata negra",
          scientific: "Junellia tridens",
          form: "shrub",
          traits: ["Low dark woody cushion", "Tiny tough leaves pressed close to the stem"],
          iucn: "NE",
          fact: "One of very few shrubs that survive the steppe\u2019s wind and cold without any shelter at all.",
          source: gbif("Junellia tridens"),
          crown: ["#2a2a20", "#3a3a2c", "#4c4c3a", "#60604a", "#78785e"],
          bark: ["#4a4636", "#343026", "#201e18"],
          ailing: "dry",
          spread: 0.5
        }
      ],
      creatures: [
        {
          key: "lesser-rhea",
          slot: 0,
          common: "Lesser rhea",
          scientific: "Rhea pennata",
          traits: ["Smaller and paler than the common rhea", "Spotted grey-brown plumage"],
          iucn: "NT",
          fact: "The male raises the chicks alone, often minding young from several different females at once.",
          source: iucn("Rhea pennata"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Walks steadily across open ground, head swivelling to watch the horizon.",
          body: { kind: "bird", size: [10, 10], legs: 5, neck: 4, beak: 2, tail: { len: 0, style: "none" } },
          palette: { b: "#9a9078", d: "#6a6248", l: "#c4bc9e", e: "#120e08", y: "#8a8070" }
        },
        {
          key: "guanaco-steppe",
          slot: 1,
          common: "Guanaco",
          scientific: "Lama guanicoe",
          traits: ["Light brown back, white underside and face", "Travels in family groups across open ground"],
          iucn: "LC",
          fact: "Moves in herds across the open steppe, far more exposed here than in the forest.",
          source: iucn("Lama guanicoe"),
          activity: "diurnal",
          zone: "ground",
          stages: ["chulengo", "juvenile", "adult", "elder"],
          behaviour: "Grazes in a loose herd, scattering fast if anything moves too close.",
          body: { kind: "quadruped", size: [12, 10], legs: 5, neck: 5, ears: 2, tail: { len: 2, style: "up" } },
          palette: { b: "#b08858", d: "#7a5a38", l: "#d8b47e", e: "#120e08", n: "#f0ece0" }
        },
        {
          key: "burrowing-owl",
          slot: 2,
          common: "Burrowing owl",
          scientific: "Athene cunicularia",
          traits: ["Long legs for an owl, often standing upright by day", "Mottled brown-and-white plumage"],
          iucn: "LC",
          fact: "Nests in abandoned burrows rather than trees, since the steppe has almost none.",
          source: iucn("Athene cunicularia"),
          activity: "diurnal",
          zone: "burrow",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Stands bolt upright at a burrow mouth, bobbing its head at any movement.",
          body: { kind: "bird", size: [6, 6], beak: 2, legs: 3, tail: { len: 1, style: "none" } },
          palette: { b: "#8a7458", d: "#5a4a36", l: "#bca888", e: "#e8c030", w: "#1a1410" }
        },
        {
          key: "magellanic-penguin",
          slot: 3,
          common: "Magellanic penguin",
          scientific: "Spheniscus magellanicus",
          traits: ["Two black bands across the white chest", "Black-and-white banded head"],
          iucn: "NT",
          fact: "Nests in burrows along the Patagonian coast, sometimes a very long walk inland from the surf.",
          source: iucn("Spheniscus magellanicus"),
          activity: "diurnal",
          zone: "waterEdge",
          stages: ["chick", "juvenile", "adult", "elder"],
          behaviour: "Waddles between burrow and shoreline in a fixed, unhurried line.",
          body: { kind: "wader", size: [6, 7], legs: 2, beak: 2, tail: { len: 1, style: "none" } },
          palette: { b: "#1a1a1c", d: "#0a0a0c", l: "#f0ece0", e: "#120e08", y: "#d8c060" }
        },
        {
          key: "andean-condor-steppe",
          slot: 4,
          common: "Andean condor",
          scientific: "Vultur gryphus",
          traits: ["Enormous black wings with a white band on top", "Bare pink-grey head"],
          iucn: "VU",
          fact: "Ranges huge distances from its mountain roosts out over the open steppe to feed.",
          source: iucn("Vultur gryphus"),
          activity: "diurnal",
          zone: "sky",
          stages: ["chick", "juvenile", "adult", "elder"],
          flourish: "soar",
          behaviour: "A distant black shape, circling very high over the plain.",
          body: { kind: "flyer", size: [18, 6], tail: { len: 3, style: "fan" }, beak: 2, crest: 1 },
          palette: { d: "#1a1a1c", b: "#2c2a28", g: "#f2efe8", y: "#8a8278", r: "#8a5a58" }
        }
      ],
      understory: [
        { key: "tussock-steppe", label: "Coir\xF3n tussock", what: "Golden tussock grass, always leaning into the wind", colour: "#aaa060" },
        { key: "wind-flag", label: "Flags of cloud", what: "Cloud streaming off the peaks in the wind", colour: "#d8d8d0" },
        { key: "calafate-shrub", label: "Calafate shrub", what: "A low thorny shrub with dark berries", colour: "#4a5a3c" }
      ]
    }
  ]
};

// src/regions/borneo/index.ts
var borneo = {
  key: "borneo",
  label: "Borneo",
  note: "Towering dipterocarp rainforest, and a winding mangrove river below the canopy.",
  hemisphere: "tropics",
  defaultStages: ["infant", "juvenile", "adult", "elder"],
  seasons: {
    model: "wetDry",
    months: [
      "wet",
      "wet",
      "wet",
      "dry",
      "dry",
      "dry",
      "dry",
      "dry",
      "wet",
      "wet",
      "wet",
      "wet"
    ],
    notes: {
      wet: "The wetter monsoon months, roughly November to March; the forest is humid year-round regardless.",
      dry: "Relatively drier, though rarely truly dry \u2014 this is one of the wettest forests on Earth."
    }
  },
  backdrops: [
    {
      key: "granite-above-cloud",
      label: "Granite peak above cloud",
      note: "A bare granite summit breaking through a sea of cloud over unbroken canopy.",
      sky: ["#6a9ac8", "#8cb0d6", "#b0c6e0", "#cfdbe8", "#e6ebe8", "#f2f0e6"],
      far: "#b4c0c8",
      near: "#7a8a84",
      form: "volcano"
    },
    {
      key: "brown-river-canopy",
      label: "River through the canopy",
      note: "A wide brown river winding through solid green canopy, no horizon visible at all.",
      sky: ["#6e95bc", "#8ea8c8", "#b0bfd4", "#cfd8dc", "#e4e6de", "#f2f0e4"],
      far: "#5a7260",
      near: "#3e5444",
      form: "canopy"
    },
    {
      key: "rainforest-night",
      label: "Rainforest night",
      note: "Dense black canopy under a humid, star-thick equatorial sky.",
      sky: ["#070a16", "#0d152c", "#16213e", "#1f2d4e", "#2a3a5e", "#37486e"],
      far: "#1a2838",
      near: "#13202a",
      night: true,
      form: "canopy"
    }
  ],
  biomes: [
    {
      key: "dipterocarp",
      label: "Lowland dipterocarp rainforest",
      note: "Giant emergent trees towering over a dense, humid, multi-layered canopy.",
      ground: ["#2e4228", "#22331e", "#3c5636"],
      ambience: ["mist", "butterflies"],
      plants: [
        {
          key: "giant-dipterocarp",
          common: "Giant dipterocarp",
          scientific: "Shorea sp.",
          form: "broadleaf",
          traits: ["Towers well above the main canopy", "Enormous buttressed base"],
          iucn: "EN",
          fact: "Some of these emergent trees stand over eighty metres tall, among the tallest flowering plants on Earth.",
          source: gbif("Shorea"),
          crown: ["#122a18", "#1d4324", "#2b5c30", "#3f7842", "#5d9656"],
          bark: ["#8a8470", "#615c4c", "#3a372c"],
          ailing: "bare",
          spread: 1.25
        },
        {
          key: "strangler-fig-borneo",
          common: "Strangler fig",
          scientific: "Ficus sp.",
          form: "broadleaf",
          traits: ["A lattice of fused roots where the host once stood", "Wide spreading dense crown"],
          iucn: "NE",
          fact: "Eventually replaces its host entirely, leaving a hollow lattice of roots where the original trunk used to be.",
          source: gbif("Ficus"),
          crown: ["#13241a", "#1e3a26", "#2b5231", "#3f6c42", "#5c8a55"],
          bark: ["#7a7258", "#564f3c", "#332f24"],
          ailing: "bare",
          spread: 1.2
        },
        {
          key: "pitcher-plant",
          common: "Pitcher plant",
          scientific: "Nepenthes sp.",
          form: "shrub",
          traits: ["Hanging jug-shaped traps at the leaf tips", "Sprawling climbing stems"],
          iucn: "NE",
          fact: "Traps insects \u2014 and sometimes small vertebrates \u2014 in a pool of digestive fluid at the bottom of each pitcher.",
          source: gbif("Nepenthes"),
          crown: ["#1e3620", "#2a4c2c", "#3a663c", "#4f844e", "#9a3a30"],
          bark: ["#4a5a3a", "#344028", "#20281a"],
          ailing: "dry",
          spread: 0.65
        },
        {
          key: "rafflesia",
          common: "Rafflesia",
          scientific: "Rafflesia sp.",
          form: "shrub",
          traits: ["An enormous mottled red-and-white bloom, no stem or leaves of its own", "Appears directly from the forest floor"],
          iucn: "EN",
          fact: "The largest single flower in the world, and parasitic on a specific forest vine \u2014 it has no leaves, stem or roots of its own.",
          source: iucn("Rafflesia arnoldii"),
          crown: ["#2a1a18", "#4a2420", "#7a3a2e", "#a85a40", "#f0e0d0"],
          bark: ["#3a2a24", "#281c18", "#181210"],
          ailing: "dry",
          spread: 0.5
        }
      ],
      creatures: [
        {
          key: "wallaces-flying-frog",
          slot: 0,
          common: "Wallace's flying frog",
          scientific: "Rhacophorus nigropalmatus",
          traits: ["Bright green body with large webbed feet", "Loose flaps of skin along the limbs"],
          iucn: "LC",
          fact: "Spreads its webbed feet wide and glides between trees, sometimes well over ten metres.",
          source: iucn("Rhacophorus nigropalmatus"),
          activity: "nocturnal",
          zone: "canopy",
          stages: ["tadpole", "froglet", "adult", "old"],
          behaviour: "Clings to a high leaf by day, nearly invisible against the green.",
          body: { kind: "frog", size: [6, 4], legs: 2 },
          palette: { b: "#3ea050", d: "#1e6830", l: "#7ad880", e: "#141a0c", y: "#e8d030" }
        },
        {
          key: "rhinoceros-hornbill",
          slot: 1,
          common: "Rhinoceros hornbill",
          scientific: "Buceros rhinoceros",
          traits: ["Huge curved orange-and-red casque above the bill", "Mostly black body, white tail with a black band"],
          iucn: "VU",
          fact: "Mated pairs often fly together, and the whoosh of its wingbeats can be heard from a long way off.",
          source: iucn("Buceros rhinoceros"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["chick", "fledgling", "adult", "elder"],
          flourish: "pair",
          behaviour: "Sits heavily in the canopy, casque catching the light, calling loudly to its mate.",
          body: { kind: "bird", size: [10, 8], beak: 5, crest: 3, tail: { len: 5, style: "down" }, legs: 1 },
          palette: { b: "#1a1a1c", d: "#0a0a0c", l: "#3a3a3e", e: "#d8302a", y: "#e8a030", w: "#f0ece0" }
        },
        {
          key: "proboscis-monkey",
          slot: 2,
          common: "Proboscis monkey",
          scientific: "Nasalis larvatus",
          traits: ["Very large pendulous nose on adult males", "Reddish-brown body, pale limbs and belly"],
          iucn: "EN",
          fact: "Found only on Borneo, and almost always close to the mangrove rivers rather than deep forest.",
          source: iucn("Nasalis larvatus"),
          activity: "diurnal",
          zone: "waterEdge",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Sits in a tree right at the river\u2019s edge, watching the water.",
          body: { kind: "quadruped", size: [9, 7], legs: 2, tail: { len: 10, style: "down" }, beak: 3 },
          palette: { b: "#8a5438", d: "#5c3722", l: "#b07a54", e: "#100a06", n: "#e8d8c0" }
        },
        {
          key: "bornean-elephant",
          slot: 3,
          common: "Bornean elephant",
          scientific: "Elephas maximus borneensis",
          traits: ["Smaller and rounder than mainland Asian elephants", "Proportionally larger ears for its size"],
          iucn: "EN",
          fact: "The smallest of the Asian elephant subspecies, found only in the forests of north-eastern Borneo.",
          source: iucn("Elephas maximus"),
          activity: "cathemeral",
          zone: "ground",
          stages: ["calf", "juvenile", "adult", "matriarch"],
          behaviour: "Pushes slowly through dense undergrowth, leaving a clear trail behind it.",
          body: { kind: "bulky", size: [13, 9], legs: 4, ears: 5, tail: { len: 3, style: "down" }, beak: 5 },
          palette: { b: "#7a766e", d: "#4e4a42", l: "#9a968a", e: "#120e08", n: "#e8e2d4" }
        },
        {
          key: "bornean-orangutan",
          slot: 4,
          common: "Bornean orangutan",
          scientific: "Pongo pygmaeus",
          traits: ["Shaggy reddish fur", "Males develop wide cheek pads and a throat pouch"],
          iucn: "CR",
          fact: "Builds a fresh sleeping platform of branches high in the canopy almost every single night.",
          source: iucn("Pongo pygmaeus"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Moves deliberately through the high canopy, testing each branch before committing its weight.",
          body: { kind: "bulky", size: [11, 9], legs: 2, crest: 2, tail: { len: 0, style: "none" } },
          palette: { b: "#9a5a2e", d: "#6a3a18", l: "#c0824a", e: "#120e08", n: "#1a1410" }
        }
      ],
      understory: [
        { key: "liana-bn", label: "Lianas", what: "Vines looping between the giant trunks", colour: "#3a6030" },
        { key: "leaf-litter-bn", label: "Leaf litter", what: "Deep damp litter on the forest floor", colour: "#5a4a32" },
        { key: "rafflesia-bloom", label: "Rafflesia in bloom", what: "A rare bloom that appears after a long healthy streak", colour: "#a85a40" }
      ]
    },
    {
      key: "mangrove-river",
      hasWater: true,
      label: "Mangrove river",
      note: "A winding brown river through a tangle of mangrove roots.",
      ground: ["#3a4a30", "#2a3822", "#4c603e"],
      ambience: ["mist"],
      plants: [
        {
          key: "nipa-palm",
          common: "Nipa palm",
          scientific: "Nypa fruticans",
          form: "palm",
          traits: ["Low, almost trunkless, growing right at the waterline", "Large feathery fronds"],
          iucn: "LC",
          fact: "One of the very few palms that grows with its base actually in tidal mud.",
          source: gbif("Nypa fruticans"),
          crown: ["#1c3220", "#28492c", "#386138", "#4c7a48", "#6a9660"],
          bark: ["#6a6048", "#473e30", "#2c261c"],
          ailing: "dry",
          spread: 0.9
        },
        {
          key: "bakau-mangrove",
          common: "Bakau mangrove",
          scientific: "Rhizophora apiculata",
          form: "shrub",
          traits: ["A tangle of arching prop roots above the mud", "Glossy dark green leaves"],
          iucn: "LC",
          fact: "Its tangled roots slow the river enough to trap sediment, which is slowly how the delta is built.",
          source: gbif("Rhizophora apiculata"),
          crown: ["#1c3220", "#28492c", "#386138", "#4c7a48", "#6a9660"],
          bark: ["#7a6450", "#55463a", "#332b24"],
          ailing: "bare",
          spread: 1
        }
      ],
      creatures: [
        {
          key: "silvered-langur",
          slot: 0,
          common: "Silvered langur",
          scientific: "Trachypithecus cristatus",
          traits: ["Grey fur with silver-tipped hairs", "Dark face and hands"],
          iucn: "EN",
          fact: "Lives almost entirely in mangrove and riverine forest, and is a strong, confident swimmer.",
          source: iucn("Trachypithecus cristatus"),
          activity: "diurnal",
          zone: "canopy",
          stages: ["infant", "juvenile", "adult", "elder"],
          behaviour: "Sits along a branch over the river, grooming, occasionally dropping to swim across.",
          body: { kind: "quadruped", size: [8, 6], legs: 2, tail: { len: 9, style: "down" }, ears: 1 },
          palette: { b: "#8a8a82", d: "#5e5e56", l: "#b4b4ac", e: "#120e08", n: "#1a1a16" }
        },
        {
          key: "estuarine-crocodile",
          slot: 1,
          common: "Saltwater crocodile",
          scientific: "Crocodylus porosus",
          traits: ["Broad heavy snout and armoured ridged back", "Lies almost entirely submerged"],
          iucn: "LC",
          fact: "The largest living reptile, ranging from mangrove rivers right out into coastal seas.",
          source: iucn("Crocodylus porosus"),
          activity: "cathemeral",
          zone: "waterEdge",
          stages: ["hatchling", "juvenile", "adult", "old"],
          still: true,
          behaviour: "Lies at the water\u2019s edge, barely a ripple showing.",
          body: { kind: "reptile", size: [20, 4], legs: 1, tail: { len: 12, style: "down" }, neck: 2 },
          palette: { b: "#4a4e38", d: "#2a2e20", l: "#6e7250", e: "#0a0c06", y: "#9a9460" }
        },
        {
          key: "storks-billed-kingfisher",
          slot: 2,
          common: "Stork-billed kingfisher",
          scientific: "Pelargopsis capensis",
          traits: ["Massive heavy red bill", "Turquoise back, buff underside"],
          iucn: "LC",
          fact: "One of the largest kingfishers in Asia, and its heavy bill can take surprisingly large prey.",
          source: iucn("Pelargopsis capensis"),
          activity: "diurnal",
          zone: "waterEdge",
          stages: ["chick", "fledgling", "adult", "elder"],
          behaviour: "Sits dead still on an overhanging branch, watching the water below.",
          still: true,
          body: { kind: "bird", size: [8, 6], beak: 4, tail: { len: 3, style: "down" }, legs: 1 },
          palette: { b: "#2a7a8a", d: "#154a54", l: "#5ab0c0", e: "#120e08", r: "#c0392b", w: "#e8d8a0" }
        },
        {
          key: "smooth-coated-otter",
          slot: 3,
          common: "Smooth-coated otter",
          scientific: "Lutrogale perspicillata",
          traits: ["Sleek short glossy fur", "Flattened broad tail, used for steering"],
          iucn: "VU",
          fact: "Hunts in tight family groups and will work together to drive fish into the shallows.",
          source: iucn("Lutrogale perspicillata"),
          activity: "diurnal",
          zone: "water",
          stages: ["pup", "juvenile", "adult", "elder"],
          flourish: "dive",
          behaviour: "Surfaces with the family, dives, and resurfaces further along the bank.",
          body: { kind: "swimmer", size: [9, 4], tail: { len: 5, style: "down" } },
          palette: { b: "#5a4a38", d: "#342a1e", l: "#8a7458", e: "#0c0a06", w: "#b4a488" }
        },
        {
          key: "sunda-clouded-leopard",
          slot: 4,
          common: "Sunda clouded leopard",
          scientific: "Neofelis diardi",
          traits: ["Large irregular cloud-shaped markings", "Very long tail, almost as long as the body"],
          iucn: "VU",
          fact: "Found only on Borneo and Sumatra, and rarely seen \u2014 it hunts almost entirely at night, high in the trees.",
          source: iucn("Neofelis diardi"),
          activity: "nocturnal",
          zone: "canopy",
          stages: ["cub", "juvenile", "adult", "elder"],
          behaviour: "Appears briefly on a high branch after dark, then melts back into the shadow.",
          body: { kind: "quadruped", size: [11, 7], legs: 2, tail: { len: 11, style: "down" }, ears: 1 },
          palette: { b: "#c0a070", d: "#8a6e48", l: "#e0c494", e: "#120e08", n: "#2a2018" }
        }
      ],
      understory: [
        { key: "mangrove-mud-bn", label: "Mangrove mud", what: "Tidal mud between the roots", colour: "#4a4236" },
        { key: "nipa-frond", label: "Nipa fronds", what: "Fronds trailing at the waterline", colour: "#4c7a48" },
        { key: "river-fog", label: "River fog", what: "Morning fog over the brown water", colour: "#c8d0c8" }
      ]
    }
  ]
};

// src/regions/index.ts
var REGIONS = [
  australia,
  aotearoa,
  japan,
  madagascar,
  costaRica,
  eastAfrica,
  canada,
  norway,
  nepal,
  patagonia,
  borneo
];
var DEFAULT_REGION_KEY = australia.key;
function regionByKey(key) {
  return REGIONS.find((r) => r.key === key);
}

// tools/harness/render.ts
window.__renderFixture = (opts) => {
  const cards = fixture(opts.fixtureName, FIXED_NOW);
  const scan = scanCards(cards, { now: FIXED_NOW, rolloverHour: 4 });
  const grove = mergeOld(buildGrove(scan));
  const region = regionByKey(opts.regionKey);
  const biome = region.biomes[opts.biomeIndex % region.biomes.length];
  const health = opts.forceVisualHealth != null ? opts.forceVisualHealth : ecosystemHealth({
    today: grove.today,
    reviewDays: grove.reviewDays,
    calendar: emptyCalendar(),
    severity: opts.severity,
    overdue: scan.overdue,
    totalCards: scan.cardCount
  }).visual;
  const roster = updateRoster(emptyRoster(), grove.stats.activeStudyDays, grove.stats, grove.today);
  const canvas = document.getElementById("stage");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const g = canvas.getContext("2d");
  drawScene(g, opts.width, opts.height, {
    grove,
    biome,
    roster,
    activeStudyDays: grove.stats.activeStudyDays,
    mood: opts.mood,
    visualHealth: health,
    t: 0,
    animate: false,
    paused: false,
    dpr: 1,
    regionKey: region.key,
    backdrops: region.backdrops
  });
  document.title = "ready";
};
