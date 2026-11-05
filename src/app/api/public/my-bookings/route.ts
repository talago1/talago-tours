import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';
import { getPhoneSearchVariants } from '@/utils/sanitize';

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
    let token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null) ||
      request.cookies.get('talago_session')?.value;
    const refreshToken = request.cookies.get('talago_refresh')?.value;

    if (!token && !refreshToken) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    // Verify token with Supabase
    let user: any = null;
    if (token) {
      const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (!authError && userData?.user?.email) {
        user = userData.user;
      }
    }

    // Auto-refresh via refresh_token if access_token is expired or missing
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
        console.warn('[my-bookings] auto-refresh notice:', e);
      }
    }

    if (!user?.email) {
      return NextResponse.json({ authenticated: false, error: 'Invalid session' }, { status: 401, headers: NO_STORE });
    }

    // Match CustomerProfile
    const telegramMatch = user.email.match(/^telegram-(\d+)@noreply\.talago\.com$/);
    const guestMatch = user.email.match(/^guest-(\d+)@noreply\.talago\.com$/);

    let profile = await prisma.customerProfile.findFirst({
      where: {
        OR: [
          { email: user.email },
          ...(telegramMatch ? [{ telegramId: telegramMatch[1] }] : []),
        ],
      },
    });

    // If no profile exists yet in Prisma for this authenticated user, create it
    if (!profile) {
      const initialName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (telegramMatch ? `Traveler #${telegramMatch[1]}` : user.email.split('@')[0]);

      profile = await prisma.customerProfile.create({
        data: {
          email: user.email,
          name: initialName,
          telegramId: telegramMatch ? telegramMatch[1] : undefined,
          isShadow: false,
        },
      }).catch(async () => {
        return prisma.customerProfile.findFirst({
          where: {
            OR: [
              { email: user.email },
              ...(telegramMatch ? [{ telegramId: telegramMatch[1] }] : []),
            ],
          },
        });
      });
    }

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

    // Sync profile phone if telegramPhone exists but phone is not set
    if (profile?.id && !profile.phone && profile.telegramPhone) {
      await prisma.customerProfile.update({
        where: { id: profile.id },
        data: { phone: profile.telegramPhone },
      }).catch(() => {});
    }

    // Collect all candidate phones for identity matching
    const phoneCandidates = [
      profile?.phone,
      profile?.telegramPhone,
      user.user_metadata?.phone,
      (user as any).phone,
      guestMatch ? guestMatch[1] : null,
    ].filter(Boolean) as string[];

    const phoneVariants = new Set<string>();
    for (const p of phoneCandidates) {
      for (const v of getPhoneSearchVariants(p)) {
        phoneVariants.add(v);
      }
    }

    // Build conditions for bookings:
    // Matches by verified email, customerProfileId, or phone variants
    const bookingOr: Prisma.BookingWhereInput[] = [
      { customerEmail: { equals: user.email, mode: 'insensitive' } },
    ];

    if (profile?.id) {
      bookingOr.push({ customerProfileId: profile.id });
    }

    if (profile?.email && profile.email.toLowerCase() !== user.email.toLowerCase()) {
      bookingOr.push({ customerEmail: { equals: profile.email, mode: 'insensitive' } });
    }

    for (const v of phoneVariants) {
      bookingOr.push({ customerPhone: { contains: v } });
    }

    // Build conditions for booking leads / reservations
    const leadOr: Prisma.BookingLeadWhereInput[] = [
      { customerEmail: { equals: user.email, mode: 'insensitive' } },
    ];

    if (profile?.email && profile.email.toLowerCase() !== user.email.toLowerCase()) {
      leadOr.push({ customerEmail: { equals: profile.email, mode: 'insensitive' } });
    }

    for (const v of phoneVariants) {
      leadOr.push({ customerPhone: { contains: v } });
    }

    const [bookings, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: { OR: bookingOr },
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

    // Retroactively adopt unlinked bookings or shadow-profile bookings so they belong to this customer
    if (profile?.id && bookings.length > 0) {
      const unlinkedBookings = bookings.filter((b) => !b.customerProfileId || b.customerProfileId !== profile!.id);
      if (unlinkedBookings.length > 0) {
        const unlinkedIds = unlinkedBookings.map((b) => b.id);
        const foreignProfileIds = unlinkedBookings
          .map((b) => b.customerProfileId)
          .filter((id): id is string => Boolean(id && id !== profile!.id));

        const shadowProfiles = foreignProfileIds.length > 0
          ? await prisma.customerProfile.findMany({
              where: { id: { in: foreignProfileIds }, isShadow: true },
              select: { id: true },
            })
          : [];

        const adoptableProfileIds = shadowProfiles.map((p) => p.id);

        await prisma.booking.updateMany({
          where: {
            id: { in: unlinkedIds },
            OR: [
              { customerProfileId: null },
              ...(adoptableProfileIds.length > 0 ? [{ customerProfileId: { in: adoptableProfileIds } }] : []),
            ],
          },
          data: { customerProfileId: profile.id },
        }).catch((e) => console.warn('[my-bookings] Retroactive link warning:', e));
      }
    }

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
