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

import type { Match, Innings, Ball, BattingEntry, BowlingEntry, MatchFormat, RetirementRecord } from "./types";
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
// may not even be reachable yet for a genuinely live match). A
// RETIREMENT (either variant) is the one exception to "derived purely
// from balls": it's read from the innings' separate `retirements`
// side-channel instead, gated by the same truncated-position honesty via
// `isRetirementVisible()` below -- see RetirementRecord in lib/types.ts
// for why it's never a ball to begin with.
// ============================================================================

// ── Retirement side-channel helpers (v1.0.134) ─────────────────────────────
// A RetirementRecord's `afterBallId` is a pointer into the innings' FULL
// ball log, not the (possibly truncated) slice being rendered right now --
// so "has this retirement actually happened yet at the current playback
// position" is its own small question, answered once here rather than
// reimplemented at each of this record's two consumers below
// (deriveBattingCardFromBalls and MatchView.tsx's truncatedMatch wickets
// count). `afterBallId` unset means "before this innings' first ball" --
// vanishingly rare in practice, but always immediately visible rather than
// crashing or hanging on a ball that will never appear.

/** Has `record` "happened yet" within the given (possibly truncated) ball slice? */
export function isRetirementVisible(record: RetirementRecord, balls: Ball[]): boolean {
  if (!record.afterBallId) return true;
  return balls.some(b => b.id === record.afterBallId);
}

/**
 * How many of `retirements` are BOTH the "retired -- out" variant (the
 * only kind that counts toward the innings' wicket tally -- "retired not
 * out" explicitly does not, same as real cricket) AND already visible
 * within `balls`. Used by MatchView.tsx's `truncatedMatch` to fold
 * retirement-out dismissals into its live wickets count, which is
 * otherwise purely `balls.filter(isWicket).length` -- correct for every
 * real delivery-based dismissal, but blind to a side-channel event by
 * construction (see RetirementRecord's doc comment in lib/types.ts for
 * why retirements never appear in `balls` at all).
 */
export function countWicketEquivalentRetirements(
  retirements: RetirementRecord[] | undefined,
  balls: Ball[]
): number {
  if (!retirements || retirements.length === 0) return 0;
  return retirements.filter(r => r.type === "retired-out" && isRetirementVisible(r, balls)).length;
}

/**
 * One batter identity per distinct `batterName` in `balls`, in order of
 * first appearance (i.e. batting order, since deliveries arrive
 * chronologically) -- every mutable stat field starts zeroed/false, the
 * same shape `deriveBattingCardFromBalls` below expects as input. This is
 * what lets that function build a card from ball-by-ball data ALONE, with
 * no separately-authored scorecard to supply identities -- the case a
 * real ingested feed is in (`lib/matchFeedAdapter.ts`'s `adaptInnings()`
 * has no scorecard endpoint, only events) and a from-scratch mock/test
 * fixture would be in too. `playerId` is taken from that first ball's
 * `batterId` -- purely informational here, since every downstream lookup
 * in `deriveBattingCardFromBalls` keys off `playerName`, never `playerId`.
 */
function deriveBatterIdentitiesFromBalls(balls: Ball[]): BattingEntry[] {
  // Reconciles a player whose balls are split across both an id-tagged
  // and a name-tagged record into ONE identity (matches on batterId OR
  // batterName -- see deriveBattingCardFromBalls's doc comment below for
  // the full rationale). This path only runs when there's no
  // originally-authored card to supply identities, so the balls' own id
  // and name fields are all there is to reconcile against.
  const identities: BattingEntry[] = [];
  for (const b of balls) {
    let entry = identities.find(e => e.playerId === b.batterId || e.playerName === b.batterName);
    if (!entry) {
      entry = { playerId: b.batterId, playerName: b.batterName, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, out: false };
      identities.push(entry);
    }
  }
  return identities;
}

/**
 * True if `id`/`name` (a Ball's batterId/batterName or bowlerId/
 * bowlerName, or a RetirementRecord's playerId/playerName) refers to the
 * same player as `entryId`/`entryName` (a card entry's playerId/
 * playerName) -- matching on EITHER field, not just one. See
 * `deriveBattingCardFromBalls`'s doc comment below for why a ball-to-card
 * join can't safely rely on just one of the two.
 */
