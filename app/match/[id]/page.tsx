import { notFound } from "next/navigation";
import MatchView from "@/components/MatchView";
import {
  ALL_LIVE_MATCHES,
  ALL_PAST_MATCHES,
  ALL_UPCOMING_MATCHES,
} from "@/lib/mockData";

const ALL = [...ALL_LIVE_MATCHES, ...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES];

export default function MatchPage({ params }: { params: { id: string } }) {
  const match = ALL.find(m => m.id === params.id);
  if (!match) notFound();
  return <MatchView match={match!} />;
}

export function generateStaticParams() {
  return ALL.map(m => ({ id: m.id }));
}
