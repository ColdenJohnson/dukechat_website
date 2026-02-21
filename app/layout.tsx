import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@descope/nextjs-sdk';

import './globals.css';

const defaultProjectId = 'P39y2AtmSiEzB6oP1cjgx2GQUE1Y';

export const metadata: Metadata = {
  title: 'DukeChat | Production AI Access Portal',
  description: 'SaaS portal for identity, subscription tiers, and LiteLLM-routed AI access.'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const projectId = process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID ?? defaultProjectId;

  return (
    <html lang="en">
      <body>
        <AuthProvider projectId={projectId}>{children}</AuthProvider>
      </body>
    </html>
  );
}
