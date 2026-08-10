// ============================================================================
// Onboarding — cricket personality quiz (v1.0.165)
// ============================================================================
// Step 3 of the first-run onboarding flow. Three lighthearted either/or
// questions; each answer maps invisibly to an underlying axis, and the
// combination of axes deterministically picks one of a fixed, small set
// of personas -- THIS is how format/tournament preference gets captured
// for onboarding, per the build spec ("there is no separate plain
// preference-settings step"). The resulting tags get written into
// FollowPrefs.formats, the exact same field the Filter sheet's own
// "Format" category already reads/writes -- no second, parallel
// preference field for this.
//
// Two axes, deliberately small and exhaustive:
//   - style:      "aggressive" (Q1 = A) | "grinder" (Q1 = B)
//   - formatLean: "short" (Q2=A and Q3=A) | "long" (Q2=B and Q3=B) |
//                 "balanced" (Q2/Q3 disagree)
// 2 style values x 3 formatLean values = exactly 6 combinations, and
// exactly 6 personas below -- a genuine 1:1 mapping table, not a
// fallback/default case swallowing anything.
// ============================================================================

import type { MatchFormat } from "./types";

export type QuizAnswer = "A" | "B";

export interface QuizOption {
  label: string;
  value: QuizAnswer;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  optionA: QuizOption;
  optionB: QuizOption;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "style",
    prompt: "Bazball or backs-to-the-wall?",
    optionA: { label: "Bazball -- attack from ball one", value: "A" },
    optionB: { label: "Backs-to-the-wall -- grind it out", value: "B" },
  },
  {
    id: "format1",
    prompt: "Chasing 200 in 20 overs, or defending a Test declaration?",
    optionA: { label: "Chasing 200 in 20", value: "A" },
    optionB: { label: "Defending a Test declaration", value: "B" },
  },
  {
    id: "format2",
    prompt: "The final over of a T20 decider, or day 5 of a Test classic?",
    optionA: { label: "Final over of a T20 decider", value: "A" },
    optionB: { label: "Day 5 of a Test classic", value: "B" },
  },
];

type Style = "aggressive" | "grinder";
type FormatLean = "short" | "long" | "balanced";

export interface Persona {
  id: string;
  name: string;
  description: string;
  formatTags: MatchFormat[];
}

// The mapping table itself -- style x formatLean -> persona, all 6 cells
// filled, final content (not placeholders).
const PERSONA_TABLE: Record<Style, Record<FormatLean, Persona>> = {
  aggressive: {
    short: {
      id: "boundary-hunter",
      name: "Boundary Hunter",
      description: "You want fours, sixes, and chases down to the last over.",
      formatTags: ["T20", "T20I", "Hundred"],
    },
    long: {
      id: "bazball-believer",
      name: "Bazball Believer",
      description: "You want us to attack even on day one of a Test -- no forward defensives, just intent.",
      formatTags: ["Test"],
    },
    balanced: {
      id: "momentum-chaser",
      name: "Momentum Chaser",
      description: "You live for whichever format is swinging hardest right now -- length doesn't matter, tempo does.",
      formatTags: ["ODI"],
    },
  },
  grinder: {
    short: {
      id: "death-over-closer",
      name: "Death-Over Closer",
      description: "Give you a tight chase with two overs left and a cool head -- that's when you're happiest.",
      formatTags: ["T20", "T20I", "Hundred"],
    },
    long: {
      id: "test-purist",
      name: "Test Purist",
      description: "Five days, twenty-two yards, and not a ball wasted -- you're here for the long game.",
      formatTags: ["Test"],
    },
    balanced: {
      id: "session-reader",
      name: "Session Reader",
      description: "You read situations, not scorelines -- a good defensive stand means as much to you as a six.",
      formatTags: ["ODI"],
    },
  },
};

// Fixed, hardcoded result shown ONLY when a user clicks the quiz's
// "Skip" link (added alongside the team-picker/player-picker Skip
// links -- see QuizStep.tsx). Deliberately NOT part of PERSONA_TABLE
// above: it is never computed from answers, never varies by which
// question was open when Skip was pressed, and applies identically
// whether 0, 1, or 2 of the 3 questions were answered first. Any
// partial answers collected before Skip was pressed are discarded --
// this persona is the only outcome of the skip path, always.
export const SKIP_PERSONA: Persona = {
  id: "all-rounder-skip",
  name: "All-Rounder",
  description: "You're here for the cricket, in whatever form it takes.",
  formatTags: [],
};

/**
 * `answers` must be exactly 3 values, in QUIZ_QUESTIONS order
 * ([style, format1, format2]).
 */
export function computePersona(answers: QuizAnswer[]): Persona {
  const style: Style = answers[0] === "A" ? "aggressive" : "grinder";
  const format1 = answers[1];
  const format2 = answers[2];
  const formatLean: FormatLean = format1 === "A" && format2 === "A" ? "short" : format1 === "B" && format2 === "B" ? "long" : "balanced";
  return PERSONA_TABLE[style][formatLean];
}
