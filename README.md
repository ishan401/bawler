# Bawler — All Cricket, Every Ball, Visualized (v1.0.109)

Live scores, ball-by-ball replays, win probability, and player stats across every format and competition.

**Live:** [bawler-gold.vercel.app](https://bawler-gold.vercel.app)
**Status:** UI complete (v1.0.109 mock) — real data integration next.
**Stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · Vercel

---

## Run locally

```bash
cd bawler-main
npm install
npm run dev
```

Open http://localhost:3000. No env vars needed — all data is mocked.

## Deploy

```bash
git push https://ishan401:<TOKEN>@github.com/ishan401/bawler.git main
```

Vercel auto-deploys on push via GitHub webhook. Build time ~40–60s.

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — live carousel + past/future match columns, pull-to-refresh, infinite scroll |
| `/match/[id]` | Match page — full live experience (4 tabs) |
| `/player/[id]` | Player profile — bio, ICC rankings, per-format stats |
| `/schedule/[competitionId]` | Schedule for a specific competition |
| `/schedule/[competitionId]/[teamCode]` | Schedule filtered by team |
| `/table` | Multi-competition standings (IPL, PSL, BBL, Hundred, SA20, T20WC, CT, WTC) |

---

## Home page

- **LiveCarousel** — snap-scroll carousel of live matches; hero card's win-prob bar is now a live per-over sparkline (`LiveWinProbSpark`, same `calculateWinProbForMatch()` source as the full-screen modal, Catmull-Rom smoothed)
- **Hero-match selection** (`lib/heroSelection.ts`) — the single top-of-Home hero card is chosen by an explicit 3-tier rule (prominence → live stakes → live runway), not an ad hoc popularity sort; global and non-personalized, unlike "for you" below
- **Swipe-carousel dot indicator** (`components/CarouselDots.tsx`, `lib/useCarouselIndex.ts`) — small contained dots (cyan hero/Spotlight, violet "for you") replace the native scrollbar thumb that used to overflow past each card's rounded corners; nothing renders below 2 items
- **Series status chip** — one-line bilateral series summary below bilateral international cards; TABLE button for competition matches
- **SplitTeamBg** — national matches: flag images (flagcdn.com); franchise matches: dual-colour gradient
- **Quiet cards vs. Spotlight** — ordinary past/future matches render as a flat 60px row (no gradient/crest/badge); matches clearing `lib/spotlight.ts`'s concrete bar (close finish / individual milestone / genuine knockout stakes — not a generic excitement score) get the full card treatment, pulled out above the grid as a single card or a capped 3-card carousel
- **"For you" row** — surfaces the single best match matching any followed nation/team/tournament/series/player/format (see Personalization below); tiered union selection, live-first. As of v1.0.91, a qualifying LIVE match never renders here as a standalone card at all — it gets an inline `★ For you` marker on its existing live-carousel card instead (see "For you" live-carousel marker below); this row now only ever shows the single soonest-ranked qualifying UPCOMING match, chosen by an explicit priority order (team > series > tournament > nation > format, then soonest — see DECISIONS-LOG.md FY13) — no lookahead cutoff on that fallback (always the best-ranked qualifying match, however far out); presentation splits at 7 days though, since a countdown stops being useful past that: within the window shows `"in 4d 19h · 6:12 pm"` unchanged, beyond it shows `"Next match: 19 Oct"` instead (`fmtForYouDistance()`, see DECISIONS-LOG.md FD1-FD4)
- **"For you" live-carousel marker** (v1.0.91) — a live match that also qualifies for "for you" gets an inline `★ For you` badge on its existing `LiveMatchCard` (`forYou` prop, threaded via `LiveCarousel`'s `forYouIds`) instead of a duplicate standalone card; the homepage's single global hero match is excluded even when it also qualifies, matching the pre-existing rule that hero is a global pick, not a personalization signal
- **"For you" ↔ Coming Up dedup** (v1.0.93) — the single upcoming match rendered in "for you" is excluded from the "Coming Up" grid below it (`m.id !== forYouVisible?.id`, mirroring "for you"'s own hero-exclusion in the other direction). Selection logic is untouched; only the one match actually shown in "for you" is pulled — a follow with several qualifying upcoming matches still shows every other one in Coming Up (see DECISIONS-LOG.md FY15-FY17)
- **"Coming Up" header count matches its rendered list** (v1.0.94) — the `· N` count and the card grid now both read one shared `futureVisible` array, instead of the header reading an unfiltered raw count while the grid applied its own exclusions separately (see DECISIONS-LOG.md FY18-FY19)
- **"For you" ↔ Spotlight visual alignment** — both share the same corner radius (`0.75rem`) and padding rhythm (`px-2 py-1.5` + `flex-col gap-0.5`); each card keeps its own height, background treatment, and content
- **Filter** — plain flat icon+label tab in the bottom nav (matches Home/Schedule; violet only while its sheet is open), opens the follow-selection sheet; see Personalization below
- Infinite scroll, pull-to-refresh, shimmer loading skeleton, tap feedback on all cards
- The live carousel / for-you / spotlight block is gated behind a client-mount flag (same one that gates the Past/Future grid) so the server-rendered HTML and the client's first render always match — match "liveness" is computed from `Date.now()` at module-load time, which otherwise drifts between server prerender and client hydration
- **Past/Coming Up grid border color** — completed matches: 3px left border in the actual winning team's `primaryColor`, matched explicitly by team code (never a silent default to one side); upcoming matches: neutral gray, since there's no winner yet to pick a side from. Scores render via `formatScore()` (`lib/formatUtils.ts`), which drops the wicket count entirely for an all-out innings (`undefined`/`null`/`>= 10`) — "187", never "187/10" or a dangling "187/"

---

## Personalization (Filter / "For you")

- **Bottom nav Filter button** — plain flat icon+label tab identical to Home/Schedule (originally a raised circular button, downgraded — see DECISIONS-LOG.md "NB1"); neutral gray by default, Violet 600 (`#7C3AED`) only while open; opens `FollowSheet`, a two-column bottom sheet (category rail: Nations/Tournaments/Series/Teams/Players/Formats; search + multi-select list), nothing persists until **"Update"** is tapped (relabeled from "Follow" — reads correctly for removals too, commit/discard mechanic unchanged). Team category is scoped to franchise/league teams only — national teams live exclusively under Nation, never double-listed. Series is genuine bilateral/tour-style competitions (`Competition.type === "bilateral"`, e.g. "India tour of Australia 2026") split out of Tournaments, which now holds only structured multi-team competitions (see DECISIONS-LOG.md SC1). Colored dot only shown for Nation (flag) and Team (real brand color) — Tournament/Series/Player/Format render without one, since none of the four ever carried real per-row signal (see DECISIONS-LOG.md FC5).
- **`lib/followPrefs.ts`** — `FollowPrefs` stores IDs only, never display names: nations by `Team.country`, teams by `Team.code`, tournaments by `Competition.id` (`type !== "bilateral"` only), series by `Competition.id` (`type === "bilateral"` only, split from tournaments in v1.0.88), players by `PLAYERS` slug, formats by the `MatchFormat` literal. `qualifyMatch(match, prefs)` returns a per-category breakdown; `isTier1Match()`/`isAnyMatch()` distinguish Tier 1 (nation/team/tournament/series/format) from Tier 2 (player-only, last-resort). Nation-following previously suppressed every bilateral match outright; as of v1.0.91 that's gone — only the single global hero match is excluded, matching how team/tournament/series/format follows already worked (see DECISIONS-LOG.md FY11).
- **`lib/lineups.ts`** — `isPlayerInMatch(match, playerId)` checks `Match.lineups` first (real-API-ready), else a deterministic seeded-hash presence check against the `PLAYERS` registry — so a player on both a national side and a franchise doesn't get credited with every match either team plays
- **`lib/followNudge.ts`** — empty-state nudge shown only pre-first-follow, within the first 3 Home visits
- Cross-sibling sync: `BottomNav` (owns `FollowSheet`) and `app/page.tsx` (owns the "for you" row) are siblings, not parent/child — prefs changes propagate via a `window` `CustomEvent`, not props or a state library
- **"For you" card team order** — the followed team always renders on the left (`followedMatchSide()` in `lib/followPrefs.ts`, checked team > nation > player priority), with a matching colored left border — never left to whatever `teamA`/`teamB` order the underlying match data happens to use. Scoped to this card only; Live/Spotlight/grid keep their own conventions.
- **Stored prefs are sanitized on every read** (`sanitizeFollowPrefs()` inside `getFollowPrefs()`) — filters each category against the exact valid-ID sets the sheet renders from, and self-heals localStorage immediately if anything stale is found (e.g. a national code left over from before Team was scoped to franchise-only in v1.0.57). Guarantees the sheet's checkbox/badge state and "for you"'s behavior can never disagree.
- **⚠️ No localStorage schema-version guard** — one was built, deployed, and then explicitly reverted per request (see DECISIONS-LOG.md, "LS1"). Don't reintroduce it without being asked again.

---

## Match page (top to bottom on mobile)

1. **ScoreBar** (sticky) — score, chase context, innings info
2. **MiniInsightsBar** — scrolling insight ticker; win probability lives here as one chip (leading team + %, tap opens the full-screen `WinProbChart` modal) — there's no separate always-visible win-prob element on this page. (`components/MiniWinProb.tsx` exists in the tree but isn't rendered anywhere — dead code, not this chip.)
3. **MatchTabs** — Live / Scorecard / **Digest** / Info / Table for a still-live (or upcoming) match; a finished match (`match.status === "post-match"`) swaps slot 1 to **Digest** instead of Live, same total tab count (Table only when the competition has standings; swipe or tap, book-page-turn animation)
4. **BallGIF** (hero) — two-clip animated SVG delivery replay (bowler view + overhead field). SpeedChip hidden when speed data is null.
5. **MomentsStrip** — key events timeline; tap scrubs the whole page to that ball
6. **PartnershipFooter** — live partnership: total runs/balls + per-batter stats, resets on wicket
7. **MatchupCard** — always-on batter vs bowler H2H (career + live match merged); shareable PNG
8. **AIMetrics** — 4 tiles: Projected, Momentum, Acceleration, Next wicket impact (format-aware ball totals)
9. **CommentaryFeed** — ball-by-ball cards with insight overlays

**Scorecard tab:** Uses `ALL_TEAMS` (not `TEAMS`) — works for national + franchise teams. Team toggle (T20/ODI/Hundred) or per-innings chips (Test) pick which innings shows below, defaulting to whoever's currently batting. Sticky innings header, offset measured live so it stays flush under the real header in any format. Partnership velocity sparklines between batting + bowling cards, plus a per-batter runs-vs-balls sparkline on each dismissal/"not out" line with boundary dots capped at that batter's own 4s/6s.

**Digest tab (live/upcoming path, unchanged):** Story-of-the-match in cards while a match is still live. Format-adaptive: over cards (T20), session cards (Test), ODI blocks. Day filter chips for Test (default: latest day). Innings chips for T20/ODI (default: latest innings). All cards shareable as PNG. A completed Test day collapses its session cards into one consolidated day-summary card (an in-progress day still shows session cards as they finish); narrative phrasing is bucketed by what actually happened (bowling-collapse, dominant-batting, weather-shortened, etc.) and varies within a day via deterministic per-session seeding rather than defaulting to one generic line; notable days/sessions (e.g. an 11-wicket collapse) get a subtle accent border, routine ones stay quiet — same boolean-gate philosophy as homepage Spotlight. A `DigestCardCache` reuses card objects once their underlying data is complete, keeping re-renders cheap on live ticks; this assumes the underlying feed is append-only (see DECISIONS-LOG.md RD8).

**Digest tab (finished-match path, `buildPostMatchDigest`):** the outcome is known, so the story is told retrospectively. Order: a compact lead-in (the same real/derived/pending result card as the live path's post-match summary), a single match-wide turning-point callout (the one ball with the largest win-probability swing across the WHOLE match, via `findTurningPoint`/`calculateWinProbForMatch` — omitted, not stubbed, when there's no ball data), a whole-match performance card (best bat/bowl across all innings, via `computeMatchTopPerformers`), then the existing day/session or over-group cards with one retrospective sentence appended per card (`applyRetrospectiveFraming` — additive only, never touches `buildNarrative`/`buildOverSummary`/`buildDayReport` or their existing anti-repeat indexing). Matches with `innings.length === 0` (7 of the 12 current Past records) get a `SimpleRecapCard` instead — final score from `match.result`'s teamA/B fields plus the existing one-line summary, explicitly labeled "Simple recap," never styled like an empty/broken Digest.

**Info tab:** Pitch report card (surface, sliders, expected score, dew), lineups side-by-side.

---

## Player profiles (`/player/[id]`)

- Bio, country flag, role, batting/bowling style, ICC rankings
- Format tabs: Test / ODI / T20I / {franchiseLeague} (label is dynamic per player e.g. "IPL", "BBL")
- Batting + bowling stats grids; sub-components return null when no data
- Clickable from Scorecard rows and CommentaryFeed wicket cards
- `PLAYER_ALIASES` map resolves alternate IDs from live data

---

## Table page (`/table`)

Horizontal tab selector across 8 competitions:

| Competition | Columns |
|---|---|
| IPL, PSL, BBL, Hundred, SA20 | P / W / L / NRR / Pts |
| T20 World Cup, Champions Trophy | P / W / L / NRR / Pts + qualifier badge |
| WTC | P / W / D / L / PCT% |

---

## Key data rules

- **Always use `ALL_TEAMS`**, not `TEAMS` — `TEAMS` is franchise-only; `ALL_TEAMS` includes national teams
- **Insights are prop-driven in MatchView** — pass `insights={[]}` for real pages; mock array is the default fallback
- **`totalBallsForFormat(match)`** — use this everywhere instead of hardcoded 120 for balls/chase math
- **`franchiseStats` / `franchiseLeague`** — not `iplStats`; every player stores which league their franchise stats came from
- **`seriesStatus?: string`** on Match — set by data layer for bilateral series; used by LiveCarousel chip
- **`match.status === "post-match"`** (not `match.result` alone) is authoritative for DigestTab's summary card — real `result` renders the full card, a missing `result` post-match either derives a minimal one (unambiguous non-Test 2-innings case) or renders an explicit "final result pending" card; per-session `isComplete` flags are likewise only trusted while `isLive`, overridden once the match ends (DECISIONS-LOG.md FY22-FY23)
- **`match.championship`** drives the TABLE button for Test matches (WTC); falls back to `match.competition`
- **`normalizeMatch()`** (`lib/dataValidation.ts`) — validation/adapter layer at the data boundary; collects errors (blocking) + warnings (non-blocking) instead of letting malformed data flow silently into narrative/win-prob functions
- **`getPlayerShortName()`** (`lib/mockData.ts`) — always use this instead of splitting a full-name string; looks up each player's own registry `shortName` field, falls back to the unmodified full name for an unregistered player rather than guessing

---

## Live match IDs with full ball data

| Match ID | Format | Ball data | Notes |
|---|---|---|---|
| `ipl2026-m37-kkrvmi` | T20 (IPL) | 2 full innings (scripted) | FEATURED_MATCH; KKR won by 4 wkts; both innings chips + match summary card |
| `ind-aus-t20i-2026-m2-live` | T20I | Inn 1: 120 balls (AUS, complete) + Inn 2: 98 balls (IND, live) | Kohli 61* chasing; innings chips; live IND over cards |
| `ind-eng-test-2026-d3-live` | Test | Inn 2: 348 balls (ENG 1st, complete) + Inn 3: 164 balls (ENG follow-on, live) | Day 2 sessions complete; Day 3 live; day chips; session cards |

---

## Component map

```
components/
├── Match page
│   ├── MatchView.tsx          # orchestrates all tabs; allBalls flatMap; showDigest flag
│   ├── ScoreBar.tsx           # sticky score header
│   ├── BallGIF.tsx            # hero two-clip SVG delivery replay; PartnershipFooter
│   ├── MomentsStrip.tsx       # horizontal key events timeline
│   ├── MiniWinProb.tsx        # NOT RENDERED ANYWHERE -- dead code; the real win-prob chip lives in MiniInsightsBar, see "Match page" above
│   ├── WinProbChart.tsx       # full-screen modal chart
│   ├── AIMetrics.tsx          # 4-tile metrics row
│   ├── CommentaryFeed.tsx     # ball-by-ball cards + insight overlays
│   ├── Scorecard.tsx          # batting + bowling cards (ALL_TEAMS), team/innings toggle, per-batter + partnership sparklines
│   ├── MatchupCard.tsx        # always-on batter vs bowler H2H; career + live merged
│   ├── DigestTab.tsx          # story-of-match cards; format-adaptive; day/innings chips; shareable
│   ├── LineupsCard.tsx        # playing XI (battingTeam-based lookup)
│   └── PitchReportCard.tsx    # pitch surface + sliders
├── Home page
│   ├── LiveCarousel.tsx       # live match carousel + series status chip + standings sheet
│   ├── MatchCard.tsx          # PastMatchCard/FutureMatchCard (quiet), SpotlightMatchCard (full treatment + forYou marker), LiveWinProbSpark (hero sparkline)
│   ├── CarouselDots.tsx       # shared contained swipe-carousel dot indicator (hero/for-you/Spotlight)
│   ├── SplitTeamBg.tsx        # flag images (national) or gradient (franchise)
│   ├── BottomSheet.tsx        # shared swipe-to-dismiss sheet (extracted from LiveCarousel); optional footer slot
│   ├── FollowSheet.tsx        # Filter feature: two-column category + search/multi-select sheet
│   └── BottomNav.tsx          # persistent Home / Schedule nav + raised Filter trigger (opens FollowSheet)
└── Player profile
    └── PlayerProfileView.tsx  # bio, rankings, per-format stats tabs
```

---

## lib/ map

```
lib/
├── mockData.ts        # all match, player, standings, pitch report data; PLAYERS; ALL_TEAMS
├── types.ts           # all TypeScript interfaces (Match, Ball, Innings, TestSession, …)
├── transformers.ts    # ESPN/Cricbuzz/SportRadar adapters; normalizeBall(); deriveTestSessions()
├── mockMatchups.ts    # 44 batter vs bowler H2H career records
├── events.ts          # Moments strip event extraction logic
├── winProb.ts         # power-curve win probability formula (single source of truth)
├── outcomeColors.ts   # unified ball outcome colour palette
├── spotlight.ts        # isSpotlightMatch() — concrete close-finish/milestone/stakes bar for homepage spotlight
├── lineups.ts          # getMatchLineup()/isPlayerInMatch() — per-match XI, real-data-ready + seeded fallback
├── followPrefs.ts      # FollowPrefs model, qualifyMatch()/isTier1Match(), sanitizeFollowPrefs(), localStorage persistence + change event
├── followNudge.ts      # empty-state Filter nudge (first-N-sessions, dismissible)
├── heroSelection.ts    # selectHeroMatch() — 3-tier deterministic hero-match rule (prominence, live stakes, live runway)
└── useCarouselIndex.ts # shared scroll-position -> active-index hook for snap-x carousels
```
