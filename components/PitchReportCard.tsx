import type { PitchReport, Venue } from "@/lib/types";

interface PitchReportCardProps {
  pitch: PitchReport;
  venue: Venue;
}

/**
 * Pitch report explained in plain language.
 * Per Sarthak — pitch info is "one of the most misunderstood, under-discussed
 * things in cricket" — this section is meant to feel intuitive.
 *
 * Structure:
 *   - Surface type tag
 *   - 3 visual sliders: pace-friendly, spin-friendly, bounce-consistency
 *   - Expected first-innings score range
 *   - Dew factor
 *   - Bullet-list of behaviour hints in everyday language
 */
export default function PitchReportCard({ pitch, venue }: PitchReportCardProps) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-line">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim">Pitch report</h3>
        <div className="text-sm mt-0.5">
          <span className="font-bold">{venue.name}</span>
          <span className="text-text-secondary"> · {venue.city}</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Surface type */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-dim uppercase tracking-widest">Surface</span>
          <span className="text-sm font-bold text-text-primary">{capitalize(pitch.surfaceType.replace("-", " "))}</span>
        </div>

        {/* Sliders */}
        <div className="space-y-3">
          <Slider label="Pace-friendly" value={pitch.paceFriendly} color="#00E5FF" />
          <Slider label="Spin-friendly" value={pitch.spinFriendly} color="#A855F7" />
          <Slider label="Bounce consistency" value={pitch.bounceConsistency} color="#10B981" />
        </div>

        {/* Score expectation */}
        <div className="border-t border-line pt-3">
          <div className="text-xs text-text-dim uppercase tracking-widest mb-1.5">Expected 1st innings score</div>
          <div className="relative h-3 bg-bg rounded-full overflow-hidden border border-line">
            <div className="absolute inset-y-0" style={{ left: 0, right: 0, background: "linear-gradient(90deg, #1B243A, #FF6B35, #1B243A)" }} />
            <div className="absolute inset-y-0 w-px bg-text-primary" style={{ left: "50%" }} />
          </div>
          <div className="flex justify-between text-[10px] num text-text-secondary mt-1">
            <span>{pitch.expectedFirstInningsScore.low}</span>
            <span className="font-bold text-orange">{pitch.expectedFirstInningsScore.mid}</span>
            <span>{pitch.expectedFirstInningsScore.high}</span>
          </div>
        </div>

        {/* Dew */}
        {pitch.dewFactor && (
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-xs text-text-dim uppercase tracking-widest">Dew factor</span>
            <span className={`text-sm font-bold ${
              pitch.dewFactor === "high" ? "text-cyan" : pitch.dewFactor === "moderate" ? "text-orange" : "text-text-secondary"
            }`}>
              {capitalize(pitch.dewFactor)}
            </span>
          </div>
        )}

        {/* Behavior bullets */}
        <div className="border-t border-line pt-3">
          <div className="text-xs text-text-dim uppercase tracking-widest mb-2">How this pitch behaves</div>
          <ul className="space-y-2">
            {pitch.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-primary leading-snug">
                <span className="text-cyan shrink-0 mt-0.5">→</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs num font-bold text-text-primary">{value}/10</span>
      </div>
      <div className="relative h-2 bg-line rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
