"use client";

import type { Insight } from "@/lib/types";

interface InsightFeedProps {
  insights: Insight[];
}

const TIER_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  analyst: { label: "Analyst", color: "text-cyan", bg: "bg-cyan/10" },
  cricbuzz: { label: "Cricbuzz", color: "text-boundary", bg: "bg-boundary/10" },
  espn: { label: "ESPN", color: "text-orange", bg: "bg-orange/10" },
  official: { label: "Official", color: "text-text-secondary", bg: "bg-line" },
  bot: { label: "Bot", color: "text-text-dim", bg: "bg-line" },
};

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function InsightFeed({ insights }: InsightFeedProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Live insights</h3>
        <span className="text-[10px] text-text-dim">{insights.length} sources</span>
      </div>
      <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
        {insights.map(insight => {
          const tier = TIER_STYLES[insight.sourceTier] ?? TIER_STYLES.bot;
          return (
            <article key={insight.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${tier.bg} ${tier.color}`}>
                  {tier.label}
                </span>
                <span className="text-xs text-text-secondary">{insight.sourceHandle}</span>
                <span className="text-text-dim text-xs">·</span>
                <span className="text-xs text-text-dim num">{relativeTime(insight.timestampIso)}</span>
              </div>
              <p className="text-sm text-text-primary leading-snug">{insight.text}</p>
              {insight.tags && insight.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {insight.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-text-dim">#{tag}</span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
