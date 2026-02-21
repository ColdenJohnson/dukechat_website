import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { syncBudgetToLiteLLM } from '@/lib/litellm';
import { buildLiteLLMSyncPayload, upsertPortalUser } from '@/lib/portal-service';

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);
  const payload = await buildLiteLLMSyncPayload(user.email);

  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        message: 'No portal user record found for sync payload.'
      },
      { status: 404 }
    );
  }

  const syncResult = await syncBudgetToLiteLLM(payload);

  return NextResponse.json({
    ok: true,
    message: 'LiteLLM sync boundary is scaffolded; outbound sync is currently a stub.',
    syncResult
  });
}
