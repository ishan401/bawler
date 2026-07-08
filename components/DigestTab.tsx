"use client";

/**
 * DigestTab — over-by-over / session digest cards for each innings.
 *
 * Format-adaptive grouping:
 *   T20 / T20I / Hundred → 1 card per over
 *   ODI                  → 1 card per 5 overs
 *   Test (no sessions)   → 1 card per 10 overs (fallback)
 *   Test (with sessions) → 1 card per session + Day Summary card at end of each day
 *
 * Cards newest-first.
 */

import React, { useMemo } from "react";
import { Match, Ball, MatchFormat, Innings, TestSession } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function groupSize(format: MatchFormat): number {
  if (format === "ODI") return 5;
  if (format === "Test") return 10;
  return 1;
}

function lastName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  return parts.length >= 2 ? parts[parts.length - 1] : fullName;
}

function isExtras(b: Ball): boolean {
  return b.extraType === "wd" || b.extraType === "nb";
}

function legalBalls(balls: Ball[]): Ball[] {
  return balls.filter(b => !isExtras(b));
}

function pickKeyBall(balls: Ball[]): Ball {
  const wicket = balls.find(b => b.isWicket);
  if (wicket) return wicket;
  const six = balls.find(b => b.isBoundary6);
  if (six) return six;
  const four = balls.find(b => b.isBoundary4);
  if (four) return four;
  return balls.reduce((best, b) => (b.runs > best.runs ? b : best), balls[0]);
}

function dominantBowler(balls: Ball[]): string {
  const map = new Map<string, { balls: number; wickets: number }>();
  for (const b of balls) {
    const e = map.get(b.bowlerName) ?? { balls: 0, wickets: 0 };
    e.balls++;
    if (b.isWicket) e.wickets++;
    map.set(b.bowlerName, e);
  }
  return [...map.entries()].sort(
    (a, b) => b[1].wickets - a[1].wickets || b[1].balls - a[1].balls
  )[0][0];
}

// ── narrative (factual, compact) ──────────────────────────────────────────────

function buildNarrative(
  runs: number,
  wickets: number,
  fours: number,
  sixes: number,
  bowler: string,
  keyBall: Ball,
  format: MatchFormat
): string {
  const span = format === "ODI" ? "block" : format === "Test" ? "session" : "over";
  const big = format === "ODI" ? 30 : format === "Test" ? 50 : 14;

  if (runs === 0 && wickets === 0) return `${lastName(bowler)} maiden`;
  if (wickets >= 3) return `${wickets} wickets — collapse!`;
  if (wickets === 2) return `Two wickets, ${runs} conceded`;
  if (runs >= big)
    return sixes >= 2
      ? `${sixes} sixes, ${fours} fours — carnage`
      : `Big ${span} — ${runs} runs`;
  if (wickets === 1 && runs >= 10) return `${runs} & a wicket — ${lastName(bowler)}`;
  if (wickets === 1) return `${lastName(bowler)} strikes`;
  if (sixes >= 2) return `${sixes} sixes — ${lastName(keyBall.batterName)} in flow`;
  if (fours >= 3) return `${fours} fours — boundaries flowing`;
  if (runs <= 3 && wickets === 0) return `Tight ${span} — ${runs} conceded`;
  return `${runs} scored`;
}

// ── over summary (creative, 1-2 lines) ────────────────────────────────────────

