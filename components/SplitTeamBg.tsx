import type { Team } from "@/lib/types";

interface SplitTeamBgProps {
  teamA: Team;
  teamB: Team;
  // Layout — "wide" for past cards (~270 px), "narrow" for upcoming (~140 px),
  // "full" for live carousel cards (full width)
  variant?: "wide" | "narrow" | "full";
}

/**
 * Absolute-positioned background layer for match cards.
 *   - Left 50% uses teamA primary colour + their abbreviation as watermark
 *   - Right 50% uses teamB primary colour + their abbreviation as watermark
 *   - A subtle "VS" diagonal seam at the centre
 *   - Dark overlay on top so card text stays readable
 *
 * The parent card sits absolute-positioned on top of this.
 */
export default function SplitTeamBg({ teamA, teamB, variant = "wide" }: SplitTeamBgProps) {
  const sizes = sizesFor(variant);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Left half */}
      <div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          background: `linear-gradient(135deg, ${teamA.primaryColor} 0%, ${darken(teamA.primaryColor, 0.4)} 100%)`,
        }}
      >
        <div
          className="absolute"
          style={{
            left: sizes.watermarkOffsetX,
            top: sizes.watermarkOffsetY,
            color: teamA.secondaryColor,
            opacity: 0.16,
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
      {/* Right half */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{
          background: `linear-gradient(225deg, ${teamB.primaryColor} 0%, ${darken(teamB.primaryColor, 0.4)} 100%)`,
        }}
      >
        <div
          className="absolute"
          style={{
            right: sizes.watermarkOffsetX,
            top: sizes.watermarkOffsetY,
            color: teamB.secondaryColor,
            opacity: 0.16,
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
      {/* Diagonal seam */}
      <div
        className="absolute inset-y-0"
        style={{
          left: "calc(50% - 16px)",
          width: 32,
          background: "linear-gradient(90deg, transparent, rgba(10,14,26,0.7), transparent)",
          transform: "skewX(-8deg)",
        }}
      />
      {/* Readability scrim */}
      <div className="absolute inset-0 bg-black/45" />
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
  // hex → rgb → multiply → hex
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map(h => parseInt(h, 16));
  const dr = Math.max(0, Math.floor(r * (1 - amount)));
  const dg = Math.max(0, Math.floor(g * (1 - amount)));
  const db = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${[dr, dg, db].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}
