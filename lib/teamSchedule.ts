import type { Match, TeamCode } from "./types";
import { ALL_LIVE_MATCHES, ALL_PAST_MATCHES, ALL_UPCOMING_MATCHES } from "./mockData";

// ============================================================================
// Schedule adapter — v1.0.110, simplified v1.0.111
// ============================================================================
// This is the third worked example of the real-data-readiness pattern
// documented in full in ARCHITECTURE.md (see also lib/teamData.ts for the
// first, lib/teamAccentColor.ts for the second). Backs the Schedule tab:
// a plain tab row of "All" (every match app-wide) plus one tab per team
// the user has selected in Filter (see lib/followPrefs.ts's
// `myTeamCodes()`) -- tapping a team tab narrows to just that team's
// matches, tapping "All" shows everything. No merging across multiple
// followed teams happens anywhere in this module -- each tab is either
// "every match" or "one team's matches," never a combined set of several
// teams. (v1.0.110 originally also merged all of a user's followed teams
// into one combined "All" view; that was dropped in v1.0.111 as
// unnecessary complexity once "All" was redefined to mean literally every
// match app-wide instead -- see DECISIONS-LOG.md.)
//
// WHY THIS NEEDS ITS OWN ADAPTER, NOT JUST FILTERING ALL_LIVE_MATCHES/
// ALL_PAST_MATCHES/ALL_UPCOMING_MATCHES INLINE IN THE COMPONENT:
//   A live fixture feed is, almost by definition, a per-team schedule
//   endpoint ("give me team X's next N fixtures") -- that's how every real
//   cricket data provider (ESPN, Cricbuzz, SportRadar, a board's own API)
//   actually shapes this data, and "every match app-wide" is just as
//   naturally its own endpoint (a full fixture list) as any single team's
//   is. Reading straight out of three flat mock arrays works today because
//   they happen to hold every match in the dataset, but a real integration
//   won't have one giant array to filter in-memory. Writing every call
//   site against "loop over ALL_X and filter" would mean rewriting every
//   one of those call sites the day a real feed arrives. Writing them
//   against `getFullSchedule`/`getTeamSchedule` instead means the swap is
//   a one-file change here (per real-data-readiness point 3, async from
//   day one).
//
// THE MALFORMED-DATA PROBLEM THIS FILE GUARDS AGAINST:
//   `Match.startTimeIso`/`Match.venue`/`Match.status` are typed as
//   required fields, but (see lib/dataValidation.ts's `requireString` doc
//   comment, and lib/teamAccentColor.ts's identical gap for team colors)
//   that's compile-time-only. A real fixture feed can send a match with a
//   missing or malformed date, a null venue (fixture announced, ground not
//   yet confirmed), an unrecognized/future status string, or an explicit
//   "not yet confirmed" flag on an early-announced tour fixture. None of
//   that should crash this module or silently render garbage into a
//   schedule list a user is trying to actually plan around:
//     - No usable date -> excluded entirely. A schedule list is sorted and
//       grouped by date; a fixture with no date has nowhere correct to go,
//       and guessing (e.g. "today") would be actively misleading.
//     - No usable venue, or an explicit `fixtureConfirmed: false` -> kept,
//       but marked `confirmed: false` on its `ScheduleEntry`. This is
//       DELIBERATELY not the same as excluding it: a real, announced,
//       just-not-finalized-yet fixture is still information worth showing,
//       as long as it's visibly marked provisional/TBD rather than
//       presented with the same confidence as an official fixture. Mixing
//       the two together with no distinction is exactly the "garbage"
//       this guards against — not a crash, but a quieter kind of wrong.
//     - Unrecognized `status` -> excluded. This module only knows how to
//       place a match into "live" / "upcoming" / "past" (see
//       `bucketOfStatus` below); a status it doesn't recognize can't be
//       bucketed, and guessing a bucket would misrepresent whether the
//       match has started, matching this codebase's existing rule that
//       `match.status` (not a derived heuristic) is authoritative for
//       match state (see README.md's "Key data rules").
//
// ASYNC FROM DAY ONE: every exported function here returns a Promise, even
// though today's implementation resolves synchronously from in-memory mock
// arrays. `getFullSchedule` and `getTeamSchedule` share one internal
// implementation (`scheduleEntries`) that reads the same underlying data
// and applies the same validation either way -- the only difference is
// whether a team filter is applied, which is exactly the shape a real
// provider's "all fixtures" vs "team X's fixtures" endpoints would take.
//
// WINDOW: `DEFAULT_WINDOW_DAYS = 365`, centered on "now" (~6 months back,
// ~6 months forward) -- "roughly a year" per the product spec, not tied to
// this mock dataset's own (much narrower, ~±1 week) date range. A real
// fixture feed will have matches genuinely scheduled many months out;
// this window exists so the list doesn't grow unbounded as a real feed
// adds fixtures far into the future, not because today's mock data needs
// trimming.
//
// NO CLIENT-SIDE CACHE ACROSS CALLS: this module does not memoize results
// between invocations -- every call re-reads the underlying arrays fresh.
// That's deliberate. A real feed can update a match's `status` (upcoming
// -> live -> post-match) between two calls; caching with no regard for
// whether the underlying data changed would reintroduce exactly the class
// of bug already caught twice in this codebase (the Digest narrative-
// threshold cache, and the accent-color hook's object-identity dependency
// array) -- see DECISIONS-LOG.md for this feature's real test of that
// exact scenario. Any caching a consumer wants (e.g. a React hook wrapping
// this) must key off values that would actually change (the active tab's
// team code, or "all"; not an object reference) -- see `useScheduleTab` in
// app/schedule/page.tsx.
// ============================================================================

