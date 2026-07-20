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

import React, { useMemo, useRef, useState } from "react";
import { Match, Ball, MatchFormat, Innings, TestSession } from "@/lib/types";
import { deriveTestSessions } from "@/lib/transformers";
import { teamInningsOccurrence, ordinal } from "@/lib/formatUtils";
import { PLAYERS, slugifyPlayer, getPlayerShortName } from "@/lib/mockData";
import { NarrativeThresholds, getNarrativeThresholds } from "@/lib/narrativeThresholds";

// ============================================================================
// Notable-vs-routine drama gates
// ============================================================================
// Mirrors lib/spotlight.ts's philosophy: clearing ONE explicit, concrete
// condition, not accumulating points toward a composite "excitement" score.
// Reuses the SAME NarrativeThresholds values already driving the narrative
// copy (single source of truth) rather than introducing a second, separate
// set of tuning numbers. The gate only decides whether a card gets a subtle
// accent (see the *CardView components below) — never a badge/emoji, and
// never louder than what Spotlight itself uses elsewhere on the platform.
// ============================================================================

function isNotableOverGroup(runs: number, wickets: number, t: NarrativeThresholds["overSummary"]): boolean {
  return wickets >= t.wicketsCollapse || runs >= t.runsHugeOver;
}

function isNotableSession(runs: number, wickets: number, t: NarrativeThresholds["dayReport"]): boolean {
  return wickets >= t.sessionDominantBowlingWickets || runs >= t.sessionDominantBattingRuns;
}

function isNotableDay(totalRuns: number, totalWickets: number, totalFours: number, totalSixes: number, t: NarrativeThresholds["dayReport"]): boolean {
  return (
    totalWickets >= t.bowlerMasterclassWickets ||
    totalWickets === 0 ||
    totalFours + totalSixes >= t.boundaryHeavyCount
  );
}

// Cache of already-finalized cards, keyed by card id, shared across
// recomputations of the SAME match (see the useRef in the DigestTab
// component below). Completed sessions/days/over-chunks never change once
// built, so a cache hit skips re-processing that card's balls and
// re-generating its narrative entirely on the next live tick — only new or
// still-in-progress cards get (re)computed. See buildTestSessionCards /
// buildOverGroupCards for how entries are read and written.
export type DigestCardCache = Map<string, DigestCardData>;

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

// Real-data readiness fix: this used to split the full name on spaces and
// take the last token, which breaks on real multi-part surnames ("de Silva",
// "van der Dussen"). It now delegates to the PLAYERS registry's explicit
// `shortName` field (see getPlayerShortName in lib/mockData.ts) and falls
// back to the untouched full name — never a guessed split — when a player
// isn't in the local registry.
function lastName(fullName: string | null | undefined): string {
  return getPlayerShortName(fullName);
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
  bowler: string, keyBall: Ball | null, format: MatchFormat,
  t: NarrativeThresholds["narrative"] = getNarrativeThresholds().narrative
): string {
  const span = format === "ODI" ? "block" : format === "Test" ? "session" : "over";
  const big  = format === "ODI" ? t.bigOverRunsODI : format === "Test" ? t.bigOverRunsTest : t.bigOverRunsDefault;

  if (runs === 0 && wickets === 0) return `${lastName(bowler)} maiden`;
  if (wickets >= t.wicketsCollapse) return `${wickets} wickets — collapse!`;
  if (wickets === 2) return `Two wickets, ${runs} conceded`;
  if (runs >= big)
    return sixes >= t.sixesInFlow ? `${sixes} sixes, ${fours} fours — carnage` : `Big ${span} — ${runs} runs`;
  if (wickets === 1 && runs >= t.runsWithWicketNotable) return `${runs} & a wicket — ${lastName(bowler)}`;
  if (wickets === 1) return `${lastName(bowler)} strikes`;
  if (sixes >= t.sixesInFlow) return `${sixes} sixes — ${lastName(keyBall?.batterName) || 'Batter'} in flow`;
  if (fours >= t.foursFlowing) return `${fours} fours — boundaries flowing`;
  if (runs <= t.tightOverRuns && wickets === 0) return `Tight ${span} — ${runs} conceded`;
  return `${runs} scored`;
}

// ── over summary (row 3 — creative 1-2 lines) ─────────────────────────────────

