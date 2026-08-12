import type { Match, MatchFormat } from "./types";
import { isPlayerInMatch, getMatchLineup } from "./lineups";
import { NATIONAL_TEAMS, ALL_TEAMS, COMPETITIONS, PLAYERS } from "./mockData";

// ============================================================================
// Follow preferences — v1.0.52
// ============================================================================
// Replaces the old single-team lib/followedTeam.ts placeholder. Everything
// is matched by stable ID, never by display name:
//   nations      -> Team.country (ISO code, e.g. "IND")
//   teams        -> Team.code (covers franchise AND national teams as
//                    literal entities, e.g. "MI" or "IND")
//   tournaments  -> Competition.id, genuine multi-team competitions only
//                    (e.g. "ipl-2026") -- Competition.type !== "bilateral"
//   series       -> Competition.id, bilateral/tour-style series only
//                    (e.g. "ind-aus-t20i-2026") -- Competition.type ===
//                    "bilateral". Split out from tournaments in v1.0.88:
//                    a two-team series ("India tour of Australia 2026")
//                    isn't a tournament, and was listing incorrectly
//                    alongside genuine multi-team competitions (BBL, IPL,
//                    Champions Trophy, ...) in the Filter sheet.
//   players      -> PLAYERS registry id (e.g. "v-kohli")
//   formats      -> MatchFormat ("T20" | "T20I" | "ODI" | "Test" | "Hundred")
// No account system exists, so this is still a localStorage preference —
// just a real multi-category one now, feeding the homepage "for you" row.
// ============================================================================

export interface FollowPrefs {
  nations: string[];
  teams: string[];
  tournaments: string[];
  series: string[];
  players: string[];
  formats: MatchFormat[];
  // v1.0.182: the subset of `formats` (above) that were auto-assigned by
  // the onboarding skip-everything fallback (see
  // DEFAULT_FALLBACK_FORMATS/applyOnboardingFallbackIfNeeded below) rather
  // than a real, deliberate choice -- completing the onboarding quiz, or
  // manually checking a format in the "Follow your cricket" settings
  // sheet, are both genuine explicit choices and never land here. Always
  // a subset of `formats`, kept as its own array (not a boolean per
  // format, not a parallel prefs bucket) so every existing array-shaped
  // helper below (sanitizeFollowPrefs, prefsEqual, emptyFollowPrefs)
  // extends the same way it already handles every other category.
  // Read ONLY by getForYouReason() to choose "Because you follow X" vs.
  // the honest "Popular in X" -- qualifyMatch()/isTier1Match()/
  // isAnyMatch() (i.e. which matches count as "for you" at all) never
  // consult it, so introducing it cannot change match targeting, only
  // the wording of the reason line.
  defaultFormats: MatchFormat[];
}

// v1.0.187: the onboarding "Who do you love to hate?" rival-question step
// (and the `rivalTeam` field it used to write here) was removed entirely
// -- grep-confirmed it had zero downstream consumers anywhere in the app
// (qualifyMatch()/getForYouReason() never read it, and no "your rivalry"
// banner or similar ever existed), so rather than leave a permanently-
// undefined field around, the whole mechanism was deleted rather than
// just its producer. See DECISIONS-LOG.md.
//
// defaultFormats is deliberately excluded -- it isn't one of the six real
// Filter-sheet categories (buildOptions() in FollowSheet.tsx switches
// exhaustively over FollowCategory). It's a read-only annotation on top
// of `formats` (which entries in it are auto-assigned vs. explicit) --
// never rendered, checked, or toggled as its own category; the Follow
// sheet's "formats" toggle handler updates it as a side effect instead
// (see toggle() in FollowSheet.tsx).
export type FollowCategory = Exclude<keyof FollowPrefs, "defaultFormats">;

const STORAGE_KEY = "bawler:followPrefs";
const CHANGE_EVENT = "bawler:follow-prefs-changed";

export function emptyFollowPrefs(): FollowPrefs {
  return { nations: [], teams: [], tournaments: [], series: [], players: [], formats: [], defaultFormats: [] };
}

