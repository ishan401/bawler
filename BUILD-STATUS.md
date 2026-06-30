# Bawler Build Status

> Snapshot of what's shipped, what's mocked, what's pending. Updated alongside every deploy.

**Current version:** v1.0.1 (deployed)
**Live URL:** `bawler-gold.vercel.app`
**Local dev:** `cd bawler-main && npm install && npm run dev`

---

## Shipped ✅

### Home page (`/`)

- ✅ Compact header (logo + Bawler text + 3 filter pills, single row)
- ✅ **Bottom navigation bar** — persistent Home / Schedule / Table tabs at bottom of every non-match page; active tab shown with cyan color + underline indicator (replaces old header button row)
- ✅ **Team filter color dot** — when TEAM filter is active, a glowing dot in the team's primary color appears in the pill (MI = blue, KKR = purple, CSK = yellow, etc.)
- ✅ Live carousel — snap-scroll, 3 mock live matches, full-width cards with prominent split win-prob bar
- ✅ Filter bar — pre-filled defaults (KKR / IPL / Kolkata), enable circle, fixed-position dropdowns, auto-enable on non-default pick
- ✅ Past column (65 %) — split-team backgrounds, prominent result banner, rank pills, 2-line description, highlight badges
- ✅ Future column (35 %) — split-team backgrounds with visual **countdown anchor bar** at bottom (clock icon + cyan "in 2d 14h" + time + city), rank pills, highlight badges
- ✅ Diff-aware filter animation — stayers don't move, leavers fade + slide + collapse over 700 ms, newcomers pull up over 900 ms with stagger
- ✅ Column expand toggle (full-width past or full-width future)
- ✅ Infinite scroll via scroll listener (not eager IO)
- ✅ Card backgrounds use unified outcome palette so an over reads good/bad at a glance

### Schedule page (`/schedule`)

- ✅ All matches grouped by date, chronological
- ✅ Past matches show winner + margin
- ✅ Live matches show pulsing live indicator
- ✅ Future matches show "Upcoming"
- ✅ Tap to open match page

### Table page (`/table`)

- ✅ League standings sorted by points → NRR
- ✅ Top 4 marked with green bar + "Q" qualifier badge
- ✅ Eliminated teams dimmed + "Out" badge
- ✅ P / W / L / NRR / Pts columns

### Match page — Live tab

- ✅ Sticky header — score bar + mini-insights bar + tab strip
- ✅ Mini-insights bar — 4 number chips below chase context (RRR, last 12 balls, current bowler figures, top scorer)
- ✅ **BallGIF** — two clips (bowler perspective + overhead) of 3 sec each, 6 sec total, 4 reps per ball (24 sec dwell)
  - ✅ Stick figures with name labels next to bowler + batter
  - ✅ Speed + ball type as text; line / length / height purely visual
  - ✅ Exaggerated swing (1.8 ×) + spin (2.2 ×) for visual punch
  - ✅ Background tint by outcome (unified palette)
  - ✅ Cross-fade between scene swaps (`scene-fade-in` 280 ms)
  - ✅ Smooth bg color transition between balls (600 ms)
- ✅ **Moments strip** — taller, wider chips with two-zone layout (badge + over number top, label + 2-line context bottom); Live chip has pulsing dot; horizontal scroll
- ✅ **BallGIF info hierarchy** — delivery type (large, colored) + speed stacked on left; outcome badge (W/4/6) anchored to right of info bar; bowler → batsman in slim sub-row below; tiny 9px top-left caption removed
- ✅ MiniWinProb — inline condensed area chart with team-colored fills + tap-to-expand
- ✅ **AI metrics tiles** — each tile now shows: primary value + trend arrow (↑/↓ colored) + delta line ("+8% last 12 balls") + plain-English context label ("end-of-innings total", "team with the over", etc.)
- ✅ Win-prob chart modal — full-screen, slide-up animation, team-hue-accurate colors via brightColor(), tap backdrop to close
- ✅ Commentary feed — variable-height ball cards
  - ✅ Compact rows for dots / 1s / 2s / 3s / extras (~36 px)
  - ✅ Full cards with mini-GIF for wickets / 4s / 6s (~110-140 px)
  - ✅ Stat / opinion inline notes between cards (color-distinguished)
  - ✅ Over summary pills at over transitions (6 colored dots)
  - ✅ Innings break dividers

### Match page — Scorecard tab

- ✅ Per-innings batting card (R / B / 4s / 6s / SR / dismissal)
- ✅ Per-innings bowling card (O / M / R / W / Econ)
- ✅ Highlighted on-strike batter

### Match page — Info tab

- ✅ Match context (toss, teams, season)
- ✅ Pitch report card — surface type, 3 sliders (pace / spin / bounce), expected score range, dew factor, plain-language behavior bullets
- ✅ Lineups — both team squads side-by-side

### Brand + visuals

- ✅ Phone-frame on desktop (`max-w-[430px]` floating on `bg-deep`)
- ✅ Unified outcome palette (`lib/outcomeColors.ts`) — wicket red → dot slate → mint singles → cyan four → purple six
- ✅ Cricket-domain accent palette in Tailwind (cyan, orange, boundary, wicket, six)
- ✅ Inter font loaded from Google Fonts
- ✅ Tabular numerics for all scores (`num` utility class)

### Tech / infra

- ✅ Next.js 14 App Router + TypeScript strict + Tailwind
- ✅ Vercel auto-deploy from `main` branch (60-90 sec build)
- ✅ Static-prerendered match pages via `generateStaticParams`
- ✅ Bundle size: home 111 KB, match 121 KB, schedule 105 KB, table 105 KB
- ✅ No external chart library (hand-written SVG)
- ✅ Phone-frame works with `overflow: clip` (sticky inside still works)

