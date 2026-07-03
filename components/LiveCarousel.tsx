"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import type { Match, Competition } from "@/lib/types";
import { LiveMatchCard } from "./MatchCard";
import MiniStandings from "./MiniStandings";
import { ALL_LIVE_MATCHES, ALL_PAST_MATCHES, ALL_UPCOMING_MATCHES, ALL_TEAMS } from "@/lib/mockData";

interface LiveCarouselProps {
  matches: Match[];
  nextMatch?: Match;
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, weekday: "short" });
}

function truncate10(text: string): string {
  const words = text.split(" ");
  return words.length <= 10 ? text : words.slice(0, 10).join(" ") + "…";
}

// ── Swipe-down-dismissible bottom sheet ───────────────────────────────────
// Drag gesture is ONLY on the handle/header — content scrolls freely.
function BottomSheet({ title, subtitle, onClose, onBack, children }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const dragY = useRef(0);
  const startY = useRef(0);
  const [translateY, setTranslateY] = useState(0);

  // Lock body scroll — position:fixed is the only reliable method on mobile.
  // overflow:hidden alone doesn't stop iOS/Android from scrolling the page.
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflowY = "scroll";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      body.style.overflowY = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; dragY.current = 0; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    dragY.current = delta;
    setTranslateY(delta);
  };
  const onTouchEnd = () => {
    if (dragY.current > 80) { onClose(); }
    else { setTranslateY(0); }
    dragY.current = 0;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          transform: `translateY(${translateY}px)`,
          transition: translateY === 0 ? "transform 0.25s ease" : "none",
          // h-[85vh] not max-h: flex-1 needs a real defined height to scroll
          height: "85vh",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          borderRadius: "16px 16px 0 0",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--line)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle + header — swipe-down zone only */}
        <div
          style={{ flexShrink: 0 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-line mx-auto mt-2.5" />
          <div className="px-4 pt-2 pb-2.5 flex items-center justify-between border-b border-line">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center mr-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              <div>
                <span className="text-sm font-extrabold">{title}</span>
                {subtitle && <span className="ml-2 text-[10px] text-text-dim font-bold uppercase tracking-widest">{subtitle}</span>}
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Scrollable content — explicit flex:1 + overflow so mobile sees it */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-y", minHeight: 0 }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ── Team schedule popup ────────────────────────────────────────────────────
function TeamScheduleSheet({ competition, teamCode, onClose, onBack }: {
  competition: Competition;
  teamCode: string;
  onClose: () => void;
  onBack: () => void;
}) {
  const team = ALL_TEAMS[teamCode];

  const allMatches = [
    ...ALL_PAST_MATCHES,
    ...ALL_LIVE_MATCHES,
    ...ALL_UPCOMING_MATCHES,
  ]
    .filter(m =>
      (m.competition.id === competition.id || m.championship?.id === competition.id) &&
      (m.teamA.code === teamCode || m.teamB.code === teamCode)
    )
    .sort((a, b) => new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime());

  return (
    <BottomSheet
      title={team?.shortName ?? teamCode}
      subtitle={competition.shortName + " Schedule"}
      onClose={onClose}
      onBack={onBack}
    >
      {allMatches.length === 0 && (
        <p className="text-sm text-text-secondary text-center py-12">No matches found.</p>
      )}
      <div className="divide-y divide-line">
        {allMatches.map(m => {
          const isLive     = m.status === "live" || m.status === "toss" || m.status === "innings-break";
          const isPast     = m.status === "post-match";
          const isUpcoming = !isLive && !isPast;
          const opponent   = m.teamA.code === teamCode ? m.teamB : m.teamA;
          const teamFirst  = m.teamA.code === teamCode;

          // Result string for past matches
          let resultLine = "";
          if (isPast && m.result) {
            const won = m.result.winner === teamCode;
            const draw = m.result.winner === "draw" || m.result.winner === "tie" || m.result.winner === "no-result";
            resultLine = draw ? m.result.winner : (won ? `Won · ${m.result.margin}` : `Lost · ${m.result.margin}`);
          }

          return (
            <div
              key={m.id}
              className={`px-4 py-3 ${isLive ? "bg-wicket/5 border-l-2 border-wicket" : ""}`}
            >
              {/* Date + competition round */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">
                  {fmtDate(m.startTimeIso)} · {m.matchNumber ?? ""}
                </span>
                {isLive && (
                  <span className="text-[9px] font-extrabold text-wicket uppercase tracking-widest flex items-center gap-1">
                    <span className="live-dot w-1 h-1 rounded-full bg-wicket inline-block" />Live
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: team?.primaryColor }} />
                  <span className="text-sm font-extrabold">{team?.shortName ?? teamCode}</span>
                </div>
                <span className="text-[10px] text-text-dim font-bold shrink-0">vs</span>
                <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-row-reverse">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opponent.primaryColor }} />
                  <span className="text-sm font-extrabold">{opponent.shortName}</span>
                </div>
              </div>

              {/* Result or time */}
              {isPast && (
                <div className="mt-1 flex items-start gap-2">
                  <span className={`text-[10px] font-extrabold shrink-0 ${resultLine.startsWith("Won") ? "text-boundary" : resultLine.startsWith("Lost") ? "text-wicket" : "text-text-dim"}`}>
                    {resultLine}
                  </span>
                  {m.summary && (
                    <span className="text-[10px] text-text-secondary leading-tight">{truncate10(m.summary)}</span>
                  )}
                </div>
              )}
              {isLive && m.liveStatusOverride && (
                <p className="mt-1 text-[10px] text-wicket font-bold">{m.liveStatusOverride}</p>
              )}
              {isUpcoming && (
                <p className="mt-1 text-[10px] text-text-dim">{fmtTime(m.startTimeIso)} · {m.venue.city}</p>
              )}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

// ── Main carousel ─────────────────────────────────────────────────────────
export default function LiveCarousel({ matches, nextMatch }: LiveCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState<"none" | "standings" | "team-schedule">("none");
  const [openTeamCode, setOpenTeamCode] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      // Use first child width + gap to calculate which card is snapped
      const firstCard = el.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const cardW = firstCard.getBoundingClientRect().width;
      const gap = 12; // gap-3 = 12px
      const step = cardW + gap;
      const idx = Math.round(el.scrollLeft / step);
      setActiveIdx(Math.max(0, Math.min(idx, matches.length - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [matches.length]);

  const activeMatch = matches[activeIdx];
  // For TABLE button: use championship (e.g. WTC for Test matches) when it has standings,
  // otherwise fall back to the match's own competition (e.g. IPL, PSL).
  const tableComp = activeMatch
    ? (activeMatch.championship?.hasStandings ? activeMatch.championship
       : activeMatch.competition.hasStandings  ? activeMatch.competition
       : null)
    : null;
  const activeComp = tableComp;

  const closeAll = () => { setView("none"); setOpenTeamCode(null); };

  if (matches.length === 0) {
    return (
      <div className="mx-3">
        <div className="card px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-dim shrink-0">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">No live matches right now</span>
          </div>
          {nextMatch ? (
            <>
              <p className="text-xs text-text-secondary mb-3">Next up</p>
              <Link href={`/match/${nextMatch.id}`} className="tap-scale block">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: nextMatch.teamA.primaryColor }} />
                    <span className="text-base font-extrabold">{nextMatch.teamA.shortName}</span>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] font-bold text-text-dim">vs</span>
                    <span className="text-[11px] font-extrabold text-cyan num">{fmtCountdown(nextMatch.startTimeIso)}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: nextMatch.teamB.primaryColor }} />
                    <span className="text-base font-extrabold">{nextMatch.teamB.shortName}</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-text-dim text-center">
                  {fmtTime(nextMatch.startTimeIso)} · {nextMatch.venue.name}, {nextMatch.venue.city}
                </div>
              </Link>
            </>
          ) : (
            <p className="text-sm text-text-secondary">Check the schedule for upcoming matches.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-3">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory -mx-3 px-3">
          {matches.map(m => (
            <div key={m.id} className="shrink-0 snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
              <LiveMatchCard match={m} />
            </div>
          ))}
        </div>

        {(activeComp || activeMatch?.seriesStatus) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* League / WTC table button — only when standings exist */}
            {activeComp && (
              <button
                onClick={() => setView("standings")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-line text-[11px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors tap-scale"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="0.5" y="0.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="0.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="0.5" y="7" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="7" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                {activeComp.shortName} Table
              </button>
            )}
            {/* Series status chip — bilateral international series */}
            {activeMatch?.seriesStatus && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-line text-[11px] font-bold text-text-secondary leading-none">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <line x1="4" y1="13" x2="4" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="8" y1="13" x2="8" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="12" y1="13" x2="12" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M5.5 8 C5.5 5 10.5 5 10.5 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                </svg>
                {activeMatch.seriesStatus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Standings sheet */}
      {view === "standings" && activeComp && (
        <BottomSheet title={activeComp.name} subtitle="Standings" onClose={closeAll}>
          <div className="p-3">
            <MiniStandings
              competition={activeComp}
              onTeamClick={(code) => { setOpenTeamCode(code); setView("team-schedule"); }}
            />
          </div>
        </BottomSheet>
      )}

      {/* Team schedule sheet */}
      {view === "team-schedule" && activeComp && openTeamCode && (
        <TeamScheduleSheet
          competition={activeComp}
          teamCode={openTeamCode}
          onClose={closeAll}
          onBack={() => { setOpenTeamCode(null); setView("standings"); }}
        />
      )}
    </>
  );
}
