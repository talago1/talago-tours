import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone } from '@/utils/sanitize';
import { phoneDigits, phonesEquivalent } from '@/utils/phoneMatch';
import { applySessionCookies, resolveRequestUser } from '@/server/customerSession';
import { adoptOwnedBookings, resolveCustomerProfileForUser } from '@/server/customerBookings';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store, private' };
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * POST /api/public/my-bookings/link
 * Allows an authenticated customer to link an existing guest booking to their account
 * by providing the booking reference and contact phone number used during checkout.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'booking-link'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const auth = await resolveRequestUser(request);
    const user = auth?.user;
    if (!user?.email) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    const { profile } = await resolveCustomerProfileForUser(user);
    if (!profile) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404, headers: NO_STORE });
    }

    const body = await request.json().catch(() => ({}));
    const rawRef = typeof body.bookingReference === 'string' ? body.bookingReference : (body.reference || '');
    const rawPhone = typeof body.phone === 'string' ? body.phone : '';

    const cleanRef = sanitizePlain(rawRef, 50).trim().toUpperCase();
    const cleanPhone = sanitizePhone(rawPhone).trim();

    if (!cleanRef || !cleanPhone) {
      return NextResponse.json(
        { error: 'Both booking reference and contact phone number are required.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const providedDigits = phoneDigits(cleanPhone);
    if (providedDigits.length < 6) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: cleanRef },
          { id: cleanRef },
        ],
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'No booking found matching this reference and phone number.' },
        { status: 404, headers: NO_STORE }
      );
    }

    const storedDigits = phoneDigits(booking.customerPhone);
    const matchesPhone =
      phonesEquivalent(storedDigits, providedDigits) ||
      storedDigits === providedDigits ||
      storedDigits.endsWith(providedDigits) ||
      providedDigits.endsWith(storedDigits);

    if (!matchesPhone) {
      return NextResponse.json(
        { error: 'No booking found matching this reference and phone number.' },
        { status: 404, headers: NO_STORE }
      );
    }

    if (booking.customerProfileId && booking.customerProfileId !== profile.id) {
      const currentOwner = await prisma.customerProfile.findUnique({
        where: { id: booking.customerProfileId },
        select: { id: true, isShadow: true, email: true },
      });

      if (currentOwner && !currentOwner.isShadow && currentOwner.email.toLowerCase() !== profile.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'This booking is already linked to another verified account.' },
          { status: 409, headers: NO_STORE }
        );
      }
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        customerProfileId: profile.id,
      },
    });

    if (!profile.phone && cleanPhone) {
      await prisma.customerProfile.update({
        where: { id: profile.id },
        data: { phone: cleanPhone },
      }).catch(() => {});
    }

    // Trigger adoption of any other matching bookings/leads for this phone/email
    await adoptOwnedBookings({
      profileId: profile.id,
      emails: [user.email, profile.email, booking.customerEmail],
      phones: [profile.phone, cleanPhone, booking.customerPhone],
    }).catch(() => {});

    const response = NextResponse.json(
      {
        success: true,
        message: 'Booking linked successfully to your account.',
        booking: {
          id: booking.id,
          bookingReference: booking.bookingReference,
          customerName: booking.customerName,
          travelDate: booking.travelDate,
          status: booking.status,
          guestCount: booking.guestCount,
        },
      },
      { headers: NO_STORE }
    );

    if (auth?.persist && auth.accessToken) {
      applySessionCookies(response, auth.accessToken, auth.refreshToken);
    }

    return response;
  } catch (err: any) {
    console.error('[my-bookings-link] Error:', err);
    return NextResponse.json(
      { error: 'Failed to link booking. Please try again later.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
