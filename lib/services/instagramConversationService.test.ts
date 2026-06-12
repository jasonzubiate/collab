import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * In-memory Prisma + proposalService mocks so we can drive the DM state machine
 * end-to-end without a database. Seed campaigns/brands via the exported store.
 */
const store = vi.hoisted(() => {
  type Row = Record<string, unknown> & { id: string };
  const campaigns = new Map<string, Row>();
  const brands = new Map<string, Row>();
  const proposals = new Map<string, Row>();
  const conversations: Row[] = [];
  const events: Row[] = [];
  let idSeq = 0;

  const applyData = (row: Row, data: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(data)) {
      if (key === "events" && value && typeof value === "object") {
        const create = (value as { create?: { type: string } }).create;
        if (create) {
          events.push({ id: `evt_${idSeq++}`, proposalId: row.id, ...create });
        }
        continue;
      }
      if (value && typeof value === "object" && "increment" in value) {
        row[key] = ((row[key] as number) ?? 0) + (value as { increment: number }).increment;
        continue;
      }
      row[key] = value as unknown;
    }
    row.updatedAt = new Date(Date.now() + idSeq++);
  };

  return { campaigns, brands, proposals, conversations, events, idSeq, applyData };
});

vi.mock("@/lib/prisma", () => {
  const { campaigns, brands, proposals, conversations, events, applyData } = store;
  let seq = 0;
  return {
    prisma: {
      campaign: {
        findFirst: async ({ where }: { where: { brandId: string; isActive?: boolean } }) =>
          [...campaigns.values()].find(
            (c) => c.brandId === where.brandId && (where.isActive ? c.isActive : true),
          ) ?? null,
        findUnique: async ({ where }: { where: { id: string } }) =>
          campaigns.get(where.id) ?? null,
      },
      brand: {
        findUnique: async ({ where }: { where: { id: string } }) =>
          brands.get(where.id) ?? null,
      },
      proposal: {
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = proposals.get(where.id) ?? { id: where.id };
          applyData(row, data);
          proposals.set(where.id, row);
          return row;
        },
      },
      proposalEvent: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `evt_${seq++}`, ...data } as { id: string };
          events.push(row);
          return row;
        },
      },
      instagramConversation: {
        findFirst: async ({
          where,
        }: {
          where: { brandId: string; instagramScopedUserId: string };
        }) =>
          conversations
            .filter(
              (c) =>
                c.brandId === where.brandId &&
                c.instagramScopedUserId === where.instagramScopedUserId,
            )
            .sort(
              (a, b) =>
                (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime(),
            )[0] ?? null,
        findUnique: async ({ where }: { where: { id: string } }) =>
          conversations.find((c) => c.id === where.id) ?? null,
        updateMany: async ({
          where,
          data,
        }: {
          where: { id: string; version: number };
          data: Record<string, unknown>;
        }) => {
          const row = conversations.find(
            (c) => c.id === where.id && c.version === where.version,
          );
          if (!row) return { count: 0 };
          applyData(row, data);
          return { count: 1 };
        },
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          const row = conversations.find((c) => c.id === where.id);
          if (row) applyData(row, data);
          return row;
        },
        upsert: async ({
          where,
          create,
          update,
        }: {
          where: { brandId_instagramScopedUserId_campaignId: Record<string, string> };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const key = where.brandId_instagramScopedUserId_campaignId;
          const existing = conversations.find(
            (c) =>
              c.brandId === key.brandId &&
              c.instagramScopedUserId === key.instagramScopedUserId &&
              c.campaignId === key.campaignId,
          );
          if (existing) {
            applyData(existing, update);
            return existing;
          }
          const row = {
            id: `conv_${seq++}`,
            version: 0,
            updatedAt: new Date(Date.now() + seq),
            ...create,
          } as { id: string };
          conversations.push(row);
          return row;
        },
      },
    },
  };
});

const startDmProposalDraftMock = vi.hoisted(() => vi.fn());
const estimateProposalMock = vi.hoisted(() => vi.fn());
const submitProposalMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/services/proposalService", () => ({
  startDmProposalDraft: startDmProposalDraftMock,
  estimateProposal: estimateProposalMock,
  submitProposal: submitProposalMock,
}));

vi.mock("@/lib/services/instagramConnectionService", () => ({
  getAccessToken: vi.fn(async () => null),
}));

import { processInboundMessage } from "./instagramConversationService";
import { Payload } from "@/lib/instagram/messageContent";

const BRAND_ID = "brand_1";
const CAMPAIGN_ID = "campaign_1";
const IGSID = "IGSID_123";