function buildOverSummary(
  runs: number,
  wickets: number,
  fours: number,
  sixes: number,
  bowlerName: string,
  keyBall: Ball,
  variant: number
): string {
  const bowler = lastName(bowlerName);
  const batter = lastName(keyBall.batterName);
  const v = ((variant % 3) + 3) % 3;

  if (runs === 0 && wickets === 0) {
    return [
      `${bowler} was unplayable — six balls, not a run to spare.`,
      `A maiden under pressure. ${bowler} made every delivery count.`,
      `Dots all the way. The kind of over that wins matches quietly.`,
    ][v];
  }
  if (wickets >= 3) {
    return [
      `Three gone — the innings buckled without warning.`,
      `${bowler} went through the lineup. Chaos in the middle.`,
      `A collapse that no batting card can explain. Drama, pure and simple.`,
    ][v];
  }
  if (wickets >= 2) {
    return [
      `Two wickets in quick succession — the game just tilted.`,
      `${bowler} made it look inevitable. Both batters had no answer.`,
      `A partnership ended, another began — the pressure just ratcheted up.`,
    ][v];
  }
  if (runs >= 18) {
    return [
      `${batter} was in another zone entirely — ${runs} off the over, relentless.`,
      `The bowling had no plan. ${batter} had every shot in the book.`,
      `${runs} runs. The crowd barely sat down. This is why you watch cricket.`,
    ][v];
  }
  if (runs >= 14) {
    return [
      `${batter} seized the moment — ${runs} and the momentum swings.`,
      `A statement over. ${bowler} will want to forget this one.`,
      `${runs} runs and the game's balance tipped in an instant.`,
    ][v];
  }
  if (sixes >= 2) {
    return [
      `${batter} cleared the ropes twice. ${bowler} had no answers.`,
      `Two sixes — pick a length, they said. ${batter} didn't care either way.`,
      `The big hits arrived on cue. The crowd erupted, and rightly so.`,
    ][v];
  }
  if (fours >= 3) {
    return [
      `Boundaries everywhere — ${batter} was in cruise control.`,
      `Three fours: elegant, ruthless, clinical. ${bowler} had no room to hide.`,
      `The scoreboard ticked quickly. ${batter} made it all look effortless.`,
    ][v];
  }
  if (wickets === 1) {
    return [
      `One wicket — and the mood in the middle changed instantly.`,
      `${bowler} got the big one. This is where the match could turn.`,
      `${batter} walks back. The questions start. The pressure is real now.`,
    ][v];
  }
  if (runs <= 4) {
    return [
      `${runs} runs off the over. ${bowler} gave nothing away, nothing at all.`,
      `Tight, disciplined, relentless — ${bowler}'s kind of over.`,
      `${runs} off six balls. May as well have been a maiden. Pressure applied.`,
    ][v];
  }
  return [
    `A balanced over. Neither side dominated, but the tension stayed.`,
    `The contest quietly continues — ${runs} runs, nothing decided yet.`,
    `${runs} scored and the match stays on a knife edge. Next over matters.`,
  ][v];
}

// ── day summary creative line ─────────────────────────────────────────────────

function buildDaySummaryLine(
  runs: number,
  wickets: number,
  fours: number,
  sixes: number,
  day: number
): string {
  const v = day % 3;
  if (wickets >= 10) {
    return [
      "Two teams, one day, ten wickets — cricket at its most dramatic.",
      "A complete story in a day: batting, bowling, and a full set of wickets.",
      "The contest was fierce. Ten down by stumps.",
    ][v];
  }
  if (wickets === 0) {
    return [
      "Not a wicket to fall. The batters owned every session.",
      "Flawless with the bat. A day the bowlers would rather forget.",
      `${runs} scored, none lost — the kind of day Test batters dream of.`,
    ][v];
  }
  if (runs >= 250) {
    return [
      `${runs} scored in a day's play. Big hitting, good cricket, great theatre.`,
      `A prolific day — ${runs} runs, ${wickets} wickets, drama in every session.`,
      `Runs flowed freely. ${wickets} fell, but the batters had the upper hand.`,
    ][v];
  }
  if (wickets >= 6) {
    return [
      `The bowlers dominated — ${wickets} wickets for ${runs} runs. Telling day.`,
      `${wickets} wickets down and the innings in real trouble. Bowlers on top.`,
      `Only ${runs} scored but ${wickets} fell. This is the bowlers' match to lose.`,
    ][v];
  }
  return [
    `Stumps drawn: ${runs} scored, ${wickets} wickets fallen. The game hangs in the balance.`,
    `${runs} runs and ${wickets} wickets — a hard-fought day with no clear winner yet.`,
    `Cricket in its truest form — ${runs} scored, ${wickets} lost. Edge-of-seat stuff.`,
  ][v];
}

// ── card data types ───────────────────────────────────────────────────────────

interface OverGroupCard {
  kind: "over-group";
  id: string;
  label: string;
  inningsLabel: string;
  teamColor: string;
  runs: number;
  wickets: number;
  fours: number;
  sixes: number;
  allBalls: Ball[];
  legalDeliveries: Ball[];
  keyBall: Ball;
  bowlerName: string;
  narrative: string;
  overSummary: string;
  gs: number;
}

