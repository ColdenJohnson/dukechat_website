import Link from 'next/link';
import { redirect } from 'next/navigation';

import { DescopeLogin } from '@/components/descope-login';
import { SiteNav } from '@/components/nav';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/');
  }

  return (
    <main className="auth-page">
      <SiteNav />
      <section className="auth-shell">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Log in to manage credits and run AI requests.</h1>
          <p>
            Sign in with Descope to access your protected subscription data, dashboard metrics, and AI workspace.
          </p>
          <p>
            Need an account? <Link href="/signup">Create one here</Link>.
          </p>
        </div>
        <DescopeLogin redirectTo="/" />
      </section>
    </main>
  );
}
