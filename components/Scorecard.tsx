"use client";

import React, { useRef, useState } from "react";
import type { Match, Innings, BattingEntry, BowlingEntry, Team } from "@/lib/types";
import Link from "next/link";
import { ALL_TEAMS, resolvePlayerSlug, PLAYERS } from "@/lib/mockData";

interface ScorecardProps {
  match: Match;
}

export default function Scorecard({ match }: ScorecardProps) {
  const [selectedTeamCode, setSelectedTeamCode] = useState<string | null>(null);
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
          <span className="text-sm font-extrabold text-six">{mots}</span>
        </div>
      )}
    </div>
  );

  // Test matches can have up to 4 innings (a team bats twice) — the two-team
  // toggle below assumes exactly one innings per team, so Tests keep the
  // original stacked-innings layout instead.
  if (match.format === "Test") {
    return (
      <div className="space-y-4">
        {momMosBanners}
        {match.innings.map((innings, idx) => (
          <InningsCard key={idx} innings={innings} match={match} />
        ))}
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
    <div className="space-y-4">
      <div ref={topRef} />
      {momMosBanners}

      <TeamToggle
        teamA={match.teamA}
        teamB={match.teamB}
        activeTeamCode={activeTeamCode}
        onSelect={handleSelectTeam}
      />

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
    <div className="flex gap-2 pb-1">
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
      if (row.wickets === (best?.wickets ?? -1) && row.runsConceded < (best?.runsConceded ?? Infinity)) return row;
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

  return (
    <div className="card">
      {/* Sticky innings header */}
      <div className="sticky top-[148px] z-20 bg-bg-elevated border-b border-line px-4 py-3 flex items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team?.primaryColor ?? "#94A3B8" }} />
          <h3 className="text-sm font-bold">
            {team?.fullName ?? innings.battingTeam}{" "}
            <span className="text-text-dim font-normal">·</span>{" "}
            <span className="text-text-secondary font-medium">Innings {innings.number}</span>
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
              <th className="text-right font-semibold py-1.5 px-1 num">4s</th>
              <th className="text-right font-semibold py-1.5 px-1 num">6s</th>
              <th className="text-right font-semibold py-1.5 pl-1 num">SR</th>
            </tr>
          </thead>
          <tbody>
            {innings.battingCard.map(row => (
              <BatterRow
                key={row.playerId}
                row={row}
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
  isTopScorer,
  isTopSR,
  motm,
  mots,
}: {
  row: BattingEntry;
  isTopScorer: boolean;
  isTopSR: boolean;
  motm?: string;
  mots?: string;
}) {
  const isMotm = motm && row.playerName === motm;
  const isMots = mots && row.playerName === mots;

  const nameColor = isMots
    ? "text-six"
    : isMotm
    ? "text-yellow-400"
    : row.out
    ? "text-text-secondary"
    : "text-text-primary";

  return (
    <tr className="border-t border-line/50 last:border-b-0">
      <td className="py-2 pr-2">
        <div className="flex items-center gap-1.5">
          <PlayerNameLink playerId={row.playerId} playerName={row.playerName} nameColor={nameColor} />
          {row.onStrike && !row.out && (
            <span className="text-[9px] font-bold text-cyan tracking-widest">*</span>
          )}
          {isMotm && (
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-yellow-400 bg-yellow-400/15 px-1 py-0.5 rounded leading-none">MOM</span>
          )}
          {isMots && (
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-six bg-six/10 px-1 py-0.5 rounded leading-none">MOS</span>
          )}
        </div>
        {row.out && row.dismissal && (
          <div className="text-[10px] text-text-dim italic mt-0.5">{row.dismissal}</div>
        )}
        {!row.out && row.ballsFaced > 0 && (
          <div className="text-[10px] text-boundary mt-0.5">not out</div>
        )}
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
    ? "text-six"
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
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-six bg-six/10 px-1 py-0.5 rounded leading-none">MOS</span>
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
