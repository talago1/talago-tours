import { NextRequest, NextResponse } from 'next/server';
import { POST as initializePost } from '@/app/api/checkout/initialize/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If already in initialize format, pass through directly
    if (body.formData) {
      const initReq = new NextRequest(new URL('/api/checkout/initialize', request.url), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body),
      });
      return initializePost(initReq);
    }

    // Convert legacy flat body into authoritative initialize payload
    const transformed = {
      tourId: body.tourId,
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
