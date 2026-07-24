"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ALL_TEAMS } from "@/lib/mockData";
import type { Team } from "@/lib/types";
import { getFollowPrefs, onFollowPrefsChanged, myTeamCodes, emptyFollowPrefs, type FollowPrefs } from "@/lib/followPrefs";
import {
  getSeriesGroupedSchedule,
  getTeamSchedule,
  groupScheduleByMonth,
  summarizeSeriesGroup,
  formatLastResult,
  type ScheduleEntry,
  type SeriesGroup,
  type SeriesSummary,
} from "@/lib/teamSchedule";
import ScheduleRow, { fmtDate } from "@/components/ScheduleRow";

// ============================================================================
// Schedule tab — v1.0.110, simplified v1.0.111, "All" re-grouped by series
// v1.0.112, "All" collapsed to one row per series v1.0.113
// ============================================================================
// A tab row of "All" (default) plus one tab per team the user has selected
// in Filter (nations + franchise teams both count -- see
// lib/followPrefs.ts's `myTeamCodes()`). A user with no teams selected
// just sees "All" with no team tabs at all.
//
// The two tab kinds render DIFFERENTLY on purpose:
//   - "All": one summary row per ongoing-or-upcoming series/tournament
//     app-wide -- name, a LIVE badge if anything in it is live right now,
//     the date of its next live/upcoming match, and a one-line "Last: ..."
//     recap of its most recently completed match. NO individual matches
//     inline (that was v1.0.112's behavior; v1.0.113 moved the full match
//     list to a dedicated page instead -- see
//     app/schedule/series/[competitionId]/page.tsx). Rows are ordered by
//     each series' true start date ascending, held stable as matches
//     complete, and a series where every match has already been played
//     drops out of "All" entirely -- both UNCHANGED from v1.0.112, see
//     `getSeriesGroupedSchedule` in lib/teamSchedule.ts. Tapping a row
//     opens that series' dedicated page, which shows ALL of its matches
//     (past included) in ascending date order.
//   - A team tab: unchanged since v1.0.111 -- a flat, month-grouped,
//     chronological list of exactly that team's matches (past, live, and
//     upcoming), with no series grouping, no row-collapsing, and no
//     completed-series exclusion. This split is deliberate, not an
//     oversight: per-team tabs are explicitly deferred, not redesigned, by
//     either the v1.0.112 or v1.0.113 change (see DECISIONS-LOG.md).
// Tapping "All" and tapping a team tab therefore each fetch through their
// own sanctioned interface (`getSeriesGroupedSchedule` vs.
// `getTeamSchedule`) -- see `useScheduleTab` below. `summarizeSeriesGroup`
// (lib/teamSchedule.ts) is a pure presentation derivation over an already-
// fetched `SeriesGroup` -- computed fresh every render from `seriesGroups`,
// not stored in state, so it can never itself go stale independently of
// the fetch that produced its input.
//
// v1.0.111 dropped an earlier two-view split (an all-competitions picker
// for zero-follows, a separate merged-multi-team view for one-or-more
// follows) and the win/loss colored left-border strip on a narrowed tab's
// match cards -- see DECISIONS-LOG.md for why. That simplification is
// untouched here: no colored strip on any tab or row, "All" is still the
// same content regardless of follow state.
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

  const { entries, seriesGroups, loading } = useScheduleTab(activeTab);
  const isAllTab = activeTab === "all";

  // Nations first (alphabetical), then franchise/league teams
  // (alphabetical) -- the same "national" vs "franchise" categorization
  // Filter's own Nations/Teams sections use (`Team.type`, set directly off
  // which of `NATIONAL_TEAMS`/`LEAGUE_TEAMS` a team came from in
  // lib/mockData.ts -- `ALL_TEAMS` is just those two spread together, so
  // reading `type` here is reading the exact same categorization, not a
  // second one that could drift out of sync with it). A plain single
  // alphabetical sort across both groups combined -- the previous
  // behavior -- let a franchise team like CSK land ahead of a nation like
  // IND purely by letter order, which read as arbitrary; grouping by
  // category first fixes that regardless of which specific teams are
  // followed.
  const tabTeams = useMemo(
    () =>
      teamCodes
        .map(code => ALL_TEAMS[code])
        .filter((t): t is Team => !!t)
        .sort((a, b) => {
          const aNation = a.type === "national" ? 0 : 1;
          const bNation = b.type === "national" ? 0 : 1;
          if (aNation !== bNation) return aNation - bNation;
          return a.shortName.localeCompare(b.shortName);
        }),
    [teamCodes]
  );

  // Team tabs only -- "All" renders `seriesGroups` directly instead (see
  // module comment). `entries` for "All" is still the flattened,
  // already-qualifying-series-only list, used for the header count and
  // the empty-state check below, not for month grouping.
  const monthGroups = useMemo(() => (isAllTab ? [] : groupScheduleByMonth(entries)), [entries, isAllTab]);
  const focusTeamCode = isAllTab ? undefined : activeTab;
  const isEmpty = !loading && (isAllTab ? seriesGroups.length === 0 : monthGroups.length === 0);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-4">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-dim mt-0.5">
          {loading
            ? "Loading…"
            : isAllTab
            ? `${seriesGroups.length} ongoing/upcoming series · next ~12 months`
            : `${entries.length} matches · ${tabTeams.find(t => t.code === activeTab)?.shortName ?? activeTab}, next ~12 months`}
        </p>
      </header>

      {/* Tab row: All + one per selected team. Content-hugging and
          horizontally scrollable rather than equal-width (like
          components/MatchTabs.tsx) since the number of team tabs is
          unbounded -- a user could follow a dozen teams. */}
      <div className="px-4 flex items-stretch gap-4 overflow-x-auto no-scrollbar border-b border-line">
        <TabButton label="All" active={isAllTab} onClick={() => setActiveTab("all")} />
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
        {isEmpty && (
          <p className="text-center py-16 text-text-dim text-sm">
            {isAllTab ? "No ongoing or upcoming series" : "No matches in the next year"}
          </p>
        )}

        {isAllTab ? (
          <div className="space-y-1.5">
            {seriesGroups.map(group => (
              <SeriesSummaryRow key={group.competition.id} summary={summarizeSeriesGroup(group)} />
            ))}
          </div>
        ) : (
          monthGroups.map(group => (
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
          ))
        )}
      </div>
    </main>
  );
}

