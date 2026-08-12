"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";
import { PLAYERS } from "@/lib/mockData";
import { markOnboardingComplete } from "@/lib/onboarding";
import { applyOnboardingFallbackIfNeeded } from "@/lib/followPrefs";
import { initFirstSessionQuest } from "@/lib/firstSessionQuest";
import TeamPickerStep from "./TeamPickerStep";
import PlayerPickStep from "./PlayerPickStep";
import QuizStep from "./QuizStep";
import RevealStep from "./RevealStep";

type Step = "teams" | "players" | "quiz" | "reveal";

function ProgressBar({ step, teamsProgress }: { step: Step; teamsProgress: number }) {
  // Segment 1 = teams, segment 2 = players, segment 3 = quiz/reveal --
  // per build spec. Only segment 1 has meaningful sub-progress today
  // (fed by the team picker's own index/total); segments for
  // not-yet-reached steps sit at 0, past steps sit at 100.
  const seg1 = step === "teams" ? teamsProgress : 1;
  const seg2 = step === "players" ? 0.5 : step === "quiz" || step === "reveal" ? 1 : 0;
  const seg3 = step === "quiz" || step === "reveal" ? 0.5 : 0;
  const segs = [seg1, seg2, seg3];
  return (
    <div className="flex gap-1.5 px-4 pt-4">
      {segs.map((v, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-cyan transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(v * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("teams");
  const [teamsProgress, setTeamsProgress] = useState(0);
  const [followedTeams, setFollowedTeams] = useState<Team[]>([]);
  const [followedPlayerIds, setFollowedPlayerIds] = useState<string[]>([]);

  function finishOnboarding(anyTeamFollowed: boolean) {
    // v1.0.182: must run AFTER every step (teams/players/quiz) has already
    // had its chance to write a real, explicit follow, and BEFORE
    // markOnboardingComplete() -- it only ever fills in
    // DEFAULT_FALLBACK_FORMATS for a user who leaves with genuinely zero
    // follows of any kind (see lib/followPrefs.ts). A user who followed a
    // team/player, or answered the quiz, is untouched by this call.
    applyOnboardingFallbackIfNeeded();
    markOnboardingComplete();
    initFirstSessionQuest(anyTeamFollowed);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <ProgressBar step={step} teamsProgress={teamsProgress} />
      {/* v1.0.186 (onboarding visual overhaul): `pb-[...]` adds explicit
          clearance for BottomNav (rendered globally in app/layout.tsx, a
          `fixed bottom-0` element ~52px tall that overlaps this flex
          container's own box rather than participating in its layout).
          Before this fix, `justify-center` centered each step's content
          against the FULL height down to the phone-frame's bottom edge,
          so ~52px of that "centered" space was always hidden behind the
          nav bar -- the true visible gap below a step's content came out
          smaller than the gap above it, reading as empty space
          concentrated at the top even though the box-level math was
          symmetric. Reserving the nav's own height as bottom padding
          makes the remaining box match the actually-visible area between
          the progress bar and the nav bar, so centering now splits real
          empty space evenly above/below. */}
      <div className="flex-1 flex flex-col justify-center px-4 pt-6 pb-[calc(1.5rem_+_52px)] max-w-md mx-auto w-full">
        {step === "teams" && (
          <TeamPickerStep
            onProgress={(current, total) => setTeamsProgress(current / total)}
            onComplete={teams => {
              setFollowedTeams(teams);
              setTeamsProgress(1);
              setStep("players");
            }}
          />
        )}

        {step === "players" && (
          <PlayerPickStep
            followedTeams={followedTeams}
            onComplete={playerIds => {
              setFollowedPlayerIds(playerIds);
              setStep("quiz");
            }}
          />
        )}

        {step === "quiz" && (
          <QuizStep onComplete={() => setStep("reveal")} />
        )}

        {step === "reveal" && (
          <RevealStep
            teamNames={followedTeams.map(t => t.shortName)}
            playerNames={followedPlayerIds
              .map(id => PLAYERS[id]?.shortName)
              .filter((n): n is string => Boolean(n))}
            onDone={() => finishOnboarding(followedTeams.length > 0)}
          />
        )}
      </div>
    </div>
  );
}
