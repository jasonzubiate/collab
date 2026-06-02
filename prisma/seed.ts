import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { calculateProposalPayout } from "../lib/pricing/calculateProposalPayout";
import { evaluateProposal } from "../lib/pricing/evaluateProposal";
import type {
  CampaignPricing,
  UsageDays,
} from "../lib/pricing/types";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "password123";

const sampleCreators: {
  handle: string;
  name: string;
  email: string;
  followerCount: number;
  engagementRate: number;
  scope: { reelsCount: number; storiesCount: number; adUsageDays: UsageDays };
  workflowStatus?: "NEW" | "CONTACTED" | "APPROVED" | "REJECTED";
}[] = [
  {
    handle: "stylebymaya",
    name: "Maya Okafor",
    email: "maya@example.com",
    followerCount: 85_000,
    engagementRate: 4.2,
    scope: { reelsCount: 2, storiesCount: 3, adUsageDays: 30 },
    workflowStatus: "CONTACTED",
  },
  {
    handle: "fitwithleo",
    name: "Leo Marsh",
    email: "leo@example.com",
    followerCount: 120_000,
    engagementRate: 3.8,
    scope: { reelsCount: 1, storiesCount: 2, adUsageDays: 90 },
    workflowStatus: "APPROVED",
  },
  {
    handle: "cafecorner",
    name: "Priya Nair",
    email: "priya@example.com",
    followerCount: 32_000,
    engagementRate: 2.4,
    scope: { reelsCount: 1, storiesCount: 1, adUsageDays: 0 },
  },
  {
    handle: "wanderlustkat",
    name: "Kat Lindqvist",
    email: "kat@example.com",
    followerCount: 54_000,
    engagementRate: 2.9,
    scope: { reelsCount: 2, storiesCount: 0, adUsageDays: 30 },
  },
  {
    handle: "tinytownsoaps",
    name: "Devon Reyes",
    email: "devon@example.com",
    followerCount: 6_500,
    engagementRate: 5.1,
    scope: { reelsCount: 1, storiesCount: 0, adUsageDays: 0 },
  },
  {
    handle: "dailydoodles",
    name: "Sam Park",
    email: "sam@example.com",
    followerCount: 45_000,
    engagementRate: 1.4,
    scope: { reelsCount: 0, storiesCount: 2, adUsageDays: 0 },
  },
];

async function main() {
  const brand = await prisma.brand.upsert({
    where: { slug: "example-studio" },
    update: {},
    create: { companyName: "Example Studio", slug: "example-studio" },
  });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, brandId: brand.id },
    create: {
      email: ADMIN_EMAIL,
      name: "Studio Admin",
      passwordHash,
      brandId: brand.id,
    },
  });

  const campaignValues = {
    name: "Summer Creator Collabs",
    isActive: true,
    minFollowers: 10_000,
    minEngagementRate: 2.0,
    baseRatePer10kCents: 10_000,
    ratePerReelCents: 25_000,
    ratePerStoryCents: 7_500,
    adUsage30DayMultiplier: 1.2,
    adUsage90DayMultiplier: 1.4,
  };

  const campaign = await prisma.campaign.upsert({
    where: {
      brandId_slug: { brandId: brand.id, slug: "summer-creator-collabs" },
    },
    update: campaignValues,
    create: {
      brandId: brand.id,
      slug: "summer-creator-collabs",
      ...campaignValues,
    },
  });

  const pricing: CampaignPricing = {
    minFollowers: campaignValues.minFollowers,
    minEngagementRate: campaignValues.minEngagementRate,
    baseRatePer10kCents: campaignValues.baseRatePer10kCents,
    ratePerReelCents: campaignValues.ratePerReelCents,
    ratePerStoryCents: campaignValues.ratePerStoryCents,
    adUsage30DayMultiplier: campaignValues.adUsage30DayMultiplier,
    adUsage90DayMultiplier: campaignValues.adUsage90DayMultiplier,
  };

  // Reset sample proposals for an idempotent demo dataset.
  await prisma.proposalEvent.deleteMany({
    where: { proposal: { campaignId: campaign.id } },
  });
  await prisma.proposal.deleteMany({ where: { campaignId: campaign.id } });

  for (const creator of sampleCreators) {
    const { matchTier } = evaluateProposal({
      pricing,
      metrics: {
        followerCount: creator.followerCount,
        engagementRate: creator.engagementRate,
      },
    });
    const calculatedPayoutCents = calculateProposalPayout({
      pricing,
      followerCount: creator.followerCount,
      scope: creator.scope,
    });

    await prisma.proposal.create({
      data: {
        campaignId: campaign.id,
        creatorHandle: creator.handle,
        creatorName: creator.name,
        creatorEmail: creator.email,
        followerCount: creator.followerCount,
        engagementRate: creator.engagementRate,
        enrichmentProvider: "mock",
        reelsCount: creator.scope.reelsCount,
        storiesCount: creator.scope.storiesCount,
        adUsageDays: creator.scope.adUsageDays,
        calculatedPayoutCents,
        matchTier,
        workflowStatus: creator.workflowStatus ?? "NEW",
        contactedAt:
          creator.workflowStatus === "CONTACTED" ||
          creator.workflowStatus === "APPROVED"
            ? new Date()
            : null,
        approvedAt: creator.workflowStatus === "APPROVED" ? new Date() : null,
        events: { create: { type: "CREATED" } },
      },
    });
  }

  console.log(
    `Seeded brand "${brand.companyName}", admin ${ADMIN_EMAIL}, campaign "${campaign.name}", and ${sampleCreators.length} sample proposals.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
