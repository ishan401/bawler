"use client";
import type { PlayerMoment } from "@/lib/onboardingPlayers";

export default function PlayerMomentCard({ moment, onContinue }: { moment: PlayerMoment; onContinue: () => void }) {
  return (
    <div className="card w-full p-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
        {moment.isLive ? "🔴 Live right now" : "📊 Recent form"}
      </div>
      <div className="text-sm font-semibold text-text-primary leading-snug">{moment.headline}</div>
      <button onClick={onContinue} className="mt-1 text-xs font-bold text-text-dim self-end">
        Continue →
      </button>
    </div>
  );
}
