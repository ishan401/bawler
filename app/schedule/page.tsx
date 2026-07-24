"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ALL_TEAMS } from "@/lib/mockData";
import type { Team } from "@/lib/types";
import { getFollowPrefs, onFollowPrefsChanged, myTeamCodes, emptyFollowPrefs, type FollowPrefs } from "@/lib/followPrefs";
import { getFullSchedule, getTeamSchedule, groupScheduleByMonth, type ScheduleEntry } from "@/lib/teamSchedule";

// ============================================================================
// Schedule tab — v1.0.110, simplified v1.0.111
// ============================================================================
// One view, always: a tab row of "All" (default, every match app-wide, in
// ascending date order, grouped by month) plus one tab per team the user
// has selected in Filter (nations + franchise teams both count -- see
// lib/followPrefs.ts's `myTeamCodes()`). Tapping a team tab narrows the
// SAME list to just that team's matches; tapping "All" shows everything
// again. A user with no teams selected just sees "All" with no team tabs
// at all -- same content either way, since "All" never depended on
// whether anyone follows anything.
//
// v1.0.111 dropped the earlier two-view split (an all-competitions picker
// for zero-follows, a separate merged-multi-team view for one-or-more
// follows) and the win/loss colored left-border strip on a narrowed tab's
// match cards -- see DECISIONS-LOG.md for why. What's left is simpler on
// purpose: one component, one list style, a tab row that only changes
// which team (if any) filters it.
//
// Hydration safety: `followPrefs` starts as `emptyFollowPrefs()` (the same
// value both the server render and the client's first render see, since
// localStorage doesn't exist on the server) and is only replaced with the
// real stored value inside a `useEffect` after mount -- the same pattern
// app/page.tsx already uses for the same reason. Since "All" (the first
// paint, before any team tabs exist) is now identical regardless of follow
// state, there's no visible flash either way -- the team tabs simply
// appear once mounted, if there are any. `onFollowPrefsChanged` keeps this
// reactive: changing team selection in Filter while Schedule is open
// updates the tab row immediately, and falls back to "All" if the
// currently-active tab's team gets unfollowed.
// ============================================================================

export default function SchedulePage() {
  const [followPrefs, setFollowPrefsState] = useState<FollowPrefs>(emptyFollowPrefs());

  useEffect(() => {
    setFollowPrefsState(getFollowPrefs());
    const unsubscribe = onFollowPrefsChanged(() => setFollowPrefsState(getFollowPrefs()));
    return unsubscribe;
  }, []);

  const teamCodes = useMemo(() => myTeamCodes(followPrefs), [followPrefs]);
  const [activeTab, setActiveTab] = useState<string>("all");

  // If the active tab's team gets unfollowed, fall back to "All" instead
  // of silently showing a narrowed-but-now-meaningless view.
  useEffect(() => {
    if (activeTab !== "all" && !teamCodes.includes(activeTab)) {
      setActiveTab("all");
    }
  }, [teamCodes, activeTab]);

  const { entries, loading } = useScheduleTab(activeTab);

  const tabTeams = useMemo(
    () =>
      teamCodes
        .map(code => ALL_TEAMS[code])
        .filter((t): t is Team => !!t)
        .sort((a, b) => a.shortName.localeCompare(b.shortName)),
    [teamCodes]
  );

  const groups = useMemo(() => groupScheduleByMonth(entries), [entries]);
  const focusTeamCode = activeTab === "all" ? undefined : activeTab;

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-4">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-dim mt-0.5">
          {loading
            ? "Loading…"
            : activeTab === "all"
            ? `${entries.length} matches · next ~12 months`
            : `${entries.length} matches · ${tabTeams.find(t => t.code === activeTab)?.shortName ?? activeTab}, next ~12 months`}
        </p>
      </header>

      {/* Tab row: All + one per selected team. Content-hugging and
          horizontally scrollable rather than equal-width (like
          components/MatchTabs.tsx) since the number of team tabs is
          unbounded -- a user could follow a dozen teams. */}
      <div className="px-4 flex items-stretch gap-4 overflow-x-auto no-scrollbar border-b border-line">
        <TabButton label="All" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
        {tabTeams.map(team => (
          <TabButton
            key={team.code}
            label={team.shortName}
            active={activeTab === team.code}
            onClick={() => setActiveTab(team.code)}
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
                <ScheduleRow key={entry.match.id} entry={entry} focusTeamCode={focusTeamCode} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

/**
 * Fetches the schedule for whichever tab is active through the one
 * sanctioned interface (`getFullSchedule`/`getTeamSchedule`,
 * lib/teamSchedule.ts), using the same hydration-safe
 * useState(placeholder)+useEffect pattern established for every other
 * async real-data-readiness accessor in this codebase (see
 * `NationalRankBadge` in components/MatchCard.tsx, `useMatchAccentColors`
 * in components/Scorecard.tsx).
 *
 * v1.0.111: the active tab is already a plain string ("all" or a team
 * code) -- a primitive value, not an object or array -- so the effect can
 * depend on it directly with no extra key-derivation step. This is a real
 * simplification over v1.0.110's `useTeamSchedule`, which had to guard
 * against a new array-reference-with-same-values on every render; a
 * single string doesn't have that problem, so there's nothing to get
 * wrong here the way the accent-color hook's dependency array once did.
 */
function useScheduleTab(tab: string): { entries: ScheduleEntry[]; loading: boolean } {
  const [state, setState] = useState<{ tab: string; entries: ScheduleEntry[]; loading: boolean }>({
    tab: "",
    entries: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    const fetch = tab === "all" ? getFullSchedule() : getTeamSchedule(tab);
    fetch.then(entries => {
      if (!cancelled) setState({ tab, entries, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return { entries: state.entries, loading: state.loading };
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-1 py-3 text-xs font-bold uppercase tracking-widest relative transition-colors ${
        active ? "text-cyan" : "text-text-dim hover:text-text-secondary"
      }`}
    >
      {label}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan rounded-full" />}
    </button>
  );
}

function ScheduleRow({ entry, focusTeamCode }: { entry: ScheduleEntry; focusTeamCode?: string }) {
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
