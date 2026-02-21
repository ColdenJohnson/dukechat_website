import { DashboardActions } from '@/components/dashboard-actions';
import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';
import { formatUsd, getDashboardData, upsertPortalUser } from '@/lib/portal-service';

export default async function DashboardPage() {
  const sessionUser = await requireCurrentUser();
  await upsertPortalUser(sessionUser);
  const data = await getDashboardData(sessionUser.email);

  return (
    <main>
      <SiteNav />
      <h1>Dashboard</h1>
      <p>This page is protected by Descope session validation.</p>

      <div className="card">
        <h2>User Summary</h2>
        <p>
          <strong>Email (primary key):</strong> {sessionUser.email}
        </p>
        <p>
          <strong>Descope sub (secondary metadata):</strong> {sessionUser.descopeSub ?? 'Not available in session'}
        </p>
      </div>

      <div className="card">
        <h2>Budget Snapshot</h2>
        <p>
          <strong>Monthly budget:</strong> {formatUsd(data?.user.monthlyBudgetCents ?? 0)}
        </p>
        <p>
          <strong>Monthly spent (stub):</strong> {formatUsd(data?.user.monthlySpentCents ?? 0)}
        </p>
        <p>
          <strong>Remaining:</strong> {formatUsd(data?.remainingCents ?? 0)}
        </p>
        <small>
          Spending ingestion from LiteLLM is not implemented yet in this pass, so spent remains zero unless updated
          manually later.
        </small>
      </div>

      <div className="card">
        <h2>Recent Mock Credit Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {(data?.user.creditTransactions ?? []).map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.createdAt.toISOString()}</td>
                <td>{transaction.type}</td>
                <td>{formatUsd(transaction.amountCents)}</td>
                <td>{transaction.note ?? '-'}</td>
              </tr>
            ))}
            {(data?.user.creditTransactions.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={4}>No transactions yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <DashboardActions />
    </main>
  );
}