// ----------------------------------------------------------------------------
// Sanitization — v1.0.63
// ----------------------------------------------------------------------------
// A stored FollowPrefs entry is only ever meaningful if it can still be
// rendered and checked in the Filter sheet. Category-scoping rules (like
// CO1, v1.0.57, which removed national teams from the Team category) can
// retroactively invalidate a previously-stored ID -- e.g. a "teams" array
// containing a national code like "AUS" after Team became franchise-only.
// Left unchecked, that ID keeps being counted by totalFollowCount() and
// honored by qualifyMatch(), while no checkbox anywhere can ever show it
// as checked (since it no longer appears in the rendered options) or
// un-check it. That split is exactly the "phantom selection" bug: a count
// with no corresponding checked item.
//
// The fix: every read of stored prefs is filtered against the SAME valid-ID
// sets the Filter sheet itself renders from, so a stored ID only survives
// if it is genuinely renderable/checkable right now. This guarantees the
// counter/badges and the checkbox state can never disagree, because both
// are ultimately derived from this one sanitized value.
function validNationIds(): Set<string> {
  return new Set(Object.values(NATIONAL_TEAMS).map(t => t.country ?? t.code));
}
function validTeamIds(): Set<string> {
  // Matches FollowSheet's buildOptions("teams") scoping exactly: franchise
  // teams only, national teams excluded (they live under "nations" instead).
  return new Set(
    Object.values(ALL_TEAMS).filter(t => t.type !== "national").map(t => t.code)
  );
}
function validTournamentIds(): Set<string> {
  // Genuine multi-team competitions only -- matches buildOptions("tournaments")'s
  // scoping exactly. Bilateral series live under "series" instead (SC1).
  return new Set(Object.values(COMPETITIONS).filter(c => c.type !== "bilateral").map(c => c.id));
}
function validSeriesIds(): Set<string> {
  return new Set(Object.values(COMPETITIONS).filter(c => c.type === "bilateral").map(c => c.id));
}
function validPlayerIds(): Set<string> {
  return new Set(Object.keys(PLAYERS));
}
const VALID_FORMATS = new Set<MatchFormat>(["T20", "T20I", "ODI", "Test", "Hundred"]);

export function sanitizeFollowPrefs(prefs: FollowPrefs): FollowPrefs {
  const nations = validNationIds();
  const teams = validTeamIds();
  const tournaments = validTournamentIds();
  const series = validSeriesIds();
  const players = validPlayerIds();
  const formats = prefs.formats.filter(f => VALID_FORMATS.has(f));
  // v1.0.182: defaultFormats must always be a SUBSET of the sanitized
  // formats list above -- e.g. a user who unfollows a format via the
  // Follow sheet (removing it from `formats`) but never touches
  // `defaultFormats` directly shouldn't leave a stale "this is a
  // default" marker for a format that isn't even followed anymore.
  const defaultFormats = (prefs.defaultFormats ?? []).filter(f => formats.includes(f));
  return {
    nations: prefs.nations.filter(id => nations.has(id)),
    teams: prefs.teams.filter(id => teams.has(id)),
    tournaments: prefs.tournaments.filter(id => tournaments.has(id)),
    series: prefs.series.filter(id => series.has(id)),
    players: prefs.players.filter(id => players.has(id)),
    formats,
    defaultFormats,
  };
}

function prefsEqual(a: FollowPrefs, b: FollowPrefs): boolean {
  return (
    a.nations.length === b.nations.length &&
    a.teams.length === b.teams.length &&
    a.tournaments.length === b.tournaments.length &&
    a.series.length === b.series.length &&
    a.players.length === b.players.length &&
    a.formats.length === b.formats.length &&
    a.defaultFormats.length === b.defaultFormats.length &&
    a.nations.every(id => b.nations.includes(id)) &&
    a.teams.every(id => b.teams.includes(id)) &&
    a.tournaments.every(id => b.tournaments.includes(id)) &&
    a.series.every(id => b.series.includes(id)) &&
    a.players.every(id => b.players.includes(id)) &&
    a.formats.every(f => b.formats.includes(f)) &&
    a.defaultFormats.every(f => b.defaultFormats.includes(f))
  );
}

