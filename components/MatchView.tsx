"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, MatchEvent } from "@/lib/types";
import { calculateWinProbForMatch } from "@/lib/winProb";
import { computeAIMetrics } from "@/lib/metrics";
import { extractMatchEvents } from "@/lib/events";
import ScoreBar from "@/components/ScoreBar";
import MiniInsightsBar from "@/components/MiniInsightsBar";
import BallGIF from "@/components/BallGIF";
import WinProbChart from "@/components/WinProbChart";
import MiniWinProb from "@/components/MiniWinProb";
import AIMetrics from "@/components/AIMetrics";
import MomentsStrip from "@/components/MomentsStrip";
import MatchTabs, { type TabKey } from "@/components/MatchTabs";
import Scorecard from "@/components/Scorecard";
import CommentaryFeed from "@/components/CommentaryFeed";
import InfoTab from "@/components/InfoTab";
import { MOCK_INSIGHTS_V2 } from "@/lib/mockData";

interface MatchViewProps {
  match: Match;
}

const GIF_LOOP_MS = 6000;     // 3 sec per clip × 2 clips
const GIF_REPS_PER_BALL = 4;  // ball stays in view for 4 loops
const BALL_DWELL_MS = GIF_LOOP_MS * GIF_REPS_PER_BALL; // 24 sec

/**
 * Match page — Sarthak v0.9 layout:
 *   GIF
 *   Moments (always visible, just below GIF)
 *   MiniWinProb (compact chart; tap to expand to full)
 *   AI Metrics (4 condensed tiles)
 *   Commentary (variable-height ball cards)
 */
