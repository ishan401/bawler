# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

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
- Replaced CSS filter with `brightColor()` function: normalises hex → RGB so the max channel = 255, preserving exact hue ratios while making the color vivid
- MI (#004BA0) now renders as vivid blue RGB(0,119,255), KKR (#3A225D) as vivid purple RGB(159,93,255)
- Line stroke and current-position dot also use `brightColor()` for consistency

---

## [0.9.7] 2026-06-30

### Fixed — Win probability chart clutter (WinProbChart)
- Removed event dots (W/6/★/↑ circles) from the chart line — they were large, overlapping, and created visual noise that looked like "intersecting lines"
- Key Moments chips below the chart already show the same events clearly
- Chart is now clean: only the probability line, team-coloured fills, and NOW marker

### Fixed — Body background pure black (globals.css)
- Removed `bg-bg-deep` from body @apply — body was still rendering as #03060F (dark navy) instead of pure black
- Body now explicitly set to #000000, eliminating any visible tint outside the phone frame

---

## [0.9.5] 2026-06-30

### Fixed — Chart team colors truly distinct (WinProbChart + MiniWinProb)
- MI (#004BA0) and KKR (#3A225D) are both dark colors — at low opacity on a dark background they appeared identical
- Increased peak opacity: 0.55 → 0.90, minimum: 0.20 → 0.45
- Both team zones are now clearly visible in their respective team colors

### Fixed — Orange tint on outer background (globals.css)
- html/body backgr