'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type DescopeLoginProps = {
  redirectTo?: string;
};

export function DescopeLogin({ redirectTo = '/dashboard' }: DescopeLoginProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const flowId = process.env.NEXT_PUBLIC_DESCOPE_FLOW_ID ?? 'sign-up-or-in';

  return (
    <div className="auth-card">
      <Descope
        flowId={flowId}
        onSuccess={() => {
          setError(null);
          router.push(redirectTo);
          router.refresh();
        }}
        onError={(errorEvent: CustomEvent) => {
          setError(String(errorEvent.detail ?? 'Authentication failed'));
        }}
      />
      {error ? <p className="status-inline status-error">Descope login error: {error}</p> : null}
    </div>
  );
}
