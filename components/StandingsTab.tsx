"use client";

import { memo } from "react";
import type { Competition } from "@/lib/types";
import { COMPETITION_STANDINGS, ALL_TEAMS } from "@/lib/mockData";

interface Props {
  competition: Competition;
}

function StandingsTab({ competition }: Props) {
  const standings = COMPETITION_STANDINGS[competition.id];

  if (!standings) {
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

  const { rows, showNrr, showDrawn, showPct, qualifyingSpots, phaseLabel } = standings;

  // Build column grid based on visible columns
  // Base: # | Team | P | W | L | [D] | [NRR] | [PCT] | Pts
  const cols = showDrawn && showPct
    ? "grid-cols-[28px_1fr_28px_28px_28px_28px_44px_36px]"
    : showDrawn
    ? "grid-cols-[28px_1fr_28px_28px_28px_28px_44px_36px]"
    : showNrr
    ? "grid-cols-[28px_1fr_28px_28px_28px_44px_36px]"
    : "grid-cols-[28px_1fr_28px_28px_28px_36px]";

  return (
    <div className="space-y-3">
      {phaseLabel && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim px-1">
          {phaseLabel}
        </p>
      )}

      <div className="card overflow-hidden">
        {/* Header */}
        <div className={`grid ${cols} gap-2 px-3 py-2 border-b border-line text-[9px] font-bold uppercase tracking-widest text-text-dim items-center`}>
          <span>#</span>
          <span>Team</span>
          <span className="text-right num">P</span>
          <span className="text-right num">W</span>
          <span className="text-right num">L</span>
          {showDrawn && <span className="text-right num">D</span>}
          {showNrr  && <span className="text-right num">NRR</span>}
          {showPct  && <span className="text-right num">PCT%</span>}
          <span className="text-right num">Pts</span>
        </div>

        {rows.map((row, idx) => {
          const team = ALL_TEAMS[row.teamCode];
          if (!team) return null;
          const isQualifier = idx < qualifyingSpots;
          const isEliminated = row.qualified === "eliminated";

          return (
            <div
              key={row.teamCode}
              className={`grid ${cols} gap-2 px-3 py-2.5 border-b border-line/50 last:border-b-0 items-center ${
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
                {isQualifier  && <span className="text-[8px] font-bold text-boundary">Q</span>}
                {isEliminated && <span className="text-[8px] font-bold text-text-dim">Out</span>}
              </div>
              <span className="text-right text-sm num text-text-secondary">{row.played}</span>
              <span className="text-right text-sm num font-semibold">{row.won}</span>
              <span className="text-right text-sm num text-text-secondary">{row.lost}</span>
              {showDrawn && (
                <span className="text-right text-sm num text-text-secondary">{row.drawn ?? 0}</span>
              )}
              {showNrr && (
                <span className={`text-right text-xs num ${(row.netRunRate ?? 0) >= 0 ? "text-boundary" : "text-wicket"}`}>
                  {(row.netRunRate ?? 0) > 0 ? "+" : ""}{(row.netRunRate ?? 0).toFixed(2)}
                </span>
              )}
              {showPct && (
                <span className="text-right text-xs num text-text-secondary">
                  {(row.pct ?? 0).toFixed(2)}
                </span>
              )}
              <span className="text-right text-sm num font-extrabold">{row.points}</span>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-text-dim flex flex-wrap gap-3 pb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-3 rounded-full bg-boundary" />
          Qualification line (top {qualifyingSpots})
        </span>
        <span>
          P=played · W=won · L=lost
          {showDrawn ? " · D=drawn" : ""}
          {showNrr   ? " · NRR=net run rate" : ""}
          {showPct   ? " · PCT%=win percentage" : ""}
          {" · Pts=points"}
        </span>
      </div>
    </div>
  );
}

export default memo(StandingsTab);
