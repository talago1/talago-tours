import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCheckoutForm } from '@/utils/bookingValidation';
import { generateBookingReference } from '@/utils/bookingReference';
import { calculateTotalPrice, calculateTieredPrice } from '@/utils/priceCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tourId,
      zoneId,
      hotelName,
      travelDate,
      guestCount,
      adultsCount,
      childrenCount,
      infantsCount,
      customerName,
      customerEmail,
      customerPhone,
      roomNumber,
      pickupDirectives,
      flightNumbers,
      bedConfiguration,
      specialRequirements,
    } = body;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found', field: 'tourId' },
        { status: 400 }
      );
    }

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return NextResponse.json(
        { error: 'Pickup zone not found', field: 'zoneId' },
        { status: 400 }
      );
    }

    // Resolve effective guest count for legacy validation
    const effectiveGuestCount =
      adultsCount != null
        ? (adultsCount ?? 0) + (childrenCount ?? 0) + (infantsCount ?? 0)
        : guestCount;

    const validationErrors = validateCheckoutForm({
      tourId,
      zoneId,
      hotelName,
      travelDate,
      guestCount: effectiveGuestCount,
      customerName,
      customerEmail,
      customerPhone,
      // Remove maxCapacity cap — allow any number of guests
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstField = Object.keys(validationErrors)[0];
      return NextResponse.json(
        { error: validationErrors[firstField], field: firstField },
        { status: 400 }
      );
    }

    // Calculate price: use tiered if tier counts provided, else legacy
    let totalPriceUSD: number;
    if (adultsCount != null) {
      totalPriceUSD = calculateTieredPrice({
        adultPrice: tour.priceAdult ?? tour.adultPrice,
        childPrice: tour.priceChild ?? tour.childPrice,
        infantPrice: tour.infantPrice,
        adultsCount: adultsCount ?? 0,
        childrenCount: childrenCount ?? 0,
        infantsCount: infantsCount ?? 0,
        zoneTransferFee: zone.transferFee,
      });
    } else {
      totalPriceUSD = calculateTotalPrice({
        perPersonPrice: tour.adultPrice,
        guestCount,
        zoneTransferFee: zone.transferFee,
      });
    }

    const bookingReference = generateBookingReference();
    const normalizedEmail = customerEmail.trim().toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.customerProfile.findUnique({
        where: { email: normalizedEmail },
      });

      const now = new Date();
      const profile = existingProfile
        ? await tx.customerProfile.update({
            where: { id: existingProfile.id },
            data: {
              name: customerName.trim(),
              phone: customerPhone.trim(),
              lastMagicLinkAt: now,
            },
          })
        : await tx.customerProfile.create({
            data: {
              email: normalizedEmail,
              name: customerName.trim(),
              phone: customerPhone.trim(),
              isShadow: true,
              invitedAt: now,
              lastMagicLinkAt: now,
            },
          });

      const booking = await tx.booking.create({
        data: {
          bookingReference,
          tourId,
          zoneId,
          hotelName: hotelName?.trim() ?? '',
          travelDate: new Date(travelDate + 'T00:00:00'),
          guestCount: effectiveGuestCount,
          adultsCount: adultsCount ?? 0,
          childrenCount: childrenCount ?? 0,
          infantsCount: infantsCount ?? 0,
          totalPriceUSD,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          roomNumber: roomNumber?.trim() || null,
          pickupDirectives: pickupDirectives?.trim() || null,
          flightNumbers: flightNumbers?.trim() || null,
          bedConfiguration: bedConfiguration?.trim() || null,
          specialRequirements: specialRequirements?.trim() || null,
          language: 'en',
          status: 'PENDING',
          customerProfileId: profile.id,
        },
      });

      return { booking, shouldInvite: !existingProfile || existingProfile.isShadow };
    });

    // Auto-invite new / shadow guest to Supabase
    if (result.shouldInvite) {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
        await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo: `${siteUrl}/my-bookings`,
        });
      } catch (inviteErr) {
        console.warn('Background auto-invite skipped or failed:', inviteErr);
      }
    }

    return NextResponse.json(
      { bookingReference: result.booking.bookingReference },
      { status: 200 }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
