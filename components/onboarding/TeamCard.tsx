"use client";
import type { Team } from "@/lib/types";

// Bug fix (real-browser report, post-v1.0.166): this card used to render
// team.flagEmoji directly as a Unicode character for national teams. That
// depends entirely on the viewer's OS/browser having a matching color-emoji
// glyph, which is NOT reliable -- confirmed live: on this environment,
// simple country-code flags (regional-indicator pairs, e.g. India's) fall
// back to showing their two embedded letters ("IN"), which happened to look
// like intentional initials, while England's flag is a different Unicode
// construction (a UK-subdivision *tag sequence*, not a country code) whose
// unsupported-fallback is a generic flag glyph instead of letters -- a real,
// visible bug, not a special England-only quirk.
//
// The rest of this app already solved this correctly: MatchCard.tsx,
// SplitTeamBg.tsx, and FollowSheet.tsx all render real flag *images* from
// flagcdn.com keyed by a FLAG_ISO map (per-file duplication of that small
// map is the established convention here, not a new pattern), with England
// already correctly mapped to "gb-eng". This card now reuses that same
// approach instead of the raw-emoji one, so every national team renders
// identically here and everywhere else in the app. Franchise teams are
// unaffected -- their shortName-in-a-circle treatment was never broken.
const FLAG_ISO: Record<string, string> = {
  IND: "in", AUS: "au", ENG: "gb-eng", PAK: "pk", SA: "za",
  NZ: "nz", BAN: "bd", SL: "lk", AFG: "af", WI: "tt",
  IRE: "ie", ZIM: "zw", SCO: "gb-sct", NED: "nl", USA: "us",
  UAE: "ae", NAM: "na", PNG: "pg", OMA: "om", CAN: "ca",
  KEN: "ke", UGA: "ug",
};

export default function TeamCard({ team }: { team: Team }) {
  const isNational = team.type === "national";
  const flagIso = isNational ? FLAG_ISO[team.code] : undefined;
  return (
    <div className="card w-full h-[420px] flex flex-col items-center justify-between p-6 overflow-hidden">
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center mt-6 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
        }}
      >
        {flagIso ? (
          <img
            src={`https://flagcdn.com/w160/${flagIso}.png`}
            width={88}
            height={66}
            alt={team.fullName}
            className="rounded-[4px] shadow-md"
            style={{ objectFit: "cover" }}
          />
        ) : (
          // Covers franchise teams, and defensively any national team
          // without a FLAG_ISO entry -- always falls back to computed
          // text, never to an unreliable emoji glyph.
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
