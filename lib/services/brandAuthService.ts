import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils/slug";
import type { BrandSignupInput } from "@/lib/validation/authSchemas";

async function uniqueBrandSlug(base: string): Promise<string> {
  const root = slugify(base) || "brand";
  let slug = root;
  let suffix = 0;

  while (await prisma.brand.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${root}-${suffix}`;
  }

  return slug;
}

export type RegisterBrandResult =
  | { ok: true; brandId: string; userId: string }
  | { ok: false; error: string };

export async function registerBrand(
  input: BrandSignupInput,
): Promise<RegisterBrandResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const slug = await uniqueBrandSlug(input.companyName);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const brand = await tx.brand.create({
      data: {
        companyName: input.companyName.trim(),
        slug,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash,
        userType: "BRAND",
        brandId: brand.id,
        emailVerified: new Date(),
      },
    });

    return { brandId: brand.id, userId: user.id };
  });

  return { ok: true, ...result };
}
