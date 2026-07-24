import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCompetitionIds, getMatchesForCompetition } from "@/lib/teamSchedule";
import ScheduleRow from "@/components/ScheduleRow";

// ============================================================================
// Dedicated per-series/tournament page — v1.0.113
// ============================================================================
// New in v1.0.113: the "All" tab's summary rows (see app/schedule/page.tsx)
// link here instead of listing a series' matches inline. Shows every match
// a series/tournament has -- past, live, and upcoming -- in ascending date
// order, using the exact same `ScheduleRow` card format as the rest of
// Schedule (no `focusTeamCode`, so no color-coding, matching the "identical
// card look on every tab/page" rule from v1.0.111).
//
// Reads through `getMatchesForCompetition(competitionId)` in
// lib/teamSchedule.ts -- the one sanctioned entry point for a single
// series' full match history -- never a direct read of the mock match
// arrays. Deliberately distinct from the pre-existing
// `/schedule/[competitionId]` route (still linked from
// `components/MiniStandings.tsx` for its own standings-drill-down purpose,
// live/upcoming only, reads the raw arrays directly): that route predates
// this real-data-readiness pattern and is out of scope here, the same
// accepted-separate-decision precedent noted elsewhere in this codebase.
//
// A plain async server component -- no client-side state needed, since
// this page has no interactivity of its own beyond `Link` navigation.
// `generateStaticParams` enumerates every valid competition id through
// `getAllCompetitionIds()` (itself reading through `safeCompetition`), so
// build-time param generation goes through the same sanctioned interface
// as the render path -- no duplicated validation logic between the two.
// ============================================================================

export async function generateStaticParams() {
  const ids = await getAllCompetitionIds();
  return ids.map(id => ({ competitionId: id }));
}

export default async function SeriesSchedulePage({ params }: { params: { competitionId: string } }) {
  const entries = await getMatchesForCompetition(params.competitionId);
  if (entries.length === 0) notFound();

  const competition = entries[0].match.competition;
  const liveCount = entries.filter(e => e.bucket === "live").length;

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-4">
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
          <div className="w-1 h-6 rounded-full shrink-0" style={{ background: competition.logoColor ?? "#64748B" }} />
          <div>
            <h1 className="text-sm font-extrabold tracking-tight leading-tight">{competition.name}</h1>
            <p className="text-[9px] text-text-dim uppercase tracking-widest">
              {competition.type} · {competition.format}
              {liveCount > 0 && (
                <span className="text-live font-bold"> · {liveCount} live</span>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="px-3 mt-3 space-y-1.5">
        {entries.map(entry => (
          <ScheduleRow key={entry.match.id} entry={entry} />
        ))}
      </div>
    </main>
  );
}
