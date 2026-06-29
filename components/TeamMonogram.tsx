import type { Team } from "@/lib/types";

interface TeamMonogramProps {
  team: Team;
  size?: number; // px
  variant?: "filled" | "watermark";
}

/**
 * Bawler-original team monogram (we don't use the official IPL logos for
 * licensing reasons). A simple circular badge with the team abbreviation,
 * styled in the team's primary + secondary colours.
 */
export default function TeamMonogram({ team, size = 40, variant = "filled" }: TeamMonogramProps) {
  const fontSize = team.shortName.length >= 4 ? size * 0.32 : size * 0.42;
  if (variant === "watermark") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke={team.secondaryColor} strokeWidth="3" opacity="0.7" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Inter, sans-serif"
          fontSize="56"
          fontWeight="900"
          fill="currentColor"
          fillOpacity="0.85"
        >
          {team.shortName}
        </text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="48" fill={team.primaryColor} stroke={team.secondaryColor} strokeWidth="3" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Inter, sans-serif"
        fontSize={56}
        fontWeight="900"
        fill="#FFFFFF"
      >
        {team.shortName}
      </text>
    </svg>
  );
}
