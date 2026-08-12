"use client";

import Link from "next/link";
import type { ScheduleEntry } from "@/lib/teamSchedule";
import { useClientNow } from "@/lib/useClientNow";

// v1.0.194 -- this file gained "use client" here specifically so its own
// fmtDate() (the "Today"/"Tomorrow" label below) can defer to
// useClientNow() and never run during a server render. This component is
// embedded from three places: a genuine Client Component
// (app/schedule/page.tsx, already hydrated -- this was a real, reproduced
// hydration mismatch there) and two statically-prerendered Server
// Components (app/schedule/[competitionId]/page.tsx,
// app/schedule/series/[competitionId]/page.tsx). For the latter two,
// "Today"/"Tomorrow" being computed from build-time Date.now() would have
// gone stale for every visitor until the next rebuild -- a silent
// wrong-label bug, not a console error, but the same underlying cause.
// Making this one leaf a Client Component is the standard, sanctioned
// Next.js pattern for embedding a bit of runtime-fresh UI inside an
// otherwise-static server page, and fixes both problems the same way.

// ============================================================================
// ScheduleRow — v1.0.113
// ============================================================================
// Extracted out of app/schedule/page.tsx so the new per-series dedicated
// page (app/schedule/series/[competitionId]/page.tsx) can render its match
// list in the exact same card format as the Schedule tab's per-team tabs,
// rather than inventing a second card style for the same underlying
// `ScheduleEntry` shape. No behavior change from the pre-extraction version
// -- same markup, same "no color-coding by result" rule from v1.0.111.
// ============================================================================

export default function ScheduleRow({ entry, focusTeamCode }: { entry: ScheduleEntry; focusTeamCode?: string }) {
  // v1.0.194 -- null until mounted; both fmtDate() call sites below render
  // a stable placeholder (no text) until then. See the file-level comment.
  const now = useClientNow();
  const { match, bucket, confirmed } = entry;
  const isLive = bucket === "live";
  const isPast = bucket === "past";

  // Used only to decide the WORDING ("Won"/"Lost") from the active tab's
  // team's perspective -- v1.0.111 deliberately removed the colored
  // left-border strip and the colored text this used to also drive, so a
  // match card looks identical whether "All" or a specific team's tab is
  // active. See DECISIONS-LOG.md.
  const won = focusTeamCode ? match.result?.winner === focusTeamCode : undefined;
  const lost =
    focusTeamCode &&
    match.result &&
    match.result.winner !== focusTeamCode &&
    !["draw", "tie", "no-result"].includes(match.result.winner);

  return (
    <Link
      href={`/match/${match.id}`}
      className="card flex items-start gap-3 px-3 py-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TeamChip name={match.teamA.shortName} color={match.teamA.primaryColor} />
          <span className="text-text-dim text-[10px]">vs</span>
          <TeamChip name={match.teamB.shortName} color={match.teamB.primaryColor} />
          {isLive && (
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-live shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />Live
            </span>
          )}
          {!confirmed && (
            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-line text-text-dim shrink-0">
              Unconfirmed
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[9px] text-text-dim">{match.competition.shortName}</span>
          {match.matchNumber && <span className="text-[9px] text-text-dim">· {match.matchNumber}</span>}
        </div>

        {isPast && match.result && (
          <p className="text-[10px] text-text-secondary mt-0.5 leading-snug">
            {focusTeamCode ? (
              <span className="font-bold">{won ? "Won" : lost ? "Lost" : "Tied/Drawn"}</span>
            ) : (
              <span className="font-bold">
                {match.result.winner === "draw" ? "Drawn" : match.result.winner === "tie" ? "Tied" : `${match.result.winner} won`}
              </span>
            )}
            {match.result.margin ? ` · ${match.result.margin}` : ""}
          </p>
        )}
        {isLive && match.liveStatusOverride && (
          <p className="text-[10px] text-cyan font-medium mt-0.5">{match.liveStatusOverride}</p>
        )}

        <p className="text-[9px] text-text-dim mt-0.5">
          {confirmed ? `${match.venue.name}, ${match.venue.city}` : "Venue TBD"}
        </p>
      </div>

      <div className="text-right shrink-0">
        {bucket === "upcoming" && (
          <>
            <div className="text-[10px] font-bold num">{fmtTime(match.startTimeIso)}</div>
            <div className="text-[9px] text-text-dim">{now !== null && fmtDate(match.startTimeIso, now)}</div>
          </>
        )}
        {isPast && <div className="text-[9px] text-text-dim">{now !== null && fmtDate(match.startTimeIso, now)}</div>}
      </div>
    </Link>
  );
}

export function TeamChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-bold text-sm">{name}</span>
    </span>
  );
}

// v1.0.194 -- takes `now` as an explicit parameter instead of reading
// `new Date()` internally; see the file-level comment above.
export function fmtDate(iso: string, now: number): string {
  const d = new Date(iso);
  const today = new Date(now);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}