interface SessionCard {
  kind: "session";
  id: string;
  sessionLabel: string;   // "Day 2 Afternoon"
  overRange: string;      // "Overs 1–28"
  inningsLabel: string;
  teamColor: string;
  runs: number;
  wickets: number;
  fours: number;
  sixes: number;
  allBalls: Ball[];
  keyBall: Ball;
  bowlerName: string;
  narrative: string;
  overSummary: string;
  isLiveSession: boolean;
}

interface DaySummaryCard {
  kind: "day-summary";
  id: string;
  day: number;
  sessionRows: { label: string; runs: number; wickets: number; teamColor: string }[];
  totalRuns: number;
  totalWickets: number;
  summaryLine: string;
}

type DigestCardData = OverGroupCard | SessionCard | DaySummaryCard;

// ── over-group card builder (T20 / ODI / Test fallback) ───────────────────────

function buildOverGroupCards(match: Match, allBalls: Ball[], isLive: boolean): OverGroupCard[] {
  const gs = groupSize(match.format);
  const result: OverGroupCard[] = [];
  const inningsCount = match.innings.length;

  for (let innIdx = 0; innIdx < inningsCount; innIdx++) {
    const inn: Innings = match.innings[innIdx];
    const innBalls = allBalls.filter(b => b.inningsNumber === inn.number);
    if (innBalls.length === 0) continue;

    const byOver = new Map<number, Ball[]>();
    for (const b of innBalls) {
      const arr = byOver.get(b.over) ?? [];
      arr.push(b);
      byOver.set(b.over, arr);
    }

    const overNums = [...byOver.keys()].sort((a, b) => a - b);
    if (overNums.length === 0) continue;

    const isLastInn = innIdx === inningsCount - 1;
    const lastOverNum = overNums[overNums.length - 1];
    const lastOverBalls = byOver.get(lastOverNum) ?? [];
    const completedOverNums =
      isLive && isLastInn && legalBalls(lastOverBalls).length < 6
        ? overNums.slice(0, -1)
        : overNums;

    if (completedOverNums.length === 0) continue;

    const ordinals = ["1st", "2nd", "3rd", "4th"];
    const inningsLabel = inningsCount > 1 ? `${ordinals[inn.number - 1]} Inn` : "";
    const teamColor =
      inn.battingTeam === match.teamA.code
        ? match.teamA.primaryColor
        : match.teamB.primaryColor;

    const firstOver = completedOverNums[0];
    const lastOver = completedOverNums[completedOverNums.length - 1];

    for (let chunkStart = firstOver; chunkStart <= lastOver; chunkStart += gs) {
      const chunkEnd = chunkStart + gs - 1;
      const chunkOvers = completedOverNums.filter(n => n >= chunkStart && n <= chunkEnd);
      if (chunkOvers.length === 0) continue;
      if (gs > 1 && lastOver < chunkStart + gs - 1) continue;

      const chunkBalls = chunkOvers.flatMap(n => byOver.get(n) ?? []);
      if (chunkBalls.length === 0) continue;

      const runs = chunkBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = chunkBalls.filter(b => b.isWicket).length;
      const fours = chunkBalls.filter(b => b.isBoundary4).length;
      const sixes = chunkBalls.filter(b => b.isBoundary6).length;
      const keyBall = pickKeyBall(chunkBalls);
      const bowlerName = dominantBowler(chunkBalls);
      const legal = legalBalls(chunkBalls);

      const label =
        gs === 1
          ? `Over ${chunkStart}`
          : `Overs ${chunkStart}–${Math.min(chunkEnd, lastOver)}`;

      result.push({
        kind: "over-group",
        id: `inn${inn.number}-over${chunkStart}`,
        label,
        inningsLabel,
        teamColor,
        runs,
        wickets,
        fours,
        sixes,
        allBalls: chunkBalls,
        legalDeliveries: legal,
        keyBall,
        bowlerName,
        narrative: buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, match.format),
        overSummary: buildOverSummary(runs, wickets, fours, sixes, bowlerName, keyBall, chunkStart),
        gs,
      });
    }
  }

  return result.reverse();
}

// ── session-based card builder (Test with sessions metadata) ──────────────────

