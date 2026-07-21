# Decisions Log

> Every locked decision and the reason behind it. Search here before re-litigating anything. New decisions get appended at the bottom.
>
> This file consolidates and supersedes the older `open-questions.md` log.

---

## Product & positioning

| # | Decision | Reason |
|---|---|---|
| P1 | **Product name = Bawler** | Working name on `bawler.vercel.app`. May rebrand pre-public-launch. |
| P2 | **Launch target = next available IPL 2026 match** | Use the live tournament as the marketing test window. |
| P3 | **Geographic focus = global (everywhere cricket is watched)** | Diaspora matters. India is the primary market but no geo-blocking. |
| P4 | **Audience = engaged second-screener (22–45)** | Cricbuzz users who're frustrated. Casual fans who want score+result are non-users. |
| P5 | **Marketing positioning deferred** | Product focus first; revisit messaging closer to v2 launch. |
| P6 | **No fantasy integration in v1** | Even passive Dream11 scraping cut. Stay clean. |
| P7 | **No real-money betting** | Regulatory minefield. Use odds as numeric input only. |
| P8 | **Geographic ad targeting deferred to v2** | Run organic for v1 launch. |
| P9 | **Legal counsel deferred** | Acknowledged risk on broadcast / team logos. Revisit pre-scale. |

## Prediction layer

| # | Decision | Reason |
|---|---|---|
| Pr1 | **No in-house ML for predictions** | Saves weeks of work; we can ship in 1 week. Revisit in v3 to remove third-party dependency. |
| Pr2 | **Win probability = scraped bookmaker odds, averaged + smoothed** | Markets are calibrated. Multiple sources for redundancy. |
| Pr3 | **Projected score = formula lookup (CRR × overs remaining + venue par + wickets-in-hand factor)** | Cricsheet historical data is enough. No model needed. |
| Pr4 | **Pressure gauge removed from UI** | Tried, didn't pass comprehensibility test. Concept of "pressure" as a 0–10 score wasn't intuitive. |
| Pr5 | **Replaced pressure with concrete metrics**: Projected, Momentum, Acceleration, Next-wicket impact | Each is a number with a clear meaning. |
| Pr6 | **Win-prob chart events use dots ON the line, NOT vertical lines** | Vertical lines made the chart messy. Dots on the line are cleaner. |

## Stats layer

| # | Decision | Reason |
|---|---|---|
| S1 | **No templated insight engine** | "Nth time in IPL history…" templates feel robotic. If a stat is worth saying, an analyst tweeted it. |
| S2 | **Insights sourced from ~19 curated Twitter analysts + Cricbuzz + ESPN scrapes** | Better quality than auto-generated. Lower build cost. |
| S3 | **Stats and opinions are visually distinct** | Stats: no attribution, plain weight, cyan accent. Opinions: italic, attributed, orange accent. |
| S4 | **Insight feed is chronological**, not source-grouped, mixing balls with stat/opinion notes | Reads like a real feed. First item is whatever was last emitted. |
| S5 | **All numbers shown as numbers, not narratives** | "Bumrah: 2/18 in 3 overs" not "Bumrah is bowling beautifully." |
| S6 | **"Balls" is spelled out everywhere — never "b"** | "12 balls" not "12b". |

## Ball-replay GIF (the hero)

| # | Decision | Reason |
|---|---|---|
| G1 | **GIF is the hero feature** | The visual differentiation moat. Other elements support it, never compete. |
| G2 | **Two-clip system: bowler perspective + overhead** | One clip wasn't enough to show both delivery characteristics and shot direction. |
| G3 | **6-second total loop (3 sec per clip)** | Tight enough not to feel slow; long enough to read both clips. |
| G4 | **4 reps per ball = 24 sec on screen before auto-advance** | Lets users actually look. Real production would push next ball via SSE. |
| G5 | **Stick figures, not 3D humans** | V1 simplicity. Same silhouette for everyone, name labels differentiate. |
| G6 | **Names visible NEXT TO each stick figure** | Bowler labeled at top of pitch, batter labeled at bottom-left. Not just in the corner caption. |
| G7 | **No view switcher in v1** | Tested in v0.5, removed. Two clips alternating is enough. |
| G8 | **Swing curves multiplied by 1.8×, spin by 2.2× for visual punch** | Real-world deviations are too subtle to read at small sizes. |
| G9 | **Background color tints to outcome** | Wicket = red wash, six = purple, four = cyan, dot = neutral. Same palette as ball cards. |
| G10 | **Outcome palette designed for over-summary readability** | A row of 6 ball-dots in an OverSummary should at-a-glance imply good vs bad over. |
| G11 | **No text labels for line / length / height in the GIF** | All visualized via the ball trajectory. Speed and ball-type (variation) are the only text. |
| G12 | **Audio transcription of live commentary CUT from v1** | Was a D4 spike, removed before D1. Video+audio extraction is a v2/v3 contingency only if vendor + Cricbuzz both fail to give coordinates. |

## Layout & navigation

| # | Decision | Reason |
|---|---|---|
| L1 | **Mobile-first, phone-frame even on desktop** | 95 % of usage is on phones. No separate desktop layout. |
| L2 | **Phone-frame is `max-width: 430px` centered on bg-deep on desktop** | Pixel 10 Pro is the design target. |
| L3 | **Home: header + filter + nav (Schedule / Table) + live carousel + 65/35 past/future split** | Mobile-friendly information density. |
| L4 | **Match tabs: Live / Scorecard / Info** | Commentary tab removed — merged into Live. |
| L5 | **Live tab order: GIF → Moments → MiniWinProb → 4 AI tiles → Commentary** | Hero first, then context. |
| L6 | **No manual ball-by-ball scrubber on home or match pages** | Live auto-advance OR jump to a Moment. No play/pause UI. |
| L7 | **Moments are always visible** (not collapsed) | Just below the GIF, horizontal scroll strip. Tap a chip to play that ball's GIF. |
| L8 | **Win-prob chart only accessible via tapping the MiniWinProb chart** | Full-screen modal with slide-up animation. Tap-backdrop-anywhere to close. |
| L9 | **No header tagline ("Every ball, visualized" removed)** | Saves space on the home page. Tagline only used for marketing. |
| L10 | **Single-row header on home: logo + 3 filter pills** | Compact pills (~70 px each) fit on Pixel 10 Pro at 430 px viewport. |
| L11 | **Schedule + Table buttons live on home page** (not on each card) | Per-card placement was redundant. Home-level nav is cleaner. |
| L12 | **Bottom navigation bar replaces header Schedule + Table buttons** (v1.0) | Persistent fixed bottom nav (Home / Schedule / Table) is the standard native pattern. Hidden on `/match/*` routes which have their own back nav. |
| L13 | **All non-match pages use `pb-20`** (v1.0) | Prevents content hiding behind the 80 px fixed bottom nav. |

## Match cards (home)

| # | Decision | Reason |
|---|---|---|
| M1 | **Split-team backgrounds** — team A's color + watermark on left, team B's on right | Visual identification at-a-glance. |
| M2 | **Rank pills on the OUTSIDE of team names** (consistent across past + future) | `#5 RCB ... CSK #3` style. Prior inconsistency confused parsing. |
| M3 | **Highlight badge in TOP-RIGHT corner** (consistent across past + future) | Was overlapping with the result text. Moved out of the way. |
| M4 | **Past cards: no time, only date** | Time is irrelevant once a match is over. |
| M5 | **Future cards: date + time on the same row** | Two adjacent units of info. |
| M6 | **Card height = 148 px for both past + future** (v1.0, was 138) | Increased to accommodate future card's anchor row. |
| M7 | **Past description = 2 lines with ellipsis** | More content density needed. |
| M8 | **Future description = 2 lines with ellipsis** (v1.0, was 3-line no-ellipsis) | Anchor bar takes the bottom slot; description fits in 2 lines above. |
| M12 | **Future card anchor bar** (v1.0) — `bg-black/35` strip at bottom: clock icon + cyan countdown + time + city | Balances card height against past card's result banner in the same slot. `fmtCountdown()` shows "in 2d 14h" / "Starting soon". |
| M9 | **Result banner = prominent, tinted in winning team's color** | E.g. "CSK WON BY 4 WICKETS" on translucent yellow band. |
| M10 | **Live carousel: full-width, half-height, prominent split win-prob bar** | Card itself shows what matters. |
| M11 | **Multiple live matches in carousel** | Snap-scroll horizontal between 1–3 live cards. |

## Filters

| # | Decision | Reason |
|---|---|---|
| F1 | **Pre-filled defaults: Team = KKR, Venue = Kolkata, Tournament = IPL** | Specific values; never the word "All". |
| F2 | **Separate enable mechanism** — circle on left of pill | Filter is OFF by default. Tap circle to toggle. |
| F3 | **Picking a non-default value auto-enables the filter** | Don't make the user toggle twice. |
| F4 | **Dropdown uses fixed-position container + backdrop** | Escapes the overflow-clip parent that was hiding it. Tap-backdrop closes. |
| F5 | **All three filters on a single row** (flex-nowrap, compact pills) | Wrapping looked broken. Truncate value to 8 chars if too long. |
| F6 | **Filter animation is diff-aware** | Only the changed cards animate. Stayers stay put. |
| F7 | **Filter animation timing: 700 ms leave + 900 ms enter, 55 ms stagger** | Slow enough to follow visually. |
| F8 | **Team filter pill shows a glowing color dot** when active (v1.0) — 8 px circle in team's `primaryColor` with matching box-shadow | Immediate team identification without needing to read the text. Implemented via optional `colorFn` on `FilterDef` so other filters don't inherit it. |

## Commentary feed

| # | Decision | Reason |
|---|---|---|
| C1 | **Single chronological feed** mixing balls + stats + opinions | Mirrors a real "feed." First item = whatever's most recent. |
| C2 | **Variable-height ball cards** | Compact ribbon (~36 px) for dots / runs / extras; full card (~110–140 px) for wickets / 4s / 6s. |
| C3 | **Full cards have a 78 × 96 px mini-GIF on the right (30 % of card width)** | Communicates pitch + shot at a glance. Doesn't bloat the card. |
| C4 | **Speed shown as a colored number** (cyan ≥ 145, white ≥ 135, orange ≥ 115, purple < 115) — no "Speed:" label | Color encodes pace family. |
| C5 | **Ball type shown as a colored dot + variation name** — no "Type:" label | Dot color = ball family (cyan swing, purple spin). |
| C6 | **Length / line / height / aerial info removed from text** | Visible in the mini-GIF. |
| C7 | **Over change marked by an OverSummary pill** | Six color-coded dots + over total. Acts as visual transition + summary. |
| C8 | **Exciting balls get an "extra narrative" paragraph** inside the card with a left-border indent | Adds visual weight to important moments. |

## Win-prob chart

| # | Decision | Reason |
|---|---|---|
| W1 | **MiniWinProb is inline by default** on the match page | No separate "open chart" button needed. |
| W2 | **MiniWinProb shows just two lines + 25/50/75 % gridlines** — no events, no labels | Condensed. Stays under 70 px. |
| W3 | **Tap MiniWinProb expands to full-screen** with slide-up animation | Sm0oth transition into detail view. |
| W4 | **Full chart events = colored dots ON the team-A line** (not vertical lines) | Vertical lines were cluttering the chart. |
| W5 | **Events listed in a strip below the chart**, with color + over + label + context | Clean spatial separation. |
| W6 | **Three zoom levels: Match / Innings / Recent** | Tap buttons or pinch on touch devices. |
| W7 | **Multiple ways to collapse the chart**: drag-handle at top, Collapse button in header, backdrop tap | Generous tap targets. |
| W8 | **Removed momentum-swing markers from chart events** — only Wicket, Six, Milestone, Big-over, Phase-shift | The momentum-swing markers were noisy and overlapped. |

## Match info tab

| # | Decision | Reason |
|---|---|---|
| I1 | **Pitch report is a first-class card** with sliders for pace, spin, bounce + expected score range + dew + plain-language bullets | Pitch info is "criminally under-discussed in cricket." |
| I2 | **Lineups shown side-by-side**, batting order + bowlers used | Compact two-column layout. |

## Tech & infrastructure

| # | Decision | Reason |
|---|---|---|
| T1 | **Bawler runs on AWS** (matches Shownex's cloud) | Shared IAM, VPC, billing, team muscle memory. |
| T2 | **Separate project in same AWS account** | Failure isolation; Bawler crashes don't touch Shownex. |
| T3 | **Stack: Next.js 14 + TypeScript + Tailwind, deployed to Vercel** | Standard, fast iteration via Vercel auto-deploy. |
| T4 | **Database: Postgres (managed)** + **Cache: Redis** | Production setup; mocked in v1. |
| T5 | **Real-time delivery: Server-Sent Events (SSE)** | Sub-second updates, one-way data. WebSocket overkill. |
| T6 | **Hybrid scraping**: Playwright (free, easy targets) + paid anti-bot service for Cloudflare-protected sites | ~$30-80/mo total. |
| T7 | **Audio transcription: Deepgram primary, Whisper fallback** (only if needed) | Streaming + Indian English handling. |
| T8 | **Analytics: PostHog (free tier)** | Funnels, cohorts, session replays. |
| T9 | **Error tracking: Sentry → WhatsApp/SMS** | Solo founder needs phone-level alerts. |
| T10 | **CI/CD: GitHub Actions; deployment to Vercel via Git push** | Free, standard for Next.js. |
| T11 | **CDN: Cloudflare free tier** | Static asset caching + DDoS protection. |
| T12 | **Failure handling: smart fallbacks** — Cricbuzz dies → ESPN serves; odds market dies → formula-only win prob | Critical for engagement metric. |
| T13 | **Replaced Recharts with hand-written SVG charts** | Saves ~90 KB First Load JS. |
| T14 | **No localStorage / sessionStorage** | Per Next.js + Vercel best practice in app router. State is React-only. |

## Data sourcing

| # | Decision | Reason |
|---|---|---|
| D1 | **Primary data vendor: Roanuz Cricket API** | India-based, IPL-focused, has Ball-Tracker product. |
| D2 | **Backup: Cricbuzz scraping** | Free, has coordinate data, redundant for vendor failure. |
| D3 | **Vendor budget ceiling: $1000/mo** | Falls back to pure scraping if exceeded. |
| D4 | **Bookmaker odds scraping confirmed OK** | Public odds, no facilitation of wagering. |
| D5 | **Twitter analyst list: 19 curated accounts** via Nitter (top of `data-sources.md` § D) | Better signal than open Twitter firehose. |
| D6 | **Historical data: Cricsheet free dataset** | 5+ seasons of ball-by-ball; powers par-score table + insight aggregation. |
| D7 | **De-scope: no deep player career-stats screen

## Live match experience (home page)

| # | Decision | Reason |
|---|---|---|
| LM1 | **TABLE button is dynamic — appears only for the currently snapped live card** | Showing all league TABLE buttons at once was noisy. The button tracks the snap position and shows only the relevant competition. |
| LM2 | **Standings and team schedule open as bottom sheets, not page navigation** | Leaving the home page to view standings interrupts the live match context. Sheets overlay without losing scroll position. |
| LM3 | **Team schedule popup shows all matches ascending (past → live → future)** | Chronological order lets the viewer read the story of the tournament for that team. |
| LM4 | **Swipe-down gesture restricted to handle/header only** | Putting gesture on the full sheet captured content scroll touches, making the list unscrollable. Header-only drag is the native pattern (iOS sheets). |
| LM5 | **Body scroll locked (`overflow:hidden`) when any sheet is open** | Without lock, touch events bubbled to the page and scrolled the background instead of the sheet content. |
| LM6 | **Sheet content uses `min-h-0` + no `overflow-hidden` on outer container** | `flex-1 + overflow-y-auto` without `min-h-0` causes the div to expand rather than scroll — a well-known CSS flex bug. `overflow-hidden` on the outer container additionally blocked the inner scroll. |

## Score and data correctness

| # | Decision | Reason |
|---|---|---|
| SC1 | **`battingTeam` field is the single source of truth for innings attribution** | Array position (`innings[0]` = teamA) breaks when the visiting team bats first after winning the toss. The `battingTeam` string on each innings object is always correct. |
| SC2 | **Test match live cards show prior innings score before current: "199/10 & 88/4"** | Standard cricket scoreboard notation. Readers need both innings to understand the match state. Only applied when team has `≥ 2` innings in the array. |
| SC3 | **Worldwide popularity formula: `COMP_POP + TEAM_POP(A) + TEAM_POP(B)`** | Simple additive score that surfaces India-involving matches and top leagues first — matches what a global cricket audience would instinctively want to see. |

## Schedule + navigation

| # | Decision | Reason |
|---|---|---|
| SN1 | **Schedule root = competition list, not match list** | The old flat match list with filter chips was overwhelming. Grouping by competition is how fans think ("I want IPL matches", not "show me all T20s"). |
| SN2 | **Country flags via `flagcdn.com/w40/{iso}.png`, not emoji** | Flag emoji are invisible on Windows (regional indicator sequences not rendered). PNG images work on all platforms. `w40` endpoint (40px) is sharp on HiDPI. |
| SN3 | **Playing XI = flat list, no batting/bowling sub-sections** | Sub-sections added visual complexity without adding information. A single list of 11 names is what fans actually want during a live match. |


## Real-data architecture

| # | Decision | Reason |
|---|---|---|
| RD1 | **`competition.hasStandings` boolean instead of `type` check** | `type === "international"` is ambiguous — World Cups have group tables, bilateral series don't. A single explicit boolean makes every new competition unambiguous and keeps the UI logic simple. |
| RD2 | **`COMPETITION_STANDINGS` keyed by `competition.id` in mockData** | Standings are now a data concern, not a component concern. Swapping mock for real API data = one variable. Components are pure consumers. |
| RD3 | **`CompetitionStandings` carries column config (`showNrr`, `showDrawn`, `qualifyingSpots`)** | IPL uses NRR; Test standings use Drawn; some formats use win %; number of qualifying spots varies (2 for ICC groups, 4 for IPL). Config lives with the data, not hardcoded in the component. |
| RD4 | **`phase?` field on Match + `CompetitionStandings`** | ICC tournaments have multiple phases (Group → Super 8 → Knockout). Same competition ID, different phase = different standings. The field lets us render "Group A standings" vs "Super 8 standings" for the same tournament. |
| RD5 | **`transformers.ts` — typed skeletons for Cricbuzz, ESPN, SportRadar** | When real API access lands, the mapping contract is already defined. The developer fills in TODOs; the internal type system stays stable. Raw types are intentionally partial — only the fields we actually read. |
| RD6 | **`netRunRate` made optional on `StandingsRow`** | Test series standings don't have NRR — they use points only. Making it optional + using `?? 0` guard everywhere means the same `StandingsRow` type works across all formats without a union type. |
| RD7 | **ID lookup tables (`CRICBUZZ_SERIES_ID_MAP`, `SPORTRADAR_TEAM_ID_MAP`) in transformers.ts** | External APIs use numeric/UUID identifiers; internal types use short string codes ("MI", "ipl-2026"). The lookup table is the seam between external and internal. Maintained alongside the transformer, not scattered across components. |
| RD8 | **`DigestTab`'s per-card cache (`DigestCardCache`, v1.0.81) assumes real feeds are append-only — no invalidation path for a backfilled correction to a past ball** | Once a Test session/day-summary/over-chunk is built and marked complete, the cache reuses that exact object on every later recompute instead of rebuilding it (this is what makes the Digest tab cheap to re-render on a live tick — see the v1.0.81 entry below). That's only correct if a real feed never retroactively edits a ball that's already part of a "complete" card — e.g. a DRS overturn changing a dismissal after the fact, or a scoring correction. If that ever happened, the stale version would keep showing until either the user reloads the page or navigates off the Digest tab and back (both fully unmount `DigestTab`, which re-creates the cache from empty — it's a plain in-memory `useRef`, never written to `localStorage`/`sessionStorage`/any server store, so it cannot outlive the current mount). Documented as an accepted assumption rather than engineered around: real live-score feeds are essentially always append-only in practice, and building real invalidation logic against a correction pattern we've never observed isn't worth the complexity yet. If a real integration ever proves otherwise, the cache would need either a version/edit-timestamp per ball or an explicit "invalidate this card" signal from the feed. |

