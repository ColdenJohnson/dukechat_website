import Link from 'next/link';

import { LogoutButton } from '@/components/logout-button';
import { getCurrentUser } from '@/lib/auth';
import { OPENWEBUI_URL } from '@/lib/openwebui';

type SiteNavProps = {
  marketing?: boolean;
};

export async function SiteNav({ marketing = false }: SiteNavProps) {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <Link href="/" className="brand-mark">
        <span className="brand-dot" />
        DukeChat
      </Link>

      <nav className="site-nav-links" aria-label="Primary">
        {marketing ? (
          <>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </>
        ) : null}
        {user ? (
          <>
            <a href={OPENWEBUI_URL}>DukeChat</a>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/subscription">Subscription</Link>
            <Link href="/account">Account</Link>
          </>
        ) : null}
      </nav>

      <div className="site-nav-actions">
        {user ? (
          <>
            <a href={OPENWEBUI_URL} className="button button-primary">
              Open DukeChat
            </a>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="button button-ghost">
              Log in
            </Link>
            <Link href="/signup" className="button button-primary">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
