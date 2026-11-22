import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie, TalagoSessionUser } from '@/server/auth';
import { adoptOwnedBookings } from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Authenticate credentials against Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Auth service misconfigured' }, { status: 500 });
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid email or password' },
        { status: 401 }
      );
    }

    const sbUser = authData.user;
    const name =
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      cleanEmail.split('@')[0];
    const phone = sbUser.phone || sbUser.user_metadata?.phone || null;

    // Upsert CustomerProfile in database
    const profile = await prisma.customerProfile.upsert({
      where: { email: cleanEmail },
      create: {
        email: cleanEmail,
        name,
        phone,
        isShadow: false,
      },
      update: {
        name: name || undefined,
        phone: phone || undefined,
        isShadow: false,
      },
    });

    // Adopt any bookings matching this customer's email or phone
    adoptOwnedBookings({
      profileId: profile.id,
      emails: [cleanEmail],
      phones: phone ? [phone] : [],
    }).catch(() => {});

    const sessionUser: TalagoSessionUser = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: 'CUSTOMER',
      authProvider: 'email',
    };

    const sessionToken = await createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    setSessionCookie(response, sessionToken);
    return response;
  } catch (error: any) {
    console.error('[POST /api/auth/login] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
