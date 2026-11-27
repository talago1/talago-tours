import { NextRequest, NextResponse } from 'next/server';
import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, sanitizeEmail, sanitizeText } from '@/utils/sanitize';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateAccessToken } from '@/utils/bookingToken';
import { phoneMatchKey } from '@/utils/phoneMatch';

export const dynamic = 'force-dynamic';

const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'tour-inquiry'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const body = await request.json();

    const requestedTourId = body.tourId ? sanitizePlain(body.tourId, 50) : null;
    const requestedTourSlug = body.tourSlug ? sanitizePlain(body.tourSlug, 100) : null;
    let customerName = body.customerName ? sanitizePlain(body.customerName, 100) : null;
    const customerPhone = body.customerPhone ? sanitizePhone(body.customerPhone) : null;
    let customerEmail = body.customerEmail ? sanitizeEmail(body.customerEmail) : null;
    const message = body.message ? sanitizeText(body.message, 2000) : null;
    const travelDate = body.travelDate ? sanitizePlain(body.travelDate, 30) : null;
    const adults = typeof body.adults === 'number' && body.adults > 0 ? Math.min(body.adults, 50) : 1;
    const sessionId = body.sessionId ? sanitizePlain(body.sessionId, 100) : null;

    if (!requestedTourId && !requestedTourSlug) {
      return NextResponse.json({ error: 'Tour information is required.' }, { status: 400 });
    }

    if (!message || message.trim().length < 5) {
      return NextResponse.json({ error: 'Please enter a question of at least 5 characters.' }, { status: 400 });
    }

    // Authenticated profile resolution
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;
    if (accessToken) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
      if (user?.email) {
        customerEmail = user.email.toLowerCase();
        customerName = sanitizePlain(user.user_metadata?.name, 100) || customerName;
      }
    }

    if (!customerEmail && !customerPhone) {
      return NextResponse.json({ error: 'Please provide an email or phone number so we can answer you.' }, { status: 400 });
    }

    // Verify tour exists
    const tour = requestedTourId
      ? await prisma.tour.findUnique({
          where: { id: requestedTourId },
          select: { id: true, slug: true, translations: true, status: true },
        })
      : await prisma.tour.findUnique({
          where: { slug: requestedTourSlug! },
          select: { id: true, slug: true, translations: true, status: true },
        });

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found.' }, { status: 404 });
    }

    const tourTranslations = tour.translations as Record<string, { title?: string }> | null;
    const tourTitle = tourTranslations?.en?.title || tour.slug;

    // Deduplication check: recent active inquiry within last 5 minutes on canonical Booking
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const normalizedPhone = phoneMatchKey(customerPhone);
    const existingInquiry = await prisma.booking.findFirst({
      where: {
        createdAt: { gte: fiveMinutesAgo },
        source: 'INQUIRY',
        status: BookingStatus.INTERESTED,
        tourId: tour.id,
        OR: [
          ...(customerEmail ? [{ customerEmail }] : []),
          ...(customerPhone ? [{ customerPhone }] : []),
          ...(normalizedPhone ? [{ customerPhoneNormalized: normalizedPhone }] : []),
          ...(sessionId ? [{ idempotencyKey: sessionId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    let booking;
    let isNew = false;
    const existingChatToken = request.cookies.get('talago_live_chat')?.value;
    const chatToken = existingChatToken || crypto.randomUUID();
    const parsedTravelDate = travelDate && !isNaN(new Date(travelDate).getTime()) ? new Date(travelDate) : new Date();

    if (existingInquiry) {
      const nextPhone = customerPhone || existingInquiry.customerPhone;
      booking = await prisma.booking.update({
        where: { id: existingInquiry.id },
        data: {
          customerName: customerName || existingInquiry.customerName,
          customerPhone: nextPhone,
          customerPhoneNormalized: phoneMatchKey(nextPhone) || existingInquiry.customerPhoneNormalized,
          customerEmail: customerEmail || existingInquiry.customerEmail,
          notes: `${existingInquiry.notes || ''}\n[Follow-up question]: ${message}`.trim(),
          travelDate: travelDate ? parsedTravelDate : existingInquiry.travelDate,
        },
      });
    } else {
      const refSuffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
      booking = await prisma.booking.create({
        data: {
          bookingReference: `INQ-${refSuffix}`,
          accessToken: generateAccessToken(),
          idempotencyKey: sessionId || null,
          tourId: tour.id,
          tourSlugSnapshot: tour.slug,
          tourTitleSnapshot: tourTitle,
          customerName: customerName || 'Traveler',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          customerPhoneNormalized: normalizedPhone,
          travelDate: parsedTravelDate,
          adultsCount: adults,
          childrenCount: 0,
          infantsCount: 0,
          guestCount: adults,
          totalPriceUSD: 0,
          status: BookingStatus.INTERESTED,
          source: 'INQUIRY',
          notes: message,
        },
      });
      isNew = true;
    }

    const inquiryReference = booking.bookingReference;

    // 1:1 BookingConversation for this inquiry
    let conversationId: string | null = null;
    try {
      const conversation = await prisma.bookingConversation.upsert({
        where: { bookingId: booking.id },
        create: {
          bookingId: booking.id,
          visitorName: customerName || undefined,
          visitorEmail: customerEmail || undefined,
          visitorPhone: customerPhone || undefined,
          tourTitle,
          lastPagePath: `/tours/${tour.slug}`,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
        update: {
          visitorName: customerName || undefined,
          visitorEmail: customerEmail || undefined,
          visitorPhone: customerPhone || undefined,
          tourTitle,
          lastPagePath: `/tours/${tour.slug}`,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });
      conversationId = conversation.id;

      if (isNew) {
        const systemContextMessage = `[INQUIRY SUBMITTED] Reference: #${inquiryReference} | Tour: ${tourTitle} | Guest: ${customerName || 'Traveler'}${customerPhone ? ` | Phone: ${customerPhone}` : ''}${customerEmail ? ` | Email: ${customerEmail}` : ''}${travelDate ? ` | Preferred Date: ${travelDate}` : ''} | Guests: ${adults} adults`;
        await prisma.bookingMessage.create({
          data: {
            conversationId: conversation.id,
            sender: 'SYSTEM',
            body: systemContextMessage,
          },
        });
      }

      await prisma.bookingMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'VISITOR',
          body: message,
        },
      });
    } catch (chatError) {
      console.error('[tour-inquiry] conversation mirror failed:', chatError);
    }

    // Trigger Admin Notification pointing directly to canonical Booking + conversation
    if (isNew) {
      const contactInfo = [
        customerPhone ? `📞 ${customerPhone}` : null,
        customerEmail ? `✉️ ${customerEmail}` : null,
      ].filter(Boolean).join(' | ');

      const alertText =
        `❓ *New Tour Inquiry!*\n\n` +
        `🔖 *Reference:* ${inquiryReference}\n` +
        `🏝️ *Tour:* ${tourTitle}\n` +
        `👤 *Guest:* ${customerName || 'Traveler'}\n` +
        (contactInfo ? `📱 *Contact:* ${contactInfo}\n` : '') +
        (travelDate ? `📅 *Date:* ${travelDate}\n` : '') +
        `💬 *Question:* "${message}"`;

      await prisma.notificationLog.create({
        data: {
          bookingId: booking.id,
          channel: 'CUSTOMER_MESSAGE_ALERT',
          recipient: 'Admin Dashboard',
          status: 'UNREAD',
          messageId: `inq-${booking.id}`,
          errorMessage: JSON.stringify({
            bookingId: booking.id,
            bookingReference: inquiryReference,
            conversationId,
            customerName: customerName || 'Traveler',
            tourTitle,
            preview: message.slice(0, 140),
          }),
        },
      }).catch(() => {});

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
      inquiryReference,
      bookingId: booking.id,
      leadId: booking.id,
      conversationId,
      message: 'Your question has been received. Our team will answer you shortly.',
    }, {
      headers: existingChatToken ? undefined : {
        'Set-Cookie': `talago_live_chat=${chatToken}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
      },
    });
  } catch (err) {
    console.error('Failed to submit tour inquiry:', err);
    return NextResponse.json({ error: 'Failed to submit tour inquiry.' }, { status: 500 });
  }
}
