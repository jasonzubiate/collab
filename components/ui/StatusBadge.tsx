import { cn } from "@/lib/cn";

type MatchTier = "GREEN" | "YELLOW" | "ARCHIVED";
type WorkflowStatus = "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";

const tierStyles: Record<MatchTier, string> = {
  GREEN: "bg-tier-green-soft text-tier-green",
  YELLOW: "bg-tier-yellow-soft text-tier-yellow",
  ARCHIVED: "bg-tier-archived-soft text-tier-archived",
};

const tierLabels: Record<MatchTier, string> = {
  GREEN: "Green",
  YELLOW: "Yellow",
  ARCHIVED: "Archived",
};

const statusStyles: Record<WorkflowStatus, string> = {
  NEW: "bg-surface-muted text-muted-foreground ring-1 ring-border-strong",
  CONTACTED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  APPROVED: "bg-tier-green-soft text-tier-green",
  REJECTED: "bg-danger-soft text-danger",
};

const statusLabels: Record<WorkflowStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium";

export function TierBadge({ tier }: { tier: MatchTier }) {
  return (
    <span className={cn(base, tierStyles[tier])}>
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
      />
      {tierLabels[tier]}
    </span>
  );
}

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  return <span className={cn(base, statusStyles[status])}>{statusLabels[status]}</span>;
}
