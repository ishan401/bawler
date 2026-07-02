"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ALL_LIVE_MATCHES, ALL_UPCOMING_MATCHES } from "@/lib/mockData";
import type { Match, Competition } from "@/lib/types";

// ── Popularity scores (cricket-first, same formula used everywhere) ──────────
const COMP_POP: Record<string, number> = {
  "icc-t20wc-2026":    100,
  "icc-ct-2025":        95,
  "ashes-2025-26":      90,
  "ipl-2026":           88,
  "ind-eng-test-2026":  82,
  "ind-aus-t20i-2026":  80,
  "eng-sa-odi-2026":    68,
  "bbl-2025-26":        66,
  "psl-2026":           64,
  "hundred-2026":       58,
  "sa20-2026":          52,
  "cpl-2025":           46,
  "mlc-2026":           40,
};

const TYPE_LABEL: Record<Competition["type"], string> = {
  league:        "League",
  international: "International",
  bilateral:     "Series",
  domestic:      "Domestic",
};

interface CompRow {
  competition: Competition;
  liveCount: number;
  upcomingCount: number;
  pop: number;
}

export default function SchedulePage() {
  const rows = useMemo<CompRow[]>(() => {
    const map = new Map<string, CompRow>();

    const add = (m: Match, isLive: boolean) => {
      const c = m.competition;
      if (!map.has(c.id)) {
        map.set(c.id, {
          competition: c,
          liveCount: 0,
          upcomingCount: 0,
          pop: COMP_POP[c.id] ?? 30,
        });
      }
      const row = map.get(c.id)!;
      if (isLive) row.liveCount++;
      else row.upcomingCount++;
    };

    ALL_LIVE_MATCHES.forEach(m => add(m, true));
    ALL_UPCOMING_MATCHES.forEach(m => add(m, false));

    return Array.from(map.values()).sort((a, b) => b.pop - a.pop);
  }, []);

  return (
    <main className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur border-b border-line px-4 py-4">
        <h1 className="text-base font-extrabold tracking-tight">Schedule</h1>
        <p className="text-[10px] text-text-dim mt-0.5">{rows.length} competitions · sorted by popularity</p>
      </header>

      <div className="px-3 mt-3 space-y-1.5">
        {rows.map(({ competition, liveCount, upcomingCount }) => (
          <Link
            key={competition.id}
            href={`/schedule/${competition.id}`}
            className="card flex items-center gap-3 px-4 py-3.5 active:scale-[0.99] transition-transform"
          >
            {/* Color accent bar */}
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: competition.logoColor ?? "#64748B" }} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-text-primary truncate">{competition.name}</span>
                {liveCount > 0 && (
                  <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-red-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {liveCount} live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-line text-text-dim font-bold uppercase tracking-wide leading-none">
                  {TYPE_LABEL[competition.type]}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded border border-line text-text-dim font-bold uppercase tracking-wide leading-none">
                  {competition.format}
                </span>
                <span className="text-[9px] text-text-dim">
                  {upcomingCount > 0 ? `${upcomingCount} upcoming` : ""}
                  {liveCount > 0 && upcomingCount > 0 ? " · " : ""}
                  {liveCount > 0 ? `${liveCount} live` : ""}
                </span>
              </div>
            </div>

            {/* Chevron */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-dim shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}

        {rows.length === 0 && (
          <div className="text-center py-16 text-text-dim text-sm">No competitions found</div>
        )}
      </div>
    </main>
  );
}
