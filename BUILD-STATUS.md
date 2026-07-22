# Bawler Build Status

> Snapshot of what's shipped, what's mocked, what's pending. Updated alongside every deploy.

**Current version:** v1.0.99 (deployed)
**Live URL:** `bawler-gold.vercel.app`
**Repo:** `github.com/ishan401/bawler`
**Local dev:** `cd bawler-main && npm install && npm run dev`

---

## Shipped ✅

- ✅ **Performance** — feGaussianBlur SVG filters removed from animated balls (biggest GPU bottleneck); animate-r geometry invalidation removed; React.memo on 7 components; useCallback on moment selection handler

### Home page (`/`)

- ✅ Compact header — logo + Bawler title only (filter chips removed)
- ✅ **Bottom navigation bar** — persistent Home / Schedule / Table at bottom of every page; active tab cyan + underline; shows on match page too (all tabs dimmed)
- ✅ **Team filter colour dot** — glowing dot in team's primary colour when TEAM filter active
- ✅ Live carousel — snap-scroll, 3 mock live matches, full-width cards with split win-prob bar
- ✅ **Live carousel "for you" marker** (v1.0.91) — a live match that also qualifies for "for you" gets an inline `★ For you` badge stamped on its existing carousel card (`LiveMatchCard`'s `forYou` prop, threaded via `LiveCarousel`'s `forYouIds`), instead of a duplicate standalone "for you" card below; the homepage's single global hero match is excluded from this even when it also qualifies (hero is a global pick, not a personalization signal)
- ✅ **Empty state** — when no live matches, shows next upcoming match card (teams, countdown, venue)
- ✅ **Loading skeleton** — shimmer placeholder cards for 350ms on first load
- ✅ **Pull-to-refresh** — pull from top triggers spinner + simulated refresh (only at scroll pos 0)
- ✅ **Tap feedback** — all match cards scale + darken on press (`.tap-scale`)
- ✅ Filter bar — pre-filled defaults, enable circle, fixed-position dropdowns
- ✅ Past column (65%) — split-team backgrounds, result banner, rank pills, 2-line description
- ✅ Future column (35%) — countdown anchor bar at bottom (clock + cyan "in 2d 14h" + time + city)
- ✅ Diff-aware filter animation — stayers don't move, leavers collapse, newcomers pull up with stagger
- ✅ Column expand toggle (full-width past or full-width future)
- ✅ Infinite scroll via window scroll listener

