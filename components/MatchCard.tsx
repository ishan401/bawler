"use client";

import React from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import SplitTeamBg from "./SplitTeamBg";
import { calculateWinProbForMatch } from "@/lib/winProb";

// ============================================================================
// Fixed card heights — past + future identical so rows align perfectly
// ============================================================================
export const PAST_CARD_HEIGHT = 148;
export const FUTURE_CARD_HEIGHT = 148;
export const LIVE_CARD_HEIGHT = 148;

// ============================================================================
// Helpers
// ============================================================================

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
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

function RankPill({ rank }: { rank?: number }) {
  if (!rank) return null;
  return (
    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/40 border border-white/20 num leading-none">
      #{rank}
    </span>
  );
}

function HighlightBadge({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="shrink-0 text-[8.5px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan text-bg leading-none">
      {text}
    </span>
  );
}

/**
 * Small "Schedule" + "Table" buttons that sit inside a match card.
 * Each button stops the parent Link's navigation and routes elsewhere instead.
 */
function CardSecondaryNav() {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.assign("/schedule");
        }}
        className="text-[8.5px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white leading-none transition"
      >
        Schedule
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.assign("/table");
        }}
        className="text-[8.5px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white leading-none transition"
      >
        Table
      </button>
    </div>
  );
}

// 2-line clamp WITH ellipsis (past)
const clamp2: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
};
// 3 lines, NO ellipsis (future — Sarthak v0.7 — just clip)
const lines3NoEllipsis: React.CSSProperties = {
  overflow: "hidden",
  maxHeight: "3.6em",
  lineHeight: "1.2em",
};

