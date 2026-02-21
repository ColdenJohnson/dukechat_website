import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth';

function LogoutButton() {
  return (
    <form action="/api/logout" method="post">
      <button type="submit">Log out</button>
    </form>
  );
}

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header>
      <strong>DukeChat Portal</strong>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/account">Account</Link>
        <Link href="/subscription">Subscription</Link>
        {user ? <LogoutButton /> : <Link href="/login">Login</Link>}
      </nav>
    </header>
  );
}
