"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ALL_LIVE_MATCHES,
  ALL_PAST_MATCHES,
  ALL_UPCOMING_MATCHES,
} from "@/lib/mockData";
import { generatePastMatches, generateFutureMatches } from "@/lib/matchGenerator";
import type { Match } from "@/lib/types";
import LiveCarousel from "@/components/LiveCarousel";
import { PastMatchCard, FutureMatchCard } from "@/components/MatchCard";

// ── Popularity sort ──────────────────────────────────────────────────────────
const COMP_POP: Record<string, number> = {
  "icc-t20wc-2026": 100, "icc-ct-2025": 95, "ashes-2025-26": 90, "ipl-2026": 88,
  "ind-eng-test-2026": 82, "ind-aus-t20i-2026": 80, "eng-sa-odi-2026": 68,
  "bbl-2025-26": 66, "psl-2026": 64, "hundred-2026": 58, "sa20-2026": 52,
  "cpl-2025": 46, "mlc-2026": 40,
};
const TEAM_POP: Record<string, number> = {
  IND: 20, AUS: 14, ENG: 12, PAK: 11, SA: 8, NZ: 7, WI: 7, SL: 6, BAN: 5, AFG: 4,
  MI: 10, CSK: 10, RCB: 9, KKR: 8, DC: 6, GT: 6, RR: 6, SRH: 5, LSG: 5, PBKS: 5,
};
function matchPop(m: Match): number {
  return (COMP_POP[m.competition.id] ?? 30) +
    (TEAM_POP[m.teamA.code] ?? 3) + (TEAM_POP[m.teamB.code] ?? 3);
}
function byPopularity(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => matchPop(b) - matchPop(a));
}

type ExpandedCol = null | "past" | "future";

export default function Home() {
  // ---- Boot skeleton ----
  const [isBooting, setIsBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsBooting(false), 350);
    return () => clearTimeout(t);
  }, []);

  // ---- Pull-to-refresh ----
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const onPullTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 2) return;
    pullStartY.current = e.touches[0].clientY;
  }, []);
  const onPullTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 2) { setPullY(0); return; }
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 0) setPullY(Math.min(delta * 0.45, 65));
  }, []);
  const onPullTouchEnd = useCallback(() => {
    if (pullY >= 55) {
      setIsRefreshing(true);
      setPullY(0);
      setTimeout(() => setIsRefreshing(false), 1200);
    } else {
      setPullY(0);
    }
  }, [pullY]);

  // ---- Source lists (infinite scroll grows these) ----
  const [pastList, setPastList] = useState<Match[]>(ALL_PAST_MATCHES);
  const [futureList, setFutureList] = useState<Match[]>(byPopularity(ALL_UPCOMING_MATCHES));

  // ---- Scroll-listener infinite scroll ----
  const loadingRef = useRef(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timeout) return;
      timeout = setTimeout(() => {
        timeout = null;
        if (loadingRef.current) return;
        const scrollBottom = window.innerHeight + window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        if (scrollBottom > docHeight - 400) {
          loadingRef.current = true;
          setPastList(prev => {
            const earliest = prev.reduce((acc, m) => (m.startTimeIso < acc ? m.startTimeIso : acc), prev[0]?.startTimeIso ?? new Date().toISOString());
            return [...prev, ...generatePastMatches(earliest, 4)];
          });
          setFutureList(prev => {
            const latest = prev.reduce((acc, m) => (m.startTimeIso > acc ? m.startTimeIso : acc), prev[0]?.startTimeIso ?? new Date().toISOString());
            return [...prev, ...generateFutureMatches(latest, 4)];
          });
          setTimeout(() => { loadingRef.current = false; }, 300);
        }
      }, 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // ---- Column expand ----
  const [expanded, setExpanded] = useState<ExpandedCol>(null);
  const pastBasis = expanded === "past" ? "basis-full" : expanded === "future" ? "hidden" : "basis-[63%]";
  const futureBasis = expanded === "future" ? "basis-full" : expanded === "past" ? "hidden" : "basis-[37%]";

  return (
    <main
      className="min-h-screen pb-24"
      onTouchStart={onPullTouchStart}
      onTouchMove={onPullTouchMove}
      onTouchEnd={onPullTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullY > 5 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: isRefreshing ? 48 : pullY }}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 border-cyan border-t-transparent ${isRefreshing ? "animate-spin" : ""}`}
            style={{ transform: isRefreshing ? undefined : `rotate(${pullY * 4}deg)` }}
          />
        </div>
      )}

      {/* Header — logo + title only */}
      <header className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <Logo />
          <h1 className="text-base font-extrabold tracking-tight">Bawler</h1>
        </div>
      </header>

      <section className="mt-1">
        <LiveCarousel matches={byPopularity(ALL_LIVE_MATCHES)} nextMatch={byPopularity(ALL_UPCOMING_MATCHES)[0]} />
      </section>

      {isBooting ? (
        <SkeletonColumns />
      ) : (
        <section className="mt-4 px-3">
          <div className="flex gap-2 items-start">
            <div className={`${pastBasis} min-w-0`}>
              <ColumnHeader
                title="Past"
                count={pastList.length}
                expanded={expanded === "past"}
                onToggleExpand={() => setExpanded(e => (e === "past" ? null : "past"))}
              />
              <div className="space-y-2">
                {pastList.map(m => <PastMatchCard key={m.id} match={m} />)}
              </div>
            </div>
            <div className={`${futureBasis} min-w-0`}>
              <ColumnHeader
                title="Coming up"
                count={futureList.length}
                expanded={expanded === "future"}
                onToggleExpand={() => setExpanded(e => (e === "future" ? null : "future"))}
              />
              <div className="space-y-2">
                {futureList.map(m => <FutureMatchCard key={m.id} match={m} />)}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ColumnHeader({ title, count, expanded, onToggleExpand }: {
  title: string; count: number; expanded: boolean; onToggleExpand: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
        {title} <span className="text-text-secondary num">· {count}</span>
      </h2>
      <button
        onClick={onToggleExpand}
        aria-label={expanded ? "Collapse to split view" : "Expand to full width"}
        className="text-text-dim hover:text-cyan p-0.5"
      >
        {expanded ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 7H7V3M13 9H9V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 7V3H7M13 9V13H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

function SkeletonColumns() {
  return (
    <section className="mt-4 px-3">
      <div className="flex gap-2 items-start">
        <div className="basis-[63%] space-y-2">
          <div className="skeleton rounded-xl" style={{ height: 14, width: "60%", marginBottom: 8 }} />
          {[148, 148, 130, 120].map((h, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: h }} />
          ))}
        </div>
        <div className="basis-[37%] space-y-2">
          <div className="skeleton rounded-xl" style={{ height: 14, width: "70%", marginBottom: 8 }} />
          {[148, 148, 130, 120].map((h, i) => (
            <div key={i} className="skeleton rounded-xl" style={{ height: h }} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <circle cx="16" cy="16" r="14" stroke="#00E5FF" strokeWidth="2" />
      <path d="M9 16 L13 22 L23 10" stroke="#FF6B35" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="10" r="2" fill="#00E5FF" />
    </svg>
  );
}
