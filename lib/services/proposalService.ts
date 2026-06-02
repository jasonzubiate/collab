import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateProposalPayout } from "@/lib/pricing/calculateProposalPayout";
import { evaluateProposal } from "@/lib/pricing/evaluateProposal";
import type { MatchTier, RequestedScope } from "@/lib/pricing/types";
import { formatCents } from "@/lib/money";
import { getEnrichmentProvider } from "@/lib/enrichment";
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
      matchTier: MatchTier;
    };

function computeForDraft(draft: DraftWithCampaign, scope: RequestedScope) {
  const pricing = campaignToPricing(draft.campaign);
  const calculatedPayoutCents = calculateProposalPayout({
    pricing,
    followerCount: draft.followerCount,
    scope,
  });
  const evaluation = evaluateProposal({
    pricing,
    metrics: {
      followerCount: draft.followerCount,
      engagementRate: Number(draft.engagementRate),
    },
  });
  return { calculatedPayoutCents, matchTier: evaluation.matchTier };
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

  const { calculatedPayoutCents, matchTier } = computeForDraft(draft, scope);
  return {
    ok: true,
    calculatedPayoutCents,
    formattedPayout: formatCents(calculatedPayoutCents),
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
  const { calculatedPayoutCents, matchTier } = computeForDraft(draft, scope);

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
    matchTier,
  };
}
