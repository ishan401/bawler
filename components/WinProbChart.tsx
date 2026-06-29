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

/**
 * Full-screen win-probability chart.
 *
 * Per Sarthak v0.4:
 *   - Only accessible by tapping the Win% metric tile.
 *   - Uses full vertical screen height.
 *   - 6-8 events visible per zoom; events labeled DIRECTLY on the chart
 *     (no side legend / index list).
 *   - Events are wickets, sixes, big-overs (12+), and milestones —
 *     NOT momentum-swing markers.
 *   - Two coloured lines (one per team) with vertical event markers.
 *   - Pinch zoom on touch devices.
 */
export default function WinProbChart({ match, points, events, onClose }: WinProbChartProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("full");
  const containerRef = useRef<HTMLDivElement>(null);
  const teamA = match.teamA;
  const teamB = match.teamB;
  const last = points[points.length - 1];

  // Filter events — exclude momentum-swing, key-bowling-change per spec
  const filteredEvents = useMemo(() => {
    return events.filter(e =>
      e.kind === "wicket" ||
      e.kind === "six" ||
      e.kind === "milestone" ||
      e.kind === "big-over" ||
      e.kind === "phase-shift"
    );
  }, [events]);

  // Filter to "now or earlier" + zoom
  const visibleEvents = useMemo(() => {
    if (!last) return [];
    return filteredEvents
      .filter(e => e.overFloat <= last.overFloat)
      .filter(e => {
        if (zoom === "full") return true;
        if (zoom === "innings") {
          const i = last.overFloat > 20 ? 2 : 1;
          if (i === 2) return e.overFloat > 20;
          return e.overFloat <= 20;
        }
        return e.overFloat >= last.overFloat - 6;
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8)
      .sort((a, b) => a.overFloat - b.overFloat);
  }, [filteredEvents, zoom, last]);

  const { xMin, xMax } = useMemo(() => {
    if (!last) return { xMin: 0, xMax: 40 };
    if (zoom === "full") return { xMin: 0, xMax: 40 };
    if (zoom === "innings") {
      const innings = last.overFloat > 20 ? 2 : 1;
      return innings === 2 ? { xMin: 20, xMax: 40 } : { xMin: 0, xMax: 20 };
    }
    return { xMin: Math.max(0, last.overFloat - 6), xMax: Math.min(40, last.overFloat + 0.5) };
  }, [zoom, last]);

  const chartPoints = useMemo(() => points.filter(p => p.overFloat >= xMin && p.overFloat <= xMax), [points, xMin, xMax]);

  // ViewBox sized for full-screen vertical use
  const W = 380;
  const H = 580;
  const PAD = { top: 50, right: 16, bottom: 36, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xToPx = (x: number) => PAD.left + ((x - xMin) / Math.max(0.001, xMax - xMin)) * innerW;
  const yToPx = (pct: number) => PAD.top + (1 - pct) * innerH;

  const lineA = buildPath(chartPoints, p => p.winProbTeamA, xToPx, yToPx);
  const lineB = buildPath(chartPoints, p => 1 - p.winProbTeamA, xToPx, yToPx);

  // Pinch zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let initialDist: number | null = null;
    let initialZoom: ZoomLevel = zoom;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDist = pinchDistance(e.touches);
        initialZoom = zoom;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist) {
        const d = pinchDistance(e.touches);
        const ratio = d / initialDist;
        if (ratio > 1.3) {
          if (initialZoom === "full") setZoom("innings");
          else if (initialZoom === "innings") setZoom("recent");
          initialDist = d;
        } else if (ratio < 0.7) {
          if (initialZoom === "recent") setZoom("innings");
          else if (initialZoom === "innings") setZoom("full");
          initialDist = d;
        }
      }
    };
    const onEnd = () => { initialDist = null; };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [zoom]);

  if (!last) return <div className="card p-4 text-text-secondary text-sm">No data yet.</div>;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Drag-handle / collapse affordance — big tap target — Sarthak v0.9 #4 */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 flex items-center justify-center hover:bg-bg-elevated transition-colors group"
          aria-label="Collapse chart"
        >
          <span className="w-12 h-1 rounded-full bg-text-dim group-hover:bg-cyan transition-colors" />
        </button>
      )}

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-line shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Win probability</h3>
          <div className="flex items-center gap-3 mt-1 text-sm">
            <TeamProb code={teamA.shortName} color={teamA.primaryColor} pct={last.winProbTeamA * 100} />
            <TeamProb code={teamB.shortName} color={teamB.primaryColor} pct={(1 - last.winProbTeamA) * 100} />
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[10px] text-text-dim hover:text-cyan font-bold uppercase tracking-widest" aria-label="Collapse">
            Collapse
          </button>
        )}
      </div>

      {/* Zoom controls */}
      <div className="px-4 py-2 border-b border-line flex items-center justify-between shrink-0">
        <ZoomButtons zoom={zoom} onChange={setZoom} />
        <span className="text-[9px] text-text-dim uppercase tracking-widest">Pinch to zoom</span>
      </div>

      {/* Chart — fills available vertical space */}
      <div ref={containerRef} className="flex-1 px-2 py-4 touch-none flex items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          {/* 50% reference + grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(y => (
            <g key={y}>
              <line x1={PAD.left} y1={yToPx(y)} x2={W - PAD.right} y2={yToPx(y)} stroke="#1E293B" strokeWidth={y === 0.5 ? "1" : "0.7"} strokeDasharray={y === 0.5 ? "3 4" : "2 4"} />
              <text x={PAD.left - 6} y={yToPx(y) + 3} fill="#64748B" fontSize="9" fontWeight="600" textAnchor="end">{Math.round(y * 100)}%</text>
            </g>
          ))}

          {/* X-axis ticks */}
          {xAxisTicks(xMin, xMax).map(x => (
            <g key={x}>
              <line x1={xToPx(x)} y1={PAD.top + innerH} x2={xToPx(x)} y2={PAD.top + innerH + 3} stroke="#1E293B" />
              <text x={xToPx(x)} y={PAD.top + innerH + 14} fill="#64748B" fontSize="9" textAnchor="middle">
                {x > 20 ? `${x - 20}` : `${x}`}
              </text>
            </g>
          ))}

          {/* Innings divider */}
          {xMin <= 20 && xMax >= 20 && (
            <g>
              <line x1={xToPx(20)} y1={PAD.top} x2={xToPx(20)} y2={PAD.top + innerH} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
              <text x={xToPx(20)} y={PAD.top - 4} fill="#94A3B8" fontSize="8" fontWeight="700" textAnchor="middle" className="uppercase tracking-widest">2nd inn</text>
            </g>
          )}

          {/* Team lines — drawn FIRST so dots sit on top */}
          <path d={lineA} stroke={teamA.primaryColor} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <path d={lineB} stroke={teamB.primaryColor} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />

          {/* Event dots — placed ON the line at the event's overFloat, on team A's line.
              Sarthak v0.9 #4: no more vertical clutter — events are dots, with labels
              rendered in a separate row below the chart. */}
          {visibleEvents.map(e => {
            const pointAtEvent = points.find(p => p.overFloat >= e.overFloat) ?? last;
            const x = xToPx(e.overFloat);
            const y = yToPx(pointAtEvent.winProbTeamA);
            const color = eventColor(e.kind);
            return (
              <g key={e.id}>
                <circle cx={x} cy={y} r="5.5" fill={color} stroke="#0A0E1A" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="2" fill="#FFFFFF" />
              </g>
            );
          })}

          {/* Now marker */}
          {last.overFloat >= xMin && last.overFloat <= xMax && (
            <g>
              <line x1={xToPx(last.overFloat)} y1={PAD.top} x2={xToPx(last.overFloat)} y2={PAD.top + innerH} stroke="#F8FAFC" strokeWidth="1.4" strokeDasharray="2 2" />
              <circle cx={xToPx(last.overFloat)} cy={yToPx(last.winProbTeamA)} r="5" fill={teamA.primaryColor} stroke="#F8FAFC" strokeWidth="1.5" />
              <circle cx={xToPx(last.overFloat)} cy={yToPx(1 - last.winProbTeamA)} r="5" fill={teamB.primaryColor} stroke="#F8FAFC" strokeWidth="1.5" />
              <text x={xToPx(last.overFloat) + 7} y={PAD.top + 12} fill="#F8FAFC" fontSize="9" fontWeight="700" className="uppercase tracking-widest">NOW</text>
            </g>
          )}
        </svg>
      </div>

      {/* Event legend strip below the chart — replaces in-chart vertical lines */}
      {visibleEvents.length > 0 && (
        <div className="px-4 py-3 border-t border-line bg-bg-surface">
          <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Events in view</div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
            {visibleEvents.map(e => (
              <div key={e.id} className="flex items-start gap-2 text-[11px]">
                <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: eventColor(e.kind) }} />
                <span className="num font-bold text-text-secondary shrink-0">{e.overFloat.toFixed(1)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-text-primary truncate">{e.label}</div>
                  <div className="text-[10px] text-text-dim truncate">{e.context}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPath(
  points: WinProbPoint[],
  yAccess: (p: WinProbPoint) => number,
  xToPx: (x: number) => number,
  yToPx: (y: number) => number
): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${xToPx(p.overFloat).toFixed(1)} ${yToPx(yAccess(p)).toFixed(1)}`).join(" ");
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
    case "key-bowling-change": return "#94A3B8";
  }
}

function pinchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function TeamProb({ code, color, pct }: { code: string; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-text-secondary font-medium">{code}</span>
      <span className="num font-bold text-text-primary">{pct.toFixed(1)}%</span>
    </div>
  );
}

function ZoomButtons({ zoom, onChange }: { zoom: ZoomLevel; onChange: (z: ZoomLevel) => void }) {
  const opts: { key: ZoomLevel; label: string }[] = [
    { key: "full", label: "Match" },
    { key: "innings", label: "Innings" },
    { key: "recent", label: "Recent" },
  ];
  return (
    <div className="inline-flex rounded-md bg-bg-surface border border-line p-0.5">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition ${
            zoom === o.key ? "bg-cyan text-bg" : "text-text-dim hover:text-text-primary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
