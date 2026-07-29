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

import type { Match, Innings, Ball, BattingEntry, BowlingEntry, MatchFormat } from "./types";
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

// ============================================================================
// Per-player card derivation from a truncated ball list (v1.0.131)
// ============================================================================
// v1.0.131: extracted after a real bug where MatchView.tsx's `truncatedMatch`
// memo correctly recomputed an innings' `runs`/`wickets`/`overs` for the
// current ball-by-ball scrub position, but spread `battingCard`/`bowlingCard`
// through completely unchanged from the original, untouched innings object
// -- so any consumer reading a player's card entry (MiniInsightsBar's
// striker/bowler header chips, Scorecard's full table -- both receive
// `truncatedMatch`) always showed that player's END-OF-INNINGS totals,
// regardless of how far playback had actually progressed. A batter who
// gets out ball 90 of 120 would show "out" in the header the moment
// playback reached ball 1, and a batter who finishes not-out at 5(8) would
// keep showing exactly "5(8)" even while genuinely on strike mid-innings
// at, say, 2(3) -- the exact mismatch that exposed this (a wicket ball for
// R Pant while the header still showed his frozen not-out final score).
//
// These two functions are the fix: given a truncated ball slice (the exact
// same slice `truncatedMatch` already computes `runs`/`wickets`/`overs`
// from) plus the innings' original card as a scaffold (for player identity/
// ordering -- WHO batted/bowled this innings is a real fact that doesn't
// change with playback position, only THEIR STATS AT THIS POINT do), derive
// every mutable per-player field fresh from the same ball slice. One
// source of truth, no partial recompute: `truncatedMatch` must call both
// of these any time it truncates `balls`, never spread the original cards
// through on their own.
//
// Deliberately conservative about what counts as "faced": a wide never
// counts as a ball faced (matches lib/events.ts's `isFaced` convention,
// the other place ball-by-ball batting stats are independently derived --
// see that file's header) but a no-ball does, since the striker can
// legally score off it. `out`/`dismissal` are derived purely from whether
// THIS player's own ball carries `isWicket: true` within the truncated
// slice -- never borrowed from the original card's `out` flag, since that
// flag describes the END of the innings, which may not have happened yet
// at this playback position (and, per the real-data-readiness note below,
// may not even be reachable yet for a genuinely live match).
// ============================================================================

/**
 * Recompute one innings' battingCard from a (possibly truncated) ball
 * slice. `originalCard` supplies player identity/order only -- every
 * mutable field (runs, ballsFaced, fours, sixes, strikeRate, out,
 * dismissal, onStrike) is derived fresh from `balls`.
 */
export function deriveBattingCardFromBalls(
  balls: Ball[],
  originalCard: BattingEntry[]
): BattingEntry[] {
  const lastBall = balls.length > 0 ? balls[balls.length - 1] : undefined;

  return originalCard.map(entry => {
    const playerBalls = balls.filter(b => b.batterName === entry.playerName);
    const ballsFaced = playerBalls.filter(b => b.extraType !== "wd").length;
    const runs = playerBalls.reduce((s, b) => s + b.runs, 0);
    const fours = playerBalls.filter(b => b.isBoundary4).length;
    const sixes = playerBalls.filter(b => b.isBoundary6).length;
    const wicketBall = playerBalls.find(b => b.isWicket);
    const out = !!wicketBall;
    const strikeRate = ballsFaced > 0 ? Math.round((runs / ballsFaced) * 10000) / 100 : 0;
    const onStrike = !!lastBall && lastBall.batterName === entry.playerName;

    // Prefer the original card's hand-authored dismissal text (e.g. "c
    // Dhoni b Jadeja") when it's actually consistent with this player
    // being out here -- the richer fielder/bowler description isn't
    // reconstructable from a Ball alone. Falls back to a generic
    // dismissalType-based string so a real-data feed with a genuinely
    // out player but no matching original-card text still shows
    // something sensible rather than nothing.
    const dismissal = out
      ? entry.out
        ? entry.dismissal
        : wicketBall?.dismissalType ?? "out"
      : undefined;

    return {
      ...entry,
      runs,
      ballsFaced,
      fours,
      sixes,
      strikeRate,
      out,
      dismissal,
      onStrike,
    };
  });
}

/**
 * Recompute one innings' bowlingCard from a (possibly truncated) ball
 * slice, same contract as `deriveBattingCardFromBalls` above.
 * `oversBowled` is reported in cricket notation (e.g. `1.4` = 1 over + 4
 * balls), matching every hand-authored fixture value already in
 * lib/mockData.ts -- NOT a true decimal fraction of an over.
 */
export function deriveBowlingCardFromBalls(
  balls: Ball[],
  originalCard: BowlingEntry[],
  format: MatchFormat
): BowlingEntry[] {
  const bps = ballsPerSet(format);

  return originalCard.map(entry => {
    const bowlerBalls = balls.filter(b => b.bowlerName === entry.playerName);
    const legalBalls = bowlerBalls.filter(b => b.extraType !== "wd" && b.extraType !== "nb");
    const completedOvers = Math.floor(legalBalls.length / bps);
    const ballsIntoOver = legalBalls.length % bps;
    const oversBowled = completedOvers + ballsIntoOver / 10;
    const runsConceded = bowlerBalls.reduce((s, b) => s + b.runs + b.extras, 0);
    const wickets = bowlerBalls.filter(b => b.isWicket && b.dismissalType !== "run-out").length;
    const trueOvers = legalBalls.length / bps;
    const economy = trueOvers > 0 ? Math.round((runsConceded / trueOvers) * 100) / 100 : 0;

    // Maidens: group this bowler's legal balls by over number; a maiden is
    // a full (bps-ball) over of theirs with zero runs conceded off it.
    const oversMap = new Map<number, Ball[]>();
    for (const b of legalBalls) {
      const arr = oversMap.get(b.over) ?? [];
      arr.push(b);
      oversMap.set(b.over, arr);
    }
    let maidens = 0;
    for (const overBalls of oversMap.values()) {
      if (overBalls.length === bps && overBalls.reduce((s, b) => s + b.runs + b.extras, 0) === 0) {
        maidens++;
      }
    }

    return {
      ...entry,
      oversBowled: Math.round(oversBowled * 10) / 10,
      maidens,
      runsConceded,
      wickets,
      economy,
    };
  });
}

// ============================================================================
// Mock-simulation ticker gate (v1.0.131)
// ============================================================================
// The ONE decision point for "should MatchView.tsx's demo-only liveBallIdx
// auto-advance/rewind ticker run right now" -- pulled out to a plain,
// dependency-free function (rather than inlined directly in the effect's
// guard clause) specifically so it's directly unit-testable without needing
// to mount MatchView's full component tree. See match.isMockSimulation's
// doc comment in lib/types.ts for the full real-data-readiness rationale;
// in short, a real live feed never needs this ticker (it reports current
// state and has nothing further to report once it does), so this must
// default to false and only run for fixtures that explicitly opt in.
export function shouldRunMockSimulationTicker(match: Match, isLiveFollowing: boolean): boolean {
  return isLiveFollowing && match.isMockSimulation === true;
}