/**
 * Fetches the schedule for whichever tab is active through the one
 * sanctioned interface for that tab kind -- `getSeriesGroupedSchedule` for
 * "All", `getTeamSchedule` for a team code (lib/teamSchedule.ts) -- using
 * the same hydration-safe useState(placeholder)+useEffect pattern
 * established for every other async real-data-readiness accessor in this
 * codebase (see `NationalRankBadge` in components/MatchCard.tsx,
 * `useMatchAccentColors` in components/Scorecard.tsx).
 *
 * The active tab is a plain string ("all" or a team code) -- a primitive
 * value, not an object or array -- so the effect can depend on it
 * directly with no key-derivation step, the same simplification
 * documented for v1.0.111 in ARCHITECTURE.md.
 *
 * v1.0.112: "All" and a team tab now fetch genuinely different SHAPES
 * (`seriesGroups` vs. a flat `entries` list), not just different
 * team-filtered slices of the same shape -- see the module comment above
 * for why. Both branches still re-fetch fresh on every switch back to
 * their tab (no caching across calls), so a match that completes, or a
 * series that fully concludes, is reflected the next time a user lands on
 * that tab, not stuck on whatever was true at first load.
 */
function useScheduleTab(tab: string): {
  entries: ScheduleEntry[];
  seriesGroups: SeriesGroup[];
  loading: boolean;
} {
  const [state, setState] = useState<{
    tab: string;
    entries: ScheduleEntry[];
    seriesGroups: SeriesGroup[];
    loading: boolean;
  }>({ tab: "", entries: [], seriesGroups: [], loading: true });

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));

    if (tab === "all") {
      getSeriesGroupedSchedule().then(seriesGroups => {
        if (cancelled) return;
        setState({ tab, entries: seriesGroups.flatMap(g => g.entries), seriesGroups, loading: false });
      });
    } else {
      getTeamSchedule(tab).then(entries => {
        if (cancelled) return;
        setState({ tab, entries, seriesGroups: [], loading: false });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [tab]);

  return { entries: state.entries, seriesGroups: state.seriesGroups, loading: state.loading };
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

/**
 * One row per qualifying series on the "All" tab -- v1.0.113. No inline
 * matches here on purpose (see module comment): name, a LIVE badge if
 * `summary.isLive`, the date of `summary.nextEntry` (omitted entirely if
 * absent -- see `SeriesSummary.nextEntry`'s doc comment for the fail-safe
 * case this guards), and a one-line "Last: ..." recap of
 * `summary.lastCompletedEntry` (omitted entirely if the series has no
 * completed match yet, rather than rendering an empty/broken line).
 * Tapping the row opens the dedicated per-series page.
 */
function SeriesSummaryRow({ summary }: { summary: SeriesSummary }) {
  const { competition, isLive, nextEntry, lastCompletedEntry } = summary;

  return (
    <Link
      href={`/schedule/series/${competition.id}`}
      className="card flex items-center gap-3 px-3 py-3 active:scale-[0.99] transition-transform"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm truncate">{competition.name}</span>
          {isLive && (
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-live shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />Live
            </span>
          )}
        </div>
        {lastCompletedEntry && (
          <p className="text-[10px] text-text-secondary mt-0.5 leading-snug">Last: {formatLastResult(lastCompletedEntry)}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        {nextEntry && <div className="text-[9px] text-text-dim">{fmtDate(nextEntry.match.startTimeIso)}</div>}
      </div>
    </Link>
  );
}
