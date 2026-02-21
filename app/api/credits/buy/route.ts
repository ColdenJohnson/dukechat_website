import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { addMockCredits, formatUsd, upsertPortalUser } from '@/lib/portal-service';

const DEFAULT_MOCK_PURCHASE_USD = 4;

function toPositiveUsd(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  if (value <= 0) {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requestedUsd = toPositiveUsd(body.amountUsd) ?? DEFAULT_MOCK_PURCHASE_USD;
  const amountCents = Math.round(requestedUsd * 100);

  const result = await addMockCredits(user.email, amountCents);

  return NextResponse.json({
    ok: true,
    mode: 'mock',
    message: `Added mock credits of ${formatUsd(amountCents)} to monthly budget.`,
    transaction: {
      id: result.transaction.id,
      amountCents: result.transaction.amountCents,
      type: result.transaction.type,
      note: result.transaction.note,
      createdAt: result.transaction.createdAt.toISOString()
    },
    user: {
      email: result.user.email,
      monthlyBudgetCents: result.user.monthlyBudgetCents,
      monthlySpentCents: result.user.monthlySpentCents
    }
  });
}