function seed() {
  store.campaigns.clear();
  store.brands.clear();
  store.proposals.clear();
  store.conversations.length = 0;
  store.events.length = 0;
  store.brands.set(BRAND_ID, { id: BRAND_ID, companyName: "Acme" });
  store.campaigns.set(CAMPAIGN_ID, {
    id: CAMPAIGN_ID,
    brandId: BRAND_ID,
    isActive: true,
    name: "Summer Launch",
    minFollowers: 10000,
    minEngagementRate: 2.0,
  });
}

const eligibleDraft = {
  ok: true,
  draftId: "draft_1",
  creatorHandle: "ig_abc",
  metrics: { followerCount: 50000, engagementRate: 4.2 },
  gatekeeper: {
    matchTier: "GREEN",
    passedThresholds: true,
    failedFollowerThreshold: false,
    failedEngagementThreshold: false,
  },
};

function makeSender() {
  const sent: string[] = [];
  const send = vi.fn(async (_b: string, _u: string, content: { text: string }) => {
    sent.push(content.text);
  });
  return { sent, send };
}

function conversation() {
  return store.conversations.find(
    (c) => c.brandId === BRAND_ID && c.instagramScopedUserId === IGSID,
  );
}

beforeEach(() => {
  seed();
  startDmProposalDraftMock.mockReset().mockResolvedValue(eligibleDraft);
  estimateProposalMock.mockReset().mockResolvedValue({
    ok: true,
    calculatedPayoutCents: 50000,
    formattedPayout: "$500.00",
    formattedBreakdown:
      "$500.00 base (50K followers) + $250.00 reel = $750.00",
    breakdown: {},
    matchTier: "GREEN",
  });
  submitProposalMock.mockReset().mockResolvedValue({
    ok: true,
    proposalId: "p1",
    calculatedPayoutCents: 50000,
    formattedPayout: "$500.00",
    formattedBreakdown:
      "$500.00 base (50K followers) + $250.00 reel = $750.00",
    breakdown: {},
    matchTier: "GREEN",
  });
});

async function deliver(text: string, send: ReturnType<typeof makeSender>["send"]) {
  await processInboundMessage(
    { brandId: BRAND_ID, instagramScopedUserId: IGSID, text },
    { send },
  );
}

async function deliverPayload(
  postbackPayload: string,
  send: ReturnType<typeof makeSender>["send"],
  text = postbackPayload,
) {
  await processInboundMessage(
    { brandId: BRAND_ID, instagramScopedUserId: IGSID, text, postbackPayload },
    { send },
  );
}

