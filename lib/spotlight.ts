import type { Match } from "./types";

// ============================================================================
// Spotlight-worthiness — v1.0.49
// ============================================================================
// Deliberately a DIFFERENT, much stricter bar than the excitement-glow
// number used elsewhere in the app. That field is either hand-typed
// editorial fluff in mockData.ts, or — for infinite-scroll-generated
// matches — literally `3 + random(0,8)` with zero relationship to what
// actually happened in the match. ~43% of generated matches clear
// "excitement >= 8" by pure chance, so it can't be reused for a homepage
// feature that's supposed to mean "rare and special."
//
// Spotlight instead requires a match to hit at least ONE explicit, concrete
// condition outright — not accumulate points toward a composite score:
//
//   1. CLOSE FINISH   — margin <=6 runs, <=1 wicket, or a last-ball /
//                        last-over / super-over / tie described in the
//                        summary text.
//   2. MILESTONE      — an individual century in a limited-overs innings, a
//                        150+ in a Test innings, a 5-wicket haul, or an
//                        explicit hat-trick/record mentioned in the summary.
//   3. CONTEXT STAKES — a genuine knockout/decider: tournament final,
//                        playoff, qualifier, semifinal, or series decider.
//                        Deliberately excludes generic "rivalry" or
//                        "table-topper" framing — those recur too often
//                        across a season to read as rare.
//
// Generated (infinite-scroll) matches can never satisfy any of these — they
// carry no battingCard/bowlingCard detail and no stakes-matching badge — so
// the spotlight pool stays small and fixed; it doesn't dilute as more
// matches load in.
// ============================================================================

function hasCloseFinish(match: Match): boolean {
  const margin = match.result?.margin ?? "";
  const runsMatch = margin.match(/by (\d+) runs?/);
  const wktsMatch = margin.match(/by (\d+) wickets?/);
  if (runsMatch && parseInt(runsMatch[1], 10) <= 6) return true;
  if (wktsMatch && parseInt(wktsMatch[1], 10) <= 1) return true;
  const s = (match.summary ?? "").toLowerCase();
  return /last[- ]?ball|last[- ]?over|super over|\btie\b/.test(s);
}

function hasMilestone(match: Match): boolean {
  const isLimitedOvers = match.format !== "Test";
  for (const inn of match.innings ?? []) {
    for (const b of inn.battingCard ?? []) {
      if (isLimitedOvers && b.runs >= 100) return true;
      if (!isLimitedOvers && b.runs >= 150) return true;
    }
    for (const b of inn.bowlingCard ?? []) {
      if (b.wickets >= 5) return true;
    }
  }
  const s = (match.summary ?? "").toLowerCase();
  return /hat-trick|\brecord\b/.test(s);
}

function hasContextStakes(match: Match): boolean {
  const badge = (match.highlightBadge ?? "").toLowerCase();
  if (/decider|\bfinal\b|playoff|qualifier|semi|champion/.test(badge)) return true;
  if (match.phase && /final|semifinal|qualifier/.test(match.phase)) return true;
  if (match.seriesStatus && /decid/i.test(match.seriesStatus)) return true;
  return false;
}

/** True if a match clears the (deliberately rare) homepage spotlight bar. */
export function isSpotlightMatch(match: Match): boolean {
  return hasCloseFinish(match) || hasMilestone(match) || hasContextStakes(match);
}
