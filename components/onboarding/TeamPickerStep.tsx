"use client";
import { useState, useMemo, useCallback, useRef } from "react";
import type { Team } from "@/lib/types";
import { getOnboardingTeams, getTeamMoment, isNationalTeam, followIdFor, type TeamMoment } from "@/lib/onboardingTeams";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import SwipeCard, { type SwipeCardHandle } from "./SwipeCard";
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
  // Bug fix (post-v1.0.165 live-browser report): the swipe gesture itself
  // works correctly (confirmed via real Chrome mouse-drag testing -- a
  // drag past SWIPE_THRESHOLD_PX genuinely calls onSwipeRight/onSwipeLeft
  // through real trusted PointerEvents), but there was NO tap-based
  // affordance at all -- SwipeCard's own `registerHandle` prop exists
  // specifically for "lets the parent trigger a swipe programmatically
  // (heart/X buttons)" per its own doc comment, but this file never
  // wired it up, so a user who doesn't drag far enough (or can't/won't
  // drag at all) had no way to follow a team, despite the original spec
  // explicitly requiring "swipe right OR tap a heart/check button." This
  // ref holds the currently-active (top) card's imperative handle so the
  // two always-visible buttons below can call the exact same
  // runExit()-driven follow/skip path a real swipe uses -- no duplicated
  // follow/skip logic, and this now works with zero dependency on
  // gesture support at all.
  const activeHandleRef = useRef<SwipeCardHandle | null>(null);

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
        <>
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
                    registerHandle={isTop ? h => { activeHandleRef.current = h; } : undefined}
                  >
                    <TeamCard team={t} />
                  </SwipeCard>
                </div>
              );
            })}
          </div>

          {/* Always-visible tap controls -- work with zero dependency on
              swipe/drag gesture support, per the explicit requirement that
              a single tap must follow a team "full stop." Calls the exact
              same SwipeCardHandle.swipeLeft/swipeRight a real drag would
              trigger, so there is exactly one follow/skip code path. */}
          <div className="flex items-center justify-center gap-8 pt-2">
            <button
              onClick={() => activeHandleRef.current?.swipeLeft()}
              aria-label="Skip this team"
              className="w-14 h-14 rounded-full border-2 border-negative text-negative flex items-center justify-center tap-scale"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>
            <button
              onClick={() => activeHandleRef.current?.swipeRight()}
              aria-label="Follow this team"
              className="w-14 h-14 rounded-full border-2 border-boundary text-boundary flex items-center justify-center tap-scale"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 21s-6.716-4.35-9.428-8.06C.86 10.42 1.2 6.9 3.76 5.06 6.02 3.44 8.9 4.1 10.6 6.2L12 7.9l1.4-1.7c1.7-2.1 4.58-2.76 6.84-1.14 2.56 1.84 2.9 5.36 1.19 7.88C18.716 16.65 12 21 12 21z" />
              </svg>
            </button>
          </div>
        </>
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
