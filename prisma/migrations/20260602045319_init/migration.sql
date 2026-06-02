-- CreateEnum
CREATE TYPE "MatchTier" AS ENUM ('GREEN', 'YELLOW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('NEW', 'CONTACTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProposalEventType" AS ENUM ('CREATED', 'CONTACTED', 'APPROVED', 'REJECTED', 'STATUS_CHANGED', 'EMAIL_OPENED', 'EXPORTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "instagramBusinessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "minFollowers" INTEGER NOT NULL,
    "minEngagementRate" DECIMAL(5,2) NOT NULL,
    "baseRatePer10kCents" INTEGER NOT NULL,
    "ratePerReelCents" INTEGER NOT NULL,
    "ratePerStoryCents" INTEGER NOT NULL,
    "adUsage30DayMultiplier" DECIMAL(5,2) NOT NULL,
    "adUsage90DayMultiplier" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalDraft" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorHandle" TEXT NOT NULL,
    "creatorName" TEXT,
    "creatorEmail" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL,
    "engagementRate" DECIMAL(5,2) NOT NULL,
    "enrichmentProvider" TEXT NOT NULL DEFAULT 'mock',
    "enrichmentPayload" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorHandle" TEXT NOT NULL,
    "creatorName" TEXT,
    "creatorEmail" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL,
    "engagementRate" DECIMAL(5,2) NOT NULL,
    "enrichmentProvider" TEXT NOT NULL DEFAULT 'mock',
    "enrichmentPayload" JSONB,
    "reelsCount" INTEGER NOT NULL,
    "storiesCount" INTEGER NOT NULL,
    "adUsageDays" INTEGER NOT NULL,
    "calculatedPayoutCents" INTEGER NOT NULL,
    "matchTier" "MatchTier" NOT NULL,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'NEW',
    "contactedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalEvent" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "type" "ProposalEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_instagramBusinessId_key" ON "Brand"("instagramBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_brandId_slug_key" ON "Campaign"("brandId", "slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalDraft" ADD CONSTRAINT "ProposalDraft_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalEvent" ADD CONSTRAINT "ProposalEvent_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
