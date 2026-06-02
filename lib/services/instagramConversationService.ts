/**
 * DM conversation state machine (PRD section 7).
 *
 * Drives a creator from a keyword match through scope collection to a submitted
 * Proposal, entirely in-thread. Reuses the existing draft/estimate/submit
 * services (PRD section 10) so pricing and gatekeeping match the web path.
 *
 * Concurrency: Instagram may deliver messages for one conversation concurrently
 * or out of order. Every transition is applied with a conditional update on
 * `(id, version)`; only the winner sends its outbound messages. New rows rely
 * on the `(brandId, igsid, campaignId)` unique key.
 */
import type { InstagramConversation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  estimateProposal,
  startDmProposalDraft,
  submitProposal,
} from "@/lib/services/proposalService";
import type { RequestedScope } from "@/lib/pricing/types";
import { hasCollabIntent, isStartKeyword, isStopKeyword } from "@/lib/instagram/intent";
import { renderTemplate, usageLabel } from "@/lib/instagram/templates";
import { sendDm } from "@/lib/instagram/messagingService";

export type InstagramConversationState =
  | "IDLE"
  | "NO_CAMPAIGN"
  | "WELCOME"
  | "ENRICHING"
  | "INELIGIBLE_OFFER"
  | "SCOPE_REELS"
  | "SCOPE_STORIES"
  | "SCOPE_USAGE"
  | "ESTIMATE_REVIEW"
  | "SUBMITTING"
  | "COMPLETED"
  | "STOPPED";

/** States that consume the creator's reply as flow input (not keyword detection). */
const ACTIVE_STATES = new Set<InstagramConversationState>([
  "WELCOME",
  "ENRICHING",
  "INELIGIBLE_OFFER",
  "SCOPE_REELS",
  "SCOPE_STORIES",
  "SCOPE_USAGE",
  "ESTIMATE_REVIEW",
  "SUBMITTING",
]);

/** Idle conversations expire after 24h (PRD section 7). */
const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;

export type InboundMessage = {
  brandId: string;
  instagramScopedUserId: string;
  text: string;
};

export type Sender = (
  brandId: string,
  instagramScopedUserId: string,
  text: string,
) => Promise<unknown>;

export type ProcessDeps = {
  /** Injectable for tests; defaults to the real Graph send. */
  send?: Sender;
};

type DraftScope = Partial<RequestedScope>;

function parseScopeCount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^[0-5]$/.test(trimmed)) return null;
  return Number(trimmed);
}

function parseUsageChoice(text: string): 0 | 30 | 90 | null {
  const trimmed = text.trim();
  if (trimmed === "1") return 0;
  if (trimmed === "2") return 30;
  if (trimmed === "3") return 90;
  return null;
}

async function getActiveCampaign(brandId: string) {
  return prisma.campaign.findFirst({ where: { brandId, isActive: true } });
}

/**
 * Apply a state transition with optimistic concurrency. Returns true if this
 * caller won the transition (and therefore should send its outbound messages).
 */
async function applyTransition(
  conversation: InstagramConversation,
  data: Parameters<typeof prisma.instagramConversation.update>[0]["data"],
): Promise<boolean> {
  const result = await prisma.instagramConversation.updateMany({
    where: { id: conversation.id, version: conversation.version },
    data: { ...data, version: { increment: 1 } },
  });
  return result.count === 1;
}

