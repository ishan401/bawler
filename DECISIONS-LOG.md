# Decisions Log

> Every locked decision and the reason behind it. Search here before re-litigating anything. New decisions get appended at the bottom.
>
> This file consolidates and supersedes the older `open-questions.md` log.

---

## Product & positioning

| # | Decision | Reason |
|---|---|---|
| P1 | **Product name = Bawler** | Working name on `bawler.vercel.app`. May rebrand pre-public-launch. |
| P2 | **Launch target = next available IPL 2026 match** | Use the live tournament as the marketing test window. |
| P3 | **Geographic focus = global (everywhere cricket is watched)** | Diaspora matters. India is the primary market but no geo-blocking. |
| P4 | **Audience = engaged second-screener (22–45)** | Cricbuzz users who're frustrated. Casual fans who want score+result are non-users. |
| P5 | **Marketing positioning deferred** | Product focus first; revisit messaging closer to v2 launch. |
| P6 | **No fantasy integration in v1** | Even passive Dream11 scraping cut. Stay clean. |
| P7 | **No real-money betting** | Regulatory minefield. Use odds as numeric input only. |
| P8 | **Geographic ad targeting deferred to v2** | Run organic for v1 launch. |
| P9 | **Legal counsel deferred** | Acknowledged risk on broadcast / team logos. Revisit pre-scale. |

## Prediction layer

| # | Decision | Reason |
|---|---|---|
| Pr1 | **No in-house ML for predictions** | Saves weeks of work; we can ship in 1 week. Revisit in v3 to remove third-party dependency. |
| Pr2 | **Win probability = scraped bookmaker odds, averaged + smoothed** | Markets are calibrated. Multiple sources for redundancy. |
| Pr3 | **Projected score = formula lookup (CRR × overs remaining + venue par + wickets-in-hand factor)** | Cricsheet historical data is enough. No model needed. |
| Pr4 | **Pressure gauge removed from UI** | Tried, didn't pass comprehensibility test. Concept of "pressure" as a 0–10 score wasn't intuitive. |
| Pr5 | **Replaced pressure with concrete metrics**: Projected, Momentum, Acceleration, Next-wicket impact | Each is a number with a clear meaning. |
| Pr6 | **Win-prob chart events use dots ON the line, NOT vertical lines** | Vertical lines made the chart messy. Dots on the line are cleaner. |

## Stats layer

| # | Decision | Reason |
|---|---|---|
| S1 | **No templated insight engine** | "Nth time in IPL history…" templates feel robotic. If a stat is worth saying, an analyst tweeted it. |
| S2 | **Insights sourced from ~19 curated Twitter analysts + Cricbuzz + ESPN scrapes** | Better quality than auto-generated. Lower build cost. |
| S3 | **Stats and opinions are visually distinct** | Stats: no attribution, plain weight, cyan accent. Opinions: italic, attributed, orange accent. |
| S4 | **Insight feed is chronological**, not source-grouped, mixing balls with stat/opinion notes | Reads like a real feed. First item is whatever was last emitted. |
| S5 | **All numbers shown as numbers, not narratives** | "Bumrah: 2/18 in 3 overs" not "Bumrah is bowling beautifully." |
| S6 | **"Balls" is spelled out everywhere — never "b"** | "12 balls" not "12b". |

## Ball-replay GIF (the hero)

| # | Decision | Reason |
|---|---|---|
| G1 | **GIF is the hero feature** | The visual differentiation moat. Other elements support it, never compete. |
| G2 | **Two-clip system: bowler perspective + overhead** | One clip wasn't enough to show both delivery characteristics and shot direction. |
| G3 | **6-second total loop (3 sec per clip)** | Tight enough not to feel slow; long enough to read both clips. |
| G4 | **4 reps per ball = 24 sec on screen before auto-advance** | Lets users actually look. Real production would push next ball via SSE. |
| G5 | **Stick figures, not 3D humans** | V1 simplicity. Same silhouette for everyone, name labels differentiate. |
| G6 | **Names visible NEXT TO each stick figure** | Bowler labeled at top of pitch, batter labeled at bottom-left. Not just in the corner caption. |
| G7 | **No view switcher in v1** | Tested in v0.5, removed. Two clips alternating is enough. |
| G8 | **Swing curves multiplied by 1.8×, spin by 2.2× for visual punch** | Real-world deviations are too subtle to read at small sizes. |
| G9 | **Background color tints to outcome** | Wicket = red wash, six = purple, four = cyan, dot = neutral. Same palette as ball cards. |
| G10 | **Outcome palette designed for over-summary readability** | A row of 6 ball-dots in an OverSummary should at-a-glance imply good vs bad over. |
| G11 | **No text labels for line / length / height in the GIF** | All visualized via the ball trajectory. Speed and ball-type (variation) are the only text. |
| G12 | **Audio transcription of live commentary CUT from v1** | Was a D4 spike, removed before D1. Video+audio extraction is a v2/v3 contingency only if vendor + Cricbuzz both fail to give coordinates. |

## Layout & navigation

