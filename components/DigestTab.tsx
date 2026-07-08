"use client";

/**
 * DigestTab — session / over-group digest cards.
 *
 * Format-adaptive grouping:
 *   T20 / T20I / Hundred → 1 card per over
 *   ODI                  → 1 card per 5 overs
 *   Test (with sessions) → 1 card per session + Day Report card at end of each day
 *   Test (no sessions)   → 1 card per 10 overs (fallback, auto-derives from timestamps)
 *
 * Test-only: Day filter chips let the user browse by day.
 * Default view = latest day with data.
 */

import React, { useMemo, useState } from "react";
import { Match, Ball, MatchFormat, Innings, TestSession } from "@/lib/types";
import { deriveTestSessions } from "@/lib/transformers";
import { PLAYERS, slugifyPlayer } from "@/lib/mockData";

// ── share utility ────────────────────────────────────────────────────────────

async function shareCard(cardEl: HTMLElement, label: string) {
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(cardEl, {
      pixelRatio: 2,
      backgroundColor: "#070B14",
      skipFonts: true,
    });
    const byteStr = atob(dataUrl.split(",")[1]);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/png" });
    const file = new File([blob], `bawler-digest-${label}.png`, { type: "image/png" });
    const text = `${label} · bawler-gold.vercel.app`;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Bawler Digest", text });
    } else {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `bawler-digest-${label}.png`;
      a.click();
    }
  } catch (err) {
    if (err instanceof Error && err.name !== "AbortError") {
      console.error("[Bawler] Digest share failed:", err);
    }
  }
}

function ShareButton({ label }: { label: string }) {
  function handleShare(e: React.MouseEvent<HTMLButtonElement>) {
    const card = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-digest-card]");
    if (card) shareCard(card, label);
  }
  return (
    <button
      onClick={handleShare}
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-white/6 active:bg-white/15 transition-colors"
      aria-label="Share"
    >
      <svg className="w-3.5 h-3.5 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </button>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function groupSize(format: MatchFormat): number {
  if (format === "ODI") return 5;
  if (format === "Test") return 10;
  return 1;
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function lastName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  return parts.length >= 2 ? parts[parts.length - 1] : fullName;
}

function isExtras(b: Ball): boolean {
  return b.extraType === "wd" || b.extraType === "nb";
}

function legalBalls(balls: Ball[]): Ball[] {
  return balls.filter(b => !isExtras(b));
}

function pickKeyBall(balls: Ball[]): Ball | null {
  if (!balls.length) return null;
  const wicket = balls.find(b => b.isWicket);
  if (wicket) return wicket;
  const six = balls.find(b => b.isBoundary6);
  if (six) return six;
  const four = balls.find(b => b.isBoundary4);
  if (four) return four;
  return balls.reduce((best, b) => (b.runs > best.runs ? b : best), balls[0]);
}

function dominantBowler(balls: Ball[]): string {
  if (!balls.length) return "";
  const map = new Map<string, { balls: number; wickets: number }>();
  for (const b of balls) {
    const name = b.bowlerName || "Unknown";
    const e = map.get(name) ?? { balls: 0, wickets: 0 };
    e.balls++;
    if (b.isWicket) e.wickets++;
    map.set(name, e);
  }
  const sorted = [...map.entries()].sort(
    (a, b) => b[1].wickets - a[1].wickets || b[1].balls - a[1].balls
  );
  return sorted[0]?.[0] ?? "";
}

// ── narrative (row 2 — factual, compact) ─────────────────────────────────────

function buildNarrative(
  runs: number, wickets: number, fours: number, sixes: number,
  bowler: string, keyBall: Ball | null, format: MatchFormat
): string {
  const span = format === "ODI" ? "block" : format === "Test" ? "session" : "over";
  const big  = format === "ODI" ? 30 : format === "Test" ? 50 : 14;

  if (runs === 0 && wickets === 0) return `${lastName(bowler)} maiden`;
  if (wickets >= 3) return `${wickets} wickets — collapse!`;
  if (wickets === 2) return `Two wickets, ${runs} conceded`;
  if (runs >= big)
    return sixes >= 2 ? `${sixes} sixes, ${fours} fours — carnage` : `Big ${span} — ${runs} runs`;
  if (wickets === 1 && runs >= 10) return `${runs} & a wicket — ${lastName(bowler)}`;
  if (wickets === 1) return `${lastName(bowler)} strikes`;
  if (sixes >= 2) return `${sixes} sixes — ${lastName(keyBall?.batterName) || 'Batter'} in flow`;
  if (fours >= 3) return `${fours} fours — boundaries flowing`;
  if (runs <= 3 && wickets === 0) return `Tight ${span} — ${runs} conceded`;
  return `${runs} scored`;
}

// ── over summary (row 3 — creative 1-2 lines) ─────────────────────────────────

function buildOverSummary(
  runs: number, wickets: number, fours: number, sixes: number,
  bowlerName: string, keyBall: Ball | null, variant: number
): string {
  const bowler = lastName(bowlerName) || "Bowler";
  const batter = lastName(keyBall?.batterName) || "Batter";
  const v = ((variant % 3) + 3) % 3;

  if (runs === 0 && wickets === 0)
    return [`${bowler} was unplayable — six balls, not a run to spare.`,
            `A maiden under pressure. ${bowler} made every delivery count.`,
            `Dots all the way. The kind of over that wins matches quietly.`][v];
  if (wickets >= 3)
    return [`Three gone — the innings buckled without warning.`,
            `${bowler} went through the lineup. Chaos in the middle.`,
            `A collapse that no batting card can explain. Drama, pure and simple.`][v];
  if (wickets >= 2)
    return [`Two wickets in quick succession — the game just tilted.`,
            `${bowler} made it look inevitable. Both batters had no answer.`,
            `A partnership ended, another began — the pressure just ratcheted up.`][v];
  if (runs >= 18)
    return [`${batter} was in another zone entirely — ${runs} off the over, relentless.`,
            `The bowling had no plan. ${batter} had every shot in the book.`,
            `${runs} runs. The crowd barely sat down. This is why you watch cricket.`][v];
  if (runs >= 14)
    return [`${batter} seized the moment — ${runs} and the momentum swings.`,
            `A statement over. ${bowler} will want to forget this one.`,
            `${runs} runs and the game's balance tipped in an instant.`][v];
  if (sixes >= 2)
    return [`${batter} cleared the ropes twice. ${bowler} had no answers.`,
            `Two sixes — pick a length, they said. ${batter} didn't care either way.`,
            `The big hits arrived on cue. The crowd erupted, and rightly so.`][v];
  if (fours >= 3)
    return [`Boundaries everywhere — ${batter} was in cruise control.`,
            `Three fours: elegant, ruthless, clinical. ${bowler} had no room to hide.`,
            `The scoreboard ticked quickly. ${batter} made it all look effortless.`][v];
  if (wickets === 1)
    return [`One wicket — and the mood in the middle changed instantly.`,
            `${bowler} got the big one. This is where the match could turn.`,
            `${batter} walks back. The questions start. The pressure is real now.`][v];
  if (runs <= 4)
    return [`${runs} runs off the over. ${bowler} gave nothing away, nothing at all.`,
            `Tight, disciplined, relentless — ${bowler}'s kind of over.`,
            `${runs} off six balls. May as well have been a maiden. Pressure applied.`][v];
  return [`A balanced over. Neither side dominated, but the tension stayed.`,
          `The contest quietly continues — ${runs} runs, nothing decided yet.`,
          `${runs} scored and the match stays on a knife edge. Next over matters.`][v];
}

