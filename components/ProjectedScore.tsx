interface ProjectedScoreProps {
  projected: { runs: number; perOver: number; confidence: number } | null;
  target?: number;
}

export default function ProjectedScore({ projected, target }: ProjectedScoreProps) {
  if (!projected) return null;
  const diff = target ? projected.runs - target : null;
  return (
    <div className="card p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-dim mb-2">
        {target ? "Projected total" : "Projected score"}
      </h3>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-extrabold num text-text-primary">{projected.runs}</span>
        {target !== undefined && diff !== null && (
          <span className={`text-sm font-semibold num ${diff > 0 ? "text-boundary" : diff < 0 ? "text-negative" : "text-text-secondary"}`}>
            {diff > 0 ? "+" : ""}{diff}
          </span>
        )}
      </div>
      <div className="text-xs text-text-secondary num">
        Running at {projected.perOver}/over
      </div>
      {target !== undefined && (
        <div className="text-xs text-text-dim mt-1 num">
          Target: {target}
        </div>
      )}
    </div>
  );
}
