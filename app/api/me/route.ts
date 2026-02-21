import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { upsertPortalUser } from '@/lib/portal-service';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const portalUser = await upsertPortalUser(user);

  return NextResponse.json({
    ok: true,
    user: {
      email: portalUser.email,
      descopeSub: portalUser.descopeSub,
      displayName: portalUser.displayName,
      monthlyBudgetCents: portalUser.monthlyBudgetCents,
      monthlySpentCents: portalUser.monthlySpentCents
    }
  });
}