// ── day report (5-7 lines for the Day Stumps card) ───────────────────────────

interface SessionEntry {
  sess: TestSession;
  card: SessionCard;
}

function buildDayReport(
  day: number,
  entries: SessionEntry[],
  isCurrentDay: boolean
): string[] {
  const lines: string[] = [];
  const totalRuns    = entries.reduce((s, e) => s + e.card.runs, 0);
  const totalWickets = entries.reduce((s, e) => s + e.card.wickets, 0);
  const totalFours   = entries.reduce((s, e) => s + e.card.fours, 0);
  const totalSixes   = entries.reduce((s, e) => s + e.card.sixes, 0);

  // Top bowler on the day
  const bowlerWkts = new Map<string, number>();
  for (const e of entries) {
    bowlerWkts.set(e.card.bowlerName,
      (bowlerWkts.get(e.card.bowlerName) ?? 0) + e.card.wickets);
  }
  const [topBowlerName, topBowlerWkts] = [...bowlerWkts.entries()]
    .sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  const topBowler = lastName(topBowlerName);

  const v = day % 3;

  // ── Line 1: Day overview ─────────────────────────────────────────────────
  if (totalWickets >= 10) {
    lines.push([
      `Day ${day} was a bowler's masterclass — ${totalWickets} wickets fell for ${totalRuns} runs across a dramatic day's play.`,
      `Wickets, drama, and relentless pressure defined Day ${day}: ${totalWickets} down, ${totalRuns} scored. A day the batting side would rather forget.`,
      `${totalWickets} wickets and ${totalRuns} runs summed up a Day ${day} that belonged entirely to the bowlers.`,
    ][v]);
  } else if (totalWickets <= 2) {
    lines.push([
      `Day ${day} was a batter's paradise — ${totalRuns} runs flowed with barely a scare, as the bowling attacks toiled without reward.`,
      `The bowlers had a long and thankless Day ${day}: ${totalRuns} scored, only ${totalWickets} wickets conceded. A commanding display of batting.`,
      `${totalRuns} runs and just ${totalWickets} wicket${totalWickets !== 1 ? "s" : ""} lost on Day ${day} — the kind of day that changes the shape of a Test match.`,
    ][v]);
  } else if (totalWickets >= 6) {
    lines.push([
      `Day ${day} swung decisively: ${totalRuns} runs, ${totalWickets} wickets — the bowling side seized the initiative and held on to it.`,
      `An eventful Day ${day} with ${totalWickets} wickets and ${totalRuns} runs. The balance tilted, and the bowling side were the ones smiling at stumps.`,
      `${totalWickets} wickets for ${totalRuns} runs on Day ${day} — a day that opened up the Test match and left plenty to play for.`,
    ][v]);
  } else {
    lines.push([
      `Day ${day} produced the kind of cricket Tests are made for — ${totalRuns} scored, ${totalWickets} wickets, momentum shifting more than once.`,
      `An absorbing Day ${day}: ${totalRuns} runs, ${totalWickets} wickets, and a match that refused to settle into a clear pattern.`,
      `${totalRuns} runs and ${totalWickets} wickets on Day ${day}. Hard-fought, absorbing, and genuinely unresolved at stumps.`,
    ][v]);
  }

  // ── Lines 2-4: Per session ───────────────────────────────────────────────
  for (const e of entries) {
    const SESS_LABELS: Record<string, string> = { first: "1st Session", second: "2nd Session", third: "3rd Session" };
    const sessName = SESS_LABELS[e.sess.session] ?? e.sess.session;
    const r = e.card.runs;
    const w = e.card.wickets;
    const bl = lastName(e.card.bowlerName);
    const range = e.card.overRange;

    if (w >= 5) {
      lines.push(`${sessName} (${range}): Only ${r} runs came in a session dominated by ${bl}, who took ${w} wickets in a spell that dismantled the innings. Brutal and brilliant.`);
    } else if (w >= 3) {
      lines.push(`${sessName} (${range}): ${r} runs, ${w} wickets — ${bl} led a sustained bowling effort that put the batting side firmly on the back foot.`);
    } else if (w === 0 && r >= 70) {
      lines.push(`${sessName} (${range}): A dominant batting session — ${r} runs without a single wicket lost. The bowlers toiled, the batters accumulated, and the scoreboard ticked over freely.`);
    } else if (w === 0 && r >= 40) {
      lines.push(`${sessName} (${range}): A steady ${r} runs with the wickets intact. Controlled rather than expansive, but the batting side will take it — no alarms, plenty of runs.`);
    } else if (w === 0) {
      lines.push(`${sessName} (${range}): Just ${r} runs, no wickets. A cautious session — the bowlers were tight, the batters were patient, and neither side truly dominated.`);
    } else if (r <= 35 && w >= 2) {
      lines.push(`${sessName} (${range}): A session that swung the match — ${w} wickets for only ${r} runs. The batting side lost their way, and ${bl} made them pay.`);
    } else {
      lines.push(`${sessName} (${range}): ${r} runs, ${w} wicket${w !== 1 ? "s" : ""} — a competitive session where both sides had their moments and no one could fully take charge.`);
    }
  }

  // ── Line 5: Star bowler ──────────────────────────────────────────────────
  if (topBowlerWkts >= 4) {
    lines.push([
      `${topBowler} was the story of the day — ${topBowlerWkts} wickets, each one a piece of high-quality bowling that the batter could do little about. A performance that will be remembered.`,
      `The standout individual: ${topBowler} with ${topBowlerWkts} wickets. Relentless, accurate, and utterly unplayable at times. A spell that shifted the entire match.`,
      `${topBowler} put his name all over this day. ${topBowlerWkts} wickets and a performance that reminded everyone why he's among the best in the world right now.`,
    ][v]);
  } else if (topBowlerWkts >= 2) {
    lines.push([
      `${topBowler} was the pick of the bowlers with ${topBowlerWkts} wickets — combining consistency, movement, and the odd delivery that was simply too good.`,
      `If one bowler stood out, it was ${topBowler}: ${topBowlerWkts} wickets and a performance that showed exactly why he's trusted in Test conditions.`,
      `${topBowler} led the attack with ${topBowlerWkts} wickets, bowling with the kind of discipline that forces mistakes even from well-set batters.`,
    ][v]);
  } else if (totalFours + totalSixes >= 12) {
    lines.push([
      `The batting side found the boundary freely — ${totalFours} fours and ${totalSixes} sixes over the course of the day. Shot-making of the highest order.`,
      `${totalFours} fours and ${totalSixes} sixes scored on the day. The boundary count tells its own story — this was batting with intent.`,
      `The scoreboard moved briskly: ${totalFours} fours, ${totalSixes} sixes. When batters were in, they made it count.`,
    ][v]);
  }

  // ── Line 6: Match context ────────────────────────────────────────────────
  if (isCurrentDay) {
    lines.push([
      `The day's play continues — every ball from here carries enormous weight as the match enters its defining phase.`,
      `Still live and still moving. This is Test cricket at its most gripping — nothing is decided, everything matters.`,
      `The match is in the balance right now. The next session — or even the next wicket — could be the one that decides it.`,
    ][v]);
  } else if (totalWickets >= 8) {
    lines.push([
      `With ${totalWickets} wickets on the day, the scales have tilted sharply. The side that batted will need to dig deep to stay in this contest.`,
      `${totalWickets} wickets in a day leaves very little room for error. The bowling side have put themselves in a commanding position heading into tomorrow.`,
      `A day that could prove decisive — ${totalWickets} wickets lost in a single day rarely leaves the match in doubt for long.`,
    ][v]);
  } else if (totalWickets === 0) {
    lines.push([
      `Not a wicket fell. Tomorrow morning, the bowling side desperately need an early breakthrough to shift the momentum before this game gets away from them.`,
      `A wicketless day changes the character of a Test. Come tomorrow, the bowling side must find a way in — quickly.`,
      `With no wickets on the board, the batting side go to stumps firmly in control. The bowlers will be working late on their plans tonight.`,
    ][v]);
  } else {
    lines.push([
      `The match remains genuinely open. Tomorrow's first session could define which way this Test goes — and both sides know it.`,
      `Neither side can claim to have won the day outright. That uncertainty is what makes Test cricket what it is.`,
      `Intriguingly poised at stumps. The two-session rule applies — whoever wins the first session of tomorrow sets the tone for everything that follows.`,
    ][v]);
  }

  // ── Line 7: Tomorrow's tease (completed days only) ───────────────────────
  if (!isCurrentDay) {
    lines.push([
      `All eyes on the morning session tomorrow — the first wicket of the day almost always sets the tone. Come back at 10:30.`,
      `What tomorrow brings is anyone's guess. In Test cricket, overnight momentum can evaporate before the first drinks break. That's the beauty of it.`,
      `Day ${day + 1} starts with a fresh ball, fresh legs, and fresh pressure. In Test cricket, you can never truly bank on yesterday's runs.`,
    ][v]);
  }

  return lines;
}

