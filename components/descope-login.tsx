'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DescopeLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const flowId = process.env.NEXT_PUBLIC_DESCOPE_FLOW_ID ?? 'sign-up-or-in';

  return (
    <div className="card">
      <Descope
        flowId={flowId}
        onSuccess={() => {
          setError(null);
          router.push('/dashboard');
          router.refresh();
        }}
        onError={(errorEvent: CustomEvent) => {
          setError(String(errorEvent.detail ?? 'Authentication failed'));
        }}
      />
      {error ? <p>Descope login error: {error}</p> : null}
    </div>
  );
}
