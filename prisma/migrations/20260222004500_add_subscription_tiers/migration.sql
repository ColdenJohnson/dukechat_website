-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('PRO', 'GROWTH', 'SCALE');

-- AlterEnum
ALTER TYPE "CreditTransactionType" ADD VALUE IF NOT EXISTS 'PLAN_PURCHASE';

-- AlterTable
ALTER TABLE "portal_users"
ADD COLUMN "current_plan" "PlanTier",
ADD COLUMN "available_credits_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lifetime_credits_cents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "credit_transactions"
ADD COLUMN "plan_tier" "PlanTier",
ADD COLUMN "credits_added_cents" INTEGER NOT NULL DEFAULT 0;