export function getFollowPrefs(): FollowPrefs {
  if (typeof window === "undefined") return emptyFollowPrefs();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFollowPrefs();
    const parsed = JSON.parse(raw);
    const merged = { ...emptyFollowPrefs(), ...parsed };
    const clean = sanitizeFollowPrefs(merged);
    // Self-heal: if sanitizing dropped anything stale, persist the clean
    // value immediately so storage is repaired on first read, not just
    // masked on screen until the next explicit follow/unfollow.
    if (!prefsEqual(merged, clean)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      } catch {
        // localStorage unavailable — repaired value just won't persist.
      }
    }
    return clean;
  } catch {
    return emptyFollowPrefs();
  }
}

/** Persists prefs and notifies any other mounted component (e.g. the
 * homepage) that they changed, since the sheet lives in BottomNav — a
 * sibling, not a parent, of the page that needs to react to it. */
export function setFollowPrefs(prefs: FollowPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable — preference just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onFollowPrefsChanged(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function totalFollowCount(prefs: FollowPrefs): number {
  return (
    prefs.nations.length +
    prefs.teams.length +
    prefs.tournaments.length +
    prefs.series.length +
    prefs.players.length +
    prefs.formats.length
  );
}

export function hasAnyFollow(prefs: FollowPrefs): boolean {
  return totalFollowCount(prefs) > 0;
}

// ----------------------------------------------------------------------------
// Onboarding skip-everything fallback -- v1.0.182
// ----------------------------------------------------------------------------
// Confirmed bug (v1.0.182): a user who skips team selection, skips player
// selection, AND skips (or never explicitly answers) the onboarding quiz
// previously ended up with a genuinely EMPTY FollowPrefs -- no personalization
// signal of any kind, so the homepage "for you" row/badge simply never
// appeared for them. That's honest, but a fully-empty "for you" experience
// for a brand-new user is a worse product outcome than a soft, clearly-
// labeled default. This is the ONE place in the app formats are ever set
// without a real user action behind them -- everywhere else (the quiz's
// persistFormatTags in QuizStep.tsx, and a manual checkbox tap in the
// "Follow your cricket" settings sheet) a user did something deliberate.
export const DEFAULT_FALLBACK_FORMATS: MatchFormat[] = ["T20", "T20I", "Hundred"];

/**
 * Call exactly once, at the very end of onboarding (see
 * OnboardingFlow.tsx's finishOnboarding()) -- AFTER the team/player/quiz
 * steps have already had their chance to write real, explicit follows.
 * If the user leaves with genuinely zero follows of any kind (skipped
 * every step), assigns DEFAULT_FALLBACK_FORMATS so "for you" has
 * something to work with, and records those exact formats in
 * `defaultFormats` too so getForYouReason() can render them honestly
 * ("Popular in T20", not "Because you follow T20"). No-op whenever the
 * user already has ANY real follow -- including formats captured by
 * honestly completing the quiz -- so this never overwrites or dilutes a
 * genuine preference signal.
 */
export function applyOnboardingFallbackIfNeeded(): void {
  const prefs = getFollowPrefs();
  if (hasAnyFollow(prefs)) return;
  prefs.formats = [...DEFAULT_FALLBACK_FORMATS];
  prefs.defaultFormats = [...DEFAULT_FALLBACK_FORMATS];
  setFollowPrefs(prefs);
}

function nationOf(code: string, country?: string, type?: string): string | undefined {
  return country ?? (type === "national" ? code : undefined);
}

/** Per-category breakdown of why (if at all) `match` matches `prefs`. Used
 * by the "for you" row to distinguish Tier 1 (nation/team/tournament/
 * format) from Player-only matches — see isTier1Match/isAnyMatch below. */
export interface MatchQualification {
  nation: boolean;
  team: boolean;
  tournament: boolean;
  series: boolean;
  format: boolean;
  player: boolean;
}

export function qualifyMatch(match: Match, prefs: FollowPrefs): MatchQualification {
  const format = prefs.formats.includes(match.format);

  const tournament =
    prefs.tournaments.includes(match.competition.id) ||
    (!!match.championship && prefs.tournaments.includes(match.championship.id));

  const series =
    prefs.series.includes(match.competition.id) ||
    (!!match.championship && prefs.series.includes(match.championship.id));

  const team = prefs.teams.includes(match.teamA.code) || prefs.teams.includes(match.teamB.code);

  let nation = false;
  if (prefs.nations.length > 0) {
    const nationA = nationOf(match.teamA.code, match.teamA.country, match.teamA.type);
    const nationB = nationOf(match.teamB.code, match.teamB.country, match.teamB.type);
    const nationMatches = (nationA && prefs.nations.includes(nationA)) || (nationB && prefs.nations.includes(nationB));
    // v1.0.91 (FC-Bug1): previously suppressed here whenever the match was
    // part of a bilateral series, on the theory that the hero card/series
    // banner already foreground it. That blanket gate was wrong in
    // practice — most international cricket IS bilateral, so it made "for
    // you" go dark for most nation follows most of the time. Hero-match
    // exclusion (the only thing this was actually trying to avoid
    // repeating) is handled uniformly by the caller via `m.id !== heroId`,
    // the same way team/tournament/series/format/player follows already
    // work — so nation follows no longer need a special case here.
    nation = !!nationMatches;
  }

  const player = prefs.players.length > 0 && prefs.players.some(pid => isPlayerInMatch(match, pid));

  return { nation, team, tournament, series, format, player };
}

/** Tier 1 = nation, team, tournament, series, or format. These outrank Player.
 *
 * v1.0.183 NOTE: as of the "For You" teams-only product decision (see
 * isForYouMatch below), this function is no longer used to gate the "for
 * you" badge -- app/page.tsx's forYouResult computation now calls
 * isForYouMatch() directly instead of this + the player fallback isAnyMatch
 * used to provide. Left in place, unchanged, as a general-purpose "how
 * broadly does this match relate to any followed category" utility (still
 * exercised by scripts/series-category-check.ts) -- not deleted, since
 * nothing asked for match-qualification breakdown itself to disappear,
 * only for it to stop deciding the For You badge. Currently has no live
 * caller in the app beyond that script; flagged here rather than removed
 * silently. */
export function isTier1Match(q: MatchQualification): boolean {
  return q.nation || q.team || q.tournament || q.series || q.format;
}

/** v1.0.183 NOTE: same status as isTier1Match above -- no longer used to
 * gate the "for you" badge, kept as a general-purpose utility. */
export function isAnyMatch(q: MatchQualification): boolean {
  return isTier1Match(q) || q.player;
}

/**
 * v1.0.183 -- "For You" product decision: a match may ONLY be surfaced as
 * "for you" when the user has explicitly followed one of its two teams --
 * either as a franchise/club team (`prefs.teams`) or as a national team
 * (`prefs.nations`). Every other signal qualifyMatch() computes (format,
 * tournament, series, player) must NEVER produce a "for you" badge,
 * regardless of how those preferences were set (manually in the Follow
 * sheet, via the onboarding quiz, or via the skip-everything default-
 * format fallback in applyOnboardingFallbackIfNeeded above). This is the
 * ONLY function app/page.tsx's forYouResult computation should call to
 * decide whether a match counts as "for you" -- isTier1Match/isAnyMatch
 * above are intentionally NOT used for this anymore. */
export function isForYouMatch(q: MatchQualification): boolean {
  return q.nation || q.team;
}

/**
 * Resolves WHICH specific followed TEAM is responsible for a match's
 * "for you" status, for the homepage reason line ("Because you follow
 * {name}") -- v1.0.149, narrowed to teams-only by the v1.0.183 product
 * decision below.
 *
 * v1.0.183 -- "For You" is now scoped to explicit team/nation follows
 * ONLY. Player, Series, Tournament, and Format (including the v1.0.182
 * skip-everything default-format fallback) used to each have their own
 * branch here and could each independently produce a reason string --
 * all four branches were removed. A match can now reach this function
 * with a resolvable reason if and only if isForYouMatch() (above) already
 * returned true for it, i.e. it involves a franchise/club team in
 * `prefs.teams` or a national team in `prefs.nations` -- nothing else.
 * Does not change qualifyMatch/isTier1Match/isAnyMatch/matchIsFollowed in
 * any way; those still compute/report every category honestly, this is
 * just no longer fed by anything but the two allowed categories.
 *
 * If the SAME category matches both competing sides (e.g. the user
 * follows both teams, or both nations, playing each other), names both
 * sides: "Because you follow both {A} and {B}".
 *
 * Returns null if no reason can be resolved (should not normally happen
 * for a match that already qualifies via isForYouMatch) -- callers must
 * render the plain "for you" label with no reason line in that case,
 * never a placeholder or undefined text.
 */
// v1.0.192 -- shared by getForYouReason() (below, used by the LIVE-match
// inline "for you" tag -- LiveCarousel/LiveMatchCard/ForYouMarker's reason
// lines, plus the Spotlight dedup marker; unchanged output, still says
// "both") and getFeaturedForYouReason() (below that, used ONLY by the
// dedicated Home featured "for you" card, ForYouRow) -- identical
// team>nation resolution logic, the only difference is how the two-sides-
// followed case is worded, via the `join` callback each caller supplies.
// Extracted so the featured card's wording (spec'd as plain "Because you
// follow {A} and {B}", no "both") could be introduced WITHOUT changing a
// single character of the already-confirmed-working inline tag's text.
function resolveForYouReason(
  match: Match,
  prefs: FollowPrefs,
  join: (nameA: string, nameB: string) => string
): string | null {
  const singleReason = (name: string) => `Because you follow ${name}`;

  // 1. Team -- franchise teams only (national teams are matched under
  // Nation below; see validTeamIds()/sanitizeFollowPrefs above).
  {
    const teamA = prefs.teams.includes(match.teamA.code);
    const teamB = prefs.teams.includes(match.teamB.code);
    if (teamA && teamB) return join(match.teamA.shortName, match.teamB.shortName);
    if (teamA) return singleReason(match.teamA.shortName);
    if (teamB) return singleReason(match.teamB.shortName);
  }

  // 2. Nation.
  if (prefs.nations.length > 0) {
    const nationA = nationOf(match.teamA.code, match.teamA.country, match.teamA.type);
    const nationB = nationOf(match.teamB.code, match.teamB.country, match.teamB.type);
    const matchesA = !!nationA && prefs.nations.includes(nationA);
    const matchesB = !!nationB && prefs.nations.includes(nationB);
    if (matchesA && matchesB) return join(match.teamA.fullName, match.teamB.fullName);
    if (matchesA) return singleReason(match.teamA.fullName);
    if (matchesB) return singleReason(match.teamB.fullName);
  }

  return null;
}

export function getForYouReason(match: Match, prefs: FollowPrefs): string | null {
  return resolveForYouReason(match, prefs, (nameA, nameB) => `Because you follow both ${nameA} and ${nameB}`);
}

/**
 * v1.0.192 -- dedicated reason resolver for the Home featured "for you"
 * card ONLY (app/page.tsx's forYouResult -> ForYouRow). Same team>nation
 * resolution as getForYouReason() above (and reads exactly the same
 * followed nation(s)/team(s) against BOTH sides of the match -- not just
 * one), but renders the two-sides-followed case as "Because you follow
 * {A} and {B}" (no "both"), matching the exact wording spec'd for this
 * card, e.g. "AUS vs IND" with both followed -> "Because you follow
 * Australia and India". {A}/{B} are always in the same left-to-right
 * order as the match's own teamA/teamB (i.e. the match header's display
 * order), never re-sorted by follow-category or alphabetically.
 * getForYouReason() above (the live-match inline tag's resolver) is
 * intentionally NOT reused/aliased here and keeps its original "both"
 * wording untouched -- this is a separate function specifically so this
 * card's wording change can never affect that already-confirmed-working
 * mechanism.
 */
export function getFeaturedForYouReason(match: Match, prefs: FollowPrefs): string | null {
  return resolveForYouReason(match, prefs, (nameA, nameB) => `Because you follow ${nameA} and ${nameB}`);
}

/** True if `match` is relevant to ANY of the user's followed selections
 * (convenience wrapper — most callers wanting tier awareness should use
 * qualifyMatch directly, e.g. the "for you" row's pooling logic). */
export function matchIsFollowed(match: Match, prefs: FollowPrefs): boolean {
  return isAnyMatch(qualifyMatch(match, prefs));
}

/**
 * Which side of `match` (teamA or teamB) is the one actually satisfying
 * `prefs` -- used only by the homepage "for you" card (v1.0.58) so it can
 * always put the followed team on the left, with its color dot, instead of
 * leaving team order at the mercy of whatever convention (home team first,
 * alphabetical, etc.) the match data happens to use. Returns null when
 * nothing pins the match to a specific side (e.g. it only qualified via a
 * followed tournament or format) -- callers should leave team order
 * untouched in that case.
 *
 * Checked in the same team > nation > player priority that qualifyMatch
 * itself effectively uses for Tier 1 vs Tier 2, since a team/nation-level
 * follow is the more specific, more likely-intended signal when a match
 * happens to satisfy more than one category at once.
 */
export function followedMatchSide(match: Match, prefs: FollowPrefs): "A" | "B" | null {
  if (prefs.teams.includes(match.teamA.code)) return "A";
  if (prefs.teams.includes(match.teamB.code)) return "B";

  if (prefs.nations.length > 0) {
    const nationA = nationOf(match.teamA.code, match.teamA.country, match.teamA.type);
    const nationB = nationOf(match.teamB.code, match.teamB.country, match.teamB.type);
    if (nationA && prefs.nations.includes(nationA)) return "A";
    if (nationB && prefs.nations.includes(nationB)) return "B";
  }

  if (prefs.players.length > 0) {
    if (prefs.players.some(pid => getMatchLineup(match, match.teamA).includes(pid))) return "A";
    if (prefs.players.some(pid => getMatchLineup(match, match.teamB).includes(pid))) return "B";
  }

  return null;
}

/**
 * The full set of `Team.code`s the user is following AS A TEAM -- combining
 * both Filter categories that represent "a specific team's matches" from a
 * schedule standpoint: the dedicated Team category (franchise teams, stored
 * directly as `Team.code` in `prefs.teams`) AND the Nation category
 * (national teams, stored as `Team.country` -- an ISO code that is NOT
 * always equal to the team's own `code`, e.g. South Africa's team code is
 * "SA" but its `country` field is "RSA" -- so this can't be a simple
 * pass-through).
 *
 * v1.0.110 -- built for the Schedule tab redefault (see ARCHITECTURE.md's
 * lib/teamSchedule.ts worked example and DECISIONS-LOG.md): "does this user
 * have any teams selected" and "which teams" both need to treat following
 * India (a nation) and following Mumbai Indians (a franchise team) as
 * equally strong "this is one of my teams" signals, the same way
 * `qualifyMatch`'s Tier 1 already treats nation and team follows as equal-
 * weight personalization signals for "for you". This is the SAME
 * `FollowPrefs` store `qualifyMatch` reads -- not a second preference
 * store -- just a different derived view of it (a flat list of team codes
 * instead of a per-match qualification check).
 *
 * Deliberately exported from this file (not duplicated in
 * lib/teamSchedule.ts): resolving "what does this user's follow selection
 * mean in terms of team codes" is a FollowPrefs-shaped question, the same
 * category as `followedMatchSide` above. lib/teamSchedule.ts's job starts
 * one step later -- given a set of team codes, fetch their schedules --
 * and stays agnostic of how those codes were chosen.
 */
export function myTeamCodes(prefs: FollowPrefs): string[] {
  const codes = new Set<string>(prefs.teams);
  if (prefs.nations.length > 0) {
    for (const team of Object.values(NATIONAL_TEAMS)) {
      const nationId = nationOf(team.code, team.country, team.type);
      if (nationId && prefs.nations.includes(nationId)) {
        codes.add(team.code);
      }
    }
  }
  return Array.from(codes);
}
