import type { Team } from "@/lib/types";

interface SplitTeamBgProps {
  teamA: Team;
  teamB: Team;
  variant?: "wide" | "narrow" | "full";
}

// flagcdn.com ISO codes — same mapping used in MatchCard's FlagOrRank
const FLAG_ISO: Record<string, string> = {
  IND: "in", AUS: "au", ENG: "gb-eng", PAK: "pk", SA: "za",
  NZ: "nz", BAN: "bd", SL: "lk", AFG: "af", WI: "tt",
  IRE: "ie", ZIM: "zw", SCO: "gb-sct", NED: "nl", USA: "us",
  UAE: "ae", NAM: "na", PNG: "pg", OMA: "om", CAN: "ca",
};

/**
 * Absolute-positioned background layer for match cards.
 *
 * INTERNATIONAL matches (both teams national):
 *   Left half  = teamA flag image  |  Right half = teamB flag image
 *
 * FRANCHISE matches (IPL, BBL, etc.):
 *   Left half  = teamA primary colour gradient
 *   Right half = teamB primary colour gradient
 *
 * Both modes share the diagonal VS seam + dark readability scrim.
 */
export default function SplitTeamBg({ teamA, teamB, variant = "wide" }: SplitTeamBgProps) {
  const sizes = sizesFor(variant);
  const international = teamA.type === "national" && teamB.type === "national";
  const isoA = FLAG_ISO[teamA.code];
  const isoB = FLAG_ISO[teamB.code];

  return (
    <div className="absolute inset-0 overflow-hidden">

      {/* ── Left half ────────────────────────────────── */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 overflow-hidden"
        style={
          international && isoA
            ? undefined                                                 // flag img handles the colour
            : { background: `linear-gradient(135deg, ${teamA.primaryColor} 0%, ${darken(teamA.primaryColor, 0.4)} 100%)` }
        }
      >
        {/* Flag background — international only */}
        {international && isoA && (
          <img
            src={`https://flagcdn.com/w320/${isoA}.png`}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              filter: "saturate(0.65) brightness(0.85)",
            }}
          />
        )}
        {/* Team name watermark */}
        <div
          className="absolute"
          style={{
            left:  sizes.watermarkOffsetX,
            top:   sizes.watermarkOffsetY,
            color: international ? "rgba(255,255,255,0.18)" : teamA.secondaryColor,
            opacity: international ? 1 : 0.16,
            transform: "rotate(-12deg)",
            fontSize: sizes.watermarkSize,
            fontWeight: 900,
            fontFamily: "Inter, sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            pointerEvents: "none",
          }}
        >
          {teamA.shortName}
        </div>
      </div>

      {/* ── Right half ───────────────────────────────── */}
      <div
        className="absolute inset-y-0 right-0 w-1/2 overflow-hidden"
        style={
          international && isoB
            ? undefined
            : { background: `linear-gradient(225deg, ${teamB.primaryColor} 0%, ${darken(teamB.primaryColor, 0.4)} 100%)` }
        }
      >
        {international && isoB && (
          <img
            src={`https://flagcdn.com/w320/${isoB}.png`}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              filter: "saturate(0.65) brightness(0.85)",
            }}
          />
        )}
        <div
          className="absolute"
          style={{
            right: sizes.watermarkOffsetX,
            top:   sizes.watermarkOffsetY,
            color: international ? "rgba(255,255,255,0.18)" : teamB.secondaryColor,
            opacity: international ? 1 : 0.16,
            transform: "rotate(12deg)",
            fontSize: sizes.watermarkSize,
            fontWeight: 900,
            fontFamily: "Inter, sans-serif",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            pointerEvents: "none",
          }}
        >
          {teamB.shortName}
        </div>
      </div>

      {/* ── Diagonal VS seam ─────────────────────────── */}
      <div
        className="absolute inset-y-0"
        style={{
          left: "calc(50% - 16px)",
          width: 32,
          background: "linear-gradient(90deg, transparent, rgba(10,14,26,0.7), transparent)",
          transform: "skewX(-8deg)",
        }}
      />

      {/* ── Readability scrim — slightly deeper for photo flags ── */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${international ? 0.52 : 0.45})` }}
      />
    </div>
  );
}

function sizesFor(v: "wide" | "narrow" | "full") {
  switch (v) {
    case "narrow":
      return { watermarkSize: 70, watermarkOffsetX: -12, watermarkOffsetY: -10 };
    case "full":
      return { watermarkSize: 110, watermarkOffsetX: -16, watermarkOffsetY: -20 };
    default:
      return { watermarkSize: 90, watermarkOffsetX: -10, watermarkOffsetY: -12 };
  }
}

function darken(hex: string, amount: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map(h => parseInt(h, 16));
  const dr = Math.max(0, Math.floor(r * (1 - amount)));
  const dg = Math.max(0, Math.floor(g * (1 - amount)));
  const db = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${[dr, dg, db].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}
