"use client";

import type { Ball } from "@/lib/types";
import { SPIN } from "@/lib/tokens";

interface MiniBallGIFProps {
  ball: Ball;
}

/**
 * Small visual for each ball card (~90 px wide, ~110 px tall).
 *
 * Static rather than animated — communicates the SAME info as the main
 * GIF (pitch impact, swing/spin curve, shot direction, aerial/ground)
 * but in a compact at-a-glance form.
 *
 * Per Sarthak v0.4: this replaces the line/length/height text labels
 * that used to live on the ball card.
 */
export default function MiniBallGIF({ ball }: MiniBallGIFProps) {
  const W = 90;
  const H = 110;

  // Pitch trapezoid — small foreshortened
  const PITCH_TOP_W = 14;
  const PITCH_BOT_W = 30;
  const PITCH_TOP_Y = 12;
  const PITCH_BOT_Y = 78;
  const CX = W / 2;

  const pitchPath = `M ${CX - PITCH_TOP_W / 2} ${PITCH_TOP_Y} L ${CX + PITCH_TOP_W / 2} ${PITCH_TOP_Y} L ${CX + PITCH_BOT_W / 2} ${PITCH_BOT_Y} L ${CX - PITCH_BOT_W / 2} ${PITCH_BOT_Y} Z`;

  // Impact point
  const pitchY = ball.pitchY ?? 0.65;
  const impactY = PITCH_BOT_Y - pitchY * (PITCH_BOT_Y - PITCH_TOP_Y);
  const pitchXAtY = (y: number) => {
    const t = (y - PITCH_TOP_Y) / (PITCH_BOT_Y - PITCH_TOP_Y);
    const half = (PITCH_TOP_W + (PITCH_BOT_W - PITCH_TOP_W) * t) / 2;
    return half;
  };
  const halfAtImpact = pitchXAtY(impactY);
  const impactX = CX + (ball.pitchX ?? 0) * halfAtImpact * 0.85;

  // Release point — over or round the wicket (never from directly above stumps)
  // over-the-wicket: right-arm → right of stumps (+), left-arm → left (-)
  // round-the-wicket: opposite side
  const mBowlerSide = ball.bowlingFrom === "round"
    ? (ball.bowlingArm === "right" ? -1 : 1)
    : (ball.bowlingArm === "right" ? 1 : -1);
  // 6px offset in 90px SVG — proportional to BowlerView's 40px in 800px
  const releaseX = CX + mBowlerSide * 6;
  const releaseY = PITCH_TOP_Y - 6;
  const lineOffsetMap: Record<string, number> = {
    "wide-off": -16,
    "outside-off": -9,
    "off": -4,
    "middle": 0,
    "leg": 4,
    "outside-leg": 9,
    "wide-leg": 16,
  };
  const batterArrivalX = CX + (ball.bowlingLine ? lineOffsetMap[ball.bowlingLine] : (ball.pitchX ?? 0) * 9);
  const batterArrivalY = PITCH_BOT_Y - 4;

  // Curves (modest exaggeration — too much warps the tiny visual)
  const swingDelta = (ball.swingDirection === "in" ? -1 : ball.swingDirection === "out" ? 1 : 0) * 5;
  const prePitchControlX = (releaseX + impactX) / 2 + swingDelta;
  const prePitchControlY = (releaseY + impactY) / 2 - 2;
  const miniSpinFromVariation =
    (ball.ballVariation === "leg-cutter" || ball.ballVariation === "doosra" || ball.ballVariation === "carrom") ? 1 :
    (ball.ballVariation === "off-cutter" || ball.ballVariation === "googly") ? -1 : 0;
  const miniSpinBase = ball.spinDirection === "off" ? -1 : ball.spinDirection === "leg" ? 1 : miniSpinFromVariation;
  const spinDelta = miniSpinBase * 4;
  const postPitchControlX = (impactX + batterArrivalX) / 2 + spinDelta;
  const postPitchControlY = (impactY + batterArrivalY) / 2;

  // Shot for the lower half — same area as bat
  const shotAngle = ball.shotAngle ?? 0;
  const shotPower = ball.shotPower ?? 0.5;
  const shotLoft = ball.shotLoft ?? 0;
  const shotAreaCY = 92;
  const shotAreaRadius = 14;
  const angleRad = ((shotAngle) * Math.PI) / 180;
  const shotEndX = CX + Math.sin(angleRad) * shotAreaRadius * shotPower * 1.4;
  const shotEndY = shotAreaCY - Math.cos(angleRad) * shotAreaRadius * shotPower * 1.4;

  const isWicket = ball.isWicket;
  const isSix = ball.isBoundary6;
  const isFour = ball.isBoundary4;
  const isAerial = ball.shotIsAerial;
  const wasLeft = ball.shotType === "left" || (!ball.runs && !ball.isWicket && Math.abs(ball.pitchX ?? 0) > 0.6);

  const accent = isWicket ? "#EF4444" : isSix ? "#A855F7" : isFour ? "#00E5FF" : ball.runs > 0 ? "#10B981" : "#64748B";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block" style={{ width: "100%", height: "100%" }}>
      {/* Pitch */}
      <path d={pitchPath} fill="#3B2918" stroke="#5B3E22" strokeWidth="0.5" />

      {/* Pre-pitch trajectory */}
      <path
        d={`M ${releaseX} ${releaseY} Q ${prePitchControlX} ${prePitchControlY} ${impactX} ${impactY}`}
        stroke="#FF6B35"
        strokeWidth="1"
        strokeDasharray="1.5 2"
        fill="none"
        opacity="0.85"
      />
      {/* Post-pitch trajectory */}
      <path
        d={`M ${impactX} ${impactY} Q ${postPitchControlX} ${postPitchControlY} ${batterArrivalX} ${batterArrivalY}`}
        stroke={ball.spinDirection !== "none" ? SPIN : "#00E5FF"}
        strokeWidth="1.1"
        strokeDasharray="1.5 2"
        fill="none"
        opacity="0.9"
      />

      {/* Pitch impact dot */}
      <circle cx={impactX} cy={impactY} r="3" fill="#FF6B35" opacity="0.45" />
      <circle cx={impactX} cy={impactY} r="1.5" fill="#FFE9A0" />

      {/* Stumps */}
      <line x1={CX - 2} y1={PITCH_BOT_Y - 1} x2={CX - 2} y2={PITCH_BOT_Y - 7} stroke="#E8D5B7" strokeWidth="0.8" />
      <line x1={CX} y1={PITCH_BOT_Y - 1} x2={CX} y2={PITCH_BOT_Y - 7} stroke="#E8D5B7" strokeWidth="0.8" />
      <line x1={CX + 2} y1={PITCH_BOT_Y - 1} x2={CX + 2} y2={PITCH_BOT_Y - 7} stroke="#E8D5B7" strokeWidth="0.8" />

      {/* Shot direction line (in the small "field" area below) */}
      {!wasLeft && (
        <>
          {/* Divider between pitch and "field" area — represents the boundary visually */}
          <line x1={4} y1={82} x2={W - 4} y2={82} stroke={accent} strokeWidth="0.6" strokeDasharray="2 2" opacity="0.4" />
          {/* batter dot */}
          <circle cx={CX} cy={shotAreaCY - 2} r="2" fill="#94A3B8" />
          {/* shot trajectory */}
          <line
            x1={CX}
            y1={shotAreaCY - 2}
            x2={shotEndX}
            y2={shotEndY}
            stroke={accent}
            strokeWidth={isSix || isFour ? "1.3" : "0.9"}
            strokeDasharray={isAerial ? "0" : "1.5 2"}
            strokeLinecap="round"
          />
          {/* shot endpoint marker */}
          <circle cx={shotEndX} cy={shotEndY} r={isSix ? 2 : isFour ? 1.5 : 1.2} fill={accent} />
          {/* aerial indicator: a small arc above the line shows loft */}
          {isAerial && shotLoft > 0.2 && (
            <path
              d={`M ${CX} ${shotAreaCY - 2} Q ${(CX + shotEndX) / 2} ${Math.min(shotAreaCY, shotEndY) - 5 - shotLoft * 3} ${shotEndX} ${shotEndY}`}
              stroke={accent}
              strokeWidth="0.8"
              fill="none"
              opacity="0.55"
            />
          )}
        </>
      )}

      {/* "Left it" indicator if no shot */}
      {wasLeft && (
        <text x={CX} y={shotAreaCY + 4} textAnchor="middle" fill="#64748B" fontSize="6.5" fontWeight="700">LEFT</text>
      )}
    </svg>
  );
}
