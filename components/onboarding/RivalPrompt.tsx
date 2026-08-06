"use client";
import type { Team } from "@/lib/types";

// "Who do you love to hate?" -- shown exactly once per onboarding session,
// after the first team followed in step 1, per the build spec's own
// (self-contradictory as originally written) repeat rule, resolved as:
// ask once total, regardless of pick-or-skip, never again this session.
// See components/onboarding/TeamPickerStep.tsx for the "only show once"
// gating -- this component itself is unconditional, purely presentational.
export default function RivalPrompt({
  candidates,
  onPick,
  onSkip,
}: {
  candidates: Team[];
  onPick: (team: Team) => void;
  onSkip: () => void;
}) {
  return (
    <div className="card w-full p-4 flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="text-sm font-bold text-text-primary">Who do you love to hate? 😈</div>
      <div className="text-xs text-text-secondary">
        Pick a rival, purely for fun -- we'll remember it for future banter.
      </div>
      <div className="flex flex-wrap gap-2">
        {candidates.map(t => (
          <button
            key={t.code}
            onClick={() => onPick(t)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/[0.06] text-text-secondary hover:bg-white/[0.1] transition-colors"
          >
            {t.flagEmoji ? `${t.flagEmoji} ` : ""}{t.shortName}
          </button>
        ))}
      </div>
      <button onClick={onSkip} className="self-end text-[11px] font-bold text-text-dim">
        Skip
      </button>
    </div>
  );
}
