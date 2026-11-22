import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE_NAME = 'talago_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface TalagoSessionUser {
  id: string; // CustomerProfile ID
  email?: string | null;
  name: string;
  phone?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramPhone?: string | null;
  telegramPhotoUrl?: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'PARTNER';
  authProvider: 'telegram' | 'google' | 'email';
}

/**
 * Derives a deterministic, high-entropy 256-bit signing key from server secrets.
 */
function getSigningSecret(): Uint8Array {
  const rawSecret =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    process.env.ADMIN_API_TOKEN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'talago-default-session-secret-change-me-in-production-min-32-chars';

  const hash = crypto.createHmac('sha256', rawSecret).update('talago-auth-session-signing-v2').digest();
  return new Uint8Array(hash);
}

/**
 * Issues a cryptographically signed, tamper-proof session JWT.
 */
export async function createSessionToken(user: TalagoSessionUser): Promise<string> {
  const secret = getSigningSecret();

  const token = await new SignJWT({
    sub: user.id,
    email: user.email || null,
    name: user.name,
    phone: user.phone || null,
    telegramId: user.telegramId || null,
    telegramUsername: user.telegramUsername || null,
    telegramPhone: user.telegramPhone || null,
    telegramPhotoUrl: user.telegramPhotoUrl || null,
    role: user.role || 'CUSTOMER',
    authProvider: user.authProvider || 'email',
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);

  return token;
}

/**
 * Verifies and decodes a session token. Returns null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<TalagoSessionUser | null> {
  if (!token || typeof token !== 'string') return null;

  try {
    const secret = getSigningSecret();
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || typeof payload.sub !== 'string') return null;

    return {
      id: payload.sub,
      email: (payload.email as string) || null,
      name: (payload.name as string) || 'Traveler',
      phone: (payload.phone as string) || null,
      telegramId: (payload.telegramId as string) || null,
      telegramUsername: (payload.telegramUsername as string) || null,
      telegramPhone: (payload.telegramPhone as string) || null,
      telegramPhotoUrl: (payload.telegramPhotoUrl as string) || null,
      role: ((payload.role as string) as 'CUSTOMER' | 'ADMIN' | 'PARTNER') || 'CUSTOMER',
      authProvider: ((payload.authProvider as string) as 'telegram' | 'google' | 'email') || 'email',
    };
  } catch {
    return null;
  }
}

/**
 * Attaches the session cookie to an outgoing HTTP NextResponse.
 */
export function setSessionCookie(response: NextResponse, sessionToken: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Also write into Next.js Server Cookie Store for route handlers
  try {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch {
    // Non-header context fallback
  }
}

/**
 * Clears the session cookie from an outgoing HTTP NextResponse.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });

  try {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
    });
  } catch {}
}

/**
 * Reads and verifies the current session from an incoming NextRequest.
 */
export async function getSessionFromRequest(request: NextRequest): Promise<TalagoSessionUser | null> {
  // 1. Check HTTP-only cookie first (authoritative browser session)
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    const user = await verifySessionToken(cookieToken);
    if (user) return user;
  }

  // 2. Check Authorization Bearer header (for mobile / API clients)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    if (bearerToken && bearerToken !== cookieToken) {
      const user = await verifySessionToken(bearerToken);
      if (user) return user;
    }
  }

  return null;
}

/**
 * Enriches session claims with live database CustomerProfile data.
 * Falls back gracefully to signed token claims if DB query fails or times out.
 */
export async function enrichSessionUser(sessionUser: TalagoSessionUser): Promise<TalagoSessionUser> {
  try {
    const profile = await prisma.customerProfile.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        telegramId: true,
        telegramUsername: true,
        telegramPhone: true,
        telegramPhotoUrl: true,
      },
    });

    if (profile) {
      return {
        ...sessionUser,
        name: profile.name || sessionUser.name,
        email: profile.email || sessionUser.email,
        phone: profile.phone || profile.telegramPhone || sessionUser.phone,
        telegramId: profile.telegramId || sessionUser.telegramId,
        telegramUsername: profile.telegramUsername || sessionUser.telegramUsername,
        telegramPhone: profile.telegramPhone || sessionUser.telegramPhone,
        telegramPhotoUrl: profile.telegramPhotoUrl || sessionUser.telegramPhotoUrl,
      };
    }
  } catch (err) {
    console.warn('[enrichSessionUser] DB profile fetch notice:', err);
  }

  return sessionUser;
}
