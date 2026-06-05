import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { linkCreatorProposals } from "@/lib/services/linkCreatorProposals";

export type GoogleProfile = {
  email: string;
  name?: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type GoogleAuthResult =
  | { ok: true; user: User }
  | { ok: false; error: "WRONG_ACCOUNT_TYPE" };

/**
 * Resolve a brand account from a verified Google profile.
 *
 * New brands are created without a `Brand` row (brandId stays null) and are
 * sent through `/brand/onboarding` to supply a company name. Existing accounts
 * registered with a different user type are rejected to avoid silently
 * converting a creator into a brand.
 */
export async function findOrCreateBrandFromGoogle(
  profile: GoogleProfile,
): Promise<GoogleAuthResult> {
  const email = normalizeEmail(profile.email);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.userType !== "BRAND") {
      return { ok: false, error: "WRONG_ACCOUNT_TYPE" };
    }
    return { ok: true, user: existing };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: profile.name?.trim() || null,
      userType: "BRAND",
      emailVerified: new Date(),
    },
  });

  return { ok: true, user };
}

/**
 * Resolve a creator account from a verified Google profile. Mirrors the email
 * magic-link flow: find-or-create by email, mark verified, and link any
 * proposals that were submitted with this email.
 */
export async function findOrCreateCreatorFromGoogle(
  profile: GoogleProfile,
): Promise<GoogleAuthResult> {
  const email = normalizeEmail(profile.email);
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.userType !== "CREATOR") {
      return { ok: false, error: "WRONG_ACCOUNT_TYPE" };
    }
    if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: profile.name?.trim() || null,
        userType: "CREATOR",
        emailVerified: new Date(),
      },
    });
  }

  await linkCreatorProposals({ userId: user.id, email: user.email });

  return { ok: true, user };
}
