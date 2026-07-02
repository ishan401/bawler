"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_LIVE_MATCHES, ALL_UPCOMING_MATCHES, ALL_COMPETITION_NAMES } from "@/lib/mockData";
import type { Match } from "@/lib/types";

// ── Worldwide popularity scores ─────────────────────────────────────────────
const COMP_POPULARITY: Record<string, number> = {
  "ipl-2026":          100,
  "icc-t20wc-2026":     95,
  "icc-ct-2025":        90,
  "ashes-2025-26":      85,
  "ind-eng-test-2026":  80,
  "ind-aus-t20i-2026":  78,
  "bbl-2025-26":        70,
  "psl-2026":           68,
  "hundred-2026":       62,
  "sa20-2026":          55,
  "cpl-2025":           50,
  "eng-sa-odi-2026":    48,
  "mlc-2026":           44,
};

const TEAM_POPULARITY: Record<string, number> = {
  IND: 20, AUS: 14, ENG: 12, PAK: 11, SA: 8,
  WI: 7, NZ: 7, SL: 6, BAN: 5, AFG: 4, ZIM: 3,
  // IPL
  MI: 12, CSK: 11, RCB: 10, KKR: 9, DC: 7,
  GT: 7, RR: 6, SRH: 6, LSG: 5, PBKS: 5,
};

function matchPopularity(m: Match): number {
  const comp = COMP_POPULARITY[m.competition.id] ?? 30;
  const teamA = TEAM_POPULARITY[m.teamA.code] ?? 3;
  const teamB = TEAM_POPULARITY[m.teamB.code] ?? 3;
  return comp + Math.max(teamA, teamB);
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

type GM = { match: Match; bucket: "live" | "upcoming" };

export default function SchedulePage() {
  const [activeComp, setActiveComp] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);

  const all: GM[] = [
    ...ALL_LIVE_MATCHES.map(m => ({ match: m, bucket: "live" as const })),
    ...ALL_UPCOMING_MATCHES.map(m => ({ match: m, bucket: "upcoming" as const })),
  ].filter(({ match }) => {
    if (activeComp && match.competition.shortName !== activeComp) return false;
    if (activeFormat && match.format !== activeFormat) return false;
    return true;
  });

  // Live first, then upcoming — within each bucket sort by popularity desc
  const sorted = [
    ...all.filter(x => x.bucket === "live").sort((a,b) => matchPopularity(b.match) - matchPopularity(a.match)),
    ...all.filter(x => x.bucket === "upcoming").sort((a,b) => matchPopularity(b.match) - matchPopularity(a.match)),
  ];

  // Group by "Live" bucket or date label
  const grouped = new Map<string, GM[]>();
  for (const item of sorted) {
    const key = item.bucket === "live" ? "🔴 Live Now" : fmtDate(item.match.startTimeIso);
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  const formats = ["T20", "T20I", "ODI", "Test"];

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-3 py-3">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-secondary">{sorted.filter(x=>x.bucket==="live").length} live · {sorted.filter(x=>x.bucket==="upcoming").length} upcoming</p>
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-thin">
          <button onClick={() => setActiveFormat(null)}
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${!activeFormat ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>All</button>
          {formats.map(f => (
            <button key={f} onClick={() => setActiveFormat(f === activeFormat ? null : f)}
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${activeFormat === f ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          <button onClick={() => setActiveComp(null)}
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${!activeComp ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>All</button>
          {ALL_COMPETITION_NAMES.map(c => (
            <button key={c} onClick={() => setActiveComp(c === activeComp ? null : c)}
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${activeComp === c ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}>{c}</button>
          ))}
        </div>
      </header>

      <div className="px-3 mt-3 space-y-4">
        {[...grouped.entries()].map(([label, items]) => (
          <section key={label}>
            <h2 className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${label.startsWith("🔴") ? "text-red-400" : "text-text-dim"}`}>{label}</h2>
            <div className="space-y-1.5">
              {items.map(({ match, bucket }) => (
                <ScheduleRow key={match.id} match={match} bucket={bucket} />
              ))}
            </div>
          </section>
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-16 text-text-dim text-sm">No matches found</div>
        )}
      </div>
    </main>
  );
}

function ScheduleRow({ match, bucket }: { match: Match; bucket: "live" | "upcoming" }) {
  return (
    <Link href={`/match/${match.id}`}
      className="card block px-3 py-2.5 active:scale-[0.99] transition-transform">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <TeamChip team={match.teamA.shortName} color={match.teamA.primaryColor} />
            <span className="text-text-dim text-[10px]">vs</span>
            <TeamChip team={match.teamB.shortName} color={match.teamB.primaryColor} />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded leading-none"
              style={{ background: `${match.competition.logoColor ?? "#94A3B8"}22`, color: match.competition.logoColor ?? "#94A3B8", border: `1px solid ${match.competition.logoColor ?? "rgba(255,255,255,0.15)"}44` }}>
              {match.competition.shortName}
            </span>
            {match.format !== "T20" && (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border border-line text-text-dim leading-none">{match.format}</span>
            )}
            <span className="text-[9px] text-text-dim truncate">{match.matchNumber} · {match.venue.city}</span>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          {bucket === "live" ? (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />Live
            </span>
          ) : (
            <>
              <div className="text-[10px] font-bold text-text-primary num">{fmtTime(match.startTimeIso)}</div>
              <div className="text-[9px] text-text-dim">upcoming</div>
            </>
          )}
        </div>
      </div>
      {bucket === "live" && match.liveStatusOverride && (
        <div className="mt-1.5 pt-1.5 border-t border-line/50 text-[10px] text-text-secondary font-medium">
          {match.liveStatusOverride}
        </div>
      )}
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
