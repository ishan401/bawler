"use client";

import { useEffect, useRef, useState } from "react";
import type { Ball, FielderPosition, Match } from "@/lib/types";
import { outcomeKindOf, cardBackgroundFor, type OutcomeKind } from "@/lib/outcomeColors";
import { SPIN } from "@/lib/tokens";
import { formatPlayerName } from "@/lib/playerName";

interface PartnershipBatter { name: string; runs: number; balls: number; fours: number; sixes: number; }
interface PartnershipInfo { batters: PartnershipBatter[]; totalRuns: number; totalBalls: number; totalFours: number; totalSixes: number; }

interface BallGIFProps {
  ball: Ball;
  match: Match;
  fielders?: FielderPosition[];
  loopMs?: number;
  partnership?: PartnershipInfo;
  onShare?: (ball: Ball) => void; // centralised in MatchView
  /* v1.0.175 -- suppresses the very first `.scene-fade-in` entrance
     animation on this mount. Why this exists: MatchView.tsx wraps its
     tab content in a `key={tab}`-keyed div so the book-enter/exit page
     transition can replay on every genuine tab switch -- correct for
     that transition, but it also means this entire component (BallGIF)
     is fully unmounted and a brand-new instance is mounted every time a
     user switches back into the Live tab, not just on the match page's
     true first load. That remount was confirmed live via DOM-node-
     identity probing (the root DOM node is a different node object each
     time, not the same one persisting). Because the scene div below
     re-mounts too, its `.scene-fade-in` class replayed the fade from
     opacity 0 on every tab-switch-back, producing a visible flash.
     Rather than touch `key={tab}`, useTabSwitcher.ts, or the book-enter/
     exit CSS (all of which are correct and serve a different, legitimate
     transition), MatchView.tsx threads down whether the Live tab has
     already been shown once during this match-page visit via a ref that
     lives ABOVE the keyed/remounted subtree and therefore survives tab
     switches. When true, this mount is a tab-switch-back remount, not a
     true first mount, so the entrance fade is skipped for the initial
     scene render only -- the normal per-clip cross-fade animation (the
     legitimate bowler/overhead swap every loopMs/2) is untouched and
     continues to play normally afterward. */
  skipEntranceAnimation?: boolean;
}

const OUTCOME_WORD: Record<OutcomeKind, string> = {
  wicket: "Wicket",
  dot: "Dot ball",
  single: "1 run",
  two: "2 runs",
  three: "3 runs",
  four: "Four",
  six: "Six",
  extra: "Extra",
};

/* screen-reader announcement text for the aria-live region below —
   must carry the actual outcome + bowler/batter, never a generic
   "content updated" message */
function ballAnnouncement(ball: Ball): string {
  const bowler = formatPlayerName(ball.bowlerName) || "Bowler";
  const batter = formatPlayerName(ball.batterName) || "Batter";
  const outcome = OUTCOME_WORD[outcomeKindOf(ball)];
  return `${outcome}, ${bowler} to ${batter}`;
}

