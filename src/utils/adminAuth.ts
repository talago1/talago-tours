import type { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'talago_admin_session';

export function getAdminToken(): string | null {
  return process.env.ADMIN_API_TOKEN?.trim() || null;
}

/**
 * Handler-level admin check for routes that are NOT under /api/admin (the
 * middleware matcher only covers /admin and /api/admin, so it is the sole
 * protection for those admin APIs that live outside that prefix).
 *
 * Note the asymmetry: this accepts a Bearer token, but src/middleware.ts is
 * cookie-only. No route currently calls this helper, so Bearer auth does not
 * work for any middleware-protected route today. Do not assume otherwise when
 * adding endpoints.
 */
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
