"use client";
import { useState } from "react";
import { QUIZ_QUESTIONS, computePersona, SKIP_PERSONA, type QuizAnswer, type Persona } from "@/lib/onboardingQuiz";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import PersonaParticles from "./PersonaParticles";

function persistFormatTags(persona: Persona) {
  const prefs = getFollowPrefs();
  const merged = Array.from(new Set([...prefs.formats, ...persona.formatTags]));
  prefs.formats = merged;
  setFollowPrefs(prefs);
}

async function sharePersona(persona: Persona) {
  const text = `I'm a ${persona.name} on Bawler -- ${persona.description}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // user cancelled the native share sheet, or it's unsupported at
      // runtime despite being present -- fall through to clipboard.
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable either -- nothing more to do; this is a
      // purely optional, non-blocking share action.
    }
  }
}

export default function QuizStep({ onComplete }: { onComplete: () => void }) {
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [copied, setCopied] = useState(false);

  const questionIndex = answers.length;
  const question = QUIZ_QUESTIONS[questionIndex];

  function answer(value: QuizAnswer) {
    const next = [...answers, value];
    setAnswers(next);
    if (next.length === QUIZ_QUESTIONS.length) {
      const result = computePersona(next);
      persistFormatTags(result);
      setPersona(result);
    }
  }

  // "Skip" link -- present on all 3 questions (added alongside the
  // team-picker/player-picker Skip links, matching their behavior:
  // skips only this step). Whatever's already in `answers` (0, 1, or
  // 2 responses) is discarded, never fed into computePersona -- the
  // skip path always lands on the fixed SKIP_PERSONA result, exactly
  // as if 0 questions had been answered.
  function skipQuiz() {
    setPersona(SKIP_PERSONA);
  }

  if (persona) {
    return (
      <div className="flex flex-col items-center gap-4 text-center animate-[fadeIn_0.2s_ease-out]">
        {/* v1.0.171 (onboarding visual polish): one-time particle burst,
            positioned as an absolute overlay behind the title text below.
            `persona` is only ever set once per quiz completion (this
            whole branch only renders after that happens), so mounting
            PersonaParticles unconditionally here already satisfies "plays
            once, never loops" -- there's no re-render path that would
            remount it. See that component for why it can never intercept
            the Share/Continue taps. */}
        <div className="relative">
          <PersonaParticles />
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Your cricket persona</div>
          <div className="text-2xl font-extrabold text-cyan">{persona.name}</div>
        </div>
        <div className="text-sm text-text-secondary max-w-xs">{persona.description}</div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={async () => {
              await sharePersona(persona);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
            className="text-xs font-bold px-4 py-2 rounded-full bg-white/[0.08] text-text-primary"
          >
            {copied ? "Copied!" : "Share"}
          </button>
          <button onClick={onComplete} className="text-xs font-bold px-4 py-2 rounded-full bg-cyan text-black">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-text-dim">
          Question {questionIndex + 1} of {QUIZ_QUESTIONS.length}
        </div>
        <button onClick={skipQuiz} className="text-xs font-bold text-text-dim">
          Skip
        </button>
      </div>
      <div className="text-lg font-bold text-text-primary text-center px-2">{question.prompt}</div>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => answer(question.optionA.value)}
          className="card p-4 text-sm font-semibold text-text-primary text-left hover:bg-white/[0.04] transition-colors"
        >
          {question.optionA.label}
        </button>
        <button
          onClick={() => answer(question.optionB.value)}
          className="card p-4 text-sm font-semibold text-text-primary text-left hover:bg-white/[0.04] transition-colors"
        >
          {question.optionB.label}
        </button>
      </div>
    </div>
  );
}
