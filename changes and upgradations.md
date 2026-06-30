# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

---

## [1.0.1] 2026-06-30

### Build stability hotfix

#### Fixed — Truncated source files
- 6 component/page files were truncated on disk (AIMetrics.tsx, BallGIF.tsx, FilterBar.tsx, MatchCard.tsx, MomentsStrip.tsx, app/layout.tsx) — missing closing JSX, helper functions, and return statements
- Completed all truncated tails; all files now pass TypeScript strict mode

#### Fixed — Missing React imports (8 files)
- `React.CSSProperties` and `React.ReactNode` require `import React` (or a named type import) — Next.js JSX transform does NOT auto-import the React namespace
- Added React to: MatchCard, FilterBar, layout, page, DeliveryCard, InlineNote, InsightsPanel, LineupsCard, Scorecard, ViewSwitcher

#### Fixed — Null bytes in page.tsx
- Thousands of `\x00` null bytes were appended after the closing `}` of page.tsx
- TypeScript reported each as "Invalid character"; stripped all null bytes

#### Fixed — Strict TypeScript null error in match/[id]/page.tsx
- `ALL.find()` returns `Match | undefined`; `notFound()` throws before returning but TS couldn't infer that
- Added non-null assertion `match!` (safe — `notFound()` never returns)

#### Fixed — MatchCard.tsx missing "use client"
- `fmtCountdown()` calls `Date.now()` at render time; component must be a client component
- Added `"use client"` directive

---

## [1.0.0] 2026-06-30

### UI/UX overhaul — navigation, readability, hierarchy

#### Added — Bottom navigation bar (BottomNav.tsx + layout.tsx)
- Persistent bottom nav with Home / Schedule / Table tabs across all non-match pages
- Active tab shown with cyan color + underline indicator
- Removed old Schedule + Table button row from home page header (redundant)
- All page content padded to `pb-20` so nothing hides under the nav

#### Fixed — AI metric tiles (AIMetrics.tsx)
- Each tile now shows a context sub-label explaining what the value means (e.g. "end-of-innings total", "team with the over")
- Trend arrow (↑/↓) shown next to primary value, colored to match the metric's tint
- `trendDelta` string (e.g. "+8% last 12 balls") now shown as a third line
- Tiles are taller to accommodate the extra information

#### Fixed — Upcoming match cards (MatchCard.tsx)
- Future cards now have a visual bottom anchor bar: clock icon + cyan countdown ("in 2d 14h") + time + city
- Balances card height against past cards which have the result banner in the same slot
- Card height increased slightly (138 → 148px) to accommodate the anchor row

#### Fixed — Moments strip (MomentsStrip.tsx)
- Event chips are taller and wider with a proper two-section layout
- Top section: colored chip badge (W/6/4/★) + over number prominently at `text-[11px]`
- Bottom section: event label + 2-line truncated context
- Live chip redesigned as a vertical flex card with pulsing dot
- Context text now 2-line clamped instead of truncated to 1 line

#### Fixed — Ball visualization info hierarchy (BallGIF.tsx)
- Removed tiny 9px top-left identity caption
- Bottom info bar restructured: delivery type (large, `text-sm`) stacked above speed on the left; outcome badge (W/4/6) anchored to the right
- Bowler → Batsman shown as a slim sub-row below the main info, easy to read at a glance
- Outcome badge enlarged to 40×40px

#### Fixed — Home filter chip team color (FilterBar.tsx + page.tsx)
- FilterDef now accepts optional `colorFn(value) → hex` for color-aware options
- Team filter chip shows a glowing colored dot (team's primary color) when active
- MI filter shows blue dot, KKR purple, CSK yellow, etc.

---

## [0.9.8] 2026-06-30

### Fixed — Win probability chart hue accuracy (WinProbChart + MiniWinProb)
- `brightness(3) saturate(2)` CSS filter was distorting MI's dark navy (#004BA0) into cyan — the filter boosted G and B channels equally, destroying the blue hue
- Replaced CSS filter with `brightColor()` function: normalises hex → RGB so the max channel = 255, preserving