function buildTestSessionCards(match: Match, allBalls: Ball[], isLive: boolean): DigestCardData[] {
  // Map: day → chronological list of {session, sessionCard}
  const dayMap = new Map<number, { sess: TestSession; card: SessionCard }[]>();
  const inningsCount = match.innings.length;
  const ordinals = ["1st", "2nd", "3rd", "4th"];

  for (let innIdx = 0; innIdx < inningsCount; innIdx++) {
    const inn: Innings = match.innings[innIdx];
    if (!inn.sessions || inn.sessions.length === 0) continue;

    const innBalls = allBalls.filter(b => b.inningsNumber === inn.number);
    if (innBalls.length === 0) continue;

    const byOver = new Map<number, Ball[]>();
    for (const b of innBalls) {
      const arr = byOver.get(b.over) ?? [];
      arr.push(b);
      byOver.set(b.over, arr);
    }

    const allOverNums = [...byOver.keys()].sort((a, b) => a - b);
    if (allOverNums.length === 0) continue;

    const isLastInn = innIdx === inningsCount - 1;
    const lastOverNum = allOverNums[allOverNums.length - 1];
    const lastOverBalls = byOver.get(lastOverNum) ?? [];
    const completedOverNums =
      isLive && isLastInn && legalBalls(lastOverBalls).length < 6
        ? allOverNums.slice(0, -1)
        : allOverNums;

    const inningsLabel = inningsCount > 1 ? `${ordinals[inn.number - 1]} Inn` : "";
    const teamColor =
      inn.battingTeam === match.teamA.code
        ? match.teamA.primaryColor
        : match.teamB.primaryColor;

    for (const sess of inn.sessions) {
      const sessOvers = completedOverNums.filter(
        n => n >= sess.startOver && n <= sess.endOver
      );
      if (sessOvers.length === 0) continue;

      const sessBalls = sessOvers.flatMap(n => byOver.get(n) ?? []);
      if (sessBalls.length === 0) continue;

      const runs = sessBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = sessBalls.filter(b => b.isWicket).length;
      const fours = sessBalls.filter(b => b.isBoundary4).length;
      const sixes = sessBalls.filter(b => b.isBoundary6).length;
      const keyBall = pickKeyBall(sessBalls);
      const bowlerName = dominantBowler(sessBalls);
      const firstOver = sessOvers[0];
      const lastOver = sessOvers[sessOvers.length - 1];

      const sessionIndex = ["morning", "afternoon", "evening"].indexOf(sess.session);

      const card: SessionCard = {
        kind: "session",
        id: `sess-inn${inn.number}-day${sess.day}-${sess.session}`,
        sessionLabel: sess.label,
        overRange: `Overs ${firstOver}–${lastOver}`,
        inningsLabel,
        teamColor,
        runs,
        wickets,
        fours,
        sixes,
        allBalls: sessBalls,
        keyBall,
        bowlerName,
        narrative: buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, "Test"),
        overSummary: buildOverSummary(
          runs, wickets, fours, sixes, bowlerName, keyBall,
          sess.day * 3 + sessionIndex
        ),
        isLiveSession: !sess.isComplete,
      };

      const dayEntries = dayMap.get(sess.day) ?? [];
      dayEntries.push({ sess, card });
      dayMap.set(sess.day, dayEntries);
    }
  }

  // Build output oldest-first: sessions in order, then Day Summary at end of each complete day
  const result: DigestCardData[] = [];
  const days = [...dayMap.keys()].sort((a, b) => a - b);

  for (const day of days) {
    const entries = dayMap.get(day)!;
    // Sort sessions chronologically
    const order = ["morning", "afternoon", "evening"];
    entries.sort((a, b) => order.indexOf(a.sess.session) - order.indexOf(b.sess.session));

    for (const { card } of entries) {
      result.push(card);
    }

    const allComplete = entries.every(e => e.sess.isComplete);
    if (allComplete) {
      const totalRuns = entries.reduce((s, e) => s + e.card.runs, 0);
      const totalWickets = entries.reduce((s, e) => s + e.card.wickets, 0);
      const totalFours = entries.reduce((s, e) => s + e.card.fours, 0);
      const totalSixes = entries.reduce((s, e) => s + e.card.sixes, 0);

      const daySummary: DaySummaryCard = {
        kind: "day-summary",
        id: `day-summary-${day}`,
        day,
        sessionRows: entries.map(e => ({
          label: e.sess.label,
          runs: e.card.runs,
          wickets: e.card.wickets,
          teamColor: e.card.teamColor,
        })),
        totalRuns,
        totalWickets,
        summaryLine: buildDaySummaryLine(totalRuns, totalWickets, totalFours, totalSixes, day),
      };
      result.push(daySummary);
    }
  }

  // Newest-first
  return result.reverse();
}

