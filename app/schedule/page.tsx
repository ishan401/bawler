"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_LIVE_MATCHES, ALL_UPCOMING_MATCHES, ALL_COMPETITION_NAMES } from "@/lib/mockData";
import type { Match } from "@/lib/types";

// ── Worldwide cricket popularity scores ─────────────────────────────────────
// Cricket-first: rank by global audience, not app history
const COMP_POPULARITY: Record<string, number> = {
  "icc-t20wc-2026":     100,  // Global ICC tournament
  "icc-ct-2025":         95,  // ICC 50-over event
  "ashes-2025-26":       90,  // Most historic bilateral
  "ipl-2026":            88,  // Richest T20 league
  "ind-eng-test-2026":   82,  // Top bilateral series
  "ind-aus-t20i-2026":   80,
  "eng-sa-odi-2026":     68,
  "bbl-2025-26":         66,
  "psl-2026":            64,
  "hundred-2026":        58,
  "sa20-2026":           52,
  "cpl-2025":            46,
  "mlc-2026":            40,
};

const TEAM_POPULARITY: Record<string, number> = {
  IND: 20, AUS: 14, ENG: 12, PAK: 11,
  SA: 8, NZ: 7, WI: 7, SL: 6, BAN: 5, AFG: 4,
  MI: 10, CSK: 10, RCB: 9, KKR: 8, DC: 6,
  GT: 6, RR: 6, SRH: 5, LSG: 5, PBKS: 5,
};

function matchPopularity(m: Match): number {
  const comp = COMP_POPULARITY[m.competition.id] ?? 30;
  const ta   = TEAM_POPULARITY[m.teamA.code] ?? 3;
  const tb   = TEAM_POPULARITY[m.teamB.code] ?? 3;
  return comp + ta + tb;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

type GM = { match: Match; isLive: boolean };

export default function SchedulePage() {
  const [activeComp, setActiveComp]     = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);

  const all: GM[] = [
    ...ALL_LIVE_MATCHES.map(m     => ({ match: m, isLive: true })),
    ...ALL_UPCOMING_MATCHES.map(m => ({ match: m, isLive: false })),
  ]
    .filter(({ match }) => {
      if (activeComp   && match.competition.shortName !== activeComp)   return false;
      if (activeFormat && match.format !== activeFormat)                 return false;
      return true;
    })
    // Pure popularity sort — cricket first, no IPL bias
    .sort((a, b) => matchPopularity(b.match) - matchPopularity(a.match));

  const liveCount    = all.filter(x => x.isLive).length;
  const upcomingCount = all.filter(x => !x.isLive).length;
  const formats = ["T20", "T20I", "ODI", "Test"];

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-3 py-3">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-secondary">
          {liveCount > 0 && <span className="text-red-400 font-bold">{liveCount} live · </span>}
          {upcomingCount} upcoming · sorted by popularity
        </p>

        {/* Format filter */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-thin">
          <button onClick={() => setActiveFormat(null)}
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${!activeFormat ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>All</button>
          {formats.map(f => (
            <button key={f} onClick={() => setActiveFormat(f === activeFormat ? null : f)}
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${activeFormat === f ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>{f}</button>
          ))}
        </div>

        {/* Competition filter */}
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          <button onClick={() => setActiveComp(null)}
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${!activeComp ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>All</button>
          {ALL_COMPETITION_NAMES.map(c => (
            <button key={c} onClick={() => setActiveComp(c === activeComp ? null : c)}
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${activeComp === c ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>{c}</button>
          ))}
        </div>
      </header>

      <div className="px-3 mt-3 space-y-1.5">
        {all.map(({ match, isLive }) => (
          <ScheduleRow key={match.id} match={match} isLive={isLive} />
        ))}
        {all.length === 0 && (
          <div className="text-center py-16 text-text-dim text-sm">No matches found</div>
        )}
      </div>
    </main>
  );
}

function ScheduleRow({ match, isLive }: { match: Match; isLive: boolean }) {
  return (
    <Link href={`/match/${match.id}`}
      className="card block px-3 py-2.5 active:scale-[0.99] transition-transform">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {/* Teams */}
          <div className="flex items-center gap-2">
            <TeamChip team={match.teamA.shortName} color={match.teamA.primaryColor} />
            <span className="text-text-dim text-[10px]">vs</span>
            <TeamChip team={match.teamB.shortName} color={match.teamB.primaryColor} />
            {isLive && (
              <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-400 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Live
              </span>
            )}
          </div>
          {/* Meta row */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded leading-none"
              style={{ background: `${match.competition.logoColor ?? "#94A3B8"}22`, color: match.competition.logoColor ?? "#94A3B8", border: `1px solid ${match.competition.logoColor ?? "rgba(255,255,255,0.15)"}44` }}>
              {match.competition.shortName}
            </span>
            {match.format !== "T20" && (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-line text-text-dim leading-none">{match.format}</span>
            )}
            <span className="text-[9px] text-text-dim">{match.matchNumber}</span>
            <span className="text-[9px] text-text-dim">· {match.venue.city}</span>
          </div>
        </div>

        {/* Time / status */}
        <div className="text-right shrink-0">
          {isLive ? (
            <div className="text-[10px] text-text-secondary font-medium text-right max-w-[110px] leading-snug">
              {match.liveStatusOverride ?? "In progress"}
            </div>
          ) : (
            <div>
              <div className="text-[10px] font-bold text-text-primary num">{fmtTime(match.startTimeIso)}</div>
              <div className="text-[9px] text-text-dim">{fmtDate(match.startTimeIso)}</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function TeamChip({ team, color }: { team: string; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-bold text-sm">{team}</span>
    </span>
  );
}
