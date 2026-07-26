interface NudgeBannerProps {
  topicTitle: string;
  message: string;
  onDismiss?: () => void;
}

export default function NudgeBanner({ topicTitle, message, onDismiss }: NudgeBannerProps) {
  return (
    <div className="rounded-card border border-forest/30 bg-forest-light p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-forest">
            Today&apos;s nudge
          </p>
          <p className="mt-1 text-sm text-ink">
            <span className="font-medium">{topicTitle}</span> — {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss nudge"
            className="text-ink-muted hover:text-ink"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
