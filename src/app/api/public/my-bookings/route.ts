import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { applySessionCookies, resolveRequestUser } from '@/server/customerSession';
import {
  adoptOwnedBookings,
  listVisibleBookingIds,
  listVisibleLeadIds,
  resolveCustomerProfileForUser,
  formatUserProfile,
} from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/my-bookings
 * Returns all bookings and reservations for the authenticated customer.
 * Reads the HTTP-only talago_session cookie or Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    let profile = null;

    if (session?.id) {
      profile = await prisma.customerProfile.findUnique({
        where: { id: session.id },
      });
    }
    if (!profile && session?.telegramId) {
      profile = await prisma.customerProfile.findUnique({
        where: { telegramId: session.telegramId },
      });
    }
    if (!profile && session?.email) {
      profile = await prisma.customerProfile.findUnique({
        where: { email: session.email },
      });
    }

    // Fallback to legacy user resolver if session not found
    let user: any = null;
    let guestMatch: RegExpMatchArray | null = null;
    if (!profile) {
      const auth = await resolveRequestUser(request);
      user = auth?.user;
      if (user?.email) {
        const resolved = await resolveCustomerProfileForUser(user);
        profile = resolved.profile;
        guestMatch = resolved.guestMatch;
      }
    }

    if (!profile) {
      return NextResponse.json({ authenticated: false, bookings: [], reservations: [] }, { status: 200, headers: NO_STORE });
    }

    let displayName = profile.name;
    if (!displayName || displayName.startsWith('Traveler #')) {
      if (profile.telegramUsername) {
        displayName = `@${profile.telegramUsername}`;
      } else if (profile.email) {
        displayName = profile.email.split('@')[0];
      }
    }

    const phones = [
      profile.phone,
      profile.telegramPhone,
      session?.phone,
      session?.telegramPhone,
      guestMatch ? guestMatch[1] : null,
    ].filter(Boolean);

    const emails = [profile.email, session?.email].filter(Boolean) as string[];

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
          bookingAnswers: true,
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
              freeCancellationHours: true,
            },
          },
          transaction: {
            select: { status: true },
          },
        },
        orderBy: { travelDate: 'asc' },
      }).catch((err) => {
        console.error('[my-bookings] bookings query error:', err);
        return [];
      }),

      leadIds.length === 0
        ? Promise.resolve([])
        : prisma.bookingLead.findMany({
        where: {
          id: { in: leadIds },
          bookingId: null,
          status: { in: ['INTERESTED', 'IN_PROGRESS', 'CONTACTED'] },
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
      }).catch((err) => {
        console.error('[my-bookings] leads query error:', err);
        return [];
      }),
    ]);

    const bookingRefs = bookings.map((b) => b.bookingReference).filter(Boolean);
    const reservationIds = reservations.map((r) => r.id);

    const conversations =
      bookingRefs.length > 0 || bookingIds.length > 0 || reservationIds.length > 0
        ? await prisma.liveChatConversation
            .findMany({
              where: {
                OR: [
                  ...(bookingRefs.length > 0 ? [{ bookingReference: { in: bookingRefs } }] : []),
                  ...(bookingIds.length > 0 ? [{ bookingId: { in: bookingIds } }] : []),
                  ...(reservationIds.length > 0 ? [{ leadId: { in: reservationIds } }] : []),
                ],
              },
              select: {
                id: true,
                bookingReference: true,
                bookingId: true,
                leadId: true,
                messages: {
                  where: { sender: 'ADMIN' },
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                  select: {
                    id: true,
                    body: true,
                    readAt: true,
                    createdAt: true,
                  },
                },
              },
            })
            .catch((err) => {
              console.warn('[my-bookings] conversations query warning:', err);
              return [];
            })
        : [];

    const formattedReservations = reservations.map((r) => {
      const convo = conversations.find((c) => c.leadId === r.id);
      const unread = convo ? convo.messages.some((m) => !m.readAt) : false;
      const lastMsg = convo?.messages[0] || null;
      return {
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
        lastAdminMessage: lastMsg?.body || null,
        lastAdminMessageAt: lastMsg?.createdAt?.toISOString() || null,
        hasUnreadAdminReply: unread,
      };
    });

    const formattedBookings = bookings.map((b) => {
      const convo = conversations.find(
        (c) =>
          (b.bookingReference && c.bookingReference === b.bookingReference) ||
          (b.id && c.bookingId === b.id)
      );
      const unread = convo ? convo.messages.some((m) => !m.readAt) : false;
      const lastMsg = convo?.messages[0] || null;
      return {
        ...b,
        lastAdminMessage: lastMsg?.body || null,
        lastAdminMessageAt: lastMsg?.createdAt?.toISOString() || null,
        hasUnreadAdminReply: unread,
      };
    });

    const effectiveUser = user || ({
      id: profile.id,
      email: profile.email,
      phone: profile.phone || profile.telegramPhone || null,
      user_metadata: {
        name: profile.name,
        full_name: profile.name,
        preferred_username: profile.telegramUsername,
        picture: profile.telegramPhotoUrl,
        telegram_id: profile.telegramId,
      },
    } as any);

    const userPayload = formatUserProfile(effectiveUser, profile, profile.telegramId ? { id: profile.telegramId } as any : null);

    const response = NextResponse.json(
      {
        authenticated: true,
        user: userPayload,
        bookings: formattedBookings,
        reservations: formattedReservations,
      },
      { headers: NO_STORE }
    );
    return response;
  } catch (err) {
    console.error('[my-bookings-route] Error:', err);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to fetch bookings' },
      { status: 500, headers: NO_STORE }
    );
  }
}
