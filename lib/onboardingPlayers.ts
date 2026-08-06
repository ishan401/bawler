// ============================================================================
// Onboarding — player picker data (v1.0.165)
// ============================================================================
// Step 2 of the first-run onboarding flow: players from the teams just
// followed in step 1, deduplicated strictly by PLAYERS registry id (never
// display name), tagged with every followed-team affiliation they have.
//
// Confirmed before building this (per the build spec's own explicit
// instruction to check first): PlayerProfile already models UP TO TWO
// affiliations -- `teamCode` (national) and `franchiseCode` (league) --
// see lib/types.ts. That already covers the spec's own example (a player
// who plays for both a national side and an IPL franchise) with no data-
// model extension needed: PLAYERS is keyed uniquely by id regardless of
// how many followed teams reference the same entry, so iterating
// Object.values(PLAYERS) once each is the dedup, by construction -- there
// is no per-team duplication to collapse in the first place.
// ============================================================================

import { PLAYERS, NATIONAL_TEAMS } from "./mockData";
import type { PlayerProfile, Team } from "./types";
import { isPlayerCurrentlyLive } from "./playerActivity";
import { getLastInningsHeadline } from "./playerForm";
import type { PlayerFormatKey } from "./types";

export interface TaggedPlayer {
  player: PlayerProfile;
  /** Every followed-team affiliation this player has, in a fixed
   * national-then-franchise order (e.g. ["India", "RCB"]). */
  affiliations: string[];
}

const ROLE_LABEL: Record<PlayerProfile["role"], string> = {
  batsman: "Batter",
  bowler: "Bowler",
  "all-rounder": "All-rounder",
  "wicket-keeper": "Wicket-keeper",
};

export function roleLabel(player: PlayerProfile): string {
  return ROLE_LABEL[player.role] ?? player.role;
}

/** The display name for whichever national team a player's `teamCode`
 * points to -- resolved through NATIONAL_TEAMS rather than assumed equal
 * to the raw code, since not every national team's own follow-id
 * (Team.country) is textually identical to its Team.code (South Africa:
 * code "SA", country "RSA"). */
function nationDisplayName(teamCode: string | undefined): string | undefined {
  if (!teamCode) return undefined;
  return NATIONAL_TEAMS[teamCode]?.shortName ?? teamCode;
}

/**
 * Every player with at least one affiliation among `followedTeams`,
 * tagged with ALL such affiliations, sorted by relevance (most
 * affiliations first, then alphabetically by shortName) then deduped --
 * trivially, since PLAYERS is already unique-by-id and this iterates it
 * exactly once per entry.
 */
export function getRelevantPlayers(followedTeams: Team[]): TaggedPlayer[] {
  const followedNationCodes = new Set(followedTeams.filter(t => t.type === "national").map(t => t.code));
  const followedFranchiseCodes = new Set(followedTeams.filter(t => t.type !== "national").map(t => t.code));

  const tagged: TaggedPlayer[] = [];
  for (const player of Object.values(PLAYERS)) {
    const affiliations: string[] = [];
    if (player.teamCode && followedNationCodes.has(player.teamCode)) {
      affiliations.push(nationDisplayName(player.teamCode) ?? player.teamCode);
    }
    if (player.franchiseCode && followedFranchiseCodes.has(player.franchiseCode)) {
      affiliations.push(player.franchiseCode);
    }
    if (affiliations.length > 0) {
      tagged.push({ player, affiliations });
    }
  }

  tagged.sort((a, b) => {
    if (a.affiliations.length !== b.affiliations.length) return b.affiliations.length - a.affiliations.length;
    return a.player.shortName.localeCompare(b.player.shortName);
  });
  return tagged;
}

/** Full-registry search by name, independent of what was followed in
 * step 1 -- backs the picker's search bar ("find anyone else"). */
export function searchAllPlayers(query: string): PlayerProfile[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return Object.values(PLAYERS)
    .filter(p => p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
}

export type PlayerMoment = { headline: string; isLive: boolean };

const FORMAT_TRY_ORDER: PlayerFormatKey[] = ["franchise", "t20i", "odi", "test"];

/**
 * Same graceful-fallback-then-skip principle as step 1's team moment:
 * live involvement first (lib/playerActivity.ts's isPlayerCurrentlyLive,
 * already exported and already used elsewhere for the exact same "is
 * this player live right now" question -- not reimplemented here), else
 * the most recent recorded innings/spell in whichever format actually has
 * one for this player (lib/playerForm.ts's getLastInningsHeadline(),
 * reusing that file's existing per-appearance derivation rather than a
 * new lookup path), else `null` -- skip the moment entirely.
 */
export async function getPlayerMoment(player: PlayerProfile, liveMatches: import("./types").Match[]): Promise<PlayerMoment | null> {
  if (isPlayerCurrentlyLive(player.id, liveMatches)) {
    return { headline: `${player.shortName} is live right now`, isLive: true };
  }
  for (const format of FORMAT_TRY_ORDER) {
    const headline = await getLastInningsHeadline(player, format);
    if (headline) return { headline: `${player.shortName}: ${headline}`, isLive: false };
  }
  return null;
}
