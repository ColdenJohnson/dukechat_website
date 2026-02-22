import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getUserUsage, isLiteLLMConfigError, syncUserCreditLimit } from '@/lib/litellm';
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
  const creditLimitUsd = Number((result.user.monthlyBudgetCents / 100).toFixed(2));

  try {
    const syncResult = await syncUserCreditLimit(user.email, creditLimitUsd);
    const usage = await getUserUsage(user.email).catch(() => null);

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
      },
      litellm: {
        sync: syncResult,
        usage
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LiteLLM sync failed.';
    const status = isLiteLLMConfigError(error) ? 500 : 502;

    return NextResponse.json(
      {
        ok: false,
        message: `Purchase was recorded in the portal, but syncing to LiteLLM failed: ${message}`,
        purchase: {
          transactionId: result.transaction.id,
          planId: plan.id
        }
      },
      { status }
    );
  }
}
