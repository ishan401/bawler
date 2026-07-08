# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

---

## [1.0.34] 2026-07-07

### Partnership velocity spark — Scorecard tab

#### Added — `computePartnerships()` in `components/Scorecard.tsx`
- Groups `innings.balls` by wicket intervals to define partnership boundaries
- Resolves batter display names via `battingCard.playerId` match → `ball.batterName` fallback
- Computes total runs + balls per partnership
- Generates `velocity[]` array: RPO per 3-ball window — the data series for the sparkline
- Returns `[]` when `innings.balls` is empty, making the section invisible on scorecard-only matches

#### Added — `VelocitySpark` SVG component
- 72×22px inline SVG, no external dependency
- Team `primaryColor` used for stroke and area fill
- Gradient area fill: team color at 25% opacity (top) → 2% (bottom)
- Polyline with `strokeLinecap="round"` + `strokeLinejoin="round"` for smooth appearance
- Terminal dot marks the end of the partnership
- Y scale: `max(velocity, 6 RPO)` — slow partnerships don't exaggerate flat lines
- Single-point fallback: centered dot for 1-ball partnerships

#### Added — Partnerships section in `InningsCard`
- Sits between Batting card and Bowling card in the Scorecard tab
- Only rendered when `partnerships.length > 0` (ball data required)
- Each row: sparkline | batter 1 & batter 2 names + "Pship N" label | runs (balls)
- Uses `SectionLabel` component consistent with Batting/Bowling headers

---

## [1.0.33] 2026-07-07

### iOS Safari back-swipe fix + SeriesScheduleSheet real-data decoupling

#### Fixed — `BottomSheet` back-button handling (`components/LiveCarousel.tsx`)
- **Before:** `history.pushState({ bawlerModal: true }, "")` with no URL change — iOS Safari ignores this for its left-edge swipe gesture, so back-swipe navigated the full page instead of closing the sheet
- **After:** `history.pushState({ bawlerModal: true }, "", cleanUrl + "#modal")` — hash change is treated as a navigable history entry by iOS Safari, so back-swipe fires `popstate` and closes the sheet correctly
- **Cleanup fix:** replaced `history.back()` in cleanup with `history.replaceState(null, "", cleanUrl)` — avoids double-navigation when the sheet is dismissed programmatically (swipe-down, backdrop tap, × button)
- Stable `onCloseRef` pattern prevents stale closure on the `popstate` handler
- Works correctly on: Android Chrome/Firefox, iOS Safari browser + PWA, desktop Chrome/Safari/Firefox

#### Refactored — `SeriesScheduleSheet` real-data decoupling
- Removed direct imports of `ALL_PAST_MATCHES`, `ALL_LIVE_MATCHES`, `ALL_UPCOMING_MATCHES` from inside the component
- Now accepts `seriesPool: Match[]` prop — the parent passes all matches; the component only filters
- `LiveCarousel` builds `seriesPool = useMemo(() => [...ALL_PAST_MATCHES, ...matches, ...ALL_UPCOMING_MATCHES], [matches])` where `matches` is the live-data prop (already real-data-ready)
- When real API data arrives: replace the two `ALL_*` references in `LiveCarousel` — zero changes to `SeriesScheduleSheet`

#### Added — `resolveCompetition()` in `lib/transformers.ts`
- Maps numeric Cricbuzz `seriesId` → internal `Competition` via `CRICBUZZ_SERIES_ID_MAP`
- Falls back to `unknown-series-{id}` with a `console.warn` for unmapped series — sheet returns 0 matches rather than silently mixing up two different series
- All transformer paths (live, recent, schedule) must call this instead of passing raw seriesId strings into `Match.competition.id` — ensures `competition.id` is identical across all match statuses for the same series

---

## [1.0.32] 2026-07-07

### Series schedule bottom sheet

#### Added — Series status chip now clickable (`components/LiveCarousel.tsx`)
- `<span>` → `<button>` with `onClick={() => setView("series")}`
- Hover/tap styling: `hover:text-text-primary hover:border-cyan/40 transition-colors tap-scale`
- Chevron icon (8px) appended inside the chip to signal interactivity
- `view` state union extended: `"none" | "standings" | "team-schedule" | "series"`

#### Added — `SeriesScheduleSheet` component (`components/LiveCarousel.tsx`)
- Opens as a `BottomSheet` with competition name as title
- Filters `seriesPool` by `competition.id` + same two team codes (Set-based, handles either team order)
- Three sections sorted chronologically: past matches, live match, upcoming matches
- **Past match cards:** date, team names, innings scores (attribution-aware via `battingTeam` field), result margin, venue
- **Live match card:** green `bg-six/10` highlight, pulsing LIVE badge, current scores, venue
- **Upcoming match cards:** countdown chip (in Xd / in Xh Xm), date + time, venue
- Empty state when no series matches found
- Book-page swipe indicator (double-bar drag handle)

#### Added — 1st T20I (AUS vs IND) to `PAST_INTERNATIONAL` in `lib/mockData.ts`
- Match id: `ind-aus-t20i-2026-m1` — AUS won by 23 runs; T Head 76(48) MOM
- Gives the series sheet a full 3-match context: 1st T20I (past) → 2nd T20I (live) → 3rd T20I (upcoming)
- Full batting + bowling cards for both innings

---
## [1.0.15] 2026-07-02

### Home page — TABLE button + team schedule popup

