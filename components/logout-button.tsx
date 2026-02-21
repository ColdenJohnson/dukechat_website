'use client';

import { useDescope } from '@descope/nextjs-sdk/client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function LogoutButton() {
  const sdk = useDescope();
  const router = useRouter();

  const onLogout = useCallback(async () => {
    await sdk.logout();
    router.push('/');
    router.refresh();
  }, [router, sdk]);

  return (
    <button type="button" className="button button-ghost" onClick={onLogout}>
      Log out
    </button>
  );
}
