"use client";

import Link from "next/link";
import { STANDINGS, TEAMS } from "@/lib/mockData";

export default function TablePage() {
  return (
    <main className="min-h-screen pb-8">
      <header className="sticky top-0 sm:top-4 z-30 bg-bg/90 backdrop-blur border-b border-line px-3 py-3 flex items-center gap-3">
        <Link href="/" className="text-text-dim hover:text-text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-extrabold tracking-tight">Table</h1>
          <p className="text-[10px] text-text-secondary">IPL 2026 · standings · top 4 qualify</p>
        </div>
      </header>

      <div className="px-3 mt-3">
        <div className="card overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[28px_1fr_28px_28px_28px_44px_36px] gap-2 px-3 py-2 border-b border-line text-[9px] font-bold uppercase tracking-widest text-text-dim items-center">
            <span>#</span>
            <span>Team</span>
            <span className="text-right num">P</span>
            <span className="text-right num">W</span>
            <span className="text-right num">L</span>
            <span className="text-right num">NRR</span>
            <span className="text-right num">Pts</span>
          </div>

          {STANDINGS.map((row, idx) => {
            const team = TEAMS[row.teamCode];
            const isQualifier = row.qualified === "playoff" || idx < 4;
            const isEliminated = row.qualified === "eliminated";
            return (
              <div
                key={row.teamCode}
                className={`grid grid-cols-[28px_1fr_28px_28px_28px_44px_36px] gap-2 px-3 py-2.5 border-b border-line/50 last:border-b-0 items-center ${
                  isEliminated ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isQualifier && idx < 4 && (
                    <span className="w-1 h-7 rounded-full bg-boundary" />
                  )}
                  <span className="text-sm font-bold num text-text-primary">{idx + 1}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.primaryColor }} />
                  <span className="text-sm font-bold truncate">{team.shortName}</span>
                  {isQualifier && idx < 4 && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-boundary">Q</span>
                  )}
                  {isEliminated && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim">Out</span>
                  )}
                </div>
                <span className="text-right text-sm num text-text-secondary">{row.played}</span>
                <span className="text-right text-sm num font-semibold text-text-primary">{row.won}</span>
                <span className="text-right text-sm num text-text-secondary">{row.lost}</span>
                <span className={`text-right text-xs num ${row.netRunRate >= 0 ? "text-boundary" : "text-wicket"}`}>
                  {row.netRunRate > 0 ? "+" : ""}{row.netRunRate.toFixed(2)}
                </span>
                <span className="text-right text-sm num font-extrabold text-text-primary">{row.points}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 text-[10px] text-text-dim flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-3 rounded-full bg-boundary" />
            Playoff line (top 4)
          </span>
          <span>P = played · W = won · L = lost · NRR = net run rate · Pts = points</span>
        </div>
      </div>
    </main>
  );
}