#### Added — Dynamic TABLE button on live carousel (LiveCarousel.tsx)
- A **"[Comp] Table" pill button** appears below the live carousel only when the currently snapped card is a league or tournament match
- Button is fully dynamic: swipe to an IPL card → "IPL Table" appears; swipe to a Test/bilateral card → button disappears; swipe to PSL → "PSL Table" appears
- Carousel snap tracking rewritten to use `firstCard.getBoundingClientRect().width + 12px gap` (was using `el.clientWidth` which didn't account for the gap, causing index drift)

#### Added — Standings bottom sheet (LiveCarousel.tsx)
- Tapping the TABLE button opens a bottom sheet over the home page with full league standings
- Sheet includes a drag handle, competition name/subtitle, close (×) button
- Swipe-down gesture on the **handle/header only** dismisses the sheet; dragging >80px closes, less snaps back with spring transition
- Body scroll (`document.body.style.overflow = "hidden"`) locked while sheet is open, preventing background page from scrolling

#### Added — Team schedule popup (LiveCarousel.tsx, MiniStandings.tsx)
- Tapping any team row in the standings sheet opens a **second bottom sheet** showing that team's full tournament schedule — no page navigation
- Schedule sorted ascending (earliest match first)
- Past matches: Won/Lost badge in team colour + 10-word truncated summary
- Live match (if any): red left-border highlight + live status string
- Upcoming matches: date/time + venue city
- **Back button** (←) in the header returns to standings; close (×) closes everything
- `MiniStandings` gains optional `onTeamClick` prop — when provided uses `<button>` instead of `<Link>` so it works inside the popup context

#### Fixed — Sheet content scrolling (LiveCarousel.tsx)
- Added `min-h-0` to the scrollable content div — the canonical fix for `flex-1 + overflow-y-auto` not scrolling inside a flex column (content expanded to fit rather than scrolling)
- Removed `overflow-hidden` from the outer sheet container (was blocking inner scroll)
- Added `WebkitOverflowScrolling: "touch"` for iOS momentum scroll
- Touch gesture handlers moved exclusively to the header/handle zone — content area touch events no longer intercepted

---

## [1.0.14] 2026-07-02

### Test match — dual-innings score display

#### Added — Prior innings score on live Test match cards (MatchCard.tsx)
- When a Test match is in the **2nd innings or later**, the team's completed prior innings score appears **before** the current innings score: e.g. `199/10 & 88/4 (28)`
- Only triggers for `match.format === "Test"` and only when `innA.length >= 2` (team has played more than one innings)
- Shown in muted white/40 so it doesn't compete visually with the live innings score
- No change to T20/ODI display

---

## [1.0.13] 2026-07-02

### Critical bug fix — score sync and live status attribution

#### Fixed — LiveMatchCard score swap (MatchCard.tsx)
- **Root cause**: `innings[0]` was assumed to be teamA's innings and `innings[1]` teamB's. This is wrong when the visiting team bats first — their innings is `innings[0]` but they are `teamB`.
- **Fix**: Filter innings array by `battingTeam` field: `innA = innings.filter(i => i.battingTeam === teamA.code)`. Attribution is now correct regardless of toss outcome or batting order.
- Affects score display, batting indicator dot, and status text placement on live cards.

#### Fixed — liveStatusOf() status text swap (MatchCard.tsx)
- Same positional bug: function used `innings[0]` and `innings[1]` by array position to determine which team is chasing
- Rewritten to use `currentInn = innings[innings.length - 1]` and derive `battingTeam` / `fieldingTeam` from `currentInn.battingTeam`
- Status text (e.g. "ENG need 45 off 32 balls") now always names the correct team

---

## [1.0.12] 2026-07-02

### Cricket-first redesign — schedule, flags, lineup, popularity sort, win prob

#### Changed — Schedule page: competitions list with drill-down (app/schedule/page.tsx, app/schedule/[competitionId]/page.tsx)
- Schedule root now shows a **list of competitions** sorted by worldwide popularity — not individual matches
- Each row: coloured left bar, competition name, live badge (if any match is live), type + format pills, chevron
- Tapping a competition opens `/schedule/[competitionId]` showing all matches for that tournament
- Filter chips removed from schedule root (were noisy; competition grouping is cleaner)
- New server component `/schedule/[competitionId]/page.tsx` with `generateStaticParams`

#### Added — Team schedule page (app/schedule/[competitionId]/[teamCode]/page.tsx)
- Server component, pre-rendered for all `(competition, team)` pairs
- Three sections: Live Now, Upcoming, Results (reversed chronological)
- Past match rows show a Won/Lost colour bar indicator
- Linked from MiniStandings team rows (when using Link variant)

#### Added — Worldwide popularity sort for live + upcoming matches (app/page.tsx)
- Formula: `COMP_POP[comp.id] + TEAM_POP[teamA.code] + TEAM_POP[teamB.code]`
- `COMP_POP`: ICC T20 WC (100) → Ashes (90) → IPL (88) → bilateral series (68–80) → franchise leagues (40–66)
- `TEAM_POP`: IND (20), AUS (14), ENG (12), PAK (11), MI/CSK (10), RCB (9)…
- Applied to: live carousel, upcoming matches column, schedule competition list

#### Added — Country flags for national teams (MatchCard.tsx)
- `FlagOrRank` component replaces `RankPill` for national teams
- Uses `flagcdn.com/w40/{iso}.png` (40px wide) for crisp HiDPI rendering
- Flag ISO map covers 20 national teams; franchise teams still show `#rank` pill
- Switched from flag emoji (invisible on Windows) to PNG images

#### Changed — Playing XI: flat list, no subsections (LineupsCard.tsx)
- Removed "Batting Order" and "Bowlers Used" sub-headers
- Single `PlayerColumn` with `getXI()`: merges `battingCard + bowlingCard + squad`, deduped, max 11 players
- Header label: "Playing XI"
- Squad data (11 players) added to all 10 IPL teams in `mockData.ts`

#### Improved — Win probability chart (WinProbChart.tsx)
- Single smooth area chart with Catmull-Rom → cubic bezier smoothing, downsampled to ~60 points
- Team-coloured area fills under each line
- Clean header with team names + percentages; drag handle at top
- Back button (← chevron) top-left

#### Added — Win prob modal: back button + back-swipe gesture (MatchView.tsx)
- `← Back` button in WinProbChart header closes the modal
- `history.pushState({winProb:true})` on open; `popstate` listener fires `closeProbModal()` on browser back
- Mobile back-swipe gesture triggers close without needing the button

#### Added — Win prob modal: book page-turn animation (MatchView.tsx, globals.css)
- Opens with `book-enter-forward` (220 ms), closes with `book-exit-backward` (240 ms)
- `isClosingProb` state: animation plays before React unmounts the component

#### Fixed — Win% float precision (MatchView.tsx)
- `100 - 99.44` floating point error produced `0.5600000000000023%`
- Fix: `Math.round(pctA)` / `Math.round(pctB)` before display

#### Added — Live match: status text under batting team (MatchCard.tsx)
- `LiveSide` now accepts `status?: string` prop
- Status line rendered in cyan below the batting team's score (e.g. "CSK need 34 off 22 balls")
- Only shown for the batting team, not the fielding team

#### Added — MiniStandings in match Live tab for league matches (MatchView.tsx, MiniStandings.tsx)
- Compact standings card (Team / W / L / NRR / Pts) rendered in the Live tab when `match.competition.type === "league"`
- Each team row is a `<Link>` to `/schedule/{comp.id}/{team.code}`
- Playoff line indicator (top-4 teal bar) + "Tap team for their schedule" hint

#### Added — TABLE tab in match view (MatchView.tsx, MatchTabs.tsx, StandingsTab.tsx)
- `showTable = competition.type === "league" || "international"`
- When true, a fourth **Table** tab appears in the match tab bar
- `StandingsTab` renders full standings with position numbers, NRR, playoff line, eliminated teams
- `STANDINGS_MAP` currently maps `"ipl-2026"` → full IPL 2026 standings; other competitions show "coming soon"

## [1.0.11] 2026-07-02

### Team Data — accurate jersey colors + full league rosters

#### Fixed — National team jersey colors (mockData.ts)
- **AUS**: `#006A4E` (wrong green) → `#FFB81C` (Aussie Gold) — the most critical fix
- **ENG**: `#C8102E` (St George red) → `#1D244E` (England Navy) + `#00A0C6` cyan accent
- **BAN**: `#006A4E` (duplicate of old AUS) → `#1A6B3A` (Bangladesh Green)
- **ZIM**: `#006400` (dark green) → `#D4212D` (Zimbabwe Red, actual jersey)
- **NZ**: secondary updated to `#A8A9AD` silver (Black Caps brand)
- **WI**: maroon deepened to `#6E1436` + `#FFC726` gold (CWI official palette)
- **USA**: swapped — navy `#002868` now primary, red secondary (jersey is navy)
- All other national teams: minor shade accuracy improvements

#### Added — 7 new national teams
- UAE 🇦🇪 (red/white), Namibia 🇳🇦 (blue/gold), Papua New Guinea 🇵🇬 (black/red)
- Oman 🇴🇲 (maroon/white), Canada 🇨🇦 (red/white), Kenya 🇰🇪 (green/red), Uganda 🇺🇬 (black/yellow)

#### Added — Missing franchise teams (full rosters for every competition)
- **BBL**: Melbourne Renegades (RENE, red), Adelaide Strikers (STR, navy/gold) — now 8/8
- **The Hundred**: Northern Superchargers (NSC, yellow), Trent Rockets (TRR, red),
  Welsh Fire (WEF, maroon/gold), Birmingham Phoenix (BPH, maroon/gold) — now 8/8
- **SA20**: Pretoria Capitals (PREC, navy), Paarl Royals (PARR, pink), Durban's Super Giants (DURGD, teal) — now 6/6
- **CPL**: Jamaica Tallawahs (JAT, gold), St Kitts Patriots (SKP, green), St Lucia Kings (SLK, blue) — now 6/6
- **MLC**: Seattle Orcas (SEAO, teal), San Francisco Unicorns (SFU, orange), Washington Freedom (WASF, red) — now 6/6

#### Fixed — TypeScript build errors (Vercel was failing)
- `schedule/page.tsx`: escaped template literals `\`` → `` ` ``
- `CommentaryFeed.tsx`: innings type `1|2` → `1|2|3|4`
- `winProb.ts`: missing `totalBalls`/`totalBalls2` in `calculatePressureGauge`
- `page.tsx`: `UPCOMING_MATCHES` → `ALL_UPCOMING_MATCHES`

---

## [1.0.10] 2026-07-01

### Performance — faster animations, smarter re-renders

#### Removed — feGaussianBlur SVG filter from animated ball circles (BallGIF.tsx)
- `#glowB` (BowlerView) and `#glowO` (OverheadView) filters used `feGaussianBlur stdDeviation="3"`
- SVG filters are CPU-rasterized on every animation frame (60fps) — the single biggest GPU bottleneck
- Removed `filter="url(#glowB/O)"` from all animated circles; ball gradient fill remains fully visible

#### Removed — `animate attributeName="r"` from animated ball circles
- Changing the SVG `r` attribute per-frame forces geometry recalculation and full repaint
- Removed from pre-pitch ball, post-pitch ball (BowlerView), and overhead ball (OverheadView)
- Ball size is now fixed per phase rather than interpolated — visually indistinguishable

#### Added — React.memo on 7 heavy components
- `ScoreBar`, `MatchTabs`, `MiniInsightsBar`, `AIMetrics`, `MomentsStrip`, `CommentaryFeed`, `MiniWinProb`
- Components skip re-render when their props haven't changed shallowly
- `handleMomentSelect` in MatchView.tsx wrapped in `useCallback([allBalls.length])` so
  `MomentsStrip`'s `onSelect` prop is a stable reference between renders

#### Unchanged — Sticky header backdrop-blur
- `backdrop-blur` temporarily removed then restored; static sticky elements only re-composite
  on scroll — negligible compared to the 60fps SVG filter work that was the real bottleneck
- ScoreBar, MatchTabs, MiniInsightsBar, BottomNav frosted-glass look fully preserved

---

## [1.0.9] 2026-07-01

### Ball visualizer accuracy — perspective mapping + bounce arc

#### Fixed — Perspective-correct impact Y position (BallGIF.tsx — BowlerView)
- Previous formula: `impactY = PITCH_BOT_Y - pitchY * (PITCH_BOT_Y - PITCH_TOP_Y)` (linear)
- Linear is wrong for a perspective projection. The pitch trapezoid (220px wide at batter end,
  80px wide at bowler end) encodes a real perspective with width ratio 2.75.
- In a perspective view, equal 3D distances on the pitch map non-linearly to screen Y:
  the near half (batter end) takes up proportionally more visual space than the far half.
- New formula: `impactY = PITCH_BOT_Y - (wRatio × range × pitchY) / (1 + (wRatio-1) × pitchY)`
  where `wRatio = PITCH_BOT_W / PITCH_TOP_W = 220 / 80 = 2.75`
- Effect: good-length balls now appear in the upper third of the pitch (not the visual middle);
  short balls appear close to the bowler's crease; full deliveries barely change (near end
  where linear and perspective converge). Matches real TV broadcast pitch map expectations.