export function samePlayer(id: string, name: string, entryId: string, entryName: string): boolean {
  return id === entryId || name === entryName;
}

/**
 * Appends a derived identity row for any ball-participant who has no
 * matching entry (via `samePlayer()`) anywhere in `originalCard` --
 * purely additive, never touches an existing entry's identity or stats.
 *
 * v1.0.158: a hand-authored card can be genuinely INCOMPLETE without any
 * name/id mismatch being involved at all -- `ind-eng-test-2026-d3-live`'s
 * innings 2 battingCard only lists England's top 8, omitting the tail
 * (S Broad, J Anderson, J Leach, M Wood), who nonetheless faced real,
 * recorded deliveries (22 runs, 156 balls) once the top order fell. No
 * join-key fix (id, name, or the id-or-name union above) can attribute
 * those runs to a row that doesn't exist -- they were silently dropped by
 * `baseCard.map()` below no matter how the join was keyed, before this
 * fix. This surfaced via the platform-wide run/wicket conservation sweep
 * (see DECISIONS-LOG.md), not from the original name-vs-id report -- it's
 * a distinct bug class (missing card rows, not mismatched join keys) that
 * happened to live in the same fixture and the same two functions.
 */
/**
 * Merges a hand-authored card (`original`) with a purely balls-derived
 * card (`pureDerived` -- computed with no originalCard, so every field
 * is fresh from balls alone), keeping every entry already in `original`
 * completely UNCHANGED and appending only the derived entries that don't
 * match any existing one via `samePlayer()`.
 *
 * v1.0.159: distinct from `withOrphanIdentities` above -- that helper
 * still lets `deriveBattingCardFromBalls`/`deriveBowlingCardFromBalls`
 * recompute an EXISTING entry's stats fresh from `balls` (correct for a
 * mid-innings live truncation, where "what does this look like right
 * now" must always come from the current ball slice). This helper never
 * does that: `MatchView.tsx`'s isComplete branch needs to add a missing
 * row (the ind-eng-test-2026-d3-live tail-order gap) WITHOUT risking a
 * second, unrelated gap in the same fixture -- two of its dismissals (C
 * Woakes, J Bairstow) are recorded on the hand-authored card with no
 * corresponding `isWicket` ball anywhere in the data, so a full
 * re-derivation silently turned both into "not out." Appending-only
 * can't hit that: an already-authored row is never touched, so its
 * out/dismissal/runs stay exactly as authored regardless of what the
 * balls alone would otherwise imply.
 */
export function appendMissingIdentities<T extends { playerId: string; playerName: string }>(
  original: T[],
  pureDerived: T[]
): T[] {
  const missing = pureDerived.filter(
    d => !original.some(o => samePlayer(d.playerId, d.playerName, o.playerId, o.playerName))
  );
  return missing.length > 0 ? [...original, ...missing] : original;
}

function withOrphanIdentities<T extends { playerId: string; playerName: string }>(
  originalCard: T[],
  balls: Ball[],
  getId: (b: Ball) => string,
  getName: (b: Ball) => string,
  make: (id: string, name: string) => T
): T[] {
  const extra: T[] = [];
  for (const b of balls) {
    const id = getId(b);
    const name = getName(b);
    const known =
      originalCard.some(e => samePlayer(id, name, e.playerId, e.playerName)) ||
      extra.some(e => samePlayer(id, name, e.playerId, e.playerName));
    if (!known) extra.push(make(id, name));
  }
  return extra.length > 0 ? [...originalCard, ...extra] : originalCard;
}

