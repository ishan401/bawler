"use client";

import { useEffect, useRef, useState } from "react";
import type { Ball, FielderPosition, Match } from "@/lib/types";
import { outcomeKindOf, cardBackgroundFor } from "@/lib/outcomeColors";

interface BallGIFProps {
  ball: Ball;
  match: Match;
  fielders?: FielderPosition[];
  loopMs?: number;
  situationText?: string;  // "Need 23 off 18" | "Over 18.4"
  scoreText?: string;      // "KKR 156/4 (18.4)"
  winProbBefore?: number;  // 0-100, batting team before ball
  winProbAfter?: number;   // 0-100, batting team after ball
}

export default function BallGIF({
  ball, match, fielders, loopMs = 6000,
  situationText, scoreText,
  winProbBefore = 50, winProbAfter = 50,
}: BallGIFProps) {
  const [activeClip, setActiveClip] = useState<"bowler" | "overhead">("bowler");
  const [shareLoading, setShareLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  async function handleShare() {
    if (!cardRef.current || shareLoading) return;
    setShareLoading(true);
    try {
      const { toPng } = await import("html-to-image");

      // Wait one animation frame so the browser has fully painted the card
      await new Promise<void>(r => requestAnimationFrame(() => r()));

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#070B14",
        skipFonts: true, // avoids CORS/CSP failures fetching web fonts
      });

      // Convert data URL → Blob via atob (no fetch, works in all mobile WebViews)
      const byteStr = atob(dataUrl.split(",")[1]);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const blob = new Blob([arr], { type: "image/png" });
      const file = new File([blob], "bawler-moment.png", { type: "image/png" });

      const parts = [scoreText, situationText].filter(Boolean);
      const shareText = parts.length ? `${parts.join(" · ")} · bawler-gold.vercel.app` : "bawler-gold.vercel.app";

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Bawler", text: shareText });
      } else {
        // Desktop fallback: trigger download
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "bawler-moment.png";
        a.click();
      }
    } catch (err) {
      // AbortError = user cancelled the share sheet — not a real error
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[Bawler] Share failed:", err);
      }
    }
    setShareLoading(false);
  }

  /* accent colour for the share button glow */
  const shareAccent = ball.isWicket
    ? { bg: "rgba(239,68,68,0.90)", shadow: "rgba(239,68,68,0.55)" }
    : ball.isBoundary6
    ? { bg: "rgba(168,85,247,0.90)", shadow: "rgba(168,85,247,0.55)" }
    : { bg: "rgba(6,182,212,0.90)", shadow: "rgba(6,182,212,0.55)" };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-white/10">

      {/* ── CONTEXT HEADER ── */}
      <ContextHeader
        match={match}
        ball={ball}
        scoreText={scoreText}
        situationText={situationText}
      />

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
        <div key={`${activeClip}-${ball.id}`} className="scene-fade-in absolute inset-0">
          {activeClip === "bowler"
            ? <BowlerView ball={ball} loopMs={loopMs / 2} />
            : <OverheadView ball={ball} fielders={fielders} loopMs={loopMs / 2} />}
        </div>

        {/* bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/55 backdrop-blur-sm border-t border-white/10">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 gap-2">
            <div className="flex flex-col gap-0 min-w-0">
              <TypeChip ball={ball} large />
              <SpeedChip ball={ball} />
            </div>
            <OutcomeBadge ball={ball} />
          </div>
          <div className="flex items-center gap-1.5 px-3 pb-1.5 text-[9px] font-semibold text-white/55 leading-none truncate">
            <span className="text-white/80 font-bold truncate">{ball.bowlerName}</span>
            <span className="text-white/35">→</span>
            <span className="text-white/80 font-bold truncate">{ball.batterName}</span>
          </div>
        </div>

        {/* Share button — top-right, big moments only */}
        {isBigMoment && (
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-opacity"
            style={{
              background: shareAccent.bg,
              color: "#fff",
              backdropFilter: "blur(8px)",
              boxShadow: `0 0 18px ${shareAccent.shadow}, 0 2px 8px rgba(0,0,0,0.4)`,
              opacity: shareLoading ? 0.6 : 1,
            }}
          >
            {shareLoading
              ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <ShareIcon />}
            <span>{shareLoading ? "..." : "Share"}</span>
          </button>
        )}
      </div>

      {/* ── IMPACT FOOTER ── */}
      <ImpactFooter
        ball={ball}
        match={match}
        winProbBefore={winProbBefore}
        winProbAfter={winProbAfter}
      />

      {/* ── HIDDEN MOMENT CARD ──
           opacity:0 is on the PARENT, NOT the ref element.
           html-to-image reads getComputedStyle of the ref — opacity is not inherited in CSS,
           so getComputedStyle(ref).opacity === "1" → fully opaque PNG captured correctly.
           Parent is within-viewport (top:0,left:0) so browser still paints the subtree. ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", top: 0, left: 0, width: 375,
          opacity: 0, pointerEvents: "none", zIndex: -1,
        }}
      >
        <div
          ref={cardRef}
          style={{ width: 375, background: "#070B14", fontFamily: "Inter, sans-serif" }}
        >
          <MomentCard
            ball={ball}
            match={match}
            scoreText={scoreText}
            situationText={situationText}
            winProbBefore={winProbBefore}
            winProbAfter={winProbAfter}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT HEADER
// ─────────────────────────────────────────────────────────────────────────────

function ContextHeader({ match, ball, scoreText, situationText }: {
  match: Match; ball: Ball; scoreText?: string; situationText?: string;
}) {
  const comp = match.competition;
  const isChase = !!(situationText?.startsWith("Need"));

  return (
    <div className="bg-black/70 backdrop-blur-sm px-3 py-2 flex items-center justify-between gap-2 border-b border-white/8">
      {/* left: competition + match */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          {comp && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: comp.logoColor ?? "#06B6D4" }}
            />
          )}
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45 truncate">
            {comp?.name ?? "Cricket"} · {match.teamA.shortName} vs {match.teamB.shortName}
          </span>
        </div>
        {scoreText && (
          <span className="text-[11px] font-bold text-white/90 truncate">{scoreText}</span>
        )}
      </div>

      {/* right: situation pill */}
      {situationText && (
        <div
          className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: isChase ? "rgba(6,182,212,0.18)" : "rgba(255,255,255,0.08)",
            color: isChase ? "#06B6D4" : "rgba(255,255,255,0.55)",
            border: `1px solid ${isChase ? "rgba(6,182,212,0.35)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {situationText}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPACT FOOTER — win-prob bar + swing + stat line
// ─────────────────────────────────────────────────────────────────────────────

function ImpactFooter({ ball, match, winProbBefore, winProbAfter }: {
  ball: Ball; match: Match; winProbBefore: number; winProbAfter: number;
}) {
  const delta = Math.round(winProbAfter - winProbBefore);
  const absDelta = Math.abs(delta);
  const teamAWins = winProbAfter;
  const teamBWins = 100 - teamAWins;
  const aColor = match.teamA.primaryColor;
  const bColor = match.teamB.primaryColor;

  /* impact one-liner */
  const impactLine = (() => {
    if (ball.isWicket) return `${ball.batterName} out · ${ball.dismissalType ?? "dismissed"}`;
    if (ball.isBoundary6) {
      const dist = ball.shotPower ? `${Math.round(ball.shotPower * 120 + 60)}m ` : "";
      return `${dist}SIX · ${ball.batterName}`;
    }
    if (ball.isBoundary4) return `FOUR · ${ball.batterName}`;
    return `${ball.runs} run${ball.runs !== 1 ? "s" : ""}`;
  })();

  return (
    <div className="bg-[#0A0E1A] px-3 pt-2 pb-2.5 flex flex-col gap-1.5">
      {/* win-prob bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-white/60 w-6 text-right num">{teamAWins}%</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-l-full transition-all duration-700"
            style={{ width: `${teamAWins}%`, background: aColor }}
          />
          <div
            className="h-full rounded-r-full transition-all duration-700"
            style={{ width: `${teamBWins}%`, background: bColor }}
          />
        </div>
        <span className="text-[9px] font-bold text-white/60 w-6 num">{teamBWins}%</span>
      </div>

      {/* team labels + delta */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-semibold text-white/40 uppercase tracking-wide">
          {match.teamA.shortName}
        </span>
        {absDelta >= 2 && (
          <span
            className="text-[9px] font-bold num px-1.5 py-0.5 rounded"
            style={{
              color: delta > 0 ? aColor : bColor,
              background: delta > 0
                ? `${aColor}18`
                : `${bColor}18`,
            }}
          >
            {delta > 0 ? `+${delta}%` : `${delta}%`} swing
          </span>
        )}
        <span className="text-[8px] font-semibold text-white/40 uppercase tracking-wide">
          {match.teamB.shortName}
        </span>
      </div>

      {/* impact line */}
      <div className="flex items-center justify-center">
        <span className="text-[10px] font-semibold text-white/55">{impactLine}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOMENT CARD — static card captured as shareable PNG
// ─────────────────────────────────────────────────────────────────────────────

function MomentCard({ ball, match, scoreText, situationText, winProbBefore, winProbAfter }: {
  ball: Ball; match: Match; scoreText?: string; situationText?: string;
  winProbBefore: number; winProbAfter: number;
}) {
  const delta = Math.round(winProbAfter - winProbBefore);
  const aColor = match.teamA.primaryColor;
  const bColor = match.teamB.primaryColor;

  const outcomeLabel = ball.isWicket ? "WICKET"
    : ball.isBoundary6 ? "SIX"
    : ball.isBoundary4 ? "FOUR"
    : `${ball.runs} RUN${ball.runs !== 1 ? "S" : ""}`;

  const outcomeColor = ball.isWicket ? "#EF4444"
    : ball.isBoundary6 ? "#A855F7"
    : ball.isBoundary4 ? "#06B6D4"
    : "#94A3B8";

  return (
    <div style={{
      width: 375, background: "#070B14", fontFamily: "Inter,sans-serif",
      borderRadius: 20, overflow: "hidden",
      border: `1.5px solid ${outcomeColor}40`,
      boxShadow: `0 0 40px ${outcomeColor}30`,
    }}>
      {/* top bar */}
      <div style={{ background: "#0D1220", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {match.competition?.name ?? "Cricket"} · {match.teamA.shortName} vs {match.teamB.shortName}
          </div>
          {scoreText && (
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC", marginTop: 2 }}>{scoreText}</div>
          )}
        </div>
        {situationText && (
          <div style={{
            fontSize: 9, fontWeight: 700, color: "#06B6D4",
            background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: 99, padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.06em",
          }}>{situationText}</div>
        )}
      </div>

      {/* static pitch map */}
      <div style={{ padding: "8px 16px 0" }}>
        <StaticPitchMap ball={ball} />
      </div>

      {/* outcome badge */}
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${outcomeColor}22`,
          border: `2px solid ${outcomeColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 900, color: outcomeColor, flexShrink: 0,
        }}>{outcomeLabel.split("")[0]}{ball.isBoundary6 ? "6" : ball.isBoundary4 ? "4" : ""}</div>
        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: outcomeColor }}>{outcomeLabel}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
              {ball.bowlerName} → {ball.batterName}
            </div>
            {ball.ballSpeedKmh && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                {ball.ballSpeedKmh} km/h · {formatVariation(ball)}
              </div>
            )}
          </div>
          {/* Dismissal type — right side, wickets only */}
          {ball.isWicket && ball.dismissalType && (
            <div style={{
              fontSize: 11, fontWeight: 800, color: outcomeColor,
              background: `${outcomeColor}1A`,
              border: `1.5px solid ${outcomeColor}50`,
              borderRadius: 8, padding: "4px 9px",
              textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
            }}>
              {formatDismissal(ball.dismissalType)}
            </div>
          )}
        </div>
      </div>

      {/* win prob bar */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", width: 28, textAlign: "right" }}>
            {Math.round(winProbAfter)}%
          </span>
          <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${winProbAfter}%`, background: aColor, height: "100%" }} />
            <div style={{ width: `${100 - winProbAfter}%`, background: bColor, height: "100%" }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", width: 28 }}>
            {Math.round(100 - winProbAfter)}%
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
            {match.teamA.shortName}
          </span>
          {Math.abs(delta) >= 2 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? aColor : bColor }}>
              {delta > 0 ? `+${delta}%` : `${delta}%`} swing
            </span>
          )}
          <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
            {match.teamB.shortName}
          </span>
        </div>
      </div>

      {/* watermark */}
      <div style={{
        background: "#0D1220", borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#06B6D4", letterSpacing: "0.05em" }}>BAWLER</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Every ball, visualized</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC PITCH MAP — non-animated, for MomentCard PNG capture
// ─────────────────────────────────────────────────────────────────────────────

function StaticPitchMap({ ball }: { ball: Ball }) {
  const W = 343, H = 160;
  const CX = W / 2;
  const PITCH_TOP_W = 50, PITCH_BOT_W = 130, PITCH_TOP_Y = 18, PITCH_BOT_Y = 138;
  const wRatio = PITCH_BOT_W / PITCH_TOP_W;
  const pitchPath = `M ${CX - PITCH_TOP_W/2} ${PITCH_TOP_Y} L ${CX + PITCH_TOP_W/2} ${PITCH_TOP_Y} L ${CX + PITCH_BOT_W/2} ${PITCH_BOT_Y} L ${CX - PITCH_BOT_W/2} ${PITCH_BOT_Y} Z`;
  const pitchXAtY = (y: number) => {
    const t = (y - PITCH_TOP_Y) / (PITCH_BOT_Y - PITCH_TOP_Y);
    const half = (PITCH_TOP_W + (PITCH_BOT_W - PITCH_TOP_W) * t) / 2;
    return { left: CX - half, right: CX + half };
  };

  const pitchY = ball.pitchY ?? 0.65;
  const impactY = PITCH_BOT_Y - (wRatio * (PITCH_BOT_Y - PITCH_TOP_Y) * pitchY) / (1 + (wRatio - 1) * pitchY);
  const { right: rI, left: lI } = pitchXAtY(impactY);
  const impactX = CX + (ball.pitchX ?? 0) * (rI - lI) / 2 * 0.9;

  const swingD = (ball.swingDirection === "in" ? -1 : ball.swingDirection === "out" ? 1 : 0) * 14;
  // Correct bowler side — over-the-wicket or round-the-wicket
  const pmBowlerSide = ball.bowlingFrom === "round"
    ? (ball.bowlingArm === "right" ? -1 : 1)
    : (ball.bowlingArm === "right" ? 1 : -1);
  // Offset ~22px from CX in 343px-wide map — proportional to BowlerView's 40px in 800px
  const releaseX = CX + pmBowlerSide * 22, releaseY = PITCH_TOP_Y - 14;
  const batterY = PITCH_BOT_Y + 14;
  const spinD = (ball.spinDirection === "off" ? -1 : ball.spinDirection === "leg" ? 1 : 0) * 14;

  const prePath = `M ${releaseX} ${releaseY} Q ${(releaseX + impactX) / 2 + swingD} ${(releaseY + impactY) / 2} ${impactX} ${impactY}`;
  const postPath = `M ${impactX} ${impactY} Q ${(impactX + CX) / 2 + spinD} ${impactY - 30} ${CX} ${batterY}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <linearGradient id="spm-pitch" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B2918" />
          <stop offset="100%" stopColor="#6B4828" />
        </linearGradient>
      </defs>
      <path d={pitchPath} fill="url(#spm-pitch)" stroke="#5B3E22" strokeWidth="1" />
      <line x1={CX - PITCH_TOP_W/2 - 4} y1={PITCH_TOP_Y + 8} x2={CX + PITCH_TOP_W/2 + 4} y2={PITCH_TOP_Y + 8} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      <line x1={CX - PITCH_BOT_W/2 - 5} y1={PITCH_BOT_Y - 10} x2={CX + PITCH_BOT_W/2 + 5} y2={PITCH_BOT_Y - 10} stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
      {/* stumps */}
      {[-4,0,4].map((dx,i)=>(
        <line key={i} x1={CX+dx} y1={PITCH_TOP_Y+4} x2={CX+dx} y2={PITCH_TOP_Y-8} stroke="#E8D5B7" strokeWidth="1.2"/>
      ))}
      {[-6,0,6].map((dx,i)=>(
        <line key={i} x1={CX+dx} y1={PITCH_BOT_Y-6} x2={CX+dx} y2={PITCH_BOT_Y-18} stroke="#E8D5B7" strokeWidth="1.5"/>
      ))}
      {/* trajectory */}
      <path d={prePath} stroke="#FF6B35" strokeWidth="1.5" fill="none" strokeDasharray="3 4" opacity="0.7" />
      <path d={postPath} stroke={ball.spinDirection && ball.spinDirection !== "none" ? "#A855F7" : "#00E5FF"} strokeWidth="1.5" fill="none" strokeDasharray="3 4" opacity="0.7" />
      {/* impact dot */}
      <circle cx={impactX} cy={impactY} r="5" fill="#FF6B35" opacity="0.5" />
      <circle cx={impactX} cy={impactY} r="2.5" fill="#FFE9A0" />
      {/* ball at impact */}
      <circle cx={impactX} cy={impactY} r="4" fill="none" stroke="#FFE9A0" strokeWidth="1" opacity="0.6" />
    </svg>
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

function BowlerView({ ball, loopMs }: { ball: Ball; loopMs: number }) {
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
  const spinDelta = (ball.spinDirection==="off"?-1:ball.spinDirection==="leg"?1:0)*18*2.2;
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
      <text x={releaseX+22} y={releaseY+12} fill="#F8FAFC" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">{ball.bowlerName}</text>
      <text x={releaseX+22} y={releaseY+26} fill="#94A3B8" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Bowler</text>
      <Person cx={CX-26} cy={PITCH_BOT_Y+30} scale={1.0} arm="right" from="over"/>
      <Bat cx={CX-26} cy={PITCH_BOT_Y+30} shotAngle={ball.shotAngle??0}/>
      <text x={CX-50} y={PITCH_BOT_Y+56} textAnchor="end" fill="#F8FAFC" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">{ball.batterName}</text>
      <text x={CX-50} y={PITCH_BOT_Y+72} textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Batter</text>
      <use href="#pre-B" stroke="#FF6B35" strokeWidth="1.4" fill="none" strokeDasharray="2 4" opacity="0.5"/>
      <use href="#post-B" stroke={ball.spinDirection!=="none"?"#A855F7":"#00E5FF"} strokeWidth="1.4" fill="none" strokeDasharray="2 4" opacity="0.55"/>
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
  const wasLeft=ball.shotType==="left"||(isDot&&Math.abs(ball.pitchX??0)>0.6);
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
      {!wasLeft&&<path d={isAerial?`M ${BATTER_X} ${BATTER_Y} Q ${(BATTER_X+shotEndX)/2} ${Math.min(BATTER_Y,shotEndY)-80*(ball.shotLoft??0.5)} ${shotEndX} ${shotEndY}`:`M ${BATTER_X} ${BATTER_Y} L ${shotEndX} ${shotEndY}`} stroke={isSix?"#A855F7":isFour?"#00E5FF":"#94A3B8"} strokeWidth={isSix||isFour?"2.2":"1.4"} strokeDasharray={isAerial?"0":"4 4"} fill="none" opacity="0.75"/>}
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
  const color = speed>=140?"text-cyan":speed>=130?"text-text-primary":speed>=110?"text-orange":"text-six";
  return <div className="flex items-baseline gap-0.5 leading-none"><span className={`text-xs font-extrabold num ${color}`}>{speed}</span><span className="text-[8px] font-semibold uppercase tracking-widest text-text-dim">kmh</span></div>;
}

function TypeChip({ ball, large }: { ball: Ball; large?: boolean }) {
  const variation = formatVariation(ball);
  const color = ball.spinDirection&&ball.spinDirection!=="none"?"text-six":ball.swingDirection&&ball.swingDirection!=="none"?"text-cyan":"text-text-primary";
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
  if(ball.pace==="fast")return"Fast";
  if(ball.pace==="slow")return"Slow";
  return"Stock";
}

function formatDismissal(type: string): string {
  const map: Record<string, string> = {
    "bowled": "Bowled", "caught": "Caught", "lbw": "LBW",
    "run-out": "Run Out", "stumped": "Stumped",
    "hit-wicket": "Hit Wkt", "retired": "Retired",
  };
  return map[type] ?? type;
}

function capitalize(s:string){return s.charAt(0).toUpperCase()+s.slice(1);}