#### Fixed — Post-pitch bounce arc (BallGIF.tsx — BowlerView)
- Previous: `postPitchControl.y = (impactY + batterArrivalY) / 2` — control point on the
  straight line midpoint, producing zero upward arc. Ball appeared to slide along pitch.
- New: `postPitchControl.y = impactY - bounceH` where `bounceH = 10 + pitchY * 50`
- Control point sits above the impact point, creating a quadratic bezier that arcs upward
  after pitching then curves back down to the batter — physically accurate bounce shape
- Bounce height scales with delivery type: yorkers ≈ 10px, good-length ≈ 33px, bouncers ≈ 55px

---

## [1.0.8] 2026-07-01

### MiniWinProb — full redesign, both teams visible

#### Redesigned — MiniWinProb component (MiniWinProb.tsx)
- Previous design showed only the leading team's win% in a small chip — other team was hidden
- New design shows both teams' percentages side-by-side, both in `text-2xl font-bold`
- Leader is `text-text-primary`; trailing team is `text-text-dim` — clear hierarchy without hiding data
- SVG chart: gradient area fills below each team's line (30% opacity at line → 3% at bottom)
- Lines are 2.4px; ends have a dot with an outer glow ring in team colour
- Split colour bar at the bottom (same style as home page match cards)
- Chart height 72px; SVG gradient IDs namespaced (`mwp-fa`/`mwp-fb`) to prevent DOM conflicts
- `brighten()` helper normalises dark team colours (MI navy, KKR purple) so they're visible
  on the dark background — preserves hue, pushes brightest channel to 255

---

## [1.0.7] 2026-07-01

### UX polish — nav cleanup, team colours, scorecard orientation

#### Fixed — Back button removed from Schedule and Table headers (schedule/page.tsx, table/page.tsx)
- Schedule and Table are primary navigation destinations (reached via bottom tab bar)
- A ← back link on these pages implied a nav stack that doesn't exist — confusing to users
- Headers now show only the page title + subtitle; no back affordance