describe("DM conversation state machine", () => {
  it("stays silent on a non-keyword message", async () => {
    const { sent, send } = makeSender();
    await deliver("hey, love your posts", send);
    expect(sent).toHaveLength(0);
    expect(conversation()).toBeUndefined();
  });

  it("replies NO_CAMPAIGN when there is no active campaign", async () => {
    store.campaigns.get(CAMPAIGN_ID)!.isActive = false;
    const { sent, send } = makeSender();
    await deliver("collab?", send);
    expect(sent[0]).toContain("not accepting collab requests");
    expect(conversation()).toBeUndefined();
  });

  it("runs the happy path to a submitted INSTAGRAM_DM proposal", async () => {
    const { sent, send } = makeSender();

    await deliver("hey can we collab", send);
    expect(sent.at(-1)).toContain("automated");
    expect(conversation()!.state).toBe("WELCOME");

    await deliver("start", send);
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(conversation()!.draftId).toBe("draft_1");
    expect(sent.at(-1)).toContain("Reels");

    await deliver("2", send);
    expect(conversation()!.state).toBe("SCOPE_STORIES");

    await deliver("1", send);
    expect(conversation()!.state).toBe("SCOPE_USAGE");

    await deliver("2", send); // usage = 30 days
    expect(conversation()!.state).toBe("ESTIMATE_REVIEW");
    expect(sent.at(-1)).toContain("$500.00 base (50K followers)");

    await deliver("submit", send);
    expect(conversation()!.state).toBe("COMPLETED");
    expect(conversation()!.proposalId).toBe("p1");

    // Proposal tagged as DM-sourced with the IGSID.
    expect(submitProposalMock).toHaveBeenCalledWith("draft_1", {
      reelsCount: 2,
      storiesCount: 1,
      adUsageDays: 30,
    });
    const proposal = store.proposals.get("p1")!;
    expect(proposal.source).toBe("INSTAGRAM_DM");
    expect(proposal.instagramScopedUserId).toBe(IGSID);
    expect(sent.at(-1)).toContain("$500.00");
  });

  it("honors STOP mid-flow", async () => {
    const { sent, send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    await deliver("STOP", send);
    expect(conversation()!.state).toBe("STOPPED");
    expect(sent.at(-1)).toContain("won't send any more automated messages");
  });

  it("re-asks on the empty-scope guard (0 reels + 0 stories)", async () => {
    const { sent, send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    await deliver("0", send); // reels
    expect(conversation()!.state).toBe("SCOPE_STORIES");
    await deliver("0", send); // stories -> guard
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(sent.at(-1)).toContain("at least one Reel or Story");
  });

  it("offers submit-anyway for ineligible creators", async () => {
    startDmProposalDraftMock.mockResolvedValue({
      ...eligibleDraft,
      gatekeeper: {
        matchTier: "ARCHIVED",
        passedThresholds: false,
        failedFollowerThreshold: true,
        failedEngagementThreshold: false,
      },
    });
    const { sent, send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    expect(conversation()!.state).toBe("INELIGIBLE_OFFER");
    expect(sent.at(-1)).toContain("short");

    await deliver("submit", send);
    expect(conversation()!.state).toBe("SCOPE_REELS");
  });

  it("rejects invalid scope input without advancing", async () => {
    const { sent, send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    await deliver("nine", send);
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(sent.at(-1)).toContain("How many Reels");
  });

  it("routes a USAGE_30 quick-reply payload at SCOPE_USAGE → ESTIMATE_REVIEW", async () => {
    const { sent, send } = makeSender();
    await deliver("collab", send); // keyword intent creates the WELCOME conversation
    await deliverPayload(Payload.START, send, "Start"); // welcome → start via tap
    await deliverPayload("2", send); // reels via numeric chip
    await deliverPayload("1", send); // stories via numeric chip
    expect(conversation()!.state).toBe("SCOPE_USAGE");

    await deliverPayload(Payload.USAGE_30, send, "30-day");
    expect(conversation()!.state).toBe("ESTIMATE_REVIEW");
    expect(estimateProposalMock).toHaveBeenCalledWith("draft_1", {
      reelsCount: 2,
      storiesCount: 1,
      adUsageDays: 30,
    });
    expect(sent.at(-1)).toContain("$500.00 base (50K followers)");
  });

  it("still drives the plain numeric path (regression)", async () => {
    const { sent, send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    await deliver("2", send);
    await deliver("1", send);
    await deliver("2", send); // usage = 30
    expect(conversation()!.state).toBe("ESTIMATE_REVIEW");
    expect(sent.at(-1)).toContain("$500.00 base (50K followers)");
  });

  it("completes via a SUBMIT postback at ESTIMATE_REVIEW", async () => {
    const { send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    await deliver("2", send);
    await deliver("1", send);
    await deliver("2", send);
    expect(conversation()!.state).toBe("ESTIMATE_REVIEW");

    await deliverPayload(Payload.SUBMIT, send, "Submit");
    expect(conversation()!.state).toBe("COMPLETED");
    expect(conversation()!.proposalId).toBe("p1");
  });

  it("honors a STOP payload mid-flow", async () => {
    const { sent, send } = makeSender();
    await deliver("collab", send);
    await deliver("start", send);
    await deliverPayload(Payload.STOP, send, "Stop");
    expect(conversation()!.state).toBe("STOPPED");
    expect(sent.at(-1)).toContain("won't send any more automated messages");
  });
});

describe("DM free-text scope parsing (Phase B)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  type ParsedScope = {
    reelsCount: number | null;
    storiesCount: number | null;
    adUsageDays: 0 | 30 | 90 | null;
    confidence: number;
    needsClarification: boolean;
  };

  const fullScope: ParsedScope = {
    reelsCount: 2,
    storiesCount: 1,
    adUsageDays: 30,
    confidence: 0.9,
    needsClarification: false,
  };

  async function deliverParsed(
    text: string,
    send: ReturnType<typeof makeSender>["send"],
    parseScope: (msg: string) => Promise<ParsedScope>,
  ) {
    await processInboundMessage(
      { brandId: BRAND_ID, instagramScopedUserId: IGSID, text },
      { send, parseScope },
    );
  }

  async function reachScopeReels(
    send: ReturnType<typeof makeSender>["send"],
    parseScope: (msg: string) => Promise<ParsedScope>,
  ) {
    await deliverParsed("collab", send, parseScope);
    await deliverParsed("start", send, parseScope);
    expect(conversation()!.state).toBe("SCOPE_REELS");
  }

  it("routes a confident full free-text parse to SCOPE_CONFIRM then CONFIRM → ESTIMATE_REVIEW", async () => {
    vi.stubEnv("IG_LLM_SCOPE_ENABLED", "1");
    const { sent, send } = makeSender();
    const parseScope = vi.fn(async () => fullScope);

    await reachScopeReels(send, parseScope);

    await deliverParsed("2 reels and a story, 30-day usage", send, parseScope);
    expect(parseScope).toHaveBeenCalledTimes(1);
    expect(conversation()!.state).toBe("SCOPE_CONFIRM");
    expect(conversation()!.draftScope).toEqual({
      reelsCount: 2,
      storiesCount: 1,
      adUsageDays: 30,
    });
    expect(conversation()!.lastParseSource).toBe("llm");
    expect(sent.at(-1)).toContain("CONFIRM");

    await deliverParsed("confirm", send, parseScope);
    expect(conversation()!.state).toBe("ESTIMATE_REVIEW");
    expect(estimateProposalMock).toHaveBeenCalledWith("draft_1", {
      reelsCount: 2,
      storiesCount: 1,
      adUsageDays: 30,
    });
    expect(sent.at(-1)).toContain("$500.00 base (50K followers)");
  });

  it("supports a CONFIRM postback from SCOPE_CONFIRM", async () => {
    vi.stubEnv("IG_LLM_SCOPE_ENABLED", "1");
    const { send } = makeSender();
    const parseScope = vi.fn(async () => fullScope);
    await reachScopeReels(send, parseScope);
    await deliverParsed("two reels and a story for 30 days", send, parseScope);
    expect(conversation()!.state).toBe("SCOPE_CONFIRM");

    await processInboundMessage(
      {
        brandId: BRAND_ID,
        instagramScopedUserId: IGSID,
        text: "Confirm",
        postbackPayload: Payload.CONFIRM,
      },
      { send, parseScope },
    );
    expect(conversation()!.state).toBe("ESTIMATE_REVIEW");
  });

  it("EDIT from SCOPE_CONFIRM returns to the numeric SCOPE_REELS prompt", async () => {
    vi.stubEnv("IG_LLM_SCOPE_ENABLED", "1");
    const { sent, send } = makeSender();
    const parseScope = vi.fn(async () => fullScope);
    await reachScopeReels(send, parseScope);
    await deliverParsed("2 reels and a story for 30 days", send, parseScope);
    expect(conversation()!.state).toBe("SCOPE_CONFIRM");

    await deliverParsed("edit", send, parseScope);
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(sent.at(-1)).toContain("How many Reels");
    expect(estimateProposalMock).not.toHaveBeenCalled();
  });

  it("falls back to the numeric prompt on a low-confidence parse", async () => {
    vi.stubEnv("IG_LLM_SCOPE_ENABLED", "1");
    const { sent, send } = makeSender();
    const parseScope = vi.fn(async () => ({
      reelsCount: null,
      storiesCount: null,
      adUsageDays: null,
      confidence: 0,
      needsClarification: true,
    }));
    await reachScopeReels(send, parseScope);

    await deliverParsed("uhh maybe some stuff?", send, parseScope);
    expect(parseScope).toHaveBeenCalledTimes(1);
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(sent.at(-1)).toContain("How many Reels");
  });

  it("never prices an empty (0,0) LLM scope — falls back to numeric", async () => {
    vi.stubEnv("IG_LLM_SCOPE_ENABLED", "1");
    const { send } = makeSender();
    const parseScope = vi.fn(async () => ({
      reelsCount: 0,
      storiesCount: 0,
      adUsageDays: 30 as const,
      confidence: 0.95,
      needsClarification: false,
    }));
    await reachScopeReels(send, parseScope);

    await deliverParsed("no reels and no stories with 30 day usage", send, parseScope);
    // scopeSchema's empty-scope guard rejects: stay on numeric collection.
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(estimateProposalMock).not.toHaveBeenCalled();
  });

  it("with the flag OFF, free text is treated numerically and the parser is never called", async () => {
    const { sent, send } = makeSender();
    const parseScope = vi.fn(async () => fullScope);
    await reachScopeReels(send, parseScope);

    await deliverParsed("2 reels and a story, 30-day usage", send, parseScope);
    expect(parseScope).not.toHaveBeenCalled();
    expect(conversation()!.state).toBe("SCOPE_REELS");
    expect(sent.at(-1)).toContain("How many Reels");
  });

  it("with the flag ON, a bare numeric reply still uses the numeric path (no parse)", async () => {
    vi.stubEnv("IG_LLM_SCOPE_ENABLED", "1");
    const { send } = makeSender();
    const parseScope = vi.fn(async () => fullScope);
    await reachScopeReels(send, parseScope);

    await deliverParsed("2", send, parseScope);
    expect(parseScope).not.toHaveBeenCalled();
    expect(conversation()!.state).toBe("SCOPE_STORIES");
  });
});
