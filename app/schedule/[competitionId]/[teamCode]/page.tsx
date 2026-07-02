import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_LIVE_MATCHES, ALL_PAST_MATCHES, ALL_UPCOMING_MATCHES, ALL_TEAMS } from "@/lib/mockData";
import type { Match } from "@/lib/types";

export function generateStaticParams() {
  const params: { competitionId: string; teamCode: string }[] = [];
  const all = [...ALL_LIVE_MATCHES, ...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES];
  const seen = new Set<string>();
  for (const m of all) {
    for (const code of [m.teamA.code, m.teamB.code]) {
      const key = `${m.competition.id}__${code}`;
      if (!seen.has(key)) {
        seen.add(key);
        params.push({ competitionId: m.competition.id, teamCode: code });
      }
    }
  }
  return params;
}

export default function TeamSchedulePage({
  params,
}: {
  params: { competitionId: string; teamCode: string };
}) {
  const { competitionId, teamCode } = params;
  const team = ALL_TEAMS[teamCode];
  const all = [...ALL_LIVE_MATCHES, ...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES];
  const compMatches = all.filter(
    m => m.competition.id === competitionId &&
      (m.teamA.code === teamCode || m.teamB.code === teamCode)
  );
  const comp = compMatches[0]?.competition;
  if (!team || !comp) notFound();

  const live     = compMatches.filter(m => m.status === "live" || m.status === "toss");
  const past     = compMatches.filter(m => m.status === "post-match");
  const upcoming = compMatches.filter(m => m.status === "upcoming" || m.status === "pre-match");

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-3">
        <Link href={`/schedule/${competitionId}`}
          className="flex items-center gap-1.5 text-text-secondary hover:text-cyan transition-colors mb-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-[11px] font-bold">{comp.shortName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: team.primaryColor }} />
          <h1 className="text-sm font-extrabold">{team.fullName ?? team.shortName}</h1>
          <span className="text-[9px] text-text-dim px-1.5 py-0.5 rounded border border-line uppercase tracking-wide font-bold">
            {comp.shortName}
          </span>
        </div>
      </header>

      <div className="px-3 mt-3 space-y-4">
        {/* Live */}
        {live.length > 0 && (
          <Section label="🔴 Live Now">
            {live.map(m => <MatchRow key={m.id} match={m} teamCode={teamCode} status="live" />)}
          </Section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Section label="Upcoming">
            {upcoming.map(m => <MatchRow key={m.id} match={m} teamCode={teamCode} status="upcoming" />)}
          </Section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <Section label="Results">
            {[...past].reverse().map(m => <MatchRow key={m.id} match={m} teamCode={teamCode} status="past" />)}
          </Section>
        )}

        {compMatches.length === 0 && (
          <p className="text-center py-16 text-text-dim text-sm">No matches found</p>
        )}
      </div>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5 px-1">{label}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function MatchRow({ match, teamCode, status }: { match: Match; teamCode: string; status: "live" | "upcoming" | "past" }) {
  const isHome = match.teamA.code === teamCode;
  const opp    = isHome ? match.teamB : match.teamA;
  const won    = match.result?.winner === teamCode;
  const lost   = match.result && match.result.winner !== teamCode &&
                 match.result.winner !== "draw" && match.result.winner !== "tie" && match.result.winner !== "no-result";

  return (
    <Link href={`/match/${match.id}`}
      className="card flex items-start gap-3 px-3 py-3 active:scale-[0.99] transition-transform">
      {/* Result indicator */}
      {status === "past" && (
        <div className={`w-1 self-stretch rounded-full shrink-0 ${won ? "bg-boundary" : lost ? "bg-wicket" : "bg-text-dim"}`} />
      )}

      <div className="flex-1 min-w-0">
        {/* Opponent + match number */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold">vs {opp.shortName}</span>
          {status === "live" && (
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />Live
            </span>
          )}
          <span className="text-[9px] text-text-dim">{match.matchNumber}</span>
        </div>

        {/* Summary / status / result */}
        {status === "past" && match.result && (
          <p className="text-[10px] text-text-secondary mt-0.5 leading-snug">
            <span className={`font-bold ${won ? "text-boundary" : "text-wicket"}`}>
              {won ? "Won" : lost ? "Lost" : "Tied"}
            </span>
            {match.result.margin ? ` · ${match.result.margin}` : ""}
          </p>
        )}
        {status === "past" && match.summary && (
          <p className="text-[10px] text-text-dim mt-0.5 leading-snug line-clamp-1">{match.summary}</p>
        )}
        {status === "live" && match.liveStatusOverride && (
          <p className="text-[10px] text-cyan font-medium mt-0.5">{match.liveStatusOverride}</p>
        )}

        {/* Venue */}
        <p className="text-[9px] text-text-dim mt-0.5">{match.venue.name}, {match.venue.city}</p>
      </div>

      {/* Date / time */}
      <div className="text-right shrink-0">
        {status === "upcoming" && (
          <>
            <div className="text-[10px] font-bold num">{fmtTime(match.startTimeIso)}</div>
            <div className="text-[9px] text-text-dim">{fmtDate(match.startTimeIso)}</div>
          </>
        )}
        {status === "past" && (
          <div className="text-[9px] text-text-dim">{fmtDate(match.startTimeIso)}</div>
        )}
      </div>
    </Link>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}
