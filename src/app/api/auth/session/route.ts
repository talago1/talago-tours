import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sanitizePlain, sanitizePhone } from '@/utils/sanitize';
import { adoptOwnedBookings } from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

function setSessionCookies(response: NextResponse, accessToken: string, refreshToken?: string | null) {
  response.cookies.set('talago_session', accessToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  if (refreshToken) {
    response.cookies.set('talago_refresh', refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
}

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

async function resolveUserProfile(user: any) {
  const telegramMatch = user.email?.match(/^telegram-(\d+)@noreply\.talago\.com$/);
  const guestMatch = user.email?.match(/^guest-(\d+)@noreply\.talago\.com$/);

  const profile = await prisma.customerProfile.findFirst({
    where: {
      OR: [
        { email: user.email },
        ...(telegramMatch ? [{ telegramId: telegramMatch[1] }] : []),
      ],
    },
  });

  const isTelegram = Boolean(telegramMatch || profile?.telegramId);
  const isGuestSynthetic = Boolean(guestMatch);
  const isGoogle = Boolean(
    user.app_metadata?.provider === 'google' ||
    user.identities?.some((i: { provider?: string }) => i.provider === 'google')
  );

  let displayName = profile?.name;
  const isGeneric =
    !displayName ||
    displayName.trim() === '' ||
    displayName === 'User' ||
    displayName === 'Traveler' ||
    displayName.startsWith('Traveler #');

  if (isGeneric) {
    if (user.user_metadata?.name && user.user_metadata.name !== 'User') {
      displayName = user.user_metadata.name;
    } else if (user.user_metadata?.full_name && user.user_metadata.full_name !== 'User') {
      displayName = user.user_metadata.full_name;
    } else if (profile?.telegramUsername) {
      displayName = `@${profile.telegramUsername}`;
    } else if (isGuestSynthetic) {
      displayName = `+${guestMatch![1]}`;
    } else {
      displayName = user.email ? user.email.split('@')[0] : 'Traveler';
    }
  }

  const updates: Record<string, any> = {};
  if (profile) {
    if (profile.isShadow) {
      updates.isShadow = false;
    }
    if (
      (!profile.name || profile.name === 'User' || profile.name.startsWith('Traveler #')) &&
      displayName &&
      displayName !== 'User'
    ) {
      updates.name = displayName;
    }
    if (!profile.phone && profile.telegramPhone) {
      updates.phone = profile.telegramPhone;
    }
  }

  const finalProfile = profile
    ? Object.keys(updates).length > 0
      ? await prisma.customerProfile.update({
          where: { id: profile.id },
          data: updates,
        })
      : profile
    : await prisma.customerProfile.create({
        data: {
          email: user.email,
          name: displayName || 'Traveler',
          phone: guestMatch ? `+${guestMatch[1]}` : undefined,
          telegramId: telegramMatch ? telegramMatch[1] : undefined,
          isShadow: false,
        },
      });

  return {
    userPayload: {
      id: user.id,
      name: finalProfile?.name || displayName || 'Traveler',
      email: finalProfile?.email || user.email,
      phone: finalProfile?.phone || finalProfile?.telegramPhone || null,
      isTelegram,
      telegramId: finalProfile?.telegramId || null,
      telegramUsername: finalProfile?.telegramUsername || null,
      telegramPhotoUrl: finalProfile?.telegramPhotoUrl || null,
      telegramPhone: finalProfile?.telegramPhone || null,
      telegramPhoneVerified: finalProfile?.telegramPhoneVerified || false,
      telegramBotAccess: finalProfile?.telegramBotAccess || false,
      telegramConnectedAt: finalProfile?.telegramConnectedAt ? finalProfile.telegramConnectedAt.toISOString() : null,
      provider: isTelegram ? 'telegram' : isGoogle ? 'google' : 'email',
    },
    finalProfile,
    displayName,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null) ||
      request.cookies.get('talago_session')?.value;
    const refreshToken = request.cookies.get('talago_refresh')?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ authenticated: false }, { headers: NO_STORE });
    }

    let user: any = null;
    let refreshedToken: string | null = null;
    let refreshedRefreshToken: string | null = null;

    if (token) {
      const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && userData?.user?.email) {
        user = userData.user;
      }
    }

    // Auto-refresh via refresh_token if access_token is expired or missing
    if (!user && refreshToken) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data: refreshData, error: refreshError } = await supabaseAnon.auth.refreshSession({
            refresh_token: refreshToken,
          });
          if (!refreshError && refreshData?.session?.user?.email) {
            user = refreshData.session.user;
            refreshedToken = refreshData.session.access_token;
            refreshedRefreshToken = refreshData.session.refresh_token;
            token = refreshedToken;
          }
        }
      } catch (e) {
        console.warn('[session] auto-refresh notice:', e);
      }
    }

    if (!user || !user.email) {
      return NextResponse.json({ authenticated: false }, { headers: NO_STORE });
    }

    const { userPayload, finalProfile, displayName } = await resolveUserProfile(user);

    const res = NextResponse.json(
      {
        authenticated: true,
        user: userPayload,
        name: finalProfile?.name || displayName || 'Traveler',
        email: finalProfile?.email || user.email,
        phone: finalProfile?.phone || finalProfile?.telegramPhone || null,
        accessToken: token,
        refreshToken: refreshedRefreshToken || refreshToken || null,
      },
      { headers: NO_STORE }
    );

    // Keep the authoritative cookies refreshed and in sync
    if (token) {
      setSessionCookies(res, token, refreshedRefreshToken || refreshToken);
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

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length).trim();
    }

    if (!token) {
      try {
        const body = await request.json();
        token = body?.access_token || body?.token || null;
        refreshToken = body?.refresh_token || null;
      } catch {}
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

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || !user.email) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid token' },
        { status: 401, headers: NO_STORE }
      );
    }

    const { userPayload, finalProfile, displayName } = await resolveUserProfile(user);

    const res = NextResponse.json(
      {
        authenticated: true,
        user: userPayload,
        name: finalProfile?.name || displayName || 'Traveler',
        email: finalProfile?.email || user.email,
        phone: finalProfile?.phone || finalProfile?.telegramPhone || null,
        accessToken: token,
        refreshToken: refreshToken || null,
      },
      { headers: NO_STORE }
    );

    // Persist authoritative session cookies
    setSessionCookies(res, token, refreshToken);
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
    const authHeader = request.headers.get('authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null) ||
      request.cookies.get('talago_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    const body = await request.json();
    const cleanName = sanitizePlain(body.name, 100);
    const cleanPhone = sanitizePhone(body.phone);

    const telegramMatch = user.email.match(/^telegram-(\d+)@noreply\.talago\.com$/);

    const profile = await prisma.customerProfile.findFirst({
      where: {
        OR: [
          { email: user.email },
          ...(telegramMatch ? [{ telegramId: telegramMatch[1] }] : []),
        ],
      },
    });

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

    if (cleanPhone && cleanPhone.length >= 7) {
      const { getPhoneSearchVariants } = await import('@/utils/sanitize');
      const phoneVariants = getPhoneSearchVariants(cleanPhone);
      const linkOr = phoneVariants.map((v) => ({ customerPhone: { contains: v } }));
      if (linkOr.length > 0) {
        const candidateBookings = await prisma.booking.findMany({
          where: { OR: linkOr },
          select: { id: true, customerProfileId: true },
        });
        const unlinked = candidateBookings.filter((b) => !b.customerProfileId || b.customerProfileId !== profile.id);
        if (unlinked.length > 0) {
          const foreignIds = unlinked
            .map((b) => b.customerProfileId)
            .filter((id): id is string => Boolean(id && id !== profile.id));

          const shadowProfiles = foreignIds.length > 0
            ? await prisma.customerProfile.findMany({
                where: { id: { in: foreignIds }, isShadow: true },
                select: { id: true },
              })
            : [];
          const adoptableIds = shadowProfiles.map((p) => p.id);

          await prisma.booking.updateMany({
            where: {
              id: { in: unlinked.map((b) => b.id) },
              OR: [
                { customerProfileId: null },
                ...(adoptableIds.length > 0 ? [{ customerProfileId: { in: adoptableIds } }] : []),
              ],
            },
            data: { customerProfileId: profile.id },
          }).catch(() => {});
        }
      }
    }

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

    const res = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone || updated.telegramPhone || null,
          telegramUsername: updated.telegramUsername || null,
          telegramPhotoUrl: updated.telegramPhotoUrl || null,
        },
      },
      { headers: NO_STORE }
    );

    setSessionCookies(res, token);
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
