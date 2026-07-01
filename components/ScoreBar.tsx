"use client";
import { memo } from "react";
import Link from "next/link";
import type { Match } from "@/lib/types";

interface ScoreBarProps {
  match: Match;
}

function ScoreBar({ match }: ScoreBarProps) {
  const i1 = match.innings[0];
  const i2 = match.innings[1];
  const isLive = match.status === "live";
  const isPost = match.status === "post-match";

  const target = i1 ? i1.runs + 1 : null;
  const current = i2 ?? i1;
  const need = target && current ? target - current.runs : null;
  const ballsBowled = current ? Math.round(current.overs * 6) : 0;
  const ballsLeft = current ? 120 - ballsBowled : null;
  const rrr = need && ballsLeft && ballsLeft > 0 ? (need / ballsLeft) * 6 : null;

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
          <Team code={match.teamA.shortName} color={match.teamA.primaryColor} batting={i2 ? false : true} />
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
          <Team code={match.teamB.shortName} color={match.teamB.primaryColor} batting={!!i2} />
        </div>

        <div className="text-[10px] uppercase tracking-widest text-text-dim flex items-center gap-1.5">
          {isLive && <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-wicket" />}
          {isLive ? "LIVE" : isPost ? "FINAL" : "PRE"}
        </div>
      </div>
      {/* Second row: chase context */}
      {i2 && need !== null && rrr !== null && (
        <div className="px-4 pb-2 flex items-center justify-between text-xs">
          <span className="text-text-secondary num">
            {match.teamB.shortName} need <span className="text-text-primary font-bold">{need}</span> off <span className="text-text-primary font-bold">{ballsLeft}</span> balls
          </span>
          <span className="text-text-secondary num">
            RRR <span className={`font-bold ${rrr > 10 ? "text-orange" : rrr > 8 ? "text-text-primary" : "text-boundary"}`}>{rrr.toFixed(2)}</span>
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
