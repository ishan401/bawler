import type { Ball } from "@/lib/types";

interface OverSummaryProps {
  over: number;
  balls: Ball[]; // up to 6 (or more if extras)
  bowlerName: string;
}

/**
 * Over change/recap strip — appears between balls when the over changes.
 *
 * Per Sarthak v0.4:
 *   - Easily identifiable transition between overs.
 *   - 6 colored dots whose distribution at-a-glance conveys "good" or "bad" over.
 */
export default function OverSummary({ over, balls, bowlerName }: OverSummaryProps) {
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
          Over {over}
        </span>
        <span className="text-[10px] num text-text-secondary">{bowlerName}</span>
        {/* 6 dots */}
        <div className="flex gap-1">
          {balls.slice(0, 6).map((b, i) => (
            <BallDot key={i} ball={b} />
          ))}
          {/* fill remaining with placeholders if fewer than 6 */}
          {Array.from({ length: Math.max(0, 6 - balls.length) }).map((_, i) => (
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
