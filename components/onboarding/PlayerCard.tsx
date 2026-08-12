"use client";
import type { PlayerProfile } from "@/lib/types";
import { NATIONAL_TEAMS } from "@/lib/mockData";
import { roleLabel } from "@/lib/onboardingPlayers";
import PlayerAvatar from "@/components/PlayerAvatar";

// Onboarding step 2 player card -- v1.0.200. Deliberately mirrors
// TeamCard.tsx's exact structure (same "onboarding-card w-full h-[420px]"
// shell, same avatar-glow-then-name-then-subtext-then-blurb layout) so the
// player deck visually matches step 1's swipe cards, per the explicit
// requirement that step 2 "match step 1's exact interaction pattern."
//
// Photo/fallback: reuses the shared PlayerAvatar component (the same one
// the player profile header and homepage strip already use) instead of a
// third copy of the photo-then-initials logic.
//
// Blurb line: reuses PlayerProfile.bio (already a real field on every
// seeded player -- see lib/types.ts) rather than inventing a new copy
// field. Bios here are full paragraphs, not TeamCard's one-line funFact,
// so it's clamped to 3 lines (`line-clamp-3`, a Tailwind 3.3+ core
// utility already in use elsewhere in this codebase) -- this only limits
// how much of the existing text is *shown*, it doesn't alter or truncate
// the underlying data.
function hexToRgbTriple(hex: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return "148, 163, 184";
  const int = parseInt(m[1], 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

export default function PlayerCard({ player }: { player: PlayerProfile }) {
  const nation = player.teamCode ? NATIONAL_TEAMS[player.teamCode] : undefined;
  const glowRgb = hexToRgbTriple(nation?.primaryColor ?? "#00E5FF");
  const subtitle = [nation?.fullName ?? player.nationality, roleLabel(player)].filter(Boolean).join(" · ");

  return (
    <div className="onboarding-card w-full h-[420px] flex flex-col items-center justify-between p-6 overflow-hidden">
      <div className="relative mt-6 shrink-0 w-36 h-36 flex items-center justify-center">
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
          className="relative w-36 h-36 rounded-full"
          style={{ boxShadow: `0 0 0 6px rgba(${glowRgb}, 0.18)`, zIndex: 1 }}
        >
          <PlayerAvatar
            name={player.shortName}
            imageUrl={player.imageUrl}
            sizePx={144}
            borderWidthPx={0}
            className="w-full h-full text-4xl"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="text-xl font-extrabold text-text-primary">{player.name}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{subtitle}</div>
      </div>

      {player.bio && (
        <div className="text-xs text-text-secondary text-center leading-relaxed px-2 pb-2 line-clamp-3">
          {player.bio}
        </div>
      )}
    </div>
  );
}
