import type { Match, Team } from "./types";
import { PLAYERS } from "./mockData";

// ============================================================================
// Per-match playing-XI lookup — v1.0.52, ground-truth fix v1.0.150
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
//
// v1.0.150 fix: that random-roll fallback used to be the ONLY signal
// consulted, even for a match that has already been played (or is being
// played) and whose own battingCard/bowlingCard/balls unambiguously name
// who was in each XI. A platform-wide audit found 21 confirmed-playing
// mismatches across 8 fixtures where the roll happened to exclude a player
// the match's own data proves was there (e.g. V Kohli, dozens of
// `batterName: "V Kohli"` ball entries in ind-aus-t20i-2026-m2-live, yet
// excluded by the roll). This is a genuine code-level gap, not a one-
// fixture data typo -- it reproduces on ANY match lacking `match.lineups`
// (currently ALL of them), real API data included, since the fallback
// never even looks at the play data already sitting on the same object.
//
// Fix: confirmedLineupIds() below reads battingCard/bowlingCard/balls
// directly and is always trusted first -- a real, played, or in-progress
// appearance can never be overridden by the random roll. Matched by NAME,
// not id: battingCard/bowlingCard entries in this dataset don't reliably
// use the PLAYERS registry's canonical id (e.g. this dataset's own
// ind-aus-t20i-2026-m2-live battingCard uses playerId "vkohli", not the
// registry's "v-kohli") -- the same reason components/LineupsCard.tsx's
// getXI() already matches by playerName rather than id. The random roll
// is now used ONLY to fill in players with no play data at all (i.e. a
// genuinely upcoming, not-yet-played match) -- exactly its original,
// still-legitimate purpose; behavior for every upcoming fixture is
// unchanged, since confirmedLineupIds() is always empty there.
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

/** PLAYERS registry id whose `name` or `shortName` case-insensitively
 * matches `name` -- the same name-based resolution
 * components/LineupsCard.tsx's getXI() already relies on for display,
 * used here to map a battingCard/bowlingCard/balls name back to a
 * followable id even when that entry's own `playerId` field is a
 * non-canonical shorthand. */
function playerIdByName(name: string): string | undefined {
  const norm = name.trim().toLowerCase();
  for (const p of Object.values(PLAYERS)) {
    if (p.name.toLowerCase() === norm || p.shortName.toLowerCase() === norm) return p.id;
  }
  return undefined;
}

/** PLAYERS registry ids confirmed in `team`'s XI purely from data already
 * on `match` (battingCard/bowlingCard/balls) -- ground truth whenever it
 * exists, never a guess. Empty for a match with no play data yet (a
 * genuinely upcoming fixture), which is exactly when the seeded-roll
 * fallback below should still apply. */
function confirmedLineupIds(match: Match, team: Team): string[] {
  const names = new Set<string>();
  for (const inn of match.innings ?? []) {
    if (inn.battingTeam === team.code) {
      for (const b of inn.battingCard ?? []) names.add(b.playerName);
      for (const b of inn.balls ?? []) if (b.batterName) names.add(b.batterName);
    }
    if (inn.bowlingTeam === team.code) {
      for (const b of inn.bowlingCard ?? []) names.add(b.playerName);
      for (const b of inn.balls ?? []) if (b.bowlerName) names.add(b.bowlerName);
    }
  }
  const ids: string[] = [];
  for (const name of names) {
    const id = playerIdByName(name);
    if (id) ids.push(id);
  }
  return ids;
}

/** Player IDs (PLAYERS registry) confirmed in `team`'s XI for `match`. */
export function getMatchLineup(match: Match, team: Team): string[] {
  if (match.lineups) {
    return team.code === match.teamA.code ? match.lineups.teamA : match.lineups.teamB;
  }
  const confirmed = confirmedLineupIds(match, team);
  const eligible = Object.values(PLAYERS).filter(
    p => p.teamCode === team.code || p.franchiseCode === team.code
  );
  const derived = eligible
    .filter(p => !confirmed.includes(p.id)) // never re-roll a player already confirmed by real data
    .filter(p => seededChance(`${match.id}:${p.id}`, 0.72))
    .map(p => p.id);
  return Array.from(new Set([...confirmed, ...derived]));
}

/** True if `playerId` is confirmed in either side's XI for `match`. */
export function isPlayerInMatch(match: Match, playerId: string): boolean {
  return (
    getMatchLineup(match, match.teamA).includes(playerId) ||
    getMatchLineup(match, match.teamB).includes(playerId)
  );
}
