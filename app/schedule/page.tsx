"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ALL_LIVE_MATCHES, ALL_UPCOMING_MATCHES, ALL_TEAMS } from "@/lib/mockData";
import type { Match, Competition, Team } from "@/lib/types";
import { getFollowPrefs, onFollowPrefsChanged, myTeamCodes, emptyFollowPrefs, type FollowPrefs } from "@/lib/followPrefs";
import { getMergedTeamSchedule, groupScheduleByMonth, type ScheduleEntry } from "@/lib/teamSchedule";

// ============================================================================
// Schedule tab — v1.0.110 redefault
// ============================================================================
// Two entirely different views live in this one file, chosen by whether the
// user has any teams selected in Filter (nations + franchise teams both
// count -- see lib/followPrefs.ts's `myTeamCodes()`):
//
//   - Zero teams selected: exactly today's behavior, untouched --
//     `AllCompetitionsView` below, byte-for-byte the same component this
//     file used to export directly as `SchedulePage`.
//   - One or more teams selected: `MyTeamsScheduleView` -- a single merged,
//     chronological, month-grouped list of live/upcoming/past matches for
//     every selected team, with an "All" + per-team chip row that narrows
//     the same list in place (no navigation, see DECISIONS-LOG.md).
//
// Hydration safety: `followPrefs` starts as `emptyFollowPrefs()` (the same
// value both the server render and the client's first render see, since
// localStorage doesn't exist on the server) and is only replaced with the
// real stored value inside a `useEffect` after mount -- the exact same
// pattern app/page.tsx already uses for the same reason. That means the
// FIRST paint always matches the server (today's `AllCompetitionsView`,
// unconditionally), and the swap to `MyTeamsScheduleView` -- when it
// applies -- happens after mount, not during it. `onFollowPrefsChanged`
// keeps this reactive: changing team selection in Filter while Schedule is
// already open updates `followPrefs` state immediately, which recomputes
// `myTeamCodes` and re-triggers the merged fetch -- see `useTeamSchedule`
// below for how that fetch itself stays keyed off the actual codes rather
// than the array reference.
// ============================================================================

export default function SchedulePage() {
  const [followPrefs, setFollowPrefsState] = useState<FollowPrefs>(emptyFollowPrefs());

  useEffect(() => {
    setFollowPrefsState(getFollowPrefs());
    const unsubscribe = onFollowPrefsChanged(() => setFollowPrefsState(getFollowPrefs()));
    return unsubscribe;
  }, []);

  const teamCodes = useMemo(() => myTeamCodes(followPrefs), [followPrefs]);

  if (teamCodes.length > 0) {
    return <MyTeamsScheduleView teamCodes={teamCodes} />;
  }
  return <AllCompetitionsView />;
}

// ============================================================================
// My-teams merged schedule view
// ============================================================================

/**
 * Fetches the merged schedule for `teamCodes` through the one sanctioned
 * interface (`getMergedTeamSchedule`, lib/teamSchedule.ts), using the same
 * hydration-safe useState(placeholder)+useEffect pattern established for
 * every other async real-data-readiness accessor in this codebase (see
 * `NationalRankBadge` in components/MatchCard.tsx, `useMatchAccentColors`
 * in components/Scorecard.tsx).
 *
 * v1.0.110: the effect's dependency is `key` -- `teamCodes` sorted and
 * joined into a stable string -- NOT `teamCodes` itself. A new array
 * literal is created every render (`useMemo` in the caller notwithstanding,
 * this hook has to be correct on its own), so depending on the array
 * reference would either refetch on every render (if the memo ever broke)
 * or, worse, silently miss a real change if some future caller passed an
 * array that happened to keep the same reference while its CONTENTS
 * changed. Keying off the actual values instead means: whenever a
 * re-render happens for any reason, this hook correctly detects whether
 * the set of team codes actually changed -- the identical fix already
 * applied to the accent-color hook's dependency array in v1.0.109, applied
 * here from day one instead of needing a follow-up correction.
 */
