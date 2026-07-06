"use client";
import { memo } from "react";
import type { MatchFormat } from "@/lib/types";
import { getMatchupStats } from "@/lib/mockMatchups";

interface MatchupCardProps {
  batterName: string;
  bowlerName: string;
  /** true = batter not yet on strike (wicket just fell, previewing next batter) */
  isPreview: boolean;
  battingTeamColor: string;   // hex
  bowlingTeamColor: string;   // hex
  format: MatchFormat;
  onShare?: () => void;
}

function MatchupCard({
  batterName,
  bowlerName,
  isPreview,
  battingTeamColor,
  bowlingTeamColor,
  format,
  onShare,
}: MatchupCardProps) {
  const stats = getMatchupStats(batterName, bowlerName, format);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const avg = stats
    ? stats.timesOut === 0
      ? "∞"
      : (stats.runsScored / stats.timesOut).toFixed(1)
    : null;

  const sr = stats
    ? ((stats.runsScored / stats.ballsFaced) * 100).toFixed(1)
    : null;

  const dotPct = stats
    ? Math.round((stats.dotBalls / stats.ballsFaced) * 100)
    : null;

  // Primary dismissal mode (e.g. "Caught" if it's the most common)
  const primaryDismissal = stats?.dismissalTypes.length
    ? [...stats.dismissalTypes].sort((a, b) => b.count - a.count)[0]
    : null;

  const formatLabel: Record<MatchFormat, string> = {
    T20: "T20", T20I: "T20I", ODI: "ODI", Test: "Test", Hundred: "100-ball",
  };

  return (
    <div
      className="rounded-2xl border border-line overflow-hidden"
      style={{ background: "#0B101C" }}
    >
      {/* ── Colour bar: left = batting team, right = bowling team ── */}
      <div className="h-0.5 flex">
        <div className="flex-1" style={{ background: battingTeamColor }} />
        <div className="flex-1" style={{ background: bowlingTeamColor }} />
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: isPreview ? "#BE185D22" : "#0E7490/20", color: isPreview ? "#FB7185" : "#22D3EE" }}
          >
            {isPreview ? "NEXT IN" : "MATCHUP"}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
            {formatLabel[format]} career
          </span>
        </div>
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-text-secondary hover:text-cyan transition-colors"
            style={{ background: "#FFFFFF08" }}
            aria-label="Share matchup"
          >
            <ShareIcon />
            Share
          </button>
        )}
      </div>

      {/* ── Names row ── */}
      <div className="flex items-center justify-between px-3.5 pb-3">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: battingTeamColor }}
          />
          <span
            className="text-[15px] font-extrabold leading-none truncate"
            style={{ color: battingTeamColor }}
          >
            {batterName}
          </span>
        </div>
        <span className="text-[10px] font-bold text-text-dim px-3 shrink-0">vs</span>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span
            className="text-[15px] font-extrabold leading-none truncate text-right"
            style={{ color: bowlingTeamColor }}
          >
            {bowlerName}
          </span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: bowlingTeamColor }}
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-line mx-3.5" />

      {stats ? (
        <>
          {/* ── Primary stats row ── */}
          <div className="grid grid-cols-3 divide-x divide-line px-0 py-3">
            <StatCell label="BALLS" value={stats.ballsFaced} color="text-text-primary" />
            <StatCell label="RUNS" value={stats.runsScored} color="text-cyan" />
            <StatCell
              label={stats.timesOut === 1 ? "DISMISSAL" : "DISMISSALS"}
              value={stats.timesOut}
              color={stats.timesOut >= 3 ? "text-wicket" : stats.timesOut === 0 ? "text-six" : "text-orange"}
            />
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-line mx-3.5" />

          {/* ── Secondary stats ── */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 text-[11px] text-text-secondary">
            <span>Avg <span className="text-text-primary font-bold num">{avg}</span></span>
            <span className="text-line">·</span>
            <span>SR <span className="text-text-primary font-bold num">{sr}</span></span>
            <span className="text-line">·</span>
            <span>Dots <span className="text-text-primary font-bold num">{dotPct}%</span></span>
            {stats.sixes > 0 && (
              <>
                <span className="text-line">·</span>
                <span><span className="text-six font-bold num">{stats.sixes}</span> <span className="text-text-dim">6s</span></span>
              </>
            )}
          </div>

          {/* ── Insights ── */}
          {(primaryDismissal || stats.dangerDelivery || stats.lastDismissal) && (
            <>
              <div className="h-px bg-line mx-3.5" />
              <div className="px-3.5 py-2.5 flex flex-col gap-1.5">
                {primaryDismissal && stats.timesOut > 0 && (
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="text-wicket mt-0.5 shrink-0">■</span>
                    <span className="text-text-secondary leading-snug">
                      <span className="text-text-primary font-semibold">{bowlerName.split(" ").pop()}</span>
                      {" dismissed "}
                      <span className="text-text-primary font-semibold">{batterName.split(" ").pop()}</span>
                      {" "}
                      <span className="text-wicket font-bold">{stats.timesOut}×</span>
                      {" — mostly "}
                      <span className="font-medium">{primaryDismissal.type.toLowerCase()}</span>
                      {stats.lastDismissal && (
                        <span className="text-text-dim"> · Last: {stats.lastDismissal}</span>
                      )}
                    </span>
                  </div>
                )}
                {stats.timesOut === 0 && (
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="text-six mt-0.5 shrink-0">✦</span>
                    <span className="text-text-secondary leading-snug">
                      <span className="text-text-primary font-semibold">{batterName.split(" ").pop()}</span>
                      {" has "}
                      <span className="text-six font-bold">never</span>
                      {" been dismissed by "}
                      <span className="text-text-primary font-semibold">{bowlerName.split(" ").pop()}</span>
                    </span>
                  </div>
                )}
                {stats.dangerDelivery && (
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="text-orange mt-0.5 shrink-0">⚡</span>
                    <span className="text-text-secondary leading-snug">
                      <span className="text-orange font-semibold">Danger: </span>
                      {stats.dangerDelivery}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        /* ── No data / first meeting ── */
        <div className="flex flex-col items-center justify-center gap-1 px-3.5 py-5">
          <span className="text-[22px]">✦</span>
          <span className="text-[13px] font-bold text-text-primary">First {formatLabel[format]} Meeting</span>
          <span className="text-[11px] text-text-dim text-center">No previous record in this format</span>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <span className={`text-[22px] font-extrabold num leading-none ${color}`}>{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">{label}</span>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export default memo(MatchupCard);
