import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCheckoutForm, validateGuestTiers } from '@/utils/bookingValidation';
import { generateBookingReference } from '@/utils/bookingReference';
import { supabaseAdmin } from '@/lib/supabase/server';

import { enforceCapacity, CapacityExceededError } from '@/utils/capacityEngine';
import { initiatePaymobSession } from '@/utils/paymob';
import { validatePromoCode } from '@/utils/promo';
import { computePriceBreakdown } from '@/utils/priceCalculator';
import { PaymentScheme, type InitializeResponse } from '@/types/checkout';
import { BookingStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tourId,
      departureDate,
      guestCount,
      adultsCount,
      childrenCount,
      infantsCount,
      formData,
      promoCode,
    } = body;

    if (!tourId || !departureDate || !formData) {
      return NextResponse.json(
        { error: 'Missing required parameters: tourId, departureDate, and formData are required.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const {
      leadName,
      email,
      phone,
      hotelName,
      roomNumber,
      pickupTime,
      paymentScheme,
      pickupDirectives,
      flightNumbers,
      bedConfiguration,
      specialRequirements,
      currency,
    } = formData;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { zone: true },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Resolve guest counts
    const finalAdultsCount = adultsCount != null ? Number(adultsCount) : (guestCount || 1);
    const finalChildrenCount = childrenCount != null ? Number(childrenCount) : 0;
    const finalInfantsCount = infantsCount != null ? Number(infantsCount) : 0;
    const totalGuests = finalAdultsCount + finalChildrenCount + finalInfantsCount;

    // Validate checkout fields
    const formErrors = validateCheckoutForm({
      tourId,
      zoneId: tour.zoneId,
      hotelName: hotelName || '',
      travelDate: departureDate,
      guestCount: totalGuests,
      customerName: leadName || '',
      customerEmail: email || '',
      customerPhone: phone || '',
    });

    // Tier validation check
    const guestTierError = validateGuestTiers(finalAdultsCount, finalChildrenCount, finalInfantsCount);
    if (guestTierError) {
      formErrors.guests = guestTierError;
    }

    if (Object.keys(formErrors).length > 0) {
      const firstField = Object.keys(formErrors)[0];
      return NextResponse.json(
        { error: formErrors[firstField], code: 'VALIDATION_ERROR', fields: formErrors },
        { status: 400 }
      );
    }

    // Enforce capacity check
    try {
      await enforceCapacity({
        tourId,
        date: new Date(departureDate + 'T00:00:00'),
        requestedGuests: totalGuests,
      });
    } catch (capacityErr) {
      if (capacityErr instanceof CapacityExceededError) {
        return NextResponse.json(
          { error: capacityErr.message, code: 'CAPACITY_EXCEEDED' },
          { status: 409 }
        );
      }
      throw capacityErr;
    }

    // Resolve price tiers
    const effectiveAdultPrice = tour.priceAdult ?? tour.adultPrice;
    const effectiveChildPrice = tour.priceChild ?? tour.childPrice ?? effectiveAdultPrice;
    const effectiveInfantPrice = tour.infantPrice ?? 0;
    const zoneTransferFee = tour.zone?.transferFee ?? 0;

    // Validate promo code on server
    let promoCodeId: string | null = null;
    let verifiedPromo = null;
    if (promoCode) {
      verifiedPromo = await validatePromoCode(promoCode);
      if (verifiedPromo) {
        promoCodeId = verifiedPromo.id;
      }
    }

    // Single-source pricing calculation
    const pricing = computePriceBreakdown({
      adultsCount: finalAdultsCount,
      childrenCount: finalChildrenCount,
      infantsCount: finalInfantsCount,
      adultPrice: effectiveAdultPrice,
      childPrice: effectiveChildPrice,
      infantPrice: effectiveInfantPrice,
      zoneTransferFee,
      depositPercentage: tour.depositPercentage || 0,
      scheme: paymentScheme as PaymentScheme,
      promo: verifiedPromo
        ? { type: verifiedPromo.type, value: verifiedPromo.value, minBookingValue: verifiedPromo.minBookingValue }
        : null,
    });

    const { grandTotal: finalTotal, amountPaidOnline, amountDueOnArrival } = pricing;

    const bookingReference = generateBookingReference();

    // Wrap record creation in database transaction
    const result = await prisma.$transaction(async (tx) => {
      // If valid promo code used, increment its count
      if (verifiedPromo && promoCodeId) {
        await tx.promoCode.update({
          where: { id: promoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create or update CustomerProfile
      const normalizedEmail = email.trim().toLowerCase();
      const existingProfile = await tx.customerProfile.findUnique({
        where: { email: normalizedEmail },
      });

      const now = new Date();
      const profile = existingProfile
        ? await tx.customerProfile.update({
            where: { id: existingProfile.id },
            data: {
              name: leadName.trim(),
              phone: phone.trim(),
              lastMagicLinkAt: now,
            },
          })
        : await tx.customerProfile.create({
            data: {
              email: normalizedEmail,
              name: leadName.trim(),
              phone: phone.trim(),
              isShadow: true,
              invitedAt: now,
              lastMagicLinkAt: now,
            },
          });

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          tourId,
          zoneId: tour.zoneId,
          hotelName: hotelName?.trim() || null,
          travelDate: new Date(departureDate + 'T00:00:00'),
          guestCount: totalGuests,
          adultsCount: finalAdultsCount,
          childrenCount: finalChildrenCount,
          infantsCount: finalInfantsCount,
          totalPriceUSD: finalTotal,
          customerName: leadName.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          roomNumber: roomNumber?.trim() || null,
          selectedPickupTime: pickupTime || null,
          pickupDirectives: pickupDirectives?.trim() || null,
          flightNumbers: flightNumbers?.trim() || null,
          currency: currency || 'USD',
          bedConfiguration: bedConfiguration?.trim() || null,
          specialRequirements: specialRequirements?.trim() || null,
          paymentScheme,
          amountPaidOnline,
          amountDueOnArrival,
          promoCodeId: promoCodeId || null,
          customerProfileId: profile.id,
          status: paymentScheme === PaymentScheme.PAY_ON_ARRIVAL ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
          paymentStatus: paymentScheme === PaymentScheme.PAY_ON_ARRIVAL ? 'CASH' : 'PENDING',
        },
      });

      // Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          bookingId: booking.id,
          provider: paymentScheme === PaymentScheme.PAY_ON_ARRIVAL ? 'CASH' : 'PAYMOB',
          gatewayReference: booking.bookingReference,
          amountPaidOnline,
          amountDueOnArrival,
          scheme: paymentScheme,
          status: paymentScheme === PaymentScheme.PAY_ON_ARRIVAL ? 'SUCCESS' : 'PENDING',
        },
      });

      return { booking, transaction, shouldInvite: !existingProfile || existingProfile.isShadow };
    });

    const responsePayload: InitializeResponse = {
      bookingId: result.booking.id,
      transactionId: result.transaction.id,
      amountPaidOnline,
      amountDueOnArrival,
      scheme: paymentScheme,
      confirmationUrl: `/booking/${result.booking.id}`,
    };

    // Trigger Supabase invitation email for new/shadow profile
    if (result.shouldInvite) {
      try {
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin}/my-bookings`,
          }
        );
        if (inviteError) {
          console.log('Supabase auto-invite notice:', inviteError.message);
        } else {
          console.log('Sent auto-invite email to:', email);
        }
      } catch (err) {
        console.error('Supabase auto-invite background failure:', err);
      }
    }

    // If online payment is needed, run gateway handshake
    if (paymentScheme !== PaymentScheme.PAY_ON_ARRIVAL && amountPaidOnline > 0) {
      try {
        const firstLine = leadName.trim().split(' ');
        const gatewayIframeUrl = await initiatePaymobSession({
          amountCents: Math.round(amountPaidOnline * 100),
          merchantOrderId: result.booking.bookingReference,
          billingData: {
            email: email.trim(),
            firstName: firstLine[0] || leadName,
            lastName: firstLine.slice(1).join(' ') || 'NA',
            phoneNumber: phone.trim(),
          },
        });
        responsePayload.gatewayIframeUrl = gatewayIframeUrl;
      } catch (gatewayErr) {
        console.error('Paymob session initiation failed during initialize:', gatewayErr);
        return NextResponse.json(
          {
            error: 'Payment gateway is temporarily unavailable. Please try again or choose Pay on Arrival.',
            code: 'GATEWAY_UNAVAILABLE',
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error('Checkout initialize API error:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