## Test Championship (WTC)

| # | Decision | Reason |
|---|---|---|
| WTC1 | **`championship?: Competition` on Match — additive, not replacing `competition`** | A bilateral series (Ashes) is still its own competition with its own schedule. WTC is a layer on top. Separating them lets us show bilateral schedule + WTC standings independently. |
| WTC2 | **TABLE button uses `championship` first, falls back to `competition`** | Bilateral series have `hasStandings: false`, so the TABLE button was invisible for all Test matches. `championship` provides the standings context without touching the bilateral competition. |
| WTC3 | **`TeamScheduleSheet` filters by `competition.id OR championship.id`** | A team's WTC schedule spans multiple bilateral series. Filtering by championship ID collects all their Test matches regardless of which series they're in. |
| WTC4 | **PCT% column instead of NRR for WTC** | Test cricket has no run rate concept for multi-series standings. PCT (points won / max available × 100) is the ICC's official WTC ranking metric. |
| WTC5 | **`showDrawn: true` for WTC, `showNrr: false`** | Drawn matches are frequent and meaningful in Test cricket (3 draws = 12 pts, same as 1 win). NRR is irrelevant. Column config is per-competition so T20 leagues are unaffected. |
| WTC6 | **`qualifyingSpots: 2` for WTC** | Only top 2 nations qualify for the WTC Final (held every 2 years). Qualification bar renders automatically at position 2. |

## Auto-championship resolution

| # | Decision | Reason |
|---|---|---|
| AC1 | **Championship resolved from a lookup map, not from the match payload** | Cricket APIs return a `series_id` per match, not a championship ID. The mapping (series → championship) is maintained by us based on ICC's official announcements. This keeps the transformer stateless and the lookup auditable in one file. |
| AC2 | **One `CHAMPIONSHIP_MAP` per API vendor** (`CRICBUZZ_CHAMPIONSHIP_MAP`, `ESPN_CHAMPIONSHIP_MAP`, `SPORTRADAR_CHAMPIONSHIP_MAP`) | Each vendor uses its own series ID namespace. A single shared map would create ID collisions. Separate maps also make it obvious which vendor's IDs need updating when a new cycle starts. |
| AC3 | **Map is filled once per WTC cycle (~27 entries), not per match** | The ICC publishes the full list of WTC-contributing series at the start of each cycle. Onboarding a cycle = one batch lookup, not ongoing maintenance per match. |
| AC4 | **`championship` stays `undefined` if series ID is not in the map** | Non-WTC Test matches (e.g. Afghanistan vs Zimbabwe), Associate member Tests, and all white-ball matches naturally produce no championship. No special-casing or negative lists needed. |
| AC5 | **`allCompetitions` passed into `transformCricbuzzMatch()` rather than imported** | Avoids a circular import between `transformers.ts` and `mockData.ts`. The caller (API layer) owns the competition registry and injects it. |

## PP (Player Profiles) — v1.0.20

**PP1 — Route strategy: `/player/[id]` SSG page**
Decision: Use Next.js static route `app/player/[id]/page.tsx` with `generateStaticParams()` over `PLAYERS`. Player IDs are URL-safe slugs (e.g. `v-kohli`, `j-bumrah`). `notFound()` on miss. Chosen over a drawer/sheet pattern so the native browser back gesture (iOS left-edge swipe, Android hardware back) works without any custom code.

**PP2 — Back button always calls `router.back()`**
No custom history stack. `router.back()` in Next.js App Router restores the previous scroll position and handles all entry points (Scorecard link, CommentaryFeed, Match card, etc.) uniformly.

**PP3 — `slugifyPlayer()` + `resolvePlayerSlug()` separation**
`slugifyPlayer(id)` normalises any raw string → URL-safe slug (lowercased, spaces→hyphens, strip non-alphanumeric). `resolvePlayerSlug(id)` additionally checks `PLAYER_ALIASES` for legacy/alternate IDs (e.g. "rsharma" → "r-sharma"). Scorecard calls `resolvePlayerSlug(row.playerId)` so aliased IDs from live data still resolve to the correct profile.

**PP4 — Commentary player names NOT linked (yet)**
`Ball.batterName` / `Ball.bowlerName` are display strings only — no `playerId` attached. Linking them would require a `Ball` type change (`batterId?`, `bowlerId?`) and re-hydration from the live API. Deferred to the real-data integration phase.

**PP5 — Stats grid layout: 4-column divide-x**
Each format shows two 4-column grids: (Mat, Runs/Wkts, Avg, SR/Economy) + (HS/Best, Inn, 100s/5W, 50s/-). `BattingStats` and `BowlingStats` are separate sub-components that return `null` when no data of that type exists — all-rounders get both, pure bowlers get only bowling.

**PP6 — 18 player profiles seeded in mockData**
Profiles cover: Kohli, R Sharma, Bumrah, S Gill, H Pandya, SKY, Jadeja, Ashwin, Chahal (India); Stokes, Root, Duckett, Crawley (England); P Cummins, Hazlewood (Australia); A Russell (WI); Babar Azam (Pakistan); Buttler, Boult, D Miller, Arshad Iqbal. Each has bio, role, batting/bowling style, ICC rankings, and per-format stats.

---

## Real-data audit fixes — v1.0.21

**RDA1 — `ALL_TEAMS` is the correct lookup for any team code, not `TEAMS`**
`TEAMS` is a subset containing franchise teams only. `ALL_TEAMS` merges `TEAMS` + `NATIONAL_TEAMS`. Any component that does `TEAMS[innings.battingTeam]` will return `undefined` for international matches — silently breaking team names, colours, and flags. Rule: always import and use `ALL_TEAMS`.

**RDA2 — SpeedChip should be absent rather than wrong**
Showing "0 kmh" when `ball.ballSpeedKmh` is null is misleading — it implies the ball was measured at 0 rather than not measured. Returning `null` from the component is the correct UX: the space simply doesn't render.

**RDA3 — Chase metric total balls must be format-aware**
Hardcoding `120` for balls-left calculation means ODI and Test chase math is wrong by a factor of 2.5× and 3.75× respectively. `totalBallsForFormat(match)` centralizes the format constant in one place and auto-adapts when real match data flows in.

**RDA4 — `truncatedMatch` must fall back to real innings values when truncBalls is empty**
The ball-scrubber rebuilds innings objects from the truncated ball array. When no balls exist for an innings (user scrubbed before it started), computed `runs=0/wickets=0/overs=0` replaces real data. The fallback to `match.innings[1].runs/wickets/overs` preserves correct display for the pre-innings state.

**RDA5 — Insights must be prop-driven, not module-level hardcoded**
`MOCK_INSIGHTS_V2` imported at module level means every match page sees the same mock insights regardless of any prop. Making `insights` a prop with `MOCK_INSIGHTS_V2` as the default gives real data pages a clean override path.

---

## Home & UX decisions — v1.0.22 to v1.0.24

**UX1 — Flag images for international match backgrounds, not jersey colours**
National teams don't have jersey colour codes in the same way franchise teams do. Their "identity" is the nation's flag. Using `flagcdn.com` PNG images (free, no auth, 200+ countries) provides a recognisable visual signal that's impossible to confuse with franchise matches. Desaturation keeps the card readable.

**UX2 — Filter chips removed from homepage header**
At current match volume (mock data, ~15 matches), filter chips added UI complexity with no practical benefit — users could see all matches without filtering. The filter layer will be reintroduced as a search/sort pattern once real data produces match counts where filtering is genuinely useful (50+ matches).

**UX3 — Series status as a one-line chip, not full standings**
Bilateral international series don't have league tables — they're just X–Y in a N-match series. A one-line chip (`"AUS lead 1-0 · 5-match T20I series"`) gives the fan the context they need in 5 words without the overhead of a standings bottom sheet. Populated from `match.seriesStatus` — a string field set by the data layer.

---

## Score display — v1.0.22 to v1.0.23

**SD1 — Projected score only in 1st innings, non-Test**
Projections in a chase are meaningless (target is fixed) and Test projections span multiple days with weather/declaration variables. Only T20/ODI 1st innings get a projection. The formula uses ball-data CRR × overs remaining + venue par adjustment + wickets-in-hand factor. Falls back to pure formula when no ball data.

**SD2 — CRR labelled with batting team code, not generic "CRR"**
"MI CRR 7.11" is more scannable than "CRR 7.11" when two teams' scores are both visible. The batting team code makes it unambiguous which team's run rate is shown.

**SD3 — AI metrics row removed entirely**
The metrics tiles (Momentum, Acceleration, Pressure, Next-wicket impact) were synthetic scores derived from mocked formulas. On real data they would need calibration against historical outcomes. Removed to reduce visual noise and avoid misleading numbers. Replaced by projected score + CRR which are both interpretable without calibration. (`AIMetrics.tsx` and `lib/metrics.ts` were left in the codebase, unreferenced, until the doc audit on 2026-07-10 flagged them as dead code — see cleanup list in BUILD-STATUS.md.)

---

## Complete cricket app — v1.0.25 to v1.0.26

**CA1 — `franchiseStats` / `franchiseLeague` instead of `iplStats`**
The platform supports IPL, PSL, BBL, The Hundred, SA20, and any future franchise league. Hard-coding `iplStats` as a field name signals IPL-only intent to any developer reading the types. `franchiseStats` + `franchiseLeague: string` makes the pattern extensible: each player profile stores which league their franchise stats came from, so the UI can label the tab "IPL" or "BBL" per player without special-casing.

**CA2 — Multi-competition Table page replaces IPL-only table**
The old `/table` page had "IPL 2026" hardcoded in the header and only rendered IPL standings. Now it's a tabbed view across all 8 competitions in `COMPETITION_STANDINGS`. Adding a new competition = one entry in `DISPLAY_ORDER` and one entry in `COMP_LABELS`. The `StandingsTable` sub-component already handles NRR / PCT / Drawn column variants dynamically.

**CA3 — App meta description reflects all-cricket scope**
The previous description called Bawler an "IPL match companion". This anchors user expectations and SEO to IPL only. The new description (`"All cricket, every ball, visualized — live scores, ball-by-ball replays, win probability and player stats across every format."`) is accurate and format-agnostic.

---

## Live features — v1.0.28 to v1.0.31

**LF1 — Matchup card always-on, not on wickets only**
Initial design only showed the matchup card after wickets. Rejected because a batter taking a single rotates strike — the matchup changes immediately. Making it always-on (driven by `currentBall.batterName` and `currentBall.bowlerName`) is simpler, more accurate, and requires zero special-case state. The card updates automatically on every delivery.

**LF2 — Career H2H stats merged with live match counters**
The matchup card stats (balls/runs/outs/dots/4s/6s) combine career H2H (from `mockMatchups.ts`, later real API) with current-match counters computed from `allBalls`. This is computationally free (pure `useMemo` over existing state), zero extra API calls, and gives users live accuracy on top of historical context. The display formula is `total = career + liveCounter` for each field.

**LF3 — Partnership tracker replaces win-prob footer in BallGIF**
Win probability was shown in the BallGIF footer but was showing wrong values (see WP1 below). Replacing it with a partnership tracker is strictly more informative: it tells the fan who is batting, how they are doing together right now, and resets correctly on wickets. Win prob is still available in the dedicated WinProbChart tab — no information is lost.

**LF4 — Non-striker run-out detection via look-ahead**
When `isWicket: true` and `dismissalType === "run-out"`, the partnership should only reset if the STRIKER was dismissed. Detection: if the ball immediately after the wicket has the same `batterName`, the striker survived → non-striker run-out → no reset. This is a one-line look-ahead in the `partnershipInfo` useMemo and handles ~3-4 such events per tournament with zero false positives.

**LF5 — `normaliseName()` at API boundary, not at display time**
Player names from different APIs (`"Virat Kohli"`, `"V Kohli"`, `"kohli, virat"`) would break matchup lookups and partnership grouping if not normalised. Normalising at the transformer layer (ESPN/Sportradar) means all downstream code — matchup card, partnership tracker, player links — receives consistent `"I Surname"` format without any conditional logic inside components.

**WP1 — Win prob chase formula: power curve, single wicket term**
The old formula had two independent wicket penalties stacked: (1) a linear `achievableRPO` that underestimated chasing team headroom, and (2) a separate `wicketPenalty` multiplier on the final probability. Together they made easy chases look much harder than they are (IND needing 21 off 22 showed 31% when it should be ~83%). Fix: one power-curve term `baseRPO × (wicketsLeft/10)^0.25` encodes wickets once. The steeper sigmoid (5 vs 3) gives crisper probability swings on boundaries and wickets. All components read from the single `calculateWinProbForMatch()` function so the fix applied platform-wide automatically.

---

## Digest tab — v1.0.35 to v1.0.40

**DG1 — Separate "Digest" tab, not inline in Live tab**
Digest is a distinct reading mode — the fan wants to catch up on what happened, not watch the live ball. Mixing digest cards into the Live feed would break the chronological "newest first" live experience. A separate tab keeps both modes clean and lets the fan switch intent deliberately.

