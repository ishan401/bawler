"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Match, MatchEvent, InsightV2, Ball, WinProbPoint } from "@/lib/types";
import { calculateWinProbForMatch, totalBallsForFormat } from "@/lib/winProb";
import { ballsPerSet, absoluteBallNumber, inningsProgressLabel, situationLabel } from "@/lib/formatUtils";
import { extractMatchEvents } from "@/lib/events";
import ScoreBar from "@/components/ScoreBar";
import MiniInsightsBar from "@/components/MiniInsightsBar";
import BallGIF from "@/components/BallGIF";
import WinProbChart from "@/components/WinProbChart";
import MomentsStrip from "@/components/MomentsStrip";
import MatchTabs, { type TabKey, type TabBadge } from "@/components/MatchTabs";
import Scorecard from "@/components/Scorecard";
import CommentaryFeed from "@/components/CommentaryFeed";
import InfoTab from "@/components/InfoTab";
import DigestTab from "@/components/DigestTab";
import { MOCK_INSIGHTS_V2 } from "@/lib/mockData";
import LineupsCard from "@/components/LineupsCard";
import MomentStoryCard from "@/components/MomentStoryCard";
import StandingsTab from "@/components/StandingsTab";
import MatchupCard from "@/components/MatchupCard";
import MatchupShareCard from "@/components/MatchupShareCard";
import { getMatchupStats } from "@/lib/mockMatchups";

interface MatchViewProps {
  match: Match;
  insights?: InsightV2[];
}

const GIF_LOOP_MS = 6000;     // 3 sec per clip × 2 clips
const GIF_REPS_PER_BALL = 4;  // ball stays in view for 4 loops
const BALL_DWELL_MS = GIF_LOOP_MS * GIF_REPS_PER_BALL; // 24 sec

/**
 * Match page — Sarthak v0.9 layout:
 *   GIF
 *   Moments (always visible, just below GIF)
 *   Commentary (variable-height ball cards)
 *
 * Win probability lives as a chip in the sticky MiniInsightsBar (leading
 * team + %); tapping it opens the same full-screen WinProbChart as before.
 */
