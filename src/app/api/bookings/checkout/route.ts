import { NextRequest, NextResponse } from 'next/server';
import { POST as initializePost } from '@/app/api/checkout/initialize/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If already in initialize format, pass through directly.
    // Preserve the booking-attempt identifiers: initialize() reads
    // reservationId (the INTERESTED booking id) / attemptId /
    // idempotencyKey from the body, so a caller that only sent the
    // Idempotency-Key header would otherwise lose the attempt identity.
    if (body.formData) {
      const headerIdempotencyKey = request.headers.get('idempotency-key');
      const forwardedBody = {
        ...body,
        reservationId: body.reservationId,
        attemptId: body.attemptId || body.idempotencyKey || headerIdempotencyKey || undefined,
        idempotencyKey: body.idempotencyKey || headerIdempotencyKey || undefined,
      };
      const initReq = new NextRequest(new URL('/api/checkout/initialize', request.url), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(forwardedBody),
      });
      return initializePost(initReq);
    }

    // Convert legacy flat body into authoritative initialize payload.
    // Preserve the attempt identifiers — previously reservationId was
    // dropped here, so initialize() could not resume the INTERESTED
    // booking and a second booking/conversation could appear.
    const headerIdempotencyKey = request.headers.get('idempotency-key');
    const transformed = {
      tourId: body.tourId,
      reservationId: body.reservationId,
      attemptId: body.attemptId || body.idempotencyKey || headerIdempotencyKey,
      idempotencyKey: body.idempotencyKey || headerIdempotencyKey,
      departureDate: body.travelDate || body.departureDate,
      adultsCount: body.adultsCount != null ? Number(body.adultsCount) : (body.guestCount || 1),
      childrenCount: body.childrenCount != null ? Number(body.childrenCount) : 0,
      infantsCount: body.infantsCount != null ? Number(body.infantsCount) : 0,
      guestCount: body.guestCount || ((body.adultsCount || 1) + (body.childrenCount || 0) + (body.infantsCount || 0)),
      selectedAddons: body.selectedAddons,
      bookingAnswers: body.bookingAnswers,
      promoCode: body.promoCode,
      formData: {
        leadName: body.customerName || body.leadName || '',
        email: body.customerEmail || body.email || '',
        phone: body.customerPhone || body.phone || '',
        hotelName: body.hotelName || '',
        pickupType: body.pickupType,
        pickupLocationName: body.pickupLocationName || body.hotelName,
        pickupAddress: body.pickupAddress,
        roomNumber: body.roomNumber,
        pickupDirectives: body.pickupDirectives,
        flightNumbers: body.flightNumbers,
        bedConfiguration: body.bedConfiguration,
        specialRequirements: body.specialRequirements,
        paymentScheme: body.paymentScheme || 'pay_on_arrival',
        currency: body.currency || 'USD',
        whatsappOptIn: body.whatsappOptIn !== undefined ? Boolean(body.whatsappOptIn) : true,
      },
    };

    const initReq = new NextRequest(new URL('/api/checkout/initialize', request.url), {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(transformed),
    });
    return initializePost(initReq);
  } catch (err: any) {
    console.error('[POST /api/bookings/checkout] delegation error:', err);
    return NextResponse.json({ error: err?.message || 'Checkout failed' }, { status: 500 });
  }
}
