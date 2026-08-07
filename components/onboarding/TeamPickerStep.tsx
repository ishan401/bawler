"use client";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Team } from "@/lib/types";
import { getOnboardingTeams, getTeamMoment, isNationalTeam, followIdFor, type TeamMoment } from "@/lib/onboardingTeams";
import { getFollowPrefs, setFollowPrefs } from "@/lib/followPrefs";
import SwipeCard, { type SwipeCardHandle } from "./SwipeCard";
import TeamCard, { FLAG_ISO } from "./TeamCard";
import TeamMomentCard from "./TeamMomentCard";
import RivalPrompt from "./RivalPrompt";
import LockedPreview from "./LockedPreview";

// v1.0.171 (onboarding visual polish): fanned card-stack + progress-chip
// constants. The two background placeholder cards never render real team
// content (no flag, no text) -- purely shaped/colored rectangles, so
// there is nothing to spoil about which team comes next, and (as a
// consequence) nothing that visually changes when the queue advances and
// a different team ends up occupying that slot. Only the front card
// (real content) needs an explicit arrival animation; see
// `frontEntering` below.
const STACK_SLOT_STYLE = [
  { rotate: 0, translateX: 0, scale: 1, opacity: 1 }, // front card -- handled by SwipeCard itself
  { rotate: 4, translateX: 7, scale: 0.96, opacity: 0.7 },
  { rotate: 8, translateX: 14, scale: 0.92, opacity: 0.5 },
] as const;
const FRONT_ENTER_MS = 200;
// Small circular chip per followed team, shown below the "X of 16 teams"
// row. Caps at 5 real chips + a "+N" badge once more than 6 are followed.
const CHIP_INLINE_CAP = 6;
const CHIP_SHOWN_WHEN_CAPPED = 5;

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

  // v1.0.171 (onboarding visual polish): the front card's "arrival"
  // animation -- whenever `index` advances (a card was dismissed, by tap
  // or swipe), the new front card starts at the resting look of the
  // *second* stack slot (scale 96%, rotate 4deg, content faded out) and
  // transitions to its normal resting look (scale 100%, rotate 0, fully
  // visible) over FRONT_ENTER_MS. Skipped on the very first render --
  // there's no "promotion" happening yet, so the first card should just
  // appear normally. The two-rAF flip is the same technique
  // SwipeCard/FirstSessionQuest's own enter-transitions use elsewhere in
  // this file's neighborhood: paint once at the "before" values, then
  // flip to the "after" values on the next frame so the CSS transition
  // has something to animate from.
  const isFirstIndexRender = useRef(true);
  const [frontEntering, setFrontEntering] = useState(false);
  useEffect(() => {
    if (isFirstIndexRender.current) {
      isFirstIndexRender.current = false;
      return;
    }
    setFrontEntering(true);
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFrontEntering(false));
    });
    return () => cancelAnimationFrame(raf1);
  }, [index]);

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

  const showChipCap = followedTeams.length > CHIP_INLINE_CAP;
  const visibleChips = showChipCap ? followedTeams.slice(0, CHIP_SHOWN_WHEN_CAPPED) : followedTeams;
  const overflowCount = showChipCap ? followedTeams.length - CHIP_SHOWN_WHEN_CAPPED : 0;

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

      {/* v1.0.171 (onboarding visual polish): per-team follow progress
          chips -- purely additive, sits below the row above and never
          touches it. This is a DIFFERENT progress signal from the
          3-segment step bar OnboardingFlow.tsx renders at the very top
          of the whole onboarding screen (that one tracks which of the
          3 onboarding STEPS you're on; this one tracks how many teams
          you've followed within this step) -- deliberately not merged. */}
      {followedTeams.length > 0 && (
        <div className="flex items-center gap-1.5 px-1 -mt-1">
          {visibleChips.map(t => {
            const flagIso = t.type === "national" ? FLAG_ISO[t.code] : undefined;
            return (
              <div
                key={t.code}
                className="chip-in w-[28px] h-[28px] rounded-full overflow-hidden shrink-0 border border-line flex items-center justify-center bg-bg-surface"
                title={t.fullName}
              >
                {flagIso ? (
                  <img
                    src={`https://flagcdn.com/w40/${flagIso}.png`}
                    alt={t.fullName}
                    width={28}
                    height={28}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="text-[9px] font-extrabold text-text-primary">{t.shortName.slice(0, 3)}</span>
                )}
              </div>
            );
          })}
          {showChipCap && (
            <div className="chip-in w-[28px] h-[28px] rounded-full shrink-0 flex items-center justify-center bg-white/20 text-white text-[9px] font-extrabold">
              +{overflowCount}
            </div>
          )}
        </div>
      )}

      {phase === "card" && (
        <>
          <div className="relative h-[420px]">
            {[2, 1, 0].map(offset => {
              const t = teams[index + offset];
              if (!t) return null;
              const isTop = offset === 0;
              const slot = STACK_SLOT_STYLE[offset];

              if (!isTop) {
                // Background placeholder -- deliberately renders NO real
                // team content (no flag, no text) so nothing about the
                // upcoming team is spoiled, and so nothing needs to
                // visually change when the queue advances and a
                // different team ends up occupying this slot (see the
                // constants' own comment above).
                return (
                  <div
                    key={`slot-${offset}`}
                    className="absolute inset-0 card h-[420px]"
                    style={{
                      transform: `translateX(${slot.translateX}px) rotate(${slot.rotate}deg) scale(${slot.scale})`,
                      opacity: slot.opacity,
                      zIndex: 10 - offset,
                    }}
                  />
                );
              }

              const enterStyle: React.CSSProperties = frontEntering
                ? { transform: "scale(0.96) rotate(4deg)", opacity: 0, transition: "none" }
                : { transform: "scale(1) rotate(0deg)", opacity: 1, transition: `transform ${FRONT_ENTER_MS}ms ease-out, opacity ${FRONT_ENTER_MS}ms ease-out` };

              return (
                <div key="slot-0" className="absolute inset-0" style={{ zIndex: 10, ...enterStyle }}>
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
            {/* v1.0.169: cyan checkmark, not green heart -- unifying every
                "follow" affordance platform-wide onto the FollowSheet's own
                selected-state color (#00E5FF, the same checkmark path/
                viewBox as CheckIndicator in components/FollowSheet.tsx).
                v1.0.170: switched from a solid cyan fill to an outline-only
                treatment (border-2 border-cyan text-cyan, transparent
                background, same border-2 weight as the X button next to
                it) -- this card presents skip/follow as two equally-weighted,
                not-yet-chosen options, so a solid-filled button here read as
                already-selected before the user had tapped anything. Border
                and icon both reuse the same #00E5FF value, no new color
                introduced. Size/position/tap target and the X (skip) button
                are unchanged. */}
            <button
              onClick={() => activeHandleRef.current?.swipeRight()}
              aria-label="Follow this team"
              className="w-14 h-14 rounded-full border-2 border-cyan text-cyan flex items-center justify-center tap-scale"
            >
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5L6.2 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
