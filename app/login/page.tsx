import { redirect } from 'next/navigation';

import { DescopeLogin } from '@/components/descope-login';
import { SiteNav } from '@/components/nav';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main>
      <SiteNav />
      <h1>Login</h1>
      <p>Use Descope to sign in. Successful login redirects to the dashboard.</p>
      <DescopeLogin />
    </main>
  );
}
