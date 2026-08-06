"use client";
import { useState, useMemo, useCallback } from "react";
import type { Team } from "@/lib/types";
import { getOnboardingTeams, getTeamMoment, isNationalTeam, followIdFor, type TeamMoment } from "@/lib/onboardingTeams";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import SwipeCard from "./SwipeCard";
import TeamCard from "./TeamCard";
import TeamMomentCard from "./TeamMomentCard";
import RivalPrompt from "./RivalPrompt";
import LockedPreview from "./LockedPreview";

type Phase = "card" | "moment" | "rival" | "locked-preview";

/** Persists a team follow into the SAME shared FollowPrefs store the rest
 * of the app's FOR YOU logic already reads -- national teams go into
 * `nations` (keyed by Team.country, falling back to Team.code, mirroring
 * lib/followPrefs.ts's own nationOf() convention), franchise teams into
 * `teams` (keyed by Team.code). No second, parallel preference system. */
function followTeam(team: Team) {
  const prefs = getFollowPrefs();
  const id = followIdFor(team);
  if (isNationalTeam(team)) {
    if (!prefs.nations.includes(id)) prefs.nations = [...prefs.nations, id];
  } else {
    if (!prefs.teams.includes(id)) prefs.teams = [...prefs.teams, id];
  }
  setFollowPrefs(prefs);
}

function setRivalTeam(team: Team) {
  const prefs = getFollowPrefs();
  prefs.rivalTeam = team.code;
  setFollowPrefs(prefs);
}

export default function TeamPickerStep({
  onComplete,
  onProgress,
  lockedPreviewShown,
  markLockedPreviewShown,
}: {
  onComplete: (followedTeams: Team[]) => void;
  onProgress: (current: number, total: number) => void;
  /** Shared across BOTH step 1 and step 2 -- the locked-preview trade-off
   * nudge is one moment in the whole onboarding session, not a per-step
   * nag. See components/onboarding/OnboardingFlow.tsx, which owns this
   * state and passes it to both steps. */
  lockedPreviewShown: boolean;
  markLockedPreviewShown: () => void;
}) {
  const teams = useMemo(() => getOnboardingTeams(), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("card");
  const [moment, setMoment] = useState<TeamMoment | null>(null);
  const [followedTeams, setFollowedTeams] = useState<Team[]>([]);
  const [rivalAsked, setRivalAsked] = useState(false);

  const total = teams.length;
  const current = teams[index];

  const advanceOrFinish = useCallback(
    (nextFollowed: Team[]) => {
      if (index >= total - 1) {
        onComplete(nextFollowed);
      } else {
        setIndex(i => i + 1);
        setPhase("card");
        onProgress(index + 2, total); // report the UPCOMING card's 1-based position
      }
    },
    [index, total, onComplete, onProgress]
  );

  function handleSkip(team: Team) {
    void team; // left-swipe: no follow, no moment, no rival prompt
    advanceOrFinish(followedTeams);
  }

  async function handleFollow(team: Team) {
    followTeam(team);
    const next = [...followedTeams, team];
    setFollowedTeams(next);
    const m = await getTeamMoment(team);
    if (m) {
      setMoment(m);
      setPhase("moment");
    } else {
      afterMomentOrSkip(next);
    }
  }

  function afterMomentOrSkip(followedSoFar: Team[]) {
    if (!rivalAsked) {
      setPhase("rival");
    } else {
      advanceOrFinish(followedSoFar);
    }
  }

  function handleRivalResolved() {
    setRivalAsked(true);
    advanceOrFinish(followedTeams);
  }

  /** Called by the step-level "Skip" link/the flow's own skip affordance --
   * this is "skip the ENTIRE step," distinct from an individual card's
   * left-swipe (handleSkip above). */
  function requestSkipStep() {
    if (followedTeams.length === 0 && !lockedPreviewShown) {
      setPhase("locked-preview");
      markLockedPreviewShown();
    } else {
      onComplete(followedTeams);
    }
  }

  if (phase === "locked-preview") {
    return (
      <LockedPreview
        onGoBack={() => setPhase("card")}
        onSkipAnyway={() => onComplete(followedTeams)}
      />
    );
  }

  if (!current) {
    // Defensive -- getOnboardingTeams() always returns 16 real teams
    // today, but guard against an empty curated list anyway rather than
    // rendering nothing with no way forward.
    onComplete(followedTeams);
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-text-dim">
          {index + 1} of {total} teams
        </div>
        <button onClick={requestSkipStep} className="text-xs font-bold text-text-dim">
          Skip
        </button>
      </div>

      {phase === "card" && (
        <div className="relative h-[420px]">
          {[2, 1, 0].map(offset => {
            const t = teams[index + offset];
            if (!t) return null;
            const isTop = offset === 0;
            const scale = 1 - offset * 0.04;
            const translateY = offset * 10;
            return (
              <div
                key={t.code}
                className="absolute inset-0"
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  zIndex: 10 - offset,
                  opacity: offset === 2 ? 0.5 : offset === 1 ? 0.75 : 1,
                }}
              >
                <SwipeCard
                  active={isTop}
                  onSwipeRight={() => handleFollow(t)}
                  onSwipeLeft={() => handleSkip(t)}
                >
                  <TeamCard team={t} />
                </SwipeCard>
              </div>
            );
          })}
        </div>
      )}

      {phase === "moment" && moment && (
        <TeamMomentCard moment={moment} onContinue={() => afterMomentOrSkip(followedTeams)} />
      )}

      {phase === "rival" && (
        <RivalPrompt
          candidates={teams.filter(t => t.code !== current.code).slice(0, 6)}
          onPick={t => {
            setRivalTeam(t);
            handleRivalResolved();
          }}
          onSkip={handleRivalResolved}
        />
      )}
    </div>
  );
}
