import type { CreatorProposalActivity } from "@/lib/services/creatorProposalService";

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ProposalActivityTimeline({
  activity,
  instagramUsername,
}: {
  activity: CreatorProposalActivity[];
  instagramUsername: string | null;
}) {
  if (activity.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No activity yet. The brand will update you here when they respond.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activity.slice(0, 8).map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-border bg-surface-muted/50 px-3 py-2"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <time
              className="shrink-0 text-xs text-muted-foreground"
              dateTime={item.createdAt}
            >
              {formatWhen(item.createdAt)}
            </time>
          </div>
          {item.preview ? (
            <p className="mt-1 text-sm text-muted-foreground">{item.preview}</p>
          ) : null}
          {item.type === "DM_THREAD" && instagramUsername ? (
            <a
              href={`https://instagram.com/${instagramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-primary hover:text-primary-hover"
            >
              Open Instagram thread
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}
