# Bawler — Cricket Live Companion (v0.9)

Every ball, visualized. Win probability, key moments, and an animated SVG replay for every delivery.

**Live:** [bawler-gold.vercel.app](https://bawler-gold.vercel.app)
**Status:** UI complete (v0.9 mock) — real data integration next.
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

Vercel auto-deploys on push via GitHub webhook. Build time ~40s.

---

## What's built (v0.9)

### Pages

| Route | Description |
|---|---|
| `/` | Home — live carousel + past/future match columns, filter bar, infinite scroll |
| `/match/[id]` | Match page — full live experience |
| `/schedule` | Full schedule list |
| `/table` | Points table / standings |

### Match page layout (top → bottom on mobile)

1. **ScoreBar** *(sticky)* — score, chase context (need X off Y, RRR), innings info
2. **MiniInsightsBar** — scrolling ticker of live insights just below the score
3. **MatchTabs** — Live / Scorecard / Info tab switcher
4. **BallGIF** *(hero)* — animated SVG ball replay, two alternating clips per delivery:
   - **Clip A (Bowler view):** 3/4-perspective delivery animation showing speed, swing, line, length as motion. Speed + ball type shown as text.
   - **Clip B (Overhead field):** fielder dots + ball trajectory. Aerial vs ground distinction.
   - Auto-advances every 24s in live-follow mode. Tapping a Moment holds that ball.
5. **MomentsStrip** — horizontal timeline of key events (wickets, sixes, big overs). Tapping scrubs the entire page to that ball — GIF replays it, chart rewinds, metrics update.
6. **MiniWinProb** — compact single-area sparkline. Shows both teams' current % side-by-side. Tap → full chart modal.
7. **AIMetrics** — 4 condensed tiles: Projected score, Momentum (12-ball shift), Acceleration (RRR vs CRR), Next wicket impact.
8. **CommentaryFeed** — ball-by-ball cards with insight overlays (stats vs opinions, tiered attribution).

**Scorecard tab:** Full batting + bowling cards via **Scorecard** component.
**Info tab:** Pitch report + lineups via **InfoTab**, **PitchReportCard**, **LineupsCard**.

**Full win prob modal:** Tap MiniWinProb → **WinProbChart** slides up — single area chart, gradient fill, split probability bar header, key moments chips, zoom (Match / Innings / Recent), pinch-to-zoom.

### Home page

- **LiveCarousel** — snap-scroll carousel of live matches with win-prob split bar
- **MatchCard** (Past + Future variants) — split team background, excitement-glow treatment, result banner
- **FilterBar** — team / tournament / venue filter with animated enter/leave transitions
- **SplitTeamBg** — dual-color gradient background using team primary colors
- Infinite scroll (loads 4 more past + 4 more future on scroll bottom)
- Column expand — tap to go full-width on Past or Coming Up

---

## Component map

```
components/
├── Match page core
│   ├── MatchView.tsx          # main match page client component, orchestrates all below
│   ├── ScoreBar.tsx           # sticky header with score + chase context
│   ├── MiniInsightsBar.tsx    # scrolling insight ticker
│   ├── MatchTabs.tsx          # Live / Scorecard / Info tabs
│   └── DemoControls.tsx       # dev-mode ball stepper (not shown in prod)
│
├── Ball GIF (Pillar 3)
│   ├── BallGIF.tsx            # ⭐ hero — two-clip animated SVG delivery replay
│   ├── MiniBallGIF.tsx        # compact version used in moments
│   └── DeliveryCard.tsx       # single delivery summary card
│
├── Win probability (Pillar 1)
│   ├── WinProbChart.tsx       # full-screen modal — single area chart, gradient fill
│   └── MiniWinProb.tsx        # inline sparkline — both teams' % visible
│
├── Moments & events
│   ├── MomentsStrip.tsx       # horizontal moments timeline (scrubs GIF + chart)
│   └── MomentsCollapsible.tsx # expandable moments section
│
├── AI metrics
│   ├── AIMetrics.tsx          # 4-tile condensed metrics row
│   ├── ProjectedScore.tsx     # projected total tile
│   ├── PressureGauge.tsx      # pressure 0-10 gauge
│   └── MiniWinProb.tsx        # (also serves as win% tile)
│
├── Insights (Pillar 2)
│   ├── CommentaryFeed.tsx     # ball-by-ball cards with insight overlays
│   ├── InsightFeed.tsx        # standalone insight list
│   ├── InsightsPanel.tsx      # panel with filter + feed
│   ├── InlineNote.tsx         # small inline insight chip
│   └── MiniInsightsBar.tsx    # scrolling ticker
│
├── Scorecard tab
│   └── Scorecard.tsx          # batting + bowling cards
│
├── Info tab
│   ├── InfoTab.tsx            # tab container
│   ├── PitchReportCard.tsx    # surface type, pace/spin friendliness
│   └── LineupsCard.tsx        # playing XI for both teams
│
├── Over summary
│   └── OverSummary.tsx        # per-over dot/run/wicket summary
│
├── Home page
│   ├── LiveCarousel.tsx       # snap-scroll live match carousel
│   ├── MatchCard.tsx          # Past + Future + Live card variants
│   ├── FilterBar.tsx          # team/tournament/venue filter
│   ├── SplitTeamBg.tsx        # dual-color team background
│   └