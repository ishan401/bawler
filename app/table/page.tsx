"use client";

import { useState } from "react";
import { COMPETITION_STANDINGS, ALL_TEAMS, COMPETITIONS } from "@/lib/mockData";
import type { CompetitionStandings, StandingsRow } from "@/lib/types";

// Ordered display list — league/domestic first, then ICC events, then WTC
const DISPLAY_ORDER = [
  "ipl-2026",
  "psl-2026",
  "bbl-2025-26",
  "hundred-2026",
  "sa20-2026",
  "icc-t20wc-2026",
  "icc-ct-2025",
  "wtc-2025-27",
];

// Human-readable names — fallback to competition short name
const COMP_LABELS: Record<string, { name: string; qualifier?: string }> = {
  "ipl-2026":       { name: "IPL 2026",           qualifier: "Top 4 qualify" },
  "psl-2026":       { name: "PSL 2026",            qualifier: "Top 4 qualify" },
  "bbl-2025-26":    { name: "BBL 2025-26",         qualifier: "Top 4 qualify" },
  "hundred-2026":   { name: "The Hundred 2026",    qualifier: "Top 4 qualify" },
  "sa20-2026":      { name: "SA20 2026",           qualifier: "Top 4 qualify" },
  "icc-t20wc-2026": { name: "ICC T20 World Cup 2026" },
  "icc-ct-2025":    { name: "ICC Champions Trophy 2025" },
  "wtc-2025-27":    { name: "ICC World Test Championship 2025-27", qualifier: "Top 2 to final" },
};

export default function TablePage() {
  const [activeId, setActiveId] = useState(DISPLAY_ORDER[0]);

  const tables = DISPLAY_ORDER.filter(id => COMPETITION_STANDINGS[id]);
  const active = COMPETITION_STANDINGS[activeId];
  const meta = COMP_LABELS[activeId] ?? { name: activeId };

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-3 py-3">
        <h1 className="text-base font-extrabold tracking-tight">Table</h1>
        <p className="text-[10px] text-text-secondary">All competitions</p>
      </header>

      {/* Competition selector */}
      <div className="px-3 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-thin">
        {tables.map(id => {
          const label = COMP_LABELS[id]?.name ?? id;
          const isActive = id === activeId;
          return (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={`shrink-0 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors tap-scale ${
                isActive
                  ? "bg-cyan text-bg border-cyan"
                  : "bg-bg-elevated border-line text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="px-3 mt-3">
        {active && (
          <>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-text-primary">{meta.name}</h2>
              {meta.qualifier && (
                <span className="text-[9px] text-text-dim">{meta.qualifier}</span>
              )}
            </div>
            <StandingsTable standings={active} />
          </>
        )}
      </div>
    </main>
  );
}

function StandingsTable({ standings }: { standings: CompetitionStandings }) {
  const isWTC = standings.competitionId === "wtc-2025-27";
  const showPCT = isWTC;
  const showNRR = (standings.showNrr ?? true) && !isWTC;
  const showDrawn = standings.showDrawn ?? false;

  return (
    <div className="card overflow-hidden">
      {/* Column headers */}
      <div className={`grid items-center gap-1.5 px-3 py-2 border-b border-line text-[9px] font-bold uppercase tracking-widest text-text-dim ${
        showDrawn ? "grid-cols-[24px_1fr_24px_24px_24px_24px_40px]"
        : showPCT  ? "grid-cols-[24px_1fr_28px_28px_28px_28px_42px]"
        :             "grid-cols-[24px_1fr_28px_28px_28px_44px_36px]"
      }`}>
        <span>#</span>
        <span>Team</span>
        <span className="text-right num">P</span>
        <span className="text-right num">W</span>
        <span className="text-right num">L</span>
        {showDrawn && <span className="text-right num">D</span>}
        {showNRR   && <span className="text-right num">NRR</span>}
        {showPCT   && <span className="text-right num">PCT</span>}
        <span className="text-right num">{showPCT ? "PCT%" : "Pts"}</span>
      </div>

      {standings.rows.map((row, idx) => {
        const team = ALL_TEAMS[row.teamCode];
        if (!team) return null;
        const isQ  = row.qualified === "playoff" || (standings.qualifyingSpots && idx < standings.qualifyingSpots);
        const isOut = row.qualified === "eliminated";
        const nrr = row.netRunRate ?? 0;
        return (
          <div
            key={row.teamCode}
            className={`grid items-center gap-1.5 px-3 py-2.5 border-b border-line/50 last:border-b-0 ${
              isOut ? "opacity-55" : ""
            } ${showDrawn ? "grid-cols-[24px_1fr_24px_24px_24px_24px_40px]"
                 : showPCT  ? "grid-cols-[24px_1fr_28px_28px_28px_28px_42px]"
                 :             "grid-cols-[24px_1fr_28px_28px_28px_44px_36px]"}`}
          >
            <div className="flex items-center gap-1">
              {isQ && !isOut && <span className="w-1 h-6 rounded-full bg-boundary shrink-0" />}
              <span className="text-sm font-bold num text-text-primary">{idx + 1}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.primaryColor }} />
              <span className="text-sm font-bold truncate">{team.shortName}</span>
              {isQ  && !isOut && <span className="text-[8px] font-bold text-boundary">Q</span>}
              {isOut && <span className="text-[8px] font-bold text-text-dim">Out</span>}
            </div>
            <span className="text-right text-sm num text-text-secondary">{row.played}</span>
            <span className="text-right text-sm num font-semibold">{row.won}</span>
            <span className="text-right text-sm num text-text-secondary">{row.lost}</span>
            {showDrawn && <span className="text-right text-sm num text-text-secondary">{row.drawn ?? 0}</span>}
            {showNRR && (
              <span className={`text-right text-xs num ${nrr >= 0 ? "text-boundary" : "text-negative"}`}>
                {nrr > 0 ? "+" : ""}{nrr.toFixed(2)}
              </span>
            )}
            {showPCT && (
              <span className="text-right text-xs num text-text-secondary">
                {row.pct !== undefined ? (row.pct * 100).toFixed(1) : "—"}
              </span>
            )}
            <span className="text-right text-sm num font-extrabold">
              {showPCT ? (row.pct !== undefined ? `${(row.pct * 100).toFixed(1)}%` : "—") : row.points}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div className="px-3 py-2 border-t border-line/50 text-[9px] text-text-dim flex flex-wrap gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-3 rounded-full bg-boundary" />
          Qualifies
        </span>
        <span>
          P=played · W=won · L=lost
          {showDrawn ? " · D=drawn" : ""}
          {showNRR ? " · NRR=net run rate · Pts=points" : ""}
          {showPCT ? " · PCT=points per completed match %" : ""}
        </span>
      </div>
    </div>
  );
}
