import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';

export default async function SubscriptionPage() {
  const user = await requireCurrentUser();

  return (
    <main>
      <SiteNav />
      <h1>Subscription</h1>
      <div className="card">
        <p>
          Subscription and payment collection UI are intentionally deferred. This placeholder exists so routing and
          auth are ready.
        </p>
        <p>
          Current user: <strong>{user.email}</strong>
        </p>
      </div>
    </main>
  );
}
