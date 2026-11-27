import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';
import { applySessionCookies, resolveRequestUser } from '@/server/customerSession';
import {
  collectIdentityEmails,
  resolveCustomerProfileForUser,
  formatUserProfile,
} from '@/server/customerBookings';
import { collectPhoneKeys, exactPhoneVariants } from '@/utils/phoneMatch';

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

    // Single-roundtrip indexed OR filter on canonical Booking (includes INTERESTED, PENDING, CONFIRMED, COMPLETED, CANCELLED)
    const identityEmails = collectIdentityEmails(emails, phones);
    const phoneKeys = collectPhoneKeys(phones);
    const phoneVariants = [...new Set(phones.flatMap((p) => exactPhoneVariants(p)))];

    const bookingOrConditions: any[] = [{ customerProfileId: profile.id }];
    for (const email of identityEmails) {
      bookingOrConditions.push({ customerEmail: { equals: email, mode: 'insensitive' as const } });
    }
    if (phoneKeys.length > 0) {
      bookingOrConditions.push({ customerPhoneNormalized: { in: phoneKeys } });
    }
    if (phoneVariants.length > 0) {
      bookingOrConditions.push({ customerPhone: { in: phoneVariants } });
    }

    const rawBookings = await prisma.booking.findMany({
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
        tourTitleSnapshot: true,
        tourSlugSnapshot: true,
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
            translations: true,
            durationHours: true,
            freeCancellationHours: true,
          },
        },
        transaction: {
          select: { status: true },
        },
        conversation: {
          select: {
            id: true,
            messages: {
              where: { sender: 'ADMIN' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                body: true,
                readAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: [{ travelDate: 'asc' }, { id: 'asc' }],
    }).catch((err) => {
      console.error('[my-bookings] bookings query error:', err);
      return [];
    });

    const hasMore = rawBookings.length > pageSize;
    const allFetched = hasMore ? rawBookings.slice(0, pageSize) : rawBookings;

    const interestedBookings = allFetched.filter((b) => b.status === 'INTERESTED');
    const bookings = allFetched.filter((b) => b.status !== 'INTERESTED');

    const formattedReservations = interestedBookings.map((r) => {
      const lastMsg = r.conversation?.messages?.[0] || null;
      const unread = lastMsg ? !lastMsg.readAt : false;
      const tourTitle = r.tour
        ? getLocalizedTourTitle(r.tour.translations, r.language || 'en')
        : r.tourTitleSnapshot || 'Tour Experience';
      return {
        id: r.id,
        leadId: r.id,
        attemptId: r.idempotencyKey || null,
        reservationReference: r.bookingReference,
        tourId: r.tourId,
        tourTitle,
        tourSlug: r.tour?.slug || r.tourSlugSnapshot || null,
        adults: r.adultsCount || 1,
        children: r.childrenCount || 0,
        totalEstimatedPrice: r.totalPriceUSD,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        travelDate: r.travelDate ? r.travelDate.toISOString().split('T')[0] : null,
        lastAdminMessage: lastMsg?.body || null,
        lastAdminMessageAt: lastMsg?.createdAt?.toISOString() || null,
        hasUnreadAdminReply: unread,
      };
    });

    const formattedBookings = bookings.map((b) => {
      const lastMsg = b.conversation?.messages?.[0] || null;
      const unread = lastMsg ? !lastMsg.readAt : false;
      const { bookingAnswers, tour, conversation, ...bookingFields } = b as typeof b & {
        bookingAnswers?: { _cancellationRequest?: { status?: string } } | null;
        tour?: { translations?: unknown } | null;
        conversation?: unknown;
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