function buildOverSummary(
  runs: number, wickets: number, fours: number, sixes: number,
  bowlerName: string, keyBall: Ball | null, variant: number,
  t: NarrativeThresholds["overSummary"] = getNarrativeThresholds().overSummary
): string {
  const bowler = lastName(bowlerName) || "Bowler";
  const batter = lastName(keyBall?.batterName) || "Batter";
  const v = ((variant % 3) + 3) % 3;

  if (runs === 0 && wickets === 0)
    return [`${bowler} was unplayable — six balls, not a run to spare.`,
            `A maiden under pressure. ${bowler} made every delivery count.`,
            `Dots all the way. The kind of over that wins matches quietly.`][v];
  if (wickets >= t.wicketsCollapse)
    return [`Three gone — the innings buckled without warning.`,
            `${bowler} went through the lineup. Chaos in the middle.`,
            `A collapse that no batting card can explain. Drama, pure and simple.`][v];
  if (wickets >= t.wicketsSwing)
    return [`Two wickets in quick succession — the game just tilted.`,
            `${bowler} made it look inevitable. Both batters had no answer.`,
            `A partnership ended, another began — the pressure just ratcheted up.`][v];
  if (runs >= t.runsHugeOver)
    return [`${batter} was in another zone entirely — ${runs} off the over, relentless.`,
            `The bowling had no plan. ${batter} had every shot in the book.`,
            `${runs} runs. The crowd barely sat down. This is why you watch cricket.`][v];
  if (runs >= t.runsBigOver)
    return [`${batter} seized the moment — ${runs} and the momentum swings.`,
            `A statement over. ${bowler} will want to forget this one.`,
            `${runs} runs and the game's balance tipped in an instant.`][v];
  if (sixes >= t.sixesInFlow)
    return [`${batter} cleared the ropes twice. ${bowler} had no answers.`,
            `Two sixes — pick a length, they said. ${batter} didn't care either way.`,
            `The big hits arrived on cue. The crowd erupted, and rightly so.`][v];
  if (fours >= t.foursFlowing)
    return [`Boundaries everywhere — ${batter} was in cruise control.`,
            `Three fours: elegant, ruthless, clinical. ${bowler} had no room to hide.`,
            `The scoreboard ticked quickly. ${batter} made it all look effortless.`][v];
  if (wickets === 1)
    return [`One wicket — and the mood in the middle changed instantly.`,
            `${bowler} got the big one. This is where the match could turn.`,
            `${batter} walks back. The questions start. The pressure is real now.`][v];
  if (runs <= t.tightOverRuns)
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

/**
 * Pick a variant by SLOT, not by checking the rendered text for repeats --
 * two sessions landing in the same bucket almost always have different
 * runs/wickets baked into the phrase text (e.g. "116 runs... 5 wickets" vs
 * "32 runs... 6 wickets"), so comparing full rendered strings would treat
 * them as "different" and never actually detect the repeat. `seed` is
 * offset by the day number so which variant lands in "slot 0" also varies
 * day-to-day, not just session-to-session within one day.
 */
function pickPhrase(variants: string[], seed: number): string {
  const idx = ((seed % variants.length) + variants.length) % variants.length;
  return variants[idx];
}

/**
 * Per-session line for the Day Stumps report. Picks a context (rain-
 * shortened / bowling collapse / batting dominance / grinding stalemate /
 * momentum swing / competitive) from what actually happened in THIS
 * session, then a phrase variant within that context. `slotIndex` is this
 * session's position within the day (0 = first session played, 1 =
 * second, ...) -- since it's unique per session within a day, and every
 * bucket below has exactly as many variants as a day can have sessions
 * (3), using it as the variant seed GUARANTEES two sessions in the same
 * day never land on the same variant of the same bucket, without needing
 * to compare rendered text at all.
 */
function buildSessionLine(
  e: SessionEntry,
  t: NarrativeThresholds["dayReport"],
  slotIndex: number
): string {
  const SESS_LABELS: Record<string, string> = { first: "1st Session", second: "2nd Session", third: "3rd Session" };
  const sessName = SESS_LABELS[e.sess.session] ?? e.sess.session;
  const r = e.card.runs;
  const w = e.card.wickets;
  const bl = lastName(e.card.bowlerName);
  const range = e.card.overRange;
  const prefix = `${sessName} (${range}): `;
  const wordWkts = `${w} wicket${w !== 1 ? "s" : ""}`;

  // Weather/bad-light-shortened session takes priority over the run/wicket
  // buckets below -- a handful of overs shouldn't be described as "tight"
  // or "cautious" cricket, it should be described as what it actually was:
  // interrupted play. (This session is only ever passed in here once it's
  // complete, so a low over count reliably means lost time, not "still in
  // progress" -- buildDayReport only runs for fully-ended days.)
  if (e.card.oversInSession < t.shortenedSessionMaxOvers) {
    return prefix + pickPhrase([
      `Interruptions cut this one short — only ${e.card.oversInSession} overs possible, for ${r} runs and ${wordWkts} in the time available.`,
      `A session reduced by the conditions — with just ${e.card.oversInSession} overs bowled, ${r} runs and ${wordWkts} tell only part of the story.`,
      `Play was repeatedly held up here — ${e.card.oversInSession} overs were all that fit in, yielding ${r} runs and ${wordWkts}.`,
    ], slotIndex + e.sess.day);
  }

  if (w >= t.sessionDominantBowlingWickets) {
    return prefix + pickPhrase([
      `Only ${r} runs came in a session dominated by ${bl}, who took ${w} wickets in a spell that dismantled the innings. Brutal and brilliant.`,
      `${bl} ran through the innings — ${w} wickets for ${r} runs, the kind of session that decides a Test match on its own.`,
      `A complete bowling takeover: ${w} wickets, ${r} runs conceded, ${bl} doing most of the damage. The batting side had no answers.`,
    ], slotIndex + e.sess.day);
  }
  if (w >= t.sessionStrongBowlingWickets) {
    return prefix + pickPhrase([
      `${r} runs, ${w} wickets — ${bl} led a sustained bowling effort that put the batting side firmly on the back foot.`,
      `${bl} and the attack chipped away all session — ${w} wickets for ${r} runs, steady pressure rather than one dramatic burst.`,
      `A grinding session for the batting side: ${w} wickets down for ${r}, with ${bl} the pick of the bowlers.`,
    ], slotIndex + e.sess.day);
  }
  if (w === 0 && r >= t.sessionDominantBattingRuns) {
    return prefix + pickPhrase([
      `A dominant batting session — ${r} runs without a single wicket lost. The bowlers toiled, the batters accumulated, and the scoreboard ticked over freely.`,
      `${r} runs, no wickets down — batting of the highest order. The bowling attack had no answer all session.`,
      `The batting side cut loose — ${r} runs added and not a wicket to show for the bowlers' efforts.`,
    ], slotIndex + e.sess.day);
  }
  if (w === 0 && r >= t.sessionSteadyBattingRuns) {
    return prefix + pickPhrase([
      `A steady ${r} runs with the wickets intact. Controlled rather than expansive, but the batting side will take it — no alarms, plenty of runs.`,
      `${r} added, none lost — unspectacular but exactly the kind of session a batting side wants at this stage.`,
      `Solid, unhurried progress: ${r} runs, all ten wickets still standing at the other end.`,
    ], slotIndex + e.sess.day);
  }
  if (w === 0) {
    return prefix + pickPhrase([
      `Just ${r} runs, no wickets. A grinding, cautious session — the bowlers were tight, the batters were patient, and neither side truly dominated.`,
      `A genuine stalemate — ${r} runs, no wickets, both sides content to wait the other out.`,
      `Little to separate the sides here: ${r} runs added, nothing given away by either the bat or the ball.`,
    ], slotIndex + e.sess.day);
  }
  if (r <= t.sessionSwingMaxRuns && w >= t.sessionSwingMinWickets) {
    return prefix + pickPhrase([
      `A session that swung the match — ${w} wickets for only ${r} runs. The batting side lost their way, and ${bl} made them pay.`,
      `The momentum flipped here: ${r} runs, ${w} wickets, and suddenly a different side looks on top.`,
      `${w} wickets for ${r} runs — a session that will be remembered as the turning point of this Test.`,
    ], slotIndex + e.sess.day);
  }
  return prefix + pickPhrase([
    `${r} runs, ${wordWkts} — a competitive session where both sides had their moments and no one could fully take charge.`,
    `An even session: ${r} runs, ${wordWkts}, honours roughly shared between bat and ball.`,
    `Nothing decisive either way — ${r} runs added for ${wordWkts} lost, the match ticking along.`,
  ], slotIndex + e.sess.day);
}

function buildDayReport(
  day: number,
  entries: SessionEntry[],
  isCurrentDay: boolean,
  t: NarrativeThresholds["dayReport"] = getNarrativeThresholds().dayReport
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
  if (totalWickets >= t.bowlerMasterclassWickets) {
    lines.push([
      `Day ${day} was a bowler's masterclass — ${totalWickets} wickets fell for ${totalRuns} runs across a dramatic day's play.`,
      `Wickets, drama, and relentless pressure defined Day ${day}: ${totalWickets} down, ${totalRuns} scored. A day the batting side would rather forget.`,
      `${totalWickets} wickets and ${totalRuns} runs summed up a Day ${day} that belonged entirely to the bowlers.`,
    ][v]);
  } else if (totalWickets <= t.battersParadiseMaxWickets) {
    lines.push([
      `Day ${day} was a batter's paradise — ${totalRuns} runs flowed with barely a scare, as the bowling attacks toiled without reward.`,
      `The bowlers had a long and thankless Day ${day}: ${totalRuns} scored, only ${totalWickets} wickets conceded. A commanding display of batting.`,
      `${totalRuns} runs and just ${totalWickets} wicket${totalWickets !== 1 ? "s" : ""} lost on Day ${day} — the kind of day that changes the shape of a Test match.`,
    ][v]);
  } else if (totalWickets >= t.daySwungWickets) {
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
  // Each session's position in `entries` (already sorted first/second/third)
  // is passed as its variant slot -- see buildSessionLine/pickPhrase for why
  // that's used instead of checking rendered text for repeats.
  entries.forEach((e, slotIndex) => {
    lines.push(buildSessionLine(e, t, slotIndex));
  });

  // ── Line 5: Star bowler ──────────────────────────────────────────────────
  if (topBowlerWkts >= t.starBowlerWickets) {
    lines.push([
      `${topBowler} was the story of the day — ${topBowlerWkts} wickets, each one a piece of high-quality bowling that the batter could do little about. A performance that will be remembered.`,
      `The standout individual: ${topBowler} with ${topBowlerWkts} wickets. Relentless, accurate, and utterly unplayable at times. A spell that shifted the entire match.`,
      `${topBowler} put his name all over this day. ${topBowlerWkts} wickets and a performance that reminded everyone why he's among the best in the world right now.`,
    ][v]);
  } else if (topBowlerWkts >= t.goodBowlerWickets) {
    lines.push([
      `${topBowler} was the pick of the bowlers with ${topBowlerWkts} wickets — combining consistency, movement, and the odd delivery that was simply too good.`,
      `If one bowler stood out, it was ${topBowler}: ${topBowlerWkts} wickets and a performance that showed exactly why he's trusted in Test conditions.`,
      `${topBowler} led the attack with ${topBowlerWkts} wickets, bowling with the kind of discipline that forces mistakes even from well-set batters.`,
    ][v]);
  } else if (totalFours + totalSixes >= t.boundaryHeavyCount) {
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
  } else if (totalWickets >= t.matchTiltedWickets) {
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

export interface OverGroupCard {
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
  /** Clears an explicit drama bar (see isNotableOverGroup) — subtle visual accent, not a badge. */
  isNotable: boolean;
}

export interface SessionCard {
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
  /** Overs actually bowled in this session — used to detect a weather/bad-light-shortened session. */
  oversInSession: number;
  /** Clears an explicit drama bar (see isNotableSession) — subtle visual accent, not a badge. */
  isNotable: boolean;
}

export interface DaySummaryCard {
  kind: "day-summary";
  id: string;
  day: number;
  sessionRows: { label: string; inningsLabel: string; runs: number; wickets: number; teamColor: string }[];
  totalRuns: number;
  totalWickets: number;
  report: string[];         // 5-7 line match report
  /** Clears an explicit drama bar (see isNotableDay) — subtle visual accent, not a badge. */
  isNotable: boolean;
}

export interface MatchSummaryCard {
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

export type DigestCardData = OverGroupCard | SessionCard | DaySummaryCard | MatchSummaryCard;

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
    label: teamInningsOccurrence(innings, inn) > 1
      ? `${inn.battingTeam} (2nd Inn)`
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

export function buildOverGroupCards(
  match: Match, allBalls: Ball[], isLive: boolean,
  cache?: DigestCardCache,
  t: NarrativeThresholds = getNarrativeThresholds()
): OverGroupCard[] {
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

    const inningsLabel = inningsCount > 1 ? `${ordinal(teamInningsOccurrence(match.innings, inn))} Inn` : "";
    const teamColor = inn.battingTeam === match.teamA.code
      ? match.teamA.primaryColor : match.teamB.primaryColor;

    const firstOver = completedOverNums[0];
    const lastOver  = completedOverNums[completedOverNums.length - 1];

    for (let chunkStart = firstOver; chunkStart <= lastOver; chunkStart += gs) {
      const chunkEnd  = chunkStart + gs - 1;
      const chunkOvers = completedOverNums.filter(n => n >= chunkStart && n <= chunkEnd);
      if (chunkOvers.length === 0) continue;
      if (gs > 1 && lastOver < chunkStart + gs - 1) continue;

      // Every over in `completedOverNums` (other than a possible partial
      // trailing over, already excluded above) is fully bowled and will
      // never change again -- so every card this loop produces is final
      // the moment it's built. Safe to cache unconditionally by id.
      const id = `inn${inn.number}-over${chunkStart}`;
      const cached = cache?.get(id);
      if (cached && cached.kind === "over-group") {
        result.push(cached);
        continue;
      }

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

      const card: OverGroupCard = {
        kind: "over-group", id,
        inningsNumber: inn.number, label, inningsLabel, teamColor, runs, wickets, fours, sixes,
        allBalls: chunkBalls, legalDeliveries: legal, keyBall, bowlerName,
        narrative: buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, match.format, t.narrative),
        overSummary: buildOverSummary(runs, wickets, fours, sixes, bowlerName, keyBall, chunkStart, t.overSummary),
        gs,
        isNotable: isNotableOverGroup(runs, wickets, t.overSummary),
      };
      cache?.set(id, card);
      result.push(card);
    }
  }
  return result.reverse();
}

// ── session-based builder (Test) ──────────────────────────────────────────────

export function buildTestSessionCards(
  match: Match, allBalls: Ball[], isLive: boolean,
  cache?: DigestCardCache,
  t: NarrativeThresholds = getNarrativeThresholds()
): DigestCardData[] {
  const dayMap = new Map<number, SessionEntry[]>();
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

    const allOverNums = [...byOver.keys()].sort((a, b) => a - b);
    if (allOverNums.length === 0) continue;

    const isLastInn = innIdx === inningsCount - 1;
    const lastOverNum    = allOverNums[allOverNums.length - 1];
    const lastOverBalls  = byOver.get(lastOverNum) ?? [];
    const completedOverNums =
      isLive && isLastInn && legalBalls(lastOverBalls).length < 6
        ? allOverNums.slice(0, -1)
        : allOverNums;

    const inningsLabel = inningsCount > 1 ? `${ordinal(teamInningsOccurrence(match.innings, inn))} Inn` : "";
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

      const id = `sess-inn${inn.number}-day${sess.day}-${sess.session}`;
      const cachedCard = cache?.get(id);
      // A session, once complete, never changes again -- reuse the cached
      // card verbatim (same object reference) instead of re-filtering its
      // balls and regenerating its narrative on every subsequent tick.
      // Still-live sessions are never cached (they keep growing) and always
      // recomputed below.
      if (cachedCard && cachedCard.kind === "session" && sess.isComplete) {
        const dayEntries = dayMap.get(sess.day) ?? [];
        dayEntries.push({ sess, card: cachedCard });
        dayMap.set(sess.day, dayEntries);
        continue;
      }

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
        id,
        day: sess.day,
        sessionLabel: sess.label,
        overRange: `Overs ${firstOver}–${lastOver}`,
        inningsLabel, teamColor, runs, wickets, fours, sixes,
        allBalls: sessBalls, keyBall, bowlerName,
        narrative:    buildNarrative(runs, wickets, fours, sixes, bowlerName, keyBall, "Test", t.narrative),
        overSummary:  buildOverSummary(runs, wickets, fours, sixes, bowlerName, keyBall, sess.day * 3 + sessIdx, t.overSummary),
        isLiveSession: !sess.isComplete,
        oversInSession: sessOvers.length,
        isNotable: isNotableSession(runs, wickets, t.dayReport),
      };
      if (sess.isComplete) cache?.set(id, card);

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

    const allComplete = entries.every(e => e.sess.isComplete);

    if (!allComplete) {
      // Day still in progress -- show each session as it completes. There's
      // no day-summary yet because the day itself hasn't ended.
      for (const { card } of entries) result.push(card);
      continue;
    }

    // Day has fully ended (stumps) -- collapse the individual session cards
    // into ONE consolidated day-summary card instead of showing both. This
    // applies no matter how many sessions the day actually had (2 on a
    // weather-shortened day, 3 normally) -- `entries` already only contains
    // whatever sessions genuinely got balls bowled.
    const daySummaryId = `day-summary-${day}`;
    const cachedDaySummary = cache?.get(daySummaryId);
    if (cachedDaySummary && cachedDaySummary.kind === "day-summary") {
      // A completed day never un-completes -- reuse the cached summary
      // verbatim rather than re-deriving totals and regenerating the report.
      result.push(cachedDaySummary);
      continue;
    }

    const totalRuns    = entries.reduce((s, e) => s + e.card.runs, 0);
    const totalWickets = entries.reduce((s, e) => s + e.card.wickets, 0);
    const totalFours   = entries.reduce((s, e) => s + e.card.fours, 0);
    const totalSixes   = entries.reduce((s, e) => s + e.card.sixes, 0);

    const daySummary: DaySummaryCard = {
      kind: "day-summary", id: daySummaryId, day,
      sessionRows: entries.map(e => ({
        label: e.sess.label,
        inningsLabel: e.card.inningsLabel,
        runs: e.card.runs,
        wickets: e.card.wickets,
        teamColor: e.card.teamColor,
      })),
      totalRuns, totalWickets,
      report: buildDayReport(day, entries, false, t.dayReport),
      isNotable: isNotableDay(totalRuns, totalWickets, totalFours, totalSixes, t.dayReport),
    };
    cache?.set(daySummaryId, daySummary);
    result.push(daySummary);
  }

  return result.reverse(); // newest-first
}

// ── top-level builder ─────────────────────────────────────────────────────────

export function buildCards(
  match: Match, allBalls: Ball[], isLive: boolean,
  cache?: DigestCardCache
): DigestCardData[] {
  // Fetched once per buildCards() call (not once per card) so every card
  // built in this pass judges "notable" and phrasing against the exact same
  // threshold snapshot, and so a localStorage-backed override only gets
  // read once per recompute rather than once per card.
  const t = getNarrativeThresholds();

  let cards: DigestCardData[] = [];
  if (match.format === "Test") {
    const sessionCards = buildTestSessionCards(match, allBalls, isLive, cache, t);
    if (sessionCards.length > 0) cards = sessionCards;
    else cards = buildOverGroupCards(match, allBalls, isLive, cache, t);
  } else {
    cards = buildOverGroupCards(match, allBalls, isLive, cache, t);
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

const OverGroupCardView = React.memo(function OverGroupCardView({ card }: { card: OverGroupCard }) {
  const kb = card.keyBall;
  const keyLabel = kb ? `${kb.over}.${kb.ballInOver + 1}${kb.isWicket ? " · OUT" : kb.isBoundary6 ? " · SIX" : kb.isBoundary4 ? " · FOUR" : ""}` : "";
  const showDots = card.gs === 1;

  // Notable gets a quiet accent border -- same "clears one explicit bar"
  // restraint Spotlight uses elsewhere, not a badge or animation. Routine
  // overs/blocks (the overwhelming majority) stay exactly as before.
  return (
    <div className={`card overflow-hidden ${card.isNotable ? "border-amber-400/40" : ""}`} data-digest-card>
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
});

const SessionCardView = React.memo(function SessionCardView({ card }: { card: SessionCard }) {
  const kb = card.keyBall;
  const keyLabel = kb ? `${kb.over}.${kb.ballInOver + 1}${kb.isWicket ? " · OUT" : kb.isBoundary6 ? " · SIX" : kb.isBoundary4 ? " · FOUR" : ""}` : "";

  // A notable session gets the same quiet amber accent as an over-group
  // card. If it's ALSO the live, still-unfolding session, add the existing
  // excitement-glow pulse (same treatment Scorecard.tsx gives the current
  // on-strike batter) -- "something dramatic is happening right now," not
  // just "this was a big one." A completed notable session never pulses;
  // that's reserved for genuinely live state, matching the rest of the app.
  const notableClass = card.isNotable
    ? card.isLiveSession
      ? "border-amber-400/40 excitement-glow"
      : "border-amber-400/40"
    : "";

  return (
    <div className={`card overflow-hidden ${notableClass}`} data-digest-card>
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
});

const DaySummaryCardView = React.memo(function DaySummaryCardView({ card }: { card: DaySummaryCard }) {
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

  // Notable days (bowler-dominated, wicketless, or boundary-heavy -- see
  // isNotableDay) get the accent swapped from the platform's default cyan
  // to a quiet amber, so scanning down a full 5-day Test's cards, the days
  // that actually mattered stand out at a glance. Same layout, same sizes,
  // same information -- just a different, quieter hue. Routine days keep
  // the standard cyan treatment unchanged.
  //
  // Full literal class strings on purpose (not `` `border-${x}/20` ``) --
  // Tailwind's build-time scanner matches literal strings in source, it
  // can't evaluate a template interpolation, so an interpolated color name
  // would silently never get generated into the shipped CSS.
  const cardBorderClass = card.isNotable ? "border-amber-400/20" : "border-cyan/20";
  const headerBgClass    = card.isNotable ? "bg-amber-400/6 border-b border-amber-400/15" : "bg-cyan/6 border-b border-cyan/15";
  const labelColorClass  = card.isNotable ? "text-amber-400" : "text-cyan";

  return (
    <div className={`rounded-xl overflow-hidden border ${cardBorderClass} bg-surface-2/80 backdrop-blur-sm`} data-digest-card>
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2.5 ${headerBgClass}`}>
        <div className="flex items-center gap-1">
          {card.sessionRows.slice(0, 3).map((r, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: r.teamColor }} />
          ))}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${labelColorClass}`}>
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
                ? card.isNotable ? "text-[11px] text-amber-400/80 italic" : "text-[11px] text-cyan/80 italic"
                : "text-[11px] text-text-secondary"
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
});

// ── MatchSummaryCardView ─────────────────────────────────────────────────────

const MatchSummaryCardView = React.memo(function MatchSummaryCardView({ card }: { card: MatchSummaryCard }) {
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
});

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

  // Cache of already-finalized cards (completed sessions/days/over-chunks),
  // persisted across renders via a ref so it survives useMemo re-running
  // when `allBalls` gets a new array reference on every live tick. Without
  // this, buildCards would still be CORRECT (it always was) but would
  // rebuild brand-new objects for cards whose underlying data hasn't
  // changed at all, which in turn forces React to re-render/reconcile
  // every already-shown card on every tick instead of just the new one(s).
  // Reset whenever the match itself changes so an old match's cache can
  // never leak into a different match's digest.
  //
  // ASSUMPTION (documented in DECISIONS-LOG.md, "Real-data architecture",
  // RD8): this assumes a real feed is append-only and never retroactively
  // edits a ball that's already part of a "complete" cached card (e.g. a
  // DRS overturn changing a dismissal after the fact). This cache is a
  // plain in-memory ref -- never written to localStorage/sessionStorage/any
  // server store -- so it cannot survive a page reload, and it doesn't
  // even survive navigating off this tab and back (both fully unmount this
  // component, which re-creates the cache from empty). If that assumption
  // is ever wrong, a stale card would show for at most as long as the user
  // keeps this exact tab mounted, never longer.
  const cacheRef = useRef<DigestCardCache>(new Map());
  const cacheMatchIdRef = useRef<string | null>(null);
  if (cacheMatchIdRef.current !== match.id) {
    cacheRef.current = new Map();
    cacheMatchIdRef.current = match.id;
  }

  const cards = useMemo(
    () => buildCards(match, allBalls, isLive, cacheRef.current),
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
