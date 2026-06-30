"use client";

import type { Match, WinProbPoint } from "@/lib/types";

interface MiniWinProbProps {
  match: Match;
  points: WinProbPoint[];
  onExpand: () => void;
}

/**
 * Condensed win-prob sparkline — single area chart.
 * Layout: [TeamA %] [sparkline] [TeamB %] [expand icon]
 * Tap anywhere → full-screen chart.
 */
export default function MiniWinProb({ match, points, onExpand }: MiniWinProbProps) {
  if (points.length === 0) return null;

  const last = points[points.length - 1];
  const teamA = match.teamA;
  const teamB = match.teamB;
  const pctA = last.winProbTeamA;
  const pctB = 1 - pctA;

  const W = 320;
  const H = 72;
  const PAD = { top: 8, right: 4, bottom: 8, left: 4 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xMin = 0, xMax = 40;
  const xToPx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW;
  const yToPx = (pct: number) => PAD.top + (1 - pct) * innerH;

  // Single line path (team A win probability)
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(p.overFloat).toFixed(1)} ${yToPx(p.winProbTeamA).toFixed(1)}`)
    .join(" ");

  // Closed area path for gradient fill (under the line)
  const firstX = xToPx(points[0].overFloat).toFixed(1);
  const lastX = xToPx(last.overFloat).toFixed(1);
  const bottomY = (PAD.top + innerH).toFixed(1);
  const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  // Area above the line (team B territory)
  const topY = PAD.top.toFixed(1);
  const areaPathB = `M ${firstX} ${topY} L ${lastX} ${topY} L ${lastX} ${yToPx(last.winProbTeamA).toFixed(1)} ${points.slice().reverse().map((p) => `L ${xToPx(p.overFloat).toFixed(1)} ${yToPx(p.winProbTeamA).toFixed(1)}`).join(" ")} Z`;

  const gradIdA = `mini-grad-a`;
  const gradIdB = `mini-grad-b`;

  const leaderA = pctA >= 0.5;

  return (
    <button
      onClick={onExpand}
      className="card w-full px-3 py-2.5 hover:bg-bg-elevated transition-colors active:scale-[0.99] flex items-center gap-2"
    >
      {/* Team A side */}
      <div className="flex flex-col items-start shrink-0 w-[44px]">
        <span
          className="text-[11px] font-extrabold leading-none"
          style={{ color: teamA.primaryColor }}
        >
          {teamA.shortName}
        </span>
        <span
          className={`text-base font-extrabold num leading-tight ${leaderA ? "text-text-primary" : "text-text-dim"}`}
        >
          {Math.round(pctA * 100)}%
        </span>
      </div>

      {/* Sparkline */}
      <div className="flex-1 min-w-0 relative">
        {/* Label */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-text-dim leading-none">
          Win %
        </span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full block"
          preserveAspectRatio="none"
          style={{ height: 56 }}
        >
          <defs>
            <linearGradient id={gradIdA} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={teamA.primaryColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={teamA.primaryColor} stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id={gradIdB} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={teamB.primaryColor} stopOpacity="0.03" />
              <stop offset="100%" stopColor={teamB.primaryColor} stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Team B fill (above line) */}
          <path d={areaPathB} fill={`url(#${gradIdB})`} />

          {/* Team A fill (below line) */}
          <path d={areaPath} fill={`url(#${gradIdA})`} />

          {/* 50% reference line */}
          <line
            x1={PAD.left} y1={yToPx(0.5)}
            x2={W - PAD.right} y2={yToPx(0.5)}
            stroke="#47556