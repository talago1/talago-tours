import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaymobEnv } from '@/lib/env';
import { initiatePaymobSession } from '@/utils/paymob';
import type { PaymentInitiationRequest, PaymentInitiationResponse } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    verifyPaymobEnv();
  } catch {
    return NextResponse.json(
      { error: 'Payment gateway not configured' },
      { status: 500 }
    );
  }

  try {
    const body: PaymentInitiationRequest = await request.json();

    if (!body.bookingReference) {
      return NextResponse.json(
        { error: 'bookingReference is required' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingReference: body.bookingReference },
      include: {
        tour: { select: { translations: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Booking is already paid' },
        { status: 400 }
      );
    }

    const translations = booking.tour.translations as Record<string, { title?: string }> | null;
    const firstLine = booking.customerName.trim().split(' ');

    const redirectUrl = await initiatePaymobSession({
      amountCents: Math.round(booking.totalPriceUSD * 100),
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment gateway' },
      { status: 500 }
    );
  }
}
