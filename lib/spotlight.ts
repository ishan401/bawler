import type { Match, Team } from "./types";
import { getTeamMembershipStatus } from "./teamData";

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
//
// COMPETITION-TIER GATE (v1.0.103) — added ahead of the three checks above,
// which are otherwise untouched. League/domestic competitions (IPL, BBL,
// PSL, CPL, The Hundred, SA20, MLC, etc.) are unrestricted -- any match
// there goes straight to the three excitement checks, same as always.
// International/bilateral matches additionally require BOTH teams to be
// full ICC members (via the getTeamMembershipStatus() adapter -- see
// lib/teamData.ts and ARCHITECTURE.md) before the excitement checks even
// run. An associate nation having a dramatic finish is still a real,
// notable story for that nation's own fans, but it isn't the same "rare
// enough to interrupt the homepage" signal a Full Member upset or thriller
// is -- Full Member cricket is what most of this app's audience follows,
// and Spotlight is deliberately meant to stay small (see SPOTLIGHT_MAX).
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

/**
 * True if a team is a full ICC member -- the membership-tier half of the
 * Spotlight gate. Callers build this once, upfront, via
 * buildFullMemberLookup() below (NOT per-match/per-call), since
 * getTeamMembershipStatus() is async and isSpotlightMatch() itself must stay
 * synchronous to run inside a plain Array.filter().
 */
export type FullMemberLookup = (team: Team) => boolean;

/**
 * Resolves the full-member/associate status for every team that actually
 * appears in `matches`, ONE TIME, via the sanctioned getTeamMembershipStatus()
 * interface (lib/teamData.ts) -- never by reading team.membershipStatus
 * directly. Dedupes by team code first so a team appearing in dozens of
 * matches is only resolved once, not once per match.
 *
 * Returns a plain synchronous lookup function, so the actual per-match
 * filtering pass (isSpotlightMatch, called from inside Array.filter) never
 * needs to await anything itself.
 */
export async function buildFullMemberLookup(matches: Match[]): Promise<FullMemberLookup> {
  const byCode = new Map<string, Team>();
  for (const m of matches) {
    byCode.set(m.teamA.code, m.teamA);
    byCode.set(m.teamB.code, m.teamB);
  }
  const resolved = await Promise.all(
    [...byCode.values()].map(
      async (team) => [team.code, (await getTeamMembershipStatus(team)) === "full"] as const
    )
  );
  const isFullMemberByCode = new Map(resolved);
  return (team: Team) => isFullMemberByCode.get(team.code) ?? false;
}

/**
 * True if a match clears the (deliberately rare) homepage spotlight bar.
 *
 * `isFullMember` must come from buildFullMemberLookup() above, resolved
 * once upfront by the caller -- see that function's comment for why this
 * can't be an inline per-match await instead.
 */
export function isSpotlightMatch(match: Match, isFullMember: FullMemberLookup): boolean {
  const compType = match.competition.type;
  const isLeagueOrDomestic = compType === "league" || compType === "domestic";
  if (!isLeagueOrDomestic) {
    // International/bilateral: both teams must be full ICC members, checked
    // BEFORE the excitement checks below ever run -- an associate-nation
    // match is rejected outright here regardless of how dramatic it was.
    if (!isFullMember(match.teamA) || !isFullMember(match.teamB)) return false;
  }
  return hasCloseFinish(match) || hasMilestone(match) || hasContextStakes(match);
}
