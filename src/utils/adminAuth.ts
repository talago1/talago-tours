import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'talago_admin_session';

export function getAdminToken(): string | null {
  return process.env.ADMIN_API_TOKEN?.trim() || null;
}

export function isAdminRequest(request: NextRequest): boolean {
  const configuredToken = getAdminToken();

  if (!configuredToken) {
    return false;
  }

  if (request.cookies.get(ADMIN_SESSION_COOKIE)?.value === configuredToken) {
    return true;
  }

  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;

  return bearerToken === configuredToken;
}