/**
 * Recompute one innings' battingCard from a (possibly truncated) ball
 * slice. `originalCard` supplies player identity/order only -- every
 * mutable field (runs, ballsFaced, fours, sixes, strikeRate, out,
 * dismissal, onStrike) is derived fresh from `balls`. `retirements` is the
 * innings' side-channel (see RetirementRecord in lib/types.ts) -- retired
 * players are derived from THIS, never from `balls`, since a retirement is
 * never a ball.
 *
 * `originalCard` is now OPTIONAL (defaults to `[]`) -- v1.0.146: when no
 * separately-authored card exists to supply identities (a real ingested
 * feed, or any from-scratch data with only ball-by-ball events), this
 * derives the identity list itself from `balls` via
 * `deriveBatterIdentitiesFromBalls` above, then runs the exact same
 * per-player math below either way. This is what makes this ONE function
 * usable both for MatchView.tsx's live mid-innings truncation (which
 * already has a real `originalCard` to pass) AND matchFeedAdapter.ts's
 * ingestion path for a COMPLETE innings (which never has one) -- see
 * ARCHITECTURE.md's "single derivation, two callers" note for the full
 * rationale for why this must not become two diverging implementations.
 *
 * v1.0.158: every ball-to-card join below matches via `samePlayer()` --
 * id OR name, not name alone (the original bug) and not id alone either.
 * A real incident (`ipl2026-m37-kkrvmi`'s hand-authored battingCard used
 * full names -- "Rinku Singh" -- while its balls used short names -- "R
 * Singh") showed pure name-matching silently zeroes out every stat for a
 * fixture the moment its naming is even slightly inconsistent, with no
 * error of any kind. Switching to pure id-matching looked like the fix
 * until a platform-wide audit (both directions, not just the known
 * failure) found the OPPOSITE case already live and working:
 * `ind-eng-test-2026-d3-live`'s battingCard/bowlingCard use real distinct
 * slug ids ("zcrwly", "jbumrah") that never match its balls' id fields at
 * all -- only the names line up -- and a few of its players (H Brook, B
 * Stokes, J Bairstow, B Duckett) have their OWN balls split across both
 * conventions within the same innings, a pre-existing data inconsistency
 * already documented in Scorecard.tsx's `getBatterBalls` (v1.0.144, same
 * root cause, same match). Neither id-only nor name-only is safe as the
 * SOLE key platform-wide -- this function (like `getBatterBalls`) treats
 * a ball as belonging to a card entry if EITHER field matches, which is
 * the only join that's correct for every fixture found so far and is
 * inherently robust to either kind of inconsistency a future fixture (or
 * a real provider feed with its own naming quirks) might introduce.
 */
export function deriveBattingCardFromBalls(
  balls: Ball[],
  originalCard: BattingEntry[] = [],
  retirements: RetirementRecord[] = []
): BattingEntry[] {
  const lastBall = balls.length > 0 ? balls[balls.length - 1] : undefined;
  const baseCard = originalCard.length > 0
    ? withOrphanIdentities<BattingEntry>(originalCard, balls, b => b.batterId, b => b.batterName, (id, name) => ({
        playerId: id, playerName: name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, out: false,
      }))
    : deriveBatterIdentitiesFromBalls(balls);

  return baseCard.map(entry => {
    const playerBalls = balls.filter(b => samePlayer(b.batterId, b.batterName, entry.playerId, entry.playerName));
    const ballsFaced = playerBalls.filter(b => b.extraType !== "wd").length;
    const runs = playerBalls.reduce((s, b) => s + b.runs, 0);
    const fours = playerBalls.filter(b => b.isBoundary4).length;
    const sixes = playerBalls.filter(b => b.isBoundary6).length;
    const wicketBall = playerBalls.find(b => b.isWicket);
    const out = !!wicketBall;

    // Only meaningful when the player isn't already genuinely out some
    // other way, and only once the retirement has actually happened at
    // this playback position (isRetirementVisible) -- a retirement
    // scheduled for later in the innings must not retroactively apply to
    // an earlier scrub position.
    const retirement = !out
      ? retirements.find(r => samePlayer(r.playerId, r.playerName, entry.playerId, entry.playerName) && isRetirementVisible(r, balls))
      : undefined;
    const retiredNotOut = retirement?.type === "retired-not-out";
    const retiredOut = retirement?.type === "retired-out";
    // "retired -- out" IS a genuine dismissal (counts toward the innings'
    // wicket tally, per countWicketEquivalentRetirements above) even
    // though it credits no bowler -- so `out` folds it in here.
    const finalOut = out || retiredOut;

    const strikeRate = ballsFaced > 0 ? Math.round((runs / ballsFaced) * 10000) / 100 : 0;
    // A retired player (either variant) has left the crease just as
    // surely as a dismissed one -- never still "on strike" even if their
    // own last ball happens to be the innings' most recent so far.
    const onStrike = !!lastBall && samePlayer(lastBall.batterId, lastBall.batterName, entry.playerId, entry.playerName) && !retirement;

    // Prefer the original card's hand-authored dismissal text (e.g. "c
    // Dhoni b Jadeja") when it's actually consistent with this player
    // being out here -- the richer fielder/bowler description isn't
    // reconstructable from a Ball alone. Falls back to a generic
    // dismissalType-based string so a real-data feed with a genuinely
    // out player but no matching original-card text still shows
    // something sensible rather than nothing. Each retirement variant
    // gets its own distinct label so neither is ever confusable with
    // plain "not out" or a normal dismissal -- see Scorecard.tsx
    // BatterRow (retiredOut reuses the same render branch as a genuine
    // wicket, since `out` is true for it too; retiredNotOut gets its own
    // branch, since `out` stays false for it).
    const dismissal = out
      ? entry.out
        ? entry.dismissal
        : wicketBall?.dismissalType ?? "out"
      : retiredOut
        ? "Retired out"
        : retiredNotOut
          ? "Retired"
          : undefined;

    return {
      ...entry,
      runs,
      ballsFaced,
      fours,
      sixes,
      strikeRate,
      out: finalOut,
      retiredNotOut,
      retiredOut,
      dismissal,
      onStrike,
    };
  });
}

