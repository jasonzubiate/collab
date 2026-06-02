import type { Prisma, Proposal, ProposalEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isWithinMessagingWindow,
  sendDm,
} from "@/lib/instagram/messagingService";
import { decToNum } from "./campaignService";
import type {
  ProposalFilters,
  UpdateProposalInput,
} from "@/lib/validation/proposalSchemas";

type ProposalWithCampaign = Proposal & {
  campaign: { id: string; name: string };
};

export function serializeProposal(
  proposal: ProposalWithCampaign & { events?: ProposalEvent[] },
) {
  return {
    id: proposal.id,
    campaign: proposal.campaign,
    source: proposal.source,
    instagramScopedUserId: proposal.instagramScopedUserId,
    creatorHandle: proposal.creatorHandle,
    creatorName: proposal.creatorName,
    creatorEmail: proposal.creatorEmail,
    followerCount: proposal.followerCount,
    engagementRate: decToNum(proposal.engagementRate),
    reelsCount: proposal.reelsCount,
    storiesCount: proposal.storiesCount,
    adUsageDays: proposal.adUsageDays,
    calculatedPayoutCents: proposal.calculatedPayoutCents,
    matchTier: proposal.matchTier,
    workflowStatus: proposal.workflowStatus,
    contactedAt: proposal.contactedAt?.toISOString() ?? null,
    approvedAt: proposal.approvedAt?.toISOString() ?? null,
    rejectedAt: proposal.rejectedAt?.toISOString() ?? null,
    adminNotes: proposal.adminNotes,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    events: proposal.events?.map((event) => ({
      id: event.id,
      type: event.type,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export type SerializedProposal = ReturnType<typeof serializeProposal>;

export function buildProposalWhere(
  brandId: string,
  filters: ProposalFilters,
): Prisma.ProposalWhereInput {
  const where: Prisma.ProposalWhereInput = {
    campaign: { brandId },
  };

  if (filters.matchTier) where.matchTier = filters.matchTier;
  if (filters.workflowStatus) where.workflowStatus = filters.workflowStatus;
  if (filters.campaignId) where.campaignId = filters.campaignId;

  if (filters.q) {
    where.OR = [
      { creatorHandle: { contains: filters.q, mode: "insensitive" } },
      { creatorEmail: { contains: filters.q, mode: "insensitive" } },
      { creatorName: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  return where;
}

export async function listProposals(
  brandId: string,
  filters: ProposalFilters,
) {
  const proposals = await prisma.proposal.findMany({
    where: buildProposalWhere(brandId, filters),
    include: { campaign: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return proposals.map((p) => serializeProposal(p));
}

export async function getProposal(brandId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, campaign: { brandId } },
    include: {
      campaign: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!proposal) return null;
  return serializeProposal(proposal);
}

async function ownsProposal(brandId: string, proposalId: string) {
  const found = await prisma.proposal.findFirst({
    where: { id: proposalId, campaign: { brandId } },
    select: { id: true, workflowStatus: true, matchTier: true },
  });
  return found;
}

export async function updateProposal(
  brandId: string,
  proposalId: string,
  input: UpdateProposalInput,
) {
  const current = await ownsProposal(brandId, proposalId);
  if (!current) return { error: "NOT_FOUND" } as const;

  const data: Prisma.ProposalUpdateInput = {};
  if (input.matchTier !== undefined) data.matchTier = input.matchTier;
  if (input.adminNotes !== undefined) data.adminNotes = input.adminNotes;

  if (input.workflowStatus !== undefined) {
    data.workflowStatus = input.workflowStatus;
    if (input.workflowStatus === "CONTACTED") data.contactedAt = new Date();
    if (input.workflowStatus === "APPROVED") data.approvedAt = new Date();
    if (input.workflowStatus === "REJECTED") data.rejectedAt = new Date();
  }

  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      ...data,
      events: {
        create: {
          type: "STATUS_CHANGED",
          metadata: {
            from: {
              workflowStatus: current.workflowStatus,
              matchTier: current.matchTier,
            },
            to: {
              workflowStatus: input.workflowStatus ?? current.workflowStatus,
              matchTier: input.matchTier ?? current.matchTier,
            },
          },
        },
      },
    },
    include: { campaign: { select: { id: true, name: true } } },
  });

  return { proposal: serializeProposal(proposal) };
}

type WorkflowAction = "approve" | "reject" | "mark-contacted";

const actionConfig: Record<
  WorkflowAction,
  {
    status: "APPROVED" | "REJECTED" | "CONTACTED";
    timestampField: "approvedAt" | "rejectedAt" | "contactedAt";
    eventType: "APPROVED" | "REJECTED" | "CONTACTED";
  }
> = {
  approve: {
    status: "APPROVED",
    timestampField: "approvedAt",
    eventType: "APPROVED",
  },
  reject: {
    status: "REJECTED",
    timestampField: "rejectedAt",
    eventType: "REJECTED",
  },
  "mark-contacted": {
    status: "CONTACTED",
    timestampField: "contactedAt",
    eventType: "CONTACTED",
  },
};

export async function applyWorkflowAction(
  brandId: string,
  proposalId: string,
  action: WorkflowAction,
) {
  const current = await ownsProposal(brandId, proposalId);
  if (!current) return { error: "NOT_FOUND" } as const;

  const cfg = actionConfig[action];
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      workflowStatus: cfg.status,
      [cfg.timestampField]: new Date(),
      events: { create: { type: cfg.eventType } },
    },
    include: { campaign: { select: { id: true, name: true } } },
  });

  return { proposal: serializeProposal(proposal) };
}

export async function buildEmailIntent(brandId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, campaign: { brandId } },
    include: { campaign: { select: { id: true, name: true } } },
  });
  if (!proposal) return { error: "NOT_FOUND" } as const;
  if (!proposal.creatorEmail) return { error: "NO_EMAIL" } as const;

  const subject = `Collab opportunity: ${proposal.campaign.name}`;
  const body = `Hi ${proposal.creatorName ?? proposal.creatorHandle},\n\nThanks for your interest in ${proposal.campaign.name}. We'd love to chat about working together.\n`;
  const mailto = `mailto:${proposal.creatorEmail}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  await prisma.proposalEvent.create({
    data: { proposalId, type: "EMAIL_OPENED", metadata: { subject } },
  });

  return { mailto, creatorEmail: proposal.creatorEmail };
}

export type SendInstagramReplyResult =
  | { ok: true }
  | {
      ok: false;
      reason: "NOT_FOUND" | "NO_IGSID" | "WINDOW_CLOSED" | "SEND_FAILED";
      message: string;
    };

/** Send an admin-composed DM to the proposal's creator via Instagram. */
export async function sendInstagramReply(
  brandId: string,
  proposalId: string,
  text: string,
): Promise<SendInstagramReplyResult> {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, campaign: { brandId } },
    select: { id: true, instagramScopedUserId: true },
  });
  if (!proposal) {
    return { ok: false, reason: "NOT_FOUND", message: "Proposal not found." };
  }
  if (!proposal.instagramScopedUserId) {
    return {
      ok: false,
      reason: "NO_IGSID",
      message: "This proposal has no Instagram contact.",
    };
  }

  // Enforce Meta's 24h standard messaging window using the conversation's last
  // inbound timestamp (PRD section 11). Outside the window, sends are blocked.
  const conversation = await prisma.instagramConversation.findFirst({
    where: { brandId, instagramScopedUserId: proposal.instagramScopedUserId },
    orderBy: { lastInboundAt: "desc" },
    select: { lastInboundAt: true },
  });
  if (!isWithinMessagingWindow(conversation?.lastInboundAt ?? null)) {
    return {
      ok: false,
      reason: "WINDOW_CLOSED",
      message:
        "The 24-hour messaging window has closed. The creator must message again first.",
    };
  }

  const result = await sendDm(brandId, proposal.instagramScopedUserId, text);
  if (!result.ok) {
    return { ok: false, reason: "SEND_FAILED", message: result.error };
  }

  await prisma.proposalEvent.create({
    data: {
      proposalId,
      type: "INSTAGRAM_REPLY",
      metadata: { messageId: result.messageId, text },
    },
  });

  return { ok: true };
}
