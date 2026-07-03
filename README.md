# Bawler — All Cricket, Every Ball, Visualized (v1.0.27)

Live scores, ball-by-ball replays, win probability, and player stats across every format and competition.

**Live:** [bawler-gold.vercel.app](https://bawler-gold.vercel.app)
**Status:** UI complete (v1.0.27 mock) — real data integration next.
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
| `/match/[id]` | Match page — full live experience |
| `/player/[id]` | Player profile — bio, ICC rankings, per-format stats |
| `/schedule/[competitionId]` | Schedule for a specific competition |
| `/schedule/[competitionId]/[teamCode]` | Schedule filtered by team |
| `/table` | Multi-competition standings (IPL, PSL, BBL, Hundred, SA20, T20WC, CT, WTC) |

---

## Home page

- **LiveCarousel** — snap-scroll carousel of live matches with win-prob split bar
- **Series status chip** — one-line bilateral series summary below bilateral international cards; TABLE button for competition matches
- **SplitTeamBg** — national matches: flag images (flagcdn.com); franchise matches: dual-colour gradient
- Infinite scroll, pull-to-refresh, shimmer loading skeleton, tap feedback on all cards

---

## Match page (top to bottom on mobile)

1. **ScoreBar** (sticky) — score, chase context, innings info
2. **MiniInsightsBar** — scrolling insight ticker
3. **MatchTabs** — Live / Scorecard / Info (swipe or tap, book-page-turn animation)
4. **BallGIF** (hero) — two-clip animated SVG delivery replay (bowler view + overhead field). SpeedChip hidden when speed data is null.
5. **MomentsStrip** — key events timeline; tap scrubs the whole page to that ball
6. **MiniWinProb** — both teams' % visible; tap opens full WinProbChart modal
7. **AIMetrics** — 4 tiles: Projected, Momentum, Acceleration, Next wicket impact (format-aware ball totals)
8. **CommentaryFeed** — ball-by-ball cards with insight overlays

**Scorecard tab:** Uses `ALL_TEAMS` (not `TEAMS`) — works for national + franchise teams. Sticky innings headers.
**Info tab:** LineupsCard uses `battingTeam`-based innings lookup (not positional array index).

---

## Player profiles (`/player/[id]`)

- Bio, country flag, role, batting/bowling style, ICC rankings
- Format tabs: Test / ODI / T20I / {franchiseLeague} (label is dynamic per player e.g. "IPL", "BBL")
- Batting + bowling stats grids; sub-components return null when no data
- Clickable from Scorecard rows and CommentaryFeed wicket cards
- `PLAYER_ALIASES` map resolves alternate IDs from live data

---

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

---

## Component map

```
components/
├── Match page
│   ├── MatchView.tsx          # orchestrates all below; insights prop-driven
│   ├── ScoreBar.tsx           # sticky score header
│   ├── BallGIF.tsx            # hero two-clip SVG delivery replay
│   ├── MomentsStrip.tsx       # horizontal key events timeline
│   ├── MiniWinProb.tsx        # inline sparkline
│   ├── WinProbChart.tsx       # full-screen modal chart
│   ├── AIMetrics.tsx          # 4-tile metrics row
│   ├── CommentaryFeed.tsx     # ball-by-ball cards + insight overlays
│   ├── Scorecard.tsx          # batting + bowling cards (ALL_TEAMS)
│   ├── LineupsCard.tsx        # playing XI (battingTeam-based lookup)
│   └── PitchReportCard.tsx    # pitch surface + sliders
├── Home page
│   ├── LiveCarousel.tsx       # live match carousel + series status chip
│   ├── MatchCard.tsx          # Past / Future / Live card variants
│   ├── SplitTeamBg.tsx        # flag images (national) or gradient (franchise)
│   └── BottomNav.tsx          # persistent Home / Schedule / Table nav
└── Player profile
    └── PlayerProfileView.tsx  # bio, rankings, per-format stats tabs
```