| # | Decision | Reason |
|---|---|---|
| L1 | **Mobile-first, phone-frame even on desktop** | 95 % of usage is on phones. No separate desktop layout. |
| L2 | **Phone-frame is `max-width: 430px` centered on bg-deep on desktop** | Pixel 10 Pro is the design target. |
| L3 | **Home: header + filter + nav (Schedule / Table) + live carousel + 65/35 past/future split** | Mobile-friendly information density. |
| L4 | **Match tabs: Live / Scorecard / Info** | Commentary tab removed — merged into Live. |
| L5 | **Live tab order: GIF → Moments → MiniWinProb → 4 AI tiles → Commentary** | Hero first, then context. |
| L6 | **No manual ball-by-ball scrubber on home or match pages** | Live auto-advance OR jump to a Moment. No play/pause UI. |
| L7 | **Moments are always visible** (not collapsed) | Just below the GIF, horizontal scroll strip. Tap a chip to play that ball's GIF. |
| L8 | **Win-prob chart only accessible via tapping the MiniWinProb chart** | Full-screen modal with slide-up animation. Tap-backdrop-anywhere to close. |
| L9 | **No header tagline ("Every ball, visualized" removed)** | Saves space on the home page. Tagline only used for marketing. |
| L10 | **Single-row header on home: logo + 3 filter pills** | Compact pills (~70 px each) fit on Pixel 10 Pro at 430 px viewport. |
| L11 | **Schedule + Table buttons live on home page** (not on each card) | Per-card placement was redundant. Home-level nav is cleaner. |
| L12 | **Bottom navigation bar replaces header Schedule + Table buttons** (v1.0) | Persistent fixed bottom nav (Home / Schedule / Table) is the standard native pattern. Hidden on `/match/*` routes which have their own back nav. |
| L13 | **All non-match pages use `pb-20`** (v1.0) | Prevents content hiding behind the 80 px fixed bottom nav. |

## Match cards (home)

| # | Decision | Reason |
|---|---|---|
| M1 | **Split-team backgrounds** — team A's color + watermark on left, team B's on right | Visual identification at-a-glance. |
| M2 | **Rank pills on the OUTSIDE of team names** (consistent across past + future) | `#5 RCB ... CSK #3` style. Prior inconsistency confused parsing. |
| M3 | **Highlight badge in TOP-RIGHT corner** (consistent across past + future) | Was overlapping with the result text. Moved out of the way. |
| M4 | **Past cards: no time, only date** | Time is irrelevant once a match is over. |
| M5 | **Future cards: date + time on the same row** | Two adjacent units of info. |
| M6 | **Card height = 148 px for both past + future** (v1.0, was 138) | Increased to accommodate future card's anchor row. |
| M7 | **Past description = 2 lines with ellipsis** | More content density needed. |
| M8 | **Future description = 2 lines with ellipsis** (v1.0, was 3-line no-ellipsis) | Anchor bar takes the bottom slot; description fits in 2 lines above. |
| M12 | **Future card anchor bar** (v1.0) — `bg-black/35` strip at bottom: clock icon + cyan countdown + time + city | Balances card height against past card's result banner in the same slot. `fmtCountdown()` shows "in 2d 14h" / "Starting soon". |
| M9 | **Result banner = prominent, tinted in winning team's color** | E.g. "CSK WON BY 4 WICKETS" on translucent yellow band. |
| M10 | **Live carousel: full-width, half-height, prominent split win-prob bar** | Card itself shows what matters. |
| M11 | **Multiple live matches in carousel** | Snap-scroll horizontal between 1–3 live cards. |

## Filters

| # | Decision | Reason |
|---|---|---|
| F1 | **Pre-filled defaults: Team = KKR, Venue = Kolkata, Tournament = IPL** | Specific values; never the word "All". |
| F2 | **Separate enable mechanism** — circle on left of pill | Filter is OFF by default. Tap circle to toggle. |
| F3 | **Picking a non-default value auto-enables the filter** | Don't make the user toggle twice. |
| F4 | **Dropdown uses fixed-position container + backdrop** | Escapes the overflow-clip parent that was hiding it. Tap-backdrop closes. |
| F5 | **All three filters on a single row** (flex-nowrap, compact pills) | Wrapping looked broken. Truncate value to 8 chars if too long. |
| F6 | **Filter animation is diff-aware** | Only the changed cards animate. Stayers stay put. |
| F7 | **Filter animation timing: 700 ms leave + 900 ms enter, 55 ms stagger** | Slow enough to follow visually. |
| F8 | **Team filter pill shows a glowing color dot** when active (v1.0) — 8 px circle in team's `primaryColor` with matching box-shadow | Immediate team identification without needing to read the text. Implemented via optional `colorFn` on `FilterDef` so other filters don't inherit it. |

## Commentary feed

