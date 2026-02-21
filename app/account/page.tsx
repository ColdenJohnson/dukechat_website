import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';

export default async function AccountPage() {
  const user = await requireCurrentUser();

  return (
    <main>
      <SiteNav />
      <h1>Account</h1>
      <div className="card">
        <p>
          <strong>Email (primary key):</strong> {user.email}
        </p>
        <p>
          <strong>Descope sub metadata:</strong> {user.descopeSub ?? 'Not available in session'}
        </p>
        <p>
          This page is intentionally minimal and reserved for future profile/account controls.
        </p>
      </div>
    </main>
  );
}
