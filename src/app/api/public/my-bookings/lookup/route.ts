import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone } from '@/utils/sanitize';

export const dynamic = 'force-dynamic';

const LIMIT = 8;
const WINDOW_MS = 10 * 60 * 1000;
const NO_STORE = { 'cache-control': 'no-store, private' };

const GENERIC_NOT_FOUND =
  'No booking or reservation found matching this reference and phone number. Please check your details and try again.';

export async function POST(request: NextRequest) {
  // 1. Strict rate limiting to prevent guessing or enumeration attacks
  const limit = rateLimit(clientKey(request, 'booking-lookup'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawRef = typeof body.reference === 'string' ? body.reference : '';
    const rawPhone = typeof body.phone === 'string' ? body.phone : '';

    const reference = sanitizePlain(rawRef, 50).trim();
    const phone = sanitizePhone(rawPhone).trim();

    if (!reference || !phone) {
      return NextResponse.json(
        { error: 'Both booking reference and contact phone number are required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const cleanRef = reference.toUpperCase();
    const providedDigits = phone.replace(/[^\d]/g, '');

    if (providedDigits.length < 6) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number with country code.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // Helper: checks if two phone strings share significant digits
    const matchesPhone = (storedPhone: string | null | undefined): boolean => {
      if (!storedPhone) return false;
      const storedDigits = storedPhone.replace(/[^\d]/g, '');
      if (storedDigits.length < 6) return false;
      return (
        storedDigits === providedDigits ||
        storedDigits.endsWith(providedDigits) ||
        providedDigits.endsWith(storedDigits)
      );
    };

    // 2. Check confirmed Bookings first
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: cleanRef },
          { id: reference },
        ],
      },
      include: {
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
    });

    if (booking) {
      if (!matchesPhone(booking.customerPhone)) {
        // Return same generic message to prevent reference existence discovery
        return NextResponse.json(
          { error: GENERIC_NOT_FOUND },
          { status: 404, headers: NO_STORE }
        );
      }

      return NextResponse.json(
        {
          success: true,
          type: 'BOOKING',
          booking: {
            id: booking.id,
            bookingReference: booking.bookingReference,
            accessToken: booking.accessToken,
            customerName: booking.customerName,
            status: booking.status,
            travelDate: booking.travelDate,
            guestCount: booking.guestCount,
            totalPriceUSD: booking.totalPriceUSD,
            currency: booking.currency,
            paymentScheme: booking.paymentScheme,
            amountDueOnArrival: booking.amountDueOnArrival,
            amountPaidOnline: booking.amountPaidOnline,
            createdAt: booking.createdAt,
            tour: booking.tour,
            transaction: booking.transaction,
          },
        },
        { status: 200, headers: NO_STORE }
      );
    }

    // 3. Check pending Reservation Leads
    const cleanLeadSuffix = cleanRef.replace(/^RES-/, '');
    const lead = await prisma.bookingLead.findFirst({
      where: {
        OR: [
          { id: { endsWith: cleanLeadSuffix } },
          { id: reference },
        ],
      },
    });

    if (lead) {
      if (!matchesPhone(lead.customerPhone)) {
        return NextResponse.json(
          { error: GENERIC_NOT_FOUND },
          { status: 404, headers: NO_STORE }
        );
      }

      const reservationReference = `RES-${lead.id.slice(-8).toUpperCase()}`;

      return NextResponse.json(
        {
          success: true,
          type: 'RESERVATION',
          reservation: {
            id: lead.id,
            reservationReference,
            tourId: lead.tourId,
            tourTitle: lead.tourTitle,
            tourSlug: lead.tourSlug,
            adults: lead.adults,
            children: lead.children,
            totalEstimatedPrice: lead.totalEstimatedPrice,
            currency: lead.currency,
            status: lead.status,
            travelDate: lead.travelDate,
            createdAt: lead.createdAt,
          },
        },
        { status: 200, headers: NO_STORE }
      );
    }

    // 4. Neither matched
    return NextResponse.json(
      { error: GENERIC_NOT_FOUND },
      { status: 404, headers: NO_STORE }
    );
  } catch (err: any) {
    console.error('[booking-lookup] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.' },
      { status: 500, headers: NO_STORE }
    );
  }
}

