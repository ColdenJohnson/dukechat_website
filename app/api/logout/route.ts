import { logout } from '@descope/nextjs-sdk/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await logout();
  return NextResponse.redirect(new URL('/', request.url));
}
