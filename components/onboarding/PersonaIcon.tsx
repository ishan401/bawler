"use client";

// v1.0.186 (onboarding visual overhaul) -- persona icon badge on the quiz
// reveal screen. This codebase has no icon-font/class library anywhere
// (confirmed by grep across the whole repo -- every icon everywhere else
// is a hand-drawn inline <svg>, e.g. the checkmark/X icons in
// TeamPickerStep.tsx), so these are new inline SVGs matching that same
// convention rather than a `ti-*` class reference. Every persona uses the
// SAME badge container color (teal, #7fe0e0 stroke) per the build spec
// ("don't invent a different color per persona") -- only the icon SHAPE
// varies by persona id.
//
// Mapping (reported to the user for review per the build spec's explicit
// instruction not to silently finalize icons they haven't seen):
//   boundary-hunter    (Boundary Hunter)   -> target      [explicit in spec]
//   all-rounder-skip   (All-Rounder/skip)  -> star         [explicit fallback rule in spec -- no "cricket" icon exists in this icon-less codebase]
//   bazball-believer   (Bazball Believer)  -> flame        [aggressive, attacking style -- closest semantic fit available]
//   momentum-chaser    (Momentum Chaser)   -> trending-up  [tempo/momentum]
//   death-over-closer  (Death-Over Closer) -> stopwatch    [time-pressure closer]
//   test-purist        (Test Purist)       -> shield       [defensive, long-game]
//   session-reader     (Session Reader)    -> eye          [reading/observing]
export function PersonaIcon({ personaId, size = 26, color = "#7fe0e0" }: { personaId: string; size?: number; color?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (personaId) {
    case "boundary-hunter":
      // Target / bullseye
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
        </svg>
      );
    case "bazball-believer":
      // Flame
      return (
        <svg {...common}>
          <path d="M12 3c1.5 2.5-1 3.8-1 6 0 1.4 1 2.5 2.3 2.5.9 0 1.7-.6 1.9-1.4C16.6 11.6 18 14 18 16a6 6 0 0 1-12 0c0-4 2-6.5 3.2-8.3C10.2 6 11 4.5 12 3Z" />
        </svg>
      );
    case "momentum-chaser":
      // Trending up
      return (
        <svg {...common}>
          <polyline points="3 16 9 10 13 14 21 6" />
          <polyline points="15 6 21 6 21 12" />
        </svg>
      );
    case "death-over-closer":
      // Stopwatch
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="7.5" />
          <path d="M12 9v4l3 2" />
          <path d="M10 2h4" />
          <path d="M12 2v2.5" />
        </svg>
      );
    case "test-purist":
      // Shield
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
        </svg>
      );
    case "session-reader":
      // Eye
      return (
        <svg {...common}>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.75" />
        </svg>
      );
    case "all-rounder-skip":
    default:
      // Star -- explicit spec fallback (no "cricket" icon exists in this
      // icon-less codebase, so the spec's own documented fallback applies).
      return (
        <svg {...common}>
          <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.9-5.2 2.9 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />
        </svg>
      );
  }
}