/** Entry point: process one inbound DM through the state machine. */
export async function processInboundMessage(
  event: InboundMessage,
  deps: ProcessDeps = {},
): Promise<void> {
  const send: Sender = deps.send ?? ((b, u, t) => sendDm(b, u, t));
  const { brandId, instagramScopedUserId, text } = event;

  const existing = await prisma.instagramConversation.findFirst({
    where: { brandId, instagramScopedUserId },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const expired =
    existing?.expiresAt != null && existing.expiresAt.getTime() <= now.getTime();
  const state = (existing?.state ?? "IDLE") as InstagramConversationState;
  const isActive = existing != null && !expired && ACTIVE_STATES.has(state);

  // STOP wins in any active (non-terminal) state.
  if (isActive && isStopKeyword(text)) {
    const won = await applyTransition(existing!, {
      state: "STOPPED",
      lastInboundAt: now,
    });
    if (won) await send(brandId, instagramScopedUserId, renderTemplate("stopped"));
    return;
  }

  // Mid-flow: route the reply to the state machine.
  if (isActive) {
    await advance(existing!, state, text, send);
    return;
  }

  // Not mid-flow: only react to a collab keyword (otherwise stay silent).
  if (!hasCollabIntent(text)) return;

  await startOrRestart(brandId, instagramScopedUserId, existing, expired, send);
}

async function startOrRestart(
  brandId: string,
  instagramScopedUserId: string,
  existing: InstagramConversation | null,
  expired: boolean,
  send: Sender,
): Promise<void> {
  const campaign = await getActiveCampaign(brandId);
  const now = new Date();

  // No active campaign: mirror the web NO_ACTIVE_CAMPAIGN outcome. Do not create
  // a draft/conversation — campaignId is required for a Proposal.
  if (!campaign) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    await send(
      brandId,
      instagramScopedUserId,
      renderTemplate("no_active_campaign", {
        brandName: brand?.companyName ?? "us",
      }),
    );
    return;
  }

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  const expiresAt = new Date(now.getTime() + CONVERSATION_TTL_MS);

  // Upsert keyed on the unique (brand, igsid, campaign) tuple so two concurrent
  // first-messages cannot create duplicate rows. Restart resets prior state.
  await prisma.instagramConversation.upsert({
    where: {
      brandId_instagramScopedUserId_campaignId: {
        brandId,
        instagramScopedUserId,
        campaignId: campaign.id,
      },
    },
    create: {
      brandId,
      campaignId: campaign.id,
      instagramScopedUserId,
      state: "WELCOME",
      lastInboundAt: now,
      expiresAt,
    },
    update: {
      state: "WELCOME",
      draftId: null,
      draftScope: undefined,
      draftMetrics: undefined,
      proposalId: null,
      lastInboundAt: now,
      expiresAt,
      version: { increment: 1 },
    },
  });

  void existing;
  void expired;

  await send(
    brandId,
    instagramScopedUserId,
    renderTemplate("welcome", {
      brandName: brand?.companyName ?? "the brand",
      campaignName: campaign.name,
    }),
  );
}

async function advance(
  conversation: InstagramConversation,
  state: InstagramConversationState,
  text: string,
  send: Sender,
): Promise<void> {
  const { brandId, instagramScopedUserId } = conversation;
  const now = new Date();

  switch (state) {
    case "WELCOME": {
      if (!isStartKeyword(text)) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("invalid_input", { hint: "Reply START to begin." }),
        );
        return;
      }
      await runEnrichment(conversation, send);
      return;
    }

    case "INELIGIBLE_OFFER": {
      if (text.trim().toLowerCase() === "submit") {
        const won = await applyTransition(conversation, {
          state: "SCOPE_REELS",
          lastInboundAt: now,
        });
        if (won) {
          await send(brandId, instagramScopedUserId, renderTemplate("ask_reels"));
        }
        return;
      }
      // Anything else: re-explain (STOP handled upstream).
      await send(
        brandId,
        instagramScopedUserId,
        renderTemplate("invalid_input", {
          hint: "Reply SUBMIT to save your details anyway, or STOP.",
        }),
      );
      return;
    }

    case "SCOPE_REELS": {
      const reels = parseScopeCount(text);
      if (reels === null) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("invalid_input", {
            hint: "How many Reels (0–5)? Reply with a number.",
          }),
        );
        return;
      }
      const scope: DraftScope = { reelsCount: reels };
      const won = await applyTransition(conversation, {
        state: "SCOPE_STORIES",
        draftScope: scope,
        lastInboundAt: now,
      });
      if (won) {
        await send(brandId, instagramScopedUserId, renderTemplate("ask_stories"));
      }
      return;
    }

    case "SCOPE_STORIES": {
      const stories = parseScopeCount(text);
      if (stories === null) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("invalid_input", {
            hint: "How many Stories (0–5)? Reply with a number.",
          }),
        );
        return;
      }
      const prior = (conversation.draftScope as DraftScope | null) ?? {};
      const reels = prior.reelsCount ?? 0;

      // Empty-scope guard (PRD section 7): never advance with 0 reels + 0 stories.
      if (reels + stories < 1) {
        const won = await applyTransition(conversation, {
          state: "SCOPE_REELS",
          draftScope: {},
          lastInboundAt: now,
        });
        if (won) {
          await send(
            brandId,
            instagramScopedUserId,
            "Please include at least one Reel or Story. How many Reels (0–5)?",
          );
        }
        return;
      }

      const scope: DraftScope = { reelsCount: reels, storiesCount: stories };
      const won = await applyTransition(conversation, {
        state: "SCOPE_USAGE",
        draftScope: scope,
        lastInboundAt: now,
      });
      if (won) {
        await send(brandId, instagramScopedUserId, renderTemplate("ask_usage"));
      }
      return;
    }

    case "SCOPE_USAGE": {
      const usage = parseUsageChoice(text);
      if (usage === null) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("invalid_input", {
            hint: "Usage rights: 1 = none, 2 = 30-day paid ads, 3 = 90-day paid ads.",
          }),
        );
        return;
      }
      const prior = (conversation.draftScope as DraftScope | null) ?? {};
      const scope: RequestedScope = {
        reelsCount: prior.reelsCount ?? 0,
        storiesCount: prior.storiesCount ?? 0,
        adUsageDays: usage,
      };

      if (!conversation.draftId) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("session_expired"),
        );
        return;
      }

      const estimate = await estimateProposal(conversation.draftId, scope);
      if (!estimate.ok) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("session_expired"),
        );
        return;
      }

      const won = await applyTransition(conversation, {
        state: "ESTIMATE_REVIEW",
        draftScope: scope,
        lastInboundAt: now,
      });
      if (won) {
        await send(
          brandId,
          instagramScopedUserId,
          renderTemplate("estimate", {
            estimate: estimate.formattedPayout,
            reels: scope.reelsCount,
            stories: scope.storiesCount,
            usage: usageLabel(scope.adUsageDays),
          }),
        );
      }
      return;
    }

    case "ESTIMATE_REVIEW": {
      const choice = text.trim().toLowerCase();
      if (choice === "edit") {
        const won = await applyTransition(conversation, {
          state: "SCOPE_REELS",
          draftScope: {},
          lastInboundAt: now,
        });
        if (won) {
          await send(brandId, instagramScopedUserId, renderTemplate("ask_reels"));
        }
        return;
      }
      if (choice === "submit") {
        await runSubmit(conversation, send);
        return;
      }
      await send(
        brandId,
        instagramScopedUserId,
        renderTemplate("invalid_input", {
          hint: "Reply SUBMIT to send to the brand, or EDIT to change.",
        }),
      );
      return;
    }

    default:
      // ENRICHING / SUBMITTING are transient; ignore stray input.
      return;
  }
}