// ============================================================================
// Live card — full width, prominent split win-prob bar
// ============================================================================
export function LiveMatchCard({ match }: { match: Match }) {
  const i1 = match.innings[0];
  const i2 = match.innings[1];
  const status = liveStatusOf(match);
  const wp = liveWinProb(match);

  return (
    <Link
      href={`/match/${match.id}`}
      className="relative block rounded-2xl overflow-hidden snap-center shrink-0 w-full"
      style={{ height: LIVE_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="full" />

      <div className="relative h-full px-2.5 py-2 flex flex-col text-white">
        {/* Row 1 — date+live badge (left) and venue (right) — consistent with cards */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-wicket flex items-center gap-1.5 leading-none">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-wicket inline-block" />
            Live
          </span>
          <span className="text-[9px] text-white/70 num truncate leading-none">{match.venue.name} ({match.venue.city})</span>
        </div>

        {/* Row 2 — teams with rank pills on OUTSIDE (consistent w/ past + future) */}
        <div className="flex items-center justify-between gap-3 mt-1">
          <LiveSide team={match.teamA} runs={i1?.runs} wickets={i1?.wickets} overs={i1?.overs} batting={!i2} />
          <span className="text-lg font-extrabold text-white/30">vs</span>
          <LiveSide team={match.teamB} runs={i2?.runs} wickets={i2?.wickets} overs={i2?.overs} batting={!!i2} alignRight />
        </div>

        {/* Row 3 — status one-liner */}
        <p className="text-[10.5px] text-white/95 leading-tight mt-1 truncate">{status}</p>

        {/* Row 4 — prominent win-prob split bar (highlighted) */}
        {wp && <WinProbBar teamA={match.teamA} teamB={match.teamB} pctA={wp.pctA} />}
      </div>
    </Link>
  );
}

function LiveSide({ team, runs, wickets, overs, batting, alignRight }: { team: Team; runs?: number; wickets?: number; overs?: number; batting?: boolean; alignRight?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${alignRight ? "flex-row-reverse" : ""}`}>
      <RankPill rank={team.currentRanking} />
      <div className={`flex flex-col min-w-0 ${alignRight ? "items-end" : "items-start"}`}>
        <span className="text-lg font-extrabold drop-shadow leading-none">{team.shortName}</span>
        {runs !== undefined && (
          <span className={`text-[11px] num font-bold ${batting ? "text-cyan" : "text-white/85"} leading-tight`}>
            {runs}<span className="text-white/55">/{wickets}</span>
            {overs !== undefined && <span className="text-white/55 text-[9px] font-medium"> ({overs})</span>}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Prominent two-color win-prob bar — Sarthak v0.7 #4.
 * Bar width split proportionally; team code + % rendered inside each side.
 */
function WinProbBar({ teamA, teamB, pctA }: { teamA: Team; teamB: Team; pctA: number }) {
  const a = Math.max(0.08, Math.min(0.92, pctA)); // floor each side so labels stay readable
  const pctApct = Math.round(pctA * 100);
  const pctBpct = 100 - pctApct;
  return (
    <div className="mt-auto rounded-md overflow-hidden border border-white/20 flex h-6">
      <div
        className="flex items-center justify-start pl-2"
        style={{ width: `${a * 100}%`, background: teamA.primaryColor }}
      >
        <span className="text-[10px] font-extrabold text-white drop-shadow num">{teamA.shortName} {pctApct}%</span>
      </div>
      <div
        className="flex items-center justify-end pr-2"
        style={{ width: `${(1 - a) * 100}%`, background: teamB.primaryColor }}
      >
        <span className="text-[10px] font-extrabold text-white drop-shadow num">{pctBpct}% {teamB.shortName}</span>
      </div>
    </div>
  );
}

function liveStatusOf(match: Match): string {
  if (match.liveStatusOverride) return match.liveStatusOverride;
  const i1 = match.innings[0];
  const i2 = match.innings[1];
  const target = i1 && i2 ? i1.runs + 1 : null;
  if (i2 && target) {
    const runs = i2.balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const ballsBowled = i2.balls.length;
    const ballsLeft = 120 - ballsBowled;
    const need = target - runs;
    if (need <= 0) return `${match.teamB.shortName} won the chase`;
    if (ballsLeft <= 0) return `${match.teamA.shortName} defended ${target - 1}`;
    return `${match.teamB.shortName} need ${need} off ${ballsLeft} balls`;
  }
  if (i1 && i1.balls.length > 0 && !i2) {
    const runs = i1.balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const ballsBowled = i1.balls.length;
    const projected = ballsBowled > 0 ? Math.round((runs / ballsBowled) * 120) : 0;
    return `${match.teamA.shortName} on pace for ${projected}`;
  }
  return "Toss imminent";
}

function liveWinProb(match: Match): { pctA: number } | null {
  if (match.liveWinProbOverride) {
    const pct = match.liveWinProbOverride.pct;
    const isTeamA = match.liveWinProbOverride.teamCode === match.teamA.code;
    return { pctA: isTeamA ? pct : 1 - pct };
  }
  if (match.innings.length === 0 || match.innings[0].balls.length === 0) return null;
  const wp = calculateWinProbForMatch(match);
  const last = wp[wp.length - 1];
  if (!last) return null;
  return { pctA: last.winProbTeamA };
}

// ============================================================================
// Past card — Sarthak v0.7: consistent layout w/ future
// ============================================================================
export function PastMatchCard({ match }: { match: Match }) {
  const winnerCode = match.result?.winner;
  const winnerTeam = winnerCode === match.teamA.code ? match.teamA : match.teamB;
  const highlight = (match.excitement ?? 0) >= 8;

  return (
    <Link
      href={`/match/${match.id}`}
      className={`relative block rounded-xl overflow-hidden ${highlight ? "excitement-glow" : "border border-line"}`}
      style={{ height: PAST_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="wide" />

      <div className="relative h-full px-2 py-1.5 flex flex-col text-white gap-0.5">
        {/* Row 1: date (left) + badge (right) — CONSISTENT with future */}
        <div className="flex items-center justify-between gap-2 min-h-[13px]">
          <span className="text-[9.5px] num text-white/75 leading-none">{fmtDate(match.startTimeIso)}</span>
          <HighlightBadge text={match.highlightBadge} />
        </div>

        {/* Row 2: teams with rank pills on OUTSIDE — CONSISTENT */}
        <div className="flex items-center justify-between gap-2">
          <SideBlock team={match.teamA} runs={match.result?.teamARuns} wickets={match.result?.teamAWickets} isWinner={winnerCode === match.teamA.code} />
          <span className="text-sm font-extrabold text-white/35">vs</span>
          <SideBlock team={match.teamB} runs={match.result?.teamBRuns} wickets={match.result?.teamBWickets} isWinner={winnerCode === match.teamB.code} alignRight />
        </div>

        {/* Row 3: RESULT BANNER */}
        {match.result && (
          <div
            className="text-center text-[10px] font-extrabold uppercase tracking-widest rounded-md py-0.5 leading-tight"
            style={{ background: `${winnerTeam.primaryColor}d9`, color: "#FFFFFF" }}
          >
            {winnerCode} won {match.result.margin}
          </div>
        )}

        {/* Row 4: venue */}
        <div className="text-[9.5px] text-white/65 truncate leading-tight">
          {match.venue.name} ({match.venue.city})
        </div>

        {/* Row 5: summary (2-line clamp) — NO mt-auto so no gap above */}
        {match.summary && (
          <p className="text-[10.5px] leading-snug text-white/90" style={clamp2}>
            {match.summary}
          </p>
        )}
      </div>
    </Link>
  );
}

function SideBlock({ team, runs, wickets, isWinner, alignRight }: { team: Team; runs?: number; wickets?: number; isWinner?: boolean; alignRight?: boolean }) {
  // Rank pill on OUTSIDE — same pattern as future cards
  return (
    <div className={`flex items-center gap-1 min-w-0 ${alignRight ? "flex-row-reverse" : ""}`}>
      <RankPill rank={team.currentRanking} />
      <div className={`flex flex-col min-w-0 ${alignRight ? "items-end" : "items-start"}`}>
        <span className={`text-[13px] font-extrabold drop-shadow leading-none ${isWinner ? "text-white" : "text-white/65"}`}>
          {team.shortName}
        </span>
        {runs !== undefined && (
          <span className={`text-[10.5px] num font-bold ${isWinner ? "text-white" : "text-white/60"} leading-tight`}>
            {runs}/{wickets}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Future card — balanced height, countdown timer + venue anchor at bottom
// ============================================================================
export function FutureMatchCard({ match }: { match: Match }) {
  const highlight = (match.excitement ?? 0) >= 8;
  return (
    <Link
      href={`/match/${match.id}`}
      className={`relative block rounded-xl overflow-hidden ${highlight ? "excitement-glow" : "border border-line"}`}
      style={{ height: FUTURE_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="narrow" />

      <div className="relative h-full px-2 py-1.5 flex flex-col text-white gap-0.5">
        {/* Row 1: badge (right) */}
        <div className="flex items-center justify-between gap-1 min-h-[13px]">
          <span className="text-[9px] num text-white/65 leading-none truncate">
            {fmtDate(match.startTimeIso).replace(",", "")}
          </span>
          <HighlightBadge text={match.highlightBadge} />
        </div>

        {/* Row 2: teams with rank pills */}
        <div className="flex items-center justify-between gap-1">
          <SideBlock team={match.teamA} isWinner />
          <span className="text-[10px] font-extrabold text-white/40">vs</span>
          <SideBlock team={match.teamB} isWinner alignRight />
        </div>

        {/* Row 3: summary (2-line clamp) */}
        {match.summary && (
          <p className="text-[9.5px] leading-snug text-white/80 flex-1" style={clamp2}>
            {match.summary}
       