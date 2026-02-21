import Link from 'next/link';

import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';
import { formatUsd, getDashboardData, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export default async function DashboardPage() {
  const sessionUser = await requireCurrentUser();
  await upsertPortalUser(sessionUser);
  const data = await getDashboardData(sessionUser.email);

  const user = data?.user;

  return (
    <main className="app-root">
      <SiteNav />

      <section className="page-head">
        <p className="eyebrow">Dashboard</p>
        <h1>Account and usage overview</h1>
        <p>
          This workspace is protected by Descope auth. Purchases and AI usage controls are anchored to your email
          identity.
        </p>
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
          <h3>Monthly budget</h3>
          <p>{formatUsd(user?.monthlyBudgetCents ?? 0)}</p>
        </article>
        <article className="metric-card">
          <h3>Remaining this month</h3>
          <p>{formatUsd(data?.remainingCents ?? 0)}</p>
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
          <Link href="/workspace" className="button button-ghost">
            Open AI workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
