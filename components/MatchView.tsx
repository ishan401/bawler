"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Match, MatchEvent, InsightV2, Ball, WinProbPoint } from "@/lib/types";
import { calculateWinProbForMatch, totalBallsForFormat, getLeadingTeamFromOverride } from "@/lib/winProb";
import { ballsPerSet, absoluteBallNumber, inningsProgressLabel, situationLabel } from "@/lib/formatUtils";
import { extractMatchEvents } from "@/lib/events";
import { APP_VERSION_LABEL } from "@/lib/version";
import { formatPlayerName } from "@/lib/playerName";
import ScoreBar from "@/components/ScoreBar";
import MiniInsightsBar from "@/components/MiniInsightsBar";
import BallGIF from "@/components/BallGIF";
import WinProbChart from "@/components/WinProbChart";
import MomentsStrip from "@/components/MomentsStrip";
import MatchTabs, { type TabKey, type TabBadge } from "@/components/MatchTabs";
import { useTabSwitcher, ENTRANCE_ANIMATION_MS } from "@/lib/useTabSwitcher";
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
import WinProbBadge from "@/components/WinProbBadge";
import { getMatchupStats } from "@/lib/mockMatchups";
import { deriveBattingCardFromBalls, deriveBowlingCardFromBalls, shouldRunMockSimulationTicker, countWicketEquivalentRetirements, appendMissingIdentities } from "@/lib/matchStatus";
import { runGuarded } from "@/lib/pointerGuard";
import { markQuestItem } from "@/lib/firstSessionQuest";

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
 * Win probability is rendered via the shared WinProbBadge component (see
 * components/WinProbBadge.tsx) — the emphasized readout in the matchup row
 * (MatchupCard, since v1.0.121), or the "Win Probability" card below when
 * there's no ball-by-ball data to feed a matchup row (v1.0.123). Tapping the
 * matchup-row badge opens the same full-screen WinProbChart either way.
 */
