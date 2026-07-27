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

/**
 * Recent-form graph on the player profile page -- one point per innings
 * (batting) or bowling spell, across the player's last 10 for whichever
 * format tab is currently selected. Same thin-line/dot-marker visual
 * language as Scorecard.tsx's BatterSparkline (smoothed line, colored
 * dot per data point), but plotting a different axis: one point per
 * innings/spell here, not balls-within-one-innings there. Every point
 * gets a dot (not just boundary balls) since every point IS the thing
 * being plotted.
 *
 * `color` is always the caller's already-resolved team accent color --
 * this component has no color-resolution logic of its own and never
 * reads a Team object. See components/PlayerProfileView.tsx for the
 * lib/teamAccentColor.ts call that produces it.
 *
 * Renders nothing when `points` is empty -- the correct behavior for a
 * format with zero recorded innings/spells (see lib/playerForm.ts's
 * getRecentForm() doc comment), not a broken-looking empty chart. Renders
 * a single dot with no connecting line when there's exactly one point --
 * a line needs two points to mean anything, but one real data point is
 * still real data, not an error state.
 */
export default function RecentFormGraph({ points, metric, color }: RecentFormGraphProps) {
  if (points.length === 0) return null;

  const W = 280;
  const H = 64;
  const PAD_X = 8;
  const PAD_Y = 10;
  const n = points.length;
  const maxY = Math.max(1, ...points.map(p => p.value));
  const xToPx = (i: number) => (n === 1 ? W / 2 : PAD_X + (i / (n - 1)) * (W - PAD_X * 2));
  const yToPx = (v: number) => H - PAD_Y - (v / maxY) * (H - PAD_Y * 2);
  const px = points.map((p, i) => ({ x: xToPx(i), y: yToPx(p.value) }));

  const linePath = px.length >= 2 ? smoothPath(px) : "";
  const unitLabel = metric === "wickets" ? (n === 1 ? "spell" : "spells") : "innings";
  const axisLabel = metric === "wickets" ? "wickets/spell" : "runs/innings";

  return (
    <div className="card p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-dim font-semibold mb-2">
        Recent form &middot; last {n} {unitLabel} ({axisLabel})
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-16" aria-hidden="true">
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
      </svg>
    </div>
  );
}
