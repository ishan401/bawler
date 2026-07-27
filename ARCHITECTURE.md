# Architecture patterns

> Reusable engineering patterns, referenced by name from `DECISIONS-LOG.md` and
> `DESIGN-SYSTEM.md` entries. This file documents *how* we build a category of
> thing, not any single feature's decision history — see `DECISIONS-LOG.md` for
> that.

---

## Real-data-readiness: the interface-first pattern

**Applies to:** any dataset that is mock/static today but is expected to
eventually be replaced by a real external source — a live API, a third-party
provider, a scheduled sync job. Team rankings, win probability, ball-by-ball
deliveries, and player name parsing are all examples already identified as
future candidates for this treatment.

**The problem it solves:** if code reads a mock field directly
(`team.currentRanking`, `match.someRawField`, etc.) all over the app, then the
day real data arrives, every one of those call sites has to be found and
rewritten simultaneously — and any call site that's missed silently keeps
reading stale mock data forever. The bigger risk is usually subtler than a
missed call site, though: a mock dataset can accidentally make two genuinely
different concepts *look* interchangeable (see the worked example below),
and code written against that coincidence breaks the moment real data stops
cooperating with it.

**The pattern, in four parts:**

1. **Split the data model so unrelated concepts never share one field.**
   If a mock field is doing double duty for two things that are only
   superficially similar, give them separate, honestly-named fields now —
   don't wait for real data to expose the collision.
2. **Define a small set of sanctioned accessor functions.** All external
   code reads the data through these functions only — never through direct
   field access. This is the seam where the mock-to-real swap will happen
   later, so it needs to be the *only* place that touches the raw field.
3. **Every accessor function returns a Promise, starting today**, even
   though the mock implementation resolves synchronously. A real integration
   is a network call, which is unavoidably async — so call sites need to
   already be written against that shape. Making this true from day one
   means the eventual swap is a one-file implementation change, not a
   call-site migration.
4. **Add an explicitly no-op placeholder for whatever sync/refresh
   mechanism will eventually keep the data current** (a scheduled refetch, a
   webhook handler, whatever the real integration ends up needing). It does
   nothing today because mock data never goes stale — but the function
   signature and its call sites exist now, so that plumbing doesn't have to
   be invented at the same moment real data is wired in.

**Worked example — team rankings & ICC membership status (v1.0.102):**

`lib/mockData.ts` used to give every `Team` one `currentRanking?: number`
field, used for two unrelated things depending on team type: a franchise's
IPL points-table position (season-scoped, 1–10, resets every season) and a
nation's ICC rating (rolling, uncapped, cross-season). Code elsewhere used
"does `currentRanking` exist" as a stand-in for "is this a full ICC member,"
which only worked by coincidence — this mock dataset happened to leave the
field blank for every associate nation. Real ICC rankings don't cooperate:
they're published for 100+ members including most associates, so a real sync
would make that heuristic wrong immediately.

Fixed by applying all four steps:

- **Split:** `Team.rankings?: { test?: number; odi?: number; t20i?: number }`
  (nations, per-format) and `Team.leagueStanding?: number` (franchises,
  points-table position) replaced the one overloaded field. A new
  categorical `Team.membershipStatus?: "full" | "associate"` field, verified
  against ICC's real current Full Member list rather than assumed from
  memory, became the durable signal for membership tier — decoupled from any
  numeric ranking entirely.
- **Interface:** `lib/teamData.ts` exports `getTeamMembershipStatus(team)`
  and `getTeamRanking(team, format)` as the only sanctioned reads of those
  two fields. Every other file — including the `FlagOrRank` badge component
  in `components/MatchCard.tsx` — goes through these functions instead of
  touching `team.membershipStatus` / `team.rankings` directly.
- **Promises from day one:** both functions are `async` and return
  `Promise<...>` today, resolving synchronously from the in-memory mock
  object. `FlagOrRank`'s rank-badge fallback (`NationalRankBadge`) already
  consumes this as a promise, using the same hydration-safe
  `useState(undefined)` + `useEffect` pattern established for other
  server/client-divergent values elsewhere in this codebase: render nothing
  on the first pass (matching what the server renders), fill in the real
  value after mount.
- **No-op placeholder:** `refreshRankings()` in `lib/teamData.ts` does
  nothing today and is clearly commented as such — it exists so a future
  sync mechanism has a stable function to implement instead of a call site
  that has to be invented from scratch.

