"use client";

import { useEffect, useState } from "react";
import type { Ball, FielderPosition } from "@/lib/types";
import { outcomeKindOf, cardBackgroundFor } from "@/lib/outcomeColors";

interface BallGIFProps {
  ball: Ball;
  fielders?: FielderPosition[];
  loopMs?: number; // total loop = both clips together
}

/**
 * Main ball replay — two alternating clips, no view switcher.
 *
 *   Clip A (Bowler direction, 3/4 perspective):
 *       Speed, swing, spin, line, length — all communicated via the
 *       ball animation itself (line + length are NEVER shown as text).
 *       Speed + type displayed as text. Identical stick figures.
 *
 *   Clip B (Overhead field):
 *       Shows fielders as dots, ball trajectory from batter.
 *       Aerial vs ground is a visual distinction; if aerial,
 *       the first ground-contact point is marked.
 *
 * Aspect ratio: 16:10 (~1/4 of Pixel 10 Pro viewport height).
 */
export default function BallGIF({ ball, fielders, loopMs = 6000 }: BallGIFProps) {
  const [activeClip, setActiveClip] = useState<"bowler" | "overhead">("bowler");

  // Reset to bowler-view when ball changes (smooth: no key remount on outer)
  useEffect(() => setActiveClip("bowler"), [ball.id]);

  // Alternate clips every loopMs/2 (so 6 sec total = 3 sec per clip)
  useEffect(() => {
    const id = setInterval(() => {
      setActiveClip(c => (c === "bowler" ? "overhead" : "bowler"));
    }, loopMs / 2);
    return () => clearInterval(id);
  }, [loopMs]);

  const kind = outcomeKindOf(ball);
  const bg = cardBackgroundFor(kind);

  return (
    <div
      className="relative rounded-2xl overflow-hidden border"
      style={{
        aspectRatio: "16 / 10",
        ...bg,
        transition: "background-color 600ms ease-out, border-color 600ms ease-out",
      }}
    >
      {/* Outcome badge (top right) */}
      <div className="absolute top-2 right-2 z-10">
        <OutcomeBadge ball={ball} />
      </div>

      {/* Identity caption (top left) */}
      <div className="absolute top-2 left-2 z-10 text-[9px] font-bold uppercase tracking-widest text-white/85 leading-tight">
        <div className="text-white">{ball.bowlerName}</div>
        <div className="text-white/45">to</div>
        <div className="text-white">{ball.batterName}</div>
      </div>

      {/* Clip indicator dots — bottom-center, very subtle */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${activeClip === "bowler" ? "bg-white" : "bg-white/25"}`} />
        <span className={`w-1.5 h-1.5 rounded-full ${activeClip === "overhead" ? "bg-white" : "bg-white/25"}`} />
      </div>

      {/* Scene — keyed on activeClip+ball so animations restart, with fade-in to smooth transitions */}
      <div key={`${activeClip}-${ball.id}`} className="scene-fade-in absolute inset-0">
        {activeClip === "bowler" ? (
          <BowlerView ball={ball} loopMs={loopMs / 2} />
        ) : (
          <OverheadView ball={ball} fielders={fielders} loopMs={loopMs / 2} />
        )}
      </div>

      {/* Bottom info — only speed + type (no line/length/height per spec) */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/45 backdrop-blur-sm border-t border-white/10 flex items-center gap-4">
        <SpeedChip ball={ball} />
        <TypeChip ball={ball} />
      </div>
    </div>
  );
}

// ============================================================================
// Clip A — Bowler's direction (3/4 perspective looking down the pitch)
// ============================================================================

function BowlerView({ ball, loopMs }: { ball: Ball; loopMs: number }) {
  const W = 800;
  const H = 500;
  const PITCH_TOP_W = 80;
  const PITCH_BOT_W = 220;
  const PITCH_TOP_Y = 80;
  const PITCH_BOT_Y = 380;
  const CX = W / 2;

  const pitchXAtY = (y: number) => {
    const t = (y - PITCH_TOP_Y) / (PITCH_BOT_Y - PITCH_TOP_Y);
    const half = (PITCH_TOP_W + (PITCH_BOT_W - PITCH_TOP_W) * t) / 2;
    return { left: CX - half, right: CX + half };
  };

  const pitchPath = `M ${CX - PITCH_TOP_W / 2} ${PITCH_TOP_Y} L ${CX + PITCH_TOP_W / 2} ${PITCH_TOP_Y} L ${CX + PITCH_BOT_W / 2} ${PITCH_BOT_Y} L ${CX - PITCH_BOT_W / 2} ${PITCH_BOT_Y} Z`;

  // Length = how far down the pitch the ball lands (pitchY: 0=batter, 1=bowler)
  // Line = lateral position on the pitch
  const pitchY = ball.pitchY ?? 0.65;
  const impactY = PITCH_BOT_Y - pitchY * (PITCH_BOT_Y - PITCH_TOP_Y);
  const { right: rightImpact, left: leftImpact } = pitchXAtY(impactY);
  const halfImpact = (rightImpact - leftImpact) / 2;
  const impactX = CX + (ball.pitchX ?? 0) * halfImpact * 0.9;

  // Bowler release
  const bowlerSide = ball.bowlingFrom === "round"
    ? (ball.bowlingArm === "right" ? -1 : 1)
    : (ball.bowlingArm === "right" ? 1 : -1);
  const releaseX = CX + bowlerSide * 18;
  const releaseY = PITCH_TOP_Y - 28;

  // Batter arrival (line-driven)
  const lineOffsetMap: Record<string, number> = {
    "wide-off": -75,
    "outside-off": -38,
    "off": -16,
    "middle": 0,
    "leg": 16,
    "outside-leg": 38,
    "wide-leg": 75,
  };
  const batterArrivalX = CX + (ball.bowlingLine ? lineOffsetMap[ball.bowlingLine] : (ball.pitchX ?? 0) * 38);
  const batterArrivalY = PITCH_BOT_Y - 14;

  // Exaggerated swing + spin curves
  const swingDelta = (ball.swingDirection === "in" ? -1 : ball.swingDirection === "out" ? 1 : 0) * 22 * 1.8;
  const prePitchControl = {
    x: (releaseX + impactX) / 2 + swingDelta,
    y: (releaseY + impactY) / 2 - 6,
  };
  const spinDelta = (ball.spinDirection === "off" ? -1 : ball.spinDirection === "leg" ? 1 : 0) * 18 * 2.2;
  const postPitchControl = {
    x: (impactX + batterArrivalX) / 2 + spinDelta,
    y: (impactY + batterArrivalY) / 2,
  };

  // Pace affects animation speed visually
  const speedFactor = ball.pace === "fast" ? 0.85 : ball.pace === "slow" ? 1.2 : 1.0;
  const prePitchMs = loopMs * 0.45 * speedFactor;
  const postPitchMs = loopMs * 0.30 * speedFactor;

  const depthAt = (y: number) => 0.55 + 0.45 * ((y - PITCH_TOP_Y) / (PITCH_BOT_Y - PITCH_TOP_Y));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pitchB" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B2918" />
          <stop offset="100%" stopColor="#6B4828" />
        </linearGradient>
        <radialGradient id="ballB" cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE9A0" />
          <stop offset="100%" stopColor="#FF6B35" />
        </radialGradient>
        <filter id="glowB" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <path id="pre-B" d={`M ${releaseX} ${releaseY} Q ${prePitchControl.x} ${prePitchControl.y} ${impactX} ${impactY}`} />
        <path id="post-B" d={`M ${impactX} ${impactY} Q ${postPitchControl.x} ${postPitchControl.y} ${batterArrivalX} ${batterArrivalY}`} />
      </defs>

      <path d={pitchPath} fill="url(#pitchB)" stroke="#5B3E22" strokeWidth="1" />

      {/* creases */}
      <line x1={CX - PITCH_TOP_W / 2 - 6} y1={PITCH_TOP_Y + 12} x2={CX + PITCH_TOP_W / 2 + 6} y2={PITCH_TOP_Y + 12} stroke="#FFFFFF" strokeOpacity="0.35" />
      <line x1={CX - PITCH_BOT_W / 2 - 8} y1={PITCH_BOT_Y - 14} x2={CX + PITCH_BOT_W / 2 + 8} y2={PITCH_BOT_Y - 14} stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" />

      {/* stumps */}
      <Stumps cx={CX} cy={PITCH_TOP_Y + 8} scale={0.6} />
      <Stumps cx={CX} cy={PITCH_BOT_Y - 6} scale={1.1} flying={ball.isWicket && ball.dismissalType === "bowled"} />

      {/* identical mini figurines with NAME LABELS — Sarthak v0.8 #6 */}
      <Person cx={releaseX} cy={releaseY + 20} scale={0.55} arm={ball.bowlingArm ?? "right"} from={ball.bowlingFrom ?? "over"} />
      <text
        x={releaseX + 22}
        y={releaseY + 12}
        fill="#F8FAFC"
        fontSize="13"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
      >
        {ball.bowlerName}
      </text>
      <text
        x={releaseX + 22}
        y={releaseY + 26}
        fill="#94A3B8"
        fontSize="10"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
      >
        Bowler
      </text>

      <Person cx={CX - 26} cy={PITCH_BOT_Y + 30} scale={1.0} arm="right" from="over" />
      <Bat cx={CX - 26} cy={PITCH_BOT_Y + 30} shotAngle={ball.shotAngle ?? 0} />
      <text
        x={CX - 50}
        y={PITCH_BOT_Y + 56}
        textAnchor="end"
        fill="#F8FAFC"
        fontSize="14"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
      >
        {ball.batterName}
      </text>
      <text
        x={CX - 50}
        y={PITCH_BOT_Y + 72}
        textAnchor="end"
        fill="#94A3B8"
        fontSize="10"
        fontWeight="600"
        fontFamily="Inter, sans-serif"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
      >
        Batter · {ball.shotType === "left" ? "left" : "facing"}
      </text>

      {/* faded trajectory */}
      <use href="#pre-B" stroke="#FF6B35" strokeWidth="1.4" fill="none" strokeDasharray="2 4" opacity="0.5" />
      <use href="#post-B" stroke={ball.spinDirection !== "none" ? "#A855F7" : "#00E5FF"} strokeWidth="1.4" fill="none" strokeDasharray="2 4" opacity="0.55" />

      {/* impact */}
      <circle cx={impactX} cy={impactY} r="9" fill="#FF6B35" opacity="0.4" />
      <circle cx={impactX} cy={impactY} r="4" fill="#FFE9A0" />

      {/* animated ball + shadow */}
      <circle r="4" fill="#000" opacity="0.5">
        <animateMotion dur={`${prePitchMs}ms`} repeatCount="indefinite" path={`M ${releaseX} ${releaseY + 8} L ${impactX} ${impactY}`} />
      </circle>
      <circle r="6" fill="url(#ballB)" filter="url(#glowB)">
        <animateMotion dur={`${prePitchMs}ms`} repeatCount="indefinite" keyTimes="0;1" keySplines="0.4 0 0.7 1">
          <mpath href="#pre-B" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.5;0.95;1" dur={`${prePitchMs}ms`} repeatCount="indefinite" />
        <animate attributeName="r" values={`${5 * depthAt(releaseY)};${5 * depthAt(impactY)}`} dur={`${prePitchMs}ms`} repeatCount="indefinite" />
      </circle>

      <circle r="4" fill="#000" opacity="0.5">
        <animateMotion dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite" path={`M ${impactX} ${impactY} L ${batterArrivalX} ${batterArrivalY}`} />
      </circle>
      <circle r="6" fill="url(#ballB)" filter="url(#glowB)">
        <animateMotion dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite">
          <mpath href="#post-B" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.05;0.5;0.95;1" dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite" />
        <animate attributeName="r" values={`${5 * depthAt(impactY)};${6 * depthAt(batterArrivalY)}`} dur={`${postPitchMs}ms`} begin={`${prePitchMs}ms`} repeatCount="indefinite" />
      </circle>

      {ball.isWicket && (
        <rect x="0" y="0" width={W} height={H} fill="#EF4444" style={{ animation: `wicket-flash ${loopMs}ms ease-out infinite` }} />
      )}
    </svg>
  );
}

// ============================================================================
// Clip B — Overhead field (dots as fielders, aerial-vs-ground visual)
// ============================================================================

function OverheadView({ ball, fielders, loopMs }: { ball: Ball; fielders?: FielderPosition[]; loopMs: number }) {
  const W = 800;
  const H = 500;
  const CX = W / 2;
  const CY = H / 2;
  const FIELD_RX = W / 2 - 12;
  const FIELD_RY = H / 2 - 12;
  const PITCH_W = 24;
  const PITCH_H = 78;
  const BATTER_X = CX;
  const BATTER_Y = CY + PITCH_H / 2;

  const angleRad = ((ball.shotAngle ?? 0) * Math.PI) / 180;
  const reachPx = (ball.shotPower ?? 0.5) * Math.min(FIELD_RX, FIELD_RY) * 0.95;
  const shotEndX = BATTER_X + Math.sin(angleRad) * reachPx;
  const shotEndY = BATTER_Y - Math.cos(angleRad) * reachPx;

  const isAerial = ball.shotIsAerial;
  const isSix = ball.isBoundary6;
  const isFour = ball.isBoundary4;
  const isDot = !ball.runs && !ball.isWicket && !ball.extras;
  const wasLeft = ball.shotType === "left" || (isDot && Math.abs(ball.pitchX ?? 0) > 0.6);

  // First-contact point for aerial — somewhere between batter and shotEnd
  const firstContact = isAerial
    ? {
        x: BATTER_X + (shotEndX - BATTER_X) * 0.78,
        y: BATTER_Y + (shotEndY - BATTER_Y) * 0.78,
      }
    : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="fieldO" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1B243A" />
          <stop offset="100%" stopColor="#0A0E1A" />
        </radialGradient>
        <radialGradient id="ballO" cx="35%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE9A0" />
          <stop offset="100%" stopColor="#FF6B35" />
        </radialGradient>
        <filter id="glowO" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <path id="shotPath" d={isAerial
          ? `M ${BATTER_X} ${BATTER_Y} Q ${(BATTER_X + shotEndX) / 2} ${Math.min(BATTER_Y, shotEndY) - 80 * (ball.shotLoft ?? 0.5)} ${shotEndX} ${shotEndY}`
          : `M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`} />
      </defs>

      <ellipse cx={CX} cy={CY} rx={FIELD_RX} ry={FIELD_RY} fill="url(#fieldO)" />
      <ellipse cx={CX} cy={CY} rx={FIELD_RX * 0.55} ry={FIELD_RY * 0.55} fill="none" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="4 6" />
      <ellipse
        cx={CX} cy={CY} rx={FIELD_RX} ry={FIELD_RY}
        fill="none"
        stroke={isSix ? "#A855F7" : isFour ? "#00E5FF" : "#1E293B"}
        strokeWidth={isSix || isFour ? "3" : "1.2"}
        style={isSix || isFour ? { animation: `pulse-soft 1.4s ease-out infinite` } : undefined}
      />

      <rect x={CX - PITCH_W / 2} y={CY - PITCH_H / 2} width={PITCH_W} height={PITCH_H} fill="#3B2918" rx="1" />
      <Stumps cx={CX} cy={CY - PITCH_H / 2 + 4} />
      <Stumps cx={CX} cy={CY + PITCH_H / 2 - 4} flying={ball.isWicket && ball.dismissalType === "bowled"} />

      {/* batter as person, fielders as dots */}
      <Person cx={BATTER_X - 8} cy={BATTER_Y - 2} scale={0.7} arm="right" from="over" />

      {fielders?.map((f, i) => {
        const a = (f.angle * Math.PI) / 180;
        const d = f.distance * Math.min(FIELD_RX, FIELD_RY) * 0.95;
        const fx = BATTER_X + Math.sin(a) * d;
        const fy = BATTER_Y - Math.cos(a) * d;
        return (
          <g key={i}>
            <circle cx={fx} cy={fy} r="5" fill="#94A3B8" stroke="#0A0E1A" strokeWidth="1.5" />
          </g>
        );
      })}

      {/* shot trajectory (visible) */}
      {!wasLeft && (
        <path
          d={isAerial
            ? `M ${BATTER_X} ${BATTER_Y} Q ${(BATTER_X + shotEndX) / 2} ${Math.min(BATTER_Y, shotEndY) - 80 * (ball.shotLoft ?? 0.5)} ${shotEndX} ${shotEndY}`
            : `M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`}
          stroke={isSix ? "#A855F7" : isFour ? "#00E5FF" : "#94A3B8"}
          strokeWidth={isSix || isFour ? "2.2" : "1.4"}
          strokeDasharray={isAerial ? "0" : "4 4"}
          fill="none"
          opacity="0.75"
        />
      )}

      {/* first ground-contact dot for aerial shots */}
      {firstContact && (
        <g>
          <circle cx={firstContact.x} cy={firstContact.y} r="6" fill="none" stroke="#FFE9A0" strokeWidth="1.5" opacity="0.85">
            <animate attributeName="r" values="3;9;3" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx={firstContact.x} cy={firstContact.y} r="2.5" fill="#FFE9A0" />
        </g>
      )}

      {/* animated ball */}
      {!wasLeft && (
        <>
          {isAerial && (
            <circle r="4" fill="#000" opacity="0.4">
              <animateMotion dur={`${loopMs * 0.9}ms`} repeatCount="indefinite" path={`M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`} />
            </circle>
          )}
          <circle r="6" fill="url(#ballO)" filter="url(#glowO)">
            <animateMotion dur={`${loopMs * 0.9}ms`} repeatCount="indefinite">
              <mpath href="#shotPath" />
            </animateMotion>
            <animate
              attributeName="r"
              values={`5;${5 + (ball.shotLoft ?? 0) * 6};5`}
              dur={`${loopMs * 0.9}ms`}
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}

      {/* Boundary flourish */}
      {isSix && <circle cx={shotEndX} cy={shotEndY} r="0" fill="none" stroke="#A855F7" strokeWidth="3" style={{ animation: `boundary-pulse ${loopMs}ms ease-out infinite` }} />}
      {isFour && !isSix && <circle cx={shotEndX} cy={shotEndY} r="0" fill="none" stroke="#00E5FF" strokeWidth="2" style={{ animation: `boundary-pulse ${loopMs}ms ease-out infinite` }} />}
    </svg>
  );
}

// ============================================================================
// Visual subcomponents + outcome helpers
// ============================================================================

function SpeedChip({ ball }: { ball: Ball }) {
  const speed = ball.ballSpeedKmh ?? 0;
  const color = speed >= 140 ? "text-cyan" : speed >= 130 ? "text-text-primary" : speed >= 110 ? "text-orange" : "text-six";
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-base font-extrabold num ${color}`}>{speed}</span>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-text-dim">kmh</span>
    </div>
  );
}

