"use client";

import React, { useRef, useState } from "react";
import type { Match, Innings, BattingEntry, BowlingEntry, Team, Ball } from "@/lib/types";
import Link from "next/link";
import { ALL_TEAMS, resolvePlayerSlug, PLAYERS } from "@/lib/mockData";
import { teamInningsOccurrence } from "@/lib/formatUtils";
import { resolveMatchAccentColors, hexToRgbTriplet } from "@/lib/teamAccentColor";
import { CYAN } from "@/lib/tokens";

interface ScorecardProps {
  match: Match;
}

/**
 * Team-names-with-final-scores header, above the scorecard body. Ported
 * from the "Live" tab fallback card MatchView used to show for any match
 * with no ball-by-ball data -- that fallback no longer exists for finished
 * matches (Live isn't a tab for them anymore), so its score header lives
 * here instead.
 *
 * v1.0.97 originally rendered this for every match status, live included
 * -- an unscoped expansion beyond what was asked (the original request
 * was to move the header out of the removed Live tab for FINISHED matches
 * only). v1.0.101 restricts it back to finished matches: the caller below
 * only constructs this component when `match.status !== "live"`, so the
 * `match.status === "live"` badge branch that used to live in this
 * component is gone too -- it could never fire once the caller's gate is
 * in place, and keeping unreachable "Live" markup here would be confusing.
 *
 * `match.liveStatusOverride` is also gone from this component for the same
 * reason: it's static flavor text authored for surfaces where nothing else
 * on screen is actively changing (Spotlight cards, homepage rows) -- it
 * was never meant to sit directly under score data, and doing so on a
 * still-live match was what caused v1.0.97's real bug (a frozen snapshot
 * string reading a different score than the live-ticking rows above it,
 * e.g. "IND 142/3 ... need 34 off 22" next to rows correctly showing
 * 155/6). Now that this card is finished-match-only, every current match
 * with `status: "post-match"` already has a real `match.result` (checked
 * across the full mock dataset), so the result banner below is sufficient
 * on its own -- there's no finished-match case that needs
 * `liveStatusOverride` as a fallback. It's untouched everywhere else it's
 * already used safely (Spotlight cards, homepage rows).
 */
