-- CreateEnum
CREATE TYPE "ProposalSource" AS ENUM ('WEB', 'INSTAGRAM_DM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProposalEventType" ADD VALUE 'DM_SENT';
ALTER TYPE "ProposalEventType" ADD VALUE 'DM_RECEIVED';
ALTER TYPE "ProposalEventType" ADD VALUE 'INSTAGRAM_REPLY';
ALTER TYPE "ProposalEventType" ADD VALUE 'CONVERSATION_STARTED';

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "instagramScopedUserId" TEXT,
ADD COLUMN     "source" "ProposalSource" NOT NULL DEFAULT 'WEB',
ALTER COLUMN "creatorEmail" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProposalDraft" ADD COLUMN     "source" "ProposalSource" NOT NULL DEFAULT 'WEB',
ALTER COLUMN "creatorEmail" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InstagramConnection" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "igUsername" TEXT,
    "accessTokenEnc" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "webhookSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramConversation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "instagramScopedUserId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "draftMetrics" JSONB,
    "draftScope" JSONB,
    "draftId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "lastInboundAt" TIMESTAMP(3) NOT NULL,
    "lastOutboundAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "proposalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConnection_brandId_key" ON "InstagramConnection"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConnection_igUserId_key" ON "InstagramConnection"("igUserId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConversation_proposalId_key" ON "InstagramConversation"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConversation_brandId_instagramScopedUserId_campaig_key" ON "InstagramConversation"("brandId", "instagramScopedUserId", "campaignId");

-- AddForeignKey
ALTER TABLE "InstagramConnection" ADD CONSTRAINT "InstagramConnection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramConversation" ADD CONSTRAINT "InstagramConversation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramConversation" ADD CONSTRAINT "InstagramConversation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramConversation" ADD CONSTRAINT "InstagramConversation_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
