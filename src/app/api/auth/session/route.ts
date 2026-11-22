import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sanitizePlain, sanitizePhone } from '@/utils/sanitize';
import {
  applySessionCookies,
  consumeAuthTicket,
  resolveRequestUser,
  type SessionUser,
} from '@/server/customerSession';
import {
  adoptOwnedBookings,
  formatUserProfile,
  resolveCustomerProfileForUser,
} from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

function clearSessionCookies(response: NextResponse) {
  response.cookies.set('talago_session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
  response.cookies.set('talago_refresh', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveRequestUser(request);
    if (!auth?.user?.email) {
      return NextResponse.json({ authenticated: false }, { headers: NO_STORE });
    }

    let profile = null;
    let telegramMatch = null;
    try {
      const resolved = await resolveCustomerProfileForUser(auth.user);
      profile = resolved.profile;
      telegramMatch = resolved.telegramMatch;
    } catch (profileErr) {
      console.warn('[session-get] profile resolution warning:', profileErr);
    }

    const userPayload = formatUserProfile(auth.user, profile, telegramMatch);

    const res = NextResponse.json(
      {
        authenticated: true,
        user: userPayload,
        profileLoaded: Boolean(profile),
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
      },
      { headers: NO_STORE }
    );

    if (auth.persist && auth.accessToken) {
      applySessionCookies(res, auth.accessToken, auth.refreshToken);
    }
    return res;
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    let token: string | null = null;
    let refreshToken: string | null = null;

    let body: any = null;
    try {
      body = await request.json();
    } catch {}

    // 1. Consume 1-time auth handoff ticket if provided
    if (body?.ticket) {
      const ticketSession = await consumeAuthTicket(body.ticket);
      if (ticketSession) {
        token = ticketSession.accessToken;
        refreshToken = ticketSession.refreshToken;
      }
    }

    const authHeader = request.headers.get('authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length).trim();
    }

    if (!token && body) {
      token = body?.access_token || body?.token || null;
      refreshToken = body?.refresh_token || null;
    }

    if (!token) {
      token = request.cookies.get('talago_session')?.value || null;
    }
    if (!refreshToken) {
      refreshToken = request.cookies.get('talago_refresh')?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: 'No token provided' },
        { status: 400, headers: NO_STORE }
      );
    }

    let user: SessionUser | null = null;
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userData?.user?.email) {
      user = userData.user as SessionUser;
    } else if (refreshToken) {
      // Auto-refresh when access token is expired but valid refresh_token exists
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: refreshData } = await supabaseAnon.auth.refreshSession({
            refresh_token: refreshToken,
          });
          if (refreshData?.session?.user?.email && refreshData.session.access_token) {
            user = refreshData.session.user as SessionUser;
            token = refreshData.session.access_token;
            refreshToken = refreshData.session.refresh_token || refreshToken;
          }
        } catch (refreshErr) {
          console.warn('[session-post] auto-refresh failed:', refreshErr);
        }
      }
    }

    if (!user || !user.email) {
      const res = NextResponse.json(
        { authenticated: false, error: 'Invalid or expired token' },
        { status: 200, headers: NO_STORE }
      );
      clearSessionCookies(res);
      return res;
    }

    let profile = null;
    let telegramMatch = null;
    try {
      const resolved = await resolveCustomerProfileForUser(user as SessionUser);
      profile = resolved.profile;
      telegramMatch = resolved.telegramMatch;

      if (profile) {
        // Auto-adopt any bookings matching this customer
        await adoptOwnedBookings({
          profileId: profile.id,
          emails: [user.email, profile.email],
          phones: [profile.phone, profile.telegramPhone, user.phone],
        }).catch(() => {});
      }
    } catch (profileErr) {
      console.warn('[session-post] profile resolution warning:', profileErr);
    }

    const userPayload = formatUserProfile(user as SessionUser, profile, telegramMatch);

    const res = NextResponse.json(
      {
        authenticated: true,
        user: userPayload,
        profileLoaded: Boolean(profile),
        accessToken: token,
        refreshToken: refreshToken,
      },
      { headers: NO_STORE }
    );

    applySessionCookies(res, token, refreshToken);
    return res;
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await resolveRequestUser(request);
    if (!auth?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    const user = auth.user;
    const body = await request.json();
    const cleanName = sanitizePlain(body.name, 100);
    const cleanPhone = sanitizePhone(body.phone);

    const { profile, telegramMatch } = await resolveCustomerProfileForUser(user);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: NO_STORE });
    }

    const updateData: Record<string, any> = {};
    if (cleanName && cleanName.length >= 2) {
      updateData.name = cleanName;
    }
    if (cleanPhone && cleanPhone.length >= 7) {
      updateData.phone = cleanPhone;
    }

    const updated = await prisma.customerProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    // Call unified adoptOwnedBookings for all known profile emails & phones
    await adoptOwnedBookings({
      profileId: profile.id,
      emails: [user.email, updated.email].filter((e): e is string => Boolean(e)),
      phones: [cleanPhone, updated.phone, updated.telegramPhone, user.phone].filter((p): p is string => Boolean(p)),
    }).catch((e) => console.warn('[session-patch] adoptOwnedBookings warning:', e));

    // Also update Supabase metadata if name changed
    if (cleanName) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name: cleanName,
          full_name: cleanName,
        },
      }).catch(() => {});
    }

    const userPayload = formatUserProfile(user, updated, telegramMatch);

    const res = NextResponse.json(
      {
        success: true,
        user: userPayload,
      },
      { headers: NO_STORE }
    );

    if (auth.accessToken) {
      applySessionCookies(res, auth.accessToken, auth.refreshToken);
    }
    return res;
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, authenticated: false }, { headers: NO_STORE });
  clearSessionCookies(res);
  return res;
}
