# Bawler Build Status

> Snapshot of what's shipped, what's mocked, what's pending. Updated alongside every deploy.

**Current version:** v1.0.48 (deployed)
**Live URL:** `bawler-gold.vercel.app`
**Repo:** `github.com/ishan401/bawler`
**Local dev:** `cd bawler-main && npm install && npm run dev`

---

## Shipped ✅

- ✅ **Performance** — feGaussianBlur SVG filters removed from animated balls (biggest GPU bottleneck); animate-r geometry invalidation removed; React.memo on 7 components; useCallback on moment selection handler

### Home page (`/`)

- ✅ Compact header — logo + Bawler title only (filter chips removed)
- ✅ **Bottom navigation bar** — persistent Home / Schedule / Table at bottom of every page; active tab cyan + underline; shows on match page too (all tabs dimmed)
- ✅ **Team filter colour dot** — glowing dot in team's primary colour when TEAM filter active
- ✅ Live carousel — snap-scroll, 3 mock live matches, full-width cards with split win-prob bar
- ✅ **Empty state** — when no live matches, shows next upcoming match card (teams, countdown, venue)
- ✅ **Loading skeleton** — shimmer placeholder cards for 350ms on first load
- ✅ **Pull-to-refresh** — pull from top triggers spinner + simulated refresh (only at scroll pos 0)
- ✅ **Tap feedback** — all match cards scale + darken on press (`.tap-scale`)
- ✅ Filter bar — pre-filled defaults, enable circle, fixed-position dropdowns
- ✅ Past column (65%) — split-team backgrounds, result banner, rank pills, 2-line description
- ✅ Future column (35%) — countdown anchor bar at bottom (clock + cyan "in 2d 14h" + time + city)
- ✅ Diff-aware filter animation — stayers don't move, leavers collapse, newcomers pull up with stagger
- ✅ Column expand toggle (full-width past or full-width future)
- ✅ Infinite scroll via window scroll listener

- ✅ **Series status chip** — one-line bilateral series summary (e.g. "AUS lead 1-0 · 5-match T20I series") below live bilateral international cards; uses `match.seriesStatus` field
- ✅ **International flag backgrounds** — national match cards show country flag images (flagcdn.com) with desaturation filter; franchise matches keep dual-colour gradient

### Schedule page (`/schedule`)

- ✅ All matches grouped by date, chronological
- ✅ Past matches show winner + margin; live show pulsing dot; future show "Upcoming"
- ✅ Clean header — title only, no back button (primary nav destination)
- ✅ Tap to open match page

### Table page (`/table`)

- ✅ **Multi-competition horizontal tab selector** — 8 competitions: IPL, PSL, BBL, The Hundred, SA20, ICC T20WC, ICC CT, WTC
- ✅ Column variants: NRR (franchise leagues), PCT% (WTC), Drawn (WTC)
- ✅ Top-N qualifier bar + "Q" badge auto-rendered from `qualifyingSpots` per competition
- ✅ Eliminated teams: dimmed + "Out" badge
- ✅ Clean header: "Table" + "All competitions" subtitle, no back button

### Player profiles (`/player/[id]`)

- ✅ **SSG route** — `generateStaticParams()` over `PLAYERS`; `notFound()` on miss
- ✅ Bio card: name, country flag, role, batting/bowling style
- ✅ ICC rankings badges
- ✅ Format tabs: Test / ODI / T20I / {franchiseLeague} — tab label dynamic per player
- ✅ Batting + bowling stats grids (4-column); null when no data for that type
- ✅ Clickable from Scorecard rows and CommentaryFeed wicket cards
- ✅ `PLAYER_ALIASES` map resolves alternate IDs; `resolvePlayerSlug()` in Scorecard
- ✅ 21 player profiles seeded in mock data

### Match page — Live tab

