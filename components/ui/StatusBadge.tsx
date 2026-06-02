import { Chip } from "@heroui/react";

type MatchTier = "GREEN" | "YELLOW" | "ARCHIVED";
type WorkflowStatus = "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";

type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

const tierColors: Record<MatchTier, ChipColor> = {
  GREEN: "success",
  YELLOW: "warning",
  ARCHIVED: "default",
};

const tierLabels: Record<MatchTier, string> = {
  GREEN: "Green",
  YELLOW: "Yellow",
  ARCHIVED: "Archived",
};

const statusColors: Record<WorkflowStatus, ChipColor> = {
  NEW: "default",
  CONTACTED: "accent",
  APPROVED: "success",
  REJECTED: "danger",
};

const statusLabels: Record<WorkflowStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function TierBadge({ tier }: { tier: MatchTier }) {
  return (
    <Chip color={tierColors[tier]} variant="soft" size="sm">
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-current opacity-80"
      />
      <Chip.Label>{tierLabels[tier]}</Chip.Label>
    </Chip>
  );
}

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <Chip color={statusColors[status]} variant="soft" size="sm">
      {statusLabels[status]}
    </Chip>
  );
}

type ProposalSource = "WEB" | "INSTAGRAM_DM";

export function SourceBadge({ source }: { source: ProposalSource }) {
  if (source !== "INSTAGRAM_DM") return null;
  return (
    <Chip color="accent" variant="soft" size="sm">
      <Chip.Label>Via Instagram DM</Chip.Label>
    </Chip>
  );
}
