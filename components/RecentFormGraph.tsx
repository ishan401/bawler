"use client";

import React from "react";
import type { RecentFormPoint } from "@/lib/playerForm";

interface RecentFormGraphProps {
  points: RecentFormPoint[];
  metric: "runs" | "wickets";
  color: string;
}

/** Catmull-Rom smoothed path -- same technique as components/Scorecard.tsx's
 * BatterSparkline and WinProbChart's line. Duplicated rather than imported
 * because BatterSparkline's version is a private helper scoped to
 * Scorecard.tsx, not an exported utility -- see that file's own header
 * comment on sparklinePoints for why this shape (cumulative-x smoothing)
 * is specific to its ball-by-ball data. This graph's X axis is a plain
 * fixed innings/spell index instead, so the two are similar but not
 * actually the same function under the hood. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) {
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// ============================================================================
// Y-axis scaling -- v1.0.119
//
// v1.0.117/118 shipped this graph as an axis-less sparkline, deliberately
// matching Scorecard.tsx's BatterSparkline (dense scorecard row, no room
// for labels). v1.0.119 supersedes that call: this graph lives in its own
// dedicated section of the player page, not squeezed into a scorecard row,
// so a properly labeled small line chart reads better here. The sparkline
// styling stays exactly where it always belonged -- BatterSparkline itself
// is untouched.
//
// The scale is deliberately NOT fixed across players or formats. A
// bowler's wickets-per-innings has a hard real-world ceiling of 10 (you
// cannot take more than 10 wickets in an innings); a batter's runs can run
// into the hundreds. Sharing one scale would either flatten every bowler's
// graph into an unreadable sliver near zero, or compress a batter's real
// variation into a few pixels. Both `computeYAxisTop`/`buildYAxisTicks`
// take only the plotted window's own values -- no per-format constant
// anywhere in this file.
// ============================================================================

/**
 * Rounds a player's own highest plotted value up to a "clean" scale
 * ceiling, choosing the rounding unit (5/10/25/50/100) by the value's own
 * magnitude -- never a fixed unit shared across every player/format.
 *
 * The scale always starts at 0 (handled by the caller; this only computes
 * the top), so the return value IS the full axis span.
 *
 * Zero is a real, valid input (an unbroken run of ducks, or a bowler with
 * zero wickets across every plotted spell) -- it is real data, not missing
 * data, and still needs a genuine, non-degenerate axis: a 0-to-0 scale
 * would collapse every gridline onto the same line. 4 is the smallest
 * "clean" ceiling that still reads sensibly at that floor.
 */
export function computeYAxisTop(maxValue: number): number {
  const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
  if (safeMax === 0) return 4;

  let unit: number;
  if (safeMax <= 10) unit = 5;
  else if (safeMax <= 50) unit = 10;
  else if (safeMax <= 100) unit = 25;
  else if (safeMax <= 250) unit = 50;
  else unit = 100;

  return Math.ceil(safeMax / unit) * unit;
}

export interface YAxisTick {
  /** Exact fractional position along the 0..top span, for placing the
   * gridline/text at the correct pixel Y -- never rounded, so the
   * gridline itself always lands exactly where it mathematically should. */
  value: number;
  /** Rounded-to-nearest-integer display label -- runs and wickets are
   * always whole numbers, so the axis label should be too. */
  label: number;
}

/**
 * Builds ~4-5 evenly spaced ticks from 0 to `top` (inclusive). Labels are
 * rounded for display; de-duplicated defensively by rounded label so two
 * ticks can never render the same number stacked on top of each other --
 * in practice this never fires given the clean tops `computeYAxisTop`
 * produces, but it's a real guard, not just a comment, and is exercised
 * directly by the edge-case tests (a value that already sits exactly on a
 * round number is the case most likely to matter here, since that's when
 * `top` itself equals one of the interior quarter ticks' raw value before
 * rounding would otherwise be a risk).
 */