- ✅ Sticky header — score bar + mini-insights bar + tab strip
- ✅ Mini-insights bar — RRR, last 12 balls, current bowler figures, top scorer
- ✅ **Book page-turn animation** — 3D rotateY + translateX on tab switch (swipe or tap); direction-aware
- ✅ **Swipe between tabs** — left = forward, right = backward; ignores vertical swipes
- ✅ **Score event badge** — red pulsing dot (wicket) or teal dot (six) on Scorecard tab; clears after 4s
- ✅ **Partnership tracker** — single-row footer below ball visualizer: `Pship N(B) · BatterA N(B) [×4][×6] · BatterB N(B)` + total 4s/6s pinned right; resets on wicket; handles non-striker run-outs and no-balls correctly
- ✅ **Series schedule bottom sheet** — bilateral series status chip on live cards is now a tappable button; opens BottomSheet with complete series timeline: past matches (result + scorecard scores), live match highlighted in green, upcoming matches with countdown; back-swipe / swipe-down to close
- ✅ **iOS Safari back-swipe fix** — BottomSheet now pushes a `#modal` URL hash entry so iOS Safari's edge-swipe fires `popstate` correctly; cleanup uses `replaceState` (not `history.back()`) to avoid double-navigation on programmatic close; works correctly on Android, desktop, and iOS PWA
- ✅ **Partnership velocity spark** — Scorecard tab now shows a Partnerships section between Batting and Bowling; each row has a 72×22px SVG sparkline (team-coloured area + polyline) showing RPO per 3-ball window across that partnership, batter names, and runs(balls); only renders when ball data exists
- ✅ **ScoreBar competition badge** (v1.0.47) — hidden for bilateral series (redundant with the two team names already shown); still shown for leagues/tournaments where it disambiguates (e.g. "IPL", "ICC T20 WC")
- ✅ **BallGIF** — two clips (bowler perspective + overhead) 3s each, 4 reps/ball (24s dwell)
- ✅ **Perspective-correct impact Y** — uses trapezoid width ratio (220/80=2.75) for accurate pitch length display
- ✅ **Post-pitch bounce arc** — bezier control above impact point; bounce height scales with pitchY (10–55px)
- ✅ **No SVG filter on animated balls** — feGaussianBlur removed; perf fix; gradient fill preserved
  - ✅ **Speed label** (v1.0.45) — redundant "Fast"/"Slow" text removed from the info bar; the speed number's colour alone now signals pace, matching the commentary feed convention
  - ✅ **Share button relocated** (v1.0.46) — moved off the visual (was floating top-right on wicket/4/6 balls) into the info-bar chrome beside the outcome badge; still only shows on highlight balls
  - ✅ Stick figures with name labels; speed + ball type as text
  - ✅ Exaggerated swing (1.8×) + spin (2.2×) for visual punch
  - ✅ Background tint by outcome (unified palette) — no whitish wash (perspective fix)
  - ✅ Cross-fade between clips (280ms); smooth bg transition between balls (600ms)
- ✅ **Moments strip** — two-zone chips (badge + over top; label + 2-line context bottom). Dedicated pulsing "Live" chip was **removed in v1.0.45** — the existing "Back to live" text link already covers that affordance; two live-status indicators was redundant.
- ✅ **Matchup card** (v1.0.47) — defaults to a collapsed one-line teaser (team-coloured dot + batter vs bowler + chevron, ~40px); tap to expand in place to the full H2H card (unchanged content: format-aware stats, career H2H + live counters, label-value row, danger delivery line, shareable PNG). Collapsing by default trades always-visible depth for screen space — see DECISIONS-LOG.md.
- ✅ **Win-prob chip** (v1.0.46) — win probability moved out of the standalone MiniWinProb card into a leading-team-code + % chip inside the mini-insights bar; tap to expand the full WinProbChart modal (unchanged). `MiniWinProb.tsx` is no longer rendered anywhere and is now orphaned dead code (see cleanup list below).
- ~~AI metrics tiles~~ — **retired in v1.0.23** (see DECISIONS-LOG.md SD3); row removed entirely, replaced by projected score + CRR in ScoreBar. `AIMetrics.tsx` + `lib/metrics.ts` are now orphaned dead code (see cleanup list below).
- ✅ Win-prob chart modal — full-screen, two team lines, hue-accurate via `brightColor()`

