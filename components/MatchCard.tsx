"use client";

import React from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import SplitTeamBg from "./SplitTeamBg";
import { calculateWinProbForMatch, calculateProjectedScore } from "@/lib/winProb";
import { ballsPerSet, formatScore } from "@/lib/formatUtils";

// ============================================================================
// Fixed card heights
// ============================================================================
// LIVE — hero card, unchanged footprint except taller to fit the win-prob
// sparkline (was a flat 24px bar, now a two-line chart + dot legend).
export const LIVE_CARD_HEIGHT = 168;
// QUIET — ordinary past/upcoming match card (v1.0.49 restraint pass): flat,
// compact, no gradient/crest/badge. Height is intentionally small since the
// content is now just team names + one line.
export const QUIET_CARD_HEIGHT = 60;
// SPOTLIGHT — the old "full treatment" (gradient bg, crest watermark, glow,
// highlight badge), now reserved for matches clearing the concrete spotlight
// bar (lib/spotlight.ts — NOT the excitement score) and rendered full-width
// above the quiet grid instead of inline in it.
export const SPOTLIGHT_CARD_HEIGHT = 148;

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

/**
 * "For you" marker — a small star pill reserved for the spotlight card that
 * ALSO happens to be the user's followed-team match. Deliberately positioned
 * top-LEFT (HighlightBadge lives top-right) so the two badges never stack.
 */
