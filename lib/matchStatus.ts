// ============================================================================
// Match/innings completion — the ONE shared "is this actually over" check
// ============================================================================
// v1.0.124: extracted after a real bug where the Digest tab's match-summary
// card showed a "FULL TIME / [Team] won by X wickets" verdict for
// ipl2026-m37-kkrvmi (MI vs KKR) while that match's chase was genuinely
// still in progress (KKR needing runs, per the LIVE tab, at the exact same
// moment). Root cause lived in components/MatchView.tsx's `truncatedMatch`:
// it correctly truncated `innings` to the current simulated live-playback
// position, but spread `result` through from the untouched original match
// object unconditionally — so a match kept at `status: "live"` forever
// with a permanently-baked-in final `result` (FEATURED_MATCH, by
// deliberate design — see lib/mockData.ts — so it stays in the homepage's
// live carousel) always looked "concluded" to any downstream reader of
// `result`, regardless of how far playback had actually progressed. That
// leak is fixed at its source (MatchView.tsx now withholds `result` from
// the truncated snapshot until playback has genuinely caught up to the
// real end of the recorded ball data) — this file is the other half: the
// ONE function every completion-dependent narrative platform-wide should
// call, rather than each independently re-deriving "is this over" from
// current score/wickets/overs state (which is exactly how the two halves
// of that one card disagreed with each other: the header trusted the
// leaked `result`, the narrative text below it correctly read the
// truncated, still-in-progress score).
// ============================================================================

import type { Match, Innings } from "./types";
import { ballsPerSet } from "./formatUtils";
import { totalBallsForFormat } from "./winProb";

// ----------------------------------------------------------------------------
// Current innings — shared team/innings-linked lookup (v1.0.126)
// ----------------------------------------------------------------------------
// Extracted after a real bug: the homepage "Your Players" strip's live-
// player detection (lib/playerActivity.ts) reimplemented its own idea of
// "which innings is current" instead of reusing this exact one, and that
// duplication is what let it silently diverge -- see DECISIONS-LOG.md
// v1.0.126 for the full story. `getCurrentInnings` below is now the ONE
// place that answers "which innings is currently in progress (or most
// recently started)" -- components/ScoreBar.tsx's `lastInn` (used to
// decide which team is CURRENTLY batting for the header's highlight
// state) and lib/playerActivity.ts's live-player detection both call this
// same function, rather than each keeping their own copy of the
// "last innings in array" convention.
//
// Deliberately "last in array," never filtered/derived by battingTeam or
// any other attribute: that positional convention was proven safe for
// "which innings is current" specifically (as opposed to "which score
// goes in team A's slot vs team B's slot," which IS broken by a follow-on
// -- see ScoreBar.tsx's `lastInnA`/`lastInnB`, a different, complementary
// concept) back when the v1.0.122 header-attribution bug was fixed: a
// follow-on changes which team bats twice, but never changes the fact
// that the LAST innings appended to the array is chronologically the most
// recent one, regardless of which team it belongs to. Works identically
// for a single-innings white-ball match, a normal 4-innings Test, and a
// Test with a follow-on in progress.
//
// No "has this innings actually started" guard here on purpose -- ScoreBar
// needs an answer even for an innings with zero balls yet (e.g. "team B is
// about to bat," rendered as the batting-highlight state before the first
// ball). Callers that need to additionally confirm real ball-level
// evidence before trusting an innings' aggregate fields (e.g.
// battingCard/bowlingCard) -- because a not-yet-started innings can still
// carry a pre-authored placeholder card -- add that check themselves (see
// lib/playerActivity.ts's `current.balls.length > 0` guard).
export function getCurrentInnings(match: Match): Innings | undefined {
  return match.innings[match.innings.length - 1];
}

/**
 * The one authoritative "has this match genuinely concluded" signal.
 * `match.result` being populated IS that signal, for both mock and real
 * data: a real feed only ever populates `result` once a match has
 * actually finished. The one place in this codebase that simulates a
 * live, ticking view of match state (MatchView.tsx's `truncatedMatch`) is
 * responsible for withholding `result` from that simulated snapshot until
 * playback has genuinely reached the real end of the recorded data — see
 * the comment there. Every other consumer (Digest's match-summary card,
 * Schedule's "Last: X won by Y" line, any moment/summary card, etc.)
 * should call this instead of independently inferring completion from
 * score/wickets/overs state.
 */
export function isMatchConcluded(match: Match): boolean {
  return match.result != null;
}

/**
 * Defense-in-depth cross-check, used alongside `isMatchConcluded` before
 * trusting `result` for the actual "show FULL TIME" decision: independent
 * of whatever `result` claims, does the CURRENTLY OBSERVABLE innings state
 * (not the `result` field itself) actually show a genuine conclusion —
 * the chasing team's runs have reached the target, OR the chasing team is
 * genuinely all out, OR its overs allocation is genuinely exhausted?
 *
 * Deliberately conservative and narrow, mirroring
 * `deriveMinimalMatchResult` (components/DigestTab.tsx) for the same
 * reason: returns true ("no opinion, can't rule it out") for anything
 * this isn't scoped to check — Test matches, and any match without
 * exactly two recorded innings — since draws, ties, follow-on wins,
 * declarations, and "hasn't reached its final innings yet" aren't safely
 * verifiable from the scoreline alone. Only returns false for the one
 * case it CAN safely rule out: a normal two-innings limited-overs match
 * whose visible current state plainly hasn't reached any of the three
 * genuine end conditions yet, regardless of what `result` says.
 */
export function observableStateSupportsConclusion(match: Match): boolean {
  if (match.format === "Test") return true;
  if (match.innings.length !== 2) return true;
  const [inn1, inn2] = match.innings;
  if (typeof inn1?.runs !== "number" || typeof inn2?.runs !== "number") return true;

  const target = inn1.runs + 1;
  const targetReached = inn2.runs >= target;
  const allOut = inn2.wickets >= 10;

  const totalBalls = totalBallsForFormat(match);
  const ballsBowled = Math.round((inn2.overs ?? 0) * ballsPerSet(match.format));
  const oversExhausted = ballsBowled >= totalBalls;

  return targetReached || allOut || oversExhausted;
}

/**
 * The combined check callers should actually gate a "FULL TIME"/"won by
 * X" verdict on: `result` is present AND the observable state backs it
 * up. Splitting the two checks above out individually (rather than only
 * exporting this) keeps each independently testable and lets a caller
 * that only cares about one half (e.g. Schedule's `hasUsableResult`,
 * which already gates on `match.status` before ever reaching this file)
 * use just that half.
 */
export function isMatchConclusivelyOver(match: Match): boolean {
  return isMatchConcluded(match) && observableStateSupportsConclusion(match);
}
