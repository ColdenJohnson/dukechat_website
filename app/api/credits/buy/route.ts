import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { findCreditPlan } from '@/lib/plans';
import { buyTierCredits, formatUsd, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const plan = findCreditPlan(body.planId);

  if (!plan) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Invalid planId. Expected one of: pro, growth, scale.'
      },
      { status: 400 }
    );
  }

  const result = await buyTierCredits(user.email, plan);

  return NextResponse.json({
    ok: true,
    message: `Purchased ${plan.name} tier (${formatUsd(result.transaction.amountCents)}) and added ${formatUsd(result.transaction.creditsAddedCents)} credits.`,
    purchase: {
      planId: plan.id,
      planName: plan.name,
      planTier: planTierToLabel(result.user.currentPlan),
      amountCents: result.transaction.amountCents,
      creditsAddedCents: result.transaction.creditsAddedCents,
      transactionId: result.transaction.id
    },
    user: {
      email: result.user.email,
      currentPlan: result.user.currentPlan,
      availableCreditsCents: result.user.availableCreditsCents,
      lifetimeCreditsCents: result.user.lifetimeCreditsCents,
      monthlyBudgetCents: result.user.monthlyBudgetCents,
      monthlySpentCents: result.user.monthlySpentCents
    }
  });
}
