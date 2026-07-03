"use client";

import React from "react";
import type { Match, Innings, BattingEntry, BowlingEntry } from "@/lib/types";
import Link from "next/link";
import { TEAMS, resolvePlayerSlug } from "@/lib/mockData";

interface ScorecardProps {
  match: Match;
}

export default function Scorecard({ match }: ScorecardProps) {
  if (match.innings.length === 0) {
    const isLive = match.status === "live" || match.status === "toss";
    const isUpcoming = match.status === "upcoming" || match.status === "pre-match";
    return (
      <div className="space-y-3">
        <div className="card p-6 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">{isUpcoming ? "🗓️" : isLive ? "📡" : "🏏"}</span>
          <p className="text-sm font-bold text-text-primary">
            {isUpcoming ? "Match hasn\'t started yet" : isLive ? "Scorecard updating…" : "Scorecard not available"}
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

  return (
    <div className="space-y-4">
      {/* Man of Match / Man of Tournament banners */}
      {(motm || mots) && (
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
      )}

      {match.innings.map((innings, idx) => (
        <InningsCard key={idx} innings={innings} match={match} />
      ))}
    </div>
  );
}

function InningsCard({ innings, match }: { innings: Innings; match: Match }) {
  const team = TEAMS[innings.battingTeam];

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
          <Link
            href={`/player/${resolvePlayerSlug(row.playerId)}`}
            className={`font-medium tap-scale ${nameColor} hover:underline underline-offset-2`}
          >
            {row.playerName}
          </Link>
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
        {row.dismissal && (
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
          <Link
            href={`/player/${resolvePlayerSlug(row.playerId)}`}
            className={`font-medium tap-scale ${nameColor} hover:underline underline-offset-2`}
          >
            {row.playerName}
          </Link>
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