#### Fixed — GT team colour dot invisible in Table (lib/mockData.ts)
- GT's `primaryColor` was `#1B2133` — the same shade as the dark surface background
- Dot was rendering but completely invisible against the card background
- Changed to cobalt blue `#4285F4` — clearly distinct from MI navy (`#004BA0`),
  DC royal (`#17449B`), and LSG cyan (`#00A2D6`)

#### Added — Sticky innings header in Scorecard tab (Scorecard.tsx)
- InningsCard header (`Mumbai Indians · Innings 1 | 174/6`) is now `sticky top-[148px] z-20`
- Stays visible while scrolling through batting rows — user always knows which innings they're reading
- Removed `overflow-hidden` from outer card wrapper (was preventing sticky from working)
- Header gets `rounded-t-2xl` to maintain card aesthetics

---

## [1.0.6] 2026-07-01

### Bug fix + commentary colour refinement

#### Fixed — Whitish SVG wash on BallGIF in Safari (globals.css, MatchView.tsx)
- `perspective: 900px` was set as a permanent inline style on `<main>` in MatchView
- Safari promotes children of a `perspective` parent into separate GPU compositing layers
- SVG `fill="url(#id)"` gradient references break across compositing boundaries in Safari —
  fills fell back to transparent, letting the light card background bleed through as a white wash
- Fix: moved `perspective(900px)` inside each `@keyframes` transform so the 3D context
  only exists during the 220–300ms animation window, not permanently
- Removed `style={{ perspective: "900px" }}` from the `<main>` element

#### Changed — Commentary ball colours (lib/outcomeColors.ts)
- **Two (2)**: was mint green `#4ADE80` — now slate `#64748B`, same as dot and single
  (dots / singles / doubles all group visually as "low-impact" deliveries)
- **Three (3)**: was gold/yellow `#FBBF24` — now hot pink `#EC4899`
  (rare delivery, now unmistakably distinct)
- Singles and dots were already matching slate from v1.0.5; doubles now join them

---

## [1.0.5] 2026-07-01

### Commentary colours + nav on match page + book page-turn animation

#### Changed — Commentary ball colours (lib/outcomeColors.ts)
- **Six**: badge/tint changed from purple (`#A855F7`) → turquoise green (`#2DD4BF`)
- **Single**: was mint green — now uses the exact same colours as a dot ball (slate `#64748B`)
- **Wicket**: stays red (`#EF4444`) ✓

#### Fixed — Bottom nav missing on match page (BottomNav.tsx + MatchView.tsx)
- Removed the `/match/*` exclusion — BottomNav now renders on every page including match page
- On match page, no tab is highlighted (all dimmed) — still allows jumping to Home / Schedule / Table
- Added `pb-24` to MatchView so commentary feed doesn't get cut off behind the nav

#### Added — Book page-turn animation for tab transitions (globals.css + MatchView.tsx)
- New `goToTab()` function: tab header highlights new tab immediately, then animates content
- Exit phase (220ms, ease-in): content slides + rotates 28° in 3D — page folding away
- Enter phase (300ms, ease-out): new content slides in from opposite side — page unfolding
- Direction-aware: left swipe = forward, right swipe = backward
- Works identically for touch swipe and tab header tap
- `renderedTab` state separates what's highlighted (responds instantly) from what renders (animates)

---

## [1.0.4] 2026-07-01

### UX overhaul — immediate wins + medium effort

#### Added — Tap / press feedback (globals.css + MatchCard.tsx)
- `.tap-scale` CSS class: cards scale to 0.97 and darken on press (100ms ease)
- Applied to Live, Past, and Future match cards; next match link in empty state

#### Added — Improved back button (ScoreBar.tsx)
- Back arrow has a larger tap target, "Back" text label, and active press state

#### Added — Better empty state for Live carousel (LiveCarousel.tsx)
- When no matches are live, shows a card with next upcoming match
- Displays both team names with colours, countdown ("in 2d 14h"), match time and venue

#### Added — Loading skeleton on home boot (page.tsx + globals.css)
- `@keyframes shimmer-slide` + `.skeleton` class: animated left-to-right shimmer
- Home page shows shimmering placeholder cards for 350ms while content loads

#### Added — Pull-to-refresh on home page (page.tsx)
- Pull down from top shows spinning cyan indicator; only triggers at scroll position 0

#### Added — Swipe between tabs on match page (MatchView.tsx + MatchTabs.tsx)
- Swipe left → next tab (Live → Scorecard → Info); swipe right → previous tab
- Ignores mostly-vertical swipes so normal scroll still works

#### Added — Score event badge on Scorecard tab (MatchView.tsx + MatchTabs.tsx)
- Wicket → red pulsing dot on Scorecard tab; Six → purple pulsing dot
- Badge clears after 4 seconds or when user switches to Scorecard

#### Fixed — Infinite scroll broken by layout change (page.tsx + layout.tsx)
- Scroll listener now attaches to `document.getElementById("main-scroll")`

#### Fixed — Sticky headers offset (MatchView.tsx + schedule/page.tsx + table/page.tsx)
- `sm:top-4` caused 16px gap inside scroll container; all sticky headers changed to `top-0`

---

## [1.0.3] 2026-07-01

### Fix — Bottom nav visible on all pages

#### Problem
BottomNav used `position: fixed` inside a `phone-frame` div that has `overflow: clip` on desktop,
causing the nav to be clipped on Schedule and Table pages.

#### Fix
- BottomNav moved outside `phone-frame` entirely in `layout.tsx` — now a sibling, not a child
- `position: fixed; bottom: 0; left: 50%; -translate-x-1/2; width: min(430px, 100vw)` — never clipped
- `phone-frame` reverted to simple `mx-auto bg-bg min-h-screen max-w-[430px]` container
- All pages get `pb-24` so content clears the fixed nav

---

## [1.0.2] 2026-06-30

### Scorecard highlights + Win-prob revert

#### Added — Scorecard per-innings highlighting (Scorecard.tsx)
- Highest scorer: name + runs in teal (`text-teal-400`) per innings
- Highest wicket-taker: name + wickets in red (`text-wicket`) per innings
- Highest strike rate (min 6 balls): SR cell in blue (`text-blue-400`) per innings
- Man of Match: name in gold (`text-yellow-400`) + "MOM" badge
- Man of Series: name in purple (`text-six`) + "MOS" badge
- MOM/MOS summary banners shown above innings cards when match is complete

#### Added — result fields in types + mock data (lib/types.ts, lib/mockData.ts)
- Added `manOfMatch?: string` and `manOfTournament?: string` to `result` object
- FEATURED_MATCH: `manOfMatch: "Andre Russell"`, `manOfTournament: "Virat Kohli"`

#### Reverted — Win probability back to two-crossing-lines (MiniWinProb.tsx, WinProbChart.tsx)
- Replaced single-area-chart redesign with original two-crossing-lines design
- Both team lines cross at 50% naturally as win probability shifts

