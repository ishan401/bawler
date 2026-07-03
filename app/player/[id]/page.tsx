"use server";
import { notFound } from "next/navigation";
import PlayerProfileView from "@/components/PlayerProfileView";
import { PLAYERS, resolvePlayerSlug } from "@/lib/mockData";

/**
 * Player profile page — two-tier resolution:
 *
 * Tier 1 (mock / curated): look up PLAYERS by the raw id, then by resolved slug.
 *   e.g. id="v-kohli" or id="vkohli" → PLAYERS["v-kohli"]
 *
 * Tier 2 (real-data, TODO): if not in PLAYERS, call your player-profile API here,
 *   transform the response with transformCricbuzzPlayer() / transformESPNPlayer(),
 *   and pass the result to PlayerProfileView. The component doesn't care about
 *   the source — it only needs a PlayerProfile object.
 *
 *   Example (uncomment when API is wired):
 *   const raw = await fetchCricbuzzPlayer(params.id);
 *   if (raw) return <PlayerProfileView player={transformCricbuzzPlayer(raw)} />;
 *
 * New players are handled automatically: if a new player appears in a batting
 * card from the API, their playerId links to this page. If the API returns a
 * profile for them, it renders. If not, notFound() shows a graceful 404.
 */
export default async function PlayerPage({ params }: { params: { id: string } }) {
  // Tier 1: check curated profiles (direct key, then alias-resolved slug)
  const slug = resolvePlayerSlug(params.id);
  const player = PLAYERS[params.id] ?? PLAYERS[slug];

  if (player) return <PlayerProfileView player={player} />;

  // Tier 2 placeholder — replace with real API call
  // const raw = await fetchCricbuzzPlayer(params.id);
  // if (raw) return <PlayerProfileView player={transformCricbuzzPlayer(raw)} />;

  notFound();
}

/**
 * Pre-build pages for curated players at deploy time.
 * Real-API players are rendered on-demand (ISR) — Next.js will cache them
 * after the first request. Set revalidate to control cache lifetime.
 */
export function generateStaticParams() {
  return Object.keys(PLAYERS).map(id => ({ id }));
}

// ISR: re-render cached player pages at most every 5 minutes.
// Once real API is wired, this keeps stats fresh without a full deploy.
export const revalidate = 300;
