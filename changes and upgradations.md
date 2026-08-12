# Changelog

All notable changes to Bawler are documented here.
Format: `[version] YYYY-MM-DD — description`

## [1.0.192] 2026-08-12

### Home featured "For You" card: fixed live-match short-circuit blocking the upcoming pick

- `app/page.tsx`: removed a single early-return in `forYouResult` that made *any* qualifying live match anywhere in the pool (other than the hero) suppress the entire upcoming-featured-card computation, even when that live match belonged to a different followed nation's own, unrelated, genuinely upcoming fixture. This is why the card previously only ever appeared for exactly one followed nation, and even then only for some nations (Australia/South Africa worked by accident since their live-match status happened to avoid the early return; India/England tripped it via an unrelated live India-vs-England Test). The live-badge pool and the upcoming pick are now computed fully independently; a followed nation's own live fixture still can never populate the slot, since it structurally isn't a member of the upcoming pool.
- `lib/followPrefs.ts`: added `getFeaturedForYouReason()`, used only by the featured card, rendering "Because you follow {A} and {B}" (no "both") when both sides of a match are followed. The inline "For you" tag's existing `getForYouReason()` keeps its original "both A and B" wording unchanged for its own callers — extracted a shared `resolveForYouReason()` helper parameterized by a `join` callback so the two outputs can differ without duplicating the team>nation resolution logic.
- Verified with screenshots + matching `localStorage` state for all six originally-reported cases, plus all-5-nations, opponents-in-same-match, two-unrelated-matches, and order-independence scenarios, plus a full real-onboarding-flow run. Full regression pass: inline "For you" tag, live-match hero banner, Filter modal's 4 tabs, 5-team onboarding flow, Coming Up list ordering/dedup, and all three v1.0.191 fixes confirmed intact. Zero console errors throughout.

## [1.0.191] 2026-08-12

### Three precise UI fixes: Moments-card sharing removed, current-batters/bowler row forced plain white, duplicate ground/city text removed from Pitch Report

- `MomentsStrip.tsx`: removed the share icon (and its click handler + the story-card capture/preview it opened) from every card in the Live tab's MOMENTS row, across every match and format. `MatchView.tsx`'s `handleMomentShare` callback and the `onShare` prop passed into `MomentsStrip` were removed. The shared `triggerShare`/`ShareCard` mechanism is untouched and still powers `BallGIF`'s and `MatchupCard`'s own separate share buttons; the onboarding persona-reveal's "Share" button is untouched. Event-detection logic behind the Moments cards is untouched.
- `MiniInsightsBar.tsx`: the current-batters/bowler chip row (directly under the score header) no longer turns green at 50 runs or cyan at 2 wickets — all three chips now render plain white (`text-text-primary`) unconditionally. The milestone/wicket detection logic itself is untouched. The PSHIP line, the matchup card, and the Score tab's own coloring are separate mechanisms and were confirmed unchanged.
- `PitchReportCard.tsx`: removed the `{venue.name}, {venue.city}` line from the card header — redundant with the Info tab's Date & Time card, which remains the single place this shows. `InfoTab.tsx`'s call site updated to match; no leftover gap in the card.
- Verified with real screenshots: zero share icons across four live matches (T20I, Test, IPL, PSL), with `BallGIF`'s own share icon confirmed still present; tapping the former icon location just selects the ball, no console error. Plain-white batters/bowler row confirmed at the exact moment two batters had passed 50 and a bowler had 2 wickets (PSL match), plus a second live T20I example — PSHIP line and Score tab retained their own coloring unchanged in the same screenshots. Pitch Report venue/city line confirmed absent (no gap) on a pre-match, a live match, and a completed match, with the Date & Time card still showing venue on all three. Full regression pass (Filter modal 4-tab layout, fresh onboarding run, quiz feedback, persona auto-advance, tab-switching, homepage transition) reconfirmed intact. Zero console errors throughout.

## [1.0.190] 2026-08-12

### Two independent fixes: Filter modal down to 4 tabs (UI-only); onboarding's "LIVE RIGHT NOW" interstitial deleted

- `FollowSheet.tsx`'s "Follow your cricket" modal: removed the Series and Formats tabs from `CATEGORY_META`, leaving exactly Nations, Tournaments, Teams, Players. UI-only — `followPrefs.series`/`.formats`, `DEFAULT_FALLBACK_FORMATS`, `applyOnboardingFallbackIfNeeded()`, and `qualifyMatch()`'s format/series matching are all untouched; any already-stored values keep working exactly as before, just inert/inaccessible through this sheet until the tabs are reintroduced. `totalSelected`'s badge sum narrowed to the 4 visible categories. Grep-confirmed no deep link or shortcut anywhere else in the app pointed specifically at the removed tabs.
- Onboarding's team-picker: deleted the "LIVE RIGHT NOW" interstitial (`TeamMomentCard.tsx`, plus `getTeamMoment()`/`TeamMoment` in `lib/onboardingTeams.ts`) that used to appear after following a team with a live/upcoming/recent match, before advancing to the next card. `handleFollow()` now calls `advanceOrFinish()` directly, exactly like `handleSkip()` already did — following or skipping any team, regardless of live-match status, always shows the next card immediately, or the player picker after the 5th.
- Confirmed untouched: the player-picker's own separate live-match nudge, the persona reveal's auto-advance, and `FirstSessionQuest`'s "Open a live match" quest gating (still driven only by real navigation into a live match from Home).
- Verified with real screenshots: Filter modal's exact 4-tab order; onboarding following a live team (India) and a non-live team (England) both advancing directly to the next card with no interstitial; full 5-team walkthrough with an accurate "X of 5 teams" counter throughout, landing in the player picker. Zero console errors across the full pass.

## [1.0.189] 2026-08-12

### "Select more" nudge: full live re-verification against a second diagnostic round, shipped

- A further live check after v1.0.188 still showed the nudge's `seenNudge` flag already `true` with nothing visible in that run's screenshot. Redeployed temporary diagnostics a second time to confirm whether this was a new defect or the same disclosed "checked after it already auto-dismissed" timing pattern already named in v1.0.187/v1.0.188 — confirmed the latter, with `homeVisitCount` consistently reading `"1"` (no regression to the v1.0.188 fix).
- Ran three fresh-`localStorage.clear()` end-to-end scenarios with screenshot evidence: full completion, skip from the very first screen, and a mixed answered/skipped run. Popup appeared above the Filter tab in all three.
- Reconfirmed all three dismissal paths (tap Filter, tap elsewhere, 6s auto-dismiss) and reload-persistence; zero console errors across the full pass.
- Removed both rounds of temporary diagnostic `console.log` instrumentation from `app/page.tsx` and `components/SelectMoreNudge.tsx` — grep-confirmed clean.

## [1.0.188] 2026-08-12

### Fix: "Select more" nudge visit-counter off-by-one (+ same-bug audit)

- `bawler:homeVisitCount` was reading 2 after a single genuine first Home visit — caused by `registerHomeVisit()` also counting the fleeting, unavoidable pre-onboarding-redirect mount every brand-new user's first `"/"` hit causes. Fixed by gating its call site in `app/page.tsx` behind the same `isBooting || redirectPending` check the "Select more" coachmark's own effect already used.
- Same bug silently shortened the existing "Follow a team..." empty-state nudge's visible window from 3 real sessions to 2 for onboarding users — fixed by the same change (it shares the same counter).
- Investigated a report that the "Select more" popup itself never renders — could not reproduce against the actual shipped code; live instrumented traces showed it reliably mounting and rendering correctly, just ~1-2s after the click that finishes onboarding rather than instantly. No change made to the popup's own logic.
- Audited `FirstSessionQuest.tsx` ("Get Started" checklist) for the same exposure: unaffected, since it has no visit-counting logic at all.

## [1.0.187] 2026-08-12

### Onboarding cut to 5 teams, rival-question step removed, new "Select more" Home coachmark

- Team-picker deck reduced from 16 teams to exactly 5 national sides — India, Australia, England, New Zealand, South Africa, fixed order (`lib/onboardingTeams.ts`). Counter reads "X of 5 teams" automatically. No IPL franchises in onboarding anymore; that's handled afterward via Filter.
- The "Who do you love to hate?" rival-question step is removed entirely (`RivalPrompt.tsx` deleted). The unrelated "LIVE RIGHT NOW" inline nudge card is untouched.
- `followPrefs.rivalTeam` had zero downstream consumers (grep-confirmed) — removed the whole mechanism (field, sanitizer, equality check), not just the step that populated it.
- Onboarding progress bar still shows exactly 3 segments (team/player/quiz) — the rival step was always an internal sub-phase, never its own segment.
- New one-time "Select more" coachmark (`components/SelectMoreNudge.tsx`) above the Filter tab, shown 800ms after a device's first-ever Home arrival post-onboarding (however onboarding was exited), gated by a dedicated `bawler_seen_select_more_nudge` flag set at show-time. Reuses v1.0.186 card tokens at a new 14px radius. Fully non-blocking — dismisses on tapping Filter (which still opens normally), tapping elsewhere, or after 6s untouched.

## [1.0.186] 2026-08-11

### Onboarding visual overhaul: translucent cards, rounder corners, and a real auto-advancing persona reveal

- Shared design tokens (`app/globals.css`) applied across every onboarding screen: translucent blurred cards (24px radius), blurred rows (18px radius) for quiz answers and player-picker rows, 20px pill buttons, 44px tinted circular icon buttons, per-team glow ring on the team-picker card.
- Fixed the real layout bug behind the "empty space at top" report: `BottomNav`'s fixed height wasn't reserved in the onboarding flow's centered content box, and each step's header/Skip row was centered along with the card instead of pinned above it.
- Quiz answers hold a real 200ms selected state (border + checkmark) before advancing to the next question.
- Persona reveal: removed the forced "Continue" tap. Auto-advances 2.5s after render via the same navigation Continue used to trigger, with a filling progress bar; tapping the card skips immediately; tapping Share pauses the timer for the share's duration and always restarts it fresh afterward, never resumed. Rebuilt the timer implementation twice after live testing found real bugs (a CSS-animation version that never actually progressed, then a `requestAnimationFrame` version that fully stops in backgrounded tabs) — shipped version uses `setTimeout`/`setInterval` with `Date.now()`-based elapsed time.
- New `components/onboarding/PersonaIcon.tsx`: hand-drawn inline SVGs for the persona badge icon, since no icon-class library exists in this codebase; full persona-to-icon mapping disclosed to the user rather than finalized silently.

## [1.0.125] 2026-07-28

### New: "Your Players" homepage strip -- favourites + honest live-status sort

#### Context
- Feature request: a horizontally scrollable chip strip on the homepage, directly below Spotlight and above Past/Coming Up -- one chip per player selected in the Filter sheet's "Players" tab. Renders nothing (no heading, no placeholder) when zero players are selected. Tapping a chip opens that player's profile. New favourite star toggle on the player profile header, which auto-adds the player to the followed selection if not already there. Sort: favourited+live, favourited, live, everyone else -- alphabetical by surname within each tier -- and "currently live" must recompute reactively, never go stale.

#### Design decision -- rejected signal
- `Innings.battingCard`/`bowlingCard`'s `out`/`onStrike` fields looked like the obvious "who's at the crease" source, but direct inspection confirmed they represent the END-OF-INNINGS aggregate and leak through `MatchView.tsx`'s live-ticking `truncatedMatch` unchanged -- the exact same leaked-future-state bug class just fixed in v1.0.124. Not used.

#### New -- `lib/playerActivity.ts`
- `getLiveActivePlayerIds(matches)` -- derives "currently batting/bowling" from the LAST ball in `match.innings.flatMap(i => i.balls)` for `status === "live"` matches only (same flattening `MatchView.tsx`'s own `allBalls` uses). A live match with no recorded balls contributes nothing -- no guessing. Reuses `lib/mockData.ts`'s existing `resolvePlayerSlug()` for the same batterId/bowlerId-vs-registry-slug ID mismatch `lib/playerForm.ts` already solved.
- `liveActivitySignature(matches)` -- field-based signature (`matchId:status:lastBallId` joined) for correct `useMemo` dependencies, per the v1.0.109 replace-not-mutate contract.

#### New -- `lib/playerFavourites.ts`
- Second localStorage store (`bawler:favouritePlayers`), same shape as `lib/followPrefs.ts`. `toggleFavouritePlayer(id)` -- favouriting always adds the player to `FollowPrefs.players` if absent; un-favouriting never removes the follow (one-way linkage, per spec).

#### New -- `lib/yourPlayers.ts`
- `getYourPlayers(followedIds, favouriteIds, liveMatches)` -- pure 4-tier sort function, no localStorage/React dependency. Surname key via the existing `lib/playerName.ts`'s `parsePlayerName().surname`, never the raw "V Kohli" display string.

#### New -- `components/YourPlayersStrip.tsx`
- Exported `useYourPlayers(liveMatches)` hook (same "exported private hook" precedent as `usePlayerFormState`/`useScheduleTab`/`useMatchAccentColors`) -- subscribes to both `followPrefs` and favourites `CHANGE_EVENT`s, memoized on primitive field-derived signature strings, not array/object identity. Renders `null` outright at zero entries.

#### Changed -- `app/page.tsx`
- New `<YourPlayersStrip liveMatches={ALL_LIVE_MATCHES} />` after the Spotlight section, inside the existing `isBooting`-gated fragment.

#### Changed -- `components/PlayerProfileView.tsx`
- New favourite star toggle in the sticky header (amber-filled when favourited), synced from/through `lib/playerFavourites.ts`.

#### Verified
- `npx tsx`, `react-test-renderer` (`--no-save`, removed after), 32/32 pass: zero/one/many players, a deliberately disambiguating surname-sort pair ("A Russell" vs "Z Crawley" -- initial-order and surname-order disagree), live/non-live mix, favourited/non-favourited mix, all 4 tiers simultaneously in exact required order, empty-balls live match (honest zero), post-match-status match with real balls (correctly inert), and a `react-test-renderer` re-render proving the sort/live-flag updates on the SAME mounted instance when `liveMatches` changes -- no remount required -- plus the favourite-auto-follow linkage firing reactively via the `CHANGE_EVENT` subscription. `git diff --stat`: 4 new files, 2 modified. `tsc --noEmit`/`npm run build` clean.

## [1.0.124] 2026-07-28

### Fix: Digest showed a premature "FULL TIME / won by X" verdict for a genuinely in-progress chase

#### Context
- Live bug on `ipl2026-m37-kkrvmi` (MI vs KKR): while KKR was genuinely still batting mid-chase (LIVE tab: "need 49 off 41 balls"), Digest's match-summary card simultaneously read "T20 · FULL TIME -- KKR won by 4 wickets" AND "KKR fell 49 short" -- two contradictory verdicts for the same current moment, from two different data sources disagreeing with each other.

#### Fixed -- `components/MatchView.tsx`
- `truncatedMatch` (the live-playback snapshot fed to every tab) was spreading `result` through from the untouched original match object unconditionally, even while `innings` were correctly truncated to the current simulated position. For a match kept at `status: "live"` forever with a permanently baked-in final `result` (`FEATURED_MATCH`, by design, for the homepage carousel), that meant the "final" result was ALWAYS present, at every point mid-chase. Now only passes `result` through once playback has genuinely caught up to the real end of the recorded ball data (or immediately for a match with no ball-by-ball data at all).

#### New -- `lib/matchStatus.ts`
- `isMatchConcluded(match)` -- the one shared "has this match genuinely finished" check every completion-dependent narrative platform-wide should use instead of independently inferring it from score/wickets/overs.
- `observableStateSupportsConclusion(match)` -- defense-in-depth cross-check for a normal two-innings limited-overs match: confirms the CURRENT observable innings state (target reached / all out / overs exhausted) actually backs up what `result` claims, before trusting a verdict. No opinion (trusts `result` alone) for Tests and anything without exactly two recorded innings.
- `isMatchConclusivelyOver(match)` -- combines both; what `buildMatchSummaryCard` now gates on.

#### Changed -- `components/DigestTab.tsx`
- `buildMatchSummaryCard` now checks `isMatchConclusivelyOver` FIRST (previously checked `match.result` truthiness before even looking at `isLive`). New `LiveSummaryCard` state -- shown while genuinely live and unconcluded, replacing what used to be no card at all: current scores plus, for a limited-overs chase in progress, the exact need/balls-left/RRR math `ScoreBar.tsx`'s own header already computes.

#### Audited, confirmed already correct, no changes
- `lib/teamSchedule.ts`, `components/ScheduleRow.tsx` -- both already gate on `match.status === "post-match"` before ever consulting `result`. `components/MatchCard.tsx`'s `PastMatchCard`/`SpotlightMatchCard` -- only ever fed already-past matches. `components/MomentStoryCard.tsx` -- no completion narrative at all. `DigestTab.tsx`'s own post-match-only card builders -- only invoked once genuinely finished.

#### Found, flagged, not changed
- `components/MatchCard.tsx`'s `liveStatusOf()` -- same anti-pattern, but confirmed dead code (zero call sites). `lib/playerForm.ts`'s `settledMatches()` -- reads the same raw, untruncated match array this bug's root cause lived in, for player recent-form stats (numeric, not a display narrative) -- flagged as a related follow-up candidate.

#### Verified
- `npx tsx`, 26/26 pass: genuinely completed chase (no regression), the exact reported bug case, failed chase both before/after result lands (all-out + overs-exhausted), the exact target-reached transition boundary, a Test in progress, a tie, an abandoned/no-result match, and a simulated live "loop" (FULL TIME -> reverts to in-progress -> FULL TIME again) confirming fresh recomputation, not freezing. `git diff --stat` shows exactly 2 files modified + 1 new file. `tsc --noEmit`/`npm run build` clean.

## [1.0.123] 2026-07-28

### Fix: win-probability fallback view was team-colored, out of sync with the platform-wide neutral-color decision

#### Context
- Live bug on `ipl2026-l2-rcbvcsk` and `ipl2026-l3-gtvrr` (both "ball-by-ball data unavailable" fallback matches): win prob shown as a team-colored split bar with team-colored percentage text ("56% CSK" in CSK yellow, "28% RR" in RR pink) -- the exact treatment v1.0.121 deliberately rejected for the main live view. That decision was applied only to `MatchupCard.tsx`; this separate fallback block in `MatchView.tsx` was never touched by it. A platform-wide audit found a second, previously-unreported instance of the same anti-pattern in `WinProbChart.tsx`'s full-screen modal header.

#### New -- `components/WinProbBadge.tsx`
- Single shared component for "leading team + win-prob %," `compact`/`large` variants (layout size only). Takes `label`/`pct`, never a color -- no caller can make it team-colored again.

#### New -- `lib/winProb.ts`
- `getLeadingTeamFromOverride(match, override)` -- same `{ label, pct } | null` contract as the existing `getLeadingTeamWinProb`, but derived from `Match.liveWinProbOverride` for matches with no ball-by-ball history at all.

#### Fixed -- `components/MatchView.tsx`, `components/WinProbChart.tsx`
- Both now render `<WinProbBadge>` instead of their own team-colored markup for the single-leading-team readout. `WinProbChart.tsx`'s two side-by-side team-colored comparison bars are unchanged (a different, intentionally dual-team display).

#### Changed -- `components/MatchupCard.tsx`
- Refactored to consume the new shared `<WinProbBadge>` instead of its own inline JSX (no visual change -- this was already the correct v1.0.121 reference implementation).

#### Audited, confirmed out of scope, no changes
- `components/MatchCard.tsx` (homepage `WinProbBar`/`LiveWinProbSpark`), `components/MomentStoryCard.tsx` (shareable moment cards), `components/DigestTab.tsx` (turning-point narrative) -- all intentionally show/narrate both teams for comparison, a different display concept from a single leader readout. Confirmed with product owner as a separate decision.
- `components/MiniWinProb.tsx`, `components/AIMetrics.tsx` -- confirmed dead code, not rendered anywhere.

#### Verified
- `npx tsx`, 12/12 edge-case tests pass for `getLeadingTeamFromOverride` (undefined override, team A/B leading, override's named team actually trailing in both directions, exact 50/50 tie, near-certain wins both directions, 0-100-scale tolerance, rounding, plus 2 regression checks on `getLeadingTeamWinProb`). `git diff --stat` shows exactly 4 files modified + 1 new file, matching confirmed scope. `tsc --noEmit`/`npm run build` clean.

## [1.0.122] 2026-07-28

### Fix: sticky header showed swapped team/score in Test matches with a follow-on

#### Context
- Live bug on `ind-eng-test-2026-d3-live`: header showed "ENG 450/8 vs 92/4 IND" -- India's first-innings 450/8 attributed to England, England's live follow-on 92/4 attributed to India. The Score tab already showed this correctly, isolating the bug to the header's own display composition.

#### Fixed -- `components/ScoreBar.tsx`
- The header's two score slots now render `lastInnA`/`lastInnB` (each team's own latest innings, looked up by `battingTeam`) instead of `i1`/`i2` (`innings[0]`/`innings[last]`, purely positional). `lastInnA`/`lastInnB` were already computed correctly in this file but never actually rendered -- the fix wires up code that already existed.
- `i1`/`i2` are kept for their other correct use in the same file (white-ball chase-context line, projected-score line), unchanged.

#### Verified
- `npx tsx`, 18/18 pass against constructed fixtures covering all 6 required states: white-ball either team batting first, normal 4-innings Test, follow-on enforced by either team (proving no hardcoded team-order assumption), early Test with only one team batted, declaration vs all-out, and a drawn/abandoned Test with no 2nd innings. `git diff --stat` shows exactly 1 file changed; `Scorecard.tsx` untouched. `tsc --noEmit`/`npm run build` clean.

## [1.0.121] 2026-07-27

### Win probability: emphasized in the matchup row, removed from the duplicate stat-chip pill

#### Context
- Win probability was rendering twice at once on the Live tab: a small "TEAM XX%" pill inline in `MiniInsightsBar`'s stat chips, and the matchup row directly beneath it. Consolidated into one location with real visual weight instead of patching either rendering site.

#### Removed -- `components/MiniInsightsBar.tsx`
- The win-prob chip (and the `winProbPoints`/`onExpandWinProb` props that only fed it) is gone. The `MiniChip.reverse` flag and its label-before-value rendering branch in `Chip()` were removed too -- that chip was the flag's only consumer, so it would have been dead code otherwise.

#### Changed -- `components/MatchupCard.tsx`
- Collapsed teaser row dropped its "tap for H2H" text label; the chevron icon alone is now the tap-to-expand-H2H affordance (tap targets themselves unchanged).
- Added an emphasized win-probability readout on the row's right side: small muted "WIN PROB" label above a larger, bold value ("IND 87%"). Fixed, plain white -- deliberately never team-colored (a team's real color can misread as "losing" when red-toned, can flicker distractingly in a close finish, and can collide across simultaneous matches sharing a fallback color). Own tap target, opens the same full-screen `WinProbChart` modal the old pill opened.
- Hidden entirely (not broken/blank text) when there's no real win-prob point yet.

#### New -- `lib/winProb.ts`
- `getLeadingTeamWinProb(match, points)` -- centralizes "who's leading and by how much," extracted from the old chip's inline logic. Returns `null` (not a fake 50/50) on an empty points array.

#### Verified
- `npx tsx`, 8/8 edge-case tests pass (empty points, team A/B leading, exact tie, multi-point uses only the last point, rounding, near-certain wins both directions). Checked against the longest real batter/bowler display-name pair in the mock dataset ("I Kishan" vs "V Chakravarthy", live `ipl2026-m37-kkrvmi` match) -- no crowding/overlap. `tsc --noEmit`/`npm run build` clean; `scripts/version-check.ts` passes; exactly 4 files changed.

## [1.0.120] 2026-07-27

### Player display names: centralized formatting utility, `lastName()` fragility resolved

#### Context
- Two confirmed display deviations (top stat pills surname-only, profile headers full-name) plus the underlying parsing fragility flagged much earlier in this project (naive last-space splitting breaking real multi-part surnames) -- fixed together as one centralized utility instead of patching display on top of unresolved parsing.

#### New -- `lib/playerName.ts`
- `parsePlayerName(raw)` / `formatPlayerName(raw)` -- the only sanctioned name-splitting/display logic in the codebase. Registry-first (PLAYERS `shortName` wins), then algorithmic derivation for anyone not registered: multi-word surnames/particles ("de", "van", "der", "von", "du", capitalized "Al"), suffixes ("Jr.", "III", stripped not rendered), hyphenated surnames (free via whitespace-only splitting), single-name players (no invented initial), inconsistent capitalization (fixed only when needed -- genuine mixed case like "McGurk" never mangled), stray whitespace, and "Surname, First" comma format.

#### Consolidated, not duplicated
- Removed `getPlayerShortName`/`nameToShortNameMap` from `lib/mockData.ts` (historical comment left in place).
- Found and folded in a second independent implementation, `normaliseName()` in `lib/transformers.ts`'s API-ingestion boundary (same fragility, plus comma-format handling) -- absorbed into `parsePlayerName`; `normalizeBall()` now calls `formatPlayerName` directly. Fixed `transformSportRadarPlayer`'s `shortName` field (was a bare last-token guess).

#### Migrated -- ~15 real display call sites
- `MiniInsightsBar.tsx` (top pills), `PlayerProfileView.tsx` (profile header), `Scorecard.tsx` (batting/bowling cards + MOM/MOS banners), `MatchupCard.tsx`/`MatchupShareCard.tsx` (matchup rows), `MomentStoryCard.tsx`, `DigestTab.tsx` (8 sites, `lastName()` removed), `BallGIF.tsx` (partnership label only), `CommentaryFeed.tsx`/`DeliveryCard.tsx` (narrative sentences, `oneLiner` free text left alone), `OverSummary.tsx`, `LineupsCard.tsx`, `MatchView.tsx` (share caption).
- Deliberately left alone: `DigestTab.tsx`'s MOM color-matching heuristic and `Scorecard.tsx`'s `=== motm` equality check -- name-matching, not name-display, a different concern.

#### Verified
- `npx tsx`, 49/49 pass across 10 categories (particles, suffixes, hyphens, single-name, capitalization, whitespace, null-safety, registry-first, real mock-data strings, comma format). `tsc --noEmit`/`npm run build` clean. Grep-confirmed no remaining inline name-splitting outside the one documented out-of-scope matching heuristic. Updated the pre-existing committed `scripts/edge-case-check.ts` (its old expectations literally encoded the deferred non-fix as "correct").

## [1.0.119] 2026-07-27

### Recent-form graph: labeled axis chart supersedes sparkline styling

#### Context
- Product decision superseding v1.0.117's original call: the graph deliberately matched `BatterSparkline`'s axis-less style because it was scoped for a dense scorecard row. It now lives in its own dedicated section of the player page, so a properly labeled small line chart is more useful there. `BatterSparkline` itself is unchanged.

