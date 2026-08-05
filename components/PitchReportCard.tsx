import type { PitchReport } from "@/lib/pitchReports";
import type { Venue } from "@/lib/types";
import StatCell from "./StatCell";

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
 *   - Surface type tag (always -- required field)
 *   - Compact box row: one box per rating stat that has a value
 *     (pace-friendly, spin-friendly, bounce-consistency, avg 1st innings
 *     score, dew factor)
 *   - Bullet-list of behaviour hints in everyday language (always --
 *     required field)
 *
 * v1.0.155 (real-data-readiness): every field except `surfaceType` and
 * `bullets` is optional on `PitchReport` -- a real per-match report may only
 * have some of these available.
 *
 * v1.0.160 (box-row redesign, real-data-readiness continued):
 *   - The old stacked full-width sliders (pace/spin/bounce) and the separate
 *     dew-factor row were replaced with a single row of compact boxes, one
 *     per stat that actually has a value -- reusing the exact `StatCell`
 *     tile from the player profile's MAT/RUNS/AVG/SR rows (shared component,
 *     not a lookalike) so both places render identically.
 *   - `expectedFirstInningsScore` (a predictive `{low, mid, high}` range
 *     shown as a gauge) was replaced with `avgFirstInningsScore`, a single
 *     historical statistic, rendered as its own box in the same row.
 *   - Each box is independently optional -- a missing field means that box
 *     is simply absent, never a placeholder or a zero. The row is built from
 *     whichever boxes exist and chunked into groups of at most 4; each
 *     chunk renders as its own equal-fraction grid, so any row -- including
 *     a lone final box left over after wrapping -- always stretches to
 *     fill the full width rather than leaving empty space beside it.
 */
export default function PitchReportCard({ pitch, venue }: PitchReportCardProps) {
  const boxes: { key: string; label: string; value: string | number }[] = [];
  if (pitch.paceFriendly !== undefined) boxes.push({ key: "pace", label: "Pace", value: `${pitch.paceFriendly}/10` });
  if (pitch.spinFriendly !== undefined) boxes.push({ key: "spin", label: "Spin", value: `${pitch.spinFriendly}/10` });
  if (pitch.bounceConsistency !== undefined) boxes.push({ key: "bounce", label: "Bounce", value: `${pitch.bounceConsistency}/10` });
  if (pitch.avgFirstInningsScore !== undefined) boxes.push({ key: "avgScore", label: "Avg score", value: pitch.avgFirstInningsScore });
  if (pitch.dewFactor) boxes.push({ key: "dew", label: "Dew", value: capitalize(pitch.dewFactor) });

  const boxRows: (typeof boxes)[] = [];
  for (let i = 0; i < boxes.length; i += 4) boxRows.push(boxes.slice(i, i + 4));

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
        {/* Surface type -- always present (required field) */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-dim uppercase tracking-widest">Surface</span>
          <span className="text-sm font-bold text-text-primary">{capitalize(pitch.surfaceType.replace("-", " "))}</span>
        </div>

        {/* Compact stat box row -- section omitted entirely if no field has
            a value; otherwise chunked into rows of at most 4, each row an
            equal-fraction grid so it always fills the full width regardless
            of how many boxes it holds. */}
        {boxRows.length > 0 && (
          <div className="border-t border-line pt-3 space-y-3">
            {boxRows.map((row, ri) => (
              <div key={ri} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0,1fr))` }}>
                {row.map((box) => (
                  <div key={box.key} className="card">
                    <StatCell label={box.label} value={box.value} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Behavior bullets -- always present (required field) */}
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

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
