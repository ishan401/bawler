# Bawler — All Cricket, Every Ball, Visualized (v1.0.139)

Live scores, ball-by-ball replays, win probability, and player stats across every format and competition.

**Live:** [bawler-gold.vercel.app](https://bawler-gold.vercel.app)
**Status:** UI complete (v1.0.114 mock) — real data integration next.
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

- **Bottom nav Filter button** — plain flat icon+label tab identical to Home/Schedule (originally a raised circular button, downgraded — see DECISIONS-LOG.md "NB1"); neutral gray by default, Violet 600 (`#7C3AED`) only while open; opens `FollowSheet`, a two-column bottom sheet (category rail: Nations/Tournaments/Series/Teams/Players/Formats; search + multi-select list), nothing persists until **"Update"** is tapped (relabeled from "Follow" — reads correctly for removals too, commit/discard mechanic unchanged). The sheet's own selection-state UI — checkbox fill, each category's "N selected" badge, the "Update" button — uses the platform's standard cyan accent (v1.0.115, unified from a separate purple to match the rest of the app's single active/selected color); only the bottom-nav Filter icon itself stays Violet 600 while the sheet is open. The Nations list is sorted full ICC members first, then associates, alphabetical within each group (v1.0.116), via the existing `getTeamMembershipStatus()` adapter -- never a hardcoded name list -- with unresolved-status nations trailing in their own group rather than being misclassified or dropped. Team category is scoped to franchise/league teams only — national teams live exclusively under Nation, never double-listed. Series is genuine bilateral/tour-style competitions (`Competition.type === "bilateral"`, e.g. "India tour of Australia 2026") split out of Tournaments, which now holds only structured multi-team competitions (see DECISIONS-LOG.md SC1). Colored dot only shown for Nation (flag) and Team (real brand color) — Tournament/Series/Player/Format render without one, since none of the four ever carried real per-row signal (see DECISIONS-LOG.md FC5).
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
2. **MiniInsightsBar** — scrolling insight ticker: striker/non-striker figures + current bowler figures. Win probability no longer lives here as of v1.0.121 — the chip was removed (it duplicated the figure already shown in MatchupCard's teaser row below); see item 7. (`components/MiniWinProb.tsx` exists in the tree but isn't rendered anywhere — dead code, unrelated to this move.)
3. **MatchTabs** — Live / Scorecard / **Digest** / Info / Table for a still-live (or upcoming) match; a finished match (`match.status === "post-match"`) swaps slot 1 to **Digest** instead of Live, same total tab count (Table only when the competition has standings; swipe or tap, book-page-turn animation)
4. **BallGIF** (hero) — two-clip animated SVG delivery replay (bowler view + overhead field). SpeedChip hidden when speed data is null.
5. **MomentsStrip** — key events timeline; tap scrubs the whole page to that ball
6. **PartnershipFooter** — live partnership: total runs/balls + per-batter stats, resets on wicket
7. **MatchupCard** — always-on batter vs bowler H2H (career + live match merged); shareable PNG. Collapsed teaser row's right side carries an emphasized win-probability readout since v1.0.121 ("WIN PROB" label + bold, fixed-white "TEAM 87%" value, own tap target -> full-screen `WinProbChart` modal) — the "tap for H2H" text label was dropped in the same change (chevron alone is now that affordance); this is the app's one and only win-prob display on the Live tab. As of v1.0.123 this readout is rendered via a shared `components/WinProbBadge.tsx` component, also reused by the "ball-by-ball data unavailable" fallback card and the full-screen `WinProbChart` modal header — both had drifted back to a team-colored treatment before this fix. v1.0.130 gave this same shared component a visual-prominence pass: larger value text (bigger than the score digits above it), both variants wrapped in one soft translucent neutral pill (`bg-white/[0.06]` + hairline border — never team-colored, per the same rule above), and a brief 180ms scale-only micro-pulse on the value whenever `pct` genuinely changes (triggered by remounting the value node via `key={pct}`, so it never fires on a re-render that doesn't change the number). **v1.0.136**: the collapsed teaser is no longer one box that swaps its content between the pairing and the win-prob readout — it's now two independent, side-by-side bordered boxes in the same row. Left box owns only the batter/bowler pairing and the tap-to-expand-H2H interaction, unchanged in substance. Right box owns only the win-prob readout via a `WinProbBadge` `variant="boxed"` and is structurally outside the expand/collapse branch, so opening H2H stats can never hide, resize, or otherwise affect it. **v1.0.137**: both boxes are now an even 50/50 split (both `flex-1`, was 60/40) -- width is never computed from either side's content. The collapsed teaser's names no longer ellipsis-truncate; the button now wraps long full-name pairings onto a second line instead (box height only grows for that rare case), while common short pairings stay single-line exactly as before. **v1.0.138**: `flex-1` alone measured ~57/43 in the browser -- a flex item's default `min-width: auto` floors it at its own content's min-content size regardless of `flex-basis`. Both boxes now also carry `min-w-0`, which was the actual missing piece; confirmed via a real computed-style check, not a visual read. **v1.0.139**: ratio changed from 50/50 to a fixed 60/40, implemented as a CSS Grid (`gridTemplateColumns: "60% 40%"`, not `flex: 0 0 X%`, which would overflow by the row's gap width) -- `min-w-0` kept on both grid items for the same content-floor reason as before. The row's `items-start` is now `items-stretch`, so both boxes always match height (a deliberate reversal of the prior independent-height design); the matchup teaser button gained `h-full` + `justify-center` to fill and center within that shared height.
8. **AIMetrics** — 4 tiles: Projected, Momentum, Acceleration, Next wicket impact (format-aware ball totals)
9. **CommentaryFeed** — ball-by-ball cards with insight overlays

**Scorecard tab:** Uses `ALL_TEAMS` (not `TEAMS`) — works for national + franchise teams. Team toggle (T20/ODI/Hundred) or per-innings chips (Test) pick which innings shows below, defaulting to whoever's currently batting. Sticky innings header, offset measured live so it stays flush under the real header in any format. Partnership velocity sparklines between batting + bowling cards, plus a per-batter runs-vs-balls sparkline on each dismissal/"not out" line with boundary dots capped at that batter's own 4s/6s. A retired-not-out batter (`BattingEntry.retiredNotOut`, v1.0.132) renders on its own dismissal-style line ("Retired"), excluded from the live-batter glow/asterisk styling reserved for the two genuine current partners — previously indistinguishable from plain "not out" since `Ball.dismissalType`'s `"retired"` value existed but was never consumed anywhere.

**Digest tab (live/upcoming path, unchanged):** Story-of-the-match in cards while a match is still live. Format-adaptive: over cards (T20), session cards (Test), ODI blocks. Day filter chips for Test (default: latest day). Innings chips for T20/ODI (default: latest innings) — each over-group card's innings tag uses the match-wide innings position (`inn.number`) for non-Test formats and the batting team's own occurrence (`teamInningsOccurrence`, correct for Test follow-on) otherwise (v1.0.132 fix; previously always read as the team's own occurrence, which is always 1 for a non-Test format, mislabeling every card "1st Inn" regardless of actual innings). All cards shareable as PNG. A completed Test day collapses its session cards into one consolidated day-summary card (an in-progress day still shows session cards as they finish); narrative phrasing is bucketed by what actually happened (bowling-collapse, dominant-batting, weather-shortened, etc.) and varies within a day via deterministic per-session seeding rather than defaulting to one generic line; notable days/sessions (e.g. an 11-wicket collapse) get a subtle accent border, routine ones stay quiet — same boolean-gate philosophy as homepage Spotlight. A `DigestCardCache` reuses card objects once their underlying data is complete, keeping re-renders cheap on live ticks; this assumes the underlying feed is append-only (see DECISIONS-LOG.md RD8).

**Digest tab (finished-match path, `buildPostMatchDigest`):** the outcome is known, so the story is told retrospectively. Order: a compact lead-in (the same real/derived/pending result card as the live path's post-match summary), a single match-wide turning-point callout (the one ball with the largest win-probability swing across the WHOLE match, via `findTurningPoint`/`calculateWinProbForMatch` — omitted, not stubbed, when there's no ball data), a whole-match performance card (best bat/bowl across all innings, via `computeMatchTopPerformers`), then the existing day/session or over-group cards with one retrospective sentence appended per card (`applyRetrospectiveFraming` — additive only, never touches `buildNarrative`/`buildOverSummary`/`buildDayReport` or their existing anti-repeat indexing). Matches with `innings.length === 0` (7 of the 12 current Past records) get a `SimpleRecapCard` instead — final score from `match.result`'s teamA/B fields plus the existing one-line summary, explicitly labeled "Simple recap," never styled like an empty/broken Digest.

**Info tab:** Pitch report card (surface, sliders, expected score, dew), lineups side-by-side.

---

## Player profiles (`/player/[id]`)

- Bio, country flag, role, batting/bowling style, ICC rankings
- Format tabs: Test / ODI / T20I / {franchiseLeague} (label is dynamic per player e.g. "IPL", "BBL")
- Batting + bowling stats grids; sub-components return null when no data
- **Recent-form graph** (v1.0.117, real-data-derived v1.0.118) — one point per innings/spell across the player's last 10 for the selected format tab, read directly from real `Match.innings[].battingCard`/`bowlingCard` records (no hand-typed side-field); same thin-line/dot-marker visual language as `BatterSparkline`; colored via `lib/teamAccentColor.ts`'s single-team `resolveTeamAccentColor()` (unchanged by the styling update below). Renders nothing for a player/format with zero settled matches; never pads to 10 if fewer real innings exist. **v1.0.119:** upgraded from an axis-less sparkline to a labeled small line chart -- Y-axis value labels + ~4-5 light gridlines, scale computed per player/metric (never a fixed range -- a bowler's 0-10 wicket ceiling and a batter's hundreds-of-runs range get genuinely different scales); minimal X-axis with only "N ago"/"Most recent" endpoint labels
- **Achievements callout** (v1.0.117, real-data-derived v1.0.118) — one line per qualifying recent achievement (Man of the Match count, Man of the Series), stacking as many as apply; correct singular/plural ("award" vs "awards"); the whole section is omitted, not shown empty, when nothing qualifies. Read directly from real `Match.result.manOfMatch`/`manOfTournament` records across the player's last 10 distinct settled matches. Both sections read through `lib/playerForm.ts`'s `getRecentForm()`/`getPlayerAchievements()` — the only sanctioned reads (the old hand-typed `RecentFormWindow` field was removed entirely). Deliberately excludes a player's upcoming matches (playing XI isn't confirmed early enough to show responsibly)
- Clickable from Scorecard rows and CommentaryFeed wicket cards
- `PLAYER_ALIASES` map resolves alternate IDs from live data

---

## Schedule tab (`/schedule`)

- **Tab row** — "All" (default) plus one tab per team selected in Filter (nations or franchise teams both count, see `myTeamCodes()` in `lib/followPrefs.ts`), ordered nations first then franchise/league teams, alphabetical within each group (v1.0.114 -- same `Team.type` categorization Filter's Nations/Teams sections use). Zero teams selected shows "All" only, with no team tabs. Reactive to Filter changes while Schedule is open (`onFollowPrefsChanged`), same as the homepage's "for you" row; falls back to "All" if the active tab's team gets unfollowed.
- **"All" tab (v1.0.113)** — one summary row per ongoing-or-upcoming series/tournament, no matches listed inline: the series name, a LIVE badge if anything in it is currently in progress, the date of its next live/upcoming match, and a one-line "Last: ..." recap of its most recently completed match (e.g. "Last: KKR won by 7 wickets vs RR"). Rows are ordered by each series' true start date ascending, held stable throughout its run; a fully-concluded series (every match already played) drops out of "All" entirely (both rules unchanged from v1.0.112). Tapping a row opens that series' dedicated page.
- **Dedicated series page (`/schedule/series/[competitionId]`, v1.0.113, new)** — every match a series has (past, live, upcoming) in ascending date order, same card format as the rest of Schedule. No inclusion-rule filtering here — a fully-concluded series still gets a complete page (reachable directly even though it has no "All" row).
- **A team tab** — unchanged, deliberately deferred from both the v1.0.112 and v1.0.113 redesigns: a flat, chronological, month-grouped list of exactly that team's matches (live/upcoming/past all included, no series grouping, no completed-series exclusion, no row-collapsing). Tapping a team's tab narrows to just that team; tapping "All" returns to the series row list.
- Match cards look identical regardless of which tab/page they appear on — no color-coding by result (the v1.0.110 win/loss colored left-border strip and colored text were both removed in v1.0.111); the "Won"/"Lost" text label itself still reflects the active tab's team perspective, just uncolored. Rendered via the shared `components/ScheduleRow.tsx` (extracted in v1.0.113 so the dedicated series page uses the identical card, not a lookalike).
- **`lib/teamSchedule.ts`** — the sanctioned async interface: `getSeriesGroupedSchedule()` for "All"'s qualifying series (ongoing/upcoming only), `summarizeSeriesGroup()`/`formatLastResult()` (pure presentation derivations, not data access) turn each into its one-row summary, `getTeamSchedule(teamCode)` for a team tab (flat, everything), `getMatchesForCompetition(competitionId)`/`getAllCompetitionIds()` back the dedicated series page and its `generateStaticParams`. All share the same underlying match/competition validation (`scheduleEntries`/`toScheduleEntry`/`safeCompetition`). See "Key data rules" below and `ARCHITECTURE.md` for the full real-data-readiness treatment.
- `/schedule/[competitionId]` and `/schedule/[competitionId]/[teamCode]` still exist as drill-down routes reachable from `MiniStandings`, but are no longer linked from the main Schedule tab itself -- distinct from the new `/schedule/series/[competitionId]` route above.

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
- **`lib/matchStatus.ts`'s `isMatchConclusivelyOver()`** (v1.0.124, superseding the earlier `match.status === "post-match"`-alone rule below) is authoritative for DigestTab's summary card — `result` present AND the current observable innings state actually backs that up, not just "a result object happens to exist." A match kept at `status: "live"` indefinitely with a pre-baked final `result` (e.g. `FEATURED_MATCH`) is genuinely still mid-chase most of the time, not concluded, so `status` alone was never sufficient here even before v1.0.124 exposed why. While genuinely still live and unconcluded, the card slot shows a real in-progress state (current scores + chase math), never nothing and never a false verdict. Once a match stops being live: a missing `result` either derives a minimal one (unambiguous non-Test 2-innings case) or renders an explicit "final result pending" card; per-session `isComplete` flags are likewise only trusted while `isLive`, overridden once the match ends (DECISIONS-LOG.md FY22-FY23, v1.0.124)
- **`match.championship`** drives the TABLE button for Test matches (WTC); falls back to `match.competition`
- **`normalizeMatch()`** (`lib/dataValidation.ts`) — validation/adapter layer at the data boundary; collects errors (blocking) + warnings (non-blocking) instead of letting malformed data flow silently into narrative/win-prob functions. Validates an object already shaped like Bawler's own `Match`/`Innings`/`Ball` types — it has no opinion on a real provider's own wire format.
- **`ingestMatchFeed()`** (`lib/matchFeedAdapter.ts`, v1.0.134) — the one sanctioned entry point for a REAL provider's raw feed (a different shape than `normalizeMatch()` expects). Reshapes a realistic raw payload into Bawler's internal naming and, critically, extracts any retirement event out of each innings' delivery sequence into `Innings.retirements` (see `RetirementRecord` in `lib/types.ts`) before delegating to `normalizeMatch()` — a retirement inserted into `Innings.balls` instead corrupts over/wicket bookkeeping (DECISIONS-LOG.md v1.0.133). `lib/mockData.ts`'s hand-authored fixtures don't go through either function — only `lib/matchGenerator.ts`'s generated matches use `normalizeMatch()` directly.
- **First real fixture use of the retirement side-channel** (v1.0.135) — `ind-aus-t20i-2026-m2-live`'s 2nd innings sets `Innings.retirements` for R Sharma (`retired-not-out`, `afterBallId` pointing at his real last ball). Score tab correctly shows exactly 2 "not out" batters and renders his row as "Retired", 106 (49) preserved; `Innings.balls` was not touched.
- **`formatPlayerName()`** (`lib/playerName.ts`, v1.0.120) — the ONLY sanctioned way to render a player's name anywhere in the app; always use this instead of splitting a name string inline. Registry-first (hand-verified `shortName` wins), then a real parser (`parsePlayerName()`) for multi-word surnames/particles, suffixes, hyphenated surnames, single names, bad capitalization, stray whitespace, and comma feed format — instead of the old `getPlayerShortName()`'s deferred fallback (unmodified full name for an unregistered compound surname) or a naive last-token guess

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
│   ├── MatchView.tsx          # orchestrates all tabs; allBalls flatMap; showDigest flag; truncatedMatch recomputes battingCard/bowlingCard from the truncated ball slice too (v1.0.131, via lib/matchStatus.ts's deriveBattingCardFromBalls/deriveBowlingCardFromBalls — not just runs/wickets/overs as before); demo-only liveBallIdx auto-advance/rewind ticker now gated behind match.isMockSimulation (default off) via shouldRunMockSimulationTicker(), so it can never engage for real data (v1.0.131)
│   ├── ScoreBar.tsx           # sticky score header; current-batting-team derivation via lib/matchStatus.ts's shared getCurrentInnings() (v1.0.126, also reused by lib/playerActivity.ts)
│   ├── BallGIF.tsx            # hero two-clip SVG delivery replay; PartnershipFooter
│   ├── MomentsStrip.tsx       # horizontal key events timeline
│   ├── MiniWinProb.tsx        # NOT RENDERED ANYWHERE -- dead code; the real win-prob readout lives in MatchupCard's teaser row (moved there from MiniInsightsBar in v1.0.121), see "Match page" above
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
│   ├── BottomNav.tsx          # persistent Home / Schedule nav + raised Filter trigger (opens FollowSheet)
│   └── YourPlayersStrip.tsx   # (v1.0.125, follow-on live-detection fix + name-format data-bug fix v1.0.126, avatar extracted to shared PlayerAvatar.tsx v1.0.129) "Your Players" homepage chip strip; exports useYourPlayers() hook (favourited+live sort, reactive to followPrefs/favourites/live-match changes); renders null at zero selected players
├── PlayerAvatar.tsx           # (v1.0.129) shared photo-first-fallback-to-initials avatar -- imageUrl -> initials via parsePlayerName(), onError-driven runtime fallback; role/format-agnostic (size + ring/text/background colors are plain props); the ONE avatar implementation reused by YourPlayersStrip.tsx, DigestTab.tsx's MOM card, and PlayerProfileView.tsx's header
└── Player profile
    ├── PlayerProfileView.tsx  # bio, rankings, per-format stats tabs, recent-form graph + achievements callout, favourite star toggle (v1.0.125), header avatar via shared PlayerAvatar.tsx (v1.0.129)
    ├── RecentFormGraph.tsx    # last-10 innings/spells labeled small line chart (v1.0.119: Y-axis + gridlines, scale per player/metric via computeYAxisTop()/buildYAxisTicks(), minimal two-endpoint X-axis -- supersedes the earlier axis-less sparkline styling), colored via lib/teamAccentColor.ts
    └── PlayerAchievements.tsx # recent achievement lines (MOM count, Man of the Series); renders nothing if none apply
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
├── teamSchedule.ts      # getSeriesGroupedSchedule()/getMatchesForCompetition()/getTeamSchedule() — real-data-ready async schedule adapter behind Schedule's All (series rows), dedicated series page, + per-team (flat) tabs
├── teamAccentColor.ts   # resolveMatchAccentColors() (two-team, collision-aware) + resolveTeamAccentColor() (single-team, v1.0.117) — real-data-ready team-color resolution, hairline-contrast + secondary/cyan fallback
├── playerForm.ts        # getRecentForm()/getPlayerAchievements() (v1.0.117, derived from real match data v1.0.118, per-innings settled-gate fix v1.0.127) — per-format last-10 innings/spells + achievements adapter; eligibility decided per INNINGS via lib/matchStatus.ts's shared getCurrentInnings(), not per match, so an already-closed innings of a still-live match still counts
├── playerName.ts        # parsePlayerName()/formatPlayerName() (v1.0.120) — the single sanctioned player display-name formatter app-wide; registry-first, algorithmic fallback for particles/suffixes/hyphens/single-names/casing/whitespace/comma-format
├── playerFavourites.ts  # (v1.0.125) favourite-player localStorage store, same shape as followPrefs.ts; toggleFavouritePlayer() one-way-links favouriting to FollowPrefs.players
├── playerActivity.ts    # (v1.0.125, follow-on fix v1.0.126) getLiveActivePlayerIds() — "currently batting/bowling" derived from the CURRENT innings' full battingCard+bowlingCard (via lib/matchStatus.ts's shared getCurrentInnings(), same lookup ScoreBar.tsx uses), gated on balls.length > 0; never battingCard/bowlingCard's onStrike (which can leak end-of-innings final state), and never just the single last ball (missed multi-batter-deep follow-on innings pre-v1.0.126)
├── yourPlayers.ts        # (v1.0.125) getYourPlayers() — pure 4-tier favourited/live sort for the homepage "Your Players" strip, surname-keyed via playerName.ts
└── useCarouselIndex.ts # shared scroll-position -> active-index hook for snap-x carousels
```
