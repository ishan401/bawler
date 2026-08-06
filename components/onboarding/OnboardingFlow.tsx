"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "@/lib/types";
import { markOnboardingComplete } from "@/lib/onboarding";
import { initFirstSessionQuest } from "@/lib/firstSessionQuest";
import TeamPickerStep from "./TeamPickerStep";
import PlayerPickStep from "./PlayerPickStep";

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
  const [lockedPreviewShown, setLockedPreviewShown] = useState(false);

  function finishOnboarding(anyTeamFollowed: boolean) {
    markOnboardingComplete();
    initFirstSessionQuest(anyTeamFollowed);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <ProgressBar step={step} teamsProgress={teamsProgress} />
      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-md mx-auto w-full">
        {step === "teams" && (
          <TeamPickerStep
            onProgress={(current, total) => setTeamsProgress(current / total)}
            lockedPreviewShown={lockedPreviewShown}
            markLockedPreviewShown={() => setLockedPreviewShown(true)}
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
            lockedPreviewShown={lockedPreviewShown}
            markLockedPreviewShown={() => setLockedPreviewShown(true)}
            onComplete={() => setStep("quiz")}
          />
        )}

        {step === "quiz" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-sm text-text-secondary">Quiz step -- next increment.</div>
            <button
              onClick={() => finishOnboarding(followedTeams.length > 0)}
              className="text-xs font-bold px-4 py-2 rounded-full bg-cyan text-black"
            >
              (temporary) Finish onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
