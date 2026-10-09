import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymobEnv } from '@/lib/env';
import { initiatePaymobSession } from '@/utils/paymob';
import { convertCurrency } from '@/utils/currency';
import { getBookingByAccessToken, isPlausibleAccessToken } from '@/utils/bookingToken';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import type { PaymentInitiationRequest, PaymentInitiationResponse } from '@/types/payment';

// Authorisation is the booking accessToken. bookingReference is display-only
// and is never accepted here: this route writes paymentStatus, so accepting a
// guessable identifier would let anyone mutate another customer's booking.
// Defence in depth on top of that.
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

const NO_STORE = { 'cache-control': 'no-store, private' };

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'payments-initiate'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body: PaymentInitiationRequest & { accessToken?: string } = await request.json();

    // Authorisation runs BEFORE the gateway check on purpose. Doing it the other
    // way round answers unauthenticated callers with 500 vs 401, which both
    // leaks whether the gateway is configured and skips the auth path entirely.
    if (!isPlausibleAccessToken(body?.accessToken)) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 401, headers: NO_STORE }
      );
    }

    const booking = await getBookingByAccessToken(body.accessToken);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404, headers: NO_STORE }
      );
    }

    // Defence against a mismatched pair in the payload.
    if (body.bookingReference && body.bookingReference !== booking.bookingReference) {
      return NextResponse.json(
        { error: 'accessToken does not match bookingReference' },
        { status: 401, headers: NO_STORE }
      );
    }

    try {
      verifyPaymobEnv();
    } catch {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500, headers: NO_STORE }
      );
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Booking is already paid' },
        { status: 400, headers: NO_STORE }
      );
    }

    const firstLine = booking.customerName.trim().split(' ');
    const amountUsd = booking.amountPaidOnline && booking.amountPaidOnline > 0
      ? booking.amountPaidOnline
      : booking.totalPriceUSD;

    const { convertedAmount: egpAmount } = await convertCurrency(amountUsd, 'USD', 'EGP');
    const amountCents = Math.round(egpAmount * 100);

    const redirectUrl = await initiatePaymobSession({
      amountCents,
      merchantOrderId: booking.bookingReference,
      billingData: {
        email: booking.customerEmail,
        firstName: firstLine[0] || booking.customerName,
        lastName: firstLine.slice(1).join(' ') || 'NA',
        phoneNumber: booking.customerPhone,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: 'PROCESSING' },
    });

    const response: PaymentInitiationResponse = {
      redirectUrl,
      bookingReference: booking.bookingReference,
      paymentStatus: 'PROCESSING',
    };

    return NextResponse.json(response, { headers: NO_STORE });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment gateway' },
      { status: 500, headers: NO_STORE }
    );
  }
}
