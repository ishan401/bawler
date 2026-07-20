"use client";

import React, { useRef, useState } from "react";
import type { Match, Innings, BattingEntry, BowlingEntry, Team, Ball } from "@/lib/types";
import Link from "next/link";
import { ALL_TEAMS, resolvePlayerSlug, PLAYERS } from "@/lib/mockData";
import { teamInningsOccurrence } from "@/lib/formatUtils";

interface ScorecardProps {
  match: Match;
}

export default function Scorecard({ match }: ScorecardProps) {
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
  const [selectedInningsNum, setSelectedInningsNum] = useState<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  if (match.innings.length === 0) {
    const isLive = match.status === "live" || match.status === "toss";
    const isUpcoming = match.status === "upcoming" || match.status === "pre-match";
    return (
      <div className="space-y-3">
        <div className="card p-6 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">{isUpcoming ? "🗓️" : isLive ? "📡" : "🏏"}</span>
          <p className="text-sm font-bold text-text-primary">
            {isUpcoming ? "Match hasn't started yet" : isLive ? "Scorecard updating…" : "Scorecard not available"}
          </p>
          <p className="text-xs text-text-secondary max-w-[220px]">
            {isUpcoming
              ? "The scorecard will appear here once the toss happens and the match begins."
              : isLive
              ? "Innings data will populate here as the match progresses. Check the Live tab for the current score."
              : "Detailed innings data was not recorded for this match."}
          </p>
          {match.liveStatusOverride && (
            <div className="mt-1 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: `${match.teamA.primaryColor}22`, color: match.teamA.primaryColor }}>
              {match.liveStatusOverride}
            </div>
          )}
        </div>
      </div>
    );
  }

  const motm = match.result?.manOfMatch;
  const mots = match.result?.manOfTournament;

  const momMosBanners = (motm || mots) && (
    <div className="flex flex-col gap-1.5">
      {motm && (
        <div className="card px-3 py-2 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim shrink-0">Man of Match</span>
          <span className="text-sm font-extrabold text-yellow-400">{motm}</span>
        </div>
      )}
      {mots && (
        <div className="card px-3 py-2 flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim shrink-0">Man of Series</span>
          <span className="text-sm font-extrabold text-special">{mots}</span>
        </div>
      )}
    </div>
  );

  // Test matches can have up to 4 innings (a team bats twice), so a plain
  // two-team toggle can't address a specific innings unambiguously. Use one
  // chip per innings instead, labelled "<Team> Inn. <N>" where N is which
  // innings this is FOR THAT TEAM (1st or 2nd), not the global innings
  // number -- e.g. "IND Inn. 1", "ENG Inn. 1", "ENG Inn. 2". Default to
  // whichever innings is currently in progress (see non-Test comment below
  // for why match.innings' last entry is always "current").
  if (match.format === "Test") {
    const latestInningsNum = match.innings[match.innings.length - 1]?.number ?? null;
    const activeInningsNum = selectedInningsNum ?? latestInningsNum;
    const activeTestInnings =
      match.innings.find(i => i.number === activeInningsNum) ?? match.innings[match.innings.length - 1];

    const handleSelectInnings = (num: number) => {
      setSelectedInningsNum(num);
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };

    return (
      <div>
        {momMosBanners && <div className="mb-3">{momMosBanners}</div>}

        <div ref={topRef}>
          <TestInningsChips
            innings={match.innings}
            activeInningsNum={activeInningsNum!}
            onSelect={handleSelectInnings}
          />
        </div>

        {activeTestInnings && (
          <InningsCard key={activeTestInnings.number} innings={activeTestInnings} match={match} />
        )}
      </div>
    );
  }

  // Non-Test formats (T20/T20I/ODI/Hundred): each team bats exactly once, so
  // a simple two-team toggle maps 1:1 onto the two innings. Default to
  // whichever team is currently batting — match.innings only contains
  // innings "reached so far" (see MatchView's truncatedMatch), so the last
  // entry is always the in-progress team for a live match, or the team that
  // batted last for a completed one.
  const latestBattingTeam = match.innings[match.innings.length - 1]?.battingTeam ?? match.teamA.code;
  const activeTeamCode = selectedTeamCode ?? latestBattingTeam;
  const activeInnings = match.innings.find(i => i.battingTeam === activeTeamCode);

  const handleSelectTeam = (code: string) => {
    setSelectedTeamCode(code);
    // Switching teams swaps which innings renders below; without this the
    // page can stay scrolled past the end of a shorter innings, or mid-way
    // down a taller one, landing on blank space instead of the new innings.
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div>
      {momMosBanners && <div className="mb-3">{momMosBanners}</div>}

      <div ref={topRef}>
        <TeamToggle
          teamA={match.teamA}
          teamB={match.teamB}
          activeTeamCode={activeTeamCode}
          onSelect={handleSelectTeam}
        />
      </div>

      {activeInnings ? (
        <InningsCard key={activeInnings.number} innings={activeInnings} match={match} />
      ) : (
        <div className="card p-6 flex flex-col items-center gap-1.5 text-center">
          <span className="text-2xl">🏏</span>
          <p className="text-sm font-bold text-text-primary">Yet to bat</p>
          <p className="text-xs text-text-secondary">This team hasn't started their innings yet.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Small pill chips, one per team — tap either to switch which team's
 * scorecard is shown below. Sized to match DigestTab's own filter chips
 * rather than stretching to fill the row. Always shows both team names
 * regardless of whether both have batted yet.
 */
function TeamToggle({
  teamA,
  teamB,
  activeTeamCode,
  onSelect,
}: {
  teamA: Team;
  teamB: Team;
  activeTeamCode: string;
  onSelect: (code: string) => void;
}) {
  // Byte-identical chip markup to DigestTab's own filter chips (Day N /
  // Nth Innings) -- same classNames, no extra wrapper/dot/gap -- per
  // feedback that even the shrunk version was still visibly bulkier than
  // Digest's chips (the flex+gap+dot was adding width/height Digest's
  // plain-text chip doesn't have).
  return (
    <div className="flex gap-2 pb-3">
      {[teamA, teamB].map(team => {
        const active = team.code === activeTeamCode;
        return (
          <button
            key={team.code}
            onClick={() => onSelect(team.code)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              active
                ? "bg-cyan text-bg-base border-cyan"
                : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
            }`}
          >
            {team.shortName}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Test-only: one chip per innings (up to 4), same compact style as
 * TeamToggle/DigestTab's chips. Label = "<Team> Inn. <N>" where N counts
 * how many times THIS team has batted so far, e.g. IND Inn. 1, ENG Inn. 1,
 * ENG Inn. 2 -- not the global match.innings sequence number, which would
 * read as an unhelpful "Innings 3" with no indication whose 2nd innings it is.
 */
function TestInningsChips({
  innings,
  activeInningsNum,
  onSelect,
}: {
  innings: Innings[];
  activeInningsNum: number;
  onSelect: (num: number) => void;
}) {
  const items = innings.map(inn => {
    const team = ALL_TEAMS[inn.battingTeam];
    const shortName = team?.shortName ?? inn.battingTeam;
    return { value: inn.number, label: `${shortName} Inn. ${teamInningsOccurrence(innings, inn)}` };
  });

  return (
    <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
      {items.map(item => {
        const active = item.value === activeInningsNum;
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              active
                ? "bg-cyan text-bg-base border-cyan"
                : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function InningsCard({ innings, match }: { innings: Innings; match: Match }) {
  const team = ALL_TEAMS[innings.battingTeam];

  // Compute highlights
  const topScorer = innings.battingCard.reduce(
    (best, row) => (row.runs > (best?.runs ?? -1) ? row : best),
    null as BattingEntry | null
  );
  const topWicketTaker = innings.bowlingCard.reduce(
    (best, row) => {
      if (row.wickets > (best?.wickets ?? -1)) return row;
      // Tiebreak: among bowlers tied on wickets, lowest economy wins -- not
      // lowest raw runsConceded, which unfairly favors whoever bowled fewer
      // overs regardless of rate (v1.0.69 fix).
      if (row.wickets === (best?.wickets ?? -1) && row.economy < (best?.economy ?? Infinity)) return row;
      return best;
    },
    null as BowlingEntry | null
  );
  const topSR = innings.battingCard
    .filter(r => r.ballsFaced >= 6)
    .reduce(
      (best, row) => (row.strikeRate > (best?.strikeRate ?? -1) ? row : best),
      null as BattingEntry | null
    );

  // Group this innings' ball-by-ball data per batter, in chronological order,
  // for the batting-row sparklines. Older/completed matches recorded without
  // ball-by-ball data have innings.balls === [] -- every batter's slice is
  // then empty too, and BatterSparkline quietly renders nothing.
  // Match ball-by-ball data to a battingCard row by id OR by name, since
  // mockData.ts uses inconsistent conventions across matches:
  //   - some matches: ball.batterId === battingCard.playerId (shorthand ids)
  //   - others:       ball.batterId is the full display name, which only
  //                    lines up with battingCard.playerName, while
  //                    playerId is a separate slug ("zcrwly")
  // Registering each ball under both its id and name key (deduped) means a
  // row lookup by either playerId or playerName finds it regardless of
  // which convention that particular match used.
  const ballsByBatter = new Map<string, Ball[]>();
  const registerBall = (key: string | undefined, b: Ball) => {
    if (!key) return;
    const arr = ballsByBatter.get(key);
    if (arr) arr.push(b);
    else ballsByBatter.set(key, [b]);
  };
  for (const b of innings.balls) {
    registerBall(b.batterId, b);
    if (b.batterName !== b.batterId) registerBall(b.batterName, b);
  }

  return (
    <div className="card">
      {/* Sticky innings header */}
      <div
        className="sticky z-20 bg-bg-elevated border-b border-line px-4 py-3 flex items-center justify-between rounded-t-2xl"
        style={{ top: "var(--sticky-header-h, 148px)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team?.primaryColor ?? "#94A3B8" }} />
          <h3 className="text-sm font-bold">
            {team?.fullName ?? innings.battingTeam}
            {/* "Innings N" only means anything in Test cricket -- a team
                bats exactly once in every other format, so there's never
                a 2nd innings to disambiguate from and the label is just
                noise. Test keeps it since a team's 2nd innings is real,
                distinguishing information there. */}
            {match.format === "Test" && (
              <>
                {" "}
                <span className="text-text-dim font-normal">·</span>{" "}
                <span className="text-text-secondary font-medium">
                  Innings {teamInningsOccurrence(match.innings, innings)}
                </span>
              </>
            )}
          </h3>
        </div>
        <div className="text-right num">
          <span className="text-lg font-extrabold">{innings.runs}</span>
          <span className="text-text-dim">/{innings.wickets}</span>
          <span className="text-text-secondary text-xs ml-1">({innings.overs} ov)</span>
        </div>
      </div>

      {/* Batting */}
      <div className="px-4 py-3">
        <SectionLabel>Batting</SectionLabel>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-text-dim">
              <th className="text-left font-semibold py-1.5 pr-2">Batter</th>
              <th className="text-right font-semibold py-1.5 px-1 num">R</th>
              <th className="text-right font-semibold py-1.5 px-1 num">B</th>
              <th className="text-right font-semibold py-1.5 px-1 num" style={{ color: "#06B6D4" }}>4s</th>
              <th className="text-right font-semibold py-1.5 px-1 num" style={{ color: "#A855F7" }}>6s</th>
              <th className="text-right font-semibold py-1.5 pl-1 num">SR</th>
            </tr>
          </thead>
          <tbody>
            {innings.battingCard.map(row => (
              <BatterRow
                key={row.playerId}
                row={row}
                balls={ballsByBatter.get(row.playerId) ?? ballsByBatter.get(row.playerName) ?? []}
                isTopScorer={row.playerId === topScorer?.playerId}
                isTopSR={row.playerId === topSR?.playerId}
                motm={match.result?.manOfMatch}
                mots={match.result?.manOfTournament}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Bowling */}
      <div className="px-4 py-3 border-t border-line">
        <SectionLabel>Bowling</SectionLabel>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-text-dim">
              <th className="text-left font-semibold py-1.5 pr-2">Bowler</th>
              <th className="text-right font-semibold py-1.5 px-1 num">O</th>
              <th className="text-right font-semibold py-1.5 px-1 num">M</th>
              <th className="text-right font-semibold py-1.5 px-1 num">R</th>
              <th className="text-right font-semibold py-1.5 px-1 num">W</th>
              <th className="text-right font-semibold py-1.5 pl-1 num">Econ</th>
            </tr>
          </thead>
          <tbody>
            {innings.bowlingCard.map(row => (
              <BowlerRow
                key={row.playerId}
                row={row}
                isTopWicketTaker={row.playerId === topWicketTaker?.playerId}
                motm={match.result?.manOfMatch}
                mots={match.result?.manOfTournament}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/**
 * Renders a player name as a tappable Link if a profile exists in PLAYERS,
 * otherwise as a plain span. This prevents broken links for unregistered players.
 */
function PlayerNameLink({
  playerId,
  playerName,
  nameColor,
}: {
  playerId: string;
  playerName: string;
  nameColor: string;
}) {
  const slug = resolvePlayerSlug(playerId);
  if (PLAYERS[slug]) {
    return (
      <Link
        href={`/player/${slug}`}
        className={`font-medium ${nameColor} underline decoration-dotted underline-offset-2 decoration-white/30`}
      >
        {playerName}
      </Link>
    );
  }
  return <span className={`font-medium ${nameColor}`}>{playerName}</span>;
}

function BatterRow({
  row,
  balls,
  isTopScorer,
  isTopSR,
  motm,
  mots,
}: {
  row: BattingEntry;
  balls: Ball[];
  isTopScorer: boolean;
  isTopSR: boolean;
  motm?: string;
  mots?: string;
}) {
  const isMotm = motm && row.playerName === motm;
  const isMots = mots && row.playerName === mots;
  // "At the crease right now" -- not dismissed, and has actually faced a
  // ball (excludes an incoming batter's still-empty placeholder row).
  const isLiveBatter = !row.out && row.ballsFaced > 0;

  const nameColor = isMots
    ? "text-special"
    : isMotm
    ? "text-yellow-400"
    : row.out
    ? "text-text-secondary"
    : "text-text-primary";

  const sparklinePoints = buildSparklinePoints(balls, row.fours, row.sixes);

  return (
    <tr className={`border-t border-line/50 last:border-b-0 ${isLiveBatter ? "bg-cyan/[0.035]" : ""}`}>
      <td className="py-2 pr-2">
        {/* The glow lives on this inner wrapper, not the <tr>, and is
            rounded + blur-only (no hard outset ring) -- confining it to
            just the name/sparkline column reads as "this player's info is
            glowing" rather than a stark rectangle boxing the whole row,
            which is what a box-shadow on a plain table row looks like. */}
        <div className={isLiveBatter ? "excitement-glow -mx-1.5 -my-1 px-1.5 py-1 rounded-lg" : ""}>
          <div className="flex items-center gap-1.5">
            <PlayerNameLink playerId={row.playerId} playerName={row.playerName} nameColor={nameColor} />
            {row.onStrike && !row.out && (
              <span className="text-[9px] font-bold text-cyan tracking-widest">*</span>
            )}
            {isMotm && (
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-yellow-400 bg-yellow-400/15 px-1 py-0.5 rounded leading-none">MOM</span>
            )}
            {isMots && (
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-special bg-special/10 px-1 py-0.5 rounded leading-none">MOS</span>
            )}
          </div>
          {row.out && row.dismissal && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-text-dim italic shrink-0">{row.dismissal}</span>
              <BatterSparkline points={sparklinePoints} live={false} />
            </div>
          )}
          {isLiveBatter && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-cyan font-semibold shrink-0">not out</span>
              <BatterSparkline points={sparklinePoints} live={true} />
            </div>
          )}
        </div>
      </td>
      <td className={`py-2 px-1 text-right num font-bold ${isTopScorer ? "text-teal-400" : ""}`}>
        {row.runs}
      </td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.ballsFaced}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.fours}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.sixes}</td>
      <td className={`py-2 pl-1 text-right num ${isTopSR ? "text-blue-400 font-bold" : "text-text-secondary"}`}>
        {row.strikeRate.toFixed(1)}
      </td>
    </tr>
  );
}

interface SparklinePoint {
  x: number; // cumulative balls faced
  y: number; // cumulative runs
  isFour: boolean;
  isSix: boolean;
}

/**
 * Cumulative runs-vs-balls-faced for one batter, in strict chronological
 * order. Mirrors lib/events.ts's own batter-tracking logic (isFaced
 * excludes wides; runs accumulate off every ball) so this stays consistent
 * with how milestones/events are derived elsewhere.
 *
 * maxFours/maxSixes are the batter's own official 4s/6s column values.
 * Some mock matches have ball-by-ball data that was authored independently
 * of (and doesn't reconcile with) the box-score aggregate -- a batter's
 * balls can carry more isBoundary4/isBoundary6 flags than their card
 * actually credits them with. The box-score column is the number the user
 * sees and trusts, so a dot is only kept while under that budget; once
 * maxFours/maxSixes dots have been placed, later flagged balls still raise
 * the line (their runs still count) but stop getting marked -- the chart
 * never shows more boundaries than the row's own 4s/6s say it had.
 */
function buildSparklinePoints(balls: Ball[], maxFours: number, maxSixes: number): SparklinePoint[] {
  const pts: SparklinePoint[] = [{ x: 0, y: 0, isFour: false, isSix: false }];
  let runs = 0;
  let faced = 0;
  let fourCount = 0;
  let sixCount = 0;
  for (const b of balls) {
    runs += b.runs;
    if (b.extraType !== "wd") faced++;
    const isFour = b.isBoundary4 && fourCount < maxFours;
    const isSix = b.isBoundary6 && sixCount < maxSixes;
    if (isFour) fourCount++;
    if (isSix) sixCount++;
    pts.push({ x: faced, y: runs, isFour, isSix });
  }
  return pts;
}

/**
 * Down-samples a points array to at most `max` points for a cleaner-looking
 * line -- a Test knock can rack up 50+ balls-faced points, which reads as
 * visual noise at ~100x20px. Always keeps the first/last point and every
 * four/six (so no boundary marker is ever dropped); fills the remainder
 * with evenly-spaced samples.
 */
function downsampleSparkline(points: SparklinePoint[], max = 13): SparklinePoint[] {
  if (points.length <= max) return points;
  const keep = new Set<number>([0, points.length - 1]);
  points.forEach((p, i) => { if (p.isFour || p.isSix) keep.add(i); });
  const remaining = max - keep.size;
  if (remaining > 0) {
    const step = (points.length - 1) / (remaining + 1);
    for (let i = 1; i <= remaining; i++) keep.add(Math.round(i * step));
  }
  return [...keep].sort((a, b) => a - b).map(i => points[i]);
}

/** Catmull-Rom smoothed path -- same technique as WinProbChart's line, just
 * a lighter touch (data here is monotonic, so it needs less correction). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Tiny inline sparkline on the dismissal/"not out" line -- a smoothed,
 * down-sampled runs-vs-balls-faced curve with a colored dot marking every
 * four/six (cyan / six-purple, matching the outcome palette). Renders
 * nothing when there's no ball-by-ball data for this batter (yet to bat, or
 * an older match recorded without ball data) -- the dismissal line then
 * looks exactly as it did before this existed.
 */
function BatterSparkline({ points, live }: { points: SparklinePoint[]; live: boolean }) {
  if (points.length < 2) return null;
  const sampled = downsampleSparkline(points);

  const W = 100;
  const H = 20;
  const PAD_X = 3;
  const PAD_Y = 4;
  const maxX = sampled[sampled.length - 1].x || 1;
  const maxY = Math.max(1, ...sampled.map(p => p.y));
  const xToPx = (x: number) => PAD_X + (x / maxX) * (W - PAD_X * 2);
  const yToPx = (y: number) => H - PAD_Y - (y / maxY) * (H - PAD_Y * 2);
  const px = sampled.map(p => ({ x: xToPx(p.x), y: yToPx(p.y), p }));

  const linePath = smoothPath(px);
  // Bright, high-contrast lines -- the point is to read the trend at a
  // glance, not to blend into the row. Cyan for the live batter, a near-
  // white light slate (not a dim mid-gray) for completed innings.
  const lineColor = live ? "#00E5FF" : "#E2E8F0";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="flex-1 h-5 min-w-[36px] max-w-[130px]"
      aria-hidden="true"
    >
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" opacity={live ? 1 : 0.9} />
      {px.map(({ x, y, p }, i) => {
        if (!p.isFour && !p.isSix) return null;
        const color = p.isSix ? "#A855F7" : "#00E5FF";
        return <circle key={i} cx={x} cy={y} r="3.2" fill={color} stroke="#0A0E1A" strokeWidth="1" />;
      })}
    </svg>
  );
}

function BowlerRow({
  row,
  isTopWicketTaker,
  motm,
  mots,
}: {
  row: BowlingEntry;
  isTopWicketTaker: boolean;
  motm?: string;
  mots?: string;
}) {
  const isMotm = motm && row.playerName === motm;
  const isMots = mots && row.playerName === mots;

  const nameColor = isMots
    ? "text-special"
    : isMotm
    ? "text-yellow-400"
    : "text-text-primary";

  return (
    <tr className="border-t border-line/50 last:border-b-0">
      <td className="py-2 pr-2">
        <div className="flex items-center gap-1.5">
          <PlayerNameLink playerId={row.playerId} playerName={row.playerName} nameColor={nameColor} />
          {isMotm && (
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-yellow-400 bg-yellow-400/15 px-1 py-0.5 rounded leading-none">MOM</span>
          )}
          {isMots && (
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-special bg-special/10 px-1 py-0.5 rounded leading-none">MOS</span>
          )}
        </div>
      </td>
      <td className="py-2 px-1 text-right num">{row.oversBowled}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.maidens}</td>
      <td className="py-2 px-1 text-right num">{row.runsConceded}</td>
      <td className={`py-2 px-1 text-right num font-bold ${isTopWicketTaker ? "text-wicket" : ""}`}>
        {row.wickets}
      </td>
      <td className="py-2 pl-1 text-right num text-text-secondary">{row.economy.toFixed(2)}</td>
    </tr>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">
      {children}
    </div>
  );
}
