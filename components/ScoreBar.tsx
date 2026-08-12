"use client";
import { memo } from "react";
import Link from "next/link";
import type { Match } from "@/lib/types";
import { ballsPerSet } from "@/lib/formatUtils";
import { calculateProjectedScore } from "@/lib/winProb";
import { getCurrentInnings } from "@/lib/matchStatus";

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
  // v1.0.122 root-cause fix: this file used to compute lastInnA/lastInnB
  // correctly (by battingTeam, same pattern Scorecard.tsx already used
  // correctly for the Score tab) but then never actually rendered them --
  // the header itself pulled its two displayed scores from `i1`/`i2` below,
  // which are purely positional (`innings[0]`, `innings[innings.length-1]`).
  // That's indistinguishable from correct in a normal alternating Test or a
  // single-innings white-ball match, because position and team happen to
  // line up. It breaks the moment a follow-on is enforced: the innings
  // sequence becomes [A1, B1, B2] (team A's 2nd innings never happens), so
  // `i2` -- "last in the array" -- is team B's innings, but it was being
  // rendered in the slot next to team A's name/dot. `lastInnA`/`lastInnB`
  // below are what the header actually needs for its two fixed visual
  // slots: whichever is each team's own most recent innings, looked up by
  // the innings' real `battingTeam` field -- the same source of truth
  // Scorecard.tsx already reads correctly -- never by array index, order,
  // or an alternating-position assumption. Works identically regardless of
  // which team bats first or which team (if either) follows on.
  const innA = innings.filter(i => i.battingTeam === teamA.code);
  const innB = innings.filter(i => i.battingTeam === teamB.code);
  const lastInnA = innA[innA.length - 1];
  const lastInnB = innB[innB.length - 1];

  // Current batting team -- via the shared getCurrentInnings() lookup
  // (lib/matchStatus.ts, v1.0.126), not a second "last innings in array"
  // computed independently here. lib/playerActivity.ts's live-player
  // detection now calls the exact same function, so this file's own
  // "current innings" concept and the homepage strip's can never diverge
  // again the way they did before v1.0.126.
  const lastInn = getCurrentInnings(match);
  const teamACurrentlyBatting = lastInn?.battingTeam === teamA.code;

  // `i1`/`i2` are deliberately CHRONOLOGICAL (first-batted / most-recent),
  // not per-team -- they feed the chase-context line (target/need/RRR) and
  // the projected-score line below, both of which are white-ball-only
  // concepts (`!isTest` gates) that are inherently about batting ORDER
  // ("the team chasing right now"), not about which named team that is.
  // Do NOT use these for the header's team-labeled score slots above --
  // that's exactly the bug this fix corrects. Where team identity actually
  // matters for these two lines (e.g. "IND need 21 off 22"), the code
  // below already resolves it via `battingTeam ===` checks, not position.
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
  const isFirstInningsLive = !isTest && innings.length === 1 && i1 && i1.overs > 0 && match.status === "live";
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
          {lastInnA && (
            <span className="num font-bold text-text-primary">
              {lastInnA.runs}<span className="text-text-dim font-normal">/{lastInnA.wickets}</span>
              <span className="text-text-dim font-normal text-[10px]"> ({lastInnA.overs})</span>
            </span>
          )}
          <span className="text-text-dim">vs</span>
          {lastInnB && (
            <span className="num font-bold text-cyan">
              {lastInnB.runs}<span className="text-text-dim font-normal">/{lastInnB.wickets}</span>
              <span className="text-text-dim font-normal text-[10px]"> ({lastInnB.overs})</span>
            </span>
          )}
          <Team code={match.teamB.shortName} color={match.teamB.primaryColor} batting={!teamACurrentlyBatting && innings.length > 0} />
        </div>

        <div className="flex flex-col items-end gap-0.5">
          {isPost && (
            <div className="text-[10px] uppercase tracking-widest text-text-dim flex items-center gap-1.5">
              FINAL
            </div>
          )}
          <div className="flex items-center gap-1">
            {match.format !== "T20" && match.format !== "T20I" && match.format !== "Hundred" && (
              <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none text-text-dim border border-line">
                {match.format}
              </span>
            )}
            {match.competition.type !== "bilateral" && (
              <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded leading-none"
                style={{ background: match.competition.logoColor ? `${match.competition.logoColor}22` : "rgba(255,255,255,0.06)", color: match.competition.logoColor ?? "var(--text-dim)", border: `1px solid ${match.competition.logoColor ?? "rgba(255,255,255,0.12)"}44` }}>
                {match.competition.shortName}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Second row: chase context OR projected score */}
      {/* Chase line is a live-only concept -- "need N off M balls" describes
          a target still being chased right now. `need`/`rrr` are derived
          purely from static innings totals, so without this status gate
          they'd keep computing (and rendering) a phantom target for a match
          that's already finished, sometimes days after the last ball was
          bowled. Gated on isLive alone, not on data presence -- a finished
          match never shows this line regardless of what innings/ball data
          it has. Nothing is shown in its place: the actual final result
          already renders elsewhere on a finished match's page (Scorecard's
          final-score header, Digest's lead-in summary), so there's nothing
          this row needs to add here. */}
      {isLive && i2 && need !== null && rrr !== null && (
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
          </span>
          <span className="text-text-secondary num">
            {i1 && (i1.battingTeam === teamA.code ? teamA.shortName : teamB.shortName)}&nbsp;CRR&nbsp;<span className="font-bold text-text-primary">{projected.perOver.toFixed(2)}</span>
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
