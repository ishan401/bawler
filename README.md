# Bawler — IPL Live Companion (v0.1 prototype)

Every ball, visualized. Predictions, surfaced stats, and a live SVG replay of every ball.

This is the **mocked v0.1 prototype** — UI is fully built, all data is faked but shaped to match the expected Roanuz Cricket API schema. When the real API is wired in, only the data-layer adapter changes.

## Run locally (≈ 2 minutes)

```bash
cd "Sports tracker/bawler"
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (≈ 3 minutes)

1. Create a new GitHub repo (private is fine), push this folder as the root.
2. Go to vercel.com → New Project → import the repo.
3. Vercel auto-detects Next.js. Just hit **Deploy**.
4. Your URL will be something like `bawler-mvp.vercel.app`.

No env vars needed yet — everything is mocked.

## What's in the prototype

### Pages

- **`/`** — home page with last 1 completed match + next 5 upcoming (R12). Live match featured at top.
- **`/match/[id]`** — match page with the full live experience.

### Components on the match page (top-down on mobile)

1. **ScoreBar** — sticky top, shows score + chase context (need X off Y balls, RRR).
2. **BallGIF** — the hero. Top-down 2D pitch diagram with the three height techniques (R14):
   - **Shadow offset** — ball's shadow separates during delivery arc.
   - **Dot scale + glow** — ball grows/glows during shot arc.
   - **Inline mini side-strip** — height-vs-time below the pitch view.
   Also includes tiered flourishes (R19): wickets get red flash + stumps fly, sixes get purple boundary pulse, fours get cyan pulse.
3. **DemoControls** — play / pause / step / speed / jump-to-latest. So you can see the live feel without a real match.
4. **WinProbChart** — annotated line chart with inflection-point dots for wickets, sixes, big overs (R-annotations).
5. **ProjectedScore + PressureGauge** — two-up grid.
6. **InsightFeed** — source-tier waterfall (R16): analyst > Cricbuzz > ESPN > bot.

### Layers

- **`lib/types.ts`** — TypeScript types matching the expected Roanuz Cricket API schema. Adjust here when real data shape becomes known.
- **`lib/mockData.ts`** — a fully fleshed-out IPL 2026 match (KKR chasing 175 vs MI at Eden Gardens, mid-innings), plus 5 upcoming + 1 recent.
- **`lib/winProb.ts`** — placeholder win-probability formula. To be replaced with the odds-scraper output in production.

## Demo mode — how to use it

The match page starts paused at the latest mocked ball. Use the demo controls to:

- **Play** at 1×/2×/5×/20× speed to watch the chase unfold ball-by-ball.
- **Step back/forward** to inspect any moment.
- **Jump to latest** to skip to current.

This is purely a dev tool — in the real product, the page subscribes to a Server-Sent Events stream from the server, which pushes new ball events as they happen.

## What's NOT in the prototype (yet)

- Roanuz API integration (the adapter is the next file to write).
- Bookmaker odds scraping for real win prob.
- Twitter / Cricbuzz / ESPN scraping for the insight feed.
- Audio commentary transcription (cut from v1 per R-audio).
- Player profile pages (de-scoped per R-historical).
- User accounts / push notifications / share-to-WhatsApp (v2).
- SEO meta + OG share images (Vercel adds basics auto, we'll polish later).

## File map

```
bawler/
├── README.md                       # this file
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── .gitignore
├── app/
│   ├── globals.css                 # design tokens + keyframes
│   ├── layout.tsx                  # root layout
│   ├── page.tsx                    # home page
│   └── match/[id]/page.tsx         # match page route
├── components/
│   ├── MatchCard.tsx               # used on home
│   ├── MatchView.tsx               # the match page client component
│   ├── ScoreBar.tsx                # sticky top
│   ├── BallGIF.tsx                 # ⭐ Pillar 3 hero
│   ├── WinProbChart.tsx            # Pillar 1 chart w/ annotations
│   ├── PressureGauge.tsx           # Pillar 1 gauge
│   ├── ProjectedScore.tsx          # Pillar 1 tile
│   ├── InsightFeed.tsx             # Pillar 2 feed
│   └── DemoControls.tsx            # dev-mode auto-advance
└── lib/
    ├── types.ts                    # schema (mirrors Roanuz)
    ├── mockData.ts                 # the mocked match
    └── winProb.ts                  # formula placeholder
```

## Color palette

| Token | Hex | Used for |
|---|---|---|
| `bg` | `#0A0E1A` | page background |
| `bg-surface` | `#141B2D` | cards |
| `bg-elevated` | `#1B243A` | elevated cards (GIF, demo controls) |
| `cyan` | `#00E5FF` | primary accent, win-prob line, 4-pulse |
| `orange` | `#FF6B35` | secondary accent, projected/heat colors |
| `boundary` | `#10B981` | comfortable / big-over green |
| `wicket` | `#EF4444` | wicket flash, danger |
| `six` | `#A855F7` | six pulse + glow |
| `text-primary` | `#F8FAFC` | body |
| `text-secondary` | `#94A3B8` | secondary |
| `text-dim` | `#64748B` | labels |

To change the theme, edit `tailwind.config.ts` and `app/globals.css`.

## Next steps after you see it

1. Tell me what's off — pacing of the GIF, density of any component, color tweaks.
2. Once Roanuz responds with their API + sample data, I'll write the adapter that swaps mock data for real.
3. Wire up the scraping workers (odds, Cricbuzz, Twitter) — that's the next codegen sprint.

Have fun.

