import type { Match } from "@/lib/types";
import PitchReportCard from "./PitchReportCard";
import LineupsCard from "./LineupsCard";
import { PITCH_REPORTS } from "@/lib/mockData";

interface InfoTabProps {
  match: Match;
}

export default function InfoTab({ match }: InfoTabProps) {
  const pitch = PITCH_REPORTS[match.venue.id];
  return (
    <div className="space-y-4">
      {/* Head-to-head & toss */}
      <div className="card p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Match context</h3>
        <div className="text-sm">
          <span className="font-bold">{match.teamA.shortName}</span>
          <span className="text-text-dim"> vs </span>
          <span className="font-bold">{match.teamB.shortName}</span>
          <span className="text-text-secondary"> · {match.competition.name}</span>
        </div>
        {match.toss && (
          <div className="text-xs text-text-secondary">
            Toss: <span className="text-text-primary font-semibold">{match.toss.winner}</span> won and chose to {match.toss.elected}
          </div>
        )}
      </div>

      {/* Pitch report */}
      {pitch && <PitchReportCard pitch={pitch} venue={match.venue} />}

      {/* Lineups */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Squads</h3>
        <LineupsCard match={match} />
      </div>
    </div>
  );
}
