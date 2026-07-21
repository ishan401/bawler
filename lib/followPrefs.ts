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
}

export type FollowCategory = keyof FollowPrefs;

const STORAGE_KEY = "bawler:followPrefs";
const CHANGE_EVENT = "bawler:follow-prefs-changed";

export function emptyFollowPrefs(): FollowPrefs {
  return { nations: [], teams: [], tournaments: [], series: [], players: [], formats: [] };
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
  return {
    nations: prefs.nations.filter(id => nations.has(id)),
    teams: prefs.teams.filter(id => teams.has(id)),
    tournaments: prefs.tournaments.filter(id => tournaments.has(id)),
    series: prefs.series.filter(id => series.has(id)),
    players: prefs.players.filter(id => players.has(id)),
    formats: prefs.formats.filter(f => VALID_FORMATS.has(f)),
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
    a.nations.every(id => b.nations.includes(id)) &&
    a.teams.every(id => b.teams.includes(id)) &&
    a.tournaments.every(id => b.tournaments.includes(id)) &&
    a.series.every(id => b.series.includes(id)) &&
    a.players.every(id => b.players.includes(id)) &&
    a.formats.every(f => b.formats.includes(f))
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

/** Tier 1 = nation, team, tournament, series, or format. These outrank Player. */
export function isTier1Match(q: MatchQualification): boolean {
  return q.nation || q.team || q.tournament || q.series || q.format;
}

export function isAnyMatch(q: MatchQualification): boolean {
  return isTier1Match(q) || q.player;
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
