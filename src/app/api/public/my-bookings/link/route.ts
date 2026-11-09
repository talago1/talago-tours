import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, getPhoneSearchVariants } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/public/my-bookings/link
 * Allows an authenticated customer to link an existing guest booking to their account
 * by providing the booking reference and contact phone number used during checkout.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'booking-link'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    // 1. Resolve authenticated user
    const authHeader = request.headers.get('authorization');
    let token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null) ||
      request.cookies.get('talago_session')?.value;
    const refreshToken = request.cookies.get('talago_refresh')?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    let user: any = null;
    if (token) {
      const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && userData?.user?.email) {
        user = userData.user;
      }
    }

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
          }
        }
      } catch (e) {
        console.warn('[my-bookings-link] auto-refresh notice:', e);
      }
    }

    if (!user?.email) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401, headers: NO_STORE });
    }

    // 2. Resolve CustomerProfile
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
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404, headers: NO_STORE });
    }

    // 3. Parse and validate input
    const body = await request.json().catch(() => ({}));
    const rawRef = typeof body.bookingReference === 'string' ? body.bookingReference : (body.reference || '');
    const rawPhone = typeof body.phone === 'string' ? body.phone : '';

    const cleanRef = sanitizePlain(rawRef, 50).trim().toUpperCase();
    const cleanPhone = sanitizePhone(rawPhone).trim();

    if (!cleanRef || !cleanPhone) {
      return NextResponse.json(
        { error: 'Both booking reference and contact phone number are required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const providedDigits = cleanPhone.replace(/[^\d]/g, '');
    if (providedDigits.length < 6) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number with country code.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // 4. Find the booking by reference
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: cleanRef },
          { id: cleanRef },
        ],
      },
      include: {
        tour: {
          select: {
            slug: true,
            coverImage: true,
            translations: true,
            durationHours: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'No booking found matching this reference and phone number.' },
        { status: 404, headers: NO_STORE }
      );
    }

    // Check phone match using search variants
    const storedDigits = (booking.customerPhone || '').replace(/[^\d]/g, '');
    const matchesPhone =
      storedDigits === providedDigits ||
      storedDigits.endsWith(providedDigits) ||
      providedDigits.endsWith(storedDigits);

    if (!matchesPhone) {
      return NextResponse.json(
        { error: 'No booking found matching this reference and phone number.' },
        { status: 404, headers: NO_STORE }
      );
    }

    // 5. If booking is already linked to another non-shadow profile, check ownership
    if (booking.customerProfileId && booking.customerProfileId !== profile.id) {
      const currentOwner = await prisma.customerProfile.findUnique({
        where: { id: booking.customerProfileId },
        select: { id: true, isShadow: true, email: true },
      });

      if (currentOwner && !currentOwner.isShadow && currentOwner.email !== profile.email) {
        return NextResponse.json(
          { error: 'This booking is already linked to another verified account.' },
          { status: 409, headers: NO_STORE }
        );
      }
    }

    // 6. Link booking to this profile
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        customerProfileId: profile.id,
      },
    });

    // If profile phone is not set, set it to the verified booking phone
    if (!profile.phone && cleanPhone) {
      await prisma.customerProfile.update({
        where: { id: profile.id },
        data: { phone: cleanPhone },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking linked successfully to your account.',
        booking: {
          id: booking.id,
          bookingReference: booking.bookingReference,
          customerName: booking.customerName,
          travelDate: booking.travelDate,
          status: booking.status,
          guestCount: booking.guestCount,
        },
      },
      { headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[my-bookings-link] Error:', err);
    return NextResponse.json(
      { error: 'Failed to link booking. Please try again later.' },
      { status: 500, headers: NO_STORE }
    );
  }
}

