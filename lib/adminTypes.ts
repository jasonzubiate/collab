export type MatchTier = "GREEN" | "YELLOW" | "ARCHIVED";
export type WorkflowStatus = "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";

export type ProposalEventView = {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: string;
};

export type AdminProposal = {
  id: string;
  campaign: { id: string; name: string };
  creatorHandle: string;
  creatorName: string | null;
  creatorEmail: string;
  followerCount: number;
  engagementRate: number;
  reelsCount: number;
  storiesCount: number;
  adUsageDays: number;
  calculatedPayoutCents: number;
  matchTier: MatchTier;
  workflowStatus: WorkflowStatus;
  contactedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  events?: ProposalEventView[];
};

export type AdminCampaign = {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  isActive: boolean;
  minFollowers: number;
  minEngagementRate: number;
  baseRatePer10kCents: number;
  ratePerReelCents: number;
  ratePerStoryCents: number;
  adUsage30DayMultiplier: number;
  adUsage90DayMultiplier: number;
  createdAt: string;
  updatedAt: string;
};
