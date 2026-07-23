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

**Worked example — batting-team accent color resolution (v1.0.104-108):**

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

**When starting a new real-data-readiness item** (win probability, delivery
data, player name parsing, or anything else), start from this pattern instead
of re-deciding the approach: split the model if needed, write the accessor
functions, make them async immediately, add the placeholder refresh hook. If
the field is a loosely-typed string (a color, a free-text status, anything
where "is it a string" and "is it a VALID one" are different questions),
add explicit format validation at the same boundary — don't rely on
type-check-only guarantees to catch a malformed-but-correctly-typed value.
