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

**Worked example — Schedule tab (v1.0.110, simplified v1.0.111, "All" re-grouped by series v1.0.112):**

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
