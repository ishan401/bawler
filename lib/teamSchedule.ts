import type { Competition, Match, TeamCode } from "./types";
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

// ============================================================================
// Series/tournament grouping for the "All" tab -- v1.0.112 (see DECISIONS-LOG.md)
// ============================================================================
// The "All" tab groups matches by series/tournament (`Match.competition`)
// instead of a flat chronological list, and only shows a series that is
// ongoing or upcoming -- a series where every match has already been
// played drops out of "All" entirely. Per-team tabs are NOT part of this
// change; `getTeamSchedule` above and its flat, month-grouped, past-
// included rendering in app/schedule/page.tsx are untouched.
//
// WHY THIS BELONGS IN THIS FILE, NOT A SEPARATE ADAPTER: this is a second
// SHAPE of the same underlying schedule data (`ScheduleEntry`), not a
// second data source -- it reads through the exact same `scheduleEntries`
// validation this file already does for `getFullSchedule`/
// `getTeamSchedule`, so a match with a missing date, unrecognized status,
// or non-boolean `fixtureConfirmed` is excluded/marked-TBD identically
// either way. Splitting that validation across two files would risk the
// two "All" views (flat vs. grouped) silently disagreeing about which
// matches are even valid.
//
// MALFORMED SERIES METADATA: `Match.competition` is typed as a required
// `Competition` object, but -- same compile-time-only guarantee as every
// other field this codebase treats defensively (see `toScheduleEntry`
// above, `sanitizeHexColor()` in lib/teamAccentColor.ts) -- a real feed
// can send a match with a null/missing competition, or one missing `id`/
// `name`. `safeCompetition()` below guards this: a match that fails the
// check is excluded from series grouping entirely (it simply never joins
// a group -- there's no correct group for it, and guessing would risk
// silently merging unrelated series under a placeholder name). This does
// NOT remove the match from the app -- it can still surface on a
// per-team tab via `getTeamSchedule`, which has no dependency on
// `competition` at all.
//
// "FULLY CONCLUDED" AND STABLE ORDERING, COMPUTED FROM AN UNBOUNDED SET:
// whether a series has any match left to play, and a series's true
// earliest match date (used to order the groups), are both computed from
// EVERY valid match for that competition in the dataset -- not just the
// ones inside the ~1-year display window `getFullSchedule` normally
// applies. Two reasons:
//   - Completion: a series with its very first match barely inside the
//     display window but a still-upcoming match just outside it must not
//     be misjudged "fully concluded" just because the window cut off the
//     match that would have proven otherwise.
//   - Stable ordering: the product requirement is that a series's
//     position among other series doesn't shift day to day as its own
//     matches complete -- only its TRUE first-ever match date should
//     anchor its position, not whichever of its matches currently happens
//     to be earliest-remaining inside the display window.
// `UNBOUNDED_WINDOW_DAYS` (100 years) stands in for "no window" without
// the NaN/Infinity edge cases a literal `Infinity` window would risk in
// `scheduleEntries`'s date-range arithmetic. What's actually RENDERED per
// qualifying series is still the normal ~1-year display window (or
// `opts.windowDays` if the caller overrides it) -- unbounded lookups are
// used only to decide qualification and ordering, never to decide what a
// user sees on screen.
//
// RECOMPUTATION: like `getFullSchedule`/`getTeamSchedule`, this does no
// caching -- every call re-derives groups fresh from the current match
// data. As a series's last remaining live/upcoming match flips to
// "post-match", the very next call to `getSeriesGroupedSchedule()` drops
// that series from the result; as a new match is added to a brand-new
// competition, the next call picks it up and places it by true start
// date. app/schedule/page.tsx's `useScheduleTab` re-fetches on every
// switch back to the "All" tab, the same recompute trigger already
// established for the flat view.
// ============================================================================

const UNBOUNDED_WINDOW_DAYS = 36500; // ~100 years -- stands in for "no window," see comment above

