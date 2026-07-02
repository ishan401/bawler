"use client";

import Link from "next/link";
import { useState } from "react";
import { ALL_LIVE_MATCHES, ALL_PAST_MATCHES, ALL_UPCOMING_MATCHES, ALL_COMPETITION_NAMES } from "@/lib/mockData";
import type { Match } from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

type GroupedMatch = { match: Match; bucket: "past" | "live" | "upcoming" };

export default function SchedulePage() {
  const [activeComp, setActiveComp] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string | null>(null);

  // Combine all matches chronologically
  const all: GroupedMatch[] = [
    ...ALL_PAST_MATCHES.map(m => ({ match: m, bucket: "past" as const })),
    ...ALL_LIVE_MATCHES.map(m => ({ match: m, bucket: "live" as const })),
    ...ALL_UPCOMING_MATCHES.map(m => ({ match: m, bucket: "upcoming" as const })),
  ]
    .filter(({ match }) => {
      if (activeComp && match.competition.shortName !== activeComp) return false;
      if (activeFormat && match.format !== activeFormat) return false;
      return true;
    })
    .sort((a, b) => new Date(a.match.startTimeIso).getTime() - new Date(b.match.startTimeIso).getTime());

  // Group by date string
  const grouped = new Map<string, GroupedMatch[]>();
  for (const item of all) {
    const key = fmtDate(item.match.startTimeIso);
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  const formats = ["T20", "T20I", "ODI", "Test"];

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-3 py-3">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-secondary">All competitions · {all.length} matches</p>
        {/* Format filter pills */}
        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-thin">
          <button
            onClick={() => setActiveFormat(null)}
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors ${!activeFormat ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}
          >All</button>
          {formats.map(f => (
            <button key={f}
              onClick={() => setActiveFormat(f === activeFormat ? null : f)}
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${activeFormat === f ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}
            >{f}</button>
          ))}
        </div>
        {/* Competition filter pills */}
        <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
          <button
            onClick={() => setActiveComp(null)}
            className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors ${!activeComp ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}
          >All tours</button>
          {ALL_COMPETITION_NAMES.map(c => (
            <button key={c}
              onClick={() => setActiveComp(c === activeComp ? null : c)}
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border transition-colors shrink-0 ${activeComp === c ? "bg-cyan text-bg border-cyan" : "border-line text-text-dim"}`}
            >{c}</button>
          ))}
        </div>
      </header>

      <div className="px-3 mt-3 space-y-4">
        {[...grouped.entries()].map(([dateLabel, items]) => (
          <section key={dateLabel}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5">{dateLabel}</h2>
            <div className="space-y-1.5">
              {items.map(({ match, bucket }) => (
                <ScheduleRow key={match.id} match={match} bucket={bucket} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function ScheduleRow({ match, bucket }: { match: Match; bucket: "past" | "live" | "upcoming" }) {
  const isLive = bucket === "live";
  return (
    <Link
      href={`/match/${match.id}`}
      className="card block px-3 py-2 hover:bg-bg-elevated transition flex items-center gap-3"
    >
      <div className="text-[10px] num text-text-secondary w-12 shrink-0">{fmtTime(match.startTimeIso)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <TeamChip team={match.teamA.shortName} color={match.teamA.primaryColor} />
          <span className="text-text-dim text-[10px]">vs</span>
          <TeamChip team={match.teamB.shortName} color={match.teamB.primaryColor} />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none"
            style={{ background: match.competition.logoColor ? `${match.competition.logoColor}22` : "rgba(255,255,255,0.06)", color: match.competition.logoColor ?? "#94A3B8", border: `1px solid ${match.competition.logoColor ?? "rgba(255,255,255,0.15)"}44` }}>
            {match.competition.shortName}
          </span>
          {match.format !== "T20" && (
            <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none border border-line text-text-dim">{match.format}</span>
          )}
          <span className="text-[10px] text-text-dim truncate">{match.venue.city}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {isLive ? (
          <span className="text-[9px] font-bold uppercase tracking-widest text-wicket flex items-center gap-1">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-wicket inline-block" />
            Live
          </span>
        ) : bucket === "past" && match.result ? (
          <span className="text-[10px] font-bold text-text-primary">
            {match.result.winner}
            <span className="text-text-dim font-normal"> · {match.result.margin}</span>
          </span>
        ) : (
          <span className="text-[10px] text-text-dim">Upcoming</span>
        )}
      </div>
    </Link>
  );
}

function TeamChip({ team, color }: { team: string; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="font-bold">{team}</span>
    </span>
  );
}
