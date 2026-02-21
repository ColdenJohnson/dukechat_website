import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { isLiteLLMConfigError, sendLiteLLMChat } from '@/lib/litellm';

function parseTemperature(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  if (value < 0 || value > 2) {
    return undefined;
  }

  return value;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = await sendLiteLLMChat(user, {
      model: body.model,
      message: body.message,
      temperature: parseTemperature(body.temperature)
    });

    return NextResponse.json({
      ok: true,
      model: result.model,
      response: result.response,
      usage: result.usage
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'LiteLLM chat failed.';
    const status = isLiteLLMConfigError(error) ? 500 : 502;

    return NextResponse.json({ ok: false, message }, { status });
  }
}
