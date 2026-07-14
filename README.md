# Bawler — All Cricket, Every Ball, Visualized (v1.0.48)

Live scores, ball-by-ball replays, win probability, and player stats across every format and competition.

**Live:** [bawler-gold.vercel.app](https://bawler-gold.vercel.app)
**Status:** UI complete (v1.0.48 mock) — real data integration next.
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
| `/match/[id]` | Match page — full live experience (4 tabs) |
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
3. **MatchTabs** — Live / Scorecard / **Digest** / Info / Table (Table only when the competition has standings; swipe or tap, book-page-turn animation)
4. **BallGIF** (hero) — two-clip animated SVG delivery replay (bowler view + overhead field). SpeedChip hidden when speed data is null.
5. **MomentsStrip** — key events timeline; tap scrubs the whole page to that ball
6. **PartnershipFooter** — live partnership: total runs/balls + per-batter stats, resets on wicket
7. **MatchupCard** — always-on batter vs bowler H2H (career + live match merged); shareable PNG
8. **MiniWinProb** — both teams' % visible; tap opens full WinProbChart modal
9. **AIMetrics** — 4 tiles: Projected, Momentum, Acceleration, Next wicket impact (format-aware ball totals)
10. **CommentaryFeed** — ball-by-ball cards with insight overlays

**Scorecard tab:** Uses `ALL_TEAMS` (not `TEAMS`) — works for national + franchise teams. Team toggle (T20/ODI/Hundred) or per-innings chips (Test) pick which innings shows below, defaulting to whoever's currently batting. Sticky innings header, offset measured live so it stays flush under the real header in any format. Partnership velocity sparklines between batting + bowling cards, plus a per-batter runs-vs-balls sparkline on each dismissal/"not out" line with boundary dots capped at that batter's own 4s/6s.

**Digest tab:** Story-of-the-match in cards. Format-adaptive: over cards (T20), session cards (Test), ODI blocks. Day filter chips for Test (default: latest day). Innings chips for T20/ODI (default: latest innings). Post-match summary card pinned at top when `match.result` exists. All cards shareable as PNG.

**Info tab:** Pitch report card (surface, sliders, expected score, dew), lineups side-by-side.

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
- **`match.result`** drives the post-match summary card in DigestTab (not `match.status`)
- **`match.championship`** drives the TABLE button for Test matches (WTC); falls back to `match.competition`

---

## Live match IDs with full ball data

| Match ID | Format | Ball data | Notes |
|---|---|---|---|
| `ipl2026-m37-kkrvmi` | T20 (IPL) | 2 full innings (scripted) | FEATURED_MATCH; KKR won by 4 wkts; both innings chips + match summary card |
| `ind-aus-t20i-2026-m2-live` | T20I | Inn 1: 120 balls (AUS, complete) + Inn 2: 98 balls (IND, live) | Kohli 61* chasing; innings chips; live IND over cards |
| `ind-eng-test-2026-d3-live` | Test | Inn 2: 348 balls (ENG 1st, complete) + Inn 3: 164 balls (ENG follow-on, live) | Day 2 sessions complete; Day 3 live; day chips; session cards |

---

## Component map

```
components/
├── Match page
│   ├── MatchView.tsx          # orchestrates all tabs; allBalls flatMap; showDigest flag
│   ├── ScoreBar.tsx           # sticky score header
│   ├── BallGIF.tsx            # hero two-clip SVG delivery replay; PartnershipFooter
│   ├── MomentsStrip.tsx       # horizontal key events timeline
│   ├── MiniWinProb.tsx        # inline sparkline
│   ├── WinProbChart.tsx       # full-screen modal chart
│   ├── AIMetrics.tsx          # 4-tile metrics row
│   ├── CommentaryFeed.tsx     # ball-by-ball cards + insight overlays
│   ├── Scorecard.tsx          # batting + bowling cards (ALL_TEAMS), team/innings toggle, per-batter + partnership sparklines
│   ├── MatchupCard.tsx        # always-on batter vs bowler H2H; career + live merged
│   ├── DigestTab.tsx          # story-of-match cards; format-adaptive; day/innings chips; shareable
│   ├── LineupsCard.tsx        # playing XI (battingTeam-based lookup)
│   └── PitchReportCard.tsx    # pitch surface + sliders
├── Home page
│   ├── LiveCarousel.tsx       # live match carousel + series status chip + standings sheet
│   ├── MatchCard.tsx          # Past / Future / Live card variants
│   ├── SplitTeamBg.tsx        # flag images (national) or gradient (franchise)
│   └── BottomNav.tsx          # persistent Home / Schedule / Table nav
└── Player profile
    └── PlayerProfileView.tsx  # bio, rankings, per-format stats tabs
```

---

## lib/ map

```
lib/
├── mockData.ts        # all match, player, standings, pitch report data; PLAYERS; ALL_TEAMS
├── types.ts           # all TypeScript interfaces (Match, Ball, Innings, TestSession, …)
├── transformers.ts    # ESPN/Cricbuzz/SportRadar adapters; normalizeBall(); deriveTestSessions()
├── mockMatchups.ts    # 44 batter vs bowler H2H career records
├── events.ts          # Moments strip event extraction logic
├── winProb.ts         # power-curve win probability formula (single source of truth)
└── outcomeColors.ts   # unified ball outcome colour palette
```