function useTeamSchedule(teamCodes: string[]): { entries: ScheduleEntry[]; loading: boolean } {
  const key = useMemo(() => [...teamCodes].sort().join(","), [teamCodes]);
  const [state, setState] = useState<{ key: string; entries: ScheduleEntry[]; loading: boolean }>({
    key: "",
    entries: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    getMergedTeamSchedule(teamCodes).then(entries => {
      if (!cancelled) setState({ key, entries, loading: false });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately
    // keyed on `key` (the codes' values), not `teamCodes` (the array
    // reference); see doc comment above.
  }, [key]);

  return { entries: state.entries, loading: state.loading };
}

function MyTeamsScheduleView({ teamCodes }: { teamCodes: string[] }) {
  const { entries, loading } = useTeamSchedule(teamCodes);
  const [activeChip, setActiveChip] = useState<string>("all");

  // If the user's selection changes (a team gets unfollowed) and the
  // previously-active chip no longer applies, fall back to "All" instead
  // of silently showing a narrowed-but-now-meaningless view.
  useEffect(() => {
    if (activeChip !== "all" && !teamCodes.includes(activeChip)) {
      setActiveChip("all");
    }
  }, [teamCodes, activeChip]);

  const chipTeams = useMemo(
    () =>
      teamCodes
        .map(code => ALL_TEAMS[code])
        .filter((t): t is Team => !!t)
        .sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [teamCodes]
  );

  const visible = useMemo(() => {
    if (activeChip === "all") return entries;
    return entries.filter(e => e.match.teamA.code === activeChip || e.match.teamB.code === activeChip);
  }, [entries, activeChip]);

  const groups = useMemo(() => groupScheduleByMonth(visible), [visible]);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-4">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-dim mt-0.5">
          {loading
            ? "Loading your teams…"
            : activeChip === "all"
            ? `${entries.length} matches · your teams, next ~12 months`
            : `${visible.length} matches · ${chipTeams.find(t => t.code === activeChip)?.shortName ?? activeChip}, next ~12 months`}
        </p>
      </header>

      {/* Chip row: All + one per selected team, narrows the same list in place */}
      <div className="px-3 mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Chip label="All" active={activeChip === "all"} onClick={() => setActiveChip("all")} />
        {chipTeams.map(team => (
          <Chip
            key={team.code}
            label={team.shortName}
            color={team.primaryColor}
            active={activeChip === team.code}
            onClick={() => setActiveChip(team.code)}
          />
        ))}
      </div>

      <div className="px-3 mt-3 space-y-4">
        {!loading && groups.length === 0 && (
          <p className="text-center py-16 text-text-dim text-sm">No matches in the next year</p>
        )}
        {groups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5 px-1">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.entries.map(entry => (
                <ScheduleRow key={entry.match.id} entry={entry} focusTeamCode={activeChip === "all" ? undefined : activeChip} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
        active
          ? "bg-cyan/15 border-cyan text-cyan"
          : "bg-bg-surface border-line text-text-secondary active:scale-[0.97]"
      }`}
    >
      {color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />}
      {label}
    </button>
  );
}

function ScheduleRow({ entry, focusTeamCode }: { entry: ScheduleEntry; focusTeamCode?: string }) {
  const { match, bucket, confirmed } = entry;
  const isLive = bucket === "live";
  const isPast = bucket === "past";

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
      {isPast && focusTeamCode && (
        <div className={`w-1 self-stretch rounded-full shrink-0 ${won ? "bg-boundary" : lost ? "bg-negative" : "bg-text-dim"}`} />
      )}

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
              <span className={`font-bold ${won ? "text-boundary" : lost ? "text-negative" : ""}`}>
                {won ? "Won" : lost ? "Lost" : "Tied/Drawn"}
              </span>
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
            <div className="text-[9px] text-text-dim">{fmtDate(match.startTimeIso)}</div>
          </>
        )}
        {isPast && <div className="text-[9px] text-text-dim">{fmtDate(match.startTimeIso)}</div>}
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

// ============================================================================
// All-competitions view (today's default, byte-for-byte unchanged) --
// rendered whenever the user has zero teams selected in Filter.
// ============================================================================

// ── Popularity scores (cricket-first, same formula used everywhere) ──────────
const COMP_POP: Record<string, number> = {
  "icc-t20wc-2026":    100,
  "icc-ct-2025":        95,
  "ashes-2025-26":      90,
  "ipl-2026":           88,
  "ind-eng-test-2026":  82,
  "ind-aus-t20i-2026":  80,
  "eng-sa-odi-2026":    68,
  "bbl-2025-26":        66,
  "psl-2026":           64,
  "hundred-2026":       58,
  "sa20-2026":          52,
  "cpl-2025":           46,
  "mlc-2026":           40,
};

const TYPE_LABEL: Record<Competition["type"], string> = {
  league:        "League",
  international: "International",
  bilateral:     "Series",
  domestic:      "Domestic",
};

interface CompRow {
  competition: Competition;
  liveCount: number;
  upcomingCount: number;
  pop: number;
}

function AllCompetitionsView() {
  const rows = useMemo<CompRow[]>(() => {
    const map = new Map<string, CompRow>();

    const add = (m: Match, isLive: boolean) => {
      const c = m.competition;
      if (!map.has(c.id)) {
        map.set(c.id, {
          competition: c,
          liveCount: 0,
          upcomingCount: 0,
          pop: COMP_POP[c.id] ?? 30,
        });
      }
      const row = map.get(c.id)!;
      if (isLive) row.liveCount++;
      else row.upcomingCount++;
    };

    ALL_LIVE_MATCHES.forEach(m => add(m, true));
    ALL_UPCOMING_MATCHES.forEach(m => add(m, false));

    return Array.from(map.values()).sort((a, b) => b.pop - a.pop);
  }, []);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-4">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-dim mt-0.5">{rows.length} competitions · sorted by popularity</p>
      </header>

      <div className="px-3 mt-3 space-y-1.5">
        {rows.map(({ competition, liveCount, upcomingCount }) => (
          <Link
            key={competition.id}
            href={`/schedule/${competition.id}`}
            className="card flex items-center gap-3 px-4 py-3.5 active:scale-[0.99] transition-transform"
          >
            {/* Color accent bar */}
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: competition.logoColor ?? "#64748B" }} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-text-primary truncate">{competition.name}</span>
                {liveCount > 0 && (
                  <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {liveCount} live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-line text-text-dim font-bold uppercase tracking-wide leading-none">
                  {TYPE_LABEL[competition.type]}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-line text-text-dim font-bold uppercase tracking-wide leading-none">
                  {competition.format}
                </span>
                <span className="text-[9px] text-text-dim">
                  {upcomingCount > 0 ? `${upcomingCount} upcoming` : ""}
                  {liveCount > 0 && upcomingCount > 0 ? " · " : ""}
                  {liveCount > 0 ? `${liveCount} live` : ""}
                </span>
              </div>
            </div>

            {/* Chevron */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-16 text-text-dim text-sm">No competitions found</div>
        )}
      </div>
    </main>
  );
}
