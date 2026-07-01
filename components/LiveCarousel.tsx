"use client";

import Link from "next/link";
import type { Match } from "@/lib/types";
import { LiveMatchCard } from "./MatchCard";

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

export default function LiveCarousel({ matches, nextMatch }: LiveCarouselProps) {
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
    <div className="px-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory -mx-3 px-3">
        {matches.map(m => (
          <div key={m.id} className="shrink-0 snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
            <LiveMatchCard match={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
