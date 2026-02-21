import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@descope/nextjs-sdk';

import './globals.css';

const defaultProjectId = 'P39y2AtmSiEzB6oP1cjgx2GQUE1Y';

export const metadata: Metadata = {
  title: 'DukeChat Portal',
  description: 'Landing and user portal scaffold for usage caps + billing workflows.'
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
