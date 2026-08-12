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
import { parsePlayerName } from "./playerName";
import { CURATED_NATION_CODES, isNationalTeam } from "./onboardingTeams";

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
// Exported (v1.0.200) -- buildOnboardingPlayerDeck() below needs the
// exact same team-code -> display-label resolution getRelevantPlayers()
// already uses to tag `affiliations`, so it can match a followed team
// back to its own subsequence of that array without a second, possibly-
// diverging label rule.
export function nationDisplayName(teamCode: string | undefined): string | undefined {
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

// ============================================================================
// Onboarding step 2 deck builder -- v1.0.200
// ============================================================================
// Step 2 used to render a flat, scrollable, unbounded list of every
// relevant player. It's now a 5-card swipe deck (matching step 1's own
// interaction pattern) built by ONE of two rules, chosen by whether the
// user followed any team at all in step 1:
//
//   Scenario A (>=1 team followed): round-robin across the followed
//   teams, in the order they were followed -- first-followed team
//   contributes the deck's first pick, second-followed team the second
//   pick, etc., cycling back to the first team again if needed, until 5
//   players are picked or every followed team's pool is exhausted
//   (never padded with unrelated players). Per-team order is NOT
//   reinvented here -- each team's queue is a plain filtered subsequence
//   of getRelevantPlayers()'s own existing sort (most-affiliated first,
//   then shortName), so a single team's queue is byte-for-byte "today's
//   existing order" for that team, just sliced out of the one list that
//   already establishes it.
//
//   Scenario B (0 teams followed): a fixed, non-randomized 5-player
//   fallback -- one player per curated onboarding nation (the same
//   CURATED_NATION_CODES / order step 1's own deck uses), each chosen by
//   a captain flag if the data model had one. It doesn't (grep-confirmed
//   -- PlayerProfile in lib/types.ts has no captain/marquee field; a few
//   players' free-text `bio` happens to mention "captain", but that's
//   prose, not a queryable flag), so each nation's pick is instead its
//   alphabetically-first player BY SURNAME (via lib/playerName.ts's
//   parsePlayerName(), the same surname-parsing this app already uses
//   everywhere else for name display/sorting -- not a new rule).
// ============================================================================

/** Every player belonging to `team`, in the exact relative order they
 * already have inside `relevant` (today's existing sort) -- a plain
 * filtered subsequence, not a new ranking. */
function teamQueueFrom(relevant: TaggedPlayer[], team: Team): PlayerProfile[] {
  const label = isNationalTeam(team) ? (nationDisplayName(team.code) ?? team.code) : team.code;
  return relevant.filter(r => r.affiliations.includes(label)).map(r => r.player);
}

const PLAYER_DECK_SIZE = 5;

/** Scenario A: round-robin across `followedTeams`, in followed order. */
function buildRoundRobinDeck(followedTeams: Team[]): PlayerProfile[] {
  const relevant = getRelevantPlayers(followedTeams);
  const queues = followedTeams.map(team => teamQueueFrom(relevant, team));
  const picked: PlayerProfile[] = [];
  const pickedIds = new Set<string>();

  while (picked.length < PLAYER_DECK_SIZE) {
    let anyPickedThisRound = false;
    for (const queue of queues) {
      if (picked.length >= PLAYER_DECK_SIZE) break;
      // A player who (in principle) belongs to more than one followed
      // team could already have been picked via an earlier team's turn --
      // skip forward past any such duplicate rather than picking them twice.
      while (queue.length > 0 && pickedIds.has(queue[0].id)) queue.shift();
      if (queue.length === 0) continue;
      const player = queue.shift()!;
      picked.push(player);
      pickedIds.add(player.id);
      anyPickedThisRound = true;
    }
    if (!anyPickedThisRound) break; // every followed team's queue is exhausted
  }
  return picked;
}

/** Scenario B: fixed fallback, one player per curated nation, captain-
 * flag-if-it-existed else alphabetical-by-surname. Deterministic -- same
 * input (the curated nation list) always produces the same output. */
function buildFallbackDeck(): PlayerProfile[] {
  const picked: PlayerProfile[] = [];
  for (const code of CURATED_NATION_CODES) {
    const roster = Object.values(PLAYERS).filter(p => p.teamCode === code);
    if (roster.length === 0) continue;
    const sorted = [...roster].sort((a, b) =>
      parsePlayerName(a.name).surname.localeCompare(parsePlayerName(b.name).surname)
    );
    picked.push(sorted[0]);
  }
  return picked;
}

export function buildOnboardingPlayerDeck(followedTeams: Team[]): PlayerProfile[] {
  return followedTeams.length > 0 ? buildRoundRobinDeck(followedTeams) : buildFallbackDeck();
}
