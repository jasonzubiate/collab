import { prisma } from "@/lib/prisma";
import { decToNum } from "./campaignService";

export type CreatorProposalSummary = {
  id: string;
  brandName: string;
  campaignName: string;
  source: "WEB" | "INSTAGRAM_DM";
  creatorHandle: string;
  calculatedPayoutCents: number;
  matchTier: "GREEN" | "YELLOW" | "ARCHIVED";
  workflowStatus: "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  instagramScopedUserId: string | null;
  brandSlug: string;
  instagramUsername: string | null;
  activity: CreatorProposalActivity[];
};

export type CreatorProposalActivity = {
  id: string;
  type: string;
  label: string;
  preview: string | null;
  createdAt: string;
};

const activityLabels: Record<string, string> = {
  CREATED: "Request submitted",
  CONTACTED: "Brand marked you as contacted",
  APPROVED: "Request approved",
  REJECTED: "Request declined",
  STATUS_CHANGED: "Status updated",
  DM_SENT: "Brand sent a message",
  DM_RECEIVED: "You sent a message",
  INSTAGRAM_REPLY: "Brand replied in Instagram",
  CONVERSATION_STARTED: "Instagram conversation started",
  EMAIL_OPENED: "Email opened",
  EXPORTED: "Exported by brand",
};

function activityPreview(
  type: string,
  metadata: unknown,
): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const data = metadata as Record<string, unknown>;
  if (typeof data.text === "string") return data.text;
  if (typeof data.template === "string") return `Template: ${data.template}`;
  if (typeof data.messageId === "string") return "Message delivered";
  return null;
}

export async function listCreatorProposals(
  creatorUserId: string,
): Promise<CreatorProposalSummary[]> {
  const proposals = await prisma.proposal.findMany({
    where: { creatorUserId },
    include: {
      campaign: {
        select: {
          name: true,
          brand: {
            select: {
              companyName: true,
              slug: true,
              instagramConnection: { select: { igUsername: true } },
            },
          },
        },
      },
      events: { orderBy: { createdAt: "desc" } },
      instagramConversation: {
        select: {
          lastInboundAt: true,
          lastOutboundAt: true,
          state: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return proposals.map((proposal) => {
    const events: CreatorProposalActivity[] = proposal.events.map((event) => ({
      id: event.id,
      type: event.type,
      label: activityLabels[event.type] ?? event.type,
      preview: activityPreview(event.type, event.metadata),
      createdAt: event.createdAt.toISOString(),
    }));

    if (proposal.source === "INSTAGRAM_DM" && proposal.instagramConversation) {
      const conv = proposal.instagramConversation;
      if (conv.lastOutboundAt) {
        events.unshift({
          id: `${proposal.id}-outbound`,
          type: "DM_THREAD",
          label: "Latest brand message",
          preview: "Check Instagram DMs for the full thread",
          createdAt: conv.lastOutboundAt.toISOString(),
        });
      }
      if (conv.lastInboundAt) {
        events.unshift({
          id: `${proposal.id}-inbound`,
          type: "DM_THREAD",
          label: "Your last message",
          preview: "Conversation active in Instagram",
          createdAt: conv.lastInboundAt.toISOString(),
        });
      }
    }

    events.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      id: proposal.id,
      brandName: proposal.campaign.brand.companyName,
      campaignName: proposal.campaign.name,
      source: proposal.source,
      creatorHandle: proposal.creatorHandle,
      calculatedPayoutCents: proposal.calculatedPayoutCents,
      matchTier: proposal.matchTier,
      workflowStatus: proposal.workflowStatus,
      createdAt: proposal.createdAt.toISOString(),
      instagramScopedUserId: proposal.instagramScopedUserId,
      brandSlug: proposal.campaign.brand.slug,
      instagramUsername:
        proposal.campaign.brand.instagramConnection?.igUsername ?? null,
      activity: events,
    };
  });
}

export async function getCreatorProfile(userId: string) {
  return prisma.creatorProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { email: true, name: true, emailVerified: true } },
    },
  });
}
