interface WeekHoursChartProps {
  hoursByDay: { day: string; hours: number }[];
  totalHours: number;
}

export default function WeekHoursChart({ hoursByDay, totalHours }: WeekHoursChartProps) {
  const max = Math.max(...hoursByDay.map((d) => d.hours), 1);

  return (
    <div className="rounded-card bg-surface border border-border p-6">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">This week</p>
      <p className="font-display text-3xl font-bold">
        {totalHours.toFixed(1)} <span className="text-base font-normal text-ink-muted">hrs</span>
      </p>

      <div className="mt-4 flex items-end gap-2" style={{ height: 64 }}>
        {hoursByDay.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-sm ${d.hours > 0 ? "bg-forest" : "bg-forest-light"}`}
              style={{ height: `${Math.max((d.hours / max) * 56, 4)}px` }}
            />
            <span className="font-mono text-[11px] text-ink-muted">{d.day[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
