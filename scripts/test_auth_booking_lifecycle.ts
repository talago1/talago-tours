import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { createSessionToken } from '../src/server/auth';
import { NextRequest } from 'next/server';
import { POST as bookingInterestPOST } from '../src/app/api/public/booking-interest/route';
import { POST as checkoutInitializePOST } from '../src/app/api/checkout/initialize/route';
import { PaymentScheme } from '../src/types/checkout';

console.log('=== RUNNING TALAGO AUTH & CONVERSATION LIFECYCLE VERIFICATION ===\n');

async function main() {
  // Find an active tour in database
  const tour = await prisma.tour.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, slug: true, basePriceUSD: true, basePrice: true },
  });
  assert.ok(tour, 'At least one active tour must exist in database');
  console.log(`Using active tour: ${tour.slug} (${tour.id})`);

  const departureDate = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

  // =========================================================================
  // TEST 1: Telegram-Authenticated Booking Journey
  // =========================================================================
  console.log('\n--- TEST 1: Telegram-Authenticated Booking Flow ---');
  const tgTelegramId = '999888' + Date.now().toString().slice(-4);
  const tgSyntheticEmail = `telegram-${tgTelegramId}@noreply.talago.com`;

  // Create Telegram CustomerProfile
  const tgProfile = await prisma.customerProfile.upsert({
    where: { telegramId: tgTelegramId },
    create: {
      telegramId: tgTelegramId,
      name: 'Alex Telegram User',
      email: tgSyntheticEmail,
      phone: '+201012345678',
      telegramUsername: 'alex_tg_test',
      telegramPhone: '+201012345678',
      telegramPhoneVerified: true,
      isShadow: false,
    },
    update: {
      name: 'Alex Telegram User',
      phone: '+201012345678',
    },
  });
  console.log(`✓ Telegram CustomerProfile verified: id=${tgProfile.id}, name="${tgProfile.name}"`);

  // Mint session token
  const tgSessionToken = await createSessionToken({
    id: tgProfile.id,
    name: tgProfile.name,
    email: tgProfile.email,
    phone: tgProfile.phone,
    telegramId: tgProfile.telegramId,
    telegramUsername: tgProfile.telegramUsername,
    telegramPhone: tgProfile.telegramPhone,
    role: 'CUSTOMER',
    authProvider: 'telegram',
  });

  const tgAttemptId = 'tlg_att_tg_' + Date.now();
  const differentTravelerName = 'Maria Special Guest'; // DIFFERENT from profile name!

  // 1. Submit Booking Interest with Telegram session
  console.log('1.1 Submitting preliminary booking interest for Telegram customer...');
  const interestReq = new NextRequest('http://localhost:3000/api/public/booking-interest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `talago_session=${tgSessionToken}`,
    },
    body: JSON.stringify({
      tourId: tour.id,
      tourSlug: tour.slug,
      attemptId: tgAttemptId,
      travelDate: departureDate,
      adults: 2,
      children: 0,
      totalEstimatedPrice: (tour.basePriceUSD || 50) * 2,
      currency: 'USD',
      source: 'BOOKING_FORM_CONTACT',
      customerName: differentTravelerName,
      customerPhone: '+201012345678',
    }),
  });

  const interestRes = await bookingInterestPOST(interestReq);
  const interestData = await interestRes.json();
  assert.strictEqual(interestRes.status, 200, `Interest submission failed: ${JSON.stringify(interestData)}`);
  assert.ok(interestData.leadId, 'Lead ID must be returned');
  console.log(`✓ Booking interest saved: leadId=${interestData.leadId}, reference=${interestData.reservationReference}`);

  // Verify conversation for preliminary interest
  const interestConv = await prisma.bookingConversation.findFirst({
    where: { visitorToken: `attempt:${tgAttemptId}` },
    include: { messages: true },
  });
  assert.ok(interestConv, 'Conversation must be created with visitorToken "attempt:<attemptId>"');
  assert.strictEqual(interestConv.messages.length, 1, 'Initial conversation must have exactly 1 system message');
  console.log(`✓ Single conversation created: convId=${interestConv.id}, messages=${interestConv.messages.length}`);

  // 1.2 Submit Confirmed Booking for Telegram customer
  console.log('1.2 Submitting confirmed checkout for Telegram customer...');
  const checkoutReq = new NextRequest('http://localhost:3000/api/checkout/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `talago_session=${tgSessionToken}`,
      'Idempotency-Key': tgAttemptId,
    },
    body: JSON.stringify({
      tourId: tour.id,
      reservationId: interestData.leadId,
      attemptId: tgAttemptId,
      idempotencyKey: tgAttemptId,
      departureDate,
      adultsCount: 2,
      childrenCount: 0,
      infantsCount: 0,
      guestCount: 2,
      formData: {
        leadName: differentTravelerName,
        phone: '+201012345678',
        hotelName: 'Steigenberger ALDAU Beach Hotel',
        paymentScheme: PaymentScheme.PAY_ON_ARRIVAL,
        currency: 'USD',
      },
    }),
  });

  const checkoutRes = await checkoutInitializePOST(checkoutReq);
  const checkoutData = await checkoutRes.json();
  assert.strictEqual(checkoutRes.status, 200, `Checkout initialization failed: ${JSON.stringify(checkoutData)}`);
  assert.ok(checkoutData.bookingReference, 'Booking reference must be returned');
  console.log(`✓ Booking initialized & confirmed: ref=${checkoutData.bookingReference}, id=${checkoutData.bookingId}`);

  // Verify Booking persistence in DB
  const savedBooking = await prisma.booking.findUnique({
    where: { bookingReference: checkoutData.bookingReference },
  });
  assert.ok(savedBooking, 'Booking record must exist in PostgreSQL');
  assert.strictEqual(savedBooking.customerProfileId, tgProfile.id, 'Booking MUST be linked to Telegram profile canonical ID');
  assert.strictEqual(savedBooking.customerName, differentTravelerName, 'Booking must store the entered traveler name');
  console.log(`✓ Booking correctly persisted in DB linked to canonical customerId="${savedBooking.customerProfileId}"`);

  // Verify profile was not corrupted
  const freshProfile = await prisma.customerProfile.findUnique({ where: { id: tgProfile.id } });
  assert.strictEqual(freshProfile?.name, 'Alex Telegram User', 'Customer profile name must NOT be overwritten by traveler name');
  console.log(`✓ Customer profile account identity preserved: name="${freshProfile?.name}"`);

  // 1.3 Verify SINGLE conversation shared between interest and confirmation
  const allConvsForTg = await prisma.bookingConversation.findMany({
    where: {
      OR: [
        { visitorToken: `attempt:${tgAttemptId}` },
        { bookingId: savedBooking.id },
      ],
    },
    include: { messages: true },
  });
  assert.strictEqual(allConvsForTg.length, 1, `Must have EXACTLY ONE conversation for this booking attempt, found ${allConvsForTg.length}`);
  const tgSingleConv = allConvsForTg[0];
  assert.strictEqual(tgSingleConv.bookingId, savedBooking.id, 'Conversation bookingId must match confirmed booking');
  assert.strictEqual(tgSingleConv.messages.length, 2, `Conversation must contain both interest and confirmation messages, found ${tgSingleConv.messages.length}`);
  console.log(`✓ EXACTLY ONE conversation shared: convId=${tgSingleConv.id}, messages=${tgSingleConv.messages.length}`);
  console.log(`    Msg 1: ${tgSingleConv.messages[0].body.slice(0, 60)}...`);
  console.log(`    Msg 2: ${tgSingleConv.messages[1].body.slice(0, 60)}...`);

  // =========================================================================
  // TEST 2: Google-Authenticated Booking Journey
  // =========================================================================
  console.log('\n--- TEST 2: Google-Authenticated Booking Flow ---');
  const googleEmail = `sarah.test.${Date.now()}@gmail.com`;
  const googleProfile = await prisma.customerProfile.create({
    data: {
      email: googleEmail,
      name: 'Sarah Google User',
      phone: '+491701234567',
      isShadow: false,
    },
  });
  console.log(`✓ Google CustomerProfile created: id=${googleProfile.id}, email="${googleProfile.email}"`);

  const googleSessionToken = await createSessionToken({
    id: googleProfile.id,
    name: googleProfile.name,
    email: googleProfile.email,
    phone: googleProfile.phone,
    role: 'CUSTOMER',
    authProvider: 'google',
  });

  const googleAttemptId = 'tlg_att_google_' + Date.now();

  // 2.1 Submit Interest
  const gInterestReq = new NextRequest('http://localhost:3000/api/public/booking-interest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `talago_session=${googleSessionToken}`,
    },
    body: JSON.stringify({
      tourId: tour.id,
      tourSlug: tour.slug,
      attemptId: googleAttemptId,
      travelDate: departureDate,
      adults: 1,
      children: 0,
      totalEstimatedPrice: tour.basePriceUSD || 60,
      currency: 'USD',
      source: 'BOOKING_FORM_CONTACT',
      customerName: googleProfile.name,
      customerPhone: googleProfile.phone,
      customerEmail: googleProfile.email,
    }),
  });

  const gInterestRes = await bookingInterestPOST(gInterestReq);
  const gInterestData = await gInterestRes.json();
  assert.strictEqual(gInterestRes.status, 200, 'Google interest submission must succeed');
  console.log(`✓ Google interest saved: leadId=${gInterestData.leadId}`);

  // 2.2 Submit Confirmation
  const gCheckoutPayload = {
    tourId: tour.id,
    reservationId: gInterestData.leadId,
    attemptId: googleAttemptId,
    idempotencyKey: googleAttemptId,
    departureDate,
    adultsCount: 1,
    childrenCount: 0,
    infantsCount: 0,
    guestCount: 1,
    formData: {
      leadName: googleProfile.name,
      email: googleProfile.email,
      phone: googleProfile.phone,
      hotelName: 'Steigenberger ALDAU Beach Hotel',
      paymentScheme: PaymentScheme.PAY_ON_ARRIVAL,
      currency: 'USD',
    },
  };

  const createGoogleCheckoutReq = () =>
    new NextRequest('http://localhost:3000/api/checkout/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `talago_session=${googleSessionToken}`,
        'Idempotency-Key': googleAttemptId,
      },
      body: JSON.stringify(gCheckoutPayload),
    });

  const gCheckoutRes = await checkoutInitializePOST(createGoogleCheckoutReq());
  const gCheckoutData = await gCheckoutRes.json();
  assert.strictEqual(gCheckoutRes.status, 200, 'Google checkout must succeed');
  console.log(`✓ Google booking confirmed: ref=${gCheckoutData.bookingReference}`);

  // Look up saved Google booking for conversation join
  const gSavedBooking = gCheckoutData.bookingId
    ? await prisma.booking.findUnique({ where: { id: gCheckoutData.bookingId } })
    : await prisma.booking.findUnique({ where: { bookingReference: gCheckoutData.bookingReference } });

  // Verify Google SINGLE conversation
  const allConvsForGoogle = await prisma.bookingConversation.findMany({
    where: {
      OR: [
        { visitorToken: `attempt:${googleAttemptId}` },
        { bookingId: gSavedBooking?.id },
      ],
    },
    include: { messages: true },
  });
  assert.strictEqual(allConvsForGoogle.length, 1, `Google must have EXACTLY ONE conversation, found ${allConvsForGoogle.length}`);
  const gSingleConv = allConvsForGoogle[0];
  assert.strictEqual(gSingleConv.messages.length, 2, 'Google conversation must contain both interest and confirmation messages');
  console.log(`✓ Google flow shared single conversation: convId=${gSingleConv.id}, messages=${gSingleConv.messages.length}`);

  // =========================================================================
  // TEST 3: Retrying same submission (Idempotency)
  // =========================================================================
  console.log('\n--- TEST 3: Idempotency & Retry Test ---');
  const retryRes = await checkoutInitializePOST(createGoogleCheckoutReq());
  const retryData = await retryRes.json();
  assert.strictEqual(retryRes.status, 200);
  assert.strictEqual(retryData.bookingReference, gCheckoutData.bookingReference, 'Retry must return the same booking reference');
  assert.strictEqual(retryData.isExisting, true, 'Retry must indicate isExisting: true');

  // Verify no extra conversations or messages were created
  const freshGoogleConvs = await prisma.bookingConversation.findMany({
    where: { visitorToken: `attempt:${googleAttemptId}` },
    include: { messages: true },
  });
  assert.strictEqual(freshGoogleConvs.length, 1);
  assert.strictEqual(freshGoogleConvs[0].messages.length, 2, 'Retry must not append duplicate messages');
  console.log('✓ Idempotency verified: 0 duplicate bookings, 0 duplicate messages, 0 duplicate conversations');

  // =========================================================================
  // TEST 4: Genuinely New Booking Attempt (Separate Conversation)
  // =========================================================================
  console.log('\n--- TEST 4: Separate Attempt by Same Customer ---');
  const newAttemptId = 'tlg_att_google_new_' + Date.now();
  const newInterestReq = new NextRequest('http://localhost:3000/api/public/booking-interest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `talago_session=${googleSessionToken}`,
    },
    body: JSON.stringify({
      tourId: tour.id,
      tourSlug: tour.slug,
      attemptId: newAttemptId,
      travelDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      adults: 3,
      totalEstimatedPrice: (tour.basePriceUSD || 50) * 3,
      customerName: googleProfile.name,
      customerPhone: googleProfile.phone,
      customerEmail: googleProfile.email,
    }),
  });

  const newInterestRes = await bookingInterestPOST(newInterestReq);
  assert.strictEqual(newInterestRes.status, 200);

  const separateConv = await prisma.bookingConversation.findFirst({
    where: { visitorToken: `attempt:${newAttemptId}` },
  });
  assert.ok(separateConv, 'New attempt must have its own conversation');
  assert.notStrictEqual(separateConv.id, gSingleConv.id, 'New attempt conversation must be DISTINCT from prior attempt');
  console.log(`✓ Genuinely new booking attempt created distinct conversation: newConvId=${separateConv.id} != prevConvId=${gSingleConv.id}`);

  console.log('\n======================================================');
  console.log(' ALL 4 LIFECYCLE & PERSISTENCE TESTS PASSED CLEANLY! ');
  console.log('======================================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