export default function MatchView({ match, insights: insightsProp }: MatchViewProps) {
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

  const isUpcoming = match.status === "upcoming" || match.status === "pre-match";
  // Show TABLE tab if the match's own competition OR its championship (e.g. WTC) has standings
  const tableComp = match.championship?.hasStandings ? match.championship : match.competition;
  const showTable = tableComp.hasStandings;
  const showDigest = allBalls.length > 0 && !isUpcoming;
  const defaultTab: TabKey = isUpcoming ? "info" : "live";

  // Restore the last-viewed tab when navigating back from a player profile.
  const SESSION_KEY = `matchTab:${match.id}`;
  const restoredTab = ((): TabKey => {
    if (typeof window === "undefined") return defaultTab;
    const saved = sessionStorage.getItem(SESSION_KEY);
    return (saved as TabKey) ?? defaultTab;
  })();

  const [tab, setTab] = useState<TabKey>(restoredTab);
  const [renderedTab, setRenderedTab] = useState<TabKey>(restoredTab);
  const [animClass, setAnimClass] = useState("");
  const transitioningRef = useRef(false);
  const [showProbModal, setShowProbModal] = useState(false);

  // ── Story-card share ──────────────────────────────────────────
  const storyCardRef = useRef<HTMLDivElement>(null);
  const matchupShareRef = useRef<HTMLDivElement>(null);
  const isCapturingRef = useRef(false);
  const [matchupShareTarget, setMatchupShareTarget] = useState<{
    batterName: string;
    bowlerName: string;
    battingTeamColor: string;
    bowlingTeamColor: string;
    battingTeamName: string;
    bowlingTeamName: string;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    ball: Ball;
    wpBefore: number; wpAfter: number;
    ballIdx: number;
    scoreText: string; situationText: string;
  } | null>(null);
  const [isClosingProb, setIsClosingProb] = useState(false);

  // Back-swipe / browser back gesture for win-prob modal
  useEffect(() => {
    if (showProbModal) {
      history.pushState({ winProb: true }, "");
      const onPop = () => setShowProbModal(false);
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }
  }, [showProbModal]);

  const openProbModal  = () => setShowProbModal(true);
  const closeProbModal = () => {
    setIsClosingProb(true);
    setTimeout(() => {
      setIsClosingProb(false);
      setShowProbModal(false);
      if (history.state?.winProb) history.back();
    }, 240);
  };

  // ── Book-page-turn tab switcher ───────────────────────────────
  const goToTab = React.useCallback((newTab: TabKey) => {
    if (newTab === tab || transitioningRef.current) return;
    const dir = TABS_ORDER.indexOf(newTab) > TABS_ORDER.indexOf(tab) ? "forward" : "backward";
    transitioningRef.current = true;
    setTab(newTab); // header highlights new tab immediately
    sessionStorage.setItem(SESSION_KEY, newTab); // persist for back-navigation
    setAnimClass(`book-exit-${dir}`);
    setTimeout(() => {
      setRenderedTab(newTab);
      setAnimClass(`book-enter-${dir}`);
      setTimeout(() => { setAnimClass(""); transitioningRef.current = false; }, 320);
    }, 220);
  }, [tab, SESSION_KEY]);

  // ── Swipe between tabs ──────────────────────────────────────────
  const TABS_ORDER: TabKey[] = [
      "live",
      "scorecard",
      ...(showDigest ? ["digest" as TabKey] : []),
      "info",
      ...(showTable ? ["table" as TabKey] : []),
    ];
  const swipeTouchX = useRef(0);
  const swipeTouchY = useRef(0);
  const swipeIgnored = useRef(false); // true when touch started inside an h-scroll container

  // Walk up the DOM from the touch target; if any ancestor scrolls horizontally,
  // the gesture belongs to that scroller — don't steal it for tab switching.
  function touchStartsInHScroll(e: React.TouchEvent): boolean {
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      const style = window.getComputedStyle(el);
      const ox = style.overflowX;
      if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth) return true;
      el = el.parentElement;
    }
    return false;
  }

  const onSwipeStart = (e: React.TouchEvent) => {
    swipeIgnored.current = touchStartsInHScroll(e);
    swipeTouchX.current = e.touches[0].clientX;
    swipeTouchY.current = e.touches[0].clientY;
  };
  const onSwipeEnd = (e: React.TouchEvent) => {
    if (swipeIgnored.current) return;
    const dx = e.changedTouches[0].clientX - swipeTouchX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeTouchY.current);
    if (Math.abs(dx) < 60 || dy > Math.abs(dx) * 0.75) return;
    const idx = TABS_ORDER.indexOf(tab);
    if (dx < 0 && idx < TABS_ORDER.length - 1) goToTab(TABS_ORDER[idx + 1]);
    else if (dx > 0 && idx > 0) goToTab(TABS_ORDER[idx - 1]);
  };

  // ── Scorecard badge on wicket / six ────────────────────────────
  // currentBall needed here — declared early so badge effect can reference it
  const currentBall = allBalls[activeBallIdx];
  const [scorecardBadge, setScorecardBadge] = useState<TabBadge | null>(null);
  const lastBadgedBallId = useRef<string | null>(null);
  useEffect(() => {
    if (!currentBall || currentBall.id === lastBadgedBallId.current || tab === "scorecard") return;
    lastBadgedBallId.current = currentBall.id;
    if (currentBall.isWicket) {
      setScorecardBadge({ tab: "scorecard", type: "wicket" });
      setTimeout(() => setScorecardBadge(null), 4000);
    } else if (currentBall.runs === 6 && currentBall.extras === 0) {
      setScorecardBadge({ tab: "scorecard", type: "six" });
      setTimeout(() => setScorecardBadge(null), 4000);
    }
  }, [currentBall, tab]);
  useEffect(() => { if (tab === "scorecard") setScorecardBadge(null); }, [tab]);

  const truncatedMatch = useMemo(() => {
    // Generalised N-innings truncation — works for T20/ODI (2 inn) and Test (up to 4 inn).
    // We slice the global ball timeline at activeBallIdx and distribute the visible
    // balls across innings in order. Any innings not yet reached is excluded;
    // any fully-consumed innings keeps its real scorecard values.
    let remaining = activeBallIdx + 1;
    const innings: typeof match.innings = [];

    for (const inn of match.innings) {
      if (remaining <= 0) break; // innings not started in current playback position

      const innBalls  = inn.balls;
      const isComplete = remaining > innBalls.length; // all balls of this innings are visible
      const take       = Math.min(remaining, innBalls.length);
      const truncBalls = innBalls.slice(0, take);
      remaining -= take;

      if (isComplete) {
        // Innings fully consumed — use authoritative scorecard values
        innings.push({ ...inn, balls: truncBalls });
      } else {
        // Viewing mid-innings — derive runs/wickets/overs from truncated balls
        const hasBalls  = truncBalls.length > 0;
        const runs      = truncBalls.reduce((s, b) => s + b.runs + b.extras, 0);
        const wickets   = truncBalls.filter(b => b.isWicket).length;
        const lastBall  = truncBalls[truncBalls.length - 1];
        const overs     = lastBall
          ? lastBall.over - 1 + (lastBall.ballInOver + 1) / ballsPerSet(match.format)
          : 0;
        innings.push({
          ...inn,
          balls:   truncBalls,
          runs:    hasBalls ? runs    : inn.runs,
          wickets: hasBalls ? wickets : inn.wickets,
          overs:   hasBalls ? Math.round(overs * 10) / 10 : inn.overs,
        });
      }
    }
    return { ...match, innings };
  }, [match, activeBallIdx]);

  const winProbPoints = useMemo(() => calculateWinProbForMatch(truncatedMatch), [truncatedMatch]);
  const events = useMemo(() => extractMatchEvents(truncatedMatch), [truncatedMatch]);

  const visibleInsights = useMemo(() => {
    const seenBallIds = new Set(allBalls.slice(0, activeBallIdx + 1).map(b => b.id));
    const insights = insightsProp ?? MOCK_INSIGHTS_V2;
  return insights.filter(i => !i.relatedBallId || seenBallIds.has(i.relatedBallId));
  }, [activeBallIdx, allBalls]);

  const currentInnings = truncatedMatch.innings.find(i =>
    currentBall && i.balls.some(b => b.id === currentBall.id)
  );
  const fielders = currentInnings?.fieldingPositions ?? match.innings[match.innings.length - 1]?.fieldingPositions;

  // BallGIF clip props — win-prob before/after + situation/score text
  const wpBefore = activeBallIdx > 0
    ? Math.round(winProbPoints[activeBallIdx - 1]?.winProbTeamA ?? 50)
    : 50;
  const wpAfter = Math.round(winProbPoints[activeBallIdx]?.winProbTeamA ?? 50);

  const clipScoreText = (() => {
    if (!currentBall || !currentInnings) return undefined;
    const { battingTeam, runs, wickets, overs } = currentInnings;
    const shortName = battingTeam === match.teamA.code
      ? match.teamA.shortName
      : match.teamB.shortName;
    const overLabel = `${Math.floor(overs)}.${Math.round((overs % 1) * 10)}`;
    return `${shortName} ${runs}/${wickets} (${overLabel})`;
  })();

  const clipSituationText = (() => {
    if (!currentBall || !currentInnings) return undefined;
    const inningsNum = currentInnings.number;
    // Chase innings
    if (inningsNum >= 2) {
      const firstInnings = truncatedMatch.innings[0];
      if (firstInnings) {
        const target = firstInnings.runs + 1;
        const remaining = target - currentInnings.runs;
        const ballsBowled = Math.round(currentInnings.overs * ballsPerSet(match.format));
        const totalBalls = totalBallsForFormat(match);
        const ballsLeft = totalBalls - ballsBowled;
        if (remaining > 0 && ballsLeft > 0) {
          return `Need ${remaining} off ${ballsLeft}`;
        }
      }
    }
    // 1st innings
    return inningsProgressLabel(currentInnings.overs, match.format);
  })();

  // Compute context for any ball and queue it for capture
  const triggerShare = useCallback((ball: Ball) => {
    if (isCapturingRef.current) return;
    const idx = allBalls.findIndex(b => b.id === ball.id);
    // Find win-prob around this ball using full winProbPoints array
    const fullWinProbPoints = calculateWinProbForMatch({ ...match, innings: match.innings });
    const wpB = idx > 0 ? Math.round(fullWinProbPoints[idx - 1]?.winProbTeamA ?? 50) : 50;
    const wpA = Math.round(fullWinProbPoints[idx]?.winProbTeamA ?? 50);
    // Score/situation text at that ball
    const innings = match.innings.find(inn => inn.balls.some(b => b.id === ball.id));
    let sText = inningsProgressLabel(ball.over - 1 + (ball.ballInOver + 1) / ballsPerSet(match.format), match.format);
    let scText = "";
    if (innings) {
      const bIdx = innings.balls.findIndex(b => b.id === ball.id);
      let runs = 0, wkts = 0;
      for (let i = 0; i <= bIdx; i++) {
        runs += (innings.balls[i].runs ?? 0) + (innings.balls[i].extras ?? 0);
        if (innings.balls[i].isWicket) wkts++;
      }
      const sName = innings.battingTeam === match.teamA.code
        ? match.teamA.shortName : match.teamB.shortName;
      const ballLbl = match.format === "Hundred" ? `B${absoluteBallNumber(ball, match.format)}` : `${ball.over}.${ball.ballInOver + 1}`;
      scText = `${sName} ${runs}/${wkts} (${ballLbl})`;
      if (innings.number >= 2 && match.innings[0]) {
        const target = match.innings[0].runs + 1;
        const remaining = target - runs;
        const totalBalls = totalBallsForFormat(match);
        const ballsDone = absoluteBallNumber(ball, match.format);
        if (remaining > 0 && totalBalls - ballsDone > 0) {
          sText = `Need ${remaining} off ${totalBalls - ballsDone}`;
        }
      }
    }
    setShareTarget({ ball, wpBefore: wpB, wpAfter: wpA, ballIdx: idx, scoreText: scText, situationText: sText });
  }, [allBalls, match]);

  // After React paints the hidden card, capture → share
  useEffect(() => {
    if (!shareTarget || !storyCardRef.current) return;
    isCapturingRef.current = true;
    const el = storyCardRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        try {
          const { toPng } = await import("html-to-image");
          const dataUrl = await toPng(el, {
            pixelRatio: 2, backgroundColor: "#070B14", skipFonts: true,
          });
          const byteStr = atob(dataUrl.split(",")[1]);
          const arr = new Uint8Array(byteStr.length);
          for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
          const blob = new Blob([arr], { type: "image/png" });
          const file = new File([blob], "bawler-moment.png", { type: "image/png" });
          const parts = [shareTarget.scoreText, shareTarget.situationText].filter(Boolean);
          const text = parts.length ? `${parts.join(" · ")} · bawler-gold.vercel.app` : "bawler-gold.vercel.app";
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Bawler", text });
          } else {
            const a = document.createElement("a");
            a.href = dataUrl; a.download = "bawler-moment.png"; a.click();
          }
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") console.error("[Bawler] Share failed:", err);
        }
        isCapturingRef.current = false;
        setShareTarget(null);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareTarget]);

  const handleMomentSelect = React.useCallback((event: MatchEvent | null) => {
    if (event === null) {
      setSelectedBallId(null);
      setLiveBallIdx(allBalls.length - 1);
    } else if (event.ballId) {
      setSelectedBallId(event.ballId);
    }
  }, [allBalls.length]);

  const handleMomentShare = React.useCallback((event: MatchEvent) => {
    if (!event.ballId) return;
    const ball = allBalls.find(b => b.id === event.ballId);
    if (ball) triggerShare(ball);
  }, [allBalls, triggerShare]);

  // ── Matchup card — always-on, always accurate ───────────────────────────
  // Show current striker vs current bowler on every ball.
  // Strike rotation (singles), bowling changes, new batters — all handled
  // automatically because currentBall already reflects the live state.
  const matchupInfo = useMemo(() => {
    if (!currentBall || !currentInnings) return null;

    const battingTeamColor = currentInnings.battingTeam === match.teamA.code
      ? match.teamA.primaryColor : match.teamB.primaryColor;
    const bowlingTeamColor = currentInnings.battingTeam === match.teamA.code
      ? match.teamB.primaryColor : match.teamA.primaryColor;
    const battingTeamName = currentInnings.battingTeam === match.teamA.code
      ? match.teamA.shortName : match.teamB.shortName;
    const bowlingTeamName = currentInnings.battingTeam === match.teamA.code
      ? match.teamB.shortName : match.teamA.shortName;

    return {
      batterName: currentBall.batterName,
      bowlerName: currentBall.bowlerName,
      isPreview: false,
      battingTeamColor, bowlingTeamColor, battingTeamName, bowlingTeamName,
    };
  }, [currentBall, currentInnings, match]);

  // Live stat tracking for matchup card — all balls between current batter+bowler in this match
  const liveMatchupCounters = useMemo(() => {
    if (!matchupInfo) return { balls: 0, runs: 0, outs: 0, dots: 0, fours: 0, sixes: 0 };
    return allBalls.slice(0, activeBallIdx + 1).reduce(
      (acc, b) => {
        if (b.batterName === matchupInfo.batterName && b.bowlerName === matchupInfo.bowlerName) {
          // Only legal deliveries count toward balls faced
          const isLegal = !b.extraType || b.extraType === "b" || b.extraType === "lb";
          if (isLegal) {
            acc.balls++;
            acc.runs += b.runs;
            if (b.isWicket) acc.outs++;
            if (b.runs === 0 && b.extras === 0 && !b.isWicket) acc.dots++;
            if (b.isBoundary4) acc.fours++;
            if (b.isBoundary6) acc.sixes++;
          }
        }
        return acc;
      },
      { balls: 0, runs: 0, outs: 0, dots: 0, fours: 0, sixes: 0 }
    );
  }, [allBalls, activeBallIdx, matchupInfo?.batterName, matchupInfo?.bowlerName, matchupInfo]);

  // Partnership tracker — runs & balls for each batter in the current stand
  const partnershipInfo = useMemo(() => {
    if (!currentBall) return null;
    const inn = currentBall.inningsNumber;
    // All balls in current innings up to and including activeBallIdx
    const inningsBalls = allBalls.slice(0, activeBallIdx + 1).filter(b => b.inningsNumber === inn);

    // Find the last GENUINE wicket (striker dismissed).
    // Fix 1: Non-striker run-outs — if the ball after a run-out wicket has the same
    // batterName, the striker survived → non-striker was dismissed → don't reset partnership.
    let partnershipStart = 0;
    for (let i = inningsBalls.length - 1; i >= 0; i--) {
      const b = inningsBalls[i];
      if (b.isWicket) {
        const nextBall = inningsBalls[i + 1];
        const isNonStrikerRunOut =
          b.dismissalType === "run-out" &&
          nextBall != null &&
          nextBall.batterName === b.batterName;
        if (!isNonStrikerRunOut) {
          partnershipStart = i + 1;
          break;
        }
      }
    }

    const partnerBalls = inningsBalls.slice(partnershipStart);

    // Accumulate per batter
    // Fix 2: No-balls (nb) ARE faced by the batter — only wides (wd) are not.
    // Runs: b.runs = bat runs only; extras (byes, leg-byes, wides) live in b.extras.
    const batsmenMap = new Map<string, { runs: number; balls: number; fours: number; sixes: number }>();
    for (const b of partnerBalls) {
      const isFaced = b.extraType !== "wd"; // wide = not faced; nb/b/lb = faced
      const entry = batsmenMap.get(b.batterName) ?? { runs: 0, balls: 0, fours: 0, sixes: 0 };
      entry.runs += b.runs;
      if (isFaced) entry.balls++;
      if (b.isBoundary4) entry.fours++;
      if (b.isBoundary6) entry.sixes++;
      batsmenMap.set(b.batterName, entry);
    }

    const batters = Array.from(batsmenMap.entries()).map(([name, s]) => ({ name, ...s }));
    const totalRuns   = batters.reduce((s, b) => s + b.runs, 0);
    const totalBalls  = partnerBalls.filter(b => b.extraType !== "wd").length;
    const totalFours  = batters.reduce((s, b) => s + b.fours, 0);
    const totalSixes  = batters.reduce((s, b) => s + b.sixes, 0);
    return { batters, totalRuns, totalBalls, totalFours, totalSixes };
  }, [allBalls, activeBallIdx, currentBall]);

  // Share handler for MatchupCard
  const triggerMatchupShare = useCallback(() => {
    if (!matchupInfo || isCapturingRef.current) return;
    setMatchupShareTarget({
      batterName: matchupInfo.batterName,
      bowlerName: matchupInfo.bowlerName,
      battingTeamColor: matchupInfo.battingTeamColor,
      bowlingTeamColor: matchupInfo.bowlingTeamColor,
      battingTeamName: matchupInfo.battingTeamName,
      bowlingTeamName: matchupInfo.bowlingTeamName,
    });
  }, [matchupInfo]);

  // Capture + share the matchup card image
  useEffect(() => {
    if (!matchupShareTarget || !matchupShareRef.current) return;
    isCapturingRef.current = true;
    const el = matchupShareRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        try {
          const { toPng } = await import("html-to-image");
          const dataUrl = await toPng(el, {
            pixelRatio: 2, backgroundColor: "#070B14", skipFonts: true,
          });
          const byteStr = atob(dataUrl.split(",")[1]);
          const arr = new Uint8Array(byteStr.length);
          for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
          const blob = new Blob([arr], { type: "image/png" });
          const file = new File([blob], "bawler-matchup.png", { type: "image/png" });
          const text = `${matchupShareTarget.batterName} vs ${matchupShareTarget.bowlerName} · bawler-gold.vercel.app`;
          if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Bawler Matchup", text });
          } else {
            const a = document.createElement("a");
            a.href = dataUrl; a.download = "bawler-matchup.png"; a.click();
          }
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") console.error("[Bawler] Matchup share failed:", err);
        }
        isCapturingRef.current = false;
        setMatchupShareTarget(null);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchupShareTarget]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-30">
        <ScoreBar match={truncatedMatch} />
        <MiniInsightsBar
          match={truncatedMatch}
          insights={visibleInsights}
          winProbPoints={winProbPoints}
          onExpandWinProb={() => setShowProbModal(true)}
        />
        <MatchTabs active={tab} onChange={goToTab} badge={scorecardBadge} showTable={showTable} showDigest={showDigest} />
      </div>

      <main className="flex-1 px-3 py-3 pb-24" onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>
        <div className={`space-y-3 ${animClass}`}>
        {renderedTab === "live" && (
          <>
            {allBalls.length === 0 ? (
              /* ── No ball-by-ball data — rich score card ── */
              <div className="space-y-3">

                {/* Team banners + score */}
                <div className="card overflow-hidden">
                  {/* Live badge */}
                  {match.status === "live" && (
                    <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Live</span>
                    </div>
                  )}

                  {/* Team A row */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: match.teamA.primaryColor }} />
                    <span className="text-sm font-extrabold flex-1">{match.teamA.shortName}</span>
                    <span className="text-lg font-extrabold num">
                      {match.innings.find(i => i.battingTeam === match.teamA.code)
                        ? `${match.innings.find(i => i.battingTeam === match.teamA.code)!.runs}/${match.innings.find(i => i.battingTeam === match.teamA.code)!.wickets}`
                        : (match.liveWinProbOverride?.teamCode === match.teamA.code ? "—" : "—")}
                    </span>
                  </div>

                  {/* Team B row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: match.teamB.primaryColor }} />
                    <span className="text-sm font-extrabold flex-1">{match.teamB.shortName}</span>
                    <span className="text-lg font-extrabold num">
                      {match.innings.find(i => i.battingTeam === match.teamB.code)
                        ? `${match.innings.find(i => i.battingTeam === match.teamB.code)!.runs}/${match.innings.find(i => i.battingTeam === match.teamB.code)!.wickets}`
                        : "—"}
                    </span>
                  </div>

                  {/* Status line */}
                  {match.liveStatusOverride && (
                    <div className="px-4 py-2.5 bg-bg-surface border-t border-line">
                      <p className="text-xs font-bold text-text-primary text-center">{match.liveStatusOverride}</p>
                    </div>
                  )}

                  {/* Result */}
                  {match.result && (
                    <div className="px-4 py-2.5 border-t border-line text-center">
                      <span className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: `${match.teamA.primaryColor}22`, color: match.teamA.primaryColor }}>
                        {match.result.winner !== "draw" && match.result.winner !== "tie" && match.result.winner !== "no-result"
                          ? `${match.result.winner} won · ${match.result.margin}` : match.result.winner}
                      </span>
                    </div>
                  )}
                </div>

                {/* Win probability */}
                {match.liveWinProbOverride && (() => {
                  const rawPct = match.liveWinProbOverride.pct > 1
                    ? match.liveWinProbOverride.pct
                    : match.liveWinProbOverride.pct * 100;
                  const pctA = Math.round(match.liveWinProbOverride.teamCode === match.teamA.code
                    ? rawPct
                    : 100 - rawPct);
                  const pctB = 100 - pctA;
                  return (
                    <div className="card px-4 py-3 space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Win Probability</span>
                      <div className="flex justify-between text-xs font-extrabold">
                        <span style={{ color: match.teamA.primaryColor }}>{match.teamA.shortName} {pctA}%</span>
                        <span style={{ color: match.teamB.primaryColor }}>{pctB}% {match.teamB.shortName}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden flex">
                        <div style={{ width: `${pctA}%`, background: match.teamA.primaryColor }} />
                        <div style={{ width: `${pctB}%`, background: match.teamB.primaryColor }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Summary */}
                {match.summary && (
                  <div className="card px-4 py-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim block mb-1.5">Match Summary</span>
                    <p className="text-sm text-text-secondary leading-relaxed">{match.summary}</p>
                  </div>
                )}

                <p className="text-[11px] text-text-dim text-center pb-2">
                  Ball-by-ball data unavailable · <button className="text-cyan underline" onClick={() => goToTab("info")}>Info tab</button> for squads & details
                </p>
              </div>
            ) : (
              /* ── Full ball-by-ball view ── */
              <>
                {currentBall && (
                  <BallGIF
                    ball={currentBall}
                    match={truncatedMatch}
                    fielders={fielders}
                    loopMs={GIF_LOOP_MS}
                    partnership={partnershipInfo ?? undefined}
                    onShare={triggerShare}
                  />
                )}
                {matchupInfo && (
                  <div className="mt-3">
                    <MatchupCard
                      batterName={matchupInfo.batterName}
                      bowlerName={matchupInfo.bowlerName}
                      battingTeamColor={matchupInfo.battingTeamColor}
                      bowlingTeamColor={matchupInfo.bowlingTeamColor}
                      format={match.format}
                      liveBalls={liveMatchupCounters.balls}
                      liveRuns={liveMatchupCounters.runs}
                      liveOuts={liveMatchupCounters.outs}
                      liveDots={liveMatchupCounters.dots}
                      liveMatchFours={liveMatchupCounters.fours}
                      liveMatchSixes={liveMatchupCounters.sixes}
                      onShare={triggerMatchupShare}
                    />
                  </div>
                )}
                <MomentsStrip
                  events={events}
                  activeBallId={currentBall?.id}
                  isLive={isLiveFollowing}
                  onSelect={handleMomentSelect}
                  onShare={handleMomentShare}
                  format={match.format}
                />
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Live commentary</span>
                    <span className="text-[10px] text-text-secondary">{visibleInsights.length} insights</span>
                  </div>
                  <CommentaryFeed match={truncatedMatch} insights={visibleInsights} onShare={triggerShare} />
                </div>
              </>
            )}
          </>
        )}

        {renderedTab === "scorecard" && <Scorecard match={truncatedMatch} />}
        {renderedTab === "digest" && (
          <DigestTab
            match={truncatedMatch}
            allBalls={allBalls}
          />
        )}
        {renderedTab === "info" && <InfoTab match={truncatedMatch} />}
        {renderedTab === "table" && <StandingsTab competition={tableComp} />}

        <footer className="text-[10px] text-text-dim text-center pt-2 pb-8">
          Bawler v0.9 · all data mocked
        </footer>
        </div>
      </main>

      {/* ── Hidden story card for share capture (parent opacity:0, ref clean) ── */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", top: 0, left: 0, width: 375, opacity: 0, pointerEvents: "none", zIndex: -1 }}
      >
        {/* Matchup share card */}
        <div ref={matchupShareRef}>
          {matchupShareTarget && (
            <MatchupShareCard
              stats={getMatchupStats(matchupShareTarget.batterName, matchupShareTarget.bowlerName, match.format)}
              batterName={matchupShareTarget.batterName}
              bowlerName={matchupShareTarget.bowlerName}
              battingTeamName={matchupShareTarget.battingTeamName}
              bowlingTeamName={matchupShareTarget.bowlingTeamName}
              battingTeamColor={matchupShareTarget.battingTeamColor}
              bowlingTeamColor={matchupShareTarget.bowlingTeamColor}
              format={match.format}
            />
          )}
        </div>
        <div ref={storyCardRef}>
          {shareTarget && (
            <MomentStoryCard
              ball={shareTarget.ball}
              match={match}
              scoreText={shareTarget.scoreText}
              situationText={shareTarget.situationText}
              winProbBefore={shareTarget.wpBefore}
              winProbAfter={shareTarget.wpAfter}
              winProbPoints={calculateWinProbForMatch(match)}
              ballIndex={shareTarget.ballIdx}
            />
          )}
        </div>
      </div>

      {/* Full-screen win-prob chart modal */}
      {showProbModal && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-stretch justify-center"
          onClick={closeProbModal}
        >
          <div
            className={`${isClosingProb ? "book-exit-backward" : "book-enter-forward"} w-full max-w-[430px] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <WinProbChart
              match={truncatedMatch}
              points={winProbPoints}
              events={events}
              onClose={closeProbModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
