"use client";
import { useEffect, useState } from "react";

// Purely cosmetic transition -- capped at 2-3s regardless of how many
// teams/players were followed (build spec is explicit: "never a real
// blocking wait"). onDone() fires from a single fixed-duration timer,
// never gated on any async work actually finishing.
const REVEAL_DURATION_MS = 2200;

function joinWithCap(names: string[], cap = 3): string {
  if (names.length === 0) return "";
  if (names.length <= cap) {
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
  }
  const shown = names.slice(0, cap);
  return `${shown.join(", ")} & ${names.length - cap} more`;
}

export default function RevealStep({
  teamNames,
  playerNames,
  onDone,
}: {
  teamNames: string[];
  playerNames: string[];
  onDone: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setVisible(false);
      onDone();
    }, REVEAL_DURATION_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const combined = [...teamNames, ...playerNames];
  const subtext =
    combined.length > 0
      ? `Matching ${joinWithCap(combined)} to what's live right now`
      : "Setting things up";

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
      <div className="w-10 h-10 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
      <div className="text-base font-bold text-text-primary">Building your feed...</div>
      <div className="text-xs text-text-secondary max-w-xs">{subtext}</div>
    </div>
  );
}
