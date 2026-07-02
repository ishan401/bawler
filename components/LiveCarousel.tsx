"use client";

import Link from "next/link";
import { useState } from "react";
import type { Match } from "@/lib/types";
import { LiveMatchCard } from "./MatchCard";
import MiniStandings from "./MiniStandings";

interface LiveCarouselProps {
  matches: Match[];
  nextMatch?: Match;
}

function fmtCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `in ${days}d ${hrs}h`;
  if (hrs > 0)  return `in ${hrs}h ${mins}m`;
  return `in ${mins}m`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, weekday: "short" });
}

// Bottom sheet showing standings for a competition
function StandingsSheet({ compName, compShort, onClose, children }: {
  compName: string;
  compShort: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-bg-surface border-t border-line max-h-[80vh] flex flex-col overflow-hidden"
        style={{ maxWidth: 430, margin: "0 auto" }}
      >
        {/* Handle + header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-line shrink-0">
          <div className="w-10 h-1 rounded-full bg-line absolute top-2 left-1/2 -translate-x-1/2" />
          <div className="pt-1">
            <span className="text-sm font-extrabold">{compName}</span>
            <span className="ml-2 text-[10px] text-text-dim font-bold uppercase tracking-widest">Standings</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1 p-3">
          {children}
        </div>
      </div>
    </>
  );
}

export default function LiveCarousel({ matches, nextMatch }: LiveCarouselProps) {
  const [openCompId, setOpenCompId] = useState<string | null>(null);

  // Unique league competitions among live matches that have standings data
  const leagueComps = (() => {
    const seen = new Set<string>();
    return matches
      .filter(m => m.competition.type === "league" || m.competition.type === "international")
      .map(m => m.competition)
      .filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
  })();

  const openComp = leagueComps.find(c => c.id === openCompId) ?? null;

  if (matches.length === 0) {
    return (
      <div className="mx-3">
        <div className="card px-4 py-4">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-dim shrink-0">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">No live matches right now</span>
          </div>

          {nextMatch ? (
            <>
              <p className="text-xs text-text-secondary mb-3">Next up</p>
              <Link href={`/match/${nextMatch.id}`} className="tap-scale block">
                <div className="flex items-center justify-between gap-3">
                  {/* Team A */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: nextMatch.teamA.primaryColor }} />
                    <span className="text-base font-extrabold">{nextMatch.teamA.shortName}</span>
                  </div>
                  {/* vs + countdown */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] font-bold text-text-dim">vs</span>
                    <span className="text-[11px] font-extrabold text-cyan num">{fmtCountdown(nextMatch.startTimeIso)}</span>
                  </div>
                  {/* Team B */}
                  <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: nextMatch.teamB.primaryColor }} />
                    <span className="text-base font-extrabold">{nextMatch.teamB.shortName}</span>
                  </div>
                </div>
                {/* Venue + time */}
                <div className="mt-2 text-[10px] text-text-dim text-center">
                  {fmtTime(nextMatch.startTimeIso)} · {nextMatch.venue.name}, {nextMatch.venue.city}
                </div>
              </Link>
            </>
          ) : (
            <p className="text-sm text-text-secondary">Check the schedule for upcoming matches.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory -mx-3 px-3">
          {matches.map(m => (
            <div key={m.id} className="shrink-0 snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
              <LiveMatchCard match={m} />
            </div>
          ))}
        </div>

        {/* TABLE buttons — one per live league competition */}
        {leagueComps.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {leagueComps.map(comp => (
              <button
                key={comp.id}
                onClick={() => setOpenCompId(comp.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-line text-[11px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors tap-scale"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="0.5" y="0.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="0.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="0.5" y="7" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="7" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                {comp.shortName} Table
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Standings bottom sheet */}
      {openComp && (
        <StandingsSheet
          compName={openComp.name}
          compShort={openComp.shortName}
          onClose={() => setOpenCompId(null)}
        >
          <MiniStandings competition={openComp} />
        </StandingsSheet>
      )}
    </>
  );
}