export default function BallGIF({
  ball, match, fielders, loopMs = 6000,
  partnership,
  onShare,
  skipEntranceAnimation,
}: BallGIFProps) {
  const [activeClip, setActiveClip] = useState<"bowler" | "overhead">("bowler");

  // Lazy-init: only reads `skipEntranceAnimation` on this instance's true
  // first render. Flipped to false in an effect exactly once, so the very
  // first scene render can consult the pre-mutation value while every
  // later render (clip swaps, ball updates) gets the normal animated
  // behavior regardless of the prop's value.
  //
  // v1.0.177 -- the flip used to happen in a same-tick `useEffect(() => {},
  // [])` (fires essentially the instant React commits, well under a
  // millisecond after mount). That was too eager. MatchView.tsx's
  // `key={tab}` wrapper plays a concurrent 300ms `book-enter-forward` /
  // `book-enter-backward` transition (3D `perspective()` transform +
  // opacity) on the ANCESTOR of this component at the exact same moment a
  // tab-switch-back-into-Live remount happens. `direction` (and so this
  // transition) is only ever non-null after a genuine `switchTab` call --
  // see useTabSwitcher.ts -- so it is NOT present on a true fresh page
  // load or while just sitting on Live. That lines up exactly with the
  // reported symptom: only ever seen right after switching tabs INTO
  // Live, never on fresh load, never mid-session.
  //
  // If the mock live-simulation ticks a new ball (or the periodic
  // bowler/overhead cross-fade interval fires) inside that ~300ms window,
  // the scene div remounts again with a fresh key -- and under the old
  // same-tick flip, suppressFirstFadeRef.current had already gone false
  // by then, so `.scene-fade-in` applied normally to that second remount,
  // nesting its own opacity animation inside an ancestor whose compositing
  // layer was still being established by the in-flight 3D-transform
  // animation. This is a plausible, well-established class of browser
  // compositor bug (a child layer's animation starting before its
  // transform-animating ancestor's own layer has been promoted/committed
  // can be left stranded on a pre-animation frame) and is the best
  // explanation that fits every reported detail, including that it does
  // not self-correct on its own.
  //
  // IMPORTANT CAVEAT for whoever revisits this: repeated direct
  // getComputedStyle polling in this session's testing (both Claude-in-
  // Chrome automation and manual code tracing) could NOT reproduce a
  // *permanently* stuck opacity value -- every sampled instance this
  // session settled to opacity 1 within roughly 300-500ms once actually
  // rechecked with real timers. That automation runs in a tab that is
  // permanently `document.hidden: true` (a structural limitation of the
  // extension, documented elsewhere in this codebase -- see
  // useCarouselIndex.ts's rAF-suspension note), and this session also
  // independently confirmed that screenshots captured from that hidden
  // tab are unreliable and can show a page-wide washed-out render that
  // does NOT match the underlying computed DOM/CSS state at that instant.
  // So this fix is based on: (1) a real, reproducible concurrency window
  // that only exists on tab-switch-back (confirmed directly -- direction
  // is null on fresh load, set on switches), (2) a mechanistically sound
  // explanation for why a race in that window could produce a frame that
  // never repaints on its own, and (3) the live product owner's direct,
  // repeated, non-automated report of exactly that persistent symptom on
  // a real device -- but NOT a first-hand, tool-verified capture of the
  // stuck frame itself, which this automation environment cannot produce.
  // If this fix does not fully resolve the report, the next place to look
  // is whatever is unique to the reporter's real device/browser (GPU,
  // OS-level "reduce motion", extensions, viewport size) that this
  // environment cannot emulate.
  //
  // Fix: keep suppression active for the book-enter transition's full
  // 300ms window (320ms with margin), not just the first commit, whenever
  // this mount is a repeat tab-switch-back (`skipEntranceAnimation` true).
  // Any scene remount landing inside that window -- ball tick or
  // interval-driven clip swap alike -- also skips `.scene-fade-in`,
  // removing the nested-animation race entirely; once the window closes,
  // the normal per-clip cross-fade resumes exactly as before. A genuine
  // first-ever mount of this component (`skipEntranceAnimation` false --
  // fresh page load, or the very first time this match-page visit ever
  // switches into Live) is unaffected: the ref already starts `false` in
  // that case, so this effect no-ops and the entrance fade plays
  // immediately as originally designed. NOTE: this means the very first
  // time a session ever switches INTO Live (as opposed to a repeat visit)
  // is still theoretically exposed to the same race, since no suppression
  // flag is active on that occasion -- flagged in DECISIONS-LOG.md as a
  // known residual gap, not fixed here since it wasn't the reported/
  // tested scenario (which was always Live -> Score -> Live, i.e. always
  // a repeat visit).
  const suppressFirstFadeRef = useRef(skipEntranceAnimation ?? false);
  useEffect(() => {
    if (!suppressFirstFadeRef.current) return;
    const id = setTimeout(() => {
      suppressFirstFadeRef.current = false;
    }, 320);
    return () => clearTimeout(id);
  }, []);

  // v1.0.177 -- direct, node-identity-confirmed reproduction (not a guess):
  // repeat-tested this component's rendered scene div post-v1.0.176 and
  // found the SAME DOM node (`===` identity checked) reporting
  // `animationPlayState: "running"` while `opacity` stayed at the literal
  // string "0" for multiple real seconds -- 10x+ longer than
  // `.scene-fade-in`'s 280ms spec duration, and well outside the ~300ms
  // book-enter-transition window v1.0.176 targeted. So the v1.0.176 fix
  // (narrowing WHEN the race window against book-enter can occur) was
  // real and correct as far as it went, but it does not address the
  // deeper problem it was built on top of: `.scene-fade-in`'s own
  // browser-driven timeline can, independent of any tab-switch
  // concurrency, simply fail to progress from its 0% keyframe to
  // completion, with no code-level guarantee it ever will. A "hope the
  // animation plays" CSS keyframe with no fallback is inherently fragile
  // to whatever causes a browser to deprioritize a compositor timeline
  // (backgrounded/occluded tab, GPU/main-thread contention, etc.) --
  // this automation's tab happens to be permanently `document.hidden`,
  // which is sufficient to trigger it reliably for testing, but nothing
  // about the failure mode itself is specific to automation.
  //
  // Fix: a JS-driven watchdog per scene mount, using `setTimeout` rather
  // than `requestAnimationFrame` deliberately -- this codebase already
  // established (see `lib/useCarouselIndex.ts`) that rAF is fully
  // suspended (not just throttled) on a hidden/backgrounded tab, while
  // `setTimeout` keeps running. 400ms after a scene div mounts (280ms
  // animation spec + margin), if this render wasn't suppressed (nothing
  // to guard when there's no animation class in the first place), force
  // `animation: none` inline -- which unconditionally overrides an
  // author-stylesheet `animation` shorthand and stops the browser from
  // continuing to author the element's opacity -- immediately followed by
  // a plain `opacity: 1`. This guarantees the correct end state regardless
  // of whether `.scene-fade-in`'s own timeline ever actually completes. If
  // the animation already finished normally, this is a harmless no-op
  // (opacity is already 1). Scoped via `useEffect` deps matching the scene
  // div's own `key` (`activeClip`, `ball.id`) so it re-arms exactly once
  // per genuine remount of that div, not on every unrelated re-render.
  const sceneNodeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (suppressFirstFadeRef.current) return;
    const id = setTimeout(() => {
      const el = sceneNodeRef.current;
      if (!el) return;
      el.style.animation = "none";
      el.style.opacity = "1";
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClip, ball.id]);


  const isBigMoment = ball.isWicket || ball.isBoundary6 || ball.isBoundary4;
  const kind = outcomeKindOf(ball);
  const bg = cardBackgroundFor(kind);

  useEffect(() => setActiveClip("bowler"), [ball.id]);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveClip(c => (c === "bowler" ? "overhead" : "bowler"));
    }, loopMs / 2);
    return () => clearInterval(id);
  }, [loopMs]);



  /* accent colour for the share button glow */
  const shareAccent = ball.isWicket
    ? { bg: "rgba(239,68,68,0.90)", shadow: "rgba(239,68,68,0.55)" }
    : ball.isBoundary6
    ? { bg: "rgba(168,85,247,0.90)", shadow: "rgba(168,85,247,0.55)" }
    : { bg: "rgba(6,182,212,0.90)", shadow: "rgba(6,182,212,0.55)" };

  /* team colours for avatars — use innings data, not inningsNumber parity,
     so toss-dependent batting order is handled correctly */
  const currentInnings = match.innings.find(i => i.number === ball.inningsNumber);
  const battingTeam = currentInnings
    ? (currentInnings.battingTeam === match.teamA.code ? match.teamA : match.teamB)
    : match.teamA;
  const bowlingTeam = battingTeam.code === match.teamA.code ? match.teamB : match.teamA;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-white/10">
      {/* screen-reader-only live region: announces each new ball's outcome as it
         renders. "polite" (not "assertive") so it queues behind whatever the user
         is currently reading instead of interrupting on every single ball. This
         div itself never remounts (no ball-keyed key), only its text changes, so
         assistive tech reliably picks up each update. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {ballAnnouncement(ball)}
      </div>

      {/* ── ANIMATION ZONE ── */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16 / 10", ...bg,
          transition: "background-color 600ms ease-out, border-color 600ms ease-out" }}
      >
        {/* clip dots */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${activeClip === "bowler" ? "bg-white" : "bg-white/25"}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${activeClip === "overhead" ? "bg-white" : "bg-white/25"}`} />
        </div>

        {/* scene */}
        <div
          key={`${activeClip}-${ball.id}`}
          ref={sceneNodeRef}
          className={suppressFirstFadeRef.current ? "absolute inset-0" : "scene-fade-in absolute inset-0"}
        >
          {activeClip === "bowler"
            ? <BowlerView ball={ball} loopMs={loopMs / 2} battingColor={battingTeam.primaryColor} bowlingColor={bowlingTeam.primaryColor} />
            : <OverheadView ball={ball} fielders={fielders} loopMs={loopMs / 2} />}
        </div>

        {/* bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/55 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-2">
            <div className="flex flex-col gap-0 min-w-0">
              <TypeChip ball={ball} large />
              <SpeedChip ball={ball} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Share — big moments only, lives in the info bar, never over the visual itself */}
              {isBigMoment && onShare && (
                <button
                  onClick={() => onShare(ball)}
                  aria-label="Share this ball"
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  style={{ background: shareAccent.bg, color: "#fff" }}
                >
                  <ShareIcon />
                </button>
              )}
              <OutcomeBadge ball={ball} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 pb-1.5 text-[9px] font-semibold text-white/55 leading-none truncate">
            <span className="text-white/80 font-bold truncate">{ball.bowlerName}</span>
            <span className="text-white/35">→</span>
            <span className="text-white/80 font-bold truncate">{ball.batterName}</span>
          </div>
        </div>
      </div>

      {/* ── IMPACT FOOTER ── */}
      <PartnershipFooter ball={ball} partnership={partnership} match={match} />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT FOOTER — win-prob bar + swing + stat line
// ─────────────────────────────────────────────────────────────────────────────

function PartnershipFooter({ ball, partnership, match }: {
  ball: Ball;
  partnership?: PartnershipInfo;
  match: Match;
}) {
  /* batting team colour */
  const battingTeam = ball.inningsNumber % 2 === 1 ? match.teamA : match.teamB;
  const partnerColor = battingTeam.primaryColor;

  return (
    <div className="bg-[#0A0E1A] px-3 py-2 flex items-center gap-2">
      {partnership && partnership.batters.length > 0 && (
        <>
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 shrink-0">Pship</span>
          <span className="text-[13px] font-extrabold num shrink-0" style={{ color: partnerColor }}>{partnership.totalRuns}</span>
          <span className="text-[11px] text-white/35 shrink-0">({partnership.totalBalls})</span>
          <span className="text-white/20 shrink-0">·</span>
          {partnership.batters.map((b, i) => (
            <span key={b.name} className="flex items-baseline gap-0.5 shrink-0">
              {i > 0 && <span className="text-white/20 text-[10px] mx-1">·</span>}
              <span className="text-[11px] font-semibold text-white/55">{formatPlayerName(b.name)}</span>
              <span className="text-[13px] font-extrabold num text-white/85 leading-none ml-0.5">{b.runs}</span>
              <span className="text-[11px] text-white/35">({b.balls})</span>
              {b.fours > 0 && <span className="text-[10px] font-bold text-[#60A5FA] ml-0.5">{b.fours}×4</span>}
              {b.sixes > 0 && <span className="text-[10px] font-bold text-[#4ADE80] ml-0.5">{b.sixes}×6</span>}
            </span>
          ))}
          <span className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold num text-[#60A5FA]">{partnership.totalFours}<span className="text-white/35 font-normal"> 4s</span></span>
            <span className="text-[11px] font-bold num text-[#4ADE80]">{partnership.totalSixes}<span className="text-white/35 font-normal"> 6s</span></span>
          </span>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share icon SVG
// ─────────────────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clip A — Bowler's direction (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

function BowlerView({ ball, loopMs, battingColor, bowlingColor }: { ball: Ball; loopMs: number; battingColor: string; bowlingColor: string }) {
  const initials = (n: string) => { const p = n.trim().split(" "); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : n.slice(0,2).toUpperCase(); };
  const W = 800, H = 500;
  const PITCH_TOP_W = 80, PITCH_BOT_W = 220, PITCH_TOP_Y = 80, PITCH_BOT_Y = 380, CX = W / 2;
  const pitchXAtY = (y: number) => {
    const t = (y - PITCH_TOP_Y) / (PITCH_BOT_Y - PITCH_TOP_Y);
    const half = (PITCH_TOP_W + (PITCH_BOT_W - PITCH_TOP_W) * t) / 2;
    return { left: CX - half, right: CX + half };
  };
  const pitchPath = `M ${CX-PITCH_TOP_W/2} ${PITCH_TOP_Y} L ${CX+PITCH_TOP_W/2} ${PITCH_TOP_Y} L ${CX+PITCH_BOT_W/2} ${PITCH_BOT_Y} L ${CX-PITCH_BOT_W/2} ${PITCH_BOT_Y} Z`;
  const pitchY = ball.pitchY ?? 0.65;
  const _wRatio = PITCH_BOT_W / PITCH_TOP_W;
  const impactY = PITCH_BOT_Y - (_wRatio*(PITCH_BOT_Y-PITCH_TOP_Y)*pitchY)/(1+(_wRatio-1)*pitchY);
  const {right:rightImpact,left:leftImpact} = pitchXAtY(impactY);
  const halfImpact = (rightImpact-leftImpact)/2;
  const impactX = CX + (ball.pitchX??0)*halfImpact*0.9;
  // over-the-wicket: right-arm releases from right of stumps (+), left-arm from left (-)
  // round-the-wicket: opposite side
  const bowlerSide = ball.bowlingFrom==="round" ? (ball.bowlingArm==="right"?-1:1) : (ball.bowlingArm==="right"?1:-1);
  // Offset 40px from CX in 800px SVG — clearly beside the pitch crease, not on stumps
  const releaseX = CX+bowlerSide*40, releaseY = PITCH_TOP_Y-32;
  const runUpFromX = CX+bowlerSide*72, runUpFromY = PITCH_TOP_Y-90;
  const overRoundLabel = ball.bowlingFrom==="round" ? "Round the wicket" : "Over the wicket";
  const lineOffsetMap: Record<string,number> = {"wide-off":-75,"outside-off":-38,"off":-16,"middle":0,"leg":16,"outside-leg":38,"wide-leg":75};
  const batterArrivalX = CX+(ball.bowlingLine?lineOffsetMap[ball.bowlingLine]:(ball.pitchX??0)*38);
  const batterArrivalY = PITCH_BOT_Y-14;
  const swingDelta = (ball.swingDirection==="in"?-1:ball.swingDirection==="out"?1:0)*22*1.8;
  const prePitchControl = {x:(releaseX+impactX)/2+swingDelta,y:(releaseY+impactY)/2-6};

  const spinFromVariation =
    (ball.ballVariation === "leg-cutter" || ball.ballVariation === "doosra" || ball.ballVariation === "carrom") ? 1 :
    (ball.ballVariation === "off-cutter" || ball.ballVariation === "googly") ? -1 : 0;
  const spinBase = ball.spinDirection === "off" ? -1 : ball.spinDirection === "leg" ? 1 : spinFromVariation;
  const spinDelta = spinBase * 18 * 2.2;
  const _bounceH = 10+pitchY*50;
  const postPitchControl = {x:(impactX+batterArrivalX)/2+spinDelta,y:impactY-_bounceH};
  const speedFactor = ball.pace==="fast"?0.85:ball.pace==="slow"?1.2:1.0;
  const prePitchMs = loopMs*0.45*speedFactor, postPitchMs = loopMs*0.30*speedFactor;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pitchB" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B2918"/><stop offset="100%" stopColor="#6B4828"/>
        </linearGradient>
        <radialGradient id="ballB" cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE9A0"/><stop offset="100%" stopColor="#FF6B35"/>
        </radialGradient>
        <path id="pre-B" d={`M ${releaseX} ${releaseY} Q ${prePitchControl.x} ${prePitchControl.y} ${impactX} ${impactY}`}/>
        <path id="post-B" d={`M ${impactX} ${impactY} Q ${postPitchControl.x} ${postPitchControl.y} ${batterArrivalX} ${batterArrivalY}`}/>
      </defs>
      <path d={pitchPath} fill="url(#pitchB)" stroke="#5B3E22" strokeWidth="1"/>
      <line x1={CX-PITCH_TOP_W/2-6} y1={PITCH_TOP_Y+12} x2={CX+PITCH_TOP_W/2+6} y2={PITCH_TOP_Y+12} stroke="#FFFFFF" strokeOpacity="0.35"/>
      {/* Return crease line on bowler side */}
      <line x1={releaseX} y1={PITCH_TOP_Y+14} x2={releaseX} y2={PITCH_TOP_Y-10} stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="0.8" strokeDasharray="3 3"/>
      {/* Bowler run-up approach path */}
      <line x1={runUpFromX} y1={runUpFromY} x2={releaseX} y2={releaseY+10} stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 5" opacity="0.4"/>
      {/* Over/round label */}
      <text x={releaseX+bowlerSide*8} y={runUpFromY+14} fill="#94A3B8" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif" textAnchor={bowlerSide>0?"start":"end"} opacity="0.7">{overRoundLabel}</text>
      <line x1={CX-PITCH_BOT_W/2-8} y1={PITCH_BOT_Y-14} x2={CX+PITCH_BOT_W/2+8} y2={PITCH_BOT_Y-14} stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2"/>
      <Stumps cx={CX} cy={PITCH_TOP_Y+8} scale={0.6}/>
      <Stumps cx={CX} cy={PITCH_BOT_Y-6} scale={1.1} flying={ball.isWicket&&ball.dismissalType==="bowled"}/>
      <Person cx={releaseX} cy={releaseY+20} scale={0.55} arm={ball.bowlingArm??"right"} from={ball.bowlingFrom??"over"}/>
      {/* Bowler avatar — initials circle beside name */}
      <circle cx={releaseX+10} cy={releaseY+8} r={11} fill={`${bowlingColor}28`} stroke={`${bowlingColor}70`} strokeWidth="1.5"/>
      <text x={releaseX+10} y={releaseY+8} textAnchor="middle" dominantBaseline="central" fill={bowlingColor} fontSize="8" fontWeight="800" fontFamily="Inter,sans-serif">{initials(ball.bowlerName)}</text>
      <text x={releaseX+25} y={releaseY+12} fill="#F8FAFC" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">{ball.bowlerName}</text>
      <text x={releaseX+25} y={releaseY+26} fill="#94A3B8" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Bowler</text>
      <Person cx={CX-26} cy={PITCH_BOT_Y+30} scale={1.0} arm="right" from="over"/>
      <Bat cx={CX-26} cy={PITCH_BOT_Y+30} shotAngle={ball.shotAngle??0}/>
      {/* Batter avatar — initials circle beside name */}
      <circle cx={CX-88} cy={PITCH_BOT_Y+50} r={11} fill={`${battingColor}28`} stroke={`${battingColor}70`} strokeWidth="1.5"/>
      <text x={CX-88} y={PITCH_BOT_Y+50} textAnchor="middle" dominantBaseline="central" fill={battingColor} fontSize="8" fontWeight="800" fontFamily="Inter,sans-serif">{initials(ball.batterName)}</text>
      <text x={CX-74} y={PITCH_BOT_Y+56} textAnchor="start" fill="#F8FAFC" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">{ball.batterName}</text>
      <text x={CX-74} y={PITCH_BOT_Y+72} textAnchor="start" fill="#94A3B8" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Batter</text>
      <use href="#pre-B" stroke="#FF6B35" strokeWidth="1.4" fill="none" strokeDasharray="2 4" opacity="0.5"/>
      <use href="#post-B" stroke={ball.spinDirection!=="none"?SPIN:"#00E5FF"} strokeWidth="1.4" fill="none" strokeDasharray="2 4" opacity="0.55"/>
      <circle cx={impactX} cy={impactY} r="9" fill="#FF6B35" opacity="0.4"/>
      <circle cx={impactX} cy={impactY} r="4" fill="#FFE9A0"/>
      <circle r="4" fill="#000" opacity="0.5"><animateMotion dur={`${prePitchMs}ms`} repeatCount="indefinite" path={`M ${releaseX} ${releaseY+8} L ${impactX} ${impactY}`}/></circle>
      <circle r="6" fill="url(#ballB)"><animateMotion dur={`${prePitchMs}ms`} repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.7 1"><mpath href="#pre-B"/></animateMotion><animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.5;0.95;1" dur={`${prePitchMs}ms`} repeatCount="indefinite"/></circle>
      <circle r="4" fill="#000" opacity="0.5"><animateMotion dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite" path={`M ${impactX} ${impactY} L ${batterArrivalX} ${batterArrivalY}`}/></circle>
      <circle r="6" fill="url(#ballB)"><animateMotion dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite"><mpath href="#post-B"/></animateMotion><animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.5;0.95;1" dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite"/></circle>
      {ball.isWicket&&<rect x="0" y="0" width={W} height={H} fill="#EF4444" style={{animation:`wicket-flash ${loopMs}ms ease-out infinite`}}/>}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clip B — Overhead (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function OverheadView({ ball, fielders, loopMs }: { ball: Ball; fielders?: FielderPosition[]; loopMs: number }) {
  const W=800,H=500,CX=W/2,CY=H/2,FIELD_RX=W/2-12,FIELD_RY=H/2-12;
  const PITCH_W=24,PITCH_H=78,BATTER_X=CX,BATTER_Y=CY+PITCH_H/2;
  const angleRad=((ball.shotAngle??0)*Math.PI)/180;
  const reachPx=(ball.shotPower??0.5)*Math.min(FIELD_RX,FIELD_RY)*0.95;
  const shotEndX=BATTER_X+Math.sin(angleRad)*reachPx, shotEndY=BATTER_Y-Math.cos(angleRad)*reachPx;
  const isAerial=ball.shotIsAerial, isSix=ball.isBoundary6, isFour=ball.isBoundary4;
  const isDot=!ball.runs&&!ball.isWicket&&!ball.extras;
  const hasShotData=ball.shotAngle!=null;
  const wasLeft=ball.shotType==="left"||!hasShotData||(isDot&&Math.abs(ball.pitchX??0)>0.6);
  const firstContact=isAerial?{x:BATTER_X+(shotEndX-BATTER_X)*0.78,y:BATTER_Y+(shotEndY-BATTER_Y)*0.78}:null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="fieldO" cx="50%" cy="50%" r="65%"><stop offset="0%" stopColor="#1B243A"/><stop offset="100%" stopColor="#0A0E1A"/></radialGradient>
        <radialGradient id="ballO" cx="35%" cy="35%" r="60%"><stop offset="0%" stopColor="#FFE9A0"/><stop offset="100%" stopColor="#FF6B35"/></radialGradient>
        <path id="shotPath" d={isAerial?`M ${BATTER_X} ${BATTER_Y} Q ${(BATTER_X+shotEndX)/2} ${Math.min(BATTER_Y,shotEndY)-80*(ball.shotLoft??0.5)} ${shotEndX} ${shotEndY}`:`M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`}/>
      </defs>
      <ellipse cx={CX} cy={CY} rx={FIELD_RX} ry={FIELD_RY} fill="url(#fieldO)"/>
      <ellipse cx={CX} cy={CY} rx={FIELD_RX*0.55} ry={FIELD_RY*0.55} fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="4 6"/>
      <ellipse cx={CX} cy={CY} rx={FIELD_RX} ry={FIELD_RY} fill="none" stroke={isSix?"#A855F7":isFour?"#00E5FF":"#1E293B"} strokeWidth={isSix||isFour?"3":"1.2"} style={isSix||isFour?{animation:`pulse-soft 1.4s ease-out infinite`}:undefined}/>
      <rect x={CX-PITCH_W/2} y={CY-PITCH_H/2} width={PITCH_W} height={PITCH_H} fill="#3B2918" rx="1"/>
      <Stumps cx={CX} cy={CY-PITCH_H/2+4}/><Stumps cx={CX} cy={CY+PITCH_H/2-4} flying={ball.isWicket&&ball.dismissalType==="bowled"}/>
      <Person cx={BATTER_X-8} cy={BATTER_Y-2} scale={0.7} arm="right" from="over"/>
      {fielders?.map((f,i)=>{const a=(f.angle*Math.PI)/180,d=f.distance*Math.min(FIELD_RX,FIELD_RY)*0.95,fx=BATTER_X+Math.sin(a)*d,fy=BATTER_Y-Math.cos(a)*d;return<g key={i}><circle cx={fx} cy={fy} r="5" fill="#94A3B8" stroke="#0A0E1A" strokeWidth="1.5"/></g>;})}
      {!wasLeft&&<><path d={isAerial?`M ${BATTER_X} ${BATTER_Y} Q ${(BATTER_X+shotEndX)/2} ${Math.min(BATTER_Y,shotEndY)-80*(ball.shotLoft??0.5)} ${shotEndX} ${shotEndY}`:`M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`} stroke={ball.isWicket?"#EF4444":isSix?"#A855F7":isFour?"#00E5FF":"#94A3B8"} strokeWidth="2.5" strokeDasharray={isAerial?"0":"6 4"} fill="none" opacity="0.9"/><circle cx={shotEndX} cy={shotEndY} r="4" fill={ball.isWicket?"#EF4444":isSix?"#A855F7":isFour?"#00E5FF":"#94A3B8"}/></>}
      {firstContact&&<g><circle cx={firstContact.x} cy={firstContact.y} r="6" fill="none" stroke="#FFE9A0" strokeWidth="1.5" opacity="0.85"><animate attributeName="r" values="3;9;3" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite"/></circle><circle cx={firstContact.x} cy={firstContact.y} r="2.5" fill="#FFE9A0"/></g>}
      {!wasLeft&&<>{isAerial&&<circle r="4" fill="#000" opacity="0.4"><animateMotion dur={`${loopMs*0.9}ms`} repeatCount="indefinite" path={`M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`}/></circle>}<circle r="6" fill="url(#ballO)"><animateMotion dur={`${loopMs*0.9}ms`} repeatCount="indefinite"><mpath href="#shotPath"/></animateMotion></circle></>}
      {isSix&&<circle cx={shotEndX} cy={shotEndY} r="0" fill="none" stroke="#A855F7" strokeWidth="3" style={{animation:`boundary-pulse ${loopMs}ms ease-out infinite`}}/>}
      {isFour&&!isSix&&<circle cx={shotEndX} cy={shotEndY} r="0" fill="none" stroke="#00E5FF" strokeWidth="2" style={{animation:`boundary-pulse ${loopMs}ms ease-out infinite`}}/>}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function SpeedChip({ ball }: { ball: Ball }) {
  const speed = ball.ballSpeedKmh;
  if (!speed) return null;
  const color = speed>=140?"text-cyan":speed>=130?"text-text-primary":speed>=110?"text-orange":"text-slowPace";
  return <div className="flex items-baseline gap-0.5 leading-none"><span className={`text-xs font-extrabold num ${color}`}>{speed}</span><span className="text-[8px] font-semibold uppercase tracking-widest text-text-dim">kmh</span></div>;
}

function TypeChip({ ball, large }: { ball: Ball; large?: boolean }) {
  const variation = formatVariation(ball);
  const color = ball.spinDirection&&ball.spinDirection!=="none"?"text-spin":ball.swingDirection&&ball.swingDirection!=="none"?"text-cyan":"text-text-primary";
  return <span className={`font-extrabold leading-tight ${color} ${large?"text-sm":"text-xs"}`}>{variation}</span>;
}

function Stumps({ cx, cy, scale=1, flying }: { cx:number;cy:number;scale?:number;flying?:boolean }) {
  const w=14*scale,h=18*scale;
  return <g>{[-w/2,0,w/2].map((dx,i)=><line key={i} x1={cx+dx} y1={cy} x2={cx+dx} y2={cy-h} stroke="#E8D5B7" strokeWidth={1.5*scale} style={flying?{animation:`stumps-fly 1.4s ease-out infinite ${i*0.05}s`}:undefined}/>)}</g>;
}

function Person({ cx, cy, scale=1, arm, from }: { cx:number;cy:number;scale?:number;arm:"left"|"right";from:"over"|"round" }) {
  const headR=5*scale,bodyH=22*scale,armSide=arm==="right"?1:-1,armDir=from==="round"?-armSide:armSide;
  return <g><circle cx={cx} cy={cy-bodyH-headR} r={headR} fill="#1E293B" stroke="#0F172A" strokeWidth="1"/><line x1={cx} y1={cy-bodyH} x2={cx} y2={cy} stroke="#1E293B" strokeWidth={3*scale} strokeLinecap="round"/><line x1={cx} y1={cy-bodyH*0.7} x2={cx+8*scale*armDir} y2={cy-bodyH*0.5} stroke="#1E293B" strokeWidth={2.5*scale} strokeLinecap="round"/><line x1={cx} y1={cy-bodyH*0.7} x2={cx-8*scale*armDir} y2={cy-bodyH*0.4} stroke="#1E293B" strokeWidth={2.5*scale} strokeLinecap="round"/><line x1={cx} y1={cy} x2={cx-4*scale} y2={cy+12*scale} stroke="#1E293B" strokeWidth={2.5*scale} strokeLinecap="round"/><line x1={cx} y1={cy} x2={cx+4*scale} y2={cy+12*scale} stroke="#1E293B" strokeWidth={2.5*scale} strokeLinecap="round"/></g>;
}

function Bat({ cx, cy, shotAngle }: { cx:number;cy:number;shotAngle:number }) {
  const radians=((shotAngle-90)*Math.PI)/180,length=18;
  return <line x1={cx+5} y1={cy-8} x2={cx+Math.cos(radians)*length} y2={cy+Math.sin(radians)*length} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>;
}

function OutcomeBadge({ ball }: { ball: Ball }) {
  let bg="#1E293B",fg="#94A3B8",label=String(ball.runs);
  if(ball.isWicket){bg="#EF4444";fg="#0A0E1A";label="W";}
  else if(ball.isBoundary6){bg="#A855F7";fg="#FFFFFF";label="6";}
  else if(ball.isBoundary4){bg="#00E5FF";fg="#0A0E1A";label="4";}
  else if(ball.runs===0&&!ball.extras){label="•";}
  return <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xl shrink-0" style={{background:bg,color:fg,boxShadow:"0 4px 14px rgba(0,0,0,0.4)"}}>{label}</div>;
}

function formatVariation(ball: Ball): string {
  if(ball.ballVariation&&ball.ballVariation!=="stock")return capitalize(ball.ballVariation.replace("-"," "));
  if(ball.swingDirection==="in")return"Inswinger";
  if(ball.swingDirection==="out")return"Outswinger";
  if(ball.spinDirection==="off")return"Off-spin";
  if(ball.spinDirection==="leg")return"Leg-spin";
  return"Stock";
}


function capitalize(s:string){return s.charAt(0).toUpperCase()+s.slice(1);}
