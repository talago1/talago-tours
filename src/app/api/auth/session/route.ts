import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

    let displayName = profile?.name;
    if (!displayName || displayName.startsWith('Traveler #')) {
      if (profile?.telegramUsername) {
        displayName = `@${profile.telegramUsername}`;
      } else if (user.user_metadata?.name || user.user_metadata?.full_name) {
        displayName = user.user_metadata?.name || user.user_metadata?.full_name;
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
          phone: newProfile.phone,
          isTelegram,
          telegramUsername: newProfile.telegramUsername || null,
          telegramPhotoUrl: newProfile.telegramPhotoUrl || null,
        },
      }, { headers: NO_STORE });
    }

    // If profile is currently marked as shadow, un-shadow it
    if (profile.isShadow) {
      await prisma.customerProfile.update({
        where: { id: profile.id },
        data: { isShadow: false },
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: profile.name || displayName,
        email: profile.email || user.email,
        phone: profile.phone || profile.telegramPhone || null,
        isTelegram,
        telegramUsername: profile.telegramUsername || null,
        telegramPhotoUrl: profile.telegramPhotoUrl || null,
      },
      name: profile.name || displayName,
      email: profile.email || user.email,
      phone: profile.phone || profile.telegramPhone || null,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500, headers: NO_STORE });
  }
}
