"use client";

import Link from "next/link";
import React, { useState, useRef, useMemo } from "react";
import type { Match, Competition } from "@/lib/types";
import { LiveMatchCard } from "./MatchCard";
import BottomSheet from "./BottomSheet";
import MiniStandings from "./MiniStandings";
import { ALL_LIVE_MATCHES, ALL_PAST_MATCHES, ALL_UPCOMING_MATCHES, ALL_TEAMS } from "@/lib/mockData";
import { useCarouselIndex } from "@/lib/useCarouselIndex";
import CarouselDots from "./CarouselDots";

// Fixed footprint for the tournament-table shortcut pill below the hero
// card -- v1.0.68. Was content-hugging (width = icon + label), so it
// subtly resized per tournament ("IPL TABLE" narrower than "CHAMP. TR.
// TABLE") even though only one ever shows at a time, in the same slot.
// Sized against the longest current label -- "Champ. Tr. Table" measures
// ~163px with this exact icon/padding/font -- plus a comfortable buffer.
// If a future tournament's shortName is long enough to need more than
// this without truncating, that's a real signal to come back and widen
// it deliberately, not silently truncate or let it grow per-label again.
// See DESIGN-SYSTEM.md §7 for the full label-width audit.
const TABLE_PILL_WIDTH = 176;

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
              className={`px-4 py-3 ${isLive ? "bg-live/5 border-l-2 border-live" : ""}`}
            >
              {/* Date + competition round */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest">
                  {fmtDate(m.startTimeIso)} · {m.matchNumber ?? ""}
                </span>
                {isLive && (
                  <span className="text-[9px] font-extrabold text-live uppercase tracking-widest flex items-center gap-1">
                    <span className="live-dot w-1 h-1 rounded-full bg-live inline-block" />Live
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
                  <span className={`text-[10px] font-extrabold shrink-0 ${resultLine.startsWith("Won") ? "text-boundary" : resultLine.startsWith("Lost") ? "text-negative" : "text-text-dim"}`}>
                    {resultLine}
                  </span>
                  {m.summary && (
                    <span className="text-[10px] text-text-secondary leading-tight">{truncate10(m.summary)}</span>
                  )}
                </div>
              )}
              {isLive && m.liveStatusOverride && (
                <p className="mt-1 text-[10px] text-live font-bold">{m.liveStatusOverride}</p>
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
// ── Series schedule popup ──────────────────────────────────────────────────
function SeriesScheduleSheet({ match, seriesPool, onClose }: {
  match: Match;
  // All matches (past + live + upcoming) from whatever data source the parent
  // is using. When real API data arrives, the parent passes API results here
  // instead of mock arrays — this component never imports from mockData directly.
  seriesPool: Match[];
  onClose: () => void;
}) {
  const { competition } = match;
  const teamCodes = new Set([match.teamA.code, match.teamB.code]);

  // Filter all matches in same bilateral series (same competition + same two teams)
  const isSameSeries = (m: Match) =>
    m.competition.id === competition.id &&
    m.teamA.code !== undefined &&
    teamCodes.has(m.teamA.code) &&
    teamCodes.has(m.teamB.code);

  const past = seriesPool
    .filter(m => isSameSeries(m) && m.status === "post-match")
    .sort((a, b) => a.startTimeIso.localeCompare(b.startTimeIso));
  const live = seriesPool.filter(m => isSameSeries(m) && m.status === "live");
  const upcoming = seriesPool
    .filter(m => isSameSeries(m) && m.status === "upcoming")
    .sort((a, b) => a.startTimeIso.localeCompare(b.startTimeIso));

  const allMatches = [...past, ...live, ...upcoming];

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
  };
  const countdown = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return "Soon";
    const h = Math.floor(diff / 3600000);
    const m2 = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `in ${Math.floor(h / 24)}d`;
    if (h > 0) return `in ${h}h ${m2}m`;
    return `in ${m2}m`;
  };

  const teamName = (code: string) => {
    const t = ALL_TEAMS[code];
    return t ? (t.shortName ?? code) : code;
  };

  return (
    <BottomSheet title={competition.name} subtitle={competition.shortName} onClose={onClose}>
      <div className="flex flex-col gap-2 pb-4">
        {allMatches.map((m) => {
          const isLive = m.status === "live";
          const isPast = m.status === "post-match";
          const isUpcoming = m.status === "upcoming";
          const winner = m.result?.winner;
          const margin = m.result?.margin;

          return (
            <div
              key={m.id}
              className={[
                "rounded-xl border px-4 py-3 flex flex-col gap-1",
                isLive
                  ? "bg-live/10 border-live/40"
                  : isPast
                  ? "bg-bg-elevated border-line"
                  : "bg-bg-card border-line/60",
              ].join(" ")}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                  {m.matchNumber ?? "Match"}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-live uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                    LIVE
                  </span>
                )}
                {isPast && (
                  <span className="text-[10px] text-text-dim">{fmtDate(m.startTimeIso)}</span>
                )}
                {isUpcoming && (
                  <span className="text-[10px] font-bold text-cyan">{countdown(m.startTimeIso)}</span>
                )}
              </div>

              {/* Teams row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  {/* Team A */}
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "text-sm font-black num",
                        winner === m.teamA.code
                          ? "text-text-primary"
                          : isPast
                          ? "text-text-dim"
                          : "text-text-primary",
                      ].join(" ")}
                    >
                      {teamName(m.teamA.code)}
                    </span>
                    {isPast && m.innings[0] && (
                      <span className="text-xs font-bold text-text-secondary num">
                        {m.innings[0].battingTeam === m.teamA.code
                          ? `${m.innings[0].runs}/${m.innings[0].wickets}`
                          : m.innings[1]
                          ? `${m.innings[1].runs}/${m.innings[1].wickets}`
                          : "—"}
                      </span>
                    )}
                    {isLive && m.innings.length > 0 && (() => {
                      const battInn = m.innings.find(i => i.battingTeam === m.teamA.code);
                      return battInn ? (
                        <span className="text-xs font-bold text-text-primary num">
                          {battInn.runs}/{battInn.wickets}
                          <span className="text-text-dim font-normal"> ({battInn.overs})</span>
                        </span>
                      ) : null;
                    })()}
                    {winner === m.teamA.code && (
                      <span className="text-[9px] font-black text-boundary bg-boundary/10 px-1.5 py-0.5 rounded-full">WON</span>
                    )}
                  </div>
                  {/* Team B */}
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "text-sm font-black num",
                        winner === m.teamB.code
                          ? "text-text-primary"
                          : isPast
                          ? "text-text-dim"
                          : "text-text-primary",
                      ].join(" ")}
                    >
                      {teamName(m.teamB.code)}
                    </span>
                    {isPast && m.innings[1] && (
                      <span className="text-xs font-bold text-text-secondary num">
                        {m.innings[1].battingTeam === m.teamB.code
                          ? `${m.innings[1].runs}/${m.innings[1].wickets}`
                          : m.innings[0]
                          ? `${m.innings[0].runs}/${m.innings[0].wickets}`
                          : "—"}
                      </span>
                    )}
                    {isLive && m.innings.length > 0 && (() => {
                      const battInn = m.innings.find(i => i.battingTeam === m.teamB.code);
                      return battInn ? (
                        <span className="text-xs font-bold text-text-primary num">
                          {battInn.runs}/{battInn.wickets}
                          <span className="text-text-dim font-normal"> ({battInn.overs})</span>
                        </span>
                      ) : null;
                    })()}
                    {winner === m.teamB.code && (
                      <span className="text-[9px] font-black text-boundary bg-boundary/10 px-1.5 py-0.5 rounded-full">WON</span>
                    )}
                  </div>
                </div>

                {/* Right side info */}
                <div className="flex flex-col items-end gap-0.5">
                  {isPast && margin && (
                    <span className="text-[11px] text-text-secondary text-right leading-snug max-w-[120px]">
                      {margin}
                    </span>
                  )}
                  {isUpcoming && (
                    <>
                      <span className="text-[11px] text-text-primary font-medium">
                        {fmtDate(m.startTimeIso)}
                      </span>
                      <span className="text-[10px] text-text-dim">{fmtTime(m.startTimeIso)}</span>
                    </>
                  )}
                  {isLive && m.liveStatusOverride && (
                    <span className="text-[10px] text-text-secondary">{m.liveStatusOverride}</span>
                  )}
                </div>
              </div>

              {/* Venue line */}
              <div className="text-[10px] text-text-dim truncate">
                {m.venue.name}{m.venue.city ? `, ${m.venue.city}` : ""}
              </div>
            </div>
          );
        })}
        {allMatches.length === 0 && (
          <p className="text-center text-text-dim text-sm py-8">No matches found for this series.</p>
        )}
      </div>
    </BottomSheet>
  );
}