// ── card data types ───────────────────────────────────────────────────────────

interface OverGroupCard {
  kind: "over-group";
  id: string;
  inningsNumber: number;
  label: string;
  inningsLabel: string;
  teamColor: string;
  runs: number; wickets: number; fours: number; sixes: number;
  allBalls: Ball[];
  legalDeliveries: Ball[];
  keyBall: Ball | null;
  bowlerName: string;
  narrative: string;
  overSummary: string;
  gs: number;
}

interface SessionCard {
  kind: "session";
  id: string;
  day: number;              // which day this session belongs to
  sessionLabel: string;
  overRange: string;
  inningsLabel: string;
  teamColor: string;
  runs: number; wickets: number; fours: number; sixes: number;
  allBalls: Ball[];
  keyBall: Ball | null;
  bowlerName: string;
  narrative: string;
  overSummary: string;
  isLiveSession: boolean;
}

interface DaySummaryCard {
  kind: "day-summary";
  id: string;
  day: number;
  sessionRows: { label: string; inningsLabel: string; runs: number; wickets: number; teamColor: string }[];
  totalRuns: number;
  totalWickets: number;
  report: string[];         // 5-7 line match report
}

interface MatchSummaryCard {
  kind: "match-summary";
  id: string;
  format: MatchFormat;
  resultLine: string;
  winner: string;           // TeamCode | "draw" | "tie" | "no-result"
  winnerColor: string;
  loserColor: string;
  inningsScores: {
    label: string;
    runs: number;
    wickets: number;
    overs: number;
    declared: boolean;
    teamColor: string;
    batting: boolean;       // true = batting team
  }[];
  topBat: { name: string; runs: number; balls: number; fours: number; sixes: number; sr: number; teamColor: string } | null;
  topBowl: { name: string; wickets: number; runs: number; economy: number; teamColor: string } | null;
  manOfMatch: string | null;
  manOfMatchPhotoUrl: string | null;
  manOfMatchColor: string;
  narrative: string[];
  seriesStatus: string | null;
  excitement: number;
}

type DigestCardData = OverGroupCard | SessionCard | DaySummaryCard | MatchSummaryCard;

// ── over-group builder (T20 / ODI / Test fallback) ────────────────────────────

