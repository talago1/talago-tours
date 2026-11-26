import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { applySessionCookies, resolveRequestUser } from '@/server/customerSession';
import {
  collectIdentityEmails,
  resolveCustomerProfileForUser,
  formatUserProfile,
} from '@/server/customerBookings';
import { exactPhoneVariants } from '@/utils/phoneMatch';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };

// Page size for GET /api/public/my-bookings. The list used to return every
// booking the customer ever had in one response; cursor pagination keeps
// each response small and lets the client fetch more pages on demand.
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

/** Pick the tour title for one language out of the stored translations map. */
function getLocalizedTourTitle(translations: unknown, lang: string): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en']) {
      if (t[key]?.title) return t[key].title!;
    }
  }
  return 'Tour Experience';
}

/**
 * GET /api/public/my-bookings
 * Returns bookings and reservations for the authenticated customer.
 * Reads the HTTP-only talago_session cookie or Authorization header.
 * Bookings are cursor-paginated (?limit=20&cursor=<booking id>) and the
 * response includes pagination { limit, nextCursor, hasMore }. Each
 * booking carries only a single-language tourTitle and a
 * hasPendingCancellationRequest flag — full translations, addons and
 * booking answers are deferred to the booking detail page.
 */
export async function GET(request: NextRequest) {
  try {
    // Cursor pagination: ?limit=20&cursor=<last booking id of previous page>
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit') || DEFAULT_PAGE_SIZE);
    const pageSize = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.floor(requestedLimit), 1), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
    const cursorId = searchParams.get('cursor') || null;

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
      return NextResponse.json(
        { authenticated: false, bookings: [], reservations: [], pagination: { limit: pageSize, nextCursor: null, hasMore: false } },
        { status: 200, headers: NO_STORE }
      );
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

    // Single-roundtrip direct OR filter (replaces 5 pre-lookup queries)
    const identityEmails = collectIdentityEmails(emails, phones);
    const phoneVariants = [...new Set(phones.flatMap((p) => exactPhoneVariants(p)))];

    const bookingOrConditions: any[] = [{ customerProfileId: profile.id }];
    for (const email of identityEmails) {
      bookingOrConditions.push({ customerEmail: { equals: email, mode: 'insensitive' as const } });
    }
    if (phoneVariants.length > 0) {
      bookingOrConditions.push({ customerPhone: { in: phoneVariants } });
    }

    const leadOrConditions: any[] = [];
    for (const email of identityEmails) {
      leadOrConditions.push({ customerEmail: { equals: email, mode: 'insensitive' as const } });
    }
    if (phoneVariants.length > 0) {
      leadOrConditions.push({ customerPhone: { in: phoneVariants } });
    }

    const [rawBookings, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: { OR: bookingOrConditions },
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        take: pageSize + 1,
        select: {
          id: true,
          bookingReference: true,
          idempotencyKey: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          customerProfileId: true,
          accessToken: true,
          tourId: true,
          status: true,
          language: true,
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
          specialRequirements: true,
          // NOTE: selectedAddons is no longer selected — the list view
          // never renders it; fetch it on the booking detail page.
          // bookingAnswers is read server-side ONLY to derive
          // hasPendingCancellationRequest below and is stripped from the
          // response; it is never sent to the client. A follow-up
          // (dedicated cancellation-status column) can remove even
          // this server-side read.
          bookingAnswers: true,
          reviews: {
            select: { id: true, rating: true },
            take: 1,
          },
          tour: {
            select: {
              slug: true,
              coverImage: true,
              thumbnailUrl: true,
              // translations is read server-side ONLY to extract the
              // single-language tourTitle below; the full 8-language
              // map is never sent to the client any more.
              translations: true,
              durationHours: true,
              freeCancellationHours: true,
            },
          },
          transaction: {
            select: { status: true },
          },
        },
        orderBy: [{ travelDate: 'asc' }, { id: 'asc' }],
      }).catch((err) => {
        console.error('[my-bookings] bookings query error:', err);
        return [];
      }),

      leadOrConditions.length === 0
        ? Promise.resolve([])
        : prisma.bookingLead.findMany({
        where: {
          bookingId: null,
          status: { in: ['INTERESTED', 'IN_PROGRESS', 'CONTACTED'] },
          OR: leadOrConditions,
        },
        select: {
          id: true,
          sessionId: true,
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

    const hasMore = rawBookings.length > pageSize;
    const bookings = hasMore ? rawBookings.slice(0, pageSize) : rawBookings;

    // Only fetch conversations for the bookings on THIS page
    const pageBookingIds = bookings.map((b) => b.id);
    const bookingRefs = bookings.map((b) => b.bookingReference).filter(Boolean);
    const reservationIds = reservations.map((r) => r.id);

    const conversations =
      bookingRefs.length > 0 || pageBookingIds.length > 0 || reservationIds.length > 0
        ? await prisma.liveChatConversation
            .findMany({
              where: {
                OR: [
                  ...(bookingRefs.length > 0 ? [{ bookingReference: { in: bookingRefs } }] : []),
                  ...(pageBookingIds.length > 0 ? [{ bookingId: { in: pageBookingIds } }] : []),
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
                  // Only the latest admin message is rendered, so fetch
                  // one instead of five. hasUnreadAdminReply below now
                  // means "the latest admin message is unread".
                  take: 1,
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

    const bookedAttemptIds = new Set(
      bookings.map((b) => b.idempotencyKey).filter((k): k is string => Boolean(k))
    );
    const activeUnconvertedLeads = reservations.filter(
      (r) => !r.sessionId || !bookedAttemptIds.has(r.sessionId)
    );

    const formattedReservations = activeUnconvertedLeads.map((r) => {
      const convo = conversations.find((c) => c.leadId === r.id);
      const unread = convo ? convo.messages.some((m) => !m.readAt) : false;
      const lastMsg = convo?.messages[0] || null;
      return {
        id: r.id,
        leadId: r.id,
        attemptId: r.sessionId || null,
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
      // Strip the heavy JSON columns before responding: bookingAnswers
      // and tour.translations were only needed to derive the two fields
      // below. The client renders tourTitle + the cancellation flag and
      // fetches full details (addons, answers) on the detail page.
      const { bookingAnswers, tour, ...bookingFields } = b as typeof b & {
        bookingAnswers?: { _cancellationRequest?: { status?: string } } | null;
        tour?: { translations?: unknown } | null;
      };
      const pendingCancellation =
        (bookingAnswers as { _cancellationRequest?: { status?: string } } | null)
          ?._cancellationRequest?.status === 'PENDING_REVIEW';
      return {
        ...bookingFields,
        tour: tour
          ? {
              slug: tour.slug,
              coverImage: tour.coverImage,
              thumbnailUrl: tour.thumbnailUrl,
              tourTitle: getLocalizedTourTitle(tour.translations, b.language || 'en'),
              durationHours: tour.durationHours,
              freeCancellationHours: tour.freeCancellationHours,
            }
          : null,
        hasPendingCancellationRequest: pendingCancellation,
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

    const nextCursor = hasMore ? bookings[bookings.length - 1].id : null;

    const response = NextResponse.json(
      {
        authenticated: true,
        user: userPayload,
        bookings: formattedBookings,
        reservations: formattedReservations,
        pagination: { limit: pageSize, nextCursor, hasMore: nextCursor !== null },
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
