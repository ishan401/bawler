import { notFound } from "next/navigation";
import MatchView from "@/components/MatchView";
import { FEATURED_MATCH, RECENT_MATCH, UPCOMING_MATCHES } from "@/lib/mockData";

const ALL = [FEATURED_MATCH, RECENT_MATCH, ...UPCOMING_MATCHES];

export default function MatchPage({ params }: { params: { id: string } }) {
  const match = ALL.find(m => m.id === params.id);
  if (!match) notFound();

  // For now, all matches use the MatchView component
  // The component itself handles the 3 lifecycle states (pre-match, live, post-match)
  // based on match.status — for the prototype, we route everything through MatchView
  return <MatchView match={match} />;
}

export function generateStaticParams() {
  return ALL.map(m => ({ id: m.id }));
}