export default function MatchView({ match, insights: insightsProp }: MatchViewProps) {
  const allBalls = useMemo(() => match.innings.flatMap(i => i.balls), [match]);

  const [selectedBallId, setSelectedBallId] = useState<string | null>(null);
  const [liveBallIdx, setLiveBallIdx] = useState(Math.max(0, allBalls.length - 1));
  const isLiveFollowing = selectedBallId === null;

  // v1.0.165: first-session quest -- "open a live match" fires on any
  // visit to a live match's page, regardless of which tab is active (the
  // loose trigger this project's own onboarding build spec settled on,
  // over a stricter "must switch to the Live tab specifically" bar).
  // markQuestItem() itself is a no-op unless the quest is actually
  // initialized and not yet marked done, so this is safe to call
  // unconditionally on every mount, including for users who never went
  // through onboarding at all.
  useEffect(() => {
    if (match.status === "live") markQuestItem("openLiveMatch");
  }, [match.status]);

  // Auto-advance every BALL_DWELL_MS (24 sec), looping back into the last
  // ~10 balls once playback catches up — only when in live-follow mode AND
  // only for a match explicitly marked `isMockSimulation: true`
  // (lib/types.ts). This whole effect is a demo-harness concept with no
  // real-world counterpart: a genuine live feed reports whatever the
  // match's actual current state is and has nothing further to report
  // once it does — there's no "keep looping through recent balls forever
  // so it doesn't look frozen" behavior for real data, ever. Gating on an
  // explicit per-match flag (rather than e.g. `match.status === "live"`,
  // which real live matches will also legitimately be) means this can
  // never accidentally fire against real data: the flag defaults to
  // false/absent, and only the handful of mock fixtures deliberately kept
  // "live" forever with no real clock (see lib/mockData.ts) opt in.
  useEffect(() => {
    if (!shouldRunMockSimulationTicker(match, isLiveFollowing)) return;
    const id = setInterval(() => {
      // Deferred through runGuarded() (lib/pointerGuard.ts) rather than
      // called directly: this setState re-derives truncatedMatch, which
      // mutates the DOM of whatever's currently live (a not-out batter's
      // row, the current bowler's figures, BallGIF's share button, etc.).
      // A tap landing in that same instant can be dropped by the browser
      // before any click handler runs it -- see DECISIONS-LOG.md. Any
      // gesture in progress anywhere on the page defers this update until
      // the gesture ends, instead of letting it land mid-tap.
      runGuarded(() => {
        setLiveBallIdx(idx => (idx >= allBalls.length - 1 ? Math.max(0, allBalls.length - 10) : idx + 1));
      });
    }, BALL_DWELL_MS);
    return () => clearInterval(id);
  }, [isLiveFollowing, allBalls.length, match]);

  const activeBallIdx = useMemo(() => {
    if (selectedBallId === null) return liveBallIdx;
    const idx = allBalls.findIndex(b => b.id === selectedBallId);
    return idx >= 0 ? idx : liveBallIdx;
  }, [selectedBallId, liveBallIdx, allBalls]);

  const isUpcoming = match.status === "upcoming" || match.status === "pre-match";
  // A finished match has no "live" state left to show -- Digest takes over
  // slot 1 in its place instead of being appended as an extra tab (see
  // firstTab below). Scoped to "post-match" specifically, not the broader
  // "!== live" -- an upcoming/pre-match fixture has no result or innings
  // data to build any kind of digest from, so it keeps today's exact
  // tab layout untouched.
  const isFinished = match.status === "post-match";
  // Show TABLE tab if the match's own competition OR its championship (e.g. WTC) has standings
  const tableComp = match.championship?.hasStandings ? match.championship : match.competition;
  const showTable = tableComp.hasStandings;
  // Old standalone-extra-Digest-tab behavior -- unchanged for a still-live
  // match with ball data. Finished matches get Digest in slot 1 instead
  // (firstTab below), so this is forced false for them regardless of ball
  // data, avoiding a duplicate Digest entry.
  const showDigest = allBalls.length > 0 && !isUpcoming && !isFinished;
  const firstTab: "live" | "digest" = isFinished ? "digest" : "live";
  const defaultTab: TabKey = isUpcoming ? "info" : isFinished ? "digest" : "live";

  // Restore the last-viewed tab when navigating back from a player profile.
  // Render with defaultTab on both server and the client's first pass (no
  // sessionStorage read during render -- that would differ between server
  // and the client's own pre-hydration render and trigger a hydration
  // mismatch). The real saved tab, if any, is read after mount below.
  const SESSION_KEY = `matchTab:${match.id}`;

  // Every tab this match can show, in display order -- computed here (not
  // down where it used to live, next to the old swipe-gesture code) because
  // useTabSwitcher needs it up front to derive a forward/backward direction.
  const TABS_ORDER: TabKey[] = isFinished
    ? [
        "digest",
        "scorecard",
        "info",
        ...(showTable ? ["table" as TabKey] : []),
      ]
    : [
        "live",
        "scorecard",
        ...(showDigest ? ["digest" as TabKey] : []),
        "info",
        ...(showTable ? ["table" as TabKey] : []),
      ];

  // Shared tab-switching state (lib/useTabSwitcher.ts) -- see its module
  // doc comment for the real, reproduced bug this replaced: this page used
  // to keep a second, timer-delayed "renderedTab" state that could show
  // stale content under the wrong highlighted tab, and never reset scroll
  // on a switch. `tab` here IS `activeTab` from the hook -- there is no
  // second copy for content to lag behind.
  const { activeTab: tab, direction, switchTab, restoreTab } = useTabSwitcher<TabKey>(defaultTab, {
    order: TABS_ORDER,
  });

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) as TabKey | null;
    if (!saved) return;
    // A saved tab can go stale -- e.g. "live" was stored while this match
    // was still in progress, and it has since finished, so "live" is no
    // longer part of this match's tab set. Fall back to defaultTab rather
    // than restoring a tab that no longer exists for this match.
    const restored = isFinished && saved === "live" ? defaultTab : saved;
    if (restored === defaultTab) return;
    // restoreTab, not switchTab -- this is a silent, hydration-safe
    // post-mount correction, not a user-triggered switch. See
    // lib/useTabSwitcher.ts's restoreTab doc comment for why using
    // switchTab here would be wrong (it would yank scroll and play the
    // tab-change animation on first paint).
    restoreTab(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SESSION_KEY]);

  // Thin wrapper: persist the new tab for back-navigation restore, on top
  // of the shared hook's state-sync + scroll-reset guarantee. This is the
  // only thing that was genuinely MatchView-specific about the old
  // goToTab -- everything else (state sync, scroll reset, no-op on a
  // same-tab call) now lives once, in the shared hook.
  const goToTab = useCallback((newTab: TabKey) => {
    switchTab(newTab);
    sessionStorage.setItem(SESSION_KEY, newTab);
  }, [switchTab, SESSION_KEY]);

  // v1.0.178 -- `hasShownLiveSceneRef`/`skipEntranceAnimation` (v1.0.175)
  // removed. That mechanism existed to suppress BallGIF's entrance-fade
  // animation on tab-switch-back remounts; the entrance-fade animation
  // itself has been removed at the source (see components/BallGIF.tsx's
  // v1.0.178 comment) as part of an architecture change making the Live
  // scene visible-by-default instead of animation-dependent, after four
  // rounds of patches (v1.0.174-177) on the old approach all failed to
  // fully close the gap. Nothing left in BallGIF.tsx reads a
  // `skipEntranceAnimation` prop, so there is nothing left to gate here.
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
  // Same wash-out mechanism ENTRANCE_ANIMATION_MS fixes for the tab panes
  // (see lib/useTabSwitcher.ts's comment) applies here too: this modal's
  // wrapper carries `book-enter-forward` for as long as it's open (it's
  // only ever swapped for `book-exit-backward` while actively closing), so
  // its content -- WinProbChart's own SVG -- stayed pinned to the same
  // degraded compositing layer for the modal's entire open duration, which
  // for this specific view is often minutes, not milliseconds. Once the
  // entrance has had its declared 300ms to finish, drop the class so the
  // modal settles into ordinary, non-GPU-layer-promoted painting for as
  // long as it stays open -- reset back to false on close so the next open
  // replays the entrance from a clean state.
  const [hasEnteredProbModal, setHasEnteredProbModal] = useState(false);
  useEffect(() => {
    if (!showProbModal) { setHasEnteredProbModal(false); return; }
    const id = setTimeout(() => setHasEnteredProbModal(true), ENTRANCE_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [showProbModal]);

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

  // ── Swipe between tabs ──────────────────────────────────────────
  // TABS_ORDER now lives up near useTabSwitcher (it needs it too) -- the
  // book-page-turn setTimeout choreography that used to live here is gone;
  // goToTab (defined above, right next to the shared hook) is what both
  // MatchTabs' onChange and onSwipeEnd below call.
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
        // Innings fully consumed -- `runs`/`wickets`/`overs` (simple
        // innings-level totals) are trusted from `inn` unchanged, since
        // "final" and "current playback position" are the same thing for
        // those scalar fields. `battingCard`/`bowlingCard` need care --
        // v1.0.159: a real incident proved a hand-authored card can be
        // genuinely INCOMPLETE (missing rows for real ball-participants)
        // even once every ball in the innings is visible.
        // `ind-eng-test-2026-d3-live`'s England 1st innings (199/10) only
        // had 8 hand-authored batting-card rows, silently omitting the
        // tail order (S Broad, J Anderson, J Leach, M Wood -- real
        // recorded deliveries, real runs) -- this branch used to spread
        // that 8-row card straight through untouched.
        //
        // The fix is deliberately APPEND-ONLY, not a full re-derivation
        // of every row. An earlier version of this fix called
        // `deriveBattingCardFromBalls(truncBalls, inn.battingCard, ...)`
        // the same way the mid-innings branch below does -- verified
        // directly against this exact innings before shipping, and
        // caught a real regression: this same fixture's ball data has TWO
        // dismissals (C Woakes "b Bumrah", J Bairstow "c sub b Jadeja")
        // recorded on the hand-authored card with NO corresponding
        // `isWicket: true` ball anywhere in `balls` -- a separate,
        // pre-existing gap in this fixture's ball-by-ball authoring, not
        // an id/name join problem. Full re-derivation has no way to know
        // about a dismissal that was never represented as a ball, so it
        // silently turned both of them into "not out" with no dismissal
        // text -- an actively WORSE regression than the missing rows this
        // fix is meant to close. Appending-only never touches an already
        // -authored row, so it can't hit this: an existing entry's
        // out/dismissal/runs stay byte-identical to `inn.battingCard`
        // always; only a genuinely new row (no existing entry matches it
        // by id or name) gets added, computed from its own balls, which
        // is strictly better than not showing that player at all even if
        // an unflagged dismissal among the tail can't be perfectly
        // reconstructed either.
        const hasBalls = truncBalls.length > 0;
        const battingCard = hasBalls
          ? appendMissingIdentities(inn.battingCard, deriveBattingCardFromBalls(truncBalls, [], inn.retirements))
          : inn.battingCard;
        const bowlingCard = hasBalls
          ? appendMissingIdentities(inn.bowlingCard, deriveBowlingCardFromBalls(truncBalls, [], match.format))
          : inn.bowlingCard;
        innings.push({ ...inn, balls: truncBalls, battingCard, bowlingCard });
      } else {
        // Viewing mid-innings — derive runs/wickets/overs AND each
        // player's card entry from the exact same truncated ball slice.
        // battingCard/bowlingCard must never be spread through from `inn`
        // unchanged here: that's the original, END-OF-INNINGS card, and
        // doing so is exactly what let the header/mini-insights chips
        // (components/MiniInsightsBar.tsx) and the Scorecard tab show a
        // batter's FINAL runs/balls/out-status while playback was still
        // genuinely mid-innings — see DECISIONS-LOG.md v1.0.131 for the
        // real snapshot (a wicket ball for R Pant appearing alongside a
        // header still reading his frozen not-out final score) that
        // exposed this. deriveBattingCardFromBalls/deriveBowlingCardFromBalls
        // (lib/matchStatus.ts) recompute every mutable field from `truncBalls`
        // — the same slice `runs`/`wickets`/`overs` below are computed
        // from — so there is exactly one source of truth for "what does
        // this innings look like right now," not a partial recompute.
        const hasBalls  = truncBalls.length > 0;
        const runs      = truncBalls.reduce((s, b) => s + b.runs + b.extras, 0);
        // Live wickets: real ball-derived dismissals PLUS any "retired --
        // out" event that's happened yet at this exact playback position
        // (never "retired -- not out", which by definition doesn't count
        // as a dismissal -- same as real cricket). Retirements live in
        // `inn.retirements`, never in `balls`, so this can't be folded
        // into the `.filter(isWicket)` count above it -- see
        // RetirementRecord's doc comment in lib/types.ts for why.
        const wickets   = truncBalls.filter(b => b.isWicket).length
          + countWicketEquivalentRetirements(inn.retirements, truncBalls);
        const lastBall  = truncBalls[truncBalls.length - 1];
        const overs     = lastBall
          ? lastBall.over - 1 + (lastBall.ballInOver + 1) / ballsPerSet(match.format)
          : 0;
        innings.push({
          ...inn,
          balls:       truncBalls,
          runs:        hasBalls ? runs    : inn.runs,
          wickets:     hasBalls ? wickets : inn.wickets,
          overs:       hasBalls ? Math.round(overs * 10) / 10 : inn.overs,
          battingCard: hasBalls ? deriveBattingCardFromBalls(truncBalls, inn.battingCard, inn.retirements) : inn.battingCard,
          bowlingCard: hasBalls ? deriveBowlingCardFromBalls(truncBalls, inn.bowlingCard, match.format) : inn.bowlingCard,
        });
      }
    }

    // `result` (and anything else keyed off "has this match actually
    // concluded") must NOT just spread through from `match` unchanged --
    // that field describes the match's EVENTUAL/final outcome, which is
    // only true right now if playback has genuinely caught up to the real
    // end of the recorded ball data. `match.status` can't be used as that
    // signal instead: FEATURED_MATCH is deliberately kept at
    // `status: "live"` forever (see lib/mockData.ts) so it stays visible
    // in the homepage's live carousel even once its scripted chase has
    // fully played out, and the `liveBallIdx` ticking interval above
    // loops back into the final ~10 balls forever rather than stopping --
    // meaning this component is asked to render a genuinely mid-playback
    // snapshot most of the time, punctuated by brief moments where
    // playback happens to reach the real last ball. Every consumer this
    // truncated match flows into (DigestTab's match-summary card, in
    // particular -- see lib/matchStatus.ts's isMatchConcluded()) treats
    // `result != null` as "the match is over" -- so this is the one place
    // responsible for making sure that's only ever true when it's
    // actually true for what's currently visible. A match with no
    // ball-by-ball data at all (allBalls.length === 0) was never being
    // truncated in the first place -- `result` there is already whatever
    // the raw record says, trusted as-is, same as always.
    const allBallsConsumed = allBalls.length === 0 || activeBallIdx >= allBalls.length - 1;
    return { ...match, innings, result: allBallsConsumed ? match.result : undefined };
  }, [match, activeBallIdx, allBalls]);

  const winProbPoints = useMemo(() => calculateWinProbForMatch(truncatedMatch), [truncatedMatch]);
  const events = useMemo(() => extractMatchEvents(truncatedMatch), [truncatedMatch]);

  const visibleInsights = useMemo(() => {
    const seenBallIds = new Set(allBalls.slice(0, activeBallIdx + 1).map(b => b.id));
    const insights = insightsProp ?? MOCK_INSIGHTS_V2;
    // v1.0.162: matchId gate is PRIMARY and non-negotiable -- an insight
    // that isn't explicitly tagged for this match must never render here,
    // regardless of ball-level scoping. Ball-level scoping (relatedBallId)
    // is a secondary filter applied only within the current match's own
    // insights. This is what stops MOCK_INSIGHTS_V2's shared pool (every
    // match's insights live in one flat array) from bleeding across
    // matches -- see DECISIONS-LOG.md for the cross-match bleed this fixes.
    return insights
      .filter(i => i.matchId === match.id)
      .filter(i => !i.relatedBallId || seenBallIds.has(i.relatedBallId));
  }, [activeBallIdx, allBalls, insightsProp, match.id]);

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

  // v1.0.191: handleMomentShare (used to look up the ball for a Moments-card
  // share tap and hand it to the shared triggerShare() story-card capture)
  // is removed entirely along with the Moments card's own share icon --
  // see MomentsStrip.tsx and DECISIONS-LOG.md. triggerShare() itself is
  // untouched and still powers BallGIF's own unrelated share button below.

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
          const text = `${formatPlayerName(matchupShareTarget.batterName)} vs ${formatPlayerName(matchupShareTarget.bowlerName)} · bawler-gold.vercel.app`;
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

  // The fixed header's real height varies by format/match-state (Test's
  // ScoreBar skips the RRR/chase-context row that limited-overs chases show,
  // ODI/Test show a format badge T20 doesn't, etc.) -- measure it instead of
  // hardcoding a px value, so any tab that needs to offset a sticky element
  // below the header (e.g. Scorecard's sticky innings header) stays flush
  // against it in every format rather than leaving a gap or overlapping.
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(148);
  useEffect(() => {
    const el = stickyHeaderRef.current;
    if (!el) return;
    const measure = () => setStickyHeaderHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [truncatedMatch, tab]);

  return (
    <div className="min-h-screen flex flex-col" style={{ ["--sticky-header-h" as string]: `${stickyHeaderHeight}px` }}>
      {/* Sticky header */}
      <div ref={stickyHeaderRef} className="sticky top-0 z-30">
        <ScoreBar match={truncatedMatch} />
        <MiniInsightsBar
          match={truncatedMatch}
          insights={visibleInsights}
        />
        <MatchTabs active={tab} onChange={goToTab} badge={scorecardBadge} showTable={showTable} showDigest={showDigest} firstTab={firstTab} />
      </div>

      <main className="flex-1 px-3 py-3 pb-24" onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>
        {/* key={tab} forces a full remount on every genuine tab change,
            which is what replays the CSS entrance animation below -- there
            is no JS timer gating when this content mounts; it mounts in the
            same render `tab` changes in (see lib/useTabSwitcher.ts). Only an
            "enter" animation is applied, never an "exit" one: the outgoing
            tab's content is simply gone once `tab` changes, so there is
            nothing left on screen to animate out of view -- the book-exit-*
            classes are unused here now (still used by the win-prob modal
            below, a genuinely different, single-boolean open/close case). */}
        <div key={tab} data-active-tab={tab} className={`space-y-3 ${direction === "backward" ? "book-enter-backward" : direction === "forward" ? "book-enter-forward" : ""}`}>
        {tab === "live" && (
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

                {/* Win probability — same neutral WinProbBadge used everywhere
                    else on the platform (see WinProbBadge.tsx). This block
                    used to be a bespoke, team-colored split bar written only
                    for this no-ball-by-ball fallback path, which is exactly
                    how it drifted out of sync with the v1.0.121 neutral-color
                    decision applied elsewhere (v1.0.123 fix). The leader
                    derivation itself still lives in one place
                    (getLeadingTeamFromOverride, lib/winProb.ts) — this
                    component only renders whatever that function returns. */}
                {(() => {
                  const winProb = getLeadingTeamFromOverride(match, match.liveWinProbOverride);
                  return winProb && (
                    <div className="card px-4 py-3 space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Win Probability</span>
                      {/* v1.0.130: no more !px-0 override -- WinProbBadge's
                          own pill now supplies its own padding, same as
                          every other call site (see WinProbBadge.tsx). */}
                      <WinProbBadge variant="large" label={winProb.label} pct={winProb.pct} />
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
                      match={truncatedMatch}
                      winProbPoints={winProbPoints}
                      onExpandWinProb={() => setShowProbModal(true)}
                    />
                  </div>
                )}
                <MomentsStrip
                  events={events}
                  activeBallId={currentBall?.id}
                  isLive={isLiveFollowing}
                  onSelect={handleMomentSelect}
                  format={match.format}
                />
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Live commentary</span>
                    <span className="text-[10px] text-text-secondary">{visibleInsights.length} insights</span>
                  </div>
                  <CommentaryFeed match={truncatedMatch} insights={visibleInsights} />
                </div>
              </>
            )}
          </>
        )}

        {tab === "scorecard" && <Scorecard match={truncatedMatch} />}
        {tab === "digest" && (
          // A finished match's Digest tells the whole-match story with the
          // outcome already known -- it always uses the full match/balls,
          // never the ball-scrubber's truncated view (that scrubber only
          // makes sense for the in-progress replay a live match's own
          // Digest tab shows).
          <DigestTab
            match={isFinished ? match : truncatedMatch}
            allBalls={allBalls}
          />
        )}
        {tab === "info" && <InfoTab match={truncatedMatch} />}
        {tab === "table" && <StandingsTab competition={tableComp} />}

        <footer className="text-[10px] text-text-dim text-center pt-2 pb-8">
          {/* Sourced from lib/version.ts (package.json's "version" field) --
              never hardcode a version literal here again. See lib/version.ts
              for why (v1.0.65 was hardcoded and never updated across 17
              subsequent releases until a user caught it in v1.0.82). */}
          Bawler {APP_VERSION_LABEL} · all data mocked
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
            className={`${isClosingProb ? "book-exit-backward" : hasEnteredProbModal ? "" : "book-enter-forward"} w-full max-w-[430px] flex flex-col`}
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
