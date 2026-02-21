import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';
import { getDashboardData, planTierToLabel, upsertPortalUser } from '@/lib/portal-service';

export default async function AccountPage() {
  const user = await requireCurrentUser();
  await upsertPortalUser(user);
  const data = await getDashboardData(user.email);

  return (
    <main className="app-root">
      <SiteNav />

      <section className="page-head">
        <p className="eyebrow">Account</p>
        <h1>Identity and profile metadata</h1>
        <p>Portal identity is email-first, with Descope subject retained as secondary metadata for traceability.</p>
      </section>

      <section className="card-shell">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Descope sub:</strong> {user.descopeSub ?? 'Not available'}
        </p>
        <p>
          <strong>Current tier:</strong> {planTierToLabel(data?.user.currentPlan)}
        </p>
      </section>
    </main>
  );
}
