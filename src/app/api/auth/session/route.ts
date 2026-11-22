import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  getSessionFromRequest,
  enrichSessionUser,
  verifySessionToken,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  TalagoSessionUser,
} from '@/server/auth';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * GET /api/auth/session
 * Authoritative session check. Reads HTTP-only talago_session cookie.
 * Always returns HTTP 200 with JSON payload: { authenticated: boolean, user: TalagoSessionUser | null }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const user = await enrichSessionUser(session);

    return NextResponse.json(
      { authenticated: true, user },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[GET /api/auth/session] Error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { headers: NO_CACHE_HEADERS }
    );
  }
}

/**
 * POST /api/auth/session
 * Synchronizes or sets session from client/callback token.
 * Accepts:
 *   1. talago_session token
 *   2. Supabase access_token (from Google OAuth or Email signin)
 */
export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const token =
      body?.token ||
      body?.accessToken ||
      body?.access_token ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (token) {
      // 1. Try verifying as a Talago signed session token first
      const verifiedTalago = await verifySessionToken(token);
      if (verifiedTalago) {
        const user = await enrichSessionUser(verifiedTalago);
        const res = NextResponse.json(
          { authenticated: true, user },
          { headers: NO_CACHE_HEADERS }
        );
        setSessionCookie(res, token);
        return res;
      }

      // 2. Try verifying as a Supabase OAuth token (e.g. Google Sign In)
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (!userError && userData?.user?.email) {
          const sbUser = userData.user;
          const email = sbUser.email.toLowerCase().trim();
          const name =
            sbUser.user_metadata?.full_name ||
            sbUser.user_metadata?.name ||
            email.split('@')[0];

          // Upsert CustomerProfile
          const profile = await prisma.customerProfile.upsert({
            where: { email },
            create: {
              email,
              name,
              phone: sbUser.phone || null,
              isShadow: false,
            },
            update: {
              name: name || undefined,
              phone: sbUser.phone || undefined,
              isShadow: false,
            },
          });

          // Issue authoritative Talago session token
          const talagoToken = await createSessionToken({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: 'CUSTOMER',
            authProvider: 'google',
          });

          const user: TalagoSessionUser = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            role: 'CUSTOMER',
            authProvider: 'google',
          };

          const res = NextResponse.json(
            { authenticated: true, user },
            { headers: NO_CACHE_HEADERS }
          );
          setSessionCookie(res, talagoToken);
          return res;
        }
      } catch (sbErr) {
        console.warn('[POST /api/auth/session] Supabase token verify notice:', sbErr);
      }
    }

    // 3. Check existing cookie
    const existing = await getSessionFromRequest(request);
    if (existing) {
      const user = await enrichSessionUser(existing);
      return NextResponse.json(
        { authenticated: true, user },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const res = NextResponse.json(
      { authenticated: false, user: null },
      { headers: NO_CACHE_HEADERS }
    );
    clearSessionCookie(res);
    return res;
  } catch (error) {
    console.error('[POST /api/auth/session] Error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
