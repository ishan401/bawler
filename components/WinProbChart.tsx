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

  const filteredEvents = useMemo(() => events.filter(e =>
    e.kind === "wicket" || e.kind === "six" || e.kind === "milestone" ||
    e.kind === "big-over" || e.kind === "phase-shift"
  ), [events]);

  const visibleEvents = useMemo(() => {
    if (!last) return [];
    return filteredEvents
      .filter(e => e.overFloat <= last.overFloat)
      .filter(e => {
        if (zoom === "full") return true;
        if (zoom === "innings") {
          const i = last.overFloat > 20 ? 2 : 1;
          return i === 2 ? e.overFloat > 20 : e.overFloat <= 20;
        }
        return e.overFloat >= last.overFloat - 6;
      })
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 7)
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

  const chartPoints = useMemo(
    () => points.filter(p => p.overFloat >= xMin && p.overFloat <= xMax),
    [points, xMin, xMax]
  );

  // Downsample: 1 point per over-segment avoids ball-by-ball noise
  const sampledPoints = useMemo(() => {
    if (chartPoints.length <= 40) return chartPoints;
    const step = Math.max(1, Math.floor(chartPoints.length / 60));
    const out: WinProbPoint[] = [];
    for (let i = 0; i < chartPoints.length; i += step) out.push(chartPoints[i]);
    if (out[out.length - 1] !== chartPoints[chartPoints.length - 1])
      out.push(chartPoints[chartPoints.length - 1]);
    return out;
  }, [chartPoints]);

  const W = 380;
  const H = 520;
  const PAD = { top: 44, right: 18, bottom: 36, left: 38 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xToPx = (x: number) => PAD.left + ((x - xMin) / Math.max(0.001, xMax - xMin)) * innerW;
  const yToPx = (pct: number) => PAD.top + (1 - pct) * innerH;

  const pts = useMemo(
    () => sampledPoints.map(p => ({ x: xToPx(p.overFloat), y: yToPx(p.winProbTeamA), p })),
    [sampledPoints, xMin, xMax]
  );

  // Smooth catmull-rom curve path
  const linePath = useMemo(() => catmullRomPath(pts.map(pt => ({ x: pt.x, y: pt.y }))), [pts]);

  // Area below line (team A's zone)
  const areaA = useMemo(() => {
    if (pts.length === 0) return "";
    const bottom = yToPx(0);
    return `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${bottom.toFixed(1)} L ${pts[0].x.toFixed(1)} ${bottom.toFixed(1)} Z`;
  }, [linePath, pts]);

  // Area above line (team B's zone)
  const areaB = useMemo(() => {
    if (pts.length === 0) return "";
    const top = yToPx(1);
    return `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${top.toFixed(1)} L ${pts[0].x.toFixed(1)} ${top.toFixed(1)} Z`;
  }, [linePath, pts]);

  // Pinch zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let initialDist: number | null = null;
    let initialZoom: ZoomLevel = zoom;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) { initialDist = pinchDist(e.touches); initialZoom = zoom; }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist) {
        const d = pinchDist(e.touches);
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

  const pctA = Math.round(last.winProbTeamA * 100);
  const pctB = 100 - pctA;
  const leadingTeam = pctA >= pctB ? teamA : teamB;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Top bar: back button + drag handle */}
      <div className="flex items-center px-3 pt-3 pb-1 shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-text-secondary hover:text-cyan active:scale-95 transition-all"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-[11px] font-bold">Back</span>
          </button>
        )}
        <div className="flex-1 flex justify-center">
          <span className="w-10 h-1 rounded-full bg-line" />
        </div>
        {/* spacer to balance back button */}
        {onClose && <div className="w-14" />}
      </div>

      {/* Header */}
      <div className="px-4 pb-3 shrink-0">
        <div className="text-[10px] uppercase tracking-widest text-text-dim mb-2">Win Probability</div>
        {/* Big probability display */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: teamA.primaryColor }} />
              <span className="text-sm font-bold text-text-primary">{teamA.shortName}</span>
            </div>
            <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pctA}%`, background: teamA.primaryColor }} />
            </div>
          </div>
          <div className="text-center px-2 shrink-0">
            <div className="text-xl font-extrabold num" style={{ color: leadingTeam.primaryColor }}>{Math.max(pctA, pctB)}%</div>
            <div className="text-[9px] text-text-dim uppercase tracking-widest">{leadingTeam.shortName} lead</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="text-sm font-bold text-text-primary">{teamB.shortName}</span>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: teamB.primaryColor }} />
            </div>
            <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700 ml-auto"
                style={{ width: `${pctB}%`, background: teamB.primaryColor }} />
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[10px] text-text-secondary num font-bold">{pctA}%</span>
          <span className="text-[10px] text-text-secondary num font-bold">{pctB}%</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="px-4 pb-2 flex items-center justify-between shrink-0">
        <ZoomButtons zoom={zoom} onChange={setZoom} />
        <span className="text-[9px] text-text-dim uppercase tracking-widest">Pinch to zoom</span>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 px-1 touch-none">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={teamA.primaryColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={teamA.primaryColor} stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="gradB" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={teamB.primaryColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={teamB.primaryColor} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(y => (
            <g key={y}>
              <line
                x1={PAD.left} y1={yToPx(y)} x2={W - PAD.right} y2={yToPx(y)}
                stroke={y === 0.5 ? "#334155" : "#1E293B"}
                strokeWidth={y === 0.5 ? "1.5" : "0.8"}
                strokeDasharray={y === 0.5 ? "4 3" : "2 5"}
              />
              <text x={PAD.left - 6} y={yToPx(y) + 4} fill={y === 0.5 ? "#64748B" : "#475569"}
                fontSize="9" fontWeight={y === 0.5 ? "700" : "500"} textAnchor="end">
                {Math.round(y * 100)}
              </text>
            </g>
          ))}

          {/* X-axis ticks */}
          {xAxisTicks(xMin, xMax).map(x => (
            <g key={x}>
              <text x={xToPx(x)} y={PAD.top + innerH + 14} fill="#475569" fontSize="9" textAnchor="middle">
                {x > 20 ? `${x - 20}` : `${x}`}
              </text>
            </g>
          ))}

          {/* X axis label */}
          <text x={PAD.left + innerW / 2} y={H - 2} fill="#334155" fontSize="8" textAnchor="middle" fontWeight="600" letterSpacing="2">OVERS</text>

          {/* Innings divider */}
          {xMin <= 20 && xMax >= 20 && (
            <g>
              <line x1={xToPx(20)} y1={PAD.top} x2={xToPx(20)} y2={PAD.top + innerH}
                stroke="#334155" strokeWidth="1.5" strokeDasharray="5 4" />
              <rect x={xToPx(20) - 20} y={PAD.top - 18} width="40" height="14" rx="3" fill="#1E293B" />
              <text x={xToPx(20)} y={PAD.top - 7} fill="#64748B" fontSize="8" fontWeight="700"
                textAnchor="middle" letterSpacing="1">2ND INN</text>
            </g>
          )}

          {/* Area fills — team B on top (rendered first, behind line) */}
          {areaB && <path d={areaB} fill="url(#gradB)" />}
          {areaA && <path d={areaA} fill="url(#gradA)" />}

          {/* Main smooth line */}
          {linePath && (
            <path d={linePath} stroke={teamA.primaryColor} strokeWidth="2.5"
              fill="none" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Event dots */}
          {visibleEvents.map(e => {
            const closestPt = pts.reduce((best, pt) =>
              Math.abs(pt.p.overFloat - e.overFloat) < Math.abs(best.p.overFloat - e.overFloat) ? pt : best
            , pts[0]);
            if (!closestPt) return null;
            const color = eventColor(e.kind);
            return (
              <g key={e.id}>
                <circle cx={closestPt.x} cy={closestPt.y} r="7" fill={color} opacity="0.15" />
                <circle cx={closestPt.x} cy={closestPt.y} r="4.5" fill={color} stroke="#0A0E1A" strokeWidth="1.5" />
                <circle cx={closestPt.x} cy={closestPt.y} r="1.5" fill="#FFFFFF" />
              </g>
            );
          })}

          {/* Now marker */}
          {last.overFloat >= xMin && last.overFloat <= xMax && (() => {
            const nx = xToPx(last.overFloat);
            const ny = yToPx(last.winProbTeamA);
            return (
              <g>
                <line x1={nx} y1={PAD.top} x2={nx} y2={PAD.top + innerH}
                  stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
                {/* Glow ring */}
                <circle cx={nx} cy={ny} r="9" fill={teamA.primaryColor} opacity="0.2" />
                <circle cx={nx} cy={ny} r="5.5" fill={teamA.primaryColor} stroke="#0A0E1A" strokeWidth="1.5" />
                <circle cx={nx} cy={ny} r="2" fill="#FFFFFF" />
                {/* NOW label */}
                <rect x={nx + 7} y={PAD.top + 4} width="26" height="13" rx="3" fill="#0F172A" />
                <text x={nx + 20} y={PAD.top + 14} fill="#94A3B8" fontSize="8" fontWeight="700"
                  textAnchor="middle" letterSpacing="1">NOW</text>
              </g>
            );
          })()}

          {/* Team labels at right edge */}
          {pts.length > 0 && (() => {
            const lastPt = pts[pts.length - 1];
            const yA = lastPt.y;
            const yB = yToPx(1 - last.winProbTeamA);
            return (
              <g>
                <text x={W - PAD.right + 4} y={yA + 4} fill={teamA.primaryColor}
                  fontSize="8" fontWeight="800" textAnchor="start">{teamA.shortName}</text>
                <text x={W - PAD.right + 4} y={yB + 4} fill={teamB.primaryColor}
                  fontSize="8" fontWeight="800" textAnchor="start">{teamB.shortName}</text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Event legend */}
      {visibleEvents.length > 0 && (
        <div className="px-4 py-3 border-t border-line shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-text-dim mb-2">Key moments</div>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
            {visibleEvents.map(e => (
              <div key={e.id} className="flex items-center gap-2 text-[11px]">
                <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: eventColor(e.kind) }} />
                <span className="num font-bold text-text-dim shrink-0 w-8">{e.overFloat.toFixed(1)}</span>
                <span className="text-text-secondary truncate">{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Catmull-Rom → cubic bezier: produces visually smooth curves */
function catmullRomPath(pts: { x: number; y: number }[], alpha = 3): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / (alpha * 2);
    const cp1y = p1.y + (p2.y - p0.y) / (alpha * 2);
    const cp2x = p2.x - (p3.x - p1.x) / (alpha * 2);
    const cp2y = p2.y - (p3.y - p1.y) / (alpha * 2);
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
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
    case "wicket":     return "#EF4444";
    case "six":        return "#A855F7";
    case "four":       return "#00E5FF";
    case "milestone":  return "#10B981";
    case "big-over":   return "#10B981";
    case "quiet-over": return "#64748B";
    case "phase-shift":      return "#FF6B35";
    case "momentum-swing":   return "#FF6B35";
    case "key-bowling-change": return "#94A3B8";
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
    <div className="inline-flex rounded-md bg-bg-surface border border-line p-0.5">
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition ${
            zoom === o.key ? "bg-cyan text-bg" : "text-text-dim hover:text-text-primary"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
