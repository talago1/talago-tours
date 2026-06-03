import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { initiatePaymobSession, initiateFawrySession, getDefaultProvider } from '@/utils/payment';
import { enforceCapacity, CapacityExceededError } from '@/utils/capacityEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutSessionRequest {
  bookingId: string;
  provider?: 'PAYMOB' | 'FAWRY';
}

interface CheckoutSessionResponse {
  redirectUrl: string;
  provider: string;
  bookingReference: string;
  amountCents: number;
}

interface CheckoutErrorResponse {
  error: string;
  code: string;
  remainingSeats?: number;
}

// ---------------------------------------------------------------------------
// POST — Create a checkout session for an existing booking
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CheckoutSessionResponse | CheckoutErrorResponse>> {
  try {
    const body: CheckoutSessionRequest = await request.json();
    const { bookingId, provider: requestedProvider } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    // Fetch booking with transaction
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        transaction: true,
        tour: { select: { id: true, maxCapacity: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Booking is already ${booking.status}. Cannot initiate payment.`, code: 'INVALID_STATE' },
        { status: 409 },
      );
    }

    // Re-validate capacity before payment
    try {
      await enforceCapacity({
        tourId: booking.tourId,
        date: booking.travelDate,
        timeSlotId: booking.timeSlotId,
        requestedGuests: booking.guestCount,
      });
    } catch (capacityErr) {
      if (capacityErr instanceof CapacityExceededError) {
        return NextResponse.json(
          {
            error: capacityErr.message,
            code: 'CAPACITY_EXCEEDED',
            remainingSeats: capacityErr.remainingSeats,
          },
          { status: 409 },
        );
      }
      throw capacityErr;
    }

    // Determine payment amount
    const amountToPay = booking.transaction
      ? Number(booking.transaction.amountPaidOnline)
      : booking.totalPriceUSD;

    if (amountToPay <= 0) {
      return NextResponse.json(
        { error: 'No online payment amount due for this booking.', code: 'NO_AMOUNT_DUE' },
        { status: 400 },
      );
    }

    const amountCents = Math.round(amountToPay * 100);
    const provider = requestedProvider ?? getDefaultProvider();

    let redirectUrl: string;

    if (provider === 'FAWRY') {
      redirectUrl = await initiateFawrySession(amountToPay, booking.id);
    } else {
      redirectUrl = await initiatePaymobSession(amountToPay, booking.id);
    }

    // Update transaction with gateway reference if exists
    if (booking.transaction) {
      await prisma.transaction.update({
        where: { id: booking.transaction.id },
        data: {
          provider,
          gatewayReference: booking.id,
        },
      });
    } else {
      await prisma.transaction.create({
        data: {
          bookingId: booking.id,
          provider,
          gatewayReference: booking.id,
          amountPaidOnline: amountToPay,
          amountDueOnArrival: 0,
          scheme: 'FULL_ONLINE',
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      redirectUrl,
      provider,
      bookingReference: booking.bookingReference,
      amountCents,
    });
  } catch (error) {
    console.error('Public checkout session error:', error);

    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        { error: 'Payment gateway is temporarily unavailable. Please try again later.', code: 'GATEWAY_UNAVAILABLE' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
