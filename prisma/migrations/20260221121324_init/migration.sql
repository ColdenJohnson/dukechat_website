-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('MOCK_PURCHASE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "portal_users" (
    "email" TEXT NOT NULL,
    "descope_sub" TEXT,
    "display_name" TEXT,
    "monthly_budget_cents" INTEGER NOT NULL DEFAULT 0,
    "monthly_spent_cents" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_users_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_transactions_user_email_idx" ON "credit_transactions"("user_email");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "portal_users"("email") ON DELETE CASCADE ON UPDATE CASCADE;
