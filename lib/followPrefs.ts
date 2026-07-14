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

/** True if `match` is relevant to ANY of the user's followed selections. */
export function matchIsFollowed(match: Match, prefs: FollowPrefs): boolean {
  if (prefs.formats.includes(match.format)) return true;

  if (
    prefs.tournaments.includes(match.competition.id) ||
    (match.championship && prefs.tournaments.includes(match.championship.id))
  ) {
    return true;
  }

  if (prefs.teams.includes(match.teamA.code) || prefs.teams.includes(match.teamB.code)) {
    return true;
  }

  if (prefs.nations.length > 0) {
    const nationOf = (code: string, country?: string, type?: string) =>
      country ?? (type === "national" ? code : undefined);
    const nationA = nationOf(match.teamA.code, match.teamA.country, match.teamA.type);
    const nationB = nationOf(match.teamB.code, match.teamB.country, match.teamB.type);
    if ((nationA && prefs.nations.includes(nationA)) || (nationB && prefs.nations.includes(nationB))) {
      return true;
    }
  }

  if (prefs.players.length > 0 && prefs.players.some(pid => isPlayerInMatch(match, pid))) {
    return true;
  }

  return false;
}