---

## Mocked (will become real in v2) 🔶

| Source | Mock state | Plan |
|---|---|---|
| Live match data | Hard-coded KKR vs MI in `mockData.ts:FEATURED_MATCH` | Roanuz API (Ball Tracker tier) |
| Carousel live matches 2 & 3 | `liveStatusOverride` + `liveWinProbOverride` fields | Real fetches |
| Past + future matches | Hard-coded + `matchGenerator.ts` procedural | Real fetches |
| Coordinates (pitch / shot) | `Math.random()`-based but sensible | Roanuz Ball Tracker + Cricbuzz scrape fallback |
| Win probability | Internal sigmoid formula | Scraped bookmaker odds (Betfair / Betway / 1xBet), averaged |
| Insights | 8 hard-coded `MOCK_INSIGHTS_V2` | Scraped from 19 Twitter analysts (Nitter) + Cricbuzz/ESPN |
| Per-ball commentary | Pre-written in mock balls | Scraped from Cricbuzz / ESPN |
| Standings | Hard-coded `STANDINGS` | Real fetch |
| Pitch reports | Hard-coded per venue | Scraped from pre-match analysis |

---

## Pending — v2 priorities (in suggested order) 🔵

### Critical path
- [ ] Wire **Roanuz Cricket API** integration. Pick the tier with Ball Tracker.
- [ ] Bookmaker odds scrapers (Betfair / Betway / 1xBet) → win-prob computation.
- [ ] Cricbuzz scraper for per-ball one-liner + coordinate fallback.
- [ ] Twitter / Nitter scraper for the 19 curated analyst accounts.
- [ ] Real-time SSE channel from server → browser for new balls.
- [ ] Smart fallback chain (Cricbuzz dies → ESPN serves, etc.) with Sentry alerts to WhatsApp/SMS.

### Important
- [ ] Shareable ball-GIF export — one-tap MP4/GIF for WhatsApp / Twitter (the underlying SVG animation already exists; this is an export layer).
- [ ] User accounts + favourites.
- [ ] Push notifications for favourited teams.
- [ ] Real domain (transition off `bawler.vercel.app`).

### Nice-to-have
- [ ] Vitest + RTL tests on key components (`BallGIF`, `DeliveryCard`, `MatchView`).
- [ ] Remove legacy components (`ViewSwitcher`, `MomentsCollapsible`, `PressureGauge`, `ProjectedScore`, `DemoControls`, `InsightsPanel`).
- [ ] Service worker for offline-cached last-seen match state.
- [ ] WCAG color-contrast audit on `text-dim` values.
- [ ] Lighthouse-mobile to 95+ (currently ~88).

---

## Open — pick from here when you're starting 🟢

These are bite-sized improvements that have surfaced through iteration but aren't blockers. Pick one, ship it end-to-end, build confidence with the workflow.

1. **Add `aria-live` regions** to the BallGIF caption and the score bar so screen-reader users get live updates without focus jumping.
2. **Replace the synthetic generated matches' 404 click-through** with a "Mock match — detail not available" graceful screen.
3. **Add a "Refresh data" button** that re-runs the scroll-listener load — useful when dev/debugging the infinite scroll.
4. **Tune the GIF's mini side-strip** to be more legible at 90 px wide.
5. **Add a "Compare to last 5 overs"** mini-stat under the AI metrics tiles.
6. **Localize the date format** by region (currently always `en-IN`).
7. **Fix the win-prob chart's pinch-zoom** on touch devices that have weird pointer behavior (Safari iOS).
8. **Remove the unused `app/globals.css` keyframes** that no longer have references in the codebase.

---

## Recent change log (high-level)

| Version | Highlight |
|---|---|
| **v1.0.1** | Build stability hotfix: completed 6 truncated files, added missing React imports to 8 files, stripped null bytes from page.tsx, fixed strict TS error in match/[id]/page.tsx |
| v1.0.0 | UX overhaul: bottom nav bar, AI tile context labels + trend arrows, Moments strip redesign, BallGIF info hierarchy, upcoming card countdown, team color filter dot |
| v0.9.8 | brightColor() function for hue-accurate team colors in win-prob charts (fixes MI navy→cyan distortion) |
| v0.9.7 | Removed event dots from WinProbChart (clutter), body background forced to #000000 |
| v0.9.5 | Chart gradient opacities increased, both team zones clearly visible |
| v0.9.3 | Win-prob chart always shows team A color for line; team zone colors fixed regardless of leader |
| v0.9.1 | Win-prob redesign: single area chart (not two crossing lines), MiniWinProb + WinProbChart |
| v0.9 | 6-sec GIF loops, unified outcome palette, variable-height ball cards, condensed metrics + inline mini-chart, win-prob dots on line, "balls" not "b" everywhere |
| v0.8 | Smaller card heights (138 px), filter animation fix (diff-aware), `/schedule` + `/table` pages, named stick figures, multiple live matches |
| v0.7 | Cards aligned heights, live win-prob bar prominent, consistent past/future card layout, 3-line future description, single-row filter |
| v0.6 | Filter dropdowns work (overflow bug fixed), enable mechanism, infinite scroll, column expand |
| v0.5 | Home screen split-team cards, live carousel, filter animations |
| v0.4 | Diff-aware commentary feed, mini-gif on every ball card, full-screen win-prob chart |
| v0.3 | Phone-frame on desktop, two-clip GIF restored, tabs structure (Live / Scorecard / Info) |
| v0.