export default function MatchView({ match }: MatchViewProps) {
  const allBalls = useMemo(() => match.innings.flatMap(i => i.balls), [match]);

  const [selectedBallId, setSelectedBallId] = useState<string | null>(null);
  const [liveBallIdx, setLiveBallIdx] = useState(Math.max(0, allBalls.length - 1));
  const isLiveFollowing = selectedBallId === null;

  // Auto-advance every BALL_DWELL_MS (24 sec) — only when in live-follow mode
  useEffect(() => {
    if (!isLiveFollowing) return;
    const id = setInterval(() => {
      setLiveBallIdx(idx => (idx >= allBalls.length - 1 ? Math.max(0, allBalls.length - 10) : idx + 1));
    }, BALL_DWELL_MS);
    return () => clearInterval(id);
  }, [isLiveFollowing, allBalls.length]);

  const activeBallIdx = useMemo(() => {
    if (selectedBallId === null) return liveBallIdx;
    const idx = allBalls.findIndex(b => b.id === selectedBallId);
    return idx >= 0 ? idx : liveBallIdx;
  }, [selectedBallId, liveBallIdx, allBalls]);

  const [tab, setTab] = useState<TabKey>("live");
  const [showProbModal, setShowProbModal] = useState(false);

  const truncatedMatch = useMemo(() => {
    const ballsToShow = activeBallIdx + 1;
    const i1Balls = match.innings[0]?.balls ?? [];
    const i2Balls = match.innings[1]?.balls ?? [];
    const i1Count = Math.min(ballsToShow, i1Balls.length);
    const i2Count = Math.max(0, ballsToShow - i1Balls.length);
    const innings: typeof match.innings = [];
    if (match.innings[0]) {
      const truncBalls = i1Balls.slice(0, i1Count);
      const runs = truncBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = truncBalls.filter(b => b.isWicket).length;
      const lastBall = truncBalls[truncBalls.length - 1];
      const overs = lastBall ? lastBall.over - 1 + (lastBall.ballInOver + 1) / 6 : 0;
      innings.push({
        ...match.innings[0],
        balls: truncBalls,
        runs: i2Count > 0 ? match.innings[0].runs : runs,
        wickets: i2Count > 0 ? match.innings[0].wickets : wickets,
        overs: i2Count > 0 ? match.innings[0].overs : Math.round(overs * 10) / 10,
      });
    }
    if (match.innings[1] && i2Count > 0) {
      const truncBalls = i2Balls.slice(0, i2Count);
      const runs = truncBalls.reduce((s, b) => s + b.runs + b.extras, 0);
      const wickets = truncBalls.filter(b => b.isWicket).length;
      const lastBall = truncBalls[truncBalls.length - 1];
      const overs = lastBall ? lastBall.over - 1 + (lastBall.ballInOver + 1) / 6 : 0;
      innings.push({
        ...match.innings[1],
        balls: truncBalls,
        runs,
        wickets,
        overs: Math.round(overs * 10) / 10,
      });
    }
    return { ...match, innings };
  }, [match, activeBallIdx]);

  const currentBall = allBalls[activeBallIdx];
  const winProbPoints = useMemo(() => calculateWinProbForMatch(truncatedMatch), [truncatedMatch]);
  const events = useMemo(() => extractMatchEvents(truncatedMatch), [truncatedMatch]);
  const metrics = useMemo(() => computeAIMetrics(truncatedMatch), [truncatedMatch]);

  const visibleInsights = useMemo(() => {
    const seenBallIds = new Set(allBalls.slice(0, activeBallIdx + 1).map(b => b.id));
    return MOCK_INSIGHTS_V2.filter(i => !i.relatedBallId || seenBallIds.has(i.relatedBallId));
  }, [activeBallIdx, allBalls]);

  const currentInnings = truncatedMatch.innings.find(i =>
    currentBall && i.balls.some(b => b.id === currentBall.id)
  );
  const fielders = currentInnings?.fieldingPositions ?? match.innings[match.innings.length - 1]?.fieldingPositions;

  const handleMomentSelect = (event: MatchEvent | null) => {
    if (event === null) {
      setSelectedBallId(null);
      setLiveBallIdx(allBalls.length - 1);
    } else if (event.ballId) {
      // Clicking a moment plays that ball in the GIF area
      setSelectedBallId(event.ballId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 sm:top-4 z-30">
        <ScoreBar match={truncatedMatch} />
        <MiniInsightsBar match={truncatedMatch} insights={visibleInsights} />
        <MatchTabs active={tab} onChange={setTab} />
      </div>

      <main className="flex-1 px-3 py-3 space-y-3">
        {tab === "live" && (
          <>
            {/* 1. GIF (auto-advances every 24 sec when on live; held when a moment is selected) */}
            {currentBall && <BallGIF ball={currentBall} fielders={fielders} loopMs={GIF_LOOP_MS} />}

            {/* 2. Moments — always visible, just below GIF (Sarthak v0.9 #5) */}
            <MomentsStrip
              events={events}
              activeBallId={currentBall?.id}
              isLive={isLiveFollowing}
              onSelect={handleMomentSelect}
            />

            {/* 3. Mini win-prob chart — condensed, inline (Sarthak v0.9 #6) */}
            <MiniWinProb
              match={truncatedMatch}
              points={winProbPoints}
              onExpand={() => setShowProbModal(true)}
            />

            {/* 4. 4 AI tiles — condensed (Sarthak v0.9 #8) */}
            <AIMetrics metrics={metrics} />

            {/* 5. Commentary — variable-height ball cards */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Live commentary</span>
                <span className="text-[10px] text-text-secondary">{visibleInsights.length} insights</span>
              </div>
              <CommentaryFeed match={truncatedMatch} insights={visibleInsights} />
            </div>
          </>
        )}

        {tab === "scorecard" && <Scorecard match={truncatedMatch} />}
        {tab === "info" && <InfoTab match={truncatedMatch} />}

        <footer className="text-[10px] text-text-dim text-center pt-2 pb-8">
          Bawler v0.9 · all data mocked
        </footer>
      </main>

      {/* Full-screen win-prob chart modal */}
      {showProbModal && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-stretch justify-center"
          onClick={() => setShowProbModal(false)}
        >
          <div
            className="modal-slide-up w-full max-w-[430px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <WinProbChart
              match={truncatedMatch}
              points={winProbPoints}
              events={events}
              onClose={() => setShowProbModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
