import { SiteNav } from '@/components/nav';
import { PricingPlans } from '@/components/pricing-plans';
import { requireCurrentUser } from '@/lib/auth';
import { getUserUsage } from '@/lib/litellm';
import { CREDIT_PLANS } from '@/lib/plans';
import { formatUsd, getDashboardData, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export default async function SubscriptionPage() {
  const user = await requireCurrentUser();
  await upsertPortalUser(user);
  const data = await getDashboardData(user.email);
  const usage = await getUserUsage(user.email).catch(() => null);
  const spentCents = usage?.usageUsd == null ? null : Math.round(usage.usageUsd * 100);
  const remainingCents = usage?.remainingUsd == null ? null : Math.round(usage.remainingUsd * 100);

  return (
    <main className="app-root">
      <SiteNav />

      <section className="page-head">
        <p className="eyebrow">Subscription</p>
        <h1>Manage tiers and credits</h1>
        <p>Pick a plan to add fixed credits instantly. Billing provider integration can be layered later.</p>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <h3>Current tier</h3>
          <p>{planTierToLabel(data?.user.currentPlan)}</p>
        </article>
        <article className="metric-card">
          <h3>Available credits</h3>
          <p>{formatUsd(data?.user.availableCreditsCents ?? 0)}</p>
        </article>
        <article className="metric-card">
          <h3>Lifetime purchased</h3>
          <p>{formatUsd(data?.user.lifetimeCreditsCents ?? 0)}</p>
        </article>
        <article className="metric-card">
          <h3>Spent in LiteLLM</h3>
          <p>{spentCents == null ? 'Unavailable' : formatUsd(spentCents)}</p>
        </article>
        <article className="metric-card">
          <h3>Remaining in LiteLLM</h3>
          <p>{remainingCents == null ? 'Unavailable' : formatUsd(remainingCents)}</p>
        </article>
      </section>

      <section className="pricing-section">
        <PricingPlans plans={CREDIT_PLANS} isAuthenticated compact />
      </section>
    </main>
  );
}
