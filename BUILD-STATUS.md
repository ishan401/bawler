# Bawler Build Status

> Snapshot of what's shipped, what's mocked, what's pending. Updated alongside every deploy.

**Current version:** v1.0.31 (deployed)
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
- ✅ **BallGIF** — two clips (bowler perspective + overhead) 3s each, 4 reps/ball (24s dwell)
- ✅ **Perspective-correct impact Y** — uses trapezoid width ratio (220/80=2.75) for accurate pitch length display
- ✅ **Post-pitch bounce arc** — bezier control above impact point; bounce height scales with pitchY (10–55px)
- ✅ **No SVG filter on animated balls** — feGaussianBlur removed; perf fix; gradient fill preserved
  - ✅ Stick figures with name labels; speed + ball type as text
  - ✅ Exaggerated swing (1.8×) + spin (2.2×) for visual punch
  - ✅ Background tint by outcome (unified palette) — no whitish wash (perspective fix)
  - ✅ Cross-fade between clips (280ms); smooth bg transition between balls (600ms)
- ✅ **Moments strip** — two-zone chips (badge + over top; label + 2-line context bottom); Live chip with pulsing dot
- ✅ **Matchup card** — always-on batter vs bowler H2H below ball visualizer; format-aware (T20I/ODI/Test); all stats merge career H2H + current match live counters (balls/runs/outs/dots/4s/6s); label-value row format (`matches-N 4s-N 6s-N Avg-N SR-N Dots-N%`); `Watch for:` danger delivery on own row; shareable PNG; updates on every delivery including strike rotation
- ✅ **MiniWinProb** — both teams' win% large + bold; gradient area fills; split colour bar; brighten() for dark team colours; namespaced SVG IDs (mwp-fa/mwp-fb)
- ✅ AI metrics tiles — primary value + trend arrow + delta line + plain-English context label
- ✅ Win-prob chart modal — full-screen, two team lines, hue-accurate via `brightColor()`

- ✅ **SpeedChip** — hidden when `ball.ballSpeedKmh` is null (was showing "0 kmh")
- ✅ **Format-aware chase metrics** — `totalBallsForFormat(match)` replaces hardcoded 120; correct for T20/ODI/Test
- ✅ **Insights prop-driven** — `MatchViewProps.insights?: InsightV2[]`; real pages pass `insights={[]}`, mock is default fallback
- ✅ **truncatedMatch innings fallback** — when no balls exist for innings[1], falls back to real `match.innings[1]` values (ScoreBar no longer shows 0/0)
- ✅ **Commentary feed** — colour-coded ball outcomes:
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
- ✅ **Sticky innings header** — team name + innings score sticks below match header while scrolling
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
- [ ] Real domain (off `bawler.vercel.app`)

### Nice-to-have
- [ ] Vitest + RTL tests on `BallGIF`, `DeliveryCard`, `MatchView`
- [ ] Remove legacy unused components (`ViewSwitcher`, `MomentsCollapsible`, `PressureGauge`, `ProjectedScore`, `DemoControls`, `InsightsPanel`)
- [ ] Service worker for offline-cached last-seen match state
- [ ] WCAG colour-contrast audit on `text-dim` values
- [ ] Lighthouse-mobile to 95+ (currently ~88)
- [x] MiniWinProb redesign — completed v1.0.8 (both teams visible, gradient fills)

---

## Recent change log (high-level)

| Version | Highlight |
|---|---|
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
