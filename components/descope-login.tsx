'use client';

import { Descope } from '@descope/nextjs-sdk';
import { useState } from 'react';

type DescopeLoginProps = {
  redirectTo?: string;
};

export function DescopeLogin({ redirectTo = '/' }: DescopeLoginProps) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="auth-card">
      <Descope
        flowId="sign-up-or-in"
        redirectAfterSuccess={redirectTo}
        onSuccess={() => {
          setError(null);
        }}
        onError={(errorEvent: CustomEvent) => {
          setError(String(errorEvent.detail ?? 'Authentication failed'));
        }}
      />
      {error ? <p className="status-inline status-error">Descope login error: {error}</p> : null}
    </div>
  );
}
