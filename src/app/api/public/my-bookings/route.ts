import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// This response carries customer PII and each booking's access token.
const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/my-bookings
 * Returns all bookings for the authenticated customer.
 * Reads the Authorization Bearer token (Supabase access token) from header or talago_session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null) ||
      request.cookies.get('talago_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    // Verify the token with Supabase and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401, headers: NO_STORE });
    }

    // Resolve possible phone numbers for phone-first / WhatsApp customers
    let resolvedPhone: string | null = null;
    const syntheticMatch = user.email.match(/^guest-(\d+)@noreply\.talago\.com$/);
    if (syntheticMatch) {
      resolvedPhone = syntheticMatch[1];
    } else {
      const profile = await prisma.customerProfile.findUnique({
        where: { email: user.email },
        select: { phone: true },
      });
      if (profile?.phone) {
        resolvedPhone = profile.phone.replace(/[^\d]/g, '');
      }
    }

    const bookingWhere: Prisma.BookingWhereInput = resolvedPhone
      ? {
          OR: [
            { customerEmail: user.email },
            { customerPhone: { contains: resolvedPhone } },
          ],
        }
      : { customerEmail: user.email };

    const leadWhere: Prisma.BookingLeadWhereInput = resolvedPhone
      ? {
          OR: [
            { customerEmail: { equals: user.email, mode: 'insensitive' as const } },
            { customerPhone: { contains: resolvedPhone } },
          ],
          bookingId: null,
          status: { in: ['INTERESTED', 'IN_PROGRESS', 'CONTACTED'] as any },
        }
      : {
          customerEmail: { equals: user.email, mode: 'insensitive' as const },
          bookingId: null,
          status: { in: ['INTERESTED', 'IN_PROGRESS', 'CONTACTED'] as any },
        };

    const [bookings, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
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
        where: leadWhere,
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
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const formattedReservations = reservations.map((r) => {
      return {
        id: r.id,
        reservationReference: `RES-${r.id.slice(-8).toUpperCase()}`,
        tourId: r.tourId,
        tourTitle: r.tourTitle,
        tourSlug: r.tourSlug,
        adults: r.adults,
        children: r.children,
        totalEstimatedPrice: r.totalEstimatedPrice,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt,
        lastAdminMessage: null,
        lastAdminMessageAt: null,
        hasUnreadAdminReply: false,
      };
    });

    return NextResponse.json({
      bookings,
      reservations: formattedReservations,
    }, { headers: NO_STORE });
  } catch (err) {
    console.error('Failed to fetch bookings:', err);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500, headers: NO_STORE }
    );
  }
}
