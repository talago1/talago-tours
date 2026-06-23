import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/bookings?id=<uuid>
 * Returns booking details for the public confirmation page.
 * Only exposes safe, customer-facing fields.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const ref = searchParams.get('ref'); // alternate lookup by bookingReference

  if (!id && !ref) {
    return NextResponse.json(
      { error: 'Missing id or ref parameter' },
      { status: 400 },
    );
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: id
        ? { id }
        : { bookingReference: ref! },
      select: {
        id: true,
        bookingReference: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        hotelName: true,
        roomNumber: true,
        travelDate: true,
        guestCount: true,
        adultsCount: true,
        childrenCount: true,
        infantsCount: true,
        totalPriceUSD: true,
        currency: true,
        paymentScheme: true,
        amountPaidOnline: true,
        amountDueOnArrival: true,
        pickupDirectives: true,
        selectedPickupTime: true,
        specialRequirements: true,
        createdAt: true,
        tour: {
          select: {
            id: true,
            slug: true,
            translations: true,
            coverImage: true,
          },
        },
        transaction: {
          select: {
            id: true,
            status: true,
            provider: true,
            gatewayReference: true,
            amountPaidOnline: true,
            amountDueOnArrival: true,
            scheme: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 },
      );
    }

    // Derive a simple collectionDue flag for the frontend
    const collectionDue =
      (booking.amountDueOnArrival ?? 0) > 0 &&
      booking.status !== 'CANCELLED';

    return NextResponse.json({ ...booking, collectionDue });
  } catch (error) {
    console.error('[api/public/bookings] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load booking' },
      { status: 500 },
    );
  }
}
