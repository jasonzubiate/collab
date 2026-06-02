import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    proposal: {
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { linkCreatorProposals } from "@/lib/services/linkCreatorProposals";

describe("linkCreatorProposals", () => {
  beforeEach(() => {
    vi.mocked(prisma.proposal.updateMany).mockReset();
    vi.mocked(prisma.proposal.updateMany).mockResolvedValue({ count: 2 });
  });

  it("links by normalized email", async () => {
    const count = await linkCreatorProposals({
      userId: "user-1",
      email: "Maya@Example.com",
    });

    expect(count).toBe(2);
    expect(prisma.proposal.updateMany).toHaveBeenCalledWith({
      where: {
        creatorUserId: null,
        OR: [
          {
            creatorEmail: {
              equals: "maya@example.com",
              mode: "insensitive",
            },
          },
        ],
      },
      data: { creatorUserId: "user-1" },
    });
  });

  it("skips placeholder instagram emails", async () => {
    vi.mocked(prisma.proposal.updateMany).mockResolvedValue({ count: 0 });
    await linkCreatorProposals({
      userId: "user-1",
      email: "ig-123@creators.collab.local",
      instagramScopedUserId: "ig-123",
    });

    expect(prisma.proposal.updateMany).toHaveBeenCalledWith({
      where: {
        creatorUserId: null,
        OR: [{ instagramScopedUserId: "ig-123" }],
      },
      data: { creatorUserId: "user-1" },
    });
  });
});
