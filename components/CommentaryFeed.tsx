"use client";
import { memo } from "react";

import type { Match, Ball, InsightV2 } from "@/lib/types";
import { setLabel } from "@/lib/formatUtils";
import DeliveryCard from "./DeliveryCard";
import OverSummary from "./OverSummary";
import InlineNote from "./InlineNote";

interface CommentaryFeedProps {
  match: Match;
  insights: InsightV2[];
  onShare?: (ball: Ball) => void;
}

/**
 * Commentary flow — Sarthak v0.4 redesign.
 *
 *   - Single chronological feed: balls + stats + opinions all mixed in time order.
 *   - Newest first, but the very first item can be EITHER a ball or an insight
 *     depending on which was most recently emitted from the backend.
 *   - Over-summary strips inserted between overs (color-coded 6-dot recap).
 *   - Variable card height: exciting balls (W/6/4 in tight game) get extra
 *     narrative paragraph rendered inside the card.
 *   - Inline notes (stats/opinions/predictions) sometimes appear between cards
 *     rather than always inline with a specific ball.
 */
function CommentaryFeed({ match, insights, onShare }: CommentaryFeedProps) {
  const items = buildFeed(match, insights);

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => {
        if (item.kind === "ball") {
          return (
            <DeliveryCard
              key={item.ball.id}
              ball={item.ball}
              extraNarrative={item.extraNarrative}
              onShare={onShare}
              format={match.format}
            />
          );
        }
        if (item.kind === "over-summary") {
          return (
            <OverSummary
              key={`os-${item.overNumber}-${item.inningsNumber}`}
              over={item.overNumber}
              balls={item.balls}
              bowlerName={item.bowlerName}
              format={match.format}
            />
          );
        }
        if (item.kind === "innings-break") {
          return (
            <div key={`ib-${i}`} className="text-center py-2 my-1.5 text-[10px] font-bold uppercase tracking-widest text-orange border-y border-orange/30">
              ◆ End of innings {item.afterInnings} ◆
            </div>
          );
        }
        if (item.kind === "insight") {
          return <InlineNote key={item.insight.id} insight={item.insight} />;
        }
        return null;
      })}
    </div>
  );
}

// ============================================================================
// Feed assembly — interleave balls, over-summaries, insights into one stream
// ============================================================================

type FeedItem =
  | { kind: "ball"; ball: Ball; extraNarrative?: string; timestamp: number }
  | { kind: "over-summary"; overNumber: number; inningsNumber: 1 | 2 | 3 | 4; balls: Ball[]; bowlerName: string; timestamp: number }
  | { kind: "innings-break"; afterInnings: 1 | 2 | 3 | 4; timestamp: number }
  | { kind: "insight"; insight: InsightV2; timestamp: number };

function buildFeed(match: Match, insights: InsightV2[]): FeedItem[] {
  const items: FeedItem[] = [];

  // Walk through balls in chronological order, emitting:
  //  - the ball card
  //  - over-summary when an over ends
  //  - innings-break when innings changes
  let prevInningsNumber: 1 | 2 | 3 | 4 | null = null;
  let currentOverBalls: Ball[] = [];
  let currentOverNumber: number | null = null;
  let currentBowler: string | null = null;
  let currentInningsNumber: 1 | 2 | 3 | 4 = 1;
  let ballTime = 0;

  const flushOver = () => {
    if (currentOverNumber !== null && currentOverBalls.length > 0 && currentBowler) {
      items.push({
        kind: "over-summary",
        overNumber: currentOverNumber,
        inningsNumber: currentInningsNumber,
        balls: [...currentOverBalls],
        bowlerName: currentBowler,
        timestamp: ballTime,
      });
    }
    currentOverBalls = [];
  };

  for (const innings of match.innings) {
    currentInningsNumber = innings.number;
    if (prevInningsNumber !== null && prevInningsNumber !== innings.number) {
      flushOver();
      items.push({ kind: "innings-break", afterInnings: prevInningsNumber, timestamp: ++ballTime });
      currentOverNumber = null;
    }

    for (const ball of innings.balls) {
      ballTime++;

      if (currentOverNumber !== null && ball.over !== currentOverNumber) {
        flushOver();
      }
      currentOverNumber = ball.over;
      currentBowler = ball.bowlerName;
      currentOverBalls.push(ball);

      const extra = extraNarrativeFor(ball);
      items.push({ kind: "ball", ball, extraNarrative: extra, timestamp: ballTime });
    }
    prevInningsNumber = innings.number;
  }
  flushOver();

  // Merge insights into the timeline by their related-ball timestamp + a tiny lag,
  // or assign a fixed time near "now" for orphans
  for (const ins of insights) {
    let t: number;
    if (ins.relatedBallId) {
      const idx = items.findIndex(i => i.kind === "ball" && i.ball.id === ins.relatedBallId);
      if (idx >= 0) {
        t = items[idx].timestamp + 0.5;
      } else {
        t = ballTime + 0.5;
      }
    } else {
      // Orphan insights — deterministic offset based on insight ID hash
      // (never Math.random() — that causes server/client hydration mismatch)
      const hashOffset = ins.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 25;
      t = ballTime - hashOffset;
    }
    items.push({ kind: "insight", insight: ins, timestamp: t });
  }

  // Sort by timestamp (chronological) then REVERSE so newest is on top.
  // The first item that appears at the top is whatever was emitted most recently,
  // whether ball or insight (per Sarthak v0.4 #7).
  items.sort((a, b) => a.timestamp - b.timestamp);
  return items.reverse();
}

function extraNarrativeFor(ball: Ball): string | undefined {
  // Wickets — always get an extra paragraph
  if (ball.isWicket) {
    const dismissal = ball.dismissalType ?? "out";
    return `${ball.batterName} ${dismissal} ${ball.dismissalType === "bowled" ? `to a ${formatLength(ball.bowlingLength)} ball that found the gate.` : `— ${ball.bowlerName} celebrates a key breakthrough.`}`;
  }
  // Sixes — extra paragraph
  if (ball.isBoundary6) {
    return `Cleared the rope ${shotDirection(ball)} — ${ball.batterName} is finding the timing.`;
  }
  // Boundaries in tight situations
  // Deterministic: use ball ID character sum — avoids hydration mismatch from Math.random()
  if (ball.isBoundary4 && (ball.id.charCodeAt(ball.id.length - 1) % 10) > 3) {
    return `Punched ${shotDirection(ball)} — eases the required-rate pressure.`;
  }
  return undefined;
}

function formatLength(l?: Ball["bowlingLength"]): string {
  if (!l) return "tight";
  return { yorker: "yorker-length", full: "full", good: "good-length", short: "short", bouncer: "bouncer" }[l];
}

function shotDirection(ball: Ball): string {
  const a = ball.shotAngle ?? 0;
  if (a < 30 || a > 330) return "straight down the ground";
  if (a < 80) return "over midwicket";
  if (a < 110) return "off the pads";
  if (a < 160) return "behind square leg";
  if (a < 200) return "fine";
  if (a < 240) return "over third man";
  if (a < 280) return "through point";
  if (a < 320) return "through cover";
  return "through the off side";
}
export default memo(CommentaryFeed);
