import { notFound } from "next/navigation";
import PlayerProfileView from "@/components/PlayerProfileView";
import { PLAYERS } from "@/lib/mockData";

export default function PlayerPage({ params }: { params: { id: string } }) {
  const player = PLAYERS[params.id];
  if (!player) notFound();
  return <PlayerProfileView player={player} />;
}

export function generateStaticParams() {
  return Object.keys(PLAYERS).map(id => ({ id }));
}
