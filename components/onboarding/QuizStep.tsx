"use client";
import { useEffect, useRef, useState } from "react";
import { QUIZ_QUESTIONS, computePersona, SKIP_PERSONA, type QuizAnswer, type Persona } from "@/lib/onboardingQuiz";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import PersonaParticles from "./PersonaParticles";
import { PersonaIcon } from "./PersonaIcon";

// v1.0.186 (onboarding visual overhaul): how long a tapped quiz answer's
// selected-state (border/bg/checkmark) holds before advancing, and how
// long the persona reveal waits before auto-navigating to Home. Both are
// exact values from the build spec, not tuned/approximate.
const ANSWER_HOLD_MS = 200;
const AUTO_ADVANCE_MS = 2500;

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
  // v1.0.186: which option (if any) is currently in its ANSWER_HOLD_MS
  // "just tapped" visual hold, per build spec item 5. Not persisted
  // across questions -- reset to null the instant the real advance
  // happens (see `answer()` below), so the next question always renders
  // fresh/unselected.
  const [selected, setSelected] = useState<QuizAnswer | null>(null);
  const selectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (selectTimeoutRef.current !== null) window.clearTimeout(selectTimeoutRef.current);
    };
  }, []);

  const questionIndex = answers.length;
  const question = QUIZ_QUESTIONS[questionIndex];

  function commitAnswer(value: QuizAnswer) {
    const next = [...answers, value];
    setAnswers(next);
    if (next.length === QUIZ_QUESTIONS.length) {
      const result = computePersona(next);
      persistFormatTags(result);
      setPersona(result);
    }
  }

  // v1.0.186: tapping an answer no longer jumps straight to the next
  // question -- it first renders the selected-state (border/bg/checkmark,
  // via AnswerButton below) and holds it for exactly ANSWER_HOLD_MS
  // before the real advance/compute logic runs, so the tap always
  // visibly registers. A second tap while one is already holding is
  // ignored (`if (selected) return`) rather than queuing/racing.
  function answer(value: QuizAnswer) {
    if (selected) return;
    setSelected(value);
    selectTimeoutRef.current = window.setTimeout(() => {
      setSelected(null);
      commitAnswer(value);
    }, ANSWER_HOLD_MS);
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
    return <PersonaReveal persona={persona} onComplete={onComplete} copied={copied} setCopied={setCopied} />;
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-text-dim">
          Question {questionIndex + 1} of {QUIZ_QUESTIONS.length}
        </div>
        <button onClick={skipQuiz} className="onboarding-skip-pill text-xs font-bold text-text-dim">
          Skip
        </button>
      </div>
      {/* v1.0.186: header/Skip row above stays fixed at the top; only the
          question + answers are vertically centered in the remaining
          space, per the "center the primary card" build spec. */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="text-lg font-bold text-text-primary text-center px-2">{question.prompt}</div>
        <div className="flex flex-col gap-3">
          <AnswerButton label={question.optionA.label} value={question.optionA.value} selected={selected} onSelect={answer} />
          <AnswerButton label={question.optionB.label} value={question.optionB.value} selected={selected} onSelect={answer} />
        </div>
      </div>
    </div>
  );
}

function AnswerButton({
  label, value, selected, onSelect,
}: { label: string; value: QuizAnswer; selected: QuizAnswer | null; onSelect: (v: QuizAnswer) => void }) {
  const isSelected = selected === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={`onboarding-row relative p-4 pr-11 text-sm font-semibold text-text-primary text-left transition-[filter] ${
        isSelected ? "onboarding-answer-selected" : "hover:brightness-110"
      }`}
    >
      {label}
      {isSelected && (
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 animate-[fadeIn_0.15s_ease-out]"
          style={{ color: "#3fb8b8" }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

// v1.0.186 (onboarding visual overhaul): the persona reveal screen --
// rebuilt per the build spec's item 6. The old forced "Continue" tap is
// gone entirely; this now auto-advances to Home 2.5s after mount unless
// the user taps the card (immediate skip-the-wait) or opens Share (which
// fully pauses the timer, then restarts a fresh 2.5s run from 0% once
// the share sheet closes -- never a resumed partial timer).
function PersonaReveal({
  persona, onComplete, copied, setCopied,
}: { persona: Persona; onComplete: () => void; copied: boolean; setCopied: (v: boolean) => void }) {
  // `runId` forces a fresh remount (and therefore a fresh 0%-start) of the
  // progress-fill div every time a genuinely new AUTO_ADVANCE_MS run
  // begins -- initial mount, and again after the share sheet closes.
  const [runId, setRunId] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(onComplete, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [runId, paused, onComplete]);

  async function handleShare(e: React.MouseEvent) {
    // Share has its own hit area and must NOT also trigger the card's
    // tap-to-skip handler below.
    e.stopPropagation();
    setPaused(true);
    await sharePersona(persona);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
    // Whether the user actually shared or cancelled, the share sheet is
    // now closed either way -- restart the FULL 2.5s timer/progress bar
    // from 0%, per the build spec (never resume a partially-elapsed one).
    setPaused(false);
    setRunId(r => r + 1);
  }

  return (
    <div className="flex-1 flex flex-col justify-center">
      <div
        onClick={onComplete}
        role="button"
        aria-label="Continue to Home"
        className="onboarding-card relative w-full p-6 flex flex-col items-center gap-4 text-center animate-[fadeIn_0.2s_ease-out] cursor-pointer"
      >
        <div className="onboarding-persona-badge">
          <PersonaIcon personaId={persona.id} />
        </div>

        {/* v1.0.171 (onboarding visual polish): one-time particle burst,
            positioned as an absolute overlay behind the title text below.
            `persona` is only ever set once per quiz completion (this
            whole branch only renders after that happens), so mounting
            PersonaParticles unconditionally here already satisfies "plays
            once, never loops" -- there's no re-render path that would
            remount it. See that component for why it can never intercept
            the Share tap or this card's own tap-to-skip. */}
        <div className="relative">
          <PersonaParticles />
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Your cricket persona</div>
          <div className="text-2xl font-extrabold text-cyan">{persona.name}</div>
        </div>
        <div className="text-sm text-text-secondary max-w-xs">{persona.description}</div>

        <button
          onClick={handleShare}
          className="onboarding-pill text-xs font-bold px-4 py-2 bg-white/[0.08] text-text-primary mt-1"
        >
          {copied ? "Copied!" : "Share"}
        </button>

        <div className="onboarding-autoadvance-track" aria-hidden="true">
          <div
            key={runId}
            className="onboarding-autoadvance-fill"
            style={{ animationPlayState: paused ? "paused" : "running" }}
          />
        </div>
      </div>
    </div>
  );
}
