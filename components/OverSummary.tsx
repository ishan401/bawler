import type { Ball, MatchFormat } from "@/lib/types";
import { setLabel, ballsPerSet } from "@/lib/formatUtils";

interface OverSummaryProps {
  over: number;
  balls: Ball[]; // up to 6 (or more if extras)
  bowlerName: string;
  format?: MatchFormat;
}

/**
 * Over/Set change recap strip.
 * Shows "Over X" for T20/ODI/Test, "Set X" for The Hundred.
 * Dot count adapts: 5 for Hundred, 6 for all other formats.
 */
export default function OverSummary({ over, balls, bowlerName, format = "T20" }: OverSummaryProps) {
  const bps = ballsPerSet(format);
  const runs = balls.reduce((s, b) => s + b.runs + b.extras, 0);
  const wickets = balls.filter(b => b.isWicket).length;
  const verdict = quickVerdict(runs, wickets, balls);

  return (
    <div className="my-3 flex items-center gap-3 px-1">
      {/* left rail */}
      <div className="flex-1 h-px bg-line" />

      {/* center pill */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-bg-surface border border-line">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-text-dim">
          {setLabel(format)} {over}
        </span>
        <span className="text-[10px] num text-text-secondary">{bowlerName}</span>
        {/* 6 dots */}
        <div className="flex gap-1">
          {balls.slice(0, bps).map((b, i) => (
            <BallDot key={i} ball={b} />
          ))}
          {/* fill remaining with placeholders if fewer than bps */}
          {Array.from({ length: Math.max(0, bps - balls.length) }).map((_, i) => (
            <span key={`p-${i}`} className="w-2 h-2 rounded-full bg-line" />
          ))}
        </div>
        <span className={`text-[10px] font-bold num ${verdict.color}`}>{runs}{wickets ? `/${wickets}` : ""}</span>
      </div>

      {/* right rail */}
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

function BallDot({ ball }: { ball: Ball }) {
  let bg = "#475569"; // dot ball — muted gray
  if (ball.isWicket) bg = "#EF4444";
  else if (ball.isBoundary6) bg = "#A855F7";
  else if (ball.isBoundary4) bg = "#00E5FF";
  else if (ball.runs === 1) bg = "#10B981";
  else if (ball.runs === 2) bg = "#10B981";
  else if (ball.runs >= 3) bg = "#FBBF24";
  else if (ball.extras > 0) bg = "#94A3B8";
  return <span className="w-2 h-2 rounded-full" style={{ background: bg }} />;
}

function quickVerdict(runs: number, wickets: number, _balls: Ball[]): { label: string; color: string } {
  if (wickets >= 2) return { label: "Wicket maiden", color: "text-wicket" };
  if (wickets >= 1 && runs < 6) return { label: "Good over", color: "text-wicket" };
  if (runs <= 3) return { label: "Tight", color: "text-text-secondary" };
  if (runs >= 15) return { label: "Big", color: "text-boundary" };
  return { label: "Even", color: "text-text-secondary" };
}
