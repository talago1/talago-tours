import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCheckoutForm, validateGuestTiers, deriveGuestEmail } from '@/utils/bookingValidation';
import { generateBookingReference } from '@/utils/bookingReference';
import { generateAccessToken } from '@/utils/bookingToken';
import { supabaseAdmin } from '@/lib/supabase/server';

import { enforceCapacity, CapacityExceededError } from '@/utils/capacityEngine';
import { initiatePaymobSession } from '@/utils/paymob';
import { validatePromoCode } from '@/utils/promo';
import { computePriceBreakdown } from '@/utils/priceCalculator';
import { PaymentScheme, type InitializeResponse } from '@/types/checkout';
import { BookingStatus, LeadStatus, Prisma } from '@prisma/client';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizeEmail, sanitizePhone, sanitizeText } from '@/utils/sanitize';
import { normalizeCurrency, convertCurrency } from '@/utils/currency';

export const dynamic = 'force-dynamic';

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PAYMENT_SCHEMES = new Set<string>(Object.values(PaymentScheme));

function parseGuestTier(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'checkout-initialize'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

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
    const requestedReservationId = typeof body.reservationId === 'string'
      ? sanitizePlain(body.reservationId, 50)
      : '';

    if (!tourId || !departureDate || !formData) {
      return NextResponse.json(
        { error: 'Missing required parameters: tourId, departureDate, and formData are required.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const leadName = sanitizePlain(formData.leadName, 100);
    const rawEmail = formData.email ? sanitizeEmail(formData.email) : '';
    const phone = sanitizePhone(formData.phone);
    // Phone-only booking: auto-derive a synthetic email if guest didn't provide one
    const isPhoneOnlyBooking = !rawEmail && !!phone;
    const email = rawEmail || deriveGuestEmail(phone || '');
    const normalizedEmail = email.trim().toLowerCase();
    const hotelName = sanitizePlain(formData.hotelName, 150);
    const pickupType = sanitizePlain(formData.pickupType, 50);
    const pickupLocationName = sanitizePlain(formData.pickupLocationName, 150);
    const pickupAddress = sanitizeText(formData.pickupAddress, 300);
    const roomNumber = sanitizePlain(formData.roomNumber, 50);
    const pickupTime = sanitizePlain(formData.pickupTime, 20);
    const paymentScheme = formData.paymentScheme;
    const pickupDirectives = sanitizeText(formData.pickupDirectives, 500);
    const flightNumbers = sanitizePlain(formData.flightNumbers, 100);
    const bedConfiguration = sanitizePlain(formData.bedConfiguration, 100);
    const specialRequirements = sanitizeText(formData.specialRequirements, 1000);
    const currency = normalizeCurrency(formData.currency);

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

    if (typeof paymentScheme !== 'string' || !PAYMENT_SCHEMES.has(paymentScheme)) {
      return NextResponse.json(
        { error: 'A valid payment scheme is required.', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    // Resolve guest counts
    const finalAdultsCount = parseGuestTier(adultsCount, parseGuestTier(guestCount, 1) ?? -1);
    const finalChildrenCount = parseGuestTier(childrenCount, 0);
    const finalInfantsCount = parseGuestTier(infantsCount, 0);
    if (finalAdultsCount === null || finalChildrenCount === null || finalInfantsCount === null) {
      return NextResponse.json(
        { error: 'Guest counts must be whole numbers between 0 and 100.', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const totalGuests = finalAdultsCount + finalChildrenCount + finalInfantsCount;

    // Resolve effective pickup configuration
    const effectivePickupType = (pickupType || tour.pickupType || 'hotel').toLowerCase();

    // Validate checkout fields
    const formErrors = validateCheckoutForm({
      tourId,
      zoneId: tour.zoneId,
      hotelName: hotelName || pickupLocationName || '',
      travelDate: departureDate,
      guestCount: totalGuests,
      customerName: leadName || '',
      customerEmail: email || '',
      customerPhone: phone || '',
      maxGuestCount: tour.maxCapacity,
      pickupType: effectivePickupType,
      requiresHotelPickup: tour.hotelPickupIncluded && effectivePickupType === 'hotel',
      allowPhoneOnly: isPhoneOnlyBooking,
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

    const rawSelectedAddons = body.selectedAddons ?? formData.selectedAddons;
    const rawBookingAnswers = body.bookingAnswers ?? formData.bookingAnswers;

    // Verify dynamic tour addons against tour catalog
    let verifiedAddonsTotal = 0;
    const validatedSelectedAddons: any[] = [];
    if (Array.isArray(rawSelectedAddons) && rawSelectedAddons.length > 0) {
      const tourAddons = Array.isArray(tour.tourOptions) ? (tour.tourOptions as any[]) : [];
      const totalPayingGuests = finalAdultsCount + finalChildrenCount;

      for (const item of rawSelectedAddons) {
        const addonDef = tourAddons.find((a) => a.id === item.id);
        if (addonDef) {
          const unitPrice = Number(addonDef.price) || 0;
          const isPerPerson = addonDef.priceType === 'per_person';
          const itemTotal = isPerPerson ? unitPrice * totalPayingGuests : unitPrice;
          verifiedAddonsTotal += itemTotal;
          validatedSelectedAddons.push({
            id: addonDef.id,
            title: addonDef.title || item.title || 'Addon',
            price: unitPrice,
            priceType: addonDef.priceType,
            quantity: isPerPerson ? totalPayingGuests : 1,
            total: itemTotal,
          });
        }
      }
    }

    // Validate custom booking questions
    const tourQuestions = Array.isArray(tour.bookingQuestions) ? (tour.bookingQuestions as any[]) : [];
    for (const q of tourQuestions) {
      if (q && q.required) {
        const val = rawBookingAnswers ? rawBookingAnswers[q.id] : undefined;
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          return NextResponse.json(
            {
              error: `Please answer required question: "${q.question}"`,
              code: 'VALIDATION_ERROR',
              field: `question_${q.id}`,
            },
            { status: 400 }
          );
        }
      }
    }

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
      addonsTotal: verifiedAddonsTotal,
      depositPercentage: tour.depositPercentage || 0,
      depositType: (tour.depositType as 'PERCENTAGE' | 'FIXED') || 'PERCENTAGE',
      depositAmount: tour.depositAmount ?? null,
      scheme: paymentScheme as PaymentScheme,
      promo: verifiedPromo
        ? { type: verifiedPromo.type, value: verifiedPromo.value, minBookingValue: verifiedPromo.minBookingValue }
        : null,
    });

    const { grandTotal: finalTotal, amountPaidOnline, amountDueOnArrival } = pricing;

    const bookingReference = generateBookingReference();

    // Wrap all record creation in a Serializable transaction.
    // enforceCapacity runs INSIDE the tx using the tx client so that the
    // capacity read and booking insert are a single atomic unit — eliminating
    // the check-then-act race condition.
    const result = await prisma.$transaction(async (tx) => {
      // --- Atomic capacity check (uses tx client, not global prisma) ---
      await enforceCapacity(
        {
          tourId,
          date: new Date(departureDate + 'T00:00:00'),
          requestedGuests: totalGuests,
        },
        tx,
      );

      if (verifiedPromo && promoCodeId) {
        await tx.promoCode.update({
          where: { id: promoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create or update CustomerProfile
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
          accessToken: generateAccessToken(),
          tourId,
          zoneId: tour.zoneId,
          hotelName: hotelName?.trim() || null,
          pickupType: effectivePickupType.toUpperCase(),
          pickupLocationName: (pickupLocationName || hotelName || '').trim() || null,
          pickupAddress: pickupAddress?.trim() || null,
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
          selectedAddons: validatedSelectedAddons.length > 0 ? validatedSelectedAddons : undefined,
          bookingAnswers: rawBookingAnswers && typeof rawBookingAnswers === 'object' && Object.keys(rawBookingAnswers).length > 0 ? rawBookingAnswers : undefined,
          paymentScheme,
          amountPaidOnline,
          amountDueOnArrival,
          promoCodeId: promoCodeId || null,
          customerProfileId: profile.id,
          whatsappOptIn: formData.whatsappOptIn !== undefined ? Boolean(formData.whatsappOptIn) : true,
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
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // A booking is only a conversion after its payment/confirmation state says so.
    // Online payment starts an in-progress lead; the verified webhook completes it.
    try {
      const activeLead = {
        tourId,
        bookingId: null,
        status: { in: [LeadStatus.INTERESTED, LeadStatus.IN_PROGRESS, LeadStatus.CONTACTED] },
      };
      // A reservation from Book now carries its own id. It must belong to the
      // same email address before checkout can convert it to a real booking.
      const matchingLead = requestedReservationId
        ? await prisma.bookingLead.findFirst({
            where: {
              ...activeLead,
              id: requestedReservationId,
              customerEmail: { equals: normalizedEmail, mode: 'insensitive' },
            },
          })
        : await prisma.bookingLead.findFirst({
            where: {
              ...activeLead,
              OR: [
                { customerEmail: normalizedEmail },
                { customerPhone: phone.trim() },
              ],
            },
            orderBy: { createdAt: 'desc' },
          });
      if (matchingLead) {
        await prisma.bookingLead.update({
          where: { id: matchingLead.id },
          data: {
            bookingId: result.booking.id,
            status: (paymentScheme === PaymentScheme.PAY_ON_ARRIVAL ? 'CONVERTED' : 'IN_PROGRESS') as any,
            customerName: leadName.trim(),
            customerEmail: email.trim(),
            customerPhone: phone.trim(),
            updatedAt: new Date(),
          },
        });
      }
    } catch (leadLinkErr) {
      console.warn('[initialize] Lead linking non-fatal warning:', leadLinkErr);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification dispatch: PDF boarding pass + WhatsApp + Telegram
    // Bounded with Promise.race so serverless execution context stays alive
    // until completion, while never blocking guest response longer than 4000ms.
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const dispatchTask = async () => {
        const { generateAndStoreBoardingPassPdf } = await import('@/utils/pdfGenerator');
        const pdfUrl = await generateAndStoreBoardingPassPdf(result.booking.id);

        const { dispatchBookingNotifications } = await import('@/utils/notificationDispatcher');
        await dispatchBookingNotifications(result.booking.id, pdfUrl ?? undefined);
      };

      await Promise.race([
        dispatchTask(),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
    } catch (bgErr) {
      console.error('[initialize] Notification dispatch failed:', bgErr);
    }

    const responsePayload: InitializeResponse = {
      bookingId: result.booking.id,
      accessToken: result.booking.accessToken,
      transactionId: result.transaction.id,
      amountPaidOnline,
      amountDueOnArrival,
      scheme: paymentScheme as PaymentScheme,
      // The confirmation page is reached with the access token, not the id and
      // not the human-readable bookingReference.
      confirmationUrl: `/booking/${result.booking.accessToken}`,
    };

    // Trigger Supabase invitation email for new/shadow profiles with real emails only.
    // Skip the Supabase invite for synthetic noreply addresses (phone-only guests).
    if (result.shouldInvite && !isPhoneOnlyBooking) {
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
          console.log('Sent auto-invite email.');
        }
      } catch (err) {
        console.error('Supabase auto-invite background failure:', err);
      }
    }

    // If online payment is needed, run gateway handshake
    if (paymentScheme !== PaymentScheme.PAY_ON_ARRIVAL && amountPaidOnline > 0) {
      try {
        const firstLine = leadName.trim().split(' ');
        // Authoritative server-side currency conversion to EGP piastres for Paymob
        const { convertedAmount: egpAmount } = await convertCurrency(amountPaidOnline, 'USD', 'EGP');
        const amountCents = Math.round(egpAmount * 100);

        const gatewayIframeUrl = await initiatePaymobSession({
          amountCents,
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
    if (error instanceof CapacityExceededError) {
      return NextResponse.json(
        { error: error.message, code: 'CAPACITY_EXCEEDED' },
        { status: 409 }
      );
    }
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2034') {
      return NextResponse.json(
        {
          error: 'This experience is experiencing high booking demand. Please try confirming again.',
          code: 'CONCURRENCY_CONFLICT',
        },
        { status: 409 }
      );
    }
    console.error('Checkout initialize API error:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
