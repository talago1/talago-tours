import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applySessionCookies, resolveRequestUser } from '@/server/customerSession';
import {
  adoptOwnedBookings,
  listVisibleBookingIds,
  listVisibleLeadIds,
  resolveCustomerProfileForUser,
} from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/my-bookings
 * Returns all bookings and reservations for the authenticated customer.
 * Reads the Authorization Bearer token (Supabase access token) from header or talago_session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveRequestUser(request);
    const user = auth?.user;
    if (!user?.email) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    const { profile, telegramMatch, guestMatch } = await resolveCustomerProfileForUser(user);
    if (!profile) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401, headers: NO_STORE });
    }

    const isTelegram = Boolean(telegramMatch || profile.telegramId);
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

    const metaPhone = typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null;
    const metaEmail = typeof user.user_metadata?.email === 'string' ? user.user_metadata.email : null;
    const phones = [
      profile.phone,
      profile.telegramPhone,
      user.phone,
      metaPhone,
      guestMatch ? guestMatch[1] : null,
    ];
    const emails = [user.email, profile.email, metaEmail];

    await adoptOwnedBookings({ profileId: profile.id, emails, phones }).catch((error) => {
      console.warn('[my-bookings] booking adoption warning:', error);
    });

    const [bookingIds, leadIds] = await Promise.all([
      listVisibleBookingIds({ profileId: profile.id, emails, phones }),
      listVisibleLeadIds(emails, phones),
    ]);

    const [bookings, reservations] = await Promise.all([
      bookingIds.length === 0
        ? Promise.resolve([])
        : prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        select: {
          id: true,
          bookingReference: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          customerProfileId: true,
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
          hotelName: true,
          roomNumber: true,
          pickupLocationName: true,
          selectedPickupTime: true,
          pickupDirectives: true,
          adultsCount: true,
          childrenCount: true,
          infantsCount: true,
          selectedAddons: true,
          specialRequirements: true,
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

      leadIds.length === 0
        ? Promise.resolve([])
        : prisma.bookingLead.findMany({
        where: {
          id: { in: leadIds },
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

    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: profile.email || user.email,
          name: displayName,
          phone: profile.phone || profile.telegramPhone || null,
          isTelegram,
          telegramUsername: profile.telegramUsername || null,
          telegramPhotoUrl: profile.telegramPhotoUrl || null,
        },
        bookings,
        reservations: formattedReservations,
      },
      { headers: NO_STORE }
    );
    if (auth?.persist && auth.accessToken) {
      applySessionCookies(response, auth.accessToken, auth.refreshToken);
    }
    return response;
  } catch (err) {
    console.error('[my-bookings-route] Error:', err);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to fetch bookings' },
      { status: 500, headers: NO_STORE }
    );
  }
}
