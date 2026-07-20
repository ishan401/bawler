# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

## [1.0.70] 2026-07-20

### Actually fix the table-pill/series-chip row-wrap regression: flex-wrap → flex-nowrap

#### Fixed — row container switched from `flex-wrap` to `flex-nowrap` (`components/LiveCarousel.tsx`)
- v1.0.69's `min-w-0` + `truncate` on the series-status chip didn't stop the two-row wrap when verified live
- Root cause: the shared row container was still `flex-wrap`, and `flex-wrap` decides line-breaks off each item's un-shrunk, max-content size — a shrinkable item still gets pushed onto a new line before `flex-shrink` ever gets applied to it
- Switched the container to `flex-nowrap` — shrinking now actually takes effect, so the series chip truncates to fill remaining space instead of dropping to row 2
- v1.0.69's `min-w-0`/`truncate`/`shrink-0` additions on the chip itself are unaffected and stay in place — they're a correct part of the shrink-to-fit pattern, just not sufficient on their own against a `flex-wrap` container

#### Verified
- Live: series-status chip now truncates in place alongside the table pill, both on one row, at the container width that previously reproduced the two-row regression

---

## [1.0.69] 2026-07-20

### Row-wrap fix attempt (superseded by v1.0.70) + bowling tiebreak bug

#### Fixed — series-status chip given shrink/truncate treatment (`components/LiveCarousel.tsx`) — did NOT actually stop the wrap
- v1.0.68's fixed-width `TABLE_PILL_WIDTH` (176px, up from content-hugging ~117px for "WTC Table") pushed the sibling series-status chip past the flex container's ~406px available width, tripping a wrap onto a second row — a regression from that commit
- Added `min-w-0` + `truncate` on the chip's label span, `shrink-0` on both its icons
- **Verified live afterward that this did NOT actually stop the wrapping** — see v1.0.70, which found and fixed the real cause (the container was still `flex-wrap`)

#### Fixed — bowling tiebreak now compares `economy`, not raw `runsConceded` (`components/Scorecard.tsx`)
- `topWicketTaker`'s reduce, among bowlers tied on wickets, previously picked whoever had the lower raw `runsConceded` — unfairly favoring fewer overs bowled regardless of rate
- e.g. Kuldeep (4 overs, 4.25 econ) was beating Bumrah (lower econ, more overs) despite Bumrah's figures being clearly better
- Changed the tiebreak comparison to `economy`; the outright highest-wickets-wins branch is untouched

#### Verified
- Bowling tiebreak: live in the ENG vs IND Test, England's 2nd innings bowling table — 4 bowlers tied at 1 wicket each, Bumrah (2.25 econ) now correctly highlighted over Kuldeep (4.25 econ)
- Row-wrap fix: verified live and found NOT to hold — `flex-wrap` still forced a two-row layout; fixed for real in v1.0.70

---

## [1.0.68] 2026-07-20

### Tournament-table shortcut pill fixed to a consistent width

#### Fixed — `TABLE_PILL_WIDTH = 176` replaces content-hugging width (`components/LiveCarousel.tsx`)
- Reported: the "WTC TABLE"/"IPL TABLE"/"PSL TABLE" etc. pill below the hero card resized per tournament since its width was content-hugging (icon + label + padding) — only one of these ever shows at a time, in the same slot, so the varying width read as jitter
- Measured every current real label's natural width with the exact icon/padding/font (IPL, T20 WC, Champ. Tr., BBL, PSL, Hundred, SA20, CPL, MLC, WTC — every `Competition` with `hasStandings: true`); longest is "Champ. Tr. Table" at ~163px
- Added `TABLE_PILL_WIDTH = 176` (comfortable buffer over that); button switched to `justify-center` + fixed inline width instead of hugging content; label centered inside via a `whitespace-nowrap` span
- Deliberately no truncate/ellipsis safety net: a future over-length label overflows visibly rather than silently truncating or quietly widening

#### Updated — DESIGN-SYSTEM.md §7
- Documented the fixed-width pattern, the label-width audit, and an explicit "don't add truncate, don't revert to content-hugging" note

#### Verified
- Width audited against every current competition's `shortName` + icon/padding/font combination with `hasStandings: true` — longest ("Champ. Tr. Table", ~163px) fits comfortably inside 176px with buffer to spare
- Note: this change is what pushed the sibling series-status chip into a two-row wrap regression, discovered and addressed in v1.0.69/v1.0.70 below

---

## [1.0.67] 2026-07-20

### Design-system cleanup: 3 flagged inconsistencies resolved

#### Fixed — page background now reads the `bg.deep` token instead of a hardcoded hex (`app/globals.css`)
- `html`/`body` background was hardcoded to `#000000`, bypassing `bg.deep` (`#03060F`) entirely
- Confirmed with the user first since the two values don't match exactly (RGB 0,0,0 vs 3,6,15) — accepted the near-imperceptible shift
- Both now read `#03060F` via the same value `bg.deep` already defines

#### Added — 5 new dedicated color tokens carved out of `wicket`/`six` (`tailwind.config.ts`, `lib/tokens.ts` new file)
- Audited every `text-wicket`/`bg-wicket`/`text-six`/`bg-six` (and raw hex) usage across the codebase to separate genuine per-ball outcome color from unrelated meanings borrowing one of the two
- `live` (`#EF4444`) — the live-match indicator; consolidated 3 separate, inconsistent "LIVE" badge implementations inside `LiveCarousel.tsx`/the team-schedule page, one of which was raw Tailwind `red-400`/`red-500`, not even a token
- `negative` (`#EF4444`) — behind/lost/declining trend, pairs with the existing `boundary` token
- `special` (`#A855F7`) — Man of the Series, a batter's "Never dismissed" achievement, a bowler's five-for milestone chip
- `spin` (`#A855F7`) — ball spin-direction/delivery-type indicator
- `slowPace` (`#A855F7`) — slowest tier of the ball-speed color gradient
- One more find: `LiveCarousel`'s series-schedule "WON" badge was using `six`/purple as a decorative success marker — reassigned to the existing `boundary` token instead of a new one
- All five keep their pre-existing hex value — naming/architecture fix only, not a recolor
- Updated: `app/page.tsx`, `app/schedule/[competitionId]/[teamCode]/page.tsx`, `app/table/page.tsx`, `components/AIMetrics.tsx`, `components/BallGIF.tsx`, `components/DeliveryCard.tsx`, `components/LiveCarousel.tsx`, `components/MatchCard.tsx`, `components/MatchupCard.tsx`, `components/MiniBallGIF.tsx`, `components/MiniStandings.tsx`, `components/MomentStoryCard.tsx`, `components/MomentsStrip.tsx`, `components/PitchReportCard.tsx`, `components/PressureGauge.tsx`, `components/ProjectedScore.tsx`, `components/ScoreBar.tsx`, `components/Scorecard.tsx`, `components/StandingsTab.tsx`, `components/WinProbChart.tsx`

#### Fixed — six-ball color mismatch resolved to purple (`lib/outcomeColors.ts`)
- `OUTCOME.six` was turquoise (`#2DD4BF`); the Tailwind `six` token used directly everywhere else was purple (`#A855F7`)
- Audited actual usage before picking one: purple renders in 11+ files; turquoise reached the screen in exactly one place — `DeliveryCard`'s `FullCard` outcome badge, sitting directly next to an already-purple `MiniBallGIF` thumbnail on the same card, a real visible clash
- Standardized on purple: `OUTCOME.six.primary`/`.tint` → `#A855F7`, `badgeFg` → `#FFFFFF` to match `BallGIF`'s established fg convention for a purple badge
- `three` (`#EC4899` pink, no Tailwind equivalent) left untouched — nothing conflicts with it

#### Updated — DESIGN-SYSTEM.md
- All three previously-flagged "known inconsistency" callouts replaced with "Resolved (v1.0.67)" language and the full reasoning above

#### Verified
- `tsc` + build clean
- Re-ran the collision-check script from DESIGN-SYSTEM.md (untouched by this pass) — still passes: 72 teams, CSK-AUS 9.3 / SRH-AUS 19.4 / CSK-SRH 23.6, matching exactly

---

## [1.0.66] 2026-07-20

### Spotlight past-match card: merged venue line into story line, then re-tuned card height

#### Fixed — standalone venue line folded into the story/summary line (`components/MatchCard.tsx`)
- Reported: the past-match Spotlight card rendered two separate context lines below the result banner — a standalone venue line and a separate story/summary line — while the "for you" card directly above it renders only one, making the height mismatch look wrong stacked together
- Dropped the standalone venue-name line; folds just the venue's city into the story line as one sentence (`...vs Surya's 78, Ahmedabad.`), stripping the summary's own trailing period first to avoid a double `..`
- Falls back to just the city (still one line, never empty) when there's no summary text — that case already rendered venue-only before this change
- Scoped to `PastMatchCard`'s branch of `SpotlightMatchCard` only — the upcoming-match branch already showed a single summary line plus a separate countdown/footer row, a different UI element

#### Fixed — `SPOTLIGHT_CARD_HEIGHT` reduced 148 → 116 after the merge alone didn't close the height gap (`components/MatchCard.tsx`)
- Live measurement after the line-merge above showed the visible card height was still 148px, unchanged — `SPOTLIGHT_CARD_HEIGHT` is a fixed height applied via inline style, not auto-height, so removing a line of text just left ~50-60px of dead space at the bottom
- Measured new content height directly in the browser for every live spotlight card (~89-103px including a 2-line-wrap case); worked out the equivalent for the upcoming-match branch by its Tailwind classes (~94-106px; 0 upcoming matches currently qualify as spotlight-worthy, so this branch couldn't be measured directly)
- Reduced the constant to 116 — comfortably fits both branches' content with a small buffer, landing much closer to "for you"'s ~72px than 148px did

#### Verified
- Content-height measurements taken live in-browser for every currently-live spotlight card before picking the new constant

---

## [1.0.65] 2026-07-15

### Fix: stray full-width gray scrollbar bar on swipe carousels

#### Fixed — native scrollbar thumb replaced with a contained dot indicator (`components/LiveCarousel.tsx`, `app/page.tsx`)
- Reported: a thin light-gray horizontal bar below hero/Spotlight cards, rendered at a fixed/full width instead of scoped to its card — overflowing past the card's rounded corners edge-to-edge on device
- Root cause: `LiveCarousel.tsx` never actually rendered a custom indicator element. The mark was `.scrollbar-thin::-webkit-scrollbar-thumb` (`background: #1E293B`) — the native webkit scrollbar on the carousel's horizontal scroll container, which is intentionally wider than any single card (a negative-margin trick so drag/swipe scrolling reaches edge-to-edge). The thumb tracked that wider container, not any one card
- Confirmed exactly 3 places share this `overflow-x-auto scrollbar-thin ... -mx-3 px-3` pattern: `LiveCarousel.tsx` (hero), and two inlined carousels in `app/page.tsx` ("for you", Spotlight) — no other screen (schedule, tournament, match detail) uses it

#### Added — `components/CarouselDots.tsx` (new file)
- Shared indicator: small 5-6px dots, one per item, muted gray inactive / accent-colored active
- Renders nothing at all when there are fewer than 2 items — no bar, no leftover single dot

#### Added — `lib/useCarouselIndex.ts` (new file)
- Extracted `LiveCarousel`'s own pre-existing inline scroll-position → active-index logic into a shared hook, since "for you" and Spotlight's carousels needed the same index for their own dots but never tracked one before

