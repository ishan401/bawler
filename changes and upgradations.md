# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

---

## [0.9.4] 2026-06-30

### Fixed — Win probability chart gradient opacity (WinProbChart + MiniWinProb)
- Gradient fill opacities were too low — both team zones appeared as near-identical dark fills on the navy background
- Increased all stopOpacity values significantly:
  - Team A fill (below line): top 0.38 → 0.55, bottom 0.04 → 0.20
  - Team B fill (above line): top 0.04 → 0.20, bottom 0.30 → 0.55
  - MiniWinProb matched to same levels
- Result: both team territories are now clearly distinct and color-coded to each team's brand color

---

## [0.9.3] 2026-06-30

### Fixed — Win probability chart colours (WinProbChart + MiniWinProb)
- Line and NOW dot were switching to team B colour when team B was leading, making both fills appear the same colour
- Fixed: line always renders in team A colour (it always represents team A win probability); fills are always team A colour below the line and team B colour above — regardless of who is winning
- Team label annotations on y-axis (team A name at top, team B name at bottom) now make the axis self-explanatory

### Reverted — Background colour
- Pure black (#000000) reverted to original navy dark palette (#0A0E1A / #141B2D / #1B243A)
- Reason: user preference — original colour scheme retained

---

## [0.9.2] 2026-06-30

### Changed — Background color (tailwind.config.ts + globals.css)
- Replaced navy/blue-tinted dark palette with pure blacks
  - bg (page): #0A0E1A → #000000
  - bg-surface (cards): #141B2D → #0F0F0F
  - bg-elevated: #1B243A → #1A1A1A
  - bg-deep: #03060F → #000000
  - line (borders): #1E293B → #222222
  - html background in globals.css: #03060F → #000000
  - scrollbar thumb: #1E293B → #222222
- Result: true AMOLED black — better on OLED screens, saves battery, removes the unintended blue cast

---

## [0.9.1b] 2026-06-30 — hotfix

### Fixed — Build failure (truncated JSX)
- WinProbChart.tsx and MiniWinProb.tsx were truncated mid-string during initial write, breaking the Vercel build
- Rewrote both files completely using Python to bypass the Write tool character limit
- TypeScript compiler now passes with zero errors
- Root cause: Write tool has a content size limit; large files must be written via bash/Python going forward

## [0.9.1] 2026-06-30

### Changed — Win Probability (WinProbChart + MiniWinProb)

**Problem:** Two crossing team lines were visually noisy and hard to read, especially on mobile. Events used a separate scrollable legend disconnected from the chart.

**MiniWinProb (inline sparkline):**
- Replaced two crossing lines with a single team A probability line + dual gradient fill
  - Team A color fades in below the line (their "territory")
  - Team B color fades in above the line (their "territory")
- Both teams' names and current percentages now shown side-by-side (leader is brighter)
- Layout: `[KKR 68%] [sparkline] [32% MI]` — instantly readable at a glance
- 50% reference line retained, subtler
- Innings divider shown when match is in 2nd innings

**WinProbChart (full-screen modal):**
- Same single-area-chart treatment as MiniWinProb
- New header: prominent split color bar showing both teams' percentages (same style as live match card)
- Plain-language leading sentence: "KKR 68% chance to win"
- Event dots now show letter codes inside (W=wicket, 6=six, 4=four, ★=milestone, ↑=big over) — no legend lookup needed
- Key moments section replaced scrollable list with color-coded pill chips (over + label inline)
- Reduced chart height (260px viewBox vs 580px) — less wasted space, more compact

---

## [0.9.0] 2026-06-01 (baseline)

Initial v0.9 prototype. Full UI built with mocked data.

### Features
- Home page: LiveCarousel, Past/Future split columns, FilterBar with animated transitions, infinite scroll
- Match page: BallGIF (2-clip animated SVG), MomentsStrip, MiniWinProb, AIMetrics (4 tiles), CommentaryFeed
- Scorecard tab: full batting + bow