function FinalScoreHeader({ match }: { match: Match }) {
  const innA = match.innings.find(i => i.battingTeam === match.teamA.code);
  const innB = match.innings.find(i => i.battingTeam === match.teamB.code);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: match.teamA.primaryColor }} />
        <span className="text-sm font-extrabold flex-1">{match.teamA.shortName}</span>
        <span className="text-lg font-extrabold num">{innA ? `${innA.runs}/${innA.wickets}` : "—"}</span>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: match.teamB.primaryColor }} />
        <span className="text-sm font-extrabold flex-1">{match.teamB.shortName}</span>
        <span className="text-lg font-extrabold num">{innB ? `${innB.runs}/${innB.wickets}` : "—"}</span>
      </div>

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
  );
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

  // Final score header -- the team-names-with-scores block that used to
  // live in the (now-removed-for-finished-matches) "Live" tab fallback for
  // matches with no ball-by-ball data. Shown above the scorecard body
  // whenever real innings data exists (this whole function has already
  // returned above for the innings.length === 0 case, so that fallback is
  // untouched). Restricted to finished matches only -- a still-live
  // match's Score tab goes back to showing just the scorecard body, no
  // header card, exactly as it did before this card existed. See
  // FinalScoreHeader's own comment for why this gate moved from a partial
  // in-component check (just the "Live" badge) to fully skipping
  // construction here.
  const finalScoreHeader = match.status !== "live" ? <FinalScoreHeader match={match} /> : null;

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
        {finalScoreHeader && <div className="mb-3">{finalScoreHeader}</div>}
        {momMosBanners && <div className="mb-3">{momMosBanners}</div>}

        <div ref={topRef}>
          <TestInningsChips
            innings={match.innings}
            teamA={match.teamA}
            teamB={match.teamB}
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
      {finalScoreHeader && <div className="mb-3">{finalScoreHeader}</div>}
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
  const accentColors = resolveMatchAccentColors(teamA, teamB);

  return (
    <div className="flex gap-2 pb-3">
      {[teamA, teamB].map(team => {
        const active = team.code === activeTeamCode;
        const accent = accentColors[team.code] ?? CYAN;
        return (
          <button
            key={team.code}
            onClick={() => onSelect(team.code)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              active
                ? "text-bg-base"
                : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
            }`}
            style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
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
  teamA,
  teamB,
  activeInningsNum,
  onSelect,
}: {
  innings: Innings[];
  teamA: Team;
  teamB: Team;
  activeInningsNum: number;
  onSelect: (num: number) => void;
}) {
  const accentColors = resolveMatchAccentColors(teamA, teamB);
  const items = innings.map(inn => {
    const team = ALL_TEAMS[inn.battingTeam];
    const shortName = team?.shortName ?? inn.battingTeam;
    return { value: inn.number, label: `${shortName} Inn. ${teamInningsOccurrence(innings, inn)}`, team };
  });

  return (
    <div className="flex gap-2 pb-3 overflow-x-auto no-scrollbar">
      {items.map(item => {
        const active = item.value === activeInningsNum;
        const accent = item.team ? (accentColors[item.team.code] ?? CYAN) : CYAN;
        return (
          <button
            key={item.value}
            onClick={() => onSelect(item.value)}
            className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              active
                ? "text-bg-base"
                : "bg-transparent text-text-dim border-line/60 active:bg-line/30"
            }`}
            style={active ? { backgroundColor: accent, borderColor: accent } : undefined}
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
  // Resolved once per innings (not once per batter) -- every row in this
  // innings' batting card shares the same batting team, so there's no
  // reason to recompute it inside the map below. Uses the match-aware
  // resolver (not a single-team lookup) since the two teams' colors can
  // collide with each other even when each independently clears its own
  // background-contrast check -- see lib/teamAccentColor.ts.
  const accentColors = resolveMatchAccentColors(match.teamA, match.teamB);
  const teamColor = team ? (accentColors[team.code] ?? CYAN) : CYAN;

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
                teamColor={teamColor}
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
  teamColor,
}: {
  row: BattingEntry;
  balls: Ball[];
  isTopScorer: boolean;
  isTopSR: boolean;
  motm?: string;
  mots?: string;
  teamColor: string;
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
    <tr
      className="border-t border-line/50 last:border-b-0"
      style={isLiveBatter ? { backgroundColor: `rgba(${hexToRgbTriplet(teamColor)}, 0.035)` } : undefined}
    >
      <td className="py-2 pr-2">
        {/* The glow lives on this inner wrapper, not the <tr>, and is
            rounded + blur-only (no hard outset ring) -- confining it to
            just the name/sparkline column reads as "this player's info is
            glowing" rather than a stark rectangle boxing the whole row,
            which is what a box-shadow on a plain table row looks like.
            --glow-rgb themes .excitement-glow's box-shadow (see
            globals.css) to the batting team's color instead of its fixed
            cyan default. */}
        <div
          className={isLiveBatter ? "excitement-glow -mx-1.5 -my-1 px-1.5 py-1 rounded-lg" : ""}
          style={isLiveBatter ? ({ "--glow-rgb": hexToRgbTriplet(teamColor) } as React.CSSProperties) : undefined}
        >
          <div className="flex items-center gap-1.5">
            <PlayerNameLink playerId={row.playerId} playerName={row.playerName} nameColor={nameColor} />
            {row.onStrike && !row.out && (
              <span className="text-[9px] font-bold tracking-widest" style={{ color: teamColor }}>*</span>
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
              <BatterSparkline points={sparklinePoints} live={false} teamColor={teamColor} />
            </div>
          )}
          {isLiveBatter && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold shrink-0" style={{ color: teamColor }}>not out</span>
              <BatterSparkline points={sparklinePoints} live={true} teamColor={teamColor} />
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
function BatterSparkline({ points, live, teamColor }: { points: SparklinePoint[]; live: boolean; teamColor: string }) {
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
  // glance, not to blend into the row. The batting TEAM's color for the
  // live batter (was a fixed cyan -- see lib/teamAccentColor.ts), a near-
  // white light slate (not a dim mid-gray) for completed innings, unchanged.
  const lineColor = live ? teamColor : "#E2E8F0";

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
