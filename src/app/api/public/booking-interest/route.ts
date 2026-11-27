import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, sanitizeEmail } from '@/utils/sanitize';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSessionFromRequest } from '@/server/auth';
import { BookingStatus } from '@prisma/client';
import { generateAccessToken } from '@/utils/bookingToken';
import { phoneMatchKey } from '@/utils/phoneMatch';

export const dynamic = 'force-dynamic';

const LIMIT = 40;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_INTEREST_GUESTS = 100;
const MAX_ESTIMATED_PRICE = 1_000_000;

function parseGuestCount(value: unknown, fallback: number, minimum: number): number | null {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > MAX_INTEREST_GUESTS) {
    return null;
  }
  return value;
}

function parseEstimatedPrice(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_ESTIMATED_PRICE) {
    return undefined;
  }
  return value;
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'booking-interest'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json();

    const requestedTourId = body.tourId ? sanitizePlain(body.tourId, 50) : null;
    const requestedTourSlug = body.tourSlug ? sanitizePlain(body.tourSlug, 100) : null;
    let customerName = body.customerName ? sanitizePlain(body.customerName, 100) : null;
    let customerPhone = body.customerPhone ? sanitizePhone(body.customerPhone) : null;
    let customerEmail = body.customerEmail ? sanitizeEmail(body.customerEmail) : null;
    const travelDate = body.travelDate ? sanitizePlain(body.travelDate, 30) : null;
    const adults = parseGuestCount(body.adults, 1, 1);
    const children = parseGuestCount(body.children, 0, 0);
    const totalEstimatedPrice = parseEstimatedPrice(body.totalEstimatedPrice);
    const currency = body.currency ? sanitizePlain(body.currency, 10).toUpperCase() : 'USD';
    const source = body.source ? sanitizePlain(body.source, 50) : 'BOOK_BUTTON';
    const rawAttemptId = body.attemptId || body.idempotencyKey || body.sessionId;
    const attemptId = rawAttemptId ? sanitizePlain(String(rawAttemptId), 100) : null;
    const sessionId = attemptId;
    const notes = body.notes ? sanitizePlain(body.notes, 500) : null;

    if (!requestedTourId && !requestedTourSlug) {
      return NextResponse.json({ error: 'Tour information is required' }, { status: 400 });
    }

    if (adults === null || children === null || adults + children > MAX_INTEREST_GUESTS) {
      return NextResponse.json({ error: `Guest counts must be whole numbers totaling at most ${MAX_INTEREST_GUESTS}.` }, { status: 400 });
    }

    if (totalEstimatedPrice === undefined) {
      return NextResponse.json({ error: 'Estimated price must be a valid non-negative amount.' }, { status: 400 });
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: 'Currency must be a three-letter ISO code.' }, { status: 400 });
    }

    // A signed-in customer is the source of truth for the profile identity.
    const authSession = await getSessionFromRequest(request);
    if (authSession) {
      if (authSession.email && !authSession.email.endsWith('@noreply.talago.com')) {
        customerEmail = customerEmail || authSession.email.toLowerCase();
      }
      if (authSession.phone || authSession.telegramPhone) {
        customerPhone = customerPhone || sanitizePhone(authSession.phone || authSession.telegramPhone);
      }
      if (authSession.name && !customerName) {
        customerName = sanitizePlain(authSession.name, 100);
      }
    } else {
      const authHeader = request.headers.get('authorization');
      const accessToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : null;
      if (accessToken) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken).catch(() => ({ data: { user: null } }));
        if (user?.email) {
          customerEmail = user.email.toLowerCase();
          customerName = sanitizePlain(user.user_metadata?.name, 100) || customerName;
        }
      }
    }

    // Never create leads for a client-invented trip or use a client-supplied
    // title in admin notifications. The catalog is the source of truth.
    const tour = requestedTourId
      ? await prisma.tour.findUnique({
          where: { id: requestedTourId },
          select: { id: true, slug: true, translations: true, status: true, maxCapacity: true },
        })
      : await prisma.tour.findUnique({
          where: { slug: requestedTourSlug! },
          select: { id: true, slug: true, translations: true, status: true, maxCapacity: true },
        });

    if (!tour || tour.status?.toUpperCase() !== 'ACTIVE') {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tourId = tour.id;
    const tourSlug = tour.slug;
    const tourTranslations = tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = tourTranslations?.en?.title || tour.slug;

    // TAL-O3: Overbooking prevention check
    const requestedGuests = (adults || 1) + (children || 0);
    if (travelDate && tour.maxCapacity && tour.maxCapacity > 0) {
      const parsedDate = new Date(travelDate);
      if (!isNaN(parsedDate.getTime())) {
        const dayStart = new Date(parsedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const existingPax = await prisma.booking.aggregate({
          where: {
            tourId: tour.id,
            travelDate: { gte: dayStart, lt: dayEnd },
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          _sum: { guestCount: true },
        });

        const currentOccupancy = existingPax._sum.guestCount ?? 0;
        const availableSpots = Math.max(0, tour.maxCapacity - currentOccupancy);

        if (requestedGuests > availableSpots) {
          return NextResponse.json({
            error: availableSpots <= 0
              ? `This experience is fully booked for ${parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
              : `Only ${availableSpots} spot${availableSpots === 1 ? '' : 's'} remaining for ${parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
            code: 'CAPACITY_EXCEEDED',
            availableSpots,
          }, { status: 409 });
        }
      }
    }

    // Deduplication check: match by idempotencyKey/attemptId or recent INTERESTED booking for same tour + contact
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const parsedTravelDate = travelDate && !isNaN(new Date(travelDate).getTime()) ? new Date(travelDate) : new Date();
    const normalizedPhone = phoneMatchKey(customerPhone);

    const existingBooking = attemptId
      ? await prisma.booking.findFirst({
          where: {
            OR: [
              { idempotencyKey: attemptId },
              {
                tourId,
                status: BookingStatus.INTERESTED,
                ...(customerPhone ? { customerPhone } : customerEmail ? { customerEmail } : {}),
                createdAt: { gte: tenMinutesAgo },
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })
      : (customerPhone || customerEmail)
        ? await prisma.booking.findFirst({
            where: {
              createdAt: { gte: tenMinutesAgo },
              status: BookingStatus.INTERESTED,
              tourId,
              OR: [
                ...(customerPhone ? [{ customerPhone }] : []),
                ...(normalizedPhone ? [{ customerPhoneNormalized: normalizedPhone }] : []),
                ...(customerEmail ? [{ customerEmail }] : []),
              ],
            },
            orderBy: { createdAt: 'desc' },
          })
        : null;

    let booking;
    let isNewNotificationNeeded = false;
    let isNewReservation = false;
    const existingChatToken = request.cookies.get('talago_live_chat')?.value;
    const chatToken = existingChatToken || crypto.randomUUID();

    if (existingBooking) {
      if (existingBooking.status === BookingStatus.CANCELLED) {
        return NextResponse.json(
          { error: 'This booking request was previously withdrawn.', code: 'WITHDRAWN_ATTEMPT' },
          { status: 409 }
        );
      }

      const nextPhone = customerPhone || existingBooking.customerPhone;
      booking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: {
          customerName: customerName || existingBooking.customerName,
          customerPhone: nextPhone,
          customerPhoneNormalized: phoneMatchKey(nextPhone) || existingBooking.customerPhoneNormalized,
          customerEmail: customerEmail || existingBooking.customerEmail,
          travelDate: travelDate ? parsedTravelDate : existingBooking.travelDate,
          adultsCount: adults || existingBooking.adultsCount,
          childrenCount: children ?? existingBooking.childrenCount,
          guestCount: (adults || existingBooking.adultsCount) + (children ?? existingBooking.childrenCount),
          totalPriceUSD: totalEstimatedPrice ?? existingBooking.totalPriceUSD,
          currency: currency || existingBooking.currency,
          source: source || existingBooking.source,
          notes: notes ? `${existingBooking.notes ? existingBooking.notes + ' | ' : ''}${notes}` : existingBooking.notes,
        },
      });

      if (!existingBooking.customerPhone && !existingBooking.customerEmail && (customerPhone || customerEmail)) {
        isNewNotificationNeeded = true;
      }
    } else {
      const refSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      const bookingReference = `RES-${refSuffix}`;
      booking = await prisma.booking.create({
        data: {
          bookingReference,
          accessToken: generateAccessToken(),
          idempotencyKey: sessionId || null,
          tourId,
          tourSlugSnapshot: tourSlug,
          tourTitleSnapshot: tourTitle,
          customerName: customerName || '',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          customerPhoneNormalized: normalizedPhone,
          travelDate: parsedTravelDate,
          adultsCount: adults || 1,
          childrenCount: children || 0,
          infantsCount: 0,
          guestCount: (adults || 1) + (children || 0),
          totalPriceUSD: typeof totalEstimatedPrice === 'number' ? totalEstimatedPrice : 0,
          currency,
          status: BookingStatus.INTERESTED,
          source,
          notes,
        },
      });
      isNewNotificationNeeded = true;
      isNewReservation = true;
    }

    const reservationReference = booking.bookingReference;

    // Ensure 1:1 BookingConversation attached to this canonical Booking
    let conversationId: string | null = null;
    try {
      const conversation = await prisma.bookingConversation.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          visitorName: booking.customerName || undefined,
          visitorEmail: booking.customerEmail || undefined,
          visitorPhone: booking.customerPhone || undefined,
          tourTitle,
          lastPagePath: `/tours/${tourSlug}`,
        },
        update: {
          visitorName: booking.customerName || undefined,
          visitorEmail: booking.customerEmail || undefined,
          visitorPhone: booking.customerPhone || undefined,
          tourTitle,
          lastPagePath: `/tours/${tourSlug}`,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });
      conversationId = conversation.id;

      if (isNewReservation) {
        const reservationMessage = `[${reservationReference}] New preliminary booking request: ${tourTitle}. Travel Date: ${travelDate || 'Flexible'}. Guests: ${adults} adult${adults === 1 ? '' : 's'}${children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}.${totalEstimatedPrice ? ` Estimated value: ${totalEstimatedPrice} ${currency}.` : ''}`;
        await prisma.bookingMessage.create({
          data: { conversationId: conversation.id, sender: 'SYSTEM', body: reservationMessage },
        });
      }
    } catch (chatError) {
      console.error('[booking-interest] conversation mirror failed:', chatError);
    }

    // Trigger Admin Notification for the interest event (points directly to canonical Booking)
    if (isNewNotificationNeeded) {
      const guestDisplay = customerName || (customerPhone ? `Guest (${customerPhone})` : customerEmail ? `Guest (${customerEmail})` : 'Anonymous Visitor');
      const contactInfo = [
        customerPhone ? `📞 ${customerPhone}` : null,
        customerEmail ? `✉️ ${customerEmail}` : null,
      ].filter(Boolean).join(' | ');

      const alertText = `🔔 *New Booking Interest!*\n\n` +
        `🧾 *Reference:* ${reservationReference}\n` +
        `🏝️ *Tour:* ${tourTitle || tourSlug || tourId}\n` +
        `👤 *Guest:* ${guestDisplay}\n` +
        (contactInfo ? `📱 *Contact:* ${contactInfo}\n` : '') +
        (travelDate ? `📅 *Date:* ${travelDate}\n` : '') +
        `👥 *Guests:* ${adults} Adults${children > 0 ? `, ${children} Children` : ''}\n` +
        (totalEstimatedPrice ? `💰 *Est. Value:* $${totalEstimatedPrice} ${currency}\n` : '') +
        `📍 *Source:* ${source}`;

      const interestNotifId = `booking-${booking.id}-interest`;
      const existingNotif = await prisma.notificationLog.findFirst({
        where: { channel: 'LEAD_INTEREST_ALERT', messageId: interestNotifId },
        select: { id: true },
      }).catch(() => null);

      if (!existingNotif) {
        await prisma.notificationLog.create({
          data: {
            bookingId: booking.id,
            channel: 'LEAD_INTEREST_ALERT',
            recipient: 'Admin Dashboard',
            status: 'UNREAD',
            messageId: interestNotifId,
            errorMessage: JSON.stringify({
              bookingId: booking.id,
              bookingReference: reservationReference,
              conversationId,
              customerName: guestDisplay,
              customerPhone: customerPhone || null,
              customerEmail: customerEmail || null,
              tourTitle: tourTitle || tourSlug || tourId,
              travelDate: travelDate || null,
              guests: (adults || 1) + (children || 0),
              totalEstimatedPrice: totalEstimatedPrice ?? null,
              currency,
              source,
            }),
          },
        }).catch(() => {});
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (botToken && chatId) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: alertText,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      leadId: booking.id,
      reservationReference,
      conversationId,
      status: booking.status,
    }, {
      headers: existingChatToken ? undefined : {
        'Set-Cookie': `talago_live_chat=${chatToken}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    });
  } catch (err) {
    console.error('Failed to record booking interest:', err);
    return NextResponse.json({ error: 'Failed to record booking interest' }, { status: 500 });
  }
}
