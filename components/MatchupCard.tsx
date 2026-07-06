"use client";
import { memo } from "react";
import type { MatchFormat } from "@/lib/types";
import { getMatchupStats } from "@/lib/mockMatchups";

interface MatchupCardProps {
  batterName: string;
  bowlerName: string;
  isPreview: boolean;
  battingTeamColor: string;
  bowlingTeamColor: string;
  format: MatchFormat;
  onShare?: () => void;
}

function MatchupCard({
  batterName, bowlerName, isPreview,
  battingTeamColor, bowlingTeamColor,
  format, onShare,
}: MatchupCardProps) {
  const stats = getMatchupStats(batterName, bowlerName, format);

  const avg = stats
    ? stats.timesOut === 0 ? "∞" : (stats.runsScored / stats.timesOut).toFixed(1)
    : null;
  const sr = stats
    ? ((stats.runsScored / stats.ballsFaced) * 100).toFixed(0)
    : null;
  const dotPct = stats
    ? Math.round((stats.dotBalls / stats.ballsFaced) * 100)
    : null;

  const formatLabel: Record<MatchFormat, string> = {
    T20: "T20", T20I: "T20I", ODI: "ODI", Test: "Test", Hundred: "100-ball",
  };

  return (
    <div className="rounded-xl border border-line overflow-hidden" style={{ background: "#0B101C" }}>

      {/* ── Dual-colour top bar ── */}
      <div className="h-0.5 flex">
        <div className="flex-1" style={{ background: battingTeamColor }} />
        <div className="flex-1" style={{ background: bowlingTeamColor }} />
      </div>

      {/* ── Row 1: names + badge + share ── */}
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1.5">
        {/* Batter */}
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: battingTeamColor }} />
        <span className="text-[13px] font-extrabold leading-none truncate" style={{ color: battingTeamColor }}>
          {batterName}
        </span>

        <span className="text-[9px] font-bold text-text-dim shrink-0 px-0.5">vs</span>

        {/* Bowler */}
        <span className="text-[13px] font-extrabold leading-none truncate" style={{ color: bowlingTeamColor }}>
          {bowlerName}
        </span>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: bowlingTeamColor }} />

        {/* Spacer */}
        <span className="flex-1" />

        {/* Preview badge */}
        <span
          className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
          style={isPreview
            ? { background: "#BE185D22", color: "#FB7185" }
            : { background: "#0E749022", color: "#22D3EE" }}
        >
          {isPreview ? "NEXT IN" : formatLabel[format]}
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
      </div>

      {stats ? (
        <>
          {/* ── Row 2: 3 primary stats compact grid ── */}
          <div className="grid grid-cols-3 divide-x divide-line mx-3 rounded-lg overflow-hidden border border-line/60"
               style={{ background: "#FFFFFF05" }}>
            <CompactStat label="BALLS"  value={stats.ballsFaced}  color="text-text-primary" />
            <CompactStat label="RUNS"   value={stats.runsScored}  color="text-cyan" />
            <CompactStat
              label={stats.timesOut === 1 ? "OUT" : "OUTS"}
              value={stats.timesOut}
              color={stats.timesOut === 0 ? "text-six" : stats.timesOut >= 3 ? "text-wicket" : "text-orange"}
            />
          </div>

          {/* ── Row 3: secondary stats + danger inline ── */}
          <div className="flex items-center flex-wrap gap-x-2 px-3 pt-1.5 pb-2.5 text-[10px] text-text-dim leading-none">
            <span>Avg <span className="text-text-secondary font-bold num">{avg}</span></span>
            <span className="text-line">·</span>
            <span>SR <span className="text-text-secondary font-bold num">{sr}</span></span>
            <span className="text-line">·</span>
            <span>Dots <span className="text-text-secondary font-bold num">{dotPct}%</span></span>
            {stats.timesOut === 0 && (
              <>
                <span className="text-line">·</span>
                <span className="text-six font-semibold">Never dismissed</span>
              </>
            )}
            {stats.dangerDelivery && (
              <>
                <span className="text-line">·</span>
                <span className="text-orange font-semibold shrink-0">Watch for:</span>
                <span className="text-text-secondary truncate">{stats.dangerDelivery}</span>
              </>
            )}
          </div>
        </>
      ) : (
        /* ── No data ── */
        <div className="flex items-center gap-2 px-3 pb-2.5 pt-0.5">
          <span className="text-[11px] text-text-dim">✦</span>
          <span className="text-[11px] text-text-secondary font-semibold">
            First {formatLabel[format]} meeting
          </span>
          <span className="text-[10px] text-text-dim">— no prior record</span>
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

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

export default memo(MatchupCard);