export function buildYAxisTicks(top: number): YAxisTick[] {
  const safeTop = top > 0 ? top : 4;
  const raw = [0, safeTop / 4, safeTop / 2, (safeTop * 3) / 4, safeTop];
  const seen = new Set<number>();
  const out: YAxisTick[] = [];
  for (const value of raw) {
    const label = Math.round(value);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ value, label });
  }
  return out;
}

/**
 * Recent-form graph on the player profile page -- one point per innings
 * (batting) or bowling spell, across the player's last 10 for whichever
 * format tab is currently selected. Rebuilt in v1.0.119 as a labeled small
 * line chart (Y-axis value labels + light gridlines, minimal two-endpoint
 * X-axis) rather than the earlier axis-less sparkline -- see the header
 * comment above `computeYAxisTop` for why. The line/dot styling itself
 * (smoothed Catmull-Rom path, a colored dot at every point, no special
 * highlighting for standout individual performances -- that's the
 * achievements callout's job, rendered separately beneath this graph) is
 * unchanged from v1.0.117.
 *
 * `color` is always the caller's already-resolved team accent color --
 * this component has no color-resolution logic of its own and never
 * reads a Team object. See components/PlayerProfileView.tsx for the
 * lib/teamAccentColor.ts call that produces it. Untouched by this
 * v1.0.119 axis rework.
 *
 * Renders nothing when `points` is empty -- the correct behavior for a
 * format with zero recorded innings/spells (see lib/playerForm.ts's
 * getRecentForm() doc comment), not a broken-looking empty chart. A
 * single point still renders against the full labeled axis (gridlines,
 * Y labels, a lone dot at the correct height) rather than as a bare,
 * context-less dot -- the axis is what gives one real data point actual
 * meaning ("this is a low/high value relative to what's possible"),
 * which a dot floating with no scale can't communicate.
 */
export default function RecentFormGraph({ points, metric, color }: RecentFormGraphProps) {
  if (points.length === 0) return null;

  const W = 300;
  const H = 118;
  const PAD = { left: 30, right: 8, top: 10, bottom: 18 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const n = points.length;
  const maxValue = Math.max(0, ...points.map(p => p.value));
  const top = computeYAxisTop(maxValue);
  const ticks = buildYAxisTicks(top);

  const xToPx = (i: number) => (n === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW);
  const yToPx = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const px = points.map((p, i) => ({ x: xToPx(i), y: yToPx(p.value) }));

  const linePath = px.length >= 2 ? smoothPath(px) : "";
  const unitLabel = metric === "wickets" ? (n === 1 ? "spell" : "spells") : "innings";
  const axisLabel = metric === "wickets" ? "wickets/spell" : "runs/innings";

  return (
    <div className="card p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2">
        Recent form &middot; last {n} {unitLabel} ({axisLabel})
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 108 }} aria-hidden="true">
        {/* Gridlines + Y-axis value labels */}
        {ticks.map(t => {
          const y = yToPx(t.value);
          return (
            <g key={t.label}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1E293B" strokeWidth="0.75" />
              <text x={PAD.left - 5} y={y + 3} fill="#64748B" fontSize="8" textAnchor="end">
                {t.label}
              </text>
            </g>
          );
        })}

        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {px.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.2" fill={color} stroke="#0A0E1A" strokeWidth="1" />
        ))}

        {/* Minimal X-axis: endpoints only, no per-point labels, no dates,
            no opponent names. A single point has no distinct "N ago" --
            it IS the most recent (and only) plotted entry -- so it gets
            one centered label instead of two contradictory ones. */}
        {n === 1 ? (
          <text x={PAD.left + innerW / 2} y={H - 3} fill="#64748B" fontSize="8" textAnchor="middle">
            Most recent
          </text>
        ) : (
          <>
            <text x={PAD.left} y={H - 3} fill="#64748B" fontSize="8" textAnchor="start">
              {n} ago
            </text>
            <text x={W - PAD.right} y={H - 3} fill="#64748B" fontSize="8" textAnchor="end">
              Most recent
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