/**
 * Validates a match's `competition` field defensively (same posture as
 * `safeTeamCode`/`toScheduleEntry` above) and returns the full
 * `Competition` object if usable, or `undefined` if it's missing, not an
 * object, or missing the `id`/`name` fields a series group needs.
 */
function safeCompetition(match: Match): Competition | undefined {
  const c: unknown = (match as unknown as Record<string, unknown>).competition;
  if (!isObjectLike(c)) return undefined;
  if (typeof c.id !== "string" || c.id.length === 0) return undefined;
  if (typeof c.name !== "string" || c.name.length === 0) return undefined;
  return c as unknown as Competition;
}

export interface SeriesGroup {
  competition: Competition;
  /** This series' matches within the display window, chronologically
   * sorted -- live, upcoming, AND already-played matches together, since
   * "upcoming and ongoing only" applies to whether the SERIES qualifies,
   * not to which of its individual matches are shown once it does. */
  entries: ScheduleEntry[];
}

/**
 * The "All" tab's sanctioned data source: every currently-ongoing or
 * not-yet-started series/tournament, each with all of its own matches
 * (past, live, and upcoming) inside the display window, ordered by each
 * series' true earliest match date ascending -- a fully-concluded series
 * (every one of its matches already played) is excluded entirely. See the
 * module comment above for why completion/ordering are computed from an
 * unbounded match set while the entries actually shown stay windowed.
 *
 * Returns a Promise -- async from day one, same as every other exported
 * function in this file.
 */
export async function getSeriesGroupedSchedule(opts?: ScheduleOptions): Promise<SeriesGroup[]> {
  const [displayEntries, allEntries] = await Promise.all([
    getFullSchedule(opts),
    getFullSchedule({ windowDays: UNBOUNDED_WINDOW_DAYS }),
  ]);

  interface CompetitionState {
    competition: Competition;
    startMs: number;
    hasRemaining: boolean; // true if ANY of its matches (unbounded) is live or upcoming
  }
  const state = new Map<string, CompetitionState>();

  for (const entry of allEntries) {
    const competition = safeCompetition(entry.match);
    if (!competition) continue; // malformed/missing competition metadata -- excluded from grouping

    const startMs = Date.parse(entry.match.startTimeIso); // already validated finite by scheduleEntries
    const existing = state.get(competition.id);
    if (!existing) {
      state.set(competition.id, {
        competition,
        startMs,
        hasRemaining: entry.bucket !== "past",
      });
    } else {
      existing.startMs = Math.min(existing.startMs, startMs);
      if (entry.bucket !== "past") existing.hasRemaining = true;
    }
  }

  // Qualifying = at least one live/upcoming match anywhere in the dataset.
  // A competition with zero valid matches never entered `state` at all and
  // is correctly absent already.
  const qualifyingIds = new Set(
    [...state.entries()].filter(([, s]) => s.hasRemaining).map(([id]) => id)
  );

  const entriesByCompetition = new Map<string, ScheduleEntry[]>();
  for (const entry of displayEntries) {
    const competition = safeCompetition(entry.match);
    if (!competition || !qualifyingIds.has(competition.id)) continue;
    const arr = entriesByCompetition.get(competition.id);
    if (arr) {
      arr.push(entry);
    } else {
      entriesByCompetition.set(competition.id, [entry]);
    }
  }

  const groups: SeriesGroup[] = [];
  for (const id of qualifyingIds) {
    const entries = entriesByCompetition.get(id);
    if (!entries || entries.length === 0) continue; // qualifies, but nothing inside the display window
    entries.sort((a, b) => Date.parse(a.match.startTimeIso) - Date.parse(b.match.startTimeIso));
    groups.push({ competition: state.get(id)!.competition, entries });
  }

  groups.sort((a, b) => {
    const diff = state.get(a.competition.id)!.startMs - state.get(b.competition.id)!.startMs;
    if (diff !== 0) return diff;
    return a.competition.id.localeCompare(b.competition.id); // deterministic tie-break
  });

  return groups;
}

