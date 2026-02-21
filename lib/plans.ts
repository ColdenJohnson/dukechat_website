import { PlanTier } from '@prisma/client';

export type CreditPlanId = 'pro' | 'growth' | 'scale';

export type CreditPlan = {
  id: CreditPlanId;
  tier: PlanTier;
  name: string;
  tagline: string;
  priceUsd: number;
  includedCreditsUsd: number;
  popular?: boolean;
  features: string[];
};

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'pro',
    tier: PlanTier.PRO,
    name: 'Pro',
    tagline: 'For individuals shipping fast',
    priceUsd: 10,
    includedCreditsUsd: 10,
    features: ['10 USD AI credits included', 'Core model access through LiteLLM', 'Email-based usage attribution']
  },
  {
    id: 'growth',
    tier: PlanTier.GROWTH,
    name: 'Growth',
    tagline: 'For heavy weekly usage',
    priceUsd: 50,
    includedCreditsUsd: 50,
    popular: true,
    features: ['50 USD AI credits included', 'Higher monthly usage envelope', 'Priority support queue']
  },
  {
    id: 'scale',
    tier: PlanTier.SCALE,
    name: 'Scale',
    tagline: 'For teams and production workloads',
    priceUsd: 100,
    includedCreditsUsd: 100,
    features: ['100 USD AI credits included', 'Best per-credit buying efficiency', 'Recommended for multi-user teams']
  }
];

const planById = new Map(CREDIT_PLANS.map((plan) => [plan.id, plan]));

export function centsFromUsd(usd: number): number {
  return Math.round(usd * 100);
}

export function findCreditPlan(planId: unknown): CreditPlan | null {
  if (typeof planId !== 'string') {
    return null;
  }

  return planById.get(planId as CreditPlanId) ?? null;
}
