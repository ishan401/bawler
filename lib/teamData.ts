// ============================================================================
// Team data adapter — v1.0.102
// ============================================================================
// This is the reference implementation of a pattern documented in full in
// ARCHITECTURE.md: any dataset we expect to eventually come from a real
// provider gets an INTERFACE first, backed by mock data today, so that
// swapping the implementation for a real network call later never
// requires touching a single call site.
//
// Concretely, that means:
//   1. The raw fields (`Team.membershipStatus`, `Team.rankings`) live in
//      lib/mockData.ts like any other mock data, but nothing outside this
//      file is allowed to read them directly.
//   2. Every read goes through a function here instead -- and every one
//      of those functions returns a Promise, even though today's
//      implementation resolves synchronously from the in-memory mock
//      object. That's deliberate: a real ranking API is a network call,
//      which is necessarily async, so call sites need to already be
//      written as if it were, or the eventual swap becomes a call-site
//      migration instead of a one-file implementation change.
//   3. `refreshRankings()` is a placeholder for whatever real sync
//      mechanism eventually keeps this data current (rankings move
//      roughly weekly-to-monthly in reality, after each series). It does
//      nothing today because mock data has no concept of going stale --
//      but the call site future code will need already exists.
//
// Why membership status and per-format rankings specifically needed this:
// see DECISIONS-LOG.md FY32. Short version -- a naive "does this team have
// a ranking number" check works today only because this mock dataset
// happens to leave the field blank for every associate nation. Once real
// rankings arrive (ICC publishes T20I rankings for 100+ members, including
// most associates), that coincidence disappears. Membership status is the
// durable signal; ranking is a volatile, per-format performance number.
// They're deliberately two different fields behind two different
// functions, not one overloaded lookup.
// ============================================================================

import type { Team, TeamRankings } from "./types";

export type MembershipStatus = "full" | "associate";
export type RankingFormat = keyof TeamRankings; // "test" | "odi" | "t20i"

/**
 * A national team's ICC membership tier -- "full" (Test-playing, full
 * voting rights) or "associate" (everyone else). Returns `undefined` for
 * franchise teams (the concept doesn't apply) or for a national team
 * whose status hasn't been set in the underlying data.
 *
 * Returns a Promise so this can become a real network-backed lookup later
 * without any caller needing to change. Today it resolves synchronously
 * from `team.membershipStatus` -- the ONLY place in the codebase allowed
 * to read that field directly.
 */
export async function getTeamMembershipStatus(
  team: Team
): Promise<MembershipStatus | undefined> {
  return team.membershipStatus;
}

/**
 * A national team's ranking in a specific format ("test" | "odi" | "t20i").
 * Returns `undefined` if the team has no `rankings` object at all, or no
 * entry for the requested format specifically -- callers should treat
 * that as "not currently ranked in this format" (a normal, expected
 * state for most associate nations and for formats this mock dataset
 * hasn't populated yet), not as a missing-data error.
 *
 * Returns a Promise for the same reason as getTeamMembershipStatus()
 * above. Today it resolves synchronously from `team.rankings` -- the ONLY
 * place in the codebase allowed to read that field directly.
 */
export async function getTeamRanking(
  team: Team,
  format: RankingFormat
): Promise<number | undefined> {
  return team.rankings?.[format];
}

/**
 * Placeholder for a real ranking-sync mechanism (scheduled refetch from a
 * live provider, a webhook, whatever the eventual integration looks
 * like). Intentionally a no-op today -- static mock data never goes
 * stale, so there is nothing to refresh yet. Exists so that whichever
 * future feature needs to trigger a refresh already has a stable function
 * to call, instead of that call site needing to be invented (and every
 * existing caller updated) at the same time real data is wired in.
 */
export function refreshRankings(): Promise<void> {
  // TODO(real-data): replace this no-op with an actual fetch against a
  // live rankings provider once one is integrated, and decide a refresh
  // cadence (rankings change after roughly every series, not on a fixed
  // schedule -- polling on a timer will always be somewhat stale;
  // consider whether the eventual provider supports a webhook instead).
  return Promise.resolve();
}
