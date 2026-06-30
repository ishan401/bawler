import React from "react";
import type { Match, Innings, BattingEntry, BowlingEntry } from "@/lib/types";
import { TEAMS } from "@/lib/mockData";

interface ScorecardProps {
  match: Match;
}

export default function Scorecard({ match }: ScorecardProps) {
  if (match.innings.length === 0) {
    return (
      <div className="card p-6 text-center text-text-secondary">
        Innings haven&apos;t started yet.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {match.innings.map((innings, idx) => (
        <InningsCard key={idx} innings={innings} match={match} />
      ))}
    </div>
  );
}

function InningsCard({ innings, match }: { innings: Innings; match: Match }) {
  const team = TEAMS[innings.battingTeam];
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-bg-elevated border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: team?.primaryColor ?? "#94A3B8" }}
          />
          <h3 className="text-sm font-bold">
            {team?.fullName ?? innings.battingTeam} <span className="text-text-dim font-normal">·</span>{" "}
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
              <BatterRow key={row.playerId} row={row} />
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
              <BowlerRow key={row.playerId} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BatterRow({ row }: { row: BattingEntry }) {
  return (
    <tr className="border-t border-line/50 last:border-b-0">
      <td className="py-2 pr-2">
        <div className="flex items-center gap-1.5">
          <span className={`font-medium ${row.out ? "text-text-secondary" : "text-text-primary"}`}>
            {row.playerName}
          </span>
          {row.onStrike && !row.out && (
            <span className="text-[9px] font-bold text-cyan tracking-widest">*</span>
          )}
        </div>
        {row.dismissal && (
          <div className="text-[10px] text-text-dim italic mt-0.5">{row.dismissal}</div>
        )}
        {!row.out && row.ballsFaced > 0 && (
          <div className="text-[10px] text-boundary mt-0.5">not out</div>
        )}
      </td>
      <td className="py-2 px-1 text-right num font-bold">{row.runs}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.ballsFaced}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.fours}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.sixes}</td>
      <td className="py-2 pl-1 text-right num text-text-secondary">{row.strikeRate.toFixed(1)}</td>
    </tr>
  );
}

function BowlerRow({ row }: { row: BowlingEntry }) {
  return (
    <tr className="border-t border-line/50 last:border-b-0">
      <td className="py-2 pr-2 font-medium">{row.playerName}</td>
      <td className="py-2 px-1 text-right num">{row.oversBowled}</td>
      <td className="py-2 px-1 text-right num text-text-secondary">{row.maidens}</td>
      <td className="py-2 px-1 text-right num">{row.runsConceded}</td>
      <td className="py-2 px-1 text-right num font-bold">{row.wickets}</td>
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
