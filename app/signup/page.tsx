import Link from 'next/link';
import { redirect } from 'next/navigation';

import { DescopeLogin } from '@/components/descope-login';
import { SiteNav } from '@/components/nav';
import { getCurrentUser } from '@/lib/auth';

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/');
  }

  return (
    <main className="auth-page">
      <SiteNav />
      <section className="auth-shell">
        <div>
          <p className="eyebrow">Create your account</p>
          <h1>Sign up and activate your first AI credit tier.</h1>
          <p>After authentication you can buy tiered credits, view subscription state, and continue to DukeChat.</p>
          <p>
            Already have an account? <Link href="/login">Log in</Link>.
          </p>
        </div>
        <DescopeLogin redirectTo="/" />
      </section>
    </main>
  );
}
