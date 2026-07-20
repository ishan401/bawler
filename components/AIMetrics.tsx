"use client";
import { memo } from "react";

import type { AIMetric } from "@/lib/types";

interface AIMetricsProps {
  metrics: AIMetric[];
}

const METRIC_CONTEXT: Record<string, string> = {
  projected:    "end-of-innings total",
  momentum:     "team with the over",
  acceleration: "run-rate swing · last 12 balls",
  "key-player": "current top performer",
  "next-wicket": "wicket probability · this over",
};

function AIMetrics({ metrics }: AIMetricsProps) {
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
  const trendIcon = trendOf(metric.trend, metric.tint);
  const context = METRIC_CONTEXT[metric.kind] ?? metric.secondaryValue ?? "";

  return (
    <div className="card p-2 flex flex-col gap-0.5 min-w-0">
      {/* Label row */}
      <span className="text-[7.5px] font-bold uppercase tracking-widest text-text-dim truncate w-full leading-none">
        {metric.label}
      </span>

      {/* Primary value + trend arrow */}
      <div className="flex items-center gap-0.5">
        <span className={`text-[15px] font-extrabold num leading-none ${fg}`}>
          {metric.primaryValue}
        </span>
        {trendIcon && (
          <span className={`text-[10px] font-extrabold leading-none ${trendIcon.color}`}>
            {trendIcon.icon}
          </span>
        )}
      </div>

      {/* Delta / secondary
      {/* Delta / secondary — shown when available */}
      {metric.trendDelta && (
        <span className={`text-[7.5px] font-semibold leading-none truncate ${trendIcon?.color ?? "text-text-dim"}`}>
          {metric.trendDelta}
        </span>
      )}

      {/* Context label — always visible */}
      <span className="text-[7px] text-text-dim leading-tight truncate" style={{ lineHeight: "1.1" }}>
        {context}
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

function trendOf(trend?: AIMetric["trend"], tint?: AIMetric["tint"]): { icon: string; color: string } | null {
  if (!trend || trend === "flat") return null;
  // No specific outcome-tint on this metric -- falling back to a generic
  // up/down trend color, not a wicket outcome, so this is the "negative
  // trend" token, not "wicket" (v1.0.67 cleanup).
  const color = tint ? tintFg(tint) : trend === "up" ? "text-cyan" : "text-negative";
  return { icon: trend === "up" ? "↑" : "↓", color };
}
export default memo(AIMetrics);
