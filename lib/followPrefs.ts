import type { Match, MatchFormat } from "./types";
import { isPlayerInMatch } from "./lineups";

// ============================================================================
// Follow preferences — v1.0.52
// ============================================================================
// Replaces the old single-team lib/followedTeam.ts placeholder. Everything
// is matched by stable ID, never by display name:
//   nations      -> Team.country (ISO code, e.g. "IND")
//   teams        -> Team.code (covers franchise AND national teams as
//                    literal entities, e.g. "MI" or "IND")
//   tournaments  -> Competition.id (e.g. "ipl-2026")
//   players      -> PLAYERS registry id (e.g. "v-kohli")
//   formats      -> MatchFormat ("T20" | "T20I" | "ODI" | "Test" | "Hundred")
// No account system exists, so this is still a localStorage preference —
// just a real multi-category one now, feeding the homepage "for you" row.
// ============================================================================

export interface FollowPrefs {
  nations: string[];
  teams: string[];
  tournaments: string[];
  players: string[];
  formats: MatchFormat[];
}

export type FollowCategory = keyof FollowPrefs;

const STORAGE_KEY = "bawler:followPrefs";
const CHANGE_EVENT = "bawler:follow-prefs-changed";

export function emptyFollowPrefs(): FollowPrefs {
  return { nations: [], teams: [], tournaments: [], players: [], formats: [] };
}

export function getFollowPrefs(): FollowPrefs {
  if (typeof window === "undefined") return emptyFollowPrefs();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyFollowPrefs();
    const parsed = JSON.parse(raw);
    return { ...emptyFollowPrefs(), ...parsed };
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
  format: boolean;
  player: boolean;
}

export function qualifyMatch(match: Match, prefs: FollowPrefs): MatchQualification {
  const format = prefs.formats.includes(match.format);

  const tournament =
    prefs.tournaments.includes(match.competition.id) ||
    (!!match.championship && prefs.tournaments.includes(match.championship.id));

  const team = prefs.teams.includes(match.teamA.code) || prefs.teams.includes(match.teamB.code);

  let nation = false;
  if (prefs.nations.length > 0) {
    const nationA = nationOf(match.teamA.code, match.teamA.country, match.teamA.type);
    const nationB = nationOf(match.teamB.code, match.teamB.country, match.teamB.type);
    const nationMatches = (nationA && prefs.nations.includes(nationA)) || (nationB && prefs.nations.includes(nationB));
    // A two-team bilateral series (e.g. "India tour of Australia") IS the
    // followed nation's whole current storyline — the hero card, series
    // banner, etc. already foreground it elsewhere on the homepage, so
    // nation-following doesn't add anything a "for you" row should repeat.
    // (Team/tournament/format/player follows are unaffected — those are
    // more deliberate choices and still surface bilateral matches normally.)
    nation = !!nationMatches && match.competition.type !== "bilateral";
  }

  const player = prefs.players.length > 0 && prefs.players.some(pid => isPlayerInMatch(match, pid));

  return { nation, team, tournament, format, player };
}

/** Tier 1 = nation, team, tournament, or format. These outrank Player. */
export function isTier1Match(q: MatchQualification): boolean {
  return q.nation || q.team || q.tournament || q.format;
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
