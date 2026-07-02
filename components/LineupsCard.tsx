import React from "react";
import type { Match } from "@/lib/types";

export default function LineupsCard({ match }: { match: Match }) {
  const hasInnings = match.innings.length > 0;

  // When innings exist, derive the XI from batting + bowling cards (unique names, batters first)
  const playersA = hasInnings
    ? unique([
        ...(match.innings[0]?.battingCard.map(b => b.playerName) ?? []),
        ...(match.innings[1]?.bowlingCard.map(b => b.playerName) ?? []),
      ])
    : (match.teamA.squad ?? []);

  const playersB = hasInnings
    ? unique([
        ...(match.innings[1]?.battingCard.map(b => b.playerName) ?? []),
        ...(match.innings[0]?.bowlingCard.map(b => b.playerName) ?? []),
      ])
    : (match.teamB.squad ?? []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <PlayerColumn team={match.teamA} players={playersA} />
      <PlayerColumn team={match.teamB} players={playersB} />
    </div>
  );
}

function PlayerColumn({
  team,
  players,
}: {
  team: { shortName: string; primaryColor: string; flagEmoji?: string };
  players: string[];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-3 py-2 border-b border-line flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: team.primaryColor }} />
        <span className="text-sm font-bold">{team.shortName}</span>
        {team.flagEmoji && <span className="text-base leading-none">{team.flagEmoji}</span>}
      </div>
      <div className="px-3 py-3">
        {players.length === 0 ? (
          <span className="text-text-dim text-xs">Lineup not announced</span>
        ) : (
          <div className="space-y-1.5">
            {players.map((name, i) => (
              <div key={i} className="text-xs text-text-primary leading-tight flex items-center gap-2">
                <span className="text-text-dim num w-4 shrink-0 text-right">{i + 1}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
