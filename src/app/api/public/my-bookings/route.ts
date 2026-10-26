import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// This response carries customer PII and each booking's access token.
const NO_STORE = { 'cache-control': 'no-store, private' };

/**
 * GET /api/public/my-bookings
 * Returns all bookings for the authenticated customer.
 * Reads the Authorization Bearer token (Supabase access token) from the request header.
 */
export async function GET(request: NextRequest) {
  try {
    // Get the bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    // Verify the token with Supabase and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401, headers: NO_STORE });
    }

    const [bookings, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: { customerEmail: user.email },
        select: {
          id: true,
          bookingReference: true,
          customerName: true,
          // The caller is already authenticated via Supabase and scoped to their
          // own email, so handing them their own access token is what lets the
          // detail page stay token-gated instead of falling back to the id.
          accessToken: true,
          status: true,
          travelDate: true,
          guestCount: true,
          totalPriceUSD: true,
          currency: true,
          paymentScheme: true,
          amountPaidOnline: true,
          amountDueOnArrival: true,
          createdAt: true,
          tourId: true,
          reviews: {
            select: {
              id: true,
              rating: true,
            },
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
            select: {
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bookingLead.findMany({
        where: {
          customerEmail: { equals: user.email, mode: 'insensitive' },
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
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Derive reservation reference and fetch latest admin reply for each lead
    const chatToken = request.cookies.get('talago_live_chat')?.value;

    const enrichedReservations = await Promise.all(
      reservations.map(async (r) => {
        const reservationReference = `RES-${r.id.slice(-8).toUpperCase()}`;

        // Fetch latest admin reply from conversation linked by visitorToken cookie
        let lastAdminMessage: string | null = null;
        let lastAdminMessageAt: string | null = null;
        let hasUnreadAdminReply = false;

        if (chatToken) {
          try {
            const conversation = await prisma.liveChatConversation.findUnique({
              where: { visitorToken: chatToken },
              select: {
                messages: {
                  where: { sender: 'ADMIN' },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                  select: { body: true, createdAt: true, readAt: true },
                },
              },
            });
            const lastMsg = conversation?.messages[0];
            if (lastMsg) {
              lastAdminMessage = lastMsg.body;
              lastAdminMessageAt = lastMsg.createdAt.toISOString();
              hasUnreadAdminReply = lastMsg.readAt === null;
            }
          } catch {
            // Non-blocking — inbox preview is best-effort
          }
        }

        return {
          ...r,
          reservationReference,
          lastAdminMessage,
          lastAdminMessageAt,
          hasUnreadAdminReply,
        };
      })
    );

    return NextResponse.json({ bookings, reservations: enrichedReservations, email: user.email }, { headers: NO_STORE });
  } catch (error) {
    console.error('[api/public/my-bookings] GET error:', error);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500, headers: NO_STORE });
  }
}
