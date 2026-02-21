import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { isLiteLLMConfigError, listLiteLLMModels } from '@/lib/litellm';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const models = await listLiteLLMModels(user);

    return NextResponse.json({
      ok: true,
      models
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch model list.';
    const status = isLiteLLMConfigError(error) ? 500 : 502;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
