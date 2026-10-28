import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('talago_session')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user || !user.email) {
      return NextResponse.json({ authenticated: false });
    }

    // Fetch matching CustomerProfile from Prisma
    const profile = await prisma.customerProfile.findUnique({
      where: { email: user.email },
    });

    const isSynthetic = user.email.endsWith('@noreply.talago.com');
    const phoneFromSynthetic = isSynthetic ? user.email.replace(/^guest-/, '').replace(/@noreply\.talago\.com$/, '') : null;
    const displayName = user.user_metadata?.name || (
      phoneFromSynthetic ? `+${phoneFromSynthetic}` : user.email.split('@')[0]
    );

    if (!profile) {
      // Create user profile in database to prevent orphan profiles
      const newProfile = await prisma.customerProfile.create({
        data: {
          email: user.email,
          name: displayName,
          phone: phoneFromSynthetic ? `+${phoneFromSynthetic}` : undefined,
          isShadow: false,
        },
      });

      return NextResponse.json({
        authenticated: true,
        name: newProfile.name,
        email: newProfile.email,
        phone: newProfile.phone,
      });
    }

    // If profile is currently marked as shadow, un-shadow it!
    if (profile.isShadow) {
      await prisma.customerProfile.update({
        where: { id: profile.id },
        data: { isShadow: false },
      });
    }

    return NextResponse.json({
      authenticated: true,
      name: profile.name || displayName,
      email: profile.email,
      phone: profile.phone,
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
