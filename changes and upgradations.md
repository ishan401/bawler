# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

---

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
- Scorecard tab: full batting + bowling cards
- Info tab: PitchReportCard, LineupsCard
- Schedule page, Table/standings page
- Win probability: formula-based (bookmaker-approximating), WinProbChart with zoom + pinch
- Match events: wickets, sixes, milestones, big overs, phase shifts
- Insight feed: tiered attribution (analyst > cricbuzz > espn > bot)
- Data model: ball-level coordinates, delivery descriptors, shot tracking — Roanuz-schema-compatible

### Stack
- Next.js 14, React 18, TypeScript, Tailwind CSS
- Deployed: Vercel (bawler-gold.vercel.app)
- Repo: github.com/ishan401/bawler
