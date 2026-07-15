import type { Match } from "./types";
import { totalBallsFor } from "./formatUtils";

// ============================================================================
// Homepage hero-match selection — v1.0.62
// ============================================================================
// Picks the SINGLE live match featured as the homepage's hero card when
// multiple matches are live at once. This is a GLOBAL, one-per-homepage
// selection — the same for every visitor regardless of what they follow.
// It is deliberately NOT personalized: "for you" (lib/followPrefs.ts) is a
// completely separate, per-user selection that runs AFTER this one and
// explicitly excludes whatever this function picks (see forYouSelection in
// app/page.tsx), so the two features never surface the same match twice.
//
// With real-time data, multiple simultaneous live matches will be the
// everyday case, not an edge case — this previously fell to an ad hoc
// "popularity" sort (hardcoded per-competition/per-team point values, e.g.
// IPL scored higher than an international bilateral series purely because
// its point value happened to be set higher) with no real rule behind it.
// Replaced with an explicit, three-tier, fully deterministic decision:
//
//   1. PROMINENCE  — an explicit competition-type + stage hierarchy (see
//      matchProminenceTier). International tournaments outrank bilateral
//      series outrank domestic leagues; a marquee stage (final/semifinal/
//      qualifier/decider) bumps any of those up one notch, so e.g. a
//      league final can rival an ordinary bilateral series match.
//   2. LIVE STAKES  — ties within a prominence tier are broken using the
//      same methodology as the Spotlight feature's "milestone" pillar
//      (lib/spotlight.ts), adapted to a match that's still IN PROGRESS: an
//      individual-innings milestone already reached so far, not a final
//      result, which doesn't exist yet for a live match. Spotlight's other
//      two pillars don't transfer here: "close finish" needs a final
//      margin that doesn't exist yet, and "context stakes" (knockout/
//      decider) is already folded into tier 1 above, not reapplied.
//   3. LIVE RUNWAY  — final, fully deterministic tiebreak: whichever match
//      has more of its format's capacity left to play (a Test on its 2nd
//      of up to 4 innings dwarfs a T20 already in its 2nd of 2 innings),
//      then whichever started most recently if that still ties. Never
//      random — the same live snapshot always produces the same hero.
// ============================================================================

const MARQUEE_STAGE_RE = /final|semifinal|qualifier/i;
const MARQUEE_BADGE_RE = /decider|\bfinal\b|playoff|qualifier|semi|champion/i;

function isMarqueeStage(m: Match): boolean {
  if (m.phase && MARQUEE_STAGE_RE.test(m.phase)) return true;
  if (m.highlightBadge && MARQUEE_BADGE_RE.test(m.highlightBadge)) return true;
  if (m.seriesStatus && /decid/i.test(m.seriesStatus)) return true;
  return false;
}

/**
 * Tier 1: explicit prominence hierarchy. Deliberately does NOT weigh one
 * format against another, or one bilateral series against another — that
 * granularity belongs to tiers 2/3, not this one. Scale:
 *   4 = marquee international tournament fixture (ICC final/semi/qualifier)
 *   3 = ordinary international tournament match, OR a marquee bilateral
 *       series fixture (a series decider)
 *   2 = ordinary bilateral series match, OR a marquee league/domestic
 *       fixture (a league final)
 *   1 = ordinary league/domestic group-stage match
 * The gaps are deliberately wide enough that no lower-tier match can ever
 * cross a boundary above it purely via the marquee-stage bump.
 */
function matchProminenceTier(m: Match): number {
  const base =
    m.competition.type === "international" ? 3 :
    m.competition.type === "bilateral" ? 2 :
    1; // "league" | "domestic"
  return isMarqueeStage(m) ? base + 1 : base;
}

/**
 * Tier 2 tiebreak: reuses Spotlight's "milestone" thresholds (a century in
 * a limited-overs innings, 150+ in a Test innings, a 5-wicket haul) against
 * whatever has actually happened in the match SO FAR. Counts every
 * milestone reached rather than stopping at the first, so a match with two
 * centuries in progress outranks a match with one.
 */
function liveMilestoneScore(m: Match): number {
  const isLimitedOvers = m.format !== "Test";
  let score = 0;
  for (const inn of m.innings ?? []) {
    for (const b of inn.battingCard ?? []) {
      if (isLimitedOvers ? b.runs >= 100 : b.runs >= 150) score += 1;
    }
    for (const b of inn.bowlingCard ?? []) {
      if (b.wickets >= 5) score += 1;
    }
  }
  return score;
}

/**
 * Tier 3 tiebreak: how much live runway plausibly remains. A deliberately
 * simple, deterministic proxy — full per-innings ball capacity for the
 * format (lib/formatUtils.totalBallsFor already encodes that a Test dwarfs
 * a T20/ODI/Hundred) times how many innings, including the one currently in
 * progress, plausibly remain — rather than parsing exact ball-by-ball
 * state, which isn't needed for a last-resort tiebreak.
 */
function estimatedLiveRunway(m: Match): number {
  const perInnings = totalBallsFor(m.format);
  const maxInnings = m.format === "Test" ? 4 : 2;
  const inningsRemaining = Math.max(1, maxInnings - m.innings.length + 1);
  return perInnings * inningsRemaining;
}

/**
 * Selects the single hero match from every currently-live match, per the
 * three-tier rule above. Returns undefined if nothing is live.
 *
 * This is a GLOBAL selection — always pass every live match, never a
 * per-user filtered list. "for you" (lib/followPrefs.ts) is the
 * personalized layer; it runs separately and excludes whatever this
 * returns, never the other way around.
 */
export function selectHeroMatch(liveMatches: Match[]): Match | undefined {
  if (liveMatches.length === 0) return undefined;
  if (liveMatches.length === 1) return liveMatches[0];

  return [...liveMatches].sort((a, b) => {
    const tierDiff = matchProminenceTier(b) - matchProminenceTier(a);
    if (tierDiff !== 0) return tierDiff;

    const stakesDiff = liveMilestoneScore(b) - liveMilestoneScore(a);
    if (stakesDiff !== 0) return stakesDiff;

    const runwayDiff = estimatedLiveRunway(b) - estimatedLiveRunway(a);
    if (runwayDiff !== 0) return runwayDiff;

    // Final deterministic tiebreak: most recently started wins. String
    // comparison on ISO timestamps sorts correctly and is trivially
    // deterministic — ties here would require identical-to-the-second
    // start times, at which point either is a defensible pick.
    return b.startTimeIso.localeCompare(a.startTimeIso);
  })[0];
}