function ForYouMarker() {
  return (
    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-cyan text-bg text-[8.5px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-full leading-none shadow-md">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z" />
      </svg>
      For you
    </div>
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

// ============================================================================
// Live card — full width, prominent win-prob sparkline
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

  const wp = liveWinProb(match);

  // CRR — computed from batting team's current innings overs + runs
  const currentInn = innings[innings.length - 1];
  const battingInn = teamABatting ? lastInnA : lastInnB;
  const liveCRR = (() => {
    if (!battingInn || !battingInn.overs || battingInn.overs === 0) return null;
    const bps = ballsPerSet(match.format);
    const fullOv = Math.floor(battingInn.overs);
    const ballsInOv = Math.round((battingInn.overs % 1) * 10);
    const actualOvers = fullOv + ballsInOv / bps;
    if (actualOvers === 0) return null;
    return (battingInn.runs / actualOvers).toFixed(2);
  })();

  // Projected score — 1st innings only, non-Test
  const isFirstInn = innings.length === 1 && !isTest && match.status === "live";
  const projected  = isFirstInn ? calculateProjectedScore(match) : null;

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
          <LiveSide team={teamA} runs={lastInnA?.runs} wickets={lastInnA?.wickets} overs={lastInnA?.overs} batting={teamABatting} crr={teamABatting && liveCRR ? liveCRR : undefined} proj={teamABatting && projected ? projected.runs : undefined} prevRuns={prevInnA?.runs} prevWickets={prevInnA?.wickets} />
          <span className="text-lg font-extrabold text-white/30 shrink-0">vs</span>
          <LiveSide team={teamB} runs={lastInnB?.runs} wickets={lastInnB?.wickets} overs={lastInnB?.overs} batting={teamBBatting} alignRight crr={teamBBatting && liveCRR ? liveCRR : undefined} proj={teamBBatting && projected ? projected.runs : undefined} prevRuns={prevInnB?.runs} prevWickets={prevInnB?.wickets} />
        </div>

        {/* Row 4 — live win-prob sparkline (falls back to the split bar when
            there's no ball-by-ball history to draw a trend from) */}
        {wp && <LiveWinProbSpark match={match} teamA={match.teamA} teamB={match.teamB} fallbackPctA={wp.pctA} />}
      </div>
    </Link>
  );
}

function LiveSide({ team, runs, wickets, overs, batting, alignRight, crr, proj, prevRuns, prevWickets }: { team: Team; runs?: number; wickets?: number; overs?: number; batting?: boolean; alignRight?: boolean; crr?: string; proj?: number; prevRuns?: number; prevWickets?: number }) {
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
          {crr && (
            <p className="text-[9px] text-cyan font-bold mt-0.5 leading-tight num">
              CRR {crr}{proj !== undefined && <span className="text-white/50 font-normal ml-2">Proj <span className="text-white font-bold">~{proj}</span></span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Prominent two-color win-prob bar — Sarthak v0.7 #4.
 * Bar width split proportionally; team code + % rendered inside each side.
 * Kept as a fallback for the handful of live mock matches that ship a
 * liveWinProbOverride but no ball-by-ball history (nothing to draw a trend
 * line from) — see LiveWinProbSpark below.
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

/**
 * Live win-prob sparkline — homepage hero card (v1.0.49, fixed v1.0.50,
 * de-tangled v1.0.51).
 * Two mirrored lines (one per team, team's own primaryColor — same
 * two-team-color convention as WinProbChart/MiniWinProb), each ending in a
 * small dot at the team's current %. Pulls from calculateWinProbForMatch —
 * the SAME source WinProbChart's full-screen modal uses — across the WHOLE
 * match so real swings survive at the tiny inline size. (v1.0.49 originally
 * sliced only the last ~20 raw balls, which reads as a flat line whenever
 * the recent few overs happen to be stable even in a match that swung
 * wildly earlier — fixed in v1.0.50 to pull from the full trend instead.)
 *
 * v1.0.51: that full trend is still ball-by-ball resolution, which at
 * ~300px wide made every minor mid-over fluctuation show up as the two
 * lines crossing back and forth — a tangle, not a trend shape. Fixed by
 * bucketing to ONE point per over (end-of-over value) before plotting, then
 * smoothing with a catmull-rom curve — same technique, deliberately
 * NOT applied to WinProbChart.tsx, which keeps full ball-by-ball detail on
 * purpose for its own (actively-studied, not glanced-at) context.
 *
 * Deliberately has no 50% gridline, unlike WinProbChart — see inline comment
 * at the line's render site.
 *
 * The line is cosmetic/approximate; the end-dot position always uses
 * `fallbackPctA` (the same value the old static bar showed), which already
 * accounts for liveWinProbOverride — so the dot is never wrong even when the
 * drawn trend is a rough approximation.
 */
function LiveWinProbSpark({ match, teamA, teamB, fallbackPctA }: { match: Match; teamA: Team; teamB: Team; fallbackPctA: number }) {
  const allPoints = calculateWinProbForMatch(match);

  // No ball-by-ball history to plot (a couple of mock matches ship only a
  // fixed override %, no balls[]) — fall back to the static split bar.
  if (allPoints.length === 0) {
    return <WinProbBar teamA={teamA} teamB={teamB} pctA={fallbackPctA} />;
  }

  // One point per OVER (the end-of-over value), not per ball. The full-screen
  // WinProbChart intentionally keeps every ball — that's the point of that
  // view. But at ~300px wide, plotting the same ball-by-ball density here
  // just shows every minor mid-over fluctuation as a visible crossing
  // between the two mirrored lines, so it reads as a tangled knot instead of
  // a trend shape. Bucketing to one value per over removes that ball-to-ball
  // noise by construction (confirmed: this consistently produces zero
  // A/B-line crossings on today's mock matches, vs. a same-size stride
  // sample of the raw per-ball series that still crosses 1-2 times).
  const perOverMap = new Map<number, (typeof allPoints)[number]>();
  for (const p of allPoints) {
    const over = Math.floor(p.overFloat);
    perOverMap.set(over, p); // later ball in the same over overwrites — end-of-over value
  }
  let pts = [...perOverMap.values()];

  // Still downsample further if that leaves too many points for the tiny
  // size (Tests can rack up 50+ over-buckets across 4 innings).
  const DOWNSAMPLE_TARGET = 30;
  if (pts.length > DOWNSAMPLE_TARGET) {
    const step = Math.max(1, Math.floor(pts.length / DOWNSAMPLE_TARGET));
    const sampled: typeof pts = [];
    for (let i = 0; i < pts.length; i += step) sampled.push(pts[i]);
    if (sampled[sampled.length - 1] !== pts[pts.length - 1]) sampled.push(pts[pts.length - 1]);
    pts = sampled;
  }
  // Snap the last plotted point to the authoritative current % so the dot
  // never floats off the end of the line.
  pts = pts.map((p, i) => (i === pts.length - 1 ? { ...p, winProbTeamA: fallbackPctA } : p));

  const W = 300, H = 30;
  const PAD_X = 3, PAD_Y = 5;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;
  const xMin = pts[0].overFloat;
  const xMax = pts[pts.length - 1].overFloat;
  const span = Math.max(0.5, xMax - xMin);
  const xOf = (x: number) => PAD_X + ((x - xMin) / span) * innerW;
  const yOf = (p: number) => PAD_Y + (1 - p) * innerH;

  const colA = teamA.primaryColor;
  const colB = teamB.primaryColor;

  const lineA = sparkCatmullRomPath(pts.map(p => ({ x: xOf(p.overFloat), y: yOf(p.winProbTeamA) })));
  const lineB = sparkCatmullRomPath(pts.map(p => ({ x: xOf(p.overFloat), y: yOf(1 - p.winProbTeamA) })));

  const xEnd  = xOf(xMax);
  const dotAY = yOf(fallbackPctA);
  const dotBY = yOf(1 - fallbackPctA);
  const pctA  = Math.round(fallbackPctA * 100);
  const pctB  = 100 - pctA;

  return (
    <div className="mt-auto rounded-md border border-white/15 bg-black/25 px-1.5 pt-1 pb-0.5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="none" style={{ height: 26 }}>
        {/* No 50% reference gridline here on purpose — unlike the full-screen
            WinProbChart modal, this teaser already prints both percentages
            as text right below the chart, so the line is redundant clutter
            at this size. Leave WinProbChart.tsx's own gridline untouched. */}
        <path d={lineA} stroke={colA} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d={lineB} stroke={colB} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {/* End-of-line current-% dots */}
        <circle cx={xEnd} cy={dotAY} r="4.5" fill={colA} opacity="0.3" />
        <circle cx={xEnd} cy={dotAY} r="2.6" fill={colA} stroke="#0A0E1A" strokeWidth="1" />
        <circle cx={xEnd} cy={dotBY} r="4.5" fill={colB} opacity="0.3" />
        <circle cx={xEnd} cy={dotBY} r="2.6" fill={colB} stroke="#0A0E1A" strokeWidth="1" />
      </svg>
      <div className="flex items-center justify-between mt-0.5 px-0.5">
        <span className="text-[9px] font-extrabold num drop-shadow" style={{ color: colA }}>{teamA.shortName} {pctA}%</span>
        <span className="text-[9px] font-extrabold num drop-shadow" style={{ color: colB }}>{pctB}% {teamB.shortName}</span>
      </div>
    </div>
  );
}

/**
 * Light catmull-rom smoothing for the homepage sparkline only — same
 * technique as WinProbChart's own catmullRomPath, kept as a separate local
 * copy since that one isn't exported and this is a different (much smaller,
 * over-bucketed) point set.
 */
function sparkCatmullRomPath(pts: { x: number; y: number }[], alpha = 3): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / (alpha * 2);
    const cp1y = p1.y + (p2.y - p0.y) / (alpha * 2);
    const cp2x = p2.x - (p3.x - p1.x) / (alpha * 2);
    const cp2y = p2.y - (p3.y - p1.y) / (alpha * 2);
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/** Total legal deliveries per side for a format. */
function totalBallsForFormat(match: Match): number {
  if (match.format === "ODI") return 300;
  if (match.format === "Test") return 450;
  if (match.format === "Hundred") return 100;
  return 120; // T20 / T20I
}

function liveStatusOf(match: Match): string {
  if (match.liveStatusOverride) return match.liveStatusOverride;

  const { innings, teamA, teamB, format } = match;
  // Find innings by battingTeam — never assume position equals team order
  const currentInn = innings[innings.length - 1];
  const prevInn    = innings.length >= 2 ? innings[innings.length - 2] : null;
  if (!currentInn) return "Toss imminent";

  const battingTeam  = currentInn.battingTeam === teamA.code ? teamA : teamB;
  const fieldingTeam = currentInn.battingTeam === teamA.code ? teamB : teamA;
  const totalBalls   = totalBallsForFormat(match);

  // Test matches: just show current score, no target/projection logic
  if (format === "Test") {
    if (currentInn.runs !== undefined) {
      return `${battingTeam.shortName} ${currentInn.runs}/${currentInn.wickets} (${currentInn.overs} ov)`;
    }
    return "Match in progress";
  }

  if (prevInn) {
    // Limited-overs 2nd innings — chasing
    const target = prevInn.runs + 1;
    // Use innings.runs as primary source (always populated from scorecard API).
    // balls[] may be empty if we don't have ball-by-ball data yet.
    const runs     = currentInn.runs;
    const ballsBowled = Math.round(currentInn.overs * 6);
    const ballsLeft   = Math.max(0, totalBalls - ballsBowled);
    const need        = target - runs;
    if (need <= 0)      return `${battingTeam.shortName} won`;
    if (ballsLeft <= 0) return `${fieldingTeam.shortName} defended ${target - 1}`;
    return `${battingTeam.shortName} need ${need} off ${ballsLeft} balls`;
  }

  // 1st innings projection — use overs bowled from innings.overs (reliable)
  const ballsBowled = Math.round(currentInn.overs * 6);
  if (ballsBowled > 0) {
    const projected = Math.round((currentInn.runs / ballsBowled) * totalBalls);
    return `${battingTeam.shortName} on pace for ${projected}`;
  }
  return "Toss imminent";
}

function liveWinProb(match: Match): { pctA: number } | null {
  if (match.liveWinProbOverride) {
    let pct = match.liveWinProbOverride.pct;
    // pct MUST be 0-1. Auto-normalize if someone accidentally passes 0-100.
    if (pct > 1) pct = pct / 100;
    pct = Math.max(0, Math.min(1, pct)); // hard clamp — can never escape valid range
    const isTeamA = match.liveWinProbOverride.teamCode === match.teamA.code;
    return { pctA: isTeamA ? pct : 1 - pct };
  }
  if (match.innings.length === 0 || match.innings[0].balls.length === 0) return null;
  const wp = calculateWinProbForMatch(match);
  const last = wp[wp.length - 1];
  if (!last) return null;
  // calculateWinProbForMatch already clamps to [0,1] via clamp01()
  return { pctA: Math.max(0, Math.min(1, last.winProbTeamA)) };
}

// ============================================================================
// Quiet side block — shared by both quiet card types. Undefined `isWinner`
// means "no result yet" (future match) and stays full-brightness, not dimmed.
// ============================================================================
function QuietSide({ team, runs, wickets, isWinner, alignRight }: { team: Team; runs?: number; wickets?: number; isWinner?: boolean; alignRight?: boolean }) {
  const dim = isWinner === false;
  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${alignRight ? "flex-row-reverse" : ""}`}>
      <FlagOrRank team={team} />
      <div className={`flex flex-col min-w-0 ${alignRight ? "items-end" : "items-start"}`}>
        <span className={`text-[13px] font-extrabold leading-none truncate ${dim ? "text-text-dim" : "text-text-primary"}`}>
          {team.shortName}
        </span>
        {runs !== undefined && (
          <span className={`text-[10.5px] num font-bold leading-tight ${dim ? "text-text-dim" : "text-text-secondary"}`}>
            {formatScore(runs, wickets)}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Past card — QUIET (v1.0.49 restraint pass).
// Flat bg-surface, thin 3px left border in the winning team's color, no
// gradient / crest watermark / highlight badge. Just team names, score, and
// one result line. Excitement>=8 matches never reach this component — the
// homepage routes them to SpotlightMatchCard instead.
//
// Border color rule (v1.0.60 — this card and FutureMatchCard only; Live
// hero, Spotlight, and "for you" each have their own separate treatment
// and are untouched by this rule): a completed match ALWAYS colors the
// border with the actual winning team's primaryColor, matched by explicit
// team-code equality against BOTH teamA and teamB — never a silent
// ternary fallback to "whichever one didn't match", which is what let an
// unmatched/missing winner code silently borrow the wrong side's color.
// If winnerCode doesn't equal either team's code (shouldn't happen for a
// real completed match, but this is the deliberate safety net), the
// border falls back to the same neutral line color FutureMatchCard uses
// for a match with no result yet — never an arbitrary team color.
// ============================================================================
export function PastMatchCard({ match }: { match: Match }) {
  const winnerCode = match.result?.winner;
  const winnerTeam =
    winnerCode === match.teamA.code ? match.teamA :
    winnerCode === match.teamB.code ? match.teamB :
    undefined;
  const borderColor = winnerTeam?.primaryColor ?? "#1E293B";

  return (
    <Link
      href={`/match/${match.id}`}
      className="tap-scale block rounded-xl bg-bg-surface overflow-hidden"
      style={{ height: QUIET_CARD_HEIGHT, borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="h-full pl-2 pr-2.5 py-1.5 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between gap-2">
          <QuietSide team={match.teamA} runs={match.result?.teamARuns} wickets={match.result?.teamAWickets} isWinner={winnerCode === match.teamA.code} />
          <span className="text-[10px] font-bold text-text-dim shrink-0">vs</span>
          <QuietSide team={match.teamB} runs={match.result?.teamBRuns} wickets={match.result?.teamBWickets} isWinner={winnerCode === match.teamB.code} alignRight />
        </div>
        {match.result && (
          <div className="text-[9.5px] text-text-secondary text-center truncate leading-none">
            {winnerCode} won {match.result.margin}
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// Future card — QUIET (v1.0.49 restraint pass).
// Same flat treatment as the past card. There's no "leading team" pre-match
// (this grid never shows a live, in-progress match — every card here is
// either a settled result or a fixture that hasn't started), so picking
// either team's color would be arbitrary. Border stays neutral (line
// color, "#1E293B" — same fallback PastMatchCard uses when a result is
// ever ambiguous) rather than favoring one side, consistent with the rule
// above: only an actual winner earns the colored border.
// ============================================================================
export function FutureMatchCard({ match }: { match: Match }) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="tap-scale block rounded-xl bg-bg-surface overflow-hidden"
      style={{ height: QUIET_CARD_HEIGHT, borderLeft: "3px solid #1E293B" }}
    >
      <div className="h-full pl-2 pr-2.5 py-1.5 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between gap-2">
          <QuietSide team={match.teamA} />
          <span className="text-[10px] font-bold text-text-dim shrink-0">vs</span>
          <QuietSide team={match.teamB} alignRight />
        </div>
        <div className="text-[9.5px] text-cyan font-semibold text-center truncate leading-none num">
          {fmtCountdown(match.startTimeIso)} · {fmtTime(match.startTimeIso)}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Spotlight card — the SplitTeamBg/crest/glow/badge "full treatment", now
// reserved for matches clearing the concrete spotlight bar (see
// lib/spotlight.ts — close finish / milestone / knockout-decider stakes;
// deliberately NOT the excitement score, which is meaningless noise for
// generated matches). Handles both past and upcoming matches (pass isPast
// accordingly). Optionally marked as the user's "for you" match via a small
// star pill (top-left, never stacked on the top-right HighlightBadge).
// ============================================================================
export function SpotlightMatchCard({ match, isPast, forYou }: { match: Match; isPast: boolean; forYou?: boolean }) {
  if (isPast) {
    const winnerCode = match.result?.winner;
    const winnerTeam = winnerCode === match.teamA.code ? match.teamA : match.teamB;

    return (
      <Link
        href={`/match/${match.id}`}
        className="tap-scale relative block rounded-xl overflow-hidden excitement-glow"
        style={{ height: SPOTLIGHT_CARD_HEIGHT }}
      >
        <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="wide" />
        {forYou && <ForYouMarker />}

        <div className="relative h-full px-2 py-1.5 flex flex-col text-white gap-0.5">
          <div className="flex items-center justify-between gap-2 min-h-[13px]">
            <span className="text-[9.5px] num text-white/75 leading-none">{fmtDate(match.startTimeIso)}</span>
            <div className="flex items-center gap-1 shrink-0">
              <CompetitionBadge match={match} />
              <HighlightBadge text={match.highlightBadge} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <SideBlock team={match.teamA} runs={match.result?.teamARuns} wickets={match.result?.teamAWickets} isWinner={winnerCode === match.teamA.code} />
            <span className="text-sm font-extrabold text-white/35">vs</span>
            <SideBlock team={match.teamB} runs={match.result?.teamBRuns} wickets={match.result?.teamBWickets} isWinner={winnerCode === match.teamB.code} alignRight />
          </div>

          {match.result && (
            <div
              className="text-center text-[10px] font-extrabold uppercase tracking-widest rounded-md py-0.5 leading-tight"
              style={{ background: `${winnerTeam.primaryColor}d9`, color: "#FFFFFF" }}
            >
              {winnerCode} won {match.result.margin}
            </div>
          )}

          <div className="text-[9.5px] text-white/65 truncate leading-tight">
            {match.venue.name} ({match.venue.city})
          </div>

          {match.summary && (
            <p className="text-[10.5px] leading-snug text-white/90" style={clamp2}>
              {match.summary}
            </p>
          )}
        </div>
      </Link>
    );
  }

  // Upcoming
  return (
    <Link
      href={`/match/${match.id}`}
      className="tap-scale relative block rounded-xl overflow-hidden excitement-glow"
      style={{ height: SPOTLIGHT_CARD_HEIGHT }}
    >
      <SplitTeamBg teamA={match.teamA} teamB={match.teamB} variant="narrow" />
      {forYou && <ForYouMarker />}

      <div className="relative h-full px-2 py-1.5 flex flex-col text-white gap-0.5">
        <div className="flex items-center justify-between gap-1 min-h-[13px]">
          <span className="text-[9px] num text-white/65 leading-none truncate">
            {fmtDate(match.startTimeIso).replace(",", "")}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <CompetitionBadge match={match} />
            <HighlightBadge text={match.highlightBadge} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          <SideBlock team={match.teamA} isWinner />
          <span className="text-[10px] font-extrabold text-white/40">vs</span>
          <SideBlock team={match.teamB} isWinner alignRight />
        </div>

        {match.summary && (
          <p className="text-[9.5px] leading-snug text-white/80 flex-1" style={clamp2}>
            {match.summary}
          </p>
        )}

        <div
          className="mt-auto rounded-md px-1.5 py-1 flex items-center justify-between gap-1"
          style={{ background: "rgba(0,0,0,0.35)", borderTop: "1px solid rgba(255,255,255,0.10)" }}
        >
          <div className="flex items-center gap-1">
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/50 shrink-0">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 1.5" />
            </svg>
            <span className="text-[9px] font-extrabold text-cyan num leading-none">
              {fmtCountdown(match.startTimeIso)}
            </span>
          </div>
          <span className="text-[8.5px] text-white/50 num truncate leading-none">
            {fmtTime(match.startTimeIso)} · {match.venue.city}
          </span>
        </div>
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
            {formatScore(runs, wickets)}
          </span>
        )}
      </div>
    </div>
  );
}