/** WELCOME → enrich (synchronous mock) → SCOPE_REELS or INELIGIBLE_OFFER. */
async function runEnrichment(
  conversation: InstagramConversation,
  send: Sender,
): Promise<void> {
  const { brandId, instagramScopedUserId, campaignId } = conversation;
  const now = new Date();

  // Claim the enrichment step so only one concurrent reply runs it.
  const claimed = await applyTransition(conversation, {
    state: "ENRICHING",
    lastInboundAt: now,
  });
  if (!claimed) return;

  await send(brandId, instagramScopedUserId, renderTemplate("enriching"));

  const draft = await startDmProposalDraft({
    campaignId,
    instagramScopedUserId,
  });

  // Reload to get the bumped version for the next conditional update.
  const current = await prisma.instagramConversation.findUnique({
    where: { id: conversation.id },
  });
  if (!current) return;

  if (!draft.ok) {
    await send(brandId, instagramScopedUserId, renderTemplate("session_expired"));
    return;
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

  if (draft.gatekeeper.passedThresholds) {
    const won = await applyTransition(current, {
      state: "SCOPE_REELS",
      draftId: draft.draftId,
      draftMetrics: draft.metrics,
      draftScope: {},
    });
    if (won) {
      await send(brandId, instagramScopedUserId, renderTemplate("ask_reels"));
    }
    return;
  }

  const won = await applyTransition(current, {
    state: "INELIGIBLE_OFFER",
    draftId: draft.draftId,
    draftMetrics: draft.metrics,
    draftScope: {},
  });
  if (won) {
    await send(
      brandId,
      instagramScopedUserId,
      renderTemplate("ineligible", {
        minFollowers: campaign?.minFollowers ?? 0,
        minEngagement: campaign ? Number(campaign.minEngagementRate) : 0,
      }),
    );
  }
}

/** ESTIMATE_REVIEW + SUBMIT → create Proposal, tag DM source, summarize. */
async function runSubmit(
  conversation: InstagramConversation,
  send: Sender,
): Promise<void> {
  const { brandId, instagramScopedUserId } = conversation;
  const now = new Date();

  const scope = conversation.draftScope as RequestedScope | null;
  if (!conversation.draftId || !scope) {
    await send(brandId, instagramScopedUserId, renderTemplate("session_expired"));
    return;
  }

  // Claim the submit so a duplicate SUBMIT can't create two proposals.
  const claimed = await applyTransition(conversation, {
    state: "SUBMITTING",
    lastInboundAt: now,
  });
  if (!claimed) return;

  const result = await submitProposal(conversation.draftId, scope);
  if (!result.ok) {
    await send(brandId, instagramScopedUserId, renderTemplate("session_expired"));
    return;
  }

  // Tag the proposal as DM-sourced and link it back to the conversation.
  await prisma.proposal.update({
    where: { id: result.proposalId },
    data: {
      source: "INSTAGRAM_DM",
      instagramScopedUserId,
      events: { create: { type: "CONVERSATION_STARTED" } },
    },
  });

  await prisma.instagramConversation.update({
    where: { id: conversation.id },
    data: {
      state: "COMPLETED",
      proposalId: result.proposalId,
      lastOutboundAt: now,
    },
  });

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  const message =
    result.matchTier === "ARCHIVED"
      ? renderTemplate("submitted_archived", {
          brandName: brand?.companyName ?? "the brand",
        })
      : renderTemplate("submitted_qualified", {
          estimate: result.formattedPayout,
          brandName: brand?.companyName ?? "the brand",
        });

  await send(brandId, instagramScopedUserId, message);
  await prisma.proposalEvent.create({
    data: {
      proposalId: result.proposalId,
      type: "DM_SENT",
      metadata: { template: "submitted" },
    },
  });
}
