import { NextResponse } from 'next/server';

import { CREDIT_PLANS } from '@/lib/plans';

export async function GET() {
  return NextResponse.json({
    ok: true,
    plans: CREDIT_PLANS.map((plan) => ({
      id: plan.id,
      name: plan.name,
      tagline: plan.tagline,
      priceUsd: plan.priceUsd,
      includedCreditsUsd: plan.includedCreditsUsd,
      features: plan.features,
      popular: plan.popular ?? false
    }))
  });
}
