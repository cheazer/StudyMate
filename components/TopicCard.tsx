import type { StudyCategory } from "@/lib/types";

const CATEGORY_STYLES: Record<StudyCategory, { tag: string; bar: string }> = {
  math: { tag: "bg-blue-light text-blue", bar: "bg-blue" },
  programming: { tag: "bg-violet-light text-violet", bar: "bg-violet" },
  science: { tag: "bg-forest-light text-forest", bar: "bg-forest" },
  other: { tag: "bg-amber-light text-amber", bar: "bg-amber" },
};

interface TopicCardProps {
  courseName: string;
  title: string;
  category: StudyCategory;
  progressPercent: number;
  lastTouchedLabel: string; // e.g. "Yesterday", "2 days ago"
}

export default function TopicCard({
  courseName,
  title,
  category,
  progressPercent,
  lastTouchedLabel,
}: TopicCardProps) {
  const style = CATEGORY_STYLES[category];

  return (
    <div className="rounded-card bg-surface border border-border p-5">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.tag}`}>
          {courseName}
        </span>
        <span className="text-xs text-ink-muted">{lastTouchedLabel}</span>
      </div>
      <p className="mt-2 font-medium">{title}</p>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-border">
          <div
            className={`h-1.5 rounded-full ${style.bar}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="font-mono text-xs text-ink-muted">{progressPercent}%</span>
      </div>
    </div>
  );
}
