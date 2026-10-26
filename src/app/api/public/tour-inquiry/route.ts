import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizePhone, sanitizeEmail, sanitizeText } from '@/utils/sanitize';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    // Deduplication check: recent active inquiry within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingInquiry = await prisma.bookingLead.findFirst({
      where: {
        createdAt: { gte: fiveMinutesAgo },
        source: 'INQUIRY',
        tourId: tour.id,
        OR: [
          ...(customerEmail ? [{ customerEmail }] : []),
          ...(customerPhone ? [{ customerPhone }] : []),
          ...(sessionId ? [{ sessionId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    let lead;
    let isNew = false;
    const existingChatToken = request.cookies.get('talago_live_chat')?.value;
    const chatToken = existingChatToken || crypto.randomUUID();

    if (existingInquiry) {
      lead = await prisma.bookingLead.update({
        where: { id: existingInquiry.id },
        data: {
          customerName: customerName || existingInquiry.customerName,
          customerPhone: customerPhone || existingInquiry.customerPhone,
          customerEmail: customerEmail || existingInquiry.customerEmail,
          notes: `${existingInquiry.notes}\n[Follow-up question]: ${message}`,
          travelDate: travelDate || existingInquiry.travelDate,
          updatedAt: new Date(),
        },
      });
    } else {
      lead = await prisma.bookingLead.create({
        data: {
          tourId: tour.id,
          tourSlug: tour.slug,
          tourTitle,
          customerName: customerName || 'Traveler',
          customerEmail,
          customerPhone,
          travelDate,
          adults,
          children: 0,
          status: 'INTERESTED',
          source: 'INQUIRY',
          sessionId,
          notes: message,
        },
      });
      isNew = true;
    }

    const inquiryReference = `INQ-${lead.id.slice(-8).toUpperCase()}`;

    // Mirror to live chat conversation so the marketplace team/supplier can reply directly
    const inquiryChatMessage = `[${inquiryReference}] Question regarding "${tourTitle}":\n"${message}"${travelDate ? ` (Preferred Date: ${travelDate})` : ''}`;

    try {
      const conversation = await prisma.liveChatConversation.upsert({
        where: { visitorToken: chatToken },
        create: {
          visitorToken: chatToken,
          visitorName: customerName || undefined,
          visitorEmail: customerEmail || undefined,
          visitorPhone: customerPhone || undefined,
          lastPagePath: `/tours/${tour.slug}`,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
        update: {
          visitorName: customerName || undefined,
          visitorEmail: customerEmail || undefined,
          visitorPhone: customerPhone || undefined,
          lastPagePath: `/tours/${tour.slug}`,
          status: 'OPEN',
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });

      await prisma.liveChatMessage.create({
        data: {
          conversationId: conversation.id,
          sender: 'VISITOR',
          body: inquiryChatMessage,
        },
      });
    } catch (chatError) {
      console.error('[tour-inquiry] Live chat mirror failed:', chatError);
    }

    // Trigger Admin Notification
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
          bookingId: lead.id,
          channel: 'TOUR_INQUIRY_ALERT',
          recipient: 'Admin & Supplier Dashboard',
          status: 'LOGGED',
          messageId: lead.id,
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
      leadId: lead.id,
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
