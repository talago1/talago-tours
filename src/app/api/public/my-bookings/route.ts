import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/my-bookings
 * Returns all bookings and reservations for the authenticated customer.
 * Reads the Authorization Bearer token (Supabase access token) from header or talago_session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null) ||
      request.cookies.get('talago_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401, headers: NO_STORE });
    }

    // Match CustomerProfile
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

    // Build conditions for bookings:
    // Only link by verified email, customerProfileId, or verified phone
    const bookingOr: Prisma.BookingWhereInput[] = [
      { customerEmail: { equals: user.email, mode: 'insensitive' } },
    ];

    if (profile?.id) {
      bookingOr.push({ customerProfileId: profile.id });
    }

    if (profile?.email && profile.email.toLowerCase() !== user.email.toLowerCase()) {
      bookingOr.push({ customerEmail: { equals: profile.email, mode: 'insensitive' } });
    }

    // Verified phone linking only (never attach by unverified phone)
    if (profile?.telegramPhone && profile.telegramPhoneVerified) {
      const cleanPhone = profile.telegramPhone.replace(/[^\d]/g, '');
      if (cleanPhone.length >= 7) {
        bookingOr.push({ customerPhone: { contains: cleanPhone } });
      }
    } else if (guestMatch) {
      bookingOr.push({ customerPhone: { contains: guestMatch[1] } });
    }

    // Build conditions for booking leads / reservations
    const leadOr: Prisma.BookingLeadWhereInput[] = [
      { customerEmail: { equals: user.email, mode: 'insensitive' } },
    ];

    if (profile?.email && profile.email.toLowerCase() !== user.email.toLowerCase()) {
      leadOr.push({ customerEmail: { equals: profile.email, mode: 'insensitive' } });
    }

    if (profile?.telegramPhone && profile.telegramPhoneVerified) {
      const cleanPhone = profile.telegramPhone.replace(/[^\d]/g, '');
      if (cleanPhone.length >= 7) {
        leadOr.push({ customerPhone: { contains: cleanPhone } });
      }
    } else if (guestMatch) {
      leadOr.push({ customerPhone: { contains: guestMatch[1] } });
    }

    const [bookings, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: { OR: bookingOr },
        select: {
          id: true,
          bookingReference: true,
          customerName: true,
          accessToken: true,
          tourId: true,
          status: true,
          travelDate: true,
          guestCount: true,
          totalPriceUSD: true,
          currency: true,
          paymentScheme: true,
          amountDueOnArrival: true,
          amountPaidOnline: true,
          createdAt: true,
          reviews: {
            select: { id: true, rating: true },
            take: 1,
          },
          tour: {
            select: {
              slug: true,
              coverImage: true,
              translations: true,
              durationHours: true,
            },
          },
          transaction: {
            select: { status: true },
          },
        },
        orderBy: { travelDate: 'asc' },
      }),

      prisma.bookingLead.findMany({
        where: {
          OR: leadOr,
          bookingId: null,
          status: { in: ['INTERESTED', 'IN_PROGRESS', 'CONTACTED', 'AWAITING_CUSTOMER', 'AWAITING_PAYMENT'] as any },
        },
        select: {
          id: true,
          tourId: true,
          tourTitle: true,
          tourSlug: true,
          adults: true,
          children: true,
          totalEstimatedPrice: true,
          currency: true,
          status: true,
          createdAt: true,
          travelDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const formattedReservations = reservations.map((r) => ({
      id: r.id,
      leadId: r.id,
      reservationReference: `RES-${r.id.slice(-8).toUpperCase()}`,
      tourId: r.tourId,
      tourTitle: r.tourTitle,
      tourSlug: r.tourSlug,
      adults: r.adults,
      children: r.children,
      totalEstimatedPrice: r.totalEstimatedPrice,
      currency: r.currency,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      travelDate: r.travelDate || null,
      lastAdminMessage: null,
      lastAdminMessageAt: null,
      hasUnreadAdminReply: false,
    }));

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: profile?.email || user.email,
          name: displayName,
          phone: profile?.phone || profile?.telegramPhone || null,
          isTelegram,
          telegramUsername: profile?.telegramUsername || null,
          telegramPhotoUrl: profile?.telegramPhotoUrl || null,
        },
        bookings,
        reservations: formattedReservations,
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error('[my-bookings-route] Error:', err);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to fetch bookings' },
      { status: 500, headers: NO_STORE }
    );
  }
}
