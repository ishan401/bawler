"use client";

import type { Match, WinProbPoint } from "@/lib/types";

interface MiniWinProbProps {
  match: Match;
  points: WinProbPoint[];
  onExpand: () => void;
}

/**
 * Condensed win-prob chart — Sarthak v0.9 #6.
 *   - Default-visible on the match page (no separate area for chart).
 *   - Shows ONLY the two team lines + 25/50/75 % horizontal gridlines.
 *     No event markers, no labels, no annotations.
 *   - Current win-prob shown in a tiny corner chip.
 *   - Tap anywhere → expands to full-screen chart (caller handles).
 */
export default function MiniWinProb({ match, points, onExpand }: MiniWinProbProps) {
  if (points.length === 0) {
    return null;
  }
  const last = points[points.length - 1];
  const teamA = match.teamA;
  const teamB = match.teamB;
  const leaderA = last.winProbTeamA >= 0.5;
  const leaderTeam = leaderA ? teamA : teamB;
  const leaderPct = leaderA ? last.winProbTeamA : 1 - last.winProbTeamA;

  const W = 360;
  const H = 64;
  const PAD = { top: 6, right: 6, bottom: 6, left: 6 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Use overFloat 0..40 as full match range
  const xMin = 0, xMax = 40;
  const xToPx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW;
  const yToPx = (pct: number) => PAD.top + (1 - pct) * innerH;

  const lineA = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(p.overFloat).toFixed(1)} ${yToPx(p.winProbTeamA).toFixed(1)}`).join(" ");
  const lineB = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(p.overFloat).toFixed(1)} ${yToPx(1 - p.winProbTeamA).toFixed(1)}`).join(" ");

  return (
    <button
      onClick={onExpand}
      className="card w-full p-2.5 hover:bg-bg-elevated transition-colors text-left flex items-center gap-3 active:scale-[0.99]"
    >
      <div className="flex flex-col gap-0.5 shrink-0 min-w-[68px]">
        <span className="text-[8.5px] uppercase tracking-widest text-text-dim font-bold">Win %</span>
        <div className="flex items-baseline gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: leaderTeam.primaryColor }} />
          <span className="text-base font-extrabold num text-text-primary leading-none">{Math.round(leaderPct * 100)}%</span>
        </div>
        <span className="text-[9px] text-text-secondary leading-none">{leaderTeam.shortName}</span>
      </div>

      <div className="flex-1 min-w-0">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="none" style={{ height: 60 }}>
          {/* Gridlines: 25 / 50 / 75 */}
          {[0.25, 0.5, 0.75].map(g => (
            <line
              key={g}
              x1={PAD.left} y1={yToPx(g)}
              x2={W - PAD.right} y2={yToPx(g)}
              stroke={g === 0.5 ? "#475569" : "#1E293B"}
              strokeWidth={g === 0.5 ? "0.6" : "0.4"}
              strokeDasharray={g === 0.5 ? "2 2" : "1.5 3"}
            />
          ))}
          {/* Two team lines — no events, no markers */}
          <path d={lineA} stroke={teamA.primaryColor} strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={lineB} stroke={teamB.primaryColor} strokeWidth="1.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {/* End dot for current position */}
          <circle cx={xToPx(last.overFloat)} cy={yToPx(last.winProbTeamA)} r="2.2" fill={teamA.primaryColor} stroke="#F8FAFC" strokeWidth="0.8" />
          <circle cx={xToPx(last.overFloat)} cy={yToPx(1 - last.winProbTeamA)} r="2.2" fill={teamB.primaryColor} stroke="#F8FAFC" strokeWidth="0.8" />
        </svg>
      </div>

      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-text-dim shrink-0">
        <path d="M3 7L8 12L13 7M3 4L8 9L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
