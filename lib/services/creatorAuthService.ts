import { randomBytes } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { linkCreatorProposals } from "@/lib/services/linkCreatorProposals";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TOKEN_TTL_MS = 5 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

export async function createCreatorMagicLinkToken(email: string): Promise<{
  token: string;
  verifyUrl: string;
}> {
  const normalized = normalizeEmail(email);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + MAGIC_LINK_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalized },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalized,
      token,
      expires,
    },
  });

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return {
    token,
    verifyUrl: `${baseUrl}/api/auth/creator/verify?token=${token}`,
  };
}

export async function verifyCreatorMagicLinkToken(
  token: string,
): Promise<{ user: User; sessionToken: string } | null> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
    }
    return null;
  }

  const email = normalizeEmail(record.identifier);
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        userType: "CREATOR",
        emailVerified: new Date(),
      },
    });
  } else if (user.userType !== "CREATOR") {
    return null;
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  await linkCreatorProposals({ userId: user.id, email: user.email });
  await prisma.verificationToken.delete({ where: { id: record.id } });

  const sessionToken = await createCreatorSessionToken(user.id);
  return { user, sessionToken };
}

export async function createCreatorSessionToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TOKEN_TTL_MS);

  await prisma.verificationToken.create({
    data: {
      identifier: `session:${userId}`,
      token,
      expires,
      userId,
    },
  });

  return token;
}

export async function consumeCreatorSessionToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: { include: { creatorProfile: true } } },
  });

  if (!record?.user || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { id: record.id } });
    }
    return null;
  }

  if (record.user.userType !== "CREATOR") {
    await prisma.verificationToken.delete({ where: { id: record.id } });
    return null;
  }

  await prisma.verificationToken.delete({ where: { id: record.id } });
  return record.user;
}

export type CreatorInstagramProfile = {
  igUserId: string;
  username: string | null;
};

export async function findOrCreateCreatorFromInstagram(
  profile: CreatorInstagramProfile,
): Promise<{ user: User; sessionToken: string }> {
  const handle = profile.username ? normalizeHandle(profile.username) : null;

  const existingProfile = await prisma.creatorProfile.findUnique({
    where: { instagramScopedUserId: profile.igUserId },
    include: { user: true },
  });

  if (existingProfile) {
    await linkCreatorProposals({
      userId: existingProfile.userId,
      instagramScopedUserId: profile.igUserId,
      instagramHandle: handle ?? undefined,
    });
    const sessionToken = await createCreatorSessionToken(existingProfile.userId);
    return { user: existingProfile.user, sessionToken };
  }

  const placeholderEmail = `ig-${profile.igUserId}@creators.collab.local`;
  let user = await prisma.user.findUnique({ where: { email: placeholderEmail } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: placeholderEmail,
        userType: "CREATOR",
        emailVerified: new Date(),
        creatorProfile: {
          create: {
            instagramScopedUserId: profile.igUserId,
            instagramHandle: handle,
          },
        },
      },
    });
  } else {
    await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        instagramScopedUserId: profile.igUserId,
        instagramHandle: handle,
      },
      update: {
        instagramScopedUserId: profile.igUserId,
        instagramHandle: handle,
      },
    });
  }

  await linkCreatorProposals({
    userId: user.id,
    instagramScopedUserId: profile.igUserId,
    instagramHandle: handle ?? undefined,
  });

  const sessionToken = await createCreatorSessionToken(user.id);
  return { user, sessionToken };
}

export async function linkInstagramToCreatorUser(
  userId: string,
  profile: CreatorInstagramProfile,
): Promise<void> {
  const handle = profile.username ? normalizeHandle(profile.username) : null;

  await prisma.creatorProfile.upsert({
    where: { userId },
    create: {
      userId,
      instagramScopedUserId: profile.igUserId,
      instagramHandle: handle,
    },
    update: {
      instagramScopedUserId: profile.igUserId,
      instagramHandle: handle,
    },
  });

  await linkCreatorProposals({
    userId,
    instagramScopedUserId: profile.igUserId,
    instagramHandle: handle ?? undefined,
  });
}
