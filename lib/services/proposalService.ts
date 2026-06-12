import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateProposalPayoutBreakdown } from "@/lib/pricing/calculateProposalPayoutBreakdown";
import { evaluateProposal } from "@/lib/pricing/evaluateProposal";
import { formatPayoutBreakdown } from "@/lib/pricing/formatPayoutBreakdown";
import type { MatchTier, PayoutBreakdown, RequestedScope } from "@/lib/pricing/types";
import { formatCents } from "@/lib/money";
import { getEnrichmentProvider } from "@/lib/enrichment";
import {
  isPseudoHandle,
  normalizeHandle,
  pseudoHandleForIgsid,
} from "@/lib/instagram/identity";
import {
  campaignToPricing,
  getActiveCampaignByBrandSlug,
} from "./campaignService";
import type { StartProposalInput } from "@/lib/validation/proposalSchemas";

export const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour

export type StartResult =
  | { ok: false; reason: "NO_ACTIVE_CAMPAIGN" }
  | {
      ok: true;
      draftId: string;
      campaign: { id: string; name: string };
      metrics: { followerCount: number; engagementRate: number };
      gatekeeper: {
        matchTier: MatchTier;
        passedThresholds: boolean;
        failedFollowerThreshold: boolean;
        failedEngagementThreshold: boolean;
      };
    };

export async function startProposalDraft(
  input: StartProposalInput,
): Promise<StartResult> {
  const campaign = await getActiveCampaignByBrandSlug(input.brandSlug);
  if (!campaign) return { ok: false, reason: "NO_ACTIVE_CAMPAIGN" };

  const provider = getEnrichmentProvider();
  const profile = await provider.enrich(input.creatorHandle);

  const pricing = campaignToPricing(campaign);
  const evaluation = evaluateProposal({
    pricing,
    metrics: {
      followerCount: profile.followerCount,
      engagementRate: profile.engagementRate,
    },
  });

  const draft = await prisma.proposalDraft.create({
    data: {
      campaignId: campaign.id,
      creatorHandle: profile.handle,
      creatorName: input.creatorName,
      creatorEmail: input.creatorEmail,
      followerCount: profile.followerCount,
      engagementRate: profile.engagementRate,
      enrichmentProvider: profile.provider,
      enrichmentPayload:
        profile.raw == null
          ? Prisma.JsonNull
          : (profile.raw as Prisma.InputJsonValue),
      expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
    },
  });

  return {
    ok: true,
    draftId: draft.id,
    campaign: { id: campaign.id, name: campaign.name },
    metrics: {
      followerCount: profile.followerCount,
      engagementRate: profile.engagementRate,
    },
    gatekeeper: {
      matchTier: evaluation.matchTier,
      passedThresholds: evaluation.passedThresholds,
      failedFollowerThreshold: evaluation.failedFollowerThreshold,
      failedEngagementThreshold: evaluation.failedEngagementThreshold,
    },
  };
}

export type StartDmDraftResult =
  | { ok: false; reason: "CAMPAIGN_NOT_FOUND" }
  | {
      ok: true;
      draftId: string;
      creatorHandle: string;
      metrics: { followerCount: number; engagementRate: number };
      gatekeeper: {
        matchTier: MatchTier;
        passedThresholds: boolean;
        failedFollowerThreshold: boolean;
        failedEngagementThreshold: boolean;
      };
    };

/**
 * DM-channel variant of {@link startProposalDraft}. Reuses the same enrich →
 * evaluate → persist flow but keys off a campaign id directly, derives a
 * pseudo-handle from the IGSID, and leaves `creatorEmail` null (PRD sections 8
 * and 10). The returned `draftId` feeds the unchanged `estimateProposal` /
 * `submitProposal` services.
 */
export async function startDmProposalDraft(input: {
  campaignId: string;
  instagramScopedUserId: string;
  /** Resolved from Graph User Profile API when available. */
  creatorHandle?: string | null;
  creatorName?: string | null;
  followerCount?: number | null;
}): Promise<StartDmDraftResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
  });
  if (!campaign) return { ok: false, reason: "CAMPAIGN_NOT_FOUND" };

  const provider = getEnrichmentProvider();
  const handle =
    input.creatorHandle?.trim() ||
    pseudoHandleForIgsid(input.instagramScopedUserId);
  const normalizedHandle = normalizeHandle(handle);
  const mockProfile = await provider.enrich(normalizedHandle);

  const profile = {
    handle: normalizedHandle,
    followerCount: input.followerCount ?? mockProfile.followerCount,
    engagementRate: mockProfile.engagementRate,
    provider:
      input.followerCount != null || input.creatorHandle
        ? "instagram_graph"
        : mockProfile.provider,
    raw: {
      ...((mockProfile.raw as Record<string, unknown> | null) ?? {}),
      pseudoHandle: isPseudoHandle(normalizedHandle),
      instagramScopedUserId: input.instagramScopedUserId,
    },
  };

  const pricing = campaignToPricing(campaign);
  const evaluation = evaluateProposal({
    pricing,
    metrics: {
      followerCount: profile.followerCount,
      engagementRate: profile.engagementRate,
    },
  });

  const draft = await prisma.proposalDraft.create({
    data: {
      campaignId: campaign.id,
      creatorHandle: profile.handle,
      creatorName: input.creatorName ?? null,
      creatorEmail: null,
      followerCount: profile.followerCount,
      engagementRate: profile.engagementRate,
      enrichmentProvider: profile.provider,
      enrichmentPayload:
        profile.raw == null
          ? Prisma.JsonNull
          : (profile.raw as Prisma.InputJsonValue),
      source: "INSTAGRAM_DM",
      expiresAt: new Date(Date.now() + DRAFT_TTL_MS),
    },
  });

  return {
    ok: true,
    draftId: draft.id,
    creatorHandle: profile.handle,
    metrics: {
      followerCount: profile.followerCount,
      engagementRate: profile.engagementRate,
    },
    gatekeeper: {
      matchTier: evaluation.matchTier,
      passedThresholds: evaluation.passedThresholds,
      failedFollowerThreshold: evaluation.failedFollowerThreshold,
      failedEngagementThreshold: evaluation.failedEngagementThreshold,
    },
  };
}

