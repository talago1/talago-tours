import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token with Supabase and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { customerEmail: user.email },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        travelDate: true,
        guestCount: true,
        totalPriceUSD: true,
        currency: true,
        paymentScheme: true,
        amountPaidOnline: true,
        amountDueOnArrival: true,
        createdAt: true,
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
    });

    return NextResponse.json({ bookings, email: user.email });
  } catch (error) {
    console.error('[api/public/my-bookings] GET error:', error);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }
}
