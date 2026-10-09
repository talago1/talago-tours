import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingNotificationPayload {
  bookingId: string;
  bookingReference: string;
  accessToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  tourTitle: string;
  travelDate: string;
  hotelName: string;
  guestCount: number;
  totalPriceUSD: number;
  pickupTime?: string | null;
  language: string;
  currency?: string;
  status: string;
  whatsappOptIn: boolean;
  pdfUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://talago.com';
}

function sanitizePhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
}

// ---------------------------------------------------------------------------
// Message builder
// ---------------------------------------------------------------------------

function buildCustomerWhatsAppMessage(data: BookingNotificationPayload): string {
  const baseUrl = getBaseUrl();
  const isSyntheticEmail = data.customerEmail.endsWith('@noreply.talago.com');
  const manageLink = isSyntheticEmail
    ? `${baseUrl}/booking/${data.accessToken}`
    : `${baseUrl}/auth?email=${encodeURIComponent(data.customerEmail)}`;
  const curr = (data.currency || 'USD').toUpperCase();
  const currSymbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'EGP' ? 'EGP ' : '$';
  const pickupLine = data.pickupTime ? `\n🚐 *Pickup Time:* ${data.pickupTime}` : '';
  const boardingPassLine = data.pdfUrl
    ? `🎫 *Your Boarding Pass (PDF):*\n${data.pdfUrl}\n`
    : `🎫 *Your Boarding Pass:*\n${baseUrl}/booking/${data.accessToken}\n`;

  return `🌊 *TALAGO Tours — Booking Confirmation*

Hello ${data.customerName}! 🎉

Your booking *#${data.bookingReference}* is now *${data.status}*.

🗺️ *Experience:* ${data.tourTitle}
📅 *Date:* ${data.travelDate}
👥 *Guests:* ${data.guestCount}
🏨 *Hotel / Meeting Point:* ${data.hotelName}${pickupLine}
💰 *Total:* ${currSymbol}${data.totalPriceUSD.toFixed(2)}

${boardingPassLine}
🔗 *View & Manage Reservation:*
${manageLink}

Need anything or have a question? Reply to this message or WhatsApp us at +20 102 224 3460.
See you on your adventure! 🌅
— Talago Tours Team`;
}

function buildAdminTelegramMessage(data: BookingNotificationPayload): string {
  const baseUrl = getBaseUrl();
  const curr = (data.currency || 'USD').toUpperCase();
  const currSymbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'EGP' ? 'EGP ' : '$';
  const pickupLine = data.pickupTime ? `\n🚐 *Pickup:* ${data.pickupTime}` : '';
  return `📋 *NEW BOOKING ALERT*

*Ref:* #${data.bookingReference}
*Customer:* ${data.customerName}
*Phone:* ${data.customerPhone}
*Email:* ${data.customerEmail}
*Tour:* ${data.tourTitle}
*Date:* ${data.travelDate}
*Guests:* ${data.guestCount}
*Hotel:* ${data.hotelName}${pickupLine}
*Total:* ${currSymbol}${data.totalPriceUSD.toFixed(2)} (${curr})
*Status:* ${data.status}
*WhatsApp Opt-In:* ${data.whatsappOptIn ? '✅ Yes' : '❌ No'}

🔗 [Open Admin Dashboard](${baseUrl}/admin/bookings)`;
}

// ---------------------------------------------------------------------------
// Channel 1: WhatsApp via Green-API
// ---------------------------------------------------------------------------

async function sendWhatsApp(
  data: BookingNotificationPayload,
  message: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const instanceId = process.env.GREEN_API_ID;
  const token = process.env.GREEN_API_TOKEN;
  if (!instanceId || !token) {
    return { success: false, error: 'GREEN-API credentials not configured' };
  }

  const chatId = `${sanitizePhoneForWhatsApp(data.customerPhone)}@c.us`;
  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `GREEN-API HTTP ${res.status}: ${errText}` };
    }
    const result = (await res.json()) as { idMessage: string };
    return { success: true, messageId: result.idMessage };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Green-API error' };
  }
}

// ---------------------------------------------------------------------------
// Channel 2: Telegram via Bot API
// ---------------------------------------------------------------------------

async function sendTelegram(
  data: BookingNotificationPayload,
  adminMessage: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!botToken || !chatId) {
    return { success: false, error: 'Telegram credentials not configured' };
  }

  const telegramApiBase = `https://api.telegram.org/bot${botToken}`;

  try {
    const msgRes = await fetch(`${telegramApiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: adminMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!msgRes.ok) {
      const errText = await msgRes.text();
      return { success: false, error: `Telegram HTTP ${msgRes.status}: ${errText}` };
    }

    const msgResult = (await msgRes.json()) as { ok: boolean; result?: { message_id: number } };

    // Also send Boarding Pass PDF document to Admin if available
    if (data.pdfUrl) {
      await fetch(`${telegramApiBase}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          document: data.pdfUrl,
          caption: `🎫 Boarding Pass #${data.bookingReference} — ${data.customerName}`,
        }),
      }).catch(() => { /* non-fatal */ });
    }

    return {
      success: msgResult.ok,
      messageId: msgResult.result?.message_id ? String(msgResult.result.message_id) : undefined,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Telegram error' };
  }
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