// ── match summary card builder ────────────────────────────────────────────────

const EXCITEMENT_WORDS: Record<number, string> = {
  10: "an all-time classic", 9: "a pulsating thriller", 8: "an enthralling contest",
  7: "a compelling match", 6: "a competitive encounter", 5: "an evenly-fought game",
  4: "a steady contest", 3: "a one-sided affair", 2: "a dominant performance", 1: "a comprehensive win",
};

function getExcitementWord(n?: number): string {
  if (!n) return "a competitive encounter";
  const key = Math.max(1, Math.min(10, Math.round(n)));
  return EXCITEMENT_WORDS[key] ?? "a competitive encounter";
}

function buildMatchNarrative(match: Match): string[] {
  const { result, innings, teamA, teamB, format } = match;
  if (!result) return [];
  const lines: string[] = [];

  // Special results
  if (result.winner === "draw") {
    lines.push("Five days of Test cricket and neither side could land the killer blow.");
    lines.push("Both camps leave with something to build on.");
    if (match.seriesStatus) lines.push(match.seriesStatus);
    return lines;
  }
  if (result.winner === "tie") {
    lines.push("The rarest result in cricket — scoreboard could not separate two evenly-matched sides.");
    if (match.seriesStatus) lines.push(match.seriesStatus);
    return lines;
  }
  if (result.winner === "no-result") {
    lines.push("Match abandoned — the weather had the final say.");
    return lines;
  }

  // Inn 1 — top bat highlight
  const inn1 = innings[0];
  if (inn1?.battingCard.length) {
    const sorted = [...inn1.battingCard].sort((a, b) => b.runs - a.runs);
    const top = sorted[0];
    const second = sorted[1];
    const boundaryStr = [
      top.fours  > 0 ? `${top.fours}×4`  : "",
      top.sixes  > 0 ? `${top.sixes}×6`  : "",
    ].filter(Boolean).join(", ");
    if (top.runs >= 50) {
      lines.push(`${top.playerName}'s ${top.runs} off ${top.ballsFaced}${boundaryStr ? ` (${boundaryStr})` : ""} was the cornerstone of the ${inn1.battingTeam} innings.`);
    } else if (top.runs >= 25) {
      lines.push(`${top.playerName} top-scored with ${top.runs}${second && second.runs >= 20 ? `; ${second.playerName} supported with ${second.runs}` : ""}.`);
    }
    if (second && second.runs >= 35 && second.runs < top.runs) {
      lines.push(`${second.playerName} chipped in a crucial ${second.runs} off ${second.ballsFaced}.`);
    }
  }

  // Best bowler across all innings
  const allBowlers = innings.flatMap(inn =>
    inn.bowlingCard.map(b => ({
      ...b,
      teamColor: inn.bowlingTeam === teamA.code ? teamA.primaryColor : teamB.primaryColor,
    }))
  );
  const topBowler = allBowlers.sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)[0];
  if (topBowler && topBowler.wickets >= 2) {
    const flair = topBowler.wickets >= 5 ? "five-for" :
                  topBowler.wickets >= 4 ? "four-wicket haul" :
                  topBowler.wickets >= 3 ? "three-wicket burst" : "two key wickets";
    lines.push(`${topBowler.playerName} — ${topBowler.wickets}/${topBowler.runsConceded} (${topBowler.economy.toFixed(1)} econ) — the ${flair} that tilted the match.`);
  }

  // Inn 2 — chase / defence story
  if (format !== "Test" && innings.length >= 2) {
    const inn2 = innings[1];
    const target = inn1 ? inn1.runs + 1 : 0;
    const chased = inn2.runs >= target;
    const topChaser = inn2.battingCard.length
      ? [...inn2.battingCard].sort((a, b) => b.runs - a.runs)[0] : null;
    if (chased && topChaser && topChaser.runs >= 20) {
      lines.push(`${topChaser.playerName}'s ${topChaser.runs} off ${topChaser.ballsFaced} anchored the chase — ${inn2.battingTeam} got home with ${10 - inn2.wickets} wickets in hand.`);
    } else if (!chased) {
      lines.push(`${inn2.battingTeam} fell ${target - inn2.runs} short — the bowling attack held its nerve in the final overs.`);
    }
  } else if (format === "Test" && innings.length >= 3) {
    const declaredAny = innings.some(i => i.declared);
    if (declaredAny) lines.push(`Declarations shaped the tactics — captains gambled and the pitch rewarded the bold.`);
  }

  // Series / MOM
  if (result.manOfMatch) {
    lines.push(`${result.manOfMatch} named Player of the Match.`);
  }
  if (match.seriesStatus) lines.push(match.seriesStatus);

  return lines.slice(0, 6);
}

