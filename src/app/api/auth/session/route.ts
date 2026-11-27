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

          // Look up existing profile so we never overwrite a customer's custom name or phone
          const existingProfile = await prisma.customerProfile.findUnique({
            where: { email },
          });
          const shouldSetName =
            !existingProfile?.name ||
            existingProfile.name === 'User' ||
            existingProfile.name.startsWith('Traveler #');
          const { phoneMatchKey } = await import('@/utils/phoneMatch');
          const { normalizePhoneNumber } = await import('@/utils/sanitize');
          const normalizedSbPhone = sbUser.phone ? normalizePhoneNumber(sbUser.phone) : null;

          const profile = existingProfile
            ? await prisma.customerProfile.update({
                where: { id: existingProfile.id },
                data: {
                  ...(shouldSetName ? { name } : {}),
                  ...(!existingProfile.phone && normalizedSbPhone
                    ? {
                        phone: normalizedSbPhone,
                        phoneNormalized: phoneMatchKey(normalizedSbPhone) ?? undefined,
                      }
                    : {}),
                  isShadow: false,
                },
              })
            : await prisma.customerProfile.create({
                data: {
                  email,
                  name,
                  phone: normalizedSbPhone,
                  phoneNormalized: normalizedSbPhone ? phoneMatchKey(normalizedSbPhone) ?? undefined : undefined,
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

/**
 * PATCH /api/auth/session
 * Updates the authenticated customer's editable Talago profile (display name & phone).
 * Never mutates historical Booking records.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    let profileId = session?.id || null;
    let sessionEmail = session?.email || null;

    if (!profileId && !sessionEmail) {
      const { resolveRequestUser } = await import('@/server/customerSession');
      const auth = await resolveRequestUser(request);
      if (auth?.user?.email) {
        sessionEmail = auth.user.email.toLowerCase().trim();
      }
    }

    if (!profileId && !sessionEmail) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { sanitizePlain, normalizePhoneNumber } = await import('@/utils/sanitize');
    const { phoneMatchKey } = await import('@/utils/phoneMatch');

    const rawName = typeof body.name === 'string' ? sanitizePlain(body.name, 100) : undefined;
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : undefined;

    if (rawName !== undefined && rawName.length < 2) {
      return NextResponse.json(
        { error: 'Display name must be at least 2 characters' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    let normalizedPhone: string | null | undefined = undefined;
    let phoneNormalizedKey: string | null | undefined = undefined;

    if (rawPhone !== undefined) {
      if (rawPhone === '') {
        normalizedPhone = null;
        phoneNormalizedKey = null;
      } else {
        const e164 = normalizePhoneNumber(rawPhone);
        const key = phoneMatchKey(e164);
        if (!e164.startsWith('+') || !key) {
          return NextResponse.json(
            { error: 'Please enter a valid international phone number' },
            { status: 400, headers: NO_CACHE_HEADERS }
          );
        }
        normalizedPhone = e164;
        phoneNormalizedKey = key;
      }
    }

    const existing = profileId
      ? await prisma.customerProfile.findUnique({ where: { id: profileId } })
      : await prisma.customerProfile.findFirst({
          where: { email: { equals: sessionEmail!, mode: 'insensitive' } },
        });

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer profile not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const updated = await prisma.customerProfile.update({
      where: { id: existing.id },
      data: {
        ...(rawName !== undefined ? { name: rawName } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
        ...(phoneNormalizedKey !== undefined ? { phoneNormalized: phoneNormalizedKey } : {}),
        isShadow: false,
      },
    });

    const refreshedUser: TalagoSessionUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      telegramId: updated.telegramId,
      telegramUsername: updated.telegramUsername,
      telegramPhone: updated.telegramPhone,
      role: 'CUSTOMER',
      authProvider: session?.authProvider || (updated.telegramId ? 'telegram' : 'email'),
    };

    const newToken = await createSessionToken(refreshedUser);
    const res = NextResponse.json(
      { success: true, user: refreshedUser },
      { headers: NO_CACHE_HEADERS }
    );
    setSessionCookie(res, newToken);
    return res;
  } catch (error) {
    console.error('[PATCH /api/auth/session] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
