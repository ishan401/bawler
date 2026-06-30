"use client";

import React, { useState } from "react";
import type { InsightV2 } from "@/lib/types";

interface InsightsPanelProps {
  insights: InsightV2[];
  catchUpSummary?: string | null;
  onDismissCatchUp?: () => void;
}

type Tab = "live" | "all";

/**
 * Number-heavy live insights panel.
 *
 * Per Sarthak v0.3 spec:
 *   - "Bumrah brought back for Russell over" prose is OUT.
 *   - Replace with stat-shaped insights: numbers + minimal framing.
 *   - Differentiate stats (no attribution, we own) vs opinions (attributed).
 *   - 3 modes:
 *       1) Live ticker — most recent N, sorted recency
 *       2) Catch-up summary surfaced proactively at top
 *       3) Browse-all — clean stacked list, longer scroll
 */
export default function InsightsPanel({ insights, catchUpSummary, onDismissCatchUp }: InsightsPanelProps) {
  const [tab, setTab] = useState<Tab>("live");

  const shown = tab === "live" ? insights.slice(0, 5) : insights;

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Insights</h3>
          <div className="inline-flex rounded-md bg-bg border border-line p-0.5">
            <TabBtn label="Live" active={tab === "live"} onClick={() => setTab("live")} />
            <TabBtn label={`All (${insights.length})`} active={tab === "all"} onClick={() => setTab("all")} />
          </div>
        </div>
        <span className="text-[10px] num text-text-dim">{shown.length} shown</span>
      </div>

      {/* Catch-up summary banner */}
      {catchUpSummary && (
        <div className="px-4 py-3 bg-cyan/8 border-b border-cyan/30 flex items-start gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-cyan shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="8" y1="5" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="11" r="0.5" fill="currentColor" />
          </svg>
          <div className="flex-1 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan mb-0.5">While you were away</div>
            <p className="text-text-primary">{catchUpSummary}</p>
          </div>
          <button onClick={onDismissCatchUp} className="text-text-dim hover:text-text-primary p-0.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3L9 9M3 9L9 3" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="px-4 py-6 text-center text-text-secondary text-sm">No insights yet.</div>
      ) : (
        <ul className="divide-y divide-line">
          {shown.map(ins => (
            <InsightItem key={ins.id} insight={ins} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition ${
        active ? "bg-cyan text-bg" : "text-text-dim hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function InsightItem({ insight }: { insight: InsightV2 }) {
  const isStat = insight.category === "stat";
  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
          isStat
            ? "bg-cyan/12 text-cyan"
            : "bg-orange/15 text-orange"
        }`}>
          {isStat ? "Stat" : "View"}
        </span>
        {!isStat && insight.attribution && (
          <span className="text-[10px] text-text-secondary">{insight.attribution.handle}</span>
        )}
        <span className="text-[10px] text-text-dim ml-auto num">{relTime(insight.timestampIso)}</span>
      </div>
      <p className={`text-sm leading-snug ${isStat ? "text-text-primary" : "text-text-secondary italic"}`}>
        {renderWithHighlights(insight.text, insight.numericHighlights)}
      </p>
    </li>
  );
}

function renderWithHighlights(text: string, highlights?: string[]): React.ReactNode {
  if (!highlights || highlights.length === 0) return text;
  // Naïve highlight: wrap each highlight occurrence with a styled span
  const parts: React.ReactNode[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestHl: string | null = null;
    for (const hl of highlights) {
      const idx = remaining.indexOf(hl);
      if (idx >= 0 && (earliestIdx < 0 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestHl = hl;
      }
    }
    if (earliestIdx < 0 || !earliestHl) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, earliestIdx));
    parts.push(<span key={parts.length} className="font-bold text-cyan num">{earliestHl}</span>);
    remaining = remaining.slice(earliestIdx + earliestHl.length);
  }
  return parts;
}

function relTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
