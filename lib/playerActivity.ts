import type { Match } from "./types";
import { resolvePlayerSlug } from "./mockData";
import { getCurrentInnings } from "./matchStatus";

// ============================================================================
// "Currently live" player detection — v1.0.125, root-cause-fixed v1.0.126
// ============================================================================
// Built for the homepage "Your Players" strip's sort order (favourited-and-
// live ranks first, not-favourited-and-live next).
//
// v1.0.125 originally answered a narrower question: "is this player the
// striker or bowler of the single most recently recorded ball, across ALL
// of a match's innings flattened together." That broke for a genuinely
// live Test match with an enforced follow-on (`ind-eng-test-2026-d3-live`,
// ENG vs IND) -- confirmed via live testing: B Stokes, who played a real
// part in the currently in-progress follow-on innings, never showed as
// live, while J Bumrah (in the same match, and in an unrelated live T20I)
// correctly did. Root cause: `match.innings.flatMap(i => i.balls)` picks
// the innings that happens to be LAST when every innings' balls are
// concatenated together -- which is the right INNINGS, but reading only
// its single final ball narrows the result down to at most 2 players (the
// literal striker + bowler of that one delivery), silently dropping
// everyone else who has genuinely played a part in that same currently-
// active innings. This is the exact same class of bug already fixed once
// for components/ScoreBar.tsx (v1.0.122, follow-on header-attribution) --
// this file had its own, separately-derived notion of "which innings
// counts as current" instead of reusing that one, and that duplication is
// what let the two silently diverge.
//
// Root-cause fix (v1.0.126): reuse `getCurrentInnings(match)`
// (lib/matchStatus.ts) -- the SAME team/innings-linked lookup ScoreBar.tsx
// uses for its own "which team is currently batting" determination -- as
// the ONE place both files ask "which innings is current." Within that
// innings, EVERY player with a `battingCard` or `bowlingCard` entry counts
// as "currently involved in this live match's active innings" -- not just
// the two participants of its literal final ball. A player already
// dismissed earlier in the SAME still-in-progress innings (like Stokes,
// out for 4 on the follow-on) has genuinely played a part in today's live
// action; a player who hasn't appeared in this innings at all has not.
//
// Explicitly still NOT reading Innings.battingCard/bowlingCard for a match
// whose OVERALL `status` field is permanently stuck at "live" long after
// it actually finished (FEATURED_MATCH, by deliberate mock-data design --
// see lib/mockData.ts and DECISIONS-LOG.md v1.0.124) -- that match's
// `status` check (`=== "live"`) is unconditionally trusted here, same as
// everywhere else in this codebase; this file's job is answering "who's
// involved in the CURRENT innings of a match the rest of the app already
// treats as live," not re-deriving whether the match itself has actually
// finished (lib/matchStatus.ts's isMatchConclusivelyOver already owns that
// separate question, for a different feature). In real data, a match's
// `status` stops being "live" the moment it actually ends -- this mock-
// data-only quirk (a match kept "live" forever for carousel purposes) is a
// pre-existing, already-documented exception, not something this file
// introduces or needs to work around further.
//
// Guard: an innings that hasn't genuinely started yet (`balls.length ===
// 0`) is never trusted for this, even if it already carries a pre-
// authored placeholder battingCard/bowlingCard (this mock dataset has
// exactly that shape for some matches' first innings) -- no guessing from
// data that hasn't actually happened, same discipline as v1.0.125.
//
// batterId/bowlerId/playerId values in this mock dataset are NOT reliably
// PLAYERS-registry slugs (e.g. "dwarner", "B Duckett", "bstokes" all
// appear against registry keys like "v-kohli"/"b-stokes") --
// resolvePlayerSlug() is the SAME reconciliation already used by
// lib/playerForm.ts for battingCard/bowlingCard playerIds, reused here
// rather than re-invented.
// ============================================================================

/** The set of PLAYERS-registry slugs currently batting or bowling in the
 * active innings of every match in `matches` whose status is "live". A
 * match with no innings, or whose current innings has no recorded balls
 * yet, contributes nothing -- never a guess. */
export function getLiveActivePlayerIds(matches: Match[]): Set<string> {
  const ids = new Set<string>();
  for (const match of matches) {
    if (match.status !== "live") continue;
    const current = getCurrentInnings(match);
    if (!current || current.balls.length === 0) continue;
    for (const entry of current.battingCard) ids.add(resolvePlayerSlug(entry.playerId));
    for (const entry of current.bowlingCard) ids.add(resolvePlayerSlug(entry.playerId));
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
 * status changes, its current innings changes, or that innings' batting/
 * bowling card contents change (a new player debuts into the card, an
 * existing entry's `out`/`runs`/`oversBowled` updates) -- i.e. exactly the
 * conditions under which getLiveActivePlayerIds' result can change -- so a
 * caller memoizing on this signature recomputes correctly on every
 * relevant data change instead of computing once and going stale.
 */
export function liveActivitySignature(matches: Match[]): string {
  return matches
    .map(m => {
      const current = getCurrentInnings(m);
      if (!current || current.balls.length === 0) return `${m.id}:${m.status}:none`;
      const bat = current.battingCard.map(b => `${b.playerId}:${b.out}:${b.runs}`).join(",");
      const bowl = current.bowlingCard.map(b => `${b.playerId}:${b.oversBowled}`).join(",");
      return `${m.id}:${m.status}:${current.number}:${bat}:${bowl}`;
    })
    .join("|");
}
