import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getDashboardData, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);
  const data = await getDashboardData(user.email);

  return NextResponse.json({
    ok: true,
    dashboard: {
      email: data?.user.email ?? user.email,
      currentPlan: planTierToLabel(data?.user.currentPlan),
      availableCreditsCents: data?.user.availableCreditsCents ?? 0,
      lifetimeCreditsCents: data?.user.lifetimeCreditsCents ?? 0,
      monthlyBudgetCents: data?.user.monthlyBudgetCents ?? 0,
      monthlySpentCents: data?.user.monthlySpentCents ?? 0,
      remainingCents: data?.remainingCents ?? 0,
      transactions: (data?.user.creditTransactions ?? []).map((transaction) => ({
        id: transaction.id,
        amountCents: transaction.amountCents,
        creditsAddedCents: transaction.creditsAddedCents,
        planTier: transaction.planTier,
        type: transaction.type,
        note: transaction.note,
        createdAt: transaction.createdAt.toISOString()
      }))
    }
  });
}
