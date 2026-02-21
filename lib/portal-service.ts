import { PlanTier } from '@prisma/client';

import type { PortalSessionUser } from '@/lib/auth';
import type { CreditPlan } from '@/lib/plans';
import { centsFromUsd } from '@/lib/plans';
import { prisma } from '@/lib/prisma';

const DEFAULT_MONTHLY_BUDGET_CENTS = 0;
const MAX_TRANSACTIONS_TO_SHOW = 20;

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function planTierToLabel(tier: PlanTier | null | undefined): string {
  if (!tier) {
    return 'No active tier';
  }

  if (tier === PlanTier.PRO) {
    return 'Pro';
  }

  if (tier === PlanTier.GROWTH) {
    return 'Growth';
  }

  return 'Scale';
}

export async function upsertPortalUser(sessionUser: PortalSessionUser) {
  return prisma.portalUser.upsert({
    where: { email: sessionUser.email },
    create: {
      email: sessionUser.email,
      descopeSub: sessionUser.descopeSub,
      displayName: sessionUser.displayName,
      monthlyBudgetCents: DEFAULT_MONTHLY_BUDGET_CENTS,
      monthlySpentCents: 0,
      availableCreditsCents: 0,
      lifetimeCreditsCents: 0
    },
    update: {
      descopeSub: sessionUser.descopeSub ?? undefined,
      displayName: sessionUser.displayName ?? undefined
    }
  });
}

export async function getDashboardData(email: string) {
  const user = await prisma.portalUser.findUnique({
    where: { email },
    include: {
      creditTransactions: {
        orderBy: { createdAt: 'desc' },
        take: MAX_TRANSACTIONS_TO_SHOW
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    user,
    remainingCents: Math.max(user.monthlyBudgetCents - user.monthlySpentCents, 0)
  };
}

export async function buyTierCredits(email: string, plan: CreditPlan) {
  const priceCents = centsFromUsd(plan.priceUsd);
  const creditsCents = centsFromUsd(plan.includedCreditsUsd);

  return prisma.$transaction(async (tx) => {
    const user = await tx.portalUser.upsert({
      where: { email },
      create: {
        email,
        currentPlan: plan.tier,
        monthlyBudgetCents: creditsCents,
        monthlySpentCents: 0,
        availableCreditsCents: creditsCents,
        lifetimeCreditsCents: creditsCents
      },
      update: {
        currentPlan: plan.tier,
        monthlyBudgetCents: {
          increment: creditsCents
        },
        availableCreditsCents: {
          increment: creditsCents
        },
        lifetimeCreditsCents: {
          increment: creditsCents
        }
      }
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userEmail: email,
        amountCents: priceCents,
        creditsAddedCents: creditsCents,
        type: 'PLAN_PURCHASE',
        planTier: plan.tier,
        note: `${plan.name} tier credits purchase.`
      }
    });

    return { user, transaction };
  });
}

export async function buildLiteLLMSyncPayload(email: string) {
  const user = await prisma.portalUser.findUnique({ where: { email } });

  if (!user) {
    return null;
  }

  return {
    customer: user.email,
    monthly_budget_usd: Number((user.monthlyBudgetCents / 100).toFixed(2)),
    monthly_spent_usd: Number((user.monthlySpentCents / 100).toFixed(2)),
    source: 'dukechat-portal',
    note: 'Set to real sync in next pass by wiring LiteLLM admin endpoint.'
  };
}
