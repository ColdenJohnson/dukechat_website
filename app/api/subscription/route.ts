import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { CREDIT_PLANS } from '@/lib/plans';
import { getDashboardData, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);
  const dashboard = await getDashboardData(user.email);

  return NextResponse.json({
    ok: true,
    subscription: {
      status: 'active',
      currentPlan: planTierToLabel(dashboard?.user.currentPlan),
      availableCreditsCents: dashboard?.user.availableCreditsCents ?? 0,
      lifetimeCreditsCents: dashboard?.user.lifetimeCreditsCents ?? 0,
      monthlyBudgetCents: dashboard?.user.monthlyBudgetCents ?? 0,
      monthlySpentCents: dashboard?.user.monthlySpentCents ?? 0,
      purchaseOptions: CREDIT_PLANS.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceUsd: plan.priceUsd,
        includedCreditsUsd: plan.includedCreditsUsd
      }))
    }
  });
}
