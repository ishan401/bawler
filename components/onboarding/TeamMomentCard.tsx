"use client";
import { useState } from "react";
import type { TeamMoment } from "@/lib/onboardingTeams";

// Shown briefly after a team is followed, before advancing to the next
// card -- see build spec's 4-tier fallback chain (lib/onboardingTeams.ts's
// getTeamMoment()). Tier 4 (no moment) is handled by the caller never
// mounting this component at all, not by this component rendering an
// empty/placeholder state.
export default function TeamMomentCard({
  moment,
  onContinue,
}: {
  moment: TeamMoment;
  onContinue: () => void;
}) {
  const [reminderSet, setReminderSet] = useState(false);

  return (
    <div className="onboarding-card w-full p-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">
        {moment.tier === 1 ? "🔴 Live right now" : moment.tier === 2 ? "📅 Coming up" : "📊 Recent result"}
      </div>
      <div className="text-sm font-semibold text-text-primary leading-snug">{moment.headline}</div>

      {moment.tier === 2 && (
        <button
          onClick={() => setReminderSet(v => !v)}
          className="self-start text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
          style={{
            background: reminderSet ? "#00E5FF22" : "rgba(255,255,255,0.06)",
            color: reminderSet ? "#00E5FF" : "var(--text-secondary, #94A3B8)",
          }}
        >
          {reminderSet ? "✓ We'll remind you" : "🔔 Remind me"}
        </button>
      )}

      {/* v1.0.186 (onboarding visual overhaul): restyled from a bare text
          link into the shared pill-button token (20px radius), matching
          the "Remind me" pill just above it in this same card -- same
          action/placement, visual-only change. */}
      <button
        onClick={onContinue}
        className="onboarding-pill mt-1 text-xs font-bold text-text-dim self-end px-4 py-2 bg-white/[0.06]"
      >
        Continue →
      </button>
    </div>
  );
}
