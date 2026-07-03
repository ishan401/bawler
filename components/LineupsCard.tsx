import React from "react";
import type { Match } from "@/lib/types";

export default function LineupsCard({ match }: { match: Match }) {
  const playersA = getXI(match, "A");
  const playersB = getXI(match, "B");

  return (
    <div className="grid grid-cols-2 gap-3">
      <PlayerColumn team={match.teamA} players={playersA} />
      <PlayerColumn team={match.teamB} players={playersB} />
    </div>
  );
}

/** Derive complete playing XI — up to 11 names, never empty slots shown as "TBC" */
function getXI(match: Match, side: "A" | "B"): string[] {
  const team      = side === "A" ? match.teamA : match.teamB;
  // Find innings by battingTeam — NEVER assume innings[0] = teamA.
  // Visiting teams bat first whenever they win the toss and elect to bat.
  const ownInn = match.innings.find(i => i.battingTeam === team.code);
  const oppInn = match.innings.find(i => i.battingTeam !== team.code);
  const squad     = team.squad ?? [];

  // Collect players seen in innings data (batting or bowling)
  const fromInnings = unique([
    ...(ownInn?.battingCard.map(b => b.playerName) ?? []),
    ...(oppInn?.bowlingCard.map(b => b.playerName) ?? []),
  ]);

  // Merge innings-seen players with squad, always preferring confirmed lineup
  const merged = unique([...fromInnings, ...squad]);

  // Return first 11; pad with "TBC" only if we have absolutely no data
  const xi = merged.slice(0, 11);
  if (xi.length === 0) return [];
  return xi;
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
        <span className="ml-auto text-[9px] text-text-dim font-bold uppercase tracking-widest">Playing XI</span>
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
  return Array.from(new Set(arr.filter(Boolean)));
}
