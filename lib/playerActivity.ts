import type { Match, Ball } from "./types";
import { resolvePlayerSlug } from "./mockData";

// ============================================================================
// "Currently live" player detection — v1.0.125
// ============================================================================
// Built for the homepage "Your Players" strip's sort order (favourited-and-
// live ranks first), and deliberately narrow in scope: this answers "is
// this player the striker or bowler of the most recently recorded ball in
// a match that is genuinely live right now" -- nothing more.
//
// Explicitly NOT built from Innings.battingCard / Innings.bowlingCard's
// `out`/`onStrike` fields, even though those look tempting (BattingEntry
// already has an `onStrike?: boolean`). Confirmed by direct inspection of
// FEATURED_MATCH's mock data that battingCard/bowlingCard represent the
// FINAL, end-of-innings aggregate for a match -- MatchView.tsx's live
// ball-ticking simulation (`truncatedMatch`) recomputes runs/wickets/overs
// from a truncated `balls` slice, but spreads battingCard/bowlingCard
// through UNCHANGED. Trusting `onStrike` there would silently read a
// future/final snapshot as if it were the current one -- the exact same
// leaked-future-state bug class as the premature FULL TIME Digest bug
// (see DECISIONS-LOG.md v1.0.124). Ball-by-ball data is the one field that
// is honestly chronological: for a real live match, the API only ever
// returns balls bowled so far, so "the last ball in the array" IS "the
// most recent event", not a peek at the outcome.
//
// `match.innings.flatMap(i => i.balls)` (in array order) is the exact same
// flattening MatchView.tsx uses for its own `allBalls` -- innings appear in
// chronological order in `Match.innings`, and each innings' own `balls` are
// already chronological, so the LAST entry in that flattened list is
// unambiguously "the most recent ball recorded for this match", regardless
// of how many innings have been completed so far.
//
// batterId/bowlerId values in this mock dataset are NOT reliably PLAYERS-
// registry slugs (e.g. "dwarner", "B Duckett", "jbumrah" all appear against
// registry keys like "v-kohli" elsewhere) -- resolvePlayerSlug() is the
// SAME reconciliation already used by lib/playerForm.ts for battingCard/
// bowlingCard playerIds, reused here rather than re-invented, so both
// derivations degrade the same way for the same unresolvable IDs.
//
// Known, accepted limitation: Ball has no `nonStrikerId` field, so this
// only ever identifies the striker of the last ball, never the
// non-striker. A batter waiting at the non-striker's end will not show as
// "live" until a ball where they're on strike. Documented rather than
// worked around with a guess, per this project's "don't infer state from
// data that doesn't actually say it" rule.
//
// A live match with an empty `balls` array (some of this mock dataset's
// live matches have none) honestly contributes nothing -- never a guess.
// ============================================================================

function lastBallOf(match: Match): Ball | undefined {
  const balls = match.innings.flatMap(i => i.balls);
  return balls.length > 0 ? balls[balls.length - 1] : undefined;
}

/** The set of PLAYERS-registry slugs currently batting or bowling, across
 * every match in `matches` whose status is "live". Matches with any other
 * status, or with no recorded balls yet, contribute nothing. */
export function getLiveActivePlayerIds(matches: Match[]): Set<string> {
  const ids = new Set<string>();
  for (const match of matches) {
    if (match.status !== "live") continue;
    const ball = lastBallOf(match);
    if (!ball) continue;
    if (ball.batterId) ids.add(resolvePlayerSlug(ball.batterId));
    if (ball.bowlerId) ids.add(resolvePlayerSlug(ball.bowlerId));
  }
  return ids;
}

export function isPlayerCurrentlyLive(playerId: string, matches: Match[]): boolean {
  return getLiveActivePlayerIds(matches).has(playerId);
}

/**
 * A stable, field-based signature for `matches` -- NOT the array/object
 * reference. Intended as a `useMemo` dependency, per the "depend on
 * specific fields, not object identity" replace-not-mutate contract
 * documented in ARCHITECTURE.md (established for useMatchAccentColors,
 * see DECISIONS-LOG.md v1.0.104-109). Changes if and only if a match's
 * status changes or a new ball is recorded (i.e. exactly the conditions
 * under which getLiveActivePlayerIds' result can change) -- so a caller
 * memoizing on this signature recomputes correctly on every relevant data
 * change instead of computing once and going stale.
 */
export function liveActivitySignature(matches: Match[]): string {
  return matches
    .map(m => {
      const ball = lastBallOf(m);
      return `${m.id}:${m.status}:${ball?.id ?? "none"}`;
    })
    .join("|");
}
