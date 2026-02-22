import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getUserUsage, isLiteLLMConfigError, syncUserCreditLimit } from '@/lib/litellm';
import { getUserCreditLimitUsd, upsertPortalUser } from '@/lib/portal-service';

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);
  const creditLimitUsd = await getUserCreditLimitUsd(user.email);

  if (creditLimitUsd == null) {
    return NextResponse.json(
      {
        ok: false,
        message: 'No portal user record found for sync payload.'
      },
      { status: 404 }
    );
  }

  try {
    const syncResult = await syncUserCreditLimit(user.email, creditLimitUsd);
    const usage = await getUserUsage(user.email).catch(() => null);

    return NextResponse.json({
      ok: true,
      message: 'LiteLLM budget and customer mapping synced.',
      syncResult,
      usage
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LiteLLM sync failed.';
    const status = isLiteLLMConfigError(error) ? 500 : 502;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
