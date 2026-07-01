"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  LIVE_MATCHES,
  PAST_MATCHES,
  UPCOMING_MATCHES,
  TEAMS,
  VENUES,
} from "@/lib/mockData";
import { generatePastMatches, generateFutureMatches } from "@/lib/matchGenerator";
import type { Match } from "@/lib/types";
import LiveCarousel from "@/components/LiveCarousel";
import { PastMatchCard, FutureMatchCard } from "@/components/MatchCard";
import FilterBar, { type FilterDef } from "@/components/FilterBar";

const TEAM_DEFAULT = "KKR";
const VENUE_DEFAULT = "Kolkata";

const FILTERS: FilterDef[] = [
  {
    key: "team",
    label: "Team",
    defaultValue: TEAM_DEFAULT,
    options: Object.values(TEAMS).map(t => t.shortName).sort(),
    colorFn: (val) => Object.values(TEAMS).find(t => t.shortName === val)?.primaryColor,
  },
  {
    key: "tournament",
    label: "Tour",
    defaultValue: "IPL",
    options: ["IPL"],
    alwaysOn: true,
  },
  {
    key: "venue",
    label: "Venue",
    defaultValue: VENUE_DEFAULT,
    options: Object.values(VENUES).map(v => v.city).sort(),
  },
];

type ExpandedCol = null | "past" | "future";
type AnimPhase = "idle" | "leaving" | "entering";

const LEAVE_MS = 700;
const ENTER_MS = 900;