// ============================================================================
// "All" tab rows + the per-series dedicated page -- v1.0.113 (DECISIONS-LOG.md)
// ============================================================================
// v1.0.112 rendered every one of a qualifying series' matches inline under
// its heading on the "All" tab. That was more detail than intended -- v1.0.113
// collapses each qualifying series to a single summary row (name, a LIVE
// badge if anything in it is currently live, its next live/upcoming match's
// date, and a one-line "Last: ..." recap of its most recently completed
// match) and moves the full match list to a new dedicated page,
// `/schedule/series/[competitionId]`. The series inclusion rule (ongoing/
// upcoming only) and ordering (true start date ascending, stable) are
// UNCHANGED from v1.0.112 -- this only changes how a qualifying series is
// presented on "All", not which series qualify or in what order.
// ============================================================================

export interface SeriesSummary {
  competition: Competition;
  /** True if ANY of this series' matches within `entries` is currently live. */
  isLive: boolean;
  /** The earliest entry in `entries` that is live or upcoming -- "the
   * series' next live-or-upcoming match." `undefined` only in the
   * pathological case where a series qualified (has a live/upcoming match
   * SOMEWHERE in the unbounded dataset, per `getSeriesGroupedSchedule`)
   * but none of it falls inside the display window passed to
   * `summarizeSeriesGroup`'s source `SeriesGroup` -- fails safe by simply
   * omitting the "next" date rather than showing a blank/garbage one. */
  nextEntry?: ScheduleEntry;
  /** The most recently completed match with a usable `result` (a defined
   * `winner`), or `undefined` if this series has no completed match yet
   * (nothing to recap) or its only past match(es) lack usable result data
   * (same "nothing correct to show" posture as excluding a match with no
   * usable date elsewhere in this file, rather than rendering a broken
   * recap line). */
  lastCompletedEntry?: ScheduleEntry;
}

function hasUsableResult(match: Match): boolean {
  const r: unknown = (match as unknown as Record<string, unknown>).result;
  if (!isObjectLike(r) || typeof r.winner !== "string" || r.winner.length === 0) return false;
  if (r.winner === "draw" || r.winner === "tie" || r.winner === "no-result") return true;
  // A real, attributable winner needs to actually be one of this match's
  // two teams -- a `winner` string that matches neither (malformed/stale
  // data referencing a team no longer on this match) isn't usable for a
  // "X won vs Y" recap, the same "can't attribute this" posture
  // `safeTeamCode` takes elsewhere in this file.
  return r.winner === match.teamA.code || r.winner === match.teamB.code;
}

/**
 * Derives the "All" tab's one-row-per-series summary from an already-
 * fetched `SeriesGroup` (see `getSeriesGroupedSchedule`). Pure presentation
 * derivation over already-validated data -- like `groupScheduleByMonth`,
 * not a data-access boundary, so it doesn't need the async/interface
 * treatment on its own. `group.entries` is already sorted ascending by the
 * time it reaches here, so the "next" entry is simply the first non-past
 * one, and the "last completed" entry is found by scanning backward for
 * the first past one with usable result data.
 */
export function summarizeSeriesGroup(group: SeriesGroup): SeriesSummary {
  const isLive = group.entries.some(e => e.bucket === "live");
  const nextEntry = group.entries.find(e => e.bucket !== "past");

  let lastCompletedEntry: ScheduleEntry | undefined;
  for (let i = group.entries.length - 1; i >= 0; i--) {
    const entry = group.entries[i];
    if (entry.bucket === "past" && hasUsableResult(entry.match)) {
      lastCompletedEntry = entry;
      break;
    }
  }

  return { competition: group.competition, isLive, nextEntry, lastCompletedEntry };
}