- ✅ **Series status chip** — one-line bilateral series summary (e.g. "AUS lead 1-0 · 5-match T20I series") below live bilateral international cards; uses `match.seriesStatus` field
- ✅ **International flag backgrounds** — national match cards show country flag images (flagcdn.com) with desaturation filter; franchise matches keep dual-colour gradient
- ✅ **Live win-prob sparkline on the hero card** (v1.0.49, fixed v1.0.50, de-tangled v1.0.51) — replaces the old static win-prob bar; reuses `calculateWinProbForMatch()` (same source as the full-screen `WinProbChart` modal), bucketed to one point per over + Catmull-Rom smoothed for a clean sparkline shape at small size; no 50% gridline (scoped to this component only — the full-screen modal keeps its own); falls back to the old static bar for the 2 mock matches with no ball data
- ✅ **Explicit hero-match selection rule** (`lib/heroSelection.ts`, v1.0.62) — replaces the old ad hoc `byPopularity()` sort (hardcoded per-competition/per-team point constants) with a deterministic 3-tier rule: (1) prominence — international tournament > bilateral series > domestic league, with a marquee-stage bump for finals/semifinals/qualifiers/deciders; (2) live stakes — ties broken via the same methodology as Spotlight's milestone pillar, adapted to a live match's current progress; (3) live runway — format capacity × innings remaining, then most-recently-started. Global and never personalized — takes only the live-matches array, no `FollowPrefs` — "for you" continues to simply exclude whatever hero this selects
- ✅ **Quiet cards for ordinary matches, full "spotlight" for the rare few** (v1.0.49) — `PastMatchCard`/`FutureMatchCard` are now a flat 60px row (team names + thin winner-colour border, no gradient/crest/badge); matches clearing the spotlight bar (`lib/spotlight.ts` — close finish, individual milestone, or genuine knockout/decider stakes; not the old `excitement` score) get the full card treatment pulled out above the grid, single or as a capped 3-card carousel
- ✅ **Score display: "all out" convention, no dangling slash** (v1.0.59) — `formatScore(runs, wickets)` (`lib/formatUtils.ts`) drops the wicket count entirely when `wickets` is `undefined`/`null`/`>= 10` ("187", never "187/10" or a bare "187/"); used by `QuietSide`/`SideBlock`. Also backfilled 5 mock `match.result` objects that were missing `teamAWickets`/`teamBWickets` outright (data gap, separate from the display-logic fix).
- ✅ **Grid border-color rule hardened** (v1.0.60) — `PastMatchCard`'s winner-color lookup now requires an explicit match against either `teamA.code` or `teamB.code` (previously a two-way ternary that silently defaulted to `teamB`'s color on any non-match against `teamA`, including a missing/unmatched winner code); falls back to the same neutral line color `FutureMatchCard` uses if truly ambiguous. Audited every card then live in the grid — all already showed the correct winning team color; this closes a latent failure mode rather than a currently-visible mismatch.
- ✅ **"For you" row** — surfaces the single best qualifying match matching any followed nation/team/tournament/series/player/format (v1.0.52 Filter feature), pooled by union across categories with Tier-1 (nation/team/tournament/series/format) outranking Player-only as a last resort. As of v1.0.91: a qualifying LIVE match never renders a standalone card here at all — it gets an inline `★ For you` marker stamped directly on its existing live-carousel card instead (see the Live carousel bullet below), so this row now only ever surfaces the single soonest qualifying UPCOMING match (excluding the homepage's own hero live match's fallback case, unchanged from v1.0.53); a match shown here that's *also* a spotlight match still gets a `★ FOR YOU` marker on the spotlight card instead of a second copy
- ✅ **"For you" upcoming match no longer duplicates into Coming Up** (v1.0.93) — the single soonest-qualifying upcoming match rendered in "for you" is now also excluded from the "Coming Up" grid below (`futureList.filter(m => !spotlightIds.has(m.id) && m.id !== forYouVisible?.id)`), mirroring "for you"'s own `m.id !== heroId` hero-exclusion in the other direction. Selection logic is untouched — a follow with multiple qualifying upcoming matches still only pulls the one match actually shown in "for you"; every other qualifying match stays visible in Coming Up exactly as before (see DECISIONS-LOG.md FY15-FY17)
- ✅ **"Coming Up" header count fixed to match its actually-rendered list** (v1.0.94) — the `· N` count read the raw unfiltered `futureList.length` while the grid below applied 2 exclusions (Spotlight dedup + the v1.0.93 "for you" dedup), so the header could read "11" while only 10 cards rendered. Both the count and the render now read one shared `futureVisible` memo, so they can never drift apart (see DECISIONS-LOG.md FY18-FY19)
- ✅ **"For you" upcoming card: 7-day countdown/plain-date presentation split** (v1.0.89) — the upcoming-match selection itself still has no lookahead cutoff (always picks the soonest qualifying match, however far out); within 7 days the card shows the existing countdown (`"in 4d 19h · 6:12 pm"`), beyond it shows a plain date instead (`"Next match: 19 Oct"`) since a countdown stops being meaningful information at that distance. Scoped to `ForYouRow` only — `FutureMatchCard` ("Coming Up" grid) does not have this same split and still always shows the countdown format regardless of distance (see DECISIONS-LOG.md FD2)
- ✅ **"For you" ↔ Spotlight shared visual language** (v1.0.61) — corner radius (`0.75rem`, matching Spotlight/grid), padding rhythm (`px-2 py-1.5` edges + one uniform `flex-col gap-0.5`, replacing ad-hoc per-child margins), and label typography aligned between the two cards; each card's own height, background treatment, and content are untouched — Spotlight stays visibly taller/louder, "for you" stays a compact flat strip
- ✅ **Contained swipe-carousel dot indicator** (`components/CarouselDots.tsx` + `lib/useCarouselIndex.ts`, v1.0.65) — replaces the native scrollbar thumb that used to render as a thin gray bar spanning the full scroll-container width (wider than any one card, so it overflowed past each card's rounded corners); small 5-6px dots now render below the card, bounded to that card's own width, muted gray inactive / accent-colored active (cyan hero + Spotlight, violet "for you"); renders nothing at all below 2 items. Applied to all 3 places this carousel pattern exists — hero, "for you", Spotlight; `.scrollbar-thin` itself is untouched elsewhere (Moments strip, mini-insights bar, table page, FollowSheet, etc.)
- ✅ **Filter / personalization sheet** — see the Personalization section immediately below

### Personalization (Filter / For You) — v1.0.52, v1.0.53, v1.0.56–v1.0.58, v1.0.63–v1.0.64

- ✅ **Bottom nav Filter trigger** — plain flat icon+label tab (v1.0.56), identical layout/size to Home/Schedule; neutral gray by default, Violet 600 (`#7C3AED`, the `follow` token — same accent used for selections inside the sheet) only while the sheet is open, reverting to neutral on close. Originally a raised circular "camera button" (Instagram-style); downgraded once it read as more prominent than Home/Schedule despite being the least-used and opening an overlay rather than a persistent screen.
- ✅ **`FollowSheet`** — two-column bottom sheet ("Follow your cricket"): left rail = 5 categories (Nation/Team/Tournament/Player/Format) with per-category selected-count badges; right pane = search + multi-select list; nothing persists until the full-width **"Update (N)"** button is tapped — backdrop tap / × / back-swipe discards in-progress edits. Button reads "Update" rather than "Follow" (v1.0.64) since a saved change can just as easily be a removal as an addition; commit/discard mechanic itself is unchanged
- ✅ **Category rail reordered to Nation/Tournament/Team/Player/Format** (v1.0.86, was Nation/Team/Tournament/Player/Format) — matches how people actually think about following cricket: country, then competition context, then club, then individuals, then format
- ✅ **New "Series" category split out of Tournaments** (v1.0.88) — bilateral/tour-style competitions (`Competition.type === "bilateral"`: The Ashes, India tour of England 2026, India tour of Australia 2026, South Africa tour of England 2026) no longer list inside Tournaments alongside genuine multi-team competitions (BBL, IPL, PSL, Hundred, SA20, CPL, MLC, Champions Trophy, T20 World Cup, WTC). Category rail now reads Nations/Tournaments/Series/Teams/Players/Formats. `FollowPrefs.series` threaded through `qualifyMatch`/`isTier1Match`/`sanitizeFollowPrefs`/`totalFollowCount` identically to how `tournaments` already worked — following a series behaves exactly as before, just correctly attributed (see DECISIONS-LOG.md SC1-SC3)
- ✅ **Colored dot removed from Tournament/Player/Format rows** (v1.0.86) — those three never carried real signal (Tournament inherited `Competition.logoColor`, which repeats across unrelated competitions; Player redundantly echoed the nationality text already shown as sublabel; Format always fell through to the same gray default). Kept only for Nation (real flag image) and Team (now backed by corrected real colors, see below)
- ✅ **Franchise team colors audited against real official branding** (v1.0.86) — ~50 franchise teams (`TEAMS` + `LEAGUE_TEAMS`, spanning IPL/BBL/PSL/Hundred/SA20/CPL/MLC) checked via multi-source web research, not just a spot-check; 20 teams corrected where the current hex was in the wrong color family or contradicted by corroborating sources (see DECISIONS-LOG.md FC1-FC5 for the full list and reasoning). Barbados Royals' pink reconfirmed correct.
- ✅ **The Hundred 2026 ownership rebrand reflected in team data** (v1.0.86) — 3 teams renamed to match the real 2026 season after IPL-adjacent groups bought ownership stakes: Oval Invincibles → MI London (`MIL`, Mumbai Indians colors), Manchester Originals → Manchester Super Giants (`MSG`, red/blue), Northern Superchargers → Sunrisers Leeds (`SUL`, Sunrisers Hyderabad colors); Southern Brave (`SBR`) kept its name but switched to Delhi Capitals' blue/red. Squads intentionally left untouched — a full roster reconciliation against the real 2026 auctions is a separate, larger task.
- ✅ **`BottomSheet`** extracted to a shared component (`components/BottomSheet.tsx`) from its original `LiveCarousel.tsx`-only implementation, gaining an optional `footer` slot for the Follow sheet's pinned button; all 3 existing `LiveCarousel` call sites unaffected
- ✅ **ID-based matching, never display-name matching** — nations by `Team.country`, teams by `Team.code`, tournaments by `Competition.id`, players by `PLAYERS` registry slug, formats by the `MatchFormat` literal
- ✅ **Per-match player lineups** (`lib/lineups.ts`) — `Match.lineups?: { teamA: string[]; teamB: string[] }` checked first (real-API-ready); falls back to a deterministic seeded-hash presence check against the `PLAYERS` registry when a match has no explicit lineup, so a player who represents both a national side and a franchise doesn't get credited with every match either team plays — only ones they're actually confirmed/likely to have featured in
- ✅ **`qualifyMatch()`** (`lib/followPrefs.ts`) — per-category breakdown (`{ nation, team, tournament, series, format, player }`) rather than a single boolean. Nation-following previously suppressed every bilateral match outright (redundant with the hero card/series-status chip); as of v1.0.91 that blanket suppression is gone — a followed nation's bilateral matches surface normally, with only the single global hero match excluded (matching how team/tournament/series/format follows already worked, see DECISIONS-LOG.md FY11)
- ✅ **Tiered union "for you" selection** (v1.0.53, restructured v1.0.91) — pools matches by union (not intersection) across every followed category; Tier 1 (nation/team/tournament/series/format) always outranks Tier 2 (player-only), used only when Tier 1 is completely empty. Live beats upcoming (checked first); ALL qualifying live matches (excluding the homepage's own hero live match, which re-triggers fallback to upcoming rather than showing nothing) become inline markers on their existing live-carousel cards rather than standalone cards — see the Live carousel marker bullet above. Only when there are zero live qualifiers does a single upcoming card render, chosen by an explicit priority order (`bestFollowRank()`: team > series > tournament > nation > format, then soonest as a tiebreak — DECISIONS-LOG.md FY13) rather than pure soonest-first.
- ✅ **Team category scoped to franchise/league teams only** (v1.0.57) — `buildOptions("teams")` was pulling from `ALL_TEAMS` (Nation + Team + League merged), so every national team also appeared a second time under Team labeled "National team". Filtered to `type !== "national"`; Nation is unaffected, still `NATIONAL_TEAMS` only. Audited Tournament/Player/Format for the same overlap — none found.
- ✅ **"For you" card: followed team always left** (v1.0.58) — `followedMatchSide()` (`lib/followPrefs.ts`) resolves which side (A/B) actually satisfies the user's prefs (team > nation > player priority), and `ForYouRow` renders `leftTeam`/`rightTeam` from that instead of raw `teamA`/`teamB`; returns `null` (order untouched) for tournament/format-only qualifiers. Added a matching 3px colored left border (`leftTeam.primaryColor`) so border + dot + name are one consistent unit. Scoped to this card only — Live/Spotlight/grid keep their existing team-order conventions.
- ✅ **Empty-state nudge** (`lib/followNudge.ts`) — dismissible invite to try Filter, shown only pre-first-follow and only within the first 3 Home visits; permanently gone once dismissed or once anything is followed
- ✅ **Stored prefs sanitized against the same valid-ID sets the sheet itself renders from** (`sanitizeFollowPrefs()`, v1.0.63) — fixes a real regression from v1.0.57's category-scoping fix (CO1): a national-team code stored in `FollowPrefs.teams` *before* CO1 shipped could never again render as checked (excluded from `buildOptions("teams")`), yet was still counted by `totalFollowCount()` and honored by `qualifyMatch()` — a "phantom selection" with no UI path to clear it. `getFollowPrefs()` now filters every category on every read and self-heals localStorage immediately if anything stale is dropped, guaranteeing the checkbox state and the count/badges can never disagree.
- ⚠️ **localStorage schema-version guard was shipped then explicitly reverted** — see DECISIONS-LOG.md LS1. `getFollowPrefs`/`setFollowPrefs` currently use the raw, unversioned JSON shape on purpose. Do not reintroduce a version wrapper without being asked again.

### Schedule page (`/schedule`)

- ✅ All matches grouped by date, chronological
- ✅ Past matches show winner + margin; live show pulsing dot; future show "Upcoming"
- ✅ Clean header — title only, no back button (primary nav destination)
- ✅ Tap to open match page

### Table page (`/table`)

- ✅ **Multi-competition horizontal tab selector** — 8 competitions: IPL, PSL, BBL, The Hundred, SA20, ICC T20WC, ICC CT, WTC
- ✅ Column variants: NRR (franchise leagues), PCT% (WTC), Drawn (WTC)
- ✅ Top-N qualifier bar + "Q" badge auto-rendered from `qualifyingSpots` per competition
- ✅ Eliminated teams: dimmed + "Out" badge
- ✅ Clean header: "Table" + "All competitions" subtitle, no back button

### Player profiles (`/player/[id]`)

- ✅ **SSG route** — `generateStaticParams()` over `PLAYERS`; `notFound()` on miss
- ✅ Bio card: name, country flag, role, batting/bowling style
- ✅ ICC rankings badges
- ✅ Format tabs: Test / ODI / T20I / {franchiseLeague} — tab label dynamic per player
- ✅ Batting + bowling stats grids (4-column); null when no data for that type
- ✅ Clickable from Scorecard rows and CommentaryFeed wicket cards
- ✅ `PLAYER_ALIASES` map resolves alternate IDs; `resolvePlayerSlug()` in Scorecard
- ✅ 21 player profiles seeded in mock data

### Match page — Live tab

- ✅ Sticky header — score bar + mini-insights bar + tab strip
- ✅ Mini-insights bar — RRR, last 12 balls, current bowler figures, top scorer
- ✅ **Book page-turn animation** — 3D rotateY + translateX on tab switch (swipe or tap); direction-aware
- ✅ **Swipe between tabs** — left = forward, right = backward; ignores vertical swipes
- ✅ **Score event badge** — red pulsing dot (wicket) or teal dot (six) on Scorecard tab; clears after 4s
- ✅ **Partnership tracker** — single-row footer below ball visualizer: `Pship N(B) · BatterA N(B) [×4][×6] · BatterB N(B)` + total 4s/6s pinned right; resets on wicket; handles non-striker run-outs and no-balls correctly
- ✅ **Series schedule bottom sheet** — bilateral series status chip on live cards is now a tappable button; opens BottomSheet with complete series timeline: past matches (result + scorecard scores), live match highlighted in green, upcoming matches with countdown; back-swipe / swipe-down to close
- ✅ **iOS Safari back-swipe fix** — BottomSheet now pushes a `#modal` URL hash entry so iOS Safari's edge-swipe fires `popstate` correctly; cleanup uses `replaceState` (not `history.back()`) to avoid double-navigation on programmatic close; works correctly on Android, desktop, and iOS PWA
- ✅ **Partnership velocity spark** — Scorecard tab now shows a Partnerships section between Batting and Bowling; each row has a 72×22px SVG sparkline (team-coloured area + polyline) showing RPO per 3-ball window across that partnership, batter names, and runs(balls); only renders when ball data exists
- ✅ **ScoreBar competition badge** (v1.0.47) — hidden for bilateral series (redundant with the two team names already shown); still shown for leagues/tournaments where it disambiguates (e.g. "IPL", "ICC T20 WC")
- ✅ **BallGIF** — two clips (bowler perspective + overhead) 3s each, 4 reps/ball (24s dwell)
- ✅ **Perspective-correct impact Y** — uses trapezoid width ratio (220/80=2.75) for accurate pitch length display
- ✅ **Post-pitch bounce arc** — bezier control above impact point; bounce height scales with pitchY (10–55px)
- ✅ **No SVG filter on animated balls** — feGaussianBlur removed; perf fix; gradient fill preserved
  - ✅ **Speed label** (v1.0.45) — redundant "Fast"/"Slow" text removed from the info bar; the speed number's colour alone now signals pace, matching the commentary feed convention
  - ✅ **Share button relocated** (v1.0.46) — moved off the visual (was floating top-right on wicket/4/6 balls) into the info-bar chrome beside the outcome badge; still only shows on highlight balls
  - ✅ Stick figures with name labels; speed + ball type as text
  - ✅ Exaggerated swing (1.8×) + spin (2.2×) for visual punch
  - ✅ Background tint by outcome (unified palette) — no whitish wash (perspective fix)
  - ✅ Cross-fade between clips (280ms); smooth bg transition between balls (600ms)
- ✅ **Moments strip** — two-zone chips (badge + over top; label + 2-line context bottom). Dedicated pulsing "Live" chip was **removed in v1.0.45** — the existing "Back to live" text link already covers that affordance; two live-status indicators was redundant.
- ✅ **Matchup card** (v1.0.47) — defaults to a collapsed one-line teaser (team-coloured dot + batter vs bowler + chevron, ~40px); tap to expand in place to the full H2H card (unchanged content: format-aware stats, career H2H + live counters, label-value row, danger delivery line, shareable PNG). Collapsing by default trades always-visible depth for screen space — see DECISIONS-LOG.md.
- ✅ **Win-prob chip** (v1.0.46) — win probability moved out of the standalone MiniWinProb card into a leading-team-code + % chip inside the mini-insights bar; tap to expand the full WinProbChart modal (unchanged). `MiniWinProb.tsx` is no longer rendered anywhere and is now orphaned dead code (see cleanup list below).
- ~~AI metrics tiles~~ — **retired in v1.0.23** (see DECISIONS-LOG.md SD3); row removed entirely, replaced by projected score + CRR in ScoreBar. `AIMetrics.tsx` + `lib/metrics.ts` are now orphaned dead code (see cleanup list below).
- ✅ Win-prob chart modal — full-screen, two team lines, hue-accurate via `brightColor()`

- ✅ **SpeedChip** — hidden when `ball.ballSpeedKmh` is null (was showing "0 kmh")
- ✅ **Format-aware chase metrics** — `totalBallsForFormat(match)` replaces hardcoded 120; correct for T20/ODI/Test
- ✅ **Insights prop-driven** — `MatchViewProps.insights?: InsightV2[]`; real pages pass `insights={[]}`, mock is default fallback
- ✅ **truncatedMatch innings fallback** — when no balls exist for innings[1], falls back to real `match.innings[1]` values (ScoreBar no longer shows 0/0)
- ✅ **Commentary feed** (share button **removed entirely in v1.0.47** — see DECISIONS-LOG.md, reverses CL2) — colour-coded ball outcomes:
  - Wicket: red `#EF4444`
  - Six: turquoise green `#2DD4BF`
  - Four: cyan `#06B6D4`
  - Three: hot pink `#EC4899`
  - Dot / single / double: muted slate `#64748B` (all same — low-impact group)
  - Extra: light slate `#94A3B8`
  - Full cards (mini-GIF) for wickets / 4s / 6s; compact rows for everything else
  - Stat / opinion inline notes; over summary pills; innings break dividers

### Match page — Scorecard tab

- ✅ Uses `ALL_TEAMS` (not `TEAMS`) — correctly resolves national team names/colours
- ✅ Per-innings batting card (R / B / 4s / 6s / SR / dismissal)
- ✅ Per-innings bowling card (O / M / R / W / Econ)
- ✅ **Not-out row fix** — a batter's dismissal line now shows exactly one string (either real dismissal text or "not out"), never both; was rendering a duplicated "not out" on every not-out batter (`ee03f69`)
- ✅ **Team toggle (T20/ODI/Hundred)** — two compact pill chips (byte-identical styling to DigestTab's own filter chips) switch which team's innings renders below; defaults to whichever team is currently batting (live) or batted last (completed); "Yet to bat" empty state for the other team; Test format unaffected, keeps its own per-innings chips (`4aa8a24`, `ea4043b`, `61092bd`)
- ✅ **Per-innings chips (Test only)** — one chip per innings labelled `"{Team} Inn. {N}"` where N is which innings this is *for that team* (1st or 2nd), not the global ball-order position; defaults to the innings currently in progress (`03091d8`)
- ✅ **`teamInningsOccurrence()`** in `lib/formatUtils.ts` — single source of truth for "which innings is this for this team"; used by both the Test chip labels and the innings-card header itself, so a team's 2nd Test innings always reads "Innings 2" everywhere, never "Innings 3"/"Innings 4" (the global `match.innings` array position) (`2a9944d`)
- ✅ **Sticky innings header** — team name + innings score sticks below the match header while scrolling; offset is now measured live via `ResizeObserver` (`--sticky-header-h` CSS var) instead of a hardcoded px value, so it stays flush under the real header in every format (Test's header is a different height than T20's) (`e910c0d`, `57a0fae`)
- ✅ **Per-batter sparkline** — cumulative runs-vs-balls-faced mini chart on the dismissal/"not out" line (~20px tall, doesn't add a row); smoothed Catmull-Rom curve; fours marked cyan, sixes marked six-purple, same "event dot on a line" pattern as the win-prob chart; dot count is capped at the batter's own 4s/6s column so it can never show more boundaries than the box score states; renders nothing when there's no ball-by-ball data for that batter (`32444f8`, `ac42d9a`, `8bb153e`, `9456e99`, `bb60664`, `105284a`)
- ✅ **Not-out glow** — the currently-batting row's name/sparkline gets the same pulsing `excitement-glow` box-shadow used on high-excitement match cards, confined to a small rounded chip around just that cell (not the whole row, which read as a hard rectangle) (`9456e99`, `bb60664`)
- ✅ Highest scorer: runs in teal per innings
- ✅ Highest wicket-taker: wickets in red per innings
- ✅ Highest strike rate (min 6 balls): SR in blue per innings
- ✅ Man of Match: name in gold + MOM chip
- ✅ Man of Series: name in purple + MOS chip
- ✅ MOM/MOS banners above innings cards when match is complete

### Match page — Info tab

- ✅ Match context (toss, teams, season)
- ✅ Pitch report card — surface type, 3 sliders, expected score range, dew factor, behaviour bullets
- ✅ Lineups — both team squads side-by-side (innings lookup by `battingTeam`, not positional array index)


### Platform-wide franchise agnosticism

- ✅ `franchiseStats?: FormatStats` + `franchiseLeague?: string` on `PlayerProfile` (was `iplStats`)
- ✅ Player profile tab label shows actual league name per player (e.g. "IPL", "BBL")
- ✅ All 3 transformer skeletons in `transformers.ts` updated to `franchiseStats`
- ✅ App meta description: format-agnostic ("All cricket, every ball, visualized...")
- ✅ `seriesStatus?: string` on `Match` for bilateral series one-liners

### Brand + visuals

- ✅ Phone-frame on desktop (`max-w-[430px]`) floating on pure black (`#000000`)
- ✅ Unified outcome palette (`lib/outcomeColors.ts`)
- ✅ Cricket-domain accent palette in Tailwind (cyan, orange, boundary, wicket, six)
- ✅ Inter font from Google Fonts; tabular numerics (`num` utility)

### Tech / infra

- ✅ Next.js 14 App Router + TypeScript strict + Tailwind CSS
- ✅ Vercel auto-deploy from `main` branch (60–90s build)
- ✅ Static-prerendered match pages via `generateStaticParams`
- ✅ No external chart library — hand-written SVG throughout
- ✅ BottomNav outside phone-frame in layout — never clipped by `overflow: clip`
- ✅ **Data validation/adapter layer (`lib/dataValidation.ts`, v1.0.80)** — `normalizeMatch()` validates Match/Innings/Ball/Team/Venue/Competition shapes at the data boundary, collecting errors (blocking) and warnings (non-blocking) rather than letting malformed data flow silently into narrative/win-prob functions; never throws. Wired into `lib/matchGenerator.ts` as the template call site for a future real API adapter
- ✅ **Win-prob null-safety (`lib/winProb.ts`, v1.0.80)** — `target!` non-null assertion in the chase-innings branch replaced with a real null check that skips the point (fewer chart points) instead of computing a fake NaN-derived percentage; `calculatePressureGauge` given the same guard on `firstInningsRuns`
- ✅ **Single-source-of-truth app version (`lib/version.ts`, v1.0.83)** — `APP_VERSION`/`APP_VERSION_LABEL` derive from `package.json`'s `"version"` field; `scripts/version-check.ts` runs as an npm `"prebuild"` hook (so it's part of `npm run build`, the same command Vercel runs) and fails the build outright if a hardcoded `Bawler vX.Y.Z` literal ever reappears anywhere outside `lib/version.ts` — fixes a real bug where the match-page footer stayed hardcoded at "v1.0.65" across 17 releases (see DECISIONS-LOG.md VF1–VF3)

---

## Mocked (will become real in v2) 🔶

| Source | Mock state | Plan |
|---|---|---|
| Live match data | Hard-coded KKR vs MI in `mockData.ts:FEATURED_MATCH` | Roanuz API (Ball Tracker tier) |
| Carousel live matches 2 & 3 | `liveStatusOverride` + `liveWinProbOverride` fields | Real fetches |
| Past + future matches | Hard-coded + `matchGenerator.ts` procedural | Real fetches |
| Coordinates (pitch / shot) | `Math.random()`-based but plausible | Roanuz Ball Tracker + Cricbuzz fallback |
| Win probability | Internal power-curve formula (calibrated, no double wicket penalty) | Scraped bookmaker odds (Betfair / Betway / 1xBet) averaged |
| Insights | 8 hard-coded `MOCK_INSIGHTS_V2` | Scraped from 19 analyst Twitter accounts via Nitter |
| Per-ball commentary | Pre-written in mock balls | Scraped from Cricbuzz / ESPN |
| Standings | Hard-coded `STANDINGS` | Real fetch |
| Pitch reports | Hard-coded per venue | Scraped from pre-match analysis |
| Ball-by-ball vs box score | Ball arrays in ~4 matches (`ipl2026-m37-kkrvmi`, `ind-aus-t20i-2026-m2-live`, `ind-eng-test-2026-d3-live`, `psl-2026-lah-kar-live`) don't fully reconcile with their own battingCard aggregate stats — some batters' ball data has more/fewer isBoundary4/6-flagged deliveries, runs, or balls faced than their card states (audited: 24 of 53 checked batters mismatched). The new per-batter sparkline caps its boundary dots at the card's own 4s/6s so it never *overcounts*, but can undercount when the ball log is short. | Regenerate ball-by-ball data per innings so every batter's runs/ballsFaced/4s/6s fully reconcile with the card; real API data won't have this problem |

---

## Pending — v2 priorities 🔵

### Critical path
- [ ] Roanuz Cricket API integration (Ball Tracker tier)
- [ ] Bookmaker odds scrapers (Betfair / Betway / 1xBet) → win-prob
- [ ] Cricbuzz scraper for per-ball one-liner + coordinate fallback
- [ ] Twitter / Nitter scraper for 19 curated analyst accounts
- [ ] Real-time SSE channel server → browser for new balls
- [ ] Smart fallback chain with Sentry alerts to WhatsApp/SMS

### Important
- [ ] Shareable ball-GIF export — one-tap MP4/GIF for WhatsApp / Twitter
- [ ] User accounts + favourites
- [ ] Push notifications for favourited teams
- [ ] Real domain (off `bawler-gold.vercel.app`)

### Nice-to-have
- [ ] Vitest + RTL tests on `BallGIF`, `DeliveryCard`, `MatchView`
- [ ] Remove legacy unused components (`ViewSwitcher`, `MomentsCollapsible`, `PressureGauge`, `ProjectedScore`, `DemoControls`, `InsightsPanel`, `AIMetrics.tsx` + `lib/metrics.ts` [orphaned since v1.0.23's AI-metrics-row removal, confirmed unreferenced anywhere in the codebase], `MiniWinProb.tsx` [orphaned since v1.0.46 moved win-prob into the mini-insights bar chip])
- [ ] Service worker for offline-cached last-seen match state
- [ ] WCAG colour-contrast audit on `text-dim` values
- [ ] Lighthouse-mobile to 95+ (currently ~88)
- [x] MiniWinProb redesign — completed v1.0.8 (both teams visible, gradient fills)

---

## Recent change log (high-level)

| Version | Highlight |
|---|---|
| **v1.0.34** | Partnership velocity spark in Scorecard — sparkline (RPO/3-ball window) per partnership, between batting + bowling cards |
| **v1.0.33** | iOS Safari back-swipe fix + SeriesScheduleSheet real-data decoupling (seriesPool prop, resolveCompetition) |
| **v1.0.32** | Series schedule bottom sheet — clickable series chip, past/live/upcoming timeline, back-swipe + swipe-down close |
| **v1.0.31** | API robustness: `normaliseName()` in transformers.ts — consistent player names across ESPN/Sportradar |
| **v1.0.30** | Win prob fix: power-curve achievable RPO, remove double wicket penalty — IND 21 off 22 now shows 83% not 31% |
| **v1.0.29** | Partnership tracker replaces win-prob bar below BallGIF — single row, live per-batter runs/balls/4s/6s |
| **v1.0.28** | Matchup card fully live: career+match stats merged; label-value row; matches count; live 4s/6s |
| **v1.0.7** | Nav cleanup: removed back btn from Schedule/Table; GT dot → cobalt #4285F4; sticky scorecard innings header |
| v1.0.6 | Bug: fixed whitish SVG wash in Safari (perspective CSS); commentary: doubles → slate, threes → pink |
| v1.0.5 | Commentary colours (six turquoise, single = dot); bottom nav on match page; book page-turn animation |
| v1.0.4 | UX: swipe tabs, skeleton, pull-to-refresh, tap feedback, back button, empty state, score badge |
| v1.0.3 | Bottom nav fixed — BottomNav moved outside phone-frame, never clipped |
| v1.0.2 | Scorecard highlights (teal top scorer, red wicket-taker, blue SR, gold MOM, purple MOS); win-prob reverted |
| **v1.0.27** | Fix franchiseStats corruption (SOH chars); rename iplStats→franchiseStats in transformers.ts |
| **v1.0.26** | Platform-wide franchise rename: franchiseStats/franchiseLeague, app meta, transformers |
| **v1.0.25** | Multi-competition Table page — 8 competitions, horizontal tab, NRR/PCT/Drawn column variants |
| **v1.0.24** | Bilateral series status chip on LiveCarousel; seriesStatus field on Match |
| **v1.0.23** | Removed format/tour/team filter chips from homepage header |
| **v1.0.22** | International match cards: national flag backgrounds (flagcdn.com) |
| **v1.0.21** | Real-data audit fixes: SpeedChip, format-aware metrics, ALL_TEAMS, truncatedMatch fallback, LineupsCard, insights prop |
| **v1.0.20** | Player profiles: /player/[id] SSG route, 21 profiles, Scorecard/CommentaryFeed links |
| **v1.0.19** | Auto-championship resolution in transformers — series-ID maps, zero per-match tagging |
| **v1.0.18** | WTC standings: championship field, PCT column, TABLE button for live Test matches |
| **v1.0.17** | Real-data readiness: CompetitionStandings layer, hasStandings flag, transformers.ts, dynamic columns |
| **v1.0.16** | Bug fixes: win prob override inversion, scorecard empty, MiniStandings in Live tab |
| **v1.0.15** | TABLE button context-aware (tracks snapped carousel card); team schedule popup |
| **v1.0.14** | BottomSheet standings + scroll fix: height 85vh, body scroll lock, touch-action pan-y |
| **v1.0.13** | TABLE button + standings sheet on home carousel; MiniStandings onTeamClick prop |
| **v1.0.12** | Test match dual-innings score display; liveStatusOf + liveWinProb battingTeam fix |
| **v1.0.11** | Multi-competition: national teams, diverse formats, competition badge UI |
| **v1.0.10** | Performance: SVG filter removal, React.memo x7, useCallback |
| v1.0.9 | BallGIF: perspective-correct impact Y + post-pitch bounce arc |
| v1.0.8 | MiniWinProb redesign: both teams visible, gradient fills |
| v1.0.7 | Nav cleanup: removed back btn from Schedule/Table; GT dot fix; sticky scorecard headers |
| v1.0.4 | UX: swipe tabs, skeleton, pull-to-refresh, tap feedback, back button, score badge |
| v1.0.1 | Build hotfix: 6 truncated files, 8 missing React imports, null bytes, TS null error |
| v1.0.0 | UX overhaul: bottom nav, AI tile labels, Moments redesign, BallGIF hierarchy, countdown cards |
| v0.9.8 | brightColor() hue-accurate team colours in win-prob |
| v0.9.0 | Initial prototype with full mocked data |

### Match page — Digest tab

- ✅ **Digest tab** — 4th tab in MatchView (visible when ball data exists for any innings); shows a story-of-the-match through cards newest-first
- ✅ **Format-adaptive grouping** — T20/T20I/Hundred: 1 card per over; ODI: 1 card per 5 overs; Test with sessions: 1 card per session; Test without sessions: 1 card per 10 overs (auto-derived from timestamps)
- ✅ **Over-group cards (T20/ODI)** — 3-row compact layout: header (over label + runs/wickets/4s/6s) + narrative (factual 1-liner) + over-summary (punchy 2-line creative text); ball-dot row for T20/T20I showing W/4/6/runs/dot coloured circles
- ✅ **Session cards (Test)** — one card per session (ICC naming: 1st/2nd/3rd Session); shows session label, innings label, over range, runs/wickets, "Live" badge for the in-progress session. Only shown while that day is still in progress — a completed day's individual session cards are replaced by its consolidated Day Summary card instead (v1.0.81, no more day/session duplication)
- ✅ **Day Summary card (Test)** — rich 5–7 line day report after each completed day; session-by-session breakdown table; top bat + top bowl highlights; consolidates however many sessions the day actually had (2 on a weather-shortened day, 3 normally) into one card instead of leaving the individual session cards visible alongside it (v1.0.81)
- ✅ **Digest narrative variety (v1.0.81, fixed for real v1.0.82)** — day-report session lines are now bucketed by what actually happened (weather-shortened / bowling-collapse / strong-bowling / dominant-batting / steady-batting / stalemate / swing / competitive) before picking a phrase, with an expanded 3-variant bank per bucket, selected via a deterministic per-session slot seed (`pickPhrase`) rather than a rendered-string "already used" check — the earlier string-comparison approach could repeat the same template with different numbers baked in (shipped and caught live in v1.0.81, fixed v1.0.82); see DECISIONS-LOG.md DG4/DG7
- ✅ **Digest visual hierarchy (v1.0.81)** — `isNotableOverGroup`/`isNotableSession`/`isNotableDay` (`components/DigestTab.tsx`) each clear on one explicit, concrete condition (e.g. an 11-wicket day), the same boolean-gate philosophy as `lib/spotlight.ts`; notable cards get a subtle amber accent border (plus the existing pulsing glow if also live) instead of a loud badge, applied to over-group, session, and day-summary cards alike, for both the Test and T20/ODI card families
- ✅ **Digest render-performance caching (v1.0.81)** — benchmarked first (`scripts/digest-benchmark.ts`, synthetic 5-day/~2190-ball Test): raw recompute cost was never the bottleneck (avg ~1.7ms/tick even near full-match); the real cost was React re-render from every card getting a new object reference on every live tick. Fixed with a `DigestCardCache` (`useRef<Map>`) that reuses the exact same object for any card whose underlying data can never change again (a completed session/day, or a provably-complete over chunk), plus `React.memo` on each card view — measured object-identity stability across ticks went from 0% to ~95%. Depends on an explicit append-only assumption about the underlying feed — see DECISIONS-LOG.md "Real-data architecture" RD8
- ✅ **Day filter chips (Test)** — horizontal row of "Day 2", "Day 3" etc. chips above cards; default = latest day; match summary card always pinned regardless of selected day; only shown when ≥ 2 days have data
- ✅ **Innings chips (T20/ODI)** — "1st Innings" / "2nd Innings" chip row; default = latest innings with data; only shown when both innings have ball data
- ✅ **Post-match summary card** — rich pinned card at top of Digest tab for any match with `match.result`; winner + margin, top batter/bowler highlights, MOM with initials avatar, series status, 6-line auto-narrative; always visible regardless of day/innings filter
- ✅ **MOM avatar** — Man of Match in summary card shows player photo (via `PLAYERS[slug].photoUrl`) with initials-in-team-colour fallback (same design language as BallGIF PlayerAvatar)
- ✅ **Shareable cards** — every digest card has a share button; captures card as 2× PNG via `html-to-image`; `navigator.share` on mobile, `<a download>` fallback on desktop
- ✅ **`deriveTestSessions()`** in `transformers.ts` — auto-detects session boundaries from timestamp gaps so DigestTab works for Test matches even when the API omits session metadata. Now distinguishes a genuine session break from a rain/bad-light stoppage via a min/max gap window (`SESSION_BREAK_MIN_MS`–`SESSION_BREAK_MAX_MS`) plus optional explicit `KnownStoppage` metadata (v1.0.80) — a long weather delay merges into the current session instead of being misread as a session boundary; day-boundary detection is now unconditional on calendar date rather than gap-dependent
- ✅ **Player short-name resolution (`getPlayerShortName()`, v1.0.80)** — `DigestTab`'s `lastName()` now looks up each player's own registry `shortName` field instead of algorithmically splitting the full name string, which broke on multi-part surnames (Sri Lankan compound names, "de Silva"-style surnames); falls back to the full unmodified name (never a guessed split) for a player not yet in the local registry
- ✅ **Runtime-overridable narrative thresholds (`lib/narrativeThresholds.ts`, v1.0.80)** — day-report/over-summary/narrative thresholds read a `localStorage`-persisted override merged over hardcoded defaults, so recalibrating against real match statistics doesn't require a full redeploy

### Data layer — IND vs ENG Test + AUS vs IND T20I

- ✅ **`ind-eng-test-2026-d3-live`** — 3-innings Test match: IND 450/8 declared (inn 1, no balls); ENG 199/10 (inn 2, 348 balls, Day 2 1st + 2nd Session complete); ENG follow-on 88/4 (inn 3, 164 balls, Day 3 1st Session live)
- ✅ **`ind-aus-t20i-2026-m2-live`** — AUS 175/8 (inn 1, 120 balls complete); IND 142/3 chasing (inn 2, 98 balls live, Kohli 61*, need 34 off 22)
- ✅ **`ipl2026-m37-kkrvmi`** (FEATURED_MATCH) — MI 174/9 (inn 1, full scripted ball data); KKR 175/6 won by 4 wkts (inn 2, scripted through Russell's match-winning hit)

---

## Changelog additions (v1.0.35–v1.0.40)

| Version | Highlight |
|---|---|
| **v1.0.40** | Fix: match summary card condition (result-based, not status-based); IND vs ENG test match ID corrected |
| **v1.0.39** | AUS vs IND T20I ball data confirmed restored; platform hard-reverted to pre-pitch-report state (git reset --hard 5333611) |
| **v1.0.38** | Digest: shareable cards (html-to-image PNG + navigator.share); innings chips (T20/ODI); post-match summary card; MOM avatar with img+initials fallback |
| **v1.0.37** | Digest: day filter chips row (Test); expanded Day Summary card (5–7 lines) |
| **v1.0.36** | Digest: Test match session-based cards + Day Stumps summary; TestSession type + deriveTestSessions() transformer; IND vs ENG test 512-ball dataset |
| **v1.0.35** | Digest tab: initial build — over-by-over cards, compact 3-row layout, creative over-summary, normalizeBall() in transformers |

---

## Changelog additions (v1.0.48)

| Version | Highlight |
|---|---|
| **v1.0.48** | Scorecard: not-out duplicate-text fix; team/innings selector chips (two-team toggle for T20/ODI/Hundred, per-innings chips for Test); per-team innings-number fix (`teamInningsOccurrence`) applied to both Scorecard and Digest; sticky innings header now measures real header height instead of a hardcoded offset; new per-batter sparkline (runs-vs-balls, boundary dots capped at the row's own 4s/6s) with a pulsing glow on the batter currently at the crease (`ee03f69`…`105284a`, 16 commits) |

## Changelog additions (v1.0.41–v1.0.47)

| Version | Highlight |
|---|---|
| **v1.0.47** | Matchup card collapses to a one-line tap-to-expand teaser by default; commentary feed per-ball Share button removed entirely (`31b6d0d`, `be69b6d`) |
| **v1.0.46** | Win-Prob moved out of the standalone MiniWinProb card into a tap-to-expand chip in the mini-insights bar; all insight chips gained max-width + truncation; BallGIF Share button relocated off the visual into the info-bar chrome (`232ded5`, `bcc633e`) |
| **v1.0.45** | Fix: redundant "Fast"/"Slow" pace label removed from BallGIF/MiniBallGIF/commentary speed readout (colour alone signals pace now); fix: blank leftmost Moments-strip chip (flex `align-items: stretch` bug) (`72e729b`) |
| **v1.0.44** | Fix: `ALL_UPCOMING_MATCHES` + `ALL_PAST_MATCHES` correctly include domestic IPL arrays alongside international |
| **v1.0.43** | Fix: restore `PLAYERS`, `COMPETITION_STANDINGS`, `slugifyPlayer`, `hasStandings` after a truncation incident |
| **v1.0.42** | Data: pitch reports added for 10 international venues (SCG, MCG, Lord's, Oval, Headingley, Optus, Gaddafi, Nassau, Gabba, SSC) |
| **v1.0.41** | Digest: MOM avatar — BallGIF-style initials circle + `<img>` fallback, plug-and-play for real photos (`5333611`) |

## Changelog additions (v1.0.49–v1.0.55)

| Version | Highlight |
|---|---|
| **v1.0.55** | Fix: bottom nav's `backdrop-filter` forced to promote its GPU compositing layer immediately (`transform: translateZ(0)`) instead of lazily on first paint — addresses Filter button needing 2-3 Chrome clicks; caught + fixed a same-day regression where this broke nav centering (inline `transform` silently overrode Tailwind's `-translate-x-1/2`) (`079f06e`, `0ef4e4f`) |
| **v1.0.54** | Fix: homepage hydration mismatch — `LiveCarousel`/for-you/spotlight now gated behind the same client-mount flag as the Past/Future grid, since match data computed from `Date.now()` at module-load time can genuinely differ between static server prerender and client hydration (`9c270c1`) |
| **v1.0.53** | "For you" rewritten to a tiered union match-selection: pools by union across all followed categories, Tier 1 (nation/team/tournament/format) outranks Tier 2 (player-only) as a last resort, live beats upcoming excluding the hero card, swipeable carousel for 2+ simultaneous live qualifiers (`fb4c5d6`) |
| — | localStorage `SCHEMA_VERSION` guard shipped, then explicitly reverted per user request — see DECISIONS-LOG.md LS1 (`abb41d3`, `f1c407c`) |
| **v1.0.52** | Filter / personalization: bottom-nav trigger, two-column `FollowSheet` (Nation/Team/Tournament/Player/Format), ID-based matching, per-match player lineups (`lib/lineups.ts`), shared `BottomSheet` extraction, "for you" row wired to real follows, empty-state nudge (`f85feea`) |
| **v1.0.51** | Homepage sparkline de-tangled: per-over bucketing (one point per over, end-of-over value) + Catmull-Rom smoothing, replacing raw ball-by-ball density that produced 1-2 line crossings per match at sparkline scale (`3d4cc7e`) |
| **v1.0.50** | Homepage sparkline fix: uses full match win-prob trend instead of last ~20 balls (was reading as flat despite real 1%-79% swings); homepage-only gridline removed, full-screen `WinProbChart` modal untouched (`90e6083`) |
| **v1.0.49** | Homepage redesign: live win-prob sparkline replaces static bar on hero card; quiet flat cards for ordinary matches vs. full "spotlight" treatment for matches clearing concrete close-finish/milestone/stakes conditions (`lib/spotlight.ts`, not the old `excitement` score); "for you" row v1 (single followed team); spotlight/for-you dedupe via marker (`1b857eb`) |
| — | Scorecard: dropped redundant "Innings 1" label for single-innings formats; 4s/6s batting-table header labels coloured cyan/purple to match their column values — shipped just before the homepage redesign above, no dedicated version bump (`7be7a25`, `d9d0962`) |

## Changelog additions (v1.0.56–v1.0.60)

| Version | Highlight |
|---|---|
| **v1.0.60** | Fix: `PastMatchCard`'s winner-color lookup hardened to require an explicit `teamA.code`/`teamB.code` match (was a ternary that silently defaulted to `teamB`'s color on any non-match) — closes a latent wrong-team-border failure mode; audited the whole live grid, no currently-visible mismatch found (`406ab2a`) |
| **v1.0.59** | Fix: "dangling slash" on all-out scores ("AUS 187/") — added `formatScore()` (`lib/formatUtils.ts`) for the standard all-out convention (no wicket count when `undefined`/`null`/`>= 10`); backfilled 5 mock `match.result` objects missing `teamAWickets`/`teamBWickets` outright (`867230c`) |
| **v1.0.58** | "For you" card: followed team always renders left via new `followedMatchSide()` helper (`lib/followPrefs.ts`), with a matching 3px colored left border; scoped to this card only (`f811e75`, `9314425`) |
| **v1.0.57** | Fix: Team category in `FollowSheet` was listing every national team a second time ("National team") by pulling from the merged `ALL_TEAMS` registry instead of franchise/league teams only; audited other 3 categories, no other overlap found (`036f449`) |
| **v1.0.56** | Filter nav button restyled from a raised circular "camera button" to a plain flat icon+label tab matching Home/Schedule, with Violet 600 only while the sheet is open (`ca39254`) |

## Changelog additions (v1.0.61–v1.0.65)

| Version | Highlight |
|---|---|
| **v1.0.65** | Fix: stray full-width gray scrollbar bar on the hero/"for you"/Spotlight swipe carousels — was the native scrollbar thumb on a scroll container intentionally wider than any one card; replaced with a shared `CarouselDots` indicator (`lib/useCarouselIndex.ts`, `components/CarouselDots.tsx`) contained to each card's own width, rendering nothing below 2 items (`0ff593b`) |
| **v1.0.64** | Filter sheet's confirm button relabeled "Follow" → "Update" — reads correctly for additions, removals, or both; commit/discard mechanic (nothing saves until tapped, × discards) unchanged (`3e90436`) |
| **v1.0.63** | Fix: phantom-selection bug in Filter sheet — `sanitizeFollowPrefs()` added to `getFollowPrefs()`, filtering stored prefs against the exact valid-ID sets the sheet renders from, self-healing localStorage on read; fixes a real regression from v1.0.57's Team-category scoping fix (`89350ab`) |
| **v1.0.62** | New explicit, deterministic 3-tier homepage hero-match selection rule (`lib/heroSelection.ts`) — prominence tier, then live-stakes tiebreak, then live-runway tiebreak — replacing an ad hoc popularity sort; global/non-personalized, "for you" continues to exclude whatever it selects (`eb6bd8b`) |
| **v1.0.61** | "For you" card restructured to share Spotlight's visual language — `0.75rem` corner radius, `px-2 py-1.5` + `flex-col gap-0.5` padding rhythm; height, background, and content untouched on both cards (`61a0ec6`) |

## Changelog additions (v1.0.66–v1.0.70)

| Version | Highlight |
|---|---|
| **v1.0.66** | Merged Spotlight past-match card's standalone venue line into its story line to close the height gap with "for you"; live measurement afterward showed the merge alone left dead space, so `SPOTLIGHT_CARD_HEIGHT` was also reduced 148 → 116 (`d9f2f9c`, `6fa24bc`) |
| **v1.0.67** | Design-system cleanup: page background now reads the `bg.deep` token instead of a hardcoded `#000000`; `wicket`/`six` split into 5 new dedicated tokens (`live`, `negative`, `special`, `spin`, `slowPace`) for meanings that had been borrowing them; six-ball color mismatch (`OUTCOME.six` turquoise vs. Tailwind `six` purple) resolved to purple (`3afcb51`) |
| **v1.0.68** | Tournament-table shortcut pill (`WTC TABLE`/`IPL TABLE`/etc.) given a fixed `176px` width instead of content-hugging, so it no longer visibly resizes per tournament (`abc84a8`) |
| **v1.0.69** | Fix attempt: `min-w-0` + `truncate` on the series-status chip to stop a two-row wrap regression introduced by v1.0.68's wider table pill — did not actually hold, see v1.0.70; also fixed a real bug: bowling tiebreak now compares `economy` instead of raw `runsConceded` (`2868ce3`) |
| **v1.0.70** | Actual row-wrap fix: switched the shared row container from `flex-wrap` to `flex-nowrap` — `flex-wrap` breaks lines off each item's un-shrunk size, so v1.0.69's shrink/truncate additions never got a chance to apply (`ef112ee`) |

## Changelog additions (v1.0.71–v1.0.79)

| Version | Highlight |
|---|---|
| **v1.0.71** | Series-status chip shrunk its own chrome (smaller type, tighter padding/gap, dropped chevron) to fit next to the fixed table pill (`4420415`) |
| **v1.0.72** | Reverted v1.0.71's font-shrink per feedback — chip type size must stay fixed; `flex-wrap` made the intended overflow valve instead (`a81c105`) |
| **v1.0.73** | Fix: win-prob modal "NOW" label was floating ~20px off its own guideline — dot/line/guideline were already pixel-exact; moved the label above the plot area, centered on the same x-coordinate (`4864150`) |
| **v1.0.74** | Full revert of the v1.0.68–v1.0.72 table-pill/series-chip thread back to original content-hugging behavior, after the fixed-width pill cascaded into 4 follow-on regressions (`5d08edc`) |
| **v1.0.75** | Fix: Spotlight/"for you" swipe-carousel dots stuck permanently at index 0 — `useCarouselIndex`'s mount-detection effect never got a second chance to attach after the real carousel replaced the boot skeleton; fixed with an `rAF` poll for `ref.current` (`8076663`) |
| **v1.0.76** | Fix: v1.0.75's `rAF` retry is fully suspended on a backgrounded tab — switched to `setTimeout(50ms)` (`125e362`) |
| **v1.0.77** | Fix: hero/Spotlight competition badge dropped redundant "IND V AUS"-style team-matchup text for bilateral series with no named identity, showing the match format instead (`a0eeabc`) |
| **v1.0.78** | Fix: uneven match-page tab widths — added `min-w-0` so `flex-1`'s equal-width intent actually takes effect (`ae470a3`) |
| **v1.0.79** | Follow-up: "Scorecard" didn't fit at the now-equal tab width even with `truncate` — shortened the visible label to "Score" (tab `key` unchanged) (`1252161`) |

## Changelog additions (v1.0.80–v1.0.84)

| Version | Highlight |
|---|---|
| **v1.0.80** | Real-data readiness: `lib/dataValidation.ts` validation/adapter layer, `getPlayerShortName()` replaces name-split heuristic, `deriveTestSessions()` rain-delay vs. session-break window, runtime-overridable narrative thresholds, `target!` null-safety in `winProb.ts` — verified with constructed edge-case data (`dd6745f`) |
| **v1.0.81** | Digest tab overhaul: benchmarked-then-fixed render performance (cache + `React.memo`, ~0%→~95% object-identity stability), day/session card structural dedup, expanded/conditional narrative phrasing, notable-vs-routine visual hierarchy — applied to both Test and T20/ODI card families (`ce7fe5f`) |
| **v1.0.82** | Fix: real repeat-phrase bug found live in v1.0.81 — rendered-string "already used" tracking missed same-template-different-numbers repeats; replaced with deterministic slot-seeded phrase selection (`cbb0b91`) |
| **v1.0.83** | Fix from root: match-page footer hardcoded at "Bawler v1.0.65" across 17 releases — `lib/version.ts` now derives from `package.json`, `scripts/version-check.ts` wired as a `prebuild` hook so a reintroduced hardcoded literal fails `npm run build` outright (`c84cf02`) |
| **v1.0.84** | Docs: documented the Digest cache's append-only assumption (DECISIONS-LOG.md RD8) — no code behavior change (`bbc2e54`) |

## Changelog additions (v1.0.85)

| Version | Highlight |
|---|---|
| **v1.0.85** | Docs: full sync of BUILD-STATUS.md, DECISIONS-LOG.md, changes and upgradations.md, README.md, and DESIGN-SYSTEM.md covering everything shipped v1.0.71–v1.0.84 (chip/pill saga + revert, dot-indicator fix, hero badge, tab widths, real-data readiness fixes, Digest overhaul, version-bug fix) — no code changes |

## Changelog additions (v1.0.86)

| Version | Highlight |
|---|---|
| **v1.0.86** | Filter sheet: category rail reordered (Nation/Tournament/Team/Player/Format), meaningless dots removed from Tournament/Player/Format; ~50 franchise team colors audited against real branding (20 corrected); The Hundred's real 2026 ownership rebrand reflected (3 teams renamed + recolored, 1 recolored) |

## Changelog additions (v1.0.87)

| Version | Highlight |
|---|---|
| **v1.0.87** | Filter sheet: category rail labels pluralized (Nations/Tournaments/Teams/Players/Formats) — each is a list of multiple items, label text only, no functional change |

## Changelog additions (v1.0.88)

| Version | Highlight |
|---|---|
| **v1.0.88** | Filter sheet: new "Series" category split out of Tournaments for bilateral/tour-style competitions (The Ashes, India tour of England/Australia 2026, South Africa tour of England 2026); Tournaments now contains only genuine multi-team competitions; `FollowPrefs.series` added end-to-end (sanitize, qualifyMatch, Tier 1, totals) |

## Changelog additions (v1.0.89)

| Version | Highlight |
|---|---|
| **v1.0.89** | "For you" upcoming card: distance presentation now splits at 7 days — countdown format within the window (unchanged), plain date beyond it (`fmtForYouDistance()`, `app/page.tsx`); selection logic (soonest-qualifying-match, no cutoff) deliberately untouched |

## Changelog additions (v1.0.90)

| Version | Highlight |
|---|---|
| **v1.0.90** | Homepage gained the same `Bawler v{version} · all data mocked` footer the match page already had — it was never a regression, the homepage simply never had one; both pages now derive from `lib/version.ts` |

## Changelog additions (v1.0.91)

| Version | Highlight |
|---|---|
| **v1.0.91** | "For you" card fixes: nation follows no longer suppressed for bilateral matches (only the hero match is excluded, matching team/tournament/series/format); live qualifiers now stamp an inline `★ For you` marker on their existing live-carousel card instead of duplicating it as a standalone card; explicit tier-priority order added for the upcoming fallback (team > series > tournament > nation > format, then soonest) — see DECISIONS-LOG.md FY11-FY14 |

## Changelog additions (v1.0.92)

| Version | Highlight |
|---|---|
| **v1.0.92** | Docs only: fixed a v1.0.91 numbering bug — its 4 new DECISIONS-LOG entries were accidentally labeled FY7-FY10, colliding with pre-existing v1.0.58 entries of the same IDs; renumbered to FY11-FY14 and fixed every cross-reference. Also corrected 2 DESIGN-SYSTEM.md statements left stale by v1.0.91 (the "for you" card-tier description, the swipe-carousel dot-indicator bullet) |

## Changelog additions (v1.0.93)

| Version | Highlight |
|---|---|
| **v1.0.93** | Fix: the "for you" upcoming card's match was still also rendering a second time in the "Coming Up" grid below it — now excluded from that grid via the same `m.id !== heroId`-style pattern "for you" itself already uses against the hero card, just mirrored. Selection logic untouched; only the single match actually shown in "for you" is pulled, every other qualifying-but-not-selected upcoming match stays visible in Coming Up (DECISIONS-LOG.md FY15-FY17) |

## Changelog additions (v1.0.94)

| Version | Highlight |
|---|---|
| **v1.0.94** | Fix: "Coming Up"'s header count (`· N`) didn't match its own rendered card list — it read the raw unfiltered total while the grid applied Spotlight + "for you" dedup exclusions. Both now read one shared `futureVisible` array (DECISIONS-LOG.md FY18-FY19) |

## Changelog additions (v1.0.95)

| Version | Highlight |
|---|---|
| **v1.0.95** | Confirmed (exhaustive grep) `bawler:followedTeam` is fully dead — zero code reads/writes it, `lib/followedTeam.ts` was deleted at v1.0.52, `bawler:followPrefs` is the only source of truth for follow state and cannot desync from a key nothing reads. Fixed one related stale comment (`ForYouRow`'s docstring still described the deleted single-team mechanism) (DECISIONS-LOG.md FY20-FY21) |

## Changelog additions (v1.0.96)

| Version | Highlight |
|---|---|
| **v1.0.96** | Fix: Digest no longer assumes nested fields (`session.isComplete`, `match.result`) update in lockstep with `match.status`. Day/session completion is now derived from `match.status` — once a match is no longer live, every session belonging to it is treated as complete regardless of its own flag, so the final day/session correctly collapses into its "STUMPS" card even if that flag never independently flipped. The match-summary card is now authoritative on `match.status === "post-match"` too — if `result` is missing once the match has ended, it either derives a minimal result from the final scores (unambiguous non-Test 2-innings case only) or shows an explicit "Final result pending" card, instead of silently rendering nothing (DECISIONS-LOG.md FY22-FY23) |

## Changelog additions (v1.0.97)

| Version | Highlight |
|---|---|
| **v1.0.97** | Finished matches (Spotlight, Past, and any live match that ends) now open on a Digest tab in place of Live -- same total tab count, just Digest instead of Live in slot 1. The team-names-with-final-score header moved from the old Live-tab fallback into the Score tab, above the scorecard body. Digest itself is now retrospective for finished matches: a compact lead-in (reusing the existing result/derived-result/pending card), a single match-wide turning point, a whole-match best-batting/bowling performance card, then the existing day/session cards with one hindsight sentence layered on top of each -- all additive, without touching the existing anti-repeat narrative system. Matches with no recorded innings data get an honest "Simple recap" card (final score + summary) instead of an empty or broken-looking Digest (DECISIONS-LOG.md FY24-FY27) |

## Changelog additions (v1.0.98)

| Version | Highlight |
|---|---|
| **v1.0.98** | Fix: ScoreBar's "need N off M balls · RRR X.XX" chase line was gated only on data being present, not on the match actually being live — a finished non-Test match with a started 2nd innings (the "5 of 12" aggregate-only Past matches) showed a phantom live chase target after the match had already ended. Now gated on `match.status === "live"` too; a finished match shows nothing in that row instead, since the real result already renders elsewhere on its page (DECISIONS-LOG.md FY28) |

## Changelog additions (v1.0.99)

| Version | Highlight |
|---|---|
| **v1.0.99** | Fix: two confirmed React hydration mismatches (#418/#423) -- `MatchView.tsx`'s tab restoration and `DigestTab.tsx`'s narrative-threshold override both read browser storage (`sessionStorage`/`localStorage`) synchronously during render/`useMemo`, which can differ from the server-rendered default on the client's own first pass. Both now render with a neutral default on server and client alike, then apply the real stored value via a `useEffect` after mount -- matching the pattern already used safely elsewhere (`app/page.tsx`'s `followPrefs`). Also fixed a follow-up bug the deferred update exposed: Digest's per-card cache was freezing already-complete cards with default-threshold text before the real override could apply -- the mount effect now clears that cache too, so the override actually reaches already-complete cards, not just future ones (DECISIONS-LOG.md FY29) |
