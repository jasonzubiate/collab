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
import { buildMessage, usageLabel } from "@/lib/instagram/templates";
import {
  buildCreatorIdentityVars,
  buildIdentityVarsFromDraftMetrics,
  type DraftMetricsSnapshot,
} from "@/lib/instagram/templateVars";
import { Payload } from "@/lib/instagram/messageContent";
import type { OutboundMessage } from "@/lib/instagram/messageContent";
import { fetchScopedUserProfile } from "@/lib/instagram/graphClient";
import { normalizeHandle } from "@/lib/instagram/identity";
import { sendDmRich } from "@/lib/instagram/messagingService";
import { getAccessToken } from "@/lib/services/instagramConnectionService";
import { llmScopeEnabled } from "@/lib/instagram/config";
import { getScopeParser } from "@/lib/scopeParser";
import type { ParsedScope } from "@/lib/scopeParser";
import { scopeSchema } from "@/lib/validation/proposalSchemas";

export type InstagramConversationState =
  | "IDLE"
  | "NO_CAMPAIGN"
  | "WELCOME"
  | "ENRICHING"
  | "INELIGIBLE_OFFER"
  | "SCOPE_REELS"
  | "SCOPE_STORIES"
  | "SCOPE_USAGE"
  | "SCOPE_CONFIRM"
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
  "SCOPE_CONFIRM",
  "ESTIMATE_REVIEW",
  "SUBMITTING",
]);

/** Idle conversations expire after 24h (PRD section 7). */
const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;

export type InboundMessage = {
  brandId: string;
  instagramScopedUserId: string;
  text: string;
  /** Canonical payload from a quick-reply tap or button postback, if any. */
  postbackPayload?: string;
};

export type Sender = (
  brandId: string,
  instagramScopedUserId: string,
  content: OutboundMessage,
) => Promise<unknown>;

/** Free-text scope extractor. Injectable for tests; never throws (see provider). */
export type ScopeParseFn = (message: string) => Promise<ParsedScope>;

export type ProcessDeps = {
  /** Injectable for tests; defaults to the real Graph send. */
  send?: Sender;
  /** Injectable for tests; defaults to the configured scope-parser provider. */
  parseScope?: ScopeParseFn;
};

type DraftScope = Partial<RequestedScope>;

function askReelsMessage(conversation: InstagramConversation): OutboundMessage {
  const identity = buildIdentityVarsFromDraftMetrics(
    conversation.draftMetrics as DraftMetricsSnapshot | null,
  );
  return buildMessage("ask_reels", { creatorGreeting: identity.creatorGreeting });
}

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

/**
 * Normalize a quick-reply / button payload into the same canonical text token
 * the typed-reply parsers already understand, so tap and type paths route
 * identically. When no payload is present (a plain typed reply), the original
 * text is returned unchanged — preserving the existing numeric/keyword flow.
 */