- ✅ **SpeedChip** — hidden when `ball.ballSpeedKmh` is null (was showing "0 kmh")
- ✅ **Format-aware chase metrics** — `totalBallsForFormat(match)` replaces hardcoded 120; correct for T20/ODI/Test
- ✅ **Insights prop-driven** — `MatchViewProps.insights?: InsightV2[]`; real pages pass `insights={[]}`, mock is default fallback
- ✅ **truncatedMatch innings fallback** — when no balls exist for innings[1], falls back to real `match.innings[1]` values (ScoreBar no longer shows 0/0)
- ✅ **Commentary feed** (share button **removed entirely in v1.0.47** — see DECISIONS-LOG.md, reverses CL2) — colour-coded ball outcomes:
  - Wicket: red `#EF4444`
  - Six: turquoise green `#2DD4BF`
  - Four: cyan `#06B6D4`
  - Three: hot pink `#EC4899`
  - Dot / single / double: muted slate `#64748B` (all same — low-impact group)
  - Extra: light slate `#94A3B8`
  - Full cards (mini-GIF) for wickets / 4s / 6s; compact rows for everything else
  - Stat / opinion inline notes; over summary pills; innings break dividers

### Match page — Scorecard tab

- ✅ Uses `ALL_TEAMS` (not `TEAMS`) — correctly resolves national team names/colours
- ✅ Per-innings batting card (R / B / 4s / 6s / SR / dismissal)
- ✅ Per-innings bowling card (O / M / R / W / Econ)
- ✅ **Not-out row fix** — a batter's dismissal line now shows exactly one string (either real dismissal text or "not out"), never both; was rendering a duplicated "not out" on every not-out batter (`ee03f69`)
- ✅ **Team toggle (T20/ODI/Hundred)** — two compact pill chips (byte-identical styling to DigestTab's own filter chips) switch which team's innings renders below; defaults to whichever team is currently batting (live) or batted last (completed); "Yet to bat" empty state for the other team; Test format unaffected, keeps its own per-innings chips (`4aa8a24`, `ea4043b`, `61092bd`)
- ✅ **Per-innings chips (Test only)** — one chip per innings labelled `"{Team} Inn. {N}"` where N is which innings this is *for that team* (1st or 2nd), not the global ball-order position; defaults to the innings currently in progress (`03091d8`)
- ✅ **`teamInningsOccurrence()`** in `lib/formatUtils.ts` — single source of truth for "which innings is this for this team"; used by both the Test chip labels and the innings-card header itself, so a team's 2nd Test innings always reads "Innings 2" everywhere, never "Innings 3"/"Innings 4" (the global `match.innings` array position) (`2a9944d`)
- ✅ **Sticky innings header** — team name + innings score sticks below the match header while scrolling; offset is now measured live via `ResizeObserver` (`--sticky-header-h` CSS var) instead of a hardcoded px value, so it stays flush under the real header in every format (Test's header is a different height than T20's) (`e910c0d`, `57a0fae`)
- ✅ **Per-batter sparkline** — cumulative runs-vs-balls-faced mini chart on the dismissal/"not out" line (~20px tall, doesn't add a row); smoothed Catmull-Rom curve; fours marked cyan, sixes marked six-purple, same "event dot on a line" pattern as the win-prob chart; dot count is capped at the batter's own 4s/6s column so it can never show more boundaries than the box score states; renders nothing when there's no ball-by-ball data for that batter (`32444f8`, `ac42d9a`, `8bb153e`, `9456e99`, `bb60664`, `105284a`)
- ✅ **Not-out glow** — the currently-batting row's name/sparkline gets the same pulsing `excitement-glow` box-shadow used on high-excitement match cards, confined to a small rounded chip around just that cell (not the whole row, which read as a hard rectangle) (`9456e99`, `bb60664`)
- ✅ Highest scorer: runs in teal per innings
- ✅ Highest wicket-taker: wickets in red per innings
- ✅ Highest strike rate (min 6 balls): SR in blue per innings
- ✅ Man of Match: name in gold + MOM chip
- ✅ Man of Series: name in purple + MOS chip
- ✅ MOM/MOS banners above innings cards when match is complete

### Match page — Info tab

- ✅ Match context (toss, teams, season)
- ✅ Pitch report card — surface type, 3 sliders, expected score range, dew factor, behaviour bullets
- ✅ Lineups — both team squads side-by-side (innings lookup by `battingTeam`, not positional array index)


### Platform-wide franchise agnosticism

- ✅ `franchiseStats?: FormatStats` + `franchiseLeague?: string` on `PlayerProfile` (was `iplStats`)
- ✅ Player profile tab label shows actual league name per player (e.g. "IPL", "BBL")
- ✅ All 3 transformer skeletons in `transformers.ts` updated to `franchiseStats`
- ✅ App meta description: format-agnostic ("All cricket, every ball, visualized...")
- ✅ `seriesStatus?: string` on `Match` for bilateral series one-liners

### Brand + visuals

- ✅ Phone-frame on desktop (`max-w-[430px]`) floating on pure black (`#000000`)
- ✅ Unified outcome palette (`lib/outcomeColors.ts`)
- ✅ Cricket-domain accent palette in Tailwind (cyan, orange, boundary, wicket, six)
- ✅ Inter font from Google Fonts; tabular numerics (`num` utility)

### Tech / infra

- ✅ Next.js 14 App Router + TypeScript strict + Tailwind CSS
- ✅ Vercel auto-deploy from `main` branch (60–90s build)
- ✅ Static-prerendered match pages via `generateStaticParams`
- ✅ No external chart library — hand-written SVG throughout
- ✅ BottomNav outside phone-frame in layout — never clipped by `overflow: clip`

---

## Mocked (will become real in v2) 🔶

| Source | Mock state | Plan |
|---|---|---|
| Live match data | Hard-coded KKR vs MI in `mockData.ts:FEATURED_MATCH` | Roanuz API (Ball Tracker tier) |
| Carousel live matches 2 & 3 | `liveStatusOverride` + `liveWinProbOverride` fields | Real fetches |
| Past + future matches | Hard-coded + `matchGenerator.ts` procedural | Real fetches |
| Coordinates (pitch / shot) | `Math.random()`-based but plausible | Roanuz Ball Tracker + Cricbuzz fallback |
| Win probability | Internal power-curve formula (calibrated, no double wicket penalty) | Scraped bookmaker odds (Betfair / Betway / 1xBet) averaged |
| Insights | 8 hard-coded `MOCK_INSIGHTS_V2` | Scraped from 19 analyst Twitter accounts via Nitter |
| Per-ball commentary | Pre-written in mock balls | Scraped from Cricbuzz / ESPN |
| Standings | Hard-coded `STANDINGS` | Real fetch |
| Pitch reports | Hard-coded per venue | Scraped from pre-match analysis |
| Ball-by-ball vs box score | Ball arrays in ~4 matches (`ipl2026-m37-kkrvmi`, `ind-aus-t20i-2026-m2-live`, `ind-eng-test-2026-d3-live`, `psl-2026-lah-kar-live`) don't fully reconcile with their own battingCard aggregate stats — some batters' ball data has more/fewer isBoundary4/6-flagged deliveries, runs, or balls faced than their card states (audited: 24 of 53 checked batters mismatched). The new per-batter sparkline caps its boundary dots at the card's own 4s/6s so it never *overcounts*, but can undercount when the ball log is short. | Regenerate ball-by-ball data per innings so every batter's runs/ballsFaced/4s/6s fully reconcile with the card; real API data won't have this problem |

---

## Pending — v2 priorities 🔵

### Critical path
- [ ] Roanuz Cricket API integration (Ball Tracker tier)
- [ ] Bookmaker odds scrapers (Betfair / Betway / 1xBet) → win-prob
- [ ] Cricbuzz scraper for per-ball one-liner + coordinate fallback
- [ ] Twitter / Nitter scraper for 19 curated analyst accounts
- [ ] Real-time SSE channel server → browser for new balls
- [ ] Smart fallback chain with Sentry alerts to WhatsApp/SMS

### Important
- [ ] Shareable ball-GIF export — one-tap MP4/GIF for WhatsApp / Twitter
- [ ] User accounts + favourites
- [ ] Push notifications for favourited teams
- [ ] Real domain (off `bawler-gold.vercel.app`)

### Nice-to-have
- [ ] Vitest + RTL tests on `BallGIF`, `DeliveryCard`, `MatchView`
- [ ] Remove legacy unused components (`ViewSwitcher`, `MomentsCollapsible`, `PressureGauge`, `ProjectedScore`, `DemoControls`, `InsightsPanel`, `AIMetrics.tsx` + `lib/metrics.ts` [orphaned since v1.0.23's AI-metrics-row removal, confirmed unreferenced anywhere in the codebase], `MiniWinProb.tsx` [orphaned since v1.0.46 moved win-prob into the mini-insights bar chip])
- [ ] Service worker for offline-cached last-seen match state
- [ ] WCAG colour-contrast audit on `text-dim` values
- [ ] Lighthouse-mobile to 95+ (currently ~88)
- [x] MiniWinProb redesign — completed v1.0.8 (both teams visible, gradient fills)

---

## Recent change log (high-level)

| Version | Highlight |
|---|---|
| **v1.0.34** | Partnership velocity spark in Scorecard — sparkline (RPO/3-ball window) per partnership, between batting + bowling cards |
| **v1.0.33** | iOS Safari back-swipe fix + SeriesScheduleSheet real-data decoupling (seriesPool prop, resolveCompetition) |
| **v1.0.32** | Series schedule bottom sheet — clickable series chip, past/live/upcoming timeline, back-swipe + swipe-down close |
| **v1.0.31** | API robustness: `normaliseName()` in transformers.ts — consistent player names across ESPN/Sportradar |
| **v1.0.30** | Win prob fix: power-curve achievable RPO, remove double wicket penalty — IND 21 off 22 now shows 83% not 31% |
| **v1.0.29** | Partnership tracker replaces win-prob bar below BallGIF — single row, live per-batter runs/balls/4s/6s |
| **v1.0.28** | Matchup card fully live: career+match stats merged; label-value row; matches count; live 4s/6s |
| **v1.0.7** | Nav cleanup: removed back btn from Schedule/Table; GT dot → cobalt #4285F4; sticky scorecard innings header |
| v1.0.6 | Bug: fixed whitish SVG wash in Safari (perspective CSS); commentary: doubles → slate, threes → pink |
| v1.0.5 | Commentary colours (six turquoise, single = dot); bottom nav on match page; book page-turn animation |
| v1.0.4 | UX: swipe tabs, skeleton, pull-to-refresh, tap feedback, back button, empty state, score badge |
| v1.0.3 | Bottom nav fixed — BottomNav moved outside phone-frame, never clipped |
| v1.0.2 | Scorecard highlights (teal top scorer, red wicket-taker, blue SR, gold MOM, purple MOS); win-prob reverted |
| **v1.0.27** | Fix franchiseStats corruption (SOH chars); rename iplStats→franchiseStats in transformers.ts |
| **v1.0.26** | Platform-wide franchise rename: franchiseStats/franchiseLeague, app meta, transformers |
| **v1.0.25** | Multi-competition Table page — 8 competitions, horizontal tab, NRR/PCT/Drawn column variants |
| **v1.0.24** | Bilateral series status chip on LiveCarousel; seriesStatus field on Match |
| **v1.0.23** | Removed format/tour/team filter chips from homepage header |
| **v1.0.22** | International match cards: national flag backgrounds (flagcdn.com) |
| **v1.0.21** | Real-data audit fixes: SpeedChip, format-aware metrics, ALL_TEAMS, truncatedMatch fallback, LineupsCard, insights prop |
| **v1.0.20** | Player profiles: /player/[id] SSG route, 21 profiles, Scorecard/CommentaryFeed links |
| **v1.0.19** | Auto-championship resolution in transformers — series-ID maps, zero per-match tagging |
| **v1.0.18** | WTC standings: championship field, PCT column, TABLE button for live Test matches |
| **v1.0.17** | Real-data readiness: CompetitionStandings layer, hasStandings flag, transformers.ts, dynamic columns |
| **v1.0.16** | Bug fixes: win prob override inversion, scorecard empty, MiniStandings in Live tab |
| **v1.0.15** | TABLE button context-aware (tracks snapped carousel card); team schedule popup |
| **v1.0.14** | BottomSheet standings + scroll fix: height 85vh, body scroll lock, touch-action pan-y |
| **v1.0.13** | TABLE button + standings sheet on home carousel; MiniStandings onTeamClick prop |
| **v1.0.12** | Test match dual-innings score display; liveStatusOf + liveWinProb battingTeam fix |
| **v1.0.11** | Multi-competition: national teams, diverse formats, competition badge UI |
| **v1.0.10** | Performance: SVG filter removal, React.memo x7, useCallback |
| v1.0.9 | BallGIF: perspective-correct impact Y + post-pitch bounce arc |
| v1.0.8 | MiniWinProb redesign: both teams visible, gradient fills |
| v1.0.7 | Nav cleanup: removed back btn from Schedule/Table; GT dot fix; sticky scorecard headers |
| v1.0.4 | UX: swipe tabs, skeleton, pull-to-refresh, tap feedback, back button, score badge |
| v1.0.1 | Build hotfix: 6 truncated files, 8 missing React imports, null bytes, TS null error |
| v1.0.0 | UX overhaul: bottom nav, AI tile labels, Moments redesign, BallGIF hierarchy, countdown cards |
| v0.9.8 | brightColor() hue-accurate team colours in win-prob |
| v0.9.0 | Initial prototype with full mocked data |

### Match page — Digest tab

- ✅ **Digest tab** — 4th tab in MatchView (visible when ball data exists for any innings); shows a story-of-the-match through cards newest-first
- ✅ **Format-adaptive grouping** — T20/T20I/Hundred: 1 card per over; ODI: 1 card per 5 overs; Test with sessions: 1 card per session; Test without sessions: 1 card per 10 overs (auto-derived from timestamps)
- ✅ **Over-group cards (T20/ODI)** — 3-row compact layout: header (over label + runs/wickets/4s/6s) + narrative (factual 1-liner) + over-summary (punchy 2-line creative text); ball-dot row for T20/T20I showing W/4/6/runs/dot coloured circles
- ✅ **Session cards (Test)** — one card per session (ICC naming: 1st/2nd/3rd Session); shows session label, innings label, over range, runs/wickets, "Live" badge for the in-progress session
- ✅ **Day Summary card (Test)** — rich 5–7 line day report after each completed day; session-by-session breakdown table; top bat + top bowl highlights; cyan border distinguishes it from session cards
- ✅ **Day filter chips (Test)** — horizontal row of "Day 2", "Day 3" etc. chips above cards; default = latest day; match summary card always pinned regardless of selected day; only shown when ≥ 2 days have data
- ✅ **Innings chips (T20/ODI)** — "1st Innings" / "2nd Innings" chip row; default = latest innings with data; only shown when both innings have ball data
- ✅ **Post-match summary card** — rich pinned card at top of Digest tab for any match with `match.result`; winner + margin, top batter/bowler highlights, MOM with initials avatar, series status, 6-line auto-narrative; always visible regardless of day/innings filter
- ✅ **MOM avatar** — Man of Match in summary card shows player photo (via `PLAYERS[slug].photoUrl`) with initials-in-team-colour fallback (same design language as BallGIF PlayerAvatar)
- ✅ **Shareable cards** — every digest card has a share button; captures card as 2× PNG via `html-to-image`; `navigator.share` on mobile, `<a download>` fallback on desktop
- ✅ **`deriveTestSessions()`** in `transformers.ts` — auto-detects session boundaries from timestamp gaps so DigestTab works for Test matches even when the API omits session metadata

### Data layer — IND vs ENG Test + AUS vs IND T20I

- ✅ **`ind-eng-test-2026-d3-live`** — 3-innings Test match: IND 450/8 declared (inn 1, no balls); ENG 199/10 (inn 2, 348 balls, Day 2 1st + 2nd Session complete); ENG follow-on 88/4 (inn 3, 164 balls, Day 3 1st Session live)
- ✅ **`ind-aus-t20i-2026-m2-live`** — AUS 175/8 (inn 1, 120 balls complete); IND 142/3 chasing (inn 2, 98 balls live, Kohli 61*, need 34 off 22)
- ✅ **`ipl2026-m37-kkrvmi`** (FEATURED_MATCH) — MI 174/9 (inn 1, full scripted ball data); KKR 175/6 won by 4 wkts (inn 2, scripted through Russell's match-winning hit)

---

## Changelog additions (v1.0.35–v1.0.40)

| Version | Highlight |
|---|---|
| **v1.0.40** | Fix: match summary card condition (result-based, not status-based); IND vs ENG test match ID corrected |
| **v1.0.39** | AUS vs IND T20I ball data confirmed restored; platform hard-reverted to pre-pitch-report state (git reset --hard 5333611) |
| **v1.0.38** | Digest: shareable cards (html-to-image PNG + navigator.share); innings chips (T20/ODI); post-match summary card; MOM avatar with img+initials fallback |
| **v1.0.37** | Digest: day filter chips row (Test); expanded Day Summary card (5–7 lines) |
| **v1.0.36** | Digest: Test match session-based cards + Day Stumps summary; TestSession type + deriveTestSessions() transformer; IND vs ENG test 512-ball dataset |
| **v1.0.35** | Digest tab: initial build — over-by-over cards, compact 3-row layout, creative over-summary, normalizeBall() in transformers |

---

## Changelog additions (v1.0.48)

| Version | Highlight |
|---|---|
| **v1.0.48** | Scorecard: not-out duplicate-text fix; team/innings selector chips (two-team toggle for T20/ODI/Hundred, per-innings chips for Test); per-team innings-number fix (`teamInningsOccurrence`) applied to both Scorecard and Digest; sticky innings header now measures real header height instead of a hardcoded offset; new per-batter sparkline (runs-vs-balls, boundary dots capped at the row's own 4s/6s) with a pulsing glow on the batter currently at the crease (`ee03f69`…`105284a`, 16 commits) |

## Changelog additions (v1.0.41–v1.0.47)

| Version | Highlight |
|---|---|
| **v1.0.47** | Matchup card collapses to a one-line tap-to-expand teaser by default; commentary feed per-ball Share button removed entirely (`31b6d0d`, `be69b6d`) |
| **v1.0.46** | Win-Prob moved out of the standalone MiniWinProb card into a tap-to-expand chip in the mini-insights bar; all insight chips gained max-width + truncation; BallGIF Share button relocated off the visual into the info-bar chrome (`232ded5`, `bcc633e`) |
| **v1.0.45** | Fix: redundant "Fast"/"Slow" pace label removed from BallGIF/MiniBallGIF/commentary speed readout (colour alone signals pace now); fix: blank leftmost Moments-strip chip (flex `align-items: stretch` bug) (`72e729b`) |
| **v1.0.44** | Fix: `ALL_UPCOMING_MATCHES` + `ALL_PAST_MATCHES` correctly include domestic IPL arrays alongside international |
| **v1.0.43** | Fix: restore `PLAYERS`, `COMPETITION_STANDINGS`, `slugifyPlayer`, `hasStandings` after a truncation incident |
| **v1.0.42** | Data: pitch reports added for 10 international venues (SCG, MCG, Lord's, Oval, Headingley, Optus, Gaddafi, Nassau, Gabba, SSC) |
| **v1.0.41** | Digest: MOM avatar — BallGIF-style initials circle + `<img>` fallback, plug-and-play for real photos (`5333611`) |
