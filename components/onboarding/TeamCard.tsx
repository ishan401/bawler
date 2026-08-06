"use client";
import type { Team } from "@/lib/types";

// Visual badge/color treatment reused from the same inline
// primaryColor/secondaryColor pattern every other team-identity render
// site in this app already uses (components/MatchCard.tsx etc.) --
// no dedicated TeamBadge/TeamLogo component exists anywhere in this
// codebase to import instead (confirmed by search before building this).
export default function TeamCard({ team }: { team: Team }) {
  const isNational = team.type === "national";
  return (
    <div className="card w-full h-[420px] flex flex-col items-center justify-between p-6 overflow-hidden">
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center mt-6 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
        }}
      >
        {isNational && team.flagEmoji ? (
          <span className="text-6xl">{team.flagEmoji}</span>
        ) : (
          <span className="text-3xl font-extrabold text-white drop-shadow">{team.shortName}</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="text-xl font-extrabold text-text-primary">{team.fullName}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
          {isNational ? "National Team" : "IPL Franchise"}
        </div>
      </div>

      {team.funFact && (
        <div className="text-xs text-text-secondary text-center leading-relaxed px-2 pb-2">
          {team.funFact}
        </div>
      )}
    </div>
  );
}