**DG2 — Format-adaptive grouping: 1 per over (T20), 5 overs (ODI), per session (Test), 10 overs (Test fallback)**
The natural unit of cricket drama maps to format: in T20 every over matters; in ODI a 5-over block is a meaningful phase; in Test cricket a session (1.5–3 hours of play) is the real atomic unit — nobody talks about "over 27" in a Test, they talk about the afternoon session. The 10-over fallback handles Test data where session metadata isn't available.

**DG3 — Session-based grouping for Test (not fixed-over)**
ICC session names (1st Session, 2nd Session, 3rd Session) are the lingua franca of Test cricket coverage. A "Day 2 2nd Session: 42/3" card is instantly meaningful to any Test fan. Over-based grouping (overs 29–38) carries zero narrative weight. Sessions win.

**DG4 — `deriveTestSessions()` auto-derivation from timestamps**
Real cricket APIs (Cricbuzz, ESPN) don't always return session metadata. Gaps > 60 minutes in ball timestamps = session break; gaps > 720 minutes = new day. This heuristic is accurate enough for digestible grouping and degrades gracefully — the Digest tab works regardless of whether the upstream source provides session structure.

**DG5 — Day filter chips only when ≥ 2 days have data**
Showing a single "Day 1" chip is noise — it filters to the only content that exists anyway. Single-day Test matches (a dramatic collapse on day 1) show no chips and just list all session cards. Chips appear on day 2+ of a multi-day match when they actually save the user scroll time.

**DG6 — Innings chips only when both innings have ball data**
Same logic as DG5. An "1st Innings" chip when there's no 2nd innings data is meaningless. The chips appear when the user would actually benefit from switching views — after the first innings is complete and ball data for the second has started coming in.

**DG7 — Default to latest day / latest innings**
A fan opening the Digest tab mid-match wants to see what just happened, not what happened yesterday. Defaulting to the latest active day or innings respects that intent. The fan can tap "Day 2" to scroll back.

**DG8 — Post-match summary card always pinned, not hidden by day/innings filter**
The match summary card is the post-match verdict — it sits above all per-over/session detail. Hiding it when the user switches to "Day 2" or "1st Innings" would make it feel ephemeral. It's always visible at the top regardless of the active filter.

**DG9 — Match summary card condition: `match.result` (not `status === "post-match"`)**
The `FEATURED_MATCH` (KKR vs MI) keeps `status: "live"` intentionally — it appears in the live carousel even though the match is over. Checking `status === "post-match"` would permanently hide the summary card for the one match that has full ball data and a result. The correct guard is `!match.result`: if a result exists, the match is over, show the card.

**DG10 — Shareable PNG export per card, not per tab**
Users share specific moments, not entire digests. A "Share all" button would produce an unreadable image. Per-card share (with `html-to-image` capture of exactly that card element) produces a clean, targeted shareable for WhatsApp / Twitter. The card's `data-digest-card` attribute scopes the capture precisely.

**DG11 — MOM avatar: real photo + initials fallback (same as BallGIF PlayerAvatar)**
The match summary card needed the MOM to feel like a person, not a name string. The BallGIF already had a proven initials-avatar pattern (2-letter initials, team colour circle). Reusing the same visual language unifies the product. Real photo URLs can be wired in platform-wide when the player image CDN is integrated — no component change needed, just `photoUrl` on `PlayerProfile`.

**DG12 — W/4/6 chip player reveal: deferred (no photoUrl in data layer yet)**
Tapping the W/4/6 chips on a digest card to reveal who got out / hit the six was built and immediately reverted. The UX is good in concept but hollow without player photos — initials-only popups feel like a debug view. Decision: ship it only when `photoUrl` is wired into the data layer so the reveal shows a real face.

**DG13 — Card narrative is factual, over-summary is creative**
Row 2 of each card is a tight factual descriptor ("Two wickets — collapse!", "Bumrah strikes", "Big over — 18 runs"). Row 3 is the punchy cricket-flavour creative line ("Dew is helping the seamers probe the top order" etc.). Keeping them in separate rows maintains scannability: the fan can read row 2 in 0.5 seconds; row 3 rewards a deeper read. Mixing them would blur the information hierarchy.


---

## Live UX polish — v1.0.45 to v1.0.47 (2026-07-10)

**LP1 — Speed label removed; colour alone signals pace, everywhere**
BallGIF/MiniBallGIF's info bar showed a text label ("Fast · 135 KMH") before the speed number, while the commentary feed already conveyed pace via colour alone with no label. This was an inconsistency, not a deliberate choice — the GIF's label violated the platform's own rule that colour is supplementary but sufficient (see Accessibility in DESIGN-SYSTEM.md). Fix: drop the word label in `formatVariation()`/`typeStyle()` across `BallGIF.tsx`, `MiniBallGIF.tsx`, and `DeliveryCard.tsx` so all three surfaces agree.

