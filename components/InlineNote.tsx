import type { InsightV2 } from "@/lib/types";

interface InlineNoteProps {
  insight: InsightV2;
}

/**
 * Between-ball text block in the commentary flow.
 *
 * Per Sarthak v0.4:
 *   - Not just card-after-card; stats/opinions/predictions can appear
 *     between balls.
 *   - Stats render plain (no attribution; we own them).
 *   - Opinions render in italic with the analyst handle visible.
 */
export default function InlineNote({ insight }: InlineNoteProps) {
  const isStat = insight.category === "stat";
  return (
    <div className={`px-3 py-2 my-0.5 ${isStat ? "border-l-2 border-cyan/50" : "border-l-2 border-orange/50"}`}>
      <div className="flex items-baseline gap-2">
        <span className={`text-[9px] font-bold uppercase tracking-widest ${isStat ? "text-cyan" : "text-orange"}`}>
          {isStat ? "Stat" : "View"}
        </span>
        {!isStat && insight.attribution && (
          <span className="text-[10px] text-text-dim">{insight.attribution.handle}</span>
        )}
      </div>
      <p className={`text-xs leading-snug mt-0.5 ${isStat ? "text-text-primary" : "text-text-secondary italic"}`}>
        {renderWithHighlights(insight.text, insight.numericHighlights)}
      </p>
    </div>
  );
}

function renderWithHighlights(text: string, highlights?: string[]): React.ReactNode {
  if (!highlights || highlights.length === 0) return text;
  const parts: React.ReactNode[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestHl: string | null = null;
    for (const hl of highlights) {
      const idx = remaining.indexOf(hl);
      if (idx >= 0 && (earliestIdx < 0 || idx < earliestIdx)) {
        earliestIdx = idx;
        earliestHl = hl;
      }
    }
    if (earliestIdx < 0 || !earliestHl) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, earliestIdx));
    parts.push(<span key={parts.length} className="font-bold text-cyan num">{earliestHl}</span>);
    remaining = remaining.slice(earliestIdx + earliestHl.length);
  }
  return parts;
}
