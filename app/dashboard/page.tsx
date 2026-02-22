import Link from 'next/link';

import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';
import { getUserUsage } from '@/lib/litellm';
import { OPENWEBUI_URL } from '@/lib/openwebui';
import { formatUsd, getDashboardData, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export default async function DashboardPage() {
  const sessionUser = await requireCurrentUser();
  await upsertPortalUser(sessionUser);
  const data = await getDashboardData(sessionUser.email);
  const usage = await getUserUsage(sessionUser.email).catch(() => null);

  const user = data?.user;
  const creditLimitCents =
    usage?.creditLimitUsd == null ? (user?.monthlyBudgetCents ?? 0) : Math.round(usage.creditLimitUsd * 100);
  const spentCents = usage?.usageUsd == null ? (user?.monthlySpentCents ?? 0) : Math.round(usage.usageUsd * 100);
  const remainingCents = usage?.remainingUsd == null ? (data?.remainingCents ?? 0) : Math.round(usage.remainingUsd * 100);

  return (
    <main className="app-root">
      <SiteNav />

      <section className="page-head">
        <p className="eyebrow">Dashboard</p>
        <h1>Account and usage overview</h1>
        <p>This dashboard is protected by Descope auth. Purchases and usage controls are anchored to your email.</p>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <h3>Active tier</h3>
          <p>{planTierToLabel(user?.currentPlan)}</p>
        </article>
        <article className="metric-card">
          <h3>Available credits</h3>
          <p>{formatUsd(user?.availableCreditsCents ?? 0)}</p>
        </article>
        <article className="metric-card">
          <h3>Credit limit</h3>
          <p>{formatUsd(creditLimitCents)}</p>
        </article>
        <article className="metric-card">
          <h3>Spent in LiteLLM</h3>
          <p>{formatUsd(spentCents)}</p>
        </article>
        <article className="metric-card">
          <h3>Remaining this month</h3>
          <p>{formatUsd(remainingCents)}</p>
        </article>
      </section>

      <section className="card-shell">
        <h2>Account identity</h2>
        <p>
          <strong>Email:</strong> {sessionUser.email}
        </p>
        <p>
          <strong>Descope sub:</strong> {sessionUser.descopeSub ?? 'Not available in session token'}
        </p>
      </section>

      <section className="card-shell">
        <h2>Recent purchases</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Paid</th>
              <th>Credits Added</th>
            </tr>
          </thead>
          <tbody>
            {(user?.creditTransactions ?? []).map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.createdAt.toISOString()}</td>
                <td>{transaction.type}</td>
                <td>{planTierToLabel(transaction.planTier)}</td>
                <td>{formatUsd(transaction.amountCents)}</td>
                <td>{formatUsd(transaction.creditsAddedCents)}</td>
              </tr>
            ))}
            {(user?.creditTransactions.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={5}>No purchases yet. Buy a tier on the subscription page.</td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <div className="inline-actions">
          <Link href="/subscription" className="button button-primary">
            Buy credits
          </Link>
          <a href={OPENWEBUI_URL} className="button button-ghost">
            Open DukeChat
          </a>
        </div>
      </section>
    </main>
  );
}