function interpret(
  _state: InstagramConversationState,
  text: string,
  postbackPayload?: string,
): string {
  if (!postbackPayload) return text;
  switch (postbackPayload) {
    case Payload.START:
      return "start";
    case Payload.STOP:
      return "stop";
    case Payload.USAGE_NONE:
      return "1";
    case Payload.USAGE_30:
      return "2";
    case Payload.USAGE_90:
      return "3";
    case Payload.SUBMIT:
    case Payload.SUBMIT_ANYWAY:
      return "submit";
    case Payload.EDIT:
      return "edit";
    case Payload.CONFIRM:
      return "confirm";
    default:
      // Numeric scope payloads ("0".."5") pass through as the count string.
      return /^[0-5]$/.test(postbackPayload) ? postbackPayload : text;
  }
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
  const send: Sender = deps.send ?? ((b, u, c) => sendDmRich(b, u, c));
  const parseScope: ScopeParseFn =
    deps.parseScope ?? ((m) => getScopeParser().parse(m));
  const { brandId, instagramScopedUserId, text, postbackPayload } = event;

  const existing = await prisma.instagramConversation.findFirst({
    where: { brandId, instagramScopedUserId },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const expired =
    existing?.expiresAt != null && existing.expiresAt.getTime() <= now.getTime();
  const state = (existing?.state ?? "IDLE") as InstagramConversationState;
  const isActive = existing != null && !expired && ACTIVE_STATES.has(state);

  // Route taps and typed replies through the same canonical token.
  const effectiveText = interpret(state, text, postbackPayload);

  // STOP wins in any active (non-terminal) state.
  if (isActive && isStopKeyword(effectiveText)) {
    const won = await applyTransition(existing!, {
      state: "STOPPED",
      lastInboundAt: now,
    });
    if (won) await send(brandId, instagramScopedUserId, buildMessage("stopped"));
    return;
  }

  // Mid-flow: route the reply to the state machine.
  if (isActive) {
    await advance(existing!, state, effectiveText, send, parseScope);
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
      buildMessage("no_active_campaign", {
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
    buildMessage("welcome", {
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
  parseScope: ScopeParseFn,
): Promise<void> {
  const { brandId, instagramScopedUserId } = conversation;
  const now = new Date();

  switch (state) {
    case "WELCOME": {
      if (!isStartKeyword(text)) {
        await send(
          brandId,
          instagramScopedUserId,
          buildMessage("invalid_input", { hint: "Reply START to begin." }),
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
          await send(brandId, instagramScopedUserId, askReelsMessage(conversation));
        }
        return;
      }
      // Anything else: re-explain (STOP handled upstream).
      await send(
        brandId,
        instagramScopedUserId,
        buildMessage("invalid_input", {
          hint: "Reply SUBMIT to save your details anyway, or STOP.",
        }),
      );
      return;
    }

    case "SCOPE_REELS": {
      // Phase B (opt-in): if the reply is free-form (NOT a bare 0-5 number and
      // NOT a known postback payload, which `interpret()` would have collapsed
      // to a token), attempt an LLM free-text parse. A confident, full, valid
      // scope jumps to SCOPE_CONFIRM; anything else falls through to the
      // deterministic numeric prompt below so the creator is never blocked.
      if (llmScopeEnabled() && parseScopeCount(text) === null) {
        const handled = await tryFreeTextScope(
          conversation,
          text,
          send,
          parseScope,
        );
        if (handled) return;
      }

      const reels = parseScopeCount(text);
      if (reels === null) {
        await send(
          brandId,
          instagramScopedUserId,
          buildMessage("invalid_input", {
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
        lastParseSource: "numeric",
      });
      if (won) {
        await send(brandId, instagramScopedUserId, buildMessage("ask_stories"));
      }
      return;
    }

    case "SCOPE_STORIES": {
      const stories = parseScopeCount(text);
      if (stories === null) {
        await send(
          brandId,
          instagramScopedUserId,
          buildMessage("invalid_input", {
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
          await send(brandId, instagramScopedUserId, {
            text: "Please include at least one Reel or Story. How many Reels (0–5)?",
          });
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
        await send(brandId, instagramScopedUserId, buildMessage("ask_usage"));
      }
      return;
    }

    case "SCOPE_USAGE": {
      const usage = parseUsageChoice(text);
      if (usage === null) {
        await send(
          brandId,
          instagramScopedUserId,
          buildMessage("invalid_input", {
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

      await runEstimate(conversation, scope, send);
      return;
    }

    case "SCOPE_CONFIRM": {
      const choice = text.trim().toLowerCase();
      if (choice === "edit") {
        const won = await applyTransition(conversation, {
          state: "SCOPE_REELS",
          draftScope: {},
          lastInboundAt: now,
        });
        if (won) {
          await send(brandId, instagramScopedUserId, askReelsMessage(conversation));
        }
        return;
      }
      if (choice === "confirm") {
        // The scope was already validated by scopeSchema before we stored it;
        // runEstimate re-validates it once more before any pricing call.
        const scope = conversation.draftScope as RequestedScope | null;
        if (!scope) {
          await send(
            brandId,
            instagramScopedUserId,
            buildMessage("session_expired"),
          );
          return;
        }
        await runEstimate(conversation, scope, send);
        return;
      }
      // Anything else: re-echo the parsed scope and ask to confirm (STOP is
      // handled upstream). Never advance on an ambiguous reply.
      const scope = conversation.draftScope as RequestedScope | null;
      if (scope) {
        await send(
          brandId,
          instagramScopedUserId,
          buildMessage("scope_confirm", {
            reels: scope.reelsCount,
            stories: scope.storiesCount,
            usage: usageLabel(scope.adUsageDays),
          }),
        );
      } else {
        await send(
          brandId,
          instagramScopedUserId,
          buildMessage("invalid_input", {
            hint: "Reply CONFIRM to price it, or EDIT to change.",
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
          await send(brandId, instagramScopedUserId, askReelsMessage(conversation));
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
        buildMessage("invalid_input", {
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

/**
 * Run the deterministic estimate for a fully-specified scope and advance to
 * ESTIMATE_REVIEW. This is the SINGLE money path for both the numeric flow and
 * the LLM-confirmed flow: the scope is re-validated by the app's `scopeSchema`
 * (the final authority — not the parser's own schema) before `estimateProposal`
 * is called, and all pricing stays inside `lib/pricing/*`.
 */
async function runEstimate(
  conversation: InstagramConversation,
  scope: RequestedScope,
  send: Sender,
): Promise<void> {
  const { brandId, instagramScopedUserId } = conversation;
  const now = new Date();

  if (!conversation.draftId) {
    await send(brandId, instagramScopedUserId, buildMessage("session_expired"));
    return;
  }

  // Final, authoritative validation (incl. the reels+stories>=1 empty-scope
  // guard) before any pricing. An LLM can never bypass this.
  const validated = scopeSchema.safeParse(scope);
  if (!validated.success) {
    await send(
      brandId,
      instagramScopedUserId,
      buildMessage("invalid_input", {
        hint: "How many Reels (0–5)? Reply with a number.",
      }),
    );
    return;
  }
  const safeScope = validated.data;

  const campaign = await prisma.campaign.findUnique({
    where: { id: conversation.campaignId },
    include: { brand: true },
  });

  const estimate = await estimateProposal(conversation.draftId, safeScope);
  if (!estimate.ok) {
    await send(brandId, instagramScopedUserId, buildMessage("session_expired"));
    return;
  }

  const won = await applyTransition(conversation, {
    state: "ESTIMATE_REVIEW",
    draftScope: safeScope,
    lastInboundAt: now,
  });
  if (won) {
    await send(
      brandId,
      instagramScopedUserId,
      buildMessage("estimate", {
        breakdown: estimate.formattedBreakdown,
        estimate: estimate.formattedPayout,
        campaignName: campaign?.name ?? "this campaign",
        brandName: campaign?.brand?.companyName ?? "the brand",
        ...buildIdentityVarsFromDraftMetrics(
          conversation.draftMetrics as DraftMetricsSnapshot | null,
        ),
      }),
    );
  }
}

/**
 * Phase B LLM alternate path. Attempts to extract a full scope from free text.
 * Returns true only when it has handled the message (transitioned to
 * SCOPE_CONFIRM, or lost the optimistic-concurrency race). Returns false when
 * the parse is low-confidence/partial/invalid so the caller falls back to the
 * deterministic numeric prompt — the creator is never blocked by a bad parse.
 *
 * The parser ONLY extracts slots; it computes no money. The candidate scope is
 * re-validated by `scopeSchema` here before we even echo it for confirmation,
 * and again by `runEstimate` before pricing.
 */
async function tryFreeTextScope(
  conversation: InstagramConversation,
  text: string,
  send: Sender,
  parseScope: ScopeParseFn,
): Promise<boolean> {
  const { brandId, instagramScopedUserId } = conversation;
  const parsed = await parseScope(text);

  // Require a confident, complete extraction before we trust it enough to echo.
  if (parsed.needsClarification || parsed.confidence < 0.8) return false;
  if (
    parsed.reelsCount === null ||
    parsed.storiesCount === null ||
    parsed.adUsageDays === null
  ) {
    return false;
  }

  const validated = scopeSchema.safeParse({
    reelsCount: parsed.reelsCount,
    storiesCount: parsed.storiesCount,
    adUsageDays: parsed.adUsageDays,
  });
  // Fails the empty-scope guard / range checks → fall back to numeric prompts.
  if (!validated.success) return false;
  const safeScope = validated.data;

  const won = await applyTransition(conversation, {
    state: "SCOPE_CONFIRM",
    draftScope: safeScope,
    lastInboundAt: new Date(),
    lastParseConfidence: parsed.confidence,
    lastParseSource: "llm",
  });
  if (won) {
    await send(
      brandId,
      instagramScopedUserId,
      buildMessage("scope_confirm", {
        reels: safeScope.reelsCount,
        stories: safeScope.storiesCount,
        usage: usageLabel(safeScope.adUsageDays),
      }),
    );
  }
  return true;
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

  await send(brandId, instagramScopedUserId, buildMessage("enriching"));

  let creatorHandle: string | null = null;
  let creatorName: string | null = null;
  let followerCount: number | null = null;
  const accessToken = await getAccessToken(brandId);
  if (accessToken) {
    try {
      const igProfile = await fetchScopedUserProfile(
        accessToken,
        instagramScopedUserId,
      );
      creatorHandle = igProfile.username
        ? normalizeHandle(igProfile.username)
        : null;
      creatorName = igProfile.name;
      followerCount = igProfile.followerCount;
    } catch {
      // Fall back to pseudo-handle enrichment when profile lookup is blocked.
    }
  }

  const draft = await startDmProposalDraft({
    campaignId,
    instagramScopedUserId,
    creatorHandle,
    creatorName,
    followerCount,
  });

  // Reload to get the bumped version for the next conditional update.
  const current = await prisma.instagramConversation.findUnique({
    where: { id: conversation.id },
  });
  if (!current) return;

  if (!draft.ok) {
    await send(brandId, instagramScopedUserId, buildMessage("session_expired"));
    return;
  }

  const graphResolved = creatorHandle != null || followerCount != null;
  const enrichmentProvider = graphResolved ? "instagram_graph" : "mock";
  const identityVars = buildCreatorIdentityVars({
    creatorHandle: draft.creatorHandle,
    enrichmentProvider,
    followerCount: draft.metrics.followerCount,
  });
  const draftMetrics: DraftMetricsSnapshot = {
    followerCount: draft.metrics.followerCount,
    engagementRate: draft.metrics.engagementRate,
    creatorHandle: draft.creatorHandle,
    isVerifiedIdentity: identityVars.isVerifiedIdentity,
    enrichmentProvider,
  };

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

  if (draft.gatekeeper.passedThresholds) {
    const won = await applyTransition(current, {
      state: "SCOPE_REELS",
      draftId: draft.draftId,
      draftMetrics,
      draftScope: {},
    });
    if (won) {
      await send(brandId, instagramScopedUserId, buildMessage("ask_reels", {
        creatorGreeting: identityVars.creatorGreeting,
      }));
    }
    return;
  }

  const won = await applyTransition(current, {
    state: "INELIGIBLE_OFFER",
    draftId: draft.draftId,
    draftMetrics,
    draftScope: {},
  });
  if (won) {
    await send(
      brandId,
      instagramScopedUserId,
      buildMessage("ineligible", {
        campaignName: campaign?.name ?? "this campaign",
        creatorGreeting: identityVars.creatorGreeting,
        failedFollowerThreshold: draft.gatekeeper.failedFollowerThreshold,
        failedEngagementThreshold: draft.gatekeeper.failedEngagementThreshold,
        followerCount: draft.metrics.followerCount,
        engagementRate: draft.metrics.engagementRate,
        minFollowers: campaign?.minFollowers ?? 0,
        minEngagementRate: campaign ? Number(campaign.minEngagementRate) : 0,
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
    await send(brandId, instagramScopedUserId, buildMessage("session_expired"));
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
    await send(brandId, instagramScopedUserId, buildMessage("session_expired"));
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
  const identity = buildIdentityVarsFromDraftMetrics(
    conversation.draftMetrics as DraftMetricsSnapshot | null,
  );
  const message =
    result.matchTier === "ARCHIVED"
      ? buildMessage("submitted_archived", {
          brandName: brand?.companyName ?? "the brand",
        })
      : buildMessage("submitted_qualified", {
          estimate: result.formattedPayout,
          brandName: brand?.companyName ?? "the brand",
          creatorGreeting: identity.creatorGreeting,
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
