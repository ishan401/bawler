import React from "react";
import type { Match } from "@/lib/types";

interface LineupsCardProps {
  match: Match;
}

export default function LineupsCard({ match }: LineupsCardProps) {
  const hasInnings = match.innings.length > 0;

  if (hasInnings) {
    // Full ball-by-ball data — derive XI from batting/bowling cards
    const teamABatters = match.innings[0]?.battingCard.map(b => b.playerName) ?? [];
    const teamABowlers = match.innings[1]?.bowlingCard.map(b => b.playerName) ?? [];
    const teamBBatters = match.innings[1]?.battingCard.map(b => b.playerName) ?? [];
    const teamBBowlers = match.innings[0]?.bowlingCard.map(b => b.playerName) ?? [];
    return (
      <div className="grid grid-cols-2 gap-3">
        <TeamColumn teamCode={match.teamA.shortName} color={match.teamA.primaryColor} batters={teamABatters} bowlers={teamABowlers} />
        <TeamColumn teamCode={match.teamB.shortName} color={match.teamB.primaryColor} batters={teamBBatters} bowlers={teamBBowlers} />
      </div>
    );
  }

  // No innings yet — show squad from team.squad
  const squadA = match.teamA.squad ?? [];
  const squadB = match.teamB.squad ?? [];

  return (
    <div className="grid grid-cols-2 gap-3">
      <SquadColumn team={match.teamA} squad={squadA} />
      <SquadColumn team={match.teamB} squad={squadB} />
    </div>
  );
}

function SquadColumn({ team, squad }: { team: { shortName: string; primaryColor: string; flagEmoji?: string }; squad: string[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-3 py-2 border-b border-line flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: team.primaryColor }} />
        <span className="text-sm font-bold">{team.shortName}</span>
        {team.flagEmoji && <span className="text-base leading-none">{team.flagEmoji}</span>}
      </div>
      <div className="px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Squad</div>
        {squad.length === 0 ? (
          <span className="text-text-dim text-xs">Lineup not announced</span>
        ) : (
          <div className="space-y-1">
            {squad.map((name, i) => (
              <div key={i} className="text-xs text-text-primary leading-tight flex items-center gap-2">
                <span className="text-text-dim num w-4 shrink-0">{i + 1}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamColumn({ teamCode, color, batters, bowlers }: { teamCode: string; color: string; batters: string[]; bowlers: string[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-3 py-2 border-b border-line flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm font-bold">{teamCode}</span>
      </div>
      <div className="px-3 py-3 space-y-3">
        <Section title="Batting order">
          {batters.length === 0 ? (
            <span className="text-text-dim text-xs">Lineup not announced</span>
          ) : (
            batters.map((n, i) => (
              <div key={i} className="text-xs text-text-primary leading-tight">
                <span className="text-text-dim num inline-block w-4">{i + 1}</span>
                {n}
              </div>
            ))
          )}
        </Section>
        <Section title="Bowlers used">
          {bowlers.length === 0 ? (
            <span className="text-text-dim text-xs">—</span>
          ) : (
            bowlers.map((n, i) => (
              <div key={i} className="text-xs text-text-primary leading-tight">{n}</div>
            ))
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
