"use client";

import { memo } from "react";
import type { Competition } from "@/lib/types";
import { STANDINGS, ALL_TEAMS } from "@/lib/mockData";

interface Props {
  competition: Competition;
}

// Map competition IDs to their standings data (extend when more comps have data)
const STANDINGS_MAP: Record<string, typeof STANDINGS> = {
  "ipl-2026": STANDINGS,
};

function StandingsTab({ competition }: Props) {
  const rows = STANDINGS_MAP[competition.id];

  if (!rows) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <span className="text-4xl">🏏</span>
        <p className="text-sm font-bold text-text-primary">Standings coming soon</p>
        <p className="text-xs text-text-secondary">
          {competition.name} table will appear here once available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[28px_1fr_28px_28px_28px_44px_36px] gap-2 px-3 py-2 border-b border-line text-[9px] font-bold uppercase tracking-widest text-text-dim items-center">
          <span>#</span>
          <span>Team</span>
          <span className="text-right num">P</span>
          <span className="text-right num">W</span>
          <span className="text-right num">L</span>
          <span className="text-right num">NRR</span>
          <span className="text-right num">Pts</span>
        </div>

        {rows.map((row, idx) => {
          const team = ALL_TEAMS[row.teamCode];
          if (!team) return null;
          const isQualifier = idx < 4;
          const isEliminated = row.qualified === "eliminated";
          return (
            <div
              key={row.teamCode}
              className={`grid grid-cols-[28px_1fr_28px_28px_28px_44px_36px] gap-2 px-3 py-2.5 border-b border-line/50 last:border-b-0 items-center ${
                isEliminated ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-1">
                {isQualifier && <span className="w-1 h-6 rounded-full bg-boundary shrink-0" />}
                <span className="text-sm font-bold num text-text-primary">{idx + 1}</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.primaryColor }} />
                <span className="text-sm font-bold truncate">{team.shortName}</span>
                {isQualifier && <span className="text-[8px] font-bold text-boundary">Q</span>}
                {isEliminated && <span className="text-[8px] font-bold text-text-dim">Out</span>}
              </div>
              <span className="text-right text-sm num text-text-secondary">{row.played}</span>
              <span className="text-right text-sm num font-semibold">{row.won}</span>
              <span className="text-right text-sm num text-text-secondary">{row.lost}</span>
              <span className={`text-right text-xs num ${row.netRunRate >= 0 ? "text-boundary" : "text-wicket"}`}>
                {row.netRunRate > 0 ? "+" : ""}{row.netRunRate.toFixed(2)}
              </span>
              <span className="text-right text-sm num font-extrabold">{row.points}</span>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-text-dim flex flex-wrap gap-3 pb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-3 rounded-full bg-boundary" />
          Playoff line (top 4)
        </span>
        <span>P=played · W=won · L=lost · NRR=net run rate · Pts=points</span>
      </div>
    </div>
  );
}

export default memo(StandingsTab);
