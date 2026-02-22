'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { CreditPlan } from '@/lib/plans';

type PricingPlansProps = {
  plans: CreditPlan[];
  isAuthenticated: boolean;
  compact?: boolean;
};

type PurchaseState = {
  ok: boolean;
  message: string;
} | null;

async function buyPlan(planId: string) {
  const response = await fetch('/api/credits/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ planId })
  });

  const payload = (await response.json()) as { ok?: boolean; message?: string };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message ?? 'Plan purchase failed.');
  }

  return payload.message ?? 'Plan purchased.';
}

export function PricingPlans({ plans, isAuthenticated, compact = false }: PricingPlansProps) {
  const router = useRouter();
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>(null);

  const sortedPlans = useMemo(() => plans, [plans]);

  async function onBuy(planId: string) {
    setBusyPlanId(planId);
    setPurchaseState(null);

    try {
      const message = await buyPlan(planId);
      setPurchaseState({ ok: true, message });
      router.refresh();
    } catch (error) {
      setPurchaseState({
        ok: false,
        message: error instanceof Error ? error.message : 'Plan purchase failed.'
      });
    } finally {
      setBusyPlanId(null);
    }
  }

  return (
    <section className={compact ? 'pricing-grid pricing-grid-compact' : 'pricing-grid'}>
      {sortedPlans.map((plan) => (
        <article key={plan.id} className={plan.popular ? 'pricing-card pricing-card-popular' : 'pricing-card'}>
          {plan.popular ? <span className="pill">Most Popular</span> : null}
          <h3>{plan.name}</h3>
          <p>{plan.tagline}</p>
          <p className="price-line">
            <span>${plan.priceUsd}</span>
            <small>/ top-up</small>
          </p>
          <p className="credits-line">Includes ${plan.includedCreditsUsd} in AI credits.</p>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          {isAuthenticated ? (
            <button
              type="button"
              className="button button-primary"
              onClick={() => onBuy(plan.id)}
              disabled={busyPlanId === plan.id}
            >
              {busyPlanId === plan.id ? 'Processing...' : `Buy ${plan.name}`}
            </button>
          ) : (
            <Link href="/signup" className="button button-primary">
              Sign up to buy
            </Link>
          )}
        </article>
      ))}

      {purchaseState ? (
        <div className={purchaseState.ok ? 'status-banner status-ok' : 'status-banner status-error'}>
          {purchaseState.message}{' '}
          {purchaseState.ok ? (
            <>
              <Link href="/subscription">View subscription</Link>
              {' or '}
              <Link href="/workspace">open workspace</Link>.
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