---

## [1.0.1] 2026-06-30

### Build stability hotfix

#### Fixed — Truncated source files
- 6 files truncated on disk (AIMetrics.tsx, BallGIF.tsx, FilterBar.tsx, MatchCard.tsx,
  MomentsStrip.tsx, app/layout.tsx) — completed all missing tails

#### Fixed — Missing React imports (8 files)
- `React.CSSProperties` / `React.ReactNode` require explicit import under Next.js JSX transform
- Added React to: MatchCard, FilterBar, layout, page, DeliveryCard, InlineNote,
  InsightsPanel, LineupsCard, Scorecard, ViewSwitcher

#### Fixed — Null bytes in page.tsx
- Thousands of `\x00` null bytes stripped (TypeScript reported each as "Invalid character")

#### Fixed — Strict TypeScript null in match/[id]/page.tsx
- Added `match!` non-null assertion after `notFound()` call (safe — notFound never returns)

#### Fixed — MatchCard.tsx missing "use client"
- `fmtCountdown()` calls `Date.now()` at render time; directive added

---

## [1.0.0] 2026-06-30

### UI/UX overhaul — navigation, readability, hierarchy

#### Added — Bottom navigation bar (BottomNav.tsx + layout.tsx)
- Persistent bottom nav: Home / Schedule / Table; active tab cyan + underline indicator

#### Fixed — AI metric tiles (AIMetrics.tsx)
- Context sub-label, trend arrow (↑/↓), and delta line per tile

#### Fixed — Upcoming match cards (MatchCard.tsx)
- Visual bottom anchor bar: clock + cyan countdown + time + city

#### Fixed — Moments strip (MomentsStrip.tsx)
- Two-zone chip layout; Live chip with pulsing dot; 2-line clamped context

#### Fixed — Ball visualization info hierarchy (BallGIF.tsx)
- Delivery type large on left; outcome badge right; bowler→batsman sub-row

#### Fixed — Home filter chip team colour (FilterBar.tsx + page.tsx)
- Glowing team-colour dot in TEAM filter chip when active

---

## [0.9.8] 2026-06-30
- `brightColor()` function: hue-accurate team colours in win-prob charts (fixes MI navy→cyan distortion)

## [0.9.7] 2026-06-30
- Removed event dots from WinProbChart (clutter); body forced to `#000000`

## [0.9.5] 2026-06-30
- Chart gradient opacities increased; both team zones clearly visible

## [0.9.3] 2026-06-30
- Win-prob chart: line always team A colour; zone fills always correct regardless of leader

## [0.9.1] 2026-06-30
- Win-prob redesign: single area chart, MiniWinProb + WinProbChart (later reverted in v1.0.2)

## [0.9.0] 2026-06-01 (baseline)

Initial v0.9 prototype. Full UI with mocked data.
- Home: LiveCarousel, Past/Future split columns, FilterBar, infinite scroll
- Match: BallGIF, MomentsStrip, MiniWinProb, AIMetrics, CommentaryFeed
- Scorecard tab, Info tab, Schedule page, Table page
- Win probability formula-based; WinProbChart with zoom + pinch
- Stack: Next.js 14, React 18, TypeScript, Tailwind — deployed on Vercel

---

## [1.0.16] 2026-07-03

### Bug fixes

#### Fixed — Win probability override showing inverted values
- `liveWinProbOverride.pct` is stored as 0–1 (e.g. `0.72`) but `liveWinProb()` was dividing by 100 again
- GT showing 0.7% (effectively 1%) instead of 72%; RCB override similarly broken
- Fix: `pctA = isTeamA ? pct : 1 - pct` (removed `/ 100`)
- File: `components/MatchCard.tsx`

#### Fixed — Scorecard tab empty for live matches (GT vs RR, RCB vs CSK)
- `battingCard: []` and `bowlingCard: []` — no player data in mock innings
- Populated both matches with realistic batting and bowling card data
- File: `lib/mockData.ts`

#### Fixed — MiniStandings removed from Live tab in match view
- Standings table was incorrectly rendering inside the LIVE tab of match view
- Removed both MiniStandings blocks + import from `MatchView.tsx`
- Bug introduced during removal: broken JSX comment `{/* Summary */` missing closing `}` — fixed
- Standings now only appear in dedicated TABLE tab
- File: `components/MatchView.tsx`

---

## [1.0.17] 2026-07-03

### Real-data readiness — data layer + API adapter foundation

#### Added — `CompetitionStandings` interface (`lib/types.ts`)
- New interface: `competitionId`, `phase?`, `phaseLabel?`, `updatedAt`, `rows`, `showNrr`, `showDrawn`, `qualifyingSpots`
- Standings are now fully data-driven; column config (NRR, Drawn) is per-competition
- Supports multi-phase tournaments (group stage → Super 8 → playoff) via `phase` field

#### Added — `hasStandings: boolean` to `Competition` (`lib/types.ts`)
- Replaces brittle `type === "league" || type === "international"` checks across codebase
- Bilateral series (Ashes, IND vs ENG etc.) → `hasStandings: false` → no TABLE tab, no TABLE button
- Leagues + ICC tournaments → `hasStandings: true` → TABLE tab and button appear automatically
- Adding a new competition requires setting one field; nothing else changes

