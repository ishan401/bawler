import Link from "next/link";
import { ALL_TEAMS, STANDINGS } from "@/lib/mockData";
import type { Competition } from "@/lib/types";

const STANDINGS_MAP: Record<string, typeof STANDINGS> = {
  "ipl-2026": STANDINGS,
};

export default function MiniStandings({ competition }: { competition: Competition }) {
  const rows = STANDINGS_MAP[competition.id];
  if (!rows) return null;

  return (
    <div className="card overflow-hidden">
      <div className="px-3 py-2 border-b border-line flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Standings</span>
        <span className="text-[9px] text-text-dim">{competition.shortName}</span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_24px_24px_40px_28px] gap-1 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-text-dim border-b border-line">
        <span>Team</span>
        <span className="text-right num">W</span>
        <span className="text-right num">L</span>
        <span className="text-right num">NRR</span>
        <span className="text-right num">Pts</span>
      </div>

      {rows.map((row, idx) => {
        const team = ALL_TEAMS[row.teamCode];
        if (!team) return null;
        const isQualifier = idx < 4;
        const isEliminated = row.qualified === "eliminated";
        return (
          <Link
            key={row.teamCode}
            href={`/schedule/${competition.id}/${row.teamCode}`}
            className="grid grid-cols-[1fr_24px_24px_40px_28px] gap-1 px-3 py-2 border-b border-line/40 last:border-b-0 items-center hover:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isQualifier && <span className="w-1 h-4 rounded-full bg-boundary shrink-0" />}
              <span className="text-[10px] font-bold num text-text-dim w-4 shrink-0">{idx + 1}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: team.primaryColor }} />
              <span className={`text-xs font-bold truncate ${isEliminated ? "opacity-40" : ""}`}>{team.shortName}</span>
            </div>
            <span className="text-right text-xs num font-semibold">{row.won}</span>
            <span className="text-right text-xs num text-text-secondary">{row.lost}</span>
            <span className={`text-right text-[10px] num ${row.netRunRate >= 0 ? "text-boundary" : "text-wicket"}`}>
              {row.netRunRate > 0 ? "+" : ""}{row.netRunRate.toFixed(2)}
            </span>
            <span className="text-right text-xs num font-extrabold">{row.points}</span>
          </Link>
        );
      })}

      <div className="px-3 py-1.5 text-[8px] text-text-dim flex items-center gap-2">
        <span className="flex items-center gap-1"><span className="w-1 h-2 rounded-full bg-boundary" />Playoff line</span>
        <span>· Tap team for their schedule</span>
      </div>
    </div>
  );
}
