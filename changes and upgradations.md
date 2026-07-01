# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

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
