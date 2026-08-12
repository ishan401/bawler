// ============================================================================
// Onboarding — team picker data (v1.0.165)
// ============================================================================
// Curated team roster for step 1 of the first-run onboarding flow.
//
// v1.0.190: the 4-tier "real moment" fallback chain (`getTeamMoment()`,
// `TeamMoment`, and their private headline helpers) that used to live in
// this file was removed along with the "LIVE RIGHT NOW" interstitial that
// consumed it (components/onboarding/TeamMomentCard.tsx, deleted;
// components/onboarding/TeamPickerStep.tsx, simplified) -- grep-confirmed
// neither export had any other consumer anywhere in the codebase before
// removal. See DECISIONS-LOG.md.
// ============================================================================

import { TEAMS, NATIONAL_TEAMS } from "./mockData";
import type { Team } from "./types";

// v1.0.187: the curated roster was cut from 16 teams (6 national sides +
// 10 IPL franchises) down to exactly these 5 national sides, in this
// exact order -- product decision to keep the team-picker step short.
// Franchise teams are no longer part of onboarding's team-picker deck at
// all; a user who wants to follow a franchise team does so afterward via
// the Filter tab (see components/SelectMoreNudge.tsx, which nudges toward
// exactly that on first Home arrival). Fixed, deterministic order -- not
// shuffled -- so "3 of 5" and the underlying deck are stable and testable
// run to run.
const CURATED_NATION_CODES = ["IND", "AUS", "ENG", "NZ", "SA"] as const;

export function getOnboardingTeams(): Team[] {
  return CURATED_NATION_CODES.map(code => NATIONAL_TEAMS[code]).filter((t): t is Team => Boolean(t));
}

/** True for a national team (follows into FollowPrefs.nations by country
 * code), false for a franchise team (follows into FollowPrefs.teams by
 * team code). Mirrors the same national/franchise split
 * lib/followPrefs.ts's validNationIds()/validTeamIds() already draw on. */
export function isNationalTeam(team: Team): boolean {
  return team.type === "national";
}

/** The id this team should be followed under in FollowPrefs -- team.country
 * for a national side (falls back to team.code if country is somehow
 * absent, matching lib/followPrefs.ts's own nationOf() fallback), or
 * team.code for a franchise. */
export function followIdFor(team: Team): string {
  return isNationalTeam(team) ? (team.country ?? team.code) : team.code;
}