**LP2 — Moments strip blank-chip bug: `align-items: stretch` default, not missing data**
The leftmost Moments chip sometimes rendered as an empty coloured block. Root cause was a CSS flex layout bug (children stretched to a taller sibling's height without content to fill it), not a data or "live placeholder" issue as originally suspected. Fixed with `self-start` on the chip. Documented because the initial hypothesis (missing live-chip content) was wrong — worth remembering the actual root cause was layout, not data.

**LP3 — Win-Prob: chip in mini-insights bar, single leading team + %, not both teams**
Win-Prob was pulled out of its own standalone card (redundant screen real estate below the Moments strip) and folded into the mini-insights bar as a 4th chip, matching the batters/bowler chips already there. Considered widening the chip to show both team codes + % once space was tight, but this was rejected: the whole point of the insights bar is a fixed-height, non-scrolling single row — showing both teams would either force scrolling (rejected outright, defeats the format) or require shrinking other chips below usable width. A single leading-team chip (`IND 89%`) with tap-to-expand to the existing full WinProbChart modal preserves the full detail on demand without compromising the row. No information is lost, just the always-visible view was made leaner.

**LP4 — All mini-insights bar chips get max-width + truncation**
Once Win-Prob joined batters + bowler in the same row, a long player name or a deep-innings score string could overflow or wrap the row and break the fixed-height bar. Every chip (`MiniChip`) now gets a fixed `max-w-[118px]` with ellipsis truncation — a platform-wide guard rather than a one-off fix, so future chips added to this bar inherit the same safety.

**LP5 — Matchup card collapses to a one-line teaser by default, instead of being cut**
The always-on batter-vs-bowler card was flagged as a real apprehension: screen space cost vs. value, and a feature that skews toward the "stats-nerd" persona (PRD's tertiary/fantasy-adjacent audience) rather than the primary "always-on cricket fan" who wants context, not depth. The options were cut it entirely, or keep it always-on. Chosen instead: collapse to a ~40px one-line teaser (team-coloured dot + batter vs bowler + chevron) that expands in place on tap. This keeps the feature available for the personas who value it (secondary/tertiary) without imposing its screen cost on the primary persona who doesn't look at it every ball. No data, live-merge logic, or share export changed — purely a display-state wrapper on top of the existing card.

**LP6 — ScoreBar competition badge hidden for bilateral series only**
The "IND V AUS"-style badge above the score was redundant for bilateral series — the two team names are already the entire competition. It is NOT redundant for leagues/tournaments (e.g. "IPL", "ICC T20 WC") where neither team name implies the competition. Fix is scoped to `match.competition.type !== "bilateral"` rather than removing the badge outright, so the disambiguation value is preserved where it's real.

**LP7 — BallGIF Share button relocated into the info-bar chrome, not removed**
The Share button (highlight balls only — wicket/4/6) was floating on top of the pitch/field visual itself, at exactly the moment the visual matters most. Rather than removing Share from BallGIF (it's a real, used export flow), it moved into the existing bottom info-bar row next to the outcome badge — same visibility, same "highlight balls only" trigger condition, zero overlap with the visual. Confirmed on a live wicket ball via browser verification.

**LP8 — Dedicated Moments "Live" chip removed; "Back to live" link is the only live-status affordance**
The Moments strip had a permanent pulsing "Live" chip as its leftmost item, functionally overlapping with the header's existing "Back to live" text link (both let the user return to the live ball). Two controls doing the same job is clutter. The chip was removed; "Back to live" remains as the sole affordance. `isLive`/`onSelect` props stay in use elsewhere (header button, `EventChip`'s `active` state).

**LP9 — Commentary feed per-ball Share removed entirely — reverses CL2**
CL2 (above) originally justified putting Share on every commentary ball, including dots and non-highlight deliveries, on the theory that users share ordinary balls too (a maiden over, a specific delivery to discuss). That reasoning is explicitly superseded: Share is now removed from `DeliveryCard`'s compact rows and full cards entirely. Share still exists at the BallGIF level (highlight balls, relocated per LP7), the Moments strip (per-event story cards), the Matchup card, and the Digest tab — so no export capability was lost overall, it was consolidated away from "every single ball row" toward "curated moments." `MiniShareIcon()` in `DeliveryCard.tsx` was deleted as dead code alongside the button removal (confirmed no external usages before deleting).


---

## Scorecard team/innings selector + batter sparkline — v1.0.48 (2026-07-14)

**SC1 — Not-out duplicate text fixed at the render condition, not in mock data**
Every not-out batter showed "not out" twice: once from a hard-coded `dismissal: "not out"` string literal that `mockData.ts` sets on ~20+ not-out entries, and once from a separate `!row.out` branch that also prints "not out". Rather than touching every one of those mock entries, the fix is a single guard at the render site: the real-dismissal line only shows when `row.out && row.dismissal`. This covers every match automatically, including future ones, without depending on mock data staying disciplined about never setting `dismissal` on a not-out row.

**SC2 — First innings-selector attempt fully reverted on request, not iterated**
An initial "one chip per innings, reusing a new shared `FilterChips` component" design shipped, then was reverted outright (`git revert`, not a rewrite) the moment the user said "revert this" — no attempt to salvage or repurpose the shared component. The very next request described a materially different interaction (two-team toggle, not innings chips) for non-Test formats, confirming the revert was the right call: iterating on the wrong shape would have wasted more effort than a clean revert + fresh build.

**SC3 — Two-team toggle for non-Test, separate per-innings chips for Test — not one shared selector**
T20/ODI/Hundred always have exactly one innings per team, so "which team" and "which innings" are the same question — a two-item toggle maps perfectly. Test can have up to 4 innings (each team can bat twice), so a team toggle can't address a specific innings unambiguously. Rather than force one component to handle both shapes, `Scorecard.tsx` branches by `match.format === "Test"` early and renders two purpose-built components (`TeamToggle`, `TestInningsChips`) sharing only the visual chip styling, not the selection logic.

**SC4 — Chip visual styling converged to byte-identical DigestTab markup after 3 rounds of "still too big"**
The team toggle went through a grid-of-blocks → padded pills-with-dot → final byte-identical-to-DigestTab styling progression, each round shipped and rejected as still visually heavier than Digest's own filter chips. The lesson (worth keeping): when a user says "make it like X", matching X's *classNames exactly*, not just its general proportions, is the only way to guarantee equivalent visual weight — approximating "similar-looking" styling reliably undershoots how strict the comparison is.

**SC5 — Even byte-identical chips still looked bulkier than Digest's — because the surrounding layout, not the chip, was the problem**
After the chip markup matched Digest's exactly, the user still reported Scorecard's chip row eating more vertical space. Root cause was a `space-y-4` wrapper plus a phantom empty `<div ref={topRef} />` sibling adding two extra 16px margins Digest's layout didn't have. Fix was entirely layout (remove `space-y-4`, move the ref onto the chip wrapper directly, manual `mb-3`/`pb-3` matching Digest's own spacing) — no change to the chip component itself. Worth remembering: "this component looks bigger than that one" complaints can be about the container, not the component.

**SC6 — `teamInningsOccurrence()` extracted once both Scorecard's innings-card header and its Test chip labels needed the same number**
Scorecard's innings-card header showed "Innings 3" for a team's 2nd Test innings (the global position in `match.innings`), while the chip directly above it correctly showed "Inn. 2" (an ad-hoc per-team occurrence count computed inline in `TestInningsChips`). Cricket has no concept of a team's 3rd/4th innings — only 1st/2nd. Rather than duplicate the occurrence-counting logic a second time in the header, it was extracted to `lib/formatUtils.ts` as `teamInningsOccurrence()` and wired into both call sites, plus DigestTab's match-summary label and over-group/session `inningsLabel` builders, which had the identical bug (a team's 2nd innings mislabeled "3rd Inn"/"4th Inn" based on global order). One shared function instead of four independent reimplementations of the same "which innings is this for this team" count.

**SC7 — Sticky innings header offset measured live via ResizeObserver, not a second hardcoded px value**
The Scorecard innings header's `sticky` offset was a hardcoded `top-[148px]`, tuned against T20's fixed-header height. Test's `ScoreBar` omits the RRR/chase-context row (only shown during a limited-overs run chase), making Test's real header shorter — so the hardcoded value left a gap once scrolled, specific to Test. The tempting fix was a second hardcoded constant for Test. Rejected: the header's height already varies by format *and* match state (the chase row appears/disappears mid-match, ODI/Test show a format badge T20 doesn't), so any fixed number is fragile in ways not yet discovered. `MatchView.tsx` now measures the sticky header's real rendered height via `ResizeObserver` and exposes it as a `--sticky-header-h` CSS variable; Scorecard reads that instead of guessing.

**SC8 — Batter sparkline reuses WinProbChart's "event dot on a line" idiom, but simplified for a 20px-tall context**
The request was explicit about reusing the existing win-prob dot pattern rather than inventing a new one. The literal pattern (glow-ring + solid dot + white center, three stacked circles) was tried first and looked muddy at ~20px height — appropriate for WinProbChart's ~500px canvas, not for an inline sparkline. Kept the *concept* (colored dot marks a boundary directly on the line, same cyan-four/six-purple palette) but simplified the rendering to a single ring for legibility at this scale, and added Catmull-Rom smoothing (same technique WinProbChart already uses for its own line) plus point down-sampling, since a raw ball-by-ball polyline for a 50+ ball Test innings read as jagged noise rather than a trend.

**SC9 — Not-out glow moved off the `<tr>` onto a rounded inner wrapper — `excitement-glow` reused verbatim once relocated**
Applying the existing `.excitement-glow` class (already used on high-excitement `MatchCard`s) directly to the batter row's `<tr>` was tried first, per the literal request to reuse that exact animation. It looked wrong: box-shadow on a plain table row has sharp rectangular corners spanning every stat column, reading as a hard "selected cell" outline rather than a glow — `.excitement-glow`'s ring works because `MatchCard` has `rounded-xl` corners for it to follow. Rather than inventing a dimmer, custom animation (tried once, and it under-pulsed to the point of looking static), the fix was purely structural: confine the glow to a small `rounded-lg` wrapper around just the name/sparkline cell, where the *real*, same-as-everywhere-else `excitement-glow` animation now reads correctly as a soft pulsing highlight.

**SC10 — Sparkline boundary dots capped at the batter's own 4s/6s column; undercount gap left unresolved by explicit user choice**
A full-platform audit (53 batters across 5 matches with ball-by-ball data) found the mock ball arrays don't reconcile with their own battingCard aggregate stats in the vast majority of cases — 19 batters had *more* `isBoundary4`/`isBoundary6`-flagged balls than their card's 4s/6s state, 24 had *fewer*. The dot-marking condition itself was always correct (matches `lib/events.ts`'s own boundary check). Fix: `buildSparklinePoints()` takes `row.fours`/`row.sixes` as a budget and stops marking dots once it's spent, so the chart can never show more boundaries than the box score the user is reading right next to it. The reverse gap (real ball data has fewer flagged boundaries than the card states, so the sparkline under-shows) was deliberately **not** patched by fabricating extra dots on non-boundary balls — user was asked directly and chose to leave it as-is rather than have ~4 matches' ball-by-ball data regenerated, on the reasoning that a real subset of true boundaries is preferable to invented ones.


---

## Scorecard polish — post-v1.0.48 quick fixes (2026-07-14)

**SC11 — "Innings 1" label dropped for single-innings formats, not just relabeled**
The innings-card header showed "Innings 1" even for T20/T20I/ODI/Hundred, where a team only ever bats once and the label carries zero information — Test is the only format where "which innings" is ever ambiguous. Rather than rewording it, the label is omitted entirely for non-Test formats (Test keeps its "1st Innings"/"2nd Innings" labelling per SC6). One fewer thing on screen for the formats where it never told the user anything new.

**SC12 — 4s/6s batting-table header labels coloured cyan/purple to match the cell values below them**
The batting table's "4s"/"6s" column headers were plain `text-dim` grey while the actual per-batter numbers in those columns already used cyan (4s) and purple (6s) — the platform's established boundary palette (see G9/outcomeColors.ts). The header text now matches its column's value colour, so the eye can associate header→column without reading the label text every time, consistent with how the bowling card's economy/wickets headers already work.

---

## Homepage redesign — v1.0.49 to v1.0.51 (2026-07-14)

**HP1 — Hero live card's static win-prob bar replaced with a live per-over sparkline, reusing `calculateWinProbForMatch` as the single source of truth**
The homepage's live match card showed a flat, single-snapshot win-prob bar (current % only), while `WinProbChart.tsx`'s full-screen modal already had the entire match's win-prob trend computed and ready. Rather than deriving a second, homepage-specific win-prob calculation, `LiveWinProbSpark` (new, in `MatchCard.tsx`) calls the exact same `calculateWinProbForMatch(match)` the modal uses, so the two views can never disagree with each other. The two mock matches that ship only a `liveWinProbOverride` with an empty `balls[]` array fall back to the old static `WinProbBar` — a match with zero ball data has no trend to draw.

**HP2 — Ordinary matches get quiet flat cards; only a small, deliberately rare set gets the full "spotlight" treatment**
Every past/upcoming match previously got the same full card treatment (split-team background, crest, glow, badges) regardless of whether anything about it was actually noteworthy — a normal Tuesday league match looked exactly as visually loud as a last-ball thriller. `PastMatchCard`/`FutureMatchCard` were slimmed to a quiet flat 60px row (team names, a thin winner-colour left border, no gradient/crest/badge) for the default case; the small subset of matches clearing the spotlight bar (see HP3) keep the full `SpotlightMatchCard` treatment, pulled out of the grid entirely and rendered full-width (or as a capped 3-card carousel) above it. Visual weight is now proportional to actual match significance instead of uniform across every card.

**HP3 — Spotlight rejects the existing `excitement` score; defined instead by three concrete, checkable conditions**
The first pass toward "spotlight" reused `match.excitement >= 8`, since that field already existed on `Match`. This was explicitly rejected mid-build: audited via `npx tsx` scripts, the static mock entries' `excitement` is a hand-typed editorial literal with no formula behind it, while the infinite-scroll-generated matches (`lib/matchGenerator.ts`) compute it as `3 + Math.floor(seededRandom(idx) * 8)` — pure pseudo-random 3–10 with zero correlation to the match's actual margin, wickets, or any real event. Empirically ~43% of generated matches would clear `>= 8` by chance alone, which is far too common for a feature explicitly meant to be rare. Replaced with `lib/spotlight.ts`'s `isSpotlightMatch()`: three concrete OR'd conditions — `hasCloseFinish` (margin ≤ 6 runs or ≤ 1 wicket, or summary text matches last-ball/last-over/super-over/tie), `hasMilestone` (century in a limited-overs innings, 150+ in a Test innings, a 5-wicket haul, or "hat-trick"/"record" in the summary — deliberately not a generic "milestone" keyword match), and `hasContextStakes` (badge/phase/series-status text matching decider/final/playoff/qualifier/semi/champion). Each condition is independently checkable against the match's own real fields, not a hidden score.

**HP4 — Spotlight bar tightened twice on explicit "tighten further" feedback, ending at 4/23 matches (~17%)**
The first concrete-conditions pass (HP3) still qualified 8 of 23 static matches. Round 1 tightened `hasMilestone` for Tests specifically — a bare century in a Test innings is common and not remarkable the way it is in a 20-over innings, so the Test threshold was raised to 150+, dropping qualifiers to 6/23. Round 2 dropped generic "rivalry"/"table-topper" language from `hasContextStakes` — those recur every single season for the same handful of teams and stop reading as genuinely high-stakes, keeping only true knockout/decider stakes (final, playoff, qualifier, semi, decider). Final result: 4/23 static matches qualify, 0 upcoming matches currently qualify, and 0% of infinite-scroll-generated matches can ever qualify (they carry no batting/bowling card detail or stakes badges to check against) — spotlight only ever surfaces authored, real editorial matches, never generated filler.

**HP5 — "For you" row v1: single followed-team match, live-first with soonest-upcoming fallback**
The first "for you" build (superseded by the tiered union rewrite, see FY1–FY6 below) supported exactly one followed team (`lib/followedTeam.ts`, since deleted) and surfaced its live match if one existed, else its soonest upcoming match. Shipped as a deliberately small v1 ahead of the much larger Filter/personalization system (FT1–FT9) that replaced the single-team placeholder with real multi-category follows.

**HP6 — Spotlight/for-you collision resolved with a marker, not a duplicate card**
When the one "for you" match was also a spotlight match, showing it in both slots would repeat the same match twice on one screen for no reason. Resolved by suppressing the separate "for you" row for that match and instead passing a `forYou` prop into `SpotlightMatchCard`, which renders a small `★ FOR YOU` pill in the card's top-left corner — the information ("this is your followed match") survives, the duplication doesn't.

**HP7 — Sparkline flat-line bug: root cause was windowing, not fake data**
Live sparkline lines initially rendered nearly flat despite real, large win-prob swings existing in the underlying data (verified: `ind-aus-t20i-2026-m2-live`'s real win-prob range is 1%–79%). Root cause was slicing only the last ~20 raw balls (roughly 3 overs) instead of the full match's `calculateWinProbForMatch()` output — a small recent window of an otherwise dramatic match just doesn't contain much movement. Fixed by downsampling the *entire* match's win-prob series instead of a recent slice.

**HP8 — Homepage sparkline's 50% gridline removed; full-screen `WinProbChart` modal's own gridline is untouched**
The homepage sparkline inherited a dashed 50% gridline from being visually modeled on the full-screen chart, but at ~300px width and ~50px height it added clutter without adding readability (a glance at a home card doesn't need a numeric reference line the way actively studying the full chart does). The fix is scoped specifically to `LiveWinProbSpark` in `MatchCard.tsx` — `WinProbChart.tsx`'s own gridline is deliberately untouched, since that's a different context (a user who tapped in specifically to study the graph).

**HP9 — Tangled crossing lines fixed via per-over bucketing + Catmull-Rom smoothing, not by picking fewer random points**
Even after HP7's fix, the two win-prob lines crossed back and forth repeatedly in a tight tangle. Root cause: the sparkline was plotting the same ball-by-ball density (218+ raw points for a full Test) the full-screen chart uses, crammed into a ~300px-wide card — every minor mid-over fluctuation in the real data showed up as a visible crossing, since there simply isn't enough horizontal room to separate them. A stride-based downsample (every Nth point) was tried and measured first: it still produced 1–2 crossings per T20 match. The fix instead buckets `calculateWinProbForMatch()`'s full output to exactly one point per over (`Map<number, WinProbPoint>` keyed by `Math.floor(overFloat)`, keeping the end-of-over value), stride-downsamples further only if a format has more than 30 overs (Tests), and applies Catmull-Rom smoothing (the same technique `WinProbChart.tsx` and `Scorecard.tsx`'s batter sparklines already use) to the result. Verified via script on the same matches: 0 crossings after the per-over rewrite versus 1–2 under the old stride-sample approach.

---

## Filter / personalization — v1.0.52 (2026-07-15)

**FT1 — Follows match by stable registry ID, never by display name**
Every follow category (nation, team, tournament, player, format) is stored and matched by its underlying registry ID (`Team.code`, `Team.country`, `Competition.id`, `PLAYERS` slug, `MatchFormat` literal) rather than a display string. This was an explicit requirement, not an implementation detail chosen after the fact — display names can collide or change (e.g. two competitions both called something generic) in a way stable IDs can't, and downstream matching logic (`qualifyMatch`) never has to do fuzzy string comparison.

**FT2 — Player-lineup matching stress-tested specifically for players who represent both a national side and a franchise**
The Filter sheet's Player category needed to avoid a real trap: a player like a national all-rounder who also plays IPL should not have every single one of their franchise's matches count as "featuring" them just because they're on the team's roster in general — only matches they're actually confirmed to have played in should count. `lib/lineups.ts`'s `isPlayerInMatch()` checks a per-match confirmed XI (`Match.lineups`, real-API-ready) first, falling back to a deterministic seeded-hash presence check (`seededChance(`${match.id}:${playerId}`, 0.72)`) against the `PLAYERS` registry's `teamCode`/`franchiseCode` only when explicit lineup data isn't present. Verified via a full-distribution check (72.0/2000 samples below the 0.72 threshold — genuinely uniform, not accidentally biased) and a concrete before/after example (Jasprit Bumrah: 5/9 of his team's matches include him, 4 genuinely excluded) rather than trusting a single spot-check.

**FT3 — Mock data expansion scoped to the real gap: player lineups, not team/competition registries**
The ask was to stress-test with "15–20 teams / a few tournaments" worth of realistic data. Audited first rather than authored blind: the existing Team registry (72 entries) and Competition registry (14 entries) already vastly exceeded that bar. The actual gap was per-match player lineups, which didn't exist at all — so the only new mock data authored was `lib/lineups.ts`'s derived-lineup fallback (FT2), not a wholesale re-authoring of teams/competitions that were already more than sufficient.

**FT4 — New dedicated `follow` violet (`#7C3AED`), distinct from the existing "six" purple**
The Filter feature needed a consistent accent colour across the bottom-nav trigger, the sheet's checkboxes/counts, and the "for you" star marker. The platform already has a purple in its palette (`#A855F7`, used for six-hit ball outcomes — see G9/S6), but reusing it would make the personalization feature visually indistinguishable from a ball-outcome colour code that means something else entirely. A new, deliberately distinct violet was added to `tailwind.config.ts` as `follow: { DEFAULT: "#7C3AED", soft: "#7C3AED22" }`, with an inline comment explaining why it isn't the same purple.

**FT5 — Filter is a raised circular trigger between Home/Schedule, not a third nav tab**
The bottom nav's Filter button is deliberately NOT styled like Home/Schedule (icon + label tab). It opens an overlay sheet rather than navigating to a destination route, so it's rendered as a raised, 52px circular button popping above the bar (the familiar "camera button" pattern from Instagram-style nav bars) instead of a third icon+label tab that would visually imply a third page.
*Superseded by NB1 (v1.0.56, below) — the raised circular treatment made Filter read as more visually prominent than Home/Schedule despite being the least-used of the three, so it was downgraded to match their plain icon+label layout, with color (not shape/elevation) carrying the "sheet is open" signal instead.*

**FT6 — `BottomSheet` extracted into a shared component before building `FollowSheet`, rather than duplicating the pattern a second time**
`LiveCarousel.tsx` already had a fully-built swipe-to-dismiss / body-scroll-lock / back-button-closes-it bottom sheet (the iOS Safari back-swipe fix from v1.0.33 lives here). Rather than copy that ~130 lines into a second, near-identical `FollowSheet`-local implementation, it was extracted to `components/BottomSheet.tsx` with one addition — an optional `footer` slot (for the Follow sheet's pinned full-width confirm button) — that's backward compatible with `LiveCarousel`'s three existing call sites.

**FT7 — Nothing commits to storage until "Follow" is tapped**
The Filter sheet's category selections live in local draft state (`useState<FollowPrefs>`), re-initialized from `getFollowPrefs()` every time the sheet opens. Tapping a checkbox only mutates the draft; `setFollowPrefs()` (the actual persistence + change-event dispatch) only runs when the user taps the pinned "Follow" button. Backing out via backdrop tap, the × button, or a back-swipe discards any in-progress edits — there's no partial-save state to reason about.

**FT8 — Cross-sibling state sync via a DOM `CustomEvent`, not a state management library**
`BottomNav` (which owns the `FollowSheet` instance) and `app/page.tsx` (which needs to react to follow changes for the "for you" row) are sibling components under the root layout, not parent/child — `app/page.tsx` has no direct way to be notified when prefs change inside `BottomNav`'s tree. Rather than introduce a state management library (Redux/Zustand/Context) for this one cross-cutting concern, `lib/followPrefs.ts` dispatches a `window` `CustomEvent` (`bawler:follow-prefs-changed`) from `setFollowPrefs()`, and `app/page.tsx` subscribes via `onFollowPrefsChanged()`. Consistent with the app's existing simplicity level — no state library is used anywhere else in the codebase.

**FT9 — Empty-state nudge capped at the first few sessions, not shown forever**
A dismissible nudge inviting first-time users to try the Filter sheet only shows pre-first-follow, within the first `NUDGE_MAX_SESSIONS = 3` Home visits (`lib/followNudge.ts`, tracked via a simple localStorage visit counter), and never again once dismissed. The Filter button itself is the permanent, always-available entry point — the nudge is only meant to point new users at a feature they might not otherwise notice, not to nag indefinitely.

---

## localStorage schema-version guard — shipped, then explicitly reverted (2026-07-15)

**LS1 — A `SCHEMA_VERSION` wrapper was built and deployed, then reverted whole on direct request — this is NOT a case to quietly redo**
After shipping the Filter feature, a cheap defensive improvement was proposed and approved ("go for it"): wrap `getFollowPrefs()`/`setFollowPrefs()`'s stored JSON in a `{ version, prefs }` envelope, so a future change to `FollowPrefs`'s shape could detect and discard incompatible old data instead of crashing on it. This was built, deployed, and confirmed working exactly as designed — it correctly wiped a pre-existing unversioned `bawler:followPrefs` entry left over from testing. That correct-but-surprising behavior (a previously-set "for you" follow silently disappearing) prompted the explicit instruction: **"bring our platform to previous version, prior to fix the localstorage."** The commit was reverted via `git revert` (not hand-unwound), confirmed byte-identical to the pre-fix state. **`getFollowPrefs`/`setFollowPrefs` currently use the raw, unversioned JSON shape in production. Do not reintroduce a schema-version wrapper unless the user asks for it again** — this isn't a case where the original idea was wrong, it's a case where it was explicitly asked to be undone after being seen in action.

---

## "For you" tiered union rewrite — v1.0.53 (2026-07-15)

**FY1 — Pool is a UNION across every followed category, not an intersection**
The original single-team "for you" (HP5) only ever considered one category. Once Filter supported five simultaneous categories (nation/team/tournament/player/format), the pooling rule was made explicit: a match qualifies if it matches *any* followed nation, team, tournament, format, or player — someone following both India (nation) and RCB (team) sees matches from both, not only matches that happen to satisfy both at once.

**FY2 — Two-tier priority: Nation/Team/Tournament/Format outrank Player outright, not as a tie-break weight**
Player-only matches (someone appears in a lineup but nothing about their team/nation/tournament/format is separately followed) are used strictly as a last resort — surfaced only when the Tier-1 pool (nation/team/tournament/format) is completely empty. This is not a scoring weight or a tie-breaker between otherwise-equal candidates: if Tier 1 has even one candidate, the entire Player-only pool is ignored, even if a Player-only match would otherwise be sooner. The one exception: a match qualifying via *both* a Tier-1 category *and* a followed player stays Tier 1 — the demotion only applies to matches that qualify exclusively through a player. `qualifyMatch()` returns a per-category `MatchQualification` breakdown specifically so this distinction can be made explicit rather than folded into one boolean (superseding the original single-boolean `matchIsFollowed()`, which is kept as a convenience wrapper but no longer drives the "for you" row directly).

**FY3 — Live beats upcoming within the active tier, excluding whichever match is already the homepage's single hero card**
Within whichever tier is active, a live qualifying match always wins over an upcoming one — except the homepage's single most-prominent live match (`byPopularity(ALL_LIVE_MATCHES)[0]`, the first/default card visible in the top `LiveCarousel` without swiping) is excluded from "for you"'s live candidates, so the same match isn't shown as both the hero and "for you" with no distinguishing marker (unlike the spotlight collision in HP6, there's no equivalent marker mechanism for the hero card). Critically, excluding the hero match *does* re-trigger the live→upcoming fallback (if the followed team's only live match is the hero, "for you" falls through to that team's next upcoming match) rather than showing nothing — there's a real difference in how the hero-exclusion and the spotlight-exclusion below are supposed to behave, and the code follows that difference rather than the same rule for both.

**FY4 — Multiple simultaneous live qualifiers become a small swipeable carousel, reusing spotlight's exact markup**
If more than one live match qualifies within the active tier (excluding hero), they're shown as a capped (`FOR_YOU_LIVE_MAX = 3`) swipeable snap-x carousel — explicitly reusing the identical carousel JSX pattern already built for spotlight's own multi-match case, rather than inventing new UI or arbitrarily picking one match to show.

**FY5 — Spotlight-dedup is a pure display-time filter; it does NOT re-trigger the tier/live/upcoming selection**
Once a "for you" match is selected (per FY1–FY4), any of the selected matches that are also spotlight matches are filtered out of the "for you" row's visible list and instead get the `★ FOR YOU` marker on their spotlight card (same mechanism as HP6). Unlike the hero-exclusion (FY3), this filter does not re-run the selection algorithm to backfill a replacement — if absorbing spotlight matches empties the visible "for you" list, the row simply shows nothing rather than falling back further. The marker on the spotlight card already preserves the "this is one of your follows" information, so there's nothing lost by not showing it twice.

**FY6 — Bilateral nation-quiet case is handled once, inside `qualifyMatch`, not duplicated in the "for you" selection logic**
Following a nation whose current live/upcoming matches are all part of a two-team bilateral series correctly yields an empty "for you" row — the whole homepage (hero card, series-status chip) already covers that storyline, so repeating it in "for you" adds nothing. This suppression is scoped specifically to the `nation` category inside `qualifyMatch()` (`match.competition.type !== "bilateral"`), not applied as a separate rule inside the tiered selection — following a *team* or *tournament* that happens to be part of a bilateral series still surfaces those matches normally, since those are more deliberate, specific choices than a broad nation follow.

---

## Homepage hydration + click reliability — v1.0.54 to v1.0.55 (2026-07-15)

**HR1 — Root cause of "Filter needs 2-3 clicks": `lib/mockData.ts`'s match timestamps are computed once, at module-load time, from `Date.now()`**
Reported as "nothing opens on clicking Filter," later narrowed by the user to "Chrome, isolated to Filter specifically, opens on the third click." Investigation found every match's `startTimeIso` (and therefore which matches are live/upcoming/past) is computed via `Date.now()` plus a fixed offset, evaluated once when `lib/mockData.ts`'s module code runs — not per-render, not reactively. Because `/` is statically prerendered at build time, the server-rendered HTML is frozen to whatever `Date.now()` was at that build, while the client re-evaluates the same module fresh at hydration time, often hours apart. That mismatch means the server-rendered tree and the client's first render can genuinely disagree on which matches are live, forcing React to reconcile a large mismatched subtree right after load — clicks landing during that reconciliation window can be dropped.

**HR2 — Fix: gate time-dependent homepage sections behind the same client-mount flag already used for the match grid, rather than changing how match timestamps are computed**
Rewriting `mockData.ts`'s Date.now()-anchored timestamps to be SSR/CSR-consistent would be a much larger, riskier change touching hundreds of lines across a file that's purely mock/demo data pending a real API. The chosen fix instead wraps the `LiveCarousel`/for-you/spotlight block in the same `isBooting` flag that already gates the Past/Future grid below it (`isBooting` starts `true` identically on server and client, flips `false` only inside a client-only effect) — so the server HTML and the client's very first render are now pixel-identical (both show a skeleton), and hydration has nothing to reconcile. A small `HeroSkeleton` placeholder (reusing the existing `.skeleton` pulse style) covers the ~350ms gap so nothing looks broken while it settles.

**HR3 — Second, independent fix for the same symptom: force early GPU-layer promotion on the bottom nav's `backdrop-filter`**
HR2 was a real, worthwhile fix, but the user confirmed after retesting that Filter specifically still needed multiple clicks — ruling out a page-wide hydration explanation, since Home/Schedule/match-card clicks all worked fine on the first try. The remaining, isolated-to-Filter symptom matches a known Chromium quirk: elements using `backdrop-filter` (the bottom nav's frosted-glass bar) get promoted to their own GPU compositing layer lazily, on first paint, rather than immediately at style-recalc time — a pointer event landing in that region before the layer is actually composited can hit-test against the pre-promotion state and pass through, rather than being captured by the button underneath. Added `transform: translateZ(0)` + `willChange: "backdrop-filter, transform"` to the nav's inline style to force the layer to exist immediately. Cheap and inert on browsers that don't need it.

**HR4 — Self-inflicted regression from HR3: an inline `style.transform` fully overrides a class's `transform`, it doesn't merge with it**
The nav's className already carried Tailwind's `-translate-x-1/2` (i.e. `transform: translateX(-50%)`) for horizontal centering. Adding a *second*, separate `transform: "translateZ(0)"` via inline `style` didn't combine with the class — inline styles win over classes entirely for a given property, so the centering transform was silently discarded and the whole bottom nav shifted right, off-center from the phone-frame content above it. Caught immediately from a user screenshot after deploy. Fixed by combining both into one inline transform value (`translateX(-50%) translateZ(0)`) and dropping the now-redundant Tailwind class, with an inline comment flagging the trap for next time: centering and GPU-layer-forcing transforms must be composed into a single `transform` string, never split between a class and an inline style.

**HR5 — Root-cause certainty on HR1–HR3 remains unconfirmed; both fixes are real, independently-justified improvements regardless**
Verifying the click-responsiveness fix via browser automation repeatedly produced inconsistent results in ways later traced to the *automation tooling's* own coordinate/ref caching going stale after the browser viewport shifted mid-session — not the app. That was a useful reminder not to over-trust a single flaky reproduction (in either direction), but it also means neither HR2 nor HR3 was ever conclusively proven to be *the* fix for the user's exact reported behavior versus a contributing factor. Both are legitimate, safe, independently-justified changes (a real SSR/CSR data mismatch, and a real documented Chrome compositing quirk) and were shipped on that basis rather than on a fully confirmed root cause.

---

## Filter nav button + data-scoping fixes — v1.0.56 to v1.0.57 (2026-07-15)

**NB1 — Filter nav trigger downgraded from a raised circular button to a plain flat tab, matching Home/Schedule exactly**
The original "camera button" treatment (HP-era decision, `components/BottomNav.tsx`) made Filter read as the *most* visually prominent of the three bottom-nav destinations despite being the least frequently used, and despite opening an overlay rather than switching to a persistent screen the way Home/Schedule do. Changed to the identical flex-1 icon+label layout (same 20px stroke icon, same 9.5px uppercase label, no elevation/shadow/circular fill) — the only remaining differentiator is color: neutral gray (`text-text-dim`, same as an inactive Home/Schedule icon) by default, switching to Violet 600 (`#7C3AED`, the existing `follow` Tailwind token — the same accent already used for selections inside the sheet) only while `FollowSheet` is actually open, reverting to neutral the instant it closes. This signals "currently active" without implying a persistent destination.
Caveat recorded live: the Filter sheet is a near-full-height overlay that visually covers the entire nav bar while open, so in practice the violet state is correct in code/DOM but isn't something a user will actually see on screen in the current layout — flagged to the user, not treated as something to silently "fix" beyond scope.

**CO1 — Team category was showing every national team a second time, labeled "National team"**
`FollowSheet.tsx`'s `buildOptions("teams")` built its list from `ALL_TEAMS`, which is `{...TEAMS, ...NATIONAL_TEAMS, ...LEAGUE_TEAMS}` merged — so every national team (already the dedicated content of the Nation category, built from `NATIONAL_TEAMS` alone) also appeared a second time under Team, tagged "National team". This was accidental data overlap from using the wrong merged registry, not intentional flexibility. Fixed by filtering `ALL_TEAMS` to `type !== "national"` for the Team category specifically — Nation is untouched, still `NATIONAL_TEAMS` only. Audited the remaining three categories (Tournament/Player/Format) for the same class of bug by diffing `fullName` sets across `NATIONAL_TEAMS`, `TEAMS`+`LEAGUE_TEAMS`, and `COMPETITIONS` — no other overlapping entity names found; Player is keyed by individual id, Format is a fixed short list, neither has cross-category collision risk.

---

## "For you" card refinements — v1.0.58 (2026-07-15)

**FY7 — Followed team always renders on the left, regardless of which side `teamA`/`teamB` happens to be**
Reported: the followed team's color dot was always correctly next to its own name (the two were never actually disconnected from each other), but the *pair* of them could land on the right side of the "for you" card if the match data's `teamA`/`teamB` order (home-team-first, alphabetical, whatever convention a given match happens to use) put the followed team second — leaving a user's eye expecting their team first/left. Added `followedMatchSide(match, prefs)` to `lib/followPrefs.ts`: resolves which specific side (A or B) is the one actually satisfying the user's prefs, checked in team > nation > player priority (mirroring `qualifyMatch`'s own Tier-1 specificity ordering). Returns `null` for matches that only qualified via a followed tournament/format — those don't pin to a specific side, so team order is deliberately left untouched rather than guessed. `ForYouRow` (`app/page.tsx`) now takes `followPrefs` as a prop and renders `leftTeam`/`rightTeam` derived from this helper instead of `teamA`/`teamB` directly. Scoped to this one card only — Live, Spotlight, and the Past/Coming Up grid all keep rendering `teamA`/`teamB` exactly as before.

**FY8 — Added a 3px colored left border to the "for you" card, always `leftTeam`'s color**
The card had per-team color dots but no border accent, unlike `PastMatchCard`/`FutureMatchCard` elsewhere on the homepage, which already use a 3px colored left border as a standing convention (see GB1 below). Added the same treatment here, always keyed to `leftTeam.primaryColor` — since `leftTeam` is now always the followed team (FY7), the border, the dot, and the name are one consistent unit on one consistent side, never disconnected from one another.

---

## Score & border-color correctness — v1.0.59 to v1.0.60 (2026-07-15)

**SC13 — "Dangling slash" on all-out scores: two independent bugs, both fixed, neither alone would have been sufficient**
Reported live: several completed-match cards showed a bare trailing slash ("AUS 187/", "IND 164/") instead of a score. Two separate causes:
1. *Display logic* — `QuietSide`/`SideBlock` (`components/MatchCard.tsx`) blindly interpolated `` `${runs}/${wickets}` ``, so an undefined wickets value produced a dangling slash with nothing to its right. Added `formatScore(runs, wickets)` to `lib/formatUtils.ts` (the format-rules single-source-of-truth file): drops the wicket count entirely — standard cricket "all out" convention, "187" never "187/10" — whenever wickets is `undefined`, `null`, or `>= 10`; renders normally (including "runs/0" for an opening stand, since 0 is a real value, not an absent one) otherwise. Both render sites now call this instead of interpolating directly.
2. *Data gap* — 5 hardcoded `match.result` summary objects in `lib/mockData.ts` simply omitted `teamAWickets`/`teamBWickets` outright, even though the correct values were already present a few lines up in each match's own `innings[]` entries. Backfilled all 5 (`ind-aus-t20i-2026-m1`, `t20wc-2026-ind-pak`, `ct-2025-aus-nz-final`, `ashes-2526-3rd-test`, `bbl-2526-scorchers-sixers`) from their own innings data — not invented values.
Audited every other score-rendering site in the codebase (Scorecard, MatchView, ScoreBar, LiveCarousel, MomentStoryCard, DigestTab) — all read wickets from `innings[]` directly, which was never missing data, so none needed a change. `OverSummary.tsx`'s own runs/wickets display is a per-over recap (not a team total) with its own correct zero-wickets handling for that different context — left untouched.

**GB1 — Past/Coming Up grid border-color rule hardened against a silent wrong-team fallback**
Audited every completed match then live in the deployed grid against its actual team colors (RCB/CSK, AUS/IND, LSG/PBKS, KKR/RR, AUS/NZ, DC/SRH, MI/CSK, and more) — all already correctly showed the winning team's real `primaryColor`, and every upcoming card was already consistently neutral (`#1E293B`), never favoring a side. However, `PastMatchCard`'s winner resolution was a plain two-way ternary — `` winnerCode === match.teamA.code ? match.teamA : match.teamB `` — which silently defaults to `teamB` for *any* non-match against `teamA`, including an undefined/missing winner code or one that matches neither team. No match in the current dataset happened to exercise that path, but it's exactly the failure mode described (a border not really tied to a confirmed winner). Replaced with an explicit dual equality check against both `teamA.code` and `teamB.code`, falling back to `undefined` (then the same neutral `#1E293B` `FutureMatchCard` uses) if neither matches — never an arbitrary team color. Documented the two-case rule directly in both components. Scope: `PastMatchCard`/`FutureMatchCard` only — Live hero, Spotlight, and For You (FY8, which already always uses the followed team's color) are untouched.

---

## "For you" / Spotlight visual alignment — v1.0.61 (2026-07-15)

**VA1 — Shared visual language achieved via structural alignment (radius, padding rhythm, one gap value), not by making the cards identical**
The ask was explicitly narrow: bring "for you" and Spotlight into the same design system without touching each card's height, background treatment, or content. Corner radius was the one real inconsistency — "for you" inherited the generic `.card` class's `1rem` radius while Spotlight (and the Past/Coming Up grid) use `rounded-xl` (`0.75rem`). Fixed via an inline `borderRadius: "0.75rem"` override, deliberately not a class change — inline styles are guaranteed to win regardless of Tailwind's compiled source order, the same lesson already learned the hard way from the nav-bar centering regression (HR4).

**VA2 — Padding rhythm unified to Spotlight's own `flex-col gap-0.5` pattern, replacing ad-hoc per-child margins**
"For you" previously used `px-3 py-2.5` edges with bespoke `mb-1.5`/`mt-1` margins scattered between its label row, team row, and footer text — a different spacing model from Spotlight's single `flex-col gap-0.5` governing all three rows uniformly. Restructured `ForYouRow` to match Spotlight's exact edge padding (`px-2 py-1.5`) and gap model, rather than tuning the old margins to visually approximate the same rhythm.

**VA3 — Label typography audited before touching anything: already matched, so nothing was changed**
The "FOR YOU" label's size/weight/letter-spacing (`text-[10px] font-bold uppercase tracking-widest`) was checked directly against Spotlight's own "Spotlight" section label rather than assumed to need a fix — they were already identical. Only the color intentionally stays different (violet for "for you", `text-dim` for Spotlight's label), per the explicit instruction that colors should keep differing. Verified live via `getComputedStyle` on both labels rather than a visual-only screenshot comparison.

---

## Homepage hero-match selection rule — v1.0.62 (2026-07-15)

**HS1 — Replaced an ad hoc popularity sort with an explicit, three-tier deterministic rule, because multi-live-match moments are the everyday case now, not an edge case**
Before this, the single hero card at the top of Home was just whichever live match sorted first under `byPopularity()` — a flat point system (`COMP_POP`/`TEAM_POP` constants) with no real hierarchy, where IPL could outrank an international bilateral series purely because its hardcoded constant happened to be higher. `lib/heroSelection.ts`'s `selectHeroMatch()` replaces that with three ordered tiers, each one only consulted if the previous tier is tied:
1. **Prominence** (`matchProminenceTier()`) — an explicit competition-type hierarchy (international tournament > bilateral series > domestic league), with a marquee-stage bump (final/semifinal/qualifier/decider, detected via `match.phase`, `highlightBadge`, or `seriesStatus`) that can push any tier up one notch — so a league final can rival an ordinary bilateral match, and a bilateral series decider can rival an ordinary international tournament match.
2. **Live stakes** (`liveMilestoneScore()`) — breaks ties within a tier using the same methodology as Spotlight's own "milestone" pillar (`lib/spotlight.ts`), adapted to score the match's *current, in-progress* state rather than a final result that doesn't exist yet for a live match. Spotlight's "close finish" pillar has no live equivalent (there's no final margin to measure); "context stakes" is already folded into tier 1 above, not reapplied here.
3. **Live runway** (`estimatedLiveRunway()`) — the final, fully deterministic tiebreak: a match's format capacity (`lib/formatUtils.ts`'s `totalBallsFor()`) times innings plausibly remaining, then most-recently-started as the last resort. Never random — the same live snapshot always produces the same hero.

**HS2 — Deliberately NOT weighting by format inside tier 1, even though the user's own example implied it might be tempting**
Format (Test/ODI/T20I/T20) was considered as a tier-1 signal but left out on purpose: the instruction's own example ("two international matches live at once... break the tie using the excitement/stakes scoring") implies same-competition-type ties should fall through to tier 2/3 rather than be silently resolved by an arbitrary format bonus baked into tier 1. This was an inferred design choice, not an explicit instruction — worth revisiting if a future report suggests format should carry more direct weight.

**HS3 — Global, single selection — explicitly never personalized, and structurally kept separate from "for you"**
The hero is one selection for the entire homepage, identical for every user regardless of what they follow — `selectHeroMatch()` takes only the live-matches array, never `FollowPrefs`. "For you" (`lib/followPrefs.ts`) continues to pool per-user exactly as before (FY1–FY6), simply excluding whatever `heroId` claims (`app/page.tsx`'s existing exclusion wiring, unchanged — now fed by `selectHeroMatch()` instead of the old `byPopularity()` call). `LiveCarousel`'s matches array is reordered so the new hero always leads the swipeable strip; the rest of the strip keeps the pre-existing popularity order, since reordering the whole strip wasn't part of what was asked.
Verified via constructed `npx tsx` scenarios (tier 1, tier 2, tier 3 tiebreaks all resolve correctly) AND against the real live mock dataset directly — the deployed hero (AUS vs IND) is correctly selected because it's flagged `"Series decider"` in the data, legitimately outranking the ordinary IND vs ENG Test and every ordinary IPL/PSL league match live alongside it. That's an unstaged confirmation that prominence + marquee-stage detection works end to end, not only in synthetic tests.

---

## Phantom-selection fix + Filter confirm-button relabel — v1.0.63 to v1.0.64 (2026-07-15)

**PS1 — Root cause: a category-scoping fix (CO1) correctly changed what renders, but didn't retroactively clean up what was already stored**
Reported: the Filter sheet's header/badge showed "1 selected" with no checkbox anywhere actually checked, and "for you" kept showing content as if a real follow existed. Traced to CO1 (v1.0.57): `FollowSheet.tsx`'s Team category was changed to exclude national-team codes from `buildOptions("teams")`, correctly stopping *new* duplicate entries — but any ID already sitting in a user's stored `FollowPrefs.teams` from *before* that fix shipped (e.g. a national code like `"AUS"`) was left untouched. That stale ID kept being counted by `totalFollowCount()` and honored by `qualifyMatch()`, while no checkbox could ever again show it as checked or offer a way to un-check it — a real regression affecting any user (not just test data) who'd followed a national team via Team pre-v1.0.57.

**PS2 — Fixed at the single canonical read point (`getFollowPrefs()`), because both symptoms trace back to the same function**
Confirmed via code inspection that both `app/page.tsx`'s `followPrefs` state (drives "for you"/hero-exclusion) and `FollowSheet.tsx`'s `draft` state (drives checkbox/badge/header rendering) are populated by the exact same `getFollowPrefs()` call — meaning a fix placed there, and only there, guarantees the two can never disagree again, satisfying the explicit requirement ("the checkbox should show checked if and only if that exact item is genuinely part of the user's saved selections... these two must never be able to disagree"). Added `sanitizeFollowPrefs()`, which filters every category array against the exact same valid-ID sets each category's `buildOptions()` renders from (teams: `ALL_TEAMS` minus national, matching CO1's own filter exactly; nations: `NATIONAL_TEAMS`; tournaments: `COMPETITIONS`; players: `PLAYERS`; formats: the fixed `MatchFormat` list). `getFollowPrefs()` now runs this on every read, and self-heals localStorage immediately (re-writing the cleaned value) if sanitizing actually dropped anything — repairing storage on first read rather than only masking the symptom on screen until the next explicit follow/unfollow.

**UB1 — Filter sheet's confirm button relabeled "Follow" → "Update", commit mechanic completely unchanged**
The button always read "Follow" even when the pending draft change was purely a removal — tapping "Follow" to confirm an *unfollow* is a semantic mismatch. Renamed the button (and `handleFollow` → `handleUpdate`) to "Update", which reads correctly whether the pending change is an addition, a removal, or a mix of both. The running count next to it (`Update (N)`) is unchanged in meaning — total selections after save, not "things you just added." Nothing about *when* the draft commits changed: still only on tap of this button; closing via the × (or backdrop/back-swipe) still discards the draft entirely.

---

## Swipe-carousel indicator fix — v1.0.65 (2026-07-15)

**CD1 — The "stray gray bar" was the native scrollbar thumb on the scroll container, not a custom indicator element — diagnosed before assuming the reported guess ("LiveCarousel position indicator") was literally correct**
Reported as a thin gray bar below hero/Spotlight cards, overflowing past their rounded corners edge-to-edge. Code inspection found `LiveCarousel.tsx` never actually rendered any explicit dot/bar indicator element at all — the only thing capable of producing a thin, light-gray, full-width horizontal mark was `.scrollbar-thin::-webkit-scrollbar-thumb` (`background: #1E293B`), the native webkit scrollbar on the carousel's horizontal scroll container. That container is deliberately wider than any single card (a negative-margin trick so touch/drag scrolling reaches edge-to-edge), so its scrollbar thumb tracked the container's full width rather than any one card's — exactly matching every detail of the report. Confirmed the exact same `overflow-x-auto scrollbar-thin ... -mx-3 px-3` pattern exists in exactly 3 places (`LiveCarousel.tsx`'s hero strip, and two inlined carousels in `app/page.tsx` for "for you" and Spotlight) — no other screen (schedule, tournament, match detail) uses this pattern, so the fix's scope is exactly those 3, not a platform-wide sweep of every scroll container.

**CD2 — Fixed at a new shared component + hook, not by patching each of the 3 call sites independently**
Added `components/CarouselDots.tsx` (renders nothing below 2 items; otherwise small 5–6px dots, muted gray inactive, accent-colored active) and `lib/useCarouselIndex.ts` (extracted from `LiveCarousel`'s own pre-existing inline scroll-position-to-index logic, since "for you" and Spotlight's carousels needed the same index for their own dots but never tracked one before). A new `.no-scrollbar` utility hides the native scrollbar on exactly these 3 containers — `.scrollbar-thin` itself is untouched, so unrelated scroll strips (Moments strip, mini-insights bar, table page tabs, FollowSheet's list, InsightFeed, WinProbChart's table) keep their existing behavior unchanged. Dots render directly below each carousel's scroll container, inside the same non-scrolling, card-width wrapper `<div className="px-3">` — that wrapper's width is derived from the identical `calc(100vw - 24px)` formula as an individual card, so the dot row is guaranteed bounded to the card's own width rather than the wider scroll container, without needing to inject markup into any of the three unrelated card components (`LiveMatchCard`, `SpotlightMatchCard`, `ForYouRow`) themselves. Accent colors follow each carousel's own existing brand color: cyan (`#00E5FF`) for hero/live and Spotlight (matching Spotlight's own `excitement-glow` accent), violet (`#7C3AED`) for "for you" (matching its own label/border accent).

---

## Spotlight venue-line merge + card-height re-tune — v1.0.66 (2026-07-20)

**SP1 — Merged the standalone venue line into the story line, scoped to `PastMatchCard`'s branch only**
Reported: the past-match Spotlight card rendered two separate context lines below the result banner — a standalone venue line (`Narendra Modi Stadium (Ahmedabad)`) and a separate story/summary line (`Bumrah hat-trick over saved 206 vs Surya's 78.`) — while the "for you" card directly above it on the homepage renders only one context line, making the height mismatch look wrong stacked together. Fixed by dropping the standalone venue-name line and folding just the venue's city into the story line itself as one sentence (`...vs Surya's 78, Ahmedabad.`), stripping the summary's own trailing period first so it doesn't end up with a double `..`. Falls back to just the city (still one line, never empty) for the rare spotlight match with no summary text — that case already rendered venue-only before this change, so nothing regresses there. Scoped to `PastMatchCard`'s branch of `SpotlightMatchCard` only — the upcoming-match branch never had a two-line problem (it already shows one summary line plus a separate countdown/time/city footer row, a different UI element, not a duplicate context line). Spotlight-worthiness criteria (`lib/spotlight.ts`) and every other element on the card (date, competition badge, highlight badge, team names/scores, result banner) are untouched — this is a copy/layout trim only.

**SP2 — Follow-up same day: the height gap wasn't actually closed until `SPOTLIGHT_CARD_HEIGHT` itself was reduced**
Live measurement after SP1 shipped showed the height gap with "for you" hadn't closed at all: `SPOTLIGHT_CARD_HEIGHT` is a fixed 148px applied via inline style, not an auto-height that shrinks with its content — removing a line of text just left ~50-60px of dead space at the bottom of every card, so the visible card height was still 148px, unchanged, while "for you" measured ~72px live. Measured the new (post-merge) content height directly in the browser for every currently-live spotlight card (~89-103px, including a 2-line-wrap case for a longer merged sentence), and worked out the equivalent for the upcoming-match branch by its own Tailwind classes (~94-106px) since 0 upcoming matches currently qualify as spotlight-worthy in the live dataset and that branch couldn't be measured directly — the arithmetic check is conservative relative to the new constant. Reduced `SPOTLIGHT_CARD_HEIGHT` 148 → 116: comfortably fits both branches' content including the wrap edge case with a small buffer, landing much closer to "for you"'s ~72px than 148px ever did. Worth flagging for a future pass: this constant is still a fixed height shared by both branches rather than a true auto-height — if either branch's content grows again, the same "content changed, constant didn't" trap is still live.

---

## Design-system cleanup: 3 flagged inconsistencies resolved — v1.0.67 (2026-07-20)

**DS1 — Hardcoded page background switched to the `bg.deep` token, confirmed with the user first since the values don't match exactly**
`app/globals.css` hardcoded `html`/`body` background to `#000000`, bypassing the `bg.deep` token (`#03060F`) entirely — flagged as a known inconsistency in DESIGN-SYSTEM.md rather than silently fixed, back when it was first found. Confirmed with the user before changing, since `#000000` and `#03060F` don't match exactly (RGB 0,0,0 vs 3,6,15); they accepted the near-imperceptible shift. Both `html` and `body` now read `#03060F` via the same value `bg.deep` already defines — page background finally goes through the token system like everything else.

**DS2 — `wicket`/`six` were carrying 5 unrelated meanings; carved each into its own dedicated token, same hex, new name**
Audited every `text-wicket`/`bg-wicket`/`text-six`/`bg-six` (and raw `#EF4444`/`#A855F7` hex) usage across the whole codebase to separate genuine per-ball outcome color from unrelated meanings quietly borrowing one of the two. Found and carved out five: `live` (the live-match indicator — also consolidated 3 separate, inconsistent "LIVE" badge implementations inside `LiveCarousel.tsx`/the team-schedule page, one of which was raw Tailwind `red-400`/`red-500`, not even a token), `negative` (behind/lost/declining trend, pairing with the existing `boundary` token as its positive counterpart), `special` (Man of the Series, a batter's "Never dismissed" achievement, a bowler's five-for milestone chip), `spin` (ball spin-direction/delivery-type indicator), and `slowPace` (slowest tier of the ball-speed color gradient). One more find along the way: `LiveCarousel`'s series-schedule "WON" badge was using `six`/purple as a decorative success marker — reassigned to the existing `boundary` token instead of a new one, since that's already exactly what `boundary` means everywhere else in the same file. All five new tokens keep their pre-existing hex value — this is a naming/architecture fix, not a recolor. Added `tailwind.config.ts` entries plus `lib/tokens.ts` (new file, hex constants) for the many raw-SVG sites that can't use a Tailwind class at all — no build-time link between the two files, so they have to be kept in sync by hand if either changes.

**DS3 — Six-ball color mismatch resolved to purple, decided by counting real usage, not by picking arbitrarily**
`lib/outcomeColors.ts`'s `OUTCOME.six` was turquoise (`#2DD4BF`); the Tailwind `six` token used directly everywhere else was purple (`#A855F7`) — a real, live discrepancy flagged in DESIGN-SYSTEM.md rather than fixed at the time. Audited actual usage before picking one: purple renders in 11+ files (`BallGIF`'s hero visual, `MiniBallGIF`, `MomentStoryCard`, `WinProbChart`, `Scorecard`, `OverSummary`, `DigestTab`, `MomentsStrip`, `MatchTabs`, `MatchupCard`). Turquoise reached the screen in exactly one place — `DeliveryCard`'s `FullCard` outcome badge — which sits directly next to a `MiniBallGIF` thumbnail (same ball, same card) that was already purple, a real visible clash on one live card. Standardized on purple: `OUTCOME.six.primary`/`.tint` → `#A855F7`, `badgeFg` → `#FFFFFF` to match `BallGIF`'s own established fg convention for a purple badge. `three` (`#EC4899` pink, no Tailwind equivalent) was left alone — nothing conflicts with it, not in scope for this pass. Updated DESIGN-SYSTEM.md to reflect all three resolved states instead of leaving the original "flagged, not fixed" language in place. Verified: `tsc` + build clean; re-ran the collision-check script from DESIGN-SYSTEM.md (untouched by this pass) to confirm it still passes: 72 teams, CSK-AUS 9.3 / SRH-AUS 19.4 / CSK-SRH 23.6, matching exactly.

---

## Tournament-table shortcut pill fixed to a consistent width — v1.0.68 (2026-07-20)

**TP1 — Fixed-width pill deliberately without a truncation safety net, so a future overflow fails loudly instead of silently**
Reported: the "WTC TABLE"/"IPL TABLE"/"PSL TABLE" pill below the hero card resized per tournament since its width was content-hugging (icon + label + padding) — only one of these ever shows at a time, in the same slot, so the varying width read as visual jitter rather than a stable element. Measured every current real label's natural width with the exact icon/padding/font (IPL, T20 WC, Champ. Tr., BBL, PSL, Hundred, SA20, CPL, MLC, WTC — every `Competition` with `hasStandings: true`); longest is "Champ. Tr. Table" at ~163px. Added `TABLE_PILL_WIDTH = 176` (comfortable buffer over that), switched the button to `justify-center` + a fixed inline width instead of content-hugging, label centered inside via a `whitespace-nowrap` span. Deliberately did NOT add a truncate/ellipsis safety net: if a future tournament's `shortName` doesn't fit inside 176px, `whitespace-nowrap` makes it overflow visibly rather than silently truncating or quietly widening — a real signal to come back and size this deliberately, not something to paper over. Updated DESIGN-SYSTEM.md §7 with the pattern, the reasoning, and an explicit "don't add truncate, don't revert to content-hugging" note, so a future prompt doesn't reintroduce content-hugging out of habit.

---

## Row-wrap regression fix attempt + bowling tiebreak bug — v1.0.69 (2026-07-20)

**RW1 — Series-status chip given shrink/truncate treatment to stop a two-row wrap — looked right, did NOT actually hold (superseded by v1.0.70)**
v1.0.68's fixed-width `TABLE_PILL_WIDTH` (176px, up from content-hugging ~117px for "WTC Table") pushed the sibling series-status chip past the flex container's ~406px available width, tripping a wrap onto a second row — a regression introduced by that commit. Attempted fix here: `min-w-0` + `truncate` on the chip's label span, `shrink-0` on both its icons, so the chip should shrink and truncate instead of wrapping. **This is recorded as an attempted fix, not a resolved one** — verified live afterward, it did NOT actually stop the wrapping. The real cause (see v1.0.70/RW2 below) is that the container itself was still `flex-wrap`, and `flex-wrap` decides line-breaks off each item's un-shrunk/max-content size — a shrinkable item still gets pushed to a new line before `flex-shrink` ever gets a chance to apply. `min-w-0`/`truncate`/`shrink-0` are all real, correct pieces of a shrink-to-fit pattern, just not sufficient on their own against a `flex-wrap` container; v1.0.70 is the fix that actually closed this out.

**BT1 — Bowling-tiebreak fix: economy, not raw runsConceded, decides "best bowler" among bowlers tied on wickets — verified working**
`Scorecard.tsx`'s `topWicketTaker` reduce, unlike RW1 above, worked correctly and was verified live. Root cause: the tiebreak among bowlers tied on wickets compared raw `runsConceded`, which unfairly favors whoever bowled fewer overs regardless of rate — e.g. Kuldeep (4 overs, 4.25 econ) was beating Bumrah (lower econ, more overs) purely because Kuldeep's raw runs-conceded number was smaller, despite Bumrah's figures being clearly better. Changed the tiebreak comparison to `economy` instead. The outright highest-wickets-wins branch above it is untouched — this only changes how ties on wickets get broken. Verified live in the ENG vs IND Test, England's 2nd innings bowling table: 4 bowlers tied at 1 wicket each, Bumrah (2.25 econ) now correctly highlighted over Kuldeep (4.25 econ).

---

## Actually fix row-wrap: flex-wrap → flex-nowrap — v1.0.70 (2026-07-20)

**RW2 — Root cause found: `flex-wrap` breaks lines off each item's max-content size, before `flex-shrink` ever applies — fixed by switching the container to `flex-nowrap`**
v1.0.69's `min-w-0` + `truncate` on the series chip (RW1) didn't stop the two-row wrap when verified live. Root cause: the shared row container (`LiveCarousel.tsx`) was still `flex-wrap` — and `flex-wrap` decides line-breaks based on each item's un-shrunk, max-content size, so a shrinkable item still gets pushed onto a new line before `flex-shrink` ever gets applied to it. No amount of `min-w-0`/`truncate`/`shrink-0` on the chip itself was going to fix that, because the wrap decision happens upstream of shrinking. Fixed by switching the container from `flex-wrap` to `flex-nowrap` — now shrinking actually takes effect, and the series chip truncates to fill remaining space instead of dropping to row 2. This supersedes RW1, not layers on top of it — the `min-w-0`/`truncate`/`shrink-0` additions from v1.0.69 stay in place (they're still correct pieces of the pattern), but the actual fix is this one-line container change. Documented in DESIGN-SYSTEM.md §7 (table-pill/series-chip single-row pattern) so the `flex-wrap` trap doesn't get reintroduced as an "overflow fix" later.


---

## Series-chip / table-pill saga — v1.0.71 to v1.0.74 (2026-07-20)

**TC1 — v1.0.71: shrank the chip's own chrome to fit next to the fixed pill, not the pill itself**
v1.0.68's fixed `TABLE_PILL_WIDTH` (176px) left the series-status chip with ~167px of real leftover room, narrower than actual `seriesStatus` strings in `mockData.ts` (168–179px at the chip's normal 11px type) — so `truncate` was firing on the everyday case, not just a rare long string. Fixed by trimming the chip itself: dropped the decorative trailing chevron, tightened padding (`px-3`→`px-2.5`) and icon-text gap (`gap-1.5`→`gap-1`), reduced label size to `text-[9.5px]` (pill's own 11px untouched). Verified live the longest current string then cleared available space with ~8px margin. `truncate`/`min-w-0` kept only as a last-resort safety net, not the normal path.

**TC2 — v1.0.72: reverted the font-shrink per explicit feedback — chip type size must never auto-shrink to solve a space problem**
Restored the chip's standard chrome (`text-[11px]`, `px-3 py-1.5`, `gap-1.5`, both icons) and switched the row container back to `flex-wrap`, making wrap the *intended* overflow valve: when the pill's fixed width leaves less room than the chip's full-size natural width — the real case for the live Test match's longer `seriesStatus` string (~263px needed vs ~222px available) — the chip drops to its own full-width line below the pill at full size, rather than shrinking or truncating.

**TC3 — v1.0.73: the win-prob NOW-label offset was never a data-reference bug, only a label-placement bug**
Reported as the current-point marker sitting ~20px left of the "NOW" line. Direct SVG coordinate inspection found the dashed guideline, the marker dot, and the trend line's own rendered endpoint were all already exactly on the same `nx`/`ny` — bit-for-bit identical. The actual offset was the "NOW" text label itself, deliberately placed at `nx+7..nx+33` (centered at `nx+20`) so the label box wouldn't cover the dot near a chart edge — a real ~20px gap between the label's own text and the true line, which is what a naive coordinate check against the label (not the guideline) would measure. Fixed by moving the label above the entire plot area (same row as the "2ND INN" divider tag), centered on the same `nx`, clamped so it can't spill past either chart edge.

**TC4 — v1.0.74: reverted the whole v1.0.68–v1.0.72 thread rather than continuing to patch a chain of follow-on regressions**
The v1.0.68 fixed-width table pill cascaded: series-chip truncation (v1.0.69 attempt) → font-shrink to compensate (v1.0.71) → row wrapping to two lines (v1.0.70) → that wrap regressing again once the font-shrink reverted (v1.0.72). The original content-hugging behavior never had any of these problems, so `components/LiveCarousel.tsx` was restored to the exact pre-v1.0.68 pill (content-hugging, no `TABLE_PILL_WIDTH` constant) and pre-v1.0.69 chip (`text-[11px]`, `px-3 py-1.5`, `gap-1.5`, both icons, no `truncate`/`min-w-0`); container stays `flex-wrap`, unchanged from the original. `DESIGN-SYSTEM.md` §7 updated to describe the restored pattern and explicitly warn against re-fixing the pill's width without solving the whole row's layout at once — that's the exact trap that produced the cascade.

---

## Dot-indicator effect-timing fix, hero-badge redundancy, tab-width fixes — v1.0.75 to v1.0.79 (2026-07-20)

**DI1 — v1.0.75: root cause was a stale-ref effect that never got a second chance to attach, not a rendering bug**
Reported: Spotlight/"for you" swipe-carousel dots stuck permanently at index 0 regardless of swiping (LiveCarousel's own dots worked fine). Confirmed via direct React fiber inspection: `useCarouselIndex`'s effect deps are `[ref, itemCount]`; `ref` is a referentially-stable `useRef`, so the effect only re-runs if `itemCount` itself changes. Spotlight/"for you"'s calls live in `Home()`'s own hook list and run unconditionally on every render — including the very first `isBooting=true` render, which shows a skeleton instead of the real carousel markup. On that first run `ref.current` was `null`, so the effect returned early with no listener attached (confirmed live: the committed effect's `destroy` was `undefined`). ~350ms later the real carousel mounts, but `itemCount` never changed across that swap, so React's dependency check saw no change and never gave the effect a second chance. Fixed inside `useCarouselIndex` only: poll for `ref.current` via `requestAnimationFrame` instead of assuming it's already attached, capped at ~2s of retries.

**DI2 — v1.0.76: requestAnimationFrame is fully suspended (not just throttled) while a tab is backgrounded — switched to setTimeout**
DI1's fix was correct in principle but used rAF for the retry loop, which stops entirely (not merely slows) while the tab is hidden. Confirmed live: if `isBooting`'s ~350ms flip happens to land during that window, the rAF retry never fires and the exact same "stuck at index 0" symptom resurfaces from a different cause. Switched to `setTimeout(50ms)`, which keeps running (at worst throttled, never fully stopped) regardless of visibility — this is a one-time "has the node mounted yet" check, not a per-frame animation, so rAF was never actually required.

**HB1 — v1.0.77: hero badge redundancy fixed for the one case that's actually redundant, not by hiding the badge everywhere**
Reported: hero card's badge showed "IND V AUS · Sydney" — pure duplication of the two teams already shown as the card's main content. Root cause: `CompetitionBadge` renders `match.competition.shortName` verbatim, and for bilateral series with no named identity, `shortName` literally IS the two teams restated ("IND v AUS", "IND v ENG"). Named series (Ashes) and every league (IPL, WTC) don't have this problem — their `shortName` is a real, distinct identity. Fix detects the exact redundant case only (`competition.type === "bilateral"` AND `shortName` matches `"{teamA.code} v {teamB.code}"` in either order) and swaps the badge to the match format (T20I/ODI/Test/etc.) instead — genuine info not shown elsewhere on the card. Every other case renders unchanged. Fixed in the shared `CompetitionBadge` component, so Spotlight (which reuses it) is corrected for free, not just the hero card that was reported.

**TW1 — v1.0.78 + v1.0.79: fixing uneven tab widths exposed a second, real problem — solved by shortening the label, not re-breaking equal widths**
`MatchTabs`'s tabs use `flex-1` intending equal widths, but a button's default `min-width: auto` makes flexbox fall back to each button's own content width as a floor — "Scorecard" (longest label) couldn't shrink below ~110px vs ~71–75px for the others. Added `min-w-0` (v1.0.78) so `flex-basis: 0%` could actually take effect, plus a `truncate` safety net. Verified live that the safety net *did* fire — "Scorecard" rendered as "SCOR…" at the now-equal width. Measured every tracking option first (`tracking-widest/-wide/-normal`); none closed the ~19px gap, so per the already-agreed fallback, shortened the visible label to "Score" (v1.0.79) — ~47px, comfortable margin. The tab's `key` stays `"scorecard"`; only the label changed, not the tab's identity or the component it opens.

---

## Real-data readiness fixes — v1.0.80 (2026-07-20)

**RR1 — Runtime validation/adapter layer added at the data boundary (`lib/dataValidation.ts`), never throws, collects errors and warnings separately**
Previously, malformed data from any future real feed would flow silently into narrative/win-prob functions with no gate at all. `normalizeMatch(raw, opts?)` validates Match/Innings/Ball/Team/Venue/Competition shapes with hand-rolled type guards, collecting every issue into `errors` (blocking — the record is dropped) and `warnings` (non-blocking, e.g. a missing `innings[0].runs`) rather than failing on the first problem found, so one full report comes back per object. Logs via `console.error`/`console.warn` with a `[Bawler:DataValidation]` prefix; never throws, so a bad record can't crash the render path. Wired into `lib/matchGenerator.ts` as the template call site for a future real API adapter — both `generatePastMatches`/`generateFutureMatches` now filter their generated output through `normalizeMatch(...).ok`.

**RR2 — `lastName()` replaced with an explicit-field lookup (`getPlayerShortName()`), never a name-split heuristic**
The old approach algorithmically guessed a "short name" by splitting the full name string — breaks on multi-part surnames (Sri Lankan compound names, "de Silva"-style Dutch/Afrikaans surnames) where the last space-separated token isn't the actual surname. `getPlayerShortName()` looks up each player's own registry `shortName` field instead; if a player isn't in the local registry (a real-API case where the field might not exist yet), it returns the **unmodified full name**, never a guessed split — a slightly-longer label is a safer failure mode than a confidently wrong short name.

**RR3 — `deriveTestSessions()` no longer confuses a rain/bad-light stoppage with a real session break**
Previously a single `SESSION_BREAK_MS` gap threshold couldn't distinguish a genuine lunch/tea break from an hours-long weather delay — both just "a gap between balls." Replaced with a `SESSION_BREAK_MIN_MS`(20min)–`SESSION_BREAK_MAX_MS`(75min) window: a gap inside that window (and not already covered by an explicit `KnownStoppage` entry, and not itself a day boundary) is a genuine session break; a gap outside it is an irregular stoppage that merges into the current session rather than advancing the session index. Day-boundary detection made unconditional on the calendar date rather than gap-dependent — this was itself a fix to a previously-defined-but-unused `DAY_BREAK_MS` constant that the old logic never actually checked.

**RR4 — Narrative thresholds made runtime-overridable (`lib/narrativeThresholds.ts`) instead of hardcoded constants scattered through `DigestTab.tsx`**
`getNarrativeThresholds()` merges a `localStorage`-persisted partial override over `DEFAULT_NARRATIVE_THRESHOLDS`, guarded with `typeof window === "undefined"` for SSR safety; `setNarrativeThresholdOverride()`/`clearNarrativeThresholdOverride()` manage the override. Lets narrative calibration against real match statistics be retuned without a full redeploy.

**RR5 — `target!` non-null assertion in `lib/winProb.ts` replaced with a real null check that produces fewer chart points, never a fake NaN-derived one**
The chase-innings branch asserted `target!` was non-null and computed `need = target - cumulativeRuns` regardless — if `target` were ever actually null/unpopulated from a real feed, this silently produces `NaN`, which can render as a confident-looking but meaningless percentage. Changed to `if (target === null) { continue; }` — skip pushing that point entirely rather than asserting past a missing value. `calculatePressureGauge` given the same treatment: guards `firstInningsRuns` before computing `target = firstInningsRuns + 1`, returning `null` from the whole function rather than computing off a fabricated `+1`.

**RR6 — Verified with constructed edge-case data, not just the existing mock generators**
`scripts/edge-case-check.ts` specifically constructs a multi-part surname, a rain-delay-sized gap, and a null/zero first-innings-runs state — deliberately not reusing the mock-generator's own data shapes, since a fix validated only against the generator that already produces "nice" data wouldn't actually prove anything about real-world malformed input. All pass, including confirming the validation layer's warning log fires as expected.

---

## Digest tab overhaul: performance, structure, narrative, visual hierarchy — v1.0.81 to v1.0.82 (2026-07-20)

**DG1 — Benchmarked before deciding whether a full incremental rewrite was warranted; found the real bottleneck wasn't compute at all**
Built `scripts/digest-benchmark.ts` (synthetic 4-innings, 5-day, ~2190-ball Test) to measure the existing from-scratch-every-tick pipeline against a realistic full match and update frequency, rather than assuming a rework was needed. Result: raw recompute cost was NOT the bottleneck — avg ~1.7ms, max ~7ms even near a full match. The actual cost was React re-render/reconciliation triggered by every card object getting a brand-new reference on every tick, forcing every already-rendered card to re-render even when its underlying data hadn't changed. Redirected the fix accordingly: reference-stable caching for object-identity stability + `React.memo` on each card view, not a ground-up incremental-compute rewrite.

**DG2 — Cache built on an explicit append-only assumption, deliberately not engineered against corrections that have never been observed (see RD8)**
A `Map<string, DigestCardData>` (`DigestCardCache`), keyed by card id, only ever gets populated once a card's underlying data can never change again — a Test session/day marked `isComplete`, or an over-group chunk that's provably complete by construction (`completedOverNums` already excludes any partial trailing over). Held in a `useRef` inside `DigestTab`, reset whenever `match.id` changes. Re-benchmarked after: object-identity stability across ticks went from 0% to ~95%. This assumption — that a real feed never retroactively edits an already-"complete" ball — is now the single documented open risk of the whole cache (RD8, added v1.0.84).

**DG3 — Structural dedup: a completed day shows exactly one day-summary card, an in-progress day still shows its live session cards**
`buildTestSessionCards()` restructured so that while a day is still in progress, individual session cards render as each session completes (unchanged, already correct); once a day fully ends, those session cards are replaced with a single `DaySummaryCard` describing however many sessions were actually played (2 on a weather-shortened day, 3 normally) — no lingering duplicate session cards alongside the day card. Verified live across a multi-day Test: one consolidated card per completed day, including a weather-shortened 2-session day.

**DG4 — Narrative variety fixed by seeding phrase selection off session ordinal position, not by tracking which rendered strings have been used**
The original design tracked "already-used" phrases by comparing fully-rendered strings (with numbers already interpolated) — this masked the actual bug (see v1.0.82/DG7 below). Replaced with `pickPhrase(variants, seed)` (deterministic slot selection) and `buildSessionLine()`, which buckets each session by what actually happened (weather-shortened, bowling-collapse, strong-bowling, dominant-batting, steady-batting, stalemate, swing, competitive — checked in that priority order) before picking a phrase, rather than defaulting to one generic dramatic closer regardless of context. Phrase bank expanded to 3 variants per bucket.

**DG5 — Visual hierarchy applies Spotlight's own "boolean gate" philosophy, not a composite/accumulated excitement score**
`isNotableOverGroup`/`isNotableSession`/`isNotableDay` each clear on one explicit, concrete condition (e.g. an 11-wicket day), matching how `lib/spotlight.ts` already decides notability elsewhere on the platform. Notable cards get a subtle amber accent border (`border-amber-400/40`, plus the existing `excitement-glow` pulse if also live) instead of a loud badge; routine cards stay visually quiet. Applied consistently to `OverGroupCardView`, `SessionCardView`, and `DaySummaryCardView` (the last also swapping its header background/label color, not just the border, via full literal Tailwind class strings picked by ternary — template-interpolated class names are invisible to Tailwind's build-time JIT scanner and would have silently shipped with no visible accent at all; caught by reasoning through the build pipeline before it ever deployed).

**DG6 — Same principles applied to the T20/ODI over-group cards, not just the Test day/session version**
`buildOverGroupCards()` received the same cache-by-id treatment (every produced over chunk is provably complete, so it's safe to cache unconditionally) and the same `isNotable` boolean-gate treatment as the Test session/day cards — variety and notable-vs-routine distinction aren't Test-only.

**DG7 — v1.0.82: the real repeat-phrase bug, caught only by live verification, not by local tests**
Live testing on the deployed v1.0.81 site showed Day 2's two bowling-dominated sessions (5 wickets/116 runs, then 6 wickets/32 runs) both closing with "...Brutal and brilliant." — because the original `pickUnusedPhrase(variants, used: Set<string>)` tracked usage by comparing the FULLY-RENDERED string (numbers already interpolated). Different embedded numbers meant the two sessions' rendered strings never matched, so the Set never registered a repeat and kept returning the same variant-0 template for both. `digest-check.ts`'s local test had used identical stats across all 3 test sessions, which produced identical strings and made the buggy Set-check accidentally "pass" — masking the defect entirely in local testing. Fixed by removing the whole rendered-string-comparison mechanism in favor of DG4's `pickPhrase(variants, seed)`, seeded off each session's own ordinal position within the day (`slotIndex + e.sess.day`) — guarantees distinct variants regardless of what numbers get interpolated. `digest-check.ts` strengthened to use deliberately different stats per test session plus a fixed-phrase-marker check, specifically so this exact failure mode can't be masked again.

**DG8 — Verification standard: live deployed-site testing, not "the local test suite passes"**
Every claim above (structural dedup, phrase variety, notable-day distinction, cache stability) was verified against the actual deployed `bawler-gold.vercel.app`, including using Claude-in-Chrome's `javascript_tool` to fetch and grep the deployed JS bundle for signature strings when investigating a suspicious hydration warning — which turned out to be pre-existing (`MatchView.tsx`'s tab-restoration `useState` initializer, unrelated to any of today's Digest work) rather than newly introduced, confirmed by testing the homepage (unaffected, Digest isn't mounted there) as well as Test and non-Test match pages.


---

## Version-footer bug, fixed from root — v1.0.83 (2026-07-20)

**VF1 — Reported: footer read "Bawler v1.0.65" after v1.0.82 was already live — root cause was a hardcoded literal never updated across 17 releases, not a deploy propagation failure**
`components/MatchView.tsx`'s footer had a literal `Bawler v1.0.65 · all data mocked` string, written once and never touched again despite 17 subsequent version bumps recorded elsewhere in this log — a hard refresh could never fix it because the deployed code itself was wrong, not stale-cached. User explicitly required a root-cause fix, not a one-off correction ("it shouldn't happen again").

**VF2 — Fix designed to make the regression structurally impossible, not just numerically correct for now**
`package.json`'s `"version"` field repurposed as the single source of truth. New `lib/version.ts` derives `APP_VERSION`/`APP_VERSION_LABEL` from it directly (`import packageJson from "../package.json"`) — nothing else may declare a version. `MatchView.tsx`'s footer now renders `{APP_VERSION_LABEL}` instead of a literal. The part that actually prevents recurrence: `scripts/version-check.ts`, wired as an npm `"prebuild"` hook — meaning it runs automatically as part of `npm run build`, the exact command Vercel's deploy pipeline invokes, not an optional side script someone has to remember to run. It confirms `lib/version.ts`'s derived values match `package.json`, and walks `app/`/`components`/`lib` for any other file matching a hardcoded `Bawler vX.Y.Z` pattern outside an explicit allowlist (`lib/version.ts` only) — if a hardcoded version literal ever reappears anywhere, `npm run build` fails outright and the bad deploy never ships.

**VF3 — Enforcement mechanism itself verified, not just the current version value**
Deliberately reintroduced the exact original bug (hardcoded literal in the footer) twice — once against `version-check.ts` run standalone, once against the full `npm run build` pipeline — and confirmed both failed with a clear error before reverting. This is the difference between "the number is correct today" and "this class of bug cannot recur": the original defect wasn't an incorrect value, it was the total absence of anything that would have caught it.


---

## Filter sheet: category order, real team colors, meaningless-dot removal — v1.0.86 (2026-07-21)

**FC1 — Category order changed to match how people actually think about following cricket: country, then competition context, then club, then individuals, then format**
`CATEGORY_META` reordered from Nation/Team/Tournament/Player/Format to Nation/Tournament/Team/Player/Format. Purely a display-order change in `components/FollowSheet.tsx` — `FollowCategory`/`FollowPrefs` field order in `lib/followPrefs.ts` untouched, since nothing there depends on iteration order (each category is its own named array).

**FC2 — Team color audit: ~50 franchise teams checked against real official branding via multi-source web research (Wikipedia infoboxes, teamcolorcodes.com, schemecolor.com, TheSportsDB, jersey-launch press coverage), not just the 4 examples flagged**
Corrected 20 teams whose current hex was in the wrong color family entirely or clearly stated wrong across corroborating sources — not chased every minor shade-drift nitpick a single source raised, since exact PMS-level precision isn't achievable without each league's own brand-guideline PDF (which none publish publicly). Fixed: GT (navy+gold, was Google-blue placeholder), HEAT (teal+white, was orange+purple), STR (bright blue+silver, was navy+gold), DURGD (blue+red, was teal+orange), STARS (lawn green+dark green, was saturated green+white), SCORCHERS (secondary dropped invented navy — Scorchers have no blue in their palette), HURRICANES (secondary dropped invented cyan — no cyan in their palette), KAR (deep sapphire, was cyan), PES (yellow+black — Zalmi's actual kit since PSL4/2019, was orange+red), QUE (true purple, was blue-indigo), MUL (royal blue, was maroon — their "signature colour has always been" royal blue per official kit-launch coverage), ISL (secondary orange/gold, was invented navy — Islamabad United has no blue at all), JSK (secondary green, not blue — Wikipedia explicitly lists "Yellow and Green," the assumed CSK-mirroring blue was wrong), PREC (blue+red, was navy+cyan — no red at all previously despite Wikipedia listing "Blue and Red"), SKP (red primary — every source names red as dominant, was green+gold with no red), SEAO (black+light green, was teal+navy — neither appears in any source for Seattle Orcas), SFU (secondary navy, was an invented purple with no source basis), SRH (tightened to the most-cited official orange `#EE7429`, was a lighter yellow-toned `#F7A721`). Barbados Royals' pink (`#EA1A85`) reconfirmed correct as flagged by the user — not touched.

**FC3 — Trent Rockets and Welsh Fire fixed independent of the larger Hundred-identity question below (FC4), since both are real color bugs regardless of naming**
TRR: primary/secondary swapped to yellow-primary/red-secondary (`#FFD500`/`#CC0033`) — multiple sources (Wikipedia, 2026 Nike kit-launch coverage, retailer listings) confirm yellow is Trent Rockets' consistently-retained identity color; the app had it red-primary/white-secondary with no yellow at all. WEF: secondary corrected to black (`#1A1A1A`, was gold `#FFD700`) per retailer-confirmed red/black kit; primary red left as-is (reasonable shade, not contradicted by any source).

**FC4 — The Hundred 2026 ownership rebrand: verified via web search (Sky Sports, Yahoo Sports, cricketnmore.com) before acting, then fully renamed + recolored per explicit user decision**
Discovered mid-audit that 3 Hundred teams were actually renamed for the real 2026 season after IPL-adjacent groups bought ownership stakes, with kit colors changed to match: Oval Invincibles → **MI London** (Reliance/Mumbai Indians, 49%), Manchester Originals → **Manchester Super Giants** (RPSG/Lucknow Super Giants, 70%), Northern Superchargers → **Sunrisers Leeds** (Sun TV/Sunrisers Hyderabad, 100%, the only full sale). A 4th, Southern Brave, kept its name but switched from green to blue+red (GMR/Delhi Capitals, 49%) per the same wave of deals. This is a real, verified event, not a research artifact — flagged to the user as a scope question (bigger than a color fix — requires renaming teams, not just correcting hex) rather than silently expanded or silently ignored. User chose full rename + recolor, reasoning that the app already models the current 2026 season everywhere else (IPL 2026, current Test/T20I data), so keeping 3 stale identities would be a bigger inaccuracy than the color bug being fixed.

Implementation, scoped deliberately narrow — renamed the team identity fields only, left squads untouched (a full roster reconciliation against real 2026 auctions is a separate, much larger task not in scope here): `OVI`→`MIL` (code + key), `MOR`→`MSG`, `NSC`→`SUL`; `SBR`'s code/key unchanged since its name didn't change. Colors set to mirror each new owner's real IPL franchise, matching the existing internal convention already used for MI Cape Town/MI New York (mirror MI exactly) and Joburg/Texas Super Kings (mirror CSK exactly): MIL → MI's blue/gold (`#004BA0`/`#D1AB3E`); SUL → SRH's orange/black (`#EE7429`/`#000000`, using the FC2-corrected SRH hex); SBR → DC's blue/red (`#17449B`/`#EF1B23`); MSG → red/blue per Sky Sports/The National's specific description ("red and blue... symbolising Manchester's United-red/City-blue split"), since Manchester Super Giants' actual kit deviates from parent LSG's own blue/orange colors for this specific "local derby" design reason — used `#C8102E`/`#00A2D6` rather than blindly mirroring LSG. Updated all 3 internal references to the old codes (Hundred standings rows, one scheduled match's `teamA` object reference, Ben Stokes' `franchiseCode`) — confirmed via grep these were the only 3 usage sites outside the team registry itself.

**FC5 — Removed the colored dot entirely from Tournament, Player, and Format rows in the Filter sheet, rather than trying to make each carry real signal**
Confirmed the reported complaint before touching anything: Tournament rows all shared `Competition.logoColor`, which repeats across unrelated competitions (BBL and the T20 World Cup both render the same cyan) because that field's actual job elsewhere (schedule-page accent bars, badge chips) was never designed to be a unique-per-competition identifier. Player rows resolved a franchise-team color that duplicated the nationality text already shown as the sublabel, and only worked for players with a resolvable team at all — inconsistent by construction. Format rows had no color field whatsoever and always fell through to the same gray default. Rather than inventing a new, meaningful color system for three categories that don't naturally have one, removed the `Swatch` render entirely for `tournaments`/`players`/`formats` (kept only for `nations`, which correctly uses a real flag image, and `teams`, now backed by FC2's corrected colors) — and dropped the now-unused `color` field from `buildOptions()`'s tournament/player mapping so the dead data doesn't linger as a red herring for a future reader.

---

## Filter sheet: split bilateral series out of Tournaments into a new Series category — v1.0.88 (2026-07-21)

**SC1 — Root cause: "Tournaments" mixed two genuinely different concepts because both happened to share the `Competition` type, not because they're the same kind of thing**
Reported: bilateral series like "India tour of Australia 2026" and "India tour of England 2026" appeared inside "Tournaments" alongside genuine multi-team competitions (BBL, IPL, Champions Trophy, T20 World Cup, WTC) — a real mismatch, since a tournament implies a structured, multi-team competition, while a bilateral series is just two nations playing a fixed set of matches. The underlying data already distinguished these correctly — every `Competition` in `lib/mockData.ts` has always carried an explicit `type: "bilateral"` field (used elsewhere for the nation-suppression rule in `qualifyMatch`, FY-era logic) — the bug was purely that `FollowSheet.tsx`'s `buildOptions("tournaments")` case never filtered on it, listing every `Competition` regardless of type. Fixed by filtering on the field that already existed, not by pattern-matching the "[Nation] tour of [Nation] [year]" name string — that would have missed The Ashes, whose name doesn't follow that pattern but is exactly as bilateral as the other three, and is the fourth entry that moved.

**SC2 — New `series: string[]` field added to `FollowPrefs` as a first-class category, not a filtered view of `tournaments`**
Threaded through every place `tournaments` already existed, so `series` behaves identically end to end: `emptyFollowPrefs()`, `sanitizeFollowPrefs()` (new `validSeriesIds()` mirrors `validTournamentIds()`, now itself narrowed to `type !== "bilateral"` so a stale bilateral id sitting under `tournaments` from before this fix is correctly dropped as no-longer-valid-there rather than silently kept), `prefsEqual()`, `totalFollowCount()`. `MatchQualification` gained a `series: boolean` field (checked against `match.competition.id`/`match.championship.id`, identical logic to `tournament`) and `isTier1Match()` now includes it — a followed series surfaces in the homepage "for you" row exactly as a followed tournament always has, just correctly attributed. No other call site (`app/page.tsx`) needed to change, since they consume `isTier1Match()`/`isAnyMatch()` generically rather than inspecting individual `MatchQualification` fields.

**SC3 — Category rail order: Series placed directly after Tournaments, before Teams**
`CATEGORY_META` reordered to Nations, Tournaments, Series, Teams, Players, Formats — Series sits next to Tournaments since it's the closely-related "which competition/context" concept, ahead of Teams/Players which are about specific entities rather than a competition. Verified live: `buildOptions("series")` lists exactly the 4 bilateral entries (The Ashes 2025-26, India tour of England 2026, India tour of Australia 2026, South Africa tour of England 2026), `buildOptions("tournaments")` lists exactly the 10 genuine competitions, and following a series via the new category surfaces it in "for you" identically to how a tournament-follow already did — confirmed via `scripts/series-category-check.ts` (constructed match + prefs, not just a visual check) plus a live check of the rendered category list.

---

## "For you" upcoming card: 7-day countdown/plain-date presentation split — v1.0.89 (2026-07-21)

**FD1 — Confirmed (own question, prior turn) that `forYouSelection`'s upcoming-match fallback has no lookahead cutoff, and confirmed here that keeping it that way was the right call**
`app/page.tsx`'s upcoming branch always picks the single soonest qualifying match — could be tomorrow, could be months out — with no distance filter anywhere in the selection path. The user explicitly asked to leave that selection logic untouched; the actual defect is presentation, not selection: a match 3 months out was rendering with the identical `"in {N}d {N}h · {time}"` treatment as a match tomorrow, and a countdown stops carrying real information at that distance ("in 84d 3h" is noise, not a signal).

**FD2 — Correction to the request's stated premise: the "Coming Up" grid does NOT already have a matching 7-day countdown/date split**
The request described this as matching an existing convention already used by the "Coming Up" grid. Checked `FutureMatchCard` (`components/MatchCard.tsx`) directly: it always renders `fmtCountdown(iso) · fmtTime(iso)`, unconditionally, regardless of how far out the match is — there is no 7-day (or any) threshold anywhere in that card, or anywhere else in the app before this change. Flagged this rather than silently building the feature as if the mirrored behavior already existed somewhere; implemented the 7-day threshold as a genuinely new piece of presentation logic, scoped to `ForYouRow` only. `FutureMatchCard` is unchanged and would show the same "noise" countdown for a truly distant match today — worth a follow-up if the same distant-match problem is ever reported there.

**FD3 — New `fmtForYouDistance()` helper (`app/page.tsx`) wraps the existing `fmtCountdown`/`fmtTime`, doesn't replace them**
`FOR_YOU_COUNTDOWN_MAX_MS = 7 * 86400000`. Within the window: identical output to before (`fmtCountdown(iso) · fmtTime(iso)`) — zero visual change for the common case, which is every real match in the current mock dataset. Beyond it: `` `Next match: ${fmtShortDate(iso)}` ``, a new short-date formatter using `day: "numeric", month: "short"` (no weekday, no year — this is a compact label, not the fuller `"{weekday}, {day} {month}"` format `MatchCard.tsx`'s own `fmtDate` uses elsewhere). Deliberately kept the app's existing `en-IN` locale convention (day-before-month, e.g. "19 Oct") rather than the requesting message's own casual example ("Oct 15", month-before-day) — every other date string in the app (Spotlight's date line, schedule pages, `MatchCard.tsx`'s `fmtDate`) already renders day-before-month via the same locale, and introducing a second date-ordering convention for one card would be a worse inconsistency than diverging from an inline example that almost certainly wasn't meant as a strict spec.

**FD4 — Verified via constructed dates, not just a description of the logic, since the real mock data has no >7-day upcoming match**
Ran the exact threshold logic against synthetic ISO timestamps at 2 days (within window — confirmed countdown format, unchanged), 6.9 days (just under — still countdown), 7.1 days (just over — switches to plain date), and 90 days (well over — plain date, confirmed no countdown text leaks through). All four cases behaved as specified; boundary checked from both sides, not just one comfortably-inside and one comfortably-outside case.

---

## Homepage version footer added — v1.0.90 (2026-07-21)

**HF1 — Not a regression: the homepage never had a version footer, it was only ever added to the match-detail page**
Raised during a "for you" investigation as a verification-reliability problem ("the homepage footer isn't currently showing a version string at all"). Checked directly: `APP_VERSION_LABEL` (`lib/version.ts`) is only imported/rendered in `components/MatchView.tsx`, which mounts on `/match/[id]` pages. The v1.0.83 root-cause fix (stale "v1.0.65" footer, structurally enforced via `scripts/version-check.ts`) targeted the specific reported location — it was never extended to the homepage, which simply has no footer element of any kind. Confirmed live: the deployed match page correctly shows `Bawler v1.0.89`; the deployed homepage shows nothing matching `Bawler v`. Not a broken value, an absent one.

**HF2 — Added the identical footer to the homepage, reusing `APP_VERSION_LABEL` rather than a second literal**
`app/page.tsx` now imports `APP_VERSION_LABEL` from `lib/version.ts` and renders the same `Bawler {APP_VERSION_LABEL} · all data mocked` footer at the bottom of the page, styled identically to `MatchView.tsx`'s. `scripts/version-check.ts`'s existing hardcoded-literal scan already covers this file (it walks all of `app/`), so no enforcement-script change was needed — the check was already broad enough to catch a hardcoded version anywhere in `app/`, it just had nothing to catch here before since there was no footer at all. Both pages now derive from the same single source of truth.
