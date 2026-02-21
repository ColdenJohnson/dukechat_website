import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getDashboardData, upsertPortalUser } from '@/lib/portal-service';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  await upsertPortalUser(user);
  const dashboard = await getDashboardData(user.email);

  return NextResponse.json({
    ok: true,
    subscription: {
      status: 'placeholder',
      planName: 'None (billing not implemented)',
      monthlyBudgetCents: dashboard?.user.monthlyBudgetCents ?? 0,
      monthlySpentCents: dashboard?.user.monthlySpentCents ?? 0,
      portalKey: user.email,
      billingImplementation: 'pending'
    }
  });
}
