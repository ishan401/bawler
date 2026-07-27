"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerProfile, FormatStats, PlayerFormatKey } from "@/lib/types";
import { ALL_TEAMS } from "@/lib/mockData";
import { resolveTeamAccentColor } from "@/lib/teamAccentColor";
import { getRecentForm, getPlayerAchievements, type RecentFormSeries, type AchievementLine } from "@/lib/playerForm";
import { CYAN } from "@/lib/tokens";
import RecentFormGraph from "./RecentFormGraph";
import PlayerAchievements from "./PlayerAchievements";

interface Props {
  player: PlayerProfile;
}

// Centralized in lib/types.ts as PlayerFormatKey (v1.0.117) so this view and
// lib/playerForm.ts share one definition instead of two that could drift.
type FormatKey = PlayerFormatKey;

const FORMAT_LABELS: Record<FormatKey, string> = {
  test: "TEST",
  odi: "ODI",
  t20i: "T20I",
  franchise: "Franchise",  // label overridden per-player via franchiseLeague
};

const ROLE_LABELS: Record<PlayerProfile["role"], string> = {
  batsman: "Batter",
  bowler: "Bowler",
  "all-rounder": "All-Rounder",
  "wicket-keeper": "WK-Batter",
};

const ROLE_COLORS: Record<PlayerProfile["role"], string> = {
  batsman: "#22d3ee",
  bowler: "#f87171",
  "all-rounder": "#a78bfa",
  "wicket-keeper": "#34d399",
};

function formatDate(dob?: string): string {
  if (!dob) return "";
  const d = new Date(dob);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function age(dob?: string): string {
  if (!dob) return "";
  const diff = Date.now() - new Date(dob).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `Age ${years}`;
}

function StatCell({ label, value }: { label: string; value?: string | number }) {
  // Guard: API can return null or NaN for fields without data
  if (value === undefined || value === null) return null;
  if (typeof value === "number" && isNaN(value)) return null;
  if (value === "" || value === "-") return null;
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-3">
      <span className="text-base font-extrabold text-text-primary num tracking-tight">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-text-dim font-semibold">{label}</span>
    </div>
  );
}

function BattingStats({ stats }: { stats: FormatStats }) {
  const hasBatting = (stats.runs ?? 0) > 0 || stats.battingAvg !== undefined;
  if (!hasBatting) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2 px-1">Batting</p>
      <div className="card grid grid-cols-4 divide-x divide-line">
        <StatCell label="Mat" value={stats.matches} />
        <StatCell label="Runs" value={stats.runs?.toLocaleString()} />
        <StatCell label="Avg" value={stats.battingAvg?.toFixed(1)} />
        <StatCell label="SR" value={stats.battingStrikeRate?.toFixed(1)} />
      </div>
      <div className="card grid grid-cols-4 divide-x divide-line mt-1">
        <StatCell label="HS" value={stats.highScore} />
        <StatCell label="Inn" value={stats.innings} />
        <StatCell label="100s" value={stats.hundreds} />
        <StatCell label="50s" value={stats.fifties} />
      </div>
    </div>
  );
}

function BowlingStats({ stats }: { stats: FormatStats }) {
  const hasBowling = (stats.wickets ?? 0) > 0 || stats.bowlingAvg !== undefined;
  if (!hasBowling) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2 px-1">Bowling</p>
      <div className="card grid grid-cols-4 divide-x divide-line">
        <StatCell label="Wkts" value={stats.wickets} />
        <StatCell label="Avg" value={stats.bowlingAvg?.toFixed(1)} />
        <StatCell label="Eco" value={stats.economy?.toFixed(2)} />
        <StatCell label="Best" value={stats.bestBowling} />
      </div>
      {stats.fiveWickets !== undefined && (
        <div className="card grid grid-cols-4 divide-x divide-line mt-1">
          <StatCell label="5W" value={stats.fiveWickets} />
          <StatCell label="Mat" value={stats.matches} />
          <div className="col-span-2" />
        </div>
      )}
    </div>
  );
}

function RankingPill({ label, rank }: { label: string; rank?: number }) {
  if (!rank) return null;
  return (
    <div className="flex items-center gap-1.5 bg-surface/60 border border-line rounded-full px-2.5 py-1">
      <span className="text-[9px] uppercase tracking-widest text-text-dim font-semibold">{label}</span>
      <span className="text-xs font-extrabold text-cyan num">#{rank}</span>
    </div>
  );
}

/**
 * Fetches a player's recent-form series, achievement lines, and resolved
 * team accent color together, re-fetching whenever `player` or `format`
 * changes -- never reusing the previous tab's (or previous player's)
 * snapshot. Explicitly reset to empty/default SYNCHRONOUSLY before the
 * async calls resolve (plus a `cancelled` guard against a stale resolve
 * landing after a fast switch), so a tab change or remount never shows
 * stale data even for one frame.
 *
 * International formats (test/odi/t20i) theme off the player's national
 * team; "franchise" themes off their league team. A player missing the
 * relevant code, or whose code doesn't resolve to a real Team in
 * ALL_TEAMS, falls straight to the platform cyan -- the same "no usable
 * color" fallback resolveTeamAccentColor() already applies to a team with
 * no usable color of its own.
 *
 * Deliberately private to this file under normal circumstances (matching
 * useScheduleTab/useMatchAccentColors elsewhere in this codebase) but has
 * no next/navigation dependency, so it's exported here for the
 * react-test-renderer recomputation tests -- see DECISIONS-LOG.md v1.0.118.
 */
