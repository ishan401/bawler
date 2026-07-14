import type { Match, Team } from "./types";
import { PLAYERS } from "./mockData";

// ============================================================================
// Per-match playing-XI lookup — v1.0.52
// ============================================================================
// Match.lineups (player IDs, not names) is what a real API would give us
// directly. Today's mock matches mostly don't carry it, so this derives a
// deterministic stand-in: any PLAYERS-registry player whose teamCode or
// franchiseCode matches the given team is a candidate, INCLUDED unless a
// seeded per-match roll excludes them (rested/rotated) — so a star does NOT
// appear in literally every match their team ever plays. That's what makes
// player-level following a genuine per-match check instead of a disguised
// per-team one: e.g. V Kohli (teamCode IND, franchiseCode RCB) shows up in
// most but not all IND and RCB matches, never in matches neither team plays.
//
// If real lineup data ever populates match.lineups, that's used verbatim —
// this derivation is purely a mock-data fallback.
// ============================================================================

/** Deterministic 0..1 pseudo-random derived from a string seed. */
function seededFraction(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (h % 1000) / 1000;
}

function seededChance(seed: string, prob: number): boolean {
  return seededFraction(seed) < prob;
}

/** Player IDs (PLAYERS registry) confirmed in `team`'s XI for `match`. */
export function getMatchLineup(match: Match, team: Team): string[] {
  if (match.lineups) {
    return team.code === match.teamA.code ? match.lineups.teamA : match.lineups.teamB;
  }
  const eligible = Object.values(PLAYERS).filter(
    p => p.teamCode === team.code || p.franchiseCode === team.code
  );
  return eligible
    .filter(p => seededChance(`${match.id}:${p.id}`, 0.72))
    .map(p => p.id);
}

/** True if `playerId` is confirmed in either side's XI for `match`. */
export function isPlayerInMatch(match: Match, playerId: string): boolean {
  return (
    getMatchLineup(match, match.teamA).includes(playerId) ||
    getMatchLineup(match, match.teamB).includes(playerId)
  );
}
