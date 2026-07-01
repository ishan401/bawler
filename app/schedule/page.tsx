"use client";

import Link from "next/link";
import { LIVE_MATCHES, PAST_MATCHES, UPCOMING_MATCHES } from "@/lib/mockData";
import type { Match } from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

type GroupedMatch = { match: Match; bucket: "past" | "live" | "upcoming" };

export default function SchedulePage() {
  // Combine all matches chronologically
  const all: GroupedMatch[] = [
    ...PAST_MATCHES.map(m => ({ match: m, bucket: "past" as const })),
    ...LIVE_MATCHES.map(m => ({ match: m, bucket: "live" as const })),
    ...UPCOMING_MATCHES.map(m => ({ match: m, bucket: "upcoming" as const })),
  ].sort((a, b) => new Date(a.match.startTimeIso).getTime() - new Date(b.match.startTimeIso).getTime());

  // Group by date string
  const grouped = new Map<string, GroupedMatch[]>();
  for (const item of all) {
    const key = fmtDate(item.match.startTimeIso);
    const arr = grouped.get(key) ?? [];
    arr.push(item);
    grouped.set(key, arr);
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 sm:top-4 z-30 bg-bg/90 backdrop-blur border-b border-line px-3 py-3 flex items-center gap-3">
        <Link href="/" className="text-text-dim hover:text-text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
          <p className="text-[10px] text-text-secondary">IPL 2026 · all matches</p>
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
        <div className="text-[10px] text-text-dim truncate mt-0.5">{match.venue.name} · {match.venue.city}</div>
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
