"use client";
import { memo } from "react";

import type { Match, WinProbPoint } from "@/lib/types";

interface MiniWinProbProps {
  match: Match;
  points: WinProbPoint[];
  onExpand: () => void;
}

/** Normalise a dark hex so its brightest channel = 255, preserving hue. */
function brighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b, 1);
  const s = 255 / max;
  return `rgb(${Math.round(r * s)},${Math.round(g * s)},${Math.round(b * s)})`;
}

/**
 * MiniWinProb — compact win-probability sparkline.
 *
 * Layout:
 *   [● TeamA  32%]   WIN PROB ↓   [68%  TeamB ●]
 *   ─────────────────────────────────────────────
 *   Two crossing lines with gradient fills + 50% gridline
 *   ─────────────────────────────────────────────
 *   [████████ 32% │ 68% ████████] ← split colour bar
 *
 * Leader % is full-brightness; loser % is dimmed.
 * Tap anywhere → full-screen WinProbChart.
 */
function MiniWinProb({ match, points, onExpand }: MiniWinProbProps) {
  if (points.length === 0) return null;

  const last  = points[points.length - 1];
  const teamA = match.teamA;
  const teamB = match.teamB;

  const pctA    = Math.round(last.winProbTeamA * 100);
  const pctB    = 100 - pctA;
  const leaderA = pctA >= pctB;

  // Brighten dark team colours so they pop on the dark background
  const colA = brighten(teamA.primaryColor);
  const colB = brighten(teamB.primaryColor);

  // SVG geometry
  const W   = 400;
  const H   = 76;
  const PL  = 6, PR = 6, PT = 8, PB = 8;
  const iW  = W - PL - PR;
  const iH  = H - PT - PB;

  const xOf = (x: number) => PL + ((x - 0) / 40) * iW;
  const yOf = (p: number) => PT + (1 - p) * iH;

  const x0  = xOf(points[0].overFloat);
  const x1  = xOf(last.overFloat);
  const bot = PT + iH;

  const lineA = points.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${xOf(p.overFloat).toFixed(1)} ${yOf(p.winProbTeamA).toFixed(1)}`
  ).join(" ");
  const lineB = points.map((p, i) =>
    `${i === 0 ? "M" : "L"} ${xOf(p.overFloat).toFixed(1)} ${yOf(1 - p.winProbTeamA).toFixed(1)}`
  ).join(" ");

  // Fill paths (line → bottom → back to start)
  const fillA = `${lineA} L ${x1.toFixed(1)} ${bot} L ${x0.toFixed(1)} ${bot} Z`;
  const fillB = `${lineB} L ${x1.toFixed(1)} ${bot} L ${x0.toFixed(1)} ${bot} Z`;

  // Current-position end dots
  const dotAY = yOf(last.winProbTeamA);
  const dotBY = yOf(1 - last.winProbTeamA);

  return (
    <button
      onClick={onExpand}
      className="card w-full overflow-hidden active:scale-[0.99] transition-transform text-left"
    >
      {/* ── Header: both teams ──────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">

        {/* Team A */}
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-bg"
            style={{ background: colA }}
          />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
              {teamA.shortName}
            </span>
            <span
              className={`text-2xl font-extrabold num leading-tight transition-colors ${
                leaderA ? "text-text-primary" : "text-text-dim"
              }`}
            >
              {pctA}%
            </span>
          </div>
        </div>

        {/* Centre label + expand cue */}
        <div className="flex flex-col items-center gap-0.5 opacity-60">
          <span className="text-[8px] uppercase tracking-widest text-text-dim font-semibold">
            Win Prob
          </span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-dim">
            <path d="M3 5L8 11L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Team B */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end leading-none">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
              {teamB.shortName}
            </span>
            <span
              className={`text-2xl font-extrabold num leading-tight transition-colors ${
                !leaderA ? "text-text-primary" : "text-text-dim"
              }`}
            >
              {pctB}%
            </span>
          </div>
          <span
            className="w-3 h-3 rounded-full shrink-0 ring-2 ring-bg"
            style={{ background: colB }}
          />
        </div>
      </div>

      {/* ── Chart ────────────────────────────────────────────── */}
      <div className="px-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full block"
          preserveAspectRatio="none"
          style={{ height: 72 }}
        >
          <defs>
            {/* Gradient fills — fade toward bottom */}
            <linearGradient id="mwp-fa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colA} stopOpacity="0.30" />
              <stop offset="100%" stopColor={colA} stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="mwp-fb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colB} stopOpacity="0.30" />
              <stop offset="100%" stopColor={colB} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* 50 % reference line */}
          <line
            x1={PL} y1={yOf(0.5)} x2={W - PR} y2={yOf(0.5)}
            stroke="#334155" strokeWidth="0.9" strokeDasharray="4 3"
          />

          {/* Territory fills (drawn first, behind lines) */}
          <path d={fillA} fill="url(#mwp-fa)" />
          <path d={fillB} fill="url(#mwp-fb)" />

          {/* Team lines */}
          <path
            d={lineA} stroke={colA} strokeWidth="2.4"
            fill="none" strokeLinejoin="round" strokeLinecap="round"
          />
          <path
            d={lineB} stroke={colB} strokeWidth="2.4"
            fill="none" strokeLinejoin="round" strokeLinecap="round"
          />

          {/* Current-position dots (outer glow ring + filled centre) */}
          <circle cx={x1} cy={dotAY} r="5.5" fill={colA} opacity="0.25" />
          <circle cx={x1} cy={dotAY} r="3.2" fill={colA} stroke="#0A0E1A" strokeWidth="1.5" />

          <circle cx={x1} cy={dotBY} r="5.5" fill={colB} opacity="0.25" />
          <circle cx={x1} cy={dotBY} r="3.2" fill={colB} stroke="#0A0E1A" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ── Split colour bar ─────────────────────────────────── */}
      <div className="px-3 pb-3 pt-1.5">
        <div className="h-1.5 rounded-full overflow-hidden flex">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${pctA}%`, background: colA }}
          />
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${pctB}%`, background: colB }}
          />
        </div>
      </div>
    </button>
  );
}
export default memo(MiniWinProb);
