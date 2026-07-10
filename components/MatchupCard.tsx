"use client";
import { memo, useState } from "react";
import type { MatchFormat } from "@/lib/types";
import { getMatchupStats } from "@/lib/mockMatchups";

interface MatchupCardProps {
  batterName: string;
  bowlerName: string;
  battingTeamColor: string;
  bowlingTeamColor: string;
  format: MatchFormat;
  liveBalls?: number;
  liveRuns?: number;
  liveOuts?: number;
  liveDots?: number;
  liveMatchFours?: number;
  liveMatchSixes?: number;
  onShare?: () => void;
}

/**
 * MatchupCard — collapses to a one-line teaser by default (team-colour dot +
 * batter + "vs" + team-colour dot + bowler + chevron, ~40px tall) so it costs
 * almost no space for viewers who don't care about H2H depth. Tapping expands
 * it in place to the full stat breakdown; tapping again collapses it back.
 * All data / live-merge / share logic below is unchanged — this is purely a
 * display-state wrapper around the existing content.
 */
function MatchupCard({
  batterName, bowlerName,
  battingTeamColor, bowlingTeamColor,
  format,
  liveBalls = 0, liveRuns = 0, liveOuts = 0, liveDots = 0,
  liveMatchFours = 0, liveMatchSixes = 0,
  onShare,
}: MatchupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const stats = getMatchupStats(batterName, bowlerName, format);

  // Merge career H2H with live match counters so every stat updates in real-time
  const totalBalls = (stats?.ballsFaced ?? 0) + liveBalls;
  const totalRuns  = (stats?.runsScored ?? 0) + liveRuns;
  const totalOuts  = (stats?.timesOut   ?? 0) + liveOuts;
  const totalDots  = (stats?.dotBalls   ?? 0) + liveDots;
  const totalFours = (stats?.fours      ?? 0) + liveMatchFours;
  const totalSixes = (stats?.sixes      ?? 0) + liveMatchSixes;

  const hasData = !!stats || liveBalls > 0;
  const avg    = hasData ? (totalOuts === 0 ? "∞" : (totalRuns / totalOuts).toFixed(1))       : null;
  const sr     = hasData ? (totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(0) : "0") : null;
  const dotPct = hasData ? (totalBalls > 0 ? Math.round((totalDots / totalBalls) * 100) : 0)   : null;

  const formatLabel: Record<MatchFormat, string> = {
    T20: "T20", T20I: "T20I", ODI: "ODI", Test: "Test", Hundred: "100-ball",
  };

  // ── Collapsed teaser ──────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <div className="rounded-xl border border-line overflow-hidden" style={{ background: "#0B101C" }}>
        <div className="flex items-center gap-1.5 px-3 py-2">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
            aria-label={`${batterName} vs ${bowlerName} — tap for head-to-head`}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: battingTeamColor }} />
            <span className="text-[12px] font-extrabold leading-none truncate" style={{ color: battingTeamColor }}>
              {batterName}
            </span>
            <span className="text-[9px] font-bold text-text-dim shrink-0 px-0.5">vs</span>
            <span className="text-[12px] font-extrabold leading-none truncate" style={{ color: bowlingTeamColor }}>
              {bowlerName}
            </span>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: bowlingTeamColor }} />
          </button>
          <span className="text-[9px] text-text-dim shrink-0">tap for H2H</span>
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 text-text-dim p-0.5"
            aria-label="Expand matchup card"
          >
            <ChevronIcon direction="down" />
          </button>
        </div>
      </div>
    );
  }

  // ── Expanded — existing full card content, unchanged ────────────────────
  return (
    <div className="rounded-xl border border-line overflow-hidden" style={{ background: "#0B101C" }}>

      {/* ── Dual-colour top bar ── */}
      <div className="h-0.5 flex">
        <div className="flex-1" style={{ background: battingTeamColor }} />
        <div className="flex-1" style={{ background: bowlingTeamColor }} />
      </div>

      {/* ── Row 1: names + badge + share + collapse ── */}
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1.5">
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
          aria-label="Collapse matchup card"
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: battingTeamColor }} />
          <span className="text-[13px] font-extrabold leading-none truncate" style={{ color: battingTeamColor }}>
            {batterName}
          </span>
          <span className="text-[9px] font-bold text-text-dim shrink-0 px-0.5">vs</span>
          <span className="text-[13px] font-extrabold leading-none truncate" style={{ color: bowlingTeamColor }}>
            {bowlerName}
          </span>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: bowlingTeamColor }} />
        </button>

        {/* Preview badge */}
        <span
          className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "#0E749022", color: "#22D3EE" }}
        >
          {formatLabel[format]}
        </span>

        {/* Share */}
        {onShare && (
          <button
            onClick={onShare}
            className="shrink-0 text-text-dim hover:text-cyan transition-colors p-0.5"
            aria-label="Share matchup"
          >
            <ShareIcon />
          </button>
        )}

        {/* Collapse */}
        <button
          onClick={() => setExpanded(false)}
          className="shrink-0 text-text-dim p-0.5"
          aria-label="Collapse matchup card"
        >
          <ChevronIcon direction="up" />
        </button>
      </div>

      {hasData ? (
        <>
          {/* ── Row 2: 3 primary stats compact grid ── */}
          <div className="grid grid-cols-3 divide-x divide-line mx-3 rounded-lg overflow-hidden border border-line/60"
               style={{ background: "#FFFFFF05" }}>
            <CompactStat label="BALLS"  value={totalBalls}  color="text-text-primary" />
            <CompactStat label="RUNS"   value={totalRuns}   color="text-cyan" />
            <CompactStat
              label={totalOuts === 1 ? "OUT" : "OUTS"}
              value={totalOuts}
              color={totalOuts === 0 ? "text-six" : totalOuts >= 3 ? "text-wicket" : "text-orange"}
            />
          </div>

          {/* ── Row 3: label-value format ── */}
          <div className="flex items-center flex-wrap gap-x-2 px-3 pt-1.5 text-[10px] text-text-dim leading-none">
            {stats && <span>matches-<span className="text-text-secondary font-bold num">{stats.matches}</span></span>}
            <span>4s-<span className="text-boundary font-bold num">{totalFours}</span></span>
            <span>6s-<span className="text-six font-bold num">{totalSixes}</span></span>
            <span>Avg-<span className="text-text-secondary font-bold num">{avg}</span></span>
            <span>SR-<span className="text-text-secondary font-bold num">{sr}</span></span>
            <span>Dots-<span className="text-text-secondary font-bold num">{dotPct}%</span></span>
            {totalOuts === 0 && hasData && (
              <span className="text-six font-semibold">Never dismissed</span>
            )}
          </div>

          <div className="pb-2.5" />
        </>
      ) : (
        /* ── No data ── */
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-0.5">
          <span className="text-[11px] text-text-dim">✦</span>
          <span className="text-[11px] text-text-secondary font-semibold">
            First {formatLabel[format]} meeting
          </span>
          <span className="text-[10px] text-text-dim">— making history right now</span>
        </div>
      )}
    </div>
  );
}

function CompactStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center py-1.5 gap-0.5">
      <span className={`text-[17px] font-extrabold num leading-none ${color}`}>{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim">{label}</span>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      {direction === "down" ? <path d="M6 9l6 6 6-6" /> : <path d="M18 15l-6-6-6 6" />}
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

export default memo(MatchupCard);