/**
 * Bowler-side equivalent of `deriveBatterIdentitiesFromBalls` above --
 * one identity per distinct `bowlerName` in `balls`, in order of first
 * appearance (i.e. bowling order), all stat fields zeroed. Same
 * rationale: lets `deriveBowlingCardFromBalls` build a card from
 * ball-by-ball data alone when no separately-authored card exists to
 * supply identities.
 */
function deriveBowlerIdentitiesFromBalls(balls: Ball[]): BowlingEntry[] {
  // Reconciles a bowler whose balls are split across both an id-tagged
  // and a name-tagged record into ONE identity -- same rationale as
  // deriveBatterIdentitiesFromBalls above.
  const identities: BowlingEntry[] = [];
  for (const b of balls) {
    let entry = identities.find(e => e.playerId === b.bowlerId || e.playerName === b.bowlerName);
    if (!entry) {
      entry = { playerId: b.bowlerId, playerName: b.bowlerName, oversBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, economy: 0 };
      identities.push(entry);
    }
  }
  return identities;
}

/**
 * Recompute one innings' bowlingCard from a (possibly truncated) ball
 * slice, same contract as `deriveBattingCardFromBalls` above.
 * `oversBowled` is reported in cricket notation (e.g. `1.4` = 1 over + 4
 * balls), matching every hand-authored fixture value already in
 * lib/mockData.ts -- NOT a true decimal fraction of an over.
 *
 * `originalCard` is now OPTIONAL (defaults to `[]`) -- v1.0.146, same
 * reasoning and same single-function-two-callers contract as
 * `deriveBattingCardFromBalls` above.
 *
 * v1.0.158: joins via `samePlayer()` (bowlerId/playerId OR bowlerName/
 * playerName) -- same fix, same rationale, as `deriveBattingCardFromBalls`
 * above (see its doc comment for the full incident writeup, including why
 * a pure id-only join is not safe platform-wide either).
 */
export function deriveBowlingCardFromBalls(
  balls: Ball[],
  originalCard: BowlingEntry[] = [],
  format: MatchFormat
): BowlingEntry[] {
  const bps = ballsPerSet(format);
  const baseCard = originalCard.length > 0
    ? withOrphanIdentities<BowlingEntry>(originalCard, balls, b => b.bowlerId, b => b.bowlerName, (id, name) => ({
        playerId: id, playerName: name, oversBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, economy: 0,
      }))
    : deriveBowlerIdentitiesFromBalls(balls);

  return baseCard.map(entry => {
    const bowlerBalls = balls.filter(b => samePlayer(b.bowlerId, b.bowlerName, entry.playerId, entry.playerName));
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
