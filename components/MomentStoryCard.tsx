"use client";

import type { Ball, Match, WinProbPoint } from "@/lib/types";

interface MomentStoryCardProps {
  ball: Ball;
  match: Match;
  scoreText?: string;
  situationText?: string;
  winProbBefore: number;
  winProbAfter: number;
  winProbPoints?: WinProbPoint[];
  ballIndex?: number;
}

export default function MomentStoryCard({
  ball, match, scoreText, situationText,
  winProbBefore, winProbAfter, winProbPoints, ballIndex,
}: MomentStoryCardProps) {
  const comp = match.competition;
  const isChase = !!(situationText?.startsWith("Need"));
  const delta = Math.round(winProbAfter - winProbBefore);
  const aColor = match.teamA.primaryColor;
  const bColor = match.teamB.primaryColor;

  const outcomeColor = ball.isWicket ? "#EF4444"
    : ball.isBoundary6 ? "#A855F7"
    : ball.isBoundary4 ? "#06B6D4"
    : "#10B981";

  const outcomeLabel = ball.isWicket ? "WICKET"
    : ball.isBoundary6 ? "SIX"
    : ball.isBoundary4 ? "FOUR"
    : `${ball.runs} RUN${ball.runs !== 1 ? "S" : ""}`;

  return (
    <div style={{ width: 375, background: "#070B14", fontFamily: "Inter, sans-serif", borderRadius: 0, overflow: "hidden" }}>

      {/* ── PANEL 1: THE MOMENT ── */}
      <div style={{ background: "linear-gradient(180deg, #0F1B2D 0%, #0A1120 100%)", padding: "18px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Competition + match header */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: comp?.logoColor ?? "#06B6D4", flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
            {comp?.name ?? "Cricket"} · {match.teamA.shortName} vs {match.teamB.shortName}
          </span>
        </div>

        {/* Score + situation */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#F8FAFC", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {scoreText ?? ""}
          </div>
          {situationText && (
            <div style={{
              fontSize: 10, fontWeight: 800,
              color: isChase ? "#06B6D4" : "rgba(255,255,255,0.5)",
              background: isChase ? "rgba(6,182,212,0.14)" : "rgba(255,255,255,0.07)",
              border: `1.5px solid ${isChase ? "rgba(6,182,212,0.35)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 99, padding: "5px 11px", whiteSpace: "nowrap",
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              {situationText}
            </div>
          )}
        </div>

        {/* Innings progress bar */}
        <StoryProgressBar ball={ball} match={match} aColor={aColor} bColor={bColor} />

        {/* Bowler → Batter */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>{ball.bowlerName}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>→</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>{ball.batterName}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            Over {ball.over}.{ball.ballInOver + 1}
          </span>
        </div>
      </div>

      {/* ── PANEL 2: THE BALL ── */}
      <div style={{ background: "#070B14", position: "relative" }}>
        <StoryCinematicPitch ball={ball} />

        {/* Speed + variation overlaid bottom-left */}
        <div style={{
          position: "absolute", bottom: 12, left: 14,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {ball.ballSpeedKmh && (
            <div style={{
              background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
              padding: "4px 9px", display: "flex", alignItems: "baseline", gap: 3,
            }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#F8FAFC" }}>{ball.ballSpeedKmh}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>km/h</span>
            </div>
          )}
          <div style={{
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8,
            padding: "4px 9px",
            fontSize: 11, fontWeight: 700, color: getVariationColor(ball),
          }}>
            {formatVariation(ball)}
          </div>
        </div>

        {/* Over/round label — top-right */}
        <div style={{
          position: "absolute", top: 10, right: 12,
          fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.35)",
          background: "rgba(0,0,0,0.55)", borderRadius: 6, padding: "3px 7px",
          textTransform: "uppercase", letterSpacing: "0.07em",
        }}>
          {ball.bowlingFrom === "round" ? "Round" : "Over"} the wicket
        </div>
      </div>

      {/* ── PANEL 3: THE IMPACT ── */}
      <div style={{ background: "#060A12", padding: "16px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Outcome row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${outcomeColor}1E`, border: `2.5px solid ${outcomeColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: outcomeColor, flexShrink: 0,
          }}>
            {ball.isWicket ? "W" : ball.isBoundary6 ? "6" : ball.isBoundary4 ? "4" : ball.runs}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: outcomeColor, letterSpacing: "0.04em" }}>
              {outcomeLabel}
              {ball.isWicket && ball.dismissalType && (
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 700,
                  background: `${outcomeColor}1A`, border: `1px solid ${outcomeColor}50`,
                  borderRadius: 6, padding: "2px 8px", verticalAlign: "middle",
                  letterSpacing: "0.03em",
                }}>
                  {formatDismissal(ball.dismissalType)}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
              {ball.bowlerName} to {ball.batterName}
            </div>
          </div>
          {/* Win prob delta badge */}
          {Math.abs(delta) >= 2 && (
            <div style={{
              fontSize: 13, fontWeight: 800,
              color: delta > 0 ? aColor : bColor,
              background: (delta > 0 ? aColor : bColor) + "18",
              border: `1.5px solid ${(delta > 0 ? aColor : bColor)}40`,
              borderRadius: 10, padding: "5px 10px", whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              {delta > 0 ? `+${delta}%` : `${delta}%`}
            </div>
          )}
        </div>

        {/* Win prob sparkline */}
        {winProbPoints && winProbPoints.length > 4 && (
          <StorySparkline
            points={winProbPoints}
            ballIndex={ballIndex ?? winProbPoints.length - 1}
            winProbAfter={winProbAfter}
            aColor={aColor}
            bColor={bColor}
            teamAName={match.teamA.shortName}
            teamBName={match.teamB.shortName}
          />
        )}

        {/* Win prob numbers */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: aColor }}>{match.teamA.shortName} {Math.round(winProbAfter)}%</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>win probability</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: bColor }}>{match.teamB.shortName} {Math.round(100 - winProbAfter)}%</span>
        </div>

        {/* Watermark */}
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#06B6D4", letterSpacing: "0.06em" }}>BAWLER</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.03em" }}>Every ball, visualized</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar — shows how far through the innings this ball was
// ─────────────────────────────────────────────────────────────────────────────
function StoryProgressBar({ ball, match, aColor, bColor }: { ball: Ball; match: Match; aColor: string; bColor: string }) {
  const totalBalls = match.format === "T20" ? 120 : match.format === "ODI" ? 300 : 450;
  const ballsDone = ball.over * 6 + ball.ballInOver + 1;
  const pct = Math.min(100, Math.round((ballsDone / totalBalls) * 100));

  return (
    <div>
      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: aColor, borderRadius: 99, opacity: 0.8 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Ball {ballsDone} of {totalBalls}
        </span>
        <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {pct}% complete
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cinematic pitch — hero of Panel 2, full-width (375×220)
// ─────────────────────────────────────────────────────────────────────────────
function StoryCinematicPitch({ ball }: { ball: Ball }) {
  const W = 375, H = 220, CX = W / 2;
  const PITCH_TOP_W = 58, PITCH_BOT_W = 180;
  const PITCH_TOP_Y = 18, PITCH_BOT_Y = 192;

  const wRatio = PITCH_BOT_W / PITCH_TOP_W;
  const pitchPath = `M ${CX - PITCH_TOP_W/2} ${PITCH_TOP_Y} L ${CX + PITCH_TOP_W/2} ${PITCH_TOP_Y} L ${CX + PITCH_BOT_W/2} ${PITCH_BOT_Y} L ${CX - PITCH_BOT_W/2} ${PITCH_BOT_Y} Z`;

  const pitchHalfAtY = (y: number) => {
    const t = (y - PITCH_TOP_Y) / (PITCH_BOT_Y - PITCH_TOP_Y);
    return (PITCH_TOP_W + (PITCH_BOT_W - PITCH_TOP_W) * t) / 2;
  };

  // Impact point
  const pitchY = ball.pitchY ?? 0.65;
  const impactY = PITCH_BOT_Y - (wRatio * (PITCH_BOT_Y - PITCH_TOP_Y) * pitchY) / (1 + (wRatio - 1) * pitchY);
  const impactX = CX + (ball.pitchX ?? 0) * pitchHalfAtY(impactY) * 0.9;

  // Bowler release
  const bowlerSide = ball.bowlingFrom === "round"
    ? (ball.bowlingArm === "right" ? -1 : 1)
    : (ball.bowlingArm === "right" ? 1 : -1);
  const releaseX = CX + bowlerSide * 42;
  const releaseY = PITCH_TOP_Y - 28;
  const runFromX = CX + bowlerSide * 70, runFromY = PITCH_TOP_Y - 72;

  // Batsman arrival
  const lineOffsets: Record<string, number> = { "wide-off": -70, "outside-off": -36, "off": -15, "middle": 0, "leg": 15, "outside-leg": 36, "wide-leg": 70 };
  const batterArrX = CX + (ball.bowlingLine ? (lineOffsets[ball.bowlingLine] ?? 0) : (ball.pitchX ?? 0) * 36);
  const batterArrY = PITCH_BOT_Y - 12;

  // Swing arc
  const swingD = (ball.swingDirection === "in" ? -1 : ball.swingDirection === "out" ? 1 : 0) * 32;
  const preCtrl = { x: (releaseX + impactX) / 2 + swingD, y: (releaseY + impactY) / 2 - 8 };

  // Spin/cut post-pitch
  const spinFromVariation =
    (ball.ballVariation === "leg-cutter" || ball.ballVariation === "doosra" || ball.ballVariation === "carrom") ? 1 :
    (ball.ballVariation === "off-cutter" || ball.ballVariation === "googly") ? -1 : 0;
  const spinBase = ball.spinDirection === "off" ? -1 : ball.spinDirection === "leg" ? 1 : spinFromVariation;
  const spinD = spinBase * 28;
  const bounceH = 12 + pitchY * 55;
  const postCtrl = { x: (impactX + batterArrX) / 2 + spinD, y: impactY - bounceH };

  // Shot direction from batsman
  const shotAngle = ball.shotAngle ?? 0;
  const shotPower = ball.shotPower ?? 0.5;
  const shotAngleRad = (shotAngle * Math.PI) / 180;
  const shotLen = shotPower * 55;
  const shotEndX = CX + Math.sin(shotAngleRad) * shotLen;
  const shotEndY = PITCH_BOT_Y + 10 + Math.max(0, -Math.cos(shotAngleRad)) * shotLen * 0.6;

  const postColor = spinBase !== 0 ? "#A855F7" : "#00E5FF";
  const isDot = !ball.runs && !ball.isWicket && !ball.extras;
  const noShot = isDot || ball.shotType === "left" || Math.abs(ball.pitchX ?? 0) > 0.8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
      <defs>
        <radialGradient id="sc-field" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#0F1825" />
          <stop offset="100%" stopColor="#060A12" />
        </radialGradient>
        <linearGradient id="sc-pitch" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2A1A08" />
          <stop offset="100%" stopColor="#5A3614" />
        </linearGradient>
        <linearGradient id="sc-pre-trail" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFE9A0" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="sc-impact" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#FF6B35" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </radialGradient>
        <filter id="sc-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="sc-glow-sm" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Field */}
      <rect width={W} height={H} fill="url(#sc-field)" />
      {/* Subtle pitch edge glow */}
      <ellipse cx={CX} cy={PITCH_BOT_Y - 30} rx={120} ry={60} fill="#1A0E04" opacity="0.4" />

      {/* Pitch */}
      <path d={pitchPath} fill="url(#sc-pitch)" stroke="#3E2209" strokeWidth="1" />

      {/* Crease lines */}
      <line x1={CX - PITCH_TOP_W/2 - 5} y1={PITCH_TOP_Y + 14} x2={CX + PITCH_TOP_W/2 + 5} y2={PITCH_TOP_Y + 14} stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
      <line x1={CX - PITCH_BOT_W/2 - 6} y1={PITCH_BOT_Y - 18} x2={CX + PITCH_BOT_W/2 + 6} y2={PITCH_BOT_Y - 18} stroke="rgba(255,255,255,0.32)" strokeWidth="1" />

      {/* Stumps — bowling end (small) */}
      {[-5, 0, 5].map((dx, i) => (
        <line key={i} x1={CX + dx} y1={PITCH_TOP_Y + 10} x2={CX + dx} y2={PITCH_TOP_Y - 5} stroke="#D4B896" strokeWidth="1" />
      ))}
      {/* Stumps — batting end (large) */}
      {[-8, 0, 8].map((dx, i) => (
        <line key={i} x1={CX + dx} y1={PITCH_BOT_Y - 14} x2={CX + dx} y2={PITCH_BOT_Y - 30} stroke="#E8D5B7" strokeWidth="1.8" />
      ))}

      {/* Bowler run-up */}
      <line x1={runFromX} y1={runFromY} x2={releaseX} y2={releaseY + 8} stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 5" />
      {/* Return crease */}
      <line x1={releaseX} y1={PITCH_TOP_Y + 16} x2={releaseX} y2={PITCH_TOP_Y - 6} stroke="rgba(255,255,255,0.18)" strokeWidth="0.7" strokeDasharray="2 3" />

      {/* Pre-pitch trajectory — glow halo */}
      <path
        d={`M ${releaseX} ${releaseY} Q ${preCtrl.x} ${preCtrl.y} ${impactX} ${impactY}`}
        stroke="#FF6B35" strokeWidth="6" fill="none" opacity="0.18"
        filter="url(#sc-glow)"
      />
      {/* Pre-pitch trajectory — bright line */}
      <path
        d={`M ${releaseX} ${releaseY} Q ${preCtrl.x} ${preCtrl.y} ${impactX} ${impactY}`}
        stroke="url(#sc-pre-trail)" strokeWidth="1.8" fill="none"
        strokeDasharray="5 4" filter="url(#sc-glow-sm)"
      />

      {/* Impact glow rings */}
      <circle cx={impactX} cy={impactY} r="18" fill="url(#sc-impact)" />
      <circle cx={impactX} cy={impactY} r="8" fill="#FF6B35" opacity="0.35" filter="url(#sc-glow)" />
      <circle cx={impactX} cy={impactY} r="3.5" fill="#FFE9A0" filter="url(#sc-glow-sm)" />

      {/* Post-pitch trajectory — glow halo */}
      <path
        d={`M ${impactX} ${impactY} Q ${postCtrl.x} ${postCtrl.y} ${batterArrX} ${batterArrY}`}
        stroke={postColor} strokeWidth="5" fill="none" opacity="0.2"
        filter="url(#sc-glow)"
      />
      {/* Post-pitch trajectory — bright line */}
      <path
        d={`M ${impactX} ${impactY} Q ${postCtrl.x} ${postCtrl.y} ${batterArrX} ${batterArrY}`}
        stroke={postColor} strokeWidth="1.8" fill="none"
        strokeDasharray="5 4" filter="url(#sc-glow-sm)"
      />

      {/* Batsman dot */}
      <circle cx={CX} cy={PITCH_BOT_Y - 5} r="4" fill="#94A3B8" opacity="0.8" />

      {/* Shot direction */}
      {!noShot && (
        <line
          x1={CX} y1={PITCH_BOT_Y - 5}
          x2={shotEndX} y2={shotEndY}
          stroke={ball.isBoundary6 ? "#A855F7" : ball.isBoundary4 ? "#06B6D4" : "#94A3B8"}
          strokeWidth={ball.isBoundary6 || ball.isBoundary4 ? 2.2 : 1.4}
          strokeDasharray={ball.shotIsAerial ? "0" : "4 4"}
          opacity="0.85"
          filter={ball.isBoundary6 || ball.isBoundary4 ? "url(#sc-glow-sm)" : undefined}
        />
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Win-prob sparkline — full innings curve with this ball highlighted
// ─────────────────────────────────────────────────────────────────────────────
function StorySparkline({ points, ballIndex, winProbAfter, aColor, bColor, teamAName, teamBName }: {
  points: WinProbPoint[]; ballIndex: number; winProbAfter: number;
  aColor: string; bColor: string; teamAName: string; teamBName: string;
}) {
  const W = 335, H = 48;
  if (points.length < 2) return null;

  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(p => H - (p.winProbTeamA / 100) * H);

  // Build line path
  let linePath = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < points.length; i++) linePath += ` L ${xs[i]} ${ys[i]}`;

  // Build area A (below line)
  const areaA = `${linePath} L ${W} ${H} L 0 ${H} Z`;
  // Build area B (above line)
  const areaB = `${linePath} L ${W} 0 L 0 0 Z`;

  // Current ball highlight
  const bIdx = Math.min(ballIndex, points.length - 1);
  const highlightX = xs[bIdx];
  const highlightY = ys[bIdx];

  return (
    <div style={{ marginBottom: 6 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <clipPath id="sp-clip"><rect width={W} height={H} /></clipPath>
        </defs>
        <g clipPath="url(#sp-clip)">
          <path d={areaA} fill={aColor} opacity="0.18" />
          <path d={areaB} fill={bColor} opacity="0.18" />
          <path d={linePath} stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" />
          <line x1={highlightX} y1={0} x2={highlightX} y2={H} stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={highlightX} cy={highlightY} r="4" fill="#F8FAFC" />
          <circle cx={highlightX} cy={highlightY} r="8" fill="rgba(255,255,255,0.2)" />
        </g>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
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

function getVariationColor(ball: Ball): string {
  if (ball.spinDirection && ball.spinDirection !== "none") return "#A855F7";
  if (ball.swingDirection && ball.swingDirection !== "none") return "#06B6D4";
  return "rgba(255,255,255,0.7)";
}

function formatDismissal(type: string): string {
  const m: Record<string, string> = {
    "bowled": "Bowled", "caught": "Caught", "lbw": "LBW",
    "run-out": "Run Out", "stumped": "Stumped",
    "hit-wicket": "Hit Wkt", "retired": "Retired",
  };
  return m[type] ?? type;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
