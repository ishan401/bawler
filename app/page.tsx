"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ALL_LIVE_MATCHES,
  ALL_PAST_MATCHES,
  ALL_UPCOMING_MATCHES,
  ALL_TEAMS,
} from "@/lib/mockData";
import { generatePastMatches, generateFutureMatches } from "@/lib/matchGenerator";
import type { Match } from "@/lib/types";
import LiveCarousel from "@/components/LiveCarousel";
import { PastMatchCard, FutureMatchCard, SpotlightMatchCard } from "@/components/MatchCard";
import { getFollowedTeamCode, setFollowedTeamCode, DEFAULT_FOLLOWED_TEAM, FOLLOWABLE_TEAMS } from "@/lib/followedTeam";
import { isSpotlightMatch } from "@/lib/spotlight";

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

function fmtCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `in ${days}d ${hrs}h`;
  if (hrs > 0)  return `in ${hrs}h ${mins}m`;
  return `in ${mins}m`;
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

// Spotlight uses a deliberately stricter, concrete-condition bar than the
// excitement-glow score elsewhere in the app — see lib/spotlight.ts for why.
const SPOTLIGHT_MAX = 3;

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

  // ---- Followed team (for the "For you" row) ----
  const [followedTeam, setFollowedTeam] = useState<string>(DEFAULT_FOLLOWED_TEAM);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => { setFollowedTeam(getFollowedTeamCode()); }, []);
  const changeFollowedTeam = useCallback((code: string) => {
    setFollowedTeam(code);
    setFollowedTeamCode(code);
    setPickerOpen(false);
  }, []);

  // ---- Spotlight — excitement>=8 matches, pulled OUT of the quiet grid and
  // rendered full-width (or as a capped 3-card carousel) above it. Sourced
  // from the original mock arrays (not the infinite-scroll-grown lists) so
  // the spotlight slot doesn't shuffle as the user scrolls the grid below. ----
  const spotlightMatches = useMemo(() => {
    // Most-recent-first for past (freshest result leads), soonest-first for
    // upcoming. Past matches lead the combined list since they're a settled,
    // immediate story; upcoming fills remaining slots if any are left.
    const past = ALL_PAST_MATCHES
      .filter(isSpotlightMatch)
      .map(m => ({ m, isPast: true as const }))
      .sort((a, b) => b.m.startTimeIso.localeCompare(a.m.startTimeIso));
    const future = ALL_UPCOMING_MATCHES
      .filter(isSpotlightMatch)
      .map(m => ({ m, isPast: false as const }))
      .sort((a, b) => a.m.startTimeIso.localeCompare(b.m.startTimeIso));
    return [...past, ...future].slice(0, SPOTLIGHT_MAX);
  }, []);
  const spotlightIds = useMemo(() => new Set(spotlightMatches.map(s => s.m.id)), [spotlightMatches]);

  // ---- "For you" — followed team's live match, else their next upcoming fixture ----
  const forYouMatch = useMemo(() => {
    const live = ALL_LIVE_MATCHES.find(m => m.teamA.code === followedTeam || m.teamB.code === followedTeam);
    if (live) return { m: live, isLive: true as const };
    const upcoming = [...ALL_UPCOMING_MATCHES]
      .filter(m => m.teamA.code === followedTeam || m.teamB.code === followedTeam)
      .sort((a, b) => a.startTimeIso.localeCompare(b.startTimeIso))[0];
    return upcoming ? { m: upcoming, isLive: false as const } : null;
  }, [followedTeam]);

  // Same match in both slots → collapse to just the spotlight card + marker,
  // don't show it twice.
  const forYouInSpotlight = !!forYouMatch && !forYouMatch.isLive && spotlightIds.has(forYouMatch.m.id);

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

      {/* For you — surfaces the followed team's live match, else next fixture.
          Hidden when it's the same match as the spotlight card below (that
          card gets a "for you" marker instead, so the match isn't shown twice). */}
      {forYouMatch && !forYouInSpotlight && (
        <section className="mt-3 px-3">
          <ForYouRow
            match={forYouMatch.m}
            isLive={forYouMatch.isLive}
            followedTeam={followedTeam}
            pickerOpen={pickerOpen}
            onTogglePicker={() => setPickerOpen(o => !o)}
            onChangeTeam={changeFollowedTeam}
          />
        </section>
      )}

      {/* Spotlight — matches clearing the concrete spotlight bar (see
          lib/spotlight.ts), standing apart from the quiet grid below. 2+
          qualifiers → swipeable carousel, capped at 3. */}
      {spotlightMatches.length > 0 && (
        <section className="mt-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1.5 px-3">Spotlight</h2>
          {spotlightMatches.length === 1 ? (
            <div className="px-3">
              <SpotlightMatchCard
                match={spotlightMatches[0].m}
                isPast={spotlightMatches[0].isPast}
                forYou={forYouInSpotlight}
              />
            </div>
          ) : (
            <div className="px-3">
              <div className="flex gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory -mx-3 px-3">
                {spotlightMatches.map(({ m, isPast }) => (
                  <div key={m.id} className="shrink-0 snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
                    <SpotlightMatchCard match={m} isPast={isPast} forYou={forYouInSpotlight && forYouMatch?.m.id === m.id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

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
                {pastList.filter(m => !spotlightIds.has(m.id)).map(m => <PastMatchCard key={m.id} match={m} />)}
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
                {futureList.filter(m => !spotlightIds.has(m.id)).map(m => <FutureMatchCard key={m.id} match={m} />)}
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

/**
 * "For you" row (v1.0.49) — small personalization strip above the spotlight/
 * grid. Tapping the label opens an inline team picker (no account system
 * yet, so this is a simple localStorage-backed preference, default India).
 */
function ForYouRow({ match, isLive, followedTeam, pickerOpen, onTogglePicker, onChangeTeam }: {
  match: Match;
  isLive: boolean;
  followedTeam: string;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  onChangeTeam: (code: string) => void;
}) {
  const teamLabel = ALL_TEAMS[followedTeam]?.shortName ?? followedTeam;
  return (
    <div className="card px-3 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={onTogglePicker}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z" />
          </svg>
          For you · {teamLabel}
          <svg width="8" height="8" viewBox="0 0 16 16" fill="none" className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`}>
            <path d="M3 5L8 11L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        {isLive && (
          <span className="text-[9px] font-extrabold text-wicket uppercase tracking-widest flex items-center gap-1">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-wicket inline-block" />Live
          </span>
        )}
      </div>

      {pickerOpen && (
        <div className="flex flex-wrap gap-1.5 mb-2 pb-2 border-b border-line">
          {FOLLOWABLE_TEAMS.map(code => (
            <button
              key={code}
              onClick={() => onChangeTeam(code)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
                code === followedTeam ? "bg-cyan text-bg" : "bg-bg-elevated text-text-secondary hover:text-text-primary"
              }`}
            >
              {ALL_TEAMS[code]?.shortName ?? code}
            </button>
          ))}
        </div>
      )}

      <a href={`/match/${match.id}`} className="tap-scale flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: match.teamA.primaryColor }} />
          <span className="text-base font-extrabold truncate">{match.teamA.shortName}</span>
        </div>
        <span className="text-[10px] font-bold text-text-dim shrink-0">vs</span>
        <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: match.teamB.primaryColor }} />
          <span className="text-base font-extrabold truncate">{match.teamB.shortName}</span>
        </div>
      </a>
      <div className="mt-1 text-[10px] text-text-dim text-center truncate">
        {isLive ? (match.liveStatusOverride ?? "Live now") : `${fmtCountdown(match.startTimeIso)} · ${fmtTime(match.startTimeIso)}`}
      </div>
    </div>
  );
}

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
