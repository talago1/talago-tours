import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, setSessionCookie, TalagoSessionUser } from '@/server/auth';
import { adoptOwnedBookings } from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name && typeof name === 'string' ? name.trim() : '') || cleanEmail.split('@')[0];
    const { normalizePhoneNumber } = await import('@/utils/sanitize');
    const { phoneMatchKey } = await import('@/utils/phoneMatch');
    const cleanPhone = phone && typeof phone === 'string' && phone.trim() ? normalizePhoneNumber(phone.trim()) : null;
    const cleanPhoneNormalized = cleanPhone ? phoneMatchKey(cleanPhone) ?? null : null;

    // Create user in Supabase Auth with pre-confirmed email so customer can sign in instantly
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        full_name: cleanName,
        phone: cleanPhone,
      },
    });

    if (createError && !createError.message.includes('already registered')) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // Upsert CustomerProfile in database (preserve existing custom name/phone if already set)
    const existingProfile = await prisma.customerProfile.findUnique({ where: { email: cleanEmail } });
    const profile = existingProfile
      ? await prisma.customerProfile.update({
          where: { id: existingProfile.id },
          data: {
            ...(!existingProfile.name || existingProfile.name === 'User' ? { name: cleanName } : {}),
            ...(!existingProfile.phone && cleanPhone
              ? { phone: cleanPhone, phoneNormalized: cleanPhoneNormalized ?? undefined }
              : {}),
            isShadow: false,
          },
        })
      : await prisma.customerProfile.create({
          data: {
            email: cleanEmail,
            name: cleanName,
            phone: cleanPhone,
            phoneNormalized: cleanPhoneNormalized,
            isShadow: false,
          },
        });

    // Adopt any bookings matching this customer's email or phone
    adoptOwnedBookings({
      profileId: profile.id,
      emails: [cleanEmail],
      phones: cleanPhone ? [cleanPhone] : [],
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
    console.error('[POST /api/auth/register] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
