"use client";
import { memo, useState } from "react";
import type { Match, MatchFormat, WinProbPoint } from "@/lib/types";
import { getMatchupStats } from "@/lib/mockMatchups";
import { formatPlayerName } from "@/lib/playerName";
import { getLeadingTeamWinProb } from "@/lib/winProb";
import WinProbBadge from "@/components/WinProbBadge";

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
  /** Match + win-prob points feed the emphasized "WIN PROB" readout that now
   *  lives on the collapsed teaser row (v1.0.121) — see header comment. */
  match: Match;
  winProbPoints: WinProbPoint[];
  onExpandWinProb: () => void;
}

/**
 * MatchupCard — collapses to a one-line teaser by default (team-colour dot +
 * batter + "vs" + team-colour dot + bowler + chevron, ~40px tall) so it costs
 * almost no space for viewers who don't care about H2H depth. Tapping the
 * batter/bowler side (or the chevron) expands it in place to the full stat
 * breakdown; tapping again collapses it back. All data / live-merge / share
 * logic below is unchanged — this is purely a display-state wrapper around
 * the existing content.
 *
 * v1.0.121: the teaser row also now carries the emphasized win-probability
 * readout ("WIN PROB" label + bold "TEAM 87%" value) on its right side,
 * replacing the small "TEAM XX%" pill that used to live inline in
 * MiniInsightsBar's stat-chip row. That old pill duplicated this same
 * matchup-adjacent context in two places at once; this consolidates it into
 * one spot with real visual weight instead. The win-prob value/label tap
 * target is deliberately separate from the batter/bowler tap target — it
 * opens the full-screen win-prob chart (onExpandWinProb) rather than
 * expanding the H2H card, exactly like the old pill did. The value is a
 * fixed, plain white — never team-colored — because a team's real color can
 * misleadingly read as "losing" when it's red-toned, can flicker
 * distractingly as a close finish swings back and forth, and multiple
 * simultaneous matches can collide on the same color fallback and lose all
 * meaning. Plain white stands out through size/weight, not hue.
 */
function MatchupCard({
  batterName, bowlerName,
  battingTeamColor, bowlingTeamColor,
  format,
  liveBalls = 0, liveRuns = 0, liveOuts = 0, liveDots = 0,
  liveMatchFours = 0, liveMatchSixes = 0,
  onShare,
  match, winProbPoints, onExpandWinProb,
}: MatchupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const stats = getMatchupStats(batterName, bowlerName, format);
  // Display-only -- the lookup above stays keyed on the raw batterName/
  // bowlerName strings exactly as the mock matchup dataset expects.
  const batterDisplay = formatPlayerName(batterName);
  const bowlerDisplay = formatPlayerName(bowlerName);
  // null when there's no real win-prob point yet (e.g. malformed/empty data)
  // -- the teaser row below hides the WIN PROB block entirely in that case
  // rather than rendering a broken or fake percentage.
  const winProb = getLeadingTeamWinProb(match, winProbPoints);

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

  // ── Left box: matchup pairing (collapsed teaser or expanded H2H) ───────
  // v1.0.136: this used to be the ENTIRE row -- one box that toggled in
  // place between a collapsed teaser (name + win-prob badge sharing one
  // line) and the expanded H2H card, with the win-prob readout only
  // visible in the collapsed state. Split into two independent sibling
  // boxes below: this one owns ONLY the matchup pairing and its
  // expand/collapse interaction, unchanged in substance from before --
  // same data, same tap-to-expand, same H2H content -- just no longer
  // sharing its box with the win-prob readout. `matchupBox` is rendered
  // inside the shared return at the bottom of this function, alongside
  // the completely independent win-prob box, so neither can affect the
  // other's presence or size.
  const matchupBox = !expanded ? (
    // ── Collapsed teaser ──
    // v1.0.136: the whole box is now one tap target (previously the name
    // region and a separate small chevron button were split tap targets
    // sharing the row with the win-prob badge) -- same open-on-tap
    // interaction, now simply scoped to a dedicated box instead of a
    // shared row. Full "Initial Surname" names (formatPlayerName's own
    // output, e.g. "J Root") are no longer squeezed by a shared win-prob
    // sibling, so `truncate` here is a pure safety net for unusually long
    // names rather than something that fires in normal operation.
    <button
      onClick={() => setExpanded(true)}
      className="flex items-center gap-1.5 px-3 py-2 w-full text-left"
      aria-label={`${batterDisplay} vs ${bowlerDisplay} — tap for head-to-head`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: battingTeamColor }} />
      <span className="text-[12px] font-extrabold leading-none truncate" style={{ color: battingTeamColor }}>
        {batterDisplay}
      </span>
      <span className="text-[9px] font-bold text-text-dim shrink-0 px-0.5">vs</span>
      <span className="text-[12px] font-extrabold leading-none truncate" style={{ color: bowlingTeamColor }}>
        {bowlerDisplay}
      </span>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: bowlingTeamColor }} />
      <ChevronIcon direction="down" />
    </button>
  ) : (
    // ── Expanded — existing full card content, unchanged ──
    <>
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
            {batterDisplay}
          </span>
          <span className="text-[9px] font-bold text-text-dim shrink-0 px-0.5">vs</span>
          <span className="text-[13px] font-extrabold leading-none truncate" style={{ color: bowlingTeamColor }}>
            {bowlerDisplay}
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
              // 0 outs is a "never dismissed" achievement, not a six-run
              // outcome -- special/premium recognition token (v1.0.67).
              // >=3 outs stays "wicket": that's a real dismissal count.
              color={totalOuts === 0 ? "text-special" : totalOuts >= 3 ? "text-wicket" : "text-orange"}
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
              <span className="text-special font-semibold">Never dismissed</span>
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
    </>
  );

  // ── Row: matchup box + independent win-prob box, side by side ──────────
  // v1.0.136: `winProb` gates ONLY the win-prob box's presence, exactly as
  // it gated the old badge's presence in the shared row -- hidden entirely
  // rather than rendering broken/empty text when there's no real win-prob
  // point yet (same null-safety as before). The matchup box takes the
  // remaining width either way, so nothing narrows or breaks when win-prob
  // data is absent. When both are present, the matchup box is a fixed 60%
  // and the win-prob box takes the rest, per the requested split. Critically,
  // the win-prob box's JSX lives in this same always-rendered return,
  // completely outside `matchupBox`'s `expanded` branching above -- so
  // toggling `expanded` can only ever change `matchupBox`'s own content and
  // (naturally, since it goes from a one-line teaser to a multi-row card)
  // height. It can never hide, replace, or resize the win-prob box, and
  // `items-start` below stops the row from stretching the shorter box to
  // match the taller one.
  return (
    <div className="flex gap-2 items-start">
      <div
        className={`rounded-xl border border-line overflow-hidden ${winProb ? "w-[60%]" : "flex-1"}`}
        style={{ background: "#0B101C" }}
      >
        {matchupBox}
      </div>
      {winProb && (
        <div className="flex-1">
          <WinProbBadge variant="boxed" label={winProb.label} pct={winProb.pct} onClick={onExpandWinProb} />
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
