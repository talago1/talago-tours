import type { NextRequest } from 'next/server';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Admin auth utility imported into browser bundle.');
}

export const ADMIN_SESSION_COOKIE = 'talago_admin_session';

export function getAdminToken(): string | null {
  return process.env.ADMIN_API_TOKEN?.trim() || null;
}

/**
 * Handler-level admin check, for routes that are NOT covered by the middleware
 * matcher (/admin and /api/admin). Prefer keeping admin APIs under those
 * prefixes so the middleware enforces them; use this only when a route has to
 * live outside them.
 *
 * Accepts either the session cookie or an Authorization: Bearer header, which
 * is what non-browser callers (CI, scripts, service-to-service) must use. The
 * middleware now honours the same two mechanisms, so behaviour is consistent
 * between handler-level and middleware-level checks.
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
