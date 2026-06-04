import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateCheckoutForm } from '@/utils/bookingValidation';
import { generateBookingReference } from '@/utils/bookingReference';
import { calculateTotalPrice } from '@/utils/priceCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tourId,
      zoneId,
      hotelName,
      travelDate,
      guestCount,
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

    const validationErrors = validateCheckoutForm({
      tourId,
      zoneId,
      hotelName,
      travelDate,
      guestCount,
      customerName,
      customerEmail,
      customerPhone,
      maxGuestCount: tour.maxCapacity,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstField = Object.keys(validationErrors)[0];
      return NextResponse.json(
        { error: validationErrors[firstField], field: firstField },
        { status: 400 }
      );
    }

    const totalPriceUSD = calculateTotalPrice({
      perPersonPrice: tour.adultPrice,
      guestCount,
      zoneTransferFee: zone.transferFee,
    });

    const bookingReference = generateBookingReference();

    const booking = await prisma.booking.create({
      data: {
        bookingReference,
        tourId,
        zoneId,
        hotelName: hotelName.trim(),
        travelDate: new Date(travelDate + 'T00:00:00'),
        guestCount,
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
      },
    });

    return NextResponse.json(
      { bookingReference: booking.bookingReference },
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
