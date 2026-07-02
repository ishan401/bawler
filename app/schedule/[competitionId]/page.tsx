import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_LIVE_MATCHES, ALL_UPCOMING_MATCHES } from "@/lib/mockData";
import type { Match } from "@/lib/types";

export function generateStaticParams() {
  const ids = new Set([
    ...ALL_LIVE_MATCHES.map(m => m.competition.id),
    ...ALL_UPCOMING_MATCHES.map(m => m.competition.id),
  ]);
  return Array.from(ids).map(id => ({ competitionId: id }));
}

export default function CompetitionSchedulePage({ params }: { params: { competitionId: string } }) {
  const { competitionId } = params;

  const live     = ALL_LIVE_MATCHES.filter(m => m.competition.id === competitionId);
  const upcoming = ALL_UPCOMING_MATCHES.filter(m => m.competition.id === competitionId);
  const all      = [...live, ...upcoming];
  const comp     = all[0]?.competition;

  if (!comp) notFound();

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-3">
        <Link
          href="/schedule"
          className="flex items-center gap-1.5 text-text-secondary hover:text-cyan transition-colors mb-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[11px] font-bold">Schedule</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 rounded-full shrink-0" style={{ background: comp!.logoColor ?? "#64748B" }} />
          <div>
            <h1 className="text-sm font-extrabold tracking-tight leading-tight">{comp!.name}</h1>
            <p className="text-[9px] text-text-dim uppercase tracking-widest">
              {comp!.type} · {comp!.format}
              {live.length > 0 && <span className="text-red-400 font-bold"> · {live.length} live</span>}
            </p>
          </div>
        </div>
      </header>

      <div className="px-3 mt-3 space-y-1.5">
        {all.map(m => (
          <MatchRow key={m.id} match={m} isLive={live.includes(m)} />
        ))}
      </div>
    </main>
  );
}

function MatchRow({ match, isLive }: { match: Match; isLive: boolean }) {
  return (
    <Link href={`/match/${match.id}`}
      className="card flex items-center gap-3 px-3 py-3 active:scale-[0.99] transition-transform">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <TeamChip name={match.teamA.shortName} color={match.teamA.primaryColor} />
          <span className="text-text-dim text-[10px]">vs</span>
          <TeamChip name={match.teamB.shortName} color={match.teamB.primaryColor} />
          {isLive && (
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-400 ml-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-text-dim">{match.matchNumber}</span>
          <span className="text-[9px] text-text-dim">· {match.venue.name}, {match.venue.city}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {isLive ? (
          <div className="text-[10px] text-text-secondary font-medium max-w-[110px] leading-snug">
            {match.liveStatusOverride ?? "In progress"}
          </div>
        ) : (
          <div>
            <div className="text-[10px] font-bold text-text-primary num">{fmtTime(match.startTimeIso)}</div>
            <div className="text-[9px] text-text-dim">{fmtDate(match.startTimeIso)}</div>
          </div>
        )}
      </div>
    </Link>
  );
}

function TeamChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-bold text-sm">{name}</span>
    </span>
  );
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
