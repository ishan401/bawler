"use client";

import type { AIMetric } from "@/lib/types";

interface AIMetricsProps {
  metrics: AIMetric[];
}

/**
 * Condensed 4-tile AI metrics — Sarthak v0.9 #8.
 *   - 4 tiles in one row (Projected, Momentum, Acceleration, Next-wicket).
 *   - Each tile shows ONLY the tiny label + the primary value. No secondary
 *     text, no trend chips, no deltas.
 *   - Win % is rendered separately as the inline MiniWinProb chart.
 */
export default function AIMetrics({ metrics }: AIMetricsProps) {
  // Filter out the win-prob metric — that's now the inline mini chart
  const tiles = metrics.filter(m => m.kind !== "win-prob");

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {tiles.map((m, i) => (
        <MetricTile key={m.kind + i} metric={m} />
      ))}
    </div>
  );
}

function MetricTile({ metric }: { metric: AIMetric }) {
  const fg = tintFg(metric.tint);
  return (
    <div className="card p-2 flex flex-col items-start gap-0.5 min-w-0">
      <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim truncate w-full">
        {metric.label}
      </span>
      <span className={`text-base font-extrabold num leading-none ${fg}`}>
        {metric.primaryValue}
      </span>
    </div>
  );
}

function tintFg(tint?: AIMetric["tint"]): string {
  switch (tint) {
    case "cyan":     return "text-cyan";
    case "orange":   return "text-orange";
    case "wicket":   return "text-wicket";
    case "boundary": return "text-boundary";
    case "six":      return "text-six";
    default:         return "text-text-primary";
  }
}
