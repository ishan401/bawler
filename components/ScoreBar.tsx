"use client";
import { memo } from "react";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { ballsPerSet } from "@/lib/formatUtils";
import { calculateProjectedScore } from "@/lib/winProb";

interface ScoreBarProps {
  match: Match;
}

/** Total legal deliveries for a format — used for RRR and balls-left displays. */
function totalBallsFor(match: Match): number {
  if (match.format === "Test" || match.format === "ODI") return 300;
  if (match.format === "Hundred") return 100;
  return 120; // T20 / T20I
}

function ScoreBar({ match }: ScoreBarProps) {
  const { innings, teamA, teamB } = match;
  const isLive = match.status === "live";
  const isPost = match.status === "post-match";
  const isTest = match.format === "Test";

  // ── Innings attribution by battingTeam (never by position) ───────────────
  // Real data: visiting team bats first whenever they win the toss and elect to bat.
  const innA = innings.filter(i => i.battingTeam === teamA.code);
  const innB = innings.filter(i => i.battingTeam === teamB.code);
  const lastInnA = innA[innA.length - 1];
  const lastInnB = innB[innB.length - 1];

  // Current batting team = last innings in array
  const lastInn = innings[innings.length - 1];
  const teamACurrentlyBatting = lastInn?.battingTeam === teamA.code;

  // For ScoreBar: show current innings scores at top
  // In limited-overs matches, simple 1st/2nd innings
  const i1 = innings[0];
  const i2 = innings.length >= 2 ? innings[innings.length - 1] : null;

  // Chase context — only meaningful in limited-overs 2nd innings, not Test
  const totalBalls = totalBallsFor(match);
  const target = (!isTest && i1) ? i1.runs + 1 : null;
  const chasingInn = (!isTest && i2) ? i2 : null;
  const need = target && chasingInn ? target - chasingInn.runs : null;
  const ballsBowled = chasingInn ? Math.round(chasingInn.overs * ballsPerSet(match.format)) : 0;
  const ballsLeft = chasingInn ? Math.max(0, totalBalls - ballsBowled) : null;
  const rrr = need && ballsLeft && ballsLeft > 0 ? (need / ballsLeft) * ballsPerSet(match.format) : null;

  // Projected score — 1st innings only, non-Test
  const isFirstInningsLive = !isTest && innings.length === 1 && i1 && i1.balls.length > 0 && match.status === "live";
  const projected = isFirstInningsLive ? calculateProjectedScore(match) : null;

  return (
    <div className="bg-bg/90 backdrop-blur border-b border-line">
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href="/" className="tap-scale flex items-center gap-0.5 -ml-1 px-2 py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] font-bold tracking-wide">Back</span>
        </Link>

        <div className="flex-1 flex items-center justify-center gap-3 text-sm">
          <Team code={match.teamA.shortName} color={match.teamA.primaryColor} batting={teamACurrentlyBatting} />
          {i1 && (
            <span className="num font-bold text-text-primary">
              {i1.runs}<span className="text-text-dim font-normal">/{i1.wickets}</span>
            </span>
          )}
          <span className="text-text-dim">vs</span>
          {i2 && (
            <span className="num font-bold text-cyan">
              {i2.runs}<span className="text-text-dim font-normal">/{i2.wickets}</span>
            </span>
          )}
          <Team code={match.teamB.shortName} color={match.teamB.primaryColor} batting={!teamACurrentlyBatting && innings.length > 0} />
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="text-[10px] uppercase tracking-widest text-text-dim flex items-center gap-1.5">
            {isLive && <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-wicket" />}
            {isLive ? "LIVE" : isPost ? "FINAL" : "PRE"}
          </div>
          <div className="flex items-center gap-1">
            {match.format !== "T20" && match.format !== "T20I" && match.format !== "Hundred" && (
              <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none text-text-dim border border-line">
                {match.format}
              </span>
            )}
            <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none"
              style={{ background: match.competition.logoColor ? `${match.competition.logoColor}22` : "rgba(255,255,255,0.06)", color: match.competition.logoColor ?? "var(--text-dim)", border: `1px solid ${match.competition.logoColor ?? "rgba(255,255,255,0.12)"}44` }}>
              {match.competition.shortName}
            </span>
          </div>
        </div>
      </div>
      {/* Second row: chase context OR projected score */}
      {i2 && need !== null && rrr !== null && (
        <div className="px-4 pb-2 flex items-center justify-between text-xs">
          <span className="text-text-secondary num">
            {chasingInn?.battingTeam === teamB.code ? teamB.shortName : teamA.shortName} need <span className="text-text-primary font-bold">{need}</span> off <span className="text-text-primary font-bold">{ballsLeft}</span> balls
          </span>
          <span className="text-text-secondary num">
            RRR <span className={`font-bold ${rrr > 10 ? "text-orange" : rrr > 8 ? "text-text-primary" : "text-boundary"}`}>{rrr.toFixed(2)}</span>
          </span>
        </div>
      )}
      {projected && !i2 && (
        <div className="px-4 pb-2 flex items-center justify-between text-xs">
          <span className="text-text-secondary num">
            Proj&nbsp;
            <span className="text-text-primary font-bold num">~{projected.runs}</span>
            <span className="text-text-dim">&nbsp;at this pace</span>
          </span>
          <span className="text-text-secondary num">
            CRR&nbsp;<span className="font-bold text-text-primary">{projected.perOver.toFixed(2)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Team({ code, color, batting }: { code: string; color: string; batting: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className={`font-semibold ${batting ? "text-text-primary" : "text-text-secondary"}`}>{code}</span>
    </div>
  );
}
export default memo(ScoreBar);