| # | Decision | Reason |
|---|---|---|
| C1 | **Single chronological feed** mixing balls + stats + opinions | Mirrors a real "feed." First item = whatever's most recent. |
| C2 | **Variable-height ball cards** | Compact ribbon (~36 px) for dots / runs / extras; full card (~110–140 px) for wickets / 4s / 6s. |
| C3 | **Full cards have a 78 × 96 px mini-GIF on the right (30 % of card width)** | Communicates pitch + shot at a glance. Doesn't bloat the card. |
| C4 | **Speed shown as a colored number** (cyan ≥ 145, white ≥ 135, orange ≥ 115, purple < 115) — no "Speed:" label | Color encodes pace family. |
| C5 | **Ball type shown as a colored dot + variation name** — no "Type:" label | Dot color = ball family (cyan swing, purple spin). |
| C6 | **Length / line / height / aerial info removed from text** | Visible in the mini-GIF. |
| C7 | **Over change marked by an OverSummary pill** | Six color-coded dots + over total. Acts as visual transition + summary. |
| C8 | **Exciting balls get an "extra narrative" paragraph** inside the card with a left-border indent | Adds visual weight to important moments. |

## Win-prob chart

| # | Decision | Reason |
|---|---|---|
| W1 | **MiniWinProb is inline by default** on the match page | No separate "open chart" button needed. |
| W2 | **MiniWinProb shows just two lines + 25/50/75 % gridlines** — no events, no labels | Condensed. Stays under 70 px. |
| W3 | **Tap MiniWinProb expands to full-screen** with slide-up animation | Sm0oth transition into detail view. |
| W4 | **Full chart events = colored dots ON the team-A line** (not vertical lines) | Vertical lines were cluttering the chart. |
| W5 | **Events listed in a strip below the chart**, with color + over + label + context | Clean spatial separation. |
| W6 | **Three zoom levels: Match / Innings / Recent** | Tap buttons or pinch on touch devices. |
| W7 | **Multiple ways to collapse the chart**: drag-handle at top, Collapse button in header, backdrop tap | Generous tap targets. |
| W8 | **Removed momentum-swing markers from chart events** — only Wicket, Six, Milestone, Big-over, Phase-shift | The momentum-swing markers were noisy and overlapped. |

## Match info tab

| # | Decision | Reason |
|---|---|---|
| I1 | **Pitch report is a first-class card** with sliders for pace, spin, bounce + expected score range + dew + plain-language bullets | Pitch info is "criminally under-discussed in cricket." |
| I2 | **Lineups shown side-by-side**, batting order + bowlers used | Compact two-column layout. |

## Tech & infrastructure

| # | Decision | Reason |
|---|---|---|
| T1 | **Bawler runs on AWS** (matches Shownex's cloud) | Shared IAM, VPC, billing, team muscle memory. |
| T2 | **Separate project in same AWS account** | Failure isolation; Bawler crashes don't touch Shownex. |
| T3 | **Stack: Next.js 14 + TypeScript + Tailwind, deployed to Vercel** | Standard, fast iteration via Vercel auto-deploy. |
| T4 | **Database: Postgres (managed)** + **Cache: Redis** | Production setup; mocked in v1. |
| T5 | **Real-time delivery: Server-Sent Events (SSE)** | Sub-second updates, one-way data. WebSocket overkill. |
| T6 | **Hybrid scraping**: Playwright (free, easy targets) + paid anti-bot service for Cloudflare-protected sites | ~$30-80/mo total. |
| T7 | **Audio transcription: Deepgram primary, Whisper fallback** (only if needed) | Streaming + Indian English handling. |
| T8 | **Analytics: PostHog (free tier)** | Funnels, cohorts, session replays. |
| T9 | **Error tracking: Sentry → WhatsApp/SMS** | Solo founder needs phone-level alerts. |
| T10 | **CI/CD: GitHub Actions; deployment to Vercel via Git push** | Free, standard for Next.js. |
| T11 | **CDN: Cloudflare free tier** | Static asset caching + DDoS protection. |
| T12 | **Failure handling: smart fallbacks** — Cricbuzz dies → ESPN serves; odds market dies → formula-only win prob | Critical for engagement metric. |
| T13 | **Replaced Recharts with hand-written SVG charts** | Saves ~90 KB First Load JS. |
| T14 | **No localStorage / sessionStorage** | Per Next.js + Vercel best practice in app router. State is React-only. |

## Data sourcing

| # | Decision | Reason |
|---|---|---|
| D1 | **Primary data vendor: Roanuz Cricket API** | India-based, IPL-focused, has Ball-Tracker product. |
| D2 | **Backup: Cricbuzz scraping** | Free, has coordinate data, redundant for vendor failure. |
| D3 | **Vendor budget ceiling: $1000/mo** | Falls back to pure scraping if exceeded. |
| D4 | **Bookmaker odds scraping confirmed OK** | Public odds, no facilitation of wagering. |
| D5 | **Twitter analyst list: 19 curated accounts** via Nitter (top of `data-sources.md` § D) | Better signal than open Twitter firehose. |
| D6 | **Historical data: Cricsheet free dataset** | 5+ seasons of ball-by-ball; powers par-score table + insight aggregation. |
| D7 | **De-scope: no deep player career-stats screen