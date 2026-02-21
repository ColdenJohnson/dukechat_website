import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth';
import { SiteNav } from '@/components/nav';

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main>
      <SiteNav />

      <h1>Landing Portal Scaffold</h1>
      <p>
        This app is the minimal Vercel portal foundation for DukeChat: Descope-authenticated users, Neon/Postgres
        persistence, and API stubs for budget and billing flows.
      </p>

      <div className="card">
        <h2>Current Identity Model</h2>
        <p>
          Email is the primary user key across portal and LiteLLM enforcement. Descope <code>sub</code> is stored as
          secondary metadata.
        </p>
        {user ? (
          <p>
            You are signed in as <strong>{user.email}</strong>. Continue to <Link href="/dashboard">dashboard</Link>.
          </p>
        ) : (
          <p>
            You are not signed in. Go to <Link href="/login">/login</Link> to authenticate with Descope.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Portal Scope in This Pass</h2>
        <ul>
          <li>Landing page and end-user portal pages.</li>
          <li>Descope login/session integration.</li>
          <li>Real Postgres data model (Prisma) for users and mock credit ledger.</li>
          <li>Route stubs for dashboard, subscription, credits, and LiteLLM budget sync.</li>
        </ul>
      </div>
    </main>
  );
}
