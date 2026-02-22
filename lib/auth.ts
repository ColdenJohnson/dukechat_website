import { session } from '@descope/nextjs-sdk/server';
import { redirect } from 'next/navigation';

type UnknownRecord = Record<string, unknown>;


export type PortalSessionUser = {
  email: string;
  descopeSub: string | null;
  displayName: string | null;
};

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as UnknownRecord;
}

function readString(record: UnknownRecord | null, key: string): string | null {
  if (!record) {
    return null;
  }

  const value = record[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeEmail(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.toLowerCase();
}

function extractUser(authInfo: unknown): PortalSessionUser | null {
  const root = asRecord(authInfo);
  const candidates: Array<UnknownRecord | null> = [
    root,
    asRecord(root?.token),
    asRecord(root?.sessionToken),
    asRecord(root?.sessionJwt),
    asRecord(root?.jwt),
    asRecord(root?.claims),
    asRecord(root?.user)
  ];

  for (const candidate of candidates) {
    const email =
      normalizeEmail(readString(candidate, 'email')) ??
      normalizeEmail(readString(candidate, 'preferred_username')) ??
      normalizeEmail(readString(candidate, 'upn')) ??
      normalizeEmail(readString(candidate, 'loginId'));

    if (!email) {
      continue;
    }

    const descopeSub =
      readString(candidate, 'sub') ?? readString(candidate, 'userId') ?? readString(candidate, 'id') ?? null;

    const displayName =
      readString(candidate, 'name') ??
      readString(candidate, 'displayName') ??
      readString(candidate, 'given_name') ??
      null;

    return {
      email,
      descopeSub,
      displayName
    };
  }

  return null;
}

export async function getCurrentUser(): Promise<PortalSessionUser | null> {
  try {
    const authInfo = await session({
      projectId: process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID
    });
    return extractUser(authInfo);
  } catch {
    return null;
  }
}

export async function requireCurrentUser(): Promise<PortalSessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