#### Updated — `.no-scrollbar` utility added (`app/globals.css`)
- Hides the native scrollbar entirely; applied only to the 3 carousel containers above. `.scrollbar-thin` itself is untouched, so unrelated scroll strips (Moments strip, mini-insights bar, table page tabs, FollowSheet's list, InsightFeed, WinProbChart) keep their existing behavior

#### Verified
- Live at mobile width: hero and Spotlight (both 2+ items) show small cyan dots — dot cluster measured at 61px wide, centered within a 406px card, nowhere near the rounded edges
- "For you" (1 item) renders no scroll container and no indicator element at all (confirmed via `document.querySelectorAll('.no-scrollbar').length === 2` on a page with 1-item "for you")

---

## [1.0.64] 2026-07-15

### Filter sheet confirm button relabeled "Follow" → "Update"

#### Updated — button label + handler rename (`components/FollowSheet.tsx`)
- Reported: the button always read "Follow" regardless of whether the pending draft change was an addition or a removal — confirming an unfollow by tapping a button labeled "Follow" is a semantic mismatch
- Renamed the button (and `handleFollow` → `handleUpdate`) to "Update" — reads correctly for additions, removals, or both; running count kept as-is (`Update (N)`)
- No change to the commit mechanic: nothing in the draft state takes effect until this button is tapped; closing via × (or backdrop/back-swipe) still discards unsaved changes

#### Verified
- Live: added a new nation (count → "UPDATE (2)"), removed an existing one (button still read "UPDATE (1)", no "Follow" mismatch), confirmed × discarded both pending changes (storage unchanged), then confirmed tapping Update actually committed a removal (storage updated to reflect it)

---

## [1.0.63] 2026-07-15

### Phantom-selection bug in Filter sheet

#### Fixed — `sanitizeFollowPrefs()` added, wired into every read (`lib/followPrefs.ts`)
- Reported: Filter sheet header/badge showed "1 selected" with no checkbox anywhere actually checked; "for you" still showed content as if a real follow existed
- Root cause: v1.0.57's Team-category scoping fix (CO1) correctly changed `FollowSheet.tsx`'s `buildOptions("teams")` to exclude national-team codes going forward, but did nothing for an ID already sitting in a user's stored `FollowPrefs.teams` from before that fix shipped (e.g. a national code like `"AUS"`) — that ID stayed counted by `totalFollowCount()` and honored by `qualifyMatch()`, with no checkbox able to ever show it as checked or clear it
- Confirmed both `app/page.tsx`'s `followPrefs` state (drives "for you") and `FollowSheet.tsx`'s `draft` state (drives checkboxes/badges) read from the same `getFollowPrefs()` function — fixed there, once, so both symptoms are guaranteed to agree
- `sanitizeFollowPrefs()` filters every category against the exact valid-ID sets each category's `buildOptions()` renders from (teams: `ALL_TEAMS` minus national; nations: `NATIONAL_TEAMS`; tournaments: `COMPETITIONS`; players: `PLAYERS`; formats: the fixed `MatchFormat` list); `getFollowPrefs()` self-heals localStorage immediately (re-writes the cleaned value) if sanitizing drops anything stale

#### Verified
- Seeded a stale `teams: ["AUS"]` entry directly in localStorage, reloaded — storage auto-repaired to empty, header/badges read 0, no phantom match shown
- Followed a real team (CSK) — count became 1, only CSK showed checked, "for you" correctly updated to a real CSK match with a matching border color

---

## [1.0.62] 2026-07-15

### Explicit homepage hero-match selection rule

#### Added — `lib/heroSelection.ts`'s `selectHeroMatch()` (new file)
- Replaces the previous ad hoc `byPopularity()` sort (hardcoded per-competition/per-team point constants, where e.g. IPL could outrank an international bilateral series purely because its constant was set higher) with an explicit, fully deterministic 3-tier rule
- Tier 1 — prominence (`matchProminenceTier()`): competition-type hierarchy (international tournament > bilateral series > domestic league) with a marquee-stage bump (final/semifinal/qualifier/decider, via `match.phase`, `highlightBadge`, or `seriesStatus`) that can push any tier up one notch
- Tier 2 — live stakes (`liveMilestoneScore()`): breaks ties within a tier using the same methodology as Spotlight's "milestone" pillar (`lib/spotlight.ts`), adapted to the match's current in-progress state rather than a final result
- Tier 3 — live runway (`estimatedLiveRunway()`): format capacity (`lib/formatUtils.ts`'s `totalBallsFor()`) × innings plausibly remaining, then most-recently-started as the last resort — never random
- Global, single, non-personalized selection — takes only the live-matches array, no `FollowPrefs`; "for you" (`lib/followPrefs.ts`) is structurally separate and continues to simply exclude whatever hero this rule selects
- `LiveCarousel`'s matches array is reordered so the new hero always leads the swipeable strip; the rest of the strip keeps its existing popularity order

#### Verified
- Constructed `npx tsx` scenarios: ordinary bilateral match correctly outranks ordinary league match (tier 1); two tied-tier bilateral matches resolve to whichever has an in-progress century (tier 2); a tied-tier, tied-stakes Test vs T20I resolves to the Test via runway (tier 3)
- Against the live mock dataset directly: current hero (AUS vs IND) correctly selected because it's flagged `"Series decider"` (`highlightBadge`), legitimately outranking the ordinary IND vs ENG Test and every ordinary IPL/PSL match live alongside it — an unstaged, real-data confirmation
- "For you" still correctly excludes whatever the hero rule selects

---

## [1.0.61] 2026-07-15

### "For you" card aligned with Spotlight's visual language

#### Updated — corner radius, padding rhythm, restructured JSX (`app/page.tsx`)
- Corner radius: "for you" used the generic `.card` class's `1rem` radius; Spotlight (and the Past/Coming Up grid) use `rounded-xl` (`0.75rem`). Overrode via inline `borderRadius: "0.75rem"` — guaranteed to win over the class regardless of Tailwind's compiled source order (same lesson as the nav-bar transform regression, HR4)
- Padding rhythm: replaced `px-3 py-2.5` edges + ad-hoc `mb-1.5`/`mt-1` margins with Spotlight's own exact layout — `px-2 py-1.5` edges, one uniform `flex-col gap-0.5` governing spacing between the label row, team row, and footer text
- Label typography: "FOR YOU" (`text-[10px] font-bold uppercase tracking-widest`) already matched Spotlight's own section label on size/weight/letter-spacing — confirmed via `getComputedStyle`, no change needed. Color intentionally stays different (violet vs `text-dim`), per spec
- Explicitly untouched: each card's height (Spotlight keeps its fixed height; "for you" stays auto-height, ends up modestly shorter with tighter padding — never pinned to a specific height), background treatment (Spotlight's gradient/glow vs "for you"'s flat quiet card), and all content. Live/Spotlight/grid cards elsewhere untouched — scoped entirely to `ForYouRow`

#### Verified
- Live: both cards compute to `border-radius: 12px`; padding/gap rhythm matches; labels already matched; Spotlight remains visibly taller/louder, "for you" stays compact

---

## [1.0.60] 2026-07-15

### Past/Coming Up grid border-color rule hardened

#### Fixed — `PastMatchCard` winner-color lookup no longer silently defaults to teamB (`components/MatchCard.tsx`)
- Reported: some completed-match cards' left border didn't match the actual winning team's color (e.g. an AUS vs IND card allegedly showing blue despite AUS winning)
- Audited every completed match then live in the deployed grid against real team colors (RCB/CSK, AUS/IND, LSG/PBKS, KKR/RR, AUS/NZ, DC/SRH, MI/CSK, AUS/ENG) — all already correctly showed the winning team's real `primaryColor`; every upcoming card was already consistently neutral (`#1E293B`), never favoring a side
- However, the winner resolution was a plain two-way ternary — `winnerCode === match.teamA.code ? match.teamA : match.teamB` — which silently defaults to `teamB` for ANY non-match against `teamA`, including an undefined/missing winner code or one matching neither team's code. No match in the current dataset happened to exercise that path, but it's exactly the failure mode described (a border not really tied to a confirmed winner)
- Replaced with an explicit dual equality check against both `teamA.code` and `teamB.code`, falling back to `undefined` (then the same neutral `#1E293B` `FutureMatchCard` uses) if neither matches — never an arbitrary team color
- Documented the two-case rule directly in both `PastMatchCard` and `FutureMatchCard`: completed = winning team's real color, matched explicitly by code; no result yet = neutral, never a pre-picked side
- Scope: `PastMatchCard`/`FutureMatchCard` only — Live hero, Spotlight, and For You (which already always uses the followed team's color) are a separate grid entirely and were not touched

---

## [1.0.59] 2026-07-15

### Dangling-slash bug on all-out scores

#### Fixed — `formatScore()` added as the single source of truth for team score display (`lib/formatUtils.ts`)
- Reported: several completed-match cards showed a bare trailing slash ("AUS 187/", "IND 164/") instead of a score, while other cards in the same grid correctly showed a wicket count ("182/7")
- Root cause #1 (display logic): `QuietSide`/`SideBlock` (`components/MatchCard.tsx`) blindly interpolated `` `${runs}/${wickets}` `` — an undefined wickets value produced a dangling slash with nothing after it
- Added `formatScore(runs, wickets)`: drops the wicket count entirely — standard cricket "all out" convention, "187" never "187/10" — whenever wickets is `undefined`, `null`, or `>= 10`; renders normally otherwise, including "runs/0" for an opening stand (0 is a real value, not an absent one)
- Both `QuietSide` and `SideBlock` now call `formatScore()` instead of interpolating directly
- Audited every other score-rendering site (Scorecard, MatchView, ScoreBar, LiveCarousel, MomentStoryCard, DigestTab) — all read wickets from `innings[]` directly, which was never missing data, so none needed a change. `OverSummary.tsx`'s own runs/wickets display is a per-over recap (not a team total) with its own correct zero-wickets handling for that different context — left untouched

#### Fixed — 5 mock `match.result` objects were missing `teamAWickets`/`teamBWickets` outright (`lib/mockData.ts`)
- Root cause #2 (data gap, independent of the display-logic bug above): `ind-aus-t20i-2026-m1`, `t20wc-2026-ind-pak`, `ct-2025-aus-nz-final`, `ashes-2526-3rd-test`, and `bbl-2526-scorchers-sixers` all had a `result` summary object that simply omitted the wickets fields, even though the correct values were already present a few lines up in each match's own `innings[]` entries
- Backfilled all 5 from their own innings data (187/6 + 164/9, 152/4 + 149/10, 312/7 + 269/10, 512/8 + 210/10, 177/6 + 169/10) — not invented values
- Confirmed via regex scan that no other `match.result` object in the file is missing either wickets field

#### Verified
- Live post-deploy: AUS 187/6, IND 164/9, AUS 312/7, and NZ 269 (genuinely all out — correctly shows no wicket count at all) all render cleanly; a non-all-out score elsewhere (CSK 183/6) unaffected

---

## [1.0.58] 2026-07-15

### "For you" card: followed team always left, with a matching colored border

#### Added — `followedMatchSide(match, prefs)` (`lib/followPrefs.ts`)
- Reported: the followed team's color dot was always correctly next to its own name, but the pair of them could land on the right side of the "for you" card if the match data's `teamA`/`teamB` order (home-team-first, alphabetical, whatever convention a given match uses) happened to put the followed team second
- Resolves which specific side (A or B) actually satisfies the user's prefs, checked in team > nation > player priority (mirrors `qualifyMatch`'s own Tier-1 specificity ordering)
- Returns `null` for matches that only qualified via a followed tournament/format — those don't pin to a specific side, so team order is deliberately left untouched rather than guessed

#### Changed — `ForYouRow` renders `leftTeam`/`rightTeam` instead of `teamA`/`teamB` directly (`app/page.tsx`)
- Takes `followPrefs` as a new prop, derives `leftTeam`/`rightTeam` from `followedMatchSide()`
- Scoped to this one card only — Live, Spotlight, and the Past/Coming Up grid all keep rendering `teamA`/`teamB` exactly as before

#### Added — 3px colored left border, always `leftTeam`'s color
- The card had color dots but no border accent, unlike `PastMatchCard`/`FutureMatchCard` elsewhere on the homepage, which already use a 3px colored left border as a standing convention
- Since `leftTeam` is now always the followed team, the border, the dot, and the name are one consistent unit on one consistent side

#### Verified
- Followed KKR (normally `teamB` in the live MI vs KKR match) — confirmed live it now renders first/left with its purple dot and a matching purple left border, MI second/right
- Confirmed a differently-followed team (CSK) shows CSK's own color as the border on a different live match, and closing/reopening the sheet doesn't affect it

---

## [1.0.57] 2026-07-15

### Filter sheet: Team category no longer duplicates Nation

#### Fixed — `buildOptions("teams")` scoped to franchise/league teams only (`components/FollowSheet.tsx`)
- Reported: national teams (e.g. Australia) appeared twice — once under Nation, again under Team labeled "National team" — accidental data overlap, not intentional flexibility, since Nation is already the dedicated place to follow a country
- Root cause: the Team category was built from `ALL_TEAMS`, a merge of `{...TEAMS, ...NATIONAL_TEAMS, ...LEAGUE_TEAMS}` — every national team leaked in a second time
- Filtered to `type !== "national"`, scoping Team to franchise/league teams exclusively (RCB, CSK, Adelaide Strikers, LA Knight Riders, etc.); Nation is untouched, still built from `NATIONAL_TEAMS` only
- Removed the now-dead national-team conditionals (`sublabel`/`flagIso` branches) since every remaining Team entry is a franchise

#### Verified
- Audited the other three categories (Tournament, Player, Format) for the same class of bug by diffing `fullName` sets across `NATIONAL_TEAMS`, `TEAMS`+`LEAGUE_TEAMS`, and `COMPETITIONS` — no overlapping entity names found; Player is keyed by individual id, Format is a fixed short list, neither has cross-category collision risk
- Live post-deploy: Team category shows only franchise entries, no "National team" label anywhere, no Australia/India/etc. leaking in

---

## [1.0.56] 2026-07-15

### Filter nav button restyled to match Home/Schedule

#### Changed — plain flat icon+label tab instead of a raised circular button (`components/BottomNav.tsx`)
- Filter was visually the most dominant of the three bottom-nav destinations despite being the least frequently used, and despite opening an overlay rather than switching to a persistent screen the way Home/Schedule do
- Replaced the 52px raised circular violet-filled "camera button" (Instagram-style) with the identical `flex-1` icon+label layout Home/Schedule use — same 20px stroke icon, same 9.5px uppercase label, no elevation/shadow/circular fill
- Color is now the only differentiator: neutral gray (`text-text-dim`, same as an inactive Home/Schedule icon) by default, Violet 600 (`#7C3AED`, the existing `follow` Tailwind token — same accent already used for selections inside the sheet) only while `FollowSheet` is open, reverting to neutral the instant it closes
- Signals "currently active" without implying a persistent destination tab

#### Verified
- Live post-deploy: default state matches Home/Schedule exactly (flat, neutral gray, same size); class correctly switches to the violet token while the sheet is open in the DOM
- Noted caveat: the Filter sheet is a near-full-height overlay that visually covers the entire nav bar while open, so the violet state — while correct in code — isn't currently visible on screen in this layout; flagged rather than silently expanded in scope

---

## [1.0.55] 2026-07-15

### Filter button click reliability — bottom nav backdrop-filter fix + centering regression

#### Fixed — GPU layer promotion for bottom nav `backdrop-filter` (`components/BottomNav.tsx`)
- User reported the Filter button (raised circular trigger) needed 2–3 Chrome clicks before the `FollowSheet` opened, while Home/Schedule links and match cards responded on the first click every time
- Root cause (known Chrome/Chromium behavior): elements using `backdrop-filter` are promoted to their own GPU compositing layer lazily, on first paint, rather than immediately at style-recalc time; a pointer event landing inside that region before the layer is actually composited can hit-test against the pre-promotion state and pass through rather than being captured
- Added `transform: translateZ(0)` + `willChange: "backdrop-filter, transform"` to the nav's inline style to force the compositing layer to exist immediately
- Cheap, inert on browsers/engines that don't need it

#### Fixed — same-day regression: nav knocked off-center by the fix above
- The nav's `className` already carried Tailwind's `-translate-x-1/2` (`transform: translateX(-50%)`) for horizontal centering
- Adding a second `transform: "translateZ(0)"` via inline `style` did not merge with the class — inline `style` fully overrides a class's `transform` property rather than combining with it, so the centering transform was silently discarded and the whole bar shifted right, off-center from the phone-frame content column above it
- Caught immediately from a user screenshot post-deploy
- Fixed by combining both into one inline `transform` value: `"translateX(-50%) translateZ(0)"`, dropping the now-redundant `-translate-x-1/2` class, with an inline comment flagging the trap (centering + GPU-layer transforms must be one composed string, never split between a class and inline style)

#### Investigation notes
- Root-cause certainty for the original click-reliability report (v1.0.56's hydration fix vs. this backdrop-filter fix) was never fully confirmed — browser automation used to reproduce the bug repeatedly gave inconsistent results, later traced to the automation tool's own coordinate/ref caching going stale after the browser viewport shifted mid-session, not the app itself
- Both fixes (v1.0.56, v1.0.57) are legitimate, independently-justified improvements (a real SSR/CSR data mismatch, and a real documented Chrome compositing quirk) shipped on that basis

---

## [1.0.54] 2026-07-15

### Homepage hydration mismatch fix

#### Fixed — `LiveCarousel`/for-you/spotlight gated behind client-mount flag (`app/page.tsx`)
- `lib/mockData.ts` computes every match's `startTimeIso` (and therefore live/upcoming/past bucketing) from `Date.now()` evaluated once at module-load time, not per-render
- Because `/` is statically prerendered at build time, the server-rendered HTML is frozen to whatever `Date.now()` was at that build, while the client re-evaluates the same module fresh at hydration time — often hours apart on a long-lived static deployment
- That mismatch meant the server-rendered tree and the client's first render could genuinely disagree on which matches were live, forcing React to reconcile a large mismatched subtree immediately after load; clicks landing during that reconciliation window (e.g. the new Filter button) could be dropped
- Fix: wrapped the `LiveCarousel`/for-you/spotlight block in the same `isBooting` flag that already gates the Past/Future grid below it — `isBooting` starts `true` identically on server and client and only flips `false` inside a client-only `useEffect`, so the server HTML and the client's first render are now pixel-identical (both show a skeleton), leaving hydration nothing to reconcile
- Added `HeroSkeleton()` (reuses the existing `.skeleton` pulse style) to cover the ~350ms boot window so nothing looks visually broken while it settles
- No data-shape or selection-logic changes — purely a rendering-order fix

---

## [1.0.53] 2026-07-15

### "For you" row: tiered union match-selection rewrite

#### Changed — `qualifyMatch()` returns a per-category breakdown (`lib/followPrefs.ts`)
- Replaces the single-boolean `matchIsFollowed()` as the driver of "for you" selection (kept as a convenience wrapper, no longer used directly by the homepage)
- Returns `{ nation, team, tournament, format, player }` so Tier 1 (nation/team/tournament/format) vs. Tier 2 (player-only) can be distinguished explicitly
- `isTier1Match(q)` / `isAnyMatch(q)` helpers added

#### Changed — `forYouSelection` algorithm (`app/page.tsx`)
- **Union pooling**: a match qualifies for "for you" if it matches ANY followed nation, team, tournament, format, or player — not the intersection of all of them
- **Two-tier priority**: Tier 1 (nation/team/tournament/format) always outranks Tier 2 (player-only); Player-only matches are used strictly as a last resort when Tier 1 is completely empty, never as a scoring weight. A match qualifying via both stays Tier 1 — the demotion only hits matches that qualify exclusively via a followed player
- **Live beats upcoming** within whichever tier is active, excluding the homepage's own hero live match (`byPopularity(ALL_LIVE_MATCHES)[0]`) — critically, excluding the hero match DOES re-trigger the live→upcoming fallback (if the followed team's only live match is the hero, "for you" falls through to their next upcoming match) rather than showing nothing
- **Multi-live carousel**: 2+ simultaneous live qualifiers (excluding hero) render as a small swipeable carousel, capped at `FOR_YOU_LIVE_MAX = 3`, reusing the exact spotlight carousel JSX pattern rather than inventing new UI
- **No live qualifier** → single soonest-upcoming match across the active tier's pool
- **Spotlight-dedup** is a pure display-time filter (`forYouSpotlightIds`) — matches already shown as spotlight cards get the `★ FOR YOU` marker there instead of a second copy in the "for you" row; unlike hero-dedup, this does NOT re-trigger the selection algorithm to backfill a replacement — if absorbing spotlight matches empties the row, it just stays empty
- Scope reminder: strictly live-or-upcoming; a "for you" history/past tab remains a separate, undecided feature

#### Verified
- Constructed test scenarios against live mock data via `npx tsx` scripts: union across two Tier-1 categories (team+team, tournament+team) picks the soonest upcoming match regardless of source category; player-only follow surfaces its soonest match only when Tier 1 is completely empty, and any Tier-1 follow suppresses the player pool entirely even if a player match would be sooner; two simultaneous live matches from different team follows render as a 2-item carousel; following the hero match's own team correctly falls back to that team's next upcoming match instead of showing nothing; following only a nation whose sole matches are bilateral correctly yields `null`
- Re-verified live on `bawler-gold.vercel.app` via browser automation for the carousel and hero-fallback cases

---

## [—] localStorage schema-version guard — shipped, then reverted (2026-07-15)

#### Added, then reverted — `SCHEMA_VERSION` wrapper on `getFollowPrefs`/`setFollowPrefs` (`lib/followPrefs.ts`)
- Proposed and approved as a cheap defensive improvement: wrap the stored JSON in `{ version, prefs }` so a future `FollowPrefs` shape change could detect and discard incompatible old data instead of crashing on it
- Built, deployed, and confirmed working exactly as designed — correctly wiped a pre-existing unversioned `bawler:followPrefs` entry left over from testing
- That correct-but-surprising behavior (a previously-set follow silently disappearing) prompted an explicit revert request: "bring our platform to previous version, prior to fix the localstorage"
- Reverted via `git revert` (commit `f1c407c` reverting `abb41d3`), confirmed byte-identical to the pre-fix state
- **Current production behavior: `getFollowPrefs`/`setFollowPrefs` use the raw, unversioned JSON shape on purpose.** Do not reintroduce a schema-version wrapper without being asked again — see DECISIONS-LOG.md "LS1"

---

## [1.0.52] 2026-07-15

### Filter / personalization: follow-selection sheet

#### Added — `lib/followPrefs.ts`
- `FollowPrefs { nations, teams, tournaments, players, formats }` — every category matched by stable registry ID, never display name (nations → `Team.country`, teams → `Team.code`, tournaments → `Competition.id`, players → `PLAYERS` slug, formats → `MatchFormat` literal)
- `getFollowPrefs()` / `setFollowPrefs()` — localStorage-backed, raw JSON shape
- `onFollowPrefsChanged()` — subscribes to a `window` `CustomEvent` (`bawler:follow-prefs-changed`), since `BottomNav` (owns `FollowSheet`) and `app/page.tsx` (owns "for you") are sibling components under the root layout, not parent/child
- `matchIsFollowed()` — single-boolean convenience wrapper (superseded as the "for you" driver in v1.0.55, kept for other callers)

#### Added — `lib/lineups.ts`
- `getMatchLineup(match, team)` / `isPlayerInMatch(match, playerId)`
- Checks `Match.lineups?: { teamA: string[]; teamB: string[] }` first (real-API-ready field added to `lib/types.ts`)
- Falls back to a deterministic seeded-hash presence check (`seededChance(`${match.id}:${playerId}`, 0.72)`) against the `PLAYERS` registry's `teamCode`/`franchiseCode` when a match has no explicit lineup
- Verified uniform distribution (72.0/2000 samples below threshold) and stress-tested with a player who represents both a national side and an IPL franchise (Jasprit Bumrah: 5/9 of his team's matches correctly include him, 4 correctly excluded) — confirms a player isn't credited with every match their team plays, only ones they actually featured in

#### Added — `lib/followNudge.ts`
- `registerHomeVisit()`, `isNudgeDismissed()`, `dismissNudge()`, `NUDGE_MAX_SESSIONS = 3`
- Empty-state nudge shown only pre-first-follow, within the first 3 Home visits, dismissible permanently

#### Added — `components/BottomSheet.tsx`
- Extracted from `LiveCarousel.tsx`'s existing swipe-to-dismiss/body-scroll-lock/back-button-closes-it implementation
- Added optional `footer?: React.ReactNode` prop (pinned below scrollable content) for the Follow sheet's full-width confirm button
- Backward compatible — `LiveCarousel`'s 3 existing usages unaffected

#### Added — `components/FollowSheet.tsx`
- Two-column bottom sheet: left rail = 5 categories (Nation/Team/Tournament/Player/Format) with per-category selected-count badges; right pane = search input + scrollable multi-select list
- `buildOptions(category)` sources options from `NATIONAL_TEAMS`/`ALL_TEAMS`/`COMPETITIONS`/`PLAYERS`/format literals
- Draft state re-initialized from `getFollowPrefs()` every time the sheet opens; `setFollowPrefs()` (actual persistence) only runs when "Follow" is tapped — backdrop tap / × / back-swipe discards in-progress edits

#### Added — `components/BottomNav.tsx` Filter trigger
- Raised circular 52px button (violet `#7C3AED`, 4px dark border ring) positioned between Home and Schedule, deliberately styled unlike the icon+label tabs since it opens an overlay rather than navigating
- Local `filterOpen` state; renders `<FollowSheet open={filterOpen} onClose={...} />`

#### Added — `tailwind.config.ts`
- `follow: { DEFAULT: "#7C3AED", soft: "#7C3AED22" }` — new dedicated violet, deliberately distinct from the existing "six" ball-outcome purple (`#A855F7`)

#### Changed — `lib/types.ts`
- `Match.lineups?: { teamA: string[]; teamB: string[] }` — optional field for confirmed playing XI

#### Removed — `lib/followedTeam.ts`
- Deleted; fully superseded by the multi-category `lib/followPrefs.ts`

#### Data
- Mock data audit found the Team registry (72 entries) and Competition registry (14 entries) already exceeded the "15–20 teams / a few tournaments" stress-test target — the real gap was per-match player lineups, addressed by `lib/lineups.ts` above rather than re-authoring teams/competitions

---

## [1.0.51] 2026-07-14

### Homepage sparkline de-tangling

#### Fixed — `LiveWinProbSpark` per-over bucketing + Catmull-Rom smoothing (`components/MatchCard.tsx`)
- After the v1.0.51 full-match-trend fix, the two win-prob lines still crossed back and forth repeatedly, reading as a tangled knot rather than a clean trend
- Root cause: plotting the same ball-by-ball density (218+ raw points for a full Test) the full-screen `WinProbChart` uses, crammed into a ~300px-wide sparkline — every minor mid-over fluctuation in real data showed up as a visible crossing
- A stride-based downsample (every Nth raw point) was tried and measured first — still produced 1–2 crossings per T20 match tested
- Fix: bucket the full `calculateWinProbForMatch()` output to exactly one point per over (`Map<number, WinProbPoint>` keyed by `Math.floor(overFloat)`, keeping the end-of-over value), then stride-downsample further only if still above `DOWNSAMPLE_TARGET = 30` points (Tests with 50+ overs); snap the last point's value to the authoritative current % so the end-dot never floats off; render via new local `sparkCatmullRomPath` helper
- Verified via `npx tsx` script: 0 crossings on tested matches after the rewrite vs. 1–2 under the old stride-sample approach; confirmed live via `segCounts: [20, 20]` (21 points matching 21 real overs)

---

## [1.0.50] 2026-07-14

### Homepage sparkline data + gridline fixes

#### Fixed — sparkline used full match win-prob trend instead of last ~20 balls (`components/MatchCard.tsx`)
- The hero card's new live sparkline (v1.0.50) rendered as nearly flat lines despite real, dramatic win-prob swings existing in the underlying data (verified full match range 1%–79% on `ind-aus-t20i-2026-m2-live`)
- Root cause: slicing only the last ~20 raw ball-by-ball points (≈3 overs) instead of the whole `calculateWinProbForMatch()` output — a small recent window of an otherwise dramatic match naturally shows little movement
- Fixed by downsampling the entire match's win-prob series instead of a recent slice

#### Fixed — homepage-only 50% gridline removed; full-screen modal untouched
- The sparkline inherited a dashed 50% reference gridline from being visually modeled on `WinProbChart.tsx`'s full-screen chart, but added clutter without adding readability at ~300px × ~50px card size
- Removed specifically from `LiveWinProbSpark` in `MatchCard.tsx`; `WinProbChart.tsx`'s own gridline is deliberately untouched — a user who taps in to study the full chart is in a different context than someone glancing at a home card
- Verified live via screenshot + DOM query (`numGridLines: 0` on homepage vs. the "50" dashed line still present in the full modal)

---

## [1.0.49] 2026-07-14

### Homepage redesign: live sparkline, quiet/spotlight cards, for-you row

#### Added — `LiveWinProbSpark` on the hero live card (`components/MatchCard.tsx`)
- Replaces the old static single-snapshot `WinProbBar` with a live sparkline computed from `calculateWinProbForMatch(match)` — the same function `WinProbChart.tsx`'s full-screen modal already uses, so the two views can never disagree
- Falls back to the old `WinProbBar` for the 2 mock matches that ship only a `liveWinProbOverride` with an empty `balls[]` (no ball data → no trend to draw)
- Two mirrored lines (`lineA`/`lineB = 1 - winProbTeamA`), each team's own `primaryColor`; end-of-line glow + solid dots; last point snapped to the authoritative current % so the end-dot never floats off; percentage labels below in team colours

#### Added — `lib/spotlight.ts`
- `isSpotlightMatch(match): boolean` — three concrete OR'd conditions instead of reusing the existing `match.excitement` score
- Rejected `excitement >= 8` after audit: static mock entries' `excitement` is a hand-typed editorial literal with no formula; `lib/matchGenerator.ts`'s infinite-scroll-generated matches compute it as `3 + Math.floor(seededRandom(idx) * 8)` — pure pseudo-random, ~43% of generated matches clear `>= 8` by chance, far too common for a "rare" spotlight feature
- `hasCloseFinish` — margin regex parse: ≤6 runs or ≤1 wicket, or summary text matches last-ball/last-over/super-over/tie
- `hasMilestone` — century in a limited-overs innings, 150+ in a Test innings (raised from a bare century after a "tighten further" pass — Test centuries are common and unremarkable at the original threshold), a 5-wicket haul, or "hat-trick"/"record" in the summary text
- `hasContextStakes` — badge/phase/series-status text matching decider/final/playoff/qualifier/semi/champion; deliberately excludes generic "rivalry"/"table-topper" language (dropped in a second tightening pass — recurs every season, stops reading as genuinely high-stakes)
- Final tuning: 4/23 static past+upcoming matches qualify (~17%), 0 upcoming currently qualify, 0% of generated matches can ever qualify (no batting/bowling card detail or stakes badges to check)

#### Changed — `PastMatchCard`/`FutureMatchCard` → quiet flat cards (`components/MatchCard.tsx`)
- `bg-bg-surface`, 3px left border (winner's colour for past, neutral `#1E293B` for future), no gradient/crest/badge, `QUIET_CARD_HEIGHT = 60`
- `SpotlightMatchCard({ match, isPast, forYou })` retains the full SplitTeamBg/crest/glow/badge treatment (`SPOTLIGHT_CARD_HEIGHT = 148`) for matches passing `isSpotlightMatch()`, plus an optional `ForYouMarker` top-left star pill

#### Added — "for you" row v1 (single followed team)
- `forYouMatch` — live match matching the (then single-team) followed preference, else soonest upcoming match matching it
- `forYouInSpotlight` — collapses the separate "for you" row when the same match is also a spotlight match, passing `forYou` into `SpotlightMatchCard` instead of rendering it twice
- Superseded by the tiered multi-category rewrite in v1.0.55 once the full Filter feature (v1.0.53) replaced the single-team placeholder

#### Added
- `SPOTLIGHT_MAX = 3` constant — spotlight carousel capped at 3 cards, same "stay rare" reasoning as the concrete-conditions bar itself

---

## [—] 2026-07-14 (folded into v1.0.48, no dedicated version bump)

### Scorecard polish: innings label + header colour

#### Fixed — redundant "Innings 1" label dropped for single-innings formats
- T20/T20I/ODI/Hundred showed "Innings 1" in the innings-card header even though a team only ever bats once in those formats — the label carried zero information
- Label is now omitted entirely outside Test, where it remains meaningful ("1st Innings"/"2nd Innings")

#### Changed — 4s/6s batting-table header labels coloured cyan/purple
- Header text for the "4s"/"6s" columns now matches the colour already used for the per-batter values in those columns (cyan for 4s, purple for 6s — the platform's established boundary palette), instead of plain grey
- Verified live on both T20I and Test matches

---

## [1.0.34] 2026-07-07

### Partnership velocity spark — Scorecard tab

#### Added — `computePartnerships()` in `components/Scorecard.tsx`
- Groups `innings.balls` by wicket intervals to define partnership boundaries
- Resolves batter display names via `battingCard.playerId` match → `ball.batterName` fallback
- Computes total runs + balls per partnership
- Generates `velocity[]` array: RPO per 3-ball window — the data series for the sparkline
- Returns `[]` when `innings.balls` is empty, making the section invisible on scorecard-only matches

#### Added — `VelocitySpark` SVG component
- 72×22px inline SVG, no external dependency
- Team `primaryColor` used for stroke and area fill
- Gradient area fill: team color at 25% opacity (top) → 2% (bottom)
- Polyline with `strokeLinecap="round"` + `strokeLinejoin="round"` for smooth appearance
- Terminal dot marks the end of the partnership
- Y scale: `max(velocity, 6 RPO)` — slow partnerships don't exaggerate flat lines
- Single-point fallback: centered dot for 1-ball partnerships

#### Added — Partnerships section in `InningsCard`
- Sits between Batting card and Bowling card in the Scorecard tab
- Only rendered when `partnerships.length > 0` (ball data required)
- Each row: sparkline | batter 1 & batter 2 names + "Pship N" label | runs (balls)
- Uses `SectionLabel` component consistent with Batting/Bowling headers

---

## [1.0.33] 2026-07-07

### iOS Safari back-swipe fix + SeriesScheduleSheet real-data decoupling

#### Fixed — `BottomSheet` back-button handling (`components/LiveCarousel.tsx`)
- **Before:** `history.pushState({ bawlerModal: true }, "")` with no URL change — iOS Safari ignores this for its left-edge swipe gesture, so back-swipe navigated the full page instead of closing the sheet
- **After:** `history.pushState({ bawlerModal: true }, "", cleanUrl + "#modal")` — hash change is treated as a navigable history entry by iOS Safari, so back-swipe fires `popstate` and closes the sheet correctly
- **Cleanup fix:** replaced `history.back()` in cleanup with `history.replaceState(null, "", cleanUrl)` — avoids double-navigation when the sheet is dismissed programmatically (swipe-down, backdrop tap, × button)
- Stable `onCloseRef` pattern prevents stale closure on the `popstate` handler
- Works correctly on: Android Chrome/Firefox, iOS Safari browser + PWA, desktop Chrome/Safari/Firefox

#### Refactored — `SeriesScheduleSheet` real-data decoupling
- Removed direct imports of `ALL_PAST_MATCHES`, `ALL_LIVE_MATCHES`, `ALL_UPCOMING_MATCHES` from inside the component
- Now accepts `seriesPool: Match[]` prop — the parent passes all matches; the component only filters
- `LiveCarousel` builds `seriesPool = useMemo(() => [...ALL_PAST_MATCHES, ...matches, ...ALL_UPCOMING_MATCHES], [matches])` where `matches` is the live-data prop (already real-data-ready)
- When real API data arrives: replace the two `ALL_*` references in `LiveCarousel` — zero changes to `SeriesScheduleSheet`

#### Added — `resolveCompetition()` in `lib/transformers.ts`
- Maps numeric Cricbuzz `seriesId` → internal `Competition` via `CRICBUZZ_SERIES_ID_MAP`
- Falls back to `unknown-series-{id}` with a `console.warn` for unmapped series — sheet returns 0 matches rather than silently mixing up two different series
- All transformer paths (live, recent, schedule) must call this instead of passing raw seriesId strings into `Match.competition.id` — ensures `competition.id` is identical across all match statuses for the same series

---

## [1.0.32] 2026-07-07

### Series schedule bottom sheet

#### Added — Series status chip now clickable (`components/LiveCarousel.tsx`)
- `<span>` → `<button>` with `onClick={() => setView("series")}`
- Hover/tap styling: `hover:text-text-primary hover:border-cyan/40 transition-colors tap-scale`
- Chevron icon (8px) appended inside the chip to signal interactivity
- `view` state union extended: `"none" | "standings" | "team-schedule" | "series"`

#### Added — `SeriesScheduleSheet` component (`components/LiveCarousel.tsx`)
- Opens as a `BottomSheet` with competition name as title
- Filters `seriesPool` by `competition.id` + same two team codes (Set-based, handles either team order)
- Three sections sorted chronologically: past matches, live match, upcoming matches
- **Past match cards:** date, team names, innings scores (attribution-aware via `battingTeam` field), result margin, venue
- **Live match card:** green `bg-six/10` highlight, pulsing LIVE badge, current scores, venue
- **Upcoming match cards:** countdown chip (in Xd / in Xh Xm), date + time, venue
- Empty state when no series matches found
- Book-page swipe indicator (double-bar drag handle)

#### Added — 1st T20I (AUS vs IND) to `PAST_INTERNATIONAL` in `lib/mockData.ts`
- Match id: `ind-aus-t20i-2026-m1` — AUS won by 23 runs; T Head 76(48) MOM
- Gives the series sheet a full 3-match context: 1st T20I (past) → 2nd T20I (live) → 3rd T20I (upcoming)
- Full batting + bowling cards for both innings

---
## [1.0.15] 2026-07-02

### Home page — TABLE button + team schedule popup

#### Added — Dynamic TABLE button on live carousel (LiveCarousel.tsx)
- A **"[Comp] Table" pill button** appears below the live carousel only when the currently snapped card is a league or tournament match
- Button is fully dynamic: swipe to an IPL card → "IPL Table" appears; swipe to a Test/bilateral card → button disappears; swipe to PSL → "PSL Table" appears
- Carousel snap tracking rewritten to use `firstCard.getBoundingClientRect().width + 12px gap` (was using `el.clientWidth` which didn't account for the gap, causing index drift)

#### Added — Standings bottom sheet (LiveCarousel.tsx)
- Tapping the TABLE button opens a bottom sheet over the home page with full league standings
- Sheet includes a drag handle, competition name/subtitle, close (×) button
- Swipe-down gesture on the **handle/header only** dismisses the sheet; dragging >80px closes, less snaps back with spring transition
- Body scroll (`document.body.style.overflow = "hidden"`) locked while sheet is open, preventing background page from scrolling

#### Added — Team schedule popup (LiveCarousel.tsx, MiniStandings.tsx)
- Tapping any team row in the standings sheet opens a **second bottom sheet** showing that team's full tournament schedule — no page navigation
- Schedule sorted ascending (earliest match first)
- Past matches: Won/Lost badge in team colour + 10-word truncated summary
- Live match (if any): red left-border highlight + live status string
- Upcoming matches: date/time + venue city
- **Back button** (←) in the header returns to standings; close (×) closes everything
- `MiniStandings` gains optional `onTeamClick` prop — when provided uses `<button>` instead of `<Link>` so it works inside the popup context

#### Fixed — Sheet content scrolling (LiveCarousel.tsx)
- Added `min-h-0` to the scrollable content div — the canonical fix for `flex-1 + overflow-y-auto` not scrolling inside a flex column (content expanded to fit rather than scrolling)
- Removed `overflow-hidden` from the outer sheet container (was blocking inner scroll)
- Added `WebkitOverflowScrolling: "touch"` for iOS momentum scroll
- Touch gesture handlers moved exclusively to the header/handle zone — content area touch events no longer intercepted

---

## [1.0.14] 2026-07-02

### Test match — dual-innings score display

#### Added — Prior innings score on live Test match cards (MatchCard.tsx)
- When a Test match is in the **2nd innings or later**, the team's completed prior innings score appears **before** the current innings score: e.g. `199/10 & 88/4 (28)`
- Only triggers for `match.format === "Test"` and only when `innA.length >= 2` (team has played more than one innings)
- Shown in muted white/40 so it doesn't compete visually with the live innings score
- No change to T20/ODI display

---

## [1.0.13] 2026-07-02

### Critical bug fix — score sync and live status attribution

#### Fixed — LiveMatchCard score swap (MatchCard.tsx)
- **Root cause**: `innings[0]` was assumed to be teamA's innings and `innings[1]` teamB's. This is wrong when the visiting team bats first — their innings is `innings[0]` but they are `teamB`.
- **Fix**: Filter innings array by `battingTeam` field: `innA = innings.filter(i => i.battingTeam === teamA.code)`. Attribution is now correct regardless of toss outcome or batting order.
- Affects score display, batting indicator dot, and status text placement on live cards.

#### Fixed — liveStatusOf() status text swap (MatchCard.tsx)
- Same positional bug: function used `innings[0]` and `innings[1]` by array position to determine which team is chasing
- Rewritten to use `currentInn = innings[innings.length - 1]` and derive `battingTeam` / `fieldingTeam` from `currentInn.battingTeam`
- Status text (e.g. "ENG need 45 off 32 balls") now always names the correct team

---

## [1.0.12] 2026-07-02

### Cricket-first redesign — schedule, flags, lineup, popularity sort, win prob

#### Changed — Schedule page: competitions list with drill-down (app/schedule/page.tsx, app/schedule/[competitionId]/page.tsx)
- Schedule root now shows a **list of competitions** sorted by worldwide popularity — not individual matches
- Each row: coloured left bar, competition name, live badge (if any match is live), type + format pills, chevron
- Tapping a competition opens `/schedule/[competitionId]` showing all matches for that tournament
- Filter chips removed from schedule root (were noisy; competition grouping is cleaner)
- New server component `/schedule/[competitionId]/page.tsx` with `generateStaticParams`

#### Added — Team schedule page (app/schedule/[competitionId]/[teamCode]/page.tsx)
- Server component, pre-rendered for all `(competition, team)` pairs
- Three sections: Live Now, Upcoming, Results (reversed chronological)
- Past match rows show a Won/Lost colour bar indicator
- Linked from MiniStandings team rows (when using Link variant)

#### Added — Worldwide popularity sort for live + upcoming matches (app/page.tsx)
- Formula: `COMP_POP[comp.id] + TEAM_POP[teamA.code] + TEAM_POP[teamB.code]`
- `COMP_POP`: ICC T20 WC (100) → Ashes (90) → IPL (88) → bilateral series (68–80) → franchise leagues (40–66)
- `TEAM_POP`: IND (20), AUS (14), ENG (12), PAK (11), MI/CSK (10), RCB (9)…
- Applied to: live carousel, upcoming matches column, schedule competition list

#### Added — Country flags for national teams (MatchCard.tsx)
- `FlagOrRank` component replaces `RankPill` for national teams
- Uses `flagcdn.com/w40/{iso}.png` (40px wide) for crisp HiDPI rendering
- Flag ISO map covers 20 national teams; franchise teams still show `#rank` pill
- Switched from flag emoji (invisible on Windows) to PNG images

#### Changed — Playing XI: flat list, no subsections (LineupsCard.tsx)
- Removed "Batting Order" and "Bowlers Used" sub-headers
- Single `PlayerColumn` with `getXI()`: merges `battingCard + bowlingCard + squad`, deduped, max 11 players
- Header label: "Playing XI"
- Squad data (11 players) added to all 10 IPL teams in `mockData.ts`

#### Improved — Win probability chart (WinProbChart.tsx)
- Single smooth area chart with Catmull-Rom → cubic bezier smoothing, downsampled to ~60 points
- Team-coloured area fills under each line
- Clean header with team names + percentages; drag handle at top
- Back button (← chevron) top-left

#### Added — Win prob modal: back button + back-swipe gesture (MatchView.tsx)
- `← Back` button in WinProbChart header closes the modal
- `history.pushState({winProb:true})` on open; `popstate` listener fires `closeProbModal()` on browser back
- Mobile back-swipe gesture triggers close without needing the button

#### Added — Win prob modal: book page-turn animation (MatchView.tsx, globals.css)
- Opens with `book-enter-forward` (220 ms), closes with `book-exit-backward` (240 ms)
- `isClosingProb` state: animation plays before React unmounts the component

#### Fixed — Win% float precision (MatchView.tsx)
- `100 - 99.44` floating point error produced `0.5600000000000023%`
- Fix: `Math.round(pctA)` / `Math.round(pctB)` before display

#### Added — Live match: status text under batting team (MatchCard.tsx)
- `LiveSide` now accepts `status?: string` prop
- Status line rendered in cyan below the batting team's score (e.g. "CSK need 34 off 22 balls")
- Only shown for the batting team, not the fielding team

#### Added — MiniStandings in match Live tab for league matches (MatchView.tsx, MiniStandings.tsx)
- Compact standings card (Team / W / L / NRR / Pts) rendered in the Live tab when `match.competition.type === "league"`
- Each team row is a `<Link>` to `/schedule/{comp.id}/{team.code}`
- Playoff line indicator (top-4 teal bar) + "Tap team for their schedule" hint

#### Added — TABLE tab in match view (MatchView.tsx, MatchTabs.tsx, StandingsTab.tsx)
- `showTable = competition.type === "league" || "international"`
- When true, a fourth **Table** tab appears in the match tab bar
- `StandingsTab` renders full standings with position numbers, NRR, playoff line, eliminated teams
- `STANDINGS_MAP` currently maps `"ipl-2026"` → full IPL 2026 standings; other competitions show "coming soon"

## [1.0.11] 2026-07-02

### Team Data — accurate jersey colors + full league rosters

#### Fixed — National team jersey colors (mockData.ts)
- **AUS**: `#006A4E` (wrong green) → `#FFB81C` (Aussie Gold) — the most critical fix
- **ENG**: `#C8102E` (St George red) → `#1D244E` (England Navy) + `#00A0C6` cyan accent
- **BAN**: `#006A4E` (duplicate of old AUS) → `#1A6B3A` (Bangladesh Green)
- **ZIM**: `#006400` (dark green) → `#D4212D` (Zimbabwe Red, actual jersey)
- **NZ**: secondary updated to `#A8A9AD` silver (Black Caps brand)
- **WI**: maroon deepened to `#6E1436` + `#FFC726` gold (CWI official palette)
- **USA**: swapped — navy `#002868` now primary, red secondary (jersey is navy)
- All other national teams: minor shade accuracy improvements

#### Added — 7 new national teams
- UAE 🇦🇪 (red/white), Namibia 🇳🇦 (blue/gold), Papua New Guinea 🇵🇬 (black/red)
- Oman 🇴🇲 (maroon/white), Canada 🇨🇦 (red/white), Kenya 🇰🇪 (green/red), Uganda 🇺🇬 (black/yellow)

#### Added — Missing franchise teams (full rosters for every competition)
- **BBL**: Melbourne Renegades (RENE, red), Adelaide Strikers (STR, navy/gold) — now 8/8
- **The Hundred**: Northern Superchargers (NSC, yellow), Trent Rockets (TRR, red),
  Welsh Fire (WEF, maroon/gold), Birmingham Phoenix (BPH, maroon/gold) — now 8/8
- **SA20**: Pretoria Capitals (PREC, navy), Paarl Royals (PARR, pink), Durban's Super Giants (DURGD, teal) — now 6/6
- **CPL**: Jamaica Tallawahs (JAT, gold), St Kitts Patriots (SKP, green), St Lucia Kings (SLK, blue) — now 6/6
- **MLC**: Seattle Orcas (SEAO, teal), San Francisco Unicorns (SFU, orange), Washington Freedom (WASF, red) — now 6/6

#### Fixed — TypeScript build errors (Vercel was failing)
- `schedule/page.tsx`: escaped template literals `\`` → `` ` ``
- `CommentaryFeed.tsx`: innings type `1|2` → `1|2|3|4`
- `winProb.ts`: missing `totalBalls`/`totalBalls2` in `calculatePressureGauge`
- `page.tsx`: `UPCOMING_MATCHES` → `ALL_UPCOMING_MATCHES`

---

## [1.0.10] 2026-07-01

### Performance — faster animations, smarter re-renders

#### Removed — feGaussianBlur SVG filter from animated ball circles (BallGIF.tsx)
- `#glowB` (BowlerView) and `#glowO` (OverheadView) filters used `feGaussianBlur stdDeviation="3"`
- SVG filters are CPU-rasterized on every animation frame (60fps) — the single biggest GPU bottleneck
- Removed `filter="url(#glowB/O)"` from all animated circles; ball gradient fill remains fully visible

#### Removed — `animate attributeName="r"` from animated ball circles
- Changing the SVG `r` attribute per-frame forces geometry recalculation and full repaint
- Removed from pre-pitch ball, post-pitch ball (BowlerView), and overhead ball (OverheadView)
- Ball size is now fixed per phase rather than interpolated — visually indistinguishable

#### Added — React.memo on 7 heavy components
- `ScoreBar`, `MatchTabs`, `MiniInsightsBar`, `AIMetrics`, `MomentsStrip`, `CommentaryFeed`, `MiniWinProb`
- Components skip re-render when their props haven't changed shallowly
- `handleMomentSelect` in MatchView.tsx wrapped in `useCallback([allBalls.length])` so
  `MomentsStrip`'s `onSelect` prop is a stable reference between renders

#### Unchanged — Sticky header backdrop-blur
- `backdrop-blur` temporarily removed then restored; static sticky elements only re-composite
  on scroll — negligible compared to the 60fps SVG filter work that was the real bottleneck
- ScoreBar, MatchTabs, MiniInsightsBar, BottomNav frosted-glass look fully preserved

---

## [1.0.9] 2026-07-01

### Ball visualizer accuracy — perspective mapping + bounce arc

#### Fixed — Perspective-correct impact Y position (BallGIF.tsx — BowlerView)
- Previous formula: `impactY = PITCH_BOT_Y - pitchY * (PITCH_BOT_Y - PITCH_TOP_Y)` (linear)
- Linear is wrong for a perspective projection. The pitch trapezoid (220px wide at batter end,
  80px wide at bowler end) encodes a real perspective with width ratio 2.75.
- In a perspective view, equal 3D distances on the pitch map non-linearly to screen Y:
  the near half (batter end) takes up proportionally more visual space than the far half.
- New formula: `impactY = PITCH_BOT_Y - (wRatio × range × pitchY) / (1 + (wRatio-1) × pitchY)`
  where `wRatio = PITCH_BOT_W / PITCH_TOP_W = 220 / 80 = 2.75`
- Effect: good-length balls now appear in the upper third of the pitch (not the visual middle);
  short balls appear close to the bowler's crease; full deliveries barely change (near end
  where linear and perspective converge). Matches real TV broadcast pitch map expectations.

#### Fixed — Post-pitch bounce arc (BallGIF.tsx — BowlerView)
- Previous: `postPitchControl.y = (impactY + batterArrivalY) / 2` — control point on the
  straight line midpoint, producing zero upward arc. Ball appeared to slide along pitch.
- New: `postPitchControl.y = impactY - bounceH` where `bounceH = 10 + pitchY * 50`
- Control point sits above the impact point, creating a quadratic bezier that arcs upward
  after pitching then curves back down to the batter — physically accurate bounce shape
- Bounce height scales with delivery type: yorkers ≈ 10px, good-length ≈ 33px, bouncers ≈ 55px

---

## [1.0.8] 2026-07-01

### MiniWinProb — full redesign, both teams visible

#### Redesigned — MiniWinProb component (MiniWinProb.tsx)
- Previous design showed only the leading team's win% in a small chip — other team was hidden
- New design shows both teams' percentages side-by-side, both in `text-2xl font-bold`
- Leader is `text-text-primary`; trailing team is `text-text-dim` — clear hierarchy without hiding data
- SVG chart: gradient area fills below each team's line (30% opacity at line → 3% at bottom)
- Lines are 2.4px; ends have a dot with an outer glow ring in team colour
- Split colour bar at the bottom (same style as home page match cards)
- Chart height 72px; SVG gradient IDs namespaced (`mwp-fa`/`mwp-fb`) to prevent DOM conflicts
- `brighten()` helper normalises dark team colours (MI navy, KKR purple) so they're visible
  on the dark background — preserves hue, pushes brightest channel to 255

---

## [1.0.7] 2026-07-01

### UX polish — nav cleanup, team colours, scorecard orientation

#### Fixed — Back button removed from Schedule and Table headers (schedule/page.tsx, table/page.tsx)
- Schedule and Table are primary navigation destinations (reached via bottom tab bar)
- A ← back link on these pages implied a nav stack that doesn't exist — confusing to users
- Headers now show only the page title + subtitle; no back affordance

#### Fixed — GT team colour dot invisible in Table (lib/mockData.ts)
- GT's `primaryColor` was `#1B2133` — the same shade as the dark surface background
- Dot was rendering but completely invisible against the card background
- Changed to cobalt blue `#4285F4` — clearly distinct from MI navy (`#004BA0`),
  DC royal (`#17449B`), and LSG cyan (`#00A2D6`)

#### Added — Sticky innings header in Scorecard tab (Scorecard.tsx)
- InningsCard header (`Mumbai Indians · Innings 1 | 174/6`) is now `sticky top-[148px] z-20`
- Stays visible while scrolling through batting rows — user always knows which innings they're reading
- Removed `overflow-hidden` from outer card wrapper (was preventing sticky from working)
- Header gets `rounded-t-2xl` to maintain card aesthetics

---

## [1.0.6] 2026-07-01

### Bug fix + commentary colour refinement

#### Fixed — Whitish SVG wash on BallGIF in Safari (globals.css, MatchView.tsx)
- `perspective: 900px` was set as a permanent inline style on `<main>` in MatchView
- Safari promotes children of a `perspective` parent into separate GPU compositing layers
- SVG `fill="url(#id)"` gradient references break across compositing boundaries in Safari —
  fills fell back to transparent, letting the light card background bleed through as a white wash
- Fix: moved `perspective(900px)` inside each `@keyframes` transform so the 3D context
  only exists during the 220–300ms animation window, not permanently
- Removed `style={{ perspective: "900px" }}` from the `<main>` element

#### Changed — Commentary ball colours (lib/outcomeColors.ts)
- **Two (2)**: was mint green `#4ADE80` — now slate `#64748B`, same as dot and single
  (dots / singles / doubles all group visually as "low-impact" deliveries)
- **Three (3)**: was gold/yellow `#FBBF24` — now hot pink `#EC4899`
  (rare delivery, now unmistakably distinct)
- Singles and dots were already matching slate from v1.0.5; doubles now join them

---

## [1.0.5] 2026-07-01

### Commentary colours + nav on match page + book page-turn animation

#### Changed — Commentary ball colours (lib/outcomeColors.ts)
- **Six**: badge/tint changed from purple (`#A855F7`) → turquoise green (`#2DD4BF`)
- **Single**: was mint green — now uses the exact same colours as a dot ball (slate `#64748B`)
- **Wicket**: stays red (`#EF4444`) ✓

#### Fixed — Bottom nav missing on match page (BottomNav.tsx + MatchView.tsx)
- Removed the `/match/*` exclusion — BottomNav now renders on every page including match page
- On match page, no tab is highlighted (all dimmed) — still allows jumping to Home / Schedule / Table
- Added `pb-24` to MatchView so commentary feed doesn't get cut off behind the nav

#### Added — Book page-turn animation for tab transitions (globals.css + MatchView.tsx)
- New `goToTab()` function: tab header highlights new tab immediately, then animates content
- Exit phase (220ms, ease-in): content slides + rotates 28° in 3D — page folding away
- Enter phase (300ms, ease-out): new content slides in from opposite side — page unfolding
- Direction-aware: left swipe = forward, right swipe = backward
- Works identically for touch swipe and tab header tap
- `renderedTab` state separates what's highlighted (responds instantly) from what renders (animates)

---

## [1.0.4] 2026-07-01

### UX overhaul — immediate wins + medium effort

#### Added — Tap / press feedback (globals.css + MatchCard.tsx)
- `.tap-scale` CSS class: cards scale to 0.97 and darken on press (100ms ease)
- Applied to Live, Past, and Future match cards; next match link in empty state

#### Added — Improved back button (ScoreBar.tsx)
- Back arrow has a larger tap target, "Back" text label, and active press state

#### Added — Better empty state for Live carousel (LiveCarousel.tsx)
- When no matches are live, shows a card with next upcoming match
- Displays both team names with colours, countdown ("in 2d 14h"), match time and venue

#### Added — Loading skeleton on home boot (page.tsx + globals.css)
- `@keyframes shimmer-slide` + `.skeleton` class: animated left-to-right shimmer
- Home page shows shimmering placeholder cards for 350ms while content loads

#### Added — Pull-to-refresh on home page (page.tsx)
- Pull down from top shows spinning cyan indicator; only triggers at scroll position 0

#### Added — Swipe between tabs on match page (MatchView.tsx + MatchTabs.tsx)
- Swipe left → next tab (Live → Scorecard → Info); swipe right → previous tab
- Ignores mostly-vertical swipes so normal scroll still works

#### Added — Score event badge on Scorecard tab (MatchView.tsx + MatchTabs.tsx)
- Wicket → red pulsing dot on Scorecard tab; Six → purple pulsing dot
- Badge clears after 4 seconds or when user switches to Scorecard

#### Fixed — Infinite scroll broken by layout change (page.tsx + layout.tsx)
- Scroll listener now attaches to `document.getElementById("main-scroll")`

#### Fixed — Sticky headers offset (MatchView.tsx + schedule/page.tsx + table/page.tsx)
- `sm:top-4` caused 16px gap inside scroll container; all sticky headers changed to `top-0`

---

## [1.0.3] 2026-07-01

### Fix — Bottom nav visible on all pages

#### Problem
BottomNav used `position: fixed` inside a `phone-frame` div that has `overflow: clip` on desktop,
causing the nav to be clipped on Schedule and Table pages.

#### Fix
- BottomNav moved outside `phone-frame` entirely in `layout.tsx` — now a sibling, not a child
- `position: fixed; bottom: 0; left: 50%; -translate-x-1/2; width: min(430px, 100vw)` — never clipped
- `phone-frame` reverted to simple `mx-auto bg-bg min-h-screen max-w-[430px]` container
- All pages get `pb-24` so content clears the fixed nav

---

## [1.0.2] 2026-06-30

### Scorecard highlights + Win-prob revert

#### Added — Scorecard per-innings highlighting (Scorecard.tsx)
- Highest scorer: name + runs in teal (`text-teal-400`) per innings
- Highest wicket-taker: name + wickets in red (`text-wicket`) per innings
- Highest strike rate (min 6 balls): SR cell in blue (`text-blue-400`) per innings
- Man of Match: name in gold (`text-yellow-400`) + "MOM" badge
- Man of Series: name in purple (`text-six`) + "MOS" badge
- MOM/MOS summary banners shown above innings cards when match is complete

#### Added — result fields in types + mock data (lib/types.ts, lib/mockData.ts)
- Added `manOfMatch?: string` and `manOfTournament?: string` to `result` object
- FEATURED_MATCH: `manOfMatch: "Andre Russell"`, `manOfTournament: "Virat Kohli"`

#### Reverted — Win probability back to two-crossing-lines (MiniWinProb.tsx, WinProbChart.tsx)
- Replaced single-area-chart redesign with original two-crossing-lines design
- Both team lines cross at 50% naturally as win probability shifts

---

## [1.0.1] 2026-06-30

### Build stability hotfix

#### Fixed — Truncated source files
- 6 files truncated on disk (AIMetrics.tsx, BallGIF.tsx, FilterBar.tsx, MatchCard.tsx,
  MomentsStrip.tsx, app/layout.tsx) — completed all missing tails

#### Fixed — Missing React imports (8 files)
- `React.CSSProperties` / `React.ReactNode` require explicit import under Next.js JSX transform
- Added React to: MatchCard, FilterBar, layout, page, DeliveryCard, InlineNote,
  InsightsPanel, LineupsCard, Scorecard, ViewSwitcher

#### Fixed — Null bytes in page.tsx
- Thousands of `\x00` null bytes stripped (TypeScript reported each as "Invalid character")

#### Fixed — Strict TypeScript null in match/[id]/page.tsx
- Added `match!` non-null assertion after `notFound()` call (safe — notFound never returns)

#### Fixed — MatchCard.tsx missing "use client"
- `fmtCountdown()` calls `Date.now()` at render time; directive added

---

## [1.0.0] 2026-06-30

### UI/UX overhaul — navigation, readability, hierarchy

#### Added — Bottom navigation bar (BottomNav.tsx + layout.tsx)
- Persistent bottom nav: Home / Schedule / Table; active tab cyan + underline indicator

#### Fixed — AI metric tiles (AIMetrics.tsx)
- Context sub-label, trend arrow (↑/↓), and delta line per tile

#### Fixed — Upcoming match cards (MatchCard.tsx)
- Visual bottom anchor bar: clock + cyan countdown + time + city

#### Fixed — Moments strip (MomentsStrip.tsx)
- Two-zone chip layout; Live chip with pulsing dot; 2-line clamped context

#### Fixed — Ball visualization info hierarchy (BallGIF.tsx)
- Delivery type large on left; outcome badge right; bowler→batsman sub-row

#### Fixed — Home filter chip team colour (FilterBar.tsx + page.tsx)
- Glowing team-colour dot in TEAM filter chip when active

---

## [0.9.8] 2026-06-30
- `brightColor()` function: hue-accurate team colours in win-prob charts (fixes MI navy→cyan distortion)

## [0.9.7] 2026-06-30
- Removed event dots from WinProbChart (clutter); body forced to `#000000`

## [0.9.5] 2026-06-30
- Chart gradient opacities increased; both team zones clearly visible

## [0.9.3] 2026-06-30
- Win-prob chart: line always team A colour; zone fills always correct regardless of leader

## [0.9.1] 2026-06-30
- Win-prob redesign: single area chart, MiniWinProb + WinProbChart (later reverted in v1.0.2)

## [0.9.0] 2026-06-01 (baseline)

Initial v0.9 prototype. Full UI with mocked data.
- Home: LiveCarousel, Past/Future split columns, FilterBar, infinite scroll
- Match: BallGIF, MomentsStrip, MiniWinProb, AIMetrics, CommentaryFeed
- Scorecard tab, Info tab, Schedule page, Table page
- Win probability formula-based; WinProbChart with zoom + pinch
- Stack: Next.js 14, React 18, TypeScript, Tailwind — deployed on Vercel

---

## [1.0.16] 2026-07-03

### Bug fixes

#### Fixed — Win probability override showing inverted values
- `liveWinProbOverride.pct` is stored as 0–1 (e.g. `0.72`) but `liveWinProb()` was dividing by 100 again
- GT showing 0.7% (effectively 1%) instead of 72%; RCB override similarly broken
- Fix: `pctA = isTeamA ? pct : 1 - pct` (removed `/ 100`)
- File: `components/MatchCard.tsx`

#### Fixed — Scorecard tab empty for live matches (GT vs RR, RCB vs CSK)
- `battingCard: []` and `bowlingCard: []` — no player data in mock innings
- Populated both matches with realistic batting and bowling card data
- File: `lib/mockData.ts`

#### Fixed — MiniStandings removed from Live tab in match view
- Standings table was incorrectly rendering inside the LIVE tab of match view
- Removed both MiniStandings blocks + import from `MatchView.tsx`
- Bug introduced during removal: broken JSX comment `{/* Summary */` missing closing `}` — fixed
- Standings now only appear in dedicated TABLE tab
- File: `components/MatchView.tsx`

---

## [1.0.17] 2026-07-03

### Real-data readiness — data layer + API adapter foundation

#### Added — `CompetitionStandings` interface (`lib/types.ts`)
- New interface: `competitionId`, `phase?`, `phaseLabel?`, `updatedAt`, `rows`, `showNrr`, `showDrawn`, `qualifyingSpots`
- Standings are now fully data-driven; column config (NRR, Drawn) is per-competition
- Supports multi-phase tournaments (group stage → Super 8 → playoff) via `phase` field

#### Added — `hasStandings: boolean` to `Competition` (`lib/types.ts`)
- Replaces brittle `type === "league" || type === "international"` checks across codebase
- Bilateral series (Ashes, IND vs ENG etc.) → `hasStandings: false` → no TABLE tab, no TABLE button
- Leagues + ICC tournaments → `hasStandings: true` → TABLE tab and button appear automatically
- Adding a new competition requires setting one field; nothing else changes

#### Added — `StandingsRow` extended fields (`lib/types.ts`)
- `drawn?: number` — for Test/bilateral series standings
- `tied?: number` — rare but valid
- `netRunRate?: number` — now optional (Test series don't use NRR)
- `pct?: number` — win percentage for formats that use it instead of points

#### Added — `phase?: string` to `Match` (`lib/types.ts`)
- Carries match phase: `"group"` | `"super-8"` | `"qualifier"` | `"semifinal"` | `"final"`
- Enables phase-specific standings lookup for ICC tournaments

#### Added — `COMPETITION_STANDINGS` export (`lib/mockData.ts`)
- `Record<string, CompetitionStandings>` keyed by `competition.id`
- Covers: IPL 2026 (full), PSL 2026, BBL 2025-26, The Hundred 2026, SA20 2026 (all stubbed with realistic data)
- ICC tournaments: T20 WC 2026 Group A, Champions Trophy 2025 Group A
- Bilateral series (Ashes, IND-ENG, IND-AUS, ENG-SA): no entry — `hasStandings: false` on Competition

#### Added — `lib/transformers.ts` (new file)
- Typed adapter skeletons for 3 major cricket data APIs:
  - **Cricbuzz** (unofficial): `transformCricbuzzMatch`, `transformCricbuzzScorecard`, `transformCricbuzzStandings`
  - **ESPN Cricinfo / sportsdata.io**: `transformESPNMatch` with full `Ball` mapping
  - **SportRadar**: `transformSportRadarTimeline` — full ball-by-ball, innings grouping by `battingTeam`
- Raw types partially typed (only fields we need)
- ID lookup tables: `CRICBUZZ_SERIES_ID_MAP`, `CRICBUZZ_TEAM_ID_MAP`, `SPORTRADAR_TEAM_ID_MAP`
- All functions have clear TODO comments marking where real API logic slots in

#### Updated — `StandingsTab.tsx`
- Replaced hardcoded `STANDINGS_MAP` with `COMPETITION_STANDINGS[competition.id]` lookup
- Columns now render dynamically: NRR column shown only when `standings.showNrr = true`; Drawn column only when `standings.showDrawn = true`
- Phase label (`"Group Stage"`, `"Points Table"` etc.) renders above table when present
- Qualification line legend text uses `qualifyingSpots` count from data

#### Updated — `MiniStandings.tsx`
- Same data-layer migration as StandingsTab
- NRR column conditionally rendered based on `standings.showNrr`
- Gracefully returns `null` if competition has no standings entry

#### Updated — `MatchView.tsx`
- `showTable` now reads `match.competition.hasStandings` instead of type check

#### Updated — `LiveCarousel.tsx`
- TABLE button visibility reads `activeMatch.competition.hasStandings` instead of type check

#### Updated — `app/table/page.tsx`
- Fixed TS error: `row.netRunRate` guarded with `?? 0` after making field optional

---

## [1.0.18] 2026-07-03

### WTC standings — Test Championship cycle integrated

#### Added — `championship?: Competition` field on `Match` (`lib/types.ts`)
- Optional field pointing to the overarching championship a match contributes to
- Example: Ashes 3rd Test and IND vs ENG 2nd Test both have `championship: COMPETITIONS.wtc2527`
- Bilateral series competition stays unchanged; championship is additive, not a replacement

#### Added — `showPct?: boolean` on `CompetitionStandings` (`lib/types.ts`)
- Enables a PCT% column in standings tables
- WTC uses win percentage (points won / max available × 100) as the primary ranking metric — no NRR

#### Added — WTC 2025-27 competition (`lib/mockData.ts`)
- `id: "wtc-2025-27"`, `hasStandings: true`, format: Test, type: international
- All 9 Test-playing nations with realistic mock standings: PCT%, Drawn column, no NRR
- Top 2 qualify for WTC Final (`qualifyingSpots: 2`)

#### Added — WTC standings in `COMPETITION_STANDINGS` (`lib/mockData.ts`)
- `showDrawn: true`, `showPct: true`, `showNrr: false`
- Rows: AUS 76.67%, IND 66.67%, SA 66.67%, NZ 54.17%, ENG 43.33%, SL, PAK, BAN, WI

#### Updated — `StandingsTab.tsx` + `MiniStandings.tsx`
- Added PCT% column — renders when `standings.showPct = true`
- Grid layout adjusts automatically (showDrawn + showPct = wider grid)

#### Updated — `LiveCarousel.tsx`
- TABLE button now prefers `match.championship` over `match.competition` for standings
- Logic: `championship.hasStandings ? championship : competition.hasStandings ? competition : null`
- `TeamScheduleSheet` filter now matches by `competition.id OR championship.id`
- Result: clicking TABLE on a live ENG vs IND Test shows WTC standings, not the bilateral series

#### Updated — `MatchView.tsx`
- TABLE tab inside match view also uses `match.championship` when present
- `tableComp = championship.hasStandings ? championship : competition`
- Test match TABLE tab shows full WTC table, not "Standings coming soon"

---

## [1.0.19] 2026-07-03

### Auto-championship resolution in API transformers

#### Added — `CRICBUZZ_CHAMPIONSHIP_MAP` (`lib/transformers.ts`)
- `Record<number, string>` — maps Cricbuzz series IDs → internal championship IDs
- Pre-documented structure for WTC 2025-27: add the real Cricbuzz series IDs for each of the ~27 ICC-designated bilateral Test series when API access lands
- Fills once per WTC cycle (every 2 years), not per match

#### Added — `ESPN_CHAMPIONSHIP_MAP` (`lib/transformers.ts`)
- Same concept for ESPN Cricinfo / sportsdata.io series IDs → championship IDs

#### Added — `SPORTRADAR_CHAMPIONSHIP_MAP` (`lib/transformers.ts`)
- Same concept for SportRadar tournament IDs → championship IDs

#### Updated — `transformCricbuzzMatch()` (`lib/transformers.ts`)
- Now accepts `allCompetitions: Record<string, Competition>` as a parameter
- Auto-resolves `championship` from `CRICBUZZ_CHAMPIONSHIP_MAP[raw.matchInfo.seriesId]`
- If the series ID is in the map, championship is automatically attached to the Match — no per-match manual tagging needed
- If the series ID is not in the map, `championship` stays `undefined` (bilateral series without a championship cycle)

#### How to onboard a new WTC cycle
1. ICC announces the series list at the start of each cycle
2. Make one API call to Cricbuzz to get the `seriesId` for each designated series
3. Add those ~27 entries to `CRICBUZZ_CHAMPIONSHIP_MAP`
4. Add a new `wtc-YYYY-YY` entry to `COMPETITIONS` and `COMPETITION_STANDINGS`
5. Every match in those series will automatically carry the championship — zero per-match work

---

## [1.0.21] 2026-07-03

### Real-data fragility audit — 8 bug fixes

#### Fixed — SpeedChip rendering "0 kmh" (`components/BallGIF.tsx`)
- `const speed = ball.ballSpeedKmh ?? 0` → guard: `if (!speed) return null`
- SpeedChip now simply doesn't render when speed data is absent, rather than showing "0 kmh"

#### Fixed — Chase calculation hardcoded to T20 (`lib/metrics.ts`)
- `const ballsLeft = 120 - ballsBowled` → `const ballsLeft = totalBallsForFormat(match) - ballsBowled`
- Imported `totalBallsForFormat` from `./winProb` (function also given `export` keyword in `winProb.ts`)
- Now format-aware: T20=120, ODI=300, Test=450

#### Fixed — Scorecard using `TEAMS` instead of `ALL_TEAMS` (`components/Scorecard.tsx`)
- `import { TEAMS }` → `import { ALL_TEAMS }`
- `TEAMS[innings.battingTeam]` → `ALL_TEAMS[innings.battingTeam]`
- `TEAMS` only contains franchise teams. International teams were returning `undefined`, breaking scorecard colours and names for any national match

#### Fixed — `truncatedMatch` innings[1] showing 0/0 when no balls (`components/MatchView.tsx`)
- When scrubbing to a point before 2nd innings starts, `truncBalls.length === 0`, but the second innings object was being built with computed `runs=0 / wickets=0 / overs=0`
- Fix: fall back to real `match.innings[1]` values when no balls exist for the truncated slice
- ScoreBar now shows the correct chasing team score even before any 2nd innings balls are loaded

#### Fixed — LineupsCard positional innings broken for visiting-team-bats-first matches (`components/LineupsCard.tsx`)
- `match.innings[0]` / `match.innings[1]` replaced with `.find(i => i.battingTeam === team.code)` / `.find(i => i.battingTeam !== team.code)`
- Positional access breaks when the visiting team wins the toss and bats first; `battingTeam` lookup is always correct

#### Fixed — Insights leaking across matches (`components/MatchView.tsx`)
- `MOCK_INSIGHTS_V2` was imported directly and always shown regardless of any `insights` prop
- `MatchViewProps` now has `insights?: InsightV2[]`; component uses `insightsProp ?? MOCK_INSIGHTS_V2`
- Real data pages can pass `insights={[]}` or real insights; mock remains the default fallback
- Added `InsightV2` to type imports

---

## [1.0.22] 2026-07-03

### International match cards — national flag backgrounds

#### Updated — `components/SplitTeamBg.tsx`
- Added `FLAG_ISO` map: national team code → ISO 3166-1 alpha-2 code (16 nations: IND→in, AUS→au, ENG→en, PAK→pk, SA→za, NZ→nz, WI→jm, SL→lk, BAN→bd, AFG→af, ZIM→zw, IRE→ie, SCO→gb-sct, NAM→na, UAE→ae, NED→nl)
- When both teams are `type === "national"`: renders two `<img src="https://flagcdn.com/w320/{iso}.png">` as split backgrounds with `desaturate(60%)` CSS filter
- Franchise matches: unchanged — dual-colour gradient as before
- Readability scrim: `rgba(0,0,0,0.52)` for flag backgrounds; `rgba(0,0,0,0.45)` for franchise
- Watermark text colour: `rgba(255,255,255,0.18)` for flags; team `secondaryColor` for franchise

---

## [1.0.23] 2026-07-03

### Removed format / tour / team filter chips from homepage

#### Updated — `app/page.tsx` (complete rewrite of filter logic)
- Removed: `FilterBar` component import + render
- Removed: `FILTERS`, `ALL_TEAMS`, `ALL_COMPETITION_NAMES` state + imports
- Removed: `filterMatches()` function, animation orchestration for filter transitions
- Removed: `displayedPast` / `displayedFuture` animated state
- Result: homepage header is now just logo + "Bawler" title — no filter UI
- Match lists render all matches directly (`pastList`, `futureList`) without any filter layer

**Reason:** Filter chips (FORMAT / TOUR / TEAM) added UI complexity with no product value at current scale. When real data lands and match volume grows, a search/filter pattern will be re-introduced appropriately.

---

## [1.0.24] 2026-07-03

### Bilateral series status chip on LiveCarousel

#### Updated — `lib/types.ts`
- Added `seriesStatus?: string` to `Match` interface — one-line bilateral series summary (e.g. `"AUS lead 1-0 · 5-match T20I series"`)

#### Updated — `lib/mockData.ts`
- Added `seriesStatus` to two live bilateral matches:
  - `ind-aus-t20i-2026-m2-live`: `"AUS lead 1-0 · 5-match T20I series"`
  - `eng-sa-test-2026-d3-live`: `"Series level 1-1 · 3-match Test series"`

#### Updated — `components/LiveCarousel.tsx`
- Condition changed: `{activeComp && (...)}` → `{(activeComp || activeMatch?.seriesStatus) && (...)}`
- When `seriesStatus` exists: renders a pill chip with cricket-stumps SVG icon + status text, in same row as TABLE button (when applicable)
- Bilateral international matches now show one-line series context below the live card without needing standings data

---

## [1.0.25] 2026-07-03

### Multi-competition standings table

#### Rewritten — `app/table/page.tsx`
- Was: IPL 2026 standings only, hardcoded header "IPL 2026"
- Now: 8 competitions in a horizontal tab selector
- Competitions: IPL · PSL · BBL · The Hundred · SA20 · ICC T20 World Cup · ICC Champions Trophy · WTC
- `DISPLAY_ORDER` array controls tab ordering
- `COMP_LABELS` maps competition ID → display name + qualifier text (e.g. "Top 4 qualify", "Top 2 qualify")
- `StandingsTable` component handles all column variants: NRR (franchise), PCT (WTC), Drawn (WTC)
- Header: "Table" + "All competitions" subtitle

---

## [1.0.26] 2026-07-03

### Platform-wide franchise league rename (IPL → franchise-agnostic)

#### Updated — `lib/types.ts`
- `iplStats?: FormatStats` → `franchiseStats?: FormatStats`
- Added `franchiseLeague?: string` — stores which league (e.g. `"IPL"`, `"PSL"`, `"BBL"`) per player

#### Updated — `lib/mockData.ts`
- All 13 player objects: `iplStats:` → `franchiseStats:` + `franchiseLeague: "IPL"`

#### Updated — `components/PlayerProfileView.tsx`
- `FormatKey`: added `"franchise"` in place of `"ipl"`
- Tab array: `["test", "odi", "t20i", "franchise"]`
- Tab label: renders `player.franchiseLeague ?? "Franchise"` for the franchise tab (e.g. "IPL" for Kohli, "BBL" for a future Australian player)
- Stats read: `player.iplStats` → `player.franchiseStats`

#### Updated — `app/layout.tsx`
- Meta description: `"IPL match companion with predictions..."` → `"All cricket, every ball, visualized — live scores, ball-by-ball replays, win probability and player stats across every format."`

#### Updated — `lib/transformers.ts`
- All three transformer functions (`transformCricbuzzMatch`, `transformESPNMatch`, `transformSRMatch`): `iplStats:` → `franchiseStats:`

---

## [1.0.27] 2026-07-03

### Fix franchiseStats corruption in mockData.ts + transformers cleanup

#### Fixed — `lib/mockData.ts` (data corruption repair)
- Previous Python `re.sub` used `\1` in a plain string, which resolved to ASCII SOH (0x01) rather than a backreference — causing `franchiseStats:` property key to be silently swallowed
- Result was 13 lines of form: `franchiseLeague: "IPL",\x01   { matches: ... }` — invalid TypeScript
- Fix: replaced the 13 SOH chars directly (`str.replace(SOH_PATTERN, correct_string)`)
- All 13 player `franchiseStats` objects now correctly structured with both `franchiseLeague` and `franchiseStats` keys

#### Verified — `npx tsc --noEmit` passes, `npx next build` passes

---

## [1.0.28] 2026-07-06

### Matchup Card — matches, live 4s/6s, label-value format, always-on dynamic stats

#### Updated — `lib/types.ts`
- `MatchupStats` now includes `matches: number` — career H2H encounter count

#### Updated — `lib/mockMatchups.ts`
- All 44 H2H records updated with realistic `matches` counts (range 2–14 per format)
- All `dangerDelivery` strings rewritten in plain English (removed cricket jargon)

#### Updated — `components/MatchupCard.tsx`
- **New props**: `liveBalls`, `liveRuns`, `liveOuts`, `liveDots`, `liveMatchFours`, `liveMatchSixes`
- All stats (BALLS / RUNS / OUTS / Avg / SR / Dots / 4s / 6s) now show career H2H + current match totals merged — fully live
- Row 3 label-value format: `matches-N 4s-N 6s-N Avg-N SR-N Dots-N%`
- Row 4: `Watch for: [delivery]` on its own line
- First-time meeting with no career data still shows stats from ball 1 onward ("making history right now")

#### Updated — `components/MatchView.tsx`
- `liveMatchupCounters` useMemo tracks balls/runs/outs/dots/4s/6s between current batter+bowler in this match
- Legal delivery logic: only wides excluded from balls faced; no-balls count correctly
- Counters fed into `MatchupCard` as props — updates on every delivery

---

## [1.0.29] 2026-07-06

### Partnership Tracker — replaces win-prob footer below ball visualizer

#### Updated — `components/BallGIF.tsx`
- **Removed**: Win probability bar from ImpactFooter
- **Added**: `PartnershipFooter` — single-row display:
  - `Pship N(B) · BatterA N(B) [X×4] [X×6] · BatterB N(B) [X×4] [X×6]` — total + individual batters
  - Partnership 4s pinned to right: `N 4s  N 6s`
  - Batter runs shown in batting team primary color
- **New props**: `partnership?: PartnershipInfo` (replaces `winProbBefore/After`)

#### Updated — `components/MatchView.tsx`
- `partnershipInfo` useMemo: scans current innings balls back to last wicket, accumulates per-batter runs/balls/4s/6s
- **Fix 1 — Non-striker run-outs**: if ball after a run-out wicket has same `batterName`, partnership NOT reset (striker survived)
- **Fix 2 — No-ball ball count**: `isFaced = extraType !== "wd"` — wides excluded, no-balls correctly counted
- Total partnership 4s/6s computed and passed through
- `winProbBefore/After` props removed from BallGIF call

#### Updated — `lib/mockData.ts`
- IND 2nd innings balls (overs 14–17): `batterName` patched to alternate R Pant / V Kohli with realistic strike rotation, enabling live partnership demo

---

## [1.0.30] 2026-07-06

### Win probability chase formula — major accuracy fix

#### Fixed — `lib/winProb.ts`

**Root cause**: two compounding bugs in the 2nd-innings chase formula inflated the bowling team's win probability:

1. `achievableRPO = 8.5 + (wicketsLeft - 5) * 0.4` — linear, so 4 wickets in hand only gave 8.1 RPO (barely above a 5.73 RRR, making the chase look close when it wasn't)
2. `wpTeamA = 1 - wpTeamB * wicketPenalty` — applied a SECOND separate `wicketPenalty = max(0.3, wicketsLeft/10)` on top, halving the chasing team's probability again

**Effect**: IND needing 21 off 22 balls with 4 wickets showed AUS 69% / IND 31% — completely wrong.

**Fix**: single power-curve achievable RPO, no separate multiplier:
```typescript
const baseRPO = /* 9.5 T20/T20I, 8.0 ODI, 3.5 Test */;
const achievableRPO = baseRPO * Math.pow(wicketsLeft / 10, 0.25);
const ratio = achievableRPO / rrr;
const wpTeamB = 1 / (1 + Math.exp(-(ratio - 1) * 5));
wpTeamA = 1 - wpTeamB; // no second penalty
```

**Calibrated results**:
| Scenario | Before | After |
|---|---|---|
| Need 21 off 22, 4 wkts | AUS 69% / IND 31% | AUS 17% / IND 83% ✓ |
| Need 50 off 22, 4 wkts | AUS ~50% / IND ~50% | AUS 90% / IND 10% ✓ |
| Need 10 off 22, 4 wkts | AUS ~30% / IND ~70% | AUS ~0% / IND ~100% ✓ |
| Need 21 off 22, 2 wkts | AUS ~80% / IND ~20% | AUS 37% / IND 63% ✓ |
| Need 21 off 22, 8 wkts | AUS ~50% / IND ~50% | AUS 6% / IND 94% ✓ |

**Scope**: fix applies platform-wide — `calculateWinProbForMatch()` is the single source of truth consumed by MiniWinProb, WinProbChart, and all win-prob display everywhere.

---

## [1.0.31] 2026-07-06

### API robustness — name normalisation at data boundary

#### Updated — `lib/transformers.ts`
- **New**: `normaliseName(raw: string): string` — exported utility normalising any API name format to `"I Surname"`:
  - `"Virat Kohli"` → `"V Kohli"`
  - `"kohli, virat"` → `"V Kohli"` (comma-last format)
  - `"V. Kohli"` → `"V Kohli"`
  - Single names passed through unchanged
- Applied at every API boundary: ESPN `transformESPNBall`, Sportradar `transformSRBall`
- Ensures partnership tracker, matchup card lookup, and player links all use consistent names regardless of which API feeds the data
- `batsman_name?` / `bowler_name?` fields added to `SportRadarRawBall` interface

---

## [FUTURE] Digest — W/4/6 stat chip player reveal

### Planned — `components/DigestTab.tsx`

- Tapping the **W**, **×4**, or **×6** stat chips on a digest card (OverGroupCard / SessionCard) reveals the player(s) behind the number — who got out, who hit the six, who found the boundary
- Each entry shows the player's **photo**, **name**, and the **over it happened** (e.g. "Ov 14.3")
- For wickets: also show dismissal type (Caught, Bowled, LBW, etc.)
- Dismissed with a tap outside or a close button

### Blocked by

- No player image source in the data layer yet — `PlayerProfile` in `types.ts` has no `photoUrl`
- Wire in a player image CDN first (ESPN Cricinfo headshots, ICC media, or self-hosted), add `photoUrl?: string` to `PlayerProfile`, populate through the transformer, then build this

---

## [1.0.35] 2026-07-07

### Digest tab — initial build (over-by-over cards, compact layout, real-data hardening)

#### Added — `components/DigestTab.tsx` (new file)
- New 4th match page tab: **Digest** — story-of-the-match told through over/session cards
- Format-adaptive grouping:
  - T20 / T20I / Hundred → 1 card per over
  - ODI → 1 card per 5 overs
  - Test (no sessions) → 1 card per 10 overs (fallback)
- Each card: 3-row layout (header row + narrative row + over-summary row)
  - **Row 1**: over label + runs / wickets / 4s / 6s chips; ball-dot row for T20/T20I
  - **Row 2**: compact factual narrative ("Bumrah strikes", "Big over — 18 runs", etc.)
  - **Row 3**: creative 1-2 line over-summary with cricket flavour
- `pickKeyBall()` — selects wicket > six > four > max-runs as the key delivery per group
- `buildNarrative()` — format-aware short description (span label varies: "over" / "block" / "session")
- `buildOverSummary()` — punchy 1-2 line creative description per over
- `dominantBowler()` — picks bowler with most wickets then most balls in the group
- Newest cards shown first (reversed chronological order)

#### Updated — `components/MatchView.tsx`
- `showDigest = allBalls.length > 0 && !isUpcoming` — DIGEST tab only visible when ball data exists
- Tab order: `["live", "scorecard", ...(showDigest ? ["digest"] : []), "info", ...(showTable ? ["table"] : [])]`
- `allBalls = match.innings.flatMap(i => i.balls)` — collects balls from all innings

#### Updated — `lib/transformers.ts`
- **New**: `normalizeBall(raw, defaults)` — normalises any raw API ball into the internal `Ball` type; handles missing fields gracefully
- **New**: `legalBalls()`, `wickets()`, `boundaries()` helper extractors
- Applied `normalizeBall` in `transformESPNBall` and `transformSRBall`
- Ensures DigestTab receives clean, type-safe ball objects from any API source

---

## [1.0.36] 2026-07-07

### Digest — Test match session cards + Day Stumps summary card

#### Updated — `lib/types.ts`
- Added `TestSession` type: `{ day: number; session: "first" | "second" | "third"; label: string; startOver: number; endOver: number; isComplete: boolean }`
- Added `sessions?: TestSession[]` to `Innings` interface — optional, falls back to auto-derivation

#### Updated — `lib/mockData.ts` (Test match)
- Added 512 balls of ball-by-ball data to the IND vs ENG test match (`ind-eng-test-2026-d3-live`):
  - **Innings 2** (ENG 1st): 348 `test2-*` balls (overs 1–58), covering Day 2 1st Session (overs 1–28) and Day 2 2nd Session (overs 29–58) — ENG all out for 199
  - **Innings 3** (ENG 2nd/follow-on): 164 `test3-*` balls (overs 1–28), covering Day 3 1st Session — ENG on 88/4, live
- `sessions` metadata added to each innings with correct `day`, `session`, `label`, `startOver`, `endOver`, `isComplete` fields

#### Updated — `lib/transformers.ts`
- **New**: `deriveTestSessions(innings, balls)` — auto-detects session boundaries from timestamp gaps (> 60 min gap = new session; > 720 min = new day) when `sessions` metadata is absent from the data
- Fallback means the DigestTab works for Test matches even when the API does not supply session structure

#### Rewritten — `components/DigestTab.tsx` — Test session support
- `buildTestSessionCards()` — builds one `SessionCard` per session entry in `inn.sessions` (or derived sessions if absent)
- Each `SessionCard` contains: session label, day number, innings label, over range, runs/wickets/4s/6s, narrative, over-summary, and a `isLiveSession` flag for the in-progress badge
- `buildDayReport()` — at the end of each completed day, generates a `DaySummaryCard`:
  - 5–7 line detailed day report: runs scored, wickets taken, key batters, best bowlers, session-by-session breakdown
  - Styled distinctly with cyan border to visually separate from per-session cards
- `buildCards()` — top-level dispatcher: routes to `buildTestSessionCards` for Test, `buildOverGroupCards` for all other formats; always prepends match summary card (when available)

---

## [1.0.37] 2026-07-07

### Digest — Day filter chips (Test) + expanded Day Summary card

#### Updated — `components/DigestTab.tsx`
- **Day filter chips** — rendered above session cards when `availableDays.length > 1`:
  - Pill buttons: "Day 2", "Day 3", etc. in cyan when active, dim border when inactive
  - Clicking a day shows only that day's session cards + day-summary card
  - Match summary card always pinned regardless of selected day
  - Default = latest day with data (so a live Day 3 match opens on Day 3 automatically)
- **Expanded Day Summary card** — fully informative 5-7 line report:
  - Header: "Day N Stumps" with cyan accent + stumps emoji
  - Session breakdown table: each session's runs/wickets inline
  - Narrative lines covering: top scorer with dismissal, top bowler, key innings context, phase-of-play notes
  - Styled with cyan/20 border + cyan/6 header background to visually stand out

---

## [1.0.38] 2026-07-08

### Digest — Shareable cards + innings chips (T20/ODI) + post-match summary card + MOM avatar

#### Updated — `components/DigestTab.tsx`

**Shareable cards**
- Each digest card now has a `<ShareButton>` in its bottom-right corner
- Tapping captures the card as a PNG via `html-to-image` (`toPng`, 2× pixel ratio, transparent-to-dark background)
- `navigator.share()` used when available (mobile PWA); falls back to `<a download>` PNG export on desktop
- `data-digest-card` attribute on each card root allows the share button to capture the correct element
- `AbortError` silently swallowed (user cancelled share sheet)

**Innings chips (T20 / ODI / non-Test)**
- `InningsChips` component — rendered above over-group cards when both innings have data (`availableInnings.length > 1`)
- Pills: "1st Innings", "2nd Innings" in cyan when active; tapping switches the filtered view
- Default = latest innings with ball data (2nd innings for a completed match; 1st if only 1st is done)
- Match summary card always pinned regardless of selected innings

**Removed — digest card navigation**
- Tapping a digest card no longer navigates to the Live tab
- Cards were navigating to the Live tab showing the key ball — UX was confusing; sharing is more valuable
- `onSelectBall` prop removed from DigestTab; share replaces it

**Post-match summary card (end-of-match digest)**
- `buildMatchSummaryCard()` — generates a rich pinned card at the top of the Digest tab for any match with a `result` field
- Card contains:
  - Winner announcement + margin (e.g. "KKR won by 4 wickets")
  - Top batter highlight: name, runs, balls, boundaries — from innings 1 batting card
  - Top bowler highlight: wickets/runs/economy — from all innings bowling cards combined
  - Chase story (non-Test): top chaser's runs or "fell N short" narrative
  - Man of Match: name
  - Series status: bilateral series chip if `match.seriesStatus` is set
  - Narrative bullet list (up to 6 lines): auto-generated from match data
- Styled distinctly: larger card, `bg-surface-2/80` with `backdrop-blur-sm`, left accent bar in winning team color

**MOM avatar in summary card**
- Man of Match entry in the summary card shows a player avatar:
  - Attempts to load `player.photoUrl` from `PLAYERS` lookup
  - Falls back to initials avatar (2-letter initials in a team-colored circle) — same visual language as BallGIF PlayerAvatar
  - `slugifyPlayer()` used to resolve MOM name to a player profile slug for the PLAYERS lookup

---

## [1.0.39] 2026-07-08

### AUS vs IND T20I — ball data restoration + platform state restore

#### Context — Revert
- A subsequent session added pitch reports for international venues but introduced a file truncation bug that deleted ~13,800 lines from `mockData.ts`, removing all ball data and digest functionality
- Platform reverted via `git reset --hard 5333611` + `git push --force` to restore the complete 15,215-line `mockData.ts`

#### Restored — `lib/mockData.ts`
- `ind-aus-t20i-2026-m2-live` match confirmed intact with full ball data:
  - **Innings 1** (AUS batting): 120 balls `ia-1-*` (overs 1–20 complete; D Warner debut ball, full pace attack, AUS 175/8)
  - **Innings 2** (IND batting): 98 balls `ia-2-*` (overs 1–17 live; Kohli 61*, Pant 5*, IND need 34 off 22)
  - Both innings have `battingCard` and `bowlingCard` arrays
- `ind-eng-test-2026-d3-live` match confirmed intact with 512 balls across innings 2 and 3
- `FEATURED_MATCH` (KKR vs MI `ipl2026-m37-kkrvmi`) confirmed intact with full scripted ball data from `buildInnings1()` / `buildInnings2()`

---

## [1.0.40] 2026-07-08

### Fix: match summary card shown for live matches with result; IND vs ENG test match ID corrected

#### Fixed — `components/DigestTab.tsx`
- `buildMatchSummaryCard()`: condition changed from `match.status !== "post-match" || !match.result` → `!match.result`
- **Root cause**: The `FEATURED_MATCH` (KKR vs MI) intentionally has `status: "live"` to remain in the live carousel even though the match is over — it has a full `result` object. The old guard silently dropped the match summary card for every navigable match.
- **Effect**: The end-of-match digest card now appears at the top of the KKR vs MI Digest tab showing the full post-match report: KKR won by 4 wickets, top batter/bowler highlights, MOM (Andre Russell), series status.

#### Fixed — `lib/mockData.ts`
- Test match ID renamed: `eng-sa-test-2026-d3-live` → `ind-eng-test-2026-d3-live`
- **Root cause**: The match was using `COMPETITIONS.indEngTest2026` (India tour of England 2026, teams ENG + IND) but the ID string incorrectly said "eng-sa" (England vs South Africa) — a copy-paste error from a different match object
- **Effect**: Match URL is now `/match/ind-eng-test-2026-d3-live`, consistent with competition and team data; avoids confusion when reading match IDs