function TypeChip({ ball }: { ball: Ball }) {
  const variation = formatVariation(ball);
  const color =
    ball.spinDirection && ball.spinDirection !== "none" ? "text-six"
    : ball.swingDirection && ball.swingDirection !== "none" ? "text-cyan"
    : "text-text-primary";
  return (
    <span className={`text-xs font-bold ${color}`}>{variation}</span>
  );
}

function Stumps({ cx, cy, scale = 1, flying }: { cx: number; cy: number; scale?: number; flying?: boolean }) {
  const w = 14 * scale;
  const h = 18 * scale;
  return (
    <g>
      {[-w / 2, 0, w / 2].map((dx, i) => (
        <line key={i} x1={cx + dx} y1={cy} x2={cx + dx} y2={cy - h} stroke="#E8D5B7" strokeWidth={1.5 * scale}
          style={flying ? { animation: `stumps-fly 1.4s ease-out infinite ${i * 0.05}s` } : undefined} />
      ))}
    </g>
  );
}

function Person({ cx, cy, scale = 1, arm, from }: { cx: number; cy: number; scale?: number; arm: "left" | "right"; from: "over" | "round" }) {
  const headR = 5 * scale;
  const bodyH = 22 * scale;
  const armSide = arm === "right" ? 1 : -1;
  const armDir = from === "round" ? -armSide : armSide;
  return (
    <g>
      <circle cx={cx} cy={cy - bodyH - headR} r={headR} fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
      <line x1={cx} y1={cy - bodyH} x2={cx} y2={cy} stroke="#1E293B" strokeWidth={3 * scale} strokeLinecap="round" />
      <line x1={cx} y1={cy - bodyH * 0.7} x2={cx + 8 * scale * armDir} y2={cy - bodyH * 0.5} stroke="#1E293B" strokeWidth={2.5 * scale} strokeLinecap="round" />
      <line x1={cx} y1={cy - bodyH * 0.7} x2={cx - 8 * scale * armDir} y2={cy - bodyH * 0.4} stroke="#1E293B" strokeWidth={2.5 * scale} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx - 4 * scale} y2={cy + 12 * scale} stroke="#1E293B" strokeWidth={2.5 * scale} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + 4 * scale} y2={cy + 12 * scale} stroke="#1E293B" strokeWidth={2.5 * scale} strokeLinecap="round" />
    </g>
  );
}