export default function Home() {
  // ---- Filter state ----
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    team: TEAM_DEFAULT,
    tournament: "IPL",
    venue: VENUE_DEFAULT,
  });
  const [filterEnabled, setFilterEnabled] = useState<Record<string, boolean>>({
    team: false,
    tournament: true,
    venue: false,
  });

  // ---- Boot skeleton (shows shimmer for 350ms on first load) ----
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
  const [pastList, setPastList] = useState<Match[]>(PAST_MATCHES);
  const [futureList, setFutureList] = useState<Match[]>(UPCOMING_MATCHES);

  // ---- What's actually on screen (can lag source during animation) ----
  const [displayedPast, setDisplayedPast] = useState<Match[]>(PAST_MATCHES);
  const [displayedFuture, setDisplayedFuture] = useState<Match[]>(UPCOMING_MATCHES);

  // ---- Animation state ----
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");

  const animTimersRef = useRef<{ t1?: ReturnType<typeof setTimeout>; t2?: ReturnType<typeof setTimeout> }>({});

  // ---- Refs to detect what triggered the orchestration effect ----
  const prevFilterRef = useRef({ values: filterValues, enabled: filterEnabled });
  const prevSourceLenRef = useRef({ past: pastList.length, future: futureList.length });

  // Filter function — pure
  const filterMatches = useCallback((matches: Match[], values = filterValues, enabled = filterEnabled): Match[] => {
    return matches.filter(m => {
      if (enabled.team && values.team) {
        if (m.teamA.shortName !== values.team && m.teamB.shortName !== values.team) return false;
      }
      if (enabled.venue && values.venue) {
        if (m.venue.city !== values.venue) return false;
      }
      return true;
    });
  }, [filterValues, filterEnabled]);

  // ---- SINGLE orchestration effect ----
  // Detects whether filters changed (→ run diff-aware animation) or source grew (→ instant sync).
  useEffect(() => {
    const filtersChanged =
      JSON.stringify(prevFilterRef.current.values) !== JSON.stringify(filterValues) ||
      JSON.stringify(prevFilterRef.current.enabled) !== JSON.stringify(filterEnabled);
    const sourceGrew =
      pastList.length > prevSourceLenRef.current.past ||
      futureList.length > prevSourceLenRef.current.future;

    prevFilterRef.current = { values: filterValues, enabled: filterEnabled };
    prevSourceLenRef.current = { past: pastList.length, future: futureList.length };

    if (filtersChanged) {
      const newPast = filterMatches(pastList);
      const newFuture = filterMatches(futureList);
      const oldPastIds = new Set(displayedPast.map(m => m.id));
      const oldFutIds = new Set(displayedFuture.map(m => m.id));
      const newPastIds = new Set(newPast.map(m => m.id));
      const newFutIds = new Set(newFuture.map(m => m.id));

      const pastLeavers = [...oldPastIds].filter(id => !newPastIds.has(id));
      const futLeavers = [...oldFutIds].filter(id => !newFutIds.has(id));
      const pastNewcomers = [...newPastIds].filter(id => !oldPastIds.has(id));
      const futNewcomers = [...newFutIds].filter(id => !oldFutIds.has(id));

      if (pastLeavers.length + futLeavers.length + pastNewcomers.length + futNewcomers.length === 0) {
        return;
      }

      // Cancel any in-flight animation
      if (animTimersRef.current.t1) clearTimeout(animTimersRef.current.t1);
      if (animTimersRef.current.t2) clearTimeout(animTimersRef.current.t2);

      // Phase 1: leave
      setLeavingIds(new Set([...pastLeavers, ...futLeavers]));
      setEnteringIds(new Set());
      setAnimPhase("leaving");

      animTimersRef.current.t1 = setTimeout(() => {
        // Phase 2: enter
        setDisplayedPast(newPast);
        setDisplayedFuture(newFuture);
        setLeavingIds(new Set());
        setEnteringIds(new Set([...pastNewcomers, ...futNewcomers]));
        setAnimPhase("entering");

        animTimersRef.current.t2 = setTimeout(() => {
          setAnimPhase("idle");
          setEnteringIds(new Set());
        }, ENTER_MS);
      }, LEAVE_MS);
    } else if (sourceGrew && animPhase === "idle") {
      // Source data grew (infinite scroll) and no animation in flight — instant sync
      setDisplayedPast(filterMatches(pastList));
      setDisplayedFuture(filterMatches(futureList));
    }
  }, [filterValues, filterEnabled, pastList, futureList, animPhase, filterMatches, displayedPast, displayedFuture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animTimersRef.current.t1) clearTimeout(animTimersRef.current.t1);
      if (animTimersRef.current.t2) clearTimeout(animTimersRef.current.t2);
    };
  }, []);

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
      {/* Compact header — logo + nav + filter on a single line */}
      <header className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Logo />
          <h1 className="text-base font-extrabold tracking-tight shrink-0">Bawler</h1>
          <div className="flex-1 min-w-0 flex justify-end">
            <FilterBar
              filters={FILTERS}
              values={filterValues}
              enabled={filterEnabled}
              onValueChange={(k, v) => setFilterValues(prev => ({ ...prev, [k]: v }))}
              onEnabledChange={(k, e) => setFilterEnabled(prev => ({ ...prev, [k]: e }))}
            />
          </div>
        </div>
      </header>



      <section className="mt-1">
        <LiveCarousel matches={LIVE_MATCHES} nextMatch={UPCOMING_MATCHES[0]} />
      </section>

      {isBooting ? (
        <SkeletonColumns />
      ) : (
      <section className="mt-4 px-3">
        <div className="flex gap-2 items-start">
          <div className={`${pastBasis} min-w-0`}>
            <ColumnHeader
              title="Past"
              count={displayedPast.length}
              expanded={expanded === "past"}
              onToggleExpand={() => setExpanded(e => (e === "past" ? null : "past"))}
            />
            <CardColumn
              items={displayedPast}
              leavingIds={leavingIds}
              enteringIds={enteringIds}
              animPhase={animPhase}
              side="left"
              renderItem={(m) => <PastMatchCard match={m} />}
            />
          </div>
          <div className={`${futureBasis} min-w-0`}>
            <ColumnHeader
              title="Coming up"
              count={displayedFuture.length}
              expanded={expanded === "future"}
              onToggleExpand={() => setExpanded(e => (e === "future" ? null : "future"))}
            />
            <CardColumn
              items={displayedFuture}
              leavingIds={leavingIds}
              enteringIds={enteringIds}
              animPhase={animPhase}
              side="right"
              renderItem={(m) => <FutureMatchCard match={m} />}
            />
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


function ColumnHeader({ title, count, expanded, onToggleExpand }: { title: string; count: number; expanded: boolean; onToggleExpand: () => void }) {
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

function CardColumn<T extends { id: string }>({
  items,
  leavingIds,
  enteringIds,
  animPhase,
  side,
  renderItem,
}: {
  items: T[];
  leavingIds: Set<string>;
  enteringIds: Set<string>;
  animPhase: AnimPhase;
  side: "left" | "right";
  renderItem: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <div className="card p-4 text-center text-text-dim text-xs">No matches.</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isLeaving = animPhase === "leaving" && leavingIds.has(item.id);
        const isEntering = animPhase === "entering" && enteringIds.has(item.id);
        const className =
          isLeaving ? (side === "left" ? "anim-leave-left" : "anim-leave-right") :
          isEntering ? "anim-pull-up" : "";
        const style: React.CSSProperties | undefined =
          isEntering ? { animationDelay: `${Math.min(i, 10) * 55}ms` } : undefined;
        return (
          <div key={item.id} className={className} style={style}>
            {renderItem(item)}
          </div>
        );
      })}
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