export type ScheduleBucket = "live" | "upcoming" | "past";

export interface ScheduleEntry {
  match: Match;
  bucket: ScheduleBucket;
  /** false = provisional/TBD fixture (explicit `fixtureConfirmed: false`,
   * or no usable venue yet) -- render this distinctly, never mixed in
   * indistinguishably from an official, confirmed fixture. */
  confirmed: boolean;
}

export interface ScheduleOptions {
  /** Total window size in days, centered on now. Defaults to ~1 year. */
  windowDays?: number;
}

const DEFAULT_WINDOW_DAYS = 365;

const LIVE_STATUSES = new Set(["live", "toss", "innings-break"]);
const UPCOMING_STATUSES = new Set(["upcoming", "pre-match"]);

function isObjectLike(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function safeTeamCode(team: unknown): string | undefined {
  return isObjectLike(team) && typeof team.code === "string" && team.code.length > 0
    ? team.code
    : undefined;
}

function bucketOfStatus(status: unknown): ScheduleBucket | undefined {
  if (typeof status !== "string") return undefined;
  if (LIVE_STATUSES.has(status)) return "live";
  if (UPCOMING_STATUSES.has(status)) return "upcoming";
  if (status === "post-match") return "past";
  return undefined; // unrecognized status -- can't place this anywhere
}

/**
 * Validates and normalizes one raw match into a `ScheduleEntry`, or
 * returns `undefined` if the match is unusable for a schedule list at all.
 * See the module comment above for the exclude-vs-mark-TBD split. Treats
 * its input as `unknown`-shaped on purpose, the same defensive posture
 * `sanitizeHexColor()` takes in lib/teamAccentColor.ts -- `Match`'s fields
 * are compile-time-only guarantees, not runtime ones.
 */
function toScheduleEntry(raw: unknown, now: number, windowMs: number): ScheduleEntry | undefined {
  if (!isObjectLike(raw)) return undefined;

  const bucket = bucketOfStatus(raw.status);
  if (!bucket) return undefined;

  const startTimeIso = raw.startTimeIso;
  const startMs = typeof startTimeIso === "string" ? Date.parse(startTimeIso) : NaN;
  if (!Number.isFinite(startMs)) return undefined; // missing/malformed date -- nothing to sort or group by

  if (startMs < now - windowMs / 2 || startMs > now + windowMs / 2) return undefined; // outside the window

  if (!safeTeamCode(raw.teamA) || !safeTeamCode(raw.teamB)) return undefined; // can't attribute this to a team

  if (typeof raw.id !== "string" || raw.id.length === 0) return undefined; // needed for stable list identity

  const venue = raw.venue;
  const hasUsableVenue = isObjectLike(venue) && typeof venue.name === "string" && venue.name.length > 0;

  // Non-boolean values (missing field, or a malformed type from a raw
  // feed) degrade to "confirmed" -- matching this mock dataset's implicit
  // default, the same "malformed treated the same as absent" rule
  // sanitizeHexColor() uses for team colors.
  const fixtureConfirmedRaw = raw.fixtureConfirmed;
  const fixtureConfirmed = typeof fixtureConfirmedRaw === "boolean" ? fixtureConfirmedRaw : true;

  return {
    match: raw as unknown as Match,
    bucket,
    confirmed: fixtureConfirmed && hasUsableVenue,
  };
}

async function rawAllMatches(): Promise<unknown[]> {
  return [...ALL_LIVE_MATCHES, ...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES];
}

/**
 * Shared implementation behind both exported functions below: validate
 * every match in the dataset, optionally narrow to one team, sort
 * chronologically. `filterTeamCode` of `undefined` means "no team filter
 * at all" -- every valid match in the window, which is exactly what the
 * "All" tab needs.
 */
async function scheduleEntries(
  filterTeamCode: TeamCode | undefined,
  opts?: ScheduleOptions
): Promise<ScheduleEntry[]> {
  const windowMs = (opts?.windowDays ?? DEFAULT_WINDOW_DAYS) * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const raw = await rawAllMatches();
  const entries: ScheduleEntry[] = [];
  for (const m of raw) {
    const entry = toScheduleEntry(m, now, windowMs);
    if (!entry) continue;
    if (
      filterTeamCode &&
      entry.match.teamA.code !== filterTeamCode &&
      entry.match.teamB.code !== filterTeamCode
    ) {
      continue;
    }
    entries.push(entry);
  }
  entries.sort((a, b) => Date.parse(a.match.startTimeIso) - Date.parse(b.match.startTimeIso));
  return entries;
}

/**
 * Every valid match app-wide within the window -- live, upcoming, and
 * past, sorted chronologically, no team filter. This is the "All" tab's
 * sanctioned data source, and the default view of Schedule for every user
 * regardless of what (if anything) they follow in Filter.
 *
 * Returns a Promise -- async from day one, matching lib/teamData.ts's
 * `getTeamMembershipStatus`/`getTeamRanking` and lib/teamAccentColor.ts's
 * `resolveMatchAccentColors` -- even though today it resolves
 * synchronously from mock data.
 */
export async function getFullSchedule(opts?: ScheduleOptions): Promise<ScheduleEntry[]> {
  return scheduleEntries(undefined, opts);
}

/**
 * One team's schedule -- live, upcoming, and past matches within the
 * window, sorted chronologically. Backs a single followed-team tab; each
 * tab calls this independently for its own team code, never merged with
 * any other team's results.
 *
 * `teamCode` should ultimately come from `myTeamCodes(getFollowPrefs())`
 * in lib/followPrefs.ts -- this function itself stays agnostic of *why* a
 * given code was chosen, the same separation of concerns as
 * `resolveMatchAccentColors` (colors) vs `qualifyMatch` (why a match is
 * relevant) in the rest of this codebase.
 */
export async function getTeamSchedule(
  teamCode: TeamCode,
  opts?: ScheduleOptions
): Promise<ScheduleEntry[]> {
  if (typeof teamCode !== "string" || teamCode.length === 0) return [];
  return scheduleEntries(teamCode, opts);
}

/**
 * Groups an already-fetched, already-sorted schedule into month buckets
 * for rendering (`"July 2026"`, etc.). Pure presentation grouping, not a
 * data-access boundary -- kept here only for reuse/cohesion with the type
 * it groups, not because it needs the async/interface treatment above (it
 * does no I/O and never will).
 */
export interface MonthGroup {
  label: string;
  entries: ScheduleEntry[];
}

export function groupScheduleByMonth(entries: ScheduleEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const entry of entries) {
    const d = new Date(entry.match.startTimeIso);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
      idx = groups.length;
      groups.push({ label, entries: [] });
      indexByKey.set(key, idx);
    }
    groups[idx].entries.push(entry);
  }
  return groups;
}