// ── top-level card builder ────────────────────────────────────────────────────

function buildCards(match: Match, allBalls: Ball[], isLive: boolean): DigestCardData[] {
  // Test with sessions on any innings → use session-based grouping
  const hasSessionData = match.format === "Test" &&
    match.innings.some(inn => inn.sessions && inn.sessions.length > 0);

  if (hasSessionData) {
    return buildTestSessionCards(match, allBalls, isLive);
  }
  return buildOverGroupCards(match, allBalls, isLive);
}

// ── sub-components ───────────────────────────────────────────────────────────

function BallDot({ ball }: { ball: Ball }) {
  let bg = "bg-white/10";
  let textColor = "text-text-dim";
  let content = "·";

  if (ball.isWicket) {
    bg = "bg-wicket/25"; textColor = "text-wicket"; content = "W";
  } else if (ball.isBoundary6) {
    bg = "bg-six/25"; textColor = "text-six"; content = "6";
  } else if (ball.isBoundary4) {
    bg = "bg-boundary/25"; textColor = "text-boundary"; content = "4";
  } else if (ball.runs > 0) {
    bg = "bg-white/12"; textColor = "text-text-secondary"; content = String(ball.runs);
  }

  return (
    <div className={`w-[17px] h-[17px] rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className={`text-[8px] font-bold leading-none ${textColor}`}>{content}</span>
    </div>
  );
}

function OverGroupCardView({
  card,
  onSelectBall,
}: {
  card: OverGroupCard;
  onSelectBall: (id: string) => void;
}) {
  const kb = card.keyBall;
  const keyLabel = (() => {
    const base = `${kb.over}.${kb.ballInOver + 1}`;
    if (kb.isWicket) return `${base} · OUT`;
    if (kb.isBoundary6) return `${base} · SIX`;
    if (kb.isBoundary4) return `${base} · FOUR`;
    return base;
  })();

  const showDots = card.gs === 1;

  return (
    <div className="card overflow-hidden">
      {/* Row 1 */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.teamColor }} />
        {card.inningsLabel && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
            {card.inningsLabel}
          </span>
        )}
        <span className="text-[10px] font-extrabold text-text-primary">{card.label}</span>
        <div className="flex-1" />
        <span className="text-[10px] font-extrabold num text-text-primary">{card.runs}r</span>
        {card.wickets > 0 && (
          <span className="text-[10px] font-extrabold num text-wicket ml-1">{card.wickets}w</span>
        )}
        {card.fours > 0 && (
          <span className="text-[10px] font-bold num text-boundary ml-1">{card.fours}×4</span>
        )}
        {card.sixes > 0 && (
          <span className="text-[10px] font-bold num text-six ml-1">{card.sixes}×6</span>
        )}
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-2 px-3 pb-2">
        {showDots && (
          <div className="flex items-center gap-0.5 shrink-0">
            {card.legalDeliveries.map(b => (
              <BallDot key={b.id} ball={b} />
            ))}
          </div>
        )}
        <p className="text-[10px] text-text-dim leading-snug truncate flex-1 min-w-0">
          {card.narrative}
        </p>
      </div>

      {/* Row 3 */}
      <button
        onClick={() => onSelectBall(card.keyBall.id)}
        className="w-full px-3 pt-2 pb-2.5 border-t border-line/50 text-left active:bg-line/40 transition-colors"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim shrink-0">Key</span>
          <span className="text-[10px] font-extrabold text-cyan num">{keyLabel}</span>
          <svg className="w-3 h-3 text-cyan ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-[11px] text-text-secondary leading-snug">{card.overSummary}</p>
      </button>
    </div>
  );
}

function SessionCardView({
  card,
  onSelectBall,
}: {
  card: SessionCard;
  onSelectBall: (id: string) => void;
}) {
  const kb = card.keyBall;
  const keyLabel = (() => {
    const base = `${kb.over}.${kb.ballInOver + 1}`;
    if (kb.isWicket) return `${base} · OUT`;
    if (kb.isBoundary6) return `${base} · SIX`;
    if (kb.isBoundary4) return `${base} · FOUR`;
    return base;
  })();

  return (
    <div className="card overflow-hidden">
      {/* Row 1: session label + stats */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.teamColor }} />
        {card.inningsLabel && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
            {card.inningsLabel}
          </span>
        )}
        <span className="text-[10px] font-extrabold text-text-primary">{card.sessionLabel}</span>
        {card.isLiveSession && (
          <span className="text-[8px] font-bold uppercase tracking-widest text-live bg-live/15 px-1.5 py-0.5 rounded-full">
            Live
          </span>
        )}
        <div className="flex-1" />
        <span className="text-[10px] font-extrabold num text-text-primary">{card.runs}r</span>
        {card.wickets > 0 && (
          <span className="text-[10px] font-extrabold num text-wicket ml-1">{card.wickets}w</span>
        )}
        {card.fours > 0 && (
          <span className="text-[10px] font-bold num text-boundary ml-1">{card.fours}×4</span>
        )}
        {card.sixes > 0 && (
          <span className="text-[10px] font-bold num text-six ml-1">{card.sixes}×6</span>
        )}
      </div>

      {/* Row 2: over range + factual narrative */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="text-[9px] text-text-dim shrink-0">{card.overRange}</span>
        <span className="text-text-dim/40 text-[9px]">·</span>
        <p className="text-[10px] text-text-dim leading-snug truncate flex-1 min-w-0">
          {card.narrative}
        </p>
      </div>

      {/* Row 3: key ball + creative summary */}
      <button
        onClick={() => onSelectBall(card.keyBall.id)}
        className="w-full px-3 pt-2 pb-2.5 border-t border-line/50 text-left active:bg-line/40 transition-colors"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[8px] font-bold uppercase tracking-widest text-text-dim shrink-0">Key</span>
          <span className="text-[10px] font-extrabold text-cyan num">{keyLabel}</span>
          <svg className="w-3 h-3 text-cyan ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-[11px] text-text-secondary leading-snug">{card.overSummary}</p>
      </button>
    </div>
  );
}

function DaySummaryCardView({ card }: { card: DaySummaryCard }) {
  const sessionLabel = card.sessionRows
    .map(r => `${r.label.split(" ").slice(2).join(" ")}: ${r.runs}/${r.wickets}`)
    .join("  ·  ");

  return (
    <div className="rounded-xl overflow-hidden border border-line/60 bg-surface-2/70 backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/4 border-b border-line/40">
        <div className="flex items-center gap-1">
          {card.sessionRows.slice(0, 3).map((r, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: r.teamColor }}
            />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">
          Day {card.day} · Stumps
        </span>
        <div className="flex-1" />
        <span className="text-[11px] font-extrabold num text-text-primary">{card.totalRuns}r</span>
        {card.totalWickets > 0 && (
          <span className="text-[11px] font-extrabold num text-wicket ml-1">{card.totalWickets}w</span>
        )}
      </div>

      {/* Session breakdown */}
      <div className="px-3 py-2">
        <p className="text-[9px] text-text-dim leading-relaxed">{sessionLabel}</p>
      </div>

      {/* Summary line */}
      <div className="px-3 pb-3">
        <p className="text-[11px] text-text-secondary leading-snug italic">
          {card.summaryLine}
        </p>
      </div>
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

interface Props {
  match: Match;
  allBalls: Ball[];
  onSelectBall: (ballId: string) => void;
}

export default function DigestTab({ match, allBalls, onSelectBall }: Props) {
  const isLive = match.status === "live";
  const cards = useMemo(
    () => buildCards(match, allBalls, isLive),
    [match, allBalls, isLive]
  );

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-16 gap-2 text-center px-6">
        <p className="text-sm font-bold text-text-primary">No digest yet</p>
        <p className="text-xs text-text-dim">Cards appear as each session completes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-4">
      {cards.map(card => {
        if (card.kind === "day-summary") {
          return <DaySummaryCardView key={card.id} card={card} />;
        }
        if (card.kind === "session") {
          return <SessionCardView key={card.id} card={card} onSelectBall={onSelectBall} />;
        }
        return <OverGroupCardView key={card.id} card={card} onSelectBall={onSelectBall} />;
      })}
    </div>
  );
}