`leagueStanding` (franchise points-table position) deliberately did **not**
get the interface treatment — there's no external body whose data will
eventually replace a league's own standings; the mock data already *is* this
app's own computed data either way. Knowing when a field is real-data-bound
versus when it's already the source of truth is part of applying this
pattern correctly — not everything needs an adapter.

**Reused, not reinvented, twice since:** Spotlight's international-match
gate (v1.0.103, `lib/spotlight.ts`'s `buildFullMemberLookup()`) and the
Filter/Follow sheet's Nations-tab sort (v1.0.116, `components/
FollowSheet.tsx`'s `membershipRank()`) both need "is this nation a full
member," and both get it exclusively through `getTeamMembershipStatus()` —
neither hardcodes a list of full-member nations, and neither reads
`team.membershipStatus` directly. Same shape both times: resolve the async
adapter once upfront into a plain synchronous lookup (a `Map`/closure), then
sort or filter against that lookup rather than awaiting per-item inline —
because the consumer itself (`Array.filter`/`Array.sort`) has to stay
synchronous. This is the intended payoff of putting the interface in one
place: a second and third consumer needing the same fact got it for free,
and will keep working with zero changes once real ICC data replaces the
mock field.

**Worked example — batting-team accent color resolution (v1.0.104-109):**

`components/Scorecard.tsx`'s not-out box, sparkline, and team-selector pills
theme themselves to the batting team's own color instead of a fixed platform
accent. The resolution pipeline is a real fourth step this pattern's
"interface" and "async from day one" points needed to cover, on top of the
usual field-level concerns:

- **Interface:** `lib/teamAccentColor.ts` exports `resolveMatchAccentColors
  (teamA, teamB)` as the only sanctioned way to read this data. It runs the
  full pipeline internally (per-team hairline-stroke contrast check against
  the card background → secondary-color fallback → platform-cyan fallback →
  cross-team CIEDE2000 perceptual-collision check) and every real call site
  (`TeamToggle`, `TestInningsChips`, `InningsCard`, all in
  `components/Scorecard.tsx`) goes through it instead of reading
  `team.primaryColor` / `team.secondaryColor` directly. (Plenty of other,
  unrelated components — match-card left borders, `WinProbChart`, country
  flags, etc. — read `team.primaryColor` directly for their own simpler,
  pre-existing purposes; that's an accepted, separate design decision
  documented in `DESIGN-SYSTEM.md` §5, not part of this pipeline, and out of
  scope for this adapter.)
- **Promises from day one:** `resolveMatchAccentColors` is `async` and
  returns `Promise<Record<string, string>>`, resolving synchronously from
  mock `Team` objects today. Its three call sites consume it through a
  shared `useMatchAccentColors(teamA, teamB)` hook using the same
  hydration-safe `useState(placeholder)` + `useEffect` pattern as
  `NationalRankBadge` — cyan for both teams (the platform default) on the
  first pass, the real resolved colors after mount.
- **Replace, never mutate (v1.0.109):** `useMatchAccentColors`'s effect
  depends on `teamA.code`/`teamA.primaryColor`/`teamA.secondaryColor` and
  the same three fields for `teamB` — not on `teamA`/`teamB` object
  identity. That was deliberate: depending on the whole object would only
  catch a team being swapped for a brand-new object, not a team's colors
  actually changing, so it's the fields that determine the resolved color
  that belong in the dependency array, not a proxy for them. But this only
  closes half the gap. The other half is a contract this code cannot
  enforce on its own: **any future real data source must publish team
  color updates by replacing the `Team` object, never by mutating an
  existing one's `primaryColor`/`secondaryColor` in place.** React only
  re-renders in response to a state or props change; mutating a field on an
  object already sitting in props or state doesn't trigger anything, no
  matter what that object's fields are keyed on downstream. This is the
  same discipline React state generally requires of any mutable data it
  holds a reference to. Whoever wires up the real feed later needs to know
  this going in — it's easy to reach for `team.primaryColor = newColor`
  as a shortcut and have every color-consuming component on the page
  silently go stale with no error, no warning, and no test that would
  catch it short of a live visual check.
- **Malformed-input hardening:** this is the one place so far where the
  *shape* of the incoming data matters as much as its presence.
  `Team.primaryColor`/`secondaryColor` are typed as required `string`
  fields, but `lib/dataValidation.ts`'s `requireString` only confirms the
  value IS a non-empty string at the match-normalization boundary — it has
  no opinion on whether that string is a valid hex color, so a real
  provider sending `"blue"`, `"rgb(0,0,0)"`, a bare hex with no `#`, or
  `null`/`undefined` would reach this pipeline unvalidated. `sanitizeHexColor
  ()` in `lib/teamAccentColor.ts` normalizes and validates every color
  before it touches the contrast/Delta E math, treating anything that isn't
  a genuine 3- or 6-digit hex (case-insensitive, whitespace-tolerant) as
  absent — exactly the same fallback path as a team with no usable color at
  all. Without it, a missing/non-string color crashed outright rather than
  degrading; this is worth checking for on any future real-data adapter
  that accepts a loosely-typed external string, not just colors.
- **No-op placeholder:** none needed yet — there's no refresh concept for a
  team's brand color the way there is for a weekly-moving ranking number.
  If a future real integration needs one (a brand refresh, a kit change
  mid-season), add it the same way `refreshRankings()` was added, rather
  than inventing the call site later.

**Worked example — Schedule tab (v1.0.110, simplified v1.0.111, "All" re-grouped by series v1.0.112, "All" collapsed to summary rows v1.0.113):**

Schedule is a plain tab row: "All" (default, every match app-wide, in
ascending date order, grouped by month) plus one tab per team the user has
selected in Filter (nations and franchise teams both count — see
`lib/followPrefs.ts`'s `myTeamCodes()`). Tapping a team tab narrows the same
list to just that team; tapping "All" shows everything again. v1.0.110
originally also merged every followed team into one combined view behind
"All," with a separate all-competitions-picker as the zero-follows default —
that split was real, unnecessary complexity once "All" was redefined to mean
literally every match app-wide instead of "every match my followed teams
happen to be in": one view, one list style, a tab row that only changes
which team (if any) filters it. The simplification is as much a part of
this pattern as the original build — real-data-readiness doesn't mean every
feature accretes complexity forever; when a requirement changes in a way
that makes an earlier adapter's shape over-general, simplify the adapter
too, not just the UI on top of it.

- **Interface:** `lib/teamSchedule.ts` exports `getFullSchedule()` (every
  valid match app-wide within the window — the "All" tab's data source) and
  `getTeamSchedule(teamCode)` (one team's matches — a followed-team tab's
  data source). Both share one internal implementation
  (`scheduleEntries(filterTeamCode?, opts?)`) that validates every match the
  same way either way; the only difference is whether a team filter is
  applied — exactly the shape a real provider's "all fixtures" vs "team X's
  fixtures" endpoints would take. `app/schedule/page.tsx` reads through
  these two functions only, never `ALL_LIVE_MATCHES`/`ALL_PAST_MATCHES`/
  `ALL_UPCOMING_MATCHES` directly (grep-confirmed). v1.0.110's
  `getMergedTeamSchedule(teamCodes)` — composing N per-team calls and
  deduping — is gone: nothing merges multiple teams into one view anymore,
  so there was nothing left for it to do.
- **Promises from day one:** both functions return `Promise<ScheduleEntry[]>`,
  resolving synchronously from mock arrays today. Consumed through a
  `useScheduleTab(tab)` hook using the same hydration-safe
  `useState(placeholder)` + `useEffect` pattern as `NationalRankBadge` and
  `useMatchAccentColors` — an empty list on the first pass, the real
  schedule after mount.
- **Values, not references — simpler this time, not just fixed this time:**
  v1.0.110's equivalent hook had to depend on a derived `key` string because
  its input was an array of team codes (a new reference every render
  regardless of content). v1.0.111's `useScheduleTab` depends on `tab`
  directly — "all" or a single team code, a plain string primitive — so
  there's no array-identity trap left to guard against at all. Worth
  noting as its own lesson: simplifying the underlying requirement
  (one-team-or-everything instead of an arbitrary merged set) didn't just
  remove UI complexity, it removed an entire class of bug risk from the
  data layer along with it. Verified with a real test (temporarily
  exporting the hook, `react-test-renderer`): switching the active tab
  through "all" → a team → a different team → back to "all" correctly
  recomputes and reflects each tab's own matches every time.
- **Malformed-input hardening:** unchanged from v1.0.110 — `toScheduleEntry()`
  in `lib/teamSchedule.ts` is still the one place a raw match gets resolved,
  with the same deliberate two-way split: no usable date or unrecognized
  status → excluded (nothing correct to sort/group/bucket it by); no usable
  venue, or an explicit `Match.fixtureConfirmed: false` → kept, but flagged
  `confirmed: false` and rendered with an "Unconfirmed"/TBD treatment.
  Re-tested with the same 20 real, deliberately malformed inputs after the
  rewrite (`npx tsx`, not assumed-still-correct) — all 20 still pass.
- **No client-side caching across calls:** `getFullSchedule`/
  `getTeamSchedule` re-read the underlying arrays fresh on every call.
  Re-verified after the rewrite: mutated a mock match's `status` from
  `"upcoming"` to `"live"` in place between two calls to each function and
  confirmed the second call's `bucket` reflects the change on both entry
  points — the same class of staleness bug as the Digest narrative-
  threshold cache and the pre-v1.0.109 accent-color hook.
- **No color-coding by match result:** a v1.0.110 detail worth naming
  explicitly since it was deliberately removed, not merely never added —
  the narrowed per-team view originally rendered a colored left-border
  strip (green for a win, red for a loss) and colored "Won"/"Lost" text.
  Dropped in v1.0.111 so a match card looks identical whichever tab is
  active — the "Won"/"Lost" wording itself stays (still computed from the
  active tab's team perspective), just with no color applied anywhere on
  the card. Not a real-data-readiness concern on its own, but recorded here
  because it's the kind of "simplify, don't just add" decision this pattern
  should keep making room for.
- **No-op placeholder:** none needed yet — there's no refresh/sync concept
  for mock data that never goes stale on its own. A real integration adds
  one the same way `refreshRankings()` was, rather than inventing the call
  site later.
- **"All" re-grouped by series/tournament, not a flat list (v1.0.112):** the
  "All" tab groups matches under their series/tournament heading
  (`Match.competition`) instead of one flat chronological list, and only
  shows a series that's ongoing or upcoming — a series where every match
  has already been played drops out of "All" entirely. A qualifying series
  shows ALL of its matches, past included, so a tournament you're following
  mid-run reads as one continuous story instead of losing its results the
  moment they're final. Per-team tabs are explicitly UNCHANGED by this —
  still the flat, month-grouped, past-included view `getTeamSchedule`
  already provided; deferring any series-grouping decision there was a
  deliberate scope boundary, not an oversight.
  - **Interface:** `getSeriesGroupedSchedule()`, added to the same
    `lib/teamSchedule.ts` file rather than a new adapter file — it's a
    second SHAPE of the same underlying `ScheduleEntry` data, reading
    through the exact same `scheduleEntries`/`toScheduleEntry` validation
    `getFullSchedule` already used, not a second data source. Splitting
    that validation across two files would risk the flat and grouped views
    silently disagreeing about which matches are even valid.
  - **Malformed series metadata:** `Match.competition` is typed as a
    required object, but — the same compile-time-only guarantee as every
    other field this pattern treats defensively — a real feed can send a
    match with a null/missing `competition`, or one missing `id`/`name`.
    `safeCompetition()` guards this: a match that fails the check is
    excluded from series grouping entirely (there's no correct group for
    it, and guessing would risk silently merging unrelated series under a
    placeholder name). This does not remove the match from the app — it
    can still surface on a per-team tab, which has no dependency on
    `competition` at all. Tested with 10 real broken inputs (`npx tsx`):
    null competition, `{}`, empty-string `id`/`name`, wrong-typed `id`/
    `name`, a bare string instead of an object, and the field missing
    entirely — all 10 excluded cleanly, no crash.
  - **Completion and ordering computed from an unbounded set, display
    stays windowed:** whether a series has any match left to play, and its
    TRUE earliest match date (for ordering), are both computed from every
    valid match for that competition in the dataset — not just the ones
    inside the normal ~1-year display window. This matters for two
    reasons: a series whose first match is barely inside the window but
    has a still-upcoming match just outside it must not be misjudged
    "fully concluded"; and a series's position among others must not shift
    day to day as its own matches complete, only as measured against its
    real first-ever match date. What's actually rendered per qualifying
    series is still the normal windowed set — the unbounded lookup decides
    qualification and ordering only, never what's shown. Verified with a
    real test: three synthetic series inserted out of order came back
    sorted ascending by true start date; a synthetic series' position was
    confirmed unchanged after one of its non-earliest matches completed
    (13 pass, interface-level, alongside the malformed-input cases above).
  - **Recomputation:** no caching, same as the rest of this file — a
    synthetic series was confirmed to drop from `getSeriesGroupedSchedule()`
    the moment ALL of its matches complete, and to reappear (at the same
    ordering position) once a match becomes upcoming again, both via direct
    repeated calls and via `useScheduleTab` (temporarily exported,
    `react-test-renderer`) switching away from and back to "All" — 5/5 pass,
    confirming the hook re-fetches fresh rather than reusing its mount-time
    result.
  - **No-op placeholder:** none needed yet, same reasoning as above.
- **"All" collapsed to one summary row per series, full match list moved to
  a dedicated page (v1.0.113):** v1.0.112 rendered every one of a
  qualifying series' matches inline under its heading — more detail than
  the "All" tab needed. v1.0.113 collapses each qualifying series to a
  single row (name, a LIVE badge if anything in it is live right now, the
  date of its next live/upcoming match, and a one-line "Last: ..." recap
  of its most recently completed match) and moves the full match list to a
  new page, `/schedule/series/[competitionId]`. The inclusion rule
  (ongoing/upcoming only) and ordering (true start date ascending, stable)
  from v1.0.112 are UNCHANGED — this only changes presentation, not which
  series qualify or in what order.
  - **Interface, same file, no new data source:** `summarizeSeriesGroup()`
    and `formatLastResult()` are pure presentation derivations over an
    already-fetched `SeriesGroup` — like `groupScheduleByMonth`, not a
    data-access boundary, so they don't need the async/interface treatment
    on their own. `getMatchesForCompetition(competitionId)` is the
    dedicated page's sanctioned data source — every match for ONE series,
    past included, no inclusion-rule filtering (a fully-concluded series
    still gets a complete page; that rule is specific to which series earn
    an "All" row, not to what a series' own page shows once you're on it).
    `getAllCompetitionIds()` backs the new page's `generateStaticParams`
    through the same `safeCompetition()` validation, rather than the page
    re-deriving that logic itself.
  - **Fail-safe on the two edge cases the product spec called out
    explicitly:** a series with no completed match yet → `lastCompletedEntry`
    is `undefined`, the row simply omits the "Last:" line rather than
    rendering something broken. A series that qualified (has a live/
    upcoming match somewhere in the UNBOUNDED dataset) but has none inside
    the windowed `entries` actually shown → `nextEntry` is `undefined`, the
    row omits the date rather than showing a blank or garbage one. Verified
    with real constructed `SeriesGroup` objects for both cases (`npx tsx`).
  - **Malformed-result hardening:** `hasUsableResult()` (private to
    `lib/teamSchedule.ts`) now requires a past match's `result.winner` to
    be `"draw"`/`"tie"`/`"no-result"` OR to genuinely match one of that
    match's own two teams before it's eligible to become a series'
    `lastCompletedEntry` — a `winner` string that matches neither (stale/
    malformed data) is treated the same as "no usable result," the same
    "can't attribute this" posture `safeTeamCode` already takes elsewhere
    in this file. `formatLastResult()` keeps its own independent fallback
    for this same case regardless, as a second line of defense. Tested: a
    series whose most-recent past match has an unusable winner correctly
    falls back to an earlier match that has a usable one, rather than
    showing nothing or crashing (`npx tsx`).
  - **Recap text accuracy:** `formatLastResult()` tested against a real win
    ("KKR won by 7 wickets vs RR," matching the product spec's own
    example, plus the same case with `teamA`/`teamB` swapped to confirm the
    winner is identified by matching `result.winner` to a team code, not by
    positional assumption), a draw, a tie, a no-result, a missing `result`
    object entirely (empty string, not a crash), and a malformed winner
    matching neither team (falls back to naming just the winner, no
    fabricated opponent) — 6/6 pass.
  - **Recomputation:** no caching, same as every other function in this
    file. A synthetic single-match series was walked through upcoming →
    live → post-match (with a result) → upcoming again, calling
    `getSeriesGroupedSchedule()`/`summarizeSeriesGroup()` and
    `getMatchesForCompetition()` fresh after each in-place mutation:
    `isLive` flipped immediately on the live transition, the series
    correctly dropped from "All" the moment its only match completed,
    `getMatchesForCompetition()` kept showing it regardless (no inclusion-
    rule filtering there), and the series correctly reappeared once
    upcoming again — 8/8 pass.
  - **Dedicated page reuses the existing card format, not a new one:**
    `ScheduleRow` (plus its `TeamChip`/`fmtDate`/`fmtTime` helpers) was
    extracted from app/schedule/page.tsx into `components/ScheduleRow.tsx`
    specifically so the new page could render the exact same match card
    already used everywhere else in Schedule, rather than a second,
    subtly-different card style for the same `ScheduleEntry` shape.
  - **No-op placeholder:** none needed yet, same reasoning as above.

**Worked example — player recent form + achievements (v1.0.117, data
source rebuilt v1.0.118):**

The player profile page (`/player/[id]`) has two format-scoped sections
below its existing stats grid: a recent-form graph (one point per
innings/spell across the player's last 10 for whichever format tab is
selected) and an achievements callout (one line per qualifying recent
award, e.g. Man of the Match count, Man of the Series). Explicitly out of
scope for both, by product decision: anything about a player's upcoming
matches — playing XI isn't confirmed until close to a match, so surfacing
it with any confidence would be misleading.

- **v1.0.117's mistake, corrected in v1.0.118:** the original build added a
  hand-typed `RecentFormWindow` field directly on `PlayerProfile`
  (`testRecentForm`/`odiRecentForm`/`t20iRecentForm`/`franchiseRecentForm`,
  each a manually-authored `values: number[]`) instead of deriving from the
  match records this app already has. This passed every test written
  against it at the time because the tests only exercised the field itself
  — they never checked whether the field's numbers had any relationship to
  a player's actual recorded matches. They didn't: Crawley's mock
  `testRecentForm.values` was 6 hand-typed numbers while the same dataset
  separately held 4+ real per-match `battingCard` entries for him that the
  feature never read. The lesson generalized into DECISIONS-LOG.md v1.0.118:
  a field name that describes real data is not the same guarantee as a
  field that's actually *derived* from real data — the type system and a
  passing test suite can't tell the two apart, only tracing the field back
  to its origin can.
- **Data source, v1.0.118:** `RecentFormWindow` and all four fields were
  deleted from `lib/types.ts`/`lib/mockData.ts` entirely (grep-confirmed
  zero live references — the only hits left are the historical explanation
  comments in `lib/types.ts` and `lib/playerForm.ts`). `lib/playerForm.ts`
  now derives both the graph and the achievements callout directly from
  `Match.innings[].battingCard`/`bowlingCard` and `Match.result.manOfMatch`/
  `manOfTournament` — the exact same records `Scorecard.tsx` and the career
  stats grids already read. No per-player recent-form authoring exists
  anywhere in the mock data anymore; a player either has real match
  history or shows nothing.
- **Interface, unchanged in shape:** `lib/playerForm.ts` still exports
  `getRecentForm(player, format)` and `getPlayerAchievements(player,
  format)` as the only sanctioned reads, returning the same public shapes
  (`RecentFormSeries { points, metric }`, `AchievementLine { text }`) as
  before — only the internal derivation changed. `components/
  RecentFormGraph.tsx` and `components/PlayerAchievements.tsx` needed zero
  code changes for this rebuild, which is the direct payoff of routing
  everything through a sanctioned interface in the first place: the
  data-source swap was entirely contained inside the adapter.
- **"Settled" means a usable result, never the `status` label:** the new
  adapter gathers innings/spell entries from `ALL_PAST_MATCHES` **and**
  `ALL_LIVE_MATCHES`, filtered by a private `hasUsableResult(match)` check
  (real, attributable `result.winner` — `"draw"`/`"tie"`/`"no-result"` or
  one of the match's own two team codes), and never filters on
  `match.status`. This matters concretely: `FEATURED_MATCH` is deliberately
  kept at `status: "live"` so it stays in the homepage's live carousel,
  despite being a fully completed match with real batting/bowling cards
  and real award credits (Andre Russell's Man of the Match, Virat Kohli's
  Man of the Series). Filtering on `status` would have silently dropped
  that match's real data for every player in it.
- **Deterministic chronological ordering, not the source array's own
  sort:** `ALL_PAST_MATCHES` is sorted newest-first for a different reason
  (recent-first schedule lists), so the adapter never relies on it for
  order. Every extracted entry carries its own `startTimeIso`, and the
  full set is explicitly sorted ascending by `(startTimeIso, match.id as
  tiebreak, innings number)` before any `slice(-10)` — verified this
  matters with a constructed case where a single Test match contributes
  two innings to the same player: grouping-by-match-then-reversing gives
  the wrong order, sorting every entry independently by its own timestamp
  doesn't.
- **Two different "last 10" populations, matching the product's own
  wording:** the graph plots the last 10 innings/spells (per-entry — one
  Test match can contribute 2); the achievements callout counts the last
  10 *distinct matches* (deduped by `match.id`). Building both from one
  undifferentiated list would silently conflate them.
- **Opponent derivation uses the match's own recorded team, not the
  player's current profile field:** an achievement line's opponent name
  comes from the specific match's own `battingTeam`/`bowlingTeam` on the
  entry that qualified it, not `player.teamCode`/`franchiseCode` — a
  profile field says who a player plays for today, not who they played
  for in a specific historical match.
- **Name matching handles real inconsistent data:** the same dataset
  credits the same player's award two different ways across different
  matches ("Virat Kohli" in one `manOfTournament`, "V Kohli" in another).
  `namesMatch()` checks both `player.name` and `player.shortName`, trimmed
  and case-insensitive, rather than assuming the mock data is internally
  consistent about which form it uses.
- **Reused, not reimplemented, the existing accent-color pipeline and
  player-identity resolution:** unchanged from v1.0.117 — `resolveTeamAccentColor(team)` for
  theming, `resolvePlayerSlug()` from `lib/mockData.ts` for matching a raw
  match-record `playerId` (which appears in several inconsistent real
  forms, e.g. `"J Bumrah"`/`"jbumrah"`/`"zcrwly"`) back to a canonical
  player id, rather than reinventing name matching inside the new adapter.
- **Promises from day one, testable hook extracted for real remount
  testing:** both functions still return Promises, consumed via a
  hydration-safe `useState(null)` + `useEffect` pattern. For v1.0.118 this
  logic was pulled out of `PlayerProfileView.tsx`'s component body into a
  standalone, exported `usePlayerFormState(player, format)` hook with zero
  dependency on `next/navigation`'s `useRouter` — the same "temporarily
  export a private hook for testing" precedent as `useScheduleTab`
  (`app/schedule/page.tsx`) and `useMatchAccentColors` (`components/
  Scorecard.tsx`) — so it can be mounted, remounted, and driven through
  format-tab switches directly with `react-test-renderer` without mocking
  the app router.
- **No-op placeholder:** `refreshPlayerForm()` in `lib/playerForm.ts`,
  unchanged.
- **Malformed-data hardening, tested with real broken inputs (`npx tsx`,
  8 cases):** a numeric `playerId` where a string was expected; a match
  with no `innings` array at all; a `battingCard` that's an object instead
  of an array; individually malformed entries (negative or `NaN` runs)
  inside an otherwise-valid card; a match with no `result` object; a
  match with a `result.winner` that names neither team (garbage result,
  correctly excluded by `hasUsableResult`); a real award name with
  inconsistent case/whitespace (still matched, still credited); and a
  match with a `null` `startTimeIso` (excluded, not crashed). All eight
  handled without throwing, and every case excluded or included exactly as
  it should have.
- **Recomputation, tested with a real before/after mutation, not a
  description:** direct adapter calls before and after (1) appending a
  brand-new completed match with a fresh Man of the Match credit — new
  runs value and new achievement line both appeared on the very next call
  — and (2) flipping that same match's `result` to remove the MOM credit
  — the achievement line disappeared while the runs entry itself stayed,
  confirming the two are read independently rather than one stale
  snapshot covering both. At the hook level (`react-test-renderer`,
  temporarily exported `usePlayerFormState`): mounted on Root's Test tab
  (real data), switched to ODI (no real Root ODI history — confirmed the
  Test tab's values did NOT leak through as stale state), switched back to
  Test (confirmed it reloaded the real data, not an empty carryover from
  ODI), then unmounted, mutated `ALL_PAST_MATCHES` with a new match, and
  mounted fresh — the new mount reflected the mutation immediately, not a
  cached snapshot from before the unmount.
- **Real-data coverage, post-rebuild:** 15 of the 21 seeded players now
  show at least one real recent-form point in some format (up from 2
  before this rebuild, both of which were reading the disconnected
  hand-typed field rather than real records). The other 6 have zero
  matches with usable per-innings data in the mock dataset for any format
  — correctly showing nothing, because there's genuinely nothing to show,
  not because a side-field was never populated.

- **Axis styling, v1.0.119 -- supersedes the original sparkline call:**
  v1.0.117 deliberately matched `Scorecard.tsx`'s `BatterSparkline` --
  axis-less, dot-and-line only -- because it was designed to sit in a
  dense scorecard row. That reasoning stopped applying once the graph
  moved to its own dedicated section of the player page with room to
  spare, so v1.0.119 replaced it with a properly labeled small line
  chart: a Y-axis with value labels and ~4-5 light horizontal gridlines,
  and a minimal X-axis showing only the two endpoints ("N ago" / "Most
  recent", where N is the same point count already stated in the header
  above the chart -- no per-point labels, no dates, no opponent names).
  `BatterSparkline` itself is untouched; this was never a shared
  component.
- **Y-axis scale computed per player and per metric, never fixed:** two
  new pure functions in `RecentFormGraph.tsx`, exported directly (not a
  "temporarily exported for testing" case -- these are genuinely
  reusable utilities, not React state): `computeYAxisTop(maxValue)` and
  `buildYAxisTicks(top)`. The scale always starts at 0; the top is the
  window's own highest plotted value, rounded up to a clean ceiling
  (5/10/25/50/100, chosen by the value's own magnitude tier -- `<=10` uses
  a unit of 5, `<=50` uses 10, `<=100` uses 25, `<=250` uses 50, else
  100). This is the direct fix for the exact problem a fixed scale would
  create: a bowler's wickets-per-innings has a hard real ceiling of 10,
  while a batter's runs can run into the hundreds -- sharing one scale
  would flatten every bowler's graph to a sliver near zero, or crush a
  batter's real variation into a few pixels. Nothing here reads
  `metric` to pick a format-specific constant; the same function handles
  both, driven only by that specific player's own plotted values.
- **Zero is real data, not missing data:** `computeYAxisTop(0)` returns 4
  rather than 0 -- an unbroken run of ducks or wicketless spells is a
  genuine, valid recent-form window, and a 0-to-0 scale would collapse
  every gridline onto the same line. Non-finite/negative inputs (`NaN`,
  `Infinity`, a negative value that should never occur but isn't worth
  crashing over) fall back to the same zero-case path rather than
  producing a broken or inverted axis.
- **Tick de-duplication is a real guard, not just a comment:**
  `buildYAxisTicks` rounds each of the 4-5 evenly spaced tick values to
  the nearest whole number for display (runs/wickets are always
  integers) and drops any tick whose rounded label collides with one
  already placed, so two ticks can never render the same number stacked
  on each other. In practice this never fires given the clean tops
  `computeYAxisTop` produces (verified directly by testing every tier
  boundary), but the guard is exercised by the edge-case tests below, not
  left as an untested assumption.
- **Single-point rendering unchanged in spirit, upgraded in practice:**
  a player with exactly one recorded innings/spell still renders one dot
  -- same as v1.0.117 -- but now against the full labeled axis rather
  than a bare, context-less dot, and with a single centered "Most
  recent" X-axis label rather than a contradictory "1 ago" / "Most
  recent" pair (there is no second point to be "ago" relative to).
- **Real edge-case tests, not a description of expected behavior**
  (`npx tsx`, 44/44 pass): highest value in the window is 0 (top=4, no
  duplicate ticks); exactly one data point (scale still derives correctly
  from that single value); a value that already sits exactly on a round
  number within its own tier's unit (10 -> top 10, the real per-innings
  wicket ceiling; 20 -> top 20; 50 -> top 50; 100 -> top 100; 250 -> top
  250 -- each tier boundary checked on its own unit, not assumed clean
  across tiers); the largest realistic values (142, the real dataset's
  actual highest single-innings score; 200; 267; 400 -- confirming large
  scores round to a clean ceiling instead of an ugly or misleading one);
  and a direct side-by-side confirming a bowler's scale (max 3 wickets ->
  top 5) and a batter's scale (max 142 runs -> top 150) are genuinely
  different, not a shared fixed range.

**When starting a new real-data-readiness item** (win probability, delivery
data, player name parsing, or anything else), start from this pattern instead
of re-deciding the approach: split the model if needed, write the accessor
functions, make them async immediately, add the placeholder refresh hook. If
the field is a loosely-typed string (a color, a free-text status, anything
where "is it a string" and "is it a VALID one" are different questions),
add explicit format validation at the same boundary — don't rely on
type-check-only guarantees to catch a malformed-but-correctly-typed value.
And if any consumer hook's `useEffect` depends on a mutable object read
through one of these interfaces, depend on the specific fields that
determine the result (like `useMatchAccentColors` does as of v1.0.109), not
on the object's identity — object identity only tells you a value was
*replaced*, not that it *changed*. Pair that with an explicit "replace,
never mutate" note for whoever wires up the real feed, the same way v1.0.109
did for team colors: the dependency-array fix and the data-source contract
are two separate halves of the same gap, and only one of them is something
code can actually enforce.