#### Changed -- `components/RecentFormGraph.tsx`
- Added a Y-axis with value labels and ~4-5 light horizontal gridlines, scaled per player/metric via two new exported pure functions: `computeYAxisTop(maxValue)` (scale always starts at 0; top is that player's own highest plotted value rounded up to a clean ceiling -- unit of 5/10/25/50/100 chosen by magnitude, never a fixed per-format constant) and `buildYAxisTicks(top)` (4-5 evenly spaced ticks, rounded labels, de-duplicated defensively).
- `computeYAxisTop(0)` returns 4, not 0 -- an all-zero window (ducks/wicketless spells) is real data and still needs a non-degenerate axis.
- Added a minimal X-axis: "N ago" / "Most recent" endpoints only (N matches the point count already in the header), no per-point labels/dates/opponent names. Single-point case gets one centered "Most recent" label.
- Line color (team accent), per-point dots, and single-point rendering are otherwise unchanged.

#### Verified
- `npx tsx`, 44/44 pass: zero-max case, single-point case, exact-round-number values at each tier boundary, largest realistic values (real dataset max 142, plus 200/267/400 stress cases), bowler-vs-batter scale divergence (top 5 vs top 150). `tsc --noEmit`/`npm run build` clean. `git diff --stat` shows exactly 1 file changed.

## [1.0.118] 2026-07-27

### Player recent-form/achievements: rebuilt on real match data, not a hand-typed field

#### Context
- A diagnostic (Crawley's page showing "Last 6 Innings" instead of 10) found the root cause: v1.0.117's `testRecentForm.values` was 6 hand-typed numbers with no relationship to any real match, while the same dataset separately held 4+ real per-match `battingCard` entries for Crawley the feature never read. Only 2 of 21 seeded players had any hand-authored recent-form data at all.

#### Removed -- `lib/types.ts`, `lib/mockData.ts`
- `RecentFormWindow` interface and all four `PlayerProfile` fields (`testRecentForm`/`odiRecentForm`/`t20iRecentForm`/`franchiseRecentForm`) deleted entirely. Grep-confirmed zero live references remain (only two historical explanation comments).

#### Rewritten -- `lib/playerForm.ts`
- `getRecentForm(player, format)` / `getPlayerAchievements(player, format)` keep the exact same public interface and return shapes as v1.0.117 -- zero changes needed in `RecentFormGraph.tsx`/`PlayerAchievements.tsx`. Internally now derives both from real `Match.innings[].battingCard`/`bowlingCard` and `Match.result.manOfMatch`/`manOfTournament`, matched to players via `resolvePlayerSlug()` (reused from `lib/mockData.ts`).
- Settled matches = usable result (`hasUsableResult()`) across `ALL_PAST_MATCHES` + `ALL_LIVE_MATCHES`, never filtered by `match.status` (preserves `FEATURED_MATCH`'s real data despite its `status: "live"` label).
- Deterministic sort by `(startTimeIso, match.id, innings number)` -- never trusts the source array's own newest-first ordering, which breaks once a single match contributes multiple innings.
- Achievements count last-10 *distinct matches* (deduped by `match.id`); the graph plots last-10 innings/spells (per-entry) -- two different populations, matching the product spec's wording.
- Opponent name derived from the specific match's own `battingTeam`/`bowlingTeam`, not the player's static profile field. `namesMatch()` checks both full name and short name (the dataset credits the same player's award both ways in different matches).

#### Changed -- `components/PlayerProfileView.tsx`
- Extracted the fetch-on-tab-change logic into a standalone, exported `usePlayerFormState(player, format)` hook with zero `next/navigation` dependency, so it's directly mountable with `react-test-renderer` (same precedent as `useScheduleTab`/`useMatchAccentColors`).

#### Verified
- Real-data coverage: 15/21 seeded players now show real recent-form data in some format (up from 2). Crawley's Test tab: `[12,45,8,76,23,61]` (fake) -> `[34,51]` (real, from `ashes-2526-3rd-test`). Bumrah's Test tab: `[2,3,1,4,0,2,5,1,3,2]` (fake) -> empty on Test, but `[3,2]` wickets on T20I and `[2]` on franchise (real spells the old feature never surfaced anywhere).
- Malformed-data robustness (`npx tsx`, 8 cases: numeric playerId, missing innings, non-array battingCard, negative/NaN runs, missing result, garbage winner, inconsistent-case award name, null startTimeIso) -- no crashes, correct exclusion/inclusion in all 8.
- Recomputation on real mutation, both at the adapter level (new match + MOM credit appears next call; removing the credit removes just the achievement, not the form point) and the hook level (`react-test-renderer`: tab-switch doesn't leak stale values, remount-after-mutation reflects the new data immediately).
- Full regression: `git diff --stat` shows exactly 4 files changed; `Scorecard.tsx`/`FollowSheet.tsx`/`teamAccentColor.ts`/`teamData.ts` untouched. `tsc --noEmit`/`npm run build` clean.

## [1.0.117] 2026-07-24

### Player profile: recent-form graph + achievements callout

#### Context
- Added two new sections to the player profile page (`/player/[id]`), below the existing stats grid, both scoped to whichever format tab (Test/ODI/T20I/franchise) is currently selected: a recent-form graph (one point per innings/spell across the player's last 10) and an achievements callout (one line per qualifying recent award). Explicitly out of scope: anything about a player's upcoming matches -- playing XI isn't confirmed close enough to a match to show it with any confidence.

#### New -- `lib/playerForm.ts`
- `getRecentForm(player, format)` / `getPlayerAchievements(player, format)` -- the only sanctioned reads of four new `PlayerProfile` fields (`testRecentForm`/`odiRecentForm`/`t20iRecentForm`/`franchiseRecentForm`, `lib/types.ts`'s `RecentFormWindow`), mirroring the existing `testStats`/`odiStats`/etc. per-format shape. Async from day one; defensive against missing windows, non-array `values`, malformed individual entries, more-than-10 entries, and malformed achievement counts/arrays.
- Singular/plural resolved in code ("Won 1 Man of the Match award" vs "Won 3 Man of the Match awards") -- same class of fix as the Filter sheet's count badges.

#### Changed -- `lib/teamAccentColor.ts`
- New export `resolveTeamAccentColor(team)` -- the existing per-team hairline-contrast/secondary-fallback/cyan-fallback step (`resolveTeamColorTier`), now also reachable for genuinely single-team contexts with no second team to collide against. No resolution logic duplicated; `resolveMatchAccentColors` and every match-context call site unchanged.

#### New components
- `components/RecentFormGraph.tsx` -- thin smoothed line + a dot at every point, same visual language as `BatterSparkline`, colored via the caller's already-resolved team color.
- `components/PlayerAchievements.tsx` -- one line per achievement using the `special` design token; renders nothing when there's nothing to show.

#### Changed -- `components/PlayerProfileView.tsx`
- Fetches both plus the resolved team color together, keyed on `[player, activeTab]`, resetting to empty/null before each fetch so a fast tab switch never shows stale data from the previous format.

#### Verified
- `npx tsx`, 34/34 pass: fewer-than-10 padding, missing/malformed data, zero-innings format, MOM pluralization, multi-achievement stacking, malformed MOS entries, and format-scoping (no bleed-through between tabs). Sanity-checked against real mock data (Bumrah, Crawley). `tsc --noEmit`/`npm run build` clean.

## [1.0.116] 2026-07-24

### Sort Filter/Follow sheet's Nations tab by ICC membership tier

#### Context
- Nations in `FollowSheet` were listed purely alphabetically. Changed to: full ICC members first, associate nations after, alphabetical within each group -- using the existing `getTeamMembershipStatus()` adapter (`lib/teamData.ts`) rather than a hardcoded full-member list, so real ICC data will re-sort this correctly with no code changes later.

#### Changed -- `components/FollowSheet.tsx`
- New `membershipRank()` -- `"full"` -> 0, `"associate"` -> 1, missing/malformed -> 2 (its own trailing group, not folded into associate and not dropped).
- `buildOptions()` takes a resolved `nationMembership` map; only the Nations case uses it. Teams/Tournaments/Series/Players/Formats are unchanged.
- New state + `useEffect` resolves `getTeamMembershipStatus()` for all `NATIONAL_TEAMS` once per sheet-open (same "resolve once into a sync lookup" shape `lib/spotlight.ts`'s `buildFullMemberLookup()` already uses), since the adapter is async but `Array.sort` must stay synchronous.

#### Verified
- Real test (`npx tsx`, 7/7 pass): mixed full/associate sort, all-full, all-associate, missing status, malformed status, empty list, and the pre-resolve fallback state. `tsc --noEmit`/`npm run build` clean. Search still filters correctly against the new order (unchanged `.filter()` over the pre-sorted list).

## [1.0.115] 2026-07-24

### Unify Filter/Follow sheet's selection accent from purple to cyan

#### Context
- `FollowSheet`'s selection-state UI (checkbox checkmarks, each category's "N selected" count badge, the "Update (N)" button) used its own dedicated purple, visually distinct from the platform's single cyan active/selected accent used everywhere else. Unified to cyan so the sheet reads as the same platform. Scoped to this sheet only -- the `six` token (ball-outcome purple) and the `follow` token's other consumers (bottom-nav Filter icon, homepage "FOR YOU" nudge) are unchanged.

#### Changed -- `components/FollowSheet.tsx`
- `CheckIndicator` fill/border: `#7C3AED` -> `#00E5FF`; checkmark stroke: `white` -> `#0A0E1A`.
- Category left-rail active border: `#7C3AED` -> `#00E5FF`.
- Category "N selected" badge: fill `#7C3AED` -> `#00E5FF`; text `text-white` -> `text-bg`.
- "Update (N)" button: fill `#7C3AED` -> `#00E5FF`; text `text-white` -> `text-bg`.
- Search input focus border: `focus:border-follow` -> `focus:border-cyan`.
- Text-color changes follow the platform's existing "cyan fill + dark text/icon" contrast convention (`MatchCard`, `ViewSwitcher`, `InsightsPanel`, `DigestTab`, `DemoControls` all already do this).

#### Unchanged (confirmed via diff)
- `six` token (`#A855F7`) and all ~11+ consumers (`BallGIF`, `MiniBallGIF`, `Scorecard`'s "6s" column, `WinProbChart` event dots, etc.).
- `follow` token definition (`tailwind.config.ts`), `components/BottomNav.tsx`'s violet Filter icon, `app/page.tsx`'s "FOR YOU" label + nudge card.

#### Docs
- `DESIGN-SYSTEM.md` §3/§4 `follow` token rows corrected to drop the now-inaccurate claim that `follow` covers `FollowSheet`'s checkbox/badges/Update button -- those are now `cyan`. `follow`'s documented scope is now just the bottom-nav Filter icon and homepage "FOR YOU" nudge.
- `README.md` Filter section updated to note the sheet's selection UI is cyan, distinct from the still-violet Filter icon.

#### Verified
- `tsc --noEmit`/`npm run build` clean. Grep-confirmed zero remaining `#7C3AED` values in `components/FollowSheet.tsx`. Live verification recorded separately.

## [1.0.114] 2026-07-24

### Fix Schedule tab row ordering: nations before franchise teams

#### Context
- Followed-team tabs on Schedule ("All" + one per followed team) were sorted alphabetically across ALL followed teams combined, letting a franchise team like CSK land ahead of a nation like IND (e.g. `All, CSK, IND`). Fixed to `All, IND, CSK`: nations always precede franchise/league teams, alphabetical within each group.

#### Changed -- `app/schedule/page.tsx`
- `tabTeams` now sorts by `team.type` category first (`"national"` before anything else), then `shortName` alphabetically within each category -- same categorization Filter's Nations/Teams sections already use (`Team.type`, set directly from `NATIONAL_TEAMS`/`LEAGUE_TEAMS` in `lib/mockData.ts`).

#### Verified
- Real sort-function test (`npx tsx`): scrambled multi-nation + multi-team inputs come back grouped and alphabetized correctly in every combination tried (nations-only, teams-only, mixed, single-item, empty). `tsc --noEmit`/`npm run build` clean. No change to tab content, "All" scoping, or v1.0.113's series rows/dedicated page.

## [1.0.113] 2026-07-24

### Schedule "All" tab collapsed to one row per series; new dedicated series page

#### Context
- v1.0.112's series-grouping/exclusion/ordering was correct, but "All" showed every qualifying series' matches listed inline underneath its heading -- more detail than intended. Collapsed to one summary row per series (name, LIVE badge, next-match date, "Last: ..." recap); moved the full match list to a new dedicated page. Inclusion rule and ordering unchanged. Per-team tabs unaffected.

#### Added -- `lib/teamSchedule.ts`
- `summarizeSeriesGroup(group)`: derives `{ competition, isLive, nextEntry, lastCompletedEntry }` from an already-fetched `SeriesGroup`. Fails safe: `nextEntry`/`lastCompletedEntry` are `undefined` (not blank/broken) when there's nothing to show.
- `formatLastResult(entry)`: "KKR won by 7 wickets vs RR"-style recap text; handles draw/tie/no-result/missing-result/malformed-winner cases.
- `hasUsableResult()` strengthened: a past match's `result.winner` must now be `"draw"`/`"tie"`/`"no-result"` or genuinely match one of its own two teams to be eligible as a series' `lastCompletedEntry`.
- `getMatchesForCompetition(competitionId)`: every match for one series (past included), no inclusion-rule filtering -- backs the new dedicated page.
- `getAllCompetitionIds()`: every valid competition id in the dataset, through `safeCompetition()` -- backs the new page's `generateStaticParams`.

#### Added -- `app/schedule/series/[competitionId]/page.tsx` (new route)
- Async server component; renders all of one series' matches ascending via the shared `ScheduleRow`. Distinct from the pre-existing `/schedule/[competitionId]` route (still used by `MiniStandings`, out of scope here).

#### Changed -- `components/ScheduleRow.tsx` (new, extracted)
- `ScheduleRow`/`TeamChip`/`fmtDate`/`fmtTime` moved out of `app/schedule/page.tsx` so the new dedicated page reuses the identical card format.

#### Changed -- `app/schedule/page.tsx`
- "All" tab now renders one `SeriesSummaryRow` per qualifying series (Link to the new dedicated page) instead of `ScheduleRow`-per-match under each heading. Header text now reads "N ongoing/upcoming series" for "All".

#### Verified
- 25 cases (`npx tsx`): summary derivation (no-completed-yet, fails-safe next-entry, live detection, skip-bad-result-fallback), recap text accuracy (6 outcome types incl. the spec's own example), `getMatchesForCompetition`/`getAllCompetitionIds` against real data + unknown/empty/null ids + malformed competition.
- 8 recomputation cases (`npx tsx`): a synthetic series walked upcoming -> live -> post-match -> upcoming again, confirming `isLive`, series inclusion in "All", and `getMatchesForCompetition` all reflect each in-place mutation immediately, no caching.
- `tsc --noEmit` and `npm run build` clean; build now generates 11 static `/schedule/series/[competitionId]` pages. Grep-confirmed caller boundaries for all 4 new exports plus `ScheduleRow`.
- Live-verification catch: `formatLastResult()` initially double-prefixed "by" (mock `margin` values already include it, e.g. `"by 4 wickets"`) -- fixed to join with a plain space, re-verified against real data before shipping.

## [1.0.112] 2026-07-24

### Schedule "All" tab re-grouped by series/tournament

#### Context
- "All" was a flat chronological list of every match app-wide. Changed back to grouping by series/tournament (`Match.competition`): each group headed by the series name, matches underneath. Only an ongoing-or-upcoming series appears; a fully-concluded series (every match played) drops out of "All" entirely. Groups ordered by true start date ascending, stable throughout a series' run. A qualifying series shows ALL of its matches, past included. Per-team tabs are unaffected -- same flat, chronological, past-included view as v1.0.111.

#### Added -- `lib/teamSchedule.ts`
- `safeCompetition(match)`: validates `Match.competition` defensively (null/missing, `{}`, empty or wrong-typed `id`/`name`, non-object) -- a match that fails is excluded from series grouping only, still shows on a per-team tab.
- `getSeriesGroupedSchedule(opts?)`: the "All" tab's new data source. Computes series qualification (any live/upcoming match anywhere in the dataset) and true earliest-match-date ordering from an effectively-unbounded lookup, while what's actually rendered per qualifying series stays the normal ~1-year windowed set.
- `SeriesGroup` interface: `{ competition, entries }`.

#### Changed -- `app/schedule/page.tsx`
- `useScheduleTab(tab)` now fetches `getSeriesGroupedSchedule()` for `"all"` (returns `seriesGroups`) vs. `getTeamSchedule(tab)` for a team code (returns flat `entries`, unchanged). "All" renders one section per series (heading = `competition.name`); a team tab still renders via `groupScheduleByMonth`, unchanged from v1.0.111.
- Header match count for "All" now reflects the flattened, already-qualifying-series-only total.

#### Verified
- 26 interface-level cases (`npx tsx`): 10 malformed-competition inputs (null, `{}`, empty/wrong-typed `id`/`name`, bare string, missing field) all excluded cleanly, no crash; fully-concluded synthetic series correctly absent; ongoing synthetic series correctly shows past + upcoming together; 3 synthetic series inserted out of order came back sorted ascending by true start date; a series' position confirmed unchanged after a non-earliest match completed, correctly dropped once ALL matches completed, and correctly reappeared at the same position once reopened. Real dataset: IPL 2026 (16 matches, live/past/upcoming mixed) present; ICC T20 World Cup 2026, ICC Champions Trophy 2025, The Ashes 2025-26, Big Bash League 2025-26 (each 1 already-played match) all correctly absent.
- 5 hook-level cases (`react-test-renderer`, temporarily exported `useScheduleTab`): mount on "all" shows synthetic series; switching to a team tab returns empty `seriesGroups`; series drops after completing while away from "All" and reappears once revisited -- confirms fresh re-fetch, no stale cache.
- `tsc --noEmit` and `npm run build` clean. Grep-confirmed `getSeriesGroupedSchedule` has exactly one caller, lives in one file. Live verification recorded in DECISIONS-LOG.md.

## [1.0.111] 2026-07-24

### Schedule tab simplification: drop merged view, plain All + per-team tabs

#### Context
- v1.0.110's Schedule redesign got redundant once someone follows several teams (a merged-teams view plus a separate all-competitions picker for zero-follows). Simplified to one view: "All" (default, every match app-wide, ascending date order) plus one tab per followed team, narrowing the same list in place. Also dropped the win/loss colored left-border strip on a narrowed tab's cards entirely.

#### Changed -- `lib/teamSchedule.ts`
- Removed `getMergedTeamSchedule(teamCodes)` (multi-team merge/dedupe -- no longer needed, nothing merges several teams into one view anymore).
- Added `getFullSchedule(opts)`: every valid match app-wide within the ~1-year window, no team filter -- the new "All" tab's data source.
- `getFullSchedule`/`getTeamSchedule` now share one internal implementation (`scheduleEntries`), same validation either way.

#### Changed -- `app/schedule/page.tsx`
- Retired `AllCompetitionsView` (competition picker) and `MyTeamsScheduleView`'s merge-all-followed-teams behavior. Single view: tab row = "All" + one tab per followed team. `useTeamSchedule(teamCodes: string[])` replaced by `useScheduleTab(tab: string)`, keyed directly on the plain string tab value -- no array-reference dependency trap to guard against anymore.
- `ScheduleRow`: removed the colored win/loss left-border strip and the colored "Won"/"Lost" text -- cards now look identical on "All" or any team's tab; the text label itself stays.

#### Verified
- Re-ran the same 20 malformed-input test cases (`npx tsx`) against the rewritten `toScheduleEntry()` -- all pass, no regression.
- Re-ran interface-level recomputation test (mutate status between calls) against both `getFullSchedule`/`getTeamSchedule` -- both pick up the change.
- New hook-level test (`react-test-renderer`): switching tabs all -> IND -> AUS -> all correctly recomputes each time (29 -> 5 -> 5 -> 29 entries).
- Live-verified full tap sequence + confirmed color strip is gone; `tsc --noEmit` and `npm run build` clean.

## [1.0.110] 2026-07-24

### Schedule tab redefault: my-teams merged view

#### Context
- When a user has one or more teams selected in Filter (nations or franchise teams), Schedule should open directly to a merged, chronological, month-grouped list of those teams' matches instead of the all-competitions picker. Zero teams selected keeps today's behavior unchanged.

#### Added -- `lib/followPrefs.ts`
- `myTeamCodes(prefs)`: resolves the full set of `Team.code`s a user follows as a team, combining franchise `prefs.teams` with national teams resolved from `prefs.nations` (a real reverse lookup, not a pass-through -- a nation's ISO code isn't always its team's own code, e.g. South Africa is `"SA"` but its country field is `"RSA"`).

#### Added -- `lib/teamSchedule.ts` (new, third real-data-readiness adapter)
- `getTeamSchedule(teamCode)` / `getMergedTeamSchedule(teamCodes)`: the sanctioned, async-from-day-one interface for reading team schedules -- composes per-team fetches, dedupes matches between two followed teams, sorts chronologically, filters to a ~1-year window.
- `toScheduleEntry()`: defensive validation for malformed fixture data -- missing/malformed date or unrecognized status excludes a match; missing venue or an explicit unconfirmed flag keeps it but marks it TBD instead of presenting it as certain.
- New optional `Match.fixtureConfirmed?: boolean` field (`lib/types.ts`), defaulting to confirmed when absent.

#### Changed -- `app/schedule/page.tsx`
- Branches on `myTeamCodes(followPrefs).length > 0`: renders the new `MyTeamsScheduleView` (chip row: All + per-team, merged month-grouped list) or the pre-existing `AllCompetitionsView` (unchanged), hydration-safe the same way `app/page.tsx` handles `followPrefs`, reactive to Filter changes via `onFollowPrefsChanged`.

#### Verified
- 20 real malformed-input test cases (`npx tsx`) against `toScheduleEntry()` -- all degrade to exclude-or-mark-TBD correctly, no crashes.
- Recomputation correctness tested two ways: mutated a mock match's status between two interface calls (no stale cache), and verified via `react-test-renderer` that the consuming hook's dependency array is keyed on team-code values, not array references.
- Grep-confirmed single-interface boundary; `tsc --noEmit` and `npm run build` clean.

## [1.0.109] 2026-07-23

### Close the stale-mutation gap flagged in the v1.0.108 real-data-readiness pass

#### Context
- v1.0.108 flagged an accepted limitation: `useMatchAccentColors` depended on `[teamA, teamB]` by object reference, so it wouldn't notice a team's colors changing via in-place mutation of an existing object -- only via a full object replacement.

#### Fixed -- `components/Scorecard.tsx`
- `useMatchAccentColors`'s effect now depends on `[teamA.code, teamA.primaryColor, teamA.secondaryColor, teamB.code, teamB.primaryColor, teamB.secondaryColor]` instead of `[teamA, teamB]` -- tracks the fields that actually determine the resolved color, not object identity as a proxy for them.

#### Documented -- `ARCHITECTURE.md`
- New explicit rule alongside the existing worked example: any future real data source must publish team color updates by replacing the `Team` object, never mutating an existing one's fields in place. Flagged as a contract for the future feed integrator -- this code can track field changes across a render, but it can't make a mutation trigger a render in the first place.

#### Verified
- Real test via `npx tsx` + `react-test-renderer` (temp dev install, not saved to `package.json`): in-place mutation with no re-render correctly leaves the stale color in place; a proper object replacement correctly picks up the new color on the next render.
- Re-ran the full 29-match audit against the shipped `resolveMatchAccentColors` -- byte-identical to v1.0.108 (expected: this is a UI-hook-layer change only).
- `tsc --noEmit` and `npm run build` clean.

## [1.0.108] 2026-07-23

### Real-data-readiness test pass: team-color theming system

#### Context
- Comprehensive check before considering the theming/collision system done, per this codebase's real-data-readiness standard (ARCHITECTURE.md): malformed-data handling, interface boundary, memoization correctness, full regression.

#### Fixed -- `lib/teamAccentColor.ts`
- New `sanitizeHexColor()`: validates/normalizes every color before it reaches the contrast/Delta E math. Missing/`null`/non-string primaryColor used to crash outright; a bare hex with no `#` was silently accepted; whitespace-padded hex parsed to a wrong non-obvious value. All now degrade to the same fallback path as a genuinely colorless team -- never a crash, never a silently-wrong value. Shorthand hex (`#FFF`) is now properly expanded instead of accidentally falling through via NaN.
- `resolveMatchAccentColors` now returns a `Promise` -- async from day one, matching `lib/teamData.ts`'s `getTeamMembershipStatus`/`getTeamRanking` pattern. Documented as a second worked example in `ARCHITECTURE.md`.

#### Fixed -- `components/Scorecard.tsx`
- New shared `useMatchAccentColors` hook (hydration-safe `useState`+`useEffect`, same pattern as `NationalRankBadge`), called ONCE at the top of `Scorecard` (before its early return, per Rules of Hooks) and passed down as a plain `accentColors` prop to `TeamToggle`, `TestInningsChips`, and `InningsCard` -- not called inside any of them individually. `InningsCard` remounts on every innings/team-tab switch; calling the hook there would have re-run the async resolution on every switch, flashing back to the cyan placeholder each time. Also cuts 3 redundant resolutions per match down to 1.

#### Verified
- Malformed-input test cases (missing, null, non-string, bad hex, shorthand, lowercase, whitespace, rgb()/rgba()) run against the real functions via `npx tsx` -- all degrade gracefully post-fix.
- Re-ran the full 29-match audit against the shipped `resolveMatchAccentColors` -- identical results to v1.0.107.
- `tsc --noEmit` and `npm run build` clean.
- Live-verified: outcome-coded colors unchanged, wicket-red teams still real-colored with no carve-out, England's not-out box/sparkline still cyan.

## [1.0.107] 2026-07-23

### Team-color theming: CIEDE2000 replaces WCAG contrast for the collision check

#### Context
- v1.0.106's cross-team collision check reused WCAG contrast (luminance-only) to compare two teams' colors against each other. That's why New Zealand's grey secondary got flagged as "colliding" with Australia's gold primary -- similarly bright, but obviously different colors to look at.

#### Fixed -- `lib/teamAccentColor.ts`
- Cross-team collision check now uses CIEDE2000 (`ciede2000()` / `deltaE00()`) -- converts both colors to CIE Lab and computes a perceptual Delta E accounting for lightness, chroma, and hue together. The WCAG-based background-legibility check (7.0:1 minimum, unchanged) is left as-is -- that's a genuine brightness question; the cross-team question needed a perceptual tool instead.
- New threshold `COLLISION_MIN_DELTA_E = 10.0`, calibrated against two known answers: India's gold vs Australia's gold must collide (dE00 = 5.42, confirmed below 10.0) and New Zealand's grey vs Australia's gold must not (dE00 = 31.71, confirmed above 10.0). Every other known real collision clusters at 5.4-9.2; every known non-collision is 25.66+ -- wide margin either side of 10.0.

#### Re-audit -- all 29 matches
- The 8 gold-on-gold pairs from v1.0.106 (Mumbai Indians vs 3 opponents, Kolkata Knight Riders vs Chennai Super Kings, India vs Australia x3, Multan Sultans vs Peshawar Zalmi, LA Knight Riders vs Texas Super Kings) still collide and still fall back -- confirmed under the new metric too, not just the old one.
- New Zealand vs Australia no longer flagged -- New Zealand now renders its real grey secondary instead of dropping to cyan.
- The 3 identical-color (both-cyan) pairs are still flagged but still inert, as before.
- 13 pairs that were flagged-but-inert under the old luminance metric are now correctly classified as "no collision" (they're hue-distinct, not just coincidentally similar in brightness) -- no visible change, since they were already inert, but a more accurate audit.

#### Verified
- `tsc --noEmit` and `npm run build` clean.
- TS CIEDE2000 implementation cross-checked against independent Node.js and Python ports -- identical Delta E values across all calibration and audit cases.
- Live re-checked New Zealand vs Australia post-deploy -- New Zealand now renders its real grey, not cyan.

## [1.0.106] 2026-07-23

### Team-color theming: cross-team collision check

#### Context
- Gap in v1.0.105's per-team contrast check: it only validated a color against the dark background, so two teams in the same match could each independently pass and still land on near-identical colors. Live example: India's gold secondary fallback (`#F9A825`) landing almost on top of Australia's real gold primary (`#FFB81C`) in an India vs Australia match.

#### Added -- `lib/teamAccentColor.ts`
- `resolveMatchAccentColors(teamA, teamB)`: resolves both teams' colors independently first, then checks the two FINAL colors against each other at a 1.5:1 minimum (lower than the 7:1 background check, since this is about telling two colors apart, not surviving a background). Priority on collision: real primary > secondary fallback > cyan -- lower-priority team drops one tier, or straight to cyan if there's nowhere softer. Same-tier ties drop whichever team's full name sorts second alphabetically, straight to cyan -- deterministic regardless of which team is batting or listed as `teamA`.
- Removed the old single-team `getBattingTeamAccentColor` export entirely (not deprecated) -- every real call site needs both teams to check for a collision, so a single-team entry point could silently reintroduce the bug for a future caller.

#### Fixed -- `components/Scorecard.tsx`
- `TeamToggle`, `TestInningsChips`, `InningsCard` all now call `resolveMatchAccentColors(teamA, teamB)` instead of resolving each team's color in isolation. `TestInningsChips` gained `teamA`/`teamB` props to support this.

#### Audit -- all 29 matches in the mock dataset
- 3 pairs had no collision to begin with (incl. India vs Pakistan, 1.97:1).
- 16 were flagged as a collision but produced no visible change -- the lower-priority side was already on the platform cyan with nowhere lower to fall (including pairs where both teams were already independently on cyan, e.g. Perth Scorchers vs Sydney Sixers -- not a new problem, already accepted in v1.0.105).
- 10 match rows across 8 distinct team pairs got an actual color change, all gold-on-gold (or grey-on-gold) collisions: Mumbai Indians' gold secondary vs 3 different gold opponents, Kolkata Knight Riders vs Chennai Super Kings, **India vs Australia on all 3 fixtures (the reported bug)**, New Zealand vs Australia, Multan Sultans vs Peshawar Zalmi, LA Knight Riders vs Texas Super Kings.

#### Verified
- `tsc --noEmit` and `npm run build` clean.
- Live re-checked India vs Australia -- India now renders in cyan, clearly distinct from Australia's gold.

## [1.0.105] 2026-07-23

### Team-color theming correction: hairline-stroke contrast audit

#### Context
- Live bug found on `ind-eng-test-2026-d3-live`: England's not-out box border/text and sparkline line were nearly invisible. v1.0.104's fallback logic only ever contrast-checked a team's primary color if it was literally `#000000` -- every other team's real primary, including England's dark navy `#1D244E` (~1.16:1 against the card background), was used unchecked.

#### Fixed -- `lib/teamAccentColor.ts`
- Removed the "colorless team" special case. The contrast check now runs for every team's `primaryColor`, not just literal `#000000` ones -- one uniform primary -> secondary -> cyan chain for all 72 teams.
- Raised `MIN_CONTRAST` from 3.0 to 7.0 (WCAG 2.x AAA "enhanced contrast," the closest published reference for a graphical element with as little rendering margin as a 1-2px stroke -- WCAG has no official number for strokes this thin). One threshold gates all four themed components: the not-out box's ~1px ring, the sparkline's 2px line, and the two pill fills (which are strictly more forgiving than either stroke).

#### Audit results (all 72 teams, vs `#141B2D`)
- **Real primary passes (9)**: Australia, Chennai Super Kings, Jamaica Tallawahs, Joburg Super Kings, Melbourne Stars, Peshawar Zalmi, Sunrisers Eastern Cape, Texas Super Kings, Trent Rockets -- all gold/yellow/lime brand colors.
- **Falls back to secondary (32)**: e.g. India (`#005BAC` 2.53:1 fails -> `#F9A825` 8.70:1), New Zealand, Uganda, Punjab Kings (`#DD1F2D` 3.52:1 fails -> grey `#A7A9AC` 7.28:1 -- ordinary math, not a red-collision exception), Pakistan, South Africa, West Indies, and 25 more.
- **Falls back to cyan (31)**: England (primary 1.16:1 and secondary 5.59:1 both fail the stricter bar -- the bug that triggered this fix), Zimbabwe, Perth Scorchers, Papua New Guinea, London Spirit, and 26 more.
- No special-casing for the wicket-red teams (Zimbabwe, Perth Scorchers, Punjab Kings) -- they run the identical check as everyone else.

#### Verified
- `tsc --noEmit` and `npm run build` clean.
- Live-checked England's not-out box and sparkline post-deploy -- now visibly rendered via cyan fallback.
- Spot-checked a passing-primary team and a red-collision team render correctly with no dedicated code path.

## [1.0.104] 2026-07-23

### Batting-team color theming: not-out box, sparkline line, and team-selector pills

#### Context
- Followed a feasibility check confirming the app already has proven precedent for theming with `team.primaryColor` directly (`WinProbChart.tsx`, `MomentStoryCard.tsx`, match-card left borders) and that team color data was already in scope wherever these components render, or one prop-hop away.

#### Added -- `lib/teamAccentColor.ts` (new file)
- `getBattingTeamAccentColor(team)`: real `primaryColor` for nearly every team. One exception -- a team with a literally colorless `#000000` primary (New Zealand, Uganda, Papua New Guinea, London Spirit) falls back to `secondaryColor` if it clears WCAG contrast (>=3.0:1) against the real card background (`#141B2D`), else falls back to the platform's default cyan. Also exports `contrastRatio()` and `hexToRgbTriplet()`.
- `lib/tokens.ts`: added a named `CYAN` export (`#00E5FF`) -- the fallback target, and the same value already used as the fixed accent everywhere else in the app.

#### Fixed -- `components/Scorecard.tsx`
- `BatterRow`: the not-out box's `excitement-glow` border/pulse and its "not out" + on-strike `*` text now use the batting team's resolved accent color, threaded down from `InningsCard` (which already computed `team` for its own header dot).
- `BatterSparkline`: the live batter's line stroke uses the team accent color; the dismissed-batter line (light slate) and the four/six dot markers are untouched.
- `TeamToggle` and `TestInningsChips`: the active pill's fill/border now use the relevant team's accent color instead of fixed cyan.
- Left every outcome-coded color alone: strike-rate highlight, top-scorer/top-wicket-taker highlights, and the sparkline's four/six dot markers all still render identically for every team.

#### Fixed -- `app/globals.css`
- `.excitement-glow`'s box-shadow keyframes now read a `--glow-rgb` CSS variable (default: the original cyan triplet), so `MatchCard.tsx`'s and `DigestTab.tsx`'s unrelated uses of the same class are pixel-identical to before; only the not-out box sets this variable.

#### Verified
- New Zealand -> secondary `#A8A9AD`, 7.30:1. Uganda -> secondary `#FCDC04`, 12.56:1. London Spirit -> secondary `#00B5A4`, 6.65:1. Papua New Guinea -> secondary `#CE1126`, 3.05:1 (closest pass of the four). None needed the cyan fallback.
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.103] 2026-07-23

### Spotlight competition-tier gate: international/bilateral matches now require both teams to be full ICC members

#### Context
- Follow-up to v1.0.102's membership-status adapter: Spotlight's three excitement checks (close finish, milestone, context stakes) applied identically regardless of whether a match was between two Full Members or two Associates. A dramatic associate-nation result is a real story for that nation's fans, but not the same "rare enough to interrupt the homepage" signal a Full Member thriller is.

#### Fixed -- `lib/spotlight.ts`
- `isSpotlightMatch(match, isFullMember)` now takes a second parameter and, for any match whose competition type is `international` or `bilateral` (not `league`/`domestic`), requires both `isFullMember(match.teamA)` and `isFullMember(match.teamB)` before the three existing excitement checks run at all. League/domestic matches are completely unaffected -- they skip straight to the same three checks as before.
- New `buildFullMemberLookup(matches)`: resolves every unique team's membership status ONE TIME via `getTeamMembershipStatus()` (the FY32 adapter, never accessed directly) using `Promise.all`, returning a plain synchronous `(team) => boolean` closure -- necessary because the underlying check is `async` but `isSpotlightMatch()` must stay synchronous to run inside `Array.filter()`.

#### Fixed -- `app/page.tsx`
- Resolves the lookup once in a mount effect (`useState<FullMemberLookup | null>(null)` + `useEffect`), following the same hydration-safe pattern used elsewhere in this file: `spotlightMatches` returns `[]` until the lookup resolves, then computes for real.

#### Bug found and fixed during this work
- First deploy crashed the whole homepage: `buildFullMemberLookup(...).then(setFullMemberLookup)` passed the resolved lookup *function* directly to `useState`'s setter, which treats a bare function argument as a functional updater (`(prevState) => newState`) rather than the literal value -- it called `lookup(null)` (the initial state) immediately, crashing inside the lookup on `null.code`. Fixed via `.then(lookup => setFullMemberLookup(() => lookup))`. Root-caused via bisection against a clean revert, live-deployed at each step.

#### Verified
- Live on bawler-gold.vercel.app, using a temporary constructed Kenya-vs-Namibia tied T20I (removed after verification, never shipped): homepage loads with zero console errors; Full Member international dramatic finish (IND vs PAK, T20 World Cup) still qualifies for Spotlight; league matches (IPL's GT vs MI, BBL Final Scorchers vs Sixers) unaffected; the constructed associate-vs-associate tied match did not qualify for Spotlight despite clearing the close-finish check, and rendered normally in the ordinary Past grid instead.
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.102] 2026-07-23

### Team rankings/membership status rebuilt as an interface-first adapter, not direct field access

#### Context
- User asked, ahead of any real-data integration work: will the current ranking-based logic survive once real data starts coming in? Root cause found: `Team.currentRanking` was one field reused for two unrelated things (a franchise's season-scoped points-table position vs. a nation's rolling ICC rating), and separate code used "does `currentRanking` exist" as a proxy for "is this a full ICC member" -- which only worked by coincidence of the mock data. Real ICC rankings are published for 100+ members including most associates, so that proxy would break immediately against real data.
- Verified the real, current ICC Full Member list live (not from memory) rather than assume it -- 12 members: AFG, AUS, BAN, ENG, IND, IRE, NZ, PAK, SA, SL, WI, ZIM. This also surfaced a pre-existing inaccuracy: Ireland and Zimbabwe were filed under the mock dataset's "Associates" comment block despite being real Full Members.
- Built as the reference implementation of a reusable "interface-first" pattern for any dataset expected to eventually come from a real provider -- documented in full in the new `ARCHITECTURE.md`, since this is the first of several anticipated real-data-readiness items (win probability, ball-by-ball deliveries, player name parsing).

#### Fixed -- `lib/types.ts`
- `Team.currentRanking` replaced by three fields: `membershipStatus?: "full" | "associate"` (nations, categorical), `rankings?: { test?: number; odi?: number; t20i?: number }` (nations, per-format -- only `t20i` populated today), and `leagueStanding?: number` (franchises, kept as a plain field -- no external provider will ever replace a league's own standings, so it doesn't need the adapter treatment).

#### Added -- `lib/teamData.ts` (new file)
- `getTeamMembershipStatus(team)` and `getTeamRanking(team, format)`: the only sanctioned reads of the two nation-specific fields. Both `async`/`Promise`-returning from day one, even though they resolve synchronously from mock data today, so a future real-data swap requires zero call-site changes.
- `refreshRankings()`: an explicitly no-op placeholder marking where a future ranking-sync mechanism will plug in.

#### Fixed -- `lib/mockData.ts`
- All 22 national teams migrated to the new fields: 12 `membershipStatus: "full"` (10 with `rankings.t20i` carried over from the old `currentRanking` values; Ireland and Zimbabwe left without a ranking since they never had one), 10 `membershipStatus: "associate"`. All 10 IPL franchise teams migrated from `currentRanking` to `leagueStanding` with the same values.

#### Fixed -- `components/MatchCard.tsx`
- `FlagOrRank`: franchise teams now read `team.leagueStanding` directly; national teams without a `FLAG_ISO` flag image (currently only Kenya/Uganda) now go through a new `NationalRankBadge` sub-component that calls `getTeamRanking(team, "t20i")`, using the same hydration-safe `useState(undefined)` + `useEffect` pattern from v1.0.99 (render nothing on first pass so server/client agree, fill in the real value post-mount).

#### Verified
- All 22 nations confirmed to have `membershipStatus` set; zero left unset.
- Grepped the full codebase: zero remaining `currentRanking` references; no code outside `lib/teamData.ts`'s two accessor functions reads `membershipStatus`/`rankings` directly.
- Visual output unchanged: nations with a flag image render identically; franchise badges show the same numbers as before, just sourced from `leagueStanding`; Kenya/Uganda still render nothing (unranked before and after).
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.101] 2026-07-23

### Fix: Score-tab header card restricted back to finished matches; `liveStatusOverride` removed from it

#### Context
- v1.0.97's Score-tab score header (`FinalScoreHeader` in `components/Scorecard.tsx`) was rendering for every match status, live included -- beyond the original scope (finished matches only). On a currently-live match this surfaced a real bug: the card's own team-score rows correctly tracked the live, ticking score, but a sub-line rendering `match.liveStatusOverride` verbatim showed a frozen snapshot from earlier in the match, visibly disagreeing with the rows above it.

#### Fixed -- `components/Scorecard.tsx`
- `finalScoreHeader` is now only constructed when `match.status !== "live"`; both JSX usages skip the wrapping `<div className="mb-3">` entirely when it's `null` (matching the existing `momMosBanners` pattern), so a live match's Score tab has no extra card or spacing.
- `FinalScoreHeader` no longer has a `match.status === "live"` branch (unreachable now that the caller gates on it) and no longer renders `liveStatusOverride` at all -- checked every current `post-match` match in the mock dataset, all have a real `match.result`, so the result banner is sufficient on its own. `liveStatusOverride` is untouched everywhere else it's used (Spotlight cards, homepage rows).

#### Verified
- `ind-aus-t20i-2026-m2-live` (live): Score tab shows no card above the scorecard -- just the team toggle and innings tables.
- `ashes-2526-3rd-test` (finished, full data): score header still shows correctly, with the result banner.
- `ipl2026-m35-givsmi` (finished, no innings data): unaffected either way -- its "Scorecard not available" fallback returns before `finalScoreHeader` is computed.
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.100] 2026-07-23

### Fix: page background is now a real Tailwind `theme()` reference, not a coincidentally-matching literal

#### Context
- An independent check of `DESIGN-SYSTEM.md`'s own "Resolved (v1.0.67)" claim -- that the page background reads `#03060F` "via the token" -- found the code didn't back that up: `app/globals.css` was still a plain hardcoded `background: #03060F;` string, not a reference to `bg.deep` in `tailwind.config.ts`. The v1.0.67 fix corrected the *value* (matching `bg.deep`'s hex) but never actually wired the CSS to the token, so a future change to `bg.deep` would have silently desynced from `globals.css` again.

#### Fixed -- `app/globals.css`
- `html`/`body` now read `background: theme('colors.bg.deep')` / `background-color: theme('colors.bg.deep')` instead of the literal hex. Resolved at build time by `postcss.config.mjs`'s `tailwindcss` plugin.

#### Verified
- Compiled CSS is pixel-identical: `background:#03060f`, same as before.
- Temporarily changed `bg.deep` to `#FF00FF` in `tailwind.config.ts`, rebuilt, confirmed the compiled output changed to `background:#f0f` with zero edits to `globals.css` -- then reverted (confirmed clean diff after).
- `npm run build` clean before and after.
- `DESIGN-SYSTEM.md` §1 updated to describe the real mechanism.

---

## [1.0.99] 2026-07-22

### Fix: two hydration mismatches -- `MatchView.tsx` tab restoration, `DigestTab.tsx` narrative-threshold override

#### Context
- Platform-wide scoping pass found exactly 2 locations reading browser storage synchronously during render (14 others already used the safe deferred pattern): `MatchView.tsx`'s `restoredTab` (read `sessionStorage` in a same-render IIFE) and `DigestTab.tsx`'s `cards` `useMemo` (via `buildCards()`/`buildPostMatchDigest()` calling `getNarrativeThresholds()`, a `localStorage` read, internally). Both could return a different value on the client's own first render pass than the server rendered, producing React hydration mismatch (#418/#423) -- confirmed live on every match page tested, including a never-before-visited match.

#### Fixed -- `components/MatchView.tsx`
- `tab`/`renderedTab` now initialize with `useState<TabKey>(defaultTab)` directly; the `restoredTab` IIFE is gone from the render path. A new `useEffect` reads `sessionStorage.getItem(SESSION_KEY)` post-mount, applies the same `isFinished && saved === "live"` staleness guard as before, and updates state only if the restored value differs from `defaultTab`.

#### Fixed -- `components/DigestTab.tsx`
- Added `thresholds` state (`useState<NarrativeThresholds>(DEFAULT_NARRATIVE_THRESHOLDS)`) plus a mount-only `useEffect` that reads the real value via `getNarrativeThresholds()` in the main component. `buildCards()` and `buildPostMatchDigest()` now take `t`/`thresholds` as an explicit parameter (default: the pure `DEFAULT_NARRATIVE_THRESHOLDS` constant) instead of reading storage themselves; the `cards` `useMemo` passes `thresholds` through and depends on it. The 5 other `getNarrativeThresholds()` call sites in this file -- unused default-parameter expressions, never exercised by any real caller -- were switched to the same pure constant for consistency.
- Follow-up bug caught during verification: `buildOverGroupCards()`/`buildTestSessionCards()` permanently cache every already-complete card, and that first build happens on mount with default thresholds -- before the new effect can apply the real override. Without a further fix, the override would silently only affect overs/sessions completing after mount, never anything already on the page. Fixed by clearing the cache inside the same mount effect, forcing one full rebuild against the correct thresholds.

#### Verified
- Deployed-site console check (`read_console_messages`, cleared before each reload to avoid stale-message false positives) on a live match, a finished match with full innings data, and a finished match with no innings data: zero #418/#423 warnings on all three.
- Tab restoration: switched to Score on a finished Test match, did a full page reload, confirmed it stayed on Score instead of falling back to Digest.
- Narrative-threshold override: set `bawler:narrativeThresholds` to make `tightOverRuns` impossible to hit, reloaded a live match with several already-complete "Tight over" cards, confirmed their text changed -- this is what caught the cache bug above and confirmed the fix for it.
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.98] 2026-07-22

### Fix: ScoreBar chase line no longer shows on finished matches

#### Context
- ScoreBar's second row ("TeamX need N off M balls · RRR X.XX") was computed purely from static innings totals with no check on match status -- a finished non-Test match with a started 2nd innings showed a phantom live chase target, sometimes days after the match actually ended. Diagnosed as affecting exactly the "5 of 12" aggregate-only Past matches (non-Test, innings.length > 0, no ball data); Test matches and innings.length === 0 matches were never affected either way.

#### Fixed -- `components/ScoreBar.tsx`
- Added `isLive &&` to the chase-line's render condition. A finished match now shows nothing in that row -- the real result already renders elsewhere on the page (Scorecard's final-score header, Digest's lead-in summary), so there's nothing this row needed to add in its place.

#### Verified
- `bbl-2526-scorchers-sixers`: chase line present before, confirmed gone after.
- `ipl2026-m35-givsmi` and `ashes-2526-3rd-test`: no chase line before or after (both were already unaffected -- confirmed as regression checks, not true before/afters).
- A live match: chase line unchanged.
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.97] 2026-07-22

### Finished matches get a Digest-first tab bar and a retrospective, whole-match Digest

#### Context
- For any match with status !== "live" (Spotlight, Past, and any live match that finishes): remove the Live tab, replace it with Digest in the same first slot, same total tab count. Move the Live tab's team-names-with-final-score header into the Score tab, above the scorecard body. Build a new post-match Digest: a compact lead-in summary, a single match-wide turning point, a whole-match performance card, then the existing day/session cards reframed with retrospective hindsight. Matches with no innings data (7 of the current 12 Past records) get an honest fallback recap instead.

#### Added -- `components/MatchTabs.tsx`, `components/MatchView.tsx`
- `MatchTabs` gained a `firstTab` prop ("live" default, "digest" for finished matches) so Digest occupies slot 1 instead of being appended as an extra tab.
- `MatchView` computes `isFinished = match.status === "post-match"` (deliberately narrower than "!== live" -- upcoming/pre-match fixtures have nothing to digest) and builds `[digest, scorecard, info, (table)]` for finished matches; live/upcoming keep today's exact tab list and defaults untouched. Stale saved "live" tab values are coerced back to the new default once a match finishes.

#### Added -- `components/Scorecard.tsx`
- New `FinalScoreHeader` -- the exact team-rows-plus-result-banner block the old Live-tab fallback used to show -- rendered above the scorecard body whenever `innings.length > 0`, any match status. The `innings.length === 0` "Scorecard not available" fallback is untouched.

#### Added -- `components/DigestTab.tsx`
- `buildPostMatchDigest(match, allBalls)`: new entry point for finished matches. Lead-in reuses the existing `buildMatchSummaryCard` (full/derived/pending, from the v1.0.96 fix) unchanged. `findTurningPoint()` diffs consecutive `calculateWinProbForMatch()` points across the whole match for the single largest win-probability swing. `computeMatchTopPerformers()` extracted as a shared helper feeding both the lead-in and a new whole-match `PerformanceCard`. Existing day/session builders called exactly as before, then `applyRetrospectiveFraming()` appends one hindsight sentence per card via a new, independent, positional-index-based phrase bank -- `buildNarrative`/`buildOverSummary`/`buildDayReport` and their existing anti-repeat indexing are untouched. `innings.length === 0` matches get a new `SimpleRecapCard` (final score from `match.result`'s teamA/B fields + the existing summary blurb) instead.

#### Verified
- Synthetic 5-day finished Test match (identical underlying stats every day, via reused ball data) via `npx tsx`: existing day-overview anti-repeat still produces 5/5 distinct lines with zero code changes to it; new retrospective layer produces distinct lines across every adjacent day pair.
- Synthetic finished T20 match, 17 over-group cards: 17/17 distinct summary strings.
- Live-browser pass: innings-present-but-ball-less Past match shows lead-in + performance only (turning-point/day-cards correctly omitted, not a gap); empty-innings Past match shows the "Simple recap" card; Score tab shows the new header for both; a live match's Live tab and tab bar are unchanged.

---

## [1.0.96] 2026-07-22

### Digest no longer trusts nested fields to update in lockstep with `match.status`

#### Context
- All prior Digest verification (duplication fix, narrative-repetition fix, visual-hierarchy fix, ref-based cache) was done while matches were live. A dedicated post-match-transition test found two real bugs: the final day/session's "STUMPS" collapse relied on each session's own `isComplete` flag rather than `match.status`, and the match-summary card silently rendered nothing whenever `match.result` was missing, regardless of whether the match had actually finished.

#### Fixed — `components/DigestTab.tsx`
- `buildTestSessionCards()`: added a function-scoped `effectivelyComplete(sess) => !isLive || sess.isComplete` helper and routed the cached-card reuse guard, the `isLiveSession` card field, and the day-level `allComplete` check through it. While live, the per-session flag stays authoritative; once the match is no longer live, every session is treated as complete regardless of its own flag.
- `buildMatchSummaryCard(match, isLive)`: now authoritative on `match.status` too. Real `result` -> full card as before. Still live with no `result` -> `null`, unchanged. Otherwise -> a minimal result derived from final scores when unambiguous (new `deriveMinimalMatchResult()`, non-Test two-innings chase only, marked `isDerived: true` with a small inferred-result caption), or a new explicit `PendingResultCard` ("Final result pending", final scores shown) when it can't be safely derived (e.g. Test matches).
- `buildCards()` now threads `isLive` into `buildMatchSummaryCard`; the Test-day and non-Test-innings filters pin `pending-result` cards the same way `match-summary` cards are already pinned.

#### Verified
- Direct `buildCards()` calls via `npx tsx` against constructed scenarios (mirroring the diagnosis method): (1) a finished Test match with its final session's `isComplete` deliberately left stale (`false`) -- day still collapsed correctly into one day-summary card; (2) a finished Test match with sessions properly finalized but `result` deleted -- rendered an explicit `pending-result` card (real final scores) instead of a gap; (3) a genuinely-completed T20I with `result` deleted -- derived card exactly matched the deleted ground truth ("India won by 6 wickets").
- `tsc --noEmit` and `npm run build` clean.

---

## [1.0.95] 2026-07-22

### Confirmed `bawler:followedTeam` is dead legacy state, fixed a stale comment referencing it

#### Context
- Two follow-related localStorage keys were found set independently during testing: `bawler:followPrefs` (the real, structured multi-category state) and `bawler:followedTeam` (a single string). Asked to confirm whether the latter is still active or legacy, and remove it if genuinely dead.

#### Investigated
- Grepped every occurrence of `followedTeam` in the repo -- one hit, a comment in `lib/followPrefs.ts` documenting that `lib/followedTeam.ts` was deleted. The file doesn't exist on disk.
- Grepped every `localStorage` call in the codebase -- only `lib/followPrefs.ts` (`bawler:followPrefs`), `lib/followNudge.ts`, and `lib/narrativeThresholds.ts` touch it at all, none of them reference `bawler:followedTeam`. No dynamic key access anywhere.
- Conclusion: `bawler:followedTeam` was removed from source at v1.0.52 and has zero live code paths today. A value sitting in some browser's localStorage is inert leftover from a pre-v1.0.52 deploy -- it cannot influence "for you," hero selection, or anything else, since nothing reads it. `bawler:followPrefs` is the only source of truth for follow state, and can't desync from a key nothing reads.

#### Fixed — `app/page.tsx`
- `ForYouRow`'s docstring still described the deleted single-team mechanism ("tapping the label opens an inline team picker... default India") -- none of that has been true since the v1.0.52 rewrite. Updated to describe the current Filter-sheet-backed mechanism.

#### Verified
- `tsc --noEmit` and `npm run build` clean

---

## [1.0.94] 2026-07-22

### "Coming Up" header count now matches its actually-rendered card list

#### Context
- Confirmed live (twice): following a team whose "for you" match got pulled from the "Coming Up" grid (v1.0.93) left the header reading "COMING UP · 11" while only 10 cards actually rendered. The header's `count` prop read `futureList.length` (raw, unfiltered) while the grid below applied its own filter (`!spotlightIds.has(m.id) && m.id !== forYouVisible?.id`) inline -- the same latent mismatch existed for the pre-existing Spotlight-dedup exclusion too, just less often noticed.

#### Fixed — `app/page.tsx`
- Added `futureVisible`, a `useMemo` applying the exact filter the grid used to apply inline. `ColumnHeader`'s `count` prop and the `.map()` render both now read this one array, so they can't drift apart again.

#### Verified
- `tsc --noEmit` and `npm run build` clean
- Live (Claude-in-Chrome, `localStorage` follow-pref override + reload): followed Delhi Capitals (`DC`), whose lone qualifying match is the upcoming `ipl2026-m42-rcbvdc` — confirmed the header count dropped by exactly one (11 → 10), matching the 10 cards actually rendered.

---

## [1.0.93] 2026-07-22

### "For you" upcoming match no longer duplicates into the "Coming Up" grid

#### Context
- The single soonest-qualifying upcoming match selected by `forYouResult` and rendered in "for you" was still also rendering a second time in the "Coming Up" grid below, since that grid's only existing exclusion was Spotlight dedup (`spotlightIds`), unrelated to "for you". Scoped narrowly per the request: don't touch `forYouResult`'s selection logic, don't touch the live path (already fixed in v1.0.91), only stop the one match currently shown in "for you" from also appearing in Coming Up.

#### Fixed — `app/page.tsx`
- `futureList.filter(m => !spotlightIds.has(m.id) && m.id !== forYouVisible?.id)` — one added clause on the existing filter, mirroring "for you"'s own `m.id !== heroId` hero-exclusion (v1.0.53) in the other direction. Uses `forYouVisible` (not `forYouResult.upcoming` directly) so the two dedup mechanisms never conflict: if the selected match is also a Spotlight match, `forYouVisible` is already `null` and that match is already excluded from Coming Up via `spotlightIds` — nothing extra needed.
- A follow whose category has multiple qualifying upcoming matches still only pulls the single soonest one (the one actually shown in "for you"); every other qualifying-but-not-selected match stays visible in Coming Up exactly as before.

#### Verified
- `tsc --noEmit` and `npm run build` clean
- Live (Claude-in-Chrome, `localStorage` follow-pref overrides + reload): a nation follow (South Africa) whose only qualifying match anywhere is the upcoming England-South Africa ODI — appeared in "for you", confirmed absent from Coming Up. A team follow (Sunrisers Hyderabad) with two qualifying upcoming fixtures — confirmed only the soonest (shown in "for you") disappeared from Coming Up while the later one stayed visible there.

---

## [1.0.92] 2026-07-21

### Docs: fix v1.0.91 DECISIONS-LOG ID collision + stale DESIGN-SYSTEM.md statements

#### Fixed — `DECISIONS-LOG.md`
- v1.0.91 added 4 new entries labeled FY7, FY8, FY9, FY10 — unknowingly colliding with 4 pre-existing v1.0.58 entries using the exact same IDs (followed-team left-side ordering, colored left border). Renumbered the new entries to FY11, FY12, FY13, FY14 and fixed every cross-reference, including one internal self-reference within the new section itself (FY13 pointing to FY12's `liveIds`).

#### Fixed — `BUILD-STATUS.md`, `README.md`
- Updated the 3 cross-references that pointed at the now-renumbered FY7/FY9 IDs to FY11/FY13, and the v1.0.91 changelog row's "FY7-FY10" range to "FY11-FY14".

#### Fixed — `DESIGN-SYSTEM.md`
- The §6 card-tier table's "For you" row still described itself as auto-height "depending on live/upcoming content" — no longer accurate since v1.0.91 restructured it to only ever render the single upcoming pick (live qualifiers get an inline marker on the live carousel instead). Updated to describe the current behavior and point at `ForYouInlineBadge`.
- The §7 swipe-carousel dot-indicator bullet still listed a violet "for you" instance of `CarouselDots` — removed in v1.0.91 along with `FOR_YOU_LIVE_MAX` once "for you" could never render more than one card. Updated to drop the dead reference and note why it's gone (DECISIONS-LOG.md FY12).

#### Verified
- `tsc --noEmit` and `npm run build` clean
- `grep`'d every `.md` file for `FY[0-9]` afterward to confirm no remaining collisions or dangling references

---

## [1.0.91] 2026-07-21

### "For you" card: fix nation-follow suppression + live-carousel duplication, add explicit tier-priority order

#### Context
- Four issues isolated via prior controlled testing (constructed trace + live check, not guesswork): two independent bugs and two undefined-behavior gaps in the "for you" personalization card.

#### Fixed — `lib/followPrefs.ts`
- Bug 1: `qualifyMatch()`'s nation condition was `nation = !!nationMatches && match.competition.type !== "bilateral"`, blanket-suppressing every bilateral match for a followed nation (most international cricket is bilateral, so this made "for you" go dark for most nation follows most of the time). Changed to `nation = !!nationMatches` — hero-exclusion (the only thing the old gate was actually protecting against) is handled uniformly downstream by the existing `m.id !== heroId` filter, the same mechanism team/tournament/series/format follows already used.

#### Fixed — `components/MatchCard.tsx`, `components/LiveCarousel.tsx`
- Bug 2: qualifying live matches used to render as a second, separate "for you" card duplicating the one already visible in the live carousel above. Added `ForYouInlineBadge` (normal-flow layout, not absolutely positioned like the existing `ForYouMarker`, so it doesn't stack on `LiveMatchCard`'s own "LIVE" label) and a new `forYou?: boolean` prop on `LiveMatchCard`; `LiveCarousel` threads a new `forYouIds?: Set<string>` prop down to it.

#### Fixed — `app/page.tsx`
- `forYouSelection` restructured into `forYouResult` (`{ liveIds: Set<string>; upcoming: Match | null }`). Because `liveCarouselMatches` already renders every live match unconditionally, a qualifying live match is always already visible there — so live qualifiers (excluding the homepage's own hero match, unchanged) always become marker ids passed to `<LiveCarousel forYouIds={...}>`, never a standalone card. The upcoming fallback only runs when there are zero live qualifiers, preserving the existing re-trigger behavior (a followed team's/nation's only live match being the hero still correctly falls through to that team's/nation's next upcoming match).
- Gap 1: added `bestFollowRank()` — an explicit priority order for the upcoming fallback when multiple followed categories each have a candidate: team (1) > series (2) > tournament (3) > nation (4) > format (5), player unchanged as a Tier-2 fallback. Candidates are filtered to the single most-specific rank present, then tie-broken by soonest start time — replacing the old pure "whichever is chronologically soonest" selection.
- Removed `FOR_YOU_LIVE_MAX` and the now-dead multi-card mini-carousel/drag-to-scroll/dot-indicator branch that only ever fired for 2-3 simultaneous live qualifiers — "for you" can render at most one card now (the single upcoming pick).

#### Gap 2
- Confirmed (constructed test + live check) that following a nation, team, or player with zero current/near-term matches returns cleanly with no card and no error, matching the already-correct series/tournament case — all four categories share the same code path, so there was no per-category special-casing to fix.

#### Verified
- `tsc --noEmit` and `npm run build` clean
- Constructed trace against real mock data: nation follow (India) now correctly picks up its non-hero live bilateral match; nation follow (Australia) whose only live match IS the hero correctly falls through to the next upcoming AUS-IND match; an isolated priority test confirmed a team follow's later match beats a nation follow's chronologically-sooner match, proving rank (not just soonest) governs the upcoming pick; zero-match nation/team/player follows all returned cleanly with nothing shown
- Live (Claude-in-Chrome, `localStorage` follow-pref overrides + reload): nation follow with a live bilateral match not the hero, team follow with a live match not the hero, and two simultaneous qualifying follows — confirmed no duplication anywhere on the homepage and no console errors

---

## [1.0.90] 2026-07-21

### Add version footer to the homepage (it never had one)

#### Context
- Raised during a "for you" investigation: the homepage shows no version string at all, making it hard to confirm which deploy is being tested. Checked and confirmed this is NOT a regression of the v1.0.83 fix -- `APP_VERSION_LABEL` was only ever wired into `components/MatchView.tsx` (the match-detail page); the homepage simply never had a footer element of any kind.

#### Added — `app/page.tsx`
- Imports `APP_VERSION_LABEL` from `lib/version.ts`
- Renders the identical `Bawler {APP_VERSION_LABEL} · all data mocked` footer at the bottom of the page, matching `MatchView.tsx`'s styling exactly

#### Verified
- `tsc --noEmit` and `npm run build` (including the `prebuild` version-check gate) clean
- Live: homepage footer now reads `Bawler v1.0.90`; match page footer unchanged, still reads the same value -- both pages agree

---

## [1.0.89] 2026-07-21

### "For you" upcoming card: differentiate presentation by distance instead of hiding far-off matches

#### Context
- Confirmed (prior investigation, not a code change): `forYouSelection`'s upcoming-match fallback (`app/page.tsx`) has no lookahead cutoff — it always picks the single soonest qualifying match regardless of how far out it is. That selection logic is deliberately left untouched here; the actual problem was presentation, not selection.

#### Added — `app/page.tsx`
- `fmtShortDate(iso)` — compact date formatter (`month: "short", day: "numeric"`, no weekday/year), distinct from `MatchCard.tsx`'s fuller `fmtDate`
- `FOR_YOU_COUNTDOWN_MAX_MS = 7 * 86400000` and `fmtForYouDistance(iso)`: within 7 days, returns the existing `` `${fmtCountdown(iso)} · ${fmtTime(iso)}` `` unchanged; beyond 7 days, returns `` `Next match: ${fmtShortDate(iso)}` `` instead — a countdown stops being meaningful information at that distance
- `ForYouRow`'s upcoming-match line now calls `fmtForYouDistance()` instead of inlining `fmtCountdown`/`fmtTime` directly

#### Note — correction to the request's premise
- The request described this as matching a convention the "Coming Up" grid (`FutureMatchCard`) already uses. Checked directly: `FutureMatchCard` always renders the countdown format regardless of distance — there was no existing 7-day split anywhere in the app before this change. Implemented as new presentation logic scoped to `ForYouRow` only; `FutureMatchCard` is unchanged and would show the same "in 84d 3h"-style noise for a genuinely distant match today.
- Kept the app's existing `en-IN`, day-before-month date convention (e.g. "19 Oct") rather than the request's own casual month-day example ("Oct 15"), for consistency with every other date string in the app.

#### Verified
- `tsc --noEmit` and `npm run build` clean
- Constructed synthetic timestamps at 2 days (countdown format), 6.9 days (still countdown), 7.1 days (switches to plain date), and 90 days (plain date, no countdown text) — all four behaved as specified, boundary checked from both sides

---

## [1.0.88] 2026-07-21

### Filter sheet: split bilateral series out of Tournaments into a new Series category

#### Fixed — `lib/followPrefs.ts`
- `FollowPrefs` gained a new `series: string[]` field, threaded through everywhere `tournaments` already existed: `emptyFollowPrefs()`, `sanitizeFollowPrefs()` (new `validSeriesIds()`, and `validTournamentIds()` narrowed to `type !== "bilateral"` so a stale bilateral id previously stored under `tournaments` is correctly dropped rather than silently kept), `prefsEqual()`, `totalFollowCount()`
- `MatchQualification` gained a `series: boolean` field (same `match.competition.id`/`match.championship.id` check as `tournament`); `isTier1Match()` now includes it, so a followed series surfaces in the homepage "for you" row exactly as a followed tournament always has

#### Fixed — `components/FollowSheet.tsx`
- `buildOptions("tournaments")` now filters to `Competition.type !== "bilateral"` — genuine multi-team competitions only
- New `buildOptions("series")` case filters to `Competition.type === "bilateral"` — The Ashes, India tour of England 2026, India tour of Australia 2026, South Africa tour of England 2026
- `CATEGORY_META` gained a `series` entry, placed right after `tournaments`: Nations, Tournaments, Series, Teams, Players, Formats
- `totalSelected` calculation includes `draft.series.length`

#### Added — `scripts/series-category-check.ts`
- Constructed checks (not just a visual pass): Tournaments contains zero bilateral entries and all 4 real-world named ones (BBL, IPL, Champions Trophy, T20 WC, WTC) remain; Series contains exactly the 4 bilateral entries; a constructed match qualifies as Tier 1 when its series is followed via `prefs.series`; a stale bilateral id under `tournaments` is dropped by `sanitizeFollowPrefs`, while the same id under `series` survives

#### Verified
- `npx tsx scripts/series-category-check.ts` — all checks pass
- `tsc --noEmit` and `npm run build` clean
- Live: category rail reads Nations/Tournaments/Series/Teams/Players/Formats; "India tour of Australia 2026" and "India tour of England 2026" (and The Ashes, South Africa tour of England) confirmed absent from Tournaments and present under Series; Tournaments confirmed to contain only genuine competitions

---

## [1.0.87] 2026-07-21

### Filter sheet: pluralize category rail labels

#### Fixed — `components/FollowSheet.tsx`
- `CATEGORY_META` labels changed to plural: "Nation"->"Nations", "Tournament"->"Tournaments", "Team"->"Teams", "Player"->"Players", "Format"->"Formats" — each category is a list of multiple items, so the label should read as a plural
- Label text only; category keys, order, and all behavior unchanged. Search placeholder ("Search {label}...") now also reads correctly in plural (e.g. "Search nations...")

#### Verified
- `tsc --noEmit` clean
- Live: all 5 category rail labels confirmed displaying in plural form

---

## [1.0.86] 2026-07-21

### Filter sheet: category order, real team colors, meaningless-dot removal

#### Updated — `components/FollowSheet.tsx`
- `CATEGORY_META` reordered: Nation, Tournament, Team, Player, Format (was Nation, Team, Tournament, Player, Format)
- `Swatch` (colored dot / flag) now only renders for the `nations` and `teams` categories; `tournaments`/`players`/`formats` render without one
- Dropped the now-unused `color` field from `buildOptions()`'s tournament and player mapping — `Competition.logoColor` repeats across unrelated tournaments (BBL and T20 World Cup both cyan), and a player's resolved team color duplicated the nationality text already shown as the sublabel; neither ever carried real signal
- `FORMAT_OPTIONS` never had a color field — every row fell through to the same gray default dot, conveying nothing

#### Fixed — `lib/mockData.ts`: franchise team colors audited against real official branding
- Researched all ~50 franchise teams (`TEAMS` + `LEAGUE_TEAMS`) via Wikipedia infoboxes, teamcolorcodes.com, schemecolor.com, TheSportsDB, and jersey-launch press coverage — not just the 4 user-flagged examples
- Corrected 20 teams whose current hex was in the wrong color family or explicitly contradicted by corroborating sources:
  - **GT** Gujarat Titans: `#4285F4`(Google-blue placeholder)/`#1B2133` → `#1B2133`/`#DBBE6E` (navy + gold)
  - **HEAT** Brisbane Heat: `#FF6600`/`#5B2D8E` → `#27A6B0`/`#FFFFFF` (teal + white)
  - **STR** Adelaide Strikers: `#003087`/`#FFB81C` → `#0084D6`/`#C8C8C8` (bright blue + silver)
  - **DURGD** Durban's Super Giants: `#00A0C6`/`#FF6600` → `#1079BF`/`#E10615` (blue + red)
  - **STARS** Melbourne Stars: `#00A650`/`#FFFFFF` → `#8DC64C`/`#287246`
  - **SCORCHERS** Perth Scorchers: secondary `#003087` → `#403529` (no blue in their real palette)
  - **HURRICANES** Hobart Hurricanes: secondary `#00BFFF` → `#C8CACB`; primary tightened `#5C1FAB` → `#674398`
  - **KAR** Karachi Kings: primary `#00AEEF` → `#0752C2` (deep sapphire, not cyan)
  - **PES** Peshawar Zalmi: `#F7A800`/`#C8102E` → `#FFC20F`/`#1A1A1A` (yellow + black, their kit since PSL4)
  - **QUE** Quetta Gladiators: primary `#2D2D8F` → `#5F0182` (true purple)
  - **MUL** Multan Sultans: primary `#8B0000` → `#1B3F8B` (royal blue — "always been their signature")
  - **ISL** Islamabad United: secondary `#004B87` → `#F67600` (no blue in their real palette)
  - **JSK** Joburg Super Kings: secondary `#005DB7` → `#0B713D` (green, not blue — Wikipedia: "Yellow and Green")
  - **PREC** Pretoria Capitals: `#002868`/`#00B5E2` → `#2958A5`/`#C82127` (blue + red)
  - **SKP** St Kitts & Nevis Patriots: primary `#006400` → `#CE1126` (red is the dominant color per every source)
  - **SEAO** Seattle Orcas: `#008080`/`#002868` → `#1A1A1A`/`#8BC53F` (black + light green)
  - **SFU** San Francisco Unicorns: secondary `#6B2C91` → `#1B3A5C` (navy, not purple)
  - **SRH** Sunrisers Hyderabad: primary tightened `#F7A721` → `#EE7429` (most-cited official orange)
  - **TRR** Trent Rockets: `#CC0033`/`#FFFFFF` → `#FFD500`/`#CC0033` (yellow is their retained identity color)
  - **WEF** Welsh Fire: secondary `#FFD700` → `#1A1A1A` (black, per retailer-confirmed kit)
- Barbados Royals' pink (`#EA1A85`) reconfirmed correct — not changed
- Left unchanged where current values fell within a reasonable/defensible shade of researched official colors: MI, CSK, KKR, RCB, DC, RR, PBKS, LSG, SIXERS, THUNDER, RENE, LAH, TKR, GAW, JAT, SLK, LAKR, TSK, MINE, WASF, MICT, SEC, PARR

#### Added — `lib/mockData.ts`: The Hundred's real 2026 ownership rebrand
- Discovered mid-audit (verified via Sky Sports, Yahoo Sports, cricketnmore.com) that the real competition renamed 3 teams for 2026 after IPL-adjacent groups bought ownership stakes, with kit colors changed to match the new owner's IPL franchise. Flagged to the user as a scope question before acting (renaming teams is bigger than a color fix); user chose full rename + recolor.
- **Oval Invincibles → MI London** (`OVI` → `MIL`): colors set to Mumbai Indians' blue/gold (`#004BA0`/`#D1AB3E`)
- **Manchester Originals → Manchester Super Giants** (`MOR` → `MSG`): colors set to `#C8102E`/`#00A2D6` (red + blue, per Sky Sports/The National's specific "United red / City blue" description — deviates from parent Lucknow Super Giants' own blue/orange)
- **Northern Superchargers → Sunrisers Leeds** (`NSC` → `SUL`): colors set to Sunrisers Hyderabad's orange/black (`#EE7429`/`#000000`)
- **Southern Brave** (`SBR`, name unchanged): recolored to Delhi Capitals' blue/red (`#17449B`/`#EF1B23`)
- Updated the 3 internal references to the old codes found via grep: the Hundred standings rows, one scheduled match's `teamA` object reference, and Ben Stokes' `franchiseCode`
- Squads intentionally left untouched — a full roster reconciliation against the real 2026 auctions is a separate, larger task not in scope here

#### Verified
- `tsc --noEmit` and `npm run build` clean
- Grepped for every old team code (`OVI`, `MOR`, `NSC`) across the repo to confirm no stray references remained after the rename

---

## [1.0.85] 2026-07-20

### Docs: full sync covering everything shipped since the last sync (v1.0.71–v1.0.84)

#### Updated — `DECISIONS-LOG.md`
- New sections: series-chip/table-pill saga (TC1–TC4, v1.0.71–v1.0.74), dot-indicator + hero badge + tab-width fixes (DI1–DI2, HB1, TW1, v1.0.75–v1.0.79), real-data readiness fixes (RR1–RR6, v1.0.80), Digest tab overhaul (DG1–DG8, v1.0.81–v1.0.82), version-footer root-cause fix (VF1–VF3, v1.0.83)

#### Updated — `BUILD-STATUS.md`
- Current-version bumped to v1.0.85; new v1.0.71–v1.0.79 and v1.0.80–v1.0.84 changelog tables; Digest tab section rewritten for the performance/structure/narrative/visual overhaul; Tech/infra section gained validation-layer, win-prob null-safety, and version-enforcement bullets

#### Updated — `README.md`
- Version header + status line bumped v1.0.74 → v1.0.85; Digest tab description updated for the overhaul; Key data rules gained `normalizeMatch()` and `getPlayerShortName()` entries

#### Updated — `DESIGN-SYSTEM.md`
- Added a cross-reference note under §6 pointing to `DigestTab.tsx`'s notable/routine boolean-gate treatment as a reuse of the same Spotlight philosophy off the homepage

#### Verified
- `git status --short` / `git diff --stat` confirmed only doc files (plus the version bump) changed before committing — no code touched in this pass
- `tsc --noEmit` and `npm run build` clean

---

## [1.0.84] 2026-07-20

### Docs: document Digest cache's append-only assumption

#### Updated — `DECISIONS-LOG.md`, `components/DigestTab.tsx`
- Added RD8 to the "Real-data architecture" table: the `DigestCardCache` (v1.0.81) assumes real feeds are append-only, with no invalidation path for a backfilled correction to a past ball (e.g. a DRS overturn or scoring correction)
- Explains the consequence if that assumption is ever wrong (stale card until the tab unmounts/remounts — reload, or navigate off Digest and back) and confirms the cache is plain in-memory (`useRef`), never written to `localStorage`/`sessionStorage`/any server store
- Added a cross-referencing comment at the `cacheRef` declaration in `DigestTab.tsx` pointing to RD8
- No code behavior change — documentation only

#### Verified
- `tsc --noEmit` and `npm run build` clean, including the `prebuild` version-check gate

---

## [1.0.83] 2026-07-20

### Fix from root: stale footer version + structural guard against recurrence

#### Fixed — `components/MatchView.tsx` footer showed hardcoded "Bawler v1.0.65" despite 17 subsequent releases
- Root cause: the footer string was a literal, written once and never updated again — a hard refresh could never fix it because the deployed code itself, not a cache, was wrong
- New `lib/version.ts` derives `APP_VERSION`/`APP_VERSION_LABEL` directly from `package.json`'s `"version"` field; footer now renders `{APP_VERSION_LABEL}` instead of a literal

#### Added — `scripts/version-check.ts`, wired as an npm `"prebuild"` hook
- Confirms `lib/version.ts`'s derived values match `package.json`
- Walks `app/`, `components/`, `lib/` for any other file with a hardcoded `Bawler vX.Y.Z` pattern outside an explicit allowlist (`lib/version.ts` only)
- Runs automatically as part of `npm run build` — the same command Vercel's deploy pipeline invokes — so a reintroduced hardcoded version literal fails the build outright instead of silently shipping

#### Added — `package.json`
- `tsx` added to `devDependencies`; new `"prebuild"` and `"version-check"` npm scripts; `package-lock.json` regenerated and kept in sync

#### Verified
- Deliberately reintroduced the original bug twice — once against `version-check.ts` standalone, once against the full `npm run build` pipeline — confirmed both fail with a clear error, then reverted
- Live: footer correctly shows the current version after deploy

---

## [1.0.82] 2026-07-20

### Fix: real repeat-phrase bug found live in v1.0.81's Digest narrative variety

#### Fixed — `components/DigestTab.tsx`
- Live testing on the deployed v1.0.81 site showed Day 2's two bowling-dominated sessions (5 wkts/116 runs, then 6 wkts/32 runs) both closing with "...Brutal and brilliant." despite the new anti-repeat logic
- Root cause: `pickUnusedPhrase(variants, used: Set<string>)` tracked usage by comparing the fully-rendered string (numbers already interpolated) — different embedded numbers meant the two sessions' strings never matched, so the `Set` never registered a repeat and kept returning the same variant-0 template for both
- `digest-check.ts`'s local test had used identical stats across all 3 test sessions, which produced identical rendered strings and made the buggy check accidentally "pass" locally — masking the defect entirely until live verification
- Replaced the whole mechanism with `pickPhrase(variants, seed)` — deterministic slot-index selection, seeded off each session's own ordinal position within the day (`slotIndex + e.sess.day`) — guarantees distinct variants regardless of what numbers get interpolated

#### Updated — `scripts/digest-check.ts`
- Strengthened to use deliberately different stats per test session (previously identical), plus a fixed-phrase-marker check (`["Brutal and brilliant.", "on its own.", "had no answers."]` each used ≤1 time within a day) so this exact failure mode can't be masked again

#### Verified
- Live on the deployed site: Day 2's two bowling-dominated sessions now render distinct closing lines
- `digest-check.ts` passes with the strengthened, non-identical test data

---

## [1.0.81] 2026-07-20

### Digest tab overhaul: performance, structure, narrative quality, visual hierarchy

#### Added — `scripts/digest-benchmark.ts`
- Synthetic 4-innings, 5-day, ~2190-ball Test generator; measures total/avg/p50/p90/p99/max recompute time and object-identity stability across ticks, with and without caching
- Benchmarked before deciding scope: raw recompute cost was never the bottleneck (avg ~1.7ms, max ~7ms even near a full match) — the real cost was React re-render triggered by every card getting a brand-new object reference on every live tick

#### Added — `DigestCardCache` (`components/DigestTab.tsx`)
- `Map<string, DigestCardData>` held in a `useRef`, reset when `match.id` changes
- Populates a card only once its underlying data can never change again — a Test session/day marked `isComplete`, or an over-group chunk that's provably complete by construction (`completedOverNums` already excludes any partial trailing over)
- All 4 card view components (`OverGroupCardView`, `SessionCardView`, `DaySummaryCardView`, `MatchSummaryCardView`) converted to `React.memo`
- Re-benchmarked after: object-identity stability across ticks went from 0% to ~95%
- Depends on an explicit append-only assumption about the underlying feed (documented later as RD8, v1.0.84)

#### Fixed — day/session card duplication (`buildTestSessionCards()`, `components/DigestTab.tsx`)
- While a day is still in progress, individual session cards render as each session completes (unchanged, already correct)
- Once a day fully ends, those session cards are now replaced by a single consolidated `DaySummaryCard` describing however many sessions were actually played (2 on a weather-shortened day, 3 normally) — no more lingering duplicate session cards alongside the day card

#### Added — narrative variety (`pickUnusedPhrase`, `buildSessionLine()`, `components/DigestTab.tsx`)
- Day-report session lines bucketed by what actually happened before picking a phrase: weather-shortened / bowling-collapse / strong-bowling / dominant-batting / steady-batting / stalemate / swing / competitive, checked in that priority order — rather than one generic dramatic closer regardless of context
- Phrase bank expanded to 3 variants per bucket; usage tracked within a day summary so two sessions shouldn't repeat the same line (later found to have a real gap — see v1.0.82)

#### Added — visual hierarchy: `isNotableOverGroup`/`isNotableSession`/`isNotableDay` (`components/DigestTab.tsx`)
- Each clears on one explicit, concrete condition (e.g. an 11-wicket day) — the same boolean-gate philosophy already used by `lib/spotlight.ts` for homepage Spotlight, not a composite/accumulated score
- Notable cards get a subtle amber accent border (plus the existing pulsing `excitement-glow` if also live) instead of a loud badge; routine cards stay visually quiet
- `DaySummaryCardView` also swaps header background/label color via full literal Tailwind class strings selected by ternary — a template-interpolated class name (e.g. `` `border-${accent}/20` ``) is invisible to Tailwind's build-time JIT scanner and would have silently shipped with no visible accent; caught by reasoning through the build pipeline before it ever deployed

#### Updated — T20/ODI over-group cards (`buildOverGroupCards()`, `components/DigestTab.tsx`)
- Same cache-by-id treatment (safe unconditionally, since every produced over chunk is provably complete) and same `isNotable` boolean-gate visual treatment as the Test session/day cards — variety and notable-vs-routine distinction aren't Test-only

#### Added — `lib/narrativeThresholds.ts` (runtime-overridable thresholds, carried over from v1.0.80)
- `buildNarrative`/`buildOverSummary`/`buildDayReport` now take threshold params defaulting via `getNarrativeThresholds()`

#### Verified
- Live on the deployed site: multi-day Test shows exactly one consolidated card per completed day, including a weather-shortened 2-session day; an in-progress day still shows session cards as they finish
- Live: a dramatic day (11-wicket collapse) visually distinguishable from a routine day via the amber accent
- Benchmark results reported for a full 5-day/~2190-ball synthetic Test, not just a short match
- Investigated a suspicious hydration warning (#418/#423) found on deploy; root-caused to a pre-existing, unrelated `MatchView.tsx` tab-restoration pattern via fetching and grepping the deployed JS bundle — confirmed not caused by this change (homepage unaffected, Digest isn't mounted there by default)

---

## [1.0.80] 2026-07-20

### Real-data readiness: validation layer, name resolution, session detection, thresholds, win-prob null-safety

#### Added — `lib/dataValidation.ts`
- `normalizeMatch(raw, opts?)` validates Match/Innings/Ball/Team/Venue/Competition shapes with hand-rolled type guards, collecting every issue into `errors` (blocking) and `warnings` (non-blocking, e.g. missing `innings[0].runs`) rather than failing on the first problem
- Never throws; logs via `console.error`/`console.warn` with a `[Bawler:DataValidation]` prefix
- Wired into `lib/matchGenerator.ts`: both `generatePastMatches`/`generateFutureMatches` now filter their generated output through `normalizeMatch(...).ok`

#### Added — `getPlayerShortName()` (`lib/mockData.ts`)
- Looks up each player's own registry `shortName` field instead of algorithmically splitting the full name string, which broke on multi-part surnames (Sri Lankan compound names, "de Silva"-style surnames)
- Falls back to the unmodified full name (never a guessed split) when a player isn't in the local registry — a slightly-longer label is a safer failure mode than a confidently wrong short name
- `DigestTab.tsx`'s `lastName()` rewritten to delegate to it

#### Fixed — `deriveTestSessions()` (`lib/transformers.ts`)
- Replaced single `SESSION_BREAK_MS` with a `SESSION_BREAK_MIN_MS`(20min)–`SESSION_BREAK_MAX_MS`(75min) window: a gap inside it (and not a day boundary, and not already covered by an explicit `KnownStoppage`) is a genuine session break; a gap outside it is an irregular stoppage that merges into the current session instead of advancing the session index
- Day-boundary detection made unconditional on calendar date rather than gap-dependent — fixes a previously-defined-but-unused `DAY_BREAK_MS` constant that the old logic never actually checked
- New `KnownStoppage` interface + `isWithinKnownStoppage()` for explicit stoppage metadata when available

#### Added — `lib/narrativeThresholds.ts`
- `getNarrativeThresholds()` merges a `localStorage`-persisted partial override over `DEFAULT_NARRATIVE_THRESHOLDS`, SSR-safe; `setNarrativeThresholdOverride()`/`clearNarrativeThresholdOverride()` manage it
- Lets narrative calibration against real match statistics be retuned without a full redeploy

#### Fixed — `lib/winProb.ts`
- `target!` non-null assertion in the chase-innings branch replaced with `if (target === null) { continue; }` — skips the point instead of computing a fake NaN-derived percentage
- `calculatePressureGauge` guards `firstInningsRuns` before computing `target = firstInningsRuns + 1`, returning `null` rather than computing off a fabricated value

#### Added — `scripts/edge-case-check.ts`
- Constructs a multi-part surname, a rain-delay-sized gap, and a null/zero first-innings-runs state — deliberately not reusing the mock generator's own "nice" data shapes

#### Verified
- All edge-case checks pass, including confirming the validation layer's warning log fires as expected
- `tsc --noEmit` and `npm run build` clean

---

## [1.0.79] 2026-07-20

### Fix: shorten Scorecard tab label to fit equal-width tabs cleanly

#### Fixed — `components/MatchTabs.tsx`
- v1.0.78's `min-w-0` fix exposed that "Scorecard" doesn't fit inside an equal-width ~80px tab even at zero letter-spacing (measured ~75px needed vs ~56px available) — was rendering as "SCOR…"
- Measured `tracking-widest`/`-wide`/`-normal` first; none closed the ~19px gap
- Shortened the visible label to "Score" (~47px, comfortable margin at the tab bar's normal `tracking-widest`); tab `key` stays `"scorecard"` — only the label changed, not the tab's identity or the Scorecard component it opens

#### Verified
- Live: all 5 tabs render at equal width with no truncation

---

## [1.0.78] 2026-07-20

### Fix: uneven match-page tab widths (add min-w-0)

#### Fixed — `components/MatchTabs.tsx`
- Tabs use `flex-1` (grow/shrink/basis:0%) intending equal widths, but a button's default `min-width: auto` made flexbox fall back to each button's own content width as a floor
- "Scorecard" (longest label, uppercase + `tracking-widest`) couldn't shrink below its own text width — measured ~110px vs ~71–75px for Live/Digest/Info/Table
- Added `min-w-0` so `flex-basis: 0%` can actually take effect across all tabs; added `truncate` as a safety net

#### Verified
- Live: confirmed the `truncate` safety net fired ("SCOR…") — addressed in the v1.0.79 follow-up above

---

## [1.0.77] 2026-07-20

### Fix: hero card badge — drop redundant team-matchup text

#### Fixed — `components/MatchCard.tsx` (`CompetitionBadge`)
- Hero card's badge showed "IND V AUS · Sydney" — pure duplication of the two teams already shown as the card's main content
- Root cause: `CompetitionBadge` renders `match.competition.shortName` verbatim; for bilateral series without a named identity, `shortName` literally IS the two teams restated ("IND v AUS", "IND v ENG") — confirmed in `lib/mockData.ts`'s `COMPETITIONS` map. Named series (Ashes) and every league (IPL, WTC) don't have this problem
- Fix scoped to the exact redundant case: when `competition.type === "bilateral"` AND `shortName` matches `"{teamA.code} v {teamB.code}"` in either order, swap the badge to the match format (T20I/ODI/Test/T20/Hundred) instead — genuine info not shown elsewhere on the card. Every other case renders unchanged
- Shared component used by hero, Spotlight, and past/future cards alike — Spotlight's badge corrected for free

#### Verified
- Live: hero card now shows format instead of restated team names; Ashes/IPL/WTC badges unaffected

---

## [1.0.76] 2026-07-20

### Fix: switch dot-indicator retry from rAF to setTimeout

#### Fixed — `lib/useCarouselIndex.ts`
- v1.0.75's fix (poll for `ref.current` via `requestAnimationFrame`) is correct in principle but `rAF` is fully suspended — not just throttled — while a tab is hidden/backgrounded
- Confirmed live: if `isBooting`'s ~350ms flip happens to land during that window, the rAF retry never fires and the same "dot stuck at index 0" symptom resurfaces from a different cause
- Switched to `setTimeout(50ms)`, which keeps running (at worst throttled) regardless of tab visibility — a one-time "has the node mounted yet" check never actually needed rAF specifically

#### Verified
- Live: dots correctly track swipe position after a background-tab scenario

---

## [1.0.75] 2026-07-20

### Fix: Spotlight/"for you" dot indicator stuck at index 0

#### Fixed — `lib/useCarouselIndex.ts`
- Root cause confirmed via direct React fiber inspection: the effect's deps are `[ref, itemCount]`; `ref` is a referentially-stable `useRef`, so once the effect has run once it only re-runs if `itemCount` itself changes
- Spotlight/"for you"'s calls live in `Home()`'s own hook list and run unconditionally on every render — including the very first `isBooting=true` render, which shows a skeleton instead of the real carousel markup. On that first run `ref.current` was `null`, so the effect returned early with no listener attached (confirmed live: the committed effect's `destroy` was `undefined`)
- ~350ms later the real carousel mounts, but `itemCount` never changed across that swap, so React's dependency check never gave the effect a second chance — the dot stayed on index 0 regardless of swiping, permanently
- Fixed inside `useCarouselIndex` only (no call-site changes needed): poll for `ref.current` via `requestAnimationFrame` instead of assuming it's already attached; resolves in one frame when it already is (LiveCarousel's case, unchanged), keeps checking otherwise; capped at ~2s of retries

#### Verified
- Live: Spotlight and "for you" dots now correctly track swipe position (superseded in one edge case by v1.0.76 above)

---

## [1.0.74] 2026-07-20

### Revert table pill + series chip to content-hugging (undo v1.0.68–v1.0.72)

#### Fixed — `components/LiveCarousel.tsx`, full revert per feedback
- The v1.0.68 fixed-width table pill (176px) cascaded into a chain of follow-on regressions: series chip truncation (v1.0.69 attempt) → font-shrink to compensate (v1.0.71) → row wrapping to two lines (v1.0.70) → that wrap regressing a second time once the font-shrink reverted (v1.0.72)
- The original content-hugging behavior never had any of these problems, so reverted the whole thread rather than continuing to patch it
- Restored the exact pre-v1.0.68 pill (content-hugging width, no `TABLE_PILL_WIDTH` constant) and the exact pre-v1.0.69 series chip (`text-[11px]`, `px-3 py-1.5`, `gap-1.5`, both icons, no `truncate`/`min-w-0`); container stays `flex-wrap`, unchanged from the original

#### Updated — `DESIGN-SYSTEM.md` §7
- Replaced the fixed-width-pill and shrink-resistant-chip bullets (describing the now-reverted v1.0.68–v1.0.72 behavior) with one bullet describing the restored content-hugging pattern, plus an explicit note against re-fixing the pill's width without solving the whole row's layout at once

#### Verified
- Live: pill and chip both content-hug again; no truncation, no two-row wrap, at every real `seriesStatus` string length currently in the mock data

---

## [1.0.73] 2026-07-20

### Fix: win-prob modal NOW-label offset from its own guideline

#### Fixed — `components/WinProbChart.tsx`
- Reported: current-point marker sits ~20px left of the "NOW" line
- Direct SVG coordinate inspection (live) found the dashed guideline, marker dot, and the trend line's own rendered endpoint were all already exactly on the same `nx`/`ny` — no data-reference mismatch between the dot and the line
- The actual offset was the "NOW" text label itself: deliberately placed at `nx+7..nx+33` (centered at `nx+20`) so the label box wouldn't cover the dot near a chart edge — a real ~20px gap between the label's text and the true line
- Fixed by moving the label above the entire plot area (same row as the "2ND INN" divider tag), centered on the same `nx` as the line/dot, clamped so it can't spill past either chart edge

#### Verified
- Live, ENG vs IND Test: label now sits directly above the true `nx` regardless of the dot's y-position near either chart extreme

---

## [1.0.72] 2026-07-20

### Revert font-shrink on series chip, use wrap as the valve

#### Fixed — `components/LiveCarousel.tsx`, reverted per feedback
- v1.0.71 shrank the series chip's type size (11px → 9.5px) plus padding/gap/icons to squeeze the full `seriesStatus` text into the leftover space next to the fixed table pill — reverted: font size (and padding/gap/icons) must stay fixed, identical to every other homepage chip, never auto-shrunk to solve a space problem
- Restored the chip's standard chrome (`text-[11px]`, `px-3 py-1.5`, `gap-1.5`, both icons); switched the row container back to `flex-wrap` — now the intended overflow valve: when the pill's fixed width leaves less room than the chip's full-size natural width, the chip wraps to its own full-width line below the pill at full size, rather than shrinking or truncating
- `truncate`/`min-w-0` remain only as a last resort for a future materially longer description

#### Updated — `DESIGN-SYSTEM.md` §7
- Describes the final approach and explicitly rules out shrinking this chip's type size again

#### Verified
- Live: chip renders at full size; wraps to its own row for the current Test match's longer `seriesStatus` string rather than truncating

---

## [1.0.71] 2026-07-20

### Fix: series chip truncation next to fixed table pill

#### Fixed — `components/LiveCarousel.tsx`
- Series chip's leftover space after the pill's fixed 176px + row gap (~167px available) was narrower than real `seriesStatus` strings in `mockData.ts` (168–179px at 11px), so `truncate` was firing on the everyday case
- Fixed by trimming the chip's own chrome, not the pill: dropped the decorative trailing chevron, tightened padding (`px-3`→`px-2.5`) and icon-text gap (`gap-1.5`→`gap-1`), reduced label size to `text-[9.5px]` (pill's 11px untouched)
- `truncate` + `min-w-0` stay on as a last-resort safety net for a future much longer string, not the normal path

#### Updated — `DESIGN-SYSTEM.md` §7

#### Verified
- Live: longest current string ("Series level 0-0 · 5-match T20I series", 179px) now clears the ~187px available with ~8px margin (later found insufficient for the Test match's longer string — see v1.0.72)

---

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


## [1.0.126] 2026-07-28

### Fix: "Your Players" strip — follow-on live-detection miss, name-format regression, sort-order symptom

#### Context
- Three bugs reported against the v1.0.125 strip: (1) B Stokes, genuinely live in a Test match on the follow-on, wasn't bumped up as live; J Bumrah in a separate live T20I correctly was. (2) Babar Azam's chip showed his full name instead of the platform's Initial+Surname format. (3) non-favourited/non-live players appeared ordered by first name, not surname.

#### Fixed -- `lib/matchStatus.ts` (new), `components/ScoreBar.tsx`, `lib/playerActivity.ts`
- New shared `getCurrentInnings(match)` -- the same "last innings in the array" lookup `ScoreBar.tsx` already used inline for its own v1.0.122 follow-on fix, now extracted into one function both files call, so the two can't silently re-diverge again.
- `lib/playerActivity.ts`'s `getLiveActivePlayerIds` rewritten: previously read only the single LAST ball's 2 participants across all flattened innings (missed anyone else batting/bowling in a multi-batter-deep current innings, like Stokes' follow-on). Now reads the current innings' FULL `battingCard` + `bowlingCard`, gated on `current.balls.length > 0` (no guessing from an unstarted innings' pre-authored placeholder card).
- `FEATURED_MATCH`'s permanently-mislabeled `status: "live"` (deliberate mock-data design) still trusted as-is -- this fix only widens who counts as involved once a match is already live, not whether the match itself is live.

#### Fixed -- `lib/mockData.ts`
- `b-azam`'s `shortName`: `"Babar Azam"` → `"B Azam"`. `a-iqbal`'s `shortName`: `"Arshad"` → `"A Iqbal"`. Both were data-authoring errors, not parser bugs -- `formatPlayerName()`'s registry-first lookup was working exactly as designed. Full 21-player registry audit confirmed no other mismatches besides the intentional `s-yadav`/"SKY" nickname exception.

#### Investigated, not changed -- `lib/yourPlayers.ts`
- The reported "sorted by first name" symptom could not be reproduced as an independent comparator defect on repeated isolated testing. Most likely explanation: a downstream symptom of the live-detection bug above -- a player unexpectedly jumping tiers due to inconsistent live-flagging looks like wrong alphabetization to an observer.

#### Tests
- `npx tsx`, 21/21 pass: white-ball match (regression guard), constructed normal Test with no follow-on, real follow-on Test (Stokes now correctly live), constructed white-ball negative control, full real-data 4-tier sort with a first-name-disagreeing player set, full 21-player shortName audit.

## [1.0.127] 2026-07-28

### Fix: recent-form graph missing for India's Test batters (and others) despite real settled data existing

#### Context
- Kohli/Rohit Sharma/Gill's Test recent-form graphs were empty despite their real, already-happened 1st-innings performances (121/83/110) in the live India-England Test being correctly shown on that match's own Score tab. England's players in the same match, and Kohli's own T20I graph, worked fine -- pointed at a code-level bug rather than a mock-data gap.

#### Fixed -- `lib/playerForm.ts`
- Root cause: the "settled" gate (`hasUsableResult(match)`) operated at the MATCH level, discarding an entire match's data (including already-finished earlier innings) whenever the match overall hadn't concluded yet. India's only Test in the mock dataset is genuinely still in progress (Day 3, follow-on, no result yet) -- so the whole match, including India's fully-complete 1st innings, was discarded. This also silently affected England's own already-closed 1st-innings entries from the SAME match; Root/Stokes only appeared unaffected because they separately have entries from an unrelated, concluded past Test.
- New `eligibleEntriesFor()` decides eligibility per INNINGS instead, via the shared `getCurrentInnings()` lookup (`lib/matchStatus.ts`, same one `ScoreBar.tsx`/`lib/playerActivity.ts` use): any innings that isn't the match's current one is closed by construction and fully trusted. For the current innings of a still-unresolved live match: batting entries count once the player is dismissed (`out: true`); bowling entries are excluded until the innings closes or the match concludes (a spell's tally can still grow, unlike a dismissed batter's final total). The existing placeholder-innings guard (`balls.length === 0`) still applies first.

#### Platform-wide audit
- Found and fixed the identical gap for `j-hazlewood`/`y-chahal`'s closed-innings bowling figures in the AUS-vs-IND T20I -- confirms this was a general match/innings-granularity bug, not India- or Test-specific.
- ODI: India has zero matches (settled or live) anywhere in the current mock dataset -- this fix is untestable for India/ODI until real or more mock data exists. Noted, not assumed fine.

#### Tests
- `npx tsx`, real mock data, cross-checked against Score tab figures: Kohli/Rohit/Gill Test graphs now show `[121]`/`[83]`/`[110]`. England regression (Root, Stokes, Crawley, Duckett) unchanged in shape, now also correctly including this match's closed 1st innings. India bowlers' still-open current spell correctly excluded. Kohli's T20I graph regression-checked unchanged. Achievements spot-checked unaffected.

## [1.0.128] 2026-07-28

### Fix: Man of the Match avatar in Digest summary card was reading a nonexistent field, permanently stuck on initials

#### Context
- Requested confirmation that player avatars check for a real photo URL first and fall back to initials, so real data flowing in later needs zero code changes. Audited every avatar render site in the codebase.

#### Confirmed correct, no change
- `components/YourPlayersStrip.tsx` -- already does photo-first-fallback-to-initials correctly (`imageUrl` check + `onError` handler).

#### Fixed -- `components/DigestTab.tsx`
- The Man of the Match avatar's derivation read `PLAYERS[slug]?.photoUrl` -- a field that doesn't exist on `PlayerProfile` (the real field is `imageUrl`). This was a type-level lie that always resolved to `null`, so the avatar was permanently stuck on initials and would have stayed stuck even once real photo data arrived, since it was never reading the right field. Fixed to read `imageUrl`. Verified end-to-end: populated `imageUrl` on a real player with zero further code changes, re-ran `buildCards()`, confirmed the avatar's URL picked it up automatically.

#### Flagged, not changed
- `components/PlayerProfileView.tsx`'s header has no avatar element at all today (not a fallback bug -- there's simply no photo/initials UI there yet). Flagged as a design decision rather than added unilaterally.
- `components/BallGIF.tsx`'s inline initials labels during the ball animation are a different, space-constrained design context -- not a photo-capable avatar, left as-is.

## [1.0.129] 2026-07-28

### New: player avatar in profile page header, via one shared avatar component reused platform-wide

#### Context
- The profile page header had no avatar at all. Requested reuse of the exact same photo-first-fallback-to-initials pattern already correct in the "Your Players" strip, as ONE shared component consumed everywhere, rather than a third independent implementation -- the same duplication risk that let the Digest tab's MOM avatar drift onto a wrong field name (v1.0.128).

#### New -- `components/PlayerAvatar.tsx`
- `imageUrl` first, initials-in-a-circle fallback (via `parsePlayerName()`), React-state-driven `onError` handling for a broken/unreachable URL at runtime. Takes a raw `name: string`, not a full `PlayerProfile` -- works for the Digest card's display-name-only case too. Role/format-agnostic: every visual customization (ring/text/background color, size) is a plain prop, nothing branches on `role`.

#### Changed -- `components/YourPlayersStrip.tsx`
- `PlayerChip` now renders `<PlayerAvatar sizePx={48} .../>` with the favourited-amber ring passed in as props. Old inline `initialsFor()` helper and fallback markup removed.

#### Changed -- `components/DigestTab.tsx`
- Man of the Match card now renders `<PlayerAvatar sizePx={32} .../>` with the card's own team-tinted color passed in as props (unchanged visual treatment). Old local `initials()` helper and CSS-attribute-toggle broken-image hack both removed.

#### Changed -- `components/PlayerProfileView.tsx`
- New avatar in the sticky header, 56px, placed between the back button and the name/nationality block, ring/text/background tinted with the same per-role color (`ROLE_COLORS`) already used by the adjacent role badge.

#### Tests
- `npx tsx`, real `react-test-renderer` (pinned to the project's installed React 18.3.1): photo renders `<img>`, no photo renders initials, `onError` falls back to initials at runtime, initials correctness across several names, identical structure regardless of role label, correct size scaling at all 3 real call-site sizes (32/48/56px), `backgroundColor` override applies correctly.

## [1.0.130] 2026-07-28

### Enhancement: win-probability figure visual prominence (size, pill, pulse)

#### Context
- The "WIN PROB" readout (matchup row, ball-by-ball-unavailable fallback, full-screen chart header) needed more visual weight -- bigger than the nearby score digits, a distinct badge look, a subtle update animation -- without moving it or touching its established never-team-colored rule.

#### Changed -- `components/WinProbBadge.tsx`
- Compact variant's value: `text-[13px]` -> `text-[18px]`. Large variant: `text-xl` -> `text-2xl`.
- Both variants now wrap their text in a shared neutral, translucent pill (`bg-white/[0.06]`, `border-white/10`, `rounded-xl`) instead of plain inline text.
- Value node gets `key={pct}` + a new `.winprob-pulse` class -- a 180ms scale-only micro-pulse that retriggers automatically whenever the percentage genuinely changes (React remounts the keyed node), never on an unrelated re-render. No color/opacity component, so it can't reintroduce the flicker risk already ruled out for team-coloring this figure.

#### New -- `app/globals.css`
- `.winprob-pulse` / `@keyframes winprob-pulse` -- `transform: scale(1 -> 1.16 -> 1)`, 180ms.

#### Changed -- `components/MatchView.tsx`
- Removed the stale `className="!px-0"` override on the fallback card's `WinProbBadge` call -- that existed only to zero out padding on the old plain-text version; the new pill needs its own padding there too, matching the other two call sites.

#### Unchanged
- `components/MatchupCard.tsx`, `components/WinProbChart.tsx` -- no per-site overrides needed reconciling, since the fix lives entirely in the shared component both already call.
- The leader/percentage derivation itself (`lib/winProb.ts`) and the color rule (fixed white, never team-colored) -- untouched.

#### Tests
- `npx tsx`, `react-test-renderer`: confirmed the value node's identity is stable across a re-render with an unchanged `pct` (no pulse retrigger) and changes identity when `pct` genuinely changes (pulse retriggers). Both variants confirmed to render the pill and larger text-size classes. `tsc --noEmit`/`npm run build` clean.

## [1.0.131] 2026-07-29

### Fix: matchup-card diagnostic follow-up — mid-scrub card recompute, fixture cleanup, mock-ticker gate

#### Context
- Follow-up to a prior diagnostic-only pass on 3 reported matchup-card issues. Fixes the one confirmed code bug, cleans up the fixture data error that exposed it (plus a platform-wide audit for the same pattern), and adds the real-data-readiness guard flagged for the third (mock-only) issue.

#### Fixed -- `lib/matchStatus.ts` / `components/MatchView.tsx`
- New `deriveBattingCardFromBalls` / `deriveBowlingCardFromBalls` functions recompute every mutable per-player stat (runs, balls faced, out/not-out, strike rate, onStrike, overs bowled, economy, etc.) from a given ball slice.
- `truncatedMatch`'s mid-innings branch now calls both instead of spreading the original innings' end-of-innings `battingCard`/`bowlingCard` through unchanged -- fixes the header/wicket-badge disagreement (a batter's status now reflects the exact same scrub position everywhere it's read).

#### Fixed -- `lib/mockData.ts`
- Platform-wide audit found the "batter listed as striker on a ball after their own recorded dismissal" pattern in 5 innings across 3 matches (not just the originally-reported R Pant case). 273 individual ball-field corrections applied (batterName/batterId reattribution, spurious isWicket/dismissalType/nextBatterName/oneLiner cleared), verified against each innings' own authoritative battingCard as ground truth. Re-audit confirms zero remaining instances anywhere in the mock dataset.

#### New -- `lib/types.ts` / `lib/mockData.ts` / `components/MatchView.tsx`
- `Match.isMockSimulation?: boolean` -- defaults to false/absent (real-data behavior). Set `true` only on the 4 fixtures deliberately kept `status: "live"` forever with a scripted ball log (`FEATURED_MATCH`, `ind-aus-t20i-2026-m2-live`, `ind-eng-test-2026-d3-live`, `psl-2026-lah-kar-live`).
- New `shouldRunMockSimulationTicker(match, isLiveFollowing)` in `lib/matchStatus.ts` gates `MatchView.tsx`'s `liveBallIdx` auto-advance/rewind ticker -- it can now never engage for a match without the explicit flag.

#### Tests
- `npx tsx`: truncated ind-aus-t20i-2026-m2-live's ball log to right after R Pant's first ball -- derived card correctly shows `ballsFaced: 1, out: false` (genuinely computed, not the frozen final value); truncated to S Gill's own wicket ball -- derived card already shows `out: true` at that exact moment. Re-ran the reappearance audit against the live patched data: 0 issues (down from 331). `shouldRunMockSimulationTicker` confirmed true only when both live-following AND `isMockSimulation: true`; false for explicit-false, absent, or not-live-following. Confirmed exactly the 4 intended fixtures are flagged. `tsc --noEmit`/`npm run build` clean.

## [1.0.132] 2026-07-29

### Fix: Digest tab innings mislabeling; closed "retired not out" modeling gap; corrected stale fixture data

#### Fixed -- `components/DigestTab.tsx`
- `buildOverGroupCards`'s `inningsLabel` used `teamInningsOccurrence()` unconditionally -- correct for Test follow-on (buildTestSessionCards' own separate use, untouched), but wrong for non-Test formats where every team bats exactly once, so it always returned 1. Every over-group card in a T20I/ODI showed "1ST INN" regardless of actual innings; the innings toggle's filtering was already correct (confirmed: 20 cards/overs 1-20 for innings 1, 16 cards/overs 1-16 for innings 2, non-overlapping), it just looked broken because the visible tag never changed. Now branches on format: Test keeps `teamInningsOccurrence`, non-Test uses `inn.number` directly (the real match-wide innings position).

#### New -- `lib/types.ts`, `lib/matchStatus.ts`, `components/Scorecard.tsx`
- `BattingEntry.retiredNotOut?: boolean` -- closes a real modeling gap: `Ball.dismissalType` already listed `"retired"` as an enum value, but nothing consumed it anywhere, so a genuine retirement would have rendered identically to plain "not out", indistinguishable from a batter still at the crease. `deriveBattingCardFromBalls` now detects a `dismissalType: "retired"` ball (only when not already genuinely out) and sets this flag with its own dismissal text ("retired not out"). `Scorecard.tsx`'s `isLiveBatter` (drives the live-glow row styling, onStrike asterisk, "not out" tag) now excludes `retiredNotOut`, with a new dimmed render branch instead. Only models "retired -- not out" (the common case); the rarer umpire-given "retired -- out" is explicitly flagged as still unmodeled rather than silently mishandled.

#### Fixed -- `lib/mockData.ts`
- Investigated a reported "3 simultaneous not-out batters, only 3 wickets fallen" state on `ind-aus-t20i-2026-m2-live`. Not a retirement -- zero balls anywhere in the dataset use `dismissalType: "retired"`. Root cause: R Sharma's `battingCard` entry (`runs: 31, ballsFaced: 22, out: true, dismissal: "c Maxwell b Starc"`) was stale, contradicted by his real ball-by-ball data (106 runs off 49 balls, zero wicket balls) -- leftover from an earlier draft never reconciled with the ball log. Corrected the entry to `runs: 106, ballsFaced: 49, fours: 10, sixes: 5, strikeRate: 216.33, out: false, dismissal: "not out"`, matching what the live Score tab already derives from balls. Deliberately did not fabricate a new "retired" ball for him -- his last ball is immediately followed by an already-scripted, unrelated delivery to another batter, and inserting a synthetic event there would require renumbering the following overs, risking new bugs in over-completion logic for a narrative event this fixture was never authored to have. The 3-simultaneous-"not out" visual in this one match persists until a real terminal event is added to it -- a narrower, separate fixture item from the modeling gap, which is now closed platform-wide.

#### Confirmed, no change -- `lib/matchStatus.ts`, `components/MatchView.tsx`
- Re-verified (code inspection + fresh test run, no live UI test needed) that `shouldRunMockSimulationTicker(match, isLiveFollowing)` is `isLiveFollowing && match.isMockSimulation === true` -- a strict check that defaults to `false`/inert for any match without the flag (i.e. all real data). Confirmed exactly 4 fixtures carry `isMockSimulation: true`, matching v1.0.131's stated intent.

#### Tests
- `npx tsx`: innings-label fix confirmed on real match data (innings 2 now reads "2nd Inn"); synthetic 3-batter/6-ball scenario exercises retired/out/still-batting as mutually exclusive states; v1.0.131's two regression tests (R Pant truncated-to-first-ball, S Gill truncated-to-own-wicket) and its reappearance audit (0 issues) re-run unchanged; ticker gate re-confirmed true only for live-following + flagged. `tsc --noEmit`/`npm run build` clean.

## [1.0.133] 2026-07-29

### Investigated: R Sharma retirement fixture patch -- structurally declined, evidence attached; "Retired" label shipped

#### Investigated, not implemented -- `lib/mockData.ts`
- Requested: author a real retirement event for R Sharma in `ind-aus-t20i-2026-m2-live` using the v1.0.132 `retiredNotOut` mechanism, without renumbering subsequent balls. Found this isn't cleanly possible: the `Ball` model has no "non-delivery event" concept, so any inserted entry is counted as a real delivery by whichever `.over` it's given. Verified both failure modes with `npx tsx` against the real shipped functions: attaching the event to the real over (9) silently corrupts the bowler's whole-innings figures (`oversBowled` 3 -> 3.1, economy 10.33 -> 9.79, for zero extra real deliveries); attaching it to an out-of-range sentinel over instead corrupts the live-innings "which over is still in progress" check, prematurely generating a summary card for an over that's only 1/6 bowled. Renumbering (the one approach that would work) wasn't attempted, since that's the exact risk already ruled out twice. Fixture left unchanged; the 3-simultaneous-"not out" visual on this one match persists until a genuine model extension (an innings-level retirement side-channel, sketched but not built) or an authorized renumbering pass.

#### Changed -- `lib/matchStatus.ts`, `components/Scorecard.tsx`
- The `retiredNotOut` mechanism's dismissal label changed from "retired not out" to "Retired," per request. No visible effect today (zero matches in the mock dataset exercise this state), but any future match that does will now show the shorter label.

#### Tests
- `npx tsx`: fresh synthetic retirement scenario confirms `dismissal: "Retired"`. `tsc --noEmit`/`npm run build` clean.

## [1.0.134] 2026-07-29

### New: real ball-by-ball feed ingestion adapter; retirement modeled as an innings-level side-channel (both variants)

#### New -- `lib/matchFeedAdapter.ts`
- `ingestMatchFeed(raw: RawFeedMatch, opts?)` -- the one sanctioned entry point for a real provider's raw feed, following the same interface-first pattern as `lib/teamData.ts`/`lib/teamSchedule.ts`/`lib/playerForm.ts`. Reshapes a realistic best-informed raw provider shape (snake_case fields, deliveries and retirement events interleaved in one per-innings `events` array -- the realistic case several real providers use) into Bawler's internal `Match`/`Innings`/`Ball` naming, extracts retirement events into the new side-channel (below) before anything else sees them, then delegates to `lib/dataValidation.ts`'s existing `normalizeMatch()` for field validation. Never throws.

#### New -- `lib/types.ts`
- `RetirementRecord`/`RetirementType` ("retired-not-out" | "retired-out"), `Innings.retirements?: RetirementRecord[]` -- a retirement is never a ball (see DECISIONS-LOG.md v1.0.133's two corruption proofs for why), so it lives in its own side-channel instead, referencing a real ball's `id` (never an array index) to determine when it's taken effect.
- `BattingEntry.retiredOut?: boolean` -- the rarer umpire-given variant, now modeled alongside the existing `retiredNotOut`. Unlike its sibling, this counts as a genuine dismissal (`out: true`, folds into the wicket tally) but credits no bowler.

#### New -- `lib/matchStatus.ts`
- `isRetirementVisible(record, balls)`, `countWicketEquivalentRetirements(retirements, balls)` -- the latter counts only visible "retired-out" occurrences, since "retired-not-out" never counts toward wickets.
- `deriveBattingCardFromBalls` takes an optional third `retirements` param; derives a player's retirement status exclusively from it, never from `balls`.

#### Changed -- `components/MatchView.tsx`
- `truncatedMatch`'s live wickets calc now adds `countWicketEquivalentRetirements(inn.retirements, truncBalls)` alongside the existing ball-derived count. `deriveBattingCardFromBalls` call site passes `inn.retirements` through.

#### Hardened -- `lib/dataValidation.ts`
- `validateBall` now hard-rejects (blocking error, not a warning) any ball reaching it with `dismissalType: "retired"` -- closes the loophole even for a call path bypassing `ingestMatchFeed()`. New `validateRetirement()` validates the new `Innings.retirements` field.

#### Unchanged, stated explicitly
- `lib/mockData.ts`'s hand-authored fixtures don't flow through `ingestMatchFeed()` or `normalizeMatch()` -- they never did (only `lib/matchGenerator.ts`'s generated matches do). No fixture sets `Innings.retirements` today; `components/Scorecard.tsx` needed no changes, since `retiredOut`'s `out: true` already flows through its existing v1.0.132 dismissal-text render branch.

#### Tests
- `npx tsx`: constructed raw feed with a mid-over "retired-not-out" event through `ingestMatchFeed` -- over ball counts stay exactly 6/6 (not 7), bowling figures clean (`oversBowled: 1`, not `1.1`), `buildOverGroupCards` resolves exactly 2 real-over cards (no phantom), retired batter's card shows `retiredNotOut: true, dismissal: "Retired"`, innings wickets `0`. Second feed with "retired-out": wickets `1`, card shows `out: true, retiredOut: true, dismissal: "Retired out"`. Malformed feed (a delivery event also tagged `dismissal_type: "retired"`) correctly hard-rejected. Full regression re-run of every v1.0.131-133 test: unchanged. `tsc --noEmit`/`npm run build` clean.

## [1.0.135] 2026-07-29

#### Fixed -- `lib/mockData.ts`
- `ind-aus-t20i-2026-m2-live`'s 2nd innings now has an actual `RetirementRecord` for R Sharma (`type: "retired-not-out"`, `afterBallId: "ia-2-9.1"` -- his real last ball, not an array index). This is the first mock fixture to use the v1.0.134 side-channel, closing the exact gap flagged in v1.0.132/133 (three simultaneously "not out" batters once his innings had fully played out). `balls[]` untouched -- purely a `retirements` array addition. Static `battingCard` fallback entry for `rsharma` updated to match (`retiredNotOut: true`, `dismissal: "Retired"`).

#### Verified
- `npx tsx` against the real fixture: derived card shows Sharma `out: false, retiredNotOut: true, dismissal: "Retired", 106 (49)`; exactly 2 live not-out batters (Kohli, Pant) per Scorecard.tsx's own exclusion rule; retirement visibility flips correctly at `ia-2-9.1`, not before; wickets count unaffected (3, not 4). `tsc --noEmit`/`npm run build` clean.

## [1.0.136] 2026-07-29

#### Changed -- `components/MatchupCard.tsx`
- The shared matchup/win-prob teaser row is now two independent, side-by-side bordered boxes instead of one box that swapped content: left box (60% width) owns only the batter/bowler pairing and its existing tap-to-expand H2H behavior (unchanged data/interaction); right box (remaining width) owns only the "WIN PROB" readout and is structurally outside the expand/collapse logic, so it can never be hidden, resized, or replaced when the matchup box opens its stats. Names still render via the existing `formatPlayerName()` (e.g. "V Kohli", "J Root") -- the previous cramped look was the shared row, not the name formatting.

#### New -- `components/WinProbBadge.tsx`
- `variant="boxed"` -- same fixed-white value/label/pulse-on-change behavior as every other variant, new edge-to-edge box shape matching MatchupCard's own box styling, for the new independent win-prob box.

#### Verified
- `npx tsx` + `react-dom/server`: real fixture render shows two sibling bordered boxes with correct 60/40 split, untruncated "V Kohli vs P Cummins" left, "Win Prob" / "IND 95%" right; empty-data case correctly hides the win-prob box and the matchup box reclaims full width; code trace confirms the win-prob box's JSX is never inside the `expanded`-gated branch. `tsc --noEmit`/`npm run build` clean.

## [1.0.137] 2026-07-29

#### Changed -- `components/MatchupCard.tsx`
- Matchup box and win-prob box are now an even 50/50 split (both `flex-1`) instead of the previous 60/40 -- width is never computed from either box's content, so long names can't crowd the win-prob box.
- Collapsed teaser's name spans no longer `truncate`/ellipsis-clip -- the teaser button now uses `flex flex-wrap` so a long full-name pairing (e.g. "R van der Dussen vs J Fraser-McGurk") wraps onto a second line instead of getting cut off, while common short pairings stay on one line exactly as before (box height only grows for the rare outlier). Expanded H2H header's own name row is unchanged (out of scope, more crowded line).

#### Verified
- `npx tsx` + `react-dom/server`: both boxes render `flex-1` for short- and long-name cases alike; long pairing's full names both present in markup, uncut; win-prob box's markup identical regardless of matchup box content; no-win-prob-data case still gives the matchup box the full row. `tsc --noEmit`/`npm run build` clean.

## [1.0.138] 2026-07-29

#### Fixed -- `components/MatchupCard.tsx`
- The 50/50 split from v1.0.137 measured ~57/43 in the browser despite both boxes being `flex-1`. Root cause: `flex-basis: 0%` doesn't override a flex item's default `min-width: auto`, which browsers compute from the item's own content -- the matchup box's pairing text has a wider min-content floor than the win-prob box's short text, so it was quietly getting extra width regardless of `flex-1`. Added `min-w-0` to both boxes so `flex: 1 1 0%` is the only thing left deciding width -- content can no longer floor either box above 50%. Overflow now handled entirely inside the (genuinely) constrained matchup box via the existing `flex-wrap` teaser layout.

#### Hardened -- `components/WinProbBadge.tsx`
- `variant="boxed"`'s two lines now also carry `truncate max-w-full` as a safety net, so an unusually long team label clips inside the box instead of being able to push it wider.

## [1.0.139] 2026-07-29

#### Changed -- `components/MatchupCard.tsx`
- Width ratio changed from 50/50 to a fixed 60/40 (matchup box larger), implemented as a CSS Grid (`gridTemplateColumns: "60% 40%"`) rather than `flex: 0 0 60%`/`flex: 0 0 40%` -- flex-basis percentages with zero grow/shrink don't leave room for the row's own gap and would overflow; Grid's gap is accounted for natively. `min-w-0` kept on both grid items (same content-floor risk as flex items).
- Row's `items-start` changed to `items-stretch` so both boxes always match height (whichever is taller), reversing the previous round's deliberate independent-height behavior per this round's explicit request. Collapsed teaser button gained `h-full` + `justify-center` (alongside existing `items-center`) so it fills and centers within the now-shared height instead of leaving dead space.

#### Verified
- Real browser `getBoundingClientRect()` checks across two live matches (short names, long wrapping names): consistent 60/40 width ratio and identical box heights in both cases -- reported with exact pixel values in chat.

## [1.0.140] 2026-07-31

#### Fixed -- `components/BallGIF.tsx`
- The overhead pitch-map shot-direction line was too thin/faint to see without zooming: `strokeWidth` (1.4 for dots/singles, 2.2 for four/six) and `opacity="0.75"` bumped to a uniform `strokeWidth="2.5"` / `opacity="0.9"` across all outcomes, with the dash pattern scaled up from `"4 4"` to `"6 4"` to stay visually balanced against the thicker stroke. Added a new solid, filled 4px-radius `<circle>` endpoint marker at the shot's terminus so the line has a definite visual end rather than trailing off.
- Color was already outcome-driven and already matched `OutcomeBadge`'s own palette for six (`#A855F7`) and four (`#00E5FF`) -- but had no wicket branch at all, so a wicket ball's line silently fell through to the neutral gray (`#94A3B8`) case. Added an explicit `ball.isWicket` branch using `#EF4444`, matching `OutcomeBadge` exactly. The new endpoint marker reuses this same color logic. Confirmed this local palette is intentionally separate from `lib/outcomeColors.ts`'s `OUTCOME` map (whose "four" is `#06B6D4`, not `#00E5FF`) -- `OutcomeBadge` (the badge actually co-rendered in this same view) is the correct ground truth, not the shared `outcomeColors.ts` module, which this component doesn't otherwise consume for badge/line colors.
- Hardened the `wasLeft` no-line gate: it previously only checked `shotType==="left"` and a dot-ball-with-wide-pitchX heuristic, neither of which is a direct check for "do we actually have shot placement data." Added `ball.shotAngle==null` as an explicit condition, so a delivery with no recorded shot angle (e.g. a real wide/no-ball with no bat contact, once real data includes such cases) never draws a line, rather than silently defaulting to angle 0. No behavior change against any existing mock fixture -- every ball in `lib/mockData.ts` already has `shotAngle` set -- this only closes a latent gap for future real data.

#### Verified
- `tsc --noEmit` and `npm run build` clean. Confirmed via `MatchView.tsx` trace (unchanged from prior sessions) that `OverheadView` is one shared component rendered by a single `<BallGIF>` call used for both the live ticker and the Moments replay view -- this fix applies to both without any duplicate edit.

## [1.0.141] 2026-08-01

#### Removed -- `components/BallGIF.tsx`
- Deleted the `ContextHeader` row ("{competition name} · {teamA} vs {teamB}") that sat directly above the pitch/ball animation on the live ticker and Moments replay view. It duplicated team/score context already shown in the main score header at the top of the match page, and its `scoreText`/`situationText` capability was never actually used at this component's one real call site (`MatchView.tsx`) -- only the redundant tour-name line ever rendered in practice. Removed the component definition entirely along with the now-dead `scoreText`/`situationText` props from `BallGIFProps`.
- Since `OverheadView`/`BallGIF` is the single shared component for both the live ticker and the Moments replay (confirmed in v1.0.140's Step 4), and `ContextHeader` had no other call sites anywhere in the codebase, this removes the banner consistently across every match page in one edit -- no per-match or per-view duplication to chase down.
- Series/tour name context already lives on the Info tab (`InfoTab.tsx` lines 168 and 217 both already show `competition.name`), so no new surface was added there.

#### Verified
- `tsc --noEmit` and `npm run build` clean. Grepped for `ContextHeader`/`situationText`/`scoreText` across `components/` to confirm no other consumer was relying on the removed component or props.

## [1.0.142] 2026-08-01

#### Hardened -- `components/DeliveryCard.tsx`, `components/MiniBallGIF.tsx`, `components/MomentStoryCard.tsx`
- Safety net for the confirmed `ingestMatchFeed()` gap (see ARCHITECTURE.md): every ball-visualizer input field is currently unmapped from a real feed, so a real-data ball would have all of them `undefined` today. Audited every render site that consumes these fields for safe degradation.
- `DeliveryCard.tsx`'s `SpeedDot` previously defaulted to `ball.ballSpeedKmh ?? 0` and always rendered -- a ball with no speed data showed a misleading literal "0 KMH". Now `if (!speed) return null`, matching `BallGIF.tsx`'s `SpeedChip`.
- `MiniBallGIF.tsx` and `MomentStoryCard.tsx`'s shot-line no-draw gates didn't check for a missing `shotAngle` -- the same gap `BallGIF.tsx`'s `OverheadView` had before v1.0.140. Both now also gate on `ball.shotAngle == null`, so a ball with no real shot data never draws a fabricated angle-0 line.
- Everything else already degraded safely (confirmed, not assumed): delivery-type formatters fall back to "Stock", `CommentaryFeed.tsx`'s length formatter falls back to "tight", all coordinate/direction fields already used `?? <default>` or `===` comparisons.

#### Documented -- `ARCHITECTURE.md`
- Added a forward-looking section confirming exactly which `Ball` fields `ingestMatchFeed()` doesn't map yet, plus the plan for when a real provider is chosen: pull a real sample response first, expect speed to be a direct structured-field mapping, expect shot direction/delivery type to need a commentary-text-interpretation layer designed against that provider's actual phrasing (not built generically in advance), and target categorical/zone-based accuracy, not ball-tracking precision.

#### Verified
- Real `react-dom/server` render (not visual review): a ball with every visualizer field stripped, rendered through `BallGIF`, `DeliveryCard`, `MiniBallGIF`, and `MomentStoryCard` for a dot/four/six/wicket (16 combinations) -- zero crashes, zero `undefined`/`NaN` in the output; targeted checks confirmed the speed readout is omitted and the shot line is skipped rather than drawn at a fake angle. `tsc --noEmit`/`npm run build` clean.

## [1.0.143] 2026-08-01

#### Fixed -- `components/Scorecard.tsx`
- Batter sparkline (Score tab batting card's runs-vs-balls-faced curve) now suppresses entirely for a duck or golden duck: `BatterSparkline` takes a new `runs` prop and returns `null` when `runs === 0`, checked ahead of the existing `points.length < 2` gate. A golden duck (0 off 1) already failed that length check, but a duck off several balls (0 off 5, etc.) produced `points.length >= 2` -- every point sitting at y=0 -- and used to render a flat, meaningless line.
- Sparkline container width is now proportional to balls faced, scoped per innings: `InningsCard` computes `maxBallsFacedInInnings = Math.max(1, ...innings.battingCard.filter(r => r.runs > 0).map(r => r.ballsFaced))` and threads it through `BatterRow` to `BatterSparkline`, which renders its `<svg>` at `style={{ width: (ballsFaced / maxBallsFaced) * 130 + "px" }}` instead of the previous `flex-1 min-w-[36px] max-w-[130px]` Tailwind sizing -- linear, no floor, no sqrt/log transform. 130px matches the sparkline's old effective ceiling, so the innings' top-balls-faced batter still renders at the same size as before.
- `maxBallsFacedInInnings` is computed inline in `InningsCard`'s render body, deliberately not behind `useMemo` or any external cache, so it recomputes fresh every render -- in a live innings, every batter's width rescales the instant any batter faces another ball, not just whoever got the new ball.

#### Verified
- Real `react-dom/server` harness (`npx tsx`, temporary script, not committed): confirmed zero sparkline `<svg>` elements for a golden duck and a duck off 8 balls, alongside a real scoring batter who still got one; confirmed three batters at 40/20/10 balls faced produced widths of exactly 130px/65px/32.5px; confirmed a second, independent render after adding one more ball to a DIFFERENT batter showed the first batter's width shrink from 104px to 94.5px purely from the innings-wide max shifting, proving live recomputation rather than a first-render cache; confirmed a single-qualifying-batter innings resolves to a clean 130px width with no NaN/Infinity. `tsc --noEmit` and `npm run build` both clean.
- Confirmed `BatterSparkline` has exactly one definition and three call sites, all in `components/Scorecard.tsx`, all feeding the Score tab -- the only place this component renders. `components/RecentFormGraph.tsx` (player profile page) is a separate, deliberately non-shared component (different X-axis semantics, see its own v1.0.119 header comment) and is unaffected.

## [1.0.144] 2026-08-01

#### Fixed -- `components/Scorecard.tsx`
- The batter-sparkline lookup `ballsByBatter.get(row.playerId) ?? ballsByBatter.get(row.playerName)` returned only whichever key existed first, silently dropping the other key's balls when a single batter's real balls were split across both a slug-tagged key (e.g. `"hbrook"`) and a full-name-tagged key (e.g. `"H Brook"`) within the same innings.
- New `getBatterBalls(map, playerId, playerName)` merges both keys whenever both exist -- deduplicated by `Ball.id`, then re-sorted by `over`/`ballInOver` ascending (balls from two independently-populated keys are not guaranteed to already be in chronological order, and the sparkline's cumulative-runs curve requires it). Returns the single key's array directly when only one exists, so already-correctly-tagged batters are unaffected.
- Deliberately does not depend on the underlying data ever being tagged consistently -- merges unconditionally any time both keys hold data, for any batter, in any match, mock or real.

#### Verified
- Real `npx tsx` script against the actual `ind-eng-test-2026-d3-live` fixture (not synthetic data): H Brook's real-ball count went from 4 (old lookup) to 40 (merged), B Stokes 2->35, J Bairstow 3->21, and B Duckett 51->66 -- a fourth, previously-unreported instance of the same bug, since his `??` happened to resolve to the larger of his two keys but was still dropping 15 real balls. The four batters with no split (Z Crawley, J Root, M Livingstone, C Woakes) are byte-identical before and after -- no regression. Every merged array confirmed strictly chronological by `over`/`ballInOver`.
- Re-ran the v1.0.143 proportional-width check against the same post-fix fixture: widths pixel-identical to before (driven by `row.ballsFaced`, unrelated to how many raw balls the merge resolves) -- confirms width and point-count are correctly independent.
- Grepped the full codebase for the same `get(id) ?? get(name)` dual-key-fallback anti-pattern against any player-identity map -- found no other instance. `tsc --noEmit` and `npm run build` both clean.

## [1.0.145] 2026-08-03

#### Changed -- `components/Scorecard.tsx`
- `BatterSparkline`'s container-width formula replaced: `(ballsFaced / maxBallsFaced) * 130` -> `(Math.sqrt(ballsFaced) / Math.sqrt(maxBallsFaced)) * 130`. This supersedes the v1.0.143 linear formula entirely -- confirmed live that linear scaling compressed every batter's sparkline toward illegibility whenever one batter's innings ran substantially longer than the rest (a 72-ball not-out knock pushed legitimate 10/16/15-ball innings down to 14%/22%/21% width).
- Square root keeps the top-balls-faced batter at exactly 100% width and compresses the relative gap between everyone else's ball counts less aggressively than a straight ratio, so a real but much shorter innings still renders as a legible sliver.
- No other change: duck/golden-duck suppression, per-innings-only max scoping, the uncached/live-recomputed max value, and the curve/point-drawing pipeline are all untouched -- only the width line itself changed.

#### Verified
- Real `react-dom/server` script against the live `ind-eng-test-2026-d3-live` fixture (ENG Innings 2): all 6 batters' rendered widths matched `sqrt(ballsFaced)/sqrt(maxBallsFaced)*130` to well beyond 2 decimal places (e.g. Z Crawley 18 balls -> 76.4853px, J Root 52 balls [max] -> 130px exactly).
- Single-qualifying-batter edge case: ballsFaced=maxBallsFaced=7 -> exactly 130px, no NaN/Infinity.
- Reactivity: a second batter's width recalculated (116.28px -> 110.86px) purely because a different batter faced one more ball on a fresh render -- confirms the max-balls-faced scale still recomputes live, not cached.
- `tsc --noEmit` and `npm run build` both clean.

## [1.0.146] 2026-08-03

#### Fixed -- `lib/matchFeedAdapter.ts`, `lib/matchStatus.ts`
- `ingestMatchFeed()` previously always set `battingCard: []`/`bowlingCard: []` for every real-fed innings, deferred as "a separate concern" -- since the only place that derived those from `balls` (`MatchView.tsx`'s live mid-innings truncation) never ran for a COMPLETE innings, this meant any finished real match would show an empty Score tab scorecard and Digest's Performance card/top-batter-bowler narrative would silently return null forever.
- `deriveBattingCardFromBalls`/`deriveBowlingCardFromBalls` (`lib/matchStatus.ts`) now accept an optional `originalCard` (defaults to `[]`); when empty, new helpers `deriveBatterIdentitiesFromBalls`/`deriveBowlerIdentitiesFromBalls` build the player-identity list directly from `balls` (one entry per distinct name, in order of first appearance), then the same existing stat math runs on top.
- `ingestMatchFeed()` now calls both functions (no `originalCard`) in the same step that already computes `overs` from `raw.format`. `MatchView.tsx`'s live mid-innings path needed no change -- it already passes a real `originalCard`, so it takes the untouched original branch.
- Added a provisional `RawFeedResult` type + `result`/`series_status`/`excitement`/`highlight_badge` on `RawFeedMatch` and `declared`/`follow_on` on `RawFeedInnings` -- none of these were mapped at all before, so `manOfMatch`/series context/editorial fields were always absent for a real feed.

#### Verified
- Real `npx tsx` script (temporary, not committed) built a small finished-T20 raw feed and ran it through `ingestMatchFeed()`: `battingCard`/`bowlingCard` came back correctly populated (runs/ballsFaced/fours/sixes/strikeRate/out/dismissal, oversBowled/maidens/runsConceded/wickets/economy), matching hand-computed arithmetic exactly; `result.manOfMatch`/`seriesStatus`/`excitement` all mapped through.
- Fed that same match into `buildPostMatchDigest()`: Performance card now shows a real top batter/bowler (previously would've been omitted); match-summary card shows `manOfMatch` and a non-empty narrative.
- Confirmed `Scorecard.tsx`'s `BatterRow`/`BowlerRow` only read fields present on the derived shape -- nothing missing.
- Regression: ran the same derivation functions against a real mock fixture's live mid-innings truncation call shape (non-empty `originalCard`) -- identity-list length and mid-innings stats unchanged from before this fix.
- All pre-existing regression scripts (`edge-case-check.ts`, `digest-check.ts`, `series-category-check.ts`, `version-check.ts`) passed unchanged. `tsc --noEmit` and `npm run build` both clean.

## [1.0.147] 2026-08-03

#### Fixed -- `lib/transformers.ts`
- Applied the v1.0.146 fix pattern to two dormant, currently-unused scaffold transform functions with the identical gap: `transformESPNMatch` and `transformSportRadarTimeline` both already build real per-innings ball data but left `battingCard: []`/`bowlingCard: []` behind a "TODO: fetch from scorecard endpoint" comment instead of deriving from the ball data already in scope.
- Both now call `lib/matchStatus.ts`'s `deriveBattingCardFromBalls`/`deriveBowlingCardFromBalls` (no `originalCard`) on their own ball arrays; `format` hoisted to a local `const` before the innings map in both so it's in scope for the bowling derivation.
- `transformCricbuzzMatch`/`transformCricbuzzScorecard` investigated and confirmed NOT to have this bug -- Cricbuzz's design genuinely has no ball data at the match-transform call (`innings: Innings[] = []`, filled in later via a separate scorecard merge that already works correctly from real scorecard fields). Left untouched.

#### Verified
- Real `npx tsx` scripts (temporary, not committed) against both fixed functions confirmed correct `battingCard`/`bowlingCard` derivation matching hand-computed run/four/six/ballsFaced arithmetic.
- Found, documented, but deliberately did NOT fix a separate pre-existing bug: `transformSportRadarTimeline`'s own delivery-only event filter runs before its `isWicket` check, making `isWicket` unconditionally false for any SportRadar-sourced ball today -- unrelated to this round's fix, flagged in DECISIONS-LOG.md v1.0.147 for whenever SportRadar is actually considered.
- All four pre-existing regression scripts, `tsc --noEmit`, and `npm run build` clean.

## [1.0.148] 2026-08-03

#### Added -- `components/BallGIF.tsx`
- `aria-live="polite" aria-atomic="true"` `sr-only` region in the stable outer wrapper (not the ball-keyed remounting inner scene div), so a screen reader tracks the same node across updates instead of losing it on remount.
- New `OUTCOME_WORD` lookup + `ballAnnouncement(ball)` helper build real, specific text ("Four, R Sharma to V Kohli"), reusing `outcomeKindOf()` and `formatPlayerName()` -- never a generic "content updated" message. `"polite"` chosen deliberately over `"assertive"` since ball updates are frequent and interrupting the user's current reading on every ball would be worse than saying nothing.

#### Added -- `app/match/[id]/not-found.tsx` (new file)
- Route-scoped branded 404 for a missing/synthetic match id, replacing Next.js's generic default 404 (previously unbranded, no `not-found.tsx` existed anywhere in `app/`).
- Matches existing dark-theme tokens; friendly Bawler-voiced message ("This match doesn't exist") + a prominent primary CTA pill ("Back to matches") linking to `/`, deliberately not dependent on the user noticing the persistent bottom nav.

#### Removed -- 7 legacy components + `lib/metrics.ts`
- Deleted `components/ViewSwitcher.tsx`, `components/PressureGauge.tsx`, `components/DemoControls.tsx`, `components/MomentsCollapsible.tsx`, `components/ProjectedScore.tsx`, `components/AIMetrics.tsx`, `components/MiniWinProb.tsx`, `lib/metrics.ts` -- all confirmed dead by a fresh grep immediately before deletion (re-run rather than relying solely on an earlier audit). The only non-zero hits were pre-existing, unrelated collisions (`calculatePressureGauge()`/`PressureGauge` interface, `calculateProjectedScore()`/`ProjectedScore` interface, `computeAIMetrics()` inside the file being deleted itself, one code comment naming `MiniWinProb`). `InsightsPanel`, named alongside these in BUILD-STATUS.md's old pending note, was NOT included -- out of scope for this round.

#### Verified
- `tsc --noEmit` and `npm run build` both clean after all three changes together (106/106 static pages).
- Post-deletion grep across `app/`, `components/`, `lib/` for all eight deleted names/paths: zero remaining references outside the same pre-existing unrelated collisions.

## [1.0.149] 2026-08-03

#### Added -- `lib/spotlight.ts`, `app/page.tsx`
- `SPOTLIGHT_RECENCY_WINDOW_DAYS = 7` / `SPOTLIGHT_RECENCY_WINDOW_MS` (both exported from `lib/spotlight.ts`) -- a past match now drops out of Spotlight eligibility once more than 7 days old, applied as an extra `.filter()` in the `past` computation inside `spotlightMatches`, chained right after the existing `isSpotlightMatch` filter and before the sort. Inclusive boundary (`<=`): exactly 7*24h old still counts, one ms older doesn't. `isSpotlightMatch()`, the `future` (upcoming) list, `SPOTLIGHT_MAX`, the sort comparators, and the final slice are all untouched -- upcoming matches keep unrestricted eligibility.

#### Added -- `lib/followPrefs.ts`, `components/MatchCard.tsx`, `components/LiveCarousel.tsx`, `app/page.tsx`
- New `getForYouReason(match, prefs)` in `lib/followPrefs.ts` resolves which specific followed entity caused a match's "for you" status, priority Player > Team > Nation > Series > Tournament > Format (deliberately different from `isTier1Match`'s Tier 1/2 grouping, which is untouched). If the same category matches both sides (e.g. following both nations in an India vs Australia match), returns `"Because you follow both {A} and {B}"`. Returns `null` (never a placeholder) when nothing resolves.
- `LiveMatchCard` (`components/MatchCard.tsx`) renders the reason as a new line below the badge row, above the score line, only when a badge AND a resolved reason are both present -- reuses the card's own existing `text-[9px] text-white/60` caption style.
- `ForYouRow` (`app/page.tsx`) renders the reason as a second `text-[10px] text-text-dim` line below its existing status/countdown caption -- same class, no new style.
- `LiveCarousel` gained a `forYouReasons?: Map<string,string>` prop threading the resolved reason from `app/page.tsx`'s `forYouResult` memo down to each `LiveMatchCard`.

#### Verified
- Real `npx tsx` script (temporary, not committed): recency-window constant + inclusive boundary math correct at exactly-7-days/one-ms-over/well-within/well-outside; `getForYouReason` priority chain, both dual-match "both X and Y" cases, and the null-fallback case all confirmed against constructed match/prefs fixtures.
- `tsc --noEmit` and `npm run build` both clean.

## [1.0.150] 2026-08-03

#### Fixed -- `lib/lineups.ts`
- `getMatchLineup()`'s fallback (used whenever `match.lineups` is absent -- every current fixture) previously derived a player's presence PURELY from a per-match/per-player seeded coin flip over the `PLAYERS` registry, never consulting the match's own `battingCard`/`bowlingCard`/`balls` -- so a player could be excluded by the roll even when the same match's own data proved they played (confirmed: V Kohli had dozens of `batterName: "V Kohli"` ball entries plus a `battingCard` entry in `ind-aus-t20i-2026-m2-live`, yet the roll excluded him, so he never got a "for you" tag there despite correctly getting one on his two other live matches).
- New `confirmedLineupIds()` reads `battingCard`/`bowlingCard`/`balls` names directly and resolves each to a `PLAYERS` id via new `playerIdByName()` (name-based, matching `components/LineupsCard.tsx`'s existing approach -- some fixtures' own `playerId` fields aren't canonical, e.g. `"vkohli"` vs the registry's `"v-kohli"`). `getMatchLineup()` now always includes confirmed players; the seeded roll only fills in players NOT already confirmed, so it still applies exactly as before for genuinely upcoming/unplayed matches (which always have an empty confirmed set).

#### Verified
- Platform-wide audit (real `npx tsx` script, temporary, not committed) across all 29 fixtures / 63 confirmed-participant checks: **before fix, 21 mismatches across 8 fixtures; after fix, 0 mismatches.** Team/Nation/Series/Tournament/Format categories independently audited the same way -- 0 mismatches in either pass (pure id/literal equality, no derivation gap possible).
- Regression check: `getMatchLineup()` output identical before/after for all 22 team-sides across the 11 upcoming/unplayed matches (no play data yet -> confirmed set always empty -> unchanged behavior).
- `tsc --noEmit` and `npm run build` both clean.

## [1.0.151] 2026-08-03

#### Added -- `lib/pointerGuard.ts` (new file)
- `runGuarded(fn)` -- defers a non-user-initiated state update while a pointer is down anywhere on the page (tracked via a single module-scoped `pointerdown`/`pointerup`/`pointercancel` + `touchstart`/`touchend`/`touchcancel` listener pair), running it immediately on release instead of dropping or indefinitely delaying it. Generic/reusable, not scoped to any one component.

#### Fixed -- `components/MatchView.tsx`, `components/Scorecard.tsx`
- Root cause: the mock-simulation ticker's `setLiveBallIdx` update re-derives `battingCard`/`bowlingCard`, mutating the DOM of whichever row/control is currently live (not-out batter's stat line + `*` marker + sparkline, current bowler's figures, BallGIF's conditional share button). A tap landing in that same instant could be dropped by the browser before any click handler ran -- confirmed via capture-phase instrumentation showing zero dispatched events on a link with a correct `href`.
- `MatchView.tsx`'s ticker now routes its `setLiveBallIdx` call through `runGuarded()` -- a single point of control protecting every downstream component (Scorecard, BallGIF, MatchupCard, MomentsStrip, MiniInsightsBar, DigestTab) without per-component changes.
- `Scorecard.tsx`'s `PlayerNameLink` wrapped in `React.memo` -- its props (`playerId`/`playerName`/`nameColor`) don't change from a stats-only tick, so memo skips re-rendering/reconciling the link entirely, meaning the `<a>` node is never touched by a tick that only updated sibling stats.

#### Audited, no change needed
- `MiniInsightsBar.tsx` -- no chip currently sets `onClick` (removed in v1.0.121), not affected.
- `LineupsCard.tsx`, `CommentaryFeed.tsx` -- no interactive elements at all.
- `MomentsStrip.tsx`, `DigestTab.tsx` -- already keyed by stable ids (`event.id`/`day`/`inn`), covered by the pointer-guard as a backstop.

#### Verified
- `tsc --noEmit` and `npm run build` both clean.
- `runGuarded()` confirmed safe with no `window` present (non-browser call site), never throws, never drops a call.
- Live on production: held a real `pointerdown` on a live batter's link for 85s (3+ ticks) with no `pointerup` -- row stayed byte-identical the whole time, updated immediately on release. Same test on BallGIF's share button (58s, 2+ ticks) -- button stayed mounted and unchanged throughout. Confirms `runGuarded()` defers the DOM mutation for the full gesture, not just "usually works."
- Real clicks succeeded on the same link both before and during a tick. A control click on a never-re-rendering row (a dismissed batter) intermittently produced zero events in the same session -- since that row cannot structurally collide with the ticker, this identifies remaining flakiness as browser-automation click dispatch, not an app-level issue; noted so it isn't mistaken for a regression later.

## [1.0.152] 2026-08-04

#### Added -- `lib/playerForm.ts`, `components/PlayerProfileView.tsx`
- `PlayerInningsEntry.out: boolean` (internal) and `RecentFormPoint.notOut?: boolean` (only set when `metric === "runs"`) -- rides on the same real `BattingEntry.out` value already used for entry eligibility, no second computed field.
- `RecentFormSingleStat` component (`PlayerProfileView.tsx`) -- the new Tier 1 single-stat callout, reusing `RecentFormGraph`'s exact `card p-3` container + heading typography.

#### Fixed -- tiered Recent Form display (0/1/2+ recorded innings, per format tab)
- Recent Form render block in `PlayerProfileView.tsx` now branches explicitly on `recentForm.points.length`: 0 -> nothing rendered (was already true via `RecentFormGraph`'s own early return, now explicit at the call site too); exactly 1 -> `RecentFormSingleStat` ("Recent form" heading, no subtitle, `Only innings so far: {value}{"*" if not out} runs` / `Only spell so far: {value} wickets` for a bowling point); 2+ -> unchanged `RecentFormGraph` chart, same heading/cap/annotations.
- IPL blank state confirmed as already-correct Tier 0 (Kohli has zero recorded IPL innings in the mock dataset), not a separate bug -- nothing else needed fixing.

#### Audited, no change needed
- Existing chart cap: `getRecentForm()`'s `last10 = relevant.slice(-10)` already caps at 10 -- unchanged, not touched by this fix.
- Bowling-equivalent section: confirmed there is exactly one Recent Form section, already metric-aware (`pickMetric()`); this fix's tiering applies to both disciplines automatically via the same `points.length` check, with Tier 1 wording branching on `metric`.
- Career aggregate stats grid (`BattingStats`/`BowlingStats`) -- untouched.
- No existing not-out-asterisk formatting helper found anywhere in the codebase to reuse (`highScore` values like "254*" are literal pre-formatted mock-data strings, not function output) -- the asterisk is a plain inline template-string expression, not a new named helper.

#### Verified
- `tsc --noEmit` and `npm run build` both clean.
- `getRecentForm()` run directly (temporary `npx tsx` script) across every player/format in the mock dataset: confirmed real Tier 0 (`v-kohli`/odi, `/franchise`), Tier 1 batting with and without not-out (`v-kohli`/test = 121 out, no asterisk; `h-pandya`/franchise = 22 not out, asterisk), Tier 1 bowling (`j-bumrah`/test, `/franchise`, wickets metric), and unchanged Tier 2+ (`v-kohli`/t20i and others).

## [1.0.153-1.0.157] 2026-08-04

### Pitch report rework: isolated from mockData.ts, re-keyed per-match, real-data-ready, extended to all 29 matches, safety tripwire added

#### Context
- A diagnostic-only investigation confirmed pitch reports were fully built but only covered 5 IPL venues, leaving 13 of 29 matches without one -- a data-coverage gap, not a wiring bug. That same investigation confirmed this exact feature previously caused a full-platform crash (see v1.0.39 below: ~13,800 lines truncated from `mockData.ts`, recovered via a hard reset). The follow-up fix therefore ran under a mandatory safety process: dedicated branch (`feature/pitch-reports-rework`, never `main`), a recorded before/after baseline for `mockData.ts`, no `git push --force`/`git reset --hard` under any circumstance, and 5 small steps each independently build/regression-verified before the next began.

#### New -- `lib/pitchReports.ts` (v1.0.153)
- Extracted `PitchReport` (from `lib/types.ts`) and `PITCH_REPORTS` (from `lib/mockData.ts`) into their own file, byte-for-byte identical to the originals. `mockData.ts` dropped by exactly 81 lines (15,241 -> 15,160); no match/ball/player data touched. Pitch-report edits can no longer touch the ~15,200-line match/ball/player object literal that was truncated in the prior incident.

#### Changed -- keying (v1.0.154)
- `PITCH_REPORTS` re-keyed from `Venue["id"]` to `Match["id"]` -- pitch conditions are a per-match fact (curated pitch, weather, dew), not a fixed venue property. `venueId` stays on each entry as informational content. `InfoTab.tsx`'s lookup updated from `PITCH_REPORTS[match.venue.id]` to `PITCH_REPORTS[match.id]`.

#### Changed -- optional fields, real-data-readiness (v1.0.155)
- `paceFriendly`, `spinFriendly`, `bounceConsistency`, `expectedFirstInningsScore`, `dewFactor` are now optional (`bullets` stays required). `PitchReportCard.tsx` omits the corresponding section entirely when a field is absent, instead of showing a blank/zeroed value -- matching this app's existing "don't render misleading defaults" convention.

#### New data -- all 29 matches covered (v1.0.156)
- Added pitch-report entries for the 24 matches that had none, in 5 small batches (build + regression check after each). Every one of the 29 matches now has its own entry -- the 5 previously-covered venues each got individual per-match entries under the new model, and 19 international/bilateral matches got entries for the first time. Two Test entries (Lord's, MCG Ashes) deliberately omit `expectedFirstInningsScore`/`dewFactor` (a 5-day match's conditions shift too much for one score range; dew is a minor daytime factor).

#### New -- `scripts/check-mockdata-integrity.ts` safety tripwire (v1.0.157)
- Compares `mockData.ts`'s line count and export list against a recorded baseline (`scripts/mockdata-baseline.json`); fails loudly (nonzero exit) if the line count drops more than 5% or any baseline export disappears. Wired into the existing `prebuild` script alongside `version-check.ts`, so it runs on every `npm run build`. Also exposed as `npm run mockdata-check`. Tested against a simulated truncation of the real file (backed up, truncated to 1,400 lines, confirmed FAIL + exit code 1, restored, confirmed byte-identical via diff/md5sum, confirmed PASS again).

#### Verified
- `tsc --noEmit` and `npm run build` clean after every one of the 5 steps (106/106 static pages each time).
- Direct `react-dom/server` render tests: `InfoTab` renders a pitch report for all 29 matches with zero throws; both Test entries render sliders/bullets but correctly omit the score/dew sections; `DigestTab`/`Scorecard` render cleanly for live/past/upcoming samples; the home page component renders without throwing.
- Confirmed via grep that `lib/pitchReports.ts` has zero import relationship with Schedule, Table, Player, or Home pages.
- 6 commits across the 5 steps, all on `feature/pitch-reports-rework`, `main` untouched until this entire arc was complete and regression-verified.

## [1.0.158] 2026-08-04

### Fixed battingCard/bowlingCard join-key bug at the root (platform-wide) + a second, unrelated orphan-player gap

#### Context
- Diagnostic confirmed `ipl2026-m37-kkrvmi`'s Score tab showed every KKR player at 0 while the header/strike-rate bar read correct live figures: the innings' hand-authored card used full names while its ball data used short names, and `lib/matchStatus.ts`'s derivation functions joined a ball to a card row by name (`b.batterName === entry.playerName`) -- silently zeroing every stat with no error the moment naming differs even slightly. Confirmed pre-existing and unrelated to the prior pitch-report-rework arc via `git diff`.

#### Changed -- `lib/matchStatus.ts`
- New `samePlayer(id, name, entryId, entryName)` predicate: `id === entryId || name === entryName`. Replaces the old pure-name join (the bug) -- and also replaces a briefly-implemented pure-id join, which a broader bidirectional audit found would have regressed `ind-eng-test-2026-d3-live` (a currently-live, currently-correct Test match whose card uses real slug ids that never match its balls' id fields at all, only names do, with a few players split across BOTH conventions within the same innings -- the same pattern `Scorecard.tsx`'s `getBatterBalls()` already solved locally in v1.0.144/145). `deriveBattingCardFromBalls`/`deriveBowlingCardFromBalls`'s ball filter, the retirement lookup, and the `onStrike` check all now use this one shared predicate.
- `deriveBatterIdentitiesFromBalls`/`deriveBowlerIdentitiesFromBalls` (the no-card fallback path) now reconcile a player split across id/name within the balls themselves into a single identity, using the same either-field logic.
- New `withOrphanIdentities()`: when `originalCard` is supplied but incomplete, appends a derived identity row for any ball-participant not matched by any existing entry, instead of silently dropping their balls. Found via the required post-fix full-platform verification sweep: `ind-eng-test-2026-d3-live` innings 2's hand-authored card only lists England's top 8 batters, omitting the tail order (S Broad, J Anderson, J Leach, M Wood), who nonetheless faced real, recorded deliveries (22 runs, 156 balls) -- a distinct bug class (missing card rows, not a mismatched join key) that no join-key fix alone could have resolved. Purely additive -- never touches an existing entry.

#### Audit findings (fixture data, unchanged)
- One-directional pre-fix audit: 2 fixtures with an id-matches/name-differs mismatch -- `ipl2026-m37-kkrvmi` (14 findings) and `psl-2026-lah-kar-live` (1 finding).
- Bidirectional audit (both directions, all 29 matches): confirms the same 2 fixtures plus `ind-eng-test-2026-d3-live`'s split id/name convention.
- Orphan-entry audit: exactly 1 innings (`ind-eng-test-2026-d3-live` innings 2) has ball-participants with zero matching card entry by either key.
- None of this underlying fixture data was changed -- the union-match + orphan-fill fix makes derived stats correct regardless of which convention or gap a given fixture has, so rewriting `mockData.ts` is no longer required for correctness. Deliberately left as-is given this project's two-time history of `mockData.ts` truncation crashes from large edits to that file; flagged as a non-urgent hygiene item instead of edited now.

#### Verified
- `tsc --noEmit` and `npm run build` clean (106/106 static pages, both prebuild tripwires passing) after both fixes.
- Full-platform sweep (derived batting runs == raw ball runs, derived bowling wickets == raw wicket count, all 29 matches, all innings with ball data): 0 mismatches, including `ind-eng-test-2026-d3-live` (previously the sole post-union-fix failure) and both originally-flagged fixtures.
- `ipl2026-m37-kkrvmi` KKR innings re-confirmed directly: R Singh 46(31), A Russell 37(20), J Bumrah 3.4-0-23-2 -- all non-zero, consistent with the header's live state. Simulated mid-innings truncation (first 43 balls) also verified consistent, covering `MatchView.tsx`'s live scrub path.
- All temporary verification scripts deleted after use.

#### Scope
- `lib/matchStatus.ts` only. No fixture data in `lib/mockData.ts` changed. No other file touched -- the fix is entirely at the shared derivation layer, so it applies automatically to `MatchView.tsx`'s live truncation path and `lib/matchFeedAdapter.ts`'s real-feed ingestion path alike.

## [1.0.159] 2026-08-04

### Fixed the real gap: a completed innings never reached the v1.0.158 derivation fix at all

#### Context
- After v1.0.158 shipped, direct production verification on `ind-eng-test-2026-d3-live`'s "ENG Inn. 1" tab found the batting card still stopped at 8 rows -- the exact gap v1.0.158 was supposed to close. Root cause: `MatchView.tsx`'s `truncatedMatch` memo has two branches; the mid-innings branch calls the derive functions, but the `isComplete` branch (used for every innings of every finished match, and any already-finished innings within a still-live one) used to spread the raw hand-authored card through unchanged, never calling either derive function. The v1.0.158 fix was correct in isolation but unreachable from this call site.

#### Changed -- `lib/matchStatus.ts`
- `samePlayer()` is now exported for reuse outside this file.
- New `appendMissingIdentities(original, pureDerived)`: appends only the balls-derived entries that don't match any existing card entry, never touching or recomputing an already-authored row. A first attempt made the `isComplete` branch fully re-derive every row (mirroring the mid-innings branch) -- caught before shipping via direct verification: this fixture has 2 dismissals (C Woakes, J Bairstow) recorded on the card with no corresponding `isWicket` ball anywhere in the data, so full re-derivation silently turned both into "not out." Append-only avoids this entirely since it never rewrites an existing entry.

#### Changed -- `components/MatchView.tsx`
- `truncatedMatch`'s `isComplete` branch now calls `appendMissingIdentities(inn.battingCard, deriveBattingCardFromBalls(truncBalls, [], inn.retirements))` (and the bowling equivalent) instead of spreading `inn.battingCard`/`bowlingCard` raw.

#### Verified
- Direct script against the exact affected innings: 8 -> 12 batting rows, all 4 new rows correct, all 8 original rows the same object reference post-fix (not just equal).
- Platform-wide sweep (append-only logic, all 29 matches, every innings with balls): only this one innings gets rows appended, zero duplicates, zero shrinkage, every original entry preserved by reference everywhere else.
- Re-ran the v1.0.158 sum-conservation sweep directly on the derive functions: still 0 mismatches.
- `tsc --noEmit` / `npm run build` clean (106/106 pages).
- Live on production, the user's exact repro: `ind-eng-test-2026-d3-live` -> Score tab -> "ENG Inn. 1" -> all 12 batters now shown, including S Broad/J Anderson/J Leach/M Wood.

#### Scope
- `lib/matchStatus.ts`, `components/MatchView.tsx` only. No fixture data changed.

## [1.0.160] 2026-08-05

### Pitch Report redesign: compact stat-box row, avgFirstInningsScore replaces the predictive range

#### Context
- Requested redesign for information density: replace the Info tab's stacked full-width sliders (pace/spin/bounce/dew) with a row of compact boxes, one per stat with a value, and replace "expected 1st innings score" (a predictive `{low, mid, high}` range gauge) with "avg 1st innings score," a single historical number in the same row. Required across all 29 `PITCH_REPORTS` entries, using the exact player-profile stat-tile styling.

#### Changed -- `lib/pitchReports.ts`
- `PitchReport.expectedFirstInningsScore?: {low, mid, high}` removed; replaced with `avgFirstInningsScore?: number`.
- All 27 real entries migrated to `avgFirstInningsScore: <old mid value>`. The 2 Test-match entries (Lord's, MCG Ashes) never had the field; their explanatory comments now reference `avgFirstInningsScore` by name.

#### New -- `components/StatCell.tsx`
- Extracted verbatim from `PlayerProfileView.tsx`'s local `StatCell` (the MAT/RUNS/AVG/SR tile) and exported, so the player profile and the new pitch-report box row render an identical tile, not two independently-styled lookalikes.

#### Changed -- `components/PlayerProfileView.tsx`
- Imports `StatCell` from the new shared file instead of defining it locally. No other change.

#### Changed -- `components/PitchReportCard.tsx`
- Removed the `Slider` sub-component (pace/spin/bounce), the score-expectation gradient-bar block, and the separate dew-factor row.
- New: a `boxes` array built from whichever of {paceFriendly, spinFriendly, bounceConsistency, avgFirstInningsScore, dewFactor} are defined, chunked into rows of at most 4, each row its own `grid-template-columns: repeat(row.length, minmax(0,1fr))` so it always stretches to fill the width evenly -- including a lone box left over on a wrapped second row. `gap-3` matches the existing Date&Time/Weather row gap already used elsewhere in `InfoTab.tsx`. Each box is a `.card`-wrapped `StatCell`; a field with no value is simply never added, never a placeholder.

#### Verified
- `tsc --noEmit` / `npm run build` clean (106/106 pages, `mockdata-integrity` tripwire passing -- confirms `mockData.ts` untouched).
- Computed exact expected box counts from the final data: 19 matches at 5 fields (4-then-1 row split), 8 at 4 fields (single row), 2 Test matches at 3 fields (single row) -- 29/29 accounted for.
- Live-verified representative matches from all three groups on production, including both 3-box Test entries specifically. No leftover old-gauge UI found anywhere; rest of the Info tab unaffected.

#### Scope
- `lib/pitchReports.ts`, `components/StatCell.tsx` (new), `components/PlayerProfileView.tsx` (import only), `components/PitchReportCard.tsx`, `package.json` (version bump). No `mockData.ts` changes.

## [1.0.161] 2026-08-05

### Fixed a real layout bug: pitch-report stat-box row now uses a dynamic column count, not a fixed 4

#### Context
- v1.0.160's box row chunked into fixed groups of 4 columns. Broke for every match with a field count other than 4: 5-field matches (adding Dew) wrapped their 5th box onto its own mostly-empty second row.

#### Changed -- `components/PitchReportCard.tsx`
- Column count per row now equals however many fields are actually present for that match, capped at `MAX_ROW_COLUMNS = 6` (defensive only -- no match today exceeds 5 fields, so every row today is a single row). `sizeForColumnCount()`: <=4 -> "md" (unchanged), 5 -> "sm", 6 -> "xs". "Avg score" label abbreviates to "Avg sc." once a row is dense enough to need it.

#### Changed -- `components/StatCell.tsx`
- New optional `size` prop ("md" default, "sm", "xs"). "md" is byte-for-byte the original markup -- `PlayerProfileView.tsx` never passes `size`, confirmed untouched via md5sum.

#### Verified
- `tsc --noEmit` / `npm run build` clean. Live-checked all three field-count groups (3/4/5) on production at desktop and phone-width viewport: single row, no wrap, no stretched lone box. Full platform regression pass confirmed no other component affected by the shared `StatCell` change.

#### Scope
- `components/PitchReportCard.tsx`, `components/StatCell.tsx`, `package.json` (version bump). No fixture data changed.

## [1.0.162] 2026-08-05

### Fixed: cross-match insight-card bleed on the Live tab (PSL/KKR-MI content showing on unrelated matches)

#### Context
- `MOCK_INSIGHTS_V2` was one flat 14-entry array with no `matchId`, consumed by every match on the platform via `MatchView.tsx`'s `insightsProp ?? MOCK_INSIGHTS_V2` fallback. 12 of the 14 entries have no `relatedBallId`, so they rendered on every single match's Live tab unconditionally. Reported symptom: PSL LAH-vs-KAR and generic KKR/MI insight cards showing up on `ind-aus-t20i-2026-m2-live`'s commentary feed; independently confirmed the same cards also bled into `ind-eng-test-2026-d3-live`.

#### Changed -- `lib/types.ts`
- `InsightV2.matchId: string` added as a required field -- not optional, so any future real-data ingestion path must supply it too.

#### Changed -- `lib/mockData.ts`
- All 14 `MOCK_INSIGHTS_V2` entries tagged with their correct real match id, verified against each match's actual data (not guessed): `ia-1`..`ia-4` -> `ind-aus-t20i-2026-m2-live`; `psl-1`, `psl-2` -> `psl-2026-lah-kar-live`; `v2-1`..`v2-8` -> `ipl2026-m37-kkrvmi`. No entries deleted, none ambiguous.

#### Changed -- `components/MatchView.tsx`
- `visibleInsights` now filters on `insight.matchId === match.id` FIRST, with the existing `relatedBallId` ball-level filter applied only within that already-scoped set. `match.id`/`insightsProp` added to the `useMemo` dependency array.

#### Verified
- `tsc --noEmit` / `npm run build` clean (106/106 pages, mockdata-integrity tripwire passing at +14 lines / 26 exports unchanged).
- Live-checked all 4 matches with real ball-by-ball data (`ind-aus-t20i-2026-m2-live`, `ind-eng-test-2026-d3-live`, `ipl2026-m37-kkrvmi`, `psl-2026-lah-kar-live`): each now shows only its own insights. Confirmed the 2 live matches with no ball data still show the "unavailable" fallback, unaffected. Audited `CommentaryFeed.tsx` and `MiniInsightsBar.tsx` for any independent fallback to the unfiltered pool -- none found; `InsightsPanel.tsx` confirmed dead code. Full platform regression pass (Home, Schedule, Score, Digest, Info, player profiles) clean.

#### Scope
- `lib/types.ts`, `lib/mockData.ts` (14 `matchId` tags only), `components/MatchView.tsx`, `package.json` (version bump).

## [1.0.163] 2026-08-05

### Changed: Info tab consolidation -- venue into Date & Time, Match Context slimmed, Surface row de-boxed

#### Context
- Presentation-only, platform-wide change across every match/format/status. No new data fields -- venue name/city, toss, and narrative text already existed and were already shown somewhere on the Info tab; this only moves/restyles.

#### Changed -- `components/InfoTab.tsx`
- Date & Time card: city line now shows `**Venue Name**, City` instead of just the city, reusing the same `match.venue` fields PitchReportCard already reads. Falls back to city-only if venue name is ever unavailable. All other lines in the card unchanged.
- Match Context card: removed the team-names+competition header line and the venue line (no longer duplicated -- it lives in Date & Time now). Card shows at most two lines: toss (conditional, unchanged) then narrative (conditional, unchanged). Narrative's divider is now conditional on toss also being present, so a pre-match match with only a narrative doesn't get a stray border under the section header.

#### Changed -- `components/PitchReportCard.tsx`
- Surface row grouped with the stat-box row into one tight `space-y-2` block, divider between them removed. Surface's label/value font sizes unchanged. Bullets section below untouched.

#### Verified
- `tsc --noEmit` / `npm run build` clean (106/106 pages, both prebuild tripwires passing, `mockData.ts` untouched).
- Live-checked pre-match/live/completed matches for correct Match Context line count; one match each from T20I/Test/IPL/PSL for venue+city display; Surface row at desktop and phone width; full platform regression (Home, Schedule, Score, Digest, player profiles).

#### Scope
- `components/InfoTab.tsx`, `components/PitchReportCard.tsx`, `package.json` (version bump).

## [1.0.164] 2026-08-05

### Fixed: bowler chip silently disappearing on name-mismatch (Live tab chip strip)

#### Context
- On `ipl2026-m37-kkrvmi`, the top chip strip's bowler chip ("3/28 P Cummins"-style) was missing entirely at multiple points in the match. Root cause: the lookup matched only on `playerName` via fragile `.includes()` substring checks, and this match's `bowlingCard` used a different name convention ("Jasprit Bumrah", "P. Krishna") than its ball data ("J Bumrah", "P Krishna") -- neither is a substring of the other, so the lookup always missed with no fallback.

#### Changed -- `components/MiniInsightsBar.tsx`
- Bowler-chip lookup now matches via `samePlayer(id, name, entryId, entryName)` (the same id-or-name union predicate `lib/matchStatus.ts` already uses for every other ball-to-card join), instead of substring inclusion.
- Added a balls-derived fallback: if the lookup still misses, the chip computes the bowler's live figures via `deriveBowlingCardFromBalls(live.balls, [], match.format)` -- mirroring the batter chips' own existing balls-derived fallback, so the chip can no longer disappear purely because a name/id lookup failed.
- Batter chip logic and the cyan/green coloring thresholds are unchanged.

#### Changed -- `lib/mockData.ts`
- Normalized 12 `playerName` values across `ipl2026-m37-kkrvmi`'s two `bowlingCard` arrays to the same short form already used by `playerId` and the ball data (e.g. "Pat Cummins" -> "P Cummins", "P. Krishna" -> "P Krishna", "Hardik Pandya" -> "H Pandya"). No other field changed.

#### Verified
- `tsc --noEmit` / `npm run build` clean (106/106 pages, both prebuild tripwires passing).
- Live-checked `ipl2026-m37-kkrvmi` at multiple points: bowler chip now reliably appears with correct wickets/runs, cyan triggers correctly at 2+ wickets. Re-checked `ind-aus-t20i-2026-m2-live`, `ind-eng-test-2026-d3-live`, `psl-2026-lah-kar-live` -- bowler chip and coloring unaffected. Full platform regression pass (Home, Schedule, Score, Digest, Info, player profiles) clean.

#### Scope
- `components/MiniInsightsBar.tsx`, `lib/mockData.ts` (12 `playerName` strings only), `package.json` (version bump).

## [1.0.165] 2026-08-06

### Added: first-run onboarding flow (swipe team picker, player picker, cricket-personality quiz, reveal, first-session quest)

#### Context
- Gamified onboarding for brand-new users, built entirely on existing mock data, deliberately independent of the real-data-integration/native-packaging work in progress. Shows exactly once (zero saved follow prefs, onboarding not yet completed), never repeats even for a user who skips every step.

#### Added -- `lib/onboarding.ts`, `lib/firstSessionQuest.ts`
- `shouldShowOnboarding()` = not-yet-completed AND zero follows. A separate completion flag (not just the zero-follows check) is required so a skip-everything user doesn't see onboarding again on their next open.
- Floating post-onboarding checklist state (follow a team / open a live match / read a pitch report), localStorage-backed so it survives an app close mid-checklist.

#### Added -- `lib/onboardingTeams.ts`, `lib/onboardingPlayers.ts`, `lib/onboardingQuiz.ts`
- Step 1 (teams): 16-team curated roster (10 IPL + 6 nations with real schedule data), 4-tier real-moment fallback (live -> upcoming <=14d -> recent <=30d -> skip), reusing `lib/teamSchedule.ts`'s existing lookup rather than reimplementing it.
- Step 2 (players): players from followed teams, deduplicated strictly by `PLAYERS` registry id, tagged with every followed-team affiliation (e.g. "India · RCB"). Confirmed before building that `PlayerProfile`'s existing `teamCode`/`franchiseCode` fields already cover this -- no data-model extension needed.
- Step 3 (quiz): 3 either/or questions mapping to 6 fixed personas, writing format preference straight into the shared `FollowPrefs.formats` field the Filter sheet already uses -- no second preference system.

#### Added -- `components/onboarding/*`, `components/FirstSessionQuest.tsx`, `app/onboarding/page.tsx`
- Swipeable team-picker cards, player-picker list with search, quiz UI, a capped 2-3s cosmetic "Building your feed..." reveal referencing followed teams/players by name, and a non-modal floating first-session checklist that checks off on real app actions (visiting a live match, seeing a real pitch report) and auto-dismisses once complete.

#### Changed -- `app/page.tsx`, `components/MatchView.tsx`, `components/InfoTab.tsx`
- Home page redirects a qualifying new user to `/onboarding` before the feed renders (gated the same way the existing boot skeleton is, to avoid a content flash).
- `MatchView.tsx`/`InfoTab.tsx` mark first-session quest items on real, loose triggers (any visit to a live match; any real pitch-report render).

#### Fixed during build
- `lib/onboardingTeams.ts`'s live-tier headline named the wrong side as "opponent" whenever the followed team was bowling (e.g. "KKR 130/3 vs KKR"). Fixed to derive batting/bowling sides from the innings itself, never from followed-team identity, for that string specifically.

#### Verified
- Two `npx tsx` harnesses against the real modules/components (not test doubles): 15/15 logic checks (trigger conditions, multi-affiliation dedup, all 4 fallback tiers including a constructed zero-fixture synthetic team, skip-everything path, all 6 quiz persona combinations, reveal timing cap, quest lifecycle/persistence/dismissal) and 15/15 component smoke-renders (including the no-`funFact`, zero-rival-candidates, and skip-everything-reveal edge cases) all passed.
- `tsc --noEmit` / `npm run build` clean after every incremental commit (107/107 pages, `/onboarding` present). `mockData.ts` baseline unchanged (15,174 lines, 26 exports -- the 16 `funFact` additions were in-place, not insertions).
- NOT verified: real-browser interactive gesture/animation behavior (swipe physics, tap-through timing) -- a Vercel preview URL lookup for this branch came back empty, and no other live-browser path was available this session.

#### Scope
- `lib/types.ts`, `lib/followPrefs.ts`, `lib/mockData.ts` (16 in-place `funFact` fields), `lib/onboarding.ts`, `lib/firstSessionQuest.ts`, `lib/onboardingTeams.ts`, `lib/onboardingPlayers.ts`, `lib/onboardingQuiz.ts`, `lib/playerForm.ts` (`getLastInningsHeadline()`), `components/onboarding/*` (10 new files), `components/FirstSessionQuest.tsx`, `components/MatchView.tsx`, `components/InfoTab.tsx`, `app/onboarding/page.tsx`, `app/page.tsx`, `package.json` (version bump).

## [1.0.166] 2026-08-06

### Fixed: onboarding step 1 had no way to actually follow a team (tap-to-follow/skip buttons added)

#### Context
- Real-browser testing on the live v1.0.165 deploy found step 1's team picker had no working follow control at all -- no heart/check button existed anywhere despite the original spec requiring one as a swipe alternative, and `SwipeCard.tsx`'s own `registerHandle` prop (built for exactly this) was never wired up by its caller.

#### Root cause (traced via live Chrome interaction, not guessed)
- The missing button was the real bug. Separately confirmed real mouse-drag past the swipe threshold already works correctly and always did; a synthetic touchstart/touchmove/touchend sequence dispatched via JS produces zero pointer events in any browser (untrusted TouchEvents are never promoted to PointerEvents) -- explaining why that specific test in the original report registered nothing, without indicating the swipe gesture itself is broken for real touchscreen input.

#### Changed -- `components/onboarding/TeamPickerStep.tsx`
- Holds a ref to the active card's `SwipeCardHandle`; renders two always-visible buttons (X = skip, heart = follow) below the card stack that call `handle.swipeLeft()`/`swipeRight()` -- the same code path a real swipe already uses. Following now works with a single tap/click, no gesture dependency.

#### Verified
- Full real end-to-end run against the redeployed v1.0.166 live URL: followed India and RCB via tap (national + franchise, confirming the live-tier opponent-naming fix on screen for both), confirmed V Kohli's step-2 dedup row (IND · RCB, one row) live, completed the quiz to "Boundary Hunter," watched the reveal, confirmed the first-session checklist checked off via real actions and auto-dismissed correctly. Separately ran a full skip-everything path (locked-preview shown once, not repeated on step 2; quiz to a second persona "Test Purist"; safe landing on home feed, no crash).
- `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched.

#### Scope
- `components/onboarding/TeamPickerStep.tsx`, `package.json` (version bump).

## [1.0.167] 2026-08-07

### Fixed: England showed a generic flag emoji instead of a real flag on onboarding's team-picker card

#### Context
- On `/onboarding` step 1, every national team's avatar showed India as "IN" and Australia as "AU" -- except England, which showed a broken generic flag glyph instead.

#### Root cause
- `TeamCard.tsx` rendered `team.flagEmoji` as a raw Unicode character. India/Australia's flag emoji happen to be simple two-letter country-code sequences, so this environment's unsupported-emoji fallback shows their embedded letters ("IN"/"AU") -- which looked like intentional initials but never was. England's flag is a different Unicode construction (a UK-subdivision tag sequence), whose fallback is a generic flag glyph instead of letters -- same underlying defect, uglier failure mode, not an England-only bug. The app already had a correct fix for this elsewhere: `MatchCard.tsx`/`SplitTeamBg.tsx`/`FollowSheet.tsx` all render real flag images from flagcdn.com via a `FLAG_ISO` map (England already mapped to `gb-eng`) -- onboarding's card just never reused it.

#### Changed -- `components/onboarding/TeamCard.tsx`
- Now renders the same `FLAG_ISO` + flagcdn.com image pattern used across the rest of the app for every national team, with a computed-text fallback (never emoji) for any nation without a map entry. Matches how flags render on every other surface in the app.

#### Verified
- Live: England's card now shows its real flag image; India/Australia spot-checked for no regression; confirmed on a second surface. `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched.

#### Scope
- `components/onboarding/TeamCard.tsx`, `package.json` (version bump).

## [1.0.168] 2026-08-07

### Fixed: platform-wide tab/segmented-view switching — one shared hook replaces six independent, bug-prone implementations

#### Context
- A diagnosed-but-not-yet-fixed bug on match pages (v1.0.167 diagnostic entry): switching tabs on a match page could briefly-to-persistently show the OLD tab's content while the new tab's pill was already highlighted, and switching tabs never reset scroll position, leaving users at an arbitrary offset in the new tab.

#### Root cause
- `MatchView.tsx` kept the active-tab highlight and the actually-rendered content as two separate pieces of state, the second updated only inside a `setTimeout` -- a gap that can widen arbitrarily under main-thread load. A platform-wide audit found the identical pattern independently reimplemented in five more places (`PageTransition.tsx` -- which wraps every page in the app -- `PlayerProfileView.tsx`, `app/schedule/page.tsx`, `FollowSheet.tsx`, `DigestTab.tsx`), none of which reset scroll on switch either.

#### Added -- `lib/useTabSwitcher.ts`
- One shared `useTabSwitcher()` hook: a single `activeTab` state (no second delayed copy to fall out of sync), synchronous scroll reset on every genuine switch (window or a scrollable container), a no-op on same-tab calls (a live data refresh never resets scroll or replays an animation), and a narrow `restoreTab()` escape hatch for the one legitimate silent-restore case (sessionStorage tab memory on mount). Companion `useScrollResetOnChange()` for the two callers whose active view isn't local click-driven state (route `pathname`, and a day/innings filter that can auto-advance from live data).

#### Changed -- six surfaces migrated, none left with independent tab-switching code
- `components/MatchView.tsx`, `components/PageTransition.tsx`, `components/PlayerProfileView.tsx`, `app/schedule/page.tsx`, `components/FollowSheet.tsx`, `components/DigestTab.tsx`.

#### Verified
- All six surfaces individually click/swipe/stress-tested live on the deployed app (see DECISIONS-LOG.md for the full per-surface, per-check results); `tsc --noEmit`/`npm run build` clean; `mockData.ts` untouched.

#### Scope
- `lib/useTabSwitcher.ts` (new), `components/MatchView.tsx`, `components/PageTransition.tsx`, `components/PlayerProfileView.tsx`, `app/schedule/page.tsx`, `components/FollowSheet.tsx`, `components/DigestTab.tsx`, `package.json` (version bump).

## [1.0.169] 2026-08-07

### Fixed: unified the "follow" icon/color across the platform onto a cyan checkmark

#### Context
- The platform used three different icons/colors for the same "follow" action: an outlined green heart (onboarding team-picker), an amber filled/outline star (player profile), and a cyan checkmark (the Filter/Follow sheet's checked checkboxes). The sheet's checkboxes were correct as the reference and left untouched.

#### Premise correction
- The fix request assumed the FollowSheet's checkmark was white; direct inspection showed it's actually `#0A0E1A` (the dark `bg` token), a deliberate legibility choice documented in that component's own comments. Confirmed with the user to reuse the real value rather than a literal white.

#### Changed -- `components/onboarding/TeamPickerStep.tsx`
- Follow button: outlined green heart -> solid `#00E5FF` circle with the FollowSheet's exact checkmark glyph, stroked `#0A0E1A`. Same size/position; X (skip) button unchanged; follow logic untouched.

#### Changed -- `components/PlayerProfileView.tsx`
- Favourite-player toggle: amber star (filled/outline) -> checkmark glyph, cyan-filled when favourited, neutral-outline when not. Same size/position; toggle logic untouched.

#### Changed -- `components/YourPlayersStrip.tsx`
- Found via platform audit: the homepage "Your Players" strip's favourited-player badge (amber `⭐` emoji) swapped to the same cyan-fill + dark-checkmark badge for consistency.

#### Verified
- Audited the rest of the codebase for other heart/star/thumbs-up "follow" affordances: none found beyond the three above (one existing text-based follow pill was already cyan and out of scope). `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched. `FollowSheet.tsx` itself confirmed unchanged.

#### Scope
- `components/onboarding/TeamPickerStep.tsx`, `components/PlayerProfileView.tsx`, `components/YourPlayersStrip.tsx`, `package.json` (version bump).

## [1.0.170] 2026-08-07

### Fixed: onboarding follow button changed from solid fill to outline, matching the X button's visual weight

#### Context
- v1.0.169 gave the onboarding follow button a solid cyan fill. Next to the outline-only X/skip button, the filled button looked pre-selected even though neither option has been chosen yet at that point in the flow.

#### Changed -- `components/onboarding/TeamPickerStep.tsx`
- Follow button: solid `bg-cyan` fill -> `border-2 border-cyan text-cyan`, transparent background, matching the X button's exact border weight and treatment. Checkmark icon now strokes `currentColor` (cyan) instead of the dark `#0A0E1A` used when there was a cyan fill behind it. Same `#00E5FF` value, no new color. Size/position/tap logic unchanged.

#### Verified
- Two team cards checked: X and follow buttons render with equal visual weight, neither pre-selected. Tapping follow still correctly registers the team in `followPrefs`. Player-profile follow button and FollowSheet checkboxes confirmed untouched. `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched.

#### Scope
- `components/onboarding/TeamPickerStep.tsx`, `package.json` (version bump).

## [1.0.171] 2026-08-07

### Added: onboarding visual polish -- card stack, per-team glow, celebration moments, progress chips

#### Context
- Presentation-layer-only pass over the existing onboarding flow (team swipe step, quiz reveal, first-session checklist). Follow persistence, quiz mechanics, checklist completion rules, and data models are untouched. The X/checkmark follow-decision buttons and the top 3-segment step progress bar were explicitly out of scope and are pixel-unchanged.

#### Premise correction
- The build spec assumed teams had no color field and gave a 16-nation hex list to add one. `Team.primaryColor` already existed platform-wide, with different (already-researched, already-shipped) values for the 6 overlapping nations, and no coverage at all for the onboarding roster's 10 IPL franchise cards. Confirmed with the user to reuse the existing field as-is rather than overwrite it or invent franchise colors.

#### Changed -- `components/onboarding/SwipeCard.tsx`
- Drag tilt now scales with drag distance (`dx * 0.1`, capped +/-15deg) instead of the old fixed `dx / 22` ratio; continues rotating to 24deg on a genuine swipe-through exit, on top of the unchanged fly-off translateX. Snap-back timing 200ms -> 250ms.

#### Changed -- `components/onboarding/TeamPickerStep.tsx`
- Fanned 3-card stack: two background placeholders (rotate 4/8deg, scale 96/92%, opacity 70/50%) render no team content at all, so nothing spoils and nothing needs to animate when the queue advances underneath them. The front card runs a scale/rotate/opacity arrival transition each time a card is dismissed. New progress-chip row (flags of followed teams, caps at 5 + "+N") below the counter row.

#### Changed -- `components/onboarding/TeamCard.tsx`
- Soft radial glow (team's existing `primaryColor`, ~32% opacity fading to transparent) behind the avatar only. `FLAG_ISO` exported for reuse by the new chip row.

#### Added -- `components/onboarding/PersonaParticles.tsx`
- One-time, non-blocking particle burst (cyan/green/gold) behind the quiz's persona-reveal title, `pointer-events: none`, self-removing after 1.5s.

#### Changed -- `components/FirstSessionQuest.tsx`
- Checklist checkmark is now an SVG (shared checkmark path) that draws in with an expanding ring the moment an item is genuinely checked during the current session -- never replayed for items already checked on page load.

#### Verified
- `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched. X/checkmark buttons and 3-segment step bar confirmed zero-diff via `git diff`.

#### Scope
- `components/onboarding/SwipeCard.tsx`, `components/onboarding/TeamPickerStep.tsx`, `components/onboarding/TeamCard.tsx`, `components/onboarding/PersonaParticles.tsx` (new), `components/onboarding/QuizStep.tsx`, `components/FirstSessionQuest.tsx`, `app/globals.css`, `package.json` (version bump).

## [1.0.172] 2026-08-07

### Fixed: front-slot SwipeCard state leak (live-verification catch, no scope change)

#### Context
- Caught during the required 9-step live-browser verification pass for v1.0.171's card-stack feature. Reproduced by dismissing three cards in a row (drag-follow, tap-follow, tap-skip): after the tap-skip, the next team's card rendered fully invisible and shifted 520px off-screen -- the correct team content (confirmed via DOM text) was present underneath, just permanently hidden.

#### Root cause
- `TeamPickerStep.tsx`'s front-card wrapper key was the fixed string `"slot-0"` (a stack POSITION, not a per-team identity), and `SwipeCard` itself had no key at all. React therefore reused the exact same `SwipeCard` component instance -- and its internal `dx`/`dragging`/`exiting` state -- across every team that ever occupies the front slot. `SwipeCard.runExit()` sets `exiting` but never clears it; that's harmless only when the surrounding `phase==="card"` tree happens to fully unmount and remount in between (e.g. a follow that shows the "moment" or "rival" phase first), which is why the first two dismissals in the repro looked fine. A plain skip -- or any follow with neither a moment nor a rival prompt pending -- never leaves `phase==="card"`, so the stale `exiting="left"/"right"` carried straight into the next team's card.

#### Fixed -- `components/onboarding/TeamPickerStep.tsx`
- Added `key={t.code}` to the `<SwipeCard>` element itself (the wrapping position `<div>` correctly keeps its static `"slot-0"` key). Forces a fresh `SwipeCard` instance -- and fresh `dx`/`dragging`/`exiting` state -- every time a new team reaches the front slot, regardless of which phase transitions did or didn't happen in between.

#### Verified
- Re-ran the 3-in-a-row dismiss sequence (drag-follow, tap-follow, tap-skip) three additional times post-fix, including two consecutive tap-skips back-to-back (the exact shape that never got masked by a phase detour) -- the next card always renders immediately and fully visible in every case. `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched.

#### Scope
- `components/onboarding/TeamPickerStep.tsx`, `package.json` (version bump).

## [1.0.173] 2026-08-07

### Fixed: checklist completion animation must fire on return, not just live

#### Context
- `FirstSessionQuest.tsx`'s v1.0.171 draw-in + ring-pulse celebration only played if the checklist happened to be mounted at the exact moment an item's state flipped to done. The checklist mounts ONLY on the home screen (`app/page.tsx`), but two of its three items -- "Open a live match" (`markQuestItem` in `MatchView.tsx`) and "Read a pitch report" (`markQuestItem` in `InfoTab.tsx`) -- are marked complete on the match detail route. By the time the user navigated back home, those items already rendered checked with no animation ever having played.

#### Fixed -- `lib/firstSessionQuest.ts`
- Added three new per-item flags to the existing `FirstSessionQuestState`/localStorage object (no new storage structure): `followTeamAnimated` / `openLiveMatchAnimated` / `readPitchReportAnimated`, each tracking whether that item's own celebration has already played. Added `isItemAnimated()` / `markItemAnimated()` accessors. `getFirstSessionQuest()` migrates pre-existing localStorage data on read: for any item that was already `true` before these flags existed, its `*Animated` flag is force-set `true` too, so returning users never get a backdated celebration for something they finished before this fix shipped.

#### Fixed -- `components/FirstSessionQuest.tsx`
- Added a new, independently-guarded (`hasCaughtUpRef`) one-shot catch-up-on-mount effect: on every mount, it checks each item for done-but-not-yet-animated and plays its celebration now, staggered 250ms apart (`CATCHUP_STAGGER_MS`) in the checklist's own display order if more than one is pending. Extracted the shared start/cleanup logic into `scheduleItemAnimation()`, used by both this new catch-up path and the pre-existing live-transition effect (refactored to call it, zero behavior change). The pre-existing live-transition effect (comparing consecutive `state` snapshots via `prevStateRef`) is untouched and still fires immediately for an item completing while the checklist is already mounted, e.g. "Follow your first team" at onboarding handoff.
- All scheduled timeout ids are pushed into a single per-instance ref (`pendingTimeoutIdsRef`) swept only on unmount, not per-effect-run: an earlier draft returned a `[state]`-scoped cleanup per effect, but `markItemAnimated()`'s own localStorage write dispatches a change event that updates `state` again -- which would re-run that effect's cleanup on an unrelated render and cancel a still-pending staggered catch-up (e.g. the 250ms-later second item) before it ever fired. Routing every id through one ref cleared only at true unmount avoids that failure mode.

#### Verified
- `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched (baseline md5 unchanged).
- Live-browser verification of the 6 required scenarios, using a `MutationObserver` on `document.body` (attached before each client-side navigation, so it survives the route change and timestamps every `.ring-pulse` element add/remove with `performance.now()` -- avoids relying on tool-call round-trip timing, which is far slower than the animation itself):
  1. **PASS** -- fresh onboarding, follow a team: `followTeamAnimated` flips `true` the moment the checklist first mounts on the home handoff (via the catch-up path, since `initFirstSessionQuest()` already sets `followTeam:true` in `OnboardingFlow.tsx` before `router.replace("/")` ever runs -- the live-transition path's `prevStateRef` never gets a chance to see a `false -> true` edge for this item either; see DECISIONS-LOG.md for the corrected understanding of why this item animates via catch-up, not live-transition, in practice).
  2. **PASS** -- live match viewed on `/match/[id]` (Live tab only, no Info tab visit), then home via the bottom-nav (client-side transition): exactly one `ring-pulse` add-then-remove cycle observed (~790ms span), `openLiveMatchAnimated` flipped `true`, zero console errors.
  3. **NOT YET RUN** -- pitch-report-in-isolation (non-live match's Info tab, then home).
  4. **NOT YET RUN** -- two-item stagger (both openLiveMatch + readPitchReport pending, one return home).
  5. **NOT YET RUN** -- no-replay after all three items have already animated once.
  6. **NOT YET RUN** -- full console-error sweep across all of the above.
  Steps 3-6 were blocked mid-session by a Claude-in-Chrome extension connectivity outage that did not recover after roughly 20 retries over several minutes; the user was handed a manual click-by-click verification script (visit target URLs, watch the checklist, run a `localStorage` reset snippet for the two-pending-items case) to run themselves and report results back. This entry should be updated with the steps 3-6 outcome once that's done -- see task #469 in the session's tracked task list, still `in_progress` for exactly this reason.

#### Scope
- `lib/firstSessionQuest.ts`, `components/FirstSessionQuest.tsx`, `package.json` (version bump).

## [1.0.185] 2026-08-11

### Fixed: same GPU-compositing wash-out on all page-level navigation (PageTransition.tsx), platform-wide

#### Context
- v1.0.184's DECISIONS-LOG entry explicitly flagged `components/PageTransition.tsx` -- the whole-app route wrapper used on every page navigation (Home/Filter/Schedule/Match/Player/onboarding) -- as an identical, unfixed instance of the same class-never-removed pattern that caused the Live-tab wash-out. The user independently reproduced it live: navigating Home into a match page left the destination page washed-out and illegible for 5+ seconds while live score data kept updating underneath.

#### Fixed -- `components/PageTransition.tsx`
- `animClass` (the local deciding which `book-enter-forward`/`book-enter-backward` class to apply) converted to real `useState`, and a new effect clears it back to `""` via `setTimeout` matched to `ENTRANCE_ANIMATION_MS` (300ms, imported from `lib/useTabSwitcher.ts`, not re-guessed).
- `animClass` had to become state rather than staying a plain local: the component does the "adjust state during render" pattern (comparing pathname against a ref, then calling `setAnimClass` mid-render), and a plain local would be silently dropped on React's same-render retry (the ref used for the diff check is already mutated on the first pass, so the retry's condition reads false and skips recomputing the plain local). State, unlike a plain local, is guaranteed to survive the retry.
- This defect was worse than the tab-switch case fixed in v1.0.184: since `PageTransition.tsx` never cleared the class at all, a destination page's entire visit duration -- not just the moment of transition -- could stay pinned to the degraded GPU compositing layer.

#### New -- `lib/animationCleanup.ts`
- `useClearValueAfterDuration<T>(value, clearedValue, durationMs, setValue)`: a generic hook that schedules `setValue(clearedValue)` via `setTimeout` whenever `value !== clearedValue`, matched to a caller-supplied duration. Used by `PageTransition.tsx` and the two newly-discovered instances below.
- Per explicit instruction, `lib/useTabSwitcher.ts` and `components/MatchView.tsx` (both confirmed working in v1.0.184) were deliberately **not** migrated to call this utility and are byte-for-byte unchanged -- the stricter "leave it exactly as is" instruction took precedence over the softer suggestion to share the hook across all three call sites.

#### Fixed -- full codebase audit found two more unreported instances
- **`components/WinProbBadge.tsx`** (`.winprob-pulse`, 180ms): the shared win-prob-display component (match cards, matchup rows, win-prob chart) applied the pulse class and never cleared it. New internal `WinProbValue` wrapper using `useClearValueAfterDuration`; existing `key={pct}` remount-on-change behavior preserved at all 3 call sites.
- **`components/onboarding/TeamPickerStep.tsx`** (`.chip-in`, 200ms): the follow-progress chip row (per-team chips + overflow chip) applied the entrance class and never cleared it. New internal `EntranceChip` wrapper, same mechanism.
- Confirmed dead CSS (zero call sites): `.modal-slide-up`, `.anim-leave-left`/`.anim-leave-right`, `.anim-pull-up`, `.slide-in-right`.
- Confirmed correct-by-different-mechanism (self-unmounting via their own cleanup timers): `persona-particle-burst` (`PersonaParticles.tsx`), `ring-pulse` (`FirstSessionQuest.tsx`).
- Confirmed out of scope by design (short-lived, uniquely-`key`ed per-ball elements, not persistently-mounted): `.live-dot`, `.excitement-glow`, `.skeleton`, and `BallGIF.tsx`'s per-ball `infinite` keyframes (`wicket-flash`, `pulse-soft`, `boundary-pulse`, `stumps-fly`).

#### Verified (screenshot-based, exhaustive, both matches)
- Home <-> live-match round trip (5+ cycles, both directions, real bottom-nav/card taps). Filter -> Schedule -> Home (5+ cycles). Live -> completed -> pre-match -> Home cycling.
- Player-profile open/back via real in-app `<Link>`s (Score tab batter names) -- typed-URL navigation was deliberately avoided for this check since it's a full page reload that never exercises `PageTransition.tsx`'s client-side transition logic at all.
- Win-prob modal open/hold/close on both the T20 and Test match.
- Full onboarding flow start to finish (team picker with a follow + rival-prompt celebration moment, player picker, all 3 quiz questions, persona reveal, Continue to Home) -- every step transition screenshotted.
- Every required path repeated on `ind-eng-test-2026-d3-live` (different card-count layout, different tab set including `TABLE`).
- Every screenshot showed sharp, fully-legible content immediately, with live data visibly ticking underneath. `read_console_messages` with `onlyErrors: true` returned zero errors across the entire session.

#### Found, not fixed -- flagged for the user
- A diagonal dithering/hatching overlay appears on the match page's **Live** tab specifically (never Score/Digest/Info/Table, never Home, never a player profile). Confirmed via a **hard, full browser reload** to be unrelated to the animation-class mechanism above (a reload carries no leftover React state, ruling that mechanism out entirely). Correlates with `BallGIF.tsx`'s gradient-heavy SVGs combined with the app's `backdrop-filter: blur(8px)` header/nav bars; `getComputedStyle`/WebGL checks confirmed this session's browser uses real, hardware-accelerated D3D11 rendering (Intel UHD Graphics via ANGLE), not software/headless rendering -- most likely an Intel-GPU driver compositing quirk, not an app logic bug. Different mechanism, different visual signature (moire, not desaturation) from the fix above; left unscoped pending direction.

#### Scope
- New: `lib/animationCleanup.ts`. Modified: `components/PageTransition.tsx`, `components/WinProbBadge.tsx`, `components/onboarding/TeamPickerStep.tsx`, `package.json`/`README.md` (version bump). `lib/useTabSwitcher.ts` and `components/MatchView.tsx` unchanged.

## [1.0.184] 2026-08-11

### Fixed: Live-tab wash-out after tab-switch -- real mechanism found (GPU compositing, not visibility)

#### Context
- Every prior round (v1.0.174-180) fixed a real bug in `BallGIF.tsx` itself and was verified by reading DOM/CSS/JS state after the fix. This round's report came with an actual screenshot (not a state check): Live -> Score -> Digest -> Live on `ind-aus-t20i-2026-m2-live` showed the field/pitch panel and everything below it visibly washed-out, not self-correcting after several seconds -- while the code state at that exact instant read fully correct (opacity 1, no fade class, gradients resolving, live data updating, zero console errors). The instruction: investigate as a rendering/paint problem, not a logic one, and stop looking at visibility flags (already ruled out thoroughly in v1.0.178).

#### Investigation -- six live, screenshot-verified experiments against the running page
- Patching `book-enter-fwd`/`book-enter-bwd`'s "to" keyframe `transform` to `none` via the CSSOM: computed transform correctly became a 2D identity matrix, but the wash-out still occurred -- disproving "a specific 3D matrix value degrades raster quality."
- Removing both `transform` and `animation` from the element entirely fixed it instantly, every time -- isolating the cause to the mere presence of the declared animation, independent of its resolved value.
- A plain reflow read (`offsetHeight`) did not fix it; toggling an unrelated non-transform style property did not fix it either -- ruling out "needs a layout flush" and "any repaint nudge fixes it."
- `animationend`/`animationstart`/`animationcancel`, registered document-level in capture phase before the triggering clicks, never fired once across a real Live -> Score -> Digest -> Live sequence -- any event-driven cleanup would be unusable here, not just fragile.
- A `setTimeout` scheduled for exactly `getComputedStyle(el).animationDuration` (the CSS's own declared 300ms, read live) reliably cleared the wash-out every time, confirmed via a clean, unconfounded retest.

#### Root cause
- `MatchView.tsx`'s tab-content wrapper applies `book-enter-forward`/`book-enter-backward` (`app/globals.css`, a genuine 3D `perspective()+rotateY()` transform via a 300ms `animation` shorthand) on every tab remount and never removes it. Chromium promotes an element with an active `animation` targeting `transform` to its own GPU compositing layer, and that layer stays pinned to a degraded/washed-out paint quality for as long as the animation stays *declared* -- regardless of the resolved transform value and regardless of whether the animation has finished progressing. This mechanism (commit `05139a8`) predates every prior BallGIF-focused round and was never previously examined.

#### Fixed -- `lib/useTabSwitcher.ts`
- New `ENTRANCE_ANIMATION_MS = 300` constant (matches the CSS's own declared duration) and a `useEffect` that clears `direction` back to `null` exactly that long after every switch, via React state (not direct DOM manipulation) so the entrance class is naturally absent afterward and stays absent through unrelated re-renders. `activeTab` and content mounting are completely untouched by this timer -- only a cosmetic, already-finished entrance-animation class is cleared, which does not reintroduce the "two states, one gated by a timer" pattern ARCHITECTURE.md's "Tab switching: one state, no timer" section bans.

#### Fixed -- `components/MatchView.tsx`
- The win-prob modal (`showProbModal`) had the identical unfixed defect -- `book-enter-forward` applied for its entire open duration, sometimes minutes. Added `hasEnteredProbModal`, cleared to the modal's classname the same way after `ENTRANCE_ANIMATION_MS`, reusing the existing `setTimeout(..., 240)`-matched-to-CSS-duration pattern already present in this file's `closeProbModal`.

#### Verified (screenshot-based, as required)
- 10 real screenshots: 5 cycles of Live -> Score -> Digest -> Live on each of `ind-aus-t20i-2026-m2-live` and `ind-eng-test-2026-d3-live`, one screenshot immediately after every switch back to Live. Every single one crisp and fully readable -- field/pitch panel, trajectory dots, delivery-type card, partnership row, matchup selector, win-prob box, Moments cards -- with live score/win-prob values visibly updating between switches.
- Opened the win-prob modal, held it open 2+ seconds (past the 300ms cleanup window): chart stayed crisp, live win-prob value kept updating. Closed via the exit animation; Live tab underneath remained crisp.
- `tsc --noEmit` / `npm run build` clean. Zero console errors/warnings across the entire verification session (both matches, all 10 switches, modal open/close).

#### Flagged, not fixed
- `components/PageTransition.tsx` (the whole-app route wrapper for every page navigation) independently applies the same `book-enter-*` classes via its own logic and also never removes them -- an identical, currently-unfixed instance of this exact mechanism. Does not consume `useTabSwitcher`'s `direction` state, so this fix does not touch it; flagged as a known follow-up.

#### Scope
- `lib/useTabSwitcher.ts`, `components/MatchView.tsx`, `package.json`/`README.md` (version bump). `components/BallGIF.tsx`'s v1.0.178 architecture is unchanged.

## [1.0.183] 2026-08-11

### Product decision: "For You" scoped to explicit team/nation follows only

#### Context
- Explicit product decision: "For You" badges must only ever be triggered by an explicitly followed team (national, e.g. India, or franchise/club, e.g. RCB) -- via `followPrefs.nations` or `followPrefs.teams`. No other signal -- format, tournament, series, or player, including the v1.0.182 skip-everything default-format fallback -- may produce a "For You" badge under any circumstance.

#### Audit findings (pre-change)
- `getForYouReason()` (the badge's reason-text generator) checked, in priority order: Player, Team, Nation, Series, Tournament, then Format (with a `defaultFormats` sub-check added in v1.0.182 to distinguish "Because you follow X" from "Popular in X").
- The badge's gating logic (`isTier1Match`/`isAnyMatch`, consumed only by `app/page.tsx`'s `forYouResult` computation) treated Nation, Team, Tournament, Series, and Format as equally-qualifying "Tier 1," with Player as a lower-priority "Tier 2" fallback when nothing else qualified.

#### New -- `lib/followPrefs.ts`
- `isForYouMatch(q: MatchQualification): boolean` -- the new, sole gate for the "For You" badge: `q.nation || q.team`, nothing else. `isTier1Match`/`isAnyMatch` are left in place, unchanged, but are no longer called anywhere for "for you" purposes -- flagged in their doc comments as currently unused outside `scripts/series-category-check.ts`, not deleted.

#### Changed -- `lib/followPrefs.ts`
- `getForYouReason()`: removed the Player, Series, Tournament, and Format branches entirely (including the v1.0.182 `defaultFormats` "Popular in X" logic). Only Team then Nation remain -- the function can no longer return anything but `"Because you follow {team/nation}"` (or the "both" variant), or `null`.

#### Changed -- `app/page.tsx`
- `forYouResult`'s qualifying loop now calls `isForYouMatch(q)` directly instead of `isTier1Match(q)` plus a player-only fallback bucket -- there is no more Tier-1/Tier-2 split, a match either involves a followed team or it doesn't.
- `bestFollowRank()` left unchanged (still ranks team/series/tournament/nation/format) -- its series/tournament/format branches are now unreachable as the deciding qualifier (since only team/nation can gate entry into the ranked set at all), left in place as a harmless tie-break nuance, not removed, since only what feeds "for you" was in scope.

#### Not removed -- flagged for a separate decision
- The v1.0.182 `defaultFormats` field, `DEFAULT_FALLBACK_FORMATS` constant, and `applyOnboardingFallbackIfNeeded()` function are untouched and still run at the end of onboarding -- a skip-everything user still gets `formats: ["T20","T20I","Hundred"]` written to storage. This data now has NO functional consumer anywhere in the app (confirmed by full-repo grep) beyond `qualifyMatch()`'s own `format` field, which nothing reads for "for you" purposes anymore. Left in place, dormant, rather than deleted unilaterally -- a product call on whether to keep it for potential future use (a format-based feed, a Filter tab default, etc.) or remove it outright.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Isolated logic tests (localStorage-mocked `tsx` script): full-skip onboarding assigns default formats to storage but produces zero "for you" qualifying matches; an explicit-format-only account (simulating full quiz completion) also produces zero; an India-only follow produces "for you" badges (and only those) on India's 3 pool matches, all reading "Because you follow India"; India + RCB produces badges on all of both teams' matches, each correctly labeled.
- 4 required live sequences run against the deployed build -- see DECISIONS-LOG.md for verbatim results.

#### Scope
- `lib/followPrefs.ts`, `app/page.tsx`, `package.json` + `README.md` (version bump), `BUILD-STATUS.md` changelog table. Onboarding flow, the quiz, skip controls, follow-icon treatment, tab-switching, and match selection for the carousel/Spotlight/Past/Coming Up sections are untouched.

## [1.0.182] 2026-08-11

### Fix: "For You" badge copy honesty -- distinguish explicit follows from the onboarding default

#### Context
- Confirmed bug: a test account that skipped team selection, skipped player selection, and never went through a real format-selection step still showed a "FOR YOU" badge reading "Because you follow T20" on the homepage. Its stored prefs: `teams: []`, `formats: ["T20", "T20I", "Hundred"]`.

#### Mechanism finding (v1.0.182 investigation)
- There was NO existing fallback-default mechanism anywhere in the codebase before this fix -- `formats` was previously only ever written by `components/onboarding/QuizStep.tsx`'s `persistFormatTags()`, called exclusively from `answer()` when a user genuinely completes all 3 quiz questions (mapped through `PERSONA_TABLE` in `lib/onboardingQuiz.ts`). This is intentional, documented, existing behavior -- the quiz is the app's designed format-preference-capture mechanism, and a real answer there is treated as an explicit choice, the same bucket as a team-picker follow or a manual pick in the "Follow your cricket" settings sheet. `skipQuiz()` (v1.0.181's `SKIP_PERSONA`) never calls `persistFormatTags()` at all (`formatTags: []`), so the current build's true "skip everything" path (team, player, AND quiz) previously left a user with zero followed formats and no "for you" badge whatsoever -- not a mislabeled one.
- A brand-new fallback was built as part of this fix (see below) so that a genuinely fully-skipped user gets *some* personalization instead of none, per product direction that such a default is reasonable to have -- but it did not previously exist in code, contrary to the bug report's own hypothesis.

#### New -- `lib/followPrefs.ts`
- `FollowPrefs.defaultFormats: MatchFormat[]` -- always a subset of `formats`; marks which followed formats were auto-assigned rather than chosen. Extended through `emptyFollowPrefs()`, `sanitizeFollowPrefs()` (kept as a subset of the sanitized `formats` list), and `prefsEqual()`, the same way every other category already flows through those three functions.
- `FollowCategory` now also excludes `"defaultFormats"` (alongside the existing `"rivalTeam"` exclusion) -- it's a read-only annotation on `formats`, never its own Filter-sheet section.
- `DEFAULT_FALLBACK_FORMATS = ["T20", "T20I", "Hundred"]` and `applyOnboardingFallbackIfNeeded()`: called once, at the very end of onboarding, after the team/player/quiz steps already had their chance to write a real follow. No-ops whenever the user has ANY real follow (including quiz-derived formats); otherwise assigns the fallback set into both `formats` and `defaultFormats`.
- `getForYouReason()`'s format branch (lowest priority, unchanged position) now checks `defaultFormats` before falling back to the existing `"Because you follow {format}"` copy -- a defaulted format instead returns `"Popular in {format}"`, exact wording, no paraphrasing. The qualification check itself (`prefs.formats.includes(match.format)`) is untouched, so this only changes wording, never whether a match counts as "for you".

#### Changed -- `components/onboarding/OnboardingFlow.tsx`
- `finishOnboarding()` now calls `applyOnboardingFallbackIfNeeded()` immediately before `markOnboardingComplete()`.

#### Changed -- `components/FollowSheet.tsx`
- `toggle()`: any format the user manually taps in the "Follow your cricket" sheet (on or off) now also clears that format out of `draft.defaultFormats` -- a deliberate re-confirmation through this dedicated settings UI always counts as a fresh explicit choice, never left silently flagged as a default.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- `qualifyMatch()`/`isTier1Match()`/`isAnyMatch()` untouched -- confirmed via code diff that no call site of those functions changed and neither function reads `defaultFormats`.
- Isolated logic tests (localStorage-mocked `tsx` script): full-skip onboarding produces `formats`/`defaultFormats` both `["T20","T20I","Hundred"]` and `getForYouReason()` returns `"Popular in T20"`; a simulated honest quiz completion leaves `defaultFormats: []` and returns `"Because you follow T20"`; a mixed case (default fallback formats + a separately, explicitly followed team) resolves each match's reason independently and correctly by which specific preference actually qualifies that match.
- 3 required live sequences run against the deployed build -- see DECISIONS-LOG.md for verbatim results.

#### Scope
- `lib/followPrefs.ts`, `components/onboarding/OnboardingFlow.tsx`, `components/FollowSheet.tsx`, `package.json` + `README.md` (version bump), `BUILD-STATUS.md` changelog table. Onboarding flow steps, the quiz's own content/Skip control, `qualifyMatch`/targeting logic, and all prior rounds of fixes are untouched.

## [1.0.181] 2026-08-10

### Onboarding: add "Skip" control to the cricket-persona quiz step

#### Context
- Confirmed bug: onboarding's team-picker and player-picker steps each have a top-right "Skip" link, but the 3-question cricket-persona quiz that follows had no such control on any of its 3 questions -- the only onboarding step a user could not bypass.

#### New -- `lib/onboardingQuiz.ts`
- `SKIP_PERSONA`: a fixed, hardcoded `Persona` (`name: "All-Rounder"`, `description: "You're here for the cricket, in whatever form it takes."`), deliberately kept outside `PERSONA_TABLE` since it is never computed from answers and never varies by which question was open when Skip was pressed.

#### Changed -- `components/onboarding/QuizStep.tsx`
- Added a "Skip" link to the header row of all 3 questions, reusing the identical `text-xs font-bold text-text-dim` style and `flex items-center justify-between px-1` row layout already used by `TeamPickerStep.tsx`/`PlayerPickStep.tsx` -- no new visual style introduced.
- New `skipQuiz()` handler: discards whatever's in `answers` (0, 1, or 2 responses) and calls `setPersona(SKIP_PERSONA)` directly, bypassing `computePersona()`/`persistFormatTags()` entirely -- skipping from any question produces the exact same fixed result, regardless of how many questions were already answered.
- The persona-reveal branch (label, title, description, Share, Continue) is unchanged code -- it already read `persona.name`/`persona.description` generically, so it renders `SKIP_PERSONA`'s copy through the exact same markup, same `sharePersona()` mechanism, and the same `onComplete` callback as a normal, fully-answered quiz completion.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- The existing 6-entry `PERSONA_TABLE` and `computePersona()` are untouched -- answering all 3 questions honestly still produces the same computed personas as before, byte-for-byte.
- 4 required sequences tested live (0-answers skip, 1-answer skip, 2-answers skip, full 3-answer completion) -- see DECISIONS-LOG.md for verbatim results.

#### Scope
- `lib/onboardingQuiz.ts`, `components/onboarding/QuizStep.tsx`, `package.json` + `README.md` (version bump), `BUILD-STATUS.md` changelog table.

## [1.0.180] 2026-08-10

### Round 6 fix: per-instance-unique SVG ids in BallGIF.tsx (hardening, no observed bug fixed)

#### Context
- v1.0.179 shipped diagnostic-only instrumentation to test the hypothesis that BallGIF.tsx's fixed SVG `<defs>` ids (`pitchB`, `ballB`, `pre-B`, `post-B`, `fieldO`, `ballO`, `shotPath`) could transiently collide with a second instance during a tab-switch remount landing near the ~3s bowler/overhead clip-swap boundary, and manifest as the product owner's reported "intermittent, sometimes self-corrects, sometimes stuck" Live-tab content issue.
- Ran 40 real, verified rapid/irregular tab switches (20 per match on both `ind-eng-test-2026-d3-live` and `ind-aus-t20i-2026-m2-live`), driven by an in-page script clicking the actual tab buttons with irregular delays (150ms-3.6s) deliberately chosen to straddle the clip-swap boundary repeatedly, confirmed via a parallel `data-active-tab` log to have genuinely alternated tabs at the intended timing (not just fired click events that failed to register). Zero `ID COLLISION` or `MISSING` warnings, zero console errors, across all 40 switches.

#### Fixed -- `components/BallGIF.tsx`
- Applied `useId()` to give each mounted `BowlerView`/`OverheadView` instance its own unique id suffix (e.g. `pitchB-:r3:` instead of a bare `pitchB`), so `fill="url(#id)"` and `href="#id"` references can never resolve against a different instance's element regardless of how a future change to this component's mount/unmount timing might alter today's guarantees. This is defense-in-depth, not a fix for an observed failure -- duplicate global SVG ids are invalid per spec independent of whether this specific app ever manifested the bug, and the fix is free (no behavior change, same visuals).
- Kept the v1.0.179 collision-check instrumentation in place, now checking the new suffixed ids, so it continues proving (rather than merely asserting) that no collision occurs.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Post-fix: re-ran the same 40-switch rapid/irregular protocol on both matches -- reported directly to the user with the real console output. See DECISIONS-LOG.md.

#### Scope
- `components/BallGIF.tsx`, `package.json` + `README.md` (version bump), `BUILD-STATUS.md` changelog table.

## [1.0.179] 2026-08-10

### Round 6 diagnostic instrumentation: SVG id-collision detection in BallGIF.tsx (no functional change)

#### Context
- The product owner confirmed v1.0.178's fix is real: the scene wrapper's opacity is unconditionally 1, verified independently on their end. But they report the Live tab still, intermittently, "keeps looking fine sometimes, but also broken sometimes" after a tab-switch, with a noticeable load delay, and -- critically -- the stuck state sometimes self-corrects and sometimes doesn't. That inconsistency rules out a pure visibility bug (which would be consistently stuck or consistently fine) and points at a race: something that usually finishes in time but occasionally doesn't, depending on timing.
- Working theory to test: `BallGIF.tsx`'s `BowlerView`/`OverheadView` define SVG gradients/paths with fixed, hardcoded `id`s (`pitchB`, `ballB`, `pre-B`, `post-B`, `fieldO`, `ballO`, `shotPath`) referenced via `fill="url(#id)"` and `href="#id"`. SVG id references resolve globally against the whole document, not scoped to their own `<svg>`. If a tab-switch remount of the whole Live tab ever collided with the independent ~3-second bowler/overhead clip-swap remount inside `BallGIF.tsx`, two instances defining the same ids could transiently coexist, and a reference could resolve to the wrong or about-to-be-removed element -- exactly the kind of failure that would sometimes finish correctly and sometimes not, depending on timing.

#### What shipped in this version
- Read `components/BallGIF.tsx` in full: confirmed there is no data fetch, no `useEffect`/`useState` pair that populates content asynchronously after mount, and no un-cancelled async operation of any kind -- every pixel of the scene (pitch geometry, gradients, trajectory curves) is computed synchronously in the render body from props already in hand. This rules out the "uncancelled async write from a superseded mount" half of the hypothesis as inapplicable to this file (there's no async write to cancel).
- The SVG-id-collision half of the hypothesis is concrete and testable. Added temporary `[content-debug]` instrumentation (`useSvgIdCollisionCheck`, called from both `BowlerView` and `OverheadView`) that runs in a `useLayoutEffect` on every mount -- synchronously, right after DOM commit, before the browser paints -- and checks `document.querySelectorAll('[id="..."]')` for each of that view's fixed ids, logging a count for each and a loud `ID COLLISION` warning if any id resolves to more than one element. This is a deliberately different signal from v1.0.178's `[scene-debug]` opacity logs (already proven always correct) since it tests something opacity can't.
- No functional/behavioral change in this version -- ids are still the old shared fixed strings, unchanged. This build exists solely to gather real evidence (via deliberate rapid/irregular tab-switching timed near the clip-swap boundary) before deciding whether a fix is needed and what shape it should take.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Live reproduction results (rapid/irregular switching, both matches) reported directly to the user -- see DECISIONS-LOG.md and this session's chat report.

#### Scope
- `components/BallGIF.tsx` (instrumentation only), `package.json` + `README.md` (version bump), `BUILD-STATUS.md` changelog table.

## [1.0.178] 2026-08-10

### Architecture change: Live-tab scene is visible-by-default, removing the invisible-by-default/animation-dependent pattern entirely (replaces v1.0.174-177 patches)

#### Context
- Round 5 on the same underlying symptom. v1.0.174 (fill-mode fix), v1.0.175 (suppression ref), v1.0.176 (widened suppression window), and v1.0.177 (setTimeout watchdog) each fixed one specific way the Live-tab scene could fail to become visible, and each time a new failure mode surfaced. Most recently, the user reproduced v1.0.177 themselves on a real repro: Live -> Score -> Live, left untouched for 15 continuous seconds, stayed visually broken the entire time -- and inspected the scene element directly, finding NO inline `style` attribute at all (the v1.0.177 watchdog had never run). The user's diagnosis, which this change accepts in full: the recurring failure isn't any single bug, it's the architecture. Every round treated the scene as invisible by default (`opacity: 0`) and tried to guarantee something -- a fill-mode, a flag, a timer -- would make it visible. Any one of those links failing, for any reason, leaves the user looking at broken content with no fallback.

#### The architecture change -- `components/BallGIF.tsx`
- Removed entirely: the `.scene-fade-in` CSS `@keyframes` animation and its class, the `skipEntranceAnimation` prop, `suppressFirstFadeRef`, the 320ms suppression-window `useEffect`, and the 400ms `setTimeout` watchdog that forced `animation: none; opacity: 1`. None of this is left stacked underneath the new approach -- it's deleted, not superseded-but-present.
- The scene div now renders with a single static class (`"absolute inset-0"`) and no opacity-affecting style of any kind. Its resting/default state -- the very first paint, before any effect has had a chance to run -- is the browser's own default `opacity: 1`. There is nothing that needs to complete, fire, or be suppressed correctly for the content to be visible. If a future entrance flourish is ever wanted, per explicit instruction it must only ever animate FROM a lower starting point UP to 1, triggered explicitly after mount as a bonus, never the reverse -- no such flourish was reintroduced here; it was judged not worth the risk after five rounds of failures on exactly this kind of mechanism, and removing it outright was preferred to inventing a sixth, newly-untested "safe" version of the same idea.
- `app/globals.css`'s `.scene-fade-in` keyframe and class deleted (grep-confirmed only caller was this component).
- `components/MatchView.tsx`'s `hasShownLiveSceneRef` and the `skipEntranceAnimation={hasShownLiveSceneRef.current}` prop threading removed -- both existed solely to support the now-deleted suppression mechanism.

#### Temporary debug instrumentation -- `components/BallGIF.tsx`
- Added, per explicit request, `console.log` lines tagged `[scene-debug]`: one at every scene mount, and one ~50ms later reporting the actual computed `opacity` and whether any `scene-fade-in` class is present (expected: `opacity=1`, `hasAnimationClass=false`, unconditionally, every time). This makes the fix checkable from real console output, not a written claim. Flagged for removal once confirmed fixed on a real device.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Full pass over `BallGIF.tsx` and `MatchView.tsx` confirmed no dead/conflicting code remains from any of the four prior rounds -- `skipEntranceAnimation`, `suppressFirstFadeRef`, `sceneNodeRef`, and `hasShownLiveSceneRef` no longer exist anywhere in either file (grep-confirmed zero occurrences).
- Live console-log-verified reproduction (verbatim output, both matches, 5+ cycles each, 15s untouched per cycle) reported directly to the user alongside this entry -- see that report / DECISIONS-LOG.md for the raw logs, since this changelog is for narrative summary, not raw data dumps.
- Explicit environment honesty, unchanged from prior rounds: this session's testing tool cannot produce a genuinely foregrounded, non-backgrounded browser tab. What changes with this fix is that the fix no longer depends on foreground/background timing at all -- the scene's default state is visible regardless of whether any animation, timer, or effect ever runs, which is verifiable as a static code fact (grep for any opacity-affecting rule) rather than a timing-sensitive live capture.

#### Scope
- `components/BallGIF.tsx` (scene div + removed hooks/effects), `components/MatchView.tsx` (removed dead ref/prop threading), `app/globals.css` (removed `.scene-fade-in`), `package.json` + `README.md` + `BUILD-STATUS.md` (version bump). `lib/useTabSwitcher.ts` and the book-enter/exit CSS remain untouched throughout this entire five-round saga.

## [1.0.177] 2026-08-10

### Fixed: directly reproduced the persistent (non-self-healing) Live-tab flash and added a guaranteed-correctness fallback

#### Context
- v1.0.176 narrowed WHEN `.scene-fade-in` could race MatchView's concurrent `book-enter-forward`/`book-enter-backward` transition (extending BallGIF's suppression window from same-tick to 320ms). That fix was shipped honestly flagged as unverified against the actual persistent-stuck symptom, since this session's automation could not, at the time, directly capture a permanently-stuck frame.
- Immediately after v1.0.176 deployed, re-testing the exact real-user reproduction steps (switch Live -> Score -> Live, then watch) directly caught the bug: reading `getComputedStyle` on the scene div and confirming DOM-node identity across repeated samples, the SAME physical node reported `animationPlayState: "running"` while `opacity` stayed at the literal `"0"` for multiple real seconds -- more than 10x `.scene-fade-in`'s 280ms spec duration, and long after any 300ms book-enter window would have closed. This is a first-hand, tool-verified capture of the actual persistent symptom, not an inference.

#### Root cause -- confirmed directly, not theorized
- `.scene-fade-in` is a "hope the browser plays it" CSS `@keyframes` animation with no code-level guarantee it ever reaches its finished state. v1.0.174 already fixed one way this can go wrong (missing `forwards` fill-mode causing a *definitely*-never-started animation to hold its 0% frame). v1.0.176 fixed a second, narrower way (a race against a concurrent ancestor transform). This is a third, more fundamental way: the animation's own timeline can simply fail to progress in real time even after `forwards`/`both` is set and no concurrent ancestor animation is in play, most likely tied to this environment's `document.hidden` tab-backgrounding (Chromium is known to deprioritize compositor-driven animation timelines for backgrounded/occluded tabs), but nothing about the underlying mechanism -- a fire-and-forget animation with zero fallback -- is actually specific to automation. Any real-world condition that causes a browser to deprioritize that timeline (tab occlusion, GPU/main-thread contention, power-saving throttling) could trigger the same stuck state on a real device, matching the product owner's persistent, non-self-healing report far better than any of the previous, narrower explanations.

#### Fixed -- `components/BallGIF.tsx`
- Added a JS-driven watchdog, scoped per scene-div mount (via `useEffect` deps matching the div's own `key`: `activeClip`, `ball.id`). 400ms after a non-suppressed scene mount (280ms animation spec + margin), it unconditionally sets `element.style.animation = "none"` (which overrides the running keyframe animation -- an inline `none` always wins over an author-stylesheet `animation` shorthand) immediately followed by `element.style.opacity = "1"`. This guarantees the correct end state regardless of whether `.scene-fade-in`'s own browser-driven timeline ever actually completes on its own. If the animation already finished normally, this is a harmless no-op.
- Uses `setTimeout`, not `requestAnimationFrame`, deliberately -- this codebase already established (`lib/useCarouselIndex.ts`) that rAF is fully suspended (not just throttled) on a hidden/backgrounded tab, while `setTimeout` continues to run (throttled, but not stopped).
- This is additive to, not a replacement for, v1.0.176's suppression-window fix -- both remain in place. v1.0.176 reduces how often a scene-fade-in even starts in a risky concurrent window; this watchdog guarantees correctness for every scene-fade-in that does start, regardless of why its timeline might stall.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Direct reproduction of the underlying bug (the stuck-node evidence above) was captured BEFORE this fix, using DOM-node-identity + `getComputedStyle` polling across real multi-second windows -- not a screenshot, not an inference.
- Post-fix, the same test methodology was re-run on the deployed build to confirm the watchdog actually resolves the previously-reproduced stuck state (see live verification in this session's report to the user / DECISIONS-LOG.md for the full trace).

#### Scope
- `components/BallGIF.tsx` only (adds a `ref` to the scene div and one new effect; the v1.0.176 suppression logic is untouched). `package.json` + `README.md` + `BUILD-STATUS.md` (version bump). `components/MatchView.tsx`, `lib/useTabSwitcher.ts`, and the book-enter/exit CSS remain unchanged.

## [1.0.176] 2026-08-10

### Fixed: real-device report of a Live-tab flash that did not self-heal -- extended v1.0.175's suppression window to cover the concurrent book-enter transition

#### Context
- After v1.0.175 shipped, this session's own automated 48-cycle re-verification (documented in the previous DECISIONS-LOG.md entry) could not reproduce a failure and concluded the suppression mechanism was working correctly, attributing an earlier "still failing" report to a test-timing artifact.
- The user came back with a materially different, non-automated report: the product owner, testing on his own real device (no automation involved), confirmed the washed-out Live-tab visual (a) happens specifically when switching INTO Live from another tab, not from a fresh load or from sitting on Live, and (b) does NOT self-heal -- it stays broken even after waiting 10-15+ seconds with no further interaction. Point (b) rules out the v1.0.175 follow-up's "periodic 3-second cross-fade" explanation on its own: a periodic animation that re-triggers every ~3 seconds would, by definition, resolve itself within a few seconds if that were genuinely the whole story. The user explicitly required reproducing this the way a real user would (open Live, switch away, switch back, then watch without touching anything for 10-15s) rather than relying further on automated snapshot-style checks, and required identifying the precise mechanism before applying any fix.

#### Investigation
- Repeated the real-user reproduction steps via Claude-in-Chrome: fresh load, switch to Score, switch back to Live, then sampled the scene div's actual computed `opacity`/class list/animation state at real-wall-clock intervals out to several seconds, both immediately and via short in-page timer traces.
- Every individual sample this session took, when rechecked with real timers, settled to `opacity: 1` within roughly 300-500ms -- i.e., direct computed-style evidence in this environment did not show a permanently frozen frame. However, screenshots taken at the same moments continued to show the same page-wide washed-out look regardless of the underlying computed style, reconfirming the pre-existing finding (already on record from v1.0.174/v1.0.175 verification) that this specific automation tab is permanently `document.hidden: true` and that screenshots captured from it are not reliable evidence of real rendered pixels.
- Traced the concurrency structure of a genuine tab-switch-back into Live: `MatchView.tsx`'s `key={tab}` wrapper plays a `book-enter-forward`/`book-enter-backward` transition (300ms, 3D `perspective()` transform + opacity) on the ANCESTOR of `BallGIF.tsx` at the exact same moment the tab-switch remount happens. Confirmed directly in `lib/useTabSwitcher.ts` that `direction` (and therefore this transition) is `null`, and so absent, on a genuine first page load and while sitting on an already-active tab -- it is only ever non-null immediately after a real `switchTab` call. This exactly matches the reported specificity: the bug is only ever seen right after a tab switch into Live, never on fresh load, never mid-session.
- v1.0.175's suppression (`suppressFirstFadeRef`) only covers the scene div's very first render after a remount -- it flips back to normal, un-suppressed behavior in a same-tick `useEffect(() => {}, [])`, i.e., within roughly a millisecond of mount. If the mock live-simulation ticks a new ball, or the periodic bowler/overhead cross-fade interval fires, within the ~300ms the outer `book-enter-forward`/`book-enter-backward` transition is still running, that second scene remount is NOT suppressed and plays `.scene-fade-in` normally -- nested inside an ancestor whose compositing layer is still actively being established by the in-flight 3D-transform animation. A child layer's own opacity animation starting before its transform-animating ancestor's layer has been fully promoted/committed is a plausible, known category of browser compositor race that can leave the child visually stranded on a pre-animation frame with no built-in reason to repaint until something else forces one -- consistent with every reported detail, including the lack of self-healing.
- This explanation is offered with an explicit evidentiary caveat, documented directly in the code comment (`components/BallGIF.tsx`): this session's own automation could not directly capture a permanently-stuck frame via computed style (every checked instance resolved within ~500ms), because this automation's tab is structurally incapable of the real, foreground/visible-tab condition the bug depends on. The fix is grounded in (1) a directly-confirmed, real concurrency window that only exists on tab-switch-back, (2) a mechanistically sound explanation for why a race inside that window would not self-correct, and (3) the product owner's direct, repeated, real-device report -- not a first-hand tool-captured repro of the stuck frame itself.

#### Fixed -- `components/BallGIF.tsx`
- `suppressFirstFadeRef`'s flip back to `false` now happens on a `setTimeout(..., 320)` (300ms book-enter duration + margin) instead of the same-tick `useEffect`, but ONLY when this mount is a genuine repeat tab-switch-back (`skipEntranceAnimation` true / `suppressFirstFadeRef` started `true`) -- a real first-ever mount (`skipEntranceAnimation` false) is unaffected, since the ref already starts `false` in that case and the effect no-ops. Any scene remount that lands inside that 320ms window -- whether triggered by a ball tick or the periodic clip-swap interval -- now also renders without `.scene-fade-in`, removing the nested-animation race against the still-in-flight outer transition entirely. Once the window closes, the normal per-clip cross-fade resumes exactly as before.
- Known residual gap, documented in-code and here rather than silently left: the very first time a given match-page session ever switches INTO Live (as opposed to a repeat visit) has no suppression flag active at all, so it is theoretically still exposed to the same concurrency race. This was not fixed here because it was not the reported/tested scenario (which was always Live -> Score -> Live, i.e. always a repeat visit) -- flagged for a possible follow-up if the same symptom is ever reported on a true first switch into Live.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Direct computed-style tracing (both immediate and short-timer-based) on `ind-eng-test-2026-d3-live` continued to show correct suppression on the first render after a tab-switch-back and normal fade behavior thereafter -- no regression in the base v1.0.175 mechanism.
- Explicitly NOT claimed: a first-hand, tool-captured confirmation of the reported persistent stuck state either before or after this fix, since this automation environment's tab is permanently `document.hidden: true` and cannot reproduce the real foreground-tab condition the bug depends on. Final confirmation that this resolves the real-device symptom needs to come from the product owner on his own device, per his own explicit test protocol (switch Live -> Score -> Live, then watch for 10-15s without touching anything).

#### Scope
- `components/BallGIF.tsx` (suppression-window timing only -- the suppression logic's condition and the scene div's className computation are otherwise unchanged from v1.0.175), `package.json` + `README.md` + `BUILD-STATUS.md` (version bump). `components/MatchView.tsx`, `lib/useTabSwitcher.ts`, and the book-enter/exit CSS are unchanged.

## [1.0.175] 2026-08-10

### Fixed: Live tab flashed the washed-out/invisible field scene for <1s on every switch back into Live

#### Context
- v1.0.174 fixed the fresh-load case (field scene stuck invisible forever). This is a distinct, narrower follow-up: switching Live -> Score -> Live (or Digest/Info -> Live) reliably replayed the field scene's entrance fade from `opacity: 0` every single time, producing a brief (<1s) flash of the same washed-out look on every tab-switch-back into Live, not just on first load. Reported reproduced twice in a row on `ind-eng-test-2026-d3-live`, opacity `0` at `t=0ms` after the tab-switch click, recovering by `t≈850-900ms`, zero console errors.

#### Root cause -- confirmed via DOM-node-identity probing, not inferred
- `MatchView.tsx`'s tab-content wrapper uses `key={tab}`, which deliberately forces a full unmount/remount of the tab's subtree on every genuine tab switch so the `book-enter-forward`/`book-enter-backward` page-turn transition can replay (see the doc comment already on that div, and `lib/useTabSwitcher.ts`'s own doc comment describing this as the only correct place for that transition). This is correct for the page-turn transition, but it also means `BallGIF.tsx` (rendered only when `tab === "live"`) is fully unmounted and a brand-new instance mounts every time a user switches back into Live -- confirmed empirically by tagging the rendered root node with a random `data-probe-id` before a switch and verifying after switching back that the new node is a different object (`===` false) and the old tag is gone from the DOM.
- `BallGIF.tsx`'s own scene div (the `key={`${activeClip}-${ball.id}`}`-wrapped div, carrying `.scene-fade-in`, correctly fixed to fill-mode `both` in v1.0.174) has no way to distinguish "this is the match page's true first-ever mount" from "this is a remount caused by switching back into an already-visited Live tab" -- every mount, by design, starts its entrance fade at `opacity: 0`. On a genuine first load this is invisible to the user (nothing was on screen before); on a tab-switch-back it is a visible regression, since the user already saw this content seconds ago and switching tabs shouldn't restart its intro animation.

#### Fixed -- `components/MatchView.tsx` + `components/BallGIF.tsx`
- Added `hasShownLiveSceneRef` (a `useRef`, starting `false`) in `MatchView.tsx`, declared *above* the `key={tab}`-remounted subtree so it survives every tab switch (unlike anything declared inside that subtree, which is destroyed and recreated each time). A `useEffect` keyed on `tab` flips it permanently to `true` the first time `tab === "live"` is ever seen for this match-page visit.
- That value is threaded into `<BallGIF>` as a new `skipEntranceAnimation` prop. Inside `BallGIF.tsx`, a lazily-initialized `suppressFirstFadeRef = useRef(skipEntranceAnimation ?? false)` captures the prop only at that BallGIF instance's own true first render (per `useRef`'s lazy-init semantics), then an empty-deps `useEffect` flips it back to `false` right after mount so every subsequent render of the *same* instance (clip swaps, new balls) goes back to normal, un-suppressed behavior. The scene div's className is computed from this ref at render time: `.scene-fade-in` is included normally, and omitted only on the very first scene render of a remount that isn't the match page's true first mount.
- Net effect: the true first-ever mount of the Live tab (fresh page load) still plays the entrance fade exactly as before (unaffected regression-wise); every subsequent remount caused by switching back into Live starts the scene at its final, fully-opaque state with no animation class applied at all, so there is no opacity ramp for a flash to occur during. The normal, legitimate per-clip cross-fade between the bowler/overhead views (the actual intended use of `.scene-fade-in`, unrelated to tab switching) is untouched -- it resumes on the next natural clip swap a few seconds later, same as always.
- `lib/useTabSwitcher.ts` and the `book-enter-forward`/`book-enter-backward` CSS were not modified -- the root cause was isolated entirely to `BallGIF.tsx`'s inability to distinguish first-mount from remount, not to anything in the tab-switch mechanism itself.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Root cause confirmed live (not guessed) via the DOM-node-identity probe described above, before writing any fix.
- Post-deploy verification used direct DOM/React-fiber inspection (`getComputedStyle` plus reading the committed `skipEntranceAnimation` prop and the scene div's actual class list off the fiber tree) rather than screenshots or raw timers, because this automation environment throttles/pauses CSS animations and JS timers heavily while a tab is backgrounded (`document.hidden: true` throughout, a previously-documented caveat from the v1.0.174 verification pass) -- screenshots taken mid-test in this harness show stale, washed-out frames independent of the real DOM/style state, and naive `setTimeout`-based sampling loops were themselves throttled to ~1 sample/second or worse. Every switch-back cycle below was additionally checked for a *stable ball id* before/after (via the fiber tree) to rule out a live-simulation ball update coinciding with the switch and triggering a legitimate, intentional clip-swap cross-fade instead.
- **`ind-eng-test-2026-d3-live`:** fresh load unaffected (still plays the entrance fade once, as intended, matching v1.0.174). 3/3 Live -> Score -> Live cycles with the ball id confirmed unchanged across the switch: `scene-fade-in` class absent and `opacity: "1"` immediately after switching back into Live every time -- zero flash. An extended 9-second post-switch sample on one cycle showed `opacity: "1"` continuously through ~3s (the suppressed window), then the class correctly reappeared with a normal, brief, expected cross-fade dip at the next natural clip swap (~4-5s later) -- confirming the fix suppresses only the remount-triggered flash and leaves the legitimate per-clip animation completely intact.
- **`ind-aus-t20i-2026-m2-live`:** 3/3 Live -> Score -> Live cycles (ball id confirmed stable each time) clean -- no `scene-fade-in` class, `opacity: "1"` immediately. Live -> Digest -> Live and Live -> Info -> Live both clean by the same check. Zero console errors throughout. Fresh-load screenshot confirmed no regression in the ball-type/delivery overlay, trajectory dots, partnership row, batter-vs-bowler matchup selector, win-probability readout, or Moments cards.

#### Scope
- `components/MatchView.tsx`, `components/BallGIF.tsx`, `package.json` + `README.md` (version bump). `lib/useTabSwitcher.ts` and the book-enter/exit CSS are unchanged.

## [1.0.174] 2026-08-10

### Fixed: Live-tab field/ball-tracking visual stuck invisible (root cause: missing `forwards` fill-mode)

#### Context
- The field/pitch visualization panel on the match Live tab (`BallGIF.tsx`'s `.scene-fade-in`-wrapped scene, which swaps between a bowler-view and overhead-view SVG every clip cycle) was rendering as a barely-visible washed-out grid instead of its real graphic. Direct DOM inspection showed the wrapper's computed `opacity` stuck at `0` with `animation-name: scene-fade-in` and `animation-play-state: running` -- the entrance fade was never resolving to its finished, visible state.

#### Root cause -- `app/globals.css`
- `.scene-fade-in { animation: scene-fade-in 280ms ease-out backwards; }` used `backwards` as its only fill-mode. `backwards` governs the pre-start state (relevant only if there's an `animation-delay`, which this rule doesn't have); it does nothing to guarantee the post-finish state. Every other one-shot, opacity-affecting entrance animation already defined in this file (`.anim-pull-up`, `.book-enter-forward`, `.book-enter-backward`, `.slide-in-right`, `.chip-in`) already used `both` (backwards + forwards) for exactly this reason -- `.scene-fade-in` was the sole exception. Confirmed live via a direct A/B toggle of the rule on the deployed page (`getComputedStyle` sampled repeatedly over 24+ seconds): with `backwards` only, opacity never left `0`; switching the same rule to `both` (no other change) settled it to `1` within seconds and it stayed there. No JS, remount timing, or tab-switch-transition logic was involved -- this was purely a CSS fill-mode gap that left the element with no guaranteed path to its finished, visible state whenever the browser didn't get to progress the animation's intermediate frames in lockstep with real time (confirmed to occur on a backgrounded/non-foreground tab; this codebase has hit the same class of visibility-dependent animation-timing surprise before, see the `document.hidden` note in `lib/useCarouselIndex.ts`).

#### Fixed -- `app/globals.css`
- `.scene-fade-in`: `backwards` -> `both`. Field/pitch visual now always resolves to and holds `opacity: 1` once mounted, regardless of whether the browser painted every intermediate frame, and continues to do so correctly on every subsequent clip-swap remount (the `key={`${activeClip}-${ball.id}`}` swap in `BallGIF.tsx` was untouched -- it's a legitimate, working remount-per-clip-swap design, not the bug).
- `.anim-pull-up`: same `backwards` -> `both` fix applied for consistency. This class isn't referenced by any component today (grep-confirmed dead CSS), so it wasn't causing a live bug, but it carried the identical latent gap and was corrected so it can't be copy-pasted into a future filter-animation caller in its broken form.
- Audited every other keyframe-driven class in `app/globals.css` for the same pattern (one-shot, opacity-affecting, mount-triggered, missing `forwards`/`both`): `.modal-slide-up` and `.anim-leave-left`/`.anim-leave-right` are also unused dead CSS today (grep-confirmed) and don't share this exact gap (`anim-leave-*` already use `forwards`; `modal-slide-up` has no fill-mode but was never observed stuck since nothing mounts it). All `infinite`-iteration animations (`.live-dot`, `.excitement-glow`, `.skeleton`, wicket/boundary pulses) are unaffected by fill-mode by construction. No other live instance of this bug pattern found.

#### Verified
- `tsc --noEmit` / `npm run build` clean. `mockData.ts` untouched.
- Live A/B fill-mode toggle test on `ind-aus-t20i-2026-m2-live` (documented above) isolated the fix to this single CSS property change before it was applied to source, then confirmed again post-deploy on production.
- **`ind-aus-t20i-2026-m2-live` (T20, live):** fresh page load -- `opacity: 1` immediately (vs. a rock-solid `0` before the fix), full pitch/bowler/batter graphic and trajectory line visible, screenshot-confirmed. Polled every 500ms across 34 samples over ~34s spanning multiple clip-swap remounts: only 2 samples read `0` (both the instant of a legitimate clip-swap remount), the other 32 read `1` -- matches the intended "smooth fade-in for ball-GIF scene swaps" behavior instead of the old permanent-zero. Two tab-switch cycles (Live -> Digest -> Live, Live -> Info -> Live) confirmed via `getComputedStyle` (ground truth) that opacity reliably returns to `1` after each switch back. Zero console messages/errors on a fresh load.
- **`ind-eng-test-2026-d3-live` (Test, live):** fresh page load -- screenshot showed the full field graphic (pitch, stumps, dotted ball line) rendering correctly immediately. Polled every 200ms across 50 samples over 10s: 9 transient `0` readings, each exactly at a clip-swap remount instant and immediately followed by `1` on the next sample -- same intended fade-in-and-settle behavior, not stuck. Two tab-switch cycles (Live -> Score -> Live, Live -> Digest -> Live) sampled for 8s after the second switch-back: settles to and holds `1`, with only the same expected momentary per-clip-swap dip. Zero console errors.
- **Regression checklist, both matches:** ball-type/delivery card overlay (e.g. "Stock 135 KMH", "Outswinger 132 KMH") updates ball-by-ball as before; the trajectory dot/line on the field visual renders and updates correctly per ball; partnership row, batter-vs-bowler matchup selector, win-probability readout, and Moments cards are pixel-unchanged in layout/color/behavior; tab-switching (Live/Score/Digest/Info, plus Table on the Test match) works exactly as before with the book-enter/exit transitions untouched; onboarding and the v1.0.173 checklist catch-up animation share no code path with this fix and are unaffected (confirmed by the diff's scope: `app/globals.css` + version/doc files only, zero component changes).

#### Scope
- `app/globals.css`, `package.json` + `README.md` (version bump). No component, hook, or animation-timing logic touched -- `useTabSwitcher.ts`, the book-enter/exit transitions, `BallGIF.tsx`'s clip-swap interval, and the checklist catch-up animation are all unchanged.

## [1.0.193] 2026-08-12

### Fixed: match-page fixed header — over count added, LIVE/PRE status labels removed, LIVE tab restricted to in-progress matches

#### Context
- Three related gaps in the fixed header shared by every match page: the sticky score row showed no over count (Home's cards already do); the top-right status label showed "LIVE"/"PRE" text that the design no longer wants (FINAL should stay); and the LIVE tab (plus a non-functional Score tab) incorrectly appeared on upcoming matches, which have no live content behind either.

#### Fixed — `components/ScoreBar.tsx`
- Added `" (overs)"` (exact Home-card format) after each team's runs/wickets figure, inside the existing `lastInnA`/`lastInnB` conditional blocks — renders on LIVE and FINAL, never PRE, with zero new gating logic.
- Status-label div changed from always-rendered (cycling LIVE/PRE/FINAL text) to `{isPost && (<div>FINAL</div>)}` — LIVE and PRE now render nothing in that slot, no reserved space; FINAL is byte-for-byte unchanged in position/styling.
- Disclosed, not fixed (pre-existing, out of scope): this header has never rendered a compound multi-innings score ("199/10 & 28/2") — `lastInnA`/`lastInnB` only ever surface the single most recent innings per team.

#### Fixed — `components/MatchTabs.tsx` (rewritten) + `components/MatchView.tsx`
- Root cause: `MatchTabs.tsx` derived its own tab set independently (unaware of "upcoming"), separately from `MatchView.tsx`'s already-correct-for-live/finished `TABS_ORDER` — two different derivations of the same thing, neither taught about the PRE state.
- `MatchTabs.tsx` no longer derives anything; it renders exactly the ordered `tabs` array it's passed.
- `TABS_ORDER` gained an `isUpcoming` branch: PRE now shows only Info (+ Table where eligible) — no Live, no Score, no Digest. LIVE and FINAL tab sets unchanged.
- SessionStorage tab-restore staleness check generalized to "is the saved tab a member of `TABS_ORDER`" — covers the PRE case and falls back to that state's own default tab (Score/Info/Live) automatically.
- `showTable`/`tableComp.hasStandings` (Table-tab eligibility) untouched.

#### Verified
- `tsc --noEmit` / `npm run build` clean.
- Screenshots across live T20I/Test(multi-innings)/IPL/PSL, completed T20I/IPL, and upcoming T20I/IPL (no upcoming Test exists in the mocked schedule) confirmed all three parts; Table-eligibility cross-checked unchanged across all 3 states for both an eligible (IPL) and non-eligible (T20I/ODI bilateral) competition.
- Phone width: the automation tool's `resize_window` did not actually change the real viewport in this environment; verified instead at the code level that `.phone-frame`'s unconditional `max-width: 430px` plus zero responsive Tailwind classes in all three touched files mean every desktop screenshot already taken is representative of true phone-width rendering.
- Console check surfaced a pre-existing, unrelated hydration issue (React error #425) on LIVE/PRE pages, root-caused to `lib/mockData.ts`'s `Date.now()`-based `startTimeIso`/`timestampIso` fields (untouched by this commit) differing between server render and client hydration — disclosed, not fixed, as out of scope for this round.

#### Scope
- `components/ScoreBar.tsx`, `components/MatchTabs.tsx`, `components/MatchView.tsx`, `package.json` + `README.md` (version bump). `lib/useTabSwitcher.ts`, `lib/mockData.ts`, and Table-eligibility logic are unchanged.

## v1.0.194 — Platform-wide hydration error fix (Date.now()-based mock timestamps)

#### Fixed — new `lib/useClientNow.ts`
- Shared hook: `useState<number | null>(null)`, set via `useEffect` on mount (optional tick interval). Single "now" source for every render-time countdown/elapsed/today-tomorrow calculation platform-wide.
- Every call site changed to accept `now` as a parameter, gated on `useClientNow() !== null` — SSR/first hydration render a placeholder (usually nothing), real value swaps in within a fraction of a second of mount. `suppressHydrationWarning` never used.

#### Fixed — call sites
- `app/page.tsx` (Home countdown + "For You" featured card), `components/MatchCard.tsx` (`FutureMatchCard`, `SpotlightMatchCard`), `components/LiveCarousel.tsx` (fallback card), `components/InfoTab.tsx` (countdown badge), `components/PlayerProfileView.tsx` (age-from-DOB), `components/ScheduleRow.tsx` (gained `"use client"`), new `components/ScheduleDateLabel.tsx` leaf for the statically-prerendered `app/schedule/[competitionId]/page.tsx`, `app/schedule/page.tsx`'s `SeriesSummaryRow` (a second, separate call into `ScheduleRow`'s `fmtDate`, caught by `tsc` after the signature change).

#### Confirmed safe, untouched
- `components/ScoreBar.tsx`, `components/MatchTabs.tsx`, `components/MatchView.tsx` — zero `Date.now()`/`new Date(` of their own.
- `lib/teamSchedule.ts`, `lib/transformers.ts`, `components/onboarding/QuizStep.tsx`, dead code (`InsightFeed.tsx`/`InsightsPanel.tsx`), and several pure-formatting-only files.

#### Verified, with an honest gap
- `tsc --noEmit` / `npm run build` clean. Post-deploy: 0 errors on Home/Schedule/live match — but an upcoming match page still failed. See v1.0.195.

#### Scope
- 11 files changed, `lib/useClientNow.ts` + `components/ScheduleDateLabel.tsx` new, `package.json` version bump.

## v1.0.195 — Fixing the v1.0.194 gap: timezone, not Date.now() drift

#### Root cause
- `components/InfoTab.tsx`'s `dateStr`/`timeStr` used `toLocaleDateString`/`toLocaleTimeString` with no explicit `timeZone` — resolves to the runtime's local timezone. Server (Vercel, UTC) and a visitor's browser format the same instant differently. Confirmed live: server HTML showed "10:38 am local", client DOM showed "04:08 pm local", same match, same UTC instant.

#### Fixed — `components/InfoTab.tsx`
- Gated `dateStr`/`timeStr`/`utcStr` (whole Date & Time card body, as one unit) behind `clientNow !== null`, same pattern as the `countdown` value already used.

#### Fixed — `components/ScheduleRow.tsx`
- `fmtTime(match.startTimeIso)` (upcoming-row branch) was ungated while the neighboring `fmtDate()` call already was. Reachable via `app/schedule/series/[competitionId]/page.tsx` (SSG, embeds `ScheduleRow` directly). Gated the same way.

#### Audited, no fix needed
- `MatchCard.tsx`'s `SpotlightMatchCard` (never renders during initial hydration — `fullMemberLookup`-gated `useMemo`), `LiveCarousel.tsx`'s sheets (both `view !== "none"`-gated), `app/schedule/[competitionId]/page.tsx` + `.../[teamCode]/page.tsx` (plain Server Components, never hydrated — flagged as a separate, non-error staleness/timezone bug, out of scope), `lib/teamSchedule.ts`'s month/year-only label, `PlayerProfileView.tsx`'s DOB formatting, `app/page.tsx`'s `fmtTime`/`fmtShortDate` (fully gated at their one call site).

#### Verified
- Hard-reload clear→navigate→read on all 5 required page types plus the newly-identified series-schedule route: Home (0), Schedule (0), live match (0), completed match (0, no regression), upcoming match (0, down from 9), series-schedule page (0). Screenshots confirm correct timezone-converted local time and countdown, no blank/NaN/stuck state, appearing within a fraction of a second of mount.

#### Scope
- `components/InfoTab.tsx`, `components/ScheduleRow.tsx`, `package.json` version bump. No calculation logic changed.
