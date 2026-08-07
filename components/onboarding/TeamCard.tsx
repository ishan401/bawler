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
// Exported so TeamPickerStep.tsx's per-team progress chip row can reuse
// the exact same flag mapping instead of a third divergent copy -- those
// two files are already tightly coupled (TeamPickerStep renders TeamCard
// directly), unlike the other FLAG_ISO duplicates elsewhere in the app
// (MatchCard/SplitTeamBg/FollowSheet), which are unrelated screens where
// the established per-file-duplication convention still applies.
export const FLAG_ISO: Record<string, string> = {
  IND: "in", AUS: "au", ENG: "gb-eng", PAK: "pk", SA: "za",
  NZ: "nz", BAN: "bd", SL: "lk", AFG: "af", WI: "tt",
  IRE: "ie", ZIM: "zw", SCO: "gb-sct", NED: "nl", USA: "us",
  UAE: "ae", NAM: "na", PNG: "pg", OMA: "om", CAN: "ca",
  KEN: "ke", UGA: "ug",
};

// Converts a "#RRGGBB" hex string to an "r, g, b" triple for use inside an
// rgba()/radial-gradient() string. Falls back to a neutral mid-grey if the
// value is somehow malformed rather than producing a broken gradient --
// this only ever feeds a purely decorative glow, never anything that must
// be pixel-exact.
function hexToRgbTriple(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return "148, 163, 184";
  const int = parseInt(m[1], 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

export default function TeamCard({ team }: { team: Team }) {
  const isNational = team.type === "national";
  const flagIso = isNational ? FLAG_ISO[team.code] : undefined;
  const glowRgb = hexToRgbTriple(team.primaryColor);
  return (
    <div className="card w-full h-[420px] flex flex-col items-center justify-between p-6 overflow-hidden">
      <div className="relative mt-6 shrink-0 w-36 h-36 flex items-center justify-center">
        {/* v1.0.171 (onboarding visual polish): per-team ambient glow --
            purely decorative, sits behind the avatar circle only (never
            touches the card background/border). Reuses team.primaryColor,
            the same field already driving the avatar's own gradient and
            used platform-wide for chart lines/accents -- no new color
            field, no new per-team data. Sized larger than the 144px
            avatar (190px) so it visibly extends past its edge; a radial
            gradient fading to fully transparent avoids any hard edge by
            construction. */}
        <div
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 190,
            height: 190,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, rgba(${glowRgb}, 0.32) 0%, rgba(${glowRgb}, 0) 70%)`,
            zIndex: 0,
          }}
        />
        <div
          className="relative w-36 h-36 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
            zIndex: 1,
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