#### Added — `StandingsRow` extended fields (`lib/types.ts`)
- `drawn?: number` — for Test/bilateral series standings
- `tied?: number` — rare but valid
- `netRunRate?: number` — now optional (Test series don't use NRR)
- `pct?: number` — win percentage for formats that use it instead of points

#### Added — `phase?: string` to `Match` (`lib/types.ts`)
- Carries match phase: `"group"` | `"super-8"` | `"qualifier"` | `"semifinal"` | `"final"`
- Enables phase-specific standings lookup for ICC tournaments

#### Added — `COMPETITION_STANDINGS` export (`lib/mockData.ts`)
- `Record<string, CompetitionStandings>` keyed by `competition.id`
- Covers: IPL 2026 (full), PSL 2026, BBL 2025-26, The Hundred 2026, SA20 2026 (all stubbed with realistic data)
- ICC tournaments: T20 WC 2026 Group A, Champions Trophy 2025 Group A
- Bilateral series (Ashes, IND-ENG, IND-AUS, ENG-SA): no entry — `hasStandings: false` on Competition

#### Added — `lib/transformers.ts` (new file)
- Typed adapter skeletons for 3 major cricket data APIs:
  - **Cricbuzz** (unofficial): `transformCricbuzzMatch`, `transformCricbuzzScorecard`, `transformCricbuzzStandings`
  - **ESPN Cricinfo / sportsdata.io**: `transformESPNMatch` with full `Ball` mapping
  - **SportRadar**: `transformSportRadarTimeline` — full ball-by-ball, innings grouping by `battingTeam`
- Raw types partially typed (only fields we need)
- ID lookup tables: `CRICBUZZ_SERIES_ID_MAP`, `CRICBUZZ_TEAM_ID_MAP`, `SPORTRADAR_TEAM_ID_MAP`
- All functions have clear TODO comments marking where real API logic slots in

#### Updated — `StandingsTab.tsx`
- Replaced hardcoded `STANDINGS_MAP` with `COMPETITION_STANDINGS[competition.id]` lookup
- Columns now render dynamically: NRR column shown only when `standings.showNrr = true`; Drawn column only when `standings.showDrawn = true`
- Phase label (`"Group Stage"`, `"Points Table"` etc.) renders above table when present
- Qualification line legend text uses `qualifyingSpots` count from data

#### Updated — `MiniStandings.tsx`
- Same data-layer migration as StandingsTab
- NRR column conditionally rendered based on `standings.showNrr`
- Gracefully returns `null` if competition has no standings entry

#### Updated — `MatchView.tsx`
- `showTable` now reads `match.competition.hasStandings` instead of type check

#### Updated — `LiveCarousel.tsx`
- TABLE button visibility reads `activeMatch.competition.hasStandings` instead of type check

#### Updated — `app/table/page.tsx`
- Fixed TS error: `row.netRunRate` guarded with `?? 0` after making field optional

---

## [1.0.18] 2026-07-03

### WTC standings — Test Championship cycle integrated

#### Added — `championship?: Competition` field on `Match` (`lib/types.ts`)
- Optional field pointing to the overarching championship a match contributes to
- Example: Ashes 3rd Test and IND vs ENG 2nd Test both have `championship: COMPETITIONS.wtc2527`
- Bilateral series competition stays unchanged; championship is additive, not a replacement

#### Added — `showPct?: boolean` on `CompetitionStandings` (`lib/types.ts`)
- Enables a PCT% column in standings tables
- WTC uses win percentage (points won / max available × 100) as the primary ranking metric — no NRR

#### Added — WTC 2025-27 competition (`lib/mockData.ts`)
- `id: "wtc-2025-27"`, `hasStandings: true`, format: Test, type: international
- All 9 Test-playing nations with realistic mock standings: PCT%, Drawn column, no NRR
- Top 2 qualify for WTC Final (`qualifyingSpots: 2`)

#### Added — WTC standings in `COMPETITION_STANDINGS` (`lib/mockData.ts`)
- `showDrawn: true`, `showPct: true`, `showNrr: false`
- Rows: AUS 76.67%, IND 66.67%, SA 66.67%, NZ 54.17%, ENG 43.33%, SL, PAK, BAN, WI

#### Updated — `StandingsTab.tsx` + `MiniStandings.tsx`
- Added PCT% column — renders when `standings.showPct = true`
- Grid layout adjusts automatically (showDrawn + showPct = wider grid)

#### Updated — `LiveCarousel.tsx`
- TABLE button now prefers `match.championship` over `match.competition` for standings
- Logic: `championship.hasStandings ? championship : competition.hasStandings ? competition : null`
- `TeamScheduleSheet` filter now matches by `competition.id OR championship.id`
- Result: clicking TABLE on a live ENG vs IND Test shows WTC standings, not the bilateral series

#### Updated — `MatchView.tsx`
- TABLE tab inside match view also uses `match.championship` when present
- `tableComp = championship.hasStandings ? championship : competition`
- Test match TABLE tab shows full WTC table, not "Standings coming soon"

---

## [1.0.19] 2026-07-03

### Auto-championship resolution in API transformers

#### Added — `CRICBUZZ_CHAMPIONSHIP_MAP` (`lib/transformers.ts`)
- `Record<number, string>` — maps Cricbuzz series IDs → internal championship IDs
- Pre-documented structure for WTC 2025-27: add the real Cricbuzz series IDs for each of the ~27 ICC-designated bilateral Test series when API access lands
- Fills once per WTC cycle (every 2 years), not per match

#### Added — `ESPN_CHAMPIONSHIP_MAP` (`lib/transformers.ts`)
- Same concept for ESPN Cricinfo / sportsdata.io series IDs → championship IDs

#### Added — `SPORTRADAR_CHAMPIONSHIP_MAP` (`lib/transformers.ts`)
- Same concept for SportRadar tournament IDs → championship IDs

#### Updated — `transformCricbuzzMatch()` (`lib/transformers.ts`)
- Now accepts `allCompetitions: Record<string, Competition>` as a parameter
- Auto-resolves `championship` from `CRICBUZZ_CHAMPIONSHIP_MAP[raw.matchInfo.seriesId]`
- If the series ID is in the map, championship is automatically attached to the Match — no per-match manual tagging needed
- If the series ID is not in the map, `championship` stays `undefined` (bilateral series without a championship cycle)

#### How to onboard a new WTC cycle
1. ICC announces the series list at the start of each cycle
2. Make one API call to Cricbuzz to get the `seriesId` for each designated series
3. Add those ~27 entries to `CRICBUZZ_CHAMPIONSHIP_MAP`
4. Add a new `wtc-YYYY-YY` entry to `COMPETITIONS` and `COMPETITION_STANDINGS`
5. Every match in those series will automatically carry the championship — zero per-match work

---

## [1.0.21] 2026-07-03

### Real-data fragility audit — 8 bug fixes

#### Fixed — SpeedChip rendering "0 kmh" (`components/BallGIF.tsx`)
- `const speed = ball.ballSpeedKmh ?? 0` → guard: `if (!speed) return null`
- SpeedChip now simply doesn't render when speed data is absent, rather than showing "0 kmh"

#### Fixed — Chase calculation hardcoded to T20 (`lib/metrics.ts`)
- `const ballsLeft = 120 - ballsBowled` → `const ballsLeft = totalBallsForFormat(match) - ballsBowled`
- Imported `totalBallsForFormat` from `./winProb` (function also given `export` keyword in `winProb.ts`)
- Now format-aware: T20=120, ODI=300, Test=450

#### Fixed — Scorecard using `TEAMS` instead of `ALL_TEAMS` (`components/Scorecard.tsx`)
- `import { TEAMS }` → `import { ALL_TEAMS }`
- `TEAMS[innings.battingTeam]` → `ALL_TEAMS[innings.battingTeam]`
- `TEAMS` only contains franchise teams. International teams were returning `undefined`, breaking scorecard colours and names for any national match

#### Fixed — `truncatedMatch` innings[1] showing 0/0 when no balls (`components/MatchView.tsx`)
- When scrubbing to a point before 2nd innings starts, `truncBalls.length === 0`, but the second innings object was being built with computed `runs=0 / wickets=0 / overs=0`
- Fix: fall back to real `match.innings[1]` values when no balls exist for the truncated slice
- ScoreBar now shows the correct chasing team score even before any 2nd innings balls are loaded

#### Fixed — LineupsCard positional innings broken for visiting-team-bats-first matches (`components/LineupsCard.tsx`)
- `match.innings[0]` / `match.innings[1]` replaced with `.find(i => i.battingTeam === team.code)` / `.find(i => i.battingTeam !== team.code)`
- Positional access breaks when the visiting team wins the toss and bats first; `battingTeam` lookup is always correct

#### Fixed — Insights leaking across matches (`components/MatchView.tsx`)
- `MOCK_INSIGHTS_V2` was imported directly and always shown regardless of any `insights` prop
- `MatchViewProps` now has `insights?: InsightV2[]`; component uses `insightsProp ?? MOCK_INSIGHTS_V2`
- Real data pages can pass `insights={[]}` or real insights; mock remains the default fallback
- Added `InsightV2` to type imports

---

## [1.0.22] 2026-07-03

### International match cards — national flag backgrounds

#### Updated — `components/SplitTeamBg.tsx`
- Added `FLAG_ISO` map: national team code → ISO 3166-1 alpha-2 code (16 nations: IND→in, AUS→au, ENG→en, PAK→pk, SA→za, NZ→nz, WI→jm, SL→lk, BAN→bd, AFG→af, ZIM→zw, IRE→ie, SCO→gb-sct, NAM→na, UAE→ae, NED→nl)
- When both teams are `type === "national"`: renders two `<img src="https://flagcdn.com/w320/{iso}.png">` as split backgrounds with `desaturate(60%)` CSS filter
- Franchise matches: unchanged — dual-colour gradient as before
- Readability scrim: `rgba(0,0,0,0.52)` for flag backgrounds; `rgba(0,0,0,0.45)` for franchise
- Watermark text colour: `rgba(255,255,255,0.18)` for flags; team `secondaryColor` for franchise

---

## [1.0.23] 2026-07-03

### Removed format / tour / team filter chips from homepage

#### Updated — `app/page.tsx` (complete rewrite of filter logic)
- Removed: `FilterBar` component import + render
- Removed: `FILTERS`, `ALL_TEAMS`, `ALL_COMPETITION_NAMES` state + imports
- Removed: `filterMatches()` function, animation orchestration for filter transitions
- Removed: `displayedPast` / `displayedFuture` animated state
- Result: homepage header is now just logo + "Bawler" title — no filter UI
- Match lists render all matches directly (`pastList`, `futureList`) without any filter layer

**Reason:** Filter chips (FORMAT / TOUR / TEAM) added UI complexity with no product value at current scale. When real data lands and match volume grows, a search/filter pattern will be re-introduced appropriately.

---

## [1.0.24] 2026-07-03

### Bilateral series status chip on LiveCarousel

#### Updated — `lib/types.ts`
- Added `seriesStatus?: string` to `Match` interface — one-line bilateral series summary (e.g. `"AUS lead 1-0 · 5-match T20I series"`)

#### Updated — `lib/mockData.ts`
- Added `seriesStatus` to two live bilateral matches:
  - `ind-aus-t20i-2026-m2-live`: `"AUS lead 1-0 · 5-match T20I series"`
  - `eng-sa-test-2026-d3-live`: `"Series level 1-1 · 3-match Test series"`

#### Updated — `components/LiveCarousel.tsx`
- Condition changed: `{activeComp && (...)}` → `{(activeComp || activeMatch?.seriesStatus) && (...)}`
- When `seriesStatus` exists: renders a pill chip with cricket-stumps SVG icon + status text, in same row as TABLE button (when applicable)
- Bilateral international matches now show one-line series context below the live card without needing standings data

---

## [1.0.25] 2026-07-03

### Multi-competition standings table

#### Rewritten — `app/table/page.tsx`
- Was: IPL 2026 standings only, hardcoded header "IPL 2026"
- Now: 8 competitions in a horizontal tab selector
- Competitions: IPL · PSL · BBL · The Hundred · SA20 · ICC T20 World Cup · ICC Champions Trophy · WTC
- `DISPLAY_ORDER` array controls tab ordering
- `COMP_LABELS` maps competition ID → display name + qualifier text (e.g. "Top 4 qualify", "Top 2 qualify")
- `StandingsTable` component handles all column variants: NRR (franchise), PCT (WTC), Drawn (WTC)
- Header: "Table" + "All competitions" subtitle

---

## [1.0.26] 2026-07-03

### Platform-wide franchise league rename (IPL → franchise-agnostic)

#### Updated — `lib/types.ts`
- `iplStats?: FormatStats` → `franchiseStats?: FormatStats`
- Added `franchiseLeague?: string` — stores which league (e.g. `"IPL"`, `"PSL"`, `"BBL"`) per player

#### Updated — `lib/mockData.ts`
- All 13 player objects: `iplStats:` → `franchiseStats:` + `franchiseLeague: "IPL"`

#### Updated — `components/PlayerProfileView.tsx`
- `FormatKey`: added `"franchise"` in place of `"ipl"`
- Tab array: `["test", "odi", "t20i", "franchise"]`
- Tab label: renders `player.franchiseLeague ?? "Franchise"` for the franchise tab (e.g. "IPL" for Kohli, "BBL" for a future Australian player)
- Stats read: `player.iplStats` → `player.franchiseStats`

#### Updated — `app/layout.tsx`
- Meta description: `"IPL match companion with predictions..."` → `"All cricket, every ball, visualized — live scores, ball-by-ball replays, win probability and player stats across every format."`

#### Updated — `lib/transformers.ts`
- All three transformer functions (`transformCricbuzzMatch`, `transformESPNMatch`, `transformSRMatch`): `iplStats:` → `franchiseStats:`

---

## [1.0.27] 2026-07-03

### Fix franchiseStats corruption in mockData.ts + transformers cleanup

#### Fixed — `lib/mockData.ts` (data corruption repair)
- Previous Python `re.sub` used `\1` in a plain string, which resolved to ASCII SOH (0x01) rather than a backreference — causing `franchiseStats:` property key to be silently swallowed
- Result was 13 lines of form: `franchiseLeague: "IPL",\x01   { matches: ... }` — invalid TypeScript
- Fix: replaced the 13 SOH chars directly (`str.replace(SOH_PATTERN, correct_string)`)
- All 13 player `franchiseStats` objects now correctly structured with both `franchiseLeague` and `franchiseStats` keys

#### Verified — `npx tsc --noEmit` passes, `npx next build` passes

---

## [1.0.28] 2026-07-06

### Matchup Card — matches, live 4s/6s, label-value format, always-on dynamic stats

#### Updated — `lib/types.ts`
- `MatchupStats` now includes `matches: number` — career H2H encounter count

#### Updated — `lib/mockMatchups.ts`
- All 44 H2H records updated with realistic `matches` counts (range 2–14 per format)
- All `dangerDelivery` strings rewritten in plain English (removed cricket jargon)

#### Updated — `components/MatchupCard.tsx`
- **New props**: `liveBalls`, `liveRuns`, `liveOuts`, `liveDots`, `liveMatchFours`, `liveMatchSixes`
- All stats (BALLS / RUNS / OUTS / Avg / SR / Dots / 4s / 6s) now show career H2H + current match totals merged — fully live
- Row 3 label-value format: `matches-N 4s-N 6s-N Avg-N SR-N Dots-N%`
- Row 4: `Watch for: [delivery]` on its own line
- First-time meeting with no career data still shows stats from ball 1 onward ("making history right now")

#### Updated — `components/MatchView.tsx`
- `liveMatchupCounters` useMemo tracks balls/runs/outs/dots/4s/6s between current batter+bowler in this match
- Legal delivery logic: only wides excluded from balls faced; no-balls count correctly
- Counters fed into `MatchupCard` as props — updates on every delivery

---

## [1.0.29] 2026-07-06

### Partnership Tracker — replaces win-prob footer below ball visualizer

#### Updated — `components/BallGIF.tsx`
- **Removed**: Win probability bar from ImpactFooter
- **Added**: `PartnershipFooter` — single-row display:
  - `Pship N(B) · BatterA N(B) [X×4] [X×6] · BatterB N(B) [X×4] [X×6]` — total + individual batters
  - Partnership 4s pinned to right: `N 4s  N 6s`
  - Batter runs shown in batting team primary color
- **New props**: `partnership?: PartnershipInfo` (replaces `winProbBefore/After`)

#### Updated — `components/MatchView.tsx`
- `partnershipInfo` useMemo: scans current innings balls back to last wicket, accumulates per-batter runs/balls/4s/6s
- **Fix 1 — Non-striker run-outs**: if ball after a run-out wicket has same `batterName`, partnership NOT reset (striker survived)
- **Fix 2 — No-ball ball count**: `isFaced = extraType !== "wd"` — wides excluded, no-balls correctly counted
- Total partnership 4s/6s computed and passed through
- `winProbBefore/After` props removed from BallGIF call

#### Updated — `lib/mockData.ts`
- IND 2nd innings balls (overs 14–17): `batterName` patched to alternate R Pant / V Kohli with realistic strike rotation, enabling live partnership demo

---

## [1.0.30] 2026-07-06

### Win probability chase formula — major accuracy fix

#### Fixed — `lib/winProb.ts`

**Root cause**: two compounding bugs in the 2nd-innings chase formula inflated the bowling team's win probability:

1. `achievableRPO = 8.5 + (wicketsLeft - 5) * 0.4` — linear, so 4 wickets in hand only gave 8.1 RPO (barely above a 5.73 RRR, making the chase look close when it wasn't)
2. `wpTeamA = 1 - wpTeamB * wicketPenalty` — applied a SECOND separate `wicketPenalty = max(0.3, wicketsLeft/10)` on top, halving the chasing team's probability again

**Effect**: IND needing 21 off 22 balls with 4 wickets showed AUS 69% / IND 31% — completely wrong.

**Fix**: single power-curve achievable RPO, no separate multiplier:
```typescript
const baseRPO = /* 9.5 T20/T20I, 8.0 ODI, 3.5 Test */;
const achievableRPO = baseRPO * Math.pow(wicketsLeft / 10, 0.25);
const ratio = achievableRPO / rrr;
const wpTeamB = 1 / (1 + Math.exp(-(ratio - 1) * 5));
wpTeamA = 1 - wpTeamB; // no second penalty
```

**Calibrated results**:
| Scenario | Before | After |
|---|---|---|
| Need 21 off 22, 4 wkts | AUS 69% / IND 31% | AUS 17% / IND 83% ✓ |
| Need 50 off 22, 4 wkts | AUS ~50% / IND ~50% | AUS 90% / IND 10% ✓ |
| Need 10 off 22, 4 wkts | AUS ~30% / IND ~70% | AUS ~0% / IND ~100% ✓ |
| Need 21 off 22, 2 wkts | AUS ~80% / IND ~20% | AUS 37% / IND 63% ✓ |
| Need 21 off 22, 8 wkts | AUS ~50% / IND ~50% | AUS 6% / IND 94% ✓ |

**Scope**: fix applies platform-wide — `calculateWinProbForMatch()` is the single source of truth consumed by MiniWinProb, WinProbChart, and all win-prob display everywhere.

---

## [1.0.31] 2026-07-06

### API robustness — name normalisation at data boundary

#### Updated — `lib/transformers.ts`
- **New**: `normaliseName(raw: string): string` — exported utility normalising any API name format to `"I Surname"`:
  - `"Virat Kohli"` → `"V Kohli"`
  - `"kohli, virat"` → `"V Kohli"` (comma-last format)
  - `"V. Kohli"` → `"V Kohli"`
  - Single names passed through unchanged
- Applied at every API boundary: ESPN `transformESPNBall`, Sportradar `transformSRBall`
- Ensures partnership tracker, matchup card lookup, and player links all use consistent names regardless of which API feeds the data
- `batsman_name?` / `bowler_name?` fields added to `SportRadarRawBall` interface

---

## [FUTURE] Digest — W/4/6 stat chip player popup

### Feature spec (shelved — revisit when real player image API is available)

**What**: Tapping the **W**, **×4**, or **×6** stat chips on any digest card (OverGroupCard, SessionCard) opens a bottom-sheet popup listing every relevant ball in that group/session with the player's name and avatar.

**UX**:
- Tap "2w" → sheet shows 2 rows, one per wicket: batter name + dismissal type ("Caught", "LBW" etc.) + over label (e.g. "Ov 14.3")
- Tap "3×4" → 3 rows: batter name + "Four" + over label
- Tap "2×6" → 2 rows: batter name + "Six" + over label
- Each row has an avatar circle (team colour, initials fallback)
- Backdrop tap or × button dismisses

**Why shelved**: currently no player photo URL in the data layer (`PlayerProfile` has no `photoUrl`). The feature as built used initials-only avatars — functional but not differentiating enough to justify the added interaction complexity at v1.

**When to ship**: once a player image CDN or API is wired in (e.g. ESPN cricinfo headshots, ICC media, or a self-hosted S3 bucket). Add `photoUrl?: string` to `PlayerProfile` in `types.ts`, populate in `mockData.ts` / transformer, then restore the component below.

**Implementation** (was commit `a7f847f`, reverted at `2c13689`):
- `StatPopup` component in `DigestTab.tsx` — bottom sheet, `useRef` + `useEffect` for outside-click dismiss
- `PopupState { type: "w"|"4"|"6"; balls: Ball[] }` local state on each card view
- `openPopup(type)` filters `card.allBalls` by `isWicket` / `isBoundary4` / `isBoundary6`
- W/4/6 `<span>` chips become `<button>` elements, card wrapper gets `relative` positioning
- `DISMISS_LABEL` map: `bowled/caught/lbw/run-out/stumped/hit-wicket → display string`
- `initials(name)`: first + last initial from full name string
- Restore from the reverted commit or cherry-pick `a7f847f` onto a feature branch
