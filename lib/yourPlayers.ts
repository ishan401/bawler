import type { Match, PlayerProfile } from "./types";
import { PLAYERS } from "./mockData";
import { parsePlayerName } from "./playerName";
import { getLiveActivePlayerIds } from "./playerActivity";

// ============================================================================
// "Your Players" homepage strip — sort/derivation — v1.0.125
// ============================================================================
// Pure function, no localStorage/React dependency (mirrors lib/playerForm.ts
// and lib/teamSchedule.ts's adapter split: this is the derivation, callers
// own the reactive plumbing) so it's directly unit-testable with constructed
// inputs -- no mocking `window` or `next/navigation` needed.
//
// Sort order, exactly per spec:
//   1. Favourited AND currently live
//   2. Favourited, not live
//   3. Not favourited, live
//   4. Not favourited, not live
// Within every tier, alphabetical by SURNAME (parsePlayerName().surname --
// never the raw "V Kohli" display string, which would sort "V Kohli" under
// V instead of K, the opposite of scorecard convention). Tier 1 isn't
// explicitly ordered by the spec beyond "ranks first" as a set, but surname
// order is applied there too for a deterministic, non-arbitrary result
// rather than leaving it at the mercy of input array order.
// ============================================================================

export interface YourPlayerEntry {
  player: PlayerProfile;
  isFavourited: boolean;
  isLive: boolean;
}

function tierOf(entry: { isFavourited: boolean; isLive: boolean }): number {
  if (entry.isFavourited && entry.isLive) return 0;
  if (entry.isFavourited) return 1;
  if (entry.isLive) return 2;
  return 3;
}

function surnameKey(player: PlayerProfile): string {
  return parsePlayerName(player.name).surname.toLowerCase();
}

/**
 * `followedIds` — FollowPrefs.players (the "Players" filter tab selection).
 * `favouriteIds` — lib/playerFavourites.ts's favourite store.
 * `liveMatches` — status==="live" matches to derive live-batting/bowling
 * from (getLiveActivePlayerIds ignores anything not actually "live", so
 * passing ALL matches here is harmless, just wasteful -- callers should
 * still prefer passing only live ones).
 *
 * Followed IDs that no longer resolve to a real PLAYERS entry are silently
 * dropped rather than crashing or rendering a broken chip -- same
 * self-healing posture as FollowPrefs' own sanitizeFollowPrefs, though the
 * actual persisted-value repair for followedIds happens there, not here;
 * this function just has to not choke on a stale ID it's handed.
 */
export function getYourPlayers(
  followedIds: string[],
  favouriteIds: string[],
  liveMatches: Match[]
): YourPlayerEntry[] {
  const favouriteSet = new Set(favouriteIds);
  const liveSet = getLiveActivePlayerIds(liveMatches);

  // De-dupe defensively -- FollowPrefs.players shouldn't contain repeats,
  // but this function's contract shouldn't depend on that being true.
  const seen = new Set<string>();
  const entries: YourPlayerEntry[] = [];
  for (const id of followedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const player = PLAYERS[id];
    if (!player) continue;
    entries.push({
      player,
      isFavourited: favouriteSet.has(id),
      isLive: liveSet.has(id),
    });
  }

  return entries.sort((a, b) => {
    const tierDiff = tierOf(a) - tierOf(b);
    if (tierDiff !== 0) return tierDiff;
    return surnameKey(a.player).localeCompare(surnameKey(b.player));
  });
}
