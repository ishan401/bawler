"use client";
import type { PlayerMoment } from "@/lib/onboardingPlayers";

export default function PlayerMomentCard({ moment, onContinue }: { moment: PlayerMoment; onContinue: () => void }) {
  return (
    <div className="onboarding-card w-full p-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
        {moment.isLive ? "🔴 Live right now" : "📊 Recent form"}
      </div>
      <div className="text-sm font-semibold text-text-primary leading-snug">{moment.headline}</div>
      {/* v1.0.186 (onboarding visual overhaul): kept in visual lockstep
          with the identical pattern in TeamMomentCard.tsx -- same pill
          token, same background, same placement. */}
      <button onClick={onContinue} className="onboarding-pill mt-1 text-xs font-bold text-text-dim self-end px-4 py-2 bg-white/[0.06]">
        Continue →
      </button>
    </div>
  );
}
