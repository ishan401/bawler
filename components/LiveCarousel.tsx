import type { Match } from "@/lib/types";
import { LiveMatchCard } from "./MatchCard";

interface LiveCarouselProps {
  matches: Match[];
}

/**
 * Top-of-home horizontal carousel for LIVE matches only.
 * Snap-scrolls between cards on mobile.
 */
export default function LiveCarousel({ matches }: LiveCarouselProps) {
  if (matches.length === 0) {
    return (
      <div className="card-elevated p-4 mx-3 text-center text-text-secondary text-sm">
        No matches live right now.
      </div>
    );
  }
  return (
    <div className="px-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-thin snap-x snap-mandatory -mx-3 px-3">
        {matches.map(m => (
          <div key={m.id} className="shrink-0 w-full snap-center" style={{ width: "calc(100vw - 24px)", maxWidth: "calc(430px - 24px)" }}>
            <LiveMatchCard match={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