/**
 * Every valid match for ONE series/tournament (`competitionId`), live,
 * upcoming, AND past, sorted ascending -- the dedicated per-series page's
 * sanctioned data source. Deliberately does NOT apply the "ongoing/
 * upcoming only" inclusion rule `getSeriesGroupedSchedule` uses for the
 * "All" row list -- once a user has tapped into a specific series, a fully
 * -concluded one should still show its complete match history, not an
 * empty page. Reads through `getFullSchedule`/`safeCompetition` the same
 * as every other function in this file; a `competitionId` that matches no
 * valid match (unknown id, or a malformed/empty string) returns `[]`
 * rather than throwing, letting the page render its own not-found state.
 */
export async function getMatchesForCompetition(
  competitionId: string,
  opts?: ScheduleOptions
): Promise<ScheduleEntry[]> {
  if (typeof competitionId !== "string" || competitionId.length === 0) return [];
  const entries = await getFullSchedule(opts);
  return entries.filter(entry => safeCompetition(entry.match)?.id === competitionId);
}

/**
 * "KKR won by 7 wickets vs RR"-style one-line recap of a completed match,
 * for the "All" tab's per-series summary row (`SeriesSummaryRow` in
 * app/schedule/page.tsx). Kept here rather than in the page component
 * itself so it's pure-function-testable the same way as every other
 * presentation derivation in this file, and so its "winner doesn't
 * actually match either team" fallback lives next to `hasUsableResult()`,
 * the function that's supposed to prevent this from ever firing in
 * practice -- `entry` is expected to have already passed that check, but
 * this stays defensive on its own regardless.
 */
export function formatLastResult(entry: ScheduleEntry): string {
  const { match } = entry;
  const result = match.result;
  if (!result) return "";
  const { winner, margin } = result;

  if (winner === "draw") return `Drawn: ${match.teamA.shortName} vs ${match.teamB.shortName}`;
  if (winner === "tie") return `Tied: ${match.teamA.shortName} vs ${match.teamB.shortName}`;
  if (winner === "no-result") return `No result: ${match.teamA.shortName} vs ${match.teamB.shortName}`;

  const winnerTeam = winner === match.teamA.code ? match.teamA : winner === match.teamB.code ? match.teamB : undefined;
  const loserTeam = winnerTeam === match.teamA ? match.teamB : winnerTeam === match.teamB ? match.teamA : undefined;
  if (!winnerTeam || !loserTeam) return `${winner} won${margin ? ` by ${margin}` : ""}`; // winner didn't match either team -- can't name the opponent reliably

  return `${winnerTeam.shortName} won${margin ? ` by ${margin}` : ""} vs ${loserTeam.shortName}`;
}

/**
 * Every distinct, validly-identified competition id present in the
 * dataset (unbounded by default -- see `UNBOUNDED_WINDOW_DAYS`), through
 * `safeCompetition()` so a match with malformed/missing competition
 * metadata can't contribute a garbage id. Exists to back build-time
 * enumeration for the dedicated per-series page's `generateStaticParams`
 * (app/schedule/series/[competitionId]/page.tsx) WITHOUT that page having
 * to re-derive the same validation logic itself -- keeps `safeCompetition`
 * the one place this check happens, consistent with the rest of this
 * file's single-interface discipline. Deliberately includes fully-
 * concluded series too (unlike `getSeriesGroupedSchedule`'s "All" rows) --
 * the dedicated page itself has no inclusion-rule restriction, so every
 * competition that has ever had a valid match should get a page.
 */
export async function getAllCompetitionIds(opts?: ScheduleOptions): Promise<string[]> {
  const entries = await getFullSchedule(opts ?? { windowDays: UNBOUNDED_WINDOW_DAYS });
  const ids = new Set<string>();
  for (const entry of entries) {
    const competition = safeCompetition(entry.match);
    if (competition) ids.add(competition.id);
  }
  return Array.from(ids);
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