function buildMatchSummaryCard(match: Match): MatchSummaryCard | null {
  if (!match.result) return null;
  const { result, innings, teamA, teamB } = match;

  const winnerColor = result.winner === teamA.code ? teamA.primaryColor :
                      result.winner === teamB.code ? teamB.primaryColor : "#94A3B8";
  const loserColor  = result.winner === teamA.code ? teamB.primaryColor :
                      result.winner === teamB.code ? teamA.primaryColor : "#94A3B8";

  const inningsScores = innings.map(inn => ({
    label: inn.number > 2
      ? `${inn.battingTeam} (${inn.number === 3 ? "3rd" : "4th"} Inn)`
      : inn.battingTeam,
    runs: inn.runs, wickets: inn.wickets, overs: inn.overs,
    declared: inn.declared ?? false,
    teamColor: inn.battingTeam === teamA.code ? teamA.primaryColor : teamB.primaryColor,
    batting: true,
  }));

  // Top bat: highest runs across all innings batting cards
  const allBatters = innings.flatMap(inn =>
    inn.battingCard.map(b => ({
      ...b,
      teamColor: inn.battingTeam === teamA.code ? teamA.primaryColor : teamB.primaryColor,
    }))
  );
  const topBatEntry = allBatters.sort((a, b) => b.runs - a.runs)[0] ?? null;
  const topBat = topBatEntry ? {
    name: topBatEntry.playerName, runs: topBatEntry.runs, balls: topBatEntry.ballsFaced,
    fours: topBatEntry.fours, sixes: topBatEntry.sixes, sr: topBatEntry.strikeRate,
    teamColor: topBatEntry.teamColor,
  } : null;

  // Top bowl: most wickets across all innings bowling cards
  const allBowlers = innings.flatMap(inn =>
    inn.bowlingCard.map(b => ({
      ...b,
      teamColor: inn.bowlingTeam === teamA.code ? teamA.primaryColor : teamB.primaryColor,
    }))
  );
  const topBowlEntry = allBowlers.sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)[0] ?? null;
  const topBowl = topBowlEntry && topBowlEntry.wickets > 0 ? {
    name: topBowlEntry.playerName, wickets: topBowlEntry.wickets,
    runs: topBowlEntry.runsConceded, economy: topBowlEntry.economy,
    teamColor: topBowlEntry.teamColor,
  } : null;

  // Derive MOM team color — find which innings batting card the MOM appears in
  let manOfMatchColor = winnerColor;
  if (result.manOfMatch) {
    const momName = result.manOfMatch.toLowerCase();
    for (const inn of innings) {
      const found = inn.battingCard.some(b =>
        b.playerName.toLowerCase().includes(momName) ||
        momName.includes(b.playerName.toLowerCase().split(" ").pop() ?? "")
      );
      if (found) {
        manOfMatchColor = inn.battingTeam === teamA.code ? teamA.primaryColor : teamB.primaryColor;
        break;
      }
    }
  }

  return {
    kind: "match-summary",
    id: `match-summary-${match.id}`,
    format: match.format,
    resultLine: result.margin
      ? `${result.winner === teamA.code ? teamA.fullName : result.winner === teamB.code ? teamB.fullName : String(result.winner)} won ${result.margin}`
      : String(result.winner),
    winner: result.winner,
    winnerColor, loserColor,
    inningsScores,
    topBat, topBowl,
    manOfMatch: result.manOfMatch ?? null,
    manOfMatchPhotoUrl: (() => {
      if (!result.manOfMatch) return null;
      const slug = slugifyPlayer(result.manOfMatch);
      return (PLAYERS[slug] as { photoUrl?: string })?.photoUrl ?? null;
    })(),
    manOfMatchColor,
    narrative: buildMatchNarrative(match),
    seriesStatus: match.seriesStatus ?? null,
    excitement: match.excitement ?? 5,
  };
}

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
    const teamColor = inn.battingTeam === match.teamA.code
      ? match.teamA.primaryColor : match.teamB.primaryColor;

    const firstOver = completedOverNums[0];
    const lastOver  = completedOverNums[completedOverNums.length - 1];

    for (let chunkStart = firstOver; chunkStart <= lastOver; chunkStart += gs) {
      const chunkEnd  = chunkStart + gs - 1;
      const chunkOvers = completedOverNums.filter(n => n >= chunkStart && n <= chunkEnd);
      if (chunkOvers.length === 0) continue;
      if (gs > 1 && lastOver < chunkStart + gs - 1) continue;

      const chunkBalls = chunkOvers.flatMap(n => byOver.get(n) ?? []);
      if (chunkBalls.length === 0) continue;

      const runs    = chunkBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = chunkBalls.filter(b => b.isWicket).length;
      const fours   = chunkBalls.filter(b => b.isBoundary4).length;
      const sixes   = chunkBalls.filter(b => b.isBoundary6).length;
      const keyBall    = pickKeyBall(chunkBalls);
      const bowlerName = dominantBowler(chunkBalls);
      const legal      = legalBalls(chunkBalls);
      const label = gs === 1 ? `Over ${chunkStart}` : `Overs ${chunkStart}–${Math.min(chunkEnd, lastOver)}`;

      result.push({
        kind: "over-group", id: `inn${inn.number}-over${chunkStart}`,
        inningsNumber: inn.number, label, inningsLabel, teamColor, runs, wickets, fours, sixes,
        allBalls: chunkBalls, legalDeliveries: legal, keyBall, bowlerName,
        narrative: buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, match.format),
        overSummary: buildOverSummary(runs, wickets, fours, sixes, bowlerName, keyBall, chunkStart),
        gs,
      });
    }
  }
  return result.reverse();
}

// ── session-based builder (Test) ──────────────────────────────────────────────

function buildTestSessionCards(match: Match, allBalls: Ball[], isLive: boolean): DigestCardData[] {
  const dayMap = new Map<number, SessionEntry[]>();
  const inningsCount = match.innings.length;
  const ordinals = ["1st", "2nd", "3rd", "4th"];

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

    const allOverNums = [...byOver.keys()].sort((a, b) => a - b);
    if (allOverNums.length === 0) continue;

    const isLastInn = innIdx === inningsCount - 1;
    const lastOverNum    = allOverNums[allOverNums.length - 1];
    const lastOverBalls  = byOver.get(lastOverNum) ?? [];
    const completedOverNums =
      isLive && isLastInn && legalBalls(lastOverBalls).length < 6
        ? allOverNums.slice(0, -1)
        : allOverNums;

    const inningsLabel = inningsCount > 1 ? `${ordinals[inn.number - 1]} Inn` : "";
    const teamColor    = inn.battingTeam === match.teamA.code
      ? match.teamA.primaryColor : match.teamB.primaryColor;

    // Use explicit sessions if available, else derive from timestamps
    const sessions: TestSession[] =
      inn.sessions && inn.sessions.length > 0
        ? inn.sessions
        : deriveTestSessions(innBalls, match.startTimeIso, isLive && isLastInn);
    if (sessions.length === 0) continue;

    for (const sess of sessions) {
      const sessOvers = completedOverNums.filter(
        n => n >= sess.startOver && n <= sess.endOver
      );
      if (sessOvers.length === 0) continue;

      const sessBalls = sessOvers.flatMap(n => byOver.get(n) ?? []);
      if (sessBalls.length === 0) continue;

      const runs    = sessBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = sessBalls.filter(b => b.isWicket).length;
      const fours   = sessBalls.filter(b => b.isBoundary4).length;
      const sixes   = sessBalls.filter(b => b.isBoundary6).length;
      const keyBall    = pickKeyBall(sessBalls);
      const bowlerName = dominantBowler(sessBalls);
      const firstOver  = sessOvers[0];
      const lastOver   = sessOvers[sessOvers.length - 1];
      const sessIdx    = ["first", "second", "third"].indexOf(sess.session);

      const card: SessionCard = {
        kind: "session",
        id: `sess-inn${inn.number}-day${sess.day}-${sess.session}`,
        day: sess.day,
        sessionLabel: sess.label,
        overRange: `Overs ${firstOver}–${lastOver}`,
        inningsLabel, teamColor, runs, wickets, fours, sixes,
        allBalls: sessBalls, keyBall, bowlerName,
        narrative:    buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, "Test"),
        overSummary:  buildOverSummary(runs, wickets, fours, sixes, bowlerName, keyBall, sess.day * 3 + sessIdx),
        isLiveSession: !sess.isComplete,
      };

      const dayEntries = dayMap.get(sess.day) ?? [];
      dayEntries.push({ sess, card });
      dayMap.set(sess.day, dayEntries);
    }
  }

  // Build oldest-first: sessions in chronological order, Day Report after each complete day
  const result: DigestCardData[] = [];
  const days = [...dayMap.keys()].sort((a, b) => a - b);

  for (const day of days) {
    const entries = dayMap.get(day)!;
    const order = ["first", "second", "third"];
    entries.sort((a, b) => order.indexOf(a.sess.session) - order.indexOf(b.sess.session));

    for (const { card } of entries) result.push(card);

    const allComplete = entries.every(e => e.sess.isComplete);
    if (allComplete) {
      const totalRuns    = entries.reduce((s, e) => s + e.card.runs, 0);
      const totalWickets = entries.reduce((s, e) => s + e.card.wickets, 0);

      const daySummary: DaySummaryCard = {
        kind: "day-summary", id: `day-summary-${day}`, day,
        sessionRows: entries.map(e => ({
          label: e.sess.label,
          inningsLabel: e.card.inningsLabel,
          runs: e.card.runs,
          wickets: e.card.wickets,
          teamColor: e.card.teamColor,
        })),
        totalRuns, totalWickets,
        report: buildDayReport(day, entries, false),
      };
      result.push(daySummary);
    }
  }

  return result.reverse(); // newest-first
}

