// ============================================================================
// Onboarding — team picker data (v1.0.165)
// ============================================================================
// Curated team roster + the 4-tier "real moment" fallback chain for step 1
// of the first-run onboarding flow. Deliberately reuses
// lib/teamSchedule.ts's getTeamSchedule() for every match lookup here --
// per the build spec, this file must not reimplement schedule/match
// lookup logic that already exists and is already tested.
// ============================================================================

import { TEAMS, NATIONAL_TEAMS } from "./mockData";
import type { Team, Match } from "./types";
import { getTeamSchedule, type ScheduleEntry } from "./teamSchedule";
import { getCurrentInnings } from "./matchStatus";
import { formatScore, inningsProgressLabel } from "./formatUtils";

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

export type TeamMoment =
  | { tier: 1; match: Match; headline: string }
  | { tier: 2; match: Match; daysAway: number; headline: string }
  | { tier: 3; match: Match; headline: string };

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function otherTeamName(match: Match, followedCode: string): string {
  const other = match.teamA.code === followedCode ? match.teamB : match.teamA;
  return other.shortName || other.fullName;
}

function liveHeadline(match: Match, followedCode: string): string {
  const inn = getCurrentInnings(match);
  if (!inn) return `Live now vs ${otherTeamName(match, followedCode)}`;
  // Opponent here means "whoever the CURRENTLY BATTING side is playing
  // against" -- NOT "whoever isn't the followed team." Those are only
  // the same team when the followed team happens to be batting right
  // now; when the followed team is bowling, using otherTeamName()
  // (followedCode-relative) would name the batting side as its own
  // opponent (e.g. "KKR 130/3 vs KKR" when MI, the followed team, is
  // bowling) -- confirmed and fixed during onboarding build verification.
  const battingSide = inn.battingTeam === match.teamA.code ? match.teamA : match.teamB;
  const bowlingSide = inn.battingTeam === match.teamA.code ? match.teamB : match.teamA;
  return `${battingSide.shortName} ${formatScore(inn.runs, inn.wickets)} (${inningsProgressLabel(inn.overs, match.format)}) vs ${bowlingSide.shortName}`;
}

function pastHeadline(match: Match, followedCode: string): string {
  const opponent = otherTeamName(match, followedCode);
  if (!match.result) return `Played ${opponent} recently`;
  const { winner, margin } = match.result;
  if (winner === followedCode) return `Beat ${opponent} ${margin}`;
  if (winner === "draw") return `Drew with ${opponent}`;
  if (winner === "tie") return `Tied with ${opponent}`;
  if (winner === "no-result") return `No result vs ${opponent}`;
  return `Lost to ${opponent} ${margin}`;
}

/**
 * The 4-tier fallback chain from the build spec: live now -> upcoming
 * within 14 days -> completed within the last 30 days -> nothing (tier
 * 4, represented as `null` -- the caller must skip the moment card
 * entirely, never render an empty placeholder).
 */
export async function getTeamMoment(team: Team): Promise<TeamMoment | null> {
  const entries: ScheduleEntry[] = await getTeamSchedule(team.code);
  const now = Date.now();
  const followedCode = team.code;

  const live = entries.find(e => e.bucket === "live");
  if (live) {
    return { tier: 1, match: live.match, headline: liveHeadline(live.match, followedCode) };
  }

  const upcoming = entries
    .filter(e => e.bucket === "upcoming")
    .filter(e => {
      const startMs = Date.parse(e.match.startTimeIso);
      return Number.isFinite(startMs) && startMs >= now && startMs - now <= FOURTEEN_DAYS_MS;
    })
    .sort((a, b) => Date.parse(a.match.startTimeIso) - Date.parse(b.match.startTimeIso));
  if (upcoming.length > 0) {
    const match = upcoming[0].match;
    const daysAway = Math.max(0, Math.ceil((Date.parse(match.startTimeIso) - now) / (24 * 60 * 60 * 1000)));
    const opponent = otherTeamName(match, followedCode);
    return {
      tier: 2,
      match,
      daysAway,
      headline: `${team.shortName}'s next match vs ${opponent}: in ${daysAway} ${daysAway === 1 ? "day" : "days"}`,
    };
  }

  const past = entries
    .filter(e => e.bucket === "past")
    .filter(e => {
      const startMs = Date.parse(e.match.startTimeIso);
      return Number.isFinite(startMs) && startMs <= now && now - startMs <= THIRTY_DAYS_MS;
    })
    .sort((a, b) => Date.parse(b.match.startTimeIso) - Date.parse(a.match.startTimeIso));
  if (past.length > 0) {
    const match = past[0].match;
    return { tier: 3, match, headline: pastHeadline(match, followedCode) };
  }

  return null;
}
