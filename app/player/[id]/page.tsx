import { notFound } from "next/navigation";
import PlayerProfileView from "@/components/PlayerProfileView";
import { PLAYERS, resolvePlayerSlug } from "@/lib/mockData";

/**
 * Player profile page — source-agnostic, two-tier resolution:
 *
 * ── Tier 1 · Curated profiles (active now) ───────────────────────────────
 * Checks PLAYERS by raw id, then by resolved slug.
 * Covers all manually seeded profiles (Kohli, Bumrah, etc.) and handles
 * every playerId variant via PLAYER_ALIASES (vkohli / vkohli2 / V Kohli
 * all resolve to "v-kohli").
 *
 * ── Tier 2 · Live API (uncomment when you wire a provider) ───────────────
 * The page only needs to return a PlayerProfile object.
 * PlayerProfileView is completely source-agnostic — it renders whatever
 * it receives, regardless of which API produced it.
 *
 * Pick ONE provider (or chain them as fallbacks):
 *
 *   // Option A — Cricbuzz (best for IPL + Indian cricket, real-time)
 *   import { transformCricbuzzPlayer } from "@/lib/transformers";
 *   const rawProfile = await fetchCricbuzzPlayer(params.id);
 *   const rawBat     = await fetchCricbuzzPlayerStats(params.id, "batting");
 *   const rawBowl    = await fetchCricbuzzPlayerStats(params.id, "bowling");
 *   if (rawProfile) return <PlayerProfileView player={transformCricbuzzPlayer(rawProfile, rawBat, rawBowl)} />;
 *
 *   // Option B — ESPN / sportsdata.io (better historical + international coverage)
 *   import { transformESPNPlayer } from "@/lib/transformers";
 *   const raw = await fetchESPNPlayer(params.id);
 *   if (raw) return <PlayerProfileView player={transformESPNPlayer(raw)} />;
 *
 *   // Option C — SportRadar (enterprise, most complete, includes franchise data)
 *   import { transformSportRadarPlayer } from "@/lib/transformers";
 *   const raw = await fetchSportRadarPlayer(params.id);
 *   if (raw) return <PlayerProfileView player={transformSportRadarPlayer(raw)} />;
 *
 * New players are automatic: when a debutant appears in a batting card from
 * the API, their playerId becomes the route ID. The page fetches their profile
 * from the API on first hit; ISR caches it after that. Zero manual work.
 */
export default async function PlayerPage({ params }: { params: { id: string } }) {
  // Tier 1: curated profiles — direct key then alias-resolved slug
  const slug = resolvePlayerSlug(params.id);
  const player = PLAYERS[params.id] ?? PLAYERS[slug];
  if (player) return <PlayerProfileView player={player} />;

  // Tier 2: API lookup goes here (see comments above)

  notFound();
}

/**
 * Pre-build pages for curated players at deploy time.
 * All other players (from real API) are rendered on-demand and cached by ISR.
 */
export function generateStaticParams() {
  return Object.keys(PLAYERS).map(id => ({ id }));
}

// ISR: re-render cached player pages at most every 5 minutes.
// Keeps stats fresh after roster changes / rating updates without a full redeploy.
export const revalidate = 300;