export function usePlayerFormState(
  player: PlayerProfile,
  format: PlayerFormatKey
): { recentForm: RecentFormSeries | null; achievementLines: AchievementLine[]; teamColor: string } {
  const [recentForm, setRecentForm] = useState<RecentFormSeries | null>(null);
  const [achievementLines, setAchievementLines] = useState<AchievementLine[]>([]);
  const [teamColor, setTeamColor] = useState<string>(CYAN);

  useEffect(() => {
    let cancelled = false;
    setRecentForm(null);
    setAchievementLines([]);
    (async () => {
      const [series, lines] = await Promise.all([
        getRecentForm(player, format),
        getPlayerAchievements(player, format),
      ]);
      const teamCode = format === "franchise" ? player.franchiseCode : player.teamCode;
      const team = teamCode ? ALL_TEAMS[teamCode] : undefined;
      const color = team ? await resolveTeamAccentColor(team) : CYAN;
      if (!cancelled) {
        setRecentForm(series);
        setAchievementLines(lines);
        setTeamColor(color);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [player, format]);

  return { recentForm, achievementLines, teamColor };
}

export default function PlayerProfileView({ player }: Props) {
  const router = useRouter();
  const roleColor = ROLE_COLORS[player.role];

  // Determine which format tabs exist
  const tabs: FormatKey[] = (["test", "odi", "t20i", "franchise"] as FormatKey[]).filter(f => {
    if (f === "test") return !!player.testStats;
    if (f === "odi") return !!player.odiStats;
    if (f === "t20i") return !!player.t20iStats;
    if (f === "franchise") return !!player.franchiseStats;
    return false;
  });

  const [activeTab, setActiveTab] = useState<FormatKey>(tabs[0] ?? "test");

  const stats =
    activeTab === "test" ? player.testStats :
    activeTab === "odi" ? player.odiStats :
    activeTab === "t20i" ? player.t20iStats :
    player.franchiseStats;

  const rankings = player.iccRankings;

  // Recent form + achievements (v1.0.117, rebuilt on real match data
  // v1.0.118) -- extracted to a standalone hook below (usePlayerFormState)
  // so it has no dependency on next/navigation's useRouter, making it
  // directly mountable with react-test-renderer for the recomputation
  // tests in DECISIONS-LOG.md v1.0.118 without needing to mock the app
  // router. Same "temporarily export a private hook for testing" precedent
  // as useScheduleTab (app/schedule/page.tsx) and useMatchAccentColors
  // (components/Scorecard.tsx).
  const { recentForm, achievementLines, teamColor } = usePlayerFormState(player, activeTab);

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-bg-base/95 backdrop-blur border-b border-line">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="tap-scale flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-line shrink-0"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-text-primary leading-tight truncate">{player.name}</h1>
            <p className="text-[11px] text-text-dim">{player.nationality}</p>
          </div>
          {/* Role badge */}
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full shrink-0"
            style={{ background: `${roleColor}22`, color: roleColor }}
          >
            {ROLE_LABELS[player.role]}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* ── Hero info ─────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-3 space-y-3">
          {/* Personal info row */}
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            {player.dateOfBirth && (
              <span>{formatDate(player.dateOfBirth)} · {age(player.dateOfBirth)}</span>
            )}
            {player.battingStyle && (
              <span className="text-text-dim">Bats: <span className="text-text-primary font-semibold">{player.battingStyle}</span></span>
            )}
            {player.bowlingStyle && (
              <span className="text-text-dim">Bowls: <span className="text-text-primary font-semibold">{player.bowlingStyle}</span></span>
            )}
          </div>

          {/* ICC Rankings */}
          {rankings && (
            <div className="flex flex-wrap gap-1.5">
              <RankingPill label="Test Bat" rank={rankings.testBatting} />
              <RankingPill label="ODI Bat" rank={rankings.odiBatting} />
              <RankingPill label="T20I Bat" rank={rankings.t20iBatting} />
              <RankingPill label="Test Bowl" rank={rankings.testBowling} />
              <RankingPill label="ODI Bowl" rank={rankings.odiBowling} />
              <RankingPill label="T20I Bowl" rank={rankings.t20iBowling} />
              <RankingPill label="Test AR" rank={rankings.testAllrounder} />
              <RankingPill label="ODI AR" rank={rankings.odiAllrounder} />
            </div>
          )}

          {/* Bio */}
          {player.bio && (
            <p className="text-sm text-text-secondary leading-relaxed">{player.bio}</p>
          )}
        </div>

        {/* ── Format tabs ────────────────────────────────────────────── */}
        {tabs.length > 0 && (
          <>
            <div className="px-4 flex gap-1 mb-3">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tap-scale flex-1 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-widest transition-colors ${
                    activeTab === tab
                      ? "bg-cyan text-bg-base"
                      : "bg-surface text-text-dim border border-line"
                  }`}
                >
                  {tab === "franchise" ? (player.franchiseLeague ?? "Franchise") : FORMAT_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Stats content */}
            {stats && (
              <div className="px-4 space-y-3">
                <BattingStats stats={stats} />
                <BowlingStats stats={stats} />
              </div>
            )}

            {/* Recent form graph + achievements callout (v1.0.117) --
                both format-scoped to activeTab, independent of `stats`
                above (rendered as siblings, not nested inside `stats &&`)
                since a future real feed could in principle have one
                without the other. Each renders nothing on its own when
                it has nothing real to show -- see RecentFormGraph.tsx and
                PlayerAchievements.tsx for exactly what triggers that. */}
            <div className="px-4 space-y-3 mt-3">
              {recentForm && <RecentFormGraph points={recentForm.points} metric={recentForm.metric} color={teamColor} />}
              <PlayerAchievements lines={achievementLines} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
