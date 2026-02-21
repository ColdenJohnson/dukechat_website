import { prisma } from '@/lib/prisma';
import type { PortalSessionUser } from '@/lib/auth';

const DEFAULT_MONTHLY_BUDGET_CENTS = 0;
const MAX_TRANSACTIONS_TO_SHOW = 10;

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function upsertPortalUser(sessionUser: PortalSessionUser) {
  return prisma.portalUser.upsert({
    where: { email: sessionUser.email },
    create: {
      email: sessionUser.email,
      descopeSub: sessionUser.descopeSub,
      displayName: sessionUser.displayName,
      monthlyBudgetCents: DEFAULT_MONTHLY_BUDGET_CENTS,
      monthlySpentCents: 0
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

export async function addMockCredits(email: string, amountCents: number) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.portalUser.upsert({
      where: { email },
      create: {
        email,
        monthlyBudgetCents: amountCents,
        monthlySpentCents: 0
      },
      update: {
        monthlyBudgetCents: {
          increment: amountCents
        }
      }
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userEmail: email,
        amountCents,
        type: 'MOCK_PURCHASE',
        note: `Mock purchase of ${formatUsd(amountCents)}.`
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
    source: 'dukechat-portal-stub',
    note: 'LiteLLM sync is not yet implemented; this payload is returned for verification only.'
  };
}
