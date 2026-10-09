import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminToken } from '@/utils/adminAuth';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'admin-login'), LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const token = body && typeof body === 'object'
    ? (body as { token?: unknown }).token
    : null;
  const configuredToken = getAdminToken();

  if (!configuredToken || typeof token !== 'string' || token !== configuredToken) {
    return NextResponse.json(
      { success: false, error: 'Invalid admin token.' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: configuredToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