type DraftWithCampaign = NonNullable<
  Awaited<ReturnType<typeof loadActiveDraft>>
>;

async function loadActiveDraft(draftId: string) {
  const draft = await prisma.proposalDraft.findUnique({
    where: { id: draftId },
    include: { campaign: true },
  });
  return draft;
}

export type EstimateOutcome =
  | { ok: false; reason: "DRAFT_NOT_FOUND" | "DRAFT_EXPIRED" }
  | {
      ok: true;
      calculatedPayoutCents: number;
      formattedPayout: string;
      breakdown: PayoutBreakdown;
      formattedBreakdown: string;
      matchTier: MatchTier;
    };

function computeForDraft(draft: DraftWithCampaign, scope: RequestedScope) {
  const pricing = campaignToPricing(draft.campaign);
  const breakdown = calculateProposalPayoutBreakdown({
    pricing,
    followerCount: draft.followerCount,
    scope,
  });
  const calculatedPayoutCents = breakdown.totalCents;
  const evaluation = evaluateProposal({
    pricing,
    metrics: {
      followerCount: draft.followerCount,
      engagementRate: Number(draft.engagementRate),
    },
  });
  return {
    calculatedPayoutCents,
    formattedBreakdown: formatPayoutBreakdown(breakdown),
    breakdown,
    matchTier: evaluation.matchTier,
  };
}

export async function estimateProposal(
  draftId: string,
  scope: RequestedScope,
): Promise<EstimateOutcome> {
  const draft = await loadActiveDraft(draftId);
  if (!draft) return { ok: false, reason: "DRAFT_NOT_FOUND" };
  if (draft.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "DRAFT_EXPIRED" };
  }

  const { calculatedPayoutCents, breakdown, formattedBreakdown, matchTier } =
    computeForDraft(draft, scope);
  return {
    ok: true,
    calculatedPayoutCents,
    formattedPayout: formatCents(calculatedPayoutCents),
    breakdown,
    formattedBreakdown,
    matchTier,
  };
}

export type SubmitOutcome =
  | { ok: false; reason: "DRAFT_NOT_FOUND" | "DRAFT_EXPIRED" }
  | {
      ok: true;
      proposalId: string;
      calculatedPayoutCents: number;
      formattedPayout: string;
      breakdown: PayoutBreakdown;
      formattedBreakdown: string;
      matchTier: MatchTier;
    };

export async function submitProposal(
  draftId: string,
  scope: RequestedScope,
): Promise<SubmitOutcome> {
  const draft = await loadActiveDraft(draftId);
  if (!draft) return { ok: false, reason: "DRAFT_NOT_FOUND" };
  if (draft.expiresAt.getTime() <= Date.now()) {
    return { ok: false, reason: "DRAFT_EXPIRED" };
  }

  // Recalculate server-side from the persisted (trusted) draft metrics.
  const { calculatedPayoutCents, breakdown, formattedBreakdown, matchTier } =
    computeForDraft(draft, scope);

  const proposal = await prisma.proposal.create({
    data: {
      campaignId: draft.campaignId,
      creatorHandle: draft.creatorHandle,
      creatorName: draft.creatorName,
      creatorEmail: draft.creatorEmail,
      followerCount: draft.followerCount,
      engagementRate: draft.engagementRate,
      enrichmentProvider: draft.enrichmentProvider,
      enrichmentPayload:
        draft.enrichmentPayload == null
          ? Prisma.JsonNull
          : (draft.enrichmentPayload as Prisma.InputJsonValue),
      reelsCount: scope.reelsCount,
      storiesCount: scope.storiesCount,
      adUsageDays: scope.adUsageDays,
      calculatedPayoutCents,
      matchTier,
      events: {
        create: {
          type: "CREATED",
          metadata: {
            scope,
            calculatedPayoutCents,
          },
        },
      },
    },
  });

  return {
    ok: true,
    proposalId: proposal.id,
    calculatedPayoutCents,
    formattedPayout: formatCents(calculatedPayoutCents),
    breakdown,
    formattedBreakdown,
    matchTier,
  };
}
