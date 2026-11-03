import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { sanitizePlain, sanitizePhone } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('talago_session')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { headers: NO_STORE });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || !user.email) {
      return NextResponse.json({ authenticated: false }, { headers: NO_STORE });
    }

    // Match CustomerProfile by email or telegramId
    const telegramMatch = user.email.match(/^telegram-(\d+)@noreply\.talago\.com$/);
    const guestMatch = user.email.match(/^guest-(\d+)@noreply\.talago\.com$/);

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
    const isGoogle = Boolean(user.app_metadata?.provider === 'google' || user.identities?.some((i: { provider?: string }) => i.provider === 'google'));

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
        displayName = user.email.split('@')[0];
      }
    }

    if (!profile) {
      // Create user profile in database to prevent orphan profiles
      const newProfile = await prisma.customerProfile.create({
        data: {
          email: user.email,
          name: displayName || 'Traveler',
          phone: guestMatch ? `+${guestMatch[1]}` : undefined,
          telegramId: telegramMatch ? telegramMatch[1] : undefined,
          isShadow: false,
        },
      });

      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          name: newProfile.name,
          email: newProfile.email,
          phone: newProfile.phone || null,
          isTelegram,
          telegramId: newProfile.telegramId || null,
          telegramUsername: newProfile.telegramUsername || null,
          telegramPhotoUrl: newProfile.telegramPhotoUrl || null,
          telegramPhone: newProfile.telegramPhone || null,
          telegramPhoneVerified: newProfile.telegramPhoneVerified || false,
          telegramBotAccess: newProfile.telegramBotAccess || false,
          provider: isTelegram ? 'telegram' : isGoogle ? 'google' : 'email',
        },
      }, { headers: NO_STORE });
    }

    // If profile had a generic placeholder name (e.g. 'User'), replace it with the verified display name
    const updates: Record<string, any> = {};
    if (profile.isShadow) {
      updates.isShadow = false;
    }
    if ((!profile.name || profile.name === 'User' || profile.name.startsWith('Traveler #')) && displayName && displayName !== 'User') {
      updates.name = displayName;
    }

    let finalProfile = profile;
    if (Object.keys(updates).length > 0) {
      finalProfile = await prisma.customerProfile.update({
        where: { id: profile.id },
        data: updates,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: finalProfile.name || displayName || 'Traveler',
        email: finalProfile.email || user.email,
        phone: finalProfile.phone || finalProfile.telegramPhone || null,
        isTelegram,
        telegramId: finalProfile.telegramId || null,
        telegramUsername: finalProfile.telegramUsername || null,
        telegramPhotoUrl: finalProfile.telegramPhotoUrl || null,
        telegramPhone: finalProfile.telegramPhone || null,
        telegramPhoneVerified: finalProfile.telegramPhoneVerified || false,
        telegramBotAccess: finalProfile.telegramBotAccess || false,
        telegramConnectedAt: finalProfile.telegramConnectedAt ? finalProfile.telegramConnectedAt.toISOString() : null,
        provider: isTelegram ? 'telegram' : isGoogle ? 'google' : 'email',
      },
      name: finalProfile.name || displayName || 'Traveler',
      email: finalProfile.email || user.email,
      phone: finalProfile.phone || finalProfile.telegramPhone || null,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('talago_session')?.value;
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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || updated.telegramPhone || null,
        telegramUsername: updated.telegramUsername || null,
        telegramPhotoUrl: updated.telegramPhotoUrl || null,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500, headers: NO_STORE });
  }
}