function Bat({ cx, cy, shotAngle }: { cx: number; cy: number; shotAngle: number }) {
  const radians = ((shotAngle - 90) * Math.PI) / 180;
  const length = 18;
  const tipX = cx + Math.cos(radians) * length;
  const tipY = cy + Math.sin(radians) * length;
  return <line x1={cx + 5} y1={cy - 8} x2={tipX} y2={tipY} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />;
}

function OutcomeBadge({ ball }: { ball: Ball }) {
  let bg = "#1E293B", fg = "#94A3B8", label = String(ball.runs);
  if (ball.isWicket) { bg = "#EF4444"; fg = "#0A0E1A"; label = "W"; }
  else if (ball.isBoundary6) { bg = "#A855F7"; fg = "#FFFFFF"; label = "6"; }
  else if (ball.isBoundary4) { bg = "#00E5FF"; fg = "#0A0E1A"; label = "4"; }
  else if (ball.runs === 0 && !ball.extras) { label = "•"; }
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-lg" style={{ background: bg, color: fg, boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>{label}</div>
  );
}

function formatVariation(ball: Ball): string {
  if (ball.ballVariation && ball.ballVariation !== "stock") return capitalize(ball.ballVariation.replace("-", " "));
  if (ball.swingDirection === "in") return "Inswinger";
  if (ball.swingDirection === "out") return "Outswinger";
  if (ball.spinDirection === "off") return "Off-spin";
  if (ball.spinDirection === "leg") return "Leg-spin";
  if (ball.pace === "fast") return "Fast";
  if (ball.pace === "slow") return "Slow";
  return "Stock";
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
