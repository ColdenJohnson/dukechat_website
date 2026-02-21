import Link from 'next/link';

import { AIWorkspace } from '@/components/ai-workspace';
import { SiteNav } from '@/components/nav';
import { requireCurrentUser } from '@/lib/auth';

export default async function WorkspacePage() {
  const user = await requireCurrentUser();

  return (
    <main className="app-root">
      <SiteNav />

      <section className="page-head">
        <p className="eyebrow">AI Workspace</p>
        <h1>Routed model access for {user.email}</h1>
        <p>
          Requests on this page are sent server-side to LiteLLM with user headers. Use it to verify routing before
          wider rollout.
        </p>
        <p>
          Need to add credits first? Visit your <Link href="/subscription">subscription page</Link>.
        </p>
      </section>

      <AIWorkspace />
    </main>
  );
}
