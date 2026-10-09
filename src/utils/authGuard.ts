import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminToken } from './adminAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: Auth guard utility imported into browser bundle.');
}

export const USER_SESSION_COOKIE = 'talago_session';

/**
 * Validates whether the incoming request is authorized as an Admin.
 * Checks both:
 * 1. Admin Token via Cookie or Bearer header
 * 2. Supabase Auth JWT with admin role / metadata
 */
export async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  const configuredToken = getAdminToken();

  // 1. Check direct ADMIN_API_TOKEN in cookie
  const cookieAdminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (configuredToken && cookieAdminToken === configuredToken) {
    return true;
  }

  // 2. Check Bearer token
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (configuredToken && bearerToken === configuredToken) {
    return true;
  }

  // 3. Check Supabase session token if provided
  const candidateToken = bearerToken || request.cookies.get(USER_SESSION_COOKIE)?.value;
  if (candidateToken) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(candidateToken);
      if (!error && user) {
        const role = user.role || user.app_metadata?.role || user.user_metadata?.role;
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        if (role === 'admin' || role === 'service_role' || (adminEmail && user.email?.toLowerCase() === adminEmail)) {
          return true;
        }
      }
    } catch {
      // Ignore token decode errors
    }
  }

  return false;
}

/**
 * Returns authenticated user from Supabase session token or null.
 */
export async function getAuthenticatedUser(
  request: NextRequest,
): Promise<{ id: string; email: string; name?: string; role?: string } | null> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;
  const cookieToken = request.cookies.get(USER_SESSION_COOKIE)?.value;

  const token = bearerToken || cookieToken;
  if (!token) return null;

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || !user.email) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      role: user.role || user.app_metadata?.role,
    };
  } catch (err) {
    return null;
  }
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401, headers: { 'cache-control': 'no-store, private' } }
  );
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403, headers: { 'cache-control': 'no-store, private' } }
  );
}
