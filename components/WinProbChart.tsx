"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Match, WinProbPoint, MatchEvent } from "@/lib/types";

interface WinProbChartProps {
  match: Match;
  points: WinProbPoint[];
  events: MatchEvent[];
  onClose?: () => void;
}

type ZoomLevel = "full" | "innings" | "recent";

export default function WinProbChart({ match, points, events, onClose }: WinProbChartProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("full");
  const containerRef = useRef<HTMLDivElement>(null);
  const teamA = match.teamA;
  const teamB = match.teamB;
  const last = points[points.length - 1];

  const filteredEvents = useMemo(() =>
    events.filter(e =>
      e.kind === "wicket" || e.kind === "six" || e.kind === "milestone" ||
      e.kind === "big-over" || e.kind === "phase-shift"
    ), [events]);

  const { xMin, xMax } = useMemo(() => {
    if (!last) return { xMin: 0, xMax: 40 };
    if (zoom === "full") return { xMin: 0, xMax: 40 };
    if (zoom === "innings") {
      const inn = last.overFloat > 20 ? 2 : 1;
      return inn === 2 ? { xMin: 20, xMax: 40 } : { xMin: 0, xMax: 20 };
    }
    return { xMin: Math.max(0, last.overFloat - 6), xMax: Math.min(40, last.overFloat + 0.5) };
  }, [zoom, last]);

  const chartPoints = useMemo(
    () => points.filter(p => p.overFloat >= xMin && p.overFloat <= xMax),
    [points, xMin, xMax]
  );

  const visibleEvents = useMemo(() => {
    if (!last) return [];
    return filteredEvents
      .filter(e => e.overFloat >= xMin && e.overFloat <= last.overFloat)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8)
      .sort((a, b) => a.overFloat - b.overFloat);
  }, [filteredEvents, xMin, last]);

  const W = 380;
  const H = 260;
  const PAD = { top: 28, right: 20, bottom: 36, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xToPx = (x: number) => PAD.left + ((x - xMin) / Math.max(0.001, xMax - xMin)) * innerW;
  const yToPx = (pct: number) => PAD.top + (1 - pct) * innerH;

  const linePath = chartPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(p.overFloat).toFixed(1)} ${yToPx(p.winProbTeamA).toFixed(1)}`)
    .join(" ");

  const bottomY = (PAD.top + innerH).toFixed(1);
  const topY = PAD.top.toFixed(1);
  const firstX = chartPoints.length > 0 ? xToPx(chartPoints[0].overFloat).toFixed(1) : "0";
  const lastX = chartPoints.length > 0 ? xToPx(chartPoints[chartPoints.length - 1].overFloat).toFixed(1) : "0";

  // Team A fill: below the line (their probability territory)
  const areaPathA = chartPoints.length > 0
    ? `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
    : "";

  // Team B fill: above the line (their probability territory)
  const areaPathB = chartPoints.length > 0
    ? `M ${firstX} ${topY} L ${lastX} ${topY} L ${lastX} ${yToPx(chartPoints[chartPoints.length - 1].winProbTeamA).toFixed(1)} ${chartPoints.slice().reverse().map(p => `L ${xToPx(p.overFloat).toFixed(1)} ${yToPx(p.winProbTeamA).toFixed(1)}`).join(" ")} Z`
    : "";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let initialDist: number | null = null;
    let initialZoom: ZoomLevel = zoom;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) { initialDist = pinchDist(e.touches); initialZoom = zoom; }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !initialDist) return;
      const ratio = pinchDist(e.touches) / initialDist;
      if (ratio > 1.3) {
        if (initialZoom === "full") setZoom("innings");
        else if (initialZoom === "innings") setZoom("recent");
        initialDist = pinchDist(e.touches);
      } else if (ratio < 0.7) {
        if (initialZoom === "recent") setZoom("innings");
        else if (initialZoom === "innings") setZoom("full");
        initialDist = pinchDist(e.touches);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", () => { initialDist = null; });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [zoom]);

  if (!last) return <div className="card p-4 text-text-secondary text-sm">No data yet.</div>;

  const pctA = last.winProbTeamA;
  const pctB = 1 - pctA;
  const leaderA = pctA >= 0.5;

  return (
    <div className="flex flex-col h-full bg-bg">
      {onClose && (
        <button onClick={onClose} className="w-full pt-3 pb-1 flex items-center justify-center" aria-label="Collapse">
          <span className="w-10 h-1 rounded-full bg-text-dim" />
        </button>
      )}

      {/* Header */}
      <div className="px-4 pt-3 pb-3 shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-text-dim mb-2">Win Probability</p>

        {/* Split bar */}
        <div className="flex rounded-xl overflow-hidden h-10 mb-3">
          <div
            className="flex items-center justify-start pl-3 transition-all duration-500"
            style={{ width: `${Math.round(pctA * 100)}%`, background: teamA.primaryColor }}
          >
            {pctA > 0.12 && (
              <span className="text-[11px] font-extrabold text-white num drop-shadow whitespace-nowrap">
                {teamA.shortName} {Math.round(pctA * 100)}%
              </span>
            )}
          </div>
          <div
            className="flex items-center justify-end pr-3 transition-all duration-500"
            style={{ width: `${Math.round(pctB * 100)}%`, background: teamB.primaryColor }}
          >
            {pctB > 0.12 && (
              <span className="text-[11px] font-extrabold text-white num drop-shadow whitespace-nowrap">
                {Math.round(pctB * 100)}% {teamB.shortName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: leaderA ? teamA.primaryColor : teamB.primaryColor }} />
          <span className="text-[11px] text-text-secondary">
            <span className="font-bold text-text-primary">{leaderA ? teamA.shortName : teamB.shortName}</span>{" "}
            {Math.round(Math.max(pctA, pctB) * 100)}% chance to win
          </span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="px-4 pb-2 flex items-center justify-between shrink-0">
        <ZoomButtons zoom={zoom} onChange={setZoom} />
        <span className="text-[8px] text-text-dim uppercase tracking-widest">Pinch to zoom</span>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 px-2 touch-none flex items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="xMidYMid meet" style={{ maxHeight: 280 }}>
          <defs>
            {/* Team A gradient: fills below line in team A colour */}
            <linearGradient id="wpc-grad-a" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={teamA.primaryColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={teamA.primaryColor} stopOpacity="0.45" />
            </linearGradient>
            {/* Team B gradient: fills above line in team B colour */}
            <linearGradient id="wpc-grad-b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={teamB.primaryColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={teamB.primaryColor} stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Chart border */}
          <rect x={PAD.left} y={PAD.top} width={innerW} height={innerH} fill="none" stroke="#1E293B" strokeWidth="0.5" />

          {/* Team B fill — above the line */}
          {areaPathB && <path d={areaPathB} fill="url(#wpc-grad-b)" style={{filter:"brightness(3) saturate(2)"}} />}
          {/* Team A fill — below the line */}
          {areaPathA && <path d={areaPathA} fill="url(#wpc-grad-a)" style={{filter:"brightness(3) saturate(2)"}} />}

          {/* Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map(y => {
            const isMid = y === 0.5;
            return (
              <g key={y}>
                <line
                  x1={PAD.left} y1={yToPx(y)} x2={W - PAD.right} y2={yToPx(y)}
                  stroke={isMid ? "#475569" : "#1E293B"}
                  strokeWidth={isMid ? "1" : "0.5"}
                  strokeDasharray={isMid ? "5 4" : "2 5"}
                />
                <text x={PAD.left - 8} y={yToPx(y) + 3.5}
                  fill={isMid ? "#94A3B8" : "#475569"}
                  fontSize={isMid ? "9" : "8"} fontWeight={isMid ? "700" : "500"} textAnchor="end">
                  {Math.round(y * 100)}
                </text>
              </g>
            );
          })}

          {/* Team labels on y-axis: team A at top, team B at bottom */}
          <text x={PAD.left - 8} y={PAD.top - 6} fill={teamA.primaryColor} fontSize="8" fontWeight="800" textAnchor="end">
            {teamA.shortName}
          </text>
          <text x={PAD.left - 8} y={PAD.top + innerH + 14} fill={teamB.primaryColor} fontSize="8" fontWeight="800" textAnchor="end">
            {teamB.shortName}
          </text>

          {/* X-axis ticks */}
          {xAxisTicks(xMin, xMax).map(x => (
            <g key={x}>
              <line x1={xToPx(x)} y1={PAD.top + innerH} x2={xToPx(x)} y2={PAD.top + innerH + 3} stroke="#334155" />
              <text x={xToPx(x)} y={PAD.top + innerH + 13} fill="#64748B" fontSize="8" textAnchor="middle">
                {x > 20 ? x - 20 : x}
              </text>
            </g>
          ))}

          {/* Innings divider */}
          {xMin <= 20 && xMax >= 20 && (
            <g>
              <line x1={xToPx(20)} y1={PAD.top} x2={xToPx(20)} y2={PAD.top + innerH}
                stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
              <text x={xToPx(20)} y={PAD.top - 6} fill="#64748B" fontSize="8" fontWeight="700" textAnchor="middle">
                2nd Inn
              </text>
            </g>
          )}

          {/* Main line — always team A colour (line = team A win probability) */}
          {linePath && (
            <path d={linePath}
              stroke={teamA.primaryColor}
              strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Event dots — coloured by event type */}
          {visibleEvents.map(e => {
            const pt = chartPoints.find(p => p.overFloat >= e.overFloat) ?? chartPoints[chartPoints.length - 1];
            if (!pt) return null;
            const cx = xToPx(e.overFloat);
            const cy = yToPx(pt.winProbTeamA);
            const color = eventColor(e.kind);
            return (
              <g key={e.id}>
                <circle cx={cx} cy={cy} r="5.5" fill={color} stroke="#0A0E1A" strokeWidth="1.5" />
                <text x={cx} y={cy + 3.5} fill="#fff" fontSize="6.5" fontWeight="900" textAnchor="middle">
                  {eventIcon(e.kind)}
                </text>
              </g>
            );
          })}

          {/* NOW marker — dot always in team A colour on team A line */}
          {last.overFloat >= xMin && last.overFloat <= xMax && (() => {
            const nx = xToPx(last.overFloat);
            const ny = yToPx(last.winProbTeamA);
            return (
              <g>
                <line x1={nx} y1={PAD.top} x2={nx} y2={PAD.top + innerH}
                  stroke="#F8FAFC" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.35" />
                <circle cx={nx} cy={ny} r="5.5" fill={teamA.primaryColor} stroke="#F8FAFC" strokeWidth="1.8" />
                <text x={Math.min(nx + 7, W - PAD.right - 16)} y={PAD.top + 9}
                  fill="#F8FAFC" fontSize="8" fontWeight="700" opacity="0.6">
                  NOW
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Key moments chips */}
      {visibleEvents.length > 0 && (
        <div className="px-4 pt-2 pb-5 border-t border-line shrink-0">
          <p className="text-[8.5px] uppercase tracking-widest text-text-dim mb-2">Key moments</p>
          <div className="flex flex-wrap gap-1.5">
            {visibleEvents.map(e => (
              <div
                key={e.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-bold"
                style={{
                  background: `${eventColor(e.kind)}18`,
                  border: `1px solid ${eventColor(e.kind)}44`,
                  color: eventColor(e.kind),
                }}
              >
                <span className="num opacity-60 text-[8px]">{e.overFloat.toFixed(1)}</span>
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function xAxisTicks(min: number, max: number): number[] {
  const span = max - min;
  const step = span > 30 ? 5 : span > 12 ? 2 : 1;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return ticks;
}

function eventColor(kind: MatchEvent["kind"]): string {
  switch (kind) {
    case "wicket": return "#EF4444";
    case "six": return "#A855F7";
    case "four": return "#00E5FF";
    case "milestone": return "#10B981";
    case "big-over": return "#10B981";
    case "quiet-over": return "#64748B";
    case "phase-shift": return "#FF6B35";
    case "momentum-swing": return "#FF6B35";
    default: return "#94A3B8";
  }
}

function eventIcon(kind: MatchEvent["kind"]): string {
  switch (kind) {
    case "wicket": return "W";
    case "six": return "6";
    case "four": return "4";
    case "milestone": return "*";
    case "big-over": return "^";
    case "phase-shift": return ">";
    default: return ".";
  }
}

function pinchDist(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function ZoomButtons({ zoom, onChange }: { zoom: ZoomLevel; onChange: (z: ZoomLevel) => void }) {
  const opts: { key: ZoomLevel; label: string }[] = [
    { key: "full", label: "Match" },
    { key: "innings", label: "Innings" },
    { key: "recent", label: "Recent" },
  ];
  return (
    <div className="inline-flex rounded-lg bg-bg-surface border border-line p-0.5 gap-0.5">
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${
            zoom === o.key ? "bg-cyan text-bg shadow-sm" : "text-text-dim hover:text-text-primary"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