// ── top-level builder ─────────────────────────────────────────────────────────

function buildCards(match: Match, allBalls: Ball[], isLive: boolean): DigestCardData[] {
  let cards: DigestCardData[] = [];
  if (match.format === "Test") {
    const sessionCards = buildTestSessionCards(match, allBalls, isLive);
    if (sessionCards.length > 0) cards = sessionCards;
    else cards = buildOverGroupCards(match, allBalls, isLive);
  } else {
    cards = buildOverGroupCards(match, allBalls, isLive);
  }
  // Prepend match summary card (pinned at top, post-match only)
  const summary = buildMatchSummaryCard(match);
  if (summary) cards = [summary, ...cards];
  return cards;
}

// ── sub-components ───────────────────────────────────────────────────────────

function BallDot({ ball }: { ball: Ball }) {
  let bg = "bg-white/10", textColor = "text-text-dim", content = "·";
  if (ball.isWicket)     { bg = "bg-wicket/25";   textColor = "text-wicket";   content = "W"; }
  else if (ball.isBoundary6) { bg = "bg-six/25";  textColor = "text-six";      content = "6"; }
  else if (ball.isBoundary4) { bg = "bg-boundary/25"; textColor = "text-boundary"; content = "4"; }
  else if (ball.runs > 0)    { bg = "bg-white/12"; textColor = "text-text-secondary"; content = String(ball.runs); }
  return (
    <div className={`w-[17px] h-[17px] rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className={`text-[8px] font-bold leading-none ${textColor}`}>{content}</span>
    </div>
  );
}

function OverGroupCardView({ card }: { card: OverGroupCard }) {
  const kb = card.keyBall;
  const keyLabel = kb ? `${kb.over}.${kb.ballInOver + 1}${kb.isWicket ? " · OUT" : kb.isBoundary6 ? " · SIX" : kb.isBoundary4 ? " · FOUR" : ""}` : "";
  const showDots = card.gs === 1;

  return (
    <div className="card overflow-hidden" data-digest-card>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.teamColor }} />
        {card.inningsLabel && <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">{card.inningsLabel}</span>}
        <span className="text-[10px] font-extrabold text-text-primary">{card.label}</span>
        <div className="flex-1" />
        <span className="text-[10px] font-extrabold num text-text-primary">{card.runs}r</span>
        {card.wickets > 0 && <span className="text-[10px] font-extrabold num text-wicket ml-1">{card.wickets}w</span>}
        {card.fours > 0   && <span className="text-[10px] font-bold num text-boundary ml-1">{card.fours}×4</span>}
        {card.sixes > 0   && <span className="text-[10px] font-bold num text-six ml-1">{card.sixes}×6</span>}
      </div>
      <div className="flex items-center gap-2 px-3 pb-2">
        {showDots && (
          <div className="flex items-center gap-0.5 shrink-0">
            {card.legalDeliveries.map(b => <BallDot key={b.id} ball={b} />)}
          </div>
        )}
        <p className="text-[10px] text-text-dim leading-snug truncate flex-1 min-w-0">{card.narrative}</p>
      </div>
      <div className="flex items-start gap-2 px-3 pt-2 pb-2.5 border-t border-line/50">
        <p className="text-[11px] text-text-secondary leading-snug flex-1">{card.overSummary}</p>
        <ShareButton label={card.label} />
      </div>
    </div>
  );
}

function SessionCardView({ card }: { card: SessionCard }) {
  const kb = card.keyBall;
  const keyLabel = kb ? `${kb.over}.${kb.ballInOver + 1}${kb.isWicket ? " · OUT" : kb.isBoundary6 ? " · SIX" : kb.isBoundary4 ? " · FOUR" : ""}` : "";

  return (
    <div className="card overflow-hidden" data-digest-card>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.teamColor }} />
        {card.inningsLabel && <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">{card.inningsLabel}</span>}
        <span className="text-[10px] font-extrabold text-text-primary">{card.sessionLabel}</span>
        {card.isLiveSession && (
          <span className="text-[8px] font-bold uppercase tracking-widest text-live bg-live/15 px-1.5 py-0.5 rounded-full">Live</span>
        )}
        <div className="flex-1" />
        <span className="text-[10px] font-extrabold num text-text-primary">{card.runs}r</span>
        {card.wickets > 0 && <span className="text-[10px] font-extrabold num text-wicket ml-1">{card.wickets}w</span>}
        {card.fours > 0   && <span className="text-[10px] font-bold num text-boundary ml-1">{card.fours}×4</span>}
        {card.sixes > 0   && <span className="text-[10px] font-bold num text-six ml-1">{card.sixes}×6</span>}
      </div>
      <div className="flex items-center gap-2 px-3 pb-2">
        <span className="text-[9px] text-text-dim shrink-0">{card.overRange}</span>
        <span className="text-text-dim/40 text-[9px]">·</span>
        <p className="text-[10px] text-text-dim leading-snug truncate flex-1 min-w-0">{card.narrative}</p>
      </div>
      <div className="flex items-start gap-2 px-3 pt-2 pb-2.5 border-t border-line/50">
        <p className="text-[11px] text-text-secondary leading-snug flex-1">{card.overSummary}</p>
        <ShareButton label={card.sessionLabel} />
      </div>
    </div>
  );
}

function DaySummaryCardView({ card }: { card: DaySummaryCard }) {
  // Detect duplicate session names (two innings in same session slot)
  const labelCounts = card.sessionRows.reduce(
    (acc, r) => { acc[r.label] = (acc[r.label] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );
  const sessionBreakdown = card.sessionRows
    .map(r => {
      const short  = r.label.split(" ").slice(2).join(" ");
      const suffix = labelCounts[r.label] > 1 && r.inningsLabel ? ` (${r.inningsLabel})` : "";
      return `${short}${suffix}: ${r.runs}/${r.wickets}`;
    })
    .join("  ·  ");

  return (
    <div className="rounded-xl overflow-hidden border border-cyan/20 bg-surface-2/80 backdrop-blur-sm" data-digest-card>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-cyan/6 border-b border-cyan/15">
        <div className="flex items-center gap-1">
          {card.sessionRows.slice(0, 3).map((r, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: r.teamColor }} />
          ))}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan">
          Day {card.day} · Stumps
        </span>
        <div className="flex-1" />
        <span className="text-[12px] font-extrabold num text-text-primary">{card.totalRuns}r</span>
        {card.totalWickets > 0 && (
          <span className="text-[12px] font-extrabold num text-wicket ml-1">{card.totalWickets}w</span>
        )}
        <ShareButton label={`Day ${card.day} Stumps`} />
      </div>

      {/* Session breakdown row */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[9px] text-text-dim tracking-wide">{sessionBreakdown}</p>
      </div>

      {/* 5-7 line match report */}
      <div className="px-3 pb-3 pt-1 space-y-2 border-t border-line/30 mt-1.5">
        {card.report.map((line, i) => (
          <p
            key={i}
            className={`leading-snug ${
              i === 0
                ? "text-[12px] font-semibold text-text-primary"
                : i === card.report.length - 1
                ? "text-[11px] text-cyan/80 italic"
                : "text-[11px] text-text-secondary"
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── MatchSummaryCardView ─────────────────────────────────────────────────────

function MatchSummaryCardView({ card }: { card: MatchSummaryCard }) {
  const isSpecial = card.excitement >= 8;

  return (
    <div
      className="rounded-xl overflow-hidden border border-line/40"
      style={{ borderTopColor: card.winnerColor, borderTopWidth: 2 }}
      data-digest-card
    >
      {/* ── Header ── */}
      <div
        className="px-3 pt-3 pb-2.5 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${card.winnerColor}18 0%, transparent 70%)` }}
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-black uppercase tracking-[0.15em] px-1.5 py-0.5 rounded"
              style={{ background: `${card.winnerColor}28`, color: card.winnerColor }}
            >
              {card.format} · Full Time
            </span>
            {isSpecial && (
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded">
                🏆 Classic
              </span>
            )}
          </div>
          <p
            className="text-[15px] font-black leading-tight mt-1"
            style={{ color: card.winnerColor }}
          >
            {card.resultLine}
          </p>
        </div>
        <ShareButton label={`Match-Summary`} />
      </div>

      {/* ── Innings scoreline ── */}
      <div className="px-3 pb-2.5 flex flex-col gap-1 border-b border-line/30">
        {card.inningsScores.map((inn, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: inn.teamColor }} />
              <span className="text-[11px] font-bold text-text-secondary">{inn.label}</span>
              {inn.declared && (
                <span className="text-[8px] font-black text-amber-400/80 uppercase tracking-wider">d</span>
              )}
            </div>
            <span className="text-[13px] font-black num text-text-primary">
              {inn.runs}<span className="text-text-dim font-semibold text-[11px]">/{inn.wickets}</span>
              <span className="text-[10px] font-medium text-text-dim ml-1.5">({inn.overs} ov)</span>
            </span>
          </div>
        ))}
      </div>

      {/* ── Top performers ── */}
      <div className="px-3 py-2.5 flex gap-3 border-b border-line/30">
        {card.topBat && (
          <div className="flex-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-text-dim mb-1">Top Bat</p>
            <p className="text-[12px] font-black text-text-primary truncate">{card.topBat.name}</p>
            <p className="text-[10px] font-semibold num" style={{ color: card.topBat.teamColor }}>
              {card.topBat.runs}
              <span className="text-text-dim font-medium"> off {card.topBat.balls}</span>
              {card.topBat.fours > 0 && <span className="text-boundary ml-1.5">{card.topBat.fours}×4</span>}
              {card.topBat.sixes > 0 && <span className="text-six ml-1">{card.topBat.sixes}×6</span>}
            </p>
          </div>
        )}
        {card.topBat && card.topBowl && (
          <div className="w-px bg-line/40 self-stretch" />
        )}
        {card.topBowl && (
          <div className="flex-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-text-dim mb-1">Top Bowl</p>
            <p className="text-[12px] font-black text-text-primary truncate">{card.topBowl.name}</p>
            <p className="text-[10px] font-semibold num" style={{ color: card.topBowl.teamColor }}>
              {card.topBowl.wickets}/{card.topBowl.runs}
              <span className="text-text-dim font-medium ml-1.5">· Econ {card.topBowl.economy.toFixed(1)}</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Man of Match ── */}
      {card.manOfMatch && (
        <div className="px-3 py-2.5 border-b border-line/30 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-[10px] font-black"
            style={{
              background: `${card.manOfMatchColor}28`,
              border: `1.5px solid ${card.manOfMatchColor}70`,
              color: card.manOfMatchColor,
            }}
          >
            {card.manOfMatchPhotoUrl ? (
              <img
                src={card.manOfMatchPhotoUrl}
                alt={card.manOfMatch ?? ""}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.parentElement as HTMLElement).dataset.fallback = "true";
                }}
              />
            ) : null}
            <span className={card.manOfMatchPhotoUrl ? "hidden" : ""}>
              {initials(card.manOfMatch)}
            </span>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 mb-0.5">Player of the Match</p>
            <p className="text-[12px] font-bold text-text-primary">{card.manOfMatch}</p>
          </div>
        </div>
      )}

      {/* ── Narrative — bullet points ── */}
      <div className="px-3 pt-2.5 pb-3 space-y-2.5">
        {card.narrative.map((line, i) => {
          const isSeriesLine = i === card.narrative.length - 1 && !!card.seriesStatus;
          return (
            <div key={i} className="flex items-start gap-2">
              <span
                className="mt-[5px] w-[5px] h-[5px] rounded-full shrink-0"
                style={{ background: isSeriesLine ? "var(--tw-cyan, #00E5FF)" : card.winnerColor }}
              />
              <p className={`flex-1 leading-snug ${
                isSeriesLine
                  ? "text-[10px] text-cyan/80 italic"
                  : "text-[11px] text-text-secondary"
              }`}>
                {line}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day filter chips ─────────────────────────────────────────────────────────

function DayChips({
  days,
  activeDay,
  onSelect,
}: {
  days: number[];
  activeDay: number;
  onSelect: (day: number) => void;
}) {
  if (days.length <= 1) return null;
  return (
    <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
      {days.map(day => (
        <button
          key={day}
          onClick={() => onSelect(day)}
          className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            day === activeDay
              ? "bg-cyan text-bg-base border-cyan"
              : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
          }`}
        >
          Day {day}
        </button>
      ))}
    </div>
  );
}

// ── Innings filter chips (non-Test) ─────────────────────────────────────────

const INN_LABEL: Record<number, string> = { 1: "1st Innings", 2: "2nd Innings", 3: "3rd Innings", 4: "4th Innings" };

function InningsChips({
  innings,
  activeInn,
  onSelect,
}: {
  innings: number[];
  activeInn: number;
  onSelect: (inn: number) => void;
}) {
  if (innings.length <= 1) return null;
  return (
    <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
      {innings.map(inn => (
        <button
          key={inn}
          onClick={() => onSelect(inn)}
          className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            inn === activeInn
              ? "bg-cyan text-bg-base border-cyan"
              : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
          }`}
        >
          {INN_LABEL[inn] ?? `Innings ${inn}`}
        </button>
      ))}
    </div>
  );
}

// ── main export ───────────────────────────────────────────────────────────────

interface Props {
  match: Match;
  allBalls: Ball[];
}

export default function DigestTab({ match, allBalls }: Props) {
  const isLive = match.status === "live";
  const isTest = match.format === "Test";

  const cards = useMemo(
    () => buildCards(match, allBalls, isLive),
    [match, allBalls, isLive]
  );

  // Derive available days (Test only)
  const availableDays = useMemo(() => {
    if (!isTest) return [];
    const days = new Set<number>();
    for (const c of cards) {
      if (c.kind === "session")     days.add(c.day);
      if (c.kind === "day-summary") days.add(c.day);
    }
    return [...days].sort((a, b) => a - b);
  }, [cards, isTest]);

  // Derive available innings (non-Test only)
  const availableInnings = useMemo(() => {
    if (isTest) return [];
    const inns = new Set<number>();
    for (const c of cards) {
      if (c.kind === "over-group") inns.add(c.inningsNumber);
    }
    return [...inns].sort((a, b) => a - b);
  }, [cards, isTest]);

  // Default to the latest day / innings with data
  const latestDay     = availableDays[availableDays.length - 1] ?? null;
  const latestInnings = availableInnings[availableInnings.length - 1] ?? null;

  const [selectedDay,     setSelectedDay]     = useState<number | null>(null);
  const [selectedInnings, setSelectedInnings] = useState<number | null>(null);

  const activeDay     = selectedDay     ?? latestDay;
  const activeInnings = selectedInnings ?? latestInnings;

  // Filter cards by selected day (Test) or innings (non-Test)
  const visibleCards = useMemo(() => {
    if (isTest) {
      if (activeDay === null) return cards;
      return cards.filter(c => {
        if (c.kind === "match-summary") return true;  // always pinned
        if (c.kind === "session")     return c.day === activeDay;
        if (c.kind === "day-summary") return c.day === activeDay;
        return true;
      });
    }
    // non-Test: filter by innings
    if (activeInnings === null) return cards;
    return cards.filter(c =>
      c.kind === "match-summary" ||                           // always pinned
      (c.kind === "over-group" && c.inningsNumber === activeInnings)
    );
  }, [cards, isTest, activeDay, activeInnings]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-16 gap-2 text-center px-6">
        <p className="text-sm font-bold text-text-primary">No digest yet</p>
        <p className="text-xs text-text-dim">Cards appear as each session completes</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Day filter chips — Test only, shown when multiple days available */}
      {isTest && availableDays.length > 1 && (
        <DayChips
          days={availableDays}
          activeDay={activeDay!}
          onSelect={day => setSelectedDay(day === activeDay ? null : day)}
        />
      )}

      {/* Innings chips — non-Test, shown when both innings have cards */}
      {!isTest && availableInnings.length > 1 && (
        <InningsChips
          innings={availableInnings}
          activeInn={activeInnings!}
          onSelect={inn => setSelectedInnings(inn)}
        />
      )}

      <div className="space-y-2">
        {visibleCards.map(card => {
          if (card.kind === "match-summary")
            return <MatchSummaryCardView key={card.id} card={card} />;
          if (card.kind === "day-summary")
            return <DaySummaryCardView key={card.id} card={card} />;
          if (card.kind === "session")
            return <SessionCardView key={card.id} card={card} />;
          return <OverGroupCardView key={card.id} card={card} />;
        })}
      </div>
    </div>
  );
}
