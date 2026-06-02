import { prisma } from "@/lib/prisma";

type LinkCreatorProposalsInput = {
  userId: string;
  email?: string;
  instagramScopedUserId?: string;
  instagramHandle?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

/**
 * Attach existing proposals to a creator account by email, Instagram scoped ID,
 * or normalized handle. Idempotent — safe to call on every login.
 */
export async function linkCreatorProposals(
  input: LinkCreatorProposalsInput,
): Promise<number> {
  const or: Array<Record<string, unknown>> = [];

  if (input.email && !input.email.endsWith("@creators.collab.local")) {
    or.push({
      creatorEmail: { equals: normalizeEmail(input.email), mode: "insensitive" },
    });
  }

  if (input.instagramScopedUserId) {
    or.push({ instagramScopedUserId: input.instagramScopedUserId });
  }

  if (input.instagramHandle) {
    or.push({
      creatorHandle: {
        equals: normalizeHandle(input.instagramHandle),
        mode: "insensitive",
      },
    });
  }

  if (or.length === 0) return 0;

  const result = await prisma.proposal.updateMany({
    where: {
      creatorUserId: null,
      OR: or,
    },
    data: { creatorUserId: input.userId },
  });

  return result.count;
}