export default function LiveCarousel({ matches, nextMatch }: LiveCarouselProps) {
  const [view, setView] = useState<"none" | "standings" | "team-schedule" | "series">("none");

  // seriesPool: all matches the series-schedule sheet can filter from.
  // `matches` (live) comes from props — already real-data-ready.
  // ALL_PAST_MATCHES / ALL_UPCOMING_MATCHES are the only remaining mock
  // imports; swap them for your API hook results when real data is live.
  // The component itself (SeriesScheduleSheet) is fully data-source agnostic.
  const seriesPool = useMemo(
    () => [...ALL_PAST_MATCHES, ...matches, ...ALL_UPCOMING_MATCHES],
    [matches]
  );
  const [openTeamCode, setOpenTeamCode] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mouse click-drag scroll -- native overflow-x already scrolls via touch
  // swipe and trackpad/wheel, but a plain mouse click-drag does nothing on
  // a bare overflow div (no built-in click-to-pan in CSS/HTML). Without
  // this, a desktop mouse user can only ever see the first live match.
  // Reuses scrollRef directly so the existing scroll listener above (which
  // derives activeIdx) stays in sync automatically. Guards click-through:
  // a real drag (>6px movement) swallows the click that would otherwise
  // navigate the card on mouseup.
  const dragState = useRef({ down: false, startX: 0, startScroll: 0, moved: 0 });
  const onDragMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragState.current = { down: true, startX: e.clientX, startScroll: scrollRef.current.scrollLeft, moved: 0 };
  };
  const onDragMouseMove = (e: React.MouseEvent) => {
    const s = dragState.current;
    if (!s.down || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.clientX - s.startX;
    s.moved = Math.max(s.moved, Math.abs(dx));
    scrollRef.current.scrollLeft = s.startScroll - dx;
  };
  const endDrag = () => { dragState.current.down = false; };
  const onDragClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
    dragState.current.moved = 0;
  };

  // Shared with the "for you" and Spotlight carousels -- see
  // lib/useCarouselIndex.ts. Replaces this component's own former inline
  // scroll-position effect.
  const activeIdx = useCarouselIndex(scrollRef, matches.length);

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
        <div
          ref={scrollRef}
          onMouseDown={onDragMouseDown}
          onMouseMove={onDragMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onClickCapture={onDragClickCapture}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 px-3 cursor-grab active:cursor-grabbing select-none"
        >
          {matches.map(m => (
            <div key={m.id} className="shrink-0 snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
              <LiveMatchCard match={m} />
            </div>
          ))}
        </div>

        {/* Contained position indicator -- v1.0.65. Only rendered with
            2+ matches (CarouselDots itself no-ops below that), replacing
            the old full-width native scrollbar. */}
        <div className="mt-2">
          <CarouselDots count={matches.length} activeIndex={activeIdx} activeColor="#00E5FF" />
        </div>

        {(activeComp || activeMatch?.seriesStatus) && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* League / WTC table button — only when standings exist */}
            {activeComp && (
              <button
                onClick={() => setView("standings")}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-line text-[11px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors tap-scale shrink-0"
                style={{ width: TABLE_PILL_WIDTH }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0">
                  <rect x="0.5" y="0.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="0.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="0.5" y="7" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                  <rect x="7" y="7" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                <span className="whitespace-nowrap">{activeComp.shortName} Table</span>
              </button>
            )}
            {/* Series status chip — clickable, opens full series schedule */}
            {activeMatch?.seriesStatus && (
              <button
                onClick={() => setView("series")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-line text-[11px] font-bold text-text-secondary hover:text-text-primary hover:border-cyan/40 transition-colors tap-scale leading-none min-w-0"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="shrink-0">
                  <line x1="4" y1="13" x2="4" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="8" y1="13" x2="8" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="12" y1="13" x2="12" y2="8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M5.5 8 C5.5 5 10.5 5 10.5 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                </svg>
                <span className="truncate">{activeMatch.seriesStatus}</span>
                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" className="text-cyan opacity-60 shrink-0">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
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

      {/* Series schedule sheet */}
      {view === "series" && activeMatch && (
        <SeriesScheduleSheet match={activeMatch} seriesPool={seriesPool} onClose={closeAll} />
      )}
    </>
  );
}
