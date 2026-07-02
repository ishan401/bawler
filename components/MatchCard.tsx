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

// Map team code → flagcdn.com ISO 2-letter code
const FLAG_ISO: Record<string, string> = {
  IND: "in", AUS: "au", ENG: "gb-eng", PAK: "pk", SA: "za",
  NZ: "nz", BAN: "bd", SL: "lk", AFG: "af", WI: "tt",
  IRE: "ie", ZIM: "zw", SCO: "gb-sct", NED: "nl", USA: "us",
  UAE: "ae", NAM: "na", PNG: "pg", OMA: "om", CAN: "ca",
};

function FlagOrRank({ team }: { team: Team }) {
  // National teams → show country flag image (works on all OS including Windows)
  if (team.type === "national") {
    const iso = FLAG_ISO[team.code];
    if (iso) {
      return (
        <img
          src={`https://flagcdn.com/w40/${iso}.png`}
          width={24}
          height={18}
          alt={team.shortName}
          className="rounded-[2px] shrink-0 shadow-sm"
          style={{ objectFit: "cover" }}
        />
      );
    }
  }
  if (!team.currentRanking) return null;
  return (
    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/40 border border-white/20 num leading-none">
      #{team.currentRanking}
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

function CompetitionBadge({ match }: { match: Match }) {
  const c = match.competition;
  const fmtLabel = match.format === "Test" ? "Test" : match.format === "ODI" ? "ODI" : null;
  return (
    <div className="flex items-center gap-1">
      {fmtLabel && (
        <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none"
          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
          {fmtLabel}
        </span>
      )}
      <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none truncate max-w-[70px]"
        style={{ background: c.logoColor ? `${c.logoColor}33` : "rgba(255,255,255,0.10)", color: c.logoColor ?? "rgba(255,255,255,0.65)", border: `1px solid ${c.logoColor ?? "rgba(255,255,255,0.12)"}44` }}>
        {c.shortName}
      </span>
    </div>
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
  const { teamA, teamB, innings } = match;

  // Look up innings by battingTeam code — NOT by position.
  // Position-based (innings[0] → teamA) breaks whenever the visiting team bats first.
  const innA = innings.filter(i => i.battingTeam === teamA.code);
  const innB = innings.filter(i => i.battingTeam === teamB.code);
  const lastInnA = innA[innA.length - 1]; // most recent innings for teamA
  const lastInnB = innB[innB.length - 1]; // most recent innings for teamB
  // For Tests: show prior innings score when team is in their 2nd+ innings
  const isTest   = match.format === "Test";
  const prevInnA = isTest && innA.length >= 2 ? innA[innA.length - 2] : undefined;
  const prevInnB = isTest && innB.length >= 2 ? innB[innB.length - 2] : undefined;

  // Current batting team = last innings in array
  const currentBatter = innings[innings.length - 1]?.battingTeam;
  const teamABatting  = currentBatter === teamA.code;
  const teamBBatting  = currentBatter === teamB.code;

  const status = liveStatusOf(match);
  const wp     = liveWinProb(match);

  return (
    <Link
      href={`/match/${match.id}`}
      className="tap-scale relative block rounded-2xl overflow-hidden snap-center shrink-0 w-full"
      style={{ height: LIVE_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="full" />

      <div className="relative h-full px-2.5 py-2 flex flex-col text-white">
        {/* Row 1 — Live badge (left) + competition badge + venue (right) */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-wicket flex items-center gap-1.5 leading-none">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-wicket inline-block" />
            Live
          </span>
          <div className="flex items-center gap-1.5">
            <CompetitionBadge match={match} />
            <span className="text-[9px] text-white/60 num truncate leading-none hidden sm:inline">{match.venue.city}</span>
          </div>
        </div>

        {/* Row 2 — teams; innings attributed by battingTeam, not position */}
        <div className="flex items-center justify-between gap-3 mt-1">
          <LiveSide team={teamA} runs={lastInnA?.runs} wickets={lastInnA?.wickets} overs={lastInnA?.overs} batting={teamABatting} status={teamABatting ? status : undefined} prevRuns={prevInnA?.runs} prevWickets={prevInnA?.wickets} />
          <span className="text-lg font-extrabold text-white/30 shrink-0">vs</span>
          <LiveSide team={teamB} runs={lastInnB?.runs} wickets={lastInnB?.wickets} overs={lastInnB?.overs} batting={teamBBatting} alignRight status={teamBBatting ? status : undefined} prevRuns={prevInnB?.runs} prevWickets={prevInnB?.wickets} />
        </div>

        {/* Row 4 — prominent win-prob split bar (highlighted) */}
        {wp && <WinProbBar teamA={match.teamA} teamB={match.teamB} pctA={wp.pctA} />}
      </div>
    </Link>
  );
}

function LiveSide({ team, runs, wickets, overs, batting, alignRight, status, prevRuns, prevWickets }: { team: Team; runs?: number; wickets?: number; overs?: number; batting?: boolean; alignRight?: boolean; status?: string; prevRuns?: number; prevWickets?: number }) {
  return (
    <div className={`flex flex-col min-w-0 ${alignRight ? "items-end" : "items-start"}`}>
      <div className={`flex items-center gap-1.5 ${alignRight ? "flex-row-reverse" : ""}`}>
        <FlagOrRank team={team} />
        <div className={`flex flex-col min-w-0 ${alignRight ? "items-end" : "items-start"}`}>
          <span className="text-lg font-extrabold drop-shadow leading-none">{team.shortName}</span>
          {runs !== undefined && (
            <span className={`text-[11px] num font-bold ${batting ? "text-cyan" : "text-white/85"} leading-tight`}>
              {prevRuns !== undefined && (
                <span className="text-white/40 text-[9px] font-medium mr-1">{prevRuns}/{prevWickets} &amp;</span>
              )}
              {runs}<span className="text-white/55">/{wickets}</span>
              {overs !== undefined && <span className="text-white/55 text-[9px] font-medium"> ({overs})</span>}
            </span>
          )}
        </div>
      </div>
      {batting && status && (
        <p className="text-[9px] text-cyan font-bold mt-0.5 leading-tight">{status}</p>
      )}
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

  const { innings, teamA, teamB } = match;
  // Find innings by battingTeam — never assume position equals team order
  const currentInn  = innings[innings.length - 1];
  const prevInn     = innings.length >= 2 ? innings[innings.length - 2] : null;
  if (!currentInn) return "Toss imminent";

  const battingTeam   = currentInn.battingTeam === teamA.code ? teamA : teamB;
  const fieldingTeam  = currentInn.battingTeam === teamA.code ? teamB : teamA;

  if (prevInn) {
    // 2nd innings — chasing
    const target      = prevInn.runs + 1;
    const runs        = currentInn.balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const ballsBowled = currentInn.balls.length;
    const ballsLeft   = 120 - ballsBowled;
    const need        = target - runs;
    if (need <= 0)    return `${battingTeam.shortName} won the chase`;
    if (ballsLeft <= 0) return `${fieldingTeam.shortName} defended ${target - 1}`;
    return `${battingTeam.shortName} need ${need} off ${ballsLeft} balls`;
  }

  // 1st innings
  if (currentInn.balls.length > 0) {
    const runs        = currentInn.balls.reduce((s, b) => s + b.runs + b.extras, 0);
    const ballsBowled = currentInn.balls.length;
    const projected   = Math.round((runs / ballsBowled) * 120);
    return `${battingTeam.shortName} on pace for ${projected}`;
  }
  return "Toss imminent";
}

function liveWinProb(match: Match): { pctA: number } | null {
  if (match.liveWinProbOverride) {
    const pct = match.liveWinProbOverride.pct;
    const isTeamA = match.liveWinProbOverride.teamCode === match.teamA.code;
    // pct is stored 0-100; WinProbBar expects 0-1
    return { pctA: isTeamA ? pct / 100 : (100 - pct) / 100 };
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
      className={`tap-scale relative block rounded-xl overflow-hidden ${highlight ? "excitement-glow" : "border border-line"}`}
      style={{ height: PAST_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="wide" />

      <div className="relative h-full px-2 py-1.5 flex flex-col text-white gap-0.5">
        {/* Row 1: date (left) + competition badge + highlight badge (right) */}
        <div className="flex items-center justify-between gap-2 min-h-[13px]">
          <span className="text-[9.5px] num text-white/75 leading-none">{fmtDate(match.startTimeIso)}</span>
          <div className="flex items-center gap-1 shrink-0">
            <CompetitionBadge match={match} />
            <HighlightBadge text={match.highlightBadge} />
          </div>
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
      <FlagOrRank team={team} />
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
      className={`tap-scale relative block rounded-xl overflow-hidden ${highlight ? "excitement-glow" : "border border-line"}`}
      style={{ height: FUTURE_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="narrow" />

      <div className="relative h-full px-2 py-1.5 flex flex-col text-white gap-0.5">
        {/* Row 1: date (left) + competition badge + highlight badge (right) */}
        <div className="flex items-center justify-between gap-1 min-h-[13px]">
          <span className="text-[9px] num text-white/65 leading-none truncate">
            {fmtDate(match.startTimeIso).replace(",", "")}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <CompetitionBadge match={match} />
            <HighlightBadge text={match.highlightBadge} />
          </div>
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
                 </p>
        )}

        {/* Row 4: bottom anchor — countdown + time + venue */}
        <div
          className="mt-auto rounded-md px-1.5 py-1 flex items-center justify-between gap-1"
          style={{ background: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(255,255,255,0.10)" }}
        >
          {/* Clock countdown */}
          <div className="flex items-center gap-1">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/50 shrink-0">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 1.5" />
            </svg>
            <span className="text-[9px] font-extrabold text-cyan num leading-none">
              {fmtCountdown(match.startTimeIso)}
            </span>
          </div>
          {/* Time + venue */}
          <span className="text-[8.5px] text-white/50 num truncate leading-none">
            {fmtTime(match.startTimeIso)} · {match.venue.city}
          </span>
        </div>
      </div>
    </Link>
  );
}
