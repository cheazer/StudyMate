const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

interface StreakStripProps {
  streakDays: number;
  activeDaysThisWeek: boolean[]; // length 7, Mon -> Sun
}

export default function StreakStrip({ streakDays, activeDaysThisWeek }: StreakStripProps) {
  return (
    <div className="rounded-card bg-surface border border-border p-6">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-6xl font-bold text-forest">{streakDays}</span>
        <span className="text-ink-muted">day streak</span>
      </div>
      <p className="mt-1 text-sm text-ink-muted">Keep it going</p>

      <div className="mt-5 flex gap-2">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`h-8 w-full rounded-md ${
                activeDaysThisWeek[i] ? "bg-forest" : "bg-forest-light"
              }`}
            />
            <span className="font-mono text-[11px] text-ink-muted">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