async function logNotification(
  bookingId: string,
  channel: string,
  recipient: string,
  result: { success: boolean; messageId?: string; error?: string },
): Promise<void> {
  try {
    await prisma.notificationLog.create({
      data: {
        bookingId,
        channel,
        recipient,
        status: result.success ? 'SENT' : 'FAILED',
        errorMessage: result.error ?? null,
        messageId: result.messageId ?? null,
        sentAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`[notificationDispatcher] Failed to log ${channel} notification:`, err);
  }
}

// ---------------------------------------------------------------------------
// Public API — Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Sends WhatsApp + Telegram notifications after a booking is confirmed.
 * Called fire-and-forget — never throws, never blocks the HTTP response.
 */
export async function dispatchBookingNotifications(
  bookingId: string,
  pdfUrl?: string,
): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: { select: { translations: true } } },
    });

    if (!booking) {
      console.error(`[notificationDispatcher] Booking ${bookingId} not found`);
      return;
    }

    const translations = booking.tour.translations as Record<string, { title?: string }> | null;
    const tourTitle =
      translations?.[booking.language]?.title ??
      translations?.en?.title ??
      'Talago Experience';

    const travelDateFormatted = booking.travelDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const payload: BookingNotificationPayload = {
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      accessToken: booking.accessToken,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      tourTitle,
      travelDate: travelDateFormatted,
      hotelName: booking.hotelName ?? booking.pickupLocationName ?? '',
      guestCount: booking.guestCount,
      totalPriceUSD: booking.totalPriceUSD,
      currency: booking.currency || 'USD',
      pickupTime: booking.selectedPickupTime,
      language: booking.language,
      status: booking.status,
      whatsappOptIn: booking.whatsappOptIn ?? true,
      pdfUrl: pdfUrl ?? booking.pdfBoardingPassUrl ?? undefined,
    };

    // 1. WhatsApp to customer (if opted in)
    if (payload.whatsappOptIn) {
      const waMessage = buildCustomerWhatsAppMessage(payload);
      const waResult = await sendWhatsApp(payload, waMessage);
      await logNotification(bookingId, 'WHATSAPP', booking.customerPhone, waResult);
      if (!waResult.success) {
        console.warn(`[notificationDispatcher] WhatsApp failed for ${booking.customerPhone}:`, waResult.error);
      }
    }

    // 2. Telegram alert to Admin
    const adminMessage = buildAdminTelegramMessage(payload);
    const tgResult = await sendTelegram(payload, adminMessage);
    await logNotification(
      bookingId,
      'TELEGRAM',
      process.env.TELEGRAM_ADMIN_CHAT_ID ?? 'admin',
      tgResult,
    );
    if (!tgResult.success) {
      console.warn(`[notificationDispatcher] Telegram failed for admin:`, tgResult.error);
    }
  } catch (err) {
    console.error('[notificationDispatcher] Dispatch error:', err);
  }
}

// ---------------------------------------------------------------------------
// Abandoned checkout follow-up dispatcher
// ---------------------------------------------------------------------------

/**
 * Sends a WhatsApp reminder + Telegram alert for an uncompleted checkout.
 * Called by the /api/notifications/abandoned-recovery cron endpoint.
 */
export async function dispatchAbandonedCheckoutReminder(
  abandonedCheckoutId: string,
): Promise<void> {
  try {
    const entry = await prisma.abandonedCheckout.findUnique({
      where: { id: abandonedCheckoutId },
    });

    if (!entry || entry.isRecovered || entry.reminderSent) return;

    const baseUrl = getBaseUrl();
    const tour = await prisma.tour.findUnique({
      where: { id: entry.tourId },
      select: { slug: true },
    });
    const tourSlug = tour?.slug || entry.tourId;
    const tourUrl = `${baseUrl}/tours/${tourSlug}`;
    const message = `Hey ${entry.name}! 👋

We noticed you started booking a Talago experience but didn't get to finish.

Your spot may still be available — finish your booking now:
${tourUrl}

Need help or have questions? WhatsApp us directly at +20 102 224 3460.
— Talago Tours Team 🌊`;

    // WhatsApp reminder
    const instanceId = process.env.GREEN_API_ID;
    const token = process.env.GREEN_API_TOKEN;
    if (instanceId && token) {
      const chatId = `${sanitizePhoneForWhatsApp(entry.phone)}@c.us`;
      const waUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
      await fetch(waUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
      }).catch((err) => {
        console.error('[notificationDispatcher] WhatsApp reminder error:', err);
      });
    }

    // Telegram admin alert
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (botToken && adminChatId) {
      const tgText = `⚠️ *ABANDONED CHECKOUT REMINDER*

*Name:* ${entry.name}
*Phone:* ${entry.phone}
*Email:* ${entry.email ?? 'N/A'}
*Tour ID:* ${entry.tourId}
*Guests:* ${entry.guestCount}
*Travel Date:* ${entry.travelDate ?? 'N/A'}
*Step:* ${entry.step}`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: tgText,
          parse_mode: 'Markdown',
        }),
      }).catch((err) => {
        console.error('[notificationDispatcher] Telegram reminder alert error:', err);
      });
    }

    // Mark reminder as sent
    await prisma.abandonedCheckout.update({
      where: { id: abandonedCheckoutId },
      data: { reminderSent: true, reminderSentAt: new Date() },
    });
  } catch (err) {
    console.error('[notificationDispatcher] Abandoned checkout reminder failed:', err);
  }
